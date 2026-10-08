/**
 * Shared media types used by both client and server code.
 */

/** Logical media type. Note: Cloudinary stores audio under its `video` type —
 *  we keep our own `audio` type for correct rendering. */
export type ResourceType = "image" | "video" | "audio";

/** A media record as stored in the Firestore collection `media_items`. */
export interface MediaItem {
  id: string;
  /** Fully-qualified Cloudinary delivery URL (https, secure). */
  cloudinaryUrl: string;
  resourceType: ResourceType;
  title: string;
  description: string;
  fileName: string;
  fileSize: number;
  /** Cloudinary format, e.g. "jpg" | "png" | "mp4" | "mp3". */
  format?: string;
  width?: number;
  height?: number;
  /** Duration in seconds (video/audio only). */
  duration?: number;
  /** Optional authenticated uploader metadata */
  userId?: string;
  userEmail?: string;
  userName?: string;
  /** Creation time as epoch milliseconds (client-friendly form of the
   *  Firestore `createdAt` Timestamp). */
  createdAtMs?: number;
}

/** Payload written to Firestore right after a successful Cloudinary upload. */
export interface NewMediaItem {
  cloudinaryUrl: string;
  resourceType: ResourceType;
  title: string;
  description: string;
  fileName: string;
  fileSize: number;
  format?: string;
  width?: number;
  height?: number;
  duration?: number;
  userId?: string;
  userEmail?: string;
  userName?: string;
}

/** Sort options for the library grid. */
export type MediaSort = "newest" | "oldest" | "largest" | "title";
