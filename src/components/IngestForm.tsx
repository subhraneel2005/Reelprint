"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ClipboardPaste, Link2, SlidersHorizontal, TriangleAlert } from "lucide-react";
import type { Job, Reel } from "@/lib/types";
import { detectPlatform, platformLabel } from "@/lib/util";
import { JobProgress } from "./JobProgress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type Mode = "link" | "transcript";

const initialMetrics = { views: "", likes: "", comments: "", shares: "", followers: "" };

export function IngestForm({ defaultUrl = "" }: { defaultUrl?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("link");
  const [url, setUrl] = useState(defaultUrl);
  const [transcript, setTranscript] = useState("");
  const [caption, setCaption] = useState("");
  const [metrics, setMetrics] = useState(initialMetrics);
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
      <form onSubmit={submit} className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)} className="gap-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-2.5 sm:p-3">
            <TabsList>
              <TabsTrigger value="link">
                <Link2 className="size-4" aria-hidden />
                Link
              </TabsTrigger>
              <TabsTrigger value="transcript">
                <ClipboardPaste className="size-4" aria-hidden />
                Transcript
              </TabsTrigger>
            </TabsList>
            <span className="text-xs text-muted-foreground">One link at a time · 30–90 sec</span>
          </div>

          <div className="space-y-3 p-3.5 sm:p-4">
            <TabsContent value="link" className="mt-0">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Label htmlFor="ingest-url" className="sr-only">
                    Reel, Short or TikTok link
                  </Label>
                  <Link2
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    id="ingest-url"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="instagram.com/reel/… or youtube.com/shorts/…"
                    autoComplete="off"
                    spellCheck={false}
                    className="h-11 pl-9"
                  />
                </div>
                <Button type="submit" size="lg" disabled={submitting} className="h-11">
                  {submitting ? (
                    <Spinner className="size-4" />
                  ) : (
                    <ArrowRight className="size-4" aria-hidden />
                  )}
                  Analyse reel
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="transcript" className="mt-0 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="ingest-source">Source link (optional)</Label>
                <Input
                  id="ingest-source"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="Keep the source link for the archive"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ingest-transcript">Transcript</Label>
                <Textarea
                  id="ingest-transcript"
                  value={transcript}
                  onChange={(event) => setTranscript(event.target.value)}
                  rows={7}
                  placeholder="Paste the transcript from the reel. This is enough to extract the DNA, the structure and the ideas."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ingest-caption">Caption (optional)</Label>
                <Input
                  id="ingest-caption"
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  placeholder="Hooks, hashtags, CTA"
                />
              </div>

              <div className="flex justify-end pt-1">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <Spinner className="size-4" />
                  ) : (
                    <ArrowRight className="size-4" aria-hidden />
                  )}
                  Analyse transcript
                </Button>
              </div>
            </TabsContent>

            {detected && detected.platform !== "other" && mode === "link" && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-600" aria-hidden />
                  Detected {platformLabel(detected.platform)}
                </Badge>
                {detected.externalId && (
                  <span className="truncate text-xs text-muted-foreground">
                    {detected.externalId}
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMetrics((value) => !value)}
                  aria-expanded={showMetrics}
                  aria-controls="ingest-metrics"
                >
                  <SlidersHorizontal className="size-3.5" aria-hidden />
                  {showMetrics ? "Hide numbers" : "Reach numbers"}
                </Button>

                <div className="flex items-center gap-2">
                  <Switch
                    id="ingest-visual"
                    checked={visual}
                    onCheckedChange={setVisual}
                    aria-describedby="ingest-visual-hint"
                  />
                  <Label htmlFor="ingest-visual">Read frames</Label>
                </div>
              </div>

              <span id="ingest-visual-hint" className="text-xs text-muted-foreground">
                {visual ? "Audio + vision" : "Audio only"} · stays on this machine
              </span>
            </div>

            {showMetrics && (
              <div
                id="ingest-metrics"
                className="grid grid-cols-2 gap-2.5 rounded-lg border bg-muted/30 p-3 sm:grid-cols-5"
              >
                {(
                  [
                    ["views", "Views"],
                    ["likes", "Likes"],
                    ["comments", "Comments"],
                    ["shares", "Shares"],
                    ["followers", "Creator followers"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="space-y-1">
                    <Label htmlFor={`ingest-${key}`} className="text-xs text-muted-foreground">
                      {label}
                    </Label>
                    <Input
                      id={`ingest-${key}`}
                      value={metrics[key]}
                      onChange={(event) =>
                        setMetrics((current) => ({ ...current, [key]: event.target.value }))
                      }
                      inputMode="numeric"
                      placeholder="—"
                      className="h-8 text-xs tabular-nums"
                    />
                  </div>
                ))}
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <TriangleAlert aria-hidden />
                <AlertTitle>Could not send that</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
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
            <Card className="flex flex-row flex-wrap items-center justify-between gap-2 p-3">
              <span className="text-xs text-muted-foreground">
                You can leave this page. The job keeps running.
              </span>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={() => router.push(`/reel/${reelId}`)}
              >
                Open the reel
              </Button>
            </Card>
          )}
        </div>
      )}

      {jobError && (
        <Alert className="mt-3">
          <TriangleAlert aria-hidden />
          <AlertTitle>Instagram and TikTok often block link fetches.</AlertTitle>
          <AlertDescription>
            <p>{jobError}</p>
            {reelId && (
              <div className="pt-2">
                {!showFix ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowFix(true)}>
                    Paste the transcript instead
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="ingest-fix" className="sr-only">
                      Transcript
                    </Label>
                    <Textarea
                      id="ingest-fix"
                      value={fixText}
                      onChange={(event) => setFixText(event.target.value)}
                      rows={4}
                      placeholder="Paste the transcript. The DNA, search index and research brief will build from it."
                    />
                    <div className="flex justify-end">
                      <Button type="button" size="sm" onClick={fixWithTranscript} disabled={fixing}>
                        {fixing ? (
                          <Spinner className="size-4" />
                        ) : (
                          <ArrowRight className="size-4" aria-hidden />
                        )}
                        Continue analysis
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
