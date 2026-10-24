import {
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { Engagement, Job, JobStep, ReelDna, ReelStatus, ResearchResult } from "./types";

export const reels = pgTable(
  "reels",
  {
    id: text("id").primaryKey(),
    url: text("url").notNull(),
    platform: text("platform").notNull().default("other"),
    externalId: text("external_id"),
    author: text("author"),
    authorUrl: text("author_url"),
    caption: text("caption"),
    title: text("title"),
    transcript: text("transcript"),
    transcriptSource: text("transcript_source"),
    visualSummary: text("visual_summary"),
    duration: real("duration"),
    thumbnail: text("thumbnail"),
    postedAt: text("posted_at"),
    views: integer("views"),
    likes: integer("likes"),
    comments: integer("comments"),
    shares: integer("shares"),
    followers: integer("followers"),
    engagement: jsonb("engagement_json").$type<Engagement | null>(),
    dna: jsonb("dna_json").$type<ReelDna | null>(),
    topics: text("topics"),
    embedding: real("embedding").array(),
    embeddingModel: text("embedding_model"),
    status: text("status").$type<ReelStatus>().notNull().default("queued"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
  },
  (table) => [
    uniqueIndex("reels_url_idx").on(table.url),
    index("reels_status_idx").on(table.status),
    index("reels_platform_idx").on(table.platform),
    index("reels_created_at_idx").on(table.createdAt),
  ],
);

export const jobs = pgTable(
  "jobs",
  {
    id: text("id").primaryKey(),
    reelId: text("reel_id")
      .notNull()
      .references(() => reels.id, { onDelete: "cascade" }),
    status: text("status").$type<Job["status"]>().notNull(),
    stage: text("stage").notNull(),
    steps: jsonb("steps_json").$type<JobStep[]>().notNull(),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
  },
  (table) => [
    index("jobs_reel_id_idx").on(table.reelId),
    index("jobs_created_at_idx").on(table.createdAt),
  ],
);

export const research = pgTable("research", {
  reelId: text("reel_id")
    .primaryKey()
    .references(() => reels.id, { onDelete: "cascade" }),
  result: jsonb("result_json").$type<ResearchResult>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const profile = pgTable("profile", {
  id: integer("id").primaryKey(),
  handle: text("handle").notNull().default(""),
  niche: text("niche").notNull().default(""),
  audience: text("audience").notNull().default(""),
  pillars: jsonb("pillars_json").$type<string[]>().notNull().default([]),
  voice: text("voice").notNull().default(""),
  avoid: text("avoid").notNull().default(""),
  goal: text("goal").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
});
