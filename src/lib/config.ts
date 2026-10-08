/**
 * Central place for reading public environment configuration.
 *
 * Only NEXT_PUBLIC_* variables are read here, so this module is safe to import
 * from client components AND server components. The Cloudinary API secret is
 * intentionally never referenced anywhere in this app — uploads use an
 * UNSIGNED upload preset.
 */

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

/** Reads a trimmed env var, returning undefined when empty. */
function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

/** Throws a descriptive error when Cloudinary env vars are missing. */
export function getCloudinaryConfig(): CloudinaryConfig {
  const cloudName = env("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
  const uploadPreset = env("NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET");
  if (!cloudName || !uploadPreset) {
    throw new ConfigError(
      "Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local (see README).",
    );
  }
  return { cloudName, uploadPreset };
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(env("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME") && env("NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"));
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

/** Throws a descriptive error when Firebase env vars are missing. */
export function getFirebaseConfig(): FirebaseConfig {
  const apiKey = env("NEXT_PUBLIC_FIREBASE_API_KEY");
  const projectId = env("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  const appId = env("NEXT_PUBLIC_FIREBASE_APP_ID");
  if (!apiKey || !projectId || !appId) {
    throw new ConfigError(
      "Firebase is not configured. Set the NEXT_PUBLIC_FIREBASE_* variables in .env.local (see README).",
    );
  }
  return {
    apiKey,
    projectId,
    appId,
    authDomain: env("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN") ?? `${projectId}.firebaseapp.com`,
    storageBucket: env("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET") ?? `${projectId}.appspot.com`,
    messagingSenderId: env("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID") ?? "",
    measurementId: env("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID"),
  };
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    env("NEXT_PUBLIC_FIREBASE_API_KEY") && env("NEXT_PUBLIC_FIREBASE_PROJECT_ID") && env("NEXT_PUBLIC_FIREBASE_APP_ID"),
  );
}

/**
 * Absolute base URL used for canonical links, Open Graph URLs and share links.
 * Priority: NEXT_PUBLIC_SITE_URL → Vercel production URL → localhost.
 */
export function getSiteUrl(): string {
  const explicit = env("NEXT_PUBLIC_SITE_URL");
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercelUrl = env("VERCEL_PROJECT_PRODUCTION_URL") ?? env("VERCEL_URL");
  if (vercelUrl) return `https://${vercelUrl.replace(/\/+$/, "")}`;
  return "http://localhost:3000";
}
