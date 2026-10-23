import Link from "next/link";
import { ArrowLeft, FileQuestion, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-2xl items-center px-6 py-10 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <FileQuestion className="size-6" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
          That reel is not in the archive.
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          It may have been removed, or the link is wrong. Send it again and the desk will read it
          from scratch.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="size-4" aria-hidden />
              Back to the desk
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/library">
              <Library className="size-4" aria-hidden />
              Open archive
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
