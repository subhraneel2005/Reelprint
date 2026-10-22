import { readFile } from "node:fs/promises";
import { z } from "zod";
import { embed, generateText, Output, transcribe } from "ai";
import type { LanguageModel } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { keywordsFrom } from "./util";

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small";
const OPENROUTER_EMBED_MODEL = process.env.OPENROUTER_EMBED_MODEL || "openai/text-embedding-3-small";
const TRANSCRIBE_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1";
const OPENROUTER_TRANSCRIBE_MODEL = process.env.OPENROUTER_TRANSCRIBE_MODEL || "openai/whisper-1";

export const localEmbeddingModel = "local-hash-512";

export function aiStatus() {
  return {
    openai: Boolean(process.env.OPENAI_API_KEY),
    openrouter: Boolean(process.env.OPENROUTER_API_KEY),
    gemini: Boolean(process.env.GEMINI_API_KEY),
    youtube: Boolean(process.env.YOUTUBE_API_KEY),
    supadata: Boolean(process.env.SUPADATA_API_KEY),
    chat: Boolean(process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY),
    embeddings: Boolean(process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY),
    transcription: Boolean(
      process.env.OPENAI_API_KEY ||
        process.env.OPENROUTER_API_KEY ||
        process.env.GEMINI_API_KEY ||
        process.env.SUPADATA_API_KEY,
    ),
    vision: Boolean(process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY),
  };
}

let openaiProvider: ReturnType<typeof createOpenAI> | null = null;
let openrouterProvider: ReturnType<typeof createOpenRouter> | null = null;
let geminiProvider: ReturnType<typeof createGoogleGenerativeAI> | null = null;
let openrouterAudioProvider: ReturnType<typeof createOpenAI> | null = null;

function openai() {
  if (!openaiProvider) {
    openaiProvider = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    });
  }
  return openaiProvider;
}

function openrouter() {
  if (!openrouterProvider) {
    openrouterProvider = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
      headers: {
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "Reelprint",
      },
    });
  }
  return openrouterProvider;
}

function gemini() {
  if (!geminiProvider) {
    geminiProvider = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiProvider;
}

function openrouterAudio() {
  if (!openrouterAudioProvider) {
    openrouterAudioProvider = createOpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      headers: {
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "Reelprint",
      },
    });
  }
  return openrouterAudioProvider;
}

type ChatProvider = { name: string; model: LanguageModel };

function chatProviders(): ChatProvider[] {
  const providers: ChatProvider[] = [];
  if (process.env.OPENAI_API_KEY) {
    providers.push({ name: "openai", model: openai()(OPENAI_MODEL) });
  }
  if (process.env.OPENROUTER_API_KEY) {
    providers.push({ name: "openrouter", model: openrouter()(OPENROUTER_MODEL) });
  }
  if (process.env.GEMINI_API_KEY) {
    providers.push({ name: "gemini", model: gemini()(GEMINI_MODEL) });
  }
  const preferred = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (preferred) providers.sort((a, b) => Number(b.name === preferred) - Number(a.name === preferred));
  return providers;
}

function parseJsonLoose(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("Model did not return JSON");
  }
}

type ChatOptions = {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
};

export async function chatJSON<T>(options: ChatOptions, schema: z.ZodType<T>): Promise<T> {
  const providers = chatProviders();
  if (!providers.length) {
    throw new Error("No chat model configured. Add OPENROUTER_API_KEY, OPENAI_API_KEY or GEMINI_API_KEY.");
  }
  const errors: string[] = [];
  for (const provider of providers) {
    try {
      const result = await generateText({
        model: provider.model,
        system: options.system,
        prompt: options.user,
        temperature: options.temperature ?? 0.4,
        maxOutputTokens: options.maxTokens ?? 2200,
        output: Output.object({ schema }),
        abortSignal: AbortSignal.timeout(120_000),
      });
      if (result.output == null) throw new Error("Empty structured response");
      return schema.parse(result.output);
    } catch (structuredError) {
      errors.push(`${provider.name}: ${(structuredError as Error).message.slice(0, 240)}`);
      try {
        const result = await generateText({
          model: provider.model,
          system: options.system,
          prompt: options.user,
          temperature: options.temperature ?? 0.4,
          maxOutputTokens: options.maxTokens ?? 2200,
          abortSignal: AbortSignal.timeout(120_000),
        });
        if (!result.text.trim()) throw new Error("Empty model response");
        return schema.parse(parseJsonLoose(result.text));
      } catch (textError) {
        errors.push(`${provider.name} json: ${(textError as Error).message.slice(0, 240)}`);
      }
    }
  }
  throw new Error(`All chat providers failed. ${errors.join(" | ")}`);
}

