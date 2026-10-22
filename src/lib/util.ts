import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function compactNumber(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  if (value < 1000) return String(Math.round(value));
  if (value < 1_000_000) return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)}K`;
  return `${(value / 1_000_000).toFixed(1)}M`;
}

export function percent(value?: number | null, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

export function timeAgo(iso?: string | null) {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function formatDuration(seconds?: number | null) {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return "—";
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}:${String(m % 60).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function detectPlatform(url: string): {
  platform: "instagram" | "youtube" | "tiktok" | "other";
  externalId: string | null;
} {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host.includes("instagram.com")) {
      const match = u.pathname.match(/\/(reel|reels|p|tv)\/([A-Za-z0-9_-]+)/);
      return { platform: "instagram", externalId: match?.[2] ?? null };
    }
    if (host === "youtu.be") {
      return { platform: "youtube", externalId: u.pathname.split("/").filter(Boolean)[0] ?? null };
    }
    if (host.includes("youtube.com")) {
      const shorts = u.pathname.match(/\/shorts\/([A-Za-z0-9_-]+)/);
      if (shorts) return { platform: "youtube", externalId: shorts[1] };
      return { platform: "youtube", externalId: u.searchParams.get("v") };
    }
    if (host.includes("tiktok.com")) {
      const match = u.pathname.match(/\/video\/(\d+)/);
      return { platform: "tiktok", externalId: match?.[1] ?? null };
    }
    return { platform: "other", externalId: null };
  } catch {
    return { platform: "other", externalId: null };
  }
}

export function normaliseUrl(url: string) {
  let clean = url.trim();
  if (!/^https?:\/\//i.test(clean)) clean = `https://${clean}`;
  const parsed = new URL(clean);
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
}

export function platformLabel(platform: string) {
  if (platform === "instagram") return "Instagram";
  if (platform === "youtube") return "YouTube";
  if (platform === "tiktok") return "TikTok";
  return "Web";
}

export function stripHtml(input: string) {
  return input
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function firstSentence(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const match = clean.match(/^.{20,180}?[.!?](\s|$)/);
  return match ? match[0].trim() : clean.slice(0, 160);
}

export function keywordsFrom(text: string, limit = 8) {
  const stop = new Set(
    "the a an and or of to in for on with is are was were be been this that it its you your i my we our as at by from how what why when where who not no do does did can could should would will just about into over after before more most very much many some any all but if then than so such own same too only out up down off again further once here there when why how".split(
      " ",
    ),
  );
  const counts = new Map<string, number>();
  for (const raw of text.toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g) ?? []) {
    if (stop.has(raw)) continue;
    counts.set(raw, (counts.get(raw) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

export function engagementLabel(score?: number | null) {
  if (score === null || score === undefined) return "unscored";
  if (score >= 80) return "outlier";
  if (score >= 60) return "strong";
  if (score >= 40) return "average";
  return "low";
}

export function truncate(text: string, max = 120) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}
