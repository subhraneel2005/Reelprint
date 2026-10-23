"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Compass,
  Search,
  SlidersHorizontal,
  TriangleAlert,
} from "lucide-react";
import type { YouTubeHit } from "@/lib/types";
import { compactNumber, percent, timeAgo } from "@/lib/util";
import { Empty, Tag } from "./Bits";
import { AddToArchive } from "./AddToArchive";
import { Thumb } from "./Thumb";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

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
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Discover</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Live YouTube Shorts, ranked by views per hour, like rate and recency relative to the
            rest of the result set. High engagement only, not raw vanity counts.
          </p>
        </div>
        <Badge variant={youtubeReady ? "secondary" : "destructive"}>
          {youtubeReady ? "Live · YouTube API" : "YouTube key needed"}
        </Badge>
      </header>

      {!youtubeReady && (
        <Alert className="mt-4">
          <TriangleAlert aria-hidden />
          <AlertTitle>Live discovery is off until a YouTube key is added.</AlertTitle>
          <AlertDescription>
            Create a free key in Google Cloud, enable YouTube Data API v3, then add{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">YOUTUBE_API_KEY=…</code>{" "}
            to{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">.env.local</code> and
            restart.
          </AlertDescription>
        </Alert>
      )}

      <Card className="mt-4 gap-0 p-3">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void run(query);
          }}
        >
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-end">
            <div className="relative flex-1">
              <Label htmlFor="discover-query" className="sr-only">
                Search YouTube Shorts
              </Label>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="discover-query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="coding workflow, AI side project"
                className="h-11 pl-9"
              />
            </div>

            <div className="hidden items-end gap-2 lg:flex">
              <Filters
                idPrefix="discover-desktop"
                days={days}
                setDays={setDays}
                minViews={minViews}
                setMinViews={setMinViews}
              />
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1"
                onClick={() => setFiltersOpen(true)}
              >
                <SlidersHorizontal className="size-4" aria-hidden />
                Filters
                {filtersChanged && (
                  <span className="size-1.5 rounded-full bg-primary" aria-label="Filters changed" />
                )}
              </Button>
              <Button type="submit" disabled={loading || !youtubeReady} className="h-11">
                {loading ? <Spinner className="size-4" /> : <Compass className="size-4" aria-hidden />}
                Find
              </Button>
            </div>

            <Button
              type="submit"
              disabled={loading || !youtubeReady}
              className="hidden h-11 lg:inline-flex"
            >
              {loading ? <Spinner className="size-4" /> : <Compass className="size-4" aria-hidden />}
              Find outliers
            </Button>
          </div>

          {topics.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t pt-2.5">
              <span className="px-1 text-xs text-muted-foreground">From your archive</span>
              {topics.slice(0, 7).map((topic) => (
                <Button
                  key={topic.topic}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-full px-2.5 text-xs"
                  onClick={() => {
                    setQuery(topic.topic);
                    void run(topic.topic);
                  }}
                >
                  {topic.topic}
                </Button>
              ))}
            </div>
          )}
        </form>
      </Card>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Discovery filters</SheetTitle>
            <SheetDescription>
              Keep the search broad. The scorer finds the velocity inside the window.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <Filters
              idPrefix="discover-sheet"
              days={days}
              setDays={setDays}
              minViews={minViews}
              setMinViews={setMinViews}
              stacked
            />
          </div>
          <SheetFooter>
            <Button type="button" className="h-11 w-full" onClick={() => setFiltersOpen(false)}>
              Apply filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <TriangleAlert aria-hidden />
          <AlertTitle>Discovery stopped</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <Card key={row} className="gap-0 p-2">
              <Skeleton className="aspect-video rounded-lg" />
              <Skeleton className="mt-3 h-3 w-1/3" />
              <Skeleton className="mt-2 h-4 w-5/6" />
            </Card>
          ))}
        </div>
      )}

      {!loading && hits && (
        <section className="mt-7" aria-live="polite">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <Badge variant="secondary">
              {hits.length} shorts · “{searched}”
            </Badge>
            <span className="text-xs text-muted-foreground">
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
                <Card key={hit.id} className="group gap-0 p-2">
                  <article>
                    <a
                      href={hit.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="relative aspect-video overflow-hidden rounded-lg">
                        <Thumb
                          remote={hit.thumbnail}
                          alt={hit.title}
                          label="youtube"
                          className="absolute inset-0"
                        />
                        <span className="absolute left-1.5 top-1.5 rounded-full bg-foreground/80 px-2 py-1 text-[10px] text-background tabular-nums">
                          {hit.duration
                            ? `${Math.floor(hit.duration / 60)}:${String(
                                Math.round(hit.duration % 60),
                              ).padStart(2, "0")}`
                            : "short"}
                        </span>
                        <Tag
                          tone={hit.score >= 70 ? "tape" : "line"}
                          className="absolute right-1.5 top-1.5 bg-card/90 tabular-nums"
                        >
                          {hit.score}
                        </Tag>
                      </div>
                    </a>

                    <div className="px-1 pb-1 pt-2.5">
                      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{hit.channel}</span>
                        <span className="shrink-0">{timeAgo(hit.published_at)}</span>
                      </div>

                      <a href={hit.url} target="_blank" rel="noreferrer">
                        <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary">
                          {hit.title}
                        </h3>
                      </a>

                      <div className="mt-2 grid grid-cols-3 gap-1 border-y py-1.5 text-xs text-muted-foreground">
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
                          <Button asChild variant="outline" size="icon-sm">
                            <a
                              href={hit.url}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`Open “${hit.title}” on YouTube`}
                            >
                              <ArrowUpRight className="size-4" aria-hidden />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                </Card>
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
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const topic = topics[0].topic;
                    setQuery(topic);
                    void run(topic);
                  }}
                >
                  Try “{topics[0].topic}”
                </Button>
              ) : undefined
            }
          />
          <Card className="mt-4 p-3.5">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Instagram Reels cannot be searched through Meta&apos;s public API. For now, send the
              Reels that matter into the archive and use this desk for live YouTube outliers; an
              Apify or Meta-approved connection can be added without changing the rest of the
              pipeline.
            </p>
          </Card>
        </section>
      )}
    </div>
  );
}

function Filters({
  idPrefix,
  days,
  setDays,
  minViews,
  setMinViews,
  stacked = false,
}: {
  idPrefix: string;
  days: number;
  setDays: (days: number) => void;
  minViews: number;
  setMinViews: (views: number) => void;
  stacked?: boolean;
}) {
  return (
    <div className={cn(stacked ? "space-y-3" : "flex items-end gap-2")}>
      <div className={cn("space-y-1.5", !stacked && "w-[132px]")}>
        <Label htmlFor={`${idPrefix}-window`} className="text-xs text-muted-foreground">
          Window
        </Label>
        <Select value={String(days)} onValueChange={(value) => setDays(Number(value))}>
          <SelectTrigger id={`${idPrefix}-window`} className="h-11 w-full">
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

      <div className={cn("space-y-1.5", !stacked && "w-[132px]")}>
        <Label htmlFor={`${idPrefix}-views`} className="text-xs text-muted-foreground">
          Min views
        </Label>
        <Input
          id={`${idPrefix}-views`}
          value={String(minViews)}
          onChange={(event) => setMinViews(Number(event.target.value) || 0)}
          inputMode="numeric"
          className="h-11"
        />
      </div>
    </div>
  );
}
