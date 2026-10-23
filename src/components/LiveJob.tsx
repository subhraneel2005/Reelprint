"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { JobProgress } from "./JobProgress";

export function LiveJob({ jobId, label }: { jobId: string; label: string }) {
  const router = useRouter();

  return (
    <Card className="gap-0 p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      <JobProgress jobId={jobId} onDone={() => router.refresh()} onError={() => router.refresh()} />
    </Card>
  );
}
