"use client";

import { useRouter } from "next/navigation";
import { JobProgress } from "./JobProgress";

export function LiveJob({ jobId, label }: { jobId: string; label: string }) {
  const router = useRouter();
  return (
    <div className="rounded-[24px] border border-border/70 bg-card/60 p-3">
      <p className="mono-label mb-2">{label}</p>
      <JobProgress jobId={jobId} onDone={() => router.refresh()} onError={() => router.refresh()} />
    </div>
  );
}
