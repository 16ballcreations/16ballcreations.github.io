/* Escribe sitemap.xml: las páginas públicas en español y en inglés, cada una
   con su par en el otro idioma (hreflang), para que Google muestre la versión
   del idioma de quien busca. Corre después de scripts/servicios.mjs:
     node scripts/sitemap.mjs */
import { writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { SERVICES } from "./servicios-data.mjs";
import { SERVICES_EN } from "./services-en-data.mjs";

const ORIGIN = "https://16ballcreations.com";
const today = new Date().toISOString().slice(0, 10);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/* the date a page last changed: its last commit, or today if it has changes
   not yet committed (the generators run right before a deploy) */
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
function lastmod(loc){
  const file = (loc === "/" ? "" : loc.slice(1)) + "index.html";
  if(git("status", "--porcelain", "--", file)){ return today; }
  return git("log", "-1", "--format=%cs", "--", file) || today;
}

/* each entry is a pair: [Spanish path, English path, priority, changefreq] */
const PAIRS = [
  ["/", "/en/", "1.0", "weekly"],
  ["/servicios/", "/en/services/", "0.9", "monthly"],
  ...SERVICES.map(s => [`/servicios/${s.slug}/`, `/en/services/${SERVICES_EN.find(e => e.key === s.key).slug}/`, "0.8", "monthly"]),
  ["/mira/", "/en/mira/", "0.8", "monthly"]
];

const links = (es, en) => [
  `    <xhtml:link rel="alternate" hreflang="es" href="${ORIGIN}${es}"/>`,
  `    <xhtml:link rel="alternate" hreflang="en" href="${ORIGIN}${en}"/>`,
  `    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}${es}"/>`
].join("\n");
const url = (loc, es, en, pr, cf) => `  <url>
    <loc>${ORIGIN}${loc}</loc>
    <lastmod>${lastmod(loc)}</lastmod>
    <changefreq>${cf}</changefreq>
    <priority>${pr}</priority>
${links(es, en)}${loc === "/" || loc === "/en/" ? `\n    <image:image><image:loc>${ORIGIN}/assets/img/og-16ballcreations.jpg</image:loc></image:image>` : ""}
  </url>`;

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${PAIRS.flatMap(([es, en, pr, cf]) => [url(es, es, en, pr, cf), url(en, es, en, pr, cf)]).join("\n")}
</urlset>
`;
await writeFile(join(root, "sitemap.xml"), xml);
console.log(`sitemap.xml: ${PAIRS.length * 2} páginas`);
