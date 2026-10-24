"use client";

import { useEffect, useRef, useState } from "react";
import { CircleAlert, Loader2 } from "lucide-react";
import type { Job } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

  if (!job) {
    return (
      <Card className="flex flex-row items-center gap-3 p-4">
        <Spinner className="size-5 text-primary" />
        <p className="text-sm text-muted-foreground">Opening the job…</p>
      </Card>
    );
  }

  const steps = job.steps ?? [];
  const done = steps.filter((step) => step.status === "done" || step.status === "skipped").length;
  const current = steps.find((step) => step.status === "running") ?? steps[done];
  const isError = job.status === "error";
  const isDone = job.status === "done";
  const value = steps.length ? Math.round((done / steps.length) * 100) : 0;

  return (
    <Card className="gap-0 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {isError ? (
            <CircleAlert className="size-4 text-destructive" aria-hidden />
          ) : isDone ? (
            <span className="size-2 rounded-full bg-emerald-600" aria-hidden />
          ) : (
            <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
          )}
          <p className="text-sm font-medium">
            {isError ? "Analysis stopped" : isDone ? "Ready" : (current?.label ?? "Reading")}
          </p>
        </div>
        <Badge variant={isError ? "destructive" : "secondary"} className="tabular-nums">
          {done}/{steps.length}
        </Badge>
      </div>

      {!isError && <Progress value={isDone ? 100 : value} className="mt-3 h-1.5" />}

      {current?.detail && !isError && (
        <p className="mt-2 text-xs text-muted-foreground">{current.detail}</p>
      )}

      {isError && (
        <p className="mt-2 text-sm text-destructive">
          {job.error ?? "Add a transcript to continue."}
        </p>
      )}

      {failed && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {failed}
        </p>
      )}
    </Card>
  );
}
