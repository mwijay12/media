"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { MediaItem } from "@/lib/types";
import { formatBytes, formatDate, formatDuration } from "@/lib/format";
import { ExternalIcon, MusicIcon, XIcon } from "@/components/icons";
import { btnPrimary, btnSecondary } from "@/components/ui-classes";
import { CopyButton } from "@/components/CopyButton";

/**
 * Quick-view dialog for the library: click any card's "Quick view" button
 * and instantly see the preview + details without leaving the page.
 * The full shareable page stays one click away ("Open full page").
 */
export function QuickViewModal({
  item,
  onClose,
}: {
  item: MediaItem | null;
  onClose: () => void;
}) {
  // Share URL is derived directly — no state/effect needed.
  const shareUrl =
    item && typeof window !== "undefined" ? `${window.location.origin}/media/${item.id}` : "";

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Quick view: ${item.title || item.fileName}`}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {item.title || item.fileName}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quick view"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto">
          <div className="bg-black">
            {item.resourceType === "image" ? (
              <img
                src={item.cloudinaryUrl}
                alt={item.title || item.fileName}
                className="mx-auto max-h-[50vh] w-full object-contain bg-zinc-950"
              />
            ) : item.resourceType === "video" ? (
              <video
                src={item.cloudinaryUrl}
                controls
                playsInline
                preload="metadata"
                className="mx-auto max-h-[50vh] w-full bg-zinc-950"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-10 text-white">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                  <MusicIcon className="h-7 w-7" />
                </span>
                <audio src={item.cloudinaryUrl} controls preload="metadata" className="w-full max-w-xl" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 px-4 py-4">
            {item.description && (
              <p className="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-300">
                {item.description}
              </p>
            )}
            <dl className="grid grid-cols-2 gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm sm:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-950">
              {(
                [
                  ["Size", formatBytes(item.fileSize)],
                  ["Format", item.format?.toUpperCase() ?? "—"],
                  ["Duration", formatDuration(item.duration) ?? "—"],
                  ["Uploaded", formatDate(item.createdAtMs)],
                  ["Uploader", item.userName || item.userEmail || "Guest"],
                  ["Type", item.resourceType],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {label}
                  </dt>
                  <dd className="truncate text-zinc-900 dark:text-zinc-100" title={value}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/media/${item.id}`} className={btnPrimary}>
                <ExternalIcon className="h-4 w-4" /> Open full page
              </Link>
              {shareUrl && <CopyButton text={shareUrl} label="Copy link" />}
              <button type="button" onClick={onClose} className={btnSecondary}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
