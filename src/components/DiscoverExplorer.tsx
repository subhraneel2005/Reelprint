"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Compass, Search, SlidersHorizontal } from "lucide-react";
import type { YouTubeHit } from "@/lib/types";
import { compactNumber, percent, timeAgo } from "@/lib/util";
import { Empty, Tag } from "./Bits";
import { AddToArchive } from "./AddToArchive";
import { Thumb } from "./Thumb";
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@/components/motion/alert";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { BottomSheet } from "@/components/motion/bottom-sheet";
import { StatefulButton } from "@/components/motion/button/stateful";
import { Input } from "@/components/motion/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/motion/select";
import { TextReveal } from "@/components/motion/text-reveal";
import { TiltCard } from "@/components/motion/tilt-card";

const WINDOWS = [
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "180", label: "6 months" },
  { value: "365", label: "1 year" },
];

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
  const [filtersOpen, setFiltersOpen] = useState(false);
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

  const filtersChanged = days !== 180 || minViews !== 2000;

  return (
    <div>
      <header>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <TextReveal
              as="h1"
              text="Discover"
              split="word"
              className="display text-[clamp(2.2rem,6vw,3.3rem)]"
            />
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
              Live YouTube Shorts, ranked by views per hour, like rate and recency relative to the
              rest of the result set. High engagement only, not raw vanity counts.
            </p>
          </div>
          <AnimatedBadge status={youtubeReady ? "success" : "warning"} size="sm" pulse={false}>
            {youtubeReady ? "live · youtube api" : "youtube key needed"}
          </AnimatedBadge>
        </div>
      </header>

      {!youtubeReady && (
        <Alert variant="warning" className="mt-4 rounded-[22px]" contentClassName="items-start">
          <AlertIcon />
          <AlertContent>
            <AlertTitle>Live discovery is off until a YouTube key is added.</AlertTitle>
            <AlertDescription>
              Create a free key in Google Cloud, enable YouTube Data API v3, then add{" "}
              <code className="rounded bg-card px-1 py-0.5 font-mono text-[10.5px]">YOUTUBE_API_KEY=…</code>{" "}
              to{" "}
              <code className="rounded bg-card px-1 py-0.5 font-mono text-[10.5px]">.env.local</code> and restart.
            </AlertDescription>
          </AlertContent>
        </Alert>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void run(query);
        }}
        className="card-shadow mt-4 rounded-[26px] border border-border/80 bg-card p-3"
      >
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <Input
            value={query}
            onChange={setQuery}
            leftIcon={<Search size={16} />}
            className="flex-1"
            classNames={{
              field: "h-11 rounded-2xl bg-background/60",
              input: "text-[13px]",
            }}
            placeholder="coding workflow, AI side project"
            aria-label="Search YouTube Shorts"
          />

          <div className="hidden items-center gap-2 lg:flex">
            <Filters
              days={days}
              setDays={setDays}
              minViews={minViews}
              setMinViews={setMinViews}
            />
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-border/80 bg-background/60 px-4 font-mono text-[9px] uppercase tracking-[0.08em] text-ink"
            >
              <SlidersHorizontal size={13} />
              Filters
              {filtersChanged && <span className="size-1.5 rounded-full bg-signal" />}
            </button>
            <StatefulButton
              type="submit"
              disabled={loading || !youtubeReady}
              state={loading ? "loading" : "idle"}
              loadingText="Scoring"
              size="md"
              className="h-11 shrink-0 px-4"
              icon={<Compass size={13} />}
            >
              Find
            </StatefulButton>
          </div>

          <StatefulButton
            type="submit"
            disabled={loading || !youtubeReady}
            state={loading ? "loading" : "idle"}
            loadingText="Scoring"
            size="md"
            className="hidden h-11 shrink-0 px-5 lg:inline-flex"
            icon={<Compass size={13} />}
          >
            Find outliers
          </StatefulButton>
        </div>

        {topics.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-border/70 pt-2.5">
            <span className="px-1 font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted-foreground">
              from your archive
            </span>
            {topics.slice(0, 7).map((topic) => (
              <button
                key={topic.topic}
                type="button"
                onClick={() => {
                  setQuery(topic.topic);
                  void run(topic.topic);
                }}
                className="rounded-full border border-border/80 bg-background/60 px-2.5 py-1 font-mono text-[9px] text-ink-2 transition-colors hover:border-ink/40"
              >
                {topic.topic}
              </button>
            ))}
          </div>
        )}
      </form>

      <BottomSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        snapPoints={["auto"]}
        title="Discovery filters"
        description="Keep the search broad. The scorer finds the velocity inside the window."
      >
        <div className="space-y-4 pt-3">
          <Filters
            days={days}
            setDays={setDays}
            minViews={minViews}
            setMinViews={setMinViews}
            stacked
          />
          <button
            type="button"
            onClick={() => setFiltersOpen(false)}
            className="btn btn-primary h-11 w-full"
          >
            Apply filters
          </button>
        </div>
      </BottomSheet>

      {error && (
        <Alert variant="destructive" className="mt-4 rounded-[22px]" contentClassName="items-start">
          <AlertIcon />
          <AlertContent>
            <AlertTitle>Discovery stopped</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </AlertContent>
        </Alert>
      )}

      {loading && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="animate-pulse rounded-[24px] border border-border/60 bg-card p-2">
              <div className="aspect-video rounded-xl bg-paper-2" />
              <div className="mt-3 h-2 w-1/3 rounded-full bg-paper-2" />
              <div className="mt-2 h-3 w-5/6 rounded-full bg-paper-2" />
            </div>
          ))}
        </div>
      )}

      {!loading && hits && (
        <section className="mt-7">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <AnimatedBadge status="neutral" size="sm">
              {hits.length} shorts · “{searched}”
            </AnimatedBadge>
            <span className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted-foreground">
              views/hour · like rate · recency
            </span>
          </div>
          {hits.length === 0 ? (
            <Empty
              title="No outliers in this window"
              body="Widen the window, lower the view floor, or try a broader phrase. Very narrow queries return too few shorts to score fairly."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {hits.map((hit) => (
                <TiltCard
                  key={hit.id}
                  max={4}
                  className="group rounded-[24px] border border-border/70 bg-card p-2 card-shadow"
                >
                  <article>
                    <a href={hit.url} target="_blank" rel="noreferrer" className="block">
                      <div className="relative aspect-video overflow-hidden rounded-xl">
                        <Thumb
                          remote={hit.thumbnail}
                          alt={hit.title}
                          label="youtube"
                          className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                        <span className="timecode absolute left-1.5 top-1.5 rounded-full bg-ink/80 px-2 py-1 text-[8.5px] text-primary-foreground backdrop-blur">
                          {hit.duration
                            ? `${Math.floor(hit.duration / 60)}:${String(Math.round(hit.duration % 60)).padStart(2, "0")}`
                            : "short"}
                        </span>
                        <Tag
                          tone={hit.score >= 70 ? "tape" : "line"}
                          className="timecode absolute right-1.5 top-1.5 border-transparent bg-card/90 px-2 py-1 text-[10px] normal-case tracking-normal backdrop-blur"
                        >
                          {hit.score}
                        </Tag>
                      </div>
                    </a>
                    <div className="px-1 pb-1 pt-2.5">
                      <div className="flex items-center justify-between gap-2 font-mono text-[8.5px] uppercase tracking-[0.06em] text-muted-foreground">
                        <span className="truncate">{hit.channel}</span>
                        <span className="shrink-0">{timeAgo(hit.published_at)}</span>
                      </div>
                      <a href={hit.url} target="_blank" rel="noreferrer">
                        <h3 className="mt-1 line-clamp-2 text-[12.5px] font-medium leading-snug text-ink transition-colors group-hover:text-signal">
                          {hit.title}
                        </h3>
                      </a>
                      <div className="mt-2 grid grid-cols-3 gap-1 border-y border-border/60 py-1.5 font-mono text-[8.5px] text-muted-foreground">
                        <span>{compactNumber(hit.views)} views</span>
                        <span>{percent(hit.like_rate)} likes</span>
                        <span>{compactNumber(Math.round(hit.views_per_hour))}/hr</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <Tag tone={hit.outlier >= 2 ? "signal" : "line"}>
                          {hit.outlier.toFixed(1)}× pace
                        </Tag>
                        <div className="flex items-center gap-2">
                          <AddToArchive url={hit.url} />
                          <a
                            href={hit.url}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Open on YouTube"
                            className="grid size-7 place-items-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:border-ink/40 hover:text-signal"
                          >
                            <ArrowUpRight size={13} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </article>
                </TiltCard>
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
          <p className="mt-4 rounded-[20px] border border-border/70 bg-card/60 px-3.5 py-3 text-[11.5px] leading-relaxed text-muted-foreground">
            Instagram Reels cannot be searched through Meta&apos;s public API. For now, send the Reels
            that matter into the archive and use this desk for live YouTube outliers; an Apify or
            Meta-approved connection can be added without changing the rest of the pipeline.
          </p>
        </section>
      )}
    </div>
  );
}

function Filters({
  days,
  setDays,
  minViews,
  setMinViews,
  stacked = false,
}: {
  days: number;
  setDays: (days: number) => void;
  minViews: number;
  setMinViews: (views: number) => void;
  stacked?: boolean;
}) {
  return (
    <div className={stacked ? "space-y-3" : "flex items-center gap-2"}>
      <div className={stacked ? "space-y-1.5" : "w-[132px]"}>
        <span className="px-1 font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground">
          window
        </span>
        <Select value={String(days)} onValueChange={(value) => setDays(Number(value))}>
          <SelectTrigger className="h-11 rounded-2xl border-border/80 bg-background/60 px-3 font-mono text-[9px] uppercase tracking-[0.06em]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WINDOWS.map((window) => (
              <SelectItem key={window.value} value={window.value}>
                {window.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={stacked ? "space-y-1.5" : "w-[132px]"}>
        <span className="px-1 font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground">
          min views
        </span>
        <Input
          value={String(minViews)}
          onChange={(value) => setMinViews(Number(value) || 0)}
          inputMode="numeric"
          classNames={{
            field: "h-11 rounded-2xl bg-background/60",
            input: "font-mono text-[10px]",
          }}
          aria-label="Minimum views"
        />
      </div>
    </div>
  );
}
