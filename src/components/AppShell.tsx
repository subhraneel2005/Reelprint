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

function Mark() {
  return (
    <span className="grid h-9 w-9 shrink-0 grid-cols-3 items-end gap-[3px] bg-signal p-[7px]" aria-hidden>
      <span className="h-full bg-paper" />
      <span className="h-[55%] bg-paper" />
      <span className="h-[80%] bg-paper" />
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
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col border-r border-line bg-paper md:flex">
        <div className="border-b border-line px-5 pb-5 pt-6">
          <Link href="/" className="flex items-center gap-3">
            <Mark />
            <span>
              <span className="display block text-[21px] leading-none">
                reel<span className="text-signal">/</span>print
              </span>
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
            className="mb-4 flex items-center justify-between border border-ink bg-ink px-3 py-2.5 text-[12px] text-paper transition-colors hover:bg-signal hover:border-signal"
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

      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-7 w-7 grid-cols-3 items-end gap-[2px] bg-signal p-[5px]" aria-hidden>
              <span className="h-full bg-paper" />
              <span className="h-[55%] bg-paper" />
              <span className="h-[80%] bg-paper" />
            </span>
            <span className="display text-lg leading-none">
              reel<span className="text-signal">/</span>print
            </span>
          </Link>
          <Link
            href="/#send"
            className="flex items-center gap-1 border border-ink bg-ink px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wide text-paper"
          >
            <Plus size={12} /> send
          </Link>
        </div>
        <nav className="flex overflow-x-auto border-t border-line">
          {nav.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-[11px]",
                  active
                    ? "border-signal text-ink"
                    : "border-transparent text-muted",
                )}
              >
                <item.icon size={13} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="md:pl-[232px]">
        <div className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-7 md:py-10">{children}</div>
      </main>
    </div>
  );
}
