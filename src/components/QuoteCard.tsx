"use client";

import type { QuoteCard as QuoteCardType } from "@/types/quote";

interface QuoteCardProps {
  quote: QuoteCardType;
  onClick: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const SNIPPET_LENGTH = 180;

export function QuoteCard({ quote, onClick }: QuoteCardProps) {
  const snippet =
    quote.content.length > SNIPPET_LENGTH
      ? quote.content.slice(0, SNIPPET_LENGTH) + "…"
      : quote.content;

  return (
    <article
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`View quote: ${quote.title}`}
      className="group cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow)] transition-[border-color,box-shadow] duration-150 hover:border-[var(--muted)]/40 hover:shadow-[var(--shadow-hover)]"
    >
      <span className="mb-2 block text-xs text-[var(--muted)]">
        {formatDate(quote.createdAt)}
      </span>
      {quote.hashtags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {quote.hashtags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-[var(--border)] px-2 py-0.5 text-xs text-[var(--muted)]"
            >
              #{t}
            </span>
          ))}
        </div>
      )}
      <h3 className="font-serif text-lg font-medium text-[var(--foreground)] mb-2">
        {quote.title}
      </h3>
      <p className="text-sm text-[var(--muted)] leading-relaxed line-clamp-3 whitespace-pre-wrap">
        {snippet}
      </p>
      {quote.author && (
        <p className="mt-2 text-xs text-[var(--muted)] italic">— {quote.author}</p>
      )}
    </article>
  );
}
