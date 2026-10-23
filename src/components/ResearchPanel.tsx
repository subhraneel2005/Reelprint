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
import { Panel, Tag } from "./Bits";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
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
      <Panel as="section" className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="secondary">Research brief</Badge>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Reverse engineer it.</h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Why it holds attention, a beat-by-beat blueprint, live outliers on the same topic, and
              six filmable ideas adapted to your profile.
            </p>
          </div>
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Sparkles className="size-5" aria-hidden />
          </span>
        </div>

        {hasTranscript ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button type="button" onClick={() => run(false)} disabled={loading}>
              {loading ? <Spinner className="size-4" /> : <Sparkles className="size-4" aria-hidden />}
              {loading ? "Reading…" : "Reverse engineer this reel"}
              {!loading && <ArrowRight className="size-4" aria-hidden />}
            </Button>
            <span className="text-xs text-muted-foreground">
              15–40 sec · uses YouTube live + your profile
            </span>
          </div>
        ) : (
          <p className="mt-4 rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Add a transcript first.
          </p>
        )}

        {loading && (
          <div className="mt-4 flex items-center gap-2.5 rounded-lg border bg-muted/40 px-3 py-2.5">
            <Spinner className="size-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              Scoring live outliers and writing the brief…
            </span>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mt-3">
            <CircleAlert aria-hidden />
            <AlertTitle>Research stopped</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </Panel>
    );
  }

  return (
    <Panel as="section">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Research brief</h2>
          {result.generated_at && (
            <span className="text-xs text-muted-foreground">
              {new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              }).format(new Date(result.generated_at))}
            </span>
          )}
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
        <Alert className="m-3">
          <TriangleAlert aria-hidden />
          <AlertTitle>Partial result</AlertTitle>
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="m-3">
          <CircleAlert aria-hidden />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-7 p-4 sm:p-5">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Why it works
          </h3>
          <div className="mt-3 grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              ["Hook", result.why_it_works.hook],
              ["Retention", result.why_it_works.retention],
              ["Emotion", result.why_it_works.emotion],
              ["Format", result.why_it_works.format],
              ["CTA", result.why_it_works.cta],
            ].map(([label, value]) => (
              <div key={label} className={label === "CTA" ? "sm:col-span-2" : ""}>
                <div className="text-xs font-medium text-primary">{label}</div>
                <p className="mt-1 text-sm leading-relaxed">{value}</p>
              </div>
            ))}
          </div>

          {result.why_it_works.evidence.length > 0 && (
            <ul className="mt-4 space-y-1.5 rounded-lg border-l-2 border-primary/50 bg-muted/40 p-3">
              {result.why_it_works.evidence.map((item, index) => (
                <li key={index} className="text-xs leading-relaxed text-muted-foreground">
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t pt-6">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Shooting blueprint
          </h3>
          <ol className="mt-3 divide-y border-y">
            {result.blueprint.beats.map((beat, index) => (
              <li key={index} className="grid grid-cols-[54px_1fr] gap-3 py-3">
                <span className="font-mono text-xs text-primary">
                  {beat.time || `0${index + 1}`}
                </span>
                <div>
                  <p className="text-sm font-medium leading-snug">{beat.beat}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{beat.why}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs font-medium text-muted-foreground">Visual</div>
              <p className="mt-1 text-sm leading-relaxed">{result.blueprint.visual_notes}</p>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">Audio</div>
              <p className="mt-1 text-sm leading-relaxed">{result.blueprint.audio_notes}</p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border bg-muted/30 p-3">
            <div className="text-xs font-medium text-muted-foreground">Caption formula</div>
            <p className="mt-1 text-sm leading-relaxed">{result.blueprint.caption_formula}</p>
          </div>

          {result.blueprint.hook_variants.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-medium text-muted-foreground">Hook variants</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {result.blueprint.hook_variants.map((hook, index) => (
                  <span
                    key={index}
                    className="rounded-md border bg-muted/30 px-2.5 py-2 text-xs leading-snug"
                  >
                    {hook}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Six ideas you can film
            </h3>
            <Badge variant="secondary">{result.ideas.length} scripts</Badge>
          </div>

          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {result.ideas.map((idea, index) => (
              <article
                key={index}
                className={cn(
                  "rounded-lg border bg-background p-3.5",
                  index === 0 && "border-primary/30 bg-accent/40",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Tag
                    tone={
                      idea.difficulty === "low"
                        ? "line"
                        : idea.difficulty === "high"
                          ? "signal"
                          : "tape"
                    }
                  >
                    {idea.difficulty}
                  </Tag>
                </div>
                <h4 className="mt-2 text-sm font-medium leading-snug">{idea.title}</h4>
                <p className="mt-1.5 rounded-r-md border-l-2 border-primary pl-2 text-sm leading-snug">
                  “{idea.hook}”
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{idea.angle}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">Why fit · </span>
                  {idea.why_it_fits}
                </p>
                <div className="mt-2.5">
                  <Tag tone="line">{idea.format}</Tag>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="grid gap-6 border-t pt-6 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Do next
            </h3>
            <ul className="mt-2 space-y-2">
              {result.do_next.map((item, index) => (
                <li key={index} className="flex gap-2 text-sm leading-relaxed">
                  <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Search further
            </h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.discovery_queries.map((query) => (
                <Button
                  key={query}
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-auto whitespace-normal py-1.5 text-xs"
                >
                  <Link href={`/discover?q=${encodeURIComponent(query)}`}>
                    <Compass className="size-3" aria-hidden />
                    {query}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {similar.length > 0 && (
          <div className="border-t pt-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Live outliers on this topic
              </h3>
              <span className="text-xs text-muted-foreground">YouTube Shorts · scored</span>
            </div>

            <div className="mt-2 divide-y">
              {similar.slice(0, 6).map((hit) => (
                <a
                  key={hit.id}
                  href={hit.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 rounded-md py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="w-7 shrink-0 font-mono text-xs text-primary">{hit.score}</span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium group-hover:text-primary">
                      {hit.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {hit.channel} · {compactNumber(hit.views)} views · {percent(hit.like_rate)} likes
                      · {hit.outlier.toFixed(1)}× median pace
                    </p>
                  </div>
                  <ArrowUpRight
                    className="size-3.5 shrink-0 text-muted-foreground group-hover:text-primary"
                    aria-hidden
                  />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
