import Link from "next/link";
import type { Metadata } from "next";
import { UploadZone } from "@/components/UploadZone";
import { Button } from "@/components/ui/liquid-glass-button";
import { GlobeIcon, LinkIcon, ZapIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Upload & share media with one link",
  description:
    "Upload an image, video or audio file to Cloudinary and instantly get a shareable MediaLink Hub page.",
};

const STEPS = [
  {
    icon: ZapIcon,
    title: "1. Upload",
    text: "Drag & drop an image, video or audio file — up to 100 MB, with live progress.",
  },
  {
    icon: LinkIcon,
    title: "2. Get your link",
    text: "We store the file on Cloudinary and save a record in Firestore. You get /media/[id].",
  },
  {
    icon: GlobeIcon,
    title: "3. Share anywhere",
    text: "Anyone with the link sees a fast page with Open Graph previews — no login needed.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-12">
      <section className="grid items-start gap-8 lg:grid-cols-[1.05fr_1fr]">
        <div className="flex flex-col gap-5 pt-2">
          <p className="inline-flex w-fit items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <ZapIcon className="h-3.5 w-3.5" /> Free · No login · Instant links
          </p>
          <h1 className="text-3xl font-bold leading-[1.05] tracking-tight text-zinc-900 min-[420px]:text-4xl sm:text-5xl dark:text-zinc-50">
            Upload media.
            <br />
            <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
              Get a shareable link.
            </span>
          </h1>
          <p className="max-w-xl text-base text-zinc-600 sm:text-lg dark:text-zinc-300">
            Drop an image, video or audio file and instantly get a page people can
            open, preview and download — powered by Cloudinary &amp; Firebase.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Button variant="cool" asChild>
              <Link href="/library">Browse the library →</Link>
            </Button>
            <span className="text-zinc-500 dark:text-zinc-400">
              JPG · PNG · WebP · GIF · MP4 · MOV · WebM · MP3 · WAV · OGG
            </span>
          </div>

          <ol className="mt-2 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {STEPS.map((step) => (
              <li
                key={step.title}
                className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <step.icon className="h-5 w-5 text-indigo-500" />
                <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {step.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            New upload
          </h2>
          <div className="mt-3">
            <UploadZone />
          </div>
        </div>
      </section>
    </div>
  );
}
