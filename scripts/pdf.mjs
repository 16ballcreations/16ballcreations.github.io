/* Turns a 16 Ball Creations document (HTML) into an A4 PDF, and checks that
   every sheet fits its page.

   node scripts/pdf.mjs <entrada.html> <salida.pdf>

   It uses the Microsoft Edge already installed on this computer through
   playwright-core, waits for the brand fonts, prints backgrounds, and warns
   if any <article class="sheet"> runs past 297 mm. Exits with 1 if it does. */
import { chromium } from "playwright-core";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";

const [input, output] = process.argv.slice(2);
if(!input || !output){
  console.error("Uso: node scripts/pdf.mjs <entrada.html> <salida.pdf>");
  process.exit(2);
}
const src = resolve(input), out = resolve(output);
if(!existsSync(src)){ console.error("No existe: " + src); process.exit(2); }

const browser = await chromium.launch({ channel:"msedge" });
const page = await browser.newPage({ viewport:{ width:1000, height:1400 } });
await page.goto(pathToFileURL(src).href, { waitUntil:"networkidle" });
await page.evaluate(() => document.fonts.ready);

/* each sheet must fit its A4 page: content height against 297 mm */
const report = await page.evaluate(() => {
  const mm = 96 / 25.4;
  return [...document.querySelectorAll(".sheet")].map((s, i) => {
    const prev = s.style.height; s.style.height = "auto";
    const h = s.scrollHeight / mm;
    s.style.height = prev;
    return { hoja: i + 1, altoMm: Math.round(h), cabe: h <= 297.5 };
  });
});
const fonts = await page.evaluate(() => ["Instrument Serif", "Inter", "JetBrains Mono"].map(f => [f, document.fonts.check("12px \"" + f + "\"")]));

await page.pdf({ path:out, format:"A4", printBackground:true, preferCSSPageSize:true });
await browser.close();

console.log("PDF: " + out);
for(const r of report){ console.log(`  hoja ${r.hoja}: ${r.altoMm} mm ${r.cabe ? "✓" : "✗ SE SALE DE LA HOJA"}`); }
for(const [f, ok] of fonts){ if(!ok){ console.log("  ⚠ fuente no cargada: " + f + " (¿sin internet?)"); } }
if(!report.length){ console.log("  ⚠ no hay ninguna <article class=\"sheet\">"); }
if(report.some(r => !r.cabe)){ process.exit(1); }
