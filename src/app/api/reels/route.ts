import { listReels } from "@/lib/db";
import type { ReelStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);
  const status = url.searchParams.get("status") as ReelStatus | null;
  const reels = listReels(Number.isFinite(limit) ? limit : 50, status ?? undefined);
  return Response.json({ reels });
}
