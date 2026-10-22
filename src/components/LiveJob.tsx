"use client";

import { useRouter } from "next/navigation";
import { JobProgress } from "./JobProgress";

export function LiveJob({ jobId, label }: { jobId: string; label: string }) {
  const router = useRouter();
  return (
    <div className="border border-line bg-surface p-3">
      <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">{label}</p>
      <JobProgress jobId={jobId} onDone={() => router.refresh()} onError={() => router.refresh()} />
    </div>
  );
}
