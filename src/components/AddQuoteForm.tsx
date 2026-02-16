"use client";

import { useState } from "react";
import { sanitizeText } from "@/lib/sanitize";

export type QuoteFormData = {
  title: string;
  content: string;
  author: string;
  language: string;
  hashtags: string[];
};

interface AddQuoteFormProps {
  onSubmit: (data: QuoteFormData) => Promise<void>;
  onSuccess?: () => void;
  compact?: boolean;
  initialData?: QuoteFormData | null;
}

export function AddQuoteForm({ onSubmit, onSuccess, compact, initialData }: AddQuoteFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [author, setAuthor] = useState(initialData?.author ?? "");
  const [language, setLanguage] = useState<string>(initialData?.language ?? "");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>(initialData?.hashtags ?? []);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(initialData);

  const handlePaste = (e: React.ClipboardEvent, setter: (v: string) => void) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    setter(sanitizeText(text));
  };

  const addHashtag = () => {
    const parsed = hashtagInput
      .split(/[\s,#]+/)
      .map((t) => t.replace(/^#/, "").toLowerCase().trim())
      .filter(Boolean);
    setHashtags((prev) => [...new Set([...prev, ...parsed])]);
    setHashtagInput("");
  };

  const removeHashtag = (t: string) => {
    setHashtags((prev) => prev.filter((x) => x !== t));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const t = sanitizeText(title, 500).trim();
    const c = sanitizeText(content, 10000).trim();
    if (!t) {
      setError("Title is required.");
      return;
    }
    if (!c) {
      setError("Content is required.");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        title: t,
        content: c,
        author: author ? sanitizeText(author, 200).trim() : "",
        language: language === "en" || language === "es" ? language : "",
        hashtags,
      });
      if (!isEdit) {
        setTitle("");
        setContent("");
        setAuthor("");
        setLanguage("");
        setHashtags([]);
      }
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add quote.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-4" : "space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow)]"}>
      {!compact && (
        <h2 className="font-serif text-lg font-medium">
          {isEdit ? "Edit quote" : "Add new quote"}
        </h2>
      )}
      <div>
        <label htmlFor="title" className="mb-1 block text-xs text-[var(--muted)]">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onPaste={(e) => handlePaste(e, setTitle)}
          placeholder="Brief title for the quote"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-stone-400"
          required
        />
      </div>
      <div>
        <label htmlFor="content" className="mb-1 block text-xs text-[var(--muted)]">
          Content
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onPaste={(e) => handlePaste(e, setContent)}
          placeholder="The quote text"
          rows={4}
          className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-stone-400"
          required
        />
      </div>
      <div>
        <label htmlFor="author" className="mb-1 block text-xs text-[var(--muted)]">
          Author (optional)
        </label>
        <input
          id="author"
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          onPaste={(e) => handlePaste(e, setAuthor)}
          placeholder="e.g. Marcus Aurelius"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-stone-400"
        />
      </div>
      <div>
        <label htmlFor="language" className="mb-1 block text-xs text-[var(--muted)]">
          Language (optional)
        </label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-stone-400"
        >
          <option value="">—</option>
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>
      <div>
        <label htmlFor="hashtags" className="mb-1 block text-xs text-[var(--muted)]">
          Hashtags (type and press Enter)
        </label>
        <div className="flex flex-wrap gap-2">
          {hashtags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--border)] px-2 py-0.5 text-xs"
            >
              #{t}
              <button
                type="button"
                onClick={() => removeHashtag(t)}
                aria-label={`Remove ${t}`}
                className="rounded-full p-0.5 hover:bg-[var(--muted)]/20"
              >
                ×
              </button>
            </span>
          ))}
          <input
            id="hashtags"
            type="text"
            value={hashtagInput}
            onChange={(e) => setHashtagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addHashtag();
              }
            }}
            onPaste={(e) => {
              e.preventDefault();
              const text = e.clipboardData.getData("text/plain");
              const parsed = text
                .split(/[\s,#]+/)
                .map((s) => s.replace(/^#/, "").toLowerCase().trim())
                .filter(Boolean);
              setHashtags((prev) => [...new Set([...prev, ...parsed])]);
            }}
            placeholder="#philosophy #writing"
            className="flex-1 min-w-[120px] rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-stone-400"
          />
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] transition opacity-90 hover:opacity-100 disabled:opacity-50"
      >
        {loading ? (isEdit ? "Updating…" : "Adding…") : isEdit ? "Update quote" : "Add quote"}
      </button>
    </form>
  );
}
