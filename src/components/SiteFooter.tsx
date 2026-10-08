export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-zinc-500 dark:text-zinc-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>MediaLink Hub — share any media with one link.</p>
        <p>
          © {year} · Built with Next.js, Cloudinary &amp; Firebase
        </p>
      </div>
    </footer>
  );
}
