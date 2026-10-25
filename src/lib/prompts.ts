import { z } from "zod";
import type { Profile, Reel, ReelDna, ResearchIdea, ResearchResult, YouTubeHit } from "./types";
import { truncate } from "./util";

export const dnaSchema = z.object({
  topic: z.string().default(""),
  subtopic: z.string().default(""),
  hook: z.string().default(""),
  hook_type: z.string().default(""),
  format: z.string().default(""),
  format_detail: z.string().default(""),
  structure: z
    .array(z.object({ beat: z.string().default(""), purpose: z.string().default("") }))
    .default([]),
  tools: z.array(z.string()).default([]),
  visual_style: z.string().default(""),
  audio_style: z.string().default(""),
  cta: z.string().default(""),
  target_audience: z.string().default(""),
  emotion: z.string().default(""),
  why_it_works: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  pillars: z.array(z.string()).default([]),
  pace: z.string().default(""),
  reusability: z.number().min(1).max(10).default(5),
});

const ideaSchema = z.object({
  title: z.string().default(""),
  hook: z.string().default(""),
  angle: z.string().default(""),
  format: z.string().default(""),
  why_it_fits: z.string().default(""),
  difficulty: z.enum(["low", "medium", "high"]).default("medium"),
});

export const researchSchema = z.object({
  why_it_works: z.object({
    hook: z.string().default(""),
    retention: z.string().default(""),
    emotion: z.string().default(""),
    format: z.string().default(""),
    cta: z.string().default(""),
    evidence: z.array(z.string()).default([]),
  }),
  blueprint: z.object({
    beats: z.array(z.object({ time: z.string().default(""), beat: z.string().default(""), why: z.string().default("") })).default([]),
    visual_notes: z.string().default(""),
    audio_notes: z.string().default(""),
    caption_formula: z.string().default(""),
    hook_variants: z.array(z.string()).default([]),
  }),
  ideas: z.array(ideaSchema).default([]),
  do_next: z.array(z.string()).default([]),
  discovery_queries: z.array(z.string()).default([]),
});

export const scriptSchema = z.object({
  title: z.string().default(""),
  hook: z.string().default(""),
  script: z.string().default(""),
  shot_list: z
    .array(
      z.object({
        time: z.string().default(""),
        shot: z.string().default(""),
        on_screen: z.string().default(""),
      }),
    )
    .default([]),
  caption: z.string().default(""),
  hashtags: z.array(z.string()).default([]),
  cta: z.string().default(""),
  estimated_duration: z.string().default(""),
});

export function dnaPrompt(reel: Reel): { system: string; user: string } {
  return {
    system: `You are a short-form content analyst. You reverse engineer Instagram Reels and YouTube Shorts into a reusable content DNA.

Return one JSON object with exactly these keys:
topic, subtopic, hook, hook_type, format, format_detail, structure (array of {beat, purpose}), tools (array of strings), visual_style, audio_style, cta, target_audience, emotion, why_it_works (array of 3-5 specific observations), keywords (array of 5-10 search terms someone would use to find similar videos), pillars (array of 2-4 broader content pillars), pace, reusability (1-10).

Rules:
- Base claims on the transcript and visual description. If something is unknown, use "" or [] rather than inventing it.
- "hook" must be the exact opening line or, if there is no speech, a description of the visual hook.
- "structure" is the actual beat sequence of this video, with rough timestamps or fractions in the beat text when possible.
- "format" should be a short reusable label such as "screen-record tutorial", "talking head + b-roll", "list on screen", "reaction", "before/after", "storytime".
- "keywords" must be terms useful for finding similar videos, not generic hashtags.
- Be concrete and specific. No praise, no filler.`,
    user: JSON.stringify(
      {
        platform: reel.platform,
        author: reel.author,
        title: reel.title,
        caption: reel.caption,
        duration_seconds: reel.duration,
        transcript: reel.transcript,
        transcript_source: reel.transcript_source,
        visual_description: reel.visual_summary,
        metrics: {
          views: reel.views,
          likes: reel.likes,
          comments: reel.comments,
          followers: reel.followers,
        },
      },
      null,
      2,
    ),
  };
}

