"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { Reel, SearchHit } from "@/lib/types";
import { compactNumber, formatDuration, percent, platformLabel, timeAgo, truncate, cn } from "@/lib/util";
import { Empty, SectionHead, Tag } from "./Bits";
import { ReelCard } from "./ReelCard";
import { Thumb } from "./Thumb";

type Mode = "hybrid" | "keyword" | "vector";

const MODES: { key: Mode; label: string }[] = [
  { key: "hybrid", label: "Hybrid" },
  { key: "keyword", label: "Keywords" },
  { key: "vector", label: "Meaning" },
];

function safeSnippet(html: string) {
  return html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/&lt;mark&gt;/g, "<mark>")
    .replace(/&lt;\/mark&gt;/g, "</mark>");
}

export function SearchExplorer({
  initialReels,
  topics,
  initialQuery,
  initialPlatform,
  initialMode,
  counts,
}: {
  initialReels: Reel[];
  topics: { topic: string; count: number }[];
  initialQuery: string;
  initialPlatform: string;
  initialMode: string;
  counts: { total: number; ready: number };
}) {
  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState<Mode>(
    ["hybrid", "keyword", "vector"].includes(initialMode) ? (initialMode as Mode) : "hybrid",
  );
  const [platform, setPlatform] = useState(initialPlatform);
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ took: number; mode: Mode } | null>(null);
  const firstRun = useRef(true);

  useEffect(() => {
    const clean = query.trim();
    if (!clean) return;
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ q: clean, mode });
      if (platform) params.set("platform", platform);
      fetch(`/api/search?${params.toString()}`, { cache: "no-store" })
        .then(async (response) => {
          const data = (await response.json()) as {
            hits?: SearchHit[];
            error?: string;
            took?: number;
            mode?: Mode;
          };
          if (!response.ok) throw new Error(data.error ?? "Search failed");
          setHits(data.hits ?? []);
          setMeta({ took: data.took ?? 0, mode: data.mode ?? mode });
        })
        .catch((caught) => setError((caught as Error).message))
        .finally(() => setLoading(false));
    }, firstRun.current ? 0 : 380);
    firstRun.current = false;
    return () => clearTimeout(timer);
  }, [query, mode, platform]);

  const filteredInitial = useMemo(
    () => (platform ? initialReels.filter((reel) => reel.platform === platform) : initialReels),
    [initialReels, platform],
  );

  const searching = query.trim().length > 0;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink pb-3">
        <div>
          <h1 className="display text-[clamp(2rem,4vw,2.9rem)]">Archive</h1>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
            {counts.ready} ready · {counts.total} sent · hybrid retrieval over your own reels
          </p>
        </div>
        <div className="hidden max-w-[560px] text-right font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted sm:block">
          keyword + vector, fused and reranked · nothing from a feed scrape
        </div>
      </div>

      <div className="mt-5 border border-line bg-surface p-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search the archive</span>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => {
                const value = event.target.value;
                setQuery(value);
                if (!value.trim()) {
                  setHits(null);
                  setError(null);
                  setLoading(false);
                }
              }}
              className="input h-11 pl-9 pr-8 text-[13px]"
              placeholder="Find reels by topic, format or a line you remember"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setHits(null);
                  setError(null);
                  setLoading(false);
                }}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-ink"
              >
                <X size={14} />
              </button>
            )}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="grid flex-1 grid-cols-3 border border-line bg-paper">
              {MODES.map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  onClick={() => setMode(entry.key)}
                  className={cn(
                    "min-h-11 px-2 font-mono text-[10px] uppercase tracking-[0.08em]",
                    mode === entry.key ? "bg-ink text-paper" : "text-muted hover:text-ink",
                  )}
                >
                  {entry.label}
                </button>
              ))}
            </div>
            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
              className="input h-11 w-full px-2 py-0 font-mono text-[10px] uppercase tracking-[0.06em] sm:w-auto"
              aria-label="Filter by platform"
            >
              <option value="">All platforms</option>
              <option value="instagram">Instagram</option>
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
            </select>
          </div>
        </div>

        {topics.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 border-t border-line pt-2">
            <span className="py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">topics</span>
            {topics.slice(0, 9).map((topic) => (
              <button
                key={topic.topic}
                type="button"
                onClick={() => setQuery(topic.topic)}
                className={cn(
                  "border px-1.5 py-1 font-mono text-[9.5px]",
                  query.toLowerCase() === topic.topic.toLowerCase()
                    ? "border-signal bg-signal-soft text-signal"
                    : "border-line bg-paper text-ink-2 hover:border-ink",
                )}
              >
                {topic.topic} <span className="text-muted">{topic.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {searching ? (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted">
            <span>
              {loading ? "searching…" : `${hits?.length ?? 0} results`}
              {!loading && meta ? ` · ${meta.mode} · ${meta.took} ms` : ""}
            </span>
            <span>query: {truncate(query, 44)}</span>
          </div>

          {error && (
            <div className="border border-signal/40 bg-signal-soft px-3 py-2 text-[12px] text-signal">{error}</div>
          )}

          {loading && !hits && (
            <div className="space-y-3">
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex animate-pulse gap-3 border-b border-line py-4">
                  <div className="aspect-[4/5] w-[86px] bg-paper-2" />
                  <div className="flex-1 space-y-2 pt-2">
                    <div className="h-2 w-1/3 bg-paper-2" />
                    <div className="h-3 w-2/3 bg-paper-2" />
                    <div className="h-2 w-full bg-paper-2" />
                    <div className="h-2 w-4/5 bg-paper-2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && hits && hits.length === 0 && (
            <Empty
              title="No match in the archive"
              body="Try a broader phrase, switch to Meaning, or send a new reel that covers this topic."
            />
          )}

          <div className="divide-y divide-line">
            {hits?.map((hit) => (
              <ResultRow key={hit.reel.id} hit={hit} />
            ))}
          </div>
        </section>
      ) : (
        <section className="mt-8">
          <SectionHead
            title="All reels"
            aside={`${filteredInitial.length} shown${platform ? ` · ${platformLabel(platform)}` : ""}`}
          />
          {filteredInitial.length ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
              {filteredInitial.map((reel) => (
                <ReelCard key={reel.id} reel={reel} />
              ))}
            </div>
          ) : (
            <Empty
              title="Nothing here yet"
              body="Send a reel on the desk and it will appear in the archive with its transcript, DNA and search index."
              action={
                <Link href="/#send" className="btn btn-primary h-9 text-[11px]">
                  Send a reel
                </Link>
              }
            />
          )}
        </section>
      )}
    </div>
  );
}

function ResultRow({ hit }: { hit: SearchHit }) {
  const { reel } = hit;
  return (
    <Link href={`/reel/${reel.id}`} className="group grid grid-cols-[82px_1fr] gap-3 py-4 sm:grid-cols-[112px_1fr] sm:gap-4">
      <div className="relative">
        <Thumb id={reel.id} remote={reel.thumbnail} alt={truncate(reel.title ?? "Reel", 60)} className="aspect-[4/5]" />
        <span className="timecode absolute bottom-0 right-0 bg-ink/85 px-1 py-0.5 text-[9px] text-paper">
          {formatDuration(reel.duration)}
        </span>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[9px] uppercase tracking-[0.09em] text-muted">
          <span className="text-ink">{platformLabel(reel.platform)}</span>
          <span>/</span>
          <span className="truncate">{reel.author ?? "unknown"}</span>
          <span>/</span>
          <span>{timeAgo(reel.posted_at || reel.created_at)}</span>
          <span className="ml-auto text-ink">{compactNumber(reel.views)} views</span>
        </div>
        <h3 className="mt-1 line-clamp-2 text-[14px] font-medium leading-snug group-hover:text-signal">
          {reel.title || reel.caption || "Untitled reel"}
        </h3>
        {hit.snippet && (
          <p
            className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-muted"
            dangerouslySetInnerHTML={{ __html: safeSnippet(hit.snippet) }}
          />
        )}
        {hit.reason && (
          <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.06em] text-signal">{hit.reason}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {reel.dna?.format && <Tag tone="line">{reel.dna.format}</Tag>}
          {hit.keyword_rank && <Tag tone="line">kw #{hit.keyword_rank}</Tag>}
          {hit.vector_score !== null && hit.vector_score !== undefined && (
            <Tag tone="line">cos {hit.vector_score.toFixed(2)}</Tag>
          )}
          {reel.engagement?.like_rate != null && (
            <span className="ml-auto font-mono text-[9.5px] uppercase tracking-[0.06em] text-muted">
              {percent(reel.engagement.like_rate)} like rate
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
