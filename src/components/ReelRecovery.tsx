"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, RotateCw, TriangleAlert } from "lucide-react";
import { JobProgress } from "./JobProgress";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { StatefulButton } from "@/components/motion/button/stateful";

export function ReelRecovery({
  reelId,
  status,
  error,
  hasTranscript,
  jobId,
}: {
  reelId: string;
  status: string;
  error: string | null;
  hasTranscript: boolean;
  jobId?: string | null;
}) {
  const router = useRouter();
  const [transcript, setTranscript] = useState("");
  const [activeJob, setActiveJob] = useState<string | null>(status === "processing" ? jobId ?? null : null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submitTranscript = async () => {
    if (transcript.trim().length < 10) {
      setMessage("Paste at least a few sentences.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/reels/${reelId}/transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcript.trim() }),
      });
      const data = (await response.json()) as { jobId?: string; error?: string };
      if (!response.ok || !data.jobId) throw new Error(data.error ?? "Could not start");
      setActiveJob(data.jobId);
    } catch (caught) {
      setMessage((caught as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const retry = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/reels/${reelId}/retry`, { method: "POST" });
      const data = (await response.json()) as { jobId?: string; error?: string };
      if (!response.ok || !data.jobId) throw new Error(data.error ?? "Could not retry");
      setActiveJob(data.jobId);
    } catch (caught) {
      setMessage((caught as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card-shadow overflow-hidden rounded-[26px] border border-signal/25 bg-card">
      <div className="flex items-start gap-3 border-b border-signal/15 bg-signal-soft/45 px-4 py-3.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-xl border border-signal/20 bg-card/70 text-signal">
          <TriangleAlert size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[13px] font-medium text-ink">
              {hasTranscript ? "Analysis stopped before the index" : "This post needs a transcript"}
            </h2>
            <AnimatedBadge status="warning" size="sm" pulse={false}>
              needs help
            </AnimatedBadge>
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-2">
            {error ??
              "The platform did not return the transcript. Paste it here and the DNA, index and brief will continue from it."}
          </p>
        </div>
      </div>
      <div className="space-y-2.5 p-4">
        {!hasTranscript && (
          <>
            <textarea
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              rows={4}
              className="input rounded-2xl bg-background/60 leading-relaxed"
              placeholder="Paste the transcript here…"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted-foreground">
                the URL stays attached to this transcript
              </span>
              <StatefulButton
                type="button"
                onClick={submitTranscript}
                state={busy ? "loading" : "idle"}
                loadingText="Starting"
                size="sm"
                icon={<ArrowRight size={13} />}
              >
                Continue analysis
              </StatefulButton>
            </div>
          </>
        )}
        {hasTranscript && (
          <StatefulButton
            type="button"
            onClick={retry}
            state={busy ? "loading" : "idle"}
            loadingText="Starting"
            size="sm"
            variant="secondary"
            icon={<RotateCw size={12} />}
          >
            Retry DNA + index
          </StatefulButton>
        )}
        {message && (
          <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-2.5 py-1.5 text-[11px] text-destructive">
            {message}
          </p>
        )}
        {activeJob && (
          <JobProgress
            jobId={activeJob}
            onDone={() => router.refresh()}
            onError={() => router.refresh()}
          />
        )}
      </div>
    </section>
  );
}
