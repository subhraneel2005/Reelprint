"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Plus } from "lucide-react";

export function AddToArchive({ url, className = "" }: { url: string; className?: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [reelId, setReelId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const add = async () => {
    setState("loading");
    setMessage(null);
    try {
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await response.json()) as { reel?: { id: string }; error?: string };
      if (!response.ok || !data.reel) throw new Error(data.error ?? "Could not queue it");
      setReelId(data.reel.id);
      setState("done");
    } catch (caught) {
      setState("error");
      setMessage((caught as Error).message);
    }
  };

  if (state === "done" && reelId) {
    return (
      <Link
        href={`/reel/${reelId}`}
        className={`inline-flex items-center gap-1 border border-ok/40 bg-ok/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-ok ${className}`}
      >
        <Check size={10} /> in queue
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={state === "loading"}
      title={message ?? undefined}
      className={`inline-flex items-center gap-1 border border-line bg-paper px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-2 hover:border-ink disabled:opacity-50 ${className}`}
    >
      <Plus size={10} /> {state === "loading" ? "queueing…" : state === "error" ? "retry" : "archive"}
    </button>
  );
}
