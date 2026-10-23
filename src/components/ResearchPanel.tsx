"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, Compass, RefreshCw, Sparkles } from "lucide-react";
import type { ResearchResult, YouTubeHit } from "@/lib/types";
import { compactNumber, percent, cn } from "@/lib/util";
import { Panel, Tag } from "./Bits";
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@/components/motion/alert";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { Button } from "@/components/motion/button/base";
import { Loader } from "@/components/motion/loader";
import { TextReveal } from "@/components/motion/text-reveal";

const STAGES = [
  "Scoring live outliers…",
  "Reading the retention structure…",
  "Adapting the mechanic to your niche…",
  "Writing hooks and scripts…",
];

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
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!loading) return;
    const timer = setInterval(() => setTick((value) => value + 1), 2600);
    return () => clearInterval(timer);
  }, [loading]);

  const run = async (refresh: boolean) => {
    setLoading(true);
    setError(null);
    setWarning(null);
    setTick(0);
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
      <Panel as="section" className="overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <AnimatedBadge status="info" size="sm" pulse={false}>
                research brief
              </AnimatedBadge>
              <TextReveal
                as="h2"
                text="Reverse engineer it."
                className="display mt-2 text-[clamp(1.7rem,4vw,2.35rem)]"
                stagger={0.05}
              />
              <p className="mt-2 max-w-lg text-[12.5px] leading-relaxed text-muted-foreground">
                Why it holds attention, a beat-by-beat blueprint, live outliers on the same topic,
                and six filmable ideas adapted to your profile.
              </p>
            </div>
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-signal/20 bg-signal-soft text-signal">
              <Sparkles size={17} />
            </span>
          </div>

          {hasTranscript ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => run(false)}
                disabled={loading}
                size="md"
                className="px-5"
              >
                {loading ? "Reading…" : "Reverse engineer this reel"}
                {!loading && <ArrowRight size={14} />}
              </Button>
              <span className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted-foreground">
                15–40 sec · uses YouTube live + your profile
              </span>
            </div>
          ) : (
            <p className="mt-4 rounded-2xl border border-border/70 bg-background/60 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
              add a transcript first
            </p>
          )}

          {loading && (
            <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-border/70 bg-background/60 px-3 py-2.5">
              <Loader variant="ascii" size={16} label="Researching" className="text-primary" />
              <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-signal">
                {STAGES[tick % STAGES.length]}
              </span>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mt-3 rounded-2xl" contentClassName="items-start">
              <AlertIcon />
              <AlertContent>
                <AlertTitle>Research stopped</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </AlertContent>
            </Alert>
          )}
        </div>
      </Panel>
    );
  }

  return (
    <Panel as="section" className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-3.5 sm:px-5">
        <div className="flex flex-wrap items-baseline gap-3">
          <TextReveal as="h2" text="Research brief" className="display text-[24px]" />
          {result.generated_at && (
            <span className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted-foreground">
              {new Date(result.generated_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        <Button
          type="button"
          onClick={() => run(true)}
          disabled={loading}
          variant="ghost"
          size="sm"
          className="font-mono text-[8.5px] uppercase tracking-[0.08em]"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          {loading ? STAGES[tick % STAGES.length] : "Run again"}
        </Button>
      </div>

      {warning && (
        <Alert variant="warning" className="m-3 rounded-2xl" contentClassName="items-start">
          <AlertIcon />
          <AlertContent>
            <AlertDescription>{warning}</AlertDescription>
          </AlertContent>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="m-3 rounded-2xl" contentClassName="items-start">
          <AlertIcon />
          <AlertContent>
            <AlertDescription>{error}</AlertDescription>
          </AlertContent>
        </Alert>
      )}

      <div className="space-y-7 p-4 sm:p-5">
        <div>
          <h3 className="mono-label">Why it works</h3>
          <div className="mt-3 grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              ["Hook", result.why_it_works.hook],
              ["Retention", result.why_it_works.retention],
              ["Emotion", result.why_it_works.emotion],
              ["Format", result.why_it_works.format],
              ["CTA", result.why_it_works.cta],
            ].map(([label, value]) => (
              <div key={label} className={label === "CTA" ? "sm:col-span-2" : ""}>
                <div className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-signal">
                  {label}
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">{value}</p>
              </div>
            ))}
          </div>
          {result.why_it_works.evidence.length > 0 && (
            <ul className="mt-4 space-y-1.5 rounded-2xl border-l-2 border-signal/60 bg-background/50 py-2.5 pl-3 pr-2">
              {result.why_it_works.evidence.map((item, index) => (
                <li key={index} className="text-[11.5px] leading-relaxed text-muted-foreground">
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border/70 pt-6">
          <h3 className="mono-label">Shooting blueprint</h3>
          <ol className="mt-3 divide-y divide-border/60 border-y border-border/60">
            {result.blueprint.beats.map((beat, index) => (
              <li key={index} className="grid grid-cols-[54px_1fr] gap-3 py-3">
                <span className="timecode mt-0.5 text-[10px] text-signal">
                  {beat.time || `0${index + 1}`}
                </span>
                <div>
                  <p className="text-[12.5px] font-medium leading-snug">{beat.beat}</p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
                    {beat.why}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="mono-label">Visual</div>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-2">
                {result.blueprint.visual_notes}
              </p>
            </div>
            <div>
              <div className="mono-label">Audio</div>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-2">
                {result.blueprint.audio_notes}
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-[20px] border border-border/70 bg-background/60 p-3.5">
            <div className="mono-label">Caption formula</div>
            <p className="mt-1.5 text-[12px] leading-relaxed">{result.blueprint.caption_formula}</p>
          </div>
          {result.blueprint.hook_variants.length > 0 && (
            <div className="mt-4">
              <div className="mono-label">Hook variants</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {result.blueprint.hook_variants.map((hook, index) => (
                  <span
                    key={index}
                    className="rounded-2xl border border-border/70 bg-background/60 px-2.5 py-2 text-[11.5px] leading-snug"
                  >
                    {hook}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border/70 pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="mono-label">Six ideas you can film</h3>
            <AnimatedBadge status="neutral" size="sm" showIcon={false}>
              {result.ideas.length} scripts
            </AnimatedBadge>
          </div>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {result.ideas.map((idea, index) => (
              <article
                key={index}
                className={cn(
                  "rounded-[22px] border border-border/70 bg-background/45 p-3.5",
                  index === 0 && "border-signal/25 bg-signal-soft/35",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="timecode text-[9px] text-signal">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Tag
                    tone={idea.difficulty === "low" ? "line" : idea.difficulty === "high" ? "signal" : "tape"}
                  >
                    {idea.difficulty}
                  </Tag>
                </div>
                <h4 className="mt-2 text-[13px] font-medium leading-snug">{idea.title}</h4>
                <p className="mt-1.5 border-l-2 border-signal pl-2 text-[12px] leading-snug text-ink-2">
                  “{idea.hook}”
                </p>
                <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">
                  {idea.angle}
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  <span className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink">
                    why fit ·{" "}
                  </span>
                  {idea.why_it_fits}
                </p>
                <div className="mt-2.5">
                  <Tag tone="line">{idea.format}</Tag>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="grid gap-6 border-t border-border/70 pt-6 sm:grid-cols-2">
          <div>
            <h3 className="mono-label">Do next</h3>
            <ul className="mt-2 space-y-2">
              {result.do_next.map((item, index) => (
                <li key={index} className="flex gap-2 text-[12px] leading-relaxed text-ink-2">
                  <ArrowRight size={12} className="mt-1 shrink-0 text-signal" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mono-label">Search further</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.discovery_queries.map((query) => (
                <Link
                  key={query}
                  href={`/discover?q=${encodeURIComponent(query)}`}
                  className="flex items-center gap-1 rounded-full border border-border/70 bg-background/60 px-2.5 py-1.5 font-mono text-[9px] transition-colors hover:border-ink/30"
                >
                  <Compass size={10} />
                  {query}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {similar.length > 0 && (
          <div className="border-t border-border/70 pt-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="mono-label">Live outliers on this topic</h3>
              <span className="font-mono text-[8.5px] text-muted-foreground">
                YouTube Shorts · scored
              </span>
            </div>
            <div className="mt-2 divide-y divide-border/60">
              {similar.slice(0, 6).map((hit) => (
                <a
                  key={hit.id}
                  href={hit.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 py-2.5"
                >
                  <span className="timecode w-7 shrink-0 text-[10px] text-signal">{hit.score}</span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-[12px] font-medium transition-colors group-hover:text-signal">
                      {hit.title}
                    </p>
                    <p className="mt-0.5 font-mono text-[8.5px] uppercase tracking-[0.05em] text-muted-foreground">
                      {hit.channel} · {compactNumber(hit.views)} views · {percent(hit.like_rate)} likes ·{" "}
                      {hit.outlier.toFixed(1)}× median pace
                    </p>
                  </div>
                  <ArrowUpRight size={13} className="shrink-0 text-muted-foreground transition-colors group-hover:text-signal" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
