"use client";

import { useEffect, useRef } from "react";
import { QuoteCard } from "@/components/QuoteCard";
import type { QuoteCard as QuoteCardType } from "@/types/quote";

interface ResultsPanelProps {
  items: QuoteCardType[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onSelectQuote: (id: string) => void;
  error: Error | null;
}

export function ResultsPanel({
  items,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  onSelectQuote,
  error,
}: ResultsPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || isLoading || isLoadingMore) return;
    const container = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!container || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { root: container, rootMargin: "200px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, onLoadMore]);

  return (
    <div className="w-full max-w-[1600px] mx-auto">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-[var(--muted)]">
          {isLoading
            ? "Loading…"
            : items.length === 0
              ? "No results"
              : `${items.length} result${items.length === 1 ? "" : "s"}`}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="overflow-y-auto py-2"
        style={{ maxHeight: "65vh", minHeight: "200px" }}
      >
        {error && (
          <p
            className="mb-4 text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {error.message}
          </p>
        )}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-xl bg-[var(--border)]"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-[var(--muted)]">No quotes found</p>
            <p className="mt-1 text-xs text-[var(--muted)]/80">
              Try different search terms or add a new quote
            </p>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {items.map((quote) => (
              <QuoteCard
                key={quote.id}
                quote={quote}
                onClick={() => onSelectQuote(quote.id)}
              />
            ))}
          </div>
        )}

        {hasMore && !isLoading && (
          <div ref={sentinelRef} className="flex justify-center py-6">
            {isLoadingMore && (
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-2 w-2 animate-pulse rounded-full bg-[var(--border)]"
                    style={{ animationDelay: `${i * 120}ms` }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
