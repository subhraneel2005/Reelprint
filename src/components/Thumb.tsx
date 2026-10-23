"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function Thumb({
  id,
  remote,
  alt,
  className,
  label,
}: {
  id?: string;
  remote?: string | null;
  alt: string;
  className?: string;
  label?: string;
}) {
  const [failed, setFailed] = useState(false);
  const url = id ? `/api/thumb/${id}` : remote ?? "";
  const showImage = Boolean(url) && !failed;

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={alt}
          width={640}
          height={360}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted px-4 text-center">
          <ImageOff className="size-5 text-muted-foreground" aria-hidden />
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {label ? `${label} · no still` : "no still"}
          </span>
          <span className="sr-only">{alt}</span>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-border" aria-hidden />
    </div>
  );
}
