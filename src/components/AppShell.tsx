"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Fingerprint, LibraryBig, Plus, Radio } from "lucide-react";
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
        "grid shrink-0 grid-cols-3 items-end bg-signal",
        small ? "h-7 w-7 gap-[2px] p-[5px]" : "h-9 w-9 gap-[3px] p-[7px]",
      )}
      aria-hidden
    >
      <span className="h-full bg-paper" />
      <span className="h-[55%] bg-paper" />
      <span className="h-[80%] bg-paper" />
    </span>
  );
}

function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("display leading-none", className)}>
      reel<span className="text-signal">/</span>print
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
    <div className="min-h-dvh bg-paper">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col border-r border-line bg-paper md:flex">
        <div className="border-b border-line px-5 pb-5 pt-6">
          <Link href="/" className="flex items-center gap-3">
            <Mark />
            <span>
              <Wordmark className="block text-[21px]" />
              <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                content research desk
              </span>
            </span>
          </Link>
        </div>

        <nav className="flex flex-col py-3">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 border-l-2 px-5 py-2.5 text-[13px] transition-colors",
                  active
                    ? "border-signal bg-surface text-ink"
                    : "border-transparent text-muted hover:bg-surface/70 hover:text-ink",
                )}
              >
                <Icon size={15} strokeWidth={1.75} />
                {item.label}
                {active && <span className="ml-auto h-1.5 w-1.5 bg-signal" aria-hidden />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-line px-5 py-4">
          <Link
            href="/#send"
            className="mb-4 flex items-center justify-between border border-ink bg-ink px-3 py-2.5 text-[12px] text-paper transition-colors hover:border-signal hover:bg-signal"
          >
            Send a reel
            <Plus size={14} />
          </Link>
          <dl className="space-y-1.5 font-mono text-[10px] text-muted">
            <div className="flex items-baseline justify-between">
              <dt>archive</dt>
              <dd className="timecode text-ink">{stats.ready} ready</dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt>runtime</dt>
              <dd className="timecode text-ink">{stats.minuteCount} min</dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt>status</dt>
              <dd className="flex items-center gap-1.5 text-ink">
                <span className="h-1.5 w-1.5 bg-ok" />
                local
              </dd>
            </div>
          </dl>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Reelprint home">
            <Mark small />
            <Wordmark className="text-[19px]" />
          </Link>
          <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
            <span className="h-1.5 w-1.5 bg-ok" />
            {stats.ready} ready
          </div>
        </div>
      </header>

      <main className="md:pl-[232px]">
        <div className="mx-auto w-full max-w-[1240px] px-4 pb-[calc(6.9rem+env(safe-area-inset-bottom))] pt-5 sm:px-7 md:pb-10 md:pt-10">
          {children}
        </div>
      </main>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-paper/95 pb-[calc(0.35rem+env(safe-area-inset-bottom))] pt-1 backdrop-blur-xl md:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 items-end px-1">
          {nav.slice(0, 2).map((item) => (
            <MobileTab key={item.href} item={item} active={isActive(item.href, item.exact)} />
          ))}

          <Link
            href="/#send"
            className="group flex h-[58px] flex-col items-center justify-end gap-1 pb-1"
            aria-label="Send a reel"
          >
            <span
              className={cn(
                "grid h-12 w-12 -translate-y-2 place-items-center border border-ink text-paper shadow-[0_5px_14px_rgba(17,22,27,0.24)] transition-transform active:translate-y-1",
                sendActive ? "bg-ink" : "bg-signal",
              )}
            >
              <Plus size={21} strokeWidth={2} />
            </span>
            <span
              className={cn(
                "font-mono text-[9px] uppercase tracking-[0.1em]",
                sendActive ? "text-ink" : "text-muted",
              )}
            >
              Send
            </span>
          </Link>

          {nav.slice(2).map((item) => (
            <MobileTab key={item.href} item={item} active={isActive(item.href, item.exact)} />
          ))}
        </div>
      </nav>
    </div>
  );
}

function MobileTab({
  item,
  active,
}: {
  item: (typeof nav)[number];
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-[58px] flex-col items-center justify-center gap-1 pb-1 text-[9px] uppercase tracking-[0.08em]",
        active ? "text-ink" : "text-muted",
      )}
    >
      {active && <span className="absolute inset-x-4 top-0 h-[2px] bg-signal" aria-hidden />}
      <Icon size={19} strokeWidth={active ? 2 : 1.65} />
      <span className="font-mono">{item.label}</span>
    </Link>
  );
}
