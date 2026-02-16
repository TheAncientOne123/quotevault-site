import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/tags - Tag suggestions for search/filter
// Query: prefix (optional) - filter tags starting with this
// Query: language (optional) - "en" | "es" - only tags from quotes with this language
// Query: limit (optional) - max tags to return, default 20
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const prefix = (searchParams.get("prefix") ?? "").trim().toLowerCase().replace(/^#/, "");
    const language = searchParams.get("language") ?? "";
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));

    const where = {
      ...(language === "en" || language === "es"
        ? { quotes: { some: { language } } }
        : {}),
      ...(prefix ? { name: { startsWith: prefix } } : {}),
    };

    const tags = await prisma.tag.findMany({
      where,
      orderBy: { name: "asc" },
      take: limit,
      select: { name: true },
    });

    return NextResponse.json(tags.map((t) => t.name));
  } catch (err) {
    console.error("GET /api/tags error:", err);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}
