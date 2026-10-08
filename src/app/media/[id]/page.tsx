import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMediaItemById } from "@/lib/firestore-server";
import { getSiteUrl } from "@/lib/config";
import { MediaViewer } from "@/components/MediaViewer";
import { ChevronLeftIcon } from "@/components/icons";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const item = await getMediaItemById(id);
  if (!item) return { title: "Not found" };

  const title = item.title || item.fileName;
  const description =
    item.description || `${item.fileName} — shared via MediaLink Hub.`;
  const siteUrl = getSiteUrl();

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/media/${item.id}`,
      type: "website",
      images: item.resourceType === "audio" ? [] : [{ url: item.cloudinaryUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: item.resourceType === "audio" ? [] : [item.cloudinaryUrl],
    },
  };
}

export default async function MediaPage({ params }: PageProps) {
  const { id } = await params;
  const item = await getMediaItemById(id);
  if (!item) notFound();

  const shareUrl = `${getSiteUrl()}/media/${item.id}`;

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Back">
        <Link
          href="/library"
          className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ChevronLeftIcon className="h-4 w-4" /> Back to library
        </Link>
      </nav>
      <MediaViewer item={item} shareUrl={shareUrl} />
    </div>
  );
}
