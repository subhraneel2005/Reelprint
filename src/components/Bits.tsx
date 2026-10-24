import { type ReactNode } from "react";
import { Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Empty as EmptyRoot,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

const toneVariant = {
  line: "outline",
  signal: "destructive",
  tape: "secondary",
  ink: "outline",
  ok: "secondary",
} as const;

const toneClass = {
  signal: "bg-destructive text-destructive-foreground",
  ok: "bg-emerald-600 text-white",
} as const;

export type TagTone = keyof typeof toneVariant;

export function Tag({
  children,
  tone = "line",
  className,
}: {
  children: ReactNode;
  tone?: TagTone;
  className?: string;
}) {
  return (
    <Badge
      variant={toneVariant[tone]}
      className={cn(tone in toneClass ? toneClass[tone as keyof typeof toneClass] : undefined, className)}
    >
      {children}
    </Badge>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn("flex flex-wrap items-end justify-between gap-4", className)}
    >
      <div className="max-w-2xl">
        {eyebrow && (
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {eyebrow}
          </div>
        )}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-sm font-medium tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function ScoreMeter({
  score,
  label = "engagement score",
}: {
  score?: number | null;
  label?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-medium tabular-nums">{score ?? "—"}</span>
      </div>
      <Progress
        value={score ?? 0}
        className="mt-2 h-1.5"
        aria-label={`${label}: ${score ?? "not available"}`}
      />
    </div>
  );
}

export function SectionHead({
  title,
  aside,
  className,
}: {
  title: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-baseline justify-between gap-3", className)}>
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {aside && <span className="text-xs text-muted-foreground">{aside}</span>}
    </div>
  );
}

export function Panel({
  as = "div",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { as?: "div" | "section" }) {
  const Comp = as;

  return (
    <Comp
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-sm",
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

export function Empty({
  title,
  body,
  action,
  icon,
  className,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <EmptyRoot className={cn("border bg-card p-10", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon ?? <Inbox className="size-4" />}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {body && <EmptyDescription>{body}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </EmptyRoot>
  );
}
