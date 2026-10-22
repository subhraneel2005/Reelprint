import Link from "next/link";
import { IngestForm } from "@/components/IngestForm";
import { ArrowLeft } from "lucide-react";

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
    <div className="mx-auto max-w-[760px]">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted hover:text-ink"
      >
        <ArrowLeft size={12} /> desk
      </Link>
      <header className="mt-4 border-b border-ink pb-4">
        <h1 className="display text-[clamp(2rem,5vw,3.2rem)]">Send it to the desk.</h1>
        <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-muted">
          {shared
            ? "The link from your share sheet is loaded below. Start the analysis, or paste the transcript if the platform blocks the fetch."
            : "Share a Reel or Short into Reelprint from your phone, or paste a link below."}
        </p>
      </header>
      <div className="mt-5">
        <IngestForm defaultUrl={shared} />
      </div>
      <p className="mt-4 border border-line bg-paper px-3 py-2.5 text-[11.5px] leading-relaxed text-muted">
        On Android, install the desk from the browser menu to get Reelprint in the Instagram share
        sheet. On iPhone, use the share sheet to copy the link and paste it here; iOS does not expose
        web share targets to PWAs.
      </p>
    </div>
  );
}
