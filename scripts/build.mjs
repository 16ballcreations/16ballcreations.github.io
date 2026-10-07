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
  /* for search engines: what to crawl, the icon, the app manifest, and the
     IndexNow key that lets us tell Bing and others when the site changes */
  "robots.txt",
  "sitemap.xml",
  "favicon.ico",
  "site.webmanifest",
  "44b6eb8c5cbb6e059ea61f162a867345.txt",
  "assets",
  "mira",
  "autorizacion",
  "testimonio"
  /* v1/ and v2/, the earlier versions of the home page, are kept in the
     repository as reference only: they are not published */
];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for(const entry of SITE){
  await cp(join(root, entry), join(dist, entry), { recursive: true });
}
console.log("dist/ listo: " + SITE.join(", "));
