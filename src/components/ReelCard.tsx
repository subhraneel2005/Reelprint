import Link from "next/link";
import { Thumb } from "./Thumb";
import type { Reel } from "@/lib/types";
import { compactNumber, formatDuration, percent, platformLabel, timeAgo, truncate } from "@/lib/util";

export function ReelCard({ reel, compact = false }: { reel: Reel; compact?: boolean }) {
  const title = reel.title || reel.caption || "Untitled";
  const score = reel.engagement?.score;
  const pending = reel.status !== "ready";

  return (
    <article className="group">
      <Link href={`/reel/${reel.id}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-paper-2">
          <Thumb
            id={reel.id}
            remote={reel.thumbnail}
            alt={truncate(title, 80)}
            label={platformLabel(reel.platform)}
            className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2">
            <span className="bg-ink/85 px-1.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-paper">
              {platformLabel(reel.platform)}
            </span>
            {score !== null && score !== undefined && (
              <span
                className="timecode px-1.5 py-1 text-[10px] font-medium text-ink"
                style={{ background: score >= 70 ? "var(--tape)" : "color-mix(in srgb, var(--paper) 92%, transparent)" }}
                title={`Engagement score ${score}/100`}
              >
                {score}
              </span>
            )}
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-2">
            {reel.duration ? (
              <span className="timecode bg-ink/85 px-1.5 py-1 text-[10px] text-paper">
                {formatDuration(reel.duration)}
              </span>
            ) : (
              <span />
            )}
            {reel.dna?.format && (
              <span className="max-w-[65%] truncate bg-paper/90 px-1.5 py-1 font-mono text-[9px] uppercase tracking-wide text-ink">
                {reel.dna.format}
              </span>
            )}
          </div>
          {pending && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-paper/80 px-4 text-center">
              <span className={`h-1.5 w-1.5 ${reel.status === "processing" || reel.status === "queued" ? "animate-pulse bg-signal" : "bg-ink"}`} />
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink">
                {reel.status === "needs_transcript"
                  ? "transcript needed"
                  : reel.status === "error"
                    ? "analysis failed"
                    : "reading"}
              </span>
            </div>
          )}
        </div>

        <div className="pt-2.5">
          <div className="flex items-baseline justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
            <span className="truncate">{reel.author || "unknown creator"}</span>
            <span className="shrink-0">{timeAgo(reel.posted_at || reel.created_at)}</span>
          </div>
          <h3 className="mt-1 line-clamp-2 text-[13.5px] font-medium leading-snug tracking-[-0.01em] group-hover:text-signal">
            {title}
          </h3>
          {!compact && (
            <div className="mt-1.5 flex items-center gap-3 font-mono text-[10px] text-muted">
              <span>{compactNumber(reel.views)} views</span>
              <span className="text-line-strong">/</span>
              <span>{reel.engagement?.like_rate != null ? `${percent(reel.engagement.like_rate)} likes` : "no rate"}</span>
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}
