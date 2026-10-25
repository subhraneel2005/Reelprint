import { and, desc, eq, sql } from "drizzle-orm";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { getDb } from "./postgres";
import { jobs, profile, reels, research } from "./schema";
import type {
  Job,
  JobStep,
  Profile,
  Reel,
  ReelDna,
  ReelStatus,
  ResearchResult,
  SearchHit,
} from "./types";

const DATA_DIR = join(process.cwd(), ".data");

function now() {
  return new Date().toISOString();
}

function iso(value: string | Date | null | undefined) {
  if (!value) return new Date(0).toISOString();
  return new Date(value).toISOString();
}

function mapReel(row: typeof reels.$inferSelect): Reel {
  return {
    id: row.id,
    url: row.url,
    platform: row.platform as Reel["platform"],
    external_id: row.externalId,
    author: row.author,
    author_url: row.authorUrl,
    caption: row.caption,
    title: row.title,
    transcript: row.transcript,
    transcript_source: row.transcriptSource,
    visual_summary: row.visualSummary,
    duration: row.duration === null ? null : Number(row.duration),
    thumbnail: row.thumbnail,
    posted_at: row.postedAt,
    views: row.views,
    likes: row.likes,
    comments: row.comments,
    shares: row.shares,
    followers: row.followers,
    engagement: row.engagement ?? null,
    dna: (row.dna as ReelDna | null) ?? null,
    topics: row.topics,
    embedding_model: row.embeddingModel,
    status: row.status,
    error: row.error,
    created_at: iso(row.createdAt),
    updated_at: iso(row.updatedAt),
  };
}

export type ReelInput = {
  id: string;
  url: string;
  platform: string;
  external_id?: string | null;
  author?: string | null;
  author_url?: string | null;
  caption?: string | null;
  title?: string | null;
  transcript?: string | null;
  transcript_source?: string | null;
  visual_summary?: string | null;
  duration?: number | null;
  thumbnail?: string | null;
  posted_at?: string | null;
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  followers?: number | null;
  engagement?: Reel["engagement"];
  dna?: ReelDna | null;
  topics?: string | null;
  embedding?: number[] | null;
  embedding_model?: string | null;
  status?: ReelStatus;
  error?: string | null;
};

export async function insertReel(input: ReelInput): Promise<Reel> {
  const ts = now();
  const [row] = await getDb()
    .insert(reels)
    .values({
      id: input.id,
      url: input.url,
      platform: input.platform,
      externalId: input.external_id ?? null,
      author: input.author ?? null,
      authorUrl: input.author_url ?? null,
      caption: input.caption ?? null,
      title: input.title ?? null,
      transcript: input.transcript ?? null,
      transcriptSource: input.transcript_source ?? null,
      visualSummary: input.visual_summary ?? null,
      duration: input.duration ?? null,
      thumbnail: input.thumbnail ?? null,
      postedAt: input.posted_at ?? null,
      views: input.views ?? null,
      likes: input.likes ?? null,
      comments: input.comments ?? null,
      shares: input.shares ?? null,
      followers: input.followers ?? null,
      engagement: input.engagement ?? null,
      dna: input.dna ?? null,
      topics: input.topics ?? null,
      embedding: input.embedding ?? null,
      embeddingModel: input.embedding_model ?? null,
      status: input.status ?? "queued",
      error: input.error ?? null,
      createdAt: ts,
      updatedAt: ts,
    })
    .returning();
  if (!row) throw new Error("Failed to insert reel");
  return mapReel(row);
}

const UPDATABLE = new Set([
  "author",
  "author_url",
  "caption",
  "title",
  "transcript",
  "transcript_source",
  "visual_summary",
  "duration",
  "thumbnail",
  "posted_at",
  "views",
  "likes",
  "comments",
  "shares",
  "followers",
  "engagement_json",
  "dna_json",
  "topics",
  "embedding",
  "embedding_model",
  "status",
  "error",
]);

export async function updateReel(id: string, patch: Record<string, unknown>): Promise<void> {
  const next: Partial<typeof reels.$inferInsert> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (!UPDATABLE.has(key)) continue;
    switch (key) {
      case "author_url":
        next.authorUrl = value as string | null;
        break;
      case "transcript_source":
        next.transcriptSource = value as string | null;
        break;
      case "visual_summary":
        next.visualSummary = value as string | null;
        break;
      case "posted_at":
        next.postedAt = value as string | null;
        break;
      case "engagement_json":
        next.engagement = value as Reel["engagement"];
        break;
      case "dna_json":
        next.dna = value as ReelDna | null;
        break;
      case "embedding_model":
        next.embeddingModel = value as string | null;
        break;
      case "embedding":
        next.embedding =
          value instanceof Float32Array || value instanceof Uint8Array
            ? Array.from(value)
            : (value as number[] | null);
        break;
      case "status":
        next.status = value as ReelStatus;
        break;
      default:
        (next as Record<string, unknown>)[key] = value;
    }
  }
  if (!Object.keys(next).length) return;
  await getDb()
    .update(reels)
    .set({ ...next, updatedAt: now() })
    .where(eq(reels.id, id));
}

