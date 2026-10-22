"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowUpRight, Compass, Search } from "lucide-react";
import type { YouTubeHit } from "@/lib/types";
import { compactNumber, percent, timeAgo } from "@/lib/util";
import { Empty, Tag } from "./Bits";
import { AddToArchive } from "./AddToArchive";
import { Thumb } from "./Thumb";

export function DiscoverExplorer({
  initialQuery,
  topics,
  youtubeReady,
}: {
  initialQuery: string;
  topics: { topic: string; count: number }[];
  youtubeReady: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [days, setDays] = useState(180);
  const [minViews, setMinViews] = useState(2000);
  const [hits, setHits] = useState<YouTubeHit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(initialQuery);
  const firstRun = useRef(true);

  const run = useCallback(
    async (searchQuery: string) => {
      const clean = searchQuery.trim();
      if (!clean) return;
      setLoading(true);
      setError(null);
      setSearched(clean);
      try {
        const params = new URLSearchParams({
          q: clean,
          days: String(days),
          minViews: String(minViews),
        });
        const response = await fetch(`/api/youtube?${params.toString()}`, { cache: "no-store" });
        const data = (await response.json()) as { hits?: YouTubeHit[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Discovery failed");
        setHits(data.hits ?? []);
      } catch (caught) {
        setError((caught as Error).message);
        setHits(null);
      } finally {
        setLoading(false);
      }
    },
    [days, minViews],
  );

  useEffect(() => {
    if (firstRun.current && initialQuery) {
      firstRun.current = false;
      void run(initialQuery);
    }
  }, [initialQuery, run]);

  return (
    <div>
      <header className="border-b border-ink pb-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="display text-[clamp(2rem,4.4vw,3rem)]">Discover</h1>
            <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-muted">
              Live YouTube Shorts, ranked by views per hour, like rate and recency relative to the
              rest of the result set. High engagement only, not raw vanity counts.
            </p>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
            source · youtube data api
          </span>
        </div>
      </header>

      {!youtubeReady && (
        <div className="mt-4 flex items-start gap-2 border border-tape/60 bg-tape/20 px-3 py-2.5">
          <AlertTriangle size={14} className="mt-[1px] shrink-0 text-ink" />
          <div className="text-[12px] leading-relaxed">
            <p className="font-medium">Live discovery is off until a YouTube key is added.</p>
            <p className="mt-0.5 text-ink-2">
              Create a free key in Google Cloud, enable YouTube Data API v3, then add{" "}
              <code className="bg-paper px-1 py-0.5 font-mono text-[10.5px]">YOUTUBE_API_KEY=…</code> to{" "}
              <code className="bg-paper px-1 py-0.5 font-mono text-[10.5px]">.env.local</code> and restart.
            </p>
          </div>
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void run(query);
        }}
        className="mt-4 border border-line bg-surface p-3"
      >
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search YouTube Shorts</span>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="input h-11 pl-9 text-[13px]"
              placeholder="e.g. coding workflow, AI side project, Figma tutorial"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 border border-line bg-paper px-2 py-1.5">
              <span className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-muted">window</span>
              <select
                value={days}
                onChange={(event) => setDays(Number(event.target.value))}
                className="bg-transparent font-mono text-[10px] outline-none"
              >
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={180}>6 months</option>
                <option value={365}>1 year</option>
              </select>
            </label>
            <label className="flex items-center gap-1.5 border border-line bg-paper px-2 py-1.5">
              <span className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-muted">min views</span>
              <input
                value={minViews}
                onChange={(event) => setMinViews(Number(event.target.value) || 0)}
                inputMode="numeric"
                className="w-14 bg-transparent font-mono text-[10px] outline-none"
              />
            </label>
            <button type="submit" disabled={loading || !youtubeReady} className="btn btn-primary h-9 px-4 text-[11px]">
              {loading ? "Scoring…" : "Find outliers"}
              <Compass size={13} />
            </button>
          </div>
        </div>
        {topics.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-line pt-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">from your archive</span>
            {topics.slice(0, 7).map((topic) => (
              <button
                key={topic.topic}
                type="button"
                onClick={() => {
                  setQuery(topic.topic);
                  void run(topic.topic);
                }}
                className="border border-line bg-paper px-1.5 py-1 font-mono text-[9.5px] hover:border-ink"
              >
                {topic.topic}
              </button>
            ))}
          </div>
        )}
      </form>

      {error && (
        <div className="mt-4 border border-signal/40 bg-signal-soft px-3 py-2 text-[12px] text-signal">{error}</div>
      )}

      {loading && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="animate-pulse border border-line bg-surface p-2">
              <div className="aspect-video bg-paper-2" />
              <div className="mt-2 h-2 w-1/3 bg-paper-2" />
              <div className="mt-2 h-3 w-5/6 bg-paper-2" />
            </div>
          ))}
        </div>
      )}

      {!loading && hits && (
        <section className="mt-7">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted">
            <span>
              {hits.length} shorts · “{searched}” · sorted by score
            </span>
            <span>views/hour · like rate · recency</span>
          </div>
          {hits.length === 0 ? (
            <Empty
              title="No outliers in this window"
              body="Widen the window, lower the view floor, or try a broader phrase. Very narrow queries return too few shorts to score fairly."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {hits.map((hit) => (
                <article key={hit.id} className="group border border-line bg-surface p-2">
                  <a href={hit.url} target="_blank" rel="noreferrer" className="block">
                    <div className="relative aspect-video overflow-hidden">
                      <Thumb
                        remote={hit.thumbnail}
                        alt={hit.title}
                        label="youtube"
                        className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                      <span className="timecode absolute left-1.5 top-1.5 bg-ink/85 px-1.5 py-0.5 text-[9px] text-paper">
                        {hit.duration ? `${Math.floor(hit.duration / 60)}:${String(Math.round(hit.duration % 60)).padStart(2, "0")}` : "short"}
                      </span>
                      <span
                        className="timecode absolute right-1.5 top-1.5 px-1.5 py-0.5 text-[10px] text-ink"
                        style={{ background: hit.score >= 70 ? "var(--tape)" : "color-mix(in srgb, var(--paper) 94%, transparent)" }}
                        title={`Outlier score ${hit.score}/100`}
                      >
                        {hit.score}
                      </span>
                    </div>
                  </a>
                  <div className="px-1 pb-1 pt-2">
                    <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.06em] text-muted">
                      <span className="truncate">{hit.channel}</span>
                      <span>{timeAgo(hit.published_at)}</span>
                    </div>
                    <a href={hit.url} target="_blank" rel="noreferrer">
                      <h3 className="mt-1 line-clamp-2 text-[12.5px] font-medium leading-snug group-hover:text-signal">
                        {hit.title}
                      </h3>
                    </a>
                    <div className="mt-2 grid grid-cols-3 gap-1 border-y border-line/70 py-1.5 font-mono text-[9px] text-muted">
                      <span>{compactNumber(hit.views)} views</span>
                      <span>{percent(hit.like_rate)} likes</span>
                      <span>{compactNumber(Math.round(hit.views_per_hour))}/hr</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <Tag tone={hit.outlier >= 2 ? "signal" : "line"}>{hit.outlier.toFixed(1)}× pace</Tag>
                      <div className="flex items-center gap-2">
                        <AddToArchive url={hit.url} />
                        <a href={hit.url} target="_blank" rel="noreferrer" aria-label="Open on YouTube">
                          <ArrowUpRight size={13} className="text-muted hover:text-signal" />
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {!loading && !hits && (
        <section className="mt-7">
          <Empty
            title="Search the live short-form market"
            body="Start with a topic from your archive. The scorer keeps only shorts with real velocity, then ranks them by pace, like rate and recency."
            action={
              topics.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    const topic = topics[0].topic;
                    setQuery(topic);
                    void run(topic);
                  }}
                  className="btn btn-primary h-9 text-[11px]"
                >
                  Try “{topics[0].topic}”
                </button>
              ) : undefined
            }
          />
          <p className="mt-4 border border-line bg-paper px-3 py-2.5 text-[11.5px] leading-relaxed text-muted">
            Instagram Reels cannot be searched through Meta&apos;s public API. For now, send the Reels
            that matter into the archive and use this desk for live YouTube outliers; an Apify or
            Meta-approved connection can be added without changing the rest of the pipeline.
          </p>
        </section>
      )}
    </div>
  );
}
