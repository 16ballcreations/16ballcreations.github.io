/* Correo: los informes DMARC que llegan por Email Routing y la página «Correo enviado». */

import { adminPage, sectionHead } from "./comun/pagina.js";
import { esc, row } from "./comun/util.js";

/* ---------- DMARC reports, received by email ---------- */

/* The XML reports inside a raw message: a .zip (Google), a .gz (Microsoft,
   Yahoo) or plain .xml, as a MIME attachment in base64. */
export async function dmarcXmls(raw){
  const text = latin1(raw);
  const out = [];
  for(const part of mimeLeaves(text)){
    const head = part.head.toLowerCase();
    const name = (/(?:file)?name="?([^";\r\n]+)/i.exec(part.head) || [])[1] || "";
    const looks = /zip|gzip|xml|octet-stream/.test(head) || /\.(zip|gz|xml)$/i.test(name);
    if(!looks){ continue; }
    let bytes = /content-transfer-encoding:\s*base64/.test(head)
      ? base64Bytes(part.body) : bytesOf(part.body);
    if(bytes[0] === 0x50 && bytes[1] === 0x4b){
      for(const entry of await unzip(bytes)){ out.push(utf8(entry)); }
    }else if(bytes[0] === 0x1f && bytes[1] === 0x8b){
      out.push(utf8(await inflate(bytes, "gzip")));
    }else{
      const t = utf8(bytes);
      if(t.includes("<feedback")){ out.push(t); }
    }
  }
  return out.filter(x => x.includes("<feedback"));
}

export function mimeLeaves(text){
  const cut = text.indexOf("\r\n\r\n") >= 0 ? text.indexOf("\r\n\r\n") : text.indexOf("\n\n");
  if(cut < 0){ return []; }
  const head = text.slice(0, cut).replace(/\r?\n[ \t]+/g, " ");
  const body = text.slice(cut).replace(/^\r?\n\r?\n/, "");
  const boundary = (/boundary="?([^";\r\n]+)"?/i.exec(head) || [])[1];
  if(/content-type:\s*multipart\//i.test(head) && boundary){
    return body.split("--" + boundary).slice(1)
      .filter(p => !p.startsWith("--"))
      .flatMap(p => mimeLeaves(p.replace(/^\r?\n/, "")));
  }
  return [{ head, body }];
}

export async function unzip(bytes){
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for(let i = bytes.length - 22; i >= 0 && i >= bytes.length - 65557; i--){
    if(v.getUint32(i, true) === 0x06054b50){ eocd = i; break; }
  }
  if(eocd < 0){ return []; }
  const entries = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  const files = [];
  for(let n = 0; n < entries && v.getUint32(p, true) === 0x02014b50; n++){
    const method = v.getUint16(p + 10, true);
    const size = v.getUint32(p + 20, true);
    const local = v.getUint32(p + 42, true);
    const start = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
    const data = bytes.subarray(start, start + size);
    files.push(method === 8 ? await inflate(data, "deflate-raw") : data);
    p += 46 + v.getUint16(p + 28, true) + v.getUint16(p + 30, true) + v.getUint16(p + 32, true);
  }
  return files;
}

export async function inflate(bytes, format){
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream(format));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
export function latin1(bytes){ let s = ""; for(let i = 0; i < bytes.length; i += 8192){ s += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192)); } return s; }
export function bytesOf(s){ const b = new Uint8Array(s.length); for(let i = 0; i < s.length; i++){ b[i] = s.charCodeAt(i) & 255; } return b; }
export function base64Bytes(s){ return bytesOf(atob(s.replace(/[^A-Za-z0-9+/=]/g, ""))); }
export function utf8(bytes){ return new TextDecoder().decode(bytes); }

export function xmlTag(xml, name){
  const m = new RegExp("<" + name + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + name + ">").exec(xml || "");
  return m ? m[1].trim() : "";
}

/* Keeps one report and its rows; a report already kept is skipped */
export async function saveDmarc(env, xml){
  const meta = xmlTag(xml, "report_metadata");
  const org = xmlTag(meta, "org_name") || "desconocido";
  const id = xmlTag(meta, "report_id");
  if(!id){ return 0; }
  const range = xmlTag(meta, "date_range");
  const begin = parseInt(xmlTag(range, "begin"), 10) || null;
  const end = parseInt(xmlTag(range, "end"), 10) || null;
  const policy = xmlTag(xmlTag(xml, "policy_published"), "p");
  const r = await env.DB.prepare("INSERT OR IGNORE INTO dmarc_reports (org, report_id, begin_at, end_at, policy) VALUES (?1, ?2, ?3, ?4, ?5)")
    .bind(org, id, begin, end, policy).run();
  if(!r.meta.changes){ return 0; }
  const rows = (xml.match(/<record>[\s\S]*?<\/record>/g) || []).map(rec => {
    const row = xmlTag(rec, "row"), pol = xmlTag(row, "policy_evaluated"), auth = xmlTag(rec, "auth_results");
    const spf = xmlTag(auth, "spf"), dkim = xmlTag(auth, "dkim");
    return env.DB.prepare(
      "INSERT INTO dmarc_rows (org, report_id, begin_at, source_ip, count, disposition, dkim, spf, header_from, spf_domain, spf_result, dkim_domain, dkim_result) " +
      "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)"
    ).bind(org, id, begin, xmlTag(row, "source_ip"), parseInt(xmlTag(row, "count"), 10) || 0,
      xmlTag(pol, "disposition"), xmlTag(pol, "dkim"), xmlTag(pol, "spf"),
      xmlTag(xmlTag(rec, "identifiers"), "header_from"),
      xmlTag(spf, "domain"), xmlTag(spf, "result"), xmlTag(dkim, "domain"), xmlTag(dkim, "result"));
  });
  if(rows.length){ await env.DB.batch(rows); }
  return rows.length;
}

