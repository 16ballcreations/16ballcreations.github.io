/* 16 Ball Creations: the Worker.
   The site itself is static and served straight from the assets; this code
   only runs for what is not a file:

   POST /api/mira        a MIRA, sent from /mira/
   POST /api/contacto    the contact form on the home page
   GET  /admin           the review panel (basic auth, ADMIN_PASSWORD secret)
   POST /admin/revisado  mark a submission as reviewed, or not

   While the site still lives on GitHub Pages too, its pages post here
   across origins, so the API answers CORS for the known origins. */

const ALLOWED_ORIGINS = [
  "https://16ballcreations.github.io",
  "http://localhost:8717",
  "http://localhost:8787",
  "http://127.0.0.1:8787"
];
const MAX_BODY = 32 * 1024;
const MAX_TEXT = 3000;

export default {
  async fetch(request, env){
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if(path === "/api/mira" || path === "/api/contacto"){
      if(request.method === "OPTIONS"){ return preflight(request, url); }
      if(request.method === "POST"){ return receive(request, env, url, path === "/api/mira" ? "mira" : "contacto"); }
      return json({ ok:false, error:"Método no permitido" }, 405, request, url);
    }
    if(path === "/admin" || path === "/admin/revisado"){
      return admin(request, env, url, path);
    }
    return env.ASSETS.fetch(request);
  }
};

/* ---------- the API ---------- */

function corsHeaders(request, url){
  const origin = request.headers.get("Origin") || "";
  const allowed = origin === url.origin || ALLOWED_ORIGINS.includes(origin);
  return allowed ? {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  } : { "Vary": "Origin" };
}
function preflight(request, url){
  return new Response(null, { status:204, headers:corsHeaders(request, url) });
}
function json(body, status, request, url){
  return new Response(JSON.stringify(body), {
    status,
    headers:{ "Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store", ...corsHeaders(request, url) }
  });
}

/* every string is trimmed and capped; arrays and objects are walked */
function clean(value, depth = 0){
  if(depth > 4){ return null; }
  if(typeof value === "string"){ return value.trim().slice(0, MAX_TEXT); }
  if(typeof value === "number" || typeof value === "boolean"){ return value; }
  if(Array.isArray(value)){ return value.slice(0, 30).map(v => clean(v, depth + 1)); }
  if(value && typeof value === "object"){
    const out = {};
    for(const key of Object.keys(value).slice(0, 40)){ out[key.slice(0, 40)] = clean(value[key], depth + 1); }
    return out;
  }
  return null;
}

async function receive(request, env, url, kind){
  const length = +(request.headers.get("Content-Length") || 0);
  if(length > MAX_BODY){ return json({ ok:false, error:"Demasiado largo" }, 413, request, url); }

  let body;
  try{
    const text = await request.text();
    if(text.length > MAX_BODY){ return json({ ok:false, error:"Demasiado largo" }, 413, request, url); }
    body = JSON.parse(text);
  }catch(e){
    return json({ ok:false, error:"No se pudo leer el envío" }, 400, request, url);
  }

  /* a field people never see; bots fill it in. Answer as if all went well. */
  if(body && body.website){ return json({ ok:true }, 201, request, url); }

  const data = clean(body && body.data);
  if(!data || typeof data !== "object"){ return json({ ok:false, error:"Faltan datos" }, 400, request, url); }

  let name, brand, contact;
  if(kind === "mira"){
    name = data.nombre; brand = data.marca; contact = data.contacto;
    if(!name || !brand || !contact){ return json({ ok:false, error:"Faltan el nombre, la marca o el contacto" }, 400, request, url); }
  } else {
    name = data.nombre; brand = null; contact = null;
    if(!name || !data.idea){ return json({ ok:false, error:"Faltan el nombre o la idea" }, 400, request, url); }
  }

  await env.DB.prepare(
    "INSERT INTO submissions (kind, name, brand, contact, data) VALUES (?1, ?2, ?3, ?4, ?5)"
  ).bind(kind, name, brand, contact, JSON.stringify(data)).run();

  return json({ ok:true }, 201, request, url);
}

/* ---------- the review panel ---------- */

function unauthorized(){
  return new Response("Se necesita la clave del panel.", {
    status:401,
    headers:{ "WWW-Authenticate":'Basic realm="16bc admin", charset="UTF-8"', "Cache-Control":"no-store" }
  });
}
function sameText(a, b){
  /* compare in constant time, so the answer time does not leak the key */
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for(let i = 0; i < Math.max(x.length, y.length); i++){ diff |= (x[i] || 0) ^ (y[i] || 0); }
  return diff === 0;
}
function authorized(request, env){
  const header = request.headers.get("Authorization") || "";
  if(!header.startsWith("Basic ")){ return false; }
  let decoded = "";
  try{ decoded = atob(header.slice(6)); }catch(e){ return false; }
  const password = decoded.slice(decoded.indexOf(":") + 1);
  return sameText(password, env.ADMIN_PASSWORD);
}

