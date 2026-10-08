import Link from "next/link";
import type { MediaItem } from "@/lib/types";
import { formatBytes, formatDate, formatDuration, getMediaTypeLabel } from "@/lib/format";
import { getVideoPosterUrl } from "@/lib/cloudinary";
import { EyeIcon, ImageIcon, MusicIcon, VideoIcon } from "@/components/icons";

function Preview({ item }: { item: MediaItem }) {
  const base = "flex h-full w-full items-center justify-center overflow-hidden bg-zinc-100 dark:bg-zinc-800";

  if (item.resourceType === "image") {
    return (
      <div className={`${base} aspect-video`}>
        {/* Plain <img> avoids Next/Image remote-config pitfalls for arbitrary Cloudinary URLs */}
        <img
          src={item.cloudinaryUrl}
          alt={item.title || item.fileName}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  if (item.resourceType === "video") {
    return (
      <div className={`${base} relative aspect-video`}>
        <video
          src={item.cloudinaryUrl}
          preload="metadata"
          muted
          playsInline
          poster={getVideoPosterUrl(item.cloudinaryUrl)}
          className="h-full w-full object-cover"
        />
        <span
          aria-hidden
          className="absolute flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"
        >
          <VideoIcon className="h-5 w-5" />
        </span>
      </div>
    );
  }

  return (
    <div
      className={`${base} aspect-video bg-gradient-to-br from-indigo-500/15 via-violet-500/15 to-fuchsia-500/15`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
        <MusicIcon className="h-6 w-6" />
      </span>
    </div>
  );
}

export function MediaCard({
  item,
  onQuickView,
}: {
  item: MediaItem;
  onQuickView?: (item: MediaItem) => void;
}) {
  const duration = formatDuration(item.duration);
  const title = item.title || item.fileName;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <Link
        href={`/media/${item.id}`}
        aria-label={`Open ${title}`}
        className="relative block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
      >
        <Preview item={item} />
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
          {item.resourceType === "image" ? (
            <ImageIcon className="h-3 w-3" />
          ) : item.resourceType === "video" ? (
            <VideoIcon className="h-3 w-3" />
          ) : (
            <MusicIcon className="h-3 w-3" />
          )}
          {getMediaTypeLabel(item.resourceType)}
          {duration ? ` · ${duration}` : ""}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link
          href={`/media/${item.id}`}
          className="truncate text-sm font-semibold text-zinc-900 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-zinc-100 dark:hover:text-indigo-400"
        >
          {title}
        </Link>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {formatBytes(item.fileSize)} · {formatDate(item.createdAtMs)}
        </p>
        {onQuickView && (
          <button
            type="button"
            onClick={() => onQuickView(item)}
            className="mt-1 inline-flex w-fit cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <EyeIcon className="h-3.5 w-3.5" /> Quick view
          </button>
        )}
      </div>
    </div>
  );
}
