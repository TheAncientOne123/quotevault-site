"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const MODES = [
  { label: "Buscador", mode: null as string | null },
  { label: "Shuffle", mode: "shuffle" },
] as const;

export function VisitorModeTabs({ className = "" }: { className?: string }) {
  const searchParams = useSearchParams();
  const currentMode = searchParams.get("mode");

  return (
    <nav
      className={`flex gap-1 ${className}`}
      role="tablist"
      aria-label="Visitor modes"
    >
      {MODES.map((m) => {
        const isActive =
          m.mode === null
            ? currentMode !== "shuffle"
            : currentMode === m.mode;
        const href = m.mode === null ? "/" : `/?mode=${m.mode}`;
        return (
          <Link
            key={href}
            href={href}
            role="tab"
            aria-selected={isActive}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-[var(--border)] text-[var(--foreground)]"
                : "text-[var(--muted)] hover:bg-[var(--border)]/50 hover:text-[var(--foreground)]"
            }`}
          >
            {m.label}
          </Link>
        );
      })}
    </nav>
  );
}
