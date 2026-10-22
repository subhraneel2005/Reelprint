import { Camera, KeyRound, Lock } from "lucide-react";
import { ProfileForm } from "@/components/ProfileForm";
import { Panel, SectionHead, Tag } from "@/components/Bits";
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
      <header className="border-b border-ink pb-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="display text-[clamp(2rem,4.4vw,3rem)]">Creator</h1>
            <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-muted">
              The desk learns your niche, audience and voice here. Nothing needs an account; the
              profile is stored next to the archive.
            </p>
          </div>
          <Tag tone={status.chat ? "line" : "signal"}>{status.chat ? "AI online" : "AI offline"}</Tag>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_330px] lg:items-start">
        <ProfileForm initial={profile} />

        <div className="space-y-5">
          <section>
            <SectionHead title="Connections" aside="environment" />
            <Panel>
              <div className={`border-b border-line px-3.5 py-3 ${status.openrouter ? "" : "bg-signal-soft"}`}>
                <div
                  className={`flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.1em] ${
                    status.openrouter ? "text-ok" : "text-signal"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 ${status.openrouter ? "bg-ok" : "bg-signal"}`} />
                  {status.openrouter ? "OpenRouter is the only AI key you need" : "Add OpenRouter to turn on the AI"}
                </div>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">
                  {status.openrouter
                    ? "Transcription, vision, embeddings, content DNA and research all run through the same key. OpenAI and Gemini are optional fallbacks."
                    : "OPENROUTER_API_KEY covers the full AI pipeline. OpenAI and Gemini are optional fallbacks, not requirements."}
                </p>
              </div>
              <ul className="divide-y divide-line">
                {keys.map((key) => (
                  <li key={key.name} className="flex items-start gap-2.5 px-3.5 py-2.5">
                    <span className={`mt-[5px] h-1.5 w-1.5 shrink-0 ${key.on ? "bg-ok" : "bg-line-strong"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[12px] font-medium">{key.name}</span>
                        <span className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-muted">
                          {key.on ? "set" : key.optional ? "optional" : "missing"}
                        </span>
                      </div>
                      <div className="mt-0.5 font-mono text-[9px] text-muted">{key.env}</div>
                      <div className="mt-0.5 text-[10.5px] text-muted">{key.use}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="border-t border-line px-3.5 py-2.5 font-mono text-[9px] uppercase leading-relaxed tracking-[0.06em] text-muted">
                AI needs only OPENROUTER_API_KEY · YouTube and Supadata are optional · restart next dev
              </div>
            </Panel>
          </section>

          <section>
            <SectionHead title="Instagram" aside="read-only" />
            <Panel className="p-3.5">
              <div className="flex items-start gap-2.5">
                <Camera size={16} className="mt-0.5 shrink-0 text-signal" />
                <div>
                  <p className="text-[12.5px] font-medium">Account insights are not connected.</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                    Meta only exposes your own media and insights through a reviewed app. A public Reel
                    search API does not exist. For now the desk personalises from what you send and the
                    profile above.
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 border border-line bg-paper px-2.5 py-2 font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
                <Lock size={11} />
                needs meta app review · not faked for the demo
              </div>
            </Panel>
          </section>

          <section>
            <SectionHead title="Link fetching" aside="fallbacks" />
            <Panel className="p-3.5 text-[11.5px] leading-relaxed text-muted">
              <p>
                YouTube downloads work out of the box. Instagram and TikTok usually require a session,
                so the desk tries, then asks for a transcript instead of failing silently.
              </p>
              <ul className="mt-2.5 space-y-1.5 font-mono text-[9.5px] text-ink-2">
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
