/* Copies the site into dist/, the folder the Worker serves.
   Only what visitors should reach goes in: the pages and their assets.
   The Worker's code, the database migrations, the notes and the tooling
   stay out by not being on this list. */
import { cp, rm, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

const SITE = [
  "index.html",
  "assets",
  "mira",
  "autorizacion",
  "testimonio",
  "v1",
  "v2"
];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for(const entry of SITE){
  await cp(join(root, entry), join(dist, entry), { recursive: true });
}
console.log("dist/ listo: " + SITE.join(", "));
