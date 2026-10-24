import { z } from "zod";
import { startIngest } from "@/lib/ingest";

export const runtime = "nodejs";
export const maxDuration = 300;

const bodySchema = z.object({
  url: z.string().trim().optional(),
  transcript: z.string().trim().max(50_000).optional(),
  caption: z.string().trim().max(10_000).optional(),
  author: z.string().trim().max(200).optional(),
  title: z.string().trim().max(300).optional(),
  visual: z.boolean().optional(),
  metrics: z
    .object({
      views: z.number().int().nonnegative().nullable().optional(),
      likes: z.number().int().nonnegative().nullable().optional(),
      comments: z.number().int().nonnegative().nullable().optional(),
      shares: z.number().int().nonnegative().nullable().optional(),
      followers: z.number().int().nonnegative().nullable().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Send JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  if (!parsed.data.url && !parsed.data.transcript) {
    return Response.json({ error: "Add a link or paste a transcript" }, { status: 400 });
  }
  try {
    const result = await startIngest(parsed.data);
    return Response.json(result, { status: result.existing ? 200 : 202 });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
