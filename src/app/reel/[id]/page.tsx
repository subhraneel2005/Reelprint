import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, CornerDownRight } from "lucide-react";
import { LiveJob } from "@/components/LiveJob";
import { ReelCard } from "@/components/ReelCard";
import { ReelRecovery } from "@/components/ReelRecovery";
import { ResearchPanel } from "@/components/ResearchPanel";
import { Panel, ScoreMeter, SectionHead, Stat, Tag } from "@/components/Bits";
import { Thumb } from "@/components/Thumb";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { ButtonLink } from "@/components/motion/button/base";
import { TextReveal } from "@/components/motion/text-reveal";
import { getReel, latestJobForReel } from "@/lib/db";
import { getCachedResearch } from "@/lib/research";
import { similarTo } from "@/lib/search";
import { compactNumber, formatDuration, percent, platformLabel, timeAgo, truncate } from "@/lib/util";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
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
  const statusTone = processing ? "loading" : needsHelp ? "warning" : "success";
  const statusLabel = processing
    ? "reading"
    : reel.status === "needs_transcript"
      ? "transcript needed"
      : reel.status === "error"
        ? "analysis failed"
        : "ready";

  return (
    <div>
      <Link
        href="/library"
        className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:border-ink/30 hover:text-ink"
      >
        <ArrowLeft size={12} /> archive
      </Link>

      <header className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
            <span className="text-ink">{platformLabel(reel.platform)}</span>
            <span>/</span>
            <span>{reel.author ?? "unknown creator"}</span>
            <span>/</span>
            <span>{timeAgo(reel.posted_at || reel.created_at)}</span>
            {reel.transcript_source && (
              <>
                <span>/</span>
                <span>via {reel.transcript_source}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <AnimatedBadge status={statusTone} size="sm" pulse={processing}>
              {statusLabel}
            </AnimatedBadge>
            <a
              href={reel.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-ink/30 hover:text-ink"
            >
              original <ArrowUpRight size={12} />
            </a>
          </div>
        </div>
        <TextReveal
          as="h1"
          text={reel.title || dna?.hook || reel.caption || "Untitled reel"}
          split="word"
          className="display mt-4 max-w-[920px] text-[clamp(1.9rem,4.6vw,3.25rem)]"
          stagger={0.04}
          blur={10}
        />
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[330px_1fr] lg:gap-8">
        <aside className="mx-auto w-full max-w-[300px] space-y-3.5 lg:mx-0 lg:sticky lg:top-6 lg:max-w-none lg:self-start">
          <div className="card-shadow rounded-[26px] border border-border/80 bg-card p-2">
            <Thumb
              id={reel.id}
              remote={reel.thumbnail}
              alt={truncate(reel.title || reel.caption || "Reel", 90)}
              label={platformLabel(reel.platform)}
              className="aspect-[4/5] rounded-[20px]"
            />
            <a
              href={reel.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-3 py-2.5 font-mono text-[9px] uppercase tracking-[0.08em] text-ink transition-colors hover:border-ink/30"
            >
              watch at source
              <ArrowUpRight size={12} />
            </a>
          </div>

          <Panel className="p-4">
            <ScoreMeter score={reel.engagement?.score} />
            <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3.5">
              <Stat label="views" value={compactNumber(reel.views)} />
              <Stat label="likes" value={compactNumber(reel.likes)} />
              <Stat label="comments" value={compactNumber(reel.comments)} />
              <Stat label="followers" value={compactNumber(reel.followers)} />
              <Stat label="like rate" value={percent(reel.engagement?.like_rate)} />
              <Stat
                label="pace"
                value={
                  reel.engagement?.views_per_hour
                    ? `${compactNumber(Math.round(reel.engagement.views_per_hour))}/hr`
                    : "—"
                }
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border/70 pt-3.5">
              <Tag tone="line">{formatDuration(reel.duration)}</Tag>
              <Tag tone="line">{words} words</Tag>
              {reel.engagement?.label && (
                <Tag tone={reel.engagement.score && reel.engagement.score >= 70 ? "tape" : "line"}>
                  {reel.engagement.label}
                </Tag>
              )}
            </div>
          </Panel>

          {processing && job && <LiveJob jobId={job.id} label="analysis in progress" />}
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
              aside={dna ? `${reel.dna?.keywords.length ?? 0} keywords` : "not extracted"}
            />
            {dna ? (
              <Panel className="p-4">
                <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
                  <div>
                    <div className="mono-label">topic</div>
                    <p className="display mt-1 text-[26px] leading-tight">
                      {dna.topic || "Unclassified"}
                    </p>
                    {dna.subtopic && (
                      <p className="mt-1 text-[12px] text-muted-foreground">{dna.subtopic}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Stat label="format" value={dna.format || "—"} />
                    <Stat label="hook type" value={dna.hook_type || "—"} />
                    <Stat label="pace" value={dna.pace || "—"} />
                    <Stat label="reusability" value={`${dna.reusability}/10`} />
                  </div>
                </div>

                {dna.hook && (
                  <blockquote className="mt-5 rounded-[20px] border border-signal/20 bg-signal-soft/70 p-4">
                    <div className="mono-label text-signal">the hook</div>
                    <p className="mt-1.5 text-[15px] leading-snug text-ink">“{dna.hook}”</p>
                  </blockquote>
                )}

                <div className="mt-5 grid gap-4 border-t border-border/70 pt-4 sm:grid-cols-2">
                  {dna.format_detail && (
                    <div className="sm:col-span-2">
                      <div className="mono-label">format mechanics</div>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">
                        {dna.format_detail}
                      </p>
                    </div>
                  )}
                  <div>
                    <div className="mono-label">audience</div>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">
                      {dna.target_audience || "—"}
                    </p>
                  </div>
                  <div>
                    <div className="mono-label">emotion</div>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">
                      {dna.emotion || "—"}
                    </p>
                  </div>
                </div>

                {[
                  ["tools", dna.tools],
                  ["keywords", dna.keywords],
                  ["pillars", dna.pillars],
                ].map(([label, values]) =>
                  (values as string[]).length ? (
                    <div key={label as string} className="mt-4">
                      <div className="mono-label">{label as string}</div>
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
                  <div className="mt-4 border-t border-border/70 pt-4">
                    <div className="mono-label">why it holds</div>
                    <ul className="mt-2 space-y-2">
                      {dna.why_it_works.map((item, index) => (
                        <li key={index} className="flex gap-2 text-[12px] leading-relaxed text-ink-2">
                          <CornerDownRight size={12} className="mt-1 shrink-0 text-signal" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Panel>
            ) : (
              <Panel className="px-4 py-6 text-[12px] text-muted-foreground">
                The DNA appears once the transcript is in. Add a transcript above to continue.
              </Panel>
            )}
          </section>

          {dna && dna.structure.length > 0 && (
            <section>
              <SectionHead title="Structure" aside={`${dna.structure.length} beats`} />
              <Panel>
                <ol className="divide-y divide-border/60">
                  {dna.structure.map((beat, index) => (
                    <li key={index} className="grid grid-cols-[36px_1fr] gap-3 px-4 py-3.5">
                      <span className="timecode mt-0.5 text-[10px] text-signal">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="text-[13px] font-medium leading-snug">{beat.beat}</p>
                        <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                          {beat.purpose}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </Panel>
            </section>
          )}

          {(reel.visual_summary || dna?.visual_style) && (
            <section>
              <SectionHead title="What the frames show" aside="vision pass" />
              <Panel className="p-4">
                {reel.visual_summary ? (
                  <p className="text-[12.5px] leading-relaxed text-ink-2">{reel.visual_summary}</p>
                ) : (
                  <p className="text-[12.5px] leading-relaxed text-ink-2">{dna?.visual_style}</p>
                )}
                {dna?.visual_style && reel.visual_summary && (
                  <p className="mt-3 border-t border-border/70 pt-3 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
                    style · {dna.visual_style}
                  </p>
                )}
              </Panel>
            </section>
          )}

          <section>
            <SectionHead
              title="Transcript"
              aside={
                hasTranscript
                  ? `${words} words · ${reel.transcript_source ?? "unknown source"}`
                  : "missing"
              }
            />
            <Panel>
              {reel.caption && (
                <div className="border-b border-border/70 px-4 py-3.5">
                  <div className="mono-label">caption</div>
                  <p className="mt-1.5 whitespace-pre-wrap text-[12px] leading-relaxed text-ink-2">
                    {reel.caption}
                  </p>
                </div>
              )}
              {hasTranscript ? (
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                    read the full transcript
                    <span className="rounded-full border border-border/70 px-2 py-0.5 text-signal group-open:hidden">
                      open
                    </span>
                    <span className="hidden rounded-full border border-border/70 px-2 py-0.5 text-signal group-open:inline">
                      close
                    </span>
                  </summary>
                  <div className="max-h-[460px] overflow-y-auto border-t border-border/70 px-4 py-3.5">
                    <p className="whitespace-pre-wrap text-[12.5px] leading-[1.8] text-ink-2">
                      {reel.transcript}
                    </p>
                  </div>
                </details>
              ) : (
                <p className="px-4 py-4 text-[12px] text-muted-foreground">
                  No transcript yet. Use the recovery panel above to paste one.
                </p>
              )}
            </Panel>
          </section>

          {similar.length > 0 && (
            <section>
              <SectionHead
                title="Similar in your archive"
                aside={
                  <Link href={`/library?q=${encodeURIComponent(dna?.topic ?? "")}`}>
                    search this topic
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

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-5">
            <ButtonLink href="/#send" size="md" className="px-5">
              Send the next reel <ArrowRight size={14} />
            </ButtonLink>
            <Link
              href="/discover"
              className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-ink"
            >
              or go find outliers ↗
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
