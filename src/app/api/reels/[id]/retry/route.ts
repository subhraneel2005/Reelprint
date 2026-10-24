import { retryAnalysis } from "@/lib/ingest";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    return Response.json(await retryAnalysis(id));
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
