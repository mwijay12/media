import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getFirebaseConfig } from "./config";

/**
 * Firebase client SDK bootstrap (browser + Node).
 * Only used on the client for writes/reads; server components fetch records
 * through the Firestore REST API instead (see `firestore-server.ts`).
 */

export function getFirebaseApp(): FirebaseApp {
  return getApps().length > 0 ? getApp() : initializeApp(getFirebaseConfig());
}

export function getFirebaseDb(): Firestore {
  return getFirestore(getFirebaseApp());
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

/** Convert Firestore errors into user-friendly guidance. */
export function describeFirestoreError(error: unknown): string {
  const code = (error as { code?: string } | null)?.code ?? "";
  if (code.includes("permission-denied")) {
    return "Firestore denied the request. Publish the included firestore.rules file (public read + create for media_items) — see README.";
  }
  if (code.includes("not-found")) {
    return "Firestore database not found. Create a Cloud Firestore database (Native mode) in your Firebase project — see README.";
  }
  if (code.includes("unavailable") || code.includes("failed-precondition") || code.includes("network")) {
    return "Could not reach Firestore right now. Check your connection and Firebase project settings.";
  }
  if (code.includes("invalid-argument")) {
    return "Firestore rejected the request as invalid. Double-check your Firebase config values in .env.local.";
  }
  return error instanceof Error ? error.message : "Unexpected Firestore error.";
}
