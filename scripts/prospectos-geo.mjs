/* Puts each prospect of a campaign on the map, from its address.

   Medellín addresses follow the street grid: "Calle 27A #80-139" is on Calle
   27A, at the corner with Carrera 80. So the point is the crossing of those two
   streets, taken from OpenStreetMap's street lines (free, no key). That reads
   these addresses better than a text search would. Addresses with no number
   (only a neighbourhood) are searched by name in OpenStreetMap's Nominatim, and
   marked as approximate. Anything that lands far from the campaign's starting
   point is dropped rather than shown in the wrong place.

   It writes tmp/prospectos-geo-<campaign>.sql (ignored by git), with one
   UPDATE per prospect. Loading it never touches the follow-up in the panel:

     npx wrangler d1 execute 16bc --remote --file tmp/prospectos-geo-<campaign>.sql

   The streets are downloaded once to tmp/calles-<campaign>.json (from the
   Overpass API); delete that file to fetch them again.

   Usage: node scripts/prospectos-geo.mjs prospectos/belen-2026-10 */
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const folder = process.argv[2] && resolve(process.argv[2]);
if(!folder){ console.error("Falta la carpeta de la campaña. Ej.: node scripts/prospectos-geo.mjs prospectos/belen-2026-10"); process.exit(1); }

const base = JSON.parse(await readFile(join(folder, "base-panel.json"), "utf8"));
const campaign = base.campaign;
let origin = null;
try{
  const h = JSON.parse(await readFile(join(folder, "prospectos_16bc_handoff.json"), "utf8"));
  if(h.punto_de_partida && h.punto_de_partida.lat){ origin = { lat:h.punto_de_partida.lat, lon:h.punto_de_partida.lon, lugar:h.punto_de_partida.lugar }; }
}catch(e){}
if(!origin){ console.error("No encontré punto_de_partida (lat, lon) en prospectos_16bc_handoff.json"); process.exit(1); }

const UA = "16BallCreations-prospect-map/1.0 (16ballcreations@gmail.com)";
const MAX_KM = 6;                       /* farther than this from the start: not shown */
await mkdir(join(root, "tmp"), { recursive: true });

/* ---------- the streets ---------- */
const streetsFile = join(root, "tmp", `calles-${campaign}.json`);
const pad = .045;                       /* ~5 km around the starting point */
const bbox = [origin.lat - pad, origin.lon - pad, origin.lat + pad, origin.lon + pad].map(n => n.toFixed(4)).join(",");
let osm;
try{ await access(streetsFile); osm = JSON.parse(await readFile(streetsFile, "utf8")); }
catch(e){
  const query = `[out:json][timeout:90];way["highway"]["name"~"^(Calle|Carrera|Avenida|Diagonal|Transversal|Circular)"](${bbox});out geom;`;
  for(let attempt = 1; attempt <= 6 && !osm; attempt++){
    try{
      const r = await fetch("https://overpass-api.de/api/interpreter", { method:"POST", headers:{ "User-Agent":UA, "Content-Type":"application/x-www-form-urlencoded" }, body:"data=" + encodeURIComponent(query) });
      const text = await r.text();
      if(text.startsWith("{")){ osm = JSON.parse(text); await writeFile(streetsFile, text); }
      else { console.log(`Overpass ocupado (intento ${attempt}), espero 30 s…`); await new Promise(z => setTimeout(z, 30000)); }
    }catch(err){ console.log("Overpass no respondió:", err.message); await new Promise(z => setTimeout(z, 30000)); }
  }
  if(!osm){ console.error("No pude descargar las calles. Prueba más tarde."); process.exit(1); }
}

/* "Calle 16 A" and "Avenida Calle 37" are Calle 16A and Calle 37 */
function streetKey(name){
  let n = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/\s+/g, " ").trim();
  n = n.replace(/^AVENIDA (CALLE|CARRERA)\b/, "$1");
  n = n.replace(/^(CALLE|CARRERA|AVENIDA|DIAGONAL|TRANSVERSAL|CIRCULAR) (\d+) ?([A-Z]{1,3})?( SUR)?$/, (m, t, num, l, sur) => `${t} ${num}${l || ""}${sur ? " SUR" : ""}`);
  return n;
}
const streets = new Map();
for(const w of osm.elements){
  if(!w.geometry){ continue; }
  const k = streetKey(w.tags.name);
  if(!streets.has(k)){ streets.set(k, []); }
  streets.get(k).push(w.geometry.map(p => [p.lat, p.lon]));
}

