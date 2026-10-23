"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ClipboardPaste, Link2, SlidersHorizontal } from "lucide-react";
import type { Job, Reel } from "@/lib/types";
import { detectPlatform, platformLabel } from "@/lib/util";
import { JobProgress } from "./JobProgress";
import { Tag } from "./Bits";
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@/components/motion/alert";
import { StatefulButton } from "@/components/motion/button/stateful";
import { Input } from "@/components/motion/input";
import { Switch } from "@/components/motion/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/motion/tabs";

type Mode = "link" | "transcript";

export function IngestForm({ defaultUrl = "" }: { defaultUrl?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("link");
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
      <form
        onSubmit={submit}
        className="card-shadow overflow-hidden rounded-[28px] border border-border/80 bg-card"
      >
        <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)} variant="pill">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-3 py-2.5 sm:px-4">
            <TabsList className="bg-background/70">
              <TabsTrigger value="link" icon={<Link2 size={14} />} className="text-[12px]">
                Link
              </TabsTrigger>
              <TabsTrigger value="transcript" icon={<ClipboardPaste size={14} />} className="text-[12px]">
                Transcript
              </TabsTrigger>
            </TabsList>
            <span className="font-mono text-[8.5px] uppercase tracking-[0.11em] text-muted-foreground">
              one link at a time · 30–90 sec
            </span>
          </div>

          <div className="p-3.5 sm:p-4">
            <TabsContent value="link" className="mt-0">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={url}
                  onChange={setUrl}
                  leftIcon={<Link2 size={16} />}
                  className="flex-1"
                  classNames={{
                    field: "h-12 rounded-2xl bg-background/60",
                    input: "text-[13px]",
                  }}
                  placeholder="instagram.com/reel/…  or  youtube.com/shorts/…"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Reel, Short or TikTok link"
                />
                <StatefulButton
                  type="submit"
                  state={submitting ? "loading" : "idle"}
                  loadingText="Starting"
                  size="lg"
                  className="h-12 w-full px-5 text-[13px] sm:w-auto"
                  icon={<ArrowRight size={15} />}
                >
                  Analyse reel
                </StatefulButton>
              </div>
            </TabsContent>

            <TabsContent value="transcript" className="mt-0 space-y-2.5">
              <Input
                value={url}
                onChange={setUrl}
                leftIcon={<Link2 size={16} />}
                classNames={{
                  field: "h-11 rounded-2xl bg-background/60",
                  input: "text-[13px]",
                }}
                placeholder="Keep the source link for the archive (optional)"
                autoComplete="off"
                spellCheck={false}
                aria-label="Source link (optional)"
              />
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 px-1 font-mono text-[8.5px] uppercase tracking-[0.12em] text-muted-foreground">
                  <ClipboardPaste size={11} /> Transcript
                </span>
                <textarea
                  value={transcript}
                  onChange={(event) => setTranscript(event.target.value)}
                  rows={7}
                  className="input resize-y rounded-2xl bg-background/60 leading-relaxed"
                  placeholder="Paste the transcript from the reel. This is enough to extract the DNA, the structure and the ideas."
                />
              </label>
              <Input
                value={caption}
                onChange={setCaption}
                label="Caption (optional)"
                classNames={{
                  label: "px-1 font-mono text-[8.5px] uppercase tracking-[0.12em] text-muted-foreground",
                  field: "h-11 rounded-2xl bg-background/60",
                  input: "text-[13px]",
                }}
                placeholder="Hooks, hashtags, CTA"
              />
              <div className="flex justify-end pt-1">
                <StatefulButton
                  type="submit"
                  state={submitting ? "loading" : "idle"}
                  loadingText="Starting"
                  size="md"
                  className="px-5"
                  icon={<ArrowRight size={14} />}
                >
                  Analyse transcript
                </StatefulButton>
              </div>
            </TabsContent>

          {detected && detected.platform !== "other" && mode === "link" && (
            <div className="mt-2.5 flex items-center gap-2">
              <Tag tone="ok">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                detected {platformLabel(detected.platform)}
              </Tag>
              {detected.externalId && (
                <span className="truncate font-mono text-[9px] text-muted-foreground">
                  {detected.externalId}
                </span>
              )}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowMetrics((value) => !value)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/60 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-ink/40 hover:text-ink"
              >
                <SlidersHorizontal size={11} />
                {showMetrics ? "Hide numbers" : "Reach numbers"}
              </button>
              <Switch
                checked={visual}
                onCheckedChange={setVisual}
                label="Read frames"
                ariaLabel="Read frames from the video"
              />
            </div>
            <span className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-muted-foreground">
              {visual ? "audio + vision" : "audio only"} · stays on this machine
            </span>
          </div>

          {showMetrics && (
            <div className="mt-3 grid grid-cols-2 gap-2.5 rounded-[20px] border border-border/70 bg-background/60 p-3 sm:grid-cols-5">
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
                  <span className="mb-1 block font-mono text-[8px] uppercase tracking-[0.08em] text-muted-foreground">
                    {label}
                  </span>
                  <input
                    value={metrics[key]}
                    onChange={(event) =>
                      setMetrics((current) => ({ ...current, [key]: event.target.value }))
                    }
                    inputMode="numeric"
                    className="input rounded-xl px-2.5 py-2 font-mono text-[11px]"
                    placeholder="—"
                  />
                </label>
              ))}
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mt-3 rounded-2xl" contentClassName="items-start">
              <AlertIcon />
              <AlertContent>
                <AlertTitle>Could not send that</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </AlertContent>
            </Alert>
          )}
          </div>
        </Tabs>
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
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/60 bg-card/50 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
              <span>You can leave this page. The job keeps running.</span>
              <button
                type="button"
                onClick={() => router.push(`/reel/${reelId}`)}
                className="text-ink underline decoration-border underline-offset-4"
              >
                Open the reel
              </button>
            </div>
          )}
        </div>
      )}

      {jobError && (
        <Alert variant="warning" className="mt-3 rounded-2xl" contentClassName="items-start">
          <AlertIcon />
          <AlertContent>
            <AlertTitle>Instagram and TikTok often block link fetches.</AlertTitle>
            <AlertDescription>{jobError}</AlertDescription>
            {reelId && (
              <div className="pt-2">
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
                      className="input rounded-2xl bg-surface leading-relaxed"
                      placeholder="Paste the transcript. The DNA, search index and research brief will build from it."
                    />
                    <div className="flex justify-end">
                      <StatefulButton
                        type="button"
                        onClick={fixWithTranscript}
                        state={fixing ? "loading" : "idle"}
                        loadingText="Starting"
                        size="sm"
                        className="h-8 text-[11px]"
                        icon={<ArrowRight size={13} />}
                      >
                        Continue analysis
                      </StatefulButton>
                    </div>
                  </div>
                )}
              </div>
            )}
          </AlertContent>
        </Alert>
      )}
    </div>
  );
}
