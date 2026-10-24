import { rm } from "node:fs/promises";
import { join } from "node:path";
import { deleteReel, getReel, latestJobForReel } from "@/lib/db";
import { MEDIA_DIR } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reel = await getReel(id);
  if (!reel) return Response.json({ error: "Reel not found" }, { status: 404 });
  return Response.json({ reel, job: await latestJobForReel(id) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reel = await getReel(id);
  if (!reel) return Response.json({ error: "Reel not found" }, { status: 404 });
  await deleteReel(id);
  await rm(join(MEDIA_DIR, `${id}.jpg`), { force: true });
  return Response.json({ ok: true });
}
