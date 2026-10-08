import type { ResourceType } from "./types";

const BYTE_UNITS = ["B", "KB", "MB", "GB"] as const;

/** 1536 → "1.5 KB" */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const exponent = Math.min(BYTE_UNITS.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** exponent;
  const digits = value >= 100 || exponent === 0 ? 0 : 1;
  return `${value.toFixed(digits)} ${BYTE_UNITS[exponent]}`;
}

/** 83 → "1:23" (returns null when duration is unknown) */
export function formatDuration(seconds?: number): string | null {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) return null;
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const rest = (total % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export function formatDate(epochMs?: number): string {
  if (!epochMs) return "—";
  return dateFormatter.format(new Date(epochMs));
}

/** "quarterly-review_FINAL.mp4" → "Quarterly review FINAL" */
export function prettifyFileName(name: string): string {
  const withoutExtension = name.replace(/\.[a-z0-9]+$/i, "");
  const cleaned = withoutExtension
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return name;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

const TYPE_LABELS: Record<ResourceType, string> = {
  image: "Image",
  video: "Video",
  audio: "Audio",
};

export function getMediaTypeLabel(type: ResourceType): string {
  return TYPE_LABELS[type];
}
