import { Camera, KeyRound, Lock } from "lucide-react";
import { ProfileForm } from "@/components/ProfileForm";
import { SectionHead, Tag } from "@/components/Bits";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { aiStatus } from "@/lib/ai";
import { getProfile } from "@/lib/db";
import { cn } from "@/lib/utils";

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
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Creator</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            The desk learns your niche, audience and voice here. Nothing needs an account; the
            profile is stored next to the archive.
          </p>
        </div>
        <Badge variant={status.chat ? "secondary" : "destructive"}>
          {status.chat ? "AI online" : "AI offline"}
        </Badge>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <ProfileForm initial={profile} />

        <div className="space-y-5">
          <section>
            <SectionHead title="Connections" aside="Environment" />
            <Card className="gap-0 p-0">
              <div
                className={cn(
                  "border-b p-4",
                  !status.openrouter && "rounded-t-xl bg-destructive/5",
                )}
              >
                <Badge variant={status.openrouter ? "secondary" : "destructive"}>
                  {status.openrouter ? "OpenRouter connected" : "OpenRouter missing"}
                </Badge>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {status.openrouter
                    ? "Transcription, vision, embeddings, content DNA and research all run through the same key. OpenAI and Gemini are optional fallbacks."
                    : "OPENROUTER_API_KEY covers the full AI pipeline. OpenAI and Gemini are optional fallbacks, not requirements."}
                </p>
              </div>

              <ul className="divide-y">
                {keys.map((key) => (
                  <li key={key.name} className="flex items-start gap-2.5 p-4">
                    <span
                      className={cn(
                        "mt-1.5 size-1.5 shrink-0 rounded-full",
                        key.on ? "bg-emerald-600" : "bg-border",
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-sm font-medium">{key.name}</span>
                        <Tag tone={key.on ? "ok" : key.optional ? "line" : "signal"}>
                          {key.on ? "Set" : key.optional ? "Optional" : "Missing"}
                        </Tag>
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        {key.env}
                      </div>
                      <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {key.use}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <p className="border-t p-4 text-xs leading-relaxed text-muted-foreground">
                AI needs only OPENROUTER_API_KEY · YouTube and Supadata are optional · restart next dev
              </p>
            </Card>
          </section>

          <section>
            <SectionHead title="Instagram" aside="Read-only" />
            <Card className="p-4">
              <div className="flex items-start gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <Camera className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium">Account insights are not connected.</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Meta only exposes your own media and insights through a reviewed app. A public
                    Reel search API does not exist. For now the desk personalises from what you send
                    and the profile above.
                  </p>
                </div>
              </div>
              <p className="mt-3 flex items-center gap-1.5 rounded-md border bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground">
                <Lock className="size-3" aria-hidden />
                Needs Meta app review · not faked for the demo
              </p>
            </Card>
          </section>

          <section>
            <SectionHead title="Link fetching" aside="Fallbacks" />
            <Card className="p-4">
              <p className="text-xs leading-relaxed text-muted-foreground">
                YouTube downloads work out of the box. Instagram and TikTok usually require a
                session, so the desk tries, then asks for a transcript instead of failing silently.
              </p>
              <ul className="mt-2.5 space-y-1.5 font-mono text-xs">
                <li>· SUPADATA_API_KEY — cleanest Instagram path</li>
                <li>· IG_COOKIES_FROM_BROWSER=chrome — local cookies</li>
                <li>· IG_COOKIES_FILE=/path/cookies.txt — exported cookies</li>
              </ul>
              <p className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <KeyRound className="size-3" aria-hidden /> Keep cookies out of git.
              </p>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
