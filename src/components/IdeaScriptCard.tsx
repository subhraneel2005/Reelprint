"use client";

import { useState } from "react";
import { Check, Copy, RefreshCw, Sparkles, TriangleAlert } from "lucide-react";
import type { GeneratedScript, ResearchIdea } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";
import { Tag } from "./Bits";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function IdeaScriptCard({
  reelId,
  idea,
  index,
}: {
  reelId: string;
  idea: ResearchIdea;
  index: number;
}) {
  const { toast } = useToast();
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setWarning(null);

    try {
      const response = await fetch("/api/research/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reelId, ideaIndex: index }),
      });
      const data = (await response.json()) as {
        script?: GeneratedScript;
        warning?: string;
        error?: string;
      };
      if (!response.ok || !data.script) throw new Error(data.error ?? "Could not write the script");

      setScript(data.script);
      setWarning(data.warning ?? null);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!script) return;

    const text = [
      script.title || idea.title,
      "",
      script.script,
      "",
      "SHOT LIST",
      ...script.shot_list.map(
        (shot) => `${shot.time} — ${shot.shot}${shot.on_screen ? ` (on screen: ${shot.on_screen})` : ""}`,
      ),
      "",
      `CAPTION\n${script.caption}`,
      script.hashtags.length ? script.hashtags.join(" ") : "",
      "",
      `CTA: ${script.cta}`,
    ]
      .filter((line) => line !== undefined)
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ status: "success", title: "Script copied" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ status: "error", title: "Could not copy the script" });
    }
  };

  const words = script?.script.trim().split(/\s+/).filter(Boolean).length ?? 0;

  return (
    <article
      className={cn(
        "rounded-xl border p-4",
        !script && index === 0 && "border-primary/30 bg-primary/5",
        script && "sm:col-span-2",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-xs text-primary">
          {String(index + 1).padStart(2, "0")}
        </span>
        <Tag
          tone={
            idea.difficulty === "low" ? "line" : idea.difficulty === "high" ? "signal" : "tape"
          }
        >
          {idea.difficulty}
        </Tag>
      </div>

      <h4 className="mt-2 text-sm font-medium leading-snug">{idea.title}</h4>
      <p className="mt-2 border-l-2 border-primary pl-2.5 text-sm leading-snug">“{idea.hook}”</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{idea.angle}</p>
      <p className="mt-2 text-xs font-medium">{idea.format}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
        {!script ? (
          <Button type="button" size="sm" onClick={generate} disabled={loading}>
            {loading ? <Spinner className="size-4" /> : <Sparkles className="size-4" aria-hidden />}
            {loading ? "Writing script…" : "Generate full script"}
          </Button>
        ) : (
          <>
            <Button type="button" size="sm" variant="outline" onClick={generate} disabled={loading}>
              {loading ? (
                <Spinner className="size-4" />
              ) : (
                <RefreshCw className="size-4" aria-hidden />
              )}
              {loading ? "Rewriting…" : "Regenerate"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={copy}>
              {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              {copied ? "Copied" : "Copy script"}
            </Button>
          </>
        )}
        {script?.estimated_duration && (
          <span className="ml-auto text-xs text-muted-foreground">{script.estimated_duration}</span>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mt-3">
          <TriangleAlert aria-hidden />
          <AlertTitle>Could not write this script</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {warning && (
        <Alert className="mt-3">
          <TriangleAlert aria-hidden />
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      )}

      {script && (
        <div className="mt-5 space-y-5 border-t pt-5">
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h5 className="text-sm font-medium">Full script</h5>
              <span className="text-xs text-muted-foreground">
                {words} words · {script.estimated_duration}
              </span>
            </div>
            <div className="mt-3 rounded-xl bg-muted/50 p-4">
              <p className="whitespace-pre-wrap text-sm leading-7">{script.script}</p>
            </div>
          </div>

          {script.shot_list.length > 0 && (
            <div>
              <h5 className="text-sm font-medium">Shot list</h5>
              <ol className="mt-2 divide-y border-y">
                {script.shot_list.map((shot, shotIndex) => (
                  <li key={shotIndex} className="grid grid-cols-[54px_1fr] gap-3 py-2.5">
                    <span className="font-mono text-[11px] text-primary">{shot.time}</span>
                    <div>
                      <p className="text-sm leading-snug">{shot.shot}</p>
                      {shot.on_screen && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          On screen: {shot.on_screen}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
            <div>
              <h5 className="text-sm font-medium">Caption</h5>
              <p className="mt-1.5 text-sm leading-relaxed">{script.caption}</p>
              {script.hashtags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {script.hashtags.map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h5 className="text-sm font-medium">Call to action</h5>
              <p className="mt-1.5 text-sm leading-relaxed">{script.cta}</p>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
