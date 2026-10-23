import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Offline — Reelprint",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background p-6 text-foreground">
      <Card className="w-full max-w-sm p-6">
        <span className="grid size-11 grid-cols-3 items-end gap-0.5 rounded-lg bg-primary p-2" aria-hidden>
          <span className="h-full rounded-[1px] bg-primary-foreground" />
          <span className="h-[55%] rounded-[1px] bg-primary-foreground" />
          <span className="h-[80%] rounded-[1px] bg-primary-foreground" />
        </span>

        <p className="mt-7 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <WifiOff className="size-3.5" aria-hidden />
          No signal
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">The desk is offline.</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Reconnect to send a reel or run research. Everything already transcribed is still saved
          on this device.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Try again</Link>
        </Button>
      </Card>
    </div>
  );
}
