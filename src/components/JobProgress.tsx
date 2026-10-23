"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Loader2,
  MinusCircle,
  XCircle,
} from "lucide-react";
import type { Job } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export function JobProgress({
  jobId,
  onDone,
  onError,
}: {
  jobId: string;
  onDone?: (job: Job) => void;
  onError?: (job: Job) => void;
}) {
  const [job, setJob] = useState<Job | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const doneRef = useRef(onDone);
  const errorRef = useRef(onError);

  useEffect(() => {
    doneRef.current = onDone;
    errorRef.current = onError;
  }, [onDone, onError]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Could not read the job");

        const data = (await response.json()) as Job;
        if (cancelled) return;

        setJob(data);
        setFailed(null);

        if (data.status === "done") {
          doneRef.current?.(data);
          return;
        }

        if (data.status === "error") {
          errorRef.current?.(data);
          return;
        }

        timer = setTimeout(poll, 1200);
      } catch (error) {
        if (cancelled) return;
        setFailed((error as Error).message);
        timer = setTimeout(poll, 2500);
      }
    };

    void poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [jobId]);

  const steps = job?.steps ?? [];
  const isError = job?.status === "error";
  const isDone = job?.status === "done";

  if (!job) {
    return (
      <Card className="flex flex-row items-center gap-3 p-4">
        <Spinner className="size-5 text-primary" />
        <div>
          <p className="text-sm font-medium">Opening the job</p>
          <p className="text-xs text-muted-foreground">Waiting for the first status update.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <Badge variant={isError ? "destructive" : isDone ? "secondary" : "default"}>
          {isError ? "Stopped" : isDone ? "Complete" : `Reading · ${job.stage ?? "queued"}`}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {steps.filter((step) => step.status === "done" || step.status === "skipped").length}/
          {steps.length} steps
        </span>
      </div>

      <Card className="gap-0 p-3">
        <p className="text-sm font-medium">
          {isError ? "Analysis stopped" : isDone ? "Analysis complete" : "Analysis in progress"}
        </p>
        <ul className="mt-3 space-y-2" aria-live="polite">
          {steps.map((step) => (
            <li key={step.key} className="flex gap-2">
              <StepIcon status={step.status} />
              <div className="min-w-0">
                <p className="text-sm leading-snug">{step.label}</p>
                {step.detail && (
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {step.status === "error" ? step.detail : step.detail}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {failed && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
        >
          {failed}
        </p>
      )}
    </div>
  );
}

function StepIcon({ status }: { status: string }) {
  const className = "mt-0.5 size-4 shrink-0";

  if (status === "done") {
    return <CheckCircle2 className={`${className} text-emerald-600`} aria-hidden />;
  }

  if (status === "running") {
    return <Loader2 className={`${className} animate-spin text-primary`} aria-hidden />;
  }

  if (status === "error") {
    return <XCircle className={`${className} text-destructive`} aria-hidden />;
  }

  if (status === "skipped") {
    return <MinusCircle className={`${className} text-muted-foreground`} aria-hidden />;
  }

  return <Circle className={`${className} text-muted-foreground`} aria-hidden />;
}
