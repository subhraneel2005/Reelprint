import {
  cosine,
  embedText,
  localEmbedding,
  localEmbeddingModel,
  rerank,
} from "./ai";
import { ftsSearch, getReel, hydrateSearchHits, listReels, reelsWithEmbeddings } from "./db";
import type { Reel, SearchHit } from "./types";

export type SearchMode = "hybrid" | "keyword" | "vector";

type Candidate = {
  id: string;
  keywordRank: number | null;
  vectorRank: number | null;
  vectorScore: number | null;
  snippet: string | null;
};

export async function searchLibrary(options: {
  query: string;
  mode?: SearchMode;
  platform?: string;
  limit?: number;
  rerankResults?: boolean;
}): Promise<{ hits: SearchHit[]; mode: SearchMode; took: number }> {
  const started = Date.now();
  const query = options.query.trim();
  const mode = options.mode ?? "hybrid";
  const limit = Math.min(options.limit ?? 30, 60);
  const platform = options.platform || undefined;

  if (!query) {
    const hits = (await listReels(limit, "ready")).map<SearchHit>((reel) => ({
      reel,
      score: 0,
      keyword_rank: null,
      vector_score: null,
      snippet: null,
    }));
    return { hits, mode, took: Date.now() - started };
  }

  const candidates = new Map<string, Candidate>();

  if (mode === "hybrid" || mode === "keyword") {
    const keywordHits = await ftsSearch(query, 40, platform);
    keywordHits.forEach((hit, index) => {
      const existing = candidates.get(hit.id) ?? {
        id: hit.id,
        keywordRank: null,
        vectorRank: null,
        vectorScore: null,
        snippet: null,
      };
      existing.keywordRank = index + 1;
      existing.snippet = hit.snippet;
      candidates.set(hit.id, existing);
    });
  }

  if (mode === "hybrid" || mode === "vector") {
    const rows = await reelsWithEmbeddings(platform);
    if (rows.length) {
      const { embedding: queryVector, model: queryModel } = await embedText(query);
      const localQuery = localEmbedding(query);
      const scored: { id: string; score: number }[] = [];
      for (const row of rows) {
        const stored = row.embedding;
        let vector: Float32Array | null = null;
        if (row.model === queryModel) vector = queryVector;
        else if (row.model === localEmbeddingModel) vector = localQuery;
        else if (queryModel === localEmbeddingModel) vector = localQuery;
        if (!vector) continue;
        scored.push({ id: row.id, score: cosine(vector, stored) });
      }
      scored.sort((a, b) => b.score - a.score);
      await Promise.all(
        scored.slice(0, 40).map(async (row, index) => {
          const existing = candidates.get(row.id) ?? {
            id: row.id,
            keywordRank: null,
            vectorRank: null,
            vectorScore: null,
            snippet: null,
          };
          existing.vectorRank = index + 1;
          existing.vectorScore = row.score;
          if (!existing.snippet) {
            const reel = await getReel(row.id);
            const text = reel?.transcript ?? reel?.caption ?? "";
            existing.snippet = text.slice(0, 220);
          }
          candidates.set(row.id, existing);
        }),
      );
    }
  }

  const fused = [...candidates.values()]
    .map((candidate) => {
      const keywordScore = candidate.keywordRank ? 1 / (60 + candidate.keywordRank) : 0;
      const vectorScore = candidate.vectorRank ? 1 / (60 + candidate.vectorRank) : 0;
      const score =
        mode === "keyword"
          ? keywordScore
          : mode === "vector"
            ? candidate.vectorScore ?? 0
            : keywordScore + vectorScore;
      return { ...candidate, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(limit, 24));

  if (mode === "hybrid" && options.rerankResults !== false && fused.length > 1) {
    const items = await Promise.all(
      fused.slice(0, 15).map(async (candidate) => {
        const reel = await getReel(candidate.id);
        return {
          id: candidate.id,
          text: [
            reel?.title,
            reel?.caption?.slice(0, 300),
            reel?.transcript?.slice(0, 900),
            reel?.dna ? `topic: ${reel.dna.topic}; format: ${reel.dna.format}; hook: ${reel.dna.hook}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        };
      }),
    );
    const order = await rerank(query, items);
    if (order) {
      const reasons = new Map(order.map((entry) => [entry.id, entry.reason]));
      const ranked = order.map((entry) => fused.find((candidate) => candidate.id === entry.id)).filter(Boolean) as typeof fused;
      const rest = fused.filter((candidate) => !reasons.has(candidate.id));
      fused.length = 0;
      fused.push(...ranked, ...rest);
      const hits = await hydrateSearchHits(
        fused.slice(0, limit).map((candidate) => ({
          id: candidate.id,
          score: candidate.score,
          keyword_rank: candidate.keywordRank,
          vector_score: candidate.vectorScore,
          snippet: candidate.snippet,
          reason: reasons.get(candidate.id) ?? null,
        })),
      );
      return { hits, mode, took: Date.now() - started };
    }
  }

  const hits = await hydrateSearchHits(
    fused.slice(0, limit).map((candidate) => ({
      id: candidate.id,
      score: candidate.score,
      keyword_rank: candidate.keywordRank,
      vector_score: candidate.vectorScore,
      snippet: candidate.snippet,
    })),
  );
  return { hits, mode, took: Date.now() - started };
}

export async function similarTo(reel: Reel, limit = 8): Promise<SearchHit[]> {
  if (!reel.embedding_model) return [];
  const rows = await reelsWithEmbeddings(reel.platform);
  const target = rows.find((row) => row.id === reel.id);
  if (!target) return [];
  const targetVector = target.embedding;
  const scored = rows
    .filter((row) => row.id !== reel.id)
    .map((row) => ({ id: row.id, score: cosine(targetVector, row.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return await hydrateSearchHits(scored.map((row) => ({ id: row.id, score: row.score })));
}
