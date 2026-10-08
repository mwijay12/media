import { getCloudinaryConfig } from "./config";
import type { ResourceType } from "./types";

/**
 * Cloudinary upload utility (browser only).
 *
 * SECURITY: uploads are performed with an UNSIGNED upload preset — the
 * Cloudinary API secret is never used or exposed. The preset name and cloud
 * name are public values.
 */

/** Generous ceiling for a single upload (Cloudinary free plans allow ≥ 100 MB). */
export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

/** Mirrors the <input accept> list; also used for MIME fallback detection. */
export const ACCEPTED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".mp4",
  ".mov",
  ".webm",
  ".mp3",
  ".wav",
  ".ogg",
] as const;

const EXTENSION_TO_TYPE: Record<string, ResourceType> = {
  ".jpg": "image",
  ".jpeg": "image",
  ".png": "image",
  ".webp": "image",
  ".gif": "image",
  ".mp4": "video",
  ".mov": "video",
  ".webm": "video",
  ".mp3": "audio",
  ".wav": "audio",
  ".ogg": "audio",
};

/**
 * Determine the logical resource type for a file. Prefers the MIME type and
 * falls back to the file extension (some browsers report empty MIME types).
 * Returns null for anything outside the accepted set.
 */
export function getResourceTypeForFile(file: File): ResourceType | null {
  const mime = file.type.toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";

  const name = file.name.toLowerCase();
  const dot = name.lastIndexOf(".");
  if (dot >= 0) {
    return EXTENSION_TO_TYPE[name.slice(dot)] ?? null;
  }
  return null;
}

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  /** Cloudinary's resource type: "image" or "video" (audio lands here too). */
  resourceType: string;
  format?: string;
  width?: number;
  height?: number;
  duration?: number;
  bytes: number;
  originalFilename?: string;
}

export interface UploadOptions {
  /** Called with 0–100 while the request body is being sent. */
  onProgress?: (percent: number) => void;
  /** Aborting the signal cancels the in-flight upload. */
  signal?: AbortSignal;
}

/** Translate raw Cloudinary errors into actionable user-facing copy. */
function friendlyUploadError(message: string): string {
  if (/already exists/i.test(message)) {
    return "A file with this name already exists in your Cloudinary account (the upload preset keeps original filenames). Rename the file and try again.";
  }
  if (/preset/i.test(message) && /(not found|invalid|does not exist|unsigned)/i.test(message)) {
    return "Cloudinary could not find a valid upload preset. Check NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local.";
  }
  if (/not allowed|whitelist|disabled/i.test(message)) {
    return `Cloudinary rejected the upload: ${message}`;
  }
  return message;
}

/**
 * Upload a file to Cloudinary with XHR so we get real upload progress.
 *
 * Cloudinary stores audio under its "video" resource type, so images are sent
 * to `/image/upload` and everything else to `/video/upload`.
 *
 * The preset ("Mwijay Personal") is configured as Unsigned with
 * `use_filename: true`, `unique_filename: false`, `overwrite: false`.
 */
export async function uploadToCloudinary(
  file: File,
  options: UploadOptions = {},
): Promise<CloudinaryUploadResult> {
  const { cloudName, uploadPreset } = getCloudinaryConfig();

  const resourceType = getResourceTypeForFile(file);
  if (!resourceType) {
    throw new Error(
      "Unsupported file type. Allowed: JPG, PNG, WebP, GIF, MP4, MOV, WebM, MP3, WAV and OGG.",
    );
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File is too large. The maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.`);
  }

  const endpointType = resourceType === "image" ? "image" : "video";
  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${endpointType}/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "media-link-hub");
  formData.append("tags", "media-link-hub");

  return await new Promise<CloudinaryUploadResult>((resolve, reject) => {
    if (options.signal?.aborted) {
      reject(new DOMException("Upload cancelled", "AbortError"));
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);

    const onAbort = () => xhr.abort();
    options.signal?.addEventListener("abort", onAbort, { once: true });
    const cleanup = () => options.signal?.removeEventListener("abort", onAbort);

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && event.total > 0) {
        options.onProgress?.(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      }
    });

    xhr.addEventListener("load", () => {
      cleanup();
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(xhr.responseText) as Record<string, unknown>;
      } catch {
        // Non-JSON response — fall through to the status-based error below.
      }

      const secureUrl = typeof data.secure_url === "string" ? data.secure_url : undefined;
      if (xhr.status >= 200 && xhr.status < 300 && secureUrl) {
        const numeric = (key: string): number | undefined => {
          const value = data[key];
          return typeof value === "number" && Number.isFinite(value) ? value : undefined;
        };
        resolve({
          secureUrl,
          publicId: typeof data.public_id === "string" ? data.public_id : "",
          resourceType: typeof data.resource_type === "string" ? data.resource_type : "image",
          format: typeof data.format === "string" ? data.format : undefined,
          width: numeric("width"),
          height: numeric("height"),
          duration: numeric("duration"),
          bytes: numeric("bytes") ?? file.size,
          originalFilename:
            typeof data.original_filename === "string" ? data.original_filename : undefined,
        });
        return;
      }

      const rawError = data.error as { message?: string } | undefined;
      reject(
        new Error(friendlyUploadError(rawError?.message ?? `Upload failed with status ${xhr.status}.`)),
      );
    });

    xhr.addEventListener("error", () => {
      cleanup();
      reject(
        new Error("Network error while uploading to Cloudinary. Check your connection and try again."),
      );
    });
    xhr.addEventListener("abort", () => {
      cleanup();
      reject(new DOMException("Upload cancelled", "AbortError"));
    });

    xhr.send(formData);
  });
}

/**
 * Poster/thumbnail URL for a video (or the raw URL for images).
 * Cloudinary serves a JPG preview by swapping the video extension for .jpg.
 */
export function getVideoPosterUrl(cloudinaryUrl: string): string {
  return cloudinaryUrl.replace(/\.[a-z0-9]+$/i, ".jpg");
}
