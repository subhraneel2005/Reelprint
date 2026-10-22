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
      className="fixed inset-x-3 bottom-[calc(5.6rem+env(safe-area-inset-bottom))] z-40 border border-ink bg-ink text-paper shadow-[0_14px_40px_rgba(17,22,27,0.24)] md:hidden"
    >
      <div className="flex items-start gap-3 p-3.5">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 grid-cols-3 items-end gap-[2px] bg-signal p-[5px]" aria-hidden>
          <span className="h-full bg-paper" />
          <span className="h-[55%] bg-paper" />
          <span className="h-[80%] bg-paper" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium leading-snug">Install Reelprint</p>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-paper/65">
            Send reels straight from Instagram and YouTube. Opens full-screen, no address bar.
          </p>
          <button
            type="button"
            onClick={install}
            className="mt-2.5 inline-flex h-8 items-center gap-1.5 bg-signal px-3 text-[11px] font-medium text-white active:opacity-80"
          >
            <Download size={13} />
            Add to home screen
          </button>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Not now"
          className="-mr-1 -mt-1 grid h-8 w-8 place-items-center text-paper/50 active:text-paper"
        >
          <X size={15} />
        </button>
      </div>
    </aside>
  );
}