export async function getReel(id: string): Promise<Reel | null> {
  const [row] = await getDb().select().from(reels).where(eq(reels.id, id)).limit(1);
  return row ? mapReel(row) : null;
}

export async function getReelByUrl(url: string): Promise<Reel | null> {
  const [row] = await getDb().select().from(reels).where(eq(reels.url, url)).limit(1);
  return row ? mapReel(row) : null;
}

export async function listReels(limit = 50, status?: ReelStatus): Promise<Reel[]> {
  const rows = status
    ? await getDb()
        .select()
        .from(reels)
        .where(eq(reels.status, status))
        .orderBy(desc(reels.createdAt))
        .limit(limit)
    : await getDb().select().from(reels).orderBy(desc(reels.createdAt)).limit(limit);
  return rows.map(mapReel);
}

export async function libraryStats(): Promise<{
  total: number;
  ready: number;
  processing: number;
  needsTranscript: number;
  topics: { topic: string; count: number }[];
  minuteCount: number;
}> {
  const [row] = await getDb()
    .select({
      total: sql<number>`count(*)::int`,
      ready: sql<number>`(count(*) filter (where ${reels.status} = 'ready'))::int`,
      processing: sql<number>`(count(*) filter (where ${reels.status} in ('processing','queued')))::int`,
      needsTranscript: sql<number>`(count(*) filter (where ${reels.status} = 'needs_transcript'))::int`,
      seconds: sql<number>`coalesce(sum(${reels.duration}), 0)::double precision`,
    })
    .from(reels);

  const topicRows = await getDb()
    .select({ topics: reels.topics })
    .from(reels)
    .where(and(eq(reels.status, "ready"), sql`${reels.topics} is not null and ${reels.topics} != ''`));

  const counts = new Map<string, number>();
  for (const tr of topicRows) {
    for (const topic of String(tr.topics).split(",")) {
      const clean = topic.trim();
      if (clean) counts.set(clean, (counts.get(clean) ?? 0) + 1);
    }
  }

  return {
    total: Number(row?.total ?? 0),
    ready: Number(row?.ready ?? 0),
    processing: Number(row?.processing ?? 0),
    needsTranscript: Number(row?.needsTranscript ?? 0),
    minuteCount: Math.round(Number(row?.seconds ?? 0) / 60),
    topics: [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([topic, count]) => ({ topic, count })),
  };
}

export async function ftsSearch(
  query: string,
  limit = 30,
  platform?: string,
): Promise<{ id: string; rank: number; snippet: string }[]> {
  const tokens = query
    .toLowerCase()
    .match(/[a-z0-9][a-z0-9+#.-]{1,}/g)
    ?.map((token) => token.replace(/[^a-z0-9]/g, ""))
    .filter((token) => token.length > 1)
    .slice(0, 12);
  if (!tokens?.length) return [];

  const match = tokens.map((token) => `${token}:*`).join(" | ");
  const vector = sql`to_tsvector('english', concat_ws(' ', ${reels.title}, ${reels.caption}, ${reels.transcript}, ${reels.visualSummary}, ${reels.author}, ${reels.topics}))`;
  const tsQuery = sql`to_tsquery('english', ${match})`;
  const rank = sql<number>`ts_rank_cd(${vector}, ${tsQuery})`;
  const snippet = sql<string>`ts_headline('english', coalesce(${reels.transcript}, ${reels.caption}, ${reels.title}, ''), ${tsQuery}, 'StartSel=<mark>, StopSel=</mark>, MaxWords=28, MinWords=8')`;

  const rows = await getDb()
    .select({ id: reels.id, rank, snippet })
    .from(reels)
    .where(
      and(
        eq(reels.status, "ready"),
        sql`${vector} @@ ${tsQuery}`,
        platform ? eq(reels.platform, platform) : undefined,
      ),
    )
    .orderBy(sql`${rank} desc`)
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    rank: Number(row.rank),
    snippet: row.snippet ?? "",
  }));
}

export async function reelsWithEmbeddings(platform?: string): Promise<{
  id: string;
  embedding: Float32Array;
  model: string | null;
}[]> {
  const rows = await getDb()
    .select({
      id: reels.id,
      embedding: reels.embedding,
      model: reels.embeddingModel,
    })
    .from(reels)
    .where(
      and(
        eq(reels.status, "ready"),
        sql`${reels.embedding} is not null`,
        platform ? eq(reels.platform, platform) : undefined,
      ),
    );

  return rows.map((row) => ({
    id: row.id,
    embedding: new Float32Array(row.embedding ?? []),
    model: row.model,
  }));
}

