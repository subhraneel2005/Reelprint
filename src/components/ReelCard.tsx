import Link from "next/link";
import { Thumb } from "./Thumb";
import type { Reel } from "@/lib/types";
import { compactNumber, formatDuration, percent, platformLabel, timeAgo, truncate } from "@/lib/util";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export function ReelCard({ reel, compact = false }: { reel: Reel; compact?: boolean }) {
  const title = reel.title || reel.caption || "Untitled";
  const score = reel.engagement?.score;
  const pending = reel.status !== "ready";
  const pendingLabel =
    reel.status === "needs_transcript"
      ? "Transcript needed"
      : reel.status === "error"
        ? "Analysis failed"
        : "Reading";

  return (
    <Card className="group gap-0 overflow-hidden p-2">
      <article>
        <Link href={`/reel/${reel.id}`} className="block">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-muted">
            <Thumb
              id={reel.id}
              remote={reel.thumbnail}
              alt={truncate(title, 80)}
              label={platformLabel(reel.platform)}
              className="absolute inset-0"
            />

            <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2">
              <Badge variant="secondary" className="bg-card/90">
                {platformLabel(reel.platform)}
              </Badge>
              {score !== null && score !== undefined && (
                <Badge variant="secondary" className="bg-card/90 tabular-nums">
                  {score}
                </Badge>
              )}
            </div>

            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-2">
              {reel.duration ? (
                <Badge variant="secondary" className="bg-foreground/80 text-background tabular-nums">
                  {formatDuration(reel.duration)}
                </Badge>
              ) : (
                <span />
              )}
              {reel.dna?.format && (
                <Badge variant="secondary" className="max-w-[65%] truncate bg-card/90">
                  {reel.dna.format}
                </Badge>
              )}
            </div>

            {pending && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 px-4 text-center">
                {(reel.status === "processing" || reel.status === "queued") && (
                  <Spinner className="size-5 text-primary" />
                )}
                <Badge variant={reel.status === "error" ? "destructive" : "secondary"}>
                  {pendingLabel}
                </Badge>
              </div>
            )}
          </div>

          <div className="px-1 pb-1 pt-3">
            <div className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
              <span className="truncate">{reel.author || "Unknown creator"}</span>
              <span className="shrink-0">{timeAgo(reel.posted_at || reel.created_at)}</span>
            </div>
            <h3 className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug transition-colors group-hover:text-primary">
              {title}
            </h3>
            {!compact && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{compactNumber(reel.views)} views</span>
                <span aria-hidden>/</span>
                <span>
                  {reel.engagement?.like_rate != null
                    ? `${percent(reel.engagement.like_rate)} likes`
                    : "No rate"}
                </span>
              </div>
            )}
          </div>
        </Link>
      </article>
    </Card>
  );
}
