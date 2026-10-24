import { DiscoverExplorer } from "@/components/DiscoverExplorer";
import { aiStatus } from "@/lib/ai";
import { libraryStats } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const status = aiStatus();
  const stats = await libraryStats();
  return (
    <DiscoverExplorer
      initialQuery={params.q ?? ""}
      topics={stats.topics}
      youtubeReady={status.youtube}
    />
  );
}
