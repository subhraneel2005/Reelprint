import Link from "next/link";
import { ArrowRight, ArrowUpRight, AudioLines, ScanSearch, Sparkles } from "lucide-react";
import { IngestForm } from "@/components/IngestForm";
import { ReelCard } from "@/components/ReelCard";
import { Empty, SectionHead } from "@/components/Bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProfile, libraryStats, listReels } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const stats = await libraryStats();
  const profile = await getProfile();
  const reels = await listReels(8);

  return (
    <div className="space-y-16">
      <section className="mx-auto max-w-2xl pt-4 text-center sm:pt-10">
        <Badge variant="secondary">Content research, without the scroll</Badge>
        <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Turn one reel into your next post.
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-pretty text-base leading-relaxed text-muted-foreground">
          Paste a link. Get the hook, the structure, and six ideas you can film.
        </p>
      </section>

      <div id="send" className="mx-auto max-w-3xl scroll-mt-24">
        <IngestForm />
      </div>

      {!profile.niche && (
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Add your niche once and every brief will sound like you.
          </p>
          <Button asChild variant="ghost" size="sm">
            <Link href="/creator">
              Set up profile
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      )}

      <section className="mx-auto max-w-5xl">
        <SectionHead
          title="Recent"
          aside={
            stats.total > 0 ? (
              <Link
                href="/library"
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                {stats.total} in archive <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
            ) : (
              "Nothing yet"
            )
          }
        />

        {reels.length ? (
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {reels.map((reel) => (
              <ReelCard key={reel.id} reel={reel} />
            ))}
          </div>
        ) : (
          <Empty
            title="Your archive is empty"
            body="Send a reel above to start building your research desk."
            action={
              <Button asChild size="sm">
                <Link href="#send">Send the first reel</Link>
              </Button>
            }
          />
        )}
      </section>

      <section className="mx-auto max-w-5xl border-t pt-10">
        <div className="grid gap-9 sm:grid-cols-3">
          {[
            {
              icon: Sparkles,
              title: "Send a link",
              body: "A Reel, a Short, or a transcript. You choose what enters the archive.",
            },
            {
              icon: AudioLines,
              title: "Read the source",
              body: "Audio, frames, and structure become one clear content map.",
            },
            {
              icon: ScanSearch,
              title: "Make it yours",
              body: "Turn the mechanic into ideas shaped around your niche.",
            },
          ].map((step) => {
            const Icon = step.icon;

            return (
              <div key={step.title}>
                <span className="grid size-10 place-items-center rounded-xl bg-muted text-foreground">
                  <Icon className="size-4" aria-hidden />
                </span>
                <h2 className="mt-4 text-sm font-medium">{step.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
