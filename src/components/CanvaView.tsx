"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import type { QuoteCard } from "@/types/quote";

function getAuthorDisplay(author: string | null, language: string | null): string {
  if (author?.trim()) return author.trim();
  return language === "es" ? "Anónimo" : "Anonymous";
}

interface Position {
  x: number;
  y: number;
}

interface Group {
  hashtag: string;
  quoteIds: string[];
}

const CARD_WIDTH = 260;
const CARD_HEIGHT = 180;
const JOIN_DISTANCE = 120;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2;
const ZOOM_SENSITIVITY = 0.001;
const FLOAT_AMPLITUDE = 4;
const FLOAT_DURATION = 4;

function useShuffleQuotes() {
  const [items, setItems] = useState<QuoteCard[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/quotes/shuffle?limit=30")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items: QuoteCard[] }) => {
        if (!cancelled) setItems(data.items ?? []);
      })
      .catch(() => { if (!cancelled) setItems([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  return { items, loading };
}

function initialPositions(quotes: QuoteCard[]): Record<string, Position> {
  const out: Record<string, Position> = {};
  const cols = Math.ceil(Math.sqrt(quotes.length));
  const gap = 24;
  quotes.forEach((q, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    out[q.id] = {
      x: 80 + col * (CARD_WIDTH + gap),
      y: 80 + row * (CARD_HEIGHT + gap),
    };
  });
  return out;
}

function getSharedHashtags(quotes: QuoteCard[], ids: string[]): string[] {
  const sets = ids.map((id) => {
    const q = quotes.find((qu) => qu.id === id);
    return new Set(q?.hashtags ?? []);
  });
  if (sets.length < 2) return [];
  const first = sets[0];
  const shared: string[] = [];
  first.forEach((tag) => {
    if (sets.every((s) => s.has(tag))) shared.push(tag);
  });
  return shared;
}

export function CanvaView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { items, loading } = useShuffleQuotes();

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [positions, setPositions] = useState<Record<string, Position>>({});
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  useEffect(() => {
    if (items.length > 0 && Object.keys(positions).length === 0) {
      setPositions(initialPositions(items));
    }
  }, [items, positions]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * ZOOM_SENSITIVITY * 500;
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const containerRect = useRef<DOMRect | null>(null);
  const getContainerRect = useCallback(() => {
    if (containerRef.current) containerRect.current = containerRef.current.getBoundingClientRect();
    return containerRect.current;
  }, []);

  const screenToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const r = getContainerRect();
      if (!r) return { x: 0, y: 0 };
      const centerX = r.left + r.width / 2;
      const centerY = r.top + r.height / 2;
      const x = (clientX - centerX - pan.x) / zoom;
      const y = (clientY - centerY - pan.y) / zoom;
      return { x, y };
    },
    [pan, zoom, getContainerRect]
  );

  const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = getContainerRect();
      if (!rect) return;
      if (e.button === 2) {
        setIsPanning(true);
        panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      }
      if (e.button === 0) {
        setSelectedId(null);
      }
    },
    [pan, getContainerRect]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPan({
          x: e.clientX - panStart.current.x,
          y: e.clientY - panStart.current.y,
        });
      }
      if (isDragging.current && selectedId) {
        const { x, y } = screenToWorld(e.clientX, e.clientY);
        setPositions((prev) => ({
          ...prev,
          [selectedId]: { x: x - CARD_WIDTH / 2, y: y - CARD_HEIGHT / 2 },
        }));
      }
    },
    [isPanning, selectedId, screenToWorld]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 2) {
        setIsPanning(false);
      }
      if (e.button === 0 && selectedId) {
        isDragging.current = false;
        const pos = positions[selectedId];
        if (!pos) return;
        const nearby = items.filter((q) => {
          if (q.id === selectedId) return false;
          const p = positions[q.id];
          if (!p) return false;
          const dx = p.x + CARD_WIDTH / 2 - (pos.x + CARD_WIDTH / 2);
          const dy = p.y + CARD_HEIGHT / 2 - (pos.y + CARD_HEIGHT / 2);
          return Math.hypot(dx, dy) < JOIN_DISTANCE;
        });
        const allIds = [selectedId, ...nearby.map((q) => q.id)];
        const shared = getSharedHashtags(items, allIds);
        if (shared.length > 0) {
          setGroups((prev) => {
            const other = prev.filter((g) => !shared.some((tag) => g.hashtag === tag));
            const next = [...other];
            for (const tag of shared) {
              const existing = prev.find((g) => g.hashtag === tag);
              const withTag = allIds.filter(
                (id) => items.find((q) => q.id === id)?.hashtags.includes(tag)
              );
              const merged = new Set([...(existing?.quoteIds ?? []), ...withTag]);
              next.push({ hashtag: tag, quoteIds: [...merged] });
            }
            return next;
          });
        }
      }
    },
    [selectedId, positions, items]
  );

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
    if (selectedId) isDragging.current = false;
  }, [selectedId]);

  useEffect(() => {
    const onGlobalMouseUp = () => {
      setIsPanning(false);
      isDragging.current = false;
    };
    window.addEventListener("mouseup", onGlobalMouseUp);
    return () => window.removeEventListener("mouseup", onGlobalMouseUp);
  }, []);

  const groupBounds = useCallback(
    (g: Group) => {
      const pts = g.quoteIds.map((id) => positions[id]).filter(Boolean);
      if (pts.length === 0) return { cx: 0, cy: 0, r: 80 };
      const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length + CARD_WIDTH / 2;
      const cy = pts.reduce((a, p) => a + p.y, 0) / pts.length + CARD_HEIGHT / 2;
      const r =
        Math.max(
          ...pts.map((p) =>
            Math.hypot(p.x + CARD_WIDTH / 2 - cx, p.y + CARD_HEIGHT / 2 - cy)
          )
        ) + 60;
      return { cx, cy, r: Math.max(r, 80) };
    },
    [positions]
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-[var(--muted)]">Loading canvas…</div>
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

  return (
    <div
      ref={containerRef}
      className="relative h-[calc(100vh-120px)] w-full overflow-hidden rounded-xl"
      style={{
        cursor: isPanning ? "grabbing" : "default",
      }}
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="absolute inset-0 flex items-center justify-center origin-center transition-transform duration-150"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          cursor: isPanning ? "grabbing" : "grab",
        }}
      >
        <div className="relative" style={{ width: 2000, height: 2000 }}>
          {groups.map((g) => {
            const { cx, cy, r } = groupBounds(g);
            return (
              <motion.div
                key={g.hashtag + g.quoteIds.join(",")}
                className="absolute rounded-full border-2 border-[var(--muted)]/50 bg-[var(--border)]/20 pointer-events-none"
                style={{
                  left: cx - r,
                  top: cy - r - 28,
                  width: r * 2,
                  height: r * 2,
                }}
                animate={{
                  y: [0, FLOAT_AMPLITUDE, 0],
                  rotate: [0, 0.5, 0],
                }}
                transition={{
                  duration: FLOAT_DURATION,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <span
                  className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full bg-[var(--card-bg)] px-3 py-1 text-xs font-medium text-[var(--foreground)] shadow border border-[var(--border)]"
                >
                  #{g.hashtag}
                </span>
              </motion.div>
            );
          })}
          {items.map((quote, i) => {
            const pos = positions[quote.id] ?? { x: 0, y: 0 };
            const isSelected = selectedId === quote.id;
            return (
              <motion.div
                key={quote.id}
                className="absolute cursor-grab active:cursor-grabbing rounded-xl border-2 bg-[var(--card-bg)] p-4 shadow-lg"
                style={{
                  width: CARD_WIDTH,
                  minHeight: CARD_HEIGHT,
                  left: pos.x,
                  top: pos.y,
                  borderColor: isSelected ? "var(--muted)" : "var(--border)",
                }}
                animate={{
                  y: [0, FLOAT_AMPLITUDE, 0],
                  rotate: [0, 0.3, 0],
                }}
                transition={{
                  duration: FLOAT_DURATION + (i % 3) * 0.3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: (i % 5) * 0.2,
                }}
                onMouseDown={(e) => {
                  if (e.button === 0) {
                    e.stopPropagation();
                    setSelectedId(quote.id);
                    isDragging.current = true;
                  }
                }}
              >
                <h3 className="font-serif text-sm font-semibold text-[var(--foreground)] line-clamp-1">
                  {quote.title}
                </h3>
                <p className="mt-1 line-clamp-3 text-xs text-[var(--muted)] whitespace-pre-wrap">
                  {quote.content}
                </p>
                <p className="mt-2 text-xs italic text-[var(--muted)]">
                  — {getAuthorDisplay(quote.author, quote.language)}
                </p>
                {quote.hashtags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {quote.hashtags.slice(0, 3).map((t) => (
                      <span key={t} className="rounded bg-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
      <div className="absolute bottom-4 left-4 rounded-lg bg-[var(--card-bg)]/90 px-3 py-2 text-xs text-[var(--muted)] border border-[var(--border)]">
        Right-drag to pan · Scroll to zoom · Drag cards to move · Drop near another to group by hashtag
      </div>
    </div>
  );
}
