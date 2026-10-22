import { rm } from "node:fs/promises";
import { join } from "node:path";
import { getDb, getReel, latestJobForReel } from "@/lib/db";
import { MEDIA_DIR } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reel = getReel(id);
  if (!reel) return Response.json({ error: "Reel not found" }, { status: 404 });
  return Response.json({ reel, job: latestJobForReel(id) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reel = getReel(id);
  if (!reel) return Response.json({ error: "Reel not found" }, { status: 404 });
  getDb().prepare("DELETE FROM reels WHERE id = ?").run(id);
  getDb().prepare("DELETE FROM jobs WHERE reel_id = ?").run(id);
  getDb().prepare("DELETE FROM research WHERE reel_id = ?").run(id);
  await rm(join(MEDIA_DIR, `${id}.jpg`), { force: true });
  return Response.json({ ok: true });
}
