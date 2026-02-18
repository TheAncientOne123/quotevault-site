"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { VisitorMasthead } from "@/components/VisitorMasthead";
import { VisitorModeTabs } from "@/components/VisitorModeTabs";
import { SearchSection } from "@/components/SearchSection";
import { ResultsPanel } from "@/components/ResultsPanel";
import { QuoteDetailModal } from "@/components/QuoteDetailModal";
import { ShuffleView } from "@/components/ShuffleView";
import { useQuotes } from "@/lib/hooks/useQuotes";
import { useDebounce } from "@/lib/hooks/useDebounce";

const DEBOUNCE_MS = 200;

function VisitorContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const isShuffle = mode === "shuffle";

  const [q, setQ] = useState("");
  const [author, setAuthor] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [languageFilter, setLanguageFilter] = useState<string>("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  const debouncedQ = useDebounce(q, DEBOUNCE_MS);
  const debouncedAuthor = useDebounce(author, DEBOUNCE_MS);

  const {
    items,
    hasMore,
    loadMore,
    isLoading,
    isLoadingMore,
    error,
  } = useQuotes(debouncedQ, debouncedAuthor, selectedTags, languageFilter, sort);

  const selectedQuote = items.find((qu) => qu.id === selectedQuoteId) ?? null;

  const clearFilters = () => {
    setQ("");
    setAuthor("");
    setSelectedTags([]);
    setLanguageFilter("");
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <VisitorMasthead />
      <div className="w-full max-w-[1600px] mx-auto px-4 pb-6 sm:px-6 pt-4">
        <div className="w-full max-w-2xl mx-auto mb-2">
          <VisitorModeTabs />
        </div>

        {isShuffle ? (
          <div className="w-full max-w-2xl mx-auto">
            <ShuffleView />
          </div>
        ) : (
          <>
            <SearchSection
              q={q}
              onQChange={setQ}
              author={author}
              onAuthorChange={setAuthor}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              languageFilter={languageFilter}
              onLanguageFilterChange={setLanguageFilter}
              sort={sort}
              onSortChange={setSort}
              onClearFilters={clearFilters}
              showAddButton={false}
              hideTitle
              hideThemeToggle
            />

            <div className="mt-4">
              <ResultsPanel
                items={items}
                isLoading={isLoading}
                isLoadingMore={!!isLoadingMore}
                hasMore={hasMore}
                onLoadMore={loadMore}
                onSelectQuote={setSelectedQuoteId}
                error={error}
                animateCards
                emptyStateMessage="Try different search terms or filters."
              />
            </div>
          </>
        )}
      </div>

      {!isShuffle && (
        <QuoteDetailModal
          quote={selectedQuote}
          onClose={() => setSelectedQuoteId(null)}
          readOnly={true}
        />
      )}
    </div>
  );
}

export default function VisitorHome() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center text-[var(--muted)]">
          Loading…
        </div>
      }
    >
      <VisitorContent />
    </Suspense>
  );
}
