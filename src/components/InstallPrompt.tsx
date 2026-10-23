"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

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
      className="fixed inset-x-3 bottom-[calc(5.6rem+env(safe-area-inset-bottom))] z-40 rounded-[24px] border border-ink/20 bg-ink text-primary-foreground shadow-[0_24px_60px_-20px_rgba(18,22,20,0.7)] md:hidden"
    >
      <div className="flex items-start gap-3 p-3.5">
        <span className="mt-0.5 grid h-9 w-9 shrink-0 grid-cols-3 items-end gap-[2px] rounded-xl bg-signal p-[6px]" aria-hidden>
          <span className="h-full rounded-[1px] bg-primary-foreground" />
          <span className="h-[55%] rounded-[1px] bg-primary-foreground" />
          <span className="h-[80%] rounded-[1px] bg-primary-foreground" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium leading-snug">Install Reelprint</p>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-primary-foreground/65">
            Send reels straight from Instagram and YouTube. Opens full-screen, no address bar.
          </p>
          <button
            type="button"
            onClick={install}
            className="mt-2.5 inline-flex h-8 items-center gap-1.5 rounded-full bg-signal px-3.5 text-[11px] font-medium text-white active:opacity-80"
          >
            <Download size={13} />
            Add to home screen
          </button>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Not now"
          className="-mr-1 -mt-1 grid h-8 w-8 place-items-center text-primary-foreground/50 active:text-primary-foreground"
        >
          <X size={15} />
        </button>
      </div>
    </aside>
  );
}