/* ---------- reading an address ---------- */
const TYPE = { CL:"CALLE", CLL:"CALLE", CALLE:"CALLE", CR:"CARRERA", CRA:"CARRERA", KR:"CARRERA", KRA:"CARRERA", CARRERA:"CARRERA",
  AV:"AVENIDA", AVENIDA:"AVENIDA", DG:"DIAGONAL", DIAGONAL:"DIAGONAL", TV:"TRANSVERSAL", TR:"TRANSVERSAL", TRANSVERSAL:"TRANSVERSAL", CIR:"CIRCULAR", CIRCULAR:"CIRCULAR" };
/* calles cross carreras and the other way round. Avenues, diagonals,
   transversals and circulars follow the grid by their number: in Belén the
   60s and up run like carreras (Av. 80, Diagonal 75B) and the rest like calles
   (Av. 33, Transversal 4) */
function gridType(type, num){
  if(type === "CALLE" || type === "CARRERA"){ return type; }
  return +num >= 60 ? "CARRERA" : "CALLE";
}
const CROSS = { CALLE:"CARRERA", CARRERA:"CALLE" };

function parse(addr){
  if(!addr){ return null; }
  const a = addr.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
  const m = a.match(/\b(CALLE|CARRERA|AVENIDA|DIAGONAL|TRANSVERSAL|CIRCULAR|CLL|CL|CRA|CR|KRA|KR|AV|DG|TV|TR|CIR)\.?\s*(\d+)\s*([A-Z]{0,3})\b\s*(SUR)?\s*(?:#|N[O°º]\.?|NUMERO)?\s*(\d+)\s*([A-Z]{0,3})?\s*(?:-|\s)\s*\d+/);
  if(!m){ return null; }
  const type = TYPE[m[1]], grid = gridType(type, m[2]);
  const sur = m[4] ? " SUR" : "";
  const main = { type, num:m[2], letters:m[3] || "" };
  if(type === "AVENIDA"){ main.alt = grid; }
  const cross = { type:CROSS[grid], num:m[5], letters:m[6] || "" };
  return { main, cross, sur };
}

/* names to try, most exact first: "CALLE 30A", then "CALLE 30" */
function names(s, sur = ""){
  const out = [];
  const types = [s.type, s.alt].filter(Boolean);
  if(s.type === "AVENIDA"){ types.unshift("AVENIDA"); }
  /* the map often names the big ones as avenues: Calle 33 is "Avenida 33", Carrera 80 is "Avenida 80" */
  else if(s.type === "CALLE" || s.type === "CARRERA"){ types.push("AVENIDA"); }
  for(const t of types){
    if(s.letters){ out.push(`${t} ${s.num}${s.letters}${sur}`); }
    out.push(`${t} ${s.num}${sur}`);
  }
  return [...new Set(out)];
}
/* every line that carries one of these names: a street can be "Calle 33" in
   one stretch and "Avenida 33" in the next */
function linesFor(list){
  const found = list.filter(n => streets.has(n));
  return found.length ? { name:found.join(" + "), lines:found.flatMap(n => streets.get(n)) } : null;
}

/* ---------- geometry, on a local flat plane in metres ---------- */
const R = 6371000, toRad = d => d * Math.PI / 180;
const kx = Math.cos(toRad(origin.lat)) * toRad(1) * R, ky = toRad(1) * R;
const xy = ([lat, lon]) => [(lon - origin.lon) * kx, (lat - origin.lat) * ky];
const ll = ([x, y]) => [origin.lat + y / ky, origin.lon + x / kx];
function closest(p1, p2, q1, q2){
  /* the closest points of two segments, and their distance */
  const d1 = [p2[0] - p1[0], p2[1] - p1[1]], d2 = [q2[0] - q1[0], q2[1] - q1[1]], r = [p1[0] - q1[0], p1[1] - q1[1]];
  const a = d1[0] * d1[0] + d1[1] * d1[1], e = d2[0] * d2[0] + d2[1] * d2[1], f = d2[0] * r[0] + d2[1] * r[1];
  let s, t;
  if(a < 1e-9 && e < 1e-9){ s = t = 0; }
  else if(a < 1e-9){ s = 0; t = Math.min(1, Math.max(0, f / e)); }
  else {
    const c = d1[0] * r[0] + d1[1] * r[1];
    if(e < 1e-9){ t = 0; s = Math.min(1, Math.max(0, -c / a)); }
    else {
      const b = d1[0] * d2[0] + d1[1] * d2[1], den = a * e - b * b;
      s = den !== 0 ? Math.min(1, Math.max(0, (b * f - c * e) / den)) : 0;
      t = (b * s + f) / e;
      if(t < 0){ t = 0; s = Math.min(1, Math.max(0, -c / a)); }
      else if(t > 1){ t = 1; s = Math.min(1, Math.max(0, (b - c) / a)); }
    }
  }
  const P = [p1[0] + d1[0] * s, p1[1] + d1[1] * s], Q = [q1[0] + d2[0] * t, q1[1] + d2[1] * t];
  return { d:Math.hypot(P[0] - Q[0], P[1] - Q[1]), at:[(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2] };
}
function crossing(A, B){
  let best = null;
  for(const la of A){ for(const lb of B){
    const a = la.map(xy), b = lb.map(xy);
    for(let i = 0; i < a.length - 1; i++){ for(let j = 0; j < b.length - 1; j++){
      const c = closest(a[i], a[i + 1], b[j], b[j + 1]);
      /* among several meeting points, the one nearest the starting point */
      const score = c.d * 10 + Math.hypot(c.at[0], c.at[1]) / 1000;
      if(!best || score < best.score){ best = { ...c, score }; }
    } }
  } }
  return best;
}
/* where the cross street number N falls on the main street: at its corner if
   they meet, else between the nearest cross streets that do meet it, in
   proportion to the number (Calle 30 #81-19 lies between Carrera 80 and 82) */
const LETTER = l => l ? Math.min(.9, (l.charCodeAt(0) - 64) * .25) : 0;
function place(mainLines, cross, sur){
  const target = +cross.num + LETTER(cross.letters);
  const hits = [];
  for(let n = +cross.num - 4; n <= +cross.num + 4; n++){
    if(n < 0){ continue; }
    const variants = n === +cross.num && cross.letters ? [cross.letters, ""] : [""];
    for(const l of variants){
      const key = `${cross.type} ${n}${l}${sur}`;
      if(!streets.has(key)){ continue; }
      const c = crossing(mainLines, streets.get(key));
      /* a street drawn a few metres short of the corner still meets it */
      if(c && c.d <= 40){ hits.push({ v:n + LETTER(l), at:c.at }); }
    }
  }
  if(!hits.length){ return null; }
  const exact = hits.find(h => Math.abs(h.v - target) < .01);
  if(exact){ return { at:exact.at, kind:"esquina" }; }
  const below = hits.filter(h => h.v < target).sort((a, b) => b.v - a.v)[0];
  const above = hits.filter(h => h.v > target).sort((a, b) => a.v - b.v)[0];
  if(below && above && above.v - below.v <= 6){
    const t = (target - below.v) / (above.v - below.v);
    const at = [below.at[0] + (above.at[0] - below.at[0]) * t, below.at[1] + (above.at[1] - below.at[1]) * t];
    /* the two corners must be one street apart, not two ends of a bend */
    if(Math.hypot(above.at[0] - below.at[0], above.at[1] - below.at[1]) < 900){ return { at, kind:"cuadra" }; }
  }
  const near = [below, above].filter(Boolean).sort((a, b) => Math.abs(a.v - target) - Math.abs(b.v - target))[0];
  return Math.abs(near.v - target) <= 2 ? { at:near.at, kind:"cercana" } : null;
}
const kmFromStart = ([lat, lon]) => { const [x, y] = xy([lat, lon]); return Math.hypot(x, y) / 1000; };

/* ---------- neighbourhoods, for addresses without a number ---------- */
async function nominatim(q){
  await new Promise(z => setTimeout(z, 1100));    /* their policy: one request per second */
  const u = "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=co&bounded=1&viewbox=" +
    [origin.lon - pad, origin.lat + pad, origin.lon + pad, origin.lat - pad].join(",") + "&q=" + encodeURIComponent(q);
  try{ const r = await fetch(u, { headers:{ "User-Agent":UA } }); const j = await r.json(); return j[0] ? [+j[0].lat, +j[0].lon] : null; }
  catch(e){ return null; }
}
function barrioQuery(p){
  const raw = [p.direccion, p.barrio].filter(Boolean).join(" ");
  const m = raw.match(/\b(Los Alpes|La Palma|Miravalle|Rosales|San Bernardo|La Gloria|Las Playas|La Nubia|Las Mercedes|Granada|Fátima|Fatima|La Mota|Altavista|Los Bernal|Loma de los Bernal|Las Violetas|Nueva Villa de Aburrá|Belén Parque|Parque de Belén|La Hondonada|El Rincón|Aliadas|Diamante|Zafra|Cristo Rey|Guayabal|Laureles|La Colina)\b/i);
  if(m){ return m[1].replace(/^Parque de Belén$/i, "Parque de Belén").replace(/^Belén Parque$/i, "Parque de Belén") + ", Medellín"; }
  return null;
}
/* neighbourhood lookups are kept, so a second run does not ask again */
const barrioFile = join(root, "tmp", "barrios-geo.json");
let barrioCache;
try{ barrioCache = new Map(Object.entries(JSON.parse(await readFile(barrioFile, "utf8")))); }catch(e){ barrioCache = new Map(); }

/* ---------- each prospect ---------- */
const q = v => v == null ? "NULL" : typeof v === "number" ? String(v) : "'" + String(v).replace(/'/g, "''") + "'";
const sql = [], report = { esquina:0, cuadra:0, cercana:0, barrio:0, sin:[] };
for(const p of base.prospectos){
  const id = campaign + ":" + p.code;
  const parsed = parse(p.direccion);
  let point = null, kind = null;
  if(parsed){
    const A = linesFor(names(parsed.main, parsed.sur));
    if(A){
      const hit = place(A.lines, parsed.cross, parsed.sur);
      if(hit){ point = ll(hit.at); kind = hit.kind; }
    }
  }
  if(!point){
    const bq = barrioQuery(p);
    if(bq){
      if(!barrioCache.has(bq) || barrioCache.get(bq) === null){
        const hit = await nominatim(bq);
        if(hit){ barrioCache.set(bq, hit); await writeFile(barrioFile, JSON.stringify(Object.fromEntries(barrioCache))); }
      }
      const b = barrioCache.get(bq) || null;
      if(b){
        /* a small spread, so prospects of the same neighbourhood do not stack */
        const h = [...p.code].reduce((s, ch) => s * 31 + ch.charCodeAt(0), 7);
        point = [b[0] + ((h % 13) - 6) * .00012, b[1] + (((h >> 4) % 13) - 6) * .00012];
        kind = "barrio";
      }
    }
  }
  if(point && kmFromStart(point) > MAX_KM){ point = null; }
  if(point){
    report[kind]++;
    sql.push(`UPDATE prospects SET lat = ${point[0].toFixed(6)}, lng = ${point[1].toFixed(6)}, geo = ${q(kind)} WHERE id = ${q(id)};`);
  } else {
    report.sin.push(`${p.code} · ${p.negocio} · ${p.direccion || "sin dirección"}`);
    sql.push(`UPDATE prospects SET lat = NULL, lng = NULL, geo = NULL WHERE id = ${q(id)};`);
  }
}
/* the starting point, so the map can show where the visits begin */
sql.push(`INSERT INTO settings (key, value, updated_at) VALUES (${q("origen:" + campaign)}, ${q(JSON.stringify(origin))}, datetime('now')) ` +
  `ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`);

const out = join(root, "tmp", `prospectos-geo-${campaign}.sql`);
await writeFile(out, sql.join("\n") + "\n");
console.log(`En la esquina exacta: ${report.esquina} · en su cuadra: ${report.cuadra} · a una cuadra: ${report.cercana} · por barrio (aprox.): ${report.barrio} · sin ubicar: ${report.sin.length}`);
if(report.sin.length){ console.log("Sin ubicar:\n  " + report.sin.join("\n  ")); }
console.log("→ " + out);
