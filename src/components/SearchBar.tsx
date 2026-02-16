"use client";

import { useState, useRef, useEffect } from "react";
import { useTags } from "@/lib/hooks/useTags";

interface SearchBarProps {
  q: string;
  onQChange: (v: string) => void;
  author: string;
  onAuthorChange: (v: string) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  sort: "newest" | "oldest";
  onSortChange: (s: "newest" | "oldest") => void;
  onClearFilters: () => void;
}

export function SearchBar({
  q,
  onQChange,
  author,
  onAuthorChange,
  selectedTags,
  onTagsChange,
  sort,
  onSortChange,
  onClearFilters,
}: SearchBarProps) {
  const [tagInput, setTagInput] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { tags } = useTags(tagInput || " ");

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
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(ev.target as Node) &&
        tagInputRef.current &&
        !tagInputRef.current.contains(ev.target as Node)
      ) {
        setShowTagSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasFilters = q || author || selectedTags.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          role="search"
          aria-label="Search quotes by title, content, or author"
          placeholder="Search quotes..."
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-4 py-2.5 text-sm outline-none transition focus:border-stone-400 focus:ring-1 focus:ring-stone-300"
        />
        <input
          type="text"
          aria-label="Filter by author"
          placeholder="Author"
          value={author}
          onChange={(e) => onAuthorChange(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-4 py-2.5 text-sm outline-none transition focus:border-stone-400 focus:ring-1 focus:ring-stone-300 sm:w-44"
        />
      </div>

      <div className="relative flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {selectedTags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full bg-stone-200 px-2.5 py-0.5 text-xs text-stone-700"
            >
              #{t}
              <button
                type="button"
                onClick={() => removeTag(t)}
                aria-label={`Remove tag ${t}`}
                className="ml-0.5 rounded-full p-0.5 hover:bg-stone-300"
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
            className="w-32 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-1.5 text-sm outline-none transition focus:border-stone-400"
          />
        </div>
        {showTagSuggestions && tags.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute left-0 top-full z-10 mt-1 max-h-40 w-64 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--card-bg)] shadow-md"
          >
            {tags
              .filter((t) => !selectedTags.includes(t))
              .slice(0, 10)
              .map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addTag(t)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-stone-100"
                >
                  #{t}
                </button>
              ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-[var(--muted)]">Sort:</span>
          <div className="flex rounded-lg border border-[var(--border)] p-0.5">
            <button
              type="button"
              onClick={() => onSortChange("newest")}
              aria-pressed={sort === "newest"}
              className={`rounded-md px-3 py-1 text-xs transition ${
                sort === "newest"
                  ? "bg-stone-800 text-white"
                  : "text-stone-600 hover:bg-stone-100"
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
                  ? "bg-stone-800 text-white"
                  : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              Oldest
            </button>
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-xs text-stone-500 underline hover:text-stone-700"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
