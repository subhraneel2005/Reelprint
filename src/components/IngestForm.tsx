"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  ClipboardPaste,
  Link2,
  SlidersHorizontal,
  TriangleAlert,
} from "lucide-react";
import type { Job, Reel } from "@/lib/types";
import { detectPlatform } from "@/lib/util";
import { cn } from "@/lib/utils";
import { JobProgress } from "./JobProgress";
import { PlatformLogo } from "./PlatformLogo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type Mode = "link" | "transcript";

const SUPPORTED_PLATFORMS = [
  { key: "instagram", label: "Instagram" },
  { key: "youtube", label: "YouTube Shorts" },
] as const;

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
  const [advanced, setAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [reelId, setReelId] = useState<string | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [fixText, setFixText] = useState("");
  const [fixing, setFixing] = useState(false);

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
      setError("Paste a reel or Short link first.");
      return;
    }

    if (mode === "transcript" && transcript.trim().length < 10) {
      setError("Paste at least a few sentences.");
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
      } else if (data.reel.status === "needs_transcript" || data.reel.status === "error") {
        setJobError(data.reel.error ?? "This post needs a transcript.");
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
      setFixText("");
    } catch (caught) {
      setJobError((caught as Error).message);
    } finally {
      setFixing(false);
    }
  };

  const handleDone = (job: Job) => {
    void job;
    if (reelId) {
      router.push(`/reel/${reelId}`);
      router.refresh();
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)} className="gap-0">
          <div className="px-3 pt-3">
            <TabsList variant="line" aria-label="Input type">
              <TabsTrigger value="link">
                <Link2 className="size-4" aria-hidden />
                Link
              </TabsTrigger>
              <TabsTrigger value="transcript">
                <ClipboardPaste className="size-4" aria-hidden />
                Transcript
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="link" className="mt-0 p-3 pt-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Label htmlFor="ingest-url" className="sr-only">
                  Reel or Short link
                </Label>
                <Link2
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="ingest-url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="instagram.com/reel/… or youtube.com/shorts/…"
                  autoComplete="off"
                  spellCheck={false}
                  className="h-12 pl-10"
                />
              </div>
              <Button type="submit" size="lg" disabled={submitting} className="h-12">
                {submitting ? <Spinner className="size-4" /> : null}
                {submitting ? "Starting" : "Analyse"}
                {!submitting && <ArrowRight className="size-4" aria-hidden />}
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 px-1 text-xs text-muted-foreground">
              <span className="mr-0.5">Works with</span>
              {SUPPORTED_PLATFORMS.map((platform) => {
                const active = detected?.platform === platform.key;

                return (
                  <span
                    key={platform.key}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 transition-colors",
                      active
                        ? "border-primary/30 bg-primary/5 font-medium text-foreground"
                        : "bg-muted/30",
                    )}
                  >
                    <PlatformLogo platform={platform.key} size={15} decorative />
                    {platform.label}
                  </span>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="transcript" className="mt-0 space-y-3 p-3 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="ingest-transcript">Transcript</Label>
              <Textarea
                id="ingest-transcript"
                value={transcript}
                onChange={(event) => setTranscript(event.target.value)}
                rows={7}
                placeholder="Paste the transcript from the reel."
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? <Spinner className="size-4" /> : null}
                {submitting ? "Starting" : "Analyse transcript"}
                {!submitting && <ArrowRight className="size-4" aria-hidden />}
              </Button>
            </div>
          </TabsContent>

          <Collapsible open={advanced} onOpenChange={setAdvanced}>
            <div className="flex items-center justify-between border-t px-3 py-2">
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" size="sm">
                  Options
                  <ChevronDown className="size-4" aria-hidden />
                </Button>
              </CollapsibleTrigger>
              <span className="text-xs text-muted-foreground">Frames, reach, caption</span>
            </div>

            <CollapsibleContent className="space-y-3 border-t p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    id="ingest-visual"
                    checked={visual}
                    onCheckedChange={setVisual}
                    aria-describedby="ingest-visual-hint"
                  />
                  <Label htmlFor="ingest-visual">Read frames</Label>
                  <span id="ingest-visual-hint" className="text-xs text-muted-foreground">
                    {visual ? "Audio + vision" : "Audio only"}
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMetrics((value) => !value)}
                  aria-expanded={showMetrics}
                  aria-controls="ingest-metrics"
                >
                  <SlidersHorizontal className="size-3.5" aria-hidden />
                  {showMetrics ? "Hide reach" : "Add reach"}
                </Button>
              </div>

              {mode === "transcript" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="ingest-source">Source link</Label>
                    <Input
                      id="ingest-source"
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      placeholder="Optional"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ingest-caption">Caption</Label>
                    <Input
                      id="ingest-caption"
                      value={caption}
                      onChange={(event) => setCaption(event.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              )}

              {showMetrics && (
                <div
                  id="ingest-metrics"
                  className="grid grid-cols-2 gap-2.5 border-t pt-3 sm:grid-cols-5"
                >
                  {(
                    [
                      ["views", "Views"],
                      ["likes", "Likes"],
                      ["comments", "Comments"],
                      ["shares", "Shares"],
                      ["followers", "Followers"],
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
            </CollapsibleContent>
          </Collapsible>

          {error && (
            <div className="px-3 pb-3">
              <Alert variant="destructive">
                <TriangleAlert aria-hidden />
                <AlertTitle>Could not send that</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}
        </Tabs>
      </form>

      {jobId && (
        <div className="space-y-2">
          <JobProgress
            jobId={jobId}
            onDone={handleDone}
            onError={(job) => {
              setJobError(job.error ?? "The analysis stopped. Add a transcript to continue.");
            }}
          />
          {reelId && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 text-muted-foreground"
              onClick={() => router.push(`/reel/${reelId}`)}
            >
              Open the reel while it finishes
            </Button>
          )}
        </div>
      )}

      {jobError && (
        <Alert>
          <TriangleAlert aria-hidden />
          <AlertTitle>This post needs a transcript.</AlertTitle>
          <AlertDescription>
            <p>{jobError}</p>
            {reelId && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="ingest-fix" className="sr-only">
                  Transcript
                </Label>
                <Textarea
                  id="ingest-fix"
                  value={fixText}
                  onChange={(event) => setFixText(event.target.value)}
                  rows={4}
                  placeholder="Paste the transcript here…"
                />
                <div className="flex justify-end">
                  <Button type="button" size="sm" onClick={fixWithTranscript} disabled={fixing}>
                    {fixing ? <Spinner className="size-4" /> : null}
                    {fixing ? "Continuing" : "Continue analysis"}
                  </Button>
                </div>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
