"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CircleAlert,
  Compass,
  RefreshCw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import type { ResearchResult, YouTubeHit } from "@/lib/types";
import { compactNumber, percent } from "@/lib/util";
import { IdeaScriptCard } from "./IdeaScriptCard";
import { Panel } from "./Bits";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function ResearchPanel({
  reelId,
  initial,
  initialSimilar,
  hasTranscript,
}: {
  reelId: string;
  initial: ResearchResult | null;
  initialSimilar: YouTubeHit[];
  hasTranscript: boolean;
}) {
  const [result, setResult] = useState<ResearchResult | null>(initial);
  const [similar, setSimilar] = useState<YouTubeHit[]>(initialSimilar);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const run = async (refresh: boolean) => {
    setLoading(true);
    setError(null);
    setWarning(null);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reelId, refresh }),
      });
      const data = (await response.json()) as {
        result?: ResearchResult;
        similar?: YouTubeHit[];
        error?: string;
        warning?: string;
      };
      if (!response.ok || !data.result) throw new Error(data.error ?? "Research failed");

      setResult(data.result);
      setSimilar(data.similar ?? []);
      setWarning(data.warning ?? null);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!result) {
    return (
      <Panel as="section" className="p-6">
        <span className="grid size-10 place-items-center rounded-xl bg-muted text-foreground">
          <Sparkles className="size-4" aria-hidden />
        </span>
        <h2 className="mt-4 text-xl font-semibold tracking-tight">Reverse engineer this reel.</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          See why it works, how it is built, and six ideas shaped around your niche.
        </p>

        {hasTranscript ? (
          <Button
            type="button"
            onClick={() => run(false)}
            disabled={loading}
            className="mt-5"
          >
            {loading ? <Spinner className="size-4" /> : <Sparkles className="size-4" aria-hidden />}
            {loading ? "Reading…" : "Build the brief"}
            {!loading && <ArrowRight className="size-4" aria-hidden />}
          </Button>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">Add a transcript to build the brief.</p>
        )}

        {loading && (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="size-4 text-primary" />
            Scoring live outliers and writing the brief…
          </p>
        )}

        {error && (
          <Alert variant="destructive" className="mt-4">
            <CircleAlert aria-hidden />
            <AlertTitle>Research stopped</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </Panel>
    );
  }

  return (
    <Panel as="section" className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
        <div>
          <Badge variant="secondary">Research brief</Badge>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">How this reel works</h2>
        </div>
        <Button
          type="button"
          onClick={() => run(true)}
          disabled={loading}
          variant="ghost"
          size="sm"
        >
          <RefreshCw className={cn("size-4", loading && "animate-spin")} aria-hidden />
          {loading ? "Running…" : "Run again"}
        </Button>
      </div>

      {warning && (
        <Alert className="mx-4 mb-2">
          <TriangleAlert aria-hidden />
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mx-4 mb-2">
          <CircleAlert aria-hidden />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="brief" className="gap-0">
        <div className="border-b px-5">
          <TabsList variant="line" className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="brief" className="flex-none">
              Brief
            </TabsTrigger>
            <TabsTrigger value="blueprint" className="flex-none">
              Blueprint
            </TabsTrigger>
            <TabsTrigger value="ideas" className="flex-none">
              Ideas
            </TabsTrigger>
            {similar.length > 0 && (
              <TabsTrigger value="live" className="flex-none">
                Live
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="brief" className="mt-0 space-y-6 p-5">
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              ["Hook", result.why_it_works.hook],
              ["Retention", result.why_it_works.retention],
              ["Emotion", result.why_it_works.emotion],
              ["Format", result.why_it_works.format],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="text-xs font-medium text-primary">{label}</div>
                <p className="mt-1.5 text-sm leading-relaxed">{value}</p>
              </div>
            ))}
          </div>

          <div>
            <div className="text-xs font-medium text-primary">CTA</div>
            <p className="mt-1.5 text-sm leading-relaxed">{result.why_it_works.cta}</p>
          </div>

          {result.why_it_works.evidence.length > 0 && (
            <ul className="space-y-2 border-t pt-4">
              {result.why_it_works.evidence.map((item, index) => (
                <li key={index} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-primary" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          )}

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium">Do next</h3>
            <ul className="mt-2 space-y-2">
              {result.do_next.map((item, index) => (
                <li key={index} className="flex gap-2 text-sm leading-relaxed">
                  <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="blueprint" className="mt-0 space-y-6 p-5">
          <div>
            <h3 className="text-sm font-medium">Beat by beat</h3>
            <ol className="mt-3 divide-y border-y">
              {result.blueprint.beats.map((beat, index) => (
                <li key={index} className="grid grid-cols-[48px_1fr] gap-3 py-3">
                  <span className="font-mono text-xs text-primary">{beat.time || `0${index + 1}`}</span>
                  <div>
                    <p className="text-sm font-medium leading-snug">{beat.beat}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{beat.why}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <div className="text-xs font-medium text-muted-foreground">Visual</div>
              <p className="mt-1.5 text-sm leading-relaxed">{result.blueprint.visual_notes}</p>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">Audio</div>
              <p className="mt-1.5 text-sm leading-relaxed">{result.blueprint.audio_notes}</p>
            </div>
          </div>

          <div className="rounded-xl bg-muted/50 p-4">
            <div className="text-xs font-medium text-muted-foreground">Caption formula</div>
            <p className="mt-1.5 text-sm leading-relaxed">{result.blueprint.caption_formula}</p>
          </div>

          {result.blueprint.hook_variants.length > 0 && (
            <div>
              <h3 className="text-sm font-medium">Hook variants</h3>
              <div className="mt-2 space-y-2">
                {result.blueprint.hook_variants.map((hook, index) => (
                  <p key={index} className="rounded-lg border px-3 py-2 text-sm leading-snug">
                    {hook}
                  </p>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="ideas" className="mt-0 p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-medium">Six ideas you can film</h3>
            <span className="text-xs text-muted-foreground">Write any script</span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {result.ideas.map((idea, index) => (
              <IdeaScriptCard key={index} reelId={reelId} idea={idea} index={index} />
            ))}
          </div>
        </TabsContent>

        {similar.length > 0 && (
          <TabsContent value="live" className="mt-0 space-y-5 p-5">
            <div>
              <h3 className="text-sm font-medium">Live outliers on this topic</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                YouTube Shorts, ranked by pace and engagement.
              </p>
            </div>

            <div className="divide-y">
              {similar.slice(0, 6).map((hit) => (
                <a
                  key={hit.id}
                  href={hit.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 py-3"
                >
                  <span className="w-7 shrink-0 font-mono text-xs text-primary">{hit.score}</span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium group-hover:text-primary">
                      {hit.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {hit.channel} · {compactNumber(hit.views)} views · {percent(hit.like_rate)} likes
                    </p>
                  </div>
                  <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                </a>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 border-t pt-4">
              {result.discovery_queries.slice(0, 3).map((query) => (
                <Button key={query} asChild variant="outline" size="sm">
                  <Link href={`/discover?q=${encodeURIComponent(query)}`}>
                    <Compass className="size-3.5" aria-hidden />
                    {query}
                  </Link>
                </Button>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </Panel>
  );
}
