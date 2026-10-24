"use client";

import { useState } from "react";
import { ChevronDown, Save } from "lucide-react";
import type { Profile } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

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

      const time = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date());

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
    <form onSubmit={save}>
      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex items-start justify-between gap-4 border-b p-5">
          <div>
            <h2 className="text-base font-medium">Your context</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Used in every brief. Start with the niche; refine later.
            </p>
          </div>
          <div className="w-24 shrink-0 text-right">
            <div className="text-xs text-muted-foreground">Complete</div>
            <div className="mt-0.5 text-xl font-medium tabular-nums">{completeness}%</div>
            <Progress
              value={completeness}
              className="mt-1.5 h-1.5"
              aria-label={`Profile completeness: ${completeness}%`}
            />
          </div>
        </div>

        <div className="space-y-4 p-5">
          <Field label="Niche" htmlFor="profile-niche">
            <Input
              id="profile-niche"
              value={form.niche}
              onChange={(event) => set("niche", event.target.value)}
              placeholder="AI, coding and building projects in public"
            />
          </Field>

          <Field label="Who is watching" htmlFor="profile-audience">
            <Input
              id="profile-audience"
              value={form.audience}
              onChange={(event) => set("audience", event.target.value)}
              placeholder="Beginner developers who want to ship real projects"
            />
          </Field>

          <Field label="Content pillars" htmlFor="profile-pillars">
            <Input
              id="profile-pillars"
              value={form.pillars}
              onChange={(event) => set("pillars", event.target.value)}
              placeholder="build logs, AI tools, coding workflows"
            />
          </Field>

          <details className="group rounded-xl border">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium">
              Voice, handle and guardrails
              <ChevronDown
                className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>

            <div className="space-y-4 border-t p-4">
              <Field label="Instagram handle" htmlFor="profile-handle">
                <Input
                  id="profile-handle"
                  value={form.handle}
                  onChange={(event) => set("handle", event.target.value)}
                  placeholder="yourhandle"
                  autoComplete="off"
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Voice" htmlFor="profile-voice" hint="How you talk on camera">
                  <Textarea
                    id="profile-voice"
                    value={form.voice}
                    onChange={(event) => set("voice", event.target.value)}
                    rows={4}
                    placeholder="Direct, practical, no guru voice."
                  />
                </Field>
                <Field label="Avoid" htmlFor="profile-avoid" hint="What you do not want">
                  <Textarea
                    id="profile-avoid"
                    value={form.avoid}
                    onChange={(event) => set("avoid", event.target.value)}
                    rows={4}
                    placeholder="Clickbait income claims, reaction videos."
                  />
                </Field>
              </div>

              <Field label="What this month is for" htmlFor="profile-goal">
                <Input
                  id="profile-goal"
                  value={form.goal}
                  onChange={(event) => set("goal", event.target.value)}
                  placeholder="Grow to 5k followers with build-in-public reels"
                />
              </Field>
            </div>
          </details>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Could not save</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <span className="text-xs text-muted-foreground">
              {savedAt ? `Saved at ${savedAt}` : "Stored locally · no account"}
            </span>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner className="size-4" /> : <Save className="size-4" aria-hidden />}
              {saving ? "Saving" : "Save profile"}
            </Button>
          </div>
        </div>
      </Card>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-1">
        <Label htmlFor={htmlFor}>{label}</Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
