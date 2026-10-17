/* Turns a prospect campaign into SQL for the panel's database.
   The research stays out of the repo (it is clients' data); this script reads
   it from its folder and writes tmp/prospectos-<campaign>.sql, which is
   ignored by git. Then:

     npx wrangler d1 execute 16bc --local  --file tmp/prospectos-<campaign>.sql
     npx wrangler d1 execute 16bc --remote --file tmp/prospectos-<campaign>.sql

   The folder must have base-panel.json ({ campaign, prospectos[], recursos[] }).
   Loading it again refreshes the research of each prospect but never touches
   what was tracked in the panel: stage, next action, the timeline, the MIRA
   link code, and what was edited by hand (the first message, the contact
   details and the verification notes).

   Usage: node scripts/prospectos-sql.mjs prospectos/belen-2026-10 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const folder = process.argv[2] && resolve(process.argv[2]);
if(!folder){ console.error("Falta la carpeta de la campaña. Ej.: node scripts/prospectos-sql.mjs prospectos/belen-2026-10"); process.exit(1); }

const base = JSON.parse(await readFile(join(folder, "base-panel.json"), "utf8"));
const campaign = base.campaign;
if(!/^[a-z0-9-]+$/.test(campaign || "")){ console.error("campaign debe ser algo como belen-2026-10"); process.exit(1); }

const q = v => v == null || v === "" ? "NULL" : typeof v === "number" ? String(v) : "'" + String(v).replace(/'/g, "''") + "'";
const FIELDS = ["negocio", "categoria", "barrio", "direccion", "dir_fuente", "distancia_km", "prioridad", "score", "rank", "estado_redes",
  "canal", "enlace", "respaldo", "instagram", "facebook", "tiktok", "web", "gancho", "mensaje", "nota"];

/* the fields each "edited in the panel" flag protects (migrations 0008, 0012) */
const BY_HAND = {
  mensaje: "mensaje_editado",
  canal: "contacto_editado", enlace: "contacto_editado", respaldo: "contacto_editado", direccion: "contacto_editado",
  dir_fuente: "contacto_editado", barrio: "contacto_editado", instagram: "contacto_editado", facebook: "contacto_editado",
  tiktok: "contacto_editado", web: "contacto_editado",
  gancho: "notas_editadas", nota: "notas_editadas"
};
function keep(f){
  /* the phone and the email live in data: the new research, with what was typed by hand */
  if(f === "data"){ return "data = CASE WHEN contacto_editado = 1 THEN json_set(excluded.data, '$.telefono', json_extract(data, '$.telefono'), '$.correo', json_extract(data, '$.correo')) ELSE excluded.data END"; }
  return BY_HAND[f] ? `${f} = CASE WHEN ${BY_HAND[f]} = 1 THEN ${f} ELSE excluded.${f} END` : `${f} = excluded.${f}`;
}

const sql = [];
for(const p of base.prospectos){
  const id = campaign + ":" + p.code;
  const cols = ["id", "campaign", "code", ...FIELDS, "data"];
  const vals = [id, campaign, p.code, ...FIELDS.map(f => p[f]), JSON.stringify(p.data || {})];
  sql.push(
    `INSERT INTO prospects (${cols.join(", ")}) VALUES (${vals.map(q).join(", ")})\n` +
    /* what was edited in the panel wins over the research: the first
       message, the contact details and the verification notes */
    `  ON CONFLICT(id) DO UPDATE SET ${[...FIELDS, "data"].map(keep).join(", ")}, updated_at = datetime('now');`
  );
  /* a prospect outside the zone starts discarded, with the reason on its timeline */
  if(p.prioridad === "Descartar"){
    sql.push(`UPDATE prospects SET etapa = 'descartado' WHERE id = ${q(id)} AND etapa = 'por_contactar';`);
  }
}
for(const r of base.recursos || []){
  const body = await readFile(join(folder, r.archivo), "utf8");
  /* D1 refuses statements over 100 KB: long documents go in pieces */
  const parts = [];
  for(let i = 0; i < body.length; i += 40000){ parts.push(body.slice(i, i + 40000)); }
  sql.push(
    `INSERT INTO resources (slug, campaign, title, body) VALUES (${q(r.slug)}, ${q(campaign)}, ${q(r.titulo)}, ${q(parts[0] || "")})\n` +
    `  ON CONFLICT(slug) DO UPDATE SET title = excluded.title, body = excluded.body, updated_at = datetime('now');`
  );
  for(const part of parts.slice(1)){ sql.push(`UPDATE resources SET body = body || ${q(part)} WHERE slug = ${q(r.slug)};`); }
}

await mkdir(join(root, "tmp"), { recursive: true });
const out = join(root, "tmp", `prospectos-${campaign}.sql`);
await writeFile(out, sql.join("\n") + "\n");
console.log(`${base.prospectos.length} prospectos y ${(base.recursos || []).length} recursos → ${out}`);