/* Who sent it, in words: our own Gmail "send as", or someone to look at */
export function dmarcSource(r){
  const d = (r.spf_domain || "").toLowerCase();
  if(d === "gmail.com" || d === "google.com" || /^209\.85\.|^2607:f8b0:/.test(r.source_ip || "")){
    return { label:"Gmail · «Enviar como» (crea@ u hola@)", ours:true };
  }
  if(d.endsWith("16ballcreations.com") || d.endsWith("cloudflare-email.net")){
    return { label:"Reenvío de Cloudflare (correo recibido)", ours:true };
  }
  return { label:d ? "Otro servidor · " + d : "Otro servidor", ours:false };
}

export async function mailPage(env){
  const since = Math.floor(Date.now() / 1000) - 30 * 86400;
  const { results } = await env.DB.prepare(
    "SELECT source_ip, spf_domain, MAX(begin_at) AS last, SUM(count) AS n, " +
    "SUM(CASE WHEN dkim = 'pass' OR spf = 'pass' THEN count ELSE 0 END) AS ok, " +
    "SUM(CASE WHEN disposition IN ('quarantine', 'reject') THEN count ELSE 0 END) AS blocked, " +
    "GROUP_CONCAT(DISTINCT org) AS orgs " +
    "FROM dmarc_rows WHERE begin_at >= ?1 GROUP BY source_ip, spf_domain ORDER BY n DESC"
  ).bind(since).all();
  const reports = await env.DB.prepare("SELECT COUNT(*) AS n, MAX(end_at) AS last FROM dmarc_reports").first();
  const total = results.reduce((s, r) => s + r.n, 0);
  const ok = results.reduce((s, r) => s + r.ok, 0);
  const blocked = results.reduce((s, r) => s + r.blocked, 0);
  const strange = results.filter(r => !dmarcSource(r).ours).reduce((s, r) => s + r.n, 0);
  const day = t => t ? new Date(t * 1000).toLocaleDateString("es-CO", { day:"numeric", month:"short", timeZone:"America/Bogota" }) : "";
  const tile = (label, big, line, hot) => `<div class="tile${hot ? " hot" : ""}"><span class="tile-label">${label}</span><b>${big}</b><span class="tile-line">${line}</span></div>`;
  const rows = results.map(r => {
    const s = dmarcSource(r);
    return `<tr><td>${esc(s.label)}</td><td class="mono">${esc(r.source_ip || "")}</td><td>${r.n}</td>` +
      `<td>${r.ok === r.n ? "Sí" : r.ok ? `${r.ok} de ${r.n}` : "No"}</td><td>${r.blocked ? r.blocked + " bloqueados" : "Entregados"}</td>` +
      `<td>${esc(r.orgs || "")}</td><td>${esc(day(r.last))}</td></tr>`;
  }).join("");
  return adminPage(env, "correo", "Correo enviado", `
    ${sectionHead("Ajustes · correo enviado", "Lo que <em>llega</em> a nombre del dominio")}
    <p class="totals">Cada día Google, Microsoft y otros cuentan qué correos recibieron con remitente @16ballcreations.com y si pasaron las pruebas (SPF, DKIM y DMARC). Últimos 30 días · ${reports.n} informe(s)${reports.last ? " · el último cubre hasta el " + esc(day(reports.last)) : ""}.</p>
    <section class="tiles">
      ${tile("Correos", total, "a nombre del dominio")}
      ${tile("Alineados", total ? Math.round(100 * ok / total) + "%" : "—", "pasan DMARC")}
      ${tile("Bloqueados", blocked, blocked ? "revisar ya" : "con p=none no se bloquea nada", blocked > 0)}
      ${tile("De otros servidores", strange, strange ? "reenvíos o suplantación: mirar abajo" : "todo sale de lo nuestro", strange > 0)}
    </section>
    ${results.length ? `
    <div class="tablewrap"><table class="ptable">
      <thead><tr><th>Quién lo envió</th><th>IP</th><th>Correos</th><th>Pasa DMARC</th><th>Resultado</th><th>Informa</th><th>Último</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>` : `<p class="empty">Todavía no llega ningún informe.</p>`}
    <p class="totals">Hoy es normal que lo enviado desde Gmail no pase DMARC: Gmail gratuito firma con gmail.com, no con el dominio. Por eso la política está en p=none, que entrega igual. «Otro servidor» suele ser un reenvío del lado de quien recibe; si aparece con muchos correos o desde fuera de Colombia, puede ser alguien haciéndose pasar por 16 Ball.</p>
  `);
}
