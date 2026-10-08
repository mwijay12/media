"use client";

import { useEffect, useMemo, useState } from "react";
import { subscribeToMediaLibrary } from "@/lib/firestore";
import { isFirebaseConfigured } from "@/lib/config";
import type { MediaItem, MediaSort, ResourceType } from "@/lib/types";
import { MediaCard } from "@/components/MediaCard";
import { QuickViewModal } from "@/components/QuickViewModal";
import { AlertIcon, SearchIcon } from "@/components/icons";
import { inputClass } from "@/components/ui-classes";

type TypeFilter = "all" | ResourceType;

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
  { value: "audio", label: "Audio" },
];

const SORTS: { value: MediaSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "largest", label: "Largest" },
  { value: "title", label: "Title A–Z" },
];

export function LibraryGrid() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const firebaseReady = isFirebaseConfigured();
  const [loading, setLoading] = useState(firebaseReady);
  const [error, setError] = useState(
    firebaseReady ? "" : "Firebase is not configured. Set the NEXT_PUBLIC_FIREBASE_* variables in .env.local.",
  );
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sort, setSort] = useState<MediaSort>("newest");
  const [preview, setPreview] = useState<MediaItem | null>(null);

  useEffect(() => {
    if (!firebaseReady) return;
    const unsubscribe = subscribeToMediaLibrary({
      next: (nextItems) => {
        setItems(nextItems);
        setLoading(false);
      },
      error: (message) => {
        setError(message);
        setLoading(false);
      },
    });
    return unsubscribe;
  }, [firebaseReady]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = items.filter((item) => {
      if (typeFilter !== "all" && item.resourceType !== typeFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.fileName.toLowerCase().includes(q)
      );
    });
    const sorted = [...filtered];
    switch (sort) {
      case "oldest":
        sorted.sort((a, b) => (a.createdAtMs ?? 0) - (b.createdAtMs ?? 0));
        break;
      case "largest":
        sorted.sort((a, b) => b.fileSize - a.fileSize);
        break;
      case "title":
        sorted.sort((a, b) =>
          (a.title || a.fileName).localeCompare(b.title || b.fileName),
        );
        break;
      default:
        sorted.sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0));
        break;
    }
    return sorted;
  }, [items, query, typeFilter, sort]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" aria-label="Loading library">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800"
          >
            <div className="aspect-video bg-zinc-200 dark:bg-zinc-800" />
            <div className="space-y-2 p-3">
              <div className="h-3 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p
        role="alert"
        className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400"
      >
        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
        {error}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, description or file name…"
            aria-label="Search library"
            className={`${inputClass} pl-9`}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Filter by type" className="flex rounded-lg border border-zinc-200 bg-white p-0.5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setTypeFilter(f.value)}
                aria-pressed={typeFilter === f.value}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                  typeFilter === f.value
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as MediaSort)}
            aria-label="Sort library"
            className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-xs font-medium text-zinc-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 min-[420px]:w-auto dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
        {visible.length === 0
          ? items.length === 0
            ? "No uploads yet — be the first to share something."
            : "No results match your filters."
          : `${visible.length} item${visible.length === 1 ? "" : "s"}`}
      </p>

      {visible.length > 0 && (
        <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((item) => (
            <MediaCard key={item.id} item={item} onQuickView={setPreview} />
          ))}
        </div>
      )}

      <QuickViewModal item={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
