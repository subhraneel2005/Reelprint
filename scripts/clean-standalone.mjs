import { rm } from "node:fs/promises";
import { join } from "node:path";

const standalone = join(process.cwd(), ".next", "standalone");

for (const entry of [
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
  ".env.test",
  ".data",
]) {
  await rm(join(standalone, entry), { recursive: true, force: true });
}
