---
name: firebase
description: Use when working with this app's Firebase backend (project mwijay-studio) — Firestore schema, security rules, Auth config, Cloudinary upload flow, Firebase MCP/CLI usage, and Firebase error diagnosis.
---

# Firebase — MediaLink Hub (`mwijay-studio`)

Next.js + Cloudinary + Firebase app. Client SDK for reads/writes in the
browser; Firestore REST (`?key=<public api key>`) for server components.

## Project facts

- Project ID: `mwijay-studio` (pinned in `.firebaserc`, `firebase.json` maps
  `firestore.rules`)
- Auth: Google provider must be **Enabled** (Console → Authentication →
  Sign-in method). Authorized domains must include `localhost` (dev) and the
  Vercel production domain (e.g. `media-nine-puce.vercel.app`).
- Env (local `.env.local`, Vercel env vars — same values, redeploy after
  Vercel changes since `NEXT_PUBLIC_*` is inlined at build):
  `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`,
  `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`,
  `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`.
- Public app URL override: `NEXT_PUBLIC_SITE_URL` (OG links, share URLs).

## Firestore

- Collection: `media_items`. Document fields written by `saveMediaItem`
  (`src/lib/firestore.ts`): `cloudinaryUrl` (string, required),
  `resourceType` (`image|video|audio`), `title`, `description`, `fileName`,
  `fileSize`, optional `format/width/height/duration`,
  optional `userId/userEmail/userName`, `createdAt` (serverTimestamp).
- Single source of truth for field mapping: `mapDocument` (client) and
  `mapRestDocument` (server REST) — keep both in sync when adding fields.
- Server read (`src/lib/firestore-server.ts`) MUST include
  `?key=<NEXT_PUBLIC_FIREBASE_API_KEY>` — without it every request fails and
  `/media/[id]` + OG metadata fall through to "not found".

## Security rules — DO NOT lock to authenticated users

This app intentionally supports **guest uploads** and public share pages.
Use the repo's `firestore.rules` verbatim (public `read`, validated `create`,
no `update`/`delete`). Do NOT apply the Firebase docs' generic
`allow read, write: if request.auth != null;` — it breaks guest uploads and
public link previews. Publish via Console Rules tab (paste + Publish) or
`firebase deploy --only firestore:rules` (requires `firebase login`).

## Firebase MCP / CLI (agentic access)

- MCP server configured in project `opencode.json` (official
  `firebase-tools mcp`). Uses the Firebase CLI credentials of the machine —
  run `npx -y firebase-tools@latest login` once if tools report unauthenticated.
- Useful CLI: `projects:list`, `apps:sdkconfig`, `deploy --only
  firestore:rules`, `emulators:start` (Firestore emulator for local rule tests).

## Error diagnosis cheat-sheet

- REST `403 SERVICE_DISABLED` → no Firestore DB in project: create one
  (Native mode) in Console; wait minutes for propagation.
- REST/SDK `PERMISSION_DENIED` → rules still default-deny: publish
  `firestore.rules`.
- `auth/unauthorized-domain` → add `window.location.hostname` to
  Authentication → Settings → Authorized domains (never use `127.0.0.1`, use
  `localhost`).
- `auth/internal-error` / popup failures → app auto-falls-back to
  `signInWithRedirect` (completed by `getRedirectResult` in `AuthContext`).
- `auth/api-key-not-valid` → env values don't match Console: fix
  `.env.local` (restart dev) + Vercel env (redeploy).
- New `NEXT_PUBLIC_*` values need dev-server restart locally.

## Upload flow (do not break)

`UploadZone` → unsigned Cloudinary upload (preset from env, folder
`media-link-hub`) → `saveMediaItem` → shareable `/media/[id]`. Cloudinary
stores audio under its `video` type — the app keeps its own logical `audio`
type via `getResourceTypeForFile`; preserve this when touching upload code.
