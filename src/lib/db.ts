import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
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
const DB_PATH = join(DATA_DIR, "reelprint.db");

type Row = Record<string, unknown>;

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function initDb() {
  ensureDataDir();
  const db = new DatabaseSync(DB_PATH);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS reels (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL UNIQUE,
      platform TEXT NOT NULL DEFAULT 'other',
      external_id TEXT,
      author TEXT,
      author_url TEXT,
      caption TEXT,
      title TEXT,
      transcript TEXT,
      transcript_source TEXT,
      visual_summary TEXT,
      duration REAL,
      thumbnail TEXT,
      posted_at TEXT,
      views INTEGER,
      likes INTEGER,
      comments INTEGER,
      shares INTEGER,
      followers INTEGER,
      engagement_json TEXT,
      dna_json TEXT,
      topics TEXT,
      embedding BLOB,
      embedding_model TEXT,
      status TEXT NOT NULL DEFAULT 'queued',
      error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS reels_status_idx ON reels(status);
    CREATE INDEX IF NOT EXISTS reels_platform_idx ON reels(platform);

    CREATE VIRTUAL TABLE IF NOT EXISTS reels_fts USING fts5(
      title,
      caption,
      transcript,
      visual_summary,
      author,
      topics,
      tokenize = 'porter unicode61'
    );

    CREATE TRIGGER IF NOT EXISTS reels_fts_ai AFTER INSERT ON reels BEGIN
      INSERT INTO reels_fts(rowid, title, caption, transcript, visual_summary, author, topics)
      VALUES (new.rowid, new.title, new.caption, new.transcript, new.visual_summary, new.author, new.topics);
    END;

    CREATE TRIGGER IF NOT EXISTS reels_fts_ad AFTER DELETE ON reels BEGIN
      DELETE FROM reels_fts WHERE rowid = old.rowid;
    END;

    CREATE TRIGGER IF NOT EXISTS reels_fts_au AFTER UPDATE ON reels BEGIN
      DELETE FROM reels_fts WHERE rowid = old.rowid;
      INSERT INTO reels_fts(rowid, title, caption, transcript, visual_summary, author, topics)
      VALUES (new.rowid, new.title, new.caption, new.transcript, new.visual_summary, new.author, new.topics);
    END;

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      reel_id TEXT NOT NULL,
      status TEXT NOT NULL,
      stage TEXT NOT NULL,
      steps_json TEXT NOT NULL,
      error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS research (
      reel_id TEXT PRIMARY KEY,
      result_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      handle TEXT NOT NULL DEFAULT '',
      niche TEXT NOT NULL DEFAULT '',
      audience TEXT NOT NULL DEFAULT '',
      pillars_json TEXT NOT NULL DEFAULT '[]',
      voice TEXT NOT NULL DEFAULT '',
      avoid TEXT NOT NULL DEFAULT '',
      goal TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );
  `);
  return db;
}

const globalForDb = globalThis as unknown as { __reelprintDb?: DatabaseSync };

export function getDb(): DatabaseSync {
  if (!globalForDb.__reelprintDb) {
    globalForDb.__reelprintDb = initDb();
  }
  return globalForDb.__reelprintDb;
}

function now() {
  return new Date().toISOString();
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapReel(row: Row): Reel {
  return {
    id: String(row.id),
    url: String(row.url),
    platform: row.platform as Reel["platform"],
    external_id: (row.external_id as string) ?? null,
    author: (row.author as string) ?? null,
    author_url: (row.author_url as string) ?? null,
    caption: (row.caption as string) ?? null,
    title: (row.title as string) ?? null,
    transcript: (row.transcript as string) ?? null,
    transcript_source: (row.transcript_source as string) ?? null,
    visual_summary: (row.visual_summary as string) ?? null,
    duration: row.duration === null ? null : Number(row.duration),
    thumbnail: (row.thumbnail as string) ?? null,
    posted_at: (row.posted_at as string) ?? null,
    views: row.views === null ? null : Number(row.views),
    likes: row.likes === null ? null : Number(row.likes),
    comments: row.comments === null ? null : Number(row.comments),
    shares: row.shares === null ? null : Number(row.shares),
    followers: row.followers === null ? null : Number(row.followers),
    engagement: parseJson<Reel["engagement"]>(row.engagement_json, null),
    dna: parseJson<ReelDna | null>(row.dna_json, null),
    topics: (row.topics as string) ?? null,
    embedding_model: (row.embedding_model as string) ?? null,
    status: row.status as ReelStatus,
    error: (row.error as string) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
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
  embedding?: Uint8Array | null;
  embedding_model?: string | null;
  status?: ReelStatus;
  error?: string | null;
};

export function insertReel(input: ReelInput): Reel {
  const db = getDb();
  const ts = now();
  db.prepare(
    `INSERT INTO reels (
      id, url, platform, external_id, author, author_url, caption, title, transcript, transcript_source,
      visual_summary, duration, thumbnail, posted_at, views, likes, comments, shares, followers,
      engagement_json, dna_json, topics, embedding, embedding_model, status, error, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    input.id,
    input.url,
    input.platform,
    input.external_id ?? null,
    input.author ?? null,
    input.author_url ?? null,
    input.caption ?? null,
    input.title ?? null,
    input.transcript ?? null,
    input.transcript_source ?? null,
    input.visual_summary ?? null,
    input.duration ?? null,
    input.thumbnail ?? null,
    input.posted_at ?? null,
    input.views ?? null,
    input.likes ?? null,
    input.comments ?? null,
    input.shares ?? null,
    input.followers ?? null,
    input.engagement ? JSON.stringify(input.engagement) : null,
    input.dna ? JSON.stringify(input.dna) : null,
    input.topics ?? null,
    input.embedding ?? null,
    input.embedding_model ?? null,
    input.status ?? "queued",
    input.error ?? null,
    ts,
    ts,
  );
  const reel = getReel(input.id);
  if (!reel) throw new Error("Failed to insert reel");
  return reel;
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

export function updateReel(id: string, patch: Record<string, unknown>): void {
  const entries = Object.entries(patch).filter(([key]) => UPDATABLE.has(key));
  if (!entries.length) return;
  const sets = entries.map(([key]) => `${key} = ?`).join(", ");
  const values = entries.map(([, value]) => {
    if (value === undefined) return null;
    if (value && typeof value === "object" && !(value instanceof Uint8Array)) {
      return JSON.stringify(value);
    }
    return value;
  });
  getDb()
    .prepare(`UPDATE reels SET ${sets}, updated_at = ? WHERE id = ?`)
    .run(...(values as never[]), now(), id);
}

export function getReel(id: string): Reel | null {
  const row = getDb().prepare("SELECT * FROM reels WHERE id = ?").get(id) as Row | undefined;
  return row ? mapReel(row) : null;
}

export function getReelByUrl(url: string): Reel | null {
  const row = getDb().prepare("SELECT * FROM reels WHERE url = ?").get(url) as Row | undefined;
  return row ? mapReel(row) : null;
}

export function listReels(limit = 50, status?: ReelStatus): Reel[] {
  const rows = status
    ? (getDb().prepare("SELECT * FROM reels WHERE status = ? ORDER BY created_at DESC LIMIT ?").all(status, limit) as Row[])
    : (getDb().prepare("SELECT * FROM reels ORDER BY created_at DESC LIMIT ?").all(limit) as Row[]);
  return rows.map(mapReel);
}

export function libraryStats(): {
  total: number;
  ready: number;
  processing: number;
  needsTranscript: number;
  topics: { topic: string; count: number }[];
  minuteCount: number;
} {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT COUNT(*) AS total,
        SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) AS ready,
        SUM(CASE WHEN status IN ('processing','queued') THEN 1 ELSE 0 END) AS processing,
        SUM(CASE WHEN status = 'needs_transcript' THEN 1 ELSE 0 END) AS needs_transcript,
        COALESCE(SUM(duration), 0) AS seconds
      FROM reels`,
    )
    .get() as Row;
  const topicRows = db
    .prepare(
      `SELECT topics FROM reels WHERE status = 'ready' AND topics IS NOT NULL AND topics != ''`,
    )
    .all() as Row[];
  const counts = new Map<string, number>();
  for (const tr of topicRows) {
    for (const topic of String(tr.topics).split(",")) {
      const clean = topic.trim();
      if (clean) counts.set(clean, (counts.get(clean) ?? 0) + 1);
    }
  }
  return {
    total: Number(row.total ?? 0),
    ready: Number(row.ready ?? 0),
    processing: Number(row.processing ?? 0),
    needsTranscript: Number(row.needs_transcript ?? 0),
    minuteCount: Math.round(Number(row.seconds ?? 0) / 60),
    topics: [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([topic, count]) => ({ topic, count })),
  };
}

export function ftsSearch(
  query: string,
  limit = 30,
  platform?: string,
): { id: string; rank: number; snippet: string }[] {
  const tokens = query
    .toLowerCase()
    .match(/[a-z0-9][a-z0-9+#.-]{1,}/g)
    ?.filter((t) => t.length > 1)
    .slice(0, 12);
  if (!tokens?.length) return [];
  const match = tokens.map((t) => `"${t.replace(/"/g, "")}"*`).join(" OR ");
  const sql = `
    SELECT r.id, bm25(reels_fts) AS rank,
      snippet(reels_fts, 2, '<mark>', '</mark>', ' … ', 14) AS snippet
    FROM reels_fts
    JOIN reels r ON r.rowid = reels_fts.rowid
    WHERE reels_fts MATCH ? AND r.status = 'ready'
      ${platform ? "AND r.platform = ?" : ""}
    ORDER BY rank LIMIT ?`;
  const params: (string | number)[] = [match];
  if (platform) params.push(platform);
  params.push(limit);
  const rows = getDb().prepare(sql).all(...params) as Row[];
  return rows.map((row) => ({
    id: String(row.id),
    rank: Number(row.rank),
    snippet: String(row.snippet ?? ""),
  }));
}

