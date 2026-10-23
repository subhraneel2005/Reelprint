import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, CornerDownRight } from "lucide-react";
import { LiveJob } from "@/components/LiveJob";
import { ReelCard } from "@/components/ReelCard";
import { ReelRecovery } from "@/components/ReelRecovery";
import { ResearchPanel } from "@/components/ResearchPanel";
import { ScoreMeter, SectionHead, Stat, Tag } from "@/components/Bits";
import { Thumb } from "@/components/Thumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getReel, latestJobForReel } from "@/lib/db";
import { getCachedResearch } from "@/lib/research";
import { similarTo } from "@/lib/search";
import { compactNumber, formatDuration, percent, platformLabel, timeAgo, truncate } from "@/lib/util";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const reel = getReel(id);
  if (!reel) return { title: "Reel not found — Reelprint" };

  return {
    title: `${truncate(reel.title || reel.caption || "Reel", 60)} — Reelprint`,
    description: reel.dna?.hook || reel.caption || undefined,
  };
}

export default async function ReelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reel = getReel(id);
  if (!reel) notFound();

  const job = latestJobForReel(id);
  const cached = getCachedResearch(id);
  const similar = similarTo(reel, 6);
  const dna = reel.dna;
  const hasTranscript = Boolean(reel.transcript && reel.transcript.trim().length > 0);
  const needsHelp = reel.status === "needs_transcript" || reel.status === "error";
  const processing = reel.status === "processing" || reel.status === "queued";
  const words = reel.transcript ? reel.transcript.trim().split(/\s+/).length : 0;
  const statusLabel = processing
    ? "Reading"
    : reel.status === "needs_transcript"
      ? "Transcript needed"
      : reel.status === "error"
        ? "Analysis failed"
        : "Ready";

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/library">
          <ArrowLeft className="size-4" aria-hidden />
          Archive
        </Link>
      </Button>

      <header className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{platformLabel(reel.platform)}</span>
            <span aria-hidden>/</span>
            <span>{reel.author ?? "Unknown creator"}</span>
            <span aria-hidden>/</span>
            <span>{timeAgo(reel.posted_at || reel.created_at)}</span>
            {reel.transcript_source && (
              <>
                <span aria-hidden>/</span>
                <span>via {reel.transcript_source}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={needsHelp ? "destructive" : processing ? "secondary" : "default"}>
              {statusLabel}
            </Badge>
            <Button asChild variant="outline" size="sm">
              <a href={reel.url} target="_blank" rel="noreferrer">
                Original
                <ArrowUpRight className="size-3.5" aria-hidden />
              </a>
            </Button>
          </div>
        </div>

        <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight sm:text-4xl">
          {reel.title || dna?.hook || reel.caption || "Untitled reel"}
        </h1>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[330px_1fr] lg:gap-8">
        <aside className="mx-auto w-full max-w-[300px] space-y-3.5 lg:mx-0 lg:sticky lg:top-6 lg:max-w-none lg:self-start">
          <Card className="gap-0 p-2">
            <Thumb
              id={reel.id}
              remote={reel.thumbnail}
              alt={truncate(reel.title || reel.caption || "Reel", 90)}
              label={platformLabel(reel.platform)}
              className="aspect-[4/5] rounded-lg"
            />
            <Button asChild variant="outline" className="mt-2 w-full justify-between">
              <a href={reel.url} target="_blank" rel="noreferrer">
                Watch at source
                <ArrowUpRight className="size-3.5" aria-hidden />
              </a>
            </Button>
          </Card>

          <Card className="gap-0 p-4">
            <ScoreMeter score={reel.engagement?.score} />
            <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3.5">
              <Stat label="Views" value={compactNumber(reel.views)} />
              <Stat label="Likes" value={compactNumber(reel.likes)} />
              <Stat label="Comments" value={compactNumber(reel.comments)} />
              <Stat label="Followers" value={compactNumber(reel.followers)} />
              <Stat label="Like rate" value={percent(reel.engagement?.like_rate)} />
              <Stat
                label="Pace"
                value={
                  reel.engagement?.views_per_hour
                    ? `${compactNumber(Math.round(reel.engagement.views_per_hour))}/hr`
                    : "—"
                }
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5 border-t pt-3.5">
              <Tag tone="line">{formatDuration(reel.duration)}</Tag>
              <Tag tone="line">{words} words</Tag>
              {reel.engagement?.label && (
                <Tag tone={reel.engagement.score && reel.engagement.score >= 70 ? "tape" : "line"}>
                  {reel.engagement.label}
                </Tag>
              )}
            </div>
          </Card>

          {processing && job && <LiveJob jobId={job.id} label="Analysis in progress" />}
        </aside>

        <div className="min-w-0 space-y-6">
          {needsHelp && (
            <ReelRecovery
              reelId={reel.id}
              status={reel.status}
              error={reel.error}
              hasTranscript={hasTranscript}
              jobId={job?.id}
            />
          )}

          <ResearchPanel
            reelId={reel.id}
            initial={cached}
            initialSimilar={[]}
            hasTranscript={hasTranscript}
          />

          <section>
            <SectionHead
              title="Content DNA"
              aside={dna ? `${dna.keywords.length} keywords` : "Not extracted"}
            />
            {dna ? (
              <Card className="p-4">
                <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">Topic</div>
                    <p className="mt-1 text-2xl font-semibold leading-tight">
                      {dna.topic || "Unclassified"}
                    </p>
                    {dna.subtopic && (
                      <p className="mt-1 text-sm text-muted-foreground">{dna.subtopic}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Stat label="Format" value={dna.format || "—"} />
                    <Stat label="Hook type" value={dna.hook_type || "—"} />
                    <Stat label="Pace" value={dna.pace || "—"} />
                    <Stat label="Reusability" value={`${dna.reusability}/10`} />
                  </div>
                </div>

                {dna.hook && (
                  <blockquote className="mt-5 rounded-lg border bg-accent/50 p-4">
                    <div className="text-xs font-medium text-primary">The hook</div>
                    <p className="mt-1.5 text-base leading-snug">“{dna.hook}”</p>
                  </blockquote>
                )}

                <div className="mt-5 grid gap-4 border-t pt-4 sm:grid-cols-2">
                  {dna.format_detail && (
                    <div className="sm:col-span-2">
                      <div className="text-xs font-medium text-muted-foreground">
                        Format mechanics
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed">{dna.format_detail}</p>
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">Audience</div>
                    <p className="mt-1.5 text-sm leading-relaxed">{dna.target_audience || "—"}</p>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">Emotion</div>
                    <p className="mt-1.5 text-sm leading-relaxed">{dna.emotion || "—"}</p>
                  </div>
                </div>

                {[
                  ["tools", dna.tools],
                  ["keywords", dna.keywords],
                  ["pillars", dna.pillars],
                ].map(([label, values]) =>
                  (values as string[]).length ? (
                    <div key={label as string} className="mt-4">
                      <div className="text-xs font-medium capitalize text-muted-foreground">
                        {label as string}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {(values as string[]).map((value) => (
                          <Tag key={value} tone={label === "pillars" ? "signal" : "line"}>
                            {value}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  ) : null,
                )}

                {dna.why_it_works.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <div className="text-xs font-medium text-muted-foreground">Why it holds</div>
                    <ul className="mt-2 space-y-2">
                      {dna.why_it_works.map((item, index) => (
                        <li key={index} className="flex gap-2 text-sm leading-relaxed">
                          <CornerDownRight
                            className="mt-0.5 size-3.5 shrink-0 text-primary"
                            aria-hidden
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">
                  The DNA appears once the transcript is in. Add a transcript above to continue.
                </p>
              </Card>
            )}
          </section>

          {dna && dna.structure.length > 0 && (
            <section>
              <SectionHead title="Structure" aside={`${dna.structure.length} beats`} />
              <Card className="gap-0 p-0">
                <ol className="divide-y">
                  {dna.structure.map((beat, index) => (
                    <li key={index} className="grid grid-cols-[36px_1fr] gap-3 p-4">
                      <span className="font-mono text-xs text-primary">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="text-sm font-medium leading-snug">{beat.beat}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {beat.purpose}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </Card>
            </section>
          )}

          {(reel.visual_summary || dna?.visual_style) && (
            <section>
              <SectionHead title="What the frames show" aside="Vision pass" />
              <Card className="p-4">
                <p className="text-sm leading-relaxed">
                  {reel.visual_summary || dna?.visual_style}
                </p>
                {dna?.visual_style && reel.visual_summary && (
                  <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
                    Style · {dna.visual_style}
                  </p>
                )}
              </Card>
            </section>
          )}

          <section>
            <SectionHead
              title="Transcript"
              aside={
                hasTranscript
                  ? `${words} words · ${reel.transcript_source ?? "unknown source"}`
                  : "Missing"
              }
            />
            <Card className="gap-0 p-0">
              {reel.caption && (
                <div className="border-b p-4">
                  <div className="text-xs font-medium text-muted-foreground">Caption</div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">
                    {reel.caption}
                  </p>
                </div>
              )}

              {hasTranscript ? (
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-4 text-sm font-medium">
                    Read the full transcript
                    <span className="text-xs text-primary group-open:hidden">Open</span>
                    <span className="hidden text-xs text-primary group-open:inline">Close</span>
                  </summary>
                  <div className="max-h-[460px] overflow-y-auto border-t p-4">
                    <p className="whitespace-pre-wrap text-sm leading-7">{reel.transcript}</p>
                  </div>
                </details>
              ) : (
                <p className="p-4 text-sm text-muted-foreground">
                  No transcript yet. Use the recovery panel above to paste one.
                </p>
              )}
            </Card>
          </section>

          {similar.length > 0 && (
            <section>
              <SectionHead
                title="Similar in your archive"
                aside={
                  <Link
                    href={`/library?q=${encodeURIComponent(dna?.topic ?? "")}`}
                    className="text-primary hover:underline"
                  >
                    Search this topic
                  </Link>
                }
              />
              <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
                {similar.slice(0, 3).map((hit) => (
                  <ReelCard key={hit.reel.id} reel={hit.reel} compact />
                ))}
              </div>
            </section>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
            <Button asChild>
              <Link href="/#send">
                Send the next reel
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Link
              href="/discover"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Or go find outliers ↗
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
