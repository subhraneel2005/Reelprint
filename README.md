<div align="center">

# Reelprint

**A content research desk for short-form video.**

Send a Reel, Short, or transcript. Reelprint extracts the content DNA, indexes it locally, and turns the mechanics into scripts you can film.

[![Next.js](https://img.shields.io/badge/Next.js-16.4-000000?logo=nextdotjs&logoColor=white&style=for-the-badge)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.3-61DAFB?logo=react&logoColor=black&style=for-the-badge)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white&style=for-the-badge)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white&style=for-the-badge)](https://tailwindcss.com)

[![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-7-000000?logo=vercel&logoColor=white&style=for-the-badge)](https://ai-sdk.dev)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-ready-6467F2?style=for-the-badge)](https://openrouter.ai)
[![Node.js](https://img.shields.io/badge/Node.js-22.5%2B-5FA04E?logo=nodedotjs&logoColor=white&style=for-the-badge)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white&style=for-the-badge)](Dockerfile)
[![SQLite](https://img.shields.io/badge/SQLite-FTS5-003B57?logo=sqlite&logoColor=white&style=for-the-badge)](https://sqlite.org)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

[![GitHub stars](https://img.shields.io/github/stars/subhraneel2005/Reelprint?style=flat-square)](https://github.com/subhraneel2005/Reelprint/stargazers)
[![Last commit](https://img.shields.io/github/last-commit/subhraneel2005/Reelprint?style=flat-square)](https://github.com/subhraneel2005/Reelprint/commits/main)
[![Repo size](https://img.shields.io/github/repo-size/subhraneel2005/Reelprint?style=flat-square)](https://github.com/subhraneel2005/Reelprint)

</div>

---

## Quick start

### Option A — Docker (recommended)

Docker is the fastest path because the image already includes Node.js, FFmpeg, FFprobe, and yt-dlp.

```bash
git clone https://github.com/subhraneel2005/Reelprint.git
cd Reelprint
cp .env.example .env.local        # add OPENROUTER_API_KEY
docker compose --env-file .env.local up --build
```

Open [http://localhost:3000](http://localhost:3000). The archive persists in the `reelprint-data` Docker volume.

### Option B — Node.js

Requires Node.js 22.5+ and `ffmpeg` / `yt-dlp` on your `PATH`.

```bash
git clone https://github.com/subhraneel2005/Reelprint.git
cd Reelprint
npm install
cp .env.example .env.local        # add OPENROUTER_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The archive persists in `.data/`.

> The UI boots without any keys. Add `OPENROUTER_API_KEY` to enable ingest, DNA extraction, research briefs, and semantic search. `YOUTUBE_API_KEY` enables live discovery; `SUPADATA_API_KEY` improves Instagram transcript fallback.

## Overview

Reelprint is a local-first research workspace for people who publish short-form video. Instead of saving reels into a black hole, you send one to the desk and get back a structured breakdown of why it works, what to borrow, and what to film next.

It is built around one constraint: **no feed scraping**. Every video in the archive is there because a person chose to send it.

### What you get

- **Content DNA** for any Reel, Short, or pasted transcript: topic, hook, hook type, format, pacing, structure, CTA, audience, emotion, visual style, keywords, and reusability.
- **A research brief** that reverse-engineers the source and turns it into a shooting blueprint, caption formula, hook variants, and six filmable ideas.
- **A searchable archive** that combines SQLite FTS5 keyword search with vector retrieval and an optional LLM rerank.
- **Live outlier discovery** for YouTube Shorts, ranked by views per hour, like rate, and recency rather than raw vanity counts.
- **A creator profile** that grounds every idea in your niche, audience, pillars, voice, and current goal.

## Preview

<p align="center">
  <img src="docs/home.png" alt="Reelprint desk with ingest form and recent archive" width="720" />
</p>

<p align="center">
  <img src="docs/reel-brief.png" alt="Reelprint research brief with DNA, structure, and six ideas" width="720" />
</p>

## Features

| Area | What it does |
| --- | --- |
| Ingest | Accepts Instagram Reels, YouTube Shorts, or a pasted transcript. Handles blocked links without failing silently. |
| Media | Downloads with `yt-dlp`, extracts audio with `ffmpeg`, captures posters, and samples frames for vision. |
| Transcription | Uses Whisper through OpenAI or OpenRouter, Gemini audio, Supadata, or a pasted transcript. |
| Vision | Reads sampled frames with a multimodal model when a vision provider is configured. |
| DNA extraction | Produces typed, validated output with Zod instead of free-form text. |
| Search | Fuses keyword and vector ranks with reciprocal rank fusion, then optionally reranks with an LLM. |
| Discovery | Finds live YouTube Shorts for a topic and scores them by velocity, engagement, and recency. |
| Research | Generates a structured brief, six ideas, next actions, and follow-up search queries. |
| Resilience | Falls back to heuristic DNA, local hash embeddings, captions, and manual transcript entry. |

## Architecture

```mermaid
flowchart LR
  A[Reel / Short / Transcript] --> B[Ingest job]
  B --> C[Metadata + media]
  C --> D[Transcribe]
  C --> E[Sample frames]
  E --> F[Vision pass]
  D --> G[Content DNA]
  F --> G
  G --> H[(SQLite + FTS5 + vectors)]
  G --> I[Research brief]
  L[Creator profile] --> I
  M[YouTube Data API] --> I
  H --> J[Hybrid search]
  H --> I
  I --> K[Six filmable ideas]
```

The pipeline is a persisted job with per-step status. If a stage fails, the UI shows which stage failed and what to do next; a pasted transcript can resume analysis without re-downloading anything.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 App Router, React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| AI | Vercel AI SDK v7 with OpenRouter, OpenAI, and Google Gemini providers |
| Storage | `node:sqlite` with FTS5, local vector embeddings |
| Media | `yt-dlp`, `ffmpeg` |
| Validation | Zod |
| UI | Custom design system, Lucide icons |
| Packaging | Multi-stage Docker image, Next.js standalone output |

## Running locally

### Prerequisites

| Requirement | Why |
| --- | --- |
| Node.js **22.5+** | The app uses the built-in `node:sqlite` driver. Node 24 is recommended; `.nvmrc` pins it. |
| `npm` 10+ | Installs dependencies and runs scripts. |
| `ffmpeg` + `ffprobe` | Extracts audio, posters, and vision frames. Only needed for link ingestion. |
| `yt-dlp` | Fetches public Reels/Shorts and metadata. Only needed for link ingestion. |
| Docker 24+ + Compose v2 | Optional, but the easiest way to get every runtime dependency at once. |

Pasted transcripts work without FFmpeg or yt-dlp. The Docker image includes both.

```bash
# macOS
brew install ffmpeg yt-dlp

# Ubuntu / Debian
sudo apt-get update && sudo apt-get install -y ffmpeg yt-dlp
```

### Local install

```bash
git clone https://github.com/subhraneel2005/Reelprint.git
cd Reelprint
npm install
cp .env.example .env.local
```

Set at least one AI key in `.env.local`:

```bash
OPENROUTER_API_KEY=sk-or-...
```

OpenRouter alone covers chat, structured output, vision, embeddings, and Whisper transcription. `OPENAI_API_KEY` and `GEMINI_API_KEY` are optional fallbacks. Add `YOUTUBE_API_KEY` to enable live discovery and `SUPADATA_API_KEY` for Instagram transcript and metadata fallback.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The archive, media, and jobs are stored under `.data/`, which is gitignored.

### Production build

```bash
npm run check          # lint + typecheck + production build
npm run start          # serves the build on port 3000
```

For a different port: `npm run start -- -p 8080`.

### Docker

The image is a multi-stage build:

- Node 24, production-only Next.js standalone output.
- FFmpeg, FFprobe, and yt-dlp installed in the runtime image.
- Runs as the non-root `nextjs` user.
- `/app/.data` is a volume so the archive survives container rebuilds.
- Health check at `GET /api/health`.

**Compose (recommended):**

```bash
cp .env.example .env.local
# add OPENROUTER_API_KEY
docker compose --env-file .env.local up --build
```

Open [http://localhost:3000](http://localhost:3000). Use a different host port with:

```bash
REELPRINT_PORT=8080 APP_URL=http://localhost:8080 \
  docker compose --env-file .env.local up --build
```

**Plain Docker:**

```bash
docker build -t reelprint:local .
docker run --rm -p 3000:3000 \
  --env-file .env.local \
  -v reelprint-data:/app/.data \
  reelprint:local
```

**Useful container commands:**

```bash
docker compose logs -f          # follow logs
docker compose down             # stop, keep the archive volume
docker compose down -v          # stop and permanently delete the archive
docker compose build --no-cache # rebuild from scratch
```

To back up the archive volume:

```bash
docker run --rm -v reelprint-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/reelprint-data.tgz -C /data .
```

### Data and backups

Everything local lives in `.data/`:

```text
.data/
├── reelprint.db   SQLite database, FTS5 index, vectors, jobs, profile
├── reelprint.db-wal
├── reelprint.db-shm
├── media/         posters and captured frames
└── tmp/           per-job working files
```

- Back up the whole directory (or the Docker named volume).
- Delete `.data/` to start from a clean archive.
- Run **one app instance per data directory**. SQLite and the job runner are designed for a single writer.
- Do not commit `.data/`; it is gitignored.

### Deploying

Reelprint is a long-running Node.js app with a local filesystem and in-process jobs. Deploy it to a container host or VPS with a persistent disk:

1. Build the image from this repository.
2. Mount a persistent volume at `/app/.data`.
3. Pass the environment variables from `.env.example`.
4. Set `APP_URL` to the public URL.
5. Expose port `3000` and run **one replica**.

Good targets: Fly.io, Railway, Render, a Docker host, or a small VPS. **Vercel/serverless is not a fit** for the default setup because the SQLite archive, media files, and ingest jobs need a persistent filesystem and a long-running process.

> **Security:** the app has no accounts or built-in authentication. Anyone who can reach the URL can spend your AI credits and modify the archive. Put the deployment behind Cloudflare Access, a VPN, basic auth, or another auth proxy until multi-user auth is added. Never expose `.env.local` or commit API keys.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm run check` | Run lint, typecheck, and a production build |

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | **Yes, for AI** | Chat, vision, embeddings, and Whisper audio |
| `OPENAI_API_KEY` | No | Optional fallback for chat, vision, embeddings, and Whisper |
| `GEMINI_API_KEY` | No | Optional fallback for chat, audio, and vision |
| `AI_PROVIDER` | No | Preferred chat/vision provider: `openrouter`, `openai`, or `gemini` |
| `OPENROUTER_MODEL` | No | Defaults to `openai/gpt-4o-mini` |
| `OPENROUTER_EMBED_MODEL` | No | Defaults to `openai/text-embedding-3-small` |
| `OPENROUTER_TRANSCRIBE_MODEL` | No | Defaults to `openai/whisper-1` |
| `OPENAI_MODEL` | No | Defaults to `gpt-4o-mini` |
| `OPENAI_EMBED_MODEL` | No | Defaults to `text-embedding-3-small` |
| `OPENAI_TRANSCRIBE_MODEL` | No | Defaults to `whisper-1` |
| `OPENAI_BASE_URL` | No | OpenAI-compatible gateway URL |
| `GEMINI_MODEL` | No | Defaults to `gemini-flash-latest` |
| `YOUTUBE_API_KEY` | No | Live YouTube Shorts discovery |
| `SUPADATA_API_KEY` | No | Instagram transcript and metadata |
| `IG_COOKIES_FROM_BROWSER` | No | Browser profile for Instagram cookies |
| `IG_COOKIES_FILE` | No | Netscape cookie file for Instagram |
| `YTDLP_COOKIES_FROM_BROWSER` | No | Browser profile for YouTube cookies |
| `YTDLP_COOKIES_FILE` | No | Netscape cookie file for YouTube |
| `APP_URL` | No | Public base URL used for OpenRouter attribution and absolute links |

> OpenRouter requires at least **$0.50** of account balance for audio transcription. Without it, Reelprint falls back to captions or a pasted transcript. All other AI features need only the key.

## API

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/api/ingest` | Start an ingest job from a link or transcript |
| `GET` | `/api/jobs/[id]` | Read job status and per-step progress |
| `GET` | `/api/reels` | List the archive |
| `GET` | `/api/reels/[id]` | Read one reel with DNA and research |
| `DELETE` | `/api/reels/[id]` | Remove a reel from the archive |
| `POST` | `/api/reels/[id]/transcript` | Resume a blocked reel with a transcript |
| `POST` | `/api/reels/[id]/retry` | Re-run DNA extraction and indexing |
| `GET` | `/api/search` | Hybrid search with optional reranking |
| `GET` | `/api/research` | Read a cached research brief |
| `POST` | `/api/research` | Generate or refresh a research brief |
| `GET` | `/api/profile` | Read the creator profile and provider status |
| `POST` | `/api/profile` | Save the creator profile |
| `GET` | `/api/youtube` | Discover live YouTube Shorts for a query |
| `GET` | `/api/thumb/[id]` | Serve a poster or generated placeholder |
| `GET` | `/api/health` | Liveness probe for Docker/container hosts |

## Project structure

```text
.
├── docs/                     README screenshots
├── scripts/                  Build helpers (standalone cleanup)
├── public/                   App icon, manifest, service worker, static assets
├── src/
│   ├── app/                  App Router pages, API routes, manifest, share target
│   │   └── api/health/       Container liveness endpoint
│   ├── components/           Ingest, archive, research, discovery, profile UI
│   └── lib/
│       ├── ai.ts             AI SDK providers, structured output, vision, embeddings
│       ├── db.ts             SQLite schema, FTS5, CRUD, profile, research cache
│       ├── ingest.ts         Job pipeline, transcription, scoring, indexing
│       ├── media.ts          yt-dlp, ffmpeg, posters, frame sampling
│       ├── prompts.ts        DNA and research prompts, Zod schemas, heuristics
│       ├── research.ts       Reverse-engineering brief and idea generation
│       ├── search.ts         Hybrid retrieval and reranking
│       └── youtube.ts        Live Shorts discovery and outlier scoring
├── .dockerignore
├── .env.example
├── .nvmrc
├── Dockerfile
├── docker-compose.yml
├── next.config.ts
└── package.json
```

## Design decisions

- **Local-first by default.** Transcripts, embeddings, jobs, and the creator profile live in `.data/`. There is no account and no hosted database.
- **Provider-agnostic AI.** The Vercel AI SDK lets the same pipeline run on OpenRouter, OpenAI, or Gemini without rewriting prompts or parsing.
- **Structured output over string parsing.** DNA and research briefs are validated with Zod, with a heuristic fallback when a model is unavailable.
- **Honest failure states.** A blocked Instagram fetch, missing transcript, or unavailable vision model is surfaced in the job timeline instead of producing a fake result.
- **No seeded archive.** Every entry came from an explicit user action.

## Limitations

- Instagram is login-walled for logged-out fetches. Use Supadata, a local cookie session, or paste the transcript.
- Instagram has no public discovery API. Discover is YouTube-only and labelled as such in the UI.
- YouTube may occasionally require cookies or reject automated downloads; the job reports the exact error.
- The archive is single-user and local. Running multiple instances against the same `.data/` directory is not supported.
- Search quality depends on the embedding provider. Without one, Reelprint uses a local hash embedding as a graceful fallback.

## Roadmap

- [x] Link and transcript ingest with resumable jobs
- [x] Content DNA, hybrid search, and research briefs
- [x] OpenRouter, OpenAI, and Gemini through the Vercel AI SDK
- [x] YouTube Shorts outlier discovery
- [ ] Meta-approved Instagram connector
- [ ] Scheduled discovery and alerts
- [ ] Profile-vs-outlier comparison scoring
- [ ] Export scripts to Notion, Google Docs, or Markdown
- [ ] Optional multi-user workspace

## Contributing

Issues and pull requests are welcome. Please keep changes scoped, run `npm run check` before opening a PR, and never commit `.env.local` or anything under `.data/`.

## Acknowledgements

Built on [Next.js](https://nextjs.org), [Vercel AI SDK](https://ai-sdk.dev), [OpenRouter](https://openrouter.ai), [OpenAI](https://openai.com), [Google Gemini](https://ai.google.dev), [yt-dlp](https://github.com/yt-dlp/yt-dlp), and [FFmpeg](https://ffmpeg.org).

## License

Released under the [MIT License](LICENSE).
