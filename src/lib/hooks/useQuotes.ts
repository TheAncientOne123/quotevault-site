"use client";

import useSWRInfinite from "swr/infinite";
import type { QuotesResponse } from "@/types/quote";

const API = "/api/quotes";
const LIMIT = 20;

function buildUrl(
  q: string,
  author: string,
  tags: string[],
  language: string,
  sort: "newest" | "oldest",
  cursor?: string
): string {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  if (author.trim()) params.set("author", author.trim());
  if (tags.length) params.set("tags", tags.join(","));
  if (language === "en" || language === "es") params.set("language", language);
  params.set("sort", sort);
  params.set("limit", String(LIMIT));
  if (cursor) params.set("cursor", cursor);
  return `${API}?${params.toString()}`;
}

async function fetcher(url: string): Promise<QuotesResponse> {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch quotes");
  }
  return res.json();
}

export function useQuotes(
  q: string,
  author: string,
  tags: string[],
  language: string,
  sort: "newest" | "oldest"
) {
  const getKey = (pageIndex: number, previousData: QuotesResponse | null) => {
    if (previousData && !previousData.nextCursor) return null;
    const cursor = previousData?.nextCursor;
    return buildUrl(q, author, tags, language, sort, cursor);
  };

  const { data, size, setSize, isLoading, error, mutate } = useSWRInfinite(
    getKey,
    fetcher,
    {
      revalidateFirstPage: false,
      revalidateOnFocus: false,
    }
  );

  const items = data?.flatMap((d) => d.items) ?? [];
  const hasMore = Boolean(data && data[data.length - 1]?.nextCursor);
  const loadMore = () => setSize(size + 1);
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");

  return {
    items,
    hasMore,
    loadMore,
    isLoading,
    isLoadingMore,
    error,
    mutate,
  };
}
