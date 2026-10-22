import { SearchExplorer } from "@/components/SearchExplorer";
import { libraryStats, listReels } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; platform?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const stats = libraryStats();
  const reels = listReels(80);
  return (
    <SearchExplorer
      initialReels={reels}
      topics={stats.topics}
      initialQuery={params.q ?? ""}
      initialPlatform={params.platform ?? ""}
      initialMode={params.mode ?? "hybrid"}
      counts={{ total: stats.total, ready: stats.ready }}
    />
  );
}
