import { cn } from "@/lib/util";

export function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="font-mono text-[9px] uppercase tracking-[0.13em] text-muted">{label}</div>
      <div className="timecode mt-1 truncate text-[15px] text-ink">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted">{sub}</div>}
    </div>
  );
}

export function ScoreMeter({ score, label }: { score: number | null | undefined; label?: string }) {
  const value = score ?? 0;
  const tone = value >= 70 ? "var(--signal)" : value >= 40 ? "var(--tape)" : "var(--line-strong)";
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.13em] text-muted">
          {label ?? "engagement score"}
        </span>
        <span className="timecode text-[12px]">{score ?? "—"}</span>
      </div>
      <div className="mt-1.5 h-[6px] w-full bg-paper-2">
        <div className="h-full" style={{ width: `${Math.min(100, value)}%`, background: tone }} />
      </div>
    </div>
  );
}

export function Tag({
  children,
  tone = "line",
  className,
}: {
  children: React.ReactNode;
  tone?: "line" | "signal" | "tape" | "ink";
  className?: string;
}) {
  const tones = {
    line: "border-line text-ink-2 bg-surface",
    signal: "border-signal/40 text-signal bg-signal-soft",
    tape: "border-tape/60 text-ink bg-tape/25",
    ink: "border-ink text-paper bg-ink",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-[3px] font-mono text-[9.5px] uppercase tracking-[0.08em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionHead({
  title,
  aside,
  id,
}: {
  title: string;
  aside?: React.ReactNode;
  id?: string;
}) {
  return (
    <div id={id} className="mb-4 flex flex-wrap items-baseline justify-between gap-3 border-b border-ink pb-2">
      <h2 className="display text-[22px] tracking-[-0.03em]">{title}</h2>
      {aside && <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{aside}</div>}
    </div>
  );
}

export function Panel({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "aside";
}) {
  return <Tag className={cn("border border-line bg-surface", className)}>{children}</Tag>;
}

export function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="dot-grid border border-line bg-surface px-6 py-12 text-center">
      <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center border border-line-strong bg-paper">
        <span className="h-2 w-2 bg-signal" />
      </div>
      <h3 className="display text-[20px]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-muted">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
