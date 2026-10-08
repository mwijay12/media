import Link from "next/link";
import { Button } from "@/components/ui/liquid-glass-button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-12 text-center sm:py-20">
      <p className="text-5xl font-bold tracking-tight text-zinc-300 sm:text-6xl dark:text-zinc-700">404</p>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        This link doesn&apos;t exist
      </h1>
      <p className="text-zinc-600 dark:text-zinc-300">
        The media item may have been removed, or the URL has a typo.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="cool" asChild>
          <Link href="/">Upload something new</Link>
        </Button>
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
