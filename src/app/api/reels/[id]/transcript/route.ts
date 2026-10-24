import { z } from "zod";
import { resumeWithTranscript } from "@/lib/ingest";

export const runtime = "nodejs";

const bodySchema = z.object({ transcript: z.string().trim().min(10).max(50_000) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Send JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Paste at least a few sentences" }, { status: 400 });
  }
  try {
    return Response.json(await resumeWithTranscript(id, parsed.data.transcript));
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
