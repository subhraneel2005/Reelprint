"use client";

import { useEffect, useRef, useState } from "react";
import type { Job } from "@/lib/types";
import { TodoList, type TodoItem } from "@/components/agents/todo-list";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { Loader } from "@/components/motion/loader";

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
  const items: TodoItem[] = steps.map((step) => ({
    id: step.key,
    title: step.label,
    status:
      step.status === "done"
        ? "completed"
        : step.status === "running"
          ? "in-progress"
          : step.status === "error"
            ? "cancelled"
            : step.status === "skipped"
              ? "cancelled"
              : "pending",
    detail:
      step.status === "error"
        ? step.detail ?? "Stopped"
        : step.detail,
  }));

  if (!job) {
    return (
      <div className="flex items-center gap-3 rounded-[22px] border border-border/80 bg-card px-4 py-3.5">
        <Loader variant="dot-matrix" size={22} label="Queued" className="text-primary" />
        <div>
          <p className="text-[12px] font-medium text-ink">Opening the job</p>
          <p className="text-[10px] text-muted-foreground">Waiting for the first status update.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <AnimatedBadge
          status={isError ? "danger" : isDone ? "success" : "loading"}
          size="sm"
          contentKey={job.status}
        >
          {isError ? "stopped" : isDone ? "complete" : `reading · ${job.stage ?? "queued"}`}
        </AnimatedBadge>
        <span className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted-foreground">
          {steps.filter((step) => step.status === "done" || step.status === "skipped").length}/
          {steps.length} steps
        </span>
      </div>
      <TodoList
        items={items}
        title={isError ? "Analysis stopped" : isDone ? "Analysis complete" : "Analysis in progress"}
        defaultOpen
        collapseOnComplete
        className="bg-card"
      />
      {failed && (
        <p className="rounded-2xl border border-destructive/25 bg-destructive/5 px-3 py-2 font-mono text-[9.5px] text-destructive">
          {failed}
        </p>
      )}
    </div>
  );
}
