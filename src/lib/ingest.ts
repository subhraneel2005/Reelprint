import { join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  chatJSON,
  describeFrames,
  embedText,
  supadataMetadata,
  supadataTranscript,
  transcribeAudio,
} from "./ai";
import {
  createJob,
  getJob,
  getReel,
  getReelByUrl,
  insertReel,
  latestJobForReel,
  updateJob,
  updateReel,
} from "./db";
import {
  cleanTmp,
  downloadMedia,
  extractPoster,
  fetchMediaMetadata,
  sampleFrames,
  saveFrameAsPoster,
  saveRemoteThumbnail,
  TMP_DIR,
} from "./media";
import { dnaPrompt, dnaSchema, heuristicDna } from "./prompts";
import type { Engagement, JobStep, Reel, ReelDna } from "./types";
import { detectPlatform, engagementLabel, normaliseUrl, truncate } from "./util";

const INGEST_STEPS: JobStep[] = [
  { key: "resolve", label: "Resolve the link", status: "pending" },
  { key: "metadata", label: "Read the post", status: "pending" },
  { key: "download", label: "Fetch the video", status: "pending" },
  { key: "transcribe", label: "Transcribe the audio", status: "pending" },
  { key: "vision", label: "Watch the frames", status: "pending" },
  { key: "dna", label: "Extract the content DNA", status: "pending" },
  { key: "embed", label: "Index for search", status: "pending" },
];

const ANALYSIS_STEPS: JobStep[] = [
  { key: "dna", label: "Extract the content DNA", status: "pending" },
  { key: "embed", label: "Index for search", status: "pending" },
];

export type IngestInput = {
  url?: string;
  transcript?: string;
  caption?: string;
  author?: string;
  title?: string;
  metrics?: {
    views?: number | null;
    likes?: number | null;
    comments?: number | null;
    shares?: number | null;
    followers?: number | null;
  };
  visual?: boolean;
};

function setStep(steps: JobStep[], key: string, status: JobStep["status"], detail?: string) {
  const step = steps.find((entry) => entry.key === key);
  if (step) {
    step.status = status;
    if (detail !== undefined) step.detail = detail;
  }
}

function failRemaining(steps: JobStep[], afterKey: string) {
  let seen = false;
  for (const step of steps) {
    if (step.key === afterKey) {
      seen = true;
      continue;
    }
    if (seen && step.status === "pending") step.status = "skipped";
  }
}

function scoreEngagement(reel: Reel): Engagement {
  const views = reel.views ?? 0;
  const likes = reel.likes ?? 0;
  const comments = reel.comments ?? 0;
  const followers = reel.followers ?? 0;
  const likeRate = views > 0 ? likes / views : null;
  const commentRate = views > 0 ? comments / views : null;
  const vph =
    reel.posted_at && views > 0
      ? views / Math.max(1, (Date.now() - new Date(reel.posted_at).getTime()) / 3_600_000)
      : null;
  let score: number | null = null;
  if (views > 0 && (likes > 0 || comments > 0)) {
    const likeScore = Math.min(1, (likeRate ?? 0) / 0.08);
    const commentScore = Math.min(1, (commentRate ?? 0) / 0.004);
    const followerScore = followers > 0 ? Math.min(1, (likes + comments) / followers / 0.15) : 0.4;
    const reachScore = Math.min(1, Math.log10(1 + views) / Math.log10(1 + 1_000_000));
    score = Math.round(100 * (0.3 * likeScore + 0.15 * commentScore + 0.2 * followerScore + 0.35 * reachScore));
    if (views < 100) score = Math.min(score, 45);
  } else if (followers > 0 && likes + comments > 0) {
    score = Math.round(100 * Math.min(1, (likes + comments) / followers / 0.15));
  }
  return {
    views: reel.views,
    likes: reel.likes,
    comments: reel.comments,
    shares: reel.shares,
    followers: reel.followers,
    like_rate: likeRate,
    comment_rate: commentRate,
    views_per_hour: vph,
    score,
    label: engagementLabel(score),
  };
}

