import Link from "next/link";
import { Thumb } from "./Thumb";
import type { Reel } from "@/lib/types";
import { compactNumber, formatDuration, percent, platformLabel, timeAgo, truncate } from "@/lib/util";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { Loader } from "@/components/motion/loader";
import { TiltCard } from "@/components/motion/tilt-card";
import { Tag } from "@/components/Bits";

export function ReelCard({ reel, compact = false }: { reel: Reel; compact?: boolean }) {
  const title = reel.title || reel.caption || "Untitled";
  const score = reel.engagement?.score;
  const pending = reel.status !== "ready";
  const pendingTone =
    reel.status === "error"
      ? "danger"
      : reel.status === "needs_transcript"
        ? "warning"
        : "loading";
  const pendingLabel =
    reel.status === "needs_transcript"
      ? "transcript needed"
      : reel.status === "error"
        ? "analysis failed"
        : "reading";

  return (
    <TiltCard max={5} className="group rounded-[24px] border border-border/70 bg-card p-2 card-shadow">
      <article>
        <Link href={`/reel/${reel.id}`} className="block">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] bg-paper-2">
            <Thumb
              id={reel.id}
              remote={reel.thumbnail}
              alt={truncate(title, 80)}
              label={platformLabel(reel.platform)}
              className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
            <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2">
              <AnimatedBadge
                status="neutral"
                size="sm"
                showIcon={false}
                className="border-border/70 bg-card/85 px-2 text-[9px] uppercase tracking-[0.1em] backdrop-blur"
              >
                {platformLabel(reel.platform)}
              </AnimatedBadge>
              {score !== null && score !== undefined && (
                <Tag tone="tape" className="timecode border-tape/30 bg-tape px-2 py-1 text-[10px] normal-case tracking-normal">
                  {score}
                </Tag>
              )}
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-2">
              {reel.duration ? (
                <span className="timecode rounded-full bg-ink/80 px-2 py-1 text-[9.5px] text-primary-foreground backdrop-blur">
                  {formatDuration(reel.duration)}
                </span>
              ) : (
                <span />
              )}
              {reel.dna?.format && (
                <span className="max-w-[65%] truncate rounded-full bg-card/85 px-2 py-1 font-mono text-[8.5px] uppercase tracking-[0.06em] text-ink backdrop-blur">
                  {reel.dna.format}
                </span>
              )}
            </div>
            {pending && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-paper/82 px-4 text-center backdrop-blur-[2px]">
                {reel.status === "processing" || reel.status === "queued" ? (
                  <Loader variant="ascii-line" size={20} label={pendingLabel} className="text-primary" />
                ) : null}
                <AnimatedBadge
                  status={pendingTone}
                  size="sm"
                  className="bg-card/90 uppercase tracking-[0.1em]"
                >
                  {pendingLabel}
                </AnimatedBadge>
              </div>
            )}
          </div>

          <div className="px-1 pb-1 pt-3">
            <div className="flex items-baseline justify-between gap-2 font-mono text-[8.5px] uppercase tracking-[0.09em] text-muted-foreground">
              <span className="truncate">{reel.author || "unknown creator"}</span>
              <span className="shrink-0">{timeAgo(reel.posted_at || reel.created_at)}</span>
            </div>
            <h3 className="mt-1.5 line-clamp-2 text-[13.5px] font-medium leading-snug tracking-[-0.01em] text-ink transition-colors group-hover:text-signal">
              {title}
            </h3>
            {!compact && (
              <div className="mt-2 flex items-center gap-2 font-mono text-[9px] text-muted-foreground">
                <span>{compactNumber(reel.views)} views</span>
                <span className="text-border">/</span>
                <span>
                  {reel.engagement?.like_rate != null
                    ? `${percent(reel.engagement.like_rate)} likes`
                    : "no rate"}
                </span>
              </div>
            )}
          </div>
        </Link>
      </article>
    </TiltCard>
  );
}
