"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Fingerprint, LibraryBig, Plus, Radio } from "lucide-react";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { ButtonLink } from "@/components/motion/button/base";
import { Dock, DockItem, DockSeparator } from "@/components/motion/dock";
import { SharedLayoutBg } from "@/components/motion/shared-layout-bg";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { cn } from "@/lib/util";

const nav = [
  { href: "/", label: "Desk", icon: Radio, exact: true },
  { href: "/library", label: "Archive", icon: LibraryBig },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/creator", label: "Creator", icon: Fingerprint },
];

function Mark({ small = false }: { small?: boolean }) {
  return (
    <span
      className={cn(
        "grid shrink-0 grid-cols-3 items-end rounded-[10px] bg-primary shadow-[0_8px_18px_-10px_rgba(224,69,42,0.8)]",
        small ? "h-8 w-8 gap-[2px] p-[6px]" : "h-10 w-10 gap-[3px] p-[8px]",
      )}
      aria-hidden
    >
      <span className="h-full rounded-[1px] bg-primary-foreground" />
      <span className="h-[55%] rounded-[1px] bg-primary-foreground" />
      <span className="h-[80%] rounded-[1px] bg-primary-foreground" />
    </span>
  );
}

function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("display leading-none", className)}>
      reel<span className="text-primary">/</span>print
    </span>
  );
}

export function AppShell({
  children,
  stats,
}: {
  children: React.ReactNode;
  stats: { ready: number; total: number; minuteCount: number };
}) {
  const pathname = usePathname();
  if (pathname === "/offline") return <>{children}</>;

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);
  const sendActive = pathname === "/share";

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-4 left-4 z-30 hidden w-[238px] flex-col overflow-hidden rounded-[30px] border border-border/80 bg-card/80 shadow-[0_30px_80px_-52px_rgba(18,22,20,0.65)] backdrop-blur-xl md:flex">
        <div className="border-b border-border/70 px-5 pb-5 pt-6">
          <Link href="/" className="flex items-center gap-3">
            <Mark />
            <span>
              <Wordmark className="block text-[22px]" />
              <span className="mt-1 block font-mono text-[8.5px] uppercase tracking-[0.17em] text-muted-foreground">
                content research desk
              </span>
            </span>
          </Link>
        </div>

        <nav className="px-3 py-4" aria-label="Primary">
          <p className="mb-2 px-3.5 font-mono text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground">
            workspace
          </p>
          <SharedLayoutBg as="div" className="gap-1" inset={0}>
            {nav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[13px] transition-colors",
                    active
                      ? "bg-ink text-primary-foreground shadow-[0_12px_24px_-18px_rgba(18,22,20,0.9)]"
                      : "text-muted-foreground hover:text-ink",
                  )}
                >
                  <Icon size={16} strokeWidth={active ? 2.1 : 1.7} />
                  <span className="flex-1">{item.label}</span>
                  {active && <span className="size-1.5 rounded-full bg-primary" aria-hidden />}
                </Link>
              );
            })}
          </SharedLayoutBg>
        </nav>

        <div className="mx-3 mt-1 rounded-[22px] border border-border/70 bg-background/55 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[8.5px] uppercase tracking-[0.13em] text-muted-foreground">
              live index
            </span>
            <AnimatedBadge status="success" size="sm" pulse={false}>
              local
            </AnimatedBadge>
          </div>
          <dl className="mt-3 space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-[11px] text-muted-foreground">Reels ready</dt>
              <dd className="timecode text-[12px] text-ink">
                <AnimatedNumber value={stats.ready} />
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-[11px] text-muted-foreground">Minutes read</dt>
              <dd className="timecode text-[12px] text-ink">
                <AnimatedNumber value={stats.minuteCount} />
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-[11px] text-muted-foreground">Sent</dt>
              <dd className="timecode text-[12px] text-ink">
                <AnimatedNumber value={stats.total} />
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-auto border-t border-border/70 p-3">
          <ButtonLink
            href="/#send"
            size="md"
            className="w-full justify-between px-4"
            aria-label="Send a reel"
          >
            Send a reel
            <Plus size={15} />
          </ButtonLink>
          <p className="mt-3 px-1 font-mono text-[8px] uppercase leading-relaxed tracking-[0.1em] text-muted-foreground">
            local-first · no feed scraping
          </p>
        </div>
      </aside>

      <header className="sticky top-0 z-40 px-3 pt-[calc(0.65rem+env(safe-area-inset-top))] md:hidden">
        <div className="flex h-14 items-center justify-between rounded-[20px] border border-border/70 bg-card/85 px-3.5 shadow-[0_18px_40px_-30px_rgba(18,22,20,0.7)] backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Reelprint home">
            <Mark small />
            <Wordmark className="text-[19px]" />
          </Link>
          <div className="flex items-center gap-2">
            <AnimatedBadge status="success" size="sm" pulse={false}>
              <AnimatedNumber value={stats.ready} /> ready
            </AnimatedBadge>
          </div>
        </div>
      </header>

      <main className="md:pl-[270px]">
        <div className="mx-auto w-full max-w-[1240px] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5 sm:px-7 md:pb-12 md:pt-8">
          {children}
        </div>
      </main>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden"
      >
        <Dock size={50} className="gap-1 rounded-[26px] border-border/80 bg-card/85 px-2 py-1.5 shadow-[0_24px_60px_-28px_rgba(18,22,20,0.75)]">
          {nav.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <DockItem key={item.href} active={active} aria-label={item.label}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-full"
                >
                  <Icon size={18} strokeWidth={active ? 2.2 : 1.7} />
                  <span className="font-mono text-[7.5px] uppercase tracking-[0.06em]">{item.label}</span>
                </Link>
              </DockItem>
            );
          })}

          <DockSeparator />

          <DockItem active={sendActive} aria-label="Send a reel">
            <Link
              href="/#send"
              className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_12px_24px_-10px_rgba(224,69,42,0.9)]"
            >
              <Plus size={21} strokeWidth={2.2} />
            </Link>
          </DockItem>

          <DockSeparator />

          {nav.slice(2).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <DockItem key={item.href} active={active} aria-label={item.label}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-full"
                >
                  <Icon size={18} strokeWidth={active ? 2.2 : 1.7} />
                  <span className="font-mono text-[7.5px] uppercase tracking-[0.06em]">{item.label}</span>
                </Link>
              </DockItem>
            );
          })}
        </Dock>
      </nav>
    </div>
  );
}
