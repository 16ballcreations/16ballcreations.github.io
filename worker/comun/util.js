/* Utilidades sin dependencias: HTML seguro, fechas en Bogotá, Markdown. */

/* comparing names: no accents, no case, words only */
export function plain(text){
  return String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9@._]+/g, " ").trim();
}
export function todayInBogota(){
  return new Date().toLocaleDateString("es-CO", { timeZone:"America/Bogota", day:"numeric", month:"long", year:"numeric" });
}
export function whenInBogota(sqlDate){
  if(!sqlDate){ return null; }
  return new Date(sqlDate.replace(" ", "T") + "Z").toLocaleString("es-CO", { timeZone:"America/Bogota", dateStyle:"long", timeStyle:"short" });
}

export function todayIso(){
  return new Date().toLocaleDateString("en-CA", { timeZone:"America/Bogota" });
}
export function plusDays(iso, n){
  const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function bogotaStamp(minutesAgo = 0){
  return new Date(Date.now() - minutesAgo * 60000).toLocaleString("sv-SE", { timeZone:"America/Bogota" }).replace(" ", "T").slice(0, 16);
}
export function plusWorkdays(iso, n){
  let d = iso;
  while(n > 0){ d = plusDays(d, 1); const day = new Date(d + "T12:00:00Z").getUTCDay(); if(day !== 0 && day !== 6){ n--; } }
  return d;
}
export function slug(text){
  return String(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

/* just enough Markdown for our own documents: headings, tables, quotes, lists */
export function markdown(src){
  const inline = s => esc(s)
    .replace(/&lt;br&gt;/g, "<br>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\*)/g, "$1<em>$2</em>")
    .replace(/!\[([^\]]*)\]\((https?:[^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
  const lines = String(src).replace(/\r/g, "").split("\n");
  const out = [];
  for(let i = 0; i < lines.length;){
    const line = lines[i];
    if(!line.trim()){ i++; continue; }
    /* a rule, and fenced code, as written */
    if(/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)){ out.push("<hr>"); i++; continue; }
    if(/^\s*```/.test(line)){
      const code = []; i++;
      while(i < lines.length && !/^\s*```/.test(lines[i])){ code.push(lines[i]); i++; }
      i++; out.push("<pre><code>" + esc(code.join("\n")) + "</code></pre>"); continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)/);
    if(h){ const n = h[1].length + 1; out.push(`<h${n}>${inline(h[2])}</h${n}>`); i++; continue; }
    if(/^\s*\|/.test(line)){
      const rows = [];
      while(i < lines.length && /^\s*\|/.test(lines[i])){ rows.push(lines[i]); i++; }
      const cells = l => l.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());
      const body = rows.filter((l, k) => !(k === 1 && /^[\s|:-]+$/.test(l)));
      out.push(`<div class="tablewrap"><table class="ptable"><thead><tr>${cells(body[0]).map(c => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>` +
        body.slice(1).map(l => `<tr>${cells(l).map(c => `<td>${inline(c)}</td>`).join("")}</tr>`).join("") + "</tbody></table></div>");
      continue;
    }
    if(/^>/.test(line)){
      const q = [];
      while(i < lines.length && /^>/.test(lines[i])){ q.push(lines[i].replace(/^>\s?/, "")); i++; }
      out.push(`<blockquote>${q.map(inline).join("<br>")}</blockquote>`);
      continue;
    }
    const li = /^\s*([-*]|\d+\.)\s+/;
    if(li.test(line)){
      const ordered = /^\s*\d+\./.test(line), items = [];
      while(i < lines.length && (li.test(lines[i]) || /^\s{2,}\S/.test(lines[i]) && items.length)){
        const raw = lines[i], deep = /^\s{2,}/.test(raw);
        const t = raw.replace(li, "").replace(/^\s+/, "").replace(/^\[ \]\s*/, "☐ ").replace(/^\[x\]\s*/i, "☑ ");
        items.push(`<li${deep ? ' class="deep"' : ""}>${inline(t)}</li>`); i++;
      }
      out.push(ordered ? `<ol>${items.join("")}</ol>` : `<ul>${items.join("")}</ul>`);
      continue;
    }
    const para = [];
    while(i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\s*\||>|\s*([-*]|\d+\.)\s|\s*```|\s*(-{3,}|\*{3,}|_{3,})\s*$)/.test(lines[i])){ para.push(lines[i]); i++; }
    out.push(`<p>${inline(para.join(" "))}</p>`);
  }
  return out.join("\n");
}

export function esc(s){
  return String(s == null ? "" : s).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
}
export function list(v){ return Array.isArray(v) ? v.filter(Boolean).join(", ") : (v || ""); }
export function row(label, value){
  return `<p><b>${esc(label)}</b>${value ? esc(value).replace(/\n/g, "<br>") : '<span class="none">Sin respuesta</span>'}</p>`;
}
