import { cache } from "react";
import { isFirebaseConfigured } from "./config";
import type { MediaItem, ResourceType } from "./types";

/**
 * Server-side media fetching for React Server Components.
 *
 * Uses the Firestore REST API via plain `fetch` instead of the Firebase SDK so
 * the server bundle stays lean and behaves predictably inside RSC. Documents
 * are readable without auth thanks to the public-read rule in firestore.rules.
 */

type FirestoreFields = Record<string, Record<string, unknown>>;

function readString(fields: FirestoreFields | undefined, key: string): string {
  const value = fields?.[key]?.stringValue;
  return typeof value === "string" ? value : "";
}

function readNumber(fields: FirestoreFields | undefined, key: string): number | undefined {
  const raw = fields?.[key];
  if (!raw) return undefined;
  if (typeof raw.integerValue === "string") {
    const parsed = Number(raw.integerValue);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (typeof raw.doubleValue === "number") return raw.doubleValue;
  return undefined;
}

function readTimestampMs(fields: FirestoreFields | undefined, key: string): number | undefined {
  const timestamp = fields?.[key]?.timestampValue;
  if (!timestamp || typeof timestamp !== "string") return undefined;
  const ms = Date.parse(timestamp);
  return Number.isFinite(ms) ? ms : undefined;
}

function mapRestDocument(name: string, fields: FirestoreFields): MediaItem | null {
  const cloudinaryUrl = readString(fields, "cloudinaryUrl");
  if (!cloudinaryUrl) return null;

  const id = typeof name === "string" ? (name.split("/").pop() ?? "") : "";
  const rawType = readString(fields, "resourceType");
  const resourceType: ResourceType =
    rawType === "video" ? "video" : rawType === "audio" ? "audio" : "image";

  return {
    id,
    cloudinaryUrl,
    resourceType,
    title: readString(fields, "title"),
    description: readString(fields, "description"),
    fileName: readString(fields, "fileName"),
    fileSize: readNumber(fields, "fileSize") ?? 0,
    format: readString(fields, "format") || undefined,
    width: readNumber(fields, "width"),
    height: readNumber(fields, "height"),
    duration: readNumber(fields, "duration"),
    userId: readString(fields, "userId") || undefined,
    userEmail: readString(fields, "userEmail") || undefined,
    userName: readString(fields, "userName") || undefined,
    createdAtMs: readTimestampMs(fields, "createdAt"),
  };
}

/**
 * Fetch a single media record by id (memoized per request via React `cache`,
 * so generateMetadata() and the page share one fetch).
 */
export const getMediaItemById = cache(async (id: string): Promise<MediaItem | null> => {
  // Basic id sanity check (Firestore auto-ids use [A-Za-z0-9_-]) — also
  // prevents URL injection into the REST path.
  if (!isFirebaseConfigured() || !id || !/^[A-Za-z0-9_-]{1,150}$/.test(id)) {
    return null;
  }

  const rawProject = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";
  const projectId = rawProject.trim().replace(/^["']|["']$/g, "").trim();
  if (!projectId) return null;

  const url =
    `https://firestore.googleapis.com/v1/projects/${projectId}` +
    `/databases/(default)/documents/media_items/${id}`;

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (response.status === 404) return null;
    if (!response.ok) {
      console.error(`Firestore REST error ${response.status} for media item ${id}`);
      return null;
    }
    const payload = (await response.json()) as {
      name?: string;
      fields?: FirestoreFields;
    };
    if (!payload.fields) return null;
    return mapRestDocument(payload.name ?? "", payload.fields);
  } catch (error) {
    console.error(`Failed to fetch media item ${id}:`, error);
    return null;
  }
});
