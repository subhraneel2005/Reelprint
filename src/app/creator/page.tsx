import { Camera, KeyRound, Lock } from "lucide-react";
import { ProfileForm } from "@/components/ProfileForm";
import { Panel, SectionHead, Tag } from "@/components/Bits";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { TextReveal } from "@/components/motion/text-reveal";
import { aiStatus } from "@/lib/ai";
import { getProfile } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function CreatorPage() {
  const profile = getProfile();
  const status = aiStatus();
  const keys = [
    {
      name: "OpenRouter",
      on: status.openrouter,
      env: "OPENROUTER_API_KEY",
      use: "Chat, DNA, research, vision, embeddings, Whisper",
      optional: false,
    },
    {
      name: "OpenAI",
      on: status.openai,
      env: "OPENAI_API_KEY",
      use: "Optional fallback for the same AI tasks",
      optional: true,
    },
    {
      name: "Google Gemini",
      on: status.gemini,
      env: "GEMINI_API_KEY",
      use: "Optional fallback for chat, audio and vision",
      optional: true,
    },
    {
      name: "YouTube Data",
      on: status.youtube,
      env: "YOUTUBE_API_KEY",
      use: "Live Shorts discovery",
      optional: true,
    },
    {
      name: "Supadata",
      on: status.supadata,
      env: "SUPADATA_API_KEY",
      use: "Optional Instagram transcript + metadata",
      optional: true,
    },
  ];

  return (
    <div>
      <header>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <TextReveal
              as="h1"
              text="Creator"
              split="word"
              className="display text-[clamp(2.2rem,6vw,3.3rem)]"
            />
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
              The desk learns your niche, audience and voice here. Nothing needs an account; the
              profile is stored next to the archive.
            </p>
          </div>
          <AnimatedBadge status={status.chat ? "success" : "danger"} size="sm" pulse={false}>
            {status.chat ? "AI online" : "AI offline"}
          </AnimatedBadge>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <ProfileForm initial={profile} />

        <div className="space-y-5">
          <section>
            <SectionHead title="Connections" aside="environment" />
            <Panel>
              <div
                className={`border-b border-border/70 px-4 py-3.5 ${
                  status.openrouter ? "" : "rounded-t-[26px] bg-signal-soft/60"
                }`}
              >
                <AnimatedBadge
                  status={status.openrouter ? "success" : "danger"}
                  size="sm"
                  pulse={false}
                >
                  {status.openrouter ? "OpenRouter connected" : "OpenRouter missing"}
                </AnimatedBadge>
                <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">
                  {status.openrouter
                    ? "Transcription, vision, embeddings, content DNA and research all run through the same key. OpenAI and Gemini are optional fallbacks."
                    : "OPENROUTER_API_KEY covers the full AI pipeline. OpenAI and Gemini are optional fallbacks, not requirements."}
                </p>
              </div>
              <ul className="divide-y divide-border/60">
                {keys.map((key) => (
                  <li key={key.name} className="flex items-start gap-2.5 px-4 py-3">
                    <span
                      className={`mt-1.5 size-1.5 shrink-0 rounded-full ${key.on ? "bg-success" : "bg-border-strong"}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-[12px] font-medium">{key.name}</span>
                        <Tag tone={key.on ? "ok" : key.optional ? "line" : "signal"}>
                          {key.on ? "set" : key.optional ? "optional" : "missing"}
                        </Tag>
                      </div>
                      <div className="mt-0.5 font-mono text-[8.5px] text-muted-foreground">{key.env}</div>
                      <div className="mt-0.5 text-[10.5px] leading-relaxed text-muted-foreground">
                        {key.use}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="border-t border-border/70 px-4 py-3 font-mono text-[8px] uppercase leading-relaxed tracking-[0.06em] text-muted-foreground">
                AI needs only OPENROUTER_API_KEY · YouTube and Supadata are optional · restart next dev
              </div>
            </Panel>
          </section>

          <section>
            <SectionHead title="Instagram" aside="read-only" />
            <Panel className="p-4">
              <div className="flex items-start gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-xl border border-signal/20 bg-signal-soft text-signal">
                  <Camera size={15} />
                </span>
                <div>
                  <p className="text-[12.5px] font-medium">Account insights are not connected.</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                    Meta only exposes your own media and insights through a reviewed app. A public Reel
                    search API does not exist. For now the desk personalises from what you send and the
                    profile above.
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2.5 py-1.5 font-mono text-[8.5px] uppercase tracking-[0.08em] text-muted-foreground">
                <Lock size={11} />
                needs meta app review · not faked for the demo
              </div>
            </Panel>
          </section>

          <section>
            <SectionHead title="Link fetching" aside="fallbacks" />
            <Panel className="p-4 text-[11.5px] leading-relaxed text-muted-foreground">
              <p>
                YouTube downloads work out of the box. Instagram and TikTok usually require a session,
                so the desk tries, then asks for a transcript instead of failing silently.
              </p>
              <ul className="mt-2.5 space-y-1.5 font-mono text-[9px] text-ink-2">
                <li>· SUPADATA_API_KEY — cleanest Instagram path</li>
                <li>· IG_COOKIES_FROM_BROWSER=chrome — local cookies</li>
                <li>· IG_COOKIES_FILE=/path/cookies.txt — exported cookies</li>
              </ul>
              <p className="mt-2.5 flex items-center gap-1.5">
                <KeyRound size={11} /> keep cookies out of git.
              </p>
            </Panel>
          </section>
        </div>
      </div>
    </div>
  );
}
