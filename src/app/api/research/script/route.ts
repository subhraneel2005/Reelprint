import { z } from "zod";
import { generateIdeaScript } from "@/lib/research";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

const bodySchema = z.object({
  reelId: z.string().min(1),
  ideaIndex: z.number().int().min(0).max(50),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Send JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "reelId and ideaIndex are required" }, { status: 400 });
  }

  try {
    const result = await generateIdeaScript(parsed.data.reelId, parsed.data.ideaIndex);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