export async function setTranscriptAndQueue(id: string, transcript: string, source = "manual") {
  await updateReel(id, {
    transcript,
    transcript_source: source,
    status: "processing",
    error: null,
  });
}

export async function createJob(reelId: string, steps: JobStep[]): Promise<Job> {
  const id = crypto.randomUUID();
  const ts = now();
  await getDb().insert(jobs).values({
    id,
    reelId,
    status: "running",
    stage: steps[0]?.key ?? "queued",
    steps,
    error: null,
    createdAt: ts,
    updatedAt: ts,
  });
  const job = await getJob(id);
  if (!job) throw new Error("Failed to create job");
  return job;
}

export async function updateJob(
  id: string,
  patch: { status?: Job["status"]; stage?: string; steps?: JobStep[]; error?: string | null },
): Promise<void> {
  const current = await getJob(id);
  if (!current) return;
  await getDb()
    .update(jobs)
    .set({
      status: patch.status ?? current.status,
      stage: patch.stage ?? current.stage,
      steps: patch.steps ?? current.steps,
      error: patch.error === undefined ? current.error : patch.error,
      updatedAt: now(),
    })
    .where(eq(jobs.id, id));
}

export async function touchJob(id: string): Promise<void> {
  await getDb().update(jobs).set({ updatedAt: now() }).where(eq(jobs.id, id));
}

export async function getJob(id: string): Promise<Job | null> {
  const [row] = await getDb().select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!row) return null;
  return {
    id: row.id,
    reel_id: row.reelId,
    status: row.status,
    stage: row.stage,
    steps: row.steps,
    error: row.error,
    created_at: iso(row.createdAt),
    updated_at: iso(row.updatedAt),
  };
}

export async function latestJobForReel(reelId: string): Promise<Job | null> {
  const [row] = await getDb()
    .select({ id: jobs.id })
    .from(jobs)
    .where(eq(jobs.reelId, reelId))
    .orderBy(desc(jobs.createdAt))
    .limit(1);
  return row ? getJob(row.id) : null;
}

export async function saveResearch(reelId: string, result: ResearchResult): Promise<void> {
  const ts = now();
  await getDb()
    .insert(research)
    .values({ reelId, result, createdAt: ts })
    .onConflictDoUpdate({
      target: research.reelId,
      set: { result, createdAt: ts },
    });
}

export async function getResearch(reelId: string): Promise<ResearchResult | null> {
  const [row] = await getDb()
    .select({ result: research.result })
    .from(research)
    .where(eq(research.reelId, reelId))
    .limit(1);
  return row?.result ?? null;
}

export async function getProfile(): Promise<Profile> {
  const [row] = await getDb().select().from(profile).where(eq(profile.id, 1)).limit(1);
  if (!row) {
    const empty: Profile = {
      handle: "",
      niche: "",
      audience: "",
      pillars: [],
      voice: "",
      avoid: "",
      goal: "",
      updated_at: now(),
    };
    await saveProfile(empty);
    return empty;
  }
  return {
    handle: row.handle,
    niche: row.niche,
    audience: row.audience,
    pillars: row.pillars ?? [],
    voice: row.voice,
    avoid: row.avoid,
    goal: row.goal,
    updated_at: iso(row.updatedAt),
  };
}

export async function saveProfile(input: Omit<Profile, "updated_at">): Promise<void> {
  const ts = now();
  await getDb()
    .insert(profile)
    .values({
      id: 1,
      handle: input.handle,
      niche: input.niche,
      audience: input.audience,
      pillars: input.pillars,
      voice: input.voice,
      avoid: input.avoid,
      goal: input.goal,
      updatedAt: ts,
    })
    .onConflictDoUpdate({
      target: profile.id,
      set: {
        handle: input.handle,
        niche: input.niche,
        audience: input.audience,
        pillars: input.pillars,
        voice: input.voice,
        avoid: input.avoid,
        goal: input.goal,
        updatedAt: ts,
      },
    });
}

export async function deleteReel(id: string): Promise<void> {
  await getDb().delete(reels).where(eq(reels.id, id));
}

export async function hydrateSearchHits(
  hits: {
    id: string;
    score: number;
    keyword_rank?: number | null;
    vector_score?: number | null;
    snippet?: string | null;
    reason?: string | null;
  }[],
): Promise<SearchHit[]> {
  const results: SearchHit[] = [];
  for (const hit of hits) {
    const reel = await getReel(hit.id);
    if (!reel) continue;
    results.push({
      reel,
      score: hit.score,
      keyword_rank: hit.keyword_rank ?? null,
      vector_score: hit.vector_score ?? null,
      snippet: hit.snippet ?? null,
      reason: hit.reason ?? null,
    });
  }
  return results;
}

export function dataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  return DATA_DIR;
}
