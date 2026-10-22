import type { Reel, YouTubeHit } from "./types";
import { clamp } from "./util";

type SearchResponse = {
  items?: { id?: { videoId?: string } }[];
};

type VideoResponse = {
  items?: {
    id?: string;
    snippet?: {
      title?: string;
      description?: string;
      channelTitle?: string;
      channelId?: string;
      publishedAt?: string;
      thumbnails?: { high?: { url?: string }; medium?: { url?: string } };
    };
    statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
    contentDetails?: { duration?: string };
  }[];
};

function parseDuration(value?: string): number {
  if (!value) return 0;
  const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
}

async function api<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY is not set");
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  url.searchParams.set("key", key);
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`YouTube API ${response.status}: ${text.slice(0, 220)}`);
  }
  return (await response.json()) as T;
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export async function searchShorts(options: {
  query: string;
  maxResults?: number;
  days?: number;
  minViews?: number;
}): Promise<YouTubeHit[]> {
  const { query, maxResults = 25, days = 180, minViews = 2000 } = options;
  if (!process.env.YOUTUBE_API_KEY) throw new Error("YOUTUBE_API_KEY is not set");
  const publishedAfter = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
  const search = await api<SearchResponse>("search", {
    part: "snippet",
    type: "video",
    videoDuration: "short",
    order: "viewCount",
    q: query,
    maxResults: String(maxResults),
    publishedAfter,
    relevanceLanguage: "en",
  });
  const ids = (search.items ?? [])
    .map((item) => item.id?.videoId)
    .filter((id): id is string => Boolean(id));
  if (!ids.length) return [];

  const videos = await api<VideoResponse>("videos", {
    part: "snippet,statistics,contentDetails",
    id: ids.join(","),
    maxResults: String(ids.length),
  });

  const now = Date.now();
  const base = (videos.items ?? [])
    .map((video) => {
      const id = video.id;
      if (!id) return null;
      const views = Number(video.statistics?.viewCount ?? 0);
      const likes = Number(video.statistics?.likeCount ?? 0);
      const comments = Number(video.statistics?.commentCount ?? 0);
      const published = video.snippet?.publishedAt ?? "";
      const publishedMs = published ? new Date(published).getTime() : now;
      const ageHours = Math.max(1, (now - publishedMs) / 3_600_000);
      const ageDays = Math.max(0.1, ageHours / 24);
      const duration = parseDuration(video.contentDetails?.duration);
      if (duration > 185) return null;
      const vph = views / ageHours;
      const likeRate = views ? likes / views : 0;
      const commentRate = views ? comments / views : 0;
      return {
        id,
        title: video.snippet?.title ?? "",
        channel: video.snippet?.channelTitle ?? "",
        channel_url: video.snippet?.channelId
          ? `https://www.youtube.com/channel/${video.snippet.channelId}`
          : "",
        thumbnail:
          video.snippet?.thumbnails?.high?.url ?? video.snippet?.thumbnails?.medium?.url ?? "",
        description: video.snippet?.description ?? "",
        published_at: published,
        duration,
        views,
        likes,
        comments,
        url: `https://www.youtube.com/shorts/${id}`,
        views_per_hour: vph,
        like_rate: likeRate,
        comment_rate: commentRate,
        ageDays,
        score: 0,
        outlier: 0,
        query,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .filter((item) => item.views >= minViews);

  const medianVph = median(base.map((item) => item.views_per_hour)) || 1;
  return base
    .map((item) => {
      const vphScore = clamp(Math.log10(1 + item.views_per_hour) / Math.log10(1 + 20000), 0, 1);
      const likeScore = clamp(item.like_rate / 0.08, 0, 1);
      const commentScore = clamp(item.comment_rate / 0.005, 0, 1);
      const recency = Math.exp(-item.ageDays / 90);
      const score = Math.round(100 * (0.5 * vphScore + 0.22 * likeScore + 0.13 * commentScore + 0.15 * recency));
      const outlier = item.views_per_hour / medianVph;
      return { ...item, score, outlier };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => {
      const { ageDays, ...hit } = item;
      void ageDays;
      return hit;
    });
}

export function queriesForReel(reel: Reel): string[] {
  const dna = reel.dna;
  const queries = new Set<string>();
  if (dna?.topic) {
    queries.add(dna.topic);
    if (dna.format) queries.add(`${dna.topic} ${dna.format}`);
    if (dna.subtopic) queries.add(`${dna.topic} ${dna.subtopic}`);
  }
  if (dna?.keywords?.length) {
    queries.add(dna.keywords.slice(0, 3).join(" "));
    queries.add(dna.keywords.slice(3, 6).join(" "));
  }
  if (!queries.size) {
    const words = `${reel.title ?? ""} ${reel.caption ?? ""}`
      .toLowerCase()
      .match(/[a-z][a-z0-9+#.-]{3,}/g)
      ?.slice(0, 5);
    if (words?.length) queries.add(words.join(" "));
  }
  return [...queries].filter(Boolean).slice(0, 3);
}

export async function discoverSimilar(reel: Reel, limit = 12): Promise<YouTubeHit[]> {
  const queries = queriesForReel(reel);
  if (!queries.length) return [];
  const results: YouTubeHit[] = [];
  for (const query of queries) {
    try {
      const hits = await searchShorts({ query, maxResults: 20, days: 180 });
      results.push(...hits.slice(0, 8));
    } catch {
      // continue with the other queries
    }
  }
  const seen = new Set<string>();
  const deduped = results.filter((hit) => {
    if (seen.has(hit.id)) return false;
    seen.add(hit.id);
    return true;
  });
  return deduped.sort((a, b) => b.score - a.score).slice(0, limit);
}
