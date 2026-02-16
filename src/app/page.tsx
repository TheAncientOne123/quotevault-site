"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { SearchSection } from "@/components/SearchSection";
import { ResultsPanel } from "@/components/ResultsPanel";
import { QuoteDetailModal } from "@/components/QuoteDetailModal";
import { AddQuoteModal } from "@/components/AddQuoteModal";
import { EditQuoteModal } from "@/components/EditQuoteModal";
import { useQuotes } from "@/lib/hooks/useQuotes";
import { useDebounce } from "@/lib/hooks/useDebounce";
import type { QuoteCard as QuoteCardType } from "@/types/quote";

const DEBOUNCE_MS = 200;

export default function Home() {
  const [q, setQ] = useState("");
  const [author, setAuthor] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [languageFilter, setLanguageFilter] = useState<string>("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [editingQuote, setEditingQuote] = useState<QuoteCardType | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const debouncedQ = useDebounce(q, DEBOUNCE_MS);
  const debouncedAuthor = useDebounce(author, DEBOUNCE_MS);

  const {
    items,
    hasMore,
    loadMore,
    isLoading,
    isLoadingMore,
    error,
    mutate,
  } = useQuotes(debouncedQ, debouncedAuthor, selectedTags, languageFilter, sort);

  const selectedQuote = items.find((qu) => qu.id === selectedQuoteId) ?? null;

  const clearFilters = () => {
    setQ("");
    setAuthor("");
    setSelectedTags([]);
    setLanguageFilter("");
  };

  const handleAddQuote = async (data: {
    title: string;
    content: string;
    author: string;
    language: string;
    hashtags: string[];
  }) => {
    const res = await fetch("/api/quotes", {
      method: "POST",
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
      throw new Error(err.error || "Failed to add quote");
    }
    await mutate();
  };

  const handleDeleteQuote = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/quotes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Quote deleted");
      await mutate();
      setSelectedQuoteId(null);
    },
    [mutate]
  );

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="w-full max-w-[1600px] mx-auto px-4 pb-6 sm:px-6">
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
          onAddClick={() => setAddModalOpen(true)}
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
          />
        </div>
      </div>

      <QuoteDetailModal
        quote={selectedQuote}
        onClose={() => setSelectedQuoteId(null)}
        onDelete={handleDeleteQuote}
        onEdit={setEditingQuote}
      />

      <EditQuoteModal
        open={!!editingQuote}
        quote={editingQuote}
        onClose={() => setEditingQuote(null)}
        onSuccess={() => mutate()}
      />

      <AddQuoteModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddQuote}
        onSuccess={() => mutate()}
      />
    </div>
  );
}