export function reelsWithEmbeddings(platform?: string): {
  id: string;
  embedding: Uint8Array;
  model: string | null;
}[] {
  const sql = `SELECT id, embedding, embedding_model FROM reels WHERE status = 'ready' AND embedding IS NOT NULL ${
    platform ? "AND platform = ?" : ""
  }`;
  const params = platform ? [platform] : [];
  const rows = getDb().prepare(sql).all(...params) as Row[];
  return rows.map((row) => ({
    id: String(row.id),
    embedding: row.embedding as Uint8Array,
    model: (row.embedding_model as string) ?? null,
  }));
}

export function setTranscriptAndQueue(id: string, transcript: string, source = "manual") {
  updateReel(id, {
    transcript,
    transcript_source: source,
    status: "processing",
    error: null,
  });
}

export function createJob(reelId: string, steps: JobStep[]): Job {
  const id = crypto.randomUUID();
  const ts = now();
  getDb()
    .prepare(
      "INSERT INTO jobs (id, reel_id, status, stage, steps_json, error, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)",
    )
    .run(id, reelId, "running", steps[0]?.key ?? "queued", JSON.stringify(steps), null, ts, ts);
  return getJob(id) as Job;
}

export function updateJob(
  id: string,
  patch: { status?: Job["status"]; stage?: string; steps?: JobStep[]; error?: string | null },
) {
  const current = getJob(id);
  if (!current) return;
  const next = {
    status: patch.status ?? current.status,
    stage: patch.stage ?? current.stage,
    steps: patch.steps ?? current.steps,
    error: patch.error === undefined ? current.error : patch.error,
  };
  getDb()
    .prepare("UPDATE jobs SET status = ?, stage = ?, steps_json = ?, error = ?, updated_at = ? WHERE id = ?")
    .run(next.status, next.stage, JSON.stringify(next.steps), next.error, now(), id);
}