export function heuristicDna(reel: Reel): ReelDna {
  const text = `${reel.title ?? ""}\n${reel.caption ?? ""}\n${reel.transcript ?? ""}`.trim();
  const keywords =
    text
      .toLowerCase()
      .match(/[a-z0-9][a-z0-9+#.-]{2,}/g)
      ?.filter((word) => !["this", "that", "with", "your", "from", "have", "want", "they", "here"].includes(word))
      .slice(0, 8) ?? [];
  const firstLine = text.split(/\n|(?<=[.!?])\s/).find((line) => line.trim().length > 10)?.trim() ?? "";
  return {
    topic: keywords.slice(0, 2).join(" "),
    subtopic: keywords.slice(2, 4).join(" "),
    hook: firstLine.slice(0, 200),
    hook_type: "",
    format: "unknown",
    format_detail: "",
    structure: [],
    tools: [],
    visual_style: reel.visual_summary ? truncate(reel.visual_summary, 160) : "",
    audio_style: "",
    cta: "",
    target_audience: "",
    emotion: "",
    why_it_works: [],
    keywords,
    pillars: [],
    pace: "",
    reusability: 5,
  };
}

export function researchPrompt(
  reel: Reel,
  profile: Profile,
  similar: YouTubeHit[],
): { system: string; user: string } {
  const inferred = {
    niche: reel.dna?.topic || "",
    subtopic: reel.dna?.subtopic || "",
    audience: reel.dna?.target_audience || "",
    pillars: reel.dna?.pillars ?? [],
    keywords: reel.dna?.keywords ?? [],
  };
  const nicheContext = profile.niche
    ? `Creator profile: ${JSON.stringify(profile)}`
    : `The creator has not filled in their profile yet. Treat this inferred context as their niche and stay inside it: ${JSON.stringify(inferred)}. Do not jump to unrelated industries.`;
  return {
    system: `You are a content strategist for a short-form creator. You receive one source video that the creator saved, its content DNA, and live high-performing YouTube Shorts found for the same topic. Your job is to reverse engineer why the source works and turn it into concrete scripts the creator can film.

Return one JSON object with exactly these keys:
{
 "why_it_works": {"hook": string, "retention": string, "emotion": string, "format": string, "cta": string, "evidence": string[]},
 "blueprint": {"beats": [{"time": string, "beat": string, "why": string}], "visual_notes": string, "audio_notes": string, "caption_formula": string, "hook_variants": string[]},
 "ideas": [{"title": string, "hook": string, "angle": string, "format": string, "why_it_fits": string, "difficulty": "low"|"medium"|"high"}],
 "do_next": string[],
 "discovery_queries": string[]
}

Rules:
- Produce 6 ideas. Each must be original, filmable by this creator, and structurally inspired by the source. Do not copy the source's topic verbatim; adapt the mechanic to the creator's niche and pillars.
- Each idea's "hook" is the first spoken line, under 20 words. Make it specific and curiosity-driving.
- "beats" is a timestamped shooting blueprint for the source's structure, not generic advice.
- Use the YouTube Shorts as evidence of what is currently working. Cite view counts or patterns in "evidence" when relevant. Never invent numbers.
- "do_next" contains 3-5 concrete actions for this week.
- "discovery_queries" contains 3 short search queries the creator can run to find more outliers.
- If the creator's profile is empty, every idea must still belong to the source reel's topic, subtopic and pillars. Do not propose ideas from unrelated industries.
- Ideas must be specific enough to film tomorrow, and must not repeat the source's exact topic.
- Be direct. No hype language, no emojis, no "in today's fast-paced world".`,
    user: JSON.stringify(
      {
        niche_context: nicheContext,
        source: {
          platform: reel.platform,
          author: reel.author,
          title: reel.title,
          caption: reel.caption,
          transcript: reel.transcript,
          visual_description: reel.visual_summary,
          duration_seconds: reel.duration,
          metrics: {
            views: reel.views,
            likes: reel.likes,
            comments: reel.comments,
            followers: reel.followers,
            engagement: reel.engagement,
          },
          dna: reel.dna,
        },
        live_similar_shorts: similar.slice(0, 10).map((hit) => ({
          title: hit.title,
          channel: hit.channel,
          views: hit.views,
          likes: hit.likes,
          comments: hit.comments,
          published_at: hit.published_at,
          views_per_hour: Math.round(hit.views_per_hour),
          score: hit.score,
        })),
      },
      null,
      2,
    ),
  };
}

export function scriptPrompt(
  reel: Reel,
  profile: Profile,
  idea: ResearchIdea,
): { system: string; user: string } {
  return {
    system: `You are a short-form scriptwriter. You receive one chosen idea, the source reel that inspired its structure, and the creator's profile. Write the complete, filmable script for that idea.

Return one JSON object with exactly these keys:
{
 "title": string,
 "hook": string,
 "script": string,
 "shot_list": [{"time": string, "shot": string, "on_screen": string}],
 "caption": string,
 "hashtags": string[],
 "cta": string,
 "estimated_duration": string
}

Rules:
- "script" must be the complete word-for-word spoken narration, not an outline, not bullet points, and not stage directions.
- Open with the exact "hook" from the chosen idea. Earn attention in the first sentence.
- Aim for 30-60 seconds: roughly 90-160 spoken words. Keep sentences short and natural to say out loud.
- Write in the creator's voice when a profile is provided. Stay inside their niche and pillars.
- Borrow the source's structure, not its topic. Do not copy the source's wording or claims.
- "shot_list" has 4-6 entries that map the script to concrete shots: what is on screen, what changes, and any short on-screen text. Keep on-screen text under 8 words.
- "caption" is one or two lines. "hashtags" is 5-8 relevant tags, each beginning with #. "cta" is the single action to ask for.
- "estimated_duration" looks like "42 sec".
- No emojis, no markdown, no hype phrases, no invented numbers or results.
- If the profile is empty, use the source reel's topic and pillars so the idea still feels native to the creator.`,
    user: JSON.stringify(
      {
        creator: profile,
        source: {
          title: reel.title,
          caption: reel.caption,
          transcript: truncate(reel.transcript ?? "", 6000),
          visual_description: reel.visual_summary,
          duration_seconds: reel.duration,
          dna: reel.dna,
        },
        chosen_idea: idea,
      },
      null,
      2,
    ),
  };
}

export function normaliseResearch(result: z.infer<typeof researchSchema>): ResearchResult {
  return {
    why_it_works: result.why_it_works,
    blueprint: result.blueprint,
    ideas: result.ideas,
    do_next: result.do_next,
    discovery_queries: result.discovery_queries,
    generated_at: new Date().toISOString(),
  };
}
