import Link from "next/link";
import { ArrowLeft, Share2 } from "lucide-react";
import { IngestForm } from "@/components/IngestForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function urlFrom(value: string) {
  const match = value.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : "";
}

export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string; text?: string; title?: string }>;
}) {
  const params = await searchParams;
  const shared = params.url || urlFrom(params.text ?? "") || "";

  return (
    <div className="mx-auto max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/">
          <ArrowLeft className="size-4" aria-hidden />
          Desk
        </Link>
      </Button>

      <header className="mt-5">
        <Badge variant="secondary">
          <Share2 className="size-3" aria-hidden />
          Shared link
        </Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Send it to the desk.
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
          {shared
            ? "The link from your share sheet is loaded below. Start the analysis, or paste the transcript if the platform blocks the fetch."
            : "Share a Reel or Short into Reelprint from your phone, or paste a link below."}
        </p>
      </header>

      <div className="mt-5">
        <IngestForm defaultUrl={shared} />
      </div>

      <Card className="mt-4 p-3.5">
        <p className="text-xs leading-relaxed text-muted-foreground">
          On Android, install the desk from the browser menu to get Reelprint in the Instagram share
          sheet. On iPhone, use the share sheet to copy the link and paste it here; iOS does not
          expose web share targets to PWAs.
        </p>
      </Card>
    </div>
  );
}
