/**
 * Central place for reading public environment configuration.
 *
 * NOTE: In Next.js client bundles, environment variables MUST be accessed
 * statically (e.g. process.env.NEXT_PUBLIC_...) so that the bundler can
 * inline their values at build time. Dynamic lookup like process.env[name]
 * returns undefined in the browser!
 */

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

/** Trims value and strips any accidental surrounding quotes (e.g. "Mwijay Personal"). */
function clean(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().replace(/^["']|["']$/g, "").trim();
  return trimmed || undefined;
}

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

/** Throws a descriptive error when Cloudinary env vars are missing. */
export function getCloudinaryConfig(): CloudinaryConfig {
  const cloudName = clean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
  const uploadPreset = clean(process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
  if (!cloudName || !uploadPreset) {
    throw new ConfigError(
      "Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your environment variables.",
    );
  }
  return { cloudName, uploadPreset };
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    clean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) &&
    clean(process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET)
  );
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
  const apiKey = clean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  const projectId = clean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  const appId = clean(process.env.NEXT_PUBLIC_FIREBASE_APP_ID);
  if (!apiKey || !projectId || !appId) {
    throw new ConfigError(
      "Firebase is not configured. Set the NEXT_PUBLIC_FIREBASE_* variables in your environment variables.",
    );
  }
  return {
    apiKey,
    projectId,
    appId,
    authDomain: clean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) ?? `${projectId}.firebaseapp.com`,
    storageBucket: clean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) ?? `${projectId}.appspot.com`,
    messagingSenderId: clean(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) ?? "",
    measurementId: clean(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID),
  };
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    clean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) &&
    clean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) &&
    clean(process.env.NEXT_PUBLIC_FIREBASE_APP_ID)
  );
}

/**
 * Absolute base URL used for canonical links, Open Graph URLs and share links.
 * Priority: NEXT_PUBLIC_SITE_URL → Vercel production URL → localhost.
 */
export function getSiteUrl(): string {
  const explicit = clean(process.env.NEXT_PUBLIC_SITE_URL);
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercelUrl = clean(process.env.VERCEL_PROJECT_PRODUCTION_URL) ?? clean(process.env.VERCEL_URL);
  if (vercelUrl) return `https://${vercelUrl.replace(/\/+$/, "")}`;
  return "http://localhost:3000";
}
