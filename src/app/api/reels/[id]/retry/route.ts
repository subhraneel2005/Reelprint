import { after } from "next/server";
import { retryAnalysis, runPreparedPipeline } from "@/lib/ingest";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const result = await retryAnalysis(id);
    after(async () => {
      await runPreparedPipeline(result.reelId, result.jobId, result.steps, result.full).catch(
        (error) => {
          console.error("Retry pipeline failed", error);
        },
      );
    });
    return Response.json({ jobId: result.jobId });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