export async function embedText(text: string): Promise<{ embedding: Float32Array; model: string }> {
  const value = text.slice(0, 8000);
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const { embedding } = await embed({
        model: openrouter().textEmbeddingModel(OPENROUTER_EMBED_MODEL),
        value,
        abortSignal: AbortSignal.timeout(45_000),
      });
      if (embedding.length) {
        return { embedding: new Float32Array(embedding), model: OPENROUTER_EMBED_MODEL };
      }
    } catch {
      // fall through to OpenAI or the local embedding
    }
  }
  if (process.env.OPENAI_API_KEY) {
    try {
      const { embedding } = await embed({
        model: openai().embedding(EMBED_MODEL),
        value,
        abortSignal: AbortSignal.timeout(45_000),
      });
      if (embedding.length) {
        return { embedding: new Float32Array(embedding), model: EMBED_MODEL };
      }
    } catch {
      // fall through to the local embedding
    }
  }
  return { embedding: localEmbedding(text), model: localEmbeddingModel };
}

function hashToken(token: string): number {
  let hash = 2166136261;
  for (let i = 0; i < token.length; i += 1) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function localEmbedding(text: string, dims = 512): Float32Array {
  const vector = new Float32Array(dims);
  const tokens = text.toLowerCase().match(/[a-z0-9][a-z0-9+#.-]{1,}/g) ?? [];
  if (!tokens.length) return vector;
  const add = (token: string, weight: number) => {
    const h = hashToken(token);
    vector[h % dims] += weight;
    vector[(h >>> 9) % dims] += weight * 0.5;
  };
  tokens.forEach((token, index) => {
    add(token, 1);
    if (index > 0) add(`${tokens[index - 1]}_${token}`, 0.6);
  });
  for (const keyword of keywordsFrom(text, 12)) add(keyword, 1.4);
  let norm = 0;
  for (const value of vector) norm += value * value;
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < dims; i += 1) vector[i] /= norm;
  return vector;
}

export function cosine(a: Float32Array | Uint8Array, b: Float32Array | Uint8Array): number {
  const length = Math.min(a.length, b.length);
  if (!length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < length; i += 1) {
    const av = a[i];
    const bv = b[i];
    dot += av * bv;
    na += av * av;
    nb += bv * bv;
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function float32ToBytes(vector: Float32Array): Uint8Array {
  return new Uint8Array(vector.buffer.slice(0));
}

export function bytesToFloat32(bytes: Uint8Array): Float32Array {
  return new Float32Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
}

export async function transcribeAudio(filePath: string, mime = "audio/mpeg"): Promise<{ text: string; provider: string }> {
  const errors: string[] = [];
  const audio = new Uint8Array(await readFile(filePath));
  if (process.env.OPENAI_API_KEY) {
    try {
      const result = await transcribe({
        model: openai().transcription(TRANSCRIBE_MODEL),
        audio,
        abortSignal: AbortSignal.timeout(120_000),
      });
      if (result.text.trim()) return { text: result.text.trim(), provider: "whisper" };
      errors.push("OpenAI returned an empty transcript");
    } catch (error) {
      errors.push(`OpenAI: ${(error as Error).message}`);
    }
  }
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const result = await transcribe({
        model: openrouterAudio().transcription(OPENROUTER_TRANSCRIBE_MODEL),
        audio,
        abortSignal: AbortSignal.timeout(120_000),
      });
      if (result.text.trim()) return { text: result.text.trim(), provider: "openrouter-whisper" };
      errors.push("OpenRouter returned an empty transcript");
    } catch (error) {
      errors.push(`OpenRouter: ${(error as Error).message}`);
    }
  }
  if (process.env.GEMINI_API_KEY) {
    try {
      if (audio.byteLength > 18 * 1024 * 1024) throw new Error("audio too large for inline Gemini request");
      const result = await generateText({
        model: gemini()(GEMINI_MODEL),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Transcribe this short-form video audio verbatim. Include punctuation. If there is no speech, return an empty string. Return only the transcript, no commentary.",
              },
              { type: "file", mediaType: mime, data: audio },
            ],
          },
        ],
        temperature: 0.1,
        maxOutputTokens: 4096,
        abortSignal: AbortSignal.timeout(120_000),
      });
      if (result.text.trim()) return { text: result.text.trim(), provider: "gemini" };
      errors.push("Gemini returned an empty transcript");
    } catch (error) {
      errors.push(`Gemini: ${(error as Error).message}`);
    }
  }
  throw new Error(`Transcription failed. ${errors.join(" | ")}`);
}

