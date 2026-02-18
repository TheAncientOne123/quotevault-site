import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  sanitizeTitle,
  sanitizeContent,
  sanitizeAuthor,
  parseHashtags,
} from "@/lib/sanitize";
import { getSession } from "@/lib/auth/session";
import { z } from "zod";

const updateQuoteSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1).max(10000).optional(),
  author: z.string().max(200).optional().nullable(),
  language: z.enum(["en", "es"]).optional().nullable(),
  hashtags: z.union([z.string(), z.array(z.string())]).optional(),
});

// PATCH /api/quotes/:id (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSession(request.headers.get("cookie"));
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.quote.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const updates: {
      title?: string;
      content?: string;
      author?: string | null;
      language?: string | null;
      tags?: { set: { name: string }[] };
    } = {};

    if (parsed.data.title !== undefined) {
      updates.title = sanitizeTitle(parsed.data.title);
    }
    if (parsed.data.content !== undefined) {
      updates.content = sanitizeContent(parsed.data.content);
    }
    if (parsed.data.author !== undefined) {
      updates.author = parsed.data.author
        ? sanitizeAuthor(parsed.data.author)
        : null;
    }
    if (parsed.data.language !== undefined) {
      updates.language =
        parsed.data.language === "en" || parsed.data.language === "es"
          ? parsed.data.language
          : null;
    }
    if (parsed.data.hashtags !== undefined) {
      const tagNames = parseHashtags(parsed.data.hashtags);
      for (const name of tagNames) {
        await prisma.tag.upsert({
          where: { name },
          create: { name },
          update: {},
        });
      }
      updates.tags = { set: tagNames.map((name) => ({ name })) };
    }

    const quote = await prisma.quote.update({
      where: { id },
      data: updates,
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
    console.error("PATCH /api/quotes/:id error:", err);
    return NextResponse.json(
      { error: "Failed to update quote" },
      { status: 500 }
    );
  }
}

// DELETE /api/quotes/:id (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSession(request.headers.get("cookie"));
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const existing = await prisma.quote.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }
    await prisma.quote.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/quotes/:id error:", err);
    return NextResponse.json(
      { error: "Failed to delete quote" },
      { status: 500 }
    );
  }
}
