import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { IngestForm } from "@/components/IngestForm";
import { ReelCard } from "@/components/ReelCard";
import { Empty, SectionHead } from "@/components/Bits";
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
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          <span className="h-1.5 w-1.5 bg-signal" />
          short-form research
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{today}</span>
      </div>

      <section className="pt-7 md:pt-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_260px] lg:items-end">
          <div>
            <h1 className="display max-w-[760px] text-[clamp(2.9rem,7.2vw,5.4rem)]">
              Send the reel.
              <br />
              Get the recipe.
            </h1>
            <p className="mt-5 max-w-[560px] text-[14px] leading-relaxed text-ink-2 sm:text-[15px]">
              Reelprint transcribes the audio, reads the frames, and pulls out the structure that made the
              video work. Then it turns that structure into posts you can actually film, using live
              outliers from your niche.
            </p>
          </div>
          <div className="hidden border-l border-line pl-4 lg:block">
            <p className="font-mono text-[9px] uppercase leading-[1.9] tracking-[0.12em] text-muted">
              send a link
              <br />
              transcript + frames
              <br />
              content DNA
              <br />
              <span className="text-signal">brief + ideas</span>
            </p>
            <p className="mt-4 max-w-[200px] text-[11px] leading-relaxed text-muted">
              No feed scraping. You choose what enters the archive.
            </p>
          </div>
        </div>

        <div id="send" className="mt-7 scroll-mt-24 md:mt-9">
          <IngestForm />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
          <span>
            <span className="text-ink">{stats.ready}</span> reels ready
          </span>
          <span className="h-3 w-px bg-line" />
          <span>
            <span className="text-ink">{stats.minuteCount}</span> minutes indexed
          </span>
          <span className="h-3 w-px bg-line" />
          <span>
            <span className="text-ink">{stats.topics.length}</span> topics tracked
          </span>
          {stats.needsTranscript > 0 && (
            <>
              <span className="h-3 w-px bg-line" />
              <span className="text-signal">{stats.needsTranscript} need a transcript</span>
            </>
          )}
        </div>
      </section>

      {!profile.niche && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border border-line border-l-2 border-l-signal bg-surface px-4 py-3">
          <div>
            <p className="text-[13px] font-medium">Make the ideas fit you.</p>
            <p className="mt-0.5 text-[12px] text-muted">
              Set your niche, audience and pillars once. Every brief adapts to them.
            </p>
          </div>
          <Link href="/creator" className="btn btn-ghost h-8 shrink-0 text-[11px]">
            Set up creator
            <ArrowRight size={13} />
          </Link>
        </div>
      )}

      <section className="mt-10">
        <SectionHead
          title="Recent in the archive"
          aside={
            stats.total > 0 ? (
              <Link href="/library" className="flex items-center gap-1 hover:text-ink">
                All {stats.total} <ArrowUpRight size={12} />
              </Link>
            ) : (
              "nothing indexed yet"
            )
          }
        />
        {reels.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
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

      <section className="mt-12 grid gap-px border border-line bg-line sm:grid-cols-3">
        {[
          ["01", "Send", "A Reel, a Short, or a pasted transcript. No feed scraping."],
          ["02", "Read", "Audio transcribed, frames sampled, structure pulled apart."],
          ["03", "Reuse", "Live outliers scored, then six ideas built on the mechanic."],
        ].map(([number, title, body]) => (
          <div key={number} className="bg-paper p-4">
            <div className="flex items-baseline gap-3">
              <span className="timecode text-[10px] text-signal">{number}</span>
              <span className="display text-[17px]">{title}</span>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </section>

      <p className="mt-8 border-t border-line pt-4 font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted">
        transcripts, embeddings and jobs are stored locally in .data · bring your own keys
      </p>
    </div>
  );
}