async function supadataRequest(path: string): Promise<unknown> {
  const response = await fetch(`https://api.supadata.ai/v1/${path}`, {
    headers: { "x-api-key": process.env.SUPADATA_API_KEY ?? "" },
    signal: AbortSignal.timeout(90_000),
  });
  if (!response.ok) {
    throw new Error(`Supadata ${response.status}: ${(await response.text()).slice(0, 240)}`);
  }
  return response.json();
}

export async function supadataTranscript(url: string): Promise<string | null> {
  if (!process.env.SUPADATA_API_KEY) return null;
  try {
    let data = (await supadataRequest(
      `transcript?url=${encodeURIComponent(url)}&text=true&mode=auto`,
    )) as Record<string, unknown>;
    if (typeof data.jobId === "string") {
      const jobId = data.jobId;
      for (let attempt = 0; attempt < 20; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        data = (await supadataRequest(`transcript/${jobId}`)) as Record<string, unknown>;
        const status = String(data.status ?? "");
        if (status === "completed") {
          const result = data.result as Record<string, unknown> | undefined;
          const content = result?.content ?? data.content;
          return typeof content === "string" ? content : null;
        }
        if (status === "failed") return null;
      }
      return null;
    }
    const content = data.content;
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content
        .map((chunk) => (typeof chunk === "object" && chunk ? String((chunk as { text?: string }).text ?? "") : ""))
        .join(" ")
        .trim();
    }
    return null;
  } catch {
    return null;
  }
}

export type SupadataMetadata = {
  platform?: string;
  id?: string;
  url?: string;
  title?: string | null;
  description?: string | null;
  author?: { username?: string; displayName?: string; avatarUrl?: string };
  stats?: { views?: number | null; likes?: number | null; comments?: number | null; shares?: number | null };
  media?: { duration?: number | null; thumbnailUrl?: string | null };
  tags?: string[];
  createdAt?: string;
};

export async function supadataMetadata(url: string): Promise<SupadataMetadata | null> {
  if (!process.env.SUPADATA_API_KEY) return null;
  try {
    return (await supadataRequest(`metadata?url=${encodeURIComponent(url)}`)) as SupadataMetadata;
  } catch {
    return null;
  }
}

type Frame = { base64: string; mime: string };

function visionProviders(): ChatProvider[] {
  const providers: ChatProvider[] = [];
  if (process.env.OPENROUTER_API_KEY) {
    providers.push({ name: "openrouter", model: openrouter()(OPENROUTER_MODEL) });
  }
  if (process.env.OPENAI_API_KEY) {
    providers.push({ name: "openai", model: openai()(OPENAI_MODEL) });
  }
  if (process.env.GEMINI_API_KEY) {
    providers.push({ name: "gemini", model: gemini()(GEMINI_MODEL) });
  }
  const preferred = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (preferred) providers.sort((a, b) => Number(b.name === preferred) - Number(a.name === preferred));
  return providers;
}

export async function describeFrames(frames: Frame[], context: string): Promise<string | null> {
  if (!frames.length) return null;
  const prompt = `You are analysing frames from a short-form video for a content researcher. Describe what is visible in concrete terms: the setting, what the person is doing, on-screen text (quote it exactly if legible), editing style, b-roll, props, and the visual hook. Do not speculate about the topic beyond what is visible. Context: ${context || "none"}`;
  for (const provider of visionProviders()) {
    try {
      const result = await generateText({
        model: provider.model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              ...frames.map((frame) => ({
                type: "file" as const,
                mediaType: frame.mime,
                data: frame.base64,
              })),
            ],
          },
        ],
        temperature: 0.2,
        maxOutputTokens: 800,
        abortSignal: AbortSignal.timeout(90_000),
      });
      if (result.text.trim()) return result.text.trim();
    } catch {
      // try the next vision provider
    }
  }
  return null;
}

const rerankSchema = z.object({
  order: z
    .array(z.object({ id: z.string(), reason: z.string().default("") }))
    .default([]),
});

export async function rerank(query: string, items: { id: string; text: string }[]): Promise<{ id: string; reason: string }[] | null> {
  if (!items.length) return [];
  if (!aiStatus().chat) return null;
  try {
    const result = await chatJSON(
      {
        system:
          "You rerank search results for a content researcher. Rank the items by how useful they are as evidence for the query. Prefer items with matching format, topic, and hook mechanics. Return JSON: {\"order\":[{\"id\":\"...\",\"reason\":\"one short phrase\"}]} using only supplied ids.",
        user: JSON.stringify({ query, items }).slice(0, 24_000),
        temperature: 0.1,
        maxTokens: 1200,
      },
      rerankSchema,
    );
    const order = result.order
      .filter((entry) => items.some((item) => item.id === entry.id))
      .map((entry) => ({ id: entry.id, reason: entry.reason ?? "" }));
    return order.length ? order : null;
  } catch {
    return null;
  }
}
