import "dotenv/config";
import { DatabaseSync } from "node:sqlite";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getDb } from "../src/lib/postgres";
import { jobs, profile, reels, research } from "../src/lib/schema";
import type { JobStep, ReelDna, ResearchResult } from "../src/lib/types";

type Row = Record<string, unknown>;

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function embedding(value: unknown): number[] | null {
  if (!(value instanceof Uint8Array) || !value.byteLength) return null;
  return Array.from(new Float32Array(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength)));
}

async function main() {
  const source = join(process.cwd(), ".data", "reelprint.db");
  if (!existsSync(source)) {
    console.log("No .data/reelprint.db found. Nothing to import.");
    return;
  }

  const sqlite = new DatabaseSync(source, { readOnly: true });
  const db = getDb();

  const reelRows = sqlite.prepare("SELECT * FROM reels").all() as Row[];
  let importedReels = 0;
  for (const row of reelRows) {
    const value = {
      id: String(row.id),
      url: String(row.url),
      platform: String(row.platform ?? "other"),
      externalId: (row.external_id as string) ?? null,
      author: (row.author as string) ?? null,
      authorUrl: (row.author_url as string) ?? null,
      caption: (row.caption as string) ?? null,
      title: (row.title as string) ?? null,
      transcript: (row.transcript as string) ?? null,
      transcriptSource: (row.transcript_source as string) ?? null,
      visualSummary: (row.visual_summary as string) ?? null,
      duration: row.duration === null ? null : Number(row.duration),
      thumbnail: (row.thumbnail as string) ?? null,
      postedAt: (row.posted_at as string) ?? null,
      views: row.views === null ? null : Number(row.views),
      likes: row.likes === null ? null : Number(row.likes),
      comments: row.comments === null ? null : Number(row.comments),
      shares: row.shares === null ? null : Number(row.shares),
      followers: row.followers === null ? null : Number(row.followers),
      engagement: parseJson(row.engagement_json, null),
      dna: parseJson<ReelDna | null>(row.dna_json, null),
      topics: (row.topics as string) ?? null,
      embedding: embedding(row.embedding),
      embeddingModel: (row.embedding_model as string) ?? null,
      status: String(row.status ?? "queued") as "queued" | "processing" | "needs_transcript" | "ready" | "error",
      error: (row.error as string) ?? null,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
    await db.insert(reels).values(value).onConflictDoUpdate({
      target: reels.id,
      set: value,
    });
    importedReels += 1;
  }

  const jobRows = sqlite.prepare("SELECT * FROM jobs").all() as Row[];
  for (const row of jobRows) {
    const value = {
      id: String(row.id),
      reelId: String(row.reel_id),
      status: String(row.status) as "running" | "done" | "error",
      stage: String(row.stage),
      steps: parseJson<JobStep[]>(row.steps_json, []),
      error: (row.error as string) ?? null,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
    await db.insert(jobs).values(value).onConflictDoUpdate({ target: jobs.id, set: value });
  }

  const researchRows = sqlite.prepare("SELECT * FROM research").all() as Row[];
  for (const row of researchRows) {
    const value = {
      reelId: String(row.reel_id),
      result: parseJson<ResearchResult>(row.result_json, {} as ResearchResult),
      createdAt: String(row.created_at),
    };
    await db
      .insert(research)
      .values(value)
      .onConflictDoUpdate({ target: research.reelId, set: value });
  }

  const profileRow = sqlite.prepare("SELECT * FROM profile WHERE id = 1").get() as Row | undefined;
  if (profileRow) {
    const value = {
      id: 1,
      handle: String(profileRow.handle ?? ""),
      niche: String(profileRow.niche ?? ""),
      audience: String(profileRow.audience ?? ""),
      pillars: parseJson<string[]>(profileRow.pillars_json, []),
      voice: String(profileRow.voice ?? ""),
      avoid: String(profileRow.avoid ?? ""),
      goal: String(profileRow.goal ?? ""),
      updatedAt: String(profileRow.updated_at),
    };
    await db.insert(profile).values(value).onConflictDoUpdate({ target: profile.id, set: value });
  }

  sqlite.close();
  console.log(
    `Imported ${importedReels} reels, ${jobRows.length} jobs, ${researchRows.length} research briefs${
      profileRow ? ", and the creator profile" : ""
    }.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
