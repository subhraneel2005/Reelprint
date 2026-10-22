import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const MEDIA_DIR = join(process.cwd(), ".data", "media");
export const TMP_DIR = join(process.cwd(), ".data", "tmp");

export async function ensureDirs() {
  await mkdir(MEDIA_DIR, { recursive: true });
  await mkdir(TMP_DIR, { recursive: true });
}

type RunResult = { stdout: string; stderr: string; code: number };

function run(command: string, args: string[], timeoutMs = 180_000): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`${command} timed out after ${Math.round(timeoutMs / 1000)}s`));
    }, timeoutMs);
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
      if (stdout.length > 4_000_000) stdout = stdout.slice(-2_000_000);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
      if (stderr.length > 200_000) stderr = stderr.slice(-100_000);
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code: code ?? 0 });
    });
  });
}

function cookieArgs(platform: string): string[] {
  const browser = process.env.YTDLP_COOKIES_FROM_BROWSER;
  const file = process.env.YTDLP_COOKIES_FILE;
  const igBrowser = process.env.IG_COOKIES_FROM_BROWSER;
  const igFile = process.env.IG_COOKIES_FILE;
  const args: string[] = [];
  if (file && existsSync(file)) args.push("--cookies", file);
  else if (igFile && platform === "instagram" && existsSync(igFile)) args.push("--cookies", igFile);
  else if (browser) args.push("--cookies-from-browser", browser);
  else if (igBrowser && platform === "instagram") args.push("--cookies-from-browser", igBrowser);
  return args;
}

export type MediaMetadata = {
  title: string | null;
  description: string | null;
  duration: number | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  author: string | null;
  authorUrl: string | null;
  thumbnail: string | null;
  postedAt: string | null;
  followers: number | null;
  externalId: string | null;
  tags: string[];
};

type YtDlpJson = {
  title?: string;
  description?: string;
  duration?: number;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  uploader?: string;
  uploader_id?: string;
  channel?: string;
  channel_url?: string;
  uploader_url?: string;
  webpage_url?: string;
  thumbnail?: string;
  thumbnails?: { url?: string; preference?: number }[];
  timestamp?: number;
  release_timestamp?: number;
  upload_date?: string;
  channel_follower_count?: number;
  tags?: string[];
  id?: string;
};

export async function fetchMediaMetadata(
  url: string,
  platform: string,
): Promise<MediaMetadata | null> {
  const args = ["-J", "--no-warnings", "--no-playlist", "--skip-download", ...cookieArgs(platform), url];
  const result = await run("yt-dlp", args, 90_000);
  if (result.code !== 0) {
    throw new Error(result.stderr.split("\n").filter(Boolean).slice(-2).join(" ") || "yt-dlp metadata failed");
  }
  let parsed: YtDlpJson;
  try {
    parsed = JSON.parse(result.stdout) as YtDlpJson;
  } catch {
    throw new Error("Could not parse yt-dlp metadata");
  }
  const thumbs = (parsed.thumbnails ?? [])
    .filter((thumb) => thumb.url)
    .sort((a, b) => (b.preference ?? 0) - (a.preference ?? 0));
  return {
    title: parsed.title ?? null,
    description: parsed.description ?? null,
    duration: typeof parsed.duration === "number" ? parsed.duration : null,
    views: typeof parsed.view_count === "number" ? parsed.view_count : null,
    likes: typeof parsed.like_count === "number" ? parsed.like_count : null,
    comments: typeof parsed.comment_count === "number" ? parsed.comment_count : null,
    shares: null,
    author: parsed.uploader ?? parsed.channel ?? parsed.uploader_id ?? null,
    authorUrl: parsed.uploader_url ?? parsed.channel_url ?? null,
    thumbnail: parsed.thumbnail ?? thumbs[0]?.url ?? null,
    postedAt:
      parsed.timestamp || parsed.release_timestamp
        ? new Date((parsed.timestamp ?? parsed.release_timestamp) as number * 1000).toISOString()
        : parsed.upload_date
          ? `${parsed.upload_date.slice(0, 4)}-${parsed.upload_date.slice(4, 6)}-${parsed.upload_date.slice(6, 8)}T00:00:00.000Z`
          : null,
    followers: typeof parsed.channel_follower_count === "number" ? parsed.channel_follower_count : null,
    externalId: parsed.id ?? null,
    tags: parsed.tags ?? [],
  };
}

