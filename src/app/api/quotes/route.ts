import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { createQuoteSchema, quoteQuerySchema } from "@/lib/validators";
import {
  sanitizeTitle,
  sanitizeContent,
  sanitizeAuthor,
  parseHashtags,
} from "@/lib/sanitize";

// POST /api/quotes - Create a new quote
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, content, author, language, hashtags } = parsed.data;
    const tagNames = parseHashtags(hashtags ?? []);

    const sanitized = {
      title: sanitizeTitle(title),
      content: sanitizeContent(content),
      author: author ? sanitizeAuthor(author) : null,
      language: language === "en" || language === "es" ? language : null,
    };

    if (!sanitized.title || !sanitized.content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const quote = await prisma.quote.create({
      data: {
        title: sanitized.title,
        content: sanitized.content,
        author: sanitized.author,
        language: sanitized.language,
        tags: {
          connectOrCreate: tagNames.map((name) => ({
            where: { name },
            create: { name },
          })),
        },
      },
      include: { tags: true },
    });

    return NextResponse.json({
      id: quote.id,
      createdAt: quote.createdAt.toISOString(),
      title: quote.title,
      content: quote.content,
      author: quote.author,
      language: quote.language,
      hashtags: quote.tags.map((t) => t.name),
    });
  } catch (err) {
    console.error("POST /api/quotes error:", err);
    return NextResponse.json(
      { error: "Failed to create quote" },
      { status: 500 }
    );
  }
}

// GET /api/quotes - List/search quotes with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = quoteQuerySchema.safeParse({
      q: searchParams.get("q") ?? undefined,
      author: searchParams.get("author") ?? undefined,
      tags: searchParams.get("tags") ?? undefined,
      language: searchParams.get("language") ?? undefined,
      sort: searchParams.get("sort") ?? "newest",
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? 20,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { q, author, tags, language, sort, cursor, limit } = parsed.data;
    const tagList = tags
      ? tags.split(",").map((t) => t.trim().toLowerCase().replace(/^#/, ""))
      : [];

    const where: Prisma.QuoteWhereInput = {};

    // Free-text search (ilike on title, content, author)
    if (q && q.trim()) {
      const term = `%${q.trim().replace(/%/g, "\\%")}%`;
      where.OR = [
        { title: { contains: term, mode: "insensitive" } },
        { content: { contains: term, mode: "insensitive" } },
        { author: { contains: term, mode: "insensitive" } },
      ];
    }

    // Author filter
    if (author && author.trim()) {
      where.author = { contains: author.trim(), mode: "insensitive" };
    }

    // Tag filter (AND: quote must have ALL selected tags)
    if (tagList.length > 0) {
      const tagConditions: Prisma.QuoteWhereInput[] = tagList.map((name) => ({
        tags: { some: { name } },
      }));
      const existingAnd = Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : [];
      where.AND = [...existingAnd, ...tagConditions];
    }

    // Language filter
    if (language && (language === "en" || language === "es")) {
      where.language = language;
    }

    const orderBy: Prisma.QuoteOrderByWithRelationInput = {
      createdAt: sort === "oldest" ? "asc" : "desc",
    };

    const quotes = await prisma.quote.findMany({
      where,
      orderBy,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      include: { tags: true },
    });

    const hasMore = quotes.length > limit;
    const items = (hasMore ? quotes.slice(0, -1) : quotes).map((q) => ({
      id: q.id,
      createdAt: q.createdAt.toISOString(),
      title: q.title,
      content: q.content,
      author: q.author,
      language: q.language,
      hashtags: q.tags.map((t) => t.name),
    }));

    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return NextResponse.json({
      items,
      nextCursor: nextCursor ?? undefined,
    });
  } catch (err) {
    console.error("GET /api/quotes error:", err);
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}
