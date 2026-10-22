"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, Compass, RefreshCw, Sparkles } from "lucide-react";
import type { ResearchResult, YouTubeHit } from "@/lib/types";
import { compactNumber, percent } from "@/lib/util";
import { Tag } from "./Bits";

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

  const stages = [
    "Scoring live outliers…",
    "Reading the retention structure…",
    "Adapting the mechanic to your niche…",
    "Writing hooks and scripts…",
  ];

  if (!result) {
    return (
      <section className="border border-ink bg-surface">
        <div className="tick-strip" />
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="display text-[24px]">Research brief</h2>
              <p className="mt-1 max-w-lg text-[12.5px] leading-relaxed text-muted">
                Reverse engineer this reel: why it holds attention, a beat-by-beat blueprint, live
                outliers on the same topic, and six filmable ideas adapted to your profile.
              </p>
            </div>
            <Sparkles size={18} className="shrink-0 text-signal" />
          </div>
          {hasTranscript ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => run(false)}
                disabled={loading}
                className="btn btn-primary h-10 px-5"
              >
                {loading ? "Reading…" : "Reverse engineer this reel"}
                <ArrowRight size={14} />
              </button>
              <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted">
                15–40 sec · uses YouTube live + your profile
              </span>
            </div>
          ) : (
            <p className="mt-4 border border-line bg-paper px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
              add a transcript first
            </p>
          )}
          {loading && (
            <div className="mt-4 flex items-center gap-2 font-mono text-[10px] text-signal">
              <span className="h-1.5 w-1.5 animate-pulse bg-signal" />
              {stages[tick % stages.length]}
            </div>
          )}
          {error && <p className="mt-3 border border-signal/40 bg-signal-soft px-3 py-2 text-[12px] text-signal">{error}</p>}
        </div>
        <div className="tick-strip" />
      </section>
    );
  }

  return (
    <section className="border border-ink bg-surface">
      <div className="tick-strip" />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <div className="flex items-baseline gap-3">
          <h2 className="display text-[24px]">Research brief</h2>
          {result.generated_at && (
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
              {new Date(result.generated_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => run(true)}
          disabled={loading}
          className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted hover:text-ink"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          {loading ? stages[tick % stages.length] : "Run again"}
        </button>
      </div>

      {warning && (
        <div className="border-b border-line bg-signal-soft px-4 py-2 text-[11px] text-signal sm:px-5">{warning}</div>
      )}
      {error && (
        <div className="border-b border-line bg-signal-soft px-4 py-2 text-[11px] text-signal sm:px-5">{error}</div>
      )}

      <div className="space-y-7 p-4 sm:p-5">
        <div>
          <h3 className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">Why it works</h3>
          <div className="mt-3 grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              ["Hook", result.why_it_works.hook],
              ["Retention", result.why_it_works.retention],
              ["Emotion", result.why_it_works.emotion],
              ["Format", result.why_it_works.format],
              ["CTA", result.why_it_works.cta],
            ].map(([label, value]) => (
              <div key={label} className={label === "CTA" ? "sm:col-span-2" : ""}>
                <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-signal">{label}</div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">{value}</p>
              </div>
            ))}
          </div>
          {result.why_it_works.evidence.length > 0 && (
            <ul className="mt-4 space-y-1.5 border-l border-line pl-3">
              {result.why_it_works.evidence.map((item, index) => (
                <li key={index} className="text-[11.5px] leading-relaxed text-muted">
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-line pt-6">
          <h3 className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">Shooting blueprint</h3>
          <ol className="mt-3 divide-y divide-line/70 border-y border-line/70">
            {result.blueprint.beats.map((beat, index) => (
              <li key={index} className="grid grid-cols-[54px_1fr] gap-3 py-2.5">
                <span className="timecode text-[10px] text-signal">{beat.time || `0${index + 1}`}</span>
                <div>
                  <p className="text-[12.5px] font-medium leading-snug">{beat.beat}</p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{beat.why}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">Visual</div>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-2">{result.blueprint.visual_notes}</p>
            </div>
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">Audio</div>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-2">{result.blueprint.audio_notes}</p>
            </div>
          </div>
          <div className="mt-4 border border-line bg-paper p-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">Caption formula</div>
            <p className="mt-1 text-[12px] leading-relaxed">{result.blueprint.caption_formula}</p>
          </div>
          {result.blueprint.hook_variants.length > 0 && (
            <div className="mt-4">
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">Hook variants</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {result.blueprint.hook_variants.map((hook, index) => (
                  <span key={index} className="border border-line bg-paper px-2 py-1.5 text-[11.5px] leading-snug">
                    {hook}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-line pt-6">
          <div className="flex items-baseline justify-between">
            <h3 className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">Six ideas you can film</h3>
            <span className="font-mono text-[9px] text-muted">{result.ideas.length} scripts</span>
          </div>
          <div className="mt-3 grid gap-px border border-line bg-line sm:grid-cols-2">
            {result.ideas.map((idea, index) => (
              <article key={index} className="bg-surface p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="timecode text-[9px] text-signal">{String(index + 1).padStart(2, "0")}</span>
                  <Tag tone={idea.difficulty === "low" ? "line" : idea.difficulty === "high" ? "signal" : "tape"}>
                    {idea.difficulty}
                  </Tag>
                </div>
                <h4 className="mt-2 text-[13px] font-medium leading-snug">{idea.title}</h4>
                <p className="mt-1.5 border-l-2 border-signal pl-2 text-[12px] leading-snug text-ink-2">
                  “{idea.hook}”
                </p>
                <p className="mt-2 text-[11.5px] leading-relaxed text-muted">{idea.angle}</p>
                <p className="mt-2 text-[11px] leading-relaxed text-muted">
                  <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink">why fit · </span>
                  {idea.why_it_fits}
                </p>
                <div className="mt-2.5">
                  <Tag tone="line">{idea.format}</Tag>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="grid gap-6 border-t border-line pt-6 sm:grid-cols-2">
          <div>
            <h3 className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">Do next</h3>
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
            <h3 className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">Search further</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.discovery_queries.map((query) => (
                <Link
                  key={query}
                  href={`/discover?q=${encodeURIComponent(query)}`}
                  className="flex items-center gap-1 border border-line bg-paper px-2 py-1.5 font-mono text-[9.5px] hover:border-ink"
                >
                  <Compass size={10} />
                  {query}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {similar.length > 0 && (
          <div className="border-t border-line pt-6">
            <div className="flex items-baseline justify-between">
              <h3 className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                Live outliers on this topic
              </h3>
              <span className="font-mono text-[9px] text-muted">YouTube Shorts · scored</span>
            </div>
            <div className="mt-2 divide-y divide-line/70">
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
                    <p className="line-clamp-1 text-[12px] font-medium group-hover:text-signal">{hit.title}</p>
                    <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.06em] text-muted">
                      {hit.channel} · {compactNumber(hit.views)} views · {percent(hit.like_rate)} likes ·{" "}
                      {hit.outlier.toFixed(1)}× median pace
                    </p>
                  </div>
                  <ArrowUpRight size={13} className="shrink-0 text-muted group-hover:text-signal" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="tick-strip" />
    </section>
  );
}
