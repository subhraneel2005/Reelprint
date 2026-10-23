import Link from "next/link";
import { ArrowRight, ArrowUpRight, AudioLines, ScanSearch, Sparkles } from "lucide-react";
import { IngestForm } from "@/components/IngestForm";
import { ReelCard } from "@/components/ReelCard";
import { Empty, SectionHead, Tag } from "@/components/Bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getProfile, libraryStats, listReels } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function Home() {
  const stats = libraryStats();
  const profile = getProfile();
  const reels = listReels(8);
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date());

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Local-first</Badge>
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Short-form research
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{today}</span>
      </div>

      <section className="pt-8 md:pt-11">
        <div className="grid gap-7 lg:grid-cols-[1fr_286px] lg:items-end">
          <div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
              Send the reel.
              <br />
              Get the recipe.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Reelprint transcribes the audio, reads the frames, and pulls out the structure that
              made the video work. Then it turns that structure into posts you can actually film,
              using live outliers from your niche.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Tag tone="signal">Transcript</Tag>
              <Tag tone="tape">Content DNA</Tag>
              <Tag>Live outliers</Tag>
              <Tag>Filmable ideas</Tag>
            </div>
          </div>

          <Card className="hidden gap-0 p-4 lg:block">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              The desk pass
            </p>
            <ol className="mt-3 space-y-3">
              {[
                ["01", "Send a link"],
                ["02", "Transcript + frames"],
                ["03", "Content DNA"],
                ["04", "Brief + ideas"],
              ].map(([n, label]) => (
                <li key={n} className="flex items-center gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border bg-background text-xs text-muted-foreground">
                    {n}
                  </span>
                  <span className="flex-1 text-sm">{label}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 border-t pt-3 text-xs leading-relaxed text-muted-foreground">
              No feed scraping. You choose what enters the archive.
            </p>
          </Card>
        </div>

        <div id="send" className="mt-8 scroll-mt-24 md:mt-10">
          <IngestForm />
        </div>

        <Card className="mt-4 flex flex-row flex-wrap items-center gap-x-5 gap-y-2 p-3.5">
          <span className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{stats.ready}</span> ready
          </span>
          <span className="hidden h-3 w-px bg-border sm:block" aria-hidden />
          <span className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{stats.minuteCount}</span> min indexed
          </span>
          <span className="hidden h-3 w-px bg-border sm:block" aria-hidden />
          <span className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{stats.topics.length}</span> topics
          </span>
          {stats.needsTranscript > 0 && (
            <>
              <span className="hidden h-3 w-px bg-border sm:block" aria-hidden />
              <span className="text-xs text-primary">
                {stats.needsTranscript} need a transcript
              </span>
            </>
          )}
        </Card>
      </section>

      {!profile.niche && (
        <Card className="mt-8 flex flex-row flex-wrap items-center justify-between gap-4 border-l-2 border-l-primary p-4">
          <div>
            <p className="text-sm font-medium">Make the ideas fit you.</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Set your niche, audience and pillars once. Every brief adapts to them.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/creator">
              Set up creator
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </Card>
      )}

      <section className="mt-11">
        <SectionHead
          title="Recent in the archive"
          aside={
            stats.total > 0 ? (
              <Link
                href="/library"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                All {stats.total} <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
            ) : (
              "Nothing indexed yet"
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
            body="Send your first Reel or Short above. The transcript, content DNA, search index and research brief all build from that one link."
            action={
              <Button asChild size="sm">
                <Link href="#send">
                  Send the first reel
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            }
          />
        )}
      </section>

      <section className="mt-12">
        <SectionHead title="How the desk works" aside="One link in, one brief out" />
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              icon: Sparkles,
              title: "Send a link",
              body: "Drop a Reel, a Short, or a pasted transcript. Reelprint never scrapes a feed; you decide what enters the archive.",
            },
            {
              icon: AudioLines,
              title: "Read the source",
              body: "The audio is transcribed, frames are sampled when you ask, and the structure is pulled apart into hook, pacing, proof and payoff.",
            },
            {
              icon: ScanSearch,
              title: "Reuse the mechanic",
              body: "Live outliers get scored, then the research brief turns the mechanic into filmable ideas shaped around your niche and pillars.",
            },
          ].map((step) => {
            const Icon = step.icon;

            return (
              <Card key={step.title} className="gap-0 p-4">
                <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="size-4" aria-hidden />
                </span>
                <h3 className="mt-3 text-sm font-medium">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <p className="mt-8 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
        Transcripts, embeddings and jobs are stored locally in .data · bring your own keys
      </p>
    </div>
  );
}
