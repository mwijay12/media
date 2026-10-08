import {
  addDoc,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { describeFirestoreError, getFirebaseDb } from "./firebase";
import type { MediaItem, NewMediaItem, ResourceType } from "./types";

const COLLECTION_NAME = "media_items";

/**
 * Persist a new upload's metadata to Firestore.
 * Resolves with the generated document id, which becomes the shareable
 * `/media/[id]` URL.
 */
export async function saveMediaItem(input: NewMediaItem): Promise<string> {
  const db = getFirebaseDb();
  const ref = await addDoc(collection(db, COLLECTION_NAME), {
    cloudinaryUrl: input.cloudinaryUrl,
    resourceType: input.resourceType,
    title: input.title,
    description: input.description,
    fileName: input.fileName,
    fileSize: input.fileSize,
    ...(input.userId ? { userId: input.userId } : {}),
    ...(input.userEmail ? { userEmail: input.userEmail } : {}),
    ...(input.userName ? { userName: input.userName } : {}),
    ...(input.format ? { format: input.format } : {}),
    ...(typeof input.width === "number" ? { width: input.width } : {}),
    ...(typeof input.height === "number" ? { height: input.height } : {}),
    ...(typeof input.duration === "number" ? { duration: input.duration } : {}),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Map a Firestore document into the client-friendly MediaItem shape. */
function mapDocument(id: string, data: DocumentData): MediaItem {
  const createdAt = data.createdAt as { toMillis?: () => number } | null | undefined;
  const resourceType: ResourceType =
    data.resourceType === "video" || data.resourceType === "audio" ? data.resourceType : "image";
  return {
    id,
    cloudinaryUrl: typeof data.cloudinaryUrl === "string" ? data.cloudinaryUrl : "",
    resourceType,
    title: typeof data.title === "string" ? data.title : "",
    description: typeof data.description === "string" ? data.description : "",
    fileName: typeof data.fileName === "string" ? data.fileName : "",
    fileSize: typeof data.fileSize === "number" ? data.fileSize : 0,
    format: typeof data.format === "string" ? data.format : undefined,
    width: typeof data.width === "number" ? data.width : undefined,
    height: typeof data.height === "number" ? data.height : undefined,
    duration: typeof data.duration === "number" ? data.duration : undefined,
    userId: typeof data.userId === "string" ? data.userId : undefined,
    userEmail: typeof data.userEmail === "string" ? data.userEmail : undefined,
    userName: typeof data.userName === "string" ? data.userName : undefined,
    createdAtMs: typeof createdAt?.toMillis === "function" ? createdAt.toMillis() : undefined,
  };
}

export interface MediaLibraryHandlers {
  next: (items: MediaItem[]) => void;
  error: (message: string) => void;
}

/**
 * Client-side single-record fetch (browser SDK). Used as a fallback on the
 * share page when the server-side REST fetch misses — e.g. API-key HTTP
 * restrictions that block server IPs, or a record still propagating.
 * Works for guests too: reads are public per firestore.rules.
 */
export async function getMediaItemByIdClient(id: string): Promise<MediaItem | null> {
  if (!id || !/^[A-Za-z0-9_-]{1,150}$/.test(id)) return null;
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, COLLECTION_NAME, id));
  if (!snap.exists()) return null;
  return mapDocument(snap.id, snap.data());
}

/**
 * Real-time subscription to the media library, newest first.
 * Returns an unsubscribe function for cleanup in useEffect.
 */
export function subscribeToMediaLibrary(
  handlers: MediaLibraryHandlers,
  maxItems = 120,
): () => void {
  const db = getFirebaseDb();
  const mediaQuery = query(
    collection(db, COLLECTION_NAME),
    orderBy("createdAt", "desc"),
    limit(maxItems),
  );
  return onSnapshot(
    mediaQuery,
    (snapshot) => handlers.next(snapshot.docs.map((doc) => mapDocument(doc.id, doc.data()))),
    (error) => handlers.error(describeFirestoreError(error)),
  );
}
