"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { VisitorModeTabs } from "@/components/VisitorModeTabs";
import { useTags } from "@/lib/hooks/useTags";
import { useDebounce } from "@/lib/hooks/useDebounce";

const SUGGEST_DEBOUNCE_MS = 180;

interface SuggestItem {
  id: string;
  title: string;
}

interface SearchSectionProps {
  q: string;
  onQChange: (v: string) => void;
  author: string;
  onAuthorChange: (v: string) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  languageFilter: string;
  onLanguageFilterChange: (v: string) => void;
  sort: "newest" | "oldest";
  onSortChange: (s: "newest" | "oldest") => void;
  onClearFilters: () => void;
  onAddClick?: () => void;
  showAddButton?: boolean;
  hideTitle?: boolean;
  hideThemeToggle?: boolean;
  showModeTabs?: boolean;
}

function FilterIcon({ className }: { className?: string }) {
  return (
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
      className={className}
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

export function SearchSection({
  q,
  onQChange,
  author,
  onAuthorChange,
  selectedTags,
  onTagsChange,
  languageFilter,
  onLanguageFilterChange,
  sort,
  onSortChange,
  onClearFilters,
  onAddClick,
  showAddButton = true,
  hideTitle = false,
  hideThemeToggle = false,
  showModeTabs = false,
}: SearchSectionProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [suggestItems, setSuggestItems] = useState<SuggestItem[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestListRef = useRef<HTMLDivElement>(null);

  const debouncedQ = useDebounce(q, SUGGEST_DEBOUNCE_MS);

  const { tags } = useTags(tagInput || " ", languageFilter);

  useEffect(() => {
    if (!debouncedQ.trim()) {
      setSuggestItems([]);
      setSuggestOpen(false);
      return;
    }
    let cancelled = false;
    fetch(`/api/quotes/suggest?q=${encodeURIComponent(debouncedQ)}`)
      .then((res) => res.ok ? res.json() : { items: [] })
      .then((data: { items: SuggestItem[] }) => {
        if (!cancelled) {
          setSuggestItems(data.items ?? []);
          setSuggestOpen((data.items?.length ?? 0) > 0);
          setHighlightedIndex(-1);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSuggestItems([]);
          setSuggestOpen(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQ]);

  const selectSuggestion = useCallback(
    (title: string) => {
      onQChange(title);
      setSuggestOpen(false);
      setHighlightedIndex(-1);
      searchInputRef.current?.focus();
    },
    [onQChange]
  );

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestOpen || suggestItems.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => (i < suggestItems.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => (i <= 0 ? suggestItems.length - 1 : i - 1));
    } else if (e.key === "Enter" && highlightedIndex >= 0 && suggestItems[highlightedIndex]) {
      e.preventDefault();
      selectSuggestion(suggestItems[highlightedIndex].title);
    } else if (e.key === "Escape") {
      setSuggestOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const removeTag = (name: string) => {
    onTagsChange(selectedTags.filter((t) => t !== name));
  };

  const addTag = (name: string) => {
    const n = name.toLowerCase().replace(/^#/, "").trim();
    if (n && !selectedTags.includes(n)) {
      onTagsChange([...selectedTags, n]);
    }
    setTagInput("");
    setShowTagSuggestions(false);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const parsed = tagInput
        .split(/[\s,#]+/)
        .map((t) => t.replace(/^#/, "").toLowerCase().trim())
        .filter(Boolean);
      if (parsed.length) {
        parsed.forEach((p) => addTag(p));
      } else if (tags.length) {
        addTag(tags[0]);
      }
    }
  };

  useEffect(() => {
    function handleClickOutside(ev: MouseEvent) {
      const target = ev.target as Node;
      const el = ev.target as HTMLElement;
      if (suggestionsRef.current?.contains(target) || tagInputRef.current?.contains(target)) return;
      setShowTagSuggestions(false);
      if (dropdownRef.current?.contains(target) || filterButtonRef.current?.contains(target)) return;
      if (el?.tagName === "OPTION" || el?.closest?.("select")) return;
      setFiltersOpen(false);
      if (suggestListRef.current?.contains(target) || searchInputRef.current?.contains(target)) return;
      setSuggestOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasFilters = q || author || selectedTags.length > 0 || (languageFilter === "en" || languageFilter === "es");

  return (
    <section
      className="relative flex flex-col items-center px-4 pt-6 pb-4 sm:px-6 sm:pt-8"
    >
      {!hideThemeToggle && (
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>
      )}

      <div className="w-full max-w-2xl space-y-4">
        {!hideTitle && (
          <>
            <h1 className="text-center font-serif text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
              QuoteVault
            </h1>
            <p className="text-center text-sm text-[var(--muted)]">
              Store, browse, and search your personal quotes
            </p>
          </>
        )}

        {showModeTabs && (
          <div className="mb-2">
            <VisitorModeTabs />
          </div>
        )}

        <div className="relative flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <input
              ref={searchInputRef}
              type="text"
              role="search"
              aria-label="Search quotes by title, content, or author"
              aria-autocomplete="list"
              aria-expanded={suggestOpen}
              aria-controls="search-suggest-list"
              placeholder="Search quotes..."
              value={q}
              onChange={(e) => onQChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-5 py-4 text-base shadow-[var(--shadow)] outline-none transition placeholder:text-[var(--muted)] focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-700"
            />
            {suggestOpen && suggestItems.length > 0 && (
              <div
                ref={suggestListRef}
                id="search-suggest-list"
                role="listbox"
                className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--card-bg)] shadow-[var(--shadow-hover)] py-1"
              >
                {suggestItems.map((item, i) => (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={i === highlightedIndex}
                    onMouseEnter={() => setHighlightedIndex(i)}
                    onClick={() => selectSuggestion(item.title)}
                    className={`block w-full px-4 py-2.5 text-left text-sm transition ${
                      i === highlightedIndex
                        ? "bg-[var(--border)] text-[var(--foreground)]"
                        : "text-[var(--foreground)] hover:bg-[var(--border)]/50"
                    }`}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button
              ref={filterButtonRef}
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              aria-expanded={filtersOpen}
              aria-label="Filters"
              className={`rounded-xl border-2 p-3 transition ${
                hasFilters
                  ? "border-[var(--foreground)]/40 bg-[var(--border)]/50 text-[var(--foreground)]"
                  : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--muted)]/60 hover:text-[var(--foreground)]"
              }`}
            >
              <FilterIcon />
            </button>
            {filtersOpen && (
              <div
                ref={dropdownRef}
                className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-[var(--shadow-hover)] space-y-4"
              >
            <div>
              <label htmlFor="author-filter" className="mb-1 block text-xs text-[var(--muted)]">
                Author
              </label>
              <input
                id="author-filter"
                type="text"
                aria-label="Filter by author"
                placeholder="Filter by author"
                value={author}
                onChange={(e) => onAuthorChange(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-stone-400"
              />
            </div>
            <div>
              <span className="mb-1 block text-xs text-[var(--muted)]">Language</span>
              <div className="flex rounded-lg border border-[var(--border)] p-0.5" role="group" aria-label="Filter by language">
                {[
                  { value: "", label: "All" },
                  { value: "en", label: "English" },
                  { value: "es", label: "Español" },
                ].map((opt) => (
                  <button
                    key={opt.value || "all"}
                    type="button"
                    onClick={() => onLanguageFilterChange(opt.value)}
                    aria-pressed={languageFilter === opt.value}
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs transition ${
                      languageFilter === opt.value
                        ? "bg-[var(--foreground)] text-[var(--background)]"
                        : "text-[var(--muted)] hover:bg-[var(--border)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <label className="mb-1 block text-xs text-[var(--muted)]">
                Hashtags
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--border)] px-2.5 py-0.5 text-xs"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      aria-label={`Remove tag ${t}`}
                      className="rounded-full p-0.5 hover:bg-[var(--muted)]/20"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  ref={tagInputRef}
                  type="text"
                  aria-label="Add hashtag filter"
                  placeholder="Add hashtag..."
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                    setShowTagSuggestions(true);
                  }}
                  onFocus={() => setShowTagSuggestions(true)}
                  onKeyDown={handleTagKeyDown}
                  className="min-w-[100px] flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm outline-none focus:border-stone-400"
                />
              </div>
              {showTagSuggestions && tags.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute left-0 top-full z-10 mt-1 max-h-40 w-64 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--card-bg)] shadow-lg"
                >
                  {tags
                    .filter((t) => !selectedTags.includes(t))
                    .slice(0, 10)
                    .map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => addTag(t)}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--border)]"
                      >
                        #{t}
                      </button>
                    ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-[var(--muted)]">Sort:</span>
              <div className="flex rounded-lg border border-[var(--border)] p-0.5">
                <button
                  type="button"
                  onClick={() => onSortChange("newest")}
                  aria-pressed={sort === "newest"}
                  className={`rounded-md px-3 py-1 text-xs transition ${
                    sort === "newest"
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "text-[var(--muted)] hover:bg-[var(--border)]"
                  }`}
                >
                  Newest
                </button>
                <button
                  type="button"
                  onClick={() => onSortChange("oldest")}
                  aria-pressed={sort === "oldest"}
                  className={`rounded-md px-3 py-1 text-xs transition ${
                    sort === "oldest"
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "text-[var(--muted)] hover:bg-[var(--border)]"
                  }`}
                >
                  Oldest
                </button>
              </div>
              {hasFilters && (
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="text-xs text-[var(--muted)] underline hover:text-[var(--foreground)]"
                >
                  Clear filters
                </button>
              )}
            </div>
            </div>
            )}
          </div>
          {showAddButton && onAddClick && (
            <button
              type="button"
              onClick={onAddClick}
              className="rounded-xl border-2 border-[var(--border)] bg-transparent px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--foreground)]/30 hover:bg-[var(--border)]/30 whitespace-nowrap"
            >
              Add Quote
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
