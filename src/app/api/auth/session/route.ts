import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie");
  const session = getSession(cookieHeader);
  return NextResponse.json({ isAdmin: !!session?.isAdmin });
}
