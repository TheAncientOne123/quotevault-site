import { z } from "zod";

export const createQuoteSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  content: z.string().min(1, "Content is required").max(10000),
  author: z.string().max(200).optional().nullable(),
  language: z.enum(["en", "es"]).optional().nullable(),
  hashtags: z
    .union([
      z.string(),
      z.array(z.string()),
    ])
    .optional()
    .default([]),
});

export const quoteQuerySchema = z.object({
  q: z.string().optional(),
  author: z.string().optional(),
  tags: z.string().optional(),
  language: z.string().optional(),
  sort: z.enum(["newest", "oldest"]).optional().default("newest"),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type QuoteQueryInput = z.infer<typeof quoteQuerySchema>;
