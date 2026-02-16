"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { QuoteCard as QuoteCardType } from "@/types/quote";

interface QuoteDetailModalProps {
  quote: QuoteCardType | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onEdit?: (quote: QuoteCardType) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getAuthorDisplay(author: string | null, language: string | null): string {
  if (author?.trim()) return author.trim();
  return language === "es" ? "Anónimo" : "Anonymous";
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

export function QuoteDetailModal({
  quote,
  onClose,
  onDelete,
  onEdit,
}: QuoteDetailModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const prevActiveRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        const focusable = getFocusableElements(panelRef.current);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    if (quote) {
      prevActiveRef.current = document.activeElement as HTMLElement | null;
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      prevActiveRef.current?.focus?.();
    };
  }, [quote, onClose]);

  useEffect(() => {
    if (quote && panelRef.current) {
      const focusable = getFocusableElements(panelRef.current);
      focusable[0]?.focus?.();
    }
  }, [quote]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleCopy = async () => {
    if (!quote) return;
    const authorDisplay = getAuthorDisplay(quote.author, quote.language);
    const text = `${quote.title}\n\n"${quote.content}" — ${authorDisplay}`;
    await navigator.clipboard.writeText(text);
  };

  const handleDelete = () => {
    if (quote && onDelete) {
      onDelete(quote.id);
      onClose();
    }
  };

  const content = quote ? (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-150"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className="fixed inset-4 z-50 flex flex-col overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-2xl sm:inset-8 sm:mx-auto sm:max-w-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quote-detail-title"
      >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] p-6">
              <h2
                id="quote-detail-title"
                className="font-serif text-2xl font-semibold text-[var(--foreground)]"
              >
                {quote.title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-2 text-[var(--muted)] hover:bg-[var(--border)] hover:text-[var(--foreground)]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <span className="mb-4 block text-sm text-[var(--muted)]">
                {formatDate(quote.createdAt)}
              </span>
              <div
                className="whitespace-pre-wrap text-base leading-relaxed text-[var(--foreground)]"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {quote.content}
              </div>
              {quote.hashtags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {quote.hashtags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-[var(--border)] px-2.5 py-1 text-xs text-[var(--muted)]"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-4 text-sm italic text-[var(--muted)]">
                — {getAuthorDisplay(quote.author, quote.language)}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 border-t border-[var(--border)] p-4">
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--border)]"
              >
                Copy
              </button>
              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onEdit(quote);
                    onClose();
                  }}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--border)]"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-lg border border-red-500/50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-500/10 dark:text-red-400"
                >
                  Delete
                </button>
              )}
            </div>
      </div>
    </>
  ) : null;

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
