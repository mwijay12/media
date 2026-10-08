import type { MediaItem } from "@/lib/types";
import { formatBytes, formatDate, formatDuration, getMediaTypeLabel } from "@/lib/format";
import { getVideoPosterUrl } from "@/lib/cloudinary";
import { ExternalIcon, MusicIcon, UploadIcon } from "@/components/icons";
import { btnPrimary, btnSecondary } from "@/components/ui-classes";
import { CopyButton } from "@/components/CopyButton";

/**
 * Full-size media renderer + metadata panel.
 * Server-safe (no hooks) — copy-to-clipboard lives in <CopyButton />.
 */
export function MediaViewer({ item, shareUrl }: { item: MediaItem; shareUrl: string }) {
  const duration = formatDuration(item.duration);
  const dimensions =
    typeof item.width === "number" && typeof item.height === "number"
      ? `${item.width} × ${item.height}`
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-black shadow-sm dark:border-zinc-800">
        {item.resourceType === "image" ? (
          <img
            src={item.cloudinaryUrl}
            alt={item.title || item.fileName}
            className="mx-auto max-h-[70vh] w-full object-contain bg-zinc-950"
          />
        ) : item.resourceType === "video" ? (
          <video
            src={item.cloudinaryUrl}
            controls
            playsInline
            preload="metadata"
            poster={getVideoPosterUrl(item.cloudinaryUrl)}
            className="mx-auto max-h-[70vh] w-full bg-zinc-950"
          />
        ) : (
          <div className="flex flex-col items-center gap-4 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-14 text-white">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <MusicIcon className="h-8 w-8" />
            </span>
            <audio src={item.cloudinaryUrl} controls preload="metadata" className="w-full max-w-xl" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            {getMediaTypeLabel(item.resourceType)}
            {duration ? ` · ${duration}` : ""}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
            {item.title || item.fileName}
          </h1>
          {item.description && (
            <p className="mt-2 max-w-3xl whitespace-pre-wrap text-zinc-600 dark:text-zinc-300">
              {item.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CopyButton text={shareUrl} label="Copy share link" />
          <a href={item.cloudinaryUrl} target="_blank" rel="noreferrer" className={btnSecondary}>
            <ExternalIcon className="h-4 w-4" /> Open original
          </a>
          <a href={item.cloudinaryUrl} download={item.fileName} className={btnSecondary}>
            <UploadIcon className="h-4 w-4 rotate-180" /> Download
          </a>
        </div>

        <dl className="grid grid-cols-2 gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-sm sm:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-900">
          {(
            [
              ["File name", item.fileName],
              ["Size", formatBytes(item.fileSize)],
              ["Format", item.format?.toUpperCase() ?? "—"],
              ["Dimensions", dimensions ?? "—"],
              ["Duration", duration ?? "—"],
              ["Uploaded", formatDate(item.createdAtMs)],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5">
              <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {label}
              </dt>
              <dd className="truncate text-zinc-900 dark:text-zinc-100" title={value}>
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Shareable page
          </span>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="w-full truncate rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              {shareUrl}
            </code>
            <a href="/library" className={btnPrimary}>
              Browse library
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