async function buildDna(reel: Reel): Promise<{ dna: ReelDna; source: string; warning?: string }> {
  if (!reel.transcript && !reel.caption && !reel.visual_summary) {
    return { dna: heuristicDna(reel), source: "heuristic", warning: "Not enough text to analyse" };
  }
  try {
    const prompt = dnaPrompt(reel);
    const dna: ReelDna = await chatJSON(prompt, dnaSchema);
    return { dna, source: "model" };
  } catch (error) {
    return {
      dna: heuristicDna(reel),
      source: "heuristic",
      warning: (error as Error).message.slice(0, 180),
    };
  }
}

async function indexReel(reel: Reel, steps: JobStep[], jobId: string) {
  setStep(steps, "embed", "running");
  await updateJob(jobId, { steps, stage: "embed" });
  const dna = reel.dna;
  const text = [
    reel.title,
    reel.caption,
    reel.transcript,
    reel.visual_summary,
    dna?.topic,
    dna?.subtopic,
    dna?.format,
    dna?.hook,
    ...(dna?.keywords ?? []),
    ...(dna?.pillars ?? []),
    ...(dna?.tools ?? []),
  ]
    .filter(Boolean)
    .join("\n");
  const { embedding, model } = await embedText(text);
  const topics = [
    dna?.topic,
    dna?.subtopic,
    ...(dna?.pillars ?? []).slice(0, 2),
  ]
    .filter(Boolean)
    .join(",");
  const engagement = scoreEngagement(reel);
  await updateReel(reel.id, {
    embedding: Array.from(embedding),
    embedding_model: model,
    topics: topics || null,
    engagement_json: engagement,
    status: "ready",
    error: null,
  });
  setStep(steps, "embed", "done", model.startsWith("local") ? "Indexed locally" : "Indexed");
  await updateJob(jobId, { steps, stage: "embed" });
}

async function analysePipeline(reelId: string, jobId: string, steps: JobStep[], startedFresh = false) {
  try {
    const reel = await getReel(reelId);
    if (!reel) throw new Error("Reel not found");

    setStep(steps, "dna", "running");
    await updateJob(jobId, { steps, stage: "dna" });
    await updateReel(reelId, { status: "processing", error: null });
    const { dna, source, warning } = await buildDna(reel);
    await updateReel(reelId, { dna_json: dna, topics: [dna.topic, dna.subtopic, ...dna.pillars.slice(0, 2)].filter(Boolean).join(",") });
    setStep(steps, "dna", warning ? "done" : "done", warning ? `Fallback: ${warning}` : source === "model" ? "DNA extracted" : "Basic DNA");
    await updateJob(jobId, { steps, stage: "dna" });

    const refreshed = await getReel(reelId);
    if (!refreshed) throw new Error("Reel disappeared");
    await indexReel(refreshed, steps, jobId);
    await updateJob(jobId, { status: "done", stage: "ready", steps, error: null });
    if (!startedFresh) {
      // analysis-only runs keep the reel ready
    }
  } catch (error) {
    const message = (error as Error).message || "Analysis failed";
    const reel = await getReel(reelId);
    if (reel) {
      await updateReel(reelId, { status: "error", error: message });
    }
    const current = steps.find((step) => step.status === "running");
    if (current) setStep(steps, current.key, "error", message);
    for (const step of steps) {
      if (step.status === "pending") step.status = "skipped";
    }
    await updateJob(jobId, { status: "error", steps, error: message });
  }
}