export async function downloadMedia(
  url: string,
  platform: string,
  dir: string,
): Promise<{ videoPath: string | null; audioPath: string | null; log: string }> {
  await mkdir(dir, { recursive: true });
  const base = join(dir, "source");
  const videoArgs = [
    "--no-warnings",
    "--no-playlist",
    "--no-progress",
    "--max-filesize",
    "120M",
    "-f",
    "b[height<=720][ext=mp4]/b[height<=720]/b",
    "--merge-output-format",
    "mp4",
    "-o",
    `${base}.%(ext)s`,
    ...cookieArgs(platform),
    url,
  ];
  const videoResult = await run("yt-dlp", videoArgs, 240_000);
  let videoPath: string | null = null;
  if (videoResult.code === 0) {
    const files = await readdir(dir);
    const found = files.find((file) => file.startsWith("source.") && !file.endsWith(".part"));
    if (found) videoPath = join(dir, found);
  }

  const audioOut = join(dir, "audio.mp3");
  if (videoPath) {
    const ff = await run("ffmpeg", ["-y", "-i", videoPath, "-vn", "-ac", "1", "-ar", "16000", "-b:a", "64k", audioOut], 180_000);
    if (ff.code === 0 && existsSync(audioOut)) {
      return { videoPath, audioPath: audioOut, log: videoResult.stderr.slice(-400) };
    }
  }

  const audioArgs = [
    "--no-warnings",
    "--no-playlist",
    "--no-progress",
    "--max-filesize",
    "60M",
    "-f",
    "ba/b",
    "-x",
    "--audio-format",
    "mp3",
    "--audio-quality",
    "5",
    "-o",
    `${join(dir, "audio")}.%(ext)s`,
    ...cookieArgs(platform),
    url,
  ];
  const audioResult = await run("yt-dlp", audioArgs, 180_000);
  const audioPath = existsSync(audioOut) ? audioOut : null;
  return {
    videoPath,
    audioPath: audioResult.code === 0 ? audioPath : null,
    log: `${videoResult.stderr.slice(-300)}\n${audioResult.stderr.slice(-300)}`,
  };
}

export async function probeDuration(filePath: string): Promise<number | null> {
  const result = await run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ], 30_000);
  if (result.code !== 0) return null;
  const value = Number(result.stdout.trim());
  return Number.isFinite(value) ? value : null;
}

export async function sampleFrames(
  videoPath: string,
  dir: string,
  count = 6,
): Promise<{ path: string; base64: string; mime: string }[]> {
  const duration = (await probeDuration(videoPath)) ?? 0;
  if (!duration) return [];
  const fps = Math.max(0.02, count / duration);
  const output = join(dir, "frame_%02d.jpg");
  const result = await run(
    "ffmpeg",
    [
      "-y",
      "-i",
      videoPath,
      "-vf",
      `fps=${fps.toFixed(4)},scale=720:-2`,
      "-frames:v",
      String(count),
      "-q:v",
      "4",
      output,
    ],
    120_000,
  );
  if (result.code !== 0) return [];
  const files = (await readdir(dir)).filter((file) => /^frame_\d+\.jpg$/.test(file)).sort();
  const frames: { path: string; base64: string; mime: string }[] = [];
  for (const file of files.slice(0, count)) {
    const path = join(dir, file);
    const buffer = await readFile(path);
    frames.push({ path, base64: buffer.toString("base64"), mime: "image/jpeg" });
  }
  return frames;
}

export async function extractPoster(videoPath: string, dir: string, id: string): Promise<string | null> {
  const out = join(MEDIA_DIR, `${id}.jpg`);
  const result = await run("ffmpeg", ["-y", "-ss", "0.2", "-i", videoPath, "-frames:v", "1", "-vf", "scale=720:-2", "-q:v", "4", out], 60_000);
  return result.code === 0 && existsSync(out) ? out : null;
}

export async function saveRemoteThumbnail(url: string, id: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength < 1024) return null;
    const path = join(MEDIA_DIR, `${id}.jpg`);
    await writeFile(path, buffer);
    return path;
  } catch {
    return null;
  }
}

export async function saveFrameAsPoster(framePath: string, id: string): Promise<string | null> {
  try {
    const buffer = await readFile(framePath);
    const path = join(MEDIA_DIR, `${id}.jpg`);
    await writeFile(path, buffer);
    return path;
  } catch {
    return null;
  }
}

export async function cleanTmp(dir: string) {
  try {
    await rm(dir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}
