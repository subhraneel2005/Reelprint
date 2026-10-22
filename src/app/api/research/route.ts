import { z } from "zod";
import { reverseEngineer } from "@/lib/research";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

const bodySchema = z.object({ reelId: z.string().min(1), refresh: z.boolean().optional() });

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Send JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return Response.json({ error: "reelId is required" }, { status: 400 });
  try {
    const result = await reverseEngineer(parsed.data.reelId, parsed.data.refresh ?? false);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reelId = url.searchParams.get("reelId");
  if (!reelId) return Response.json({ error: "reelId is required" }, { status: 400 });
  try {
    const result = await reverseEngineer(reelId, url.searchParams.get("refresh") === "1");
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
