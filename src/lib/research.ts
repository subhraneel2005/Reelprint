import { chatJSON } from "./ai";
import { getProfile, getReel, getResearch, saveResearch } from "./db";
import { normaliseResearch, researchPrompt, researchSchema } from "./prompts";
import { discoverSimilar } from "./youtube";
import type { Reel, ResearchResult, YouTubeHit } from "./types";

function fallbackResearch(reel: Reel): ResearchResult {
  const dna = reel.dna;
  const topic = dna?.topic || reel.title || "this topic";
  const format = dna?.format || "short-form video";
  const beats =
    dna?.structure?.length
      ? dna.structure.map((beat, index) => ({
          time: `${Math.round((index / Math.max(1, dna.structure.length)) * (reel.duration ?? 45))}s`,
          beat: beat.beat,
          why: beat.purpose,
        }))
      : [
          { time: "0s", beat: "Open on the exact outcome or problem", why: "Gives a reason to keep watching" },
          { time: "3s", beat: "Name the mistake or the shortcut", why: "Creates tension and relevance" },
          { time: "10s", beat: "Show the process on screen", why: "Proof is more persuasive than claims" },
          { time: "25s", beat: "Land the result and one takeaway", why: "Rewards the viewer for staying" },
          { time: "35s", beat: "Ask for the next action", why: "Turns attention into a conversation" },
        ];
  return {
    why_it_works: {
      hook: dna?.hook || "The open loops on the first frame and the first line carry this video.",
      retention: `The ${format} keeps a visible result on screen while the explanation is delivered.`,
      emotion: dna?.emotion || "Curiosity plus the relief of a shortcut.",
      format: dna?.format_detail || `A repeatable ${format} built around one idea.`,
      cta: dna?.cta || "Save or comment for the follow-up.",
      evidence: dna?.why_it_works ?? ["The structure moves from tension to proof to a single takeaway."],
    },
    blueprint: {
      beats,
      visual_notes: dna?.visual_style || "Keep the outcome on screen from the first frame. Cut every pause.",
      audio_notes: dna?.audio_style || "Record close to the mic. Keep music under the voice.",
      caption_formula: "One-line promise. Three concrete steps. One question at the end.",
      hook_variants: [
        `The fastest way to ${topic.toLowerCase()} without the usual setup`,
        `I wish someone showed me this ${topic.toLowerCase()} workflow earlier`,
        `Stop doing ${topic.toLowerCase()} this way`,
      ],
    },
    ideas: Array.from({ length: 6 }).map((_, index) => ({
      title: `${topic} idea ${index + 1}`,
      hook: `Here is the ${topic.toLowerCase()} mistake I kept making`,
      angle: `Adapt the ${dna?.format || "structure"} to a problem your audience already has.`,
      format,
      why_it_fits: "Uses the same mechanic without copying the source topic.",
      difficulty: index % 3 === 0 ? "low" : index % 3 === 1 ? "medium" : "high",
    })),
    do_next: [
      "Film the strongest hook variant first, before polishing the rest.",
      "Post one adaptation this week and compare the 3-second hold.",
      "Send the next outlier you find back into the archive.",
    ],
    discovery_queries: [topic, `${topic} tutorial`, `${topic} mistakes`],
    generated_at: new Date().toISOString(),
  };
}

export async function reverseEngineer(
  reelId: string,
  refresh = false,
): Promise<{ result: ResearchResult; similar: YouTubeHit[]; cached: boolean; warning?: string }> {
  const reel = await getReel(reelId);
  if (!reel) throw new Error("Reel not found");
  if (!reel.transcript && !reel.caption) {
    throw new Error("This reel has no transcript yet. Add one before researching it.");
  }

  let similar: YouTubeHit[] = [];
  let similarWarning = "";
  try {
    similar = await discoverSimilar(reel, 12);
  } catch (error) {
    similarWarning = (error as Error).message;
  }

  if (!refresh) {
    const cached = await getResearch(reelId);
    if (cached) return { result: cached, similar, cached: true, warning: similarWarning || undefined };
  }

  const profile = await getProfile();
  try {
    const parsed = await chatJSON(researchPrompt(reel, profile, similar), researchSchema);
    const result = normaliseResearch(parsed);
    await saveResearch(reelId, result);
    return { result, similar, cached: false };
  } catch (error) {
    const result = fallbackResearch(reel);
    await saveResearch(reelId, result);
    return {
      result,
      similar,
      cached: false,
      warning: `Model output unavailable, used the structural fallback: ${(error as Error).message}`,
    };
  }
}

export async function getCachedResearch(reelId: string) {
  return await getResearch(reelId);
}
