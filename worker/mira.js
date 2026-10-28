/* La MIRA y el formulario de contacto: lo que llega, el semáforo y el vínculo con los prospectos. */

import { clean, json } from "./comun/api.js";
import { MAX_BODY, SITE } from "./comun/config.js";
import { COPY_SCRIPT, adminPage, pendingPills, sectionHead } from "./comun/pagina.js";
import { esc, list, plain, row, todayIso } from "./comun/util.js";
import { BEFORE_CALL, STAGES, ballTag, stageTag } from "./ventas/modelo.js";

export async function receive(request, env, url, kind){
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

  /* a MIRA may come from a prospect's personal link (?t=) and says where it
     came from (?o=); neither is part of the answers */
  const token = kind === "mira" && /^[a-z2-9]{6}$/.test(data.token || "") ? data.token : null;
  const origen = kind === "mira" && ORIGINS[data.origen] ? data.origen : null;
  delete data.token; delete data.origen;
  if(kind === "mira"){ data.semaforo = qualify(data.proyecto); }

  const saved = await env.DB.prepare(
    "INSERT INTO submissions (kind, name, brand, contact, data, origen) VALUES (?1, ?2, ?3, ?4, ?5, ?6) RETURNING id"
  ).bind(kind, name, brand, contact, JSON.stringify(data), origen).first();

  /* only the personal link ties it to a prospect on its own; anything else
     waits in the panel to be linked by hand. The answer is the same either
     way, so the page never tells whether a code exists. */
  if(token && saved){
    const p = await env.DB.prepare("SELECT id, etapa FROM prospects WHERE mira_token = ?1").bind(token).first();
    if(p){ await env.DB.batch(linkMira(env, saved.id, p, "enlace", origen)); }
  }

  return json({ ok:true }, 201, request, url);
}

/* ---------- a MIRA and its prospect ---------- */

export const ORIGINS = { ig:"Instagram", bio:"la bio de Instagram", historia:"una historia", web:"el sitio", referido:"un referido",
  whatsapp:"WhatsApp", facebook:"Facebook", visita:"una visita", correo:"un correo" };

/* The same steps for the personal link and for a link made by hand: the MIRA
   points to the prospect, the timeline says so, and an early stage moves to
   "respondió" with the call to schedule today. A prospect already past it
   (reunión, propuesta, cliente) keeps its stage. */
