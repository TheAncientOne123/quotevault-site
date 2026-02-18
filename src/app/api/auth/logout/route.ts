import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";

export async function POST() {
  const { name, options } = clearSessionCookie();
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", `${name}=; ${options}`);
  return res;
}
