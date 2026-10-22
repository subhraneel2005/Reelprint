import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getReel } from "@/lib/db";
import { MEDIA_DIR } from "@/lib/media";
import { platformLabel } from "@/lib/util";

export const runtime = "nodejs";

const ID_PATTERN = /^[a-zA-Z0-9-]{8,64}$/;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function placeholder(platform: string, topic: string) {
  const label = escapeXml(`${platformLabel(platform)} / no still captured`);
  const subject = escapeXml(topic.slice(0, 32));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="900" viewBox="0 0 720 900">
  <rect width="720" height="900" fill="#e3e6e9"/>
  <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
    <circle cx="2" cy="2" r="1" fill="#98a3ad" opacity="0.55"/>
  </pattern>
  <rect width="720" height="900" fill="url(#dots)"/>
  <g transform="translate(64 360)">
    <rect x="0" y="0" width="34" height="150" fill="#d43a1e"/>
    <rect x="48" y="52" width="34" height="98" fill="#11161b"/>
    <rect x="96" y="24" width="34" height="126" fill="#11161b"/>
  </g>
  <text x="64" y="560" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="17" letter-spacing="3" fill="#11161b">${label.toUpperCase()}</text>
  <text x="64" y="604" font-family="Georgia, serif" font-size="30" fill="#29323b">${subject}</text>
  <rect x="64" y="650" width="120" height="4" fill="#d43a1e"/>
</svg>`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ID_PATTERN.test(id)) return new Response("Not found", { status: 404 });
  try {
    const buffer = await readFile(join(MEDIA_DIR, `${id}.jpg`));
    return new Response(new Uint8Array(buffer), {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    const reel = getReel(id);
    if (!reel) return new Response("Not found", { status: 404 });
    return new Response(placeholder(reel.platform, reel.dna?.topic || reel.title || reel.caption || "untitled reel"), {
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" },
    });
  }
}
