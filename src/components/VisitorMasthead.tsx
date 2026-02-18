"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export function VisitorMasthead() {
  return (
    <section className="relative w-full max-w-2xl mx-auto px-4 pt-6 pb-2 sm:px-6 sm:pt-8">
      <div className="fixed right-4 top-4 sm:right-6 sm:top-6 z-10 flex items-center gap-2">
        <ThemeToggle />
        <Link
          href="/login?next=/admin"
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--muted)] transition hover:border-[var(--foreground)]/30 hover:text-[var(--foreground)]"
        >
          Admin
        </Link>
      </div>
      <h1 className="text-center font-serif text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
        QuoteVault
      </h1>
      <p className="mt-3 text-center text-sm text-[var(--muted)]">
        Store, browse, and search your personal quotes
      </p>
    </section>
  );
}

