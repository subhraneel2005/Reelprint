import { ProfileForm } from "@/components/ProfileForm";
import { PageHeader, Tag } from "@/components/Bits";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { aiStatus } from "@/lib/ai";
import { getProfile } from "@/lib/db";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CreatorPage() {
  const profile = await getProfile();
  const status = aiStatus();
  const keys = [
    { name: "OpenRouter", on: status.openrouter, env: "OPENROUTER_API_KEY" },
    { name: "OpenAI", on: status.openai, env: "OPENAI_API_KEY" },
    { name: "Google Gemini", on: status.gemini, env: "GEMINI_API_KEY" },
    { name: "YouTube Data", on: status.youtube, env: "YOUTUBE_API_KEY" },
    { name: "Supadata", on: status.supadata, env: "SUPADATA_API_KEY" },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Creator"
        title="Make the desk yours"
        description="A little context makes every brief sound like you. Saved with the archive; no account."
        actions={
          <Badge variant={status.chat ? "secondary" : "destructive"}>
            {status.chat ? "AI online" : "AI offline"}
          </Badge>
        }
      />

      <Tabs defaultValue="profile" className="mt-8 gap-0">
        <div className="border-b">
          <TabsList variant="line" className="w-full justify-start">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="setup">Setup</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile" className="mt-0 pt-6">
          <ProfileForm initial={profile} />
        </TabsContent>

        <TabsContent value="setup" className="mt-0 space-y-4 pt-6">
          <Card className="gap-0 overflow-hidden p-0">
            <div className="border-b p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-medium">AI connection</h2>
                <Badge variant={status.openrouter ? "secondary" : "destructive"}>
                  {status.openrouter ? "OpenRouter connected" : "OpenRouter missing"}
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                One OpenRouter key runs transcription, vision, embeddings, DNA, and research.
                OpenAI and Gemini are optional fallbacks.
              </p>
            </div>

            <ul className="divide-y">
              {keys.map((key) => (
                <li key={key.name} className="flex items-center gap-3 px-5 py-3">
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      key.on ? "bg-emerald-600" : "bg-border",
                    )}
                    aria-hidden
                  />
                  <span className="text-sm">{key.name}</span>
                  <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                    {key.env}
                  </span>
                  <Tag tone={key.on ? "ok" : key.name === "OpenRouter" ? "signal" : "line"}>
                    {key.on ? "Set" : key.name === "OpenRouter" ? "Missing" : "Optional"}
                  </Tag>
                </li>
              ))}
            </ul>

            <p className="border-t px-5 py-3 text-xs text-muted-foreground">
              After changing keys, restart the dev server.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-medium">Link fetching</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              YouTube works out of the box. Instagram may need a session, so the desk asks for a
              transcript instead of failing silently.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Tag>SUPADATA_API_KEY</Tag>
              <Tag>IG_COOKIES_FROM_BROWSER</Tag>
              <Tag>IG_COOKIES_FILE</Tag>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Keep cookies out of git. Instagram insights need a reviewed Meta app, so they are not
              connected.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
