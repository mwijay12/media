import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-20 text-center">
      <p className="text-6xl font-bold tracking-tight text-zinc-300 dark:text-zinc-700">404</p>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        This link doesn&apos;t exist
      </h1>
      <p className="text-zinc-600 dark:text-zinc-300">
        The media item may have been removed, or the URL has a typo.
      </p>
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
