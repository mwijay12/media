"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import {
  MAX_FILE_SIZE_BYTES,
  getResourceTypeForFile,
  uploadToCloudinary,
  ACCEPTED_EXTENSIONS,
} from "@/lib/cloudinary";
import { saveMediaItem } from "@/lib/firestore";
import { formatBytes } from "@/lib/format";
import { AlertIcon, CheckIcon, CopyIcon, UploadIcon } from "@/components/icons";
import { Button, LiquidButton } from "@/components/ui/liquid-glass-button";
import { inputClass, labelClass } from "@/components/ui-classes";
import { useAuth } from "@/context/AuthContext";

type Status = "idle" | "uploading" | "done" | "error";

/**
 * Drag-and-drop uploader.
 * Flow: pick file → upload to Cloudinary (unsigned preset, with progress)
 * → persist metadata in Firestore → show the shareable /media/[id] link.
 */
export function UploadZone() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [mediaId, setMediaId] = useState("");
  const [cloudinaryUrl, setCloudinaryUrl] = useState("");
  const [copied, setCopied] = useState<"share" | "direct" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const shareUrl =
    mediaId && typeof window !== "undefined" ? `${window.location.origin}/media/${mediaId}` : "";
  const busy = status === "uploading";

  const pick = useCallback((f: File | undefined) => {
    if (!f) return;
    if (!getResourceTypeForFile(f)) {
      setError("Unsupported file type. Allowed: JPG, PNG, WebP, GIF, MP4, MOV, WebM, MP3, WAV and OGG.");
      setStatus("error");
      return;
    }
    if (f.size > MAX_FILE_SIZE_BYTES) {
      setError(`File is too large. The maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.`);
      setStatus("error");
      return;
    }
    setFile(f);
    setError("");
    setStatus("idle");
  }, []);

  function reset() {
    setFile(null);
    setTitle("");
    setDescription("");
    setStatus("idle");
    setProgress(0);
    setStatusText("");
    setError("");
    setMediaId("");
    setCloudinaryUrl("");
    setCopied(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function upload() {
    if (!file || busy) return;
    setStatus("uploading");
    setProgress(0);
    setStatusText("Uploading to Cloudinary…");
    setError("");

    try {
      const result = await uploadToCloudinary(file, {
        onProgress: (pct) => {
          setProgress(pct);
          setStatusText(pct >= 100 ? "Finalizing share link…" : `Uploading to Cloudinary… ${pct}%`);
        },
      });

      setStatusText("Saving media record…");
      // Cloudinary stores audio under its "video" type — use the original
      // file's logical type so audio renders as audio, not video.
      const logicalType =
        getResourceTypeForFile(file) ??
        (result.resourceType === "video" ? "video" : "image");
      const id = await saveMediaItem({
        cloudinaryUrl: result.secureUrl,
        resourceType: logicalType,
        title: title.trim() || file.name,
        description: description.trim(),
        fileName: file.name,
        fileSize: result.bytes,
        format: result.format,
        width: result.width,
        height: result.height,
        duration: result.duration,
        userId: user?.uid,
        userEmail: user?.email || undefined,
        userName: user?.displayName || undefined,
      });

      setCloudinaryUrl(result.secureUrl);
      setMediaId(id);
      setStatus("done");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setStatus("idle");
        setStatusText("");
        return;
      }
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  async function copy(text: string, which: "share" | "direct") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard unavailable — user can still select the text manually.
    }
  }

  if (status === "done" && mediaId) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/40">
        <p className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
          <CheckIcon className="h-5 w-5" /> Upload complete — your link is ready!
        </p>

        <div className="flex flex-col gap-1.5">
          <span className={labelClass}>Shareable page (with Open Graph tags for AI &amp; Social previews)</span>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input readOnly value={shareUrl} className={`${inputClass} font-mono text-xs`} />
            <LiquidButton
              type="button"
              size="sm"
              onClick={() => copy(shareUrl, "share")}
              className="w-full sm:w-auto"
            >
              {copied === "share" ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
              {copied === "share" ? "Copied" : "Copy"}
            </LiquidButton>
          </div>
          <Button variant="cool" size="sm" asChild className="mt-1 w-fit">
            <Link href={`/media/${mediaId}`}>Open your media page →</Link>
          </Button>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={labelClass}>Direct Cloudinary file URL</span>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input readOnly value={cloudinaryUrl} className={`${inputClass} font-mono text-xs`} />
            <LiquidButton
              type="button"
              size="sm"
              onClick={() => copy(cloudinaryUrl, "direct")}
              className="w-full sm:w-auto"
            >
              {copied === "direct" ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
              {copied === "direct" ? "Copied" : "Copy"}
            </LiquidButton>
          </div>
        </div>

        <LiquidButton type="button" size="default" onClick={reset} className="self-start">
          <UploadIcon className="h-4 w-4" /> Upload another file
        </LiquidButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        role="button"
        tabIndex={0}
        aria-label="Choose a file to upload"
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !busy) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!busy) pick(e.dataTransfer.files[0]);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-10 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:px-6 sm:py-14 ${
          dragging
            ? "scale-[1.01] border-indigo-500 bg-indigo-500/5"
            : "border-zinc-300 bg-zinc-50 hover:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-indigo-500"
        }`}
      >
        <UploadIcon className="h-10 w-10 text-zinc-400 dark:text-zinc-500" />
        {file ? (
          <div className="mt-3 flex flex-col items-center gap-1">
            <p className="font-medium text-zinc-900 dark:text-zinc-100">{file.name}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatBytes(file.size)} · {getResourceTypeForFile(file)}
            </p>
          </div>
        ) : (
          <div className="mt-3 flex flex-col items-center gap-1">
            <p className="font-medium text-zinc-900 dark:text-zinc-100">
              Drag &amp; drop your media here, or <span className="text-indigo-500">browse</span>
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Images (JPG, PNG, WebP, GIF), Videos (MP4, MOV, WebM), Audio (MP3, WAV, OGG) up to 100 MB
            </p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          hidden
          accept={ACCEPTED_EXTENSIONS.join(",")}
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>

      {file && (
        <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <label htmlFor="upload-title" className={labelClass}>
              Title
            </label>
            <input
              id="upload-title"
              type="text"
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={busy}
              className={`${inputClass} mt-1.5`}
            />
          </div>
          <div>
            <label htmlFor="upload-description" className={labelClass}>
              Description
            </label>
            <textarea
              id="upload-description"
              rows={3}
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={busy}
              className={`${inputClass} mt-1.5`}
            />
          </div>

          {busy && (
            <div className="flex flex-col gap-1.5">
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                aria-label="Upload progress"
                className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
              >
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">{statusText}</p>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            {user ? (
              <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Uploading as {user.displayName || user.email}
              </span>
            ) : (
              <span>Uploading as guest</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <LiquidButton type="button" size="lg" onClick={upload} disabled={busy} className="w-full sm:w-auto">
              <UploadIcon className="h-4 w-4" />
              {busy ? statusText || "Processing…" : "Upload"}
            </LiquidButton>
            {!busy && (
              <button
                type="button"
                onClick={reset}
                className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {status === "error" && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
        >
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
