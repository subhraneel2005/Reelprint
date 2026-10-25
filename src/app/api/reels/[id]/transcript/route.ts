import { after } from "next/server";
import { z } from "zod";
import { resumeWithTranscript, runPreparedPipeline } from "@/lib/ingest";

export const runtime = "nodejs";
export const maxDuration = 300;

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
    const result = await resumeWithTranscript(id, parsed.data.transcript);
    after(async () => {
      await runPreparedPipeline(result.reelId, result.jobId, result.steps, result.full).catch(
        (error) => {
          console.error("Transcript pipeline failed", error);
        },
      );
    });
    return Response.json({ jobId: result.jobId });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
