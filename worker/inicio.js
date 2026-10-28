/* El inicio del panel: lo que te necesita hoy. */

import { adminPage, attention } from "./comun/pagina.js";
import { bogotaStamp, esc, todayIso } from "./comun/util.js";
import { MEDIOS, callWhen } from "./ventas/llamada.js";

/* ---------- home: what needs you today ---------- */
export async function dashboardPage(env){
  const a = await attention(env);
  const today = todayIso();
  const [{ results:due }, { results:unscheduled }, { results:unrecorded }] = await env.DB.batch([
    env.DB.prepare(
      "SELECT id, negocio, proxima_accion, proxima_fecha FROM prospects WHERE proxima_fecha IS NOT NULL AND proxima_fecha <= ?1 " +
      "AND etapa NOT IN ('cliente', 'descartado') ORDER BY proxima_fecha, rank LIMIT 8"
    ).bind(today),
    /* MIRAs of the last 30 days still waiting for their call to be scheduled */
    env.DB.prepare(
      "SELECT COUNT(*) AS n, SUM(CASE WHEN s.prospect_id IS NULL THEN 1 ELSE 0 END) AS sueltas, " +
      "SUM(CASE WHEN json_extract(s.data, '$.semaforo.color') = 'verde' THEN 1 ELSE 0 END) AS verdes FROM submissions s LEFT JOIN prospects p ON p.id = s.prospect_id " +
      "WHERE s.kind = 'mira' AND s.created_at >= datetime('now', '-30 days') AND (s.prospect_id IS NULL OR p.etapa = 'respondio')"
    ),
    /* calls whose time passed more than two hours ago and nobody recorded: the goal is zero */
    env.DB.prepare(
      "SELECT p.id, p.negocio, json_extract(e.data, '$.fecha') AS fecha, json_extract(e.data, '$.medio') AS medio " +
      "FROM prospect_events e JOIN prospects p ON p.id = e.prospect_id " +
      "WHERE e.tipo = 'reunion' AND e.data IS NOT NULL " +
      "AND e.id = (SELECT MAX(x.id) FROM prospect_events x WHERE x.prospect_id = e.prospect_id AND x.tipo = 'reunion' AND x.data IS NOT NULL) " +
      "AND json_extract(e.data, '$.estado') = 'agendada' AND json_extract(e.data, '$.fecha') <= ?1 ORDER BY fecha"
    ).bind(bogotaStamp(120))
  ]);
  const miraWaiting = unscheduled[0].n || 0, miraLoose = unscheduled[0].sueltas || 0, miraGreen = unscheduled[0].verdes || 0;
  const tile = (href, label, big, line, hot) => `
    <a class="tile${hot ? " hot" : ""}" href="${href}"><span class="tile-label">${label}</span><b>${big}</b><span class="tile-line">${line}</span></a>`;
  const plural = (n, one, many) => n + " " + (n === 1 ? one : many);
  return adminPage(env, "inicio", "Panel", `
    <header class="top"><div><p class="kicker">16 Ball Creations · panel</p><h1>Lo que <em>te espera</em></h1></div></header>
    <section class="tiles">
      ${tile("/admin/prospectos?ver=hoy", "Prospectos para hoy", a.prospectos.p, `${plural(a.prospectos.vivos, "conversación abierta", "conversaciones abiertas")} · ${plural(a.prospectos.nuevos, "por contactar", "por contactar")}`, a.prospectos.p)}
      ${tile("/admin/contacto?ver=pendientes", "Contacto sin revisar", a.contacto.p, plural(a.contacto.n, "mensaje en total", "mensajes en total"), a.contacto.p)}
      ${tile(miraGreen ? "/admin/mira?ver=verdes" : "/admin/mira?ver=sinagendar", "MIRA sin agendar", miraWaiting, [miraGreen ? plural(miraGreen, "verde: llámalo hoy", "verdes: llámalos hoy") : "", miraLoose ? plural(miraLoose, "sin prospecto", "sin prospecto") : "", "últimos 30 días"].filter(Boolean).join(" · ").replace(/^ú/, "Ú"), miraWaiting)}
      ${tile(unrecorded.length ? "/admin/prospecto?id=" + encodeURIComponent(unrecorded[0].id) + "#llamada" : "/admin/prospectos", "Llamadas sin registrar", unrecorded.length, unrecorded.length ? "La meta es 0" : "Al día", unrecorded.length)}
      ${tile("/admin/mira?ver=pendientes", "MIRA sin revisar", a.mira.p, plural(a.mira.n, "recibida", "recibidas"), 0)}
      ${tile("/admin/autorizaciones?ver=pendientes", "Autorizaciones sin firmar", a.autorizaciones.p, plural(a.autorizaciones.n, "creada", "creadas"), 0)}
      ${tile("/admin/testimonios?ver=pendientes", "Testimonios sin revisar", a.testimonios.p, plural(a.testimonios.n, "recibido", "recibidos"), a.testimonios.p)}
      ${tile("/admin/prospectos", "Clientes desde prospectos", a.prospectos.clientes, plural(a.prospectos.n, "prospecto en la base", "prospectos en la base"), 0)}
    </section>
    ${unrecorded.length ? `
    <section class="sub">
      <h3>Llamadas sin registrar</h3>
      <ul class="timeline">${unrecorded.map(c => `<li><a class="biz" href="/admin/prospecto?id=${encodeURIComponent(c.id)}#llamada">${esc(c.negocio)}</a>
        <span class="mono due"> · ${esc(callWhen(c.fecha))} · ${esc(MEDIOS[c.medio] || c.medio || "")}</span></li>`).join("")}</ul>
    </section>` : ""}
    <section class="sub">
      <h3>Seguimientos de prospectos para hoy</h3>
      ${due.length ? `<ul class="timeline">${due.map(r => `<li><a class="biz" href="/admin/prospecto?id=${encodeURIComponent(r.id)}">${esc(r.negocio)}</a>
        <span class="mono${r.proxima_fecha < today ? " due" : ""}"> · ${esc(r.proxima_accion || "Seguimiento")} · ${esc(r.proxima_fecha)}</span></li>`).join("")}</ul>`
        : `<p class="empty">Nada pendiente para hoy.</p>`}
    </section>`);
}
