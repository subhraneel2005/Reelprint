import { SearchExplorer } from "@/components/SearchExplorer";
import { libraryStats, listReels } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; platform?: string }>;
}) {
  const params = await searchParams;
  const stats = await libraryStats();
  const reels = await listReels(80);
  return (
    <SearchExplorer
      initialReels={reels}
      initialQuery={params.q ?? ""}
      initialPlatform={params.platform ?? ""}
      counts={{ total: stats.total, ready: stats.ready }}
    />
  );
}
