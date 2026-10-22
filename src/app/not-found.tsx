import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-start justify-center">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-signal">404 · no signal</span>
      <h1 className="display mt-3 text-[clamp(2.4rem,6vw,4rem)]">That reel is not in the archive.</h1>
      <p className="mt-3 max-w-md text-[13px] leading-relaxed text-muted">
        It may have been removed, or the link is wrong. Send it again and the desk will read it from
        scratch.
      </p>
      <div className="mt-5 flex gap-2">
        <Link href="/" className="btn btn-primary h-9 text-[11px]">
          Back to the desk
        </Link>
        <Link href="/library" className="btn btn-ghost h-9 text-[11px]">
          Open archive
        </Link>
      </div>
    </div>
  );
}