async function admin(request, env, url, path){
  if(!env.ADMIN_PASSWORD){
    return page("Falta la clave", `<p class="empty">El panel todavía no tiene clave. Créala con <code>npx wrangler secret put ADMIN_PASSWORD</code> y vuelve a entrar.</p>`, 503);
  }
  if(!authorized(request, env)){ return unauthorized(); }

  if(path === "/admin/revisado" && request.method === "POST"){
    const form = await request.formData();
    const id = parseInt(form.get("id"), 10);
    const value = form.get("revisado") === "1" ? 1 : 0;
    if(id){ await env.DB.prepare("UPDATE submissions SET reviewed = ?1 WHERE id = ?2").bind(value, id).run(); }
    const back = form.get("volver") || "/admin";
    return Response.redirect(new URL(back.startsWith("/admin") ? back : "/admin", url.origin).toString(), 303);
  }

  const tipo = ["mira", "contacto"].includes(url.searchParams.get("tipo")) ? url.searchParams.get("tipo") : "";
  const pendientes = url.searchParams.get("ver") === "pendientes";
  const where = [], binds = [];
  if(tipo){ where.push("kind = ?" + (binds.length + 1)); binds.push(tipo); }
  if(pendientes){ where.push("reviewed = 0"); }
  const sql = "SELECT * FROM submissions" + (where.length ? " WHERE " + where.join(" AND ") : "") + " ORDER BY created_at DESC, id DESC LIMIT 200";
  const { results } = await env.DB.prepare(sql).bind(...binds).all();
  const counts = await env.DB.prepare(
    "SELECT kind, COUNT(*) AS n, SUM(CASE WHEN reviewed = 0 THEN 1 ELSE 0 END) AS p FROM submissions GROUP BY kind"
  ).all();
  const c = { mira:{ n:0, p:0 }, contacto:{ n:0, p:0 } };
  for(const r of counts.results){ c[r.kind] = { n:r.n, p:r.p || 0 }; }

  const here = url.pathname + url.search;
  const link = (t, v, label) => {
    const q = new URLSearchParams();
    if(t){ q.set("tipo", t); }
    if(v){ q.set("ver", v); }
    const href = "/admin" + (q.toString() ? "?" + q : "");
    const on = (t || "") === tipo && (v === "pendientes") === pendientes;
    return `<a class="pill${on ? " on" : ""}" href="${href}">${label}</a>`;
  };

  const list = results.length
    ? results.map(r => card(r, here)).join("")
    : `<p class="empty">No hay envíos ${pendientes ? "pendientes " : ""}todavía.</p>`;

  return page("Panel", `
    <header class="top">
      <div>
        <p class="kicker">16 Ball Creations · panel</p>
        <h1>Lo que <em>ha llegado</em></h1>
      </div>
      <p class="totals mono">MIRA ${c.mira.n} (${c.mira.p} sin revisar) · Contacto ${c.contacto.n} (${c.contacto.p} sin revisar)</p>
    </header>
    <nav class="filters">
      ${link("", "", "Todo")}${link("mira", "", "MIRA")}${link("contacto", "", "Contacto")}${link(tipo, "pendientes", "Solo sin revisar")}
    </nav>
    ${list}
  `);
}

function esc(s){
  return String(s == null ? "" : s).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
}
function list(v){ return Array.isArray(v) ? v.filter(Boolean).join(", ") : (v || ""); }
function row(label, value){
  return `<p><b>${esc(label)}</b>${value ? esc(value).replace(/\n/g, "<br>") : '<span class="none">Sin respuesta</span>'}</p>`;
}

