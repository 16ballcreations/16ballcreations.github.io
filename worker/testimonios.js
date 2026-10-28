/* Testimonios: lo que llega desde /testimonio/ y su revisión. */

import { clean, json } from "./comun/api.js";
import { MAX_BODY } from "./comun/config.js";
import { COPY_SCRIPT, adminPage, pendingPills, sectionHead } from "./comun/pagina.js";
import { esc, whenInBogota } from "./comun/util.js";

/* ---------- testimonials ---------- */

export const PUBLISH = ["nombre", "iniciales", "no"];

export async function receiveTestimonial(request, env, url){
  let body;
  try{
    const text = await request.text();
    if(text.length > MAX_BODY){ return json({ ok:false, error:"Demasiado largo" }, 413, request, url); }
    body = JSON.parse(text);
  }catch(e){
    return json({ ok:false, error:"No se pudo leer el envío" }, 400, request, url);
  }
  if(body && body.website){ return json({ ok:true }, 201, request, url); }
  const d = clean(body && body.data) || {};
  const nombre = String(d.nombre || "").slice(0, 160), impacto = String(d.impacto || "");
  const satisfaccion = parseInt(d.satisfaccion, 10), publicar = String(d.publicar || "");
  const sentimientos = Array.isArray(d.sentimientos) ? d.sentimientos.filter(x => typeof x === "string").slice(0, 3) : [];
  if(!nombre || impacto.length < 10){ return json({ ok:false, error:"Faltan tu nombre o tu respuesta" }, 400, request, url); }
  if(!(satisfaccion >= 1 && satisfaccion <= 5)){ return json({ ok:false, error:"Falta el nivel de satisfacción" }, 400, request, url); }
  if(!PUBLISH.includes(publicar)){ return json({ ok:false, error:"Falta elegir cómo aparecer" }, 400, request, url); }
  await env.DB.prepare(
    "INSERT INTO testimonials (nombre, marca, impacto, sentimientos, sentir_mas, satisfaccion, publicar) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)"
  ).bind(nombre, String(d.marca || "").slice(0, 160) || null, impacto, JSON.stringify(sentimientos), String(d.sentirMas || "").slice(0, 600) || null, satisfaccion, publicar).run();
  return json({ ok:true }, 201, request, url);
}

/* ---------- testimonials ---------- */
export async function testimonialsPage(env, url){
  const pendientes = url.searchParams.get("ver") === "pendientes";
  const { results } = await env.DB.prepare(
    "SELECT * FROM testimonials" + (pendientes ? " WHERE reviewed = 0" : "") + " ORDER BY created_at DESC, id DESC LIMIT 200"
  ).all();
  return adminPage(env, "testimonios", "Testimonios", `
    ${sectionHead("Clientes · testimonios", "Lo que <em>vivieron</em>", `<p class="totals mono">Se envían al cerrar un proyecto: /testimonio/?nombre=…&amp;marca=…</p>`)}
    ${pendingPills("/admin/testimonios", pendientes, "Solo sin revisar")}
    ${results.length ? results.map(testimonialCard).join("") : `<p class="empty">No hay testimonios ${pendientes ? "sin revisar " : ""}todavía.</p>`}
  `, 200, COPY_SCRIPT);
}

export const SATISFACTION = { 1:"No cumplió lo que esperaba", 2:"Le faltó algo", 3:"Cumplió", 4:"Me encantó", 5:"Superó lo que esperaba" };
export const APPEAR = { nombre:"Publicar con nombre y marca", iniciales:"Publicar solo con iniciales", no:"No publicar" };

export function testimonialCard(r){
  let feelings = [];
  try{ feelings = JSON.parse(r.sentimientos || "[]"); }catch(e){}
  const balls = [1, 2, 3, 4, 5].map(n => `<i class="dot b${n}${n > r.satisfaccion ? " off" : ""}"></i>`).join("");
  return `
    <article class="sub${r.reviewed ? " done" : ""}">
      <header>
        <span class="tag ${r.publicar === "no" ? "t-wait" : "t-ok"}">${esc(APPEAR[r.publicar])}</span>
        <h2>${esc(r.nombre)}</h2>
        <span class="when mono">${esc(r.marca || "")}</span>
      </header>
      <blockquote class="tquote">“${esc(r.impacto).replace(/\n/g, "<br>")}”</blockquote>
      <p class="mono tmeta"><span class="dots">${balls}</span> ${r.satisfaccion} de 5 · ${esc(SATISFACTION[r.satisfaccion])}</p>
      ${feelings.length || r.sentir_mas ? `<p class="mono tmeta">Se sintió: ${esc(feelings.join(" · "))}${r.sentir_mas ? (feelings.length ? " — " : "") + esc(r.sentir_mas) : ""}</p>` : ""}
      <p class="mono tmeta">${esc(whenInBogota(r.created_at))}</p>
      <div class="linkrow">
        <form method="post" action="/admin/testimonio/revisado"><input type="hidden" name="id" value="${r.id}"><input type="hidden" name="revisado" value="${r.reviewed ? "0" : "1"}"><button type="submit">${r.reviewed ? "Revisado ✓" : "Marcar como revisado"}</button></form>
        <form method="post" action="/admin/testimonio/borrar" data-confirm="¿Borrar este testimonio? No se puede recuperar."><input type="hidden" name="id" value="${r.id}"><button type="submit" class="danger">Borrar</button></form>
      </div>
    </article>`;
}
