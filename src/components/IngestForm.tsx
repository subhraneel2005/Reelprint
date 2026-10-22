"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, ArrowRight, ClipboardPaste, Link2 } from "lucide-react";
import type { Job, Reel } from "@/lib/types";
import { detectPlatform, platformLabel } from "@/lib/util";
import { JobProgress } from "./JobProgress";

type Mode = "link" | "transcript";

export function IngestForm({ defaultUrl = "" }: { defaultUrl?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(defaultUrl ? "link" : "link");
  const [url, setUrl] = useState(defaultUrl);
  const [transcript, setTranscript] = useState("");
  const [caption, setCaption] = useState("");
  const [metrics, setMetrics] = useState({ views: "", likes: "", comments: "", shares: "", followers: "" });
  const [showMetrics, setShowMetrics] = useState(false);
  const [visual, setVisual] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [reelId, setReelId] = useState<string | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [fixText, setFixText] = useState("");
  const [fixing, setFixing] = useState(false);
  const [showFix, setShowFix] = useState(false);

  const detected = url.trim() ? detectPlatform(url.trim()) : null;

  const toNumber = (value: string) => {
    if (!value.trim()) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setJobError(null);
    if (mode === "link" && !url.trim()) {
      setError("Paste a reel or short link first.");
      return;
    }
    if (mode === "transcript" && transcript.trim().length < 10) {
      setError("Paste at least a few sentences of the transcript.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: mode === "link" ? url.trim() : url.trim() || undefined,
          transcript: mode === "transcript" ? transcript.trim() : undefined,
          caption: caption.trim() || undefined,
          visual,
          metrics: {
            views: toNumber(metrics.views),
            likes: toNumber(metrics.likes),
            comments: toNumber(metrics.comments),
            shares: toNumber(metrics.shares),
            followers: toNumber(metrics.followers),
          },
        }),
      });
      const data = (await response.json()) as {
        reel?: Reel;
        jobId?: string;
        existing?: boolean;
        error?: string;
      };
      if (!response.ok || !data.reel) throw new Error(data.error ?? "Could not start the analysis");

      setReelId(data.reel.id);
      if (data.existing && data.reel.status === "ready") {
        router.push(`/reel/${data.reel.id}`);
        return;
      }
      if (data.jobId) {
        setJobId(data.jobId);
        setShowFix(false);
      } else if (data.reel.status === "needs_transcript" || data.reel.status === "error") {
        setJobError(data.reel.error ?? "This post needs a transcript.");
        setShowFix(true);
      }
      setUrl("");
      if (mode === "transcript") {
        setTranscript("");
        setCaption("");
      }
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const fixWithTranscript = async () => {
    if (!reelId || fixText.trim().length < 10) {
      setJobError("Paste at least a few sentences.");
      return;
    }
    setFixing(true);
    try {
      const response = await fetch(`/api/reels/${reelId}/transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: fixText.trim() }),
      });
      const data = (await response.json()) as { jobId?: string; error?: string };
      if (!response.ok || !data.jobId) throw new Error(data.error ?? "Could not continue");
      setJobId(data.jobId);
      setJobError(null);
      setShowFix(false);
      setFixText("");
    } catch (caught) {
      setJobError((caught as Error).message);
    } finally {
      setFixing(false);
    }
  };

  const handleDone = (job: Job) => {
    if (reelId) {
      router.push(`/reel/${reelId}`);
      router.refresh();
    }
    void job;
  };

  return (
    <div>
      <form onSubmit={submit} className="border border-ink bg-surface">
        <div className="tick-strip" />
        <div className="p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex border border-line bg-paper">
              <button
                type="button"
                onClick={() => setMode("link")}
                className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] ${
                  mode === "link" ? "bg-ink text-paper" : "text-muted hover:text-ink"
                }`}
              >
                Link
              </button>
              <button
                type="button"
                onClick={() => setMode("transcript")}
                className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] ${
                  mode === "transcript" ? "bg-ink text-paper" : "text-muted hover:text-ink"
                }`}
              >
                Transcript
              </button>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
              one link at a time · 30–90 sec
            </span>
          </div>

          {mode === "link" ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative flex-1">
                <span className="sr-only">Reel, Short or TikTok link</span>
                <Link2 size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  className="input h-12 pl-9 text-[13px]"
                  placeholder="instagram.com/reel/…  or  youtube.com/shorts/…"
                  autoComplete="off"
                  spellCheck={false}
                />
              </label>
              <button type="submit" disabled={submitting} className="btn btn-primary h-12 px-5">
                {submitting ? "Starting…" : "Analyse reel"}
                <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block">
                <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                  Link (optional)
                </span>
                <input
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  className="input"
                  placeholder="Keep the source link for the archive"
                  autoComplete="off"
                  spellCheck={false}
                />
              </label>
              <label className="block">
                <span className="mb-1 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                  <ClipboardPaste size={11} /> Transcript
                </span>
                <textarea
                  value={transcript}
                  onChange={(event) => setTranscript(event.target.value)}
                  rows={6}
                  className="input resize-y leading-relaxed"
                  placeholder="Paste the transcript from the reel. This is enough to extract the DNA, the structure and the ideas."
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                  Caption (optional)
                </span>
                <input
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  className="input"
                  placeholder="Hooks, hashtags, CTA"
                />
              </label>
              <div className="flex justify-end">
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? "Starting…" : "Analyse transcript"}
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {detected && detected.platform !== "other" && mode === "link" && (
            <div className="mt-2 flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted">
              <span className="h-1.5 w-1.5 bg-ok" />
              detected {platformLabel(detected.platform)}
              {detected.externalId ? ` · ${detected.externalId}` : ""}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setShowMetrics((value) => !value)}
                className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted underline decoration-line-strong underline-offset-4 hover:text-ink"
              >
                {showMetrics ? "Hide numbers" : "Add reach numbers"}
              </button>
              <label className="flex cursor-pointer items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                <input
                  type="checkbox"
                  checked={visual}
                  onChange={(event) => setVisual(event.target.checked)}
                  className="h-3 w-3 accent-[var(--signal)]"
                />
                read frames
              </label>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
              {visual ? "audio + vision" : "audio only"} · stays on this machine
            </span>
          </div>

          {showMetrics && (
            <div className="mt-3 grid grid-cols-2 gap-2 border border-line bg-paper p-3 sm:grid-cols-5">
              {(
                [
                  ["views", "Views"],
                  ["likes", "Likes"],
                  ["comments", "Comments"],
                  ["shares", "Shares"],
                  ["followers", "Creator followers"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block">
                  <span className="mb-1 block font-mono text-[8.5px] uppercase tracking-[0.08em] text-muted">
                    {label}
                  </span>
                  <input
                    value={metrics[key]}
                    onChange={(event) => setMetrics((current) => ({ ...current, [key]: event.target.value }))}
                    inputMode="numeric"
                    className="input px-2 py-1.5 font-mono text-[11px]"
                    placeholder="—"
                  />
                </label>
              ))}
            </div>
          )}

          {error && (
            <div className="mt-3 flex items-start gap-2 border border-signal/40 bg-signal-soft px-3 py-2 text-[12px] text-signal">
              <AlertCircle size={14} className="mt-[1px] shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
        <div className="tick-strip" />
      </form>

      {jobId && (
        <div className="mt-3 space-y-2">
          <JobProgress
            jobId={jobId}
            onDone={handleDone}
            onError={(job) => {
              setJobError(job.error ?? "The analysis stopped. Add a transcript to continue.");
              setShowFix(true);
            }}
          />
          {reelId && (
            <div className="flex items-center justify-between font-mono text-[10px] text-muted">
              <span>You can leave this page. The job keeps running.</span>
              <button
                type="button"
                onClick={() => router.push(`/reel/${reelId}`)}
                className="underline decoration-line-strong underline-offset-4 hover:text-ink"
              >
                Open the reel
              </button>
            </div>
          )}
        </div>
      )}

      {jobError && (
        <div className="mt-3 border border-signal/50 bg-signal-soft p-3">
          <div className="flex items-start gap-2 text-[12px] text-signal">
            <AlertCircle size={14} className="mt-[1px] shrink-0" />
            <div>
              <p className="font-medium">Instagram and TikTok often block link fetches.</p>
              <p className="mt-1 text-ink-2">{jobError}</p>
            </div>
          </div>
          {reelId && (
            <div className="mt-3">
              {!showFix ? (
                <button
                  type="button"
                  onClick={() => setShowFix(true)}
                  className="btn btn-ghost h-8 bg-surface text-[11px]"
                >
                  Paste the transcript instead
                </button>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={fixText}
                    onChange={(event) => setFixText(event.target.value)}
                    rows={4}
                    className="input bg-surface leading-relaxed"
                    placeholder="Paste the transcript. The DNA, search index and research brief will build from it."
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={fixWithTranscript}
                      disabled={fixing}
                      className="btn btn-primary h-8 text-[11px]"
                    >
                      {fixing ? "Starting…" : "Continue analysis"}
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