function card(r, here){
  let d = {};
  try{ d = JSON.parse(r.data); }catch(e){}
  const when = new Date(r.created_at.replace(" ", "T") + "Z").toLocaleString("es-CO", { timeZone:"America/Bogota", dateStyle:"medium", timeStyle:"short" });
  let body;
  if(r.kind === "mira"){
    const tiene = list(d.tiene);
    body = `
      <div class="mira">
        <section><h3><i>M</i> Marca</h3>${row("Nombre", d.marca)}${row("Qué hace", d.queHace)}${row("Su historia", d.historia)}</section>
        <section><h3><i>I</i> Imagen</h3>${row("Ya cuenta con", tiene)}</section>
        <section><h3><i>R</i> Redes</h3>${row("Dónde encontrarla", d.enlaces)}</section>
        <section><h3><i>A</i> Alineación</h3>${row("Le habla a", [list(d.publico), d.publicoDetalle].filter(Boolean).join(", "))}${row("Quiere que sientan", list(d.objetivos))}</section>
      </div>
      <p class="who mono">Respondió ${esc(d.nombre)} · ${esc(d.contacto)}</p>`;
  } else {
    body = `
      <div class="contacto">
        ${row("Necesita", d.tipo || "Todavía no sabe qué necesita")}
        ${row("La idea", d.idea)}
      </div>
      <p class="who mono">Escribió ${esc(d.nombre)}${d.contacto ? " · " + esc(d.contacto) : ""}</p>`;
  }
  return `
    <article class="sub${r.reviewed ? " done" : ""}">
      <header>
        <span class="tag t-${r.kind}">${r.kind === "mira" ? "MIRA" : "Contacto"}</span>
        <h2>${esc(r.kind === "mira" ? (r.brand || r.name) : r.name)}</h2>
        <span class="when mono">${esc(when)}</span>
        <form method="post" action="/admin/revisado">
          <input type="hidden" name="id" value="${r.id}">
          <input type="hidden" name="revisado" value="${r.reviewed ? "0" : "1"}">
          <input type="hidden" name="volver" value="${esc(here)}">
          <button type="submit">${r.reviewed ? "Revisado ✓" : "Marcar como revisado"}</button>
        </form>
      </header>
      ${body}
    </article>`;
}

function page(title, content, status = 200){
  return new Response(`<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>${esc(title)} · 16 Ball Creations</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono&display=swap" rel="stylesheet">
<style>
  :root{--bg:#050606;--line:#25292c;--white:#fff;--bone:#ecebe6;--ash:#a1a4a5;--iron:#6e727a;--accent:#3ad389;
    --b1:#f4c20d;--b2:#4d7dff;--b3:#ff5c6e;--b4:#a375d8}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--bone);font:15px/1.5 Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  main{max-width:1100px;margin:0 auto;padding:40px 24px 80px}
  .mono{font-family:"JetBrains Mono",monospace;font-size:12px;color:var(--iron)}
  .kicker{margin:0 0 8px;font:12px "JetBrains Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--ash)}
  h1{margin:0;font:400 clamp(2.4rem,6vw,4rem)/1 "Instrument Serif",serif;color:var(--white)}
  h1 em{color:var(--accent)}
  .top{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap;margin-bottom:28px}
  .filters{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px}
  .pill{padding:7px 14px;border:1px solid var(--line);border-radius:999px;color:var(--ash);text-decoration:none;font:12px "JetBrains Mono",monospace}
  .pill.on{background:var(--accent);border-color:var(--accent);color:#000}
  .sub{border:1px solid var(--line);border-radius:18px;padding:22px 24px;margin-bottom:16px;background:rgba(255,255,255,.02)}
  .sub.done{opacity:.55}
  .sub header{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:16px}
  .sub h2{margin:0;font:400 1.8rem/1.1 "Instrument Serif",serif;color:var(--white)}
  .when{margin-left:auto}
  .tag{padding:3px 9px;border-radius:999px;font:11px "JetBrains Mono",monospace;letter-spacing:.06em;text-transform:uppercase;color:#000}
  .tag.t-mira{background:var(--accent)} .tag.t-contacto{background:var(--b2);color:#fff}
  form{margin:0}
  button{padding:7px 14px;border-radius:999px;border:1px solid var(--line);background:transparent;color:var(--white);cursor:pointer;font:500 13px Inter,sans-serif}
  .sub.done button{border-color:var(--accent);color:var(--accent)}
  .mira{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
  .mira section{padding:14px 16px;border:1px solid var(--line);border-radius:12px}
  .mira section:nth-child(1){--c:var(--b1)} .mira section:nth-child(2){--c:var(--b2)}
  .mira section:nth-child(3){--c:var(--b3)} .mira section:nth-child(4){--c:var(--b4)}
  h3{margin:0 0 10px;font:500 12px "JetBrains Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--c,var(--ash))}
  h3 i{font:italic 1.4rem "Instrument Serif",serif;margin-right:4px}
  .sub p{margin:0 0 10px}
  .sub p b{display:block;font:400 11px "JetBrains Mono",monospace;letter-spacing:.06em;text-transform:uppercase;color:var(--iron)}
  .none{color:#4a4e52;font-style:italic}
  .who{margin:14px 0 0 !important}
  .empty{color:var(--iron)}
  code{font-family:"JetBrains Mono",monospace;color:var(--accent)}
  @media (max-width:720px){.mira{grid-template-columns:1fr}.when{margin-left:0}}
</style></head><body><main>${content}</main></body></html>`, {
    status,
    headers:{ "Content-Type":"text/html; charset=utf-8", "Cache-Control":"no-store", "X-Robots-Tag":"noindex, nofollow" }
  });
}
