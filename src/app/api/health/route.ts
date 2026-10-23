export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    ok: true,
    service: "reelprint",
    time: new Date().toISOString(),
  });
}