async function runPipeline(reelId: string, jobId: string, input: IngestInput) {
  const steps = INGEST_STEPS.map((step) => ({ ...step }));
  await updateJob(jobId, { steps, stage: "resolve" });

  const reel = await getReel(reelId);
  if (!reel) return;

  try {
    await updateReel(reelId, { status: "processing" });
    setStep(steps, "resolve", "done", `${reel.platform} · ${reel.external_id ?? "link"}`);
    await updateJob(jobId, { steps, stage: "resolve" });

    setStep(steps, "metadata", "running");
    await updateJob(jobId, { steps, stage: "metadata" });

    let metadata: Awaited<ReturnType<typeof fetchMediaMetadata>> = null;
    let metadataError = "";
    const supplied = input.metrics ?? {};

    if (reel.platform === "instagram" && process.env.SUPADATA_API_KEY) {
      const sup = await supadataMetadata(reel.url);
      if (sup) {
        metadata = {
          title: sup.title ?? null,
          description: sup.description ?? null,
          duration: sup.media?.duration ?? null,
          views: sup.stats?.views ?? null,
          likes: sup.stats?.likes ?? null,
          comments: sup.stats?.comments ?? null,
          shares: sup.stats?.shares ?? null,
          author: sup.author?.displayName || sup.author?.username || null,
          authorUrl: null,
          thumbnail: sup.media?.thumbnailUrl ?? null,
          postedAt: sup.createdAt ?? null,
          followers: null,
          externalId: sup.id ?? reel.external_id,
          tags: sup.tags ?? [],
        };
      }
    }

    if (!metadata && !reel.url.startsWith("manual:")) {
      try {
        metadata = await fetchMediaMetadata(reel.url, reel.platform);
      } catch (error) {
        metadataError = (error as Error).message;
      }
    }

    if (!metadata && !input.transcript && !input.caption) {
      setStep(steps, "metadata", "error", metadataError || "Could not read this post");
      failRemaining(steps, "metadata");
      await updateReel(reelId, {
        status: "needs_transcript",
        error:
          metadataError ||
          "This platform blocked the fetch. Paste the transcript or caption to keep analysing.",
      });
      await updateJob(jobId, { status: "error", steps, error: "Transcript needed", stage: "metadata" });
      return;
    }

    const caption = input.transcript
      ? input.caption ?? metadata?.description ?? null
      : metadata?.description ?? input.caption ?? null;

    await updateReel(reelId, {
      author: input.author ?? metadata?.author ?? reel.author,
      author_url: metadata?.authorUrl ?? null,
      caption,
      title: input.title ?? metadata?.title ?? null,
      duration: metadata?.duration ?? null,
      thumbnail: metadata?.thumbnail ?? null,
      posted_at: metadata?.postedAt ?? null,
      views: supplied.views ?? metadata?.views ?? null,
      likes: supplied.likes ?? metadata?.likes ?? null,
      comments: supplied.comments ?? metadata?.comments ?? null,
      shares: supplied.shares ?? metadata?.shares ?? null,
      followers: supplied.followers ?? metadata?.followers ?? null,
    });
    setStep(
      steps,
      "metadata",
      metadata ? "done" : "done",
      metadata
        ? `${metadata.views ? `${Intl.NumberFormat("en", { notation: "compact" }).format(metadata.views)} views` : "metadata saved"}`
        : "Using the text you pasted",
    );
    await updateJob(jobId, { steps, stage: "metadata" });

    let transcript = input.transcript?.trim() || "";
    let transcriptSource = transcript ? "manual" : "";

    if (!transcript && process.env.SUPADATA_API_KEY) {
      setStep(steps, "transcribe", "running", "Fetching transcript");
      await updateJob(jobId, { steps, stage: "transcribe" });
      const supTranscript = await supadataTranscript(reel.url);
      if (supTranscript) {
        transcript = supTranscript;
        transcriptSource = "supadata";
      }
    }

    let videoPath: string | null = null;
    const workDir = join(TMP_DIR, reelId);

    let downloadFailed = "";
    if (!transcript) {
      setStep(steps, "download", "running");
      await updateJob(jobId, { steps, stage: "download" });
      let media: Awaited<ReturnType<typeof downloadMedia>> | null = null;
      try {
        media = await downloadMedia(reel.url, reel.platform, workDir);
        videoPath = media.videoPath;
        setStep(steps, "download", "done", media.audioPath ? "Audio ready" : "Video ready");
      } catch (error) {
        downloadFailed = (error as Error).message;
        setStep(steps, "download", "error", downloadFailed.slice(0, 180));
      }
      await updateJob(jobId, { steps, stage: "download" });

      if (media?.audioPath) {
        setStep(steps, "transcribe", "running");
        await updateJob(jobId, { steps, stage: "transcribe" });
        try {
          const result = await transcribeAudio(media.audioPath);
          transcript = result.text;
          transcriptSource = result.provider;
          setStep(steps, "transcribe", "done", `${result.provider} · ${transcript.split(/\s+/).length} words`);
        } catch (error) {
          setStep(steps, "transcribe", "error", (error as Error).message.slice(0, 180));
        }
      } else if (media) {
        setStep(steps, "transcribe", "error", "No audio track found");
      }
      await updateJob(jobId, { steps, stage: "transcribe" });
    } else {
      setStep(steps, "download", "done", "Skipped download");
      setStep(steps, "transcribe", "done", `${transcriptSource} · ${transcript.split(/\s+/).length} words`);
    }

    if (!transcript && caption) {
      transcript = caption;
      transcriptSource = "caption";
      setStep(steps, "transcribe", "done", "Caption used as transcript");
      if (downloadFailed) setStep(steps, "download", "skipped", "Link blocked; caption used");
    }

    if (!transcript) {
      failRemaining(steps, "transcribe");
      const detail = steps.find((step) => step.key === "transcribe")?.detail;
      await updateReel(reelId, {
        status: "needs_transcript",
        error: `${detail ? `${detail}. ` : ""}Paste the transcript to keep analysing this reel.`,
      });
      await updateJob(jobId, { status: "error", steps, error: "Transcript needed", stage: "transcribe" });
      return;
    }

    await updateReel(reelId, { transcript, transcript_source: transcriptSource });
    await updateJob(jobId, { steps, stage: "transcribe" });

    const visualEnabled = input.visual !== false;
    if (visualEnabled && !videoPath && !transcriptSource.startsWith("manual")) {
      // Only spend the extra download when we have not already fetched the media.
      try {
        setStep(steps, "vision", "running", "Fetching frames");
        await updateJob(jobId, { steps, stage: "vision" });
        const media = await downloadMedia(reel.url, reel.platform, workDir);
        videoPath = media.videoPath;
      } catch {
        // vision is optional
      }
    }

    if (visualEnabled && videoPath) {
      try {
        setStep(steps, "vision", "running", "Sampling 6 frames");
        await updateJob(jobId, { steps, stage: "vision" });
        const frames = await sampleFrames(videoPath, workDir, 6);
        if (frames.length) {
          const description = await describeFrames(
            frames.map((frame) => ({ base64: frame.base64, mime: frame.mime })),
            `${reel.title ?? ""} ${truncate(transcript, 400)}`,
          );
          if (description) {
            await updateReel(reelId, { visual_summary: description });
            setStep(steps, "vision", "done", `${frames.length} frames read`);
          } else {
            setStep(steps, "vision", "skipped", "No vision model configured");
          }
        } else {
          setStep(steps, "vision", "skipped", "No frames extracted");
        }
      } catch {
        setStep(steps, "vision", "skipped", "Frames unavailable");
      }
    } else {
      setStep(steps, "vision", "skipped", "Not requested");
    }
    await updateJob(jobId, { steps, stage: "vision" });

    const refreshed = await getReel(reelId);
    if (!refreshed) throw new Error("Reel disappeared");

    if (refreshed.thumbnail) {
      await saveRemoteThumbnail(refreshed.thumbnail, reelId);
    }
    if (videoPath) {
      const poster = await extractPoster(videoPath, workDir, reelId);
      if (!poster) {
        const frames = await sampleFrames(videoPath, workDir, 1);
        if (frames[0]) await saveFrameAsPoster(frames[0].path, reelId);
      }
    }

    setStep(steps, "dna", "running");
    await updateJob(jobId, { steps, stage: "dna" });
    const { dna, warning } = await buildDna((await getReel(reelId)) as Reel);
    await updateReel(reelId, {
      dna_json: dna,
      topics: [dna.topic, dna.subtopic, ...dna.pillars.slice(0, 2)].filter(Boolean).join(","),
    });
    setStep(steps, "dna", "done", warning ? `Fallback: ${warning}` : "DNA extracted");
    await updateJob(jobId, { steps, stage: "dna" });

    await indexReel((await getReel(reelId)) as Reel, steps, jobId);
    await updateJob(jobId, { status: "done", stage: "ready", steps, error: null });
  } catch (error) {
    const message = (error as Error).message || "Ingest failed";
    const current = steps.find((step) => step.status === "running");
    if (current) setStep(steps, current.key, "error", message);
    for (const step of steps) if (step.status === "pending") step.status = "skipped";
    await updateReel(reelId, { status: "error", error: message });
    await updateJob(jobId, { status: "error", steps, error: message });
  } finally {
    await cleanTmp(join(TMP_DIR, reelId));
  }
}

