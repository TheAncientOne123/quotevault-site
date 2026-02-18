import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = searchParams.get("limit");
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(raw ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
    );

    const quotes = await prisma.quote.findMany({
      take: limit * 2,
      include: { tags: true },
      orderBy: { createdAt: "desc" },
    });

    const shuffled = [...quotes]
      .sort(() => Math.random() - 0.5)
      .slice(0, limit)
      .map((q) => ({
        id: q.id,
        createdAt: q.createdAt.toISOString(),
        title: q.title,
        content: q.content,
        author: q.author,
        language: q.language,
        hashtags: q.tags.map((t) => t.name),
      }));

    return NextResponse.json({ items: shuffled });
  } catch (err) {
    console.error("GET /api/quotes/shuffle error:", err);
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}
