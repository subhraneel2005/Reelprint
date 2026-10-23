import Link from "next/link";
import { IngestForm } from "@/components/IngestForm";
import { ArrowLeft, Share2 } from "lucide-react";
import { Panel, Tag } from "@/components/Bits";
import { TextReveal } from "@/components/motion/text-reveal";

export const dynamic = "force-dynamic";

function urlFrom(value: string) {
  const match = value.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : "";
}

export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string; text?: string; title?: string }>;
}) {
  const params = await searchParams;
  const shared = params.url || urlFrom(params.text ?? "") || "";
  return (
    <div className="mx-auto max-w-[780px]">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:border-ink/30 hover:text-ink"
      >
        <ArrowLeft size={12} /> desk
      </Link>
      <header className="mt-5">
        <Tag tone="signal">
          <Share2 size={10} /> shared link
        </Tag>
        <TextReveal
          as="h1"
          text="Send it to the desk."
          split="word"
          className="display mt-3 text-[clamp(2.2rem,7vw,3.5rem)]"
        />
        <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-muted-foreground">
          {shared
            ? "The link from your share sheet is loaded below. Start the analysis, or paste the transcript if the platform blocks the fetch."
            : "Share a Reel or Short into Reelprint from your phone, or paste a link below."}
        </p>
      </header>
      <div className="mt-5">
        <IngestForm defaultUrl={shared} />
      </div>
      <Panel className="mt-4 px-3.5 py-3 text-[11.5px] leading-relaxed text-muted-foreground">
        On Android, install the desk from the browser menu to get Reelprint in the Instagram share
        sheet. On iPhone, use the share sheet to copy the link and paste it here; iOS does not expose
        web share targets to PWAs.
      </Panel>
    </div>
  );
}
