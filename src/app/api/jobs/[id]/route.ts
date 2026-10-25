import { getJob, updateJob, updateReel } from "@/lib/db";
import { isJobStale } from "@/lib/ingest";
import type { JobStep } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let job = await getJob(id);
  if (!job) return Response.json({ error: "Job not found" }, { status: 404 });

  if (isJobStale(job)) {
    const message = "The analysis worker stopped responding. Retry to start it again.";
    const steps = job.steps.map((step): JobStep => {
      if (step.status === "running") return { ...step, status: "error", detail: message };
      if (step.status === "pending") return { ...step, status: "skipped" };
      return step;
    });
    await updateReel(job.reel_id, { status: "error", error: message });
    await updateJob(job.id, { status: "error", steps, error: message });
    job = (await getJob(id)) ?? job;
  }

  return Response.json(job);
}
