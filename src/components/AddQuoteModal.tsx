"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { AddQuoteForm } from "@/components/AddQuoteForm";

interface AddQuoteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    content: string;
    author: string;
    language: string;
    hashtags: string[];
  }) => Promise<void>;
  onSuccess: () => void;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

export function AddQuoteModal({
  open,
  onClose,
  onSubmit,
  onSuccess,
}: AddQuoteModalProps) {
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

  const handleSubmitSuccess = () => {
    toast.success("Quote added");
    onSuccess();
    onClose();
  };

  const content = open ? (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-150"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className="modal-panel fixed inset-4 z-50 flex flex-col overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-2xl sm:inset-12 sm:mx-auto sm:max-w-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-quote-title"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
          <h2
            id="add-quote-title"
            className="font-serif text-lg font-semibold text-[var(--foreground)]"
          >
            Add new quote
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
          <AddQuoteForm
            onSubmit={onSubmit}
            onSuccess={handleSubmitSuccess}
            compact
          />
        </div>
      </div>
    </>
  ) : null;

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
