import { z } from "zod";
import { getProfile, saveProfile } from "@/lib/db";
import { aiStatus } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  handle: z.string().trim().max(120).default(""),
  niche: z.string().trim().max(500).default(""),
  audience: z.string().trim().max(500).default(""),
  pillars: z.array(z.string().trim().max(80)).max(12).default([]),
  voice: z.string().trim().max(1000).default(""),
  avoid: z.string().trim().max(1000).default(""),
  goal: z.string().trim().max(500).default(""),
});

export async function GET() {
  return Response.json({ profile: getProfile(), status: aiStatus() });
}

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
  saveProfile(parsed.data);
  return Response.json({ profile: getProfile() });
}
