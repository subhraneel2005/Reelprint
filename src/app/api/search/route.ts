import { searchLibrary, type SearchMode } from "@/lib/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const modeParam = url.searchParams.get("mode") ?? "hybrid";
  const mode: SearchMode = ["hybrid", "keyword", "vector"].includes(modeParam)
    ? (modeParam as SearchMode)
    : "hybrid";
  const platform = url.searchParams.get("platform") ?? undefined;
  const rerankResults = url.searchParams.get("rerank") !== "0";
  try {
    const result = await searchLibrary({ query, mode, platform, rerankResults });
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
