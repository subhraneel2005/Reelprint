import { searchShorts } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();
  if (!query) return Response.json({ error: "Add a search term" }, { status: 400 });
  if (!process.env.YOUTUBE_API_KEY) {
    return Response.json(
      { error: "YOUTUBE_API_KEY is not set. Add it to .env.local to enable live discovery." },
      { status: 400 },
    );
  }
  const days = Math.min(Math.max(Number(url.searchParams.get("days") ?? 180), 7), 365);
  const minViews = Math.max(Number(url.searchParams.get("minViews") ?? 2000), 0);
  try {
    const hits = await searchShorts({ query, days, minViews, maxResults: 25 });
    return Response.json({ hits, query });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
