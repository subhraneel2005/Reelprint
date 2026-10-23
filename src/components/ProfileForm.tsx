"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import type { Profile } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@/components/motion/alert";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { StatefulButton } from "@/components/motion/button/stateful";
import { Input } from "@/components/motion/input";

export function ProfileForm({ initial }: { initial: Profile }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    handle: initial.handle,
    niche: initial.niche,
    audience: initial.audience,
    pillars: initial.pillars.join(", "),
    voice: initial.voice,
    avoid: initial.avoid,
    goal: initial.goal,
  });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form, value: string) => {
    setSavedAt(null);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const update =
    (key: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      set(key, event.target.value);

  const filled = [form.handle, form.niche, form.audience, form.pillars, form.voice, form.goal].filter(
    (value) => value.trim().length > 0,
  ).length;
  const completeness = Math.round((filled / 6) * 100);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          pillars: form.pillars
            .split(",")
            .map((pillar) => pillar.trim())
            .filter(Boolean),
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not save");
      const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      setSavedAt(time);
      toast({
        status: "success",
        title: "Profile saved",
        description: "Every new research brief will use these settings.",
      });
    } catch (caught) {
      const message = (caught as Error).message;
      setError(message);
      toast({ status: "error", title: "Could not save profile", description: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={save}
      className="card-shadow overflow-hidden rounded-[28px] border border-border/80 bg-card"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border/70 px-4 py-4">
        <div>
          <h2 className="display text-[24px]">Creator profile</h2>
          <p className="mt-1 text-[11.5px] text-muted-foreground">Injected into every research brief.</p>
        </div>
        <div className="w-24 shrink-0 text-right">
          <div className="mono-label">completeness</div>
          <div className="timecode mt-0.5 text-[22px] font-medium text-ink">
            <AnimatedNumber value={completeness} format={(value) => `${Math.round(value)}%`} />
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-paper-2">
            <div
              className="h-full rounded-full bg-signal transition-[width] duration-500"
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Instagram handle"
            value={form.handle}
            onChange={(value) => set("handle", value)}
            placeholder="yourhandle"
            autoComplete="off"
            classNames={{ label: "text-[11px] font-medium" }}
          />
          <Input
            label="Niche"
            value={form.niche}
            onChange={(value) => set("niche", value)}
            placeholder="AI, coding and building projects in public"
            classNames={{ label: "text-[11px] font-medium" }}
          />
        </div>

        <Input
          label="Who is watching"
          value={form.audience}
          onChange={(value) => set("audience", value)}
          placeholder="Beginner developers who want to ship real projects"
          classNames={{ label: "text-[11px] font-medium" }}
        />

        <Input
          label="Content pillars"
          value={form.pillars}
          onChange={(value) => set("pillars", value)}
          placeholder="build logs, AI tools, coding workflows"
          classNames={{ label: "text-[11px] font-medium" }}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Voice" hint="How you actually talk on camera">
            <textarea
              value={form.voice}
              onChange={update("voice")}
              rows={4}
              className="input rounded-2xl leading-relaxed"
              placeholder="Direct, practical, no guru voice. Shows the work instead of claiming results."
            />
          </Field>
          <Field label="Avoid" hint="Formats or claims you do not want">
            <textarea
              value={form.avoid}
              onChange={update("avoid")}
              rows={4}
              className="input rounded-2xl leading-relaxed"
              placeholder="Clickbait income claims, reaction videos, dancing."
            />
          </Field>
        </div>

        <Input
          label="What this month is for"
          value={form.goal}
          onChange={(value) => set("goal", value)}
          placeholder="Grow to 5k followers with build-in-public reels"
          classNames={{ label: "text-[11px] font-medium" }}
        />

        {error && (
          <Alert variant="destructive" className="rounded-2xl" contentClassName="items-start">
            <AlertIcon />
            <AlertContent>
              <AlertTitle>Could not save</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </AlertContent>
          </Alert>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
          <span className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted-foreground">
            {savedAt ? `saved at ${savedAt}` : "stored locally · no account"}
          </span>
          <StatefulButton
            type="submit"
            state={saving ? "loading" : savedAt ? "success" : "idle"}
            loadingText="Saving"
            successText="Saved"
            size="md"
            className="px-5"
            icon={<Save size={13} />}
          >
            Save profile
          </StatefulButton>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex flex-wrap items-baseline justify-between gap-1 px-1">
        <span className="font-mono text-[9px] uppercase tracking-[0.11em] text-muted-foreground">
          {label}
        </span>
        {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
