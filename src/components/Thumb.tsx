"use client";

import { useState } from "react";
import { cn } from "@/lib/util";

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
    <div className={cn("relative overflow-hidden bg-paper-2", className)} role="img" aria-label={alt}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          aria-hidden="true"
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,var(--paper-2),var(--line))]">
          <div className="dot-grid absolute inset-0 opacity-50" />
          <div className="relative flex flex-col items-center gap-2 px-4 text-center">
            <span className="grid h-8 w-8 grid-cols-3 items-end gap-[2px] bg-ink/10 p-1.5">
              <span className="h-full bg-ink/40" />
              <span className="h-[55%] bg-ink/40" />
              <span className="h-[80%] bg-ink/40" />
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              {label ? `${label} · no still` : "no still"}
            </span>
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-ink/10" />
    </div>
  );
}
