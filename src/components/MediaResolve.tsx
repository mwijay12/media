"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMediaItemByIdClient } from "@/lib/firestore";
import { isFirebaseConfigured } from "@/lib/config";
import { MediaViewer } from "@/components/MediaViewer";
import type { MediaItem } from "@/lib/types";

/**
 * Client-side fallback for /media/[id] when the server-side fetch misses.
 * This happens when e.g. the Firebase API key has HTTP-referrer restrictions
 * that block server IPs, or a just-uploaded (guest) record is still
 * propagating. Reads are public per firestore.rules, so guests resolve too.
 */
export function MediaResolve({ id }: { id: string }) {
  const [phase, setPhase] = useState<"checking" | "found" | "missing">(() =>
    isFirebaseConfigured() ? "checking" : "missing",
  );
  const [item, setItem] = useState<MediaItem | null>(null);
  // Share URL is derived directly — no state/effect needed.
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/media/${id}` : "";

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    let cancelled = false;
    // A just-uploaded guest record can take a moment to become readable —
    // retry a few times before giving up.
    const delays = [0, 1200, 3000];
    (async () => {
      for (const delay of delays) {
        if (delay) await new Promise((r) => setTimeout(r, delay));
        if (cancelled) return;
        try {
          const found = await getMediaItemByIdClient(id);
          if (found) {
            if (!cancelled) {
              setItem(found);
              setPhase("found");
            }
            return;
          }
        } catch {
          // Try the next attempt before showing "not found".
        }
      }
      if (!cancelled) setPhase("missing");
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (phase === "found" && item) {
    return <MediaViewer item={item} shareUrl={shareUrl} />;
  }

  if (phase === "checking") {
    return (
      <div className="flex flex-col gap-4" aria-label="Opening media">
        <div className="animate-pulse overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="aspect-video bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="animate-pulse space-y-2">
          <div className="h-6 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Opening your media… (double-checking the library for this link)
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-20 text-center">
      <p className="text-6xl font-bold tracking-tight text-zinc-300 dark:text-zinc-700">404</p>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        This link doesn&apos;t exist (yet)
      </h1>
      <p className="text-zinc-600 dark:text-zinc-300">
        The media item may have been removed, the URL has a typo — or a
        just-uploaded file is still being saved. Wait a few seconds and refresh.
      </p>
      <div className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-left text-xs leading-relaxed text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        <p className="font-semibold text-zinc-800 dark:text-zinc-200">Still nothing? Check:</p>
        <ul className="mt-1 list-disc pl-4">
          <li>Firebase project has a Cloud Firestore database (Native mode).</li>
          <li>
            The included <code className="font-mono">firestore.rules</code> file is published (
            <code className="font-mono">firebase deploy --only firestore:rules</code>).
          </li>
          <li>The <code className="font-mono">NEXT_PUBLIC_FIREBASE_*</code> values match that project.</li>
        </ul>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-400 hover:to-violet-400"
        >
          Upload something new
        </Link>
        <Link
          href="/library"
          className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Browse library
        </Link>
      </div>
    </div>
  );
}
