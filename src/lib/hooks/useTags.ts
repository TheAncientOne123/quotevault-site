"use client";

import useSWR from "swr";

async function fetcher(url: string): Promise<string[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch tags");
  return res.json();
}

export function useTags(prefix: string, language?: string) {
  const normalized = prefix.trim().toLowerCase().replace(/^#/, "");
  const params = new URLSearchParams();
  if (normalized) params.set("prefix", normalized);
  if (language === "en" || language === "es") params.set("language", language);
  params.set("limit", normalized ? "20" : "50");
  const url = `/api/tags?${params.toString()}`;

  const { data, error, mutate } = useSWR(url, fetcher, {
    dedupingInterval: 30000,
  });

  return {
    tags: data ?? [],
    isLoading: !error && !data,
    error,
    mutate,
  };
}
