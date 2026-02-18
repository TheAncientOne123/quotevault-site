import { NextRequest, NextResponse } from "next/server";
import { createSessionCookie } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password = typeof body?.password === "string" ? body.password : "";
    const expected = process.env.ADMIN_PASSWORD ?? "";
    if (!expected) {
      return NextResponse.json(
        { error: "Admin login is not configured" },
        { status: 503 }
      );
    }
    if (password !== expected) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }
    const { name, value, options } = createSessionCookie();
    const res = NextResponse.json({ ok: true });
    res.headers.set("Set-Cookie", `${name}=${encodeURIComponent(value)}; ${options}`);
    return res;
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
