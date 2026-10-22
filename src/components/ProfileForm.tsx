"use client";

import { useState } from "react";
import { Check, Save } from "lucide-react";
import type { Profile } from "@/lib/types";

export function ProfileForm({ initial }: { initial: Profile }) {
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

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

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
      setSavedAt(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <h2 className="display text-[20px]">Creator profile</h2>
          <p className="mt-0.5 text-[11.5px] text-muted">Injected into every research brief.</p>
        </div>
        <div className="text-right">
          <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">completeness</div>
          <div className="timecode text-[13px]">{completeness}%</div>
          <div className="mt-1 h-1 w-20 bg-paper-2">
            <div className="h-full bg-signal" style={{ width: `${completeness}%` }} />
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Instagram handle" hint="Without the @">
            <input value={form.handle} onChange={update("handle")} className="input" placeholder="yourhandle" />
          </Field>
          <Field label="Niche" hint="One line. Be specific.">
            <input
              value={form.niche}
              onChange={update("niche")}
              className="input"
              placeholder="AI, coding and building projects in public"
            />
          </Field>
        </div>

        <Field label="Who is watching" hint="Their level and what they want">
          <input
            value={form.audience}
            onChange={update("audience")}
            className="input"
            placeholder="Beginner developers who want to ship real projects"
          />
        </Field>

        <Field label="Content pillars" hint="Comma separated, 3–5 is enough">
          <input
            value={form.pillars}
            onChange={update("pillars")}
            className="input"
            placeholder="build logs, AI tools, coding workflows"
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Voice" hint="How you actually talk on camera">
            <textarea
              value={form.voice}
              onChange={update("voice")}
              rows={4}
              className="input leading-relaxed"
              placeholder="Direct, practical, no guru voice. Shows the work instead of claiming results."
            />
          </Field>
          <Field label="Avoid" hint="Formats or claims you do not want">
            <textarea
              value={form.avoid}
              onChange={update("avoid")}
              rows={4}
              className="input leading-relaxed"
              placeholder="Clickbait income claims, reaction videos, dancing."
            />
          </Field>
        </div>

        <Field label="What this month is for" hint="The brief optimises towards this">
          <input
            value={form.goal}
            onChange={update("goal")}
            className="input"
            placeholder="Grow to 5k followers with build-in-public reels"
          />
        </Field>

        {error && <p className="border border-signal/40 bg-signal-soft px-3 py-2 text-[12px] text-signal">{error}</p>}

        <div className="flex items-center justify-between border-t border-line pt-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
            {savedAt ? (
              <span className="flex items-center gap-1.5 text-ok">
                <Check size={11} /> saved at {savedAt}
              </span>
            ) : (
              "stored locally · no account"
            )}
          </span>
          <button type="submit" disabled={saving} className="btn btn-primary h-9 text-[11px]">
            <Save size={13} />
            {saving ? "Saving…" : "Save profile"}
          </button>
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
      <span className="mb-1 flex flex-wrap items-baseline justify-between gap-1">
        <span className="font-mono text-[9px] uppercase tracking-[0.11em] text-muted">{label}</span>
        {hint && <span className="text-[10px] text-muted">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