export async function startIngest(
  input: IngestInput,
): Promise<{ reel: Reel; jobId: string; existing: boolean }> {
  const rawUrl = input.url?.trim() ?? "";
  if (!rawUrl && !input.transcript?.trim()) {
    throw new Error("Add a reel link or paste a transcript");
  }
  const url = rawUrl ? normaliseUrl(rawUrl) : `manual:${randomUUID()}`;
  const { platform, externalId } = rawUrl ? detectPlatform(url) : { platform: "other" as const, externalId: null };
  const existing = await getReelByUrl(url);
  if (existing) {
    const job = await latestJobForReel(existing.id);
    return { reel: existing, jobId: job?.id ?? "", existing: true };
  }

  const id = randomUUID();
  const reel = await insertReel({
    id,
    url,
    platform,
    external_id: externalId,
    author: input.author ?? null,
    caption: input.caption ?? null,
    title: input.title ?? null,
    transcript: input.transcript ?? null,
    transcript_source: input.transcript ? "manual" : null,
    views: input.metrics?.views ?? null,
    likes: input.metrics?.likes ?? null,
    comments: input.metrics?.comments ?? null,
    shares: input.metrics?.shares ?? null,
    followers: input.metrics?.followers ?? null,
    status: "queued",
  });

  const steps = INGEST_STEPS.map((step) => ({ ...step }));
  if (input.transcript) {
    setStep(steps, "download", "done", "Using your transcript");
    setStep(steps, "transcribe", "done", "manual");
  }
  const job = await createJob(id, steps);
  void runPipeline(id, job.id, input);
  return { reel, jobId: job.id, existing: false };
}

export async function resumeWithTranscript(
  reelId: string,
  transcript: string,
): Promise<{ jobId: string }> {
  const reel = await getReel(reelId);
  if (!reel) throw new Error("Reel not found");
  await updateReel(reelId, {
    transcript,
    transcript_source: "manual",
    status: "processing",
    error: null,
  });
  const steps = ANALYSIS_STEPS.map((step) => ({ ...step }));
  const job = await createJob(reelId, steps);
  void analysePipeline(reelId, job.id, steps, true);
  return { jobId: job.id };
}

export async function retryAnalysis(reelId: string): Promise<{ jobId: string }> {
  const reel = await getReel(reelId);
  if (!reel) throw new Error("Reel not found");
  await updateReel(reelId, { status: "processing", error: null });
  const steps = ANALYSIS_STEPS.map((step) => ({ ...step }));
  const job = await createJob(reelId, steps);
  void analysePipeline(reelId, job.id, steps, true);
  return { jobId: job.id };
}

export async function getJobStatus(jobId: string) {
  return getJob(jobId);
}

export function reelHasEmbedding(reel: Reel) {
  return Boolean(reel.embedding_model);
}

export function embeddingDimension(embedding?: Float32Array | number[] | null) {
  return embedding?.length ?? 0;
}
