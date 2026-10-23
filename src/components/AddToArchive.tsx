"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tag } from "@/components/Bits";
import { cn } from "@/lib/utils";

export function AddToArchive({ url, className }: { url: string; className?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [reelId, setReelId] = useState<string | null>(null);

  const add = async () => {
    setState("loading");

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
      toast({
        status: "success",
        title: "Queued for analysis",
        description: "The reel is being transcribed and read.",
        action: {
          label: "Open reel",
          onClick: () => router.push(`/reel/${data.reel!.id}`),
        },
      });
    } catch (caught) {
      setState("error");
      toast({
        status: "error",
        title: "Could not archive that",
        description: (caught as Error).message,
      });
    }
  };

  if (state === "done" && reelId) {
    return (
      <Link href={`/reel/${reelId}`} className={className}>
        <Tag tone="ok">
          <Check className="size-3" aria-hidden />
          In queue
        </Tag>
      </Link>
    );
  }

  return (
    <Button
      type="button"
      onClick={add}
      disabled={state === "loading"}
      variant="secondary"
      size="sm"
      className={cn("h-7 px-2.5 text-xs", className)}
    >
      {state === "loading" ? (
        <Spinner className="size-3" />
      ) : (
        <Plus className="size-3" aria-hidden />
      )}
      {state === "loading" ? "Queueing" : state === "error" ? "Retry" : "Archive"}
    </Button>
  );
}
