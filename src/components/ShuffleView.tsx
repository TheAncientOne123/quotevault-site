"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { QuoteCard } from "@/types/quote";

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

const DURATION_SEC = 12;

export function ShuffleView() {
  const [items, setItems] = useState<QuoteCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/quotes/shuffle?limit=50")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items: QuoteCard[] }) => {
        if (!cancelled) {
          setItems(data.items ?? []);
          setIndex(0);
        }
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setElapsed(0);
  }, [index]);

  useEffect(() => {
    if (loading || items.length === 0) return;
    const interval = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= DURATION_SEC) {
          setDirection(1);
          setIndex((i) => (i + 1 >= items.length ? 0 : i + 1));
          return 0;
        }
        return prev + 0.1;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [loading, items.length]);

  const go = (delta: number) => {
    if (items.length === 0) return;
    setDirection(delta);
    setIndex((i) => {
      const next = i + delta;
      if (next < 0) return items.length - 1;
      if (next >= items.length) return 0;
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-[var(--muted)]"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[var(--muted)]">
        No quotes to show.
      </div>
    );
  }

  const quote = items[index];
  const slideVariants = {
    enter: (d: number) => ({
      x: d > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (d: number) => ({
      x: d > 0 ? -80 : 80,
      opacity: 0,
    }),
  };

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-3xl items-stretch gap-2 sm:gap-4">
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous quote"
            className="rounded-full p-3 text-[var(--muted)] transition hover:bg-[var(--border)] hover:text-[var(--foreground)]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="text-center"
          >
            <motion.span
              className="mb-4 block text-sm text-[var(--muted)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {formatDate(quote.createdAt)}
            </motion.span>
            {quote.hashtags.length > 0 && (
              <motion.div
                className="mb-4 flex flex-wrap justify-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {quote.hashtags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-[var(--border)] px-2.5 py-0.5 text-xs text-[var(--muted)]"
                  >
                    #{t}
                  </span>
                ))}
              </motion.div>
            )}
            <motion.h2
              className="font-serif text-2xl font-semibold text-[var(--foreground)] sm:text-3xl"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {quote.title}
            </motion.h2>
            <motion.div
              className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-[var(--foreground)]/90"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              {quote.content}
            </motion.div>
            <motion.p
              className="mt-6 text-sm italic text-[var(--muted)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              — {getAuthorDisplay(quote.author, quote.language)}
            </motion.p>
          </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next quote"
            className="rounded-full p-3 text-[var(--muted)] transition hover:bg-[var(--border)] hover:text-[var(--foreground)]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-6 w-full max-w-3xl">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]"
          role="progressbar"
          aria-valuenow={Math.round((elapsed / DURATION_SEC) * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-[var(--foreground)]/70 transition-[width] duration-100 ease-linear"
            style={{ width: `${Math.min((elapsed / DURATION_SEC) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
