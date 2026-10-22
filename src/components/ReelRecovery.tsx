"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, ArrowRight, RotateCw } from "lucide-react";
import { JobProgress } from "./JobProgress";

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
    <section className="border border-signal/40 bg-signal-soft">
      <div className="flex items-start gap-2 border-b border-signal/25 px-4 py-3">
        <AlertCircle size={15} className="mt-[2px] shrink-0 text-signal" />
        <div>
          <h2 className="text-[13px] font-medium text-ink">
            {hasTranscript ? "Analysis stopped before the index" : "This post needs a transcript"}
          </h2>
          <p className="mt-0.5 text-[12px] leading-relaxed text-ink-2">
            {error ??
              "The platform did not return the transcript. Paste it here and the DNA, index and brief will continue from it."}
          </p>
        </div>
      </div>
      <div className="space-y-2 p-4">
        {!hasTranscript && (
          <>
            <textarea
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              rows={4}
              className="input bg-surface leading-relaxed"
              placeholder="Paste the transcript here…"
            />
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
                the URL stays attached to this transcript
              </span>
              <button type="button" onClick={submitTranscript} disabled={busy} className="btn btn-primary h-8 text-[11px]">
                {busy ? "Starting…" : "Continue analysis"}
                <ArrowRight size={13} />
              </button>
            </div>
          </>
        )}
        {hasTranscript && (
          <button type="button" onClick={retry} disabled={busy} className="btn btn-ghost h-8 bg-surface text-[11px]">
            <RotateCw size={12} />
            {busy ? "Starting…" : "Retry DNA + index"}
          </button>
        )}
        {message && <p className="text-[11px] text-signal">{message}</p>}
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
