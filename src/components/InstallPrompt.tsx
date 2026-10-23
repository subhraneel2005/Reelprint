"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "reelprint:install-dismissed";

export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (standalone || localStorage.getItem(DISMISSED_KEY) === "1") return;

    const onPrompt = (caught: Event) => {
      caught.preventDefault();
      setEvent(caught as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onInstalled = () => {
      setEvent(null);
      setVisible(false);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  const install = async () => {
    if (!event) return;

    try {
      await event.prompt();
      await event.userChoice;
    } catch {
      // The browser can reject a prompt if it was already used.
    }

    setEvent(null);
    setVisible(false);
  };

  if (!visible || !event) return null;

  return (
    <aside
      aria-label="Install Reelprint"
      className="fixed inset-x-3 bottom-[calc(5.6rem+env(safe-area-inset-bottom))] z-40 md:hidden"
    >
      <Card className="gap-0 border bg-card p-3.5 shadow-lg">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
            <Download className="size-4" aria-hidden />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-snug">Install Reelprint</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Send reels straight from Instagram and YouTube. Opens full-screen, no address bar.
            </p>
            <Button type="button" size="sm" onClick={install} className="mt-2.5">
              <Download className="size-4" aria-hidden />
              Add to home screen
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={dismiss}
            aria-label="Dismiss install prompt"
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>
      </Card>
    </aside>
  );
}
