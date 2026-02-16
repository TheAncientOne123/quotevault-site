import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const LIMIT = 10;

// GET /api/quotes/suggest?q=... - Suggest quote titles for autocomplete
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    if (!q || q.length < 1) {
      return NextResponse.json({ items: [] });
    }

    const term = `%${q.replace(/%/g, "\\%")}%`;
    const quotes = await prisma.quote.findMany({
      where: { title: { contains: term, mode: "insensitive" } },
      select: { id: true, title: true },
      take: LIMIT,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      items: quotes.map((r) => ({ id: r.id, title: r.title })),
    });
  } catch (err) {
    console.error("GET /api/quotes/suggest error:", err);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}
