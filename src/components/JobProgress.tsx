"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Circle, Minus, X } from "lucide-react";
import type { Job } from "@/lib/types";
import { cn } from "@/lib/util";

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
  const completed = steps.filter((step) => step.status === "done" || step.status === "skipped").length;
  const progress = steps.length ? Math.round((completed / steps.length) * 100) : 0;
  const isError = job?.status === "error";

  return (
    <div className="border border-line bg-paper">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <div className="flex items-center gap-2">
          <span className={cn("h-1.5 w-1.5", isError ? "bg-signal" : "animate-pulse bg-signal")} />
          <span className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink">
            {isError ? "stopped" : job?.status === "done" ? "complete" : `reading · ${job?.stage ?? "queued"}`}
          </span>
        </div>
        <span className="timecode text-[10px] text-muted">{progress}%</span>
      </div>
      <div className="h-[3px] w-full bg-paper-2">
        <div
          className="h-full bg-signal transition-all duration-500"
          style={{ width: `${isError ? 100 : progress}%`, opacity: isError ? 0.35 : 1 }}
        />
      </div>
      <ol className="divide-y divide-line/70">
        {steps.map((step) => (
          <li key={step.key} className="flex items-start gap-2.5 px-3 py-2">
            <span className="mt-[2px] flex h-3.5 w-3.5 shrink-0 items-center justify-center">
              {step.status === "done" && <Check size={13} className="text-ok" strokeWidth={2.5} />}
              {step.status === "running" && <span className="h-2 w-2 animate-pulse bg-signal" />}
              {step.status === "error" && <X size={13} className="text-signal" strokeWidth={2.5} />}
              {step.status === "skipped" && <Minus size={13} className="text-line-strong" />}
              {step.status === "pending" && <Circle size={7} className="text-line-strong" />}
            </span>
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  "text-[12px] leading-tight",
                  step.status === "pending" ? "text-muted" : "text-ink",
                  step.status === "error" && "text-signal",
                )}
              >
                {step.label}
              </div>
              {step.detail && (
                <div className="mt-0.5 truncate font-mono text-[9.5px] text-muted" title={step.detail}>
                  {step.detail}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
      {failed && (
        <div className="border-t border-line px-3 py-2 font-mono text-[10px] text-signal">{failed}</div>
      )}
    </div>
  );
}
