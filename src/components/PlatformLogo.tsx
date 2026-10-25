import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGOS = {
  instagram: {
    src: "/instagram-logo.webp",
    alt: "Instagram",
    className: "rounded-[22%]",
  },
  youtube: {
    src: "/youtube-shorts-logo.webp",
    alt: "YouTube Shorts",
    className: "",
  },
  other: {
    src: "/web-icon.webp",
    alt: "Web",
    className: "",
  },
} as const;

export function PlatformLogo({
  platform,
  size = 16,
  className,
  decorative = false,
  priority = false,
}: {
  platform: string;
  size?: number;
  className?: string;
  decorative?: boolean;
  priority?: boolean;
}) {
  const logo = LOGOS[platform as keyof typeof LOGOS];
  if (!logo) return null;

  return (
    <Image
      src={logo.src}
      alt={decorative ? "" : logo.alt}
      width={size}
      height={size}
      priority={priority}
      className={cn("shrink-0 object-contain", logo.className, className)}
    />
  );
}
