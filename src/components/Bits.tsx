import { AnimatedNumber } from "@/components/motion/animated-number";
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
      <div className="mono-label">{label}</div>
      <div className="timecode mt-1.5 truncate text-[17px] font-medium text-ink">
        {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
      </div>
      {sub && <div className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function ScoreMeter({
  score,
  label,
}: {
  score: number | null | undefined;
  label?: string;
}) {
  const value = score ?? 0;
  const tone =
    value >= 70 ? "var(--signal)" : value >= 40 ? "var(--tape)" : "var(--line-strong)";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="mono-label">{label ?? "engagement score"}</span>
        <span className="timecode text-[12px]">{score ?? "—"}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-paper-2">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: tone }}
        />
      </div>
    </div>
  );
}

const tones = {
  line: "border-border bg-card text-ink-2",
  signal: "border-signal/25 bg-signal-soft text-signal",
  tape: "border-tape/50 bg-tape/20 text-ink",
  ink: "border-ink bg-ink text-primary-foreground",
  ok: "border-emerald-600/20 bg-emerald-500/10 text-emerald-700",
};

export function Tag({
  children,
  tone = "line",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.09em]",
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
    <div
      id={id}
      className="mb-4 flex flex-wrap items-baseline justify-between gap-3 border-b border-border/80 pb-3"
    >
      <h2 className="display text-[23px] tracking-[-0.035em]">{title}</h2>
      {aside && (
        <div className="rounded-full border border-border/70 bg-card/60 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
          {aside}
        </div>
      )}
    </div>
  );
}

export function Panel({
  children,
  className,
  as: Tag = "div",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "aside";
  id?: string;
}) {
  return (
    <Tag
      id={id}
      className={cn(
        "card-shadow rounded-[26px] border border-border/80 bg-card text-card-foreground",
        className,
      )}
    >
      {children}
    </Tag>
  );
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
    <div className="dot-grid card-shadow rounded-[28px] border border-border/80 bg-card/80 px-6 py-12 text-center">
      <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl border border-border bg-paper-2/70">
        <span className="size-2 rounded-full bg-signal" />
      </div>
      <h3 className="display text-[22px]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
        {body}
      </p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
