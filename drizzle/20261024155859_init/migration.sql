CREATE TABLE "jobs" (
	"id" text PRIMARY KEY,
	"reel_id" text NOT NULL,
	"status" text NOT NULL,
	"stage" text NOT NULL,
	"steps_json" jsonb NOT NULL,
	"error" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" integer PRIMARY KEY,
	"handle" text DEFAULT '' NOT NULL,
	"niche" text DEFAULT '' NOT NULL,
	"audience" text DEFAULT '' NOT NULL,
	"pillars_json" jsonb DEFAULT '[]' NOT NULL,
	"voice" text DEFAULT '' NOT NULL,
	"avoid" text DEFAULT '' NOT NULL,
	"goal" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reels" (
	"id" text PRIMARY KEY,
	"url" text NOT NULL,
	"platform" text DEFAULT 'other' NOT NULL,
	"external_id" text,
	"author" text,
	"author_url" text,
	"caption" text,
	"title" text,
	"transcript" text,
	"transcript_source" text,
	"visual_summary" text,
	"duration" real,
	"thumbnail" text,
	"posted_at" text,
	"views" integer,
	"likes" integer,
	"comments" integer,
	"shares" integer,
	"followers" integer,
	"engagement_json" jsonb,
	"dna_json" jsonb,
	"topics" text,
	"embedding" real[],
	"embedding_model" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"error" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research" (
	"reel_id" text PRIMARY KEY,
	"result_json" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "jobs_reel_id_idx" ON "jobs" ("reel_id");--> statement-breakpoint
CREATE INDEX "jobs_created_at_idx" ON "jobs" ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "reels_url_idx" ON "reels" ("url");--> statement-breakpoint
CREATE INDEX "reels_status_idx" ON "reels" ("status");--> statement-breakpoint
CREATE INDEX "reels_platform_idx" ON "reels" ("platform");--> statement-breakpoint
CREATE INDEX "reels_created_at_idx" ON "reels" ("created_at");--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_reel_id_reels_id_fkey" FOREIGN KEY ("reel_id") REFERENCES "reels"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "research" ADD CONSTRAINT "research_reel_id_reels_id_fkey" FOREIGN KEY ("reel_id") REFERENCES "reels"("id") ON DELETE CASCADE;