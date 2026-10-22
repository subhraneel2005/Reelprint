# Reelprint

A content research desk for short-form video. Send a Reel, Short, or transcript; Reelprint extracts its content DNA, indexes it locally, and turns the mechanics into scripts you can film.

## What it does

- Ingests Instagram Reels, YouTube Shorts, or a pasted transcript.
- Transcribes audio, samples frames, and optionally reads the visuals with a vision model.
- Extracts hook, pacing, structure, format, CTA, audience, and keywords into a structured DNA record.
- Stores everything in local SQLite with FTS5 keyword search plus vector search.
- Discovers live YouTube Shorts outliers for a topic (requires a YouTube Data API key).
- Generates a reverse-engineering brief and six original ideas grounded in the creator's niche.
- Audits the creator profile against the source reel and the archive.

## How it works

1. Resolve the link, read public metadata, and pull the media when possible.
2. Transcribe the audio and sample frames for a vision pass.
3. Extract a structured content DNA record: topic, hook, pacing, structure, format, CTA, audience, and keywords.
4. Index the transcript + DNA with FTS5 and vector embeddings.
5. Generate a reverse-engineering brief, six original ideas, and an action list.
6. Compare the source against the creator profile and the rest of the archive.

Every reel enters the archive because the user sent it. There is no feed crawler.

## Project structure

```
src/app/            App Router pages, API routes, manifest, share target
src/components/     Ingest, archive search, research brief, reel cards
src/lib/ai.ts       Vercel AI SDK providers, structured output, vision, embeddings
src/lib/ingest.ts   Job pipeline, transcription, scoring, indexing
src/lib/db.ts       SQLite schema, FTS5, CRUD, profile and research cache
src/lib/media.ts    yt-dlp, ffmpeg, posters, frame sampling
src/lib/search.ts   Hybrid keyword + vector retrieval with LLM rerank
```

## Stack

- Next.js 16 (App Router), React 19, Tailwind CSS v4
- Node 26 + `node:sqlite` (FTS5)
- Vercel AI SDK (`ai`) with provider adapters for OpenRouter, OpenAI, and Google Gemini
- `yt-dlp` + `ffmpeg` for media download, audio extraction, posters, and frame sampling

## AI providers

The app uses the Vercel AI SDK for chat, structured output, vision, embeddings, and transcription. OpenRouter is a first-class provider and can cover chat, vision, embeddings, and Whisper audio with a single key.

```bash
cp .env.example .env.local
```

At minimum, set one of:

```bash
OPENROUTER_API_KEY=
OPENAI_API_KEY=
GEMINI_API_KEY=
```

Add `YOUTUBE_API_KEY` for live Shorts discovery and `SUPADATA_API_KEY` for Instagram transcript/metadata fallback. `AI_PROVIDER=openrouter|openai|gemini` can force a preferred chat/vision provider; otherwise the app tries configured providers in order.

## Run

```bash
npm install
npm run dev
```

The app runs on `http://localhost:3000` by default. Local data lives in `.data/` (SQLite database, media, and temporary files) and is gitignored.

## Notes

- Instagram links are often login-walled. The ingest pipeline degrades to pasted transcripts and reports exactly which stage failed.
- Without a transcription or vision key, Reelprint still works from captions and transcripts and falls back to local hash embeddings.
- No feeds are scraped. Every reel in the archive was explicitly sent by the user.
