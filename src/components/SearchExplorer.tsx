"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CircleAlert, Search, X } from "lucide-react";
import type { Reel, SearchHit } from "@/lib/types";
import { compactNumber, formatDuration, percent, platformLabel, timeAgo, truncate } from "@/lib/util";
import { Empty, SectionHead, Tag } from "./Bits";
import { ReelCard } from "./ReelCard";
import { Thumb } from "./Thumb";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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

    const timer = setTimeout(
      () => {
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
      },
      firstRun.current ? 0 : 380,
    );

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
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Archive</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{counts.ready} ready</Badge>
            <span>
              {counts.total} sent · hybrid retrieval over your own reels
            </span>
          </div>
        </div>
        <p className="hidden max-w-sm text-right text-xs text-muted-foreground sm:block">
          Keyword + vector, fused and reranked. Nothing from a feed scrape.
        </p>
      </div>

      <Card className="mt-5 gap-0 p-3">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                if (!event.target.value.trim()) clearSearch();
              }}
              placeholder="Search topic, format or a line"
              aria-label="Search the archive"
              className="h-11 pl-9 pr-10"
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute right-1 top-1/2 -translate-y-1/2"
              >
                <X className="size-4" aria-hidden />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
              <TabsList className="grid w-full grid-cols-3">
                {MODES.map((entry) => (
                  <TabsTrigger key={entry.key} value={entry.key} className="text-xs">
                    {entry.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <Select
              value={platform || "all"}
              onValueChange={(value) => setPlatform(value === "all" ? "" : value)}
            >
              <SelectTrigger className="h-9 w-[140px]" aria-label="Filter by platform">
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

        {topics.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t pt-2.5">
            <span className="px-1 text-xs text-muted-foreground">Topics</span>
            {topics.slice(0, 9).map((topic) => {
              const active = query.toLowerCase() === topic.topic.toLowerCase();

              return (
                <Button
                  key={topic.topic}
                  type="button"
                  variant={active ? "secondary" : "outline"}
                  size="sm"
                  className="h-7 rounded-full px-2.5 text-xs"
                  onClick={() => setQuery(topic.topic)}
                >
                  {topic.topic}
                  <span className="text-muted-foreground">{topic.count}</span>
                </Button>
              );
            })}
          </div>
        )}
      </Card>

      {searching ? (
        <section className="mt-6" aria-live="polite">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <Badge variant={loading ? "default" : "secondary"}>
              {loading ? "Searching…" : `${hits?.length ?? 0} results`}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {!loading && meta ? `${meta.mode} · ${meta.took} ms · ` : ""}
              Query: {truncate(query, 44)}
            </span>
          </div>

          {error && (
            <Alert variant="destructive">
              <CircleAlert aria-hidden />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading && !hits && (
            <div className="space-y-2">
              {[0, 1, 2].map((row) => (
                <Card key={row} className="flex flex-row gap-3 p-3">
                  <Skeleton className="aspect-[4/5] w-[82px] rounded-lg" />
                  <div className="flex-1 space-y-2 pt-2">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                </Card>
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
                <Button asChild size="sm">
                  <Link href="/#send">Send a reel</Link>
                </Button>
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
      className={cn(
        "group grid grid-cols-[82px_1fr] gap-3 rounded-lg border border-transparent p-2.5",
        "hover:border-border hover:bg-card sm:grid-cols-[112px_1fr] sm:gap-4 sm:p-3",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <div className="relative">
        <Thumb
          id={reel.id}
          remote={reel.thumbnail}
          alt={truncate(reel.title ?? "Reel", 60)}
          className="aspect-[4/5] rounded-lg"
        />
        <span className="absolute bottom-1 right-1 rounded-full bg-foreground/80 px-1.5 py-0.5 text-[10px] text-background tabular-nums">
          {formatDuration(reel.duration)}
        </span>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{platformLabel(reel.platform)}</span>
          <span aria-hidden>/</span>
          <span className="truncate">{reel.author ?? "Unknown"}</span>
          <span aria-hidden>/</span>
          <span>{timeAgo(reel.posted_at || reel.created_at)}</span>
          <span className="ml-auto text-foreground">{compactNumber(reel.views)} views</span>
        </div>

        <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary">
          {reel.title || reel.caption || "Untitled reel"}
        </h3>

        {hit.snippet && (
          <p
            className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground [&_mark]:bg-primary/15 [&_mark]:text-foreground"
            dangerouslySetInnerHTML={{ __html: safeSnippet(hit.snippet) }}
          />
        )}

        {hit.reason && <p className="mt-1 text-xs font-medium text-primary">{hit.reason}</p>}

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {reel.dna?.format && <Tag tone="line">{reel.dna.format}</Tag>}
          {hit.keyword_rank && <Tag tone="line">kw #{hit.keyword_rank}</Tag>}
          {hit.vector_score !== null && hit.vector_score !== undefined && (
            <Tag tone="line">cos {hit.vector_score.toFixed(2)}</Tag>
          )}
          {reel.engagement?.like_rate != null && (
            <span className="ml-auto text-xs text-muted-foreground">
              {percent(reel.engagement.like_rate)} like rate
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
