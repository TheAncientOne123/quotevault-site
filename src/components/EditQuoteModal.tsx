"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { AddQuoteForm, type QuoteFormData } from "@/components/AddQuoteForm";
import type { QuoteCard as QuoteCardType } from "@/types/quote";

interface EditQuoteModalProps {
  open: boolean;
  quote: QuoteCardType | null;
  onClose: () => void;
  onSuccess: () => void;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

export function EditQuoteModal({
  open,
  quote,
  onClose,
  onSuccess,
}: EditQuoteModalProps) {
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
    if (open) {
      prevActiveRef.current = document.activeElement as HTMLElement | null;
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (!open) prevActiveRef.current?.focus?.();
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open && panelRef.current) {
      const focusable = getFocusableElements(panelRef.current);
      focusable[0]?.focus?.();
    }
  }, [open]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = async (data: QuoteFormData) => {
    if (!quote) return;
    const res = await fetch(`/api/quotes/${quote.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.title,
        content: data.content,
        author: data.author || undefined,
        language: data.language || undefined,
        hashtags: data.hashtags,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to update quote");
    }
    toast.success("Quote updated");
    onSuccess();
    onClose();
  };

  const initialData: QuoteFormData | null =
    quote
      ? {
          title: quote.title,
          content: quote.content,
          author: quote.author ?? "",
          language: quote.language === "en" || quote.language === "es" ? quote.language : "",
          hashtags: quote.hashtags ?? [],
        }
      : null;

  const content = open && quote ? (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-150"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className="modal-panel fixed inset-4 z-50 flex flex-col overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-2xl sm:inset-12 sm:mx-auto sm:max-w-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-quote-title"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
          <h2
            id="edit-quote-title"
            className="font-serif text-lg font-semibold text-[var(--foreground)]"
          >
            Edit quote
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
          {quote && (
            <AddQuoteForm
              key={quote.id}
              initialData={initialData}
              onSubmit={handleSubmit}
              compact
            />
          )}
        </div>
      </div>
    </>
  ) : null;

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
