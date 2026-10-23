"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, RotateCw, TriangleAlert } from "lucide-react";
import { JobProgress } from "./JobProgress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

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
  const [activeJob, setActiveJob] = useState<string | null>(
    status === "processing" ? jobId ?? null : null,
  );
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
    <Card className="gap-0 overflow-hidden border-amber-600/30">
      <div className="flex items-start gap-3 border-b bg-muted/50 p-4">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-background text-amber-700">
          <TriangleAlert className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-medium">
              {hasTranscript ? "Analysis stopped before the index" : "This post needs a transcript"}
            </h2>
            <Badge variant="secondary">Needs help</Badge>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {error ??
              "The platform did not return the transcript. Paste it here and the DNA, index and brief will continue from it."}
          </p>
        </div>
      </div>

      <div className="space-y-2.5 p-4">
        {!hasTranscript && (
          <>
            <Label htmlFor="recovery-transcript" className="sr-only">
              Transcript
            </Label>
            <Textarea
              id="recovery-transcript"
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              rows={4}
              placeholder="Paste the transcript here…"
              aria-describedby="recovery-transcript-hint"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p id="recovery-transcript-hint" className="text-xs text-muted-foreground">
                The URL stays attached to this transcript.
              </p>
              <Button type="button" onClick={submitTranscript} disabled={busy} size="sm">
                {busy ? (
                  <Spinner className="size-4" />
                ) : (
                  <ArrowRight className="size-4" aria-hidden />
                )}
                Continue analysis
              </Button>
            </div>
          </>
        )}

        {hasTranscript && (
          <Button type="button" onClick={retry} disabled={busy} variant="secondary" size="sm">
            {busy ? (
              <Spinner className="size-4" />
            ) : (
              <RotateCw className="size-4" aria-hidden />
            )}
            Retry DNA + index
          </Button>
        )}

        {message && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
          >
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
    </Card>
  );
}
