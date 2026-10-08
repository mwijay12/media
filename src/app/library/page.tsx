import type { Metadata } from "next";
import { LibraryGrid } from "@/components/LibraryGrid";

export const metadata: Metadata = {
  title: "Library",
  description: "Browse every image, video and audio file shared through MediaLink Hub.",
};

export default function LibraryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          Library
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-300">
          Every upload, newest first. Search, filter by type, and open any item for
          its shareable page.
        </p>
      </div>
      <LibraryGrid />
    </div>
  );
}