export function linkMira(env, subId, p, how, origen){
  const log = (tipo, texto) => env.DB.prepare("INSERT INTO prospect_events (prospect_id, tipo, texto) VALUES (?1, ?2, ?3)").bind(p.id, tipo, texto);
  const out = [
    env.DB.prepare("UPDATE submissions SET prospect_id = ?1, vinculo = ?2 WHERE id = ?3").bind(p.id, how, subId),
    log("nota", `MIRA recibida · ${how === "enlace" ? "enlace personal" : "vinculada a mano"} · origen: ${ORIGINS[origen] || "sin dato"} · /admin/mira#m${subId}`)
  ];
  if(BEFORE_CALL.includes(p.etapa)){
    if(p.etapa !== "respondio"){
      out.push(log("etapa", STAGES[p.etapa] + " → " + STAGES.respondio + (p.etapa === "descartado" ? " · reabierto: llenó la MIRA" : "")));
    }
    out.push(env.DB.prepare(
      "UPDATE prospects SET etapa = 'respondio', proxima_accion = 'Agendar llamada', proxima_fecha = ?1, updated_at = datetime('now') WHERE id = ?2"
    ).bind(todayIso(), p.id));
  } else {
    out.push(env.DB.prepare("UPDATE prospects SET updated_at = datetime('now') WHERE id = ?1").bind(p.id));
  }
  return out;
}
export function igHandles(text){
  const out = new Set(), t = String(text || "").toLowerCase();
  for(const m of t.matchAll(/instagram\.com\/([a-z0-9._]{2,30})/g)){ out.add(m[1].replace(/\.+$/, "")); }
  for(const m of t.matchAll(/(?:^|[\s,(])@([a-z0-9._]{2,30})/g)){ out.add(m[1].replace(/\.+$/, "")); }
  return out;
}
/* how much a prospect looks like the brand that filled in a MIRA: the same
   Instagram is near certain, the same name is strong, shared words are weak */
export function likeness(d, p){
  let score = 0;
  const handles = igHandles(d.enlaces), theirs = igHandles(p.instagram);
  for(const h of handles){ if(theirs.has(h)){ score += 100; } }
  const brand = plain(d.marca), biz = plain(p.negocio);
  if(brand && biz){
    if(brand === biz){ score += 80; }
    else if(brand.length > 3 && biz.length > 3 && (biz.includes(brand) || brand.includes(biz))){ score += 40; }
    const words = new Set(biz.split(" ").filter(w => w.length > 2));
    for(const w of brand.split(" ")){ if(w.length > 2 && words.has(w)){ score += 15; } }
  }
  return score;
}

/* a short code for the personal MIRA link: no 0/o or 1/l to misread */
export const CODE_CHARS = "abcdefghijkmnpqrstuvwxyz23456789";
export function miraCode(){
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return [...bytes].map(b => CODE_CHARS[b % CODE_CHARS.length]).join("");
}
/* the code is made the first time the prospect's page asks for its link */
export async function miraTokenFor(env, r){
  if(r.mira_token){ return r.mira_token; }
  for(let i = 0; i < 4; i++){
    try{
      await env.DB.prepare("UPDATE prospects SET mira_token = ?1 WHERE id = ?2 AND mira_token IS NULL").bind(miraCode(), r.id).run();
      const back = await env.DB.prepare("SELECT mira_token FROM prospects WHERE id = ?1").bind(r.id).first();
      if(back && back.mira_token){ return back.mira_token; }
    }catch(e){ /* the code was taken: try another one */ }
  }
  return null;
}

/* ---------- MIRA and contact ---------- */
export async function submissionsPage(env, url, kind){
  const ver = url.searchParams.get("ver");
  const pendientes = ver === "pendientes";
  const isMira = kind === "mira";
  /* "sin agendar": the MIRAs of the last 30 days whose call is still to be
     scheduled, because nobody linked them or their prospect is in "respondió" */
  const unscheduled = isMira && ver === "sinagendar";
  const greens = isMira && ver === "verdes";
  const { results } = await env.DB.prepare(
    "SELECT s.*, p.negocio AS p_negocio, p.etapa AS p_etapa FROM submissions s LEFT JOIN prospects p ON p.id = s.prospect_id WHERE s.kind = ?1" +
    (pendientes ? " AND s.reviewed = 0" : "") +
    (unscheduled ? " AND s.created_at >= datetime('now', '-30 days') AND (s.prospect_id IS NULL OR p.etapa = 'respondio')" : "") +
    (greens ? " AND json_extract(s.data, '$.semaforo.color') = 'verde'" : "") +
    " ORDER BY s.created_at DESC, s.id DESC LIMIT 200"
  ).bind(kind).all();
  const here = url.pathname + url.search;
  const pills = isMira
    ? `<nav class="filters"><a class="pill${!pendientes && !unscheduled && !greens ? " on" : ""}" href="/admin/mira">Todo</a><a class="pill${pendientes ? " on" : ""}" href="/admin/mira?ver=pendientes">Solo sin revisar</a><a class="pill${unscheduled ? " on" : ""}" href="/admin/mira?ver=sinagendar">Sin agendar</a><a class="pill${greens ? " on" : ""}" href="/admin/mira?ver=verdes">Verdes</a></nav>`
    : pendingPills("/admin/" + kind, pendientes, "Solo sin revisar");
  return adminPage(env, kind, isMira ? "MIRA" : "Contacto", `
    ${sectionHead(isMira ? "Clientes · MIRA" : "Lo que llega · contacto", isMira ? "Las <em>MIRA</em>" : "Lo que <em>escriben</em>",
      `<p class="totals mono">${isMira ? "Marca, Imagen, Redes y Alineación: el primer filtro, antes de la llamada" : "El formulario de contacto del sitio"}</p>`)}
    ${pills}
    ${results.length ? (isMira ? `<div class="mlist">${results.map(r => miraRow(r, here)).join("")}</div>` : results.map(r => card(r, here)).join("")) : `<p class="empty">No hay ${isMira ? "MIRA" : "mensajes"} ${pendientes ? "sin revisar " : unscheduled ? "sin agendar " : greens ? "verdes " : ""}todavía.</p>`}
  `, 200, COPY_SCRIPT + (isMira ? MIRA_LIST_SCRIPT : ""));
}

/* linking by hand: the prospects that look like the brand first, then a search */
export async function linkMiraPage(env, url){
  const id = parseInt(url.searchParams.get("id"), 10);
  const sub = id ? await env.DB.prepare("SELECT * FROM submissions WHERE id = ?1 AND kind = 'mira'").bind(id).first() : null;
  if(!sub){ return Response.redirect(url.origin + "/admin/mira", 303); }
  if(sub.prospect_id){ return Response.redirect(url.origin + "/admin/mira#m" + id, 303); }
  let d = {};
  try{ d = JSON.parse(sub.data); }catch(e){}
  const q = (url.searchParams.get("q") || "").trim().slice(0, 80);
  const all = (await env.DB.prepare(
    "SELECT id, campaign, code, negocio, categoria, barrio, instagram, etapa, prioridad, score, bola FROM prospects"
  ).all()).results;
  const suggested = all.map(p => ({ p, n:likeness(d, p) })).filter(x => x.n >= 15).sort((a, b) => b.n - a.n).slice(0, 5);
  const needle = plain(q);
  const found = needle ? all.filter(p => plain([p.negocio, p.instagram, p.code, p.barrio, p.categoria].join(" ")).includes(needle)).slice(0, 20) : [];
  const item = (p, why) => `
    <li class="pick">
      <div>${ballTag(p.prioridad, p.score, false, p.bola)} <a class="biz" href="/admin/prospecto?id=${encodeURIComponent(p.id)}" target="_blank" rel="noopener">${esc(p.negocio)}</a>
        <span class="mono sub2">${esc(p.campaign)} · ${esc(p.code)}${p.barrio ? " · " + esc(p.barrio) : ""}${p.instagram ? " · " + esc(p.instagram.replace(/^https?:\/\/(www\.)?/, "")) : ""}${why ? " · " + why : ""}</span></div>
      <span>${stageTag(p.etapa)}</span>
      <form method="post" action="/admin/mira/vincular"><input type="hidden" name="id" value="${id}"><input type="hidden" name="prospect" value="${esc(p.id)}"><button type="submit" class="go">Vincular a este</button></form>
    </li>`;
  const why = n => n >= 100 ? "mismo Instagram" : n >= 80 ? "mismo nombre" : n >= 40 ? "nombre parecido" : "palabras en común";
  return adminPage(env, "mira", "Vincular MIRA", `
    <header class="top"><div><p class="kicker"><a href="/admin/mira#m${id}">← Las MIRA</a> · vincular</p><h1>¿De quién es <em>esta MIRA</em>?</h1>
      <p class="mono">${esc(d.marca || sub.brand || "")} · respondió ${esc(d.nombre || sub.name || "")} · ${esc(d.contacto || sub.contact || "")}${d.enlaces ? " · " + esc(d.enlaces) : ""}</p></div></header>
    <section class="sub">
      <h3>Se parecen</h3>
      ${suggested.length ? `<ul class="picks">${suggested.map(x => item(x.p, why(x.n))).join("")}</ul>` : `<p class="empty">Ningún prospecto se parece por nombre ni por Instagram.</p>`}
      <p class="mono hintline">Son sugerencias: nada se vincula hasta que elijas uno.</p>
    </section>
    <section class="sub">
      <h3>Buscar</h3>
      <form method="get" action="/admin/mira/vincular" class="search"><input type="hidden" name="id" value="${id}"><input name="q" value="${esc(q)}" placeholder="Negocio, Instagram, código o barrio" autofocus></form>
      ${q ? (found.length ? `<ul class="picks">${found.map(p => item(p, "")).join("")}</ul>` : `<p class="empty">Nada con «${esc(q)}».</p>`) : ""}
    </section>
    <section class="sub">
      <h3>No está en la base</h3>
      <p>Si es alguien nuevo, crea el prospecto con los datos de la MIRA. Queda en la campaña de entrantes del mes, en «Respondió».</p>
      <div class="linkrow"><a class="pill new" href="/admin/prospecto/nuevo?mira=${id}">+ Crear prospecto con esta MIRA</a></div>
    </section>`);
}

export async function linkMiraByHand(request, env, url){
  const form = await request.formData();
  const id = parseInt(form.get("id"), 10);
  const sub = id ? await env.DB.prepare("SELECT id, prospect_id, origen FROM submissions WHERE id = ?1 AND kind = 'mira'").bind(id).first() : null;
  const p = await env.DB.prepare("SELECT id, etapa FROM prospects WHERE id = ?1").bind(String(form.get("prospect") || "")).first();
  if(sub && !sub.prospect_id && p){ await env.DB.batch(linkMira(env, sub.id, p, "manual", sub.origen)); }
  return Response.redirect(url.origin + "/admin/mira#m" + (id || ""), 303);
}

/* a link made by mistake comes undone; the stage is left for Renne to judge */
export async function unlinkMira(request, env, url){
  const form = await request.formData();
  const id = parseInt(form.get("id"), 10);
  const sub = id ? await env.DB.prepare("SELECT id, prospect_id FROM submissions WHERE id = ?1 AND kind = 'mira'").bind(id).first() : null;
  if(sub && sub.prospect_id){
    await env.DB.batch([
      env.DB.prepare("UPDATE submissions SET prospect_id = NULL, vinculo = NULL WHERE id = ?1").bind(id),
      env.DB.prepare("INSERT INTO prospect_events (prospect_id, tipo, texto) VALUES (?1, 'nota', ?2)")
        .bind(sub.prospect_id, `MIRA desvinculada (/admin/mira#m${id}). La etapa no cambió.`)
    ]);
  }
  return Response.redirect(url.origin + "/admin/mira#m" + (id || ""), 303);
}

/* ---------- the MIRA's traffic light ----------
   Shot 6 of the MIRA ("Tu proyecto") asks four quick questions: what to solve
   first, how much they plan to invest, who decides and when to start. The
   answers arrive as codes; this table gives each code its label and its
   points, so the ranges can change with the plan tiers without touching the
   pages' logic (change the labels here and in the two MIRA pages, mira/ and
   en/mira/). Out of 100: green from 70 (call today), yellow from 40 (call
   and follow up), red below (give them something useful). Under the entry
   range and "later" is red whatever the rest says. */
export const QUALIFY = {
  resolver: { label:"Quiere resolver primero", opts:{
    coherencia:["Que su marca se sienta como una sola", 25], identidad:["Renovar su logo e identidad", 25], web:["Tener una página web", 25],
    tienda:["Tener una tienda en línea", 25], redes:["Ordenar sus redes", 25], sistema:["Organizar su negocio", 25], nose:["Todavía no lo sabe", 10] } },
  inversion: { label:"Piensa invertir", opts:{
    r0:[{ es:"Menos de $700.000", en:"Menos de US$200" }, 0],
    r1:[{ es:"$700.000 a $3.000.000", en:"US$200 a US$800" }, 30],
    r2:[{ es:"$3.000.000 a $6.000.000", en:"US$800 a US$1.600" }, 30],
    r3:[{ es:"Más de $6.000.000", en:"Más de US$1.600" }, 30],
    hablar:["Prefiere hablarlo en la llamada", 15] } },
  decide: { label:"Decide", opts:{ yo:["Solo", 20], socio:["Con su socio o pareja", 12], equipo:["Un equipo o junta", 8] } },
  cuando: { label:"Quiere empezar", opts:{ ya:["Este mes", 25], pronto:["En 1 a 3 meses", 15], despues:["Más adelante: está explorando", 0] } }
};
/* the gift for the reds: the Google Business Profile guide, in their language */
export const GIFT = {
  es:{ label:"Guía: tu perfil de empresa en Google", url:SITE + "/assets/guias/perfil-de-empresa-google.pdf" },
  en:{ label:"Guide: your Google Business Profile (en inglés)", url:SITE + "/assets/guias/google-business-profile.pdf" }
};
export const LIGHTS = {
  verde:{ label:"Verde", what:"Llámalo hoy" },
  amarillo:{ label:"Amarillo", what:"Llamada y seguimiento" },
  rojo:{ label:"Rojo", what:"Regálale algo útil" }
};
export function qualify(p){
  if(!p || typeof p !== "object"){ return null; }
  let puntos = 0, answered = 0;
  for(const [k, q] of Object.entries(QUALIFY)){
    const o = q.opts[p[k]];
    if(o){ puntos += o[1]; answered++; }
  }
  if(!answered){ return null; }
  const color = (p.inversion === "r0" && p.cuando === "despues") || puntos < 40 ? "rojo" : puntos >= 70 ? "verde" : "amarillo";
  return { puntos, color };
}
export function qualifyLabel(key, code, lang){
  const o = QUALIFY[key] && QUALIFY[key].opts[code];
  if(!o){ return code || ""; }
  return typeof o[0] === "object" ? o[0][lang === "en" ? "en" : "es"] : o[0];
}
export function lightTag(d){
  const l = d.semaforo && LIGHTS[d.semaforo.color];
  return l ? `<span class="tag t-${d.semaforo.color}" title="${l.what}">${l.label} · ${d.semaforo.puntos}</span>` : "";
}

/* the four parts of a MIRA, as the panel shows them, and the project. With a
   key they come as tabs (the MIRA list, one at a time); without one, as a
   grid (the prospect's page, everything in view for the call) */
export function miraAnswers(d, tabs){
  const p = d.proyecto || null;
  const light = d.semaforo && LIGHTS[d.semaforo.color];
  const project = p ? `
        <section class="mira-proj"><h3><i>6</i> Su proyecto</h3>
          ${light ? `<p class="light l-${d.semaforo.color}"><b>Semáforo</b>${light.label} · ${d.semaforo.puntos} de 100 · ${light.what}${d.semaforo.color === "rojo" ? ": envíale la guía de su perfil de Google" : ""}</p>` : ""}
          ${d.semaforo && d.semaforo.color === "rojo" ? (g => `<div class="linkrow"><a class="pill go-chat" href="${g.url}" target="_blank" rel="noopener">${g.label}</a><button type="button" data-copy="${g.url}" data-label="Copiar enlace de la guía">Copiar enlace de la guía</button></div>`)(GIFT[d.idioma === "en" ? "en" : "es"]) : ""}
          ${Object.entries(QUALIFY).map(([k, q]) => row(q.label, qualifyLabel(k, p[k], d.idioma))).join("")}
          ${p.decide === "socio" ? `<p class="mono hintline">Decide con alguien más: invita a los dos a la llamada.</p>` : ""}
        </section>` : "";
  const parts = [
    ["m", "M", "Marca", `${row("Nombre", d.marca)}${row("Qué hace", d.queHace)}${row("Su historia", d.historia)}`],
    ["i", "I", "Imagen", row("Ya cuenta con", list(d.tiene))],
    ["r", "R", "Redes", row("Dónde encontrarla", d.enlaces)],
    ["a", "A", "Alineación", `${row("Le habla a", [list(d.publico), d.publicoDetalle].filter(Boolean).join(", "))}${row("Quiere que sientan", list(d.objetivos))}`]
  ];
  if(!tabs){
    return `
      <div class="mira">
${parts.map(([, l, name, body]) => `        <section><h3><i>${l}</i> ${name}</h3>${body}</section>`).join("\n")}${project}
      </div>`;
  }
  /* tabs without a script: one radio per tab, the checked one shows its pane */
  if(project){ parts.push(["p", "6", "Proyecto", project.replace(/^\s*<section class="mira-proj"><h3><i>6<\/i> Su proyecto<\/h3>/, "").replace(/<\/section>\s*$/, "")]); }
  return `
      <div class="mtabs">
${parts.map(([k, l, name], i) => `        <input type="radio" class="mt-${k}" name="mt${tabs}" id="mt${tabs}${k}"${i === 0 ? " checked" : ""}><label for="mt${tabs}${k}" class="mt-l-${k}"><i>${l}</i> ${name}</label>`).join("\n")}
        <div class="mpanes">
${parts.map(([k, , , body]) => `          <section class="mp mp-${k}${k === "p" ? " mira-proj" : ""}">${body}</section>`).join("\n")}
        </div>
      </div>`;
}

/* where a MIRA came from and whose it is, with what can be done about it */
export function miraLinkLine(r){
  const origin = `<span class="tag t-net">${r.origen ? "Desde " + esc(ORIGINS[r.origen] || r.origen) : "Sin origen"}</span>`;
  if(r.prospect_id){
    return `<div class="mlink">${origin}
      <span class="tag t-ok">${r.vinculo === "enlace" ? "Enlace personal" : "Vinculada a mano"}</span>
      <a class="biz" href="/admin/prospecto?id=${encodeURIComponent(r.prospect_id)}">${esc(r.p_negocio || r.prospect_id)}</a>${r.p_etapa ? " " + stageTag(r.p_etapa) : ""}
      <form method="post" action="/admin/mira/desvincular" data-confirm="¿Desvincular esta MIRA de ${esc(r.p_negocio || "su prospecto")}? La etapa del prospecto no cambia.">
        <input type="hidden" name="id" value="${r.id}"><button type="submit">Desvincular</button></form>
    </div>`;
  }
  return `<div class="mlink">${origin}<span class="tag t-wait">Sin prospecto</span>
      <a class="pill" href="/admin/mira/vincular?id=${r.id}">Vincular a un prospecto</a>
      <a class="pill" href="/admin/prospecto/nuevo?mira=${r.id}">Crear prospecto</a>
    </div>`;
}

/* a MIRA in the list: one line with what decides the call (light, brand,
   who, prospect, date, reviewed), and its details when opened */
export function miraRow(r, here){
  let d = {};
  try{ d = JSON.parse(r.data); }catch(e){}
  const when = new Date(r.created_at.replace(" ", "T") + "Z").toLocaleString("es-CO", { timeZone:"America/Bogota", dateStyle:"medium", timeStyle:"short" });
  const owner = r.prospect_id ? `<span class="mr-biz">${esc(r.p_negocio || r.prospect_id)}</span>${r.p_etapa ? " " + stageTag(r.p_etapa) : ""}` : `<span class="tag t-wait">Sin prospecto</span>`;
  return `
    <details class="mrow${r.reviewed ? " done" : ""}" id="m${r.id}">
      <summary>
        <span class="mr-light">${lightTag(d) || '<span class="tag t-none">Sin semáforo</span>'}</span>
        <span class="mr-name"><b>${esc(r.brand || d.marca || r.name)}</b><span class="mono">${esc(d.nombre || r.name)}${d.idioma === "en" ? " · en inglés" : ""}</span></span>
        <span class="mr-owner">${owner}</span>
        <span class="mr-when mono">${esc(when)}</span>
        <span class="mr-state mono">${r.reviewed ? "Revisada ✓" : '<i class="dot"></i>Sin revisar'}</span>
      </summary>
      <div class="mrow-body">
        ${miraLinkLine(r)}
        ${miraAnswers(d, r.id)}
        <div class="mrow-foot">
          <p class="who mono">Respondió ${esc(d.nombre)} · ${esc(d.contacto)}</p>
          <form method="post" action="/admin/revisado">
            <input type="hidden" name="id" value="${r.id}">
            <input type="hidden" name="revisado" value="${r.reviewed ? "0" : "1"}">
            <input type="hidden" name="volver" value="${esc(here)}#m${r.id}">
            <button type="submit">${r.reviewed ? "Revisada ✓ · deshacer" : "Marcar como revisada"}</button>
          </form>
        </div>
      </div>
    </details>`;
}

/* a link to /admin/mira#m12 opens that MIRA */
export const MIRA_LIST_SCRIPT = `<script>
(function(){
  function openHash(){
    var el = location.hash && document.getElementById(location.hash.slice(1));
    if(el && el.tagName === "DETAILS"){ el.open = true; el.scrollIntoView({ block:"start" }); }
  }
  openHash(); window.addEventListener("hashchange", openHash);
})();
</script>`;

export function card(r, here){
  let d = {};
  try{ d = JSON.parse(r.data); }catch(e){}
  const when = new Date(r.created_at.replace(" ", "T") + "Z").toLocaleString("es-CO", { timeZone:"America/Bogota", dateStyle:"medium", timeStyle:"short" });
  let body;
  if(r.kind === "mira"){
    body = `${miraLinkLine(r)}${miraAnswers(d)}
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
    <article class="sub${r.reviewed ? " done" : ""}" id="${r.kind === "mira" ? "m" : "c"}${r.id}">
      <header>
        <span class="tag t-${r.kind}">${r.kind === "mira" ? "MIRA" : "Contacto"}</span>${d.idioma === "en" ? `<span class="tag t-net" title="Llegó desde la versión en inglés del sitio: respóndele en inglés">En inglés</span>` : ""}${r.kind === "mira" ? lightTag(d) : ""}
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