export function getJob(id: string): Job | null {
  const row = getDb().prepare("SELECT * FROM jobs WHERE id = ?").get(id) as Row | undefined;
  if (!row) return null;
  return {
    id: String(row.id),
    reel_id: String(row.reel_id),
    status: row.status as Job["status"],
    stage: String(row.stage),
    steps: parseJson<JobStep[]>(row.steps_json, []),
    error: (row.error as string) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function latestJobForReel(reelId: string): Job | null {
  const row = getDb()
    .prepare("SELECT * FROM jobs WHERE reel_id = ? ORDER BY created_at DESC LIMIT 1")
    .get(reelId) as Row | undefined;
  if (!row) return null;
  return getJob(String(row.id));
}

export function saveResearch(reelId: string, result: ResearchResult) {
  getDb()
    .prepare(
      "INSERT INTO research (reel_id, result_json, created_at) VALUES (?,?,?) ON CONFLICT(reel_id) DO UPDATE SET result_json = excluded.result_json, created_at = excluded.created_at",
    )
    .run(reelId, JSON.stringify(result), now());
}

export function getResearch(reelId: string): ResearchResult | null {
  const row = getDb().prepare("SELECT result_json FROM research WHERE reel_id = ?").get(reelId) as
    | Row
    | undefined;
  return row ? parseJson<ResearchResult>(row.result_json, null as unknown as ResearchResult) : null;
}

export function getProfile(): Profile {
  const row = getDb().prepare("SELECT * FROM profile WHERE id = 1").get() as Row | undefined;
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
    saveProfile(empty);
    return empty;
  }
  return {
    handle: String(row.handle ?? ""),
    niche: String(row.niche ?? ""),
    audience: String(row.audience ?? ""),
    pillars: parseJson<string[]>(row.pillars_json, []),
    voice: String(row.voice ?? ""),
    avoid: String(row.avoid ?? ""),
    goal: String(row.goal ?? ""),
    updated_at: String(row.updated_at),
  };
}

export function saveProfile(profile: Omit<Profile, "updated_at">) {
  getDb()
    .prepare(
      `INSERT INTO profile (id, handle, niche, audience, pillars_json, voice, avoid, goal, updated_at)
       VALUES (1,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET handle=excluded.handle, niche=excluded.niche, audience=excluded.audience,
         pillars_json=excluded.pillars_json, voice=excluded.voice, avoid=excluded.avoid, goal=excluded.goal,
         updated_at=excluded.updated_at`,
    )
    .run(
      profile.handle,
      profile.niche,
      profile.audience,
      JSON.stringify(profile.pillars),
      profile.voice,
      profile.avoid,
      profile.goal,
      now(),
    );
}

export function hydrateSearchHits(
  hits: { id: string; score: number; keyword_rank?: number | null; vector_score?: number | null; snippet?: string | null; reason?: string | null }[],
): SearchHit[] {
  const results: SearchHit[] = [];
  for (const hit of hits) {
    const reel = getReel(hit.id);
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
  ensureDataDir();
  return DATA_DIR;
}
