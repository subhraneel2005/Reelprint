export type Platform = "instagram" | "youtube" | "tiktok" | "other";

export type ReelStatus = "queued" | "processing" | "needs_transcript" | "ready" | "error";

export type ReelDna = {
  topic: string;
  subtopic: string;
  hook: string;
  hook_type: string;
  format: string;
  format_detail: string;
  structure: { beat: string; purpose: string }[];
  tools: string[];
  visual_style: string;
  audio_style: string;
  cta: string;
  target_audience: string;
  emotion: string;
  why_it_works: string[];
  keywords: string[];
  pillars: string[];
  pace: string;
  reusability: number;
};

export type Engagement = {
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  followers?: number | null;
  like_rate?: number | null;
  comment_rate?: number | null;
  views_per_hour?: number | null;
  score?: number | null;
  label?: string | null;
};

export type Reel = {
  id: string;
  url: string;
  platform: Platform;
  external_id: string | null;
  author: string | null;
  author_url: string | null;
  caption: string | null;
  title: string | null;
  transcript: string | null;
  transcript_source: string | null;
  visual_summary: string | null;
  duration: number | null;
  thumbnail: string | null;
  posted_at: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  followers: number | null;
  engagement: Engagement | null;
  dna: ReelDna | null;
  topics: string | null;
  embedding_model: string | null;
  status: ReelStatus;
  error: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  handle: string;
  niche: string;
  audience: string;
  pillars: string[];
  voice: string;
  avoid: string;
  goal: string;
  updated_at: string;
};

export type JobStep = {
  key: string;
  label: string;
  status: "pending" | "running" | "done" | "skipped" | "error";
  detail?: string;
};

export type Job = {
  id: string;
  reel_id: string;
  status: "running" | "done" | "error";
  stage: string;
  steps: JobStep[];
  error: string | null;
  created_at: string;
  updated_at: string;
};

export type ResearchIdea = {
  title: string;
  hook: string;
  angle: string;
  format: string;
  why_it_fits: string;
  difficulty: "low" | "medium" | "high";
};

export type ResearchResult = {
  why_it_works: {
    hook: string;
    retention: string;
    emotion: string;
    format: string;
    cta: string;
    evidence: string[];
  };
  blueprint: {
    beats: { time: string; beat: string; why: string }[];
    visual_notes: string;
    audio_notes: string;
    caption_formula: string;
    hook_variants: string[];
  };
  ideas: ResearchIdea[];
  do_next: string[];
  discovery_queries: string[];
  generated_at?: string;
};

export type SearchHit = {
  reel: Reel;
  score: number;
  keyword_rank: number | null;
  vector_score: number | null;
  snippet: string | null;
  reason?: string | null;
};

export type YouTubeHit = {
  id: string;
  title: string;
  channel: string;
  channel_url: string;
  thumbnail: string;
  description: string;
  published_at: string;
  duration: number;
  views: number;
  likes: number;
  comments: number;
  url: string;
  views_per_hour: number;
  like_rate: number;
  comment_rate: number;
  score: number;
  outlier: number;
  query?: string;
};
