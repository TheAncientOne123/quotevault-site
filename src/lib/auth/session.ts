import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "quotevault-admin";
const MAX_AGE_DAYS = 7;

function getSecret(): string {
  const secret = process.env.ADMIN_PASSWORD ?? process.env.SESSION_SECRET;
  if (!secret?.length) return "";
  return secret;
}

function sign(payload: string): string {
  const secret = getSecret();
  if (!secret) return "";
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function verify(payload: string, signature: string): boolean {
  const expected = sign(payload);
  if (expected.length !== signature.length) return false;
  try {
    return timingSafeEqual(Buffer.from(signature, "base64url"), Buffer.from(expected, "base64url"));
  } catch {
    return false;
  }
}

export interface Session {
  isAdmin: true;
}

export function getSession(cookieHeader: string | null): Session | null {
  if (!cookieHeader) return null;
  const secret = getSecret();
  if (!secret) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const raw = cookies.find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!raw) return null;
  const value = decodeURIComponent(raw.slice(COOKIE_NAME.length + 1).replace(/^"/, "").replace(/"$/, ""));
  const dot = value.indexOf(".");
  if (dot === -1) return null;
  const payload = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if (!verify(payload, sig)) return null;

  let data: { t: number };
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof data?.t !== "number") return null;
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  if (Date.now() - data.t > maxAge) return null;
  return { isAdmin: true };
}

export function createSessionCookie(secure = process.env.NODE_ENV === "production"): { name: string; value: string; options: string } {
  const payload = Buffer.from(JSON.stringify({ t: Date.now() }), "utf8").toString("base64url");
  const signature = sign(payload);
  const value = `${payload}.${signature}`;
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60;
  const securePart = secure ? "; Secure" : "";
  return {
    name: COOKIE_NAME,
    value,
    options: `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${securePart}`,
  };
}

export function clearSessionCookie(): { name: string; options: string } {
  return {
    name: COOKIE_NAME,
    options: "Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
  };
}
