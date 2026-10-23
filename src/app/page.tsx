import Link from "next/link";
import { ArrowRight, ArrowUpRight, AudioLines, ScanSearch, Sparkles } from "lucide-react";
import { IngestForm } from "@/components/IngestForm";
import { ReelCard } from "@/components/ReelCard";
import { Empty, Panel, SectionHead, Tag } from "@/components/Bits";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { BouncyAccordion } from "@/components/motion/bouncy-accordion";
import { ButtonLink } from "@/components/motion/button/base";
import { TextReveal } from "@/components/motion/text-reveal";
import { getProfile, libraryStats, listReels } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function Home() {
  const stats = libraryStats();
  const profile = getProfile();
  const reels = listReels(8);
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AnimatedBadge status="success" size="sm" pulse={false}>
            local-first
          </AnimatedBadge>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
            short-form research
          </span>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
          {today}
        </span>
      </div>

      <section className="pt-8 md:pt-11">
        <div className="grid gap-7 lg:grid-cols-[1fr_286px] lg:items-end">
          <div>
            <TextReveal
              as="h1"
              text={["Send the reel.", "Get the recipe."]}
              split="word"
              className="display max-w-[780px] text-[clamp(2.7rem,11.6vw,5.6rem)] text-ink"
              stagger={0.055}
              delay={0.05}
              blur={14}
            />
            <p className="mt-5 max-w-[570px] text-[14px] leading-relaxed text-ink-2 sm:text-[15px]">
              Reelprint transcribes the audio, reads the frames, and pulls out the structure that made the
              video work. Then it turns that structure into posts you can actually film, using live
              outliers from your niche.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Tag tone="signal">transcript</Tag>
              <Tag tone="tape">content DNA</Tag>
              <Tag>live outliers</Tag>
              <Tag>filmable ideas</Tag>
            </div>
          </div>

          <div className="hidden rounded-[26px] border border-border/80 bg-card/65 p-4 backdrop-blur-sm lg:block">
            <p className="mono-label">the desk pass</p>
            <ol className="mt-3 space-y-3">
              {[
                ["01", "send a link"],
                ["02", "transcript + frames"],
                ["03", "content DNA"],
                ["04", "brief + ideas"],
              ].map(([n, label], i) => (
                <li key={n} className="flex items-center gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border border-border bg-background font-mono text-[8px] text-muted-foreground">
                    {n}
                  </span>
                  <span className="flex-1 text-[11px] text-ink-2">{label}</span>
                  <span
                    className={`h-px flex-1 ${i === 3 ? "bg-signal/70" : "bg-border"}`}
                    aria-hidden
                  />
                </li>
              ))}
            </ol>
            <p className="mt-4 border-t border-border/70 pt-3 text-[10.5px] leading-relaxed text-muted-foreground">
              No feed scraping. You choose what enters the archive.
            </p>
          </div>
        </div>

        <div id="send" className="mt-8 scroll-mt-24 md:mt-10">
          <IngestForm />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 rounded-[20px] border border-border/70 bg-card/45 px-4 py-3 sm:flex sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
            <span className="text-ink">{stats.ready}</span> ready
          </span>
          <span className="hidden h-3 w-px bg-border sm:block" />
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
            <span className="text-ink">{stats.minuteCount}</span> min indexed
          </span>
          <span className="hidden h-3 w-px bg-border sm:block" />
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
            <span className="text-ink">{stats.topics.length}</span> topics
          </span>
          {stats.needsTranscript > 0 && (
            <>
              <span className="hidden h-3 w-px bg-border sm:block" />
              <span className="col-span-3 text-[9px] uppercase tracking-[0.1em] text-signal sm:col-auto">
                {stats.needsTranscript} need a transcript
              </span>
            </>
          )}
        </div>
      </section>

      {!profile.niche && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-border/80 border-l-2 border-l-signal bg-card px-4 py-3.5 card-shadow">
          <div>
            <p className="text-[13px] font-medium text-ink">Make the ideas fit you.</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Set your niche, audience and pillars once. Every brief adapts to them.
            </p>
          </div>
          <ButtonLink href="/creator" variant="outline" size="sm" className="shrink-0">
            Set up creator
            <ArrowRight size={13} />
          </ButtonLink>
        </div>
      )}

      <section className="mt-11">
        <SectionHead
          title="Recent in the archive"
          aside={
            stats.total > 0 ? (
              <Link href="/library" className="flex items-center gap-1 transition-colors hover:text-ink">
                All {stats.total} <ArrowUpRight size={12} />
              </Link>
            ) : (
              "nothing indexed yet"
            )
          }
        />
        {reels.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
            {reels.map((reel) => (
              <ReelCard key={reel.id} reel={reel} />
            ))}
          </div>
        ) : (
          <Empty
            title="The archive is empty"
            body="Send your first Reel or Short above. The transcript, the content DNA, the search index and the research brief all build from that one link."
            action={
              <a href="#send" className="btn btn-primary h-9 text-[11px]">
                Send the first reel <ArrowRight size={13} />
              </a>
            }
          />
        )}
      </section>

      <section className="mt-12">
        <SectionHead title="How the desk works" aside="one link in, one brief out" />
        <Panel className="overflow-hidden p-1.5">
          <BouncyAccordion
            defaultValue="send"
            collapsible={false}
            items={[
              {
                id: "send",
                title: "Send a link",
                description:
                  "Drop a Reel, a Short, or a pasted transcript. Reelprint never scrapes a feed; you decide what enters the archive.",
                icon: <Sparkles size={16} />,
              },
              {
                id: "read",
                title: "Read the source",
                description:
                  "The audio is transcribed, frames are sampled when you ask, and the structure is pulled apart into hook, pacing, proof and payoff.",
                icon: <AudioLines size={16} />,
              },
              {
                id: "reuse",
                title: "Reuse the mechanic",
                description:
                  "Live outliers get scored, then the research brief turns the mechanic into filmable ideas shaped around your niche and pillars.",
                icon: <ScanSearch size={16} />,
              },
            ]}
          />
        </Panel>
      </section>

      <p className="mt-8 border-t border-border/70 pt-4 font-mono text-[9px] uppercase leading-relaxed tracking-[0.1em] text-muted-foreground">
        transcripts, embeddings and jobs are stored locally in .data · bring your own keys
      </p>
    </div>
  );
}
