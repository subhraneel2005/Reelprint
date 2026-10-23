"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Fingerprint, LibraryBig, Plus, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
        "grid shrink-0 grid-cols-3 items-end rounded-lg bg-primary",
        small ? "size-8 gap-0.5 p-1.5" : "size-9 gap-0.5 p-2",
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
    <span className={cn("font-semibold tracking-tight", className)}>
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

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b bg-background/95">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Reelprint home">
            <Mark />
            <Wordmark className="text-lg" />
          </Link>

          <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Primary">
            {nav.map((item) => {
              const active = isActive(item.href, item.exact);
              const Icon = item.icon;

              return (
                <Button
                  key={item.href}
                  asChild
                  variant={active ? "secondary" : "ghost"}
                  size="sm"
                >
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className="gap-2"
                  >
                    <Icon className="size-4" aria-hidden />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Badge variant="secondary" className="hidden gap-1.5 sm:inline-flex">
              <span className="size-1.5 rounded-full bg-emerald-600" aria-hidden />
              {stats.ready} ready
            </Badge>
            <Button asChild size="sm">
              <Link href="/#send">
                <Plus className="size-4" aria-hidden />
                <span className="hidden sm:inline">Send a reel</span>
                <span className="sm:hidden">Send</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-28 md:px-6 md:py-8 md:pb-10">
        {children}
      </main>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 md:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2">
          {nav.slice(0, 2).map((item) => (
            <MobileNavItem key={item.href} item={item} active={isActive(item.href, item.exact)} />
          ))}

          <Link
            href="/#send"
            className="flex flex-col items-center gap-1 py-1 text-[11px] font-medium text-primary"
          >
            <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground">
              <Plus className="size-5" aria-hidden />
            </span>
            Send
          </Link>

          {nav.slice(2).map((item) => (
            <MobileNavItem key={item.href} item={item} active={isActive(item.href, item.exact)} />
          ))}
        </div>
      </nav>
    </div>
  );
}

function MobileNavItem({
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
        "flex flex-col items-center gap-1 rounded-md px-1 py-1 text-[11px]",
        active ? "font-medium text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="size-5" aria-hidden />
      {item.label}
    </Link>
  );
}
