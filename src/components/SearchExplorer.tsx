"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { Reel, SearchHit } from "@/lib/types";
import { compactNumber, formatDuration, percent, platformLabel, timeAgo, truncate, cn } from "@/lib/util";
import { Empty, SectionHead, Tag } from "./Bits";
import { ReelCard } from "./ReelCard";
import { Thumb } from "./Thumb";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { ButtonLink } from "@/components/motion/button/base";
import { Input } from "@/components/motion/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/motion/select";
import { TextReveal } from "@/components/motion/text-reveal";

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

  const clearSearch = () => {
    setQuery("");
    setHits(null);
    setError(null);
    setLoading(false);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <TextReveal
            as="h1"
            text="Archive"
            split="word"
            className="display text-[clamp(2.2rem,6vw,3.3rem)]"
          />
          <p className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[0.11em] text-muted-foreground">
            <AnimatedBadge status="success" size="sm" pulse={false}>
              {counts.ready} ready
            </AnimatedBadge>
            <span>{counts.total} sent · hybrid retrieval over your own reels</span>
          </p>
        </div>
        <div className="hidden max-w-[560px] text-right font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground sm:block">
          keyword + vector, fused and reranked · nothing from a feed scrape
        </div>
      </div>

      <div className="card-shadow mt-5 rounded-[26px] border border-border/80 bg-card p-3">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <Input
            value={query}
            onChange={(value) => {
              setQuery(value);
              if (!value.trim()) clearSearch();
            }}
            leftIcon={<Search size={16} />}
            rightIcon={
              query ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Clear search"
                  className="grid size-10 place-items-center text-muted-foreground hover:text-ink"
                >
                  <X size={14} />
                </button>
              ) : undefined
            }
            className="flex-1"
            classNames={{
              field: "h-11 rounded-2xl bg-background/60",
              input: "text-[13px]",
            }}
            placeholder="Search topic, format or a line"
            aria-label="Search the archive"
          />

          <div className="flex items-center gap-2">
            <div className="grid flex-1 grid-cols-3 rounded-full border border-border/80 bg-background/60 p-1">
              {MODES.map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  onClick={() => setMode(entry.key)}
                  className={cn(
                    "min-h-9 rounded-full px-2 font-mono text-[9px] uppercase tracking-[0.07em] transition-colors",
                    mode === entry.key
                      ? "bg-ink text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-ink",
                  )}
                >
                  {entry.label}
                </button>
              ))}
            </div>

            <div className="w-[136px] shrink-0">
              <Select
                value={platform || "all"}
                onValueChange={(value) => setPlatform(value === "all" ? "" : value)}
              >
                <SelectTrigger className="h-11 rounded-2xl border-border/80 bg-background/60 px-3 font-mono text-[9px] uppercase tracking-[0.06em]">
                  <SelectValue placeholder="All platforms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All platforms</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {topics.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-border/70 pt-2.5">
            <span className="px-1 font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted-foreground">
              topics
            </span>
            {topics.slice(0, 9).map((topic) => (
              <button
                key={topic.topic}
                type="button"
                onClick={() => setQuery(topic.topic)}
                className={cn(
                  "rounded-full border px-2.5 py-1 font-mono text-[9px] transition-colors",
                  query.toLowerCase() === topic.topic.toLowerCase()
                    ? "border-signal/40 bg-signal-soft text-signal"
                    : "border-border/80 bg-background/60 text-ink-2 hover:border-ink/40",
                )}
              >
                {topic.topic} <span className="text-muted-foreground">{topic.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {searching ? (
        <section className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <AnimatedBadge
              status={loading ? "loading" : "neutral"}
              size="sm"
              contentKey={loading ? "loading" : `${hits?.length ?? 0}`}
            >
              {loading ? "searching" : `${hits?.length ?? 0} results`}
            </AnimatedBadge>
            <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
              {!loading && meta ? `${meta.mode} · ${meta.took} ms · ` : ""}
              query: {truncate(query, 44)}
            </span>
          </div>

          {error && (
            <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-3.5 py-3 text-[12px] text-destructive">
              {error}
            </div>
          )}

          {loading && !hits && (
            <div className="space-y-2">
              {[0, 1, 2].map((row) => (
                <div
                  key={row}
                  className="flex animate-pulse gap-3 rounded-[22px] border border-border/50 bg-card/50 p-3"
                >
                  <div className="aspect-[4/5] w-[82px] rounded-xl bg-paper-2" />
                  <div className="flex-1 space-y-2 pt-2">
                    <div className="h-2 w-1/3 rounded-full bg-paper-2" />
                    <div className="h-3 w-2/3 rounded-full bg-paper-2" />
                    <div className="h-2 w-full rounded-full bg-paper-2" />
                    <div className="h-2 w-4/5 rounded-full bg-paper-2" />
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

          <div className="space-y-1">
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
                <ButtonLink href="/#send" size="sm">
                  Send a reel
                </ButtonLink>
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
    <Link
      href={`/reel/${reel.id}`}
      className="group grid grid-cols-[82px_1fr] gap-3 rounded-[22px] border border-transparent p-2.5 transition-colors hover:border-border/80 hover:bg-card/60 sm:grid-cols-[112px_1fr] sm:gap-4 sm:p-3"
    >
      <div className="relative">
        <Thumb
          id={reel.id}
          remote={reel.thumbnail}
          alt={truncate(reel.title ?? "Reel", 60)}
          className="aspect-[4/5] rounded-xl"
        />
        <span className="timecode absolute bottom-1 right-1 rounded-full bg-ink/80 px-1.5 py-0.5 text-[8.5px] text-primary-foreground">
          {formatDuration(reel.duration)}
        </span>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[8.5px] uppercase tracking-[0.09em] text-muted-foreground">
          <span className="text-ink">{platformLabel(reel.platform)}</span>
          <span>/</span>
          <span className="truncate">{reel.author ?? "unknown"}</span>
          <span>/</span>
          <span>{timeAgo(reel.posted_at || reel.created_at)}</span>
          <span className="ml-auto text-ink">{compactNumber(reel.views)} views</span>
        </div>
        <h3 className="mt-1 line-clamp-2 text-[14px] font-medium leading-snug text-ink transition-colors group-hover:text-signal">
          {reel.title || reel.caption || "Untitled reel"}
        </h3>
        {hit.snippet && (
          <p
            className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: safeSnippet(hit.snippet) }}
          />
        )}
        {hit.reason && (
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.06em] text-signal">{hit.reason}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {reel.dna?.format && <Tag tone="line">{reel.dna.format}</Tag>}
          {hit.keyword_rank && <Tag tone="line">kw #{hit.keyword_rank}</Tag>}
          {hit.vector_score !== null && hit.vector_score !== undefined && (
            <Tag tone="line">cos {hit.vector_score.toFixed(2)}</Tag>
          )}
          {reel.engagement?.like_rate != null && (
            <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.06em] text-muted-foreground">
              {percent(reel.engagement.like_rate)} like rate
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
