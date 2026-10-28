/* Ventas · los prospectos: lista, ficha, cambios, alta a mano y embudo en CSV. */

import { SITE } from "../comun/config.js";
import { COPY_SCRIPT, adminPage } from "../comun/pagina.js";
import { esc, plusDays, plusWorkdays, slug, todayIso, whenInBogota } from "../comun/util.js";
import { igHandles, linkMira, miraAnswers, miraTokenFor, qualifyLabel } from "../mira.js";
import { ATTENDED, MEDIOS, OUTCOME, PACKAGES, TEMPERATURE, callBlock, callWhen, lastCall } from "./llamada.js";
import { GEO, LEAFLET, MINI_MAP_SCRIPT } from "./mapa.js";
import { BALLS, BALL_SQL, BEFORE_CALL, EVENTS, NETWORK, OLD_PRIORITY, STAGES, ballOf, ballTag, campaignParts, campaignPicker, channelOptions, originOfChannel, stageTag } from "./modelo.js";

export async function prospectsPage(env, url){
  const campaigns = (await env.DB.prepare(
    "SELECT campaign, COUNT(*) AS n FROM prospects GROUP BY campaign ORDER BY campaign DESC"
  ).all()).results;
  const head = (h1, extra = "") => `
    <header class="top">
      <div>
        <p class="kicker">Ventas · prospectos</p>
        <h1>${h1}</h1>
      </div>
      ${extra}
    </header>`;
  if(!campaigns.length){
    return adminPage(env, "prospectos", "Prospectos", head("Todavía <em>no hay prospectos</em>") + `
      <p class="empty">Carga una campaña desde su carpeta privada:<br>
      <code>node scripts/prospectos-sql.mjs prospectos/&lt;campaña&gt;</code> y después
      <code>npx wrangler d1 execute 16bc --remote --file tmp/prospectos-&lt;campaña&gt;.sql</code></p>
      <p><a class="pill new" href="/admin/prospecto/nuevo">+ Agregar uno a mano</a></p>`);
  }

  const p = url.searchParams;
  const campaign = campaigns.some(c => c.campaign === p.get("c")) ? p.get("c") : campaigns[0].campaign;
  const bola = BALLS[p.get("bola")] ? p.get("bola") : (OLD_PRIORITY[p.get("prioridad")] || "");
  const etapa = STAGES[p.get("etapa")] ? p.get("etapa") : "";
  const hoy = p.get("ver") === "hoy";
  const text = (p.get("q") || "").trim().slice(0, 80);
  const today = todayIso();

  const where = ["campaign = ?1"], binds = [campaign];
  if(bola){ where.push(BALL_SQL + " = " + Number(bola)); }
  if(etapa){ binds.push(etapa); where.push("etapa = ?" + binds.length); }
  if(hoy){ binds.push(today); where.push("proxima_fecha IS NOT NULL AND proxima_fecha <= ?" + binds.length + " AND etapa NOT IN ('cliente', 'descartado')"); }
  if(text){ binds.push("%" + text + "%"); const n = binds.length; where.push(`(negocio LIKE ?${n} OR barrio LIKE ?${n} OR categoria LIKE ?${n} OR code LIKE ?${n} OR canal LIKE ?${n} OR proxima_accion LIKE ?${n})`); }
  const { results } = await env.DB.prepare(
    "SELECT id, code, rank, prioridad, score, bola, negocio, categoria, barrio, canal, enlace, etapa, proxima_accion, proxima_fecha FROM prospects WHERE " +
    where.join(" AND ") + " ORDER BY " + BALL_SQL + ", rank LIMIT 300"
  ).bind(...binds).all();

  const stages = (await env.DB.prepare(
    "SELECT etapa, COUNT(*) AS n FROM prospects WHERE campaign = ?1 GROUP BY etapa"
  ).bind(campaign).all()).results;
  const sc = Object.fromEntries(stages.map(s => [s.etapa, s.n]));
  const due = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM prospects WHERE campaign = ?1 AND proxima_fecha IS NOT NULL AND proxima_fecha <= ?2 AND etapa NOT IN ('cliente', 'descartado')"
  ).bind(campaign, today).first();

  const href = changes => {
    const q = new URLSearchParams({ c:campaign });
    const cur = { bola, etapa, q:text, ver:hoy ? "hoy" : "" };
    for(const [k, v] of Object.entries({ ...cur, ...changes })){ if(v){ q.set(k, v); } }
    return "/admin/prospectos?" + q;
  };
  const pill = (changes, label, on) => `<a class="pill${on ? " on" : ""}" href="${href(changes)}">${label}</a>`;

  const rows = results.map(r => `
    <tr>
      <td class="mono">${r.rank ?? ""}</td>
      <td>${ballTag(r.prioridad, r.score, false, r.bola)}</td>
      <td><a class="biz" href="/admin/prospecto?id=${encodeURIComponent(r.id)}">${esc(r.negocio)}</a><span class="mono sub2">${esc(r.code)} · ${esc(r.categoria || "")}</span></td>
      <td>${esc(r.barrio || "")}</td>
      <td>${r.enlace ? `<a href="${esc(r.enlace)}" target="_blank" rel="noopener">${esc(r.canal)}</a>` : esc(r.canal || "")}</td>
      <td>${stageTag(r.etapa)}</td>
      <td class="mono${r.proxima_fecha && r.proxima_fecha <= today ? " due" : ""}">${esc(r.proxima_accion || "")}${r.proxima_fecha ? "<br>" + esc(r.proxima_fecha) : ""}</td>
    </tr>`).join("");

  return adminPage(env, "prospectos", "Prospectos", head("Los <em>prospectos</em>", `
      <a class="pill new addp" href="/admin/prospecto/nuevo?c=${encodeURIComponent(campaign)}">+ Nuevo prospecto</a>
      <div class="totals mono">${campaignPicker(campaigns, campaign, "/admin/prospectos")}
      <a href="/admin/recursos">Recursos de las campañas →</a></div>`) + `
    <nav class="pipeline">
      ${Object.entries(STAGES).map(([k, label]) => `<a class="${etapa === k ? "on" : ""}" href="${href({ etapa:etapa === k ? "" : k })}"><b>${sc[k] || 0}</b>${label}</a>`).join("")}
      <a class="${hoy ? "on" : ""} today" href="${href({ ver:hoy ? "" : "hoy" })}"><b>${due.n || 0}</b>Para hoy</a>
    </nav>
    <nav class="filters">
      ${pill({ bola:"" }, "Todas", !bola)}
      ${Object.keys(BALLS).map(n => `<a class="pill ballpill${bola === n ? " on" : ""}" href="${href({ bola:n })}" title="${BALLS[n].label}"><i class="pb pb${n}"><b>${n}</b></i>${BALLS[n].label}</a>`).join("")}
      <form method="get" action="/admin/prospectos" class="search">
        <input type="hidden" name="c" value="${esc(campaign)}">
        ${bola ? `<input type="hidden" name="bola" value="${esc(bola)}">` : ""}
        ${etapa ? `<input type="hidden" name="etapa" value="${esc(etapa)}">` : ""}
        <input name="q" value="${esc(text)}" placeholder="Buscar negocio, barrio, categoría, canal o próximo paso">
      </form>
    </nav>
    ${results.length ? `
    <div class="tablewrap"><table class="ptable">
      <thead><tr><th>#</th><th>Bola</th><th>Negocio</th><th>Barrio</th><th>Escribir por</th><th>Etapa</th><th>Próximo paso</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>` : `<p class="empty">Ningún prospecto con estos filtros.</p>`}
  `);
}

export async function prospectPage(env, url){
  const id = url.searchParams.get("id") || "";
  const r = await env.DB.prepare("SELECT * FROM prospects WHERE id = ?1").bind(id).first();
  if(!r){ return Response.redirect(url.origin + "/admin/prospectos", 303); }
  const [{ results:events }, { results:miras }] = await env.DB.batch([
    env.DB.prepare("SELECT * FROM prospect_events WHERE prospect_id = ?1 ORDER BY created_at DESC, id DESC").bind(id),
    env.DB.prepare("SELECT * FROM submissions WHERE prospect_id = ?1 AND kind = 'mira' ORDER BY created_at DESC, id DESC").bind(id)
  ]);
  const token = await miraTokenFor(env, r);
  const miraLink = token ? SITE + "/mira/?" + new URLSearchParams({ t:token, marca:r.negocio, o:originOfChannel(r.canal) }) : "";
  const call = lastCall(events);
  let d = {};
  try{ d = JSON.parse(r.data); }catch(e){}
  const v = d.redes_verificacion || {};
  const centre = r.lat != null ? null : await env.DB.prepare(
    "SELECT AVG(lat) AS lat, AVG(lng) AS lng FROM prospects WHERE campaign = ?1 AND lat IS NOT NULL"
  ).bind(r.campaign).first();
  const MINI = { lat:r.lat, lng:r.lng, ball:ballOf(r.prioridad, r.score, r.bola),
    centre:centre && centre.lat != null ? [centre.lat, centre.lng] : [6.2442, -75.5812] };
  const back = "/admin/prospectos?c=" + encodeURIComponent(r.campaign);
  /* the map point, when the research has one, is more exact than the address */
  const maps = typeof d.lat === "number" && typeof d.lon === "number"
    ? "https://www.google.com/maps/search/?api=1&query=" + d.lat + "," + d.lon
    : r.direccion ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(r.direccion + ", Medellín") : null;
  const link = (u, label) => u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(label || u.replace(/^https?:\/\/(www\.)?/, ""))}</a>` : "";
  const profiles = (v.perfiles || []).map(x => `
    <li><b>${esc(x.red)}</b> ${link(x.url)}${x.visible_sin_sesion
      ? ` · ${esc(x.nombre_visible || "")}${x.seguidores != null ? " · " + Number(x.seguidores).toLocaleString("es-CO") + " seg." : ""}${x.publicaciones != null ? " · " + x.publicaciones + " publ." : ""}${x.bio || x.intro ? `<br><span class="bio">«${esc(x.bio || x.intro)}»</span>` : ""}`
      : " · no se ve sin sesión"}</li>`).join("");
  const dropped = (v.perfiles_descartados || []).map(x => `<li>${link(x.url)} · ${esc(x.motivo)}</li>`).join("");
  const timeline = events.map(e => `
    <li><span class="mono">${esc(whenInBogota(e.created_at))} · ${esc(EVENTS[e.tipo] || e.tipo)}</span>${esc(e.texto).replace(/\n/g, "<br>")}</li>`).join("");

  return adminPage(env, "prospectos", r.negocio, `
    <header class="top">
      <div>
        <p class="kicker"><a href="${back}">← Prospectos</a> · ${esc(r.campaign)} · ${esc(r.code)} · puesto ${r.rank ?? "–"}</p>
        <h1>${esc(r.negocio)}</h1>
        <p class="mono">${esc(r.categoria || "")}</p>
      </div>
      <p class="tags">${ballTag(r.prioridad, r.score, true, r.bola)} ${stageTag(r.etapa)}${r.estado_redes ? ` <span class="tag t-net">${esc(NETWORK[r.estado_redes] || r.estado_redes)}</span>` : ""}</p>
    </header>
    <div class="pgrid">
      <section class="sub">
        <h3>Dónde y cómo</h3>
        <p><b>Dirección</b>${esc(r.direccion || "Sin dato")}${r.dir_fuente ? ` <span class="mono">(${esc(r.dir_fuente)})</span>` : ""}${maps ? `<br>${link(maps, "Abrir en Google Maps")}` : ""}</p>
        ${r.lat != null ? `<p><b>En el mapa</b><a href="/admin/mapa?c=${encodeURIComponent(r.campaign)}&amp;id=${encodeURIComponent(r.id)}">Ver dónde queda</a>${r.geo === "barrio" ? " · ubicación aproximada, por barrio" : ""}</p>` : ""}
        <p><b>Barrio</b>${esc(r.barrio || "")}${r.distancia_km != null ? ` · ${r.distancia_km} km del punto de partida` : ""}</p>
        <p><b>Escribir por</b>${r.enlace ? `<a class="pill go-chat" href="${esc(r.enlace)}" target="_blank" rel="noopener">Abrir ${esc(r.canal)}</a>` : esc(r.canal || "")}</p>
        ${r.respaldo ? `<p><b>Respaldo</b>${esc(r.respaldo)}</p>` : ""}
        <p><b>Redes y web</b>${[link(r.instagram), link(r.facebook), link(r.tiktok)].filter(Boolean).join("<br>") || "Ninguna verificada"}${r.web && /^(https?:\/\/|www\.)/.test(r.web) ? "<br>" + link(r.web.startsWith("http") ? r.web : "https://" + r.web) : ""}</p>
        ${d.telefono ? `<p><b>Teléfono</b>${esc(d.telefono)}</p>` : ""}
        ${d.correo ? `<p><b>Correo</b>${esc(d.correo).replace(/[^\s,;<>"]+@[^\s,;<>"]+/g, m => `<a href="mailto:${m}">${m}</a>`)}${d.correo_fuente ? `<br><span class="mono">${esc(d.correo_fuente)}</span>` : ""}</p>` : d.correo_fuente ? `<p><b>Correo</b><span class="mono">${esc(d.correo_fuente)}</span></p>` : ""}
        <details id="contacto"><summary>Editar el contacto${r.contacto_editado ? " · editado a mano" : ""}</summary>
          <form class="pform" method="post" action="/admin/prospecto">
            <input type="hidden" name="id" value="${esc(r.id)}"><input type="hidden" name="accion" value="contacto">
            <div class="fgrid">
              <label>Escribir por<select name="canal">${channelOptions(r.canal, "Sin definir")}</select></label>
              <label>Enlace del chat<input name="enlace" value="${esc(r.enlace || "")}" placeholder="https://wa.me/57… o el número"></label>
              <label>Teléfono<input name="telefono" value="${esc(d.telefono || "")}" placeholder="+57 300 000 0000"></label>
              <label>Correo<input name="correo" value="${esc(d.correo || "")}" placeholder="nombre@negocio.com · varios, separados por coma"></label>
              <label>Dónde encontramos el correo<input name="correo_fuente" value="${esc(d.correo_fuente || "")}" placeholder="Ej.: el de la web rebota; el bueno está en la bio de Instagram"></label>
              <label>Respaldo<input name="respaldo" value="${esc(r.respaldo || "")}" placeholder="Otro canal, si el primero no responde"></label>
              <label>Dirección<input name="direccion" value="${esc(r.direccion || "")}"></label>
              <label>Barrio<input name="barrio" value="${esc(r.barrio || "")}"></label>
              <label>Instagram<input name="instagram" value="${esc(r.instagram || "")}" placeholder="@usuario o enlace"></label>
              <label>Facebook<input name="facebook" value="${esc(r.facebook || "")}" placeholder="Enlace"></label>
              <label>TikTok<input name="tiktok" value="${esc(r.tiktok || "")}" placeholder="@usuario o enlace"></label>
              <label>Página web<input name="web" value="${esc(r.web || "")}" placeholder="tumarca.com"></label>
            </div>
            
            <p class="mono hintline">Un número de WhatsApp sin enlace se convierte en wa.me; un @usuario, en el enlace de su red. Si cambias la dirección, el punto del mapa no se mueve: ajústalo en Ubicación.</p>
            <div class="linkrow"><button type="submit" class="go">Guardar el contacto</button><button type="button" data-cancel>Cancelar</button></div>
          </form>
        </details>
      </section>
      <section class="sub">
        <h3>Lo que vimos</h3>
        <p><b>Gancho</b>${esc(r.gancho || "")}</p>
        <p><b>Nota de la verificación</b>${esc(r.nota || "").replace(/\n/g, "<br>")}</p>
        <details id="notas"><summary>Editar las notas${r.notas_editadas ? " · editadas a mano" : ""}</summary>
          <form class="pform" method="post" action="/admin/prospecto">
            <input type="hidden" name="id" value="${esc(r.id)}"><input type="hidden" name="accion" value="notas">
            <label>Gancho<textarea name="gancho" rows="3" placeholder="Lo que vimos y con lo que se abre la conversación">${esc(r.gancho || "")}</textarea></label>
            <label>Nota de la verificación<textarea name="nota" rows="5">${esc(r.nota || "")}</textarea></label>
            <p class="mono hintline">Recargar la campaña ya no cambia lo que edites aquí.</p>
            <div class="linkrow"><button type="submit" class="go">Guardar las notas</button><button type="button" data-cancel>Cancelar</button></div>
          </form>
        </details>
      </section>
    </div>
    ${r.etapa === "por_contactar" ? `
    <section class="sub" id="mensaje">
      <h3>Primer mensaje</h3>
      <form class="pform" method="post" action="/admin/prospecto">
        <input type="hidden" name="id" value="${esc(r.id)}">
        <textarea class="msg" name="mensaje" id="msgText" rows="9" placeholder="Escribe aquí el primer mensaje">${esc(r.mensaje || "")}</textarea>
        <p class="mono hintline">Se puede editar hasta que lo marques como enviado.${/\[tu nombre\]/i.test(r.mensaje || "") ? " Cambia [tu nombre] antes de enviarlo." : ""}${miraLink ? " Para invitarlo a la MIRA, usa su enlace personal (abajo)." : ""}${r.mensaje_editado ? " Editado en el panel: recargar la campaña no lo cambia." : ""}</p>
        <div class="linkrow">
          <button type="button" data-copy-from="msgText" data-label="Copiar mensaje">Copiar mensaje</button>
          ${r.enlace ? `<a class="pill" href="${esc(r.enlace)}" target="_blank" rel="noopener">Abrir el chat</a>` : ""}
          <button type="submit" name="accion" value="mensaje">Guardar cambios</button>
          <button type="submit" name="accion" value="enviado" class="go">Ya lo envié</button>
        </div>
      </form>
    </section>` : r.mensaje ? `
    <section class="sub" id="mensaje">
      <h3>Primer mensaje</h3>
      <textarea class="msg" readonly rows="6">${esc(r.mensaje)}</textarea>
      <p class="mono hintline">Quedó fijo al registrar el primer contacto.</p>
    </section>` : ""}
    <div class="pgrid" id="mira">
      <section class="sub">
        <h3>Su MIRA</h3>
        ${miraLink ? `<p><b>Enlace personal</b><span class="mono linkline">${esc(miraLink)}</span></p>
        <div class="linkrow"><button type="button" data-copy="${esc(miraLink)}" data-label="Copiar enlace de MIRA">Copiar enlace de MIRA</button></div>
        <p class="mono hintline">Quien llena la MIRA con este enlace queda vinculado solo a este prospecto.</p>` : `<p class="empty">No se pudo crear el enlace. Recarga la página.</p>`}
        ${miras.length ? `<p class="okline">${miras.length === 1 ? "Llenó su MIRA" : "Llenó " + miras.length + " MIRA"} · la más reciente el ${esc(whenInBogota(miras[0].created_at))} · <a href="/admin/mira#m${miras[0].id}">verla en las MIRA</a></p>` : `<p class="mono">Todavía no ha llenado la MIRA.</p>`}
      </section>
      <section class="sub" id="llamada">
        <h3>La llamada</h3>
        ${callBlock(r, call)}
      </section>
    </div>
    ${miras.length ? (() => { let m = {}; try{ m = JSON.parse(miras[0].data); }catch(e){} return `
    <section class="sub">
      <h3>Sus respuestas · la base de la llamada</h3>
      ${miraAnswers(m)}
      <p class="who mono">Respondió ${esc(m.nombre)} · ${esc(m.contacto)}</p>
    </section>`; })() : ""}
    <div class="pgrid" id="jerarquia">
      <section class="sub">
        <h3>Jerarquía</h3>
        <form class="pform" method="post" action="/admin/prospecto">
          <input type="hidden" name="id" value="${esc(r.id)}"><input type="hidden" name="accion" value="bola">
          <div class="ballpick" role="radiogroup" aria-label="Bola">
            ${Object.keys(BALLS).map(n => `<label title="${BALLS[n].label}"><input type="radio" name="bola" value="${n}"${ballOf(r.prioridad, r.score, r.bola) === +n ? " checked" : ""}><i class="pb pb${n}"><b>${n}</b></i><span>${BALLS[n].label}</span></label>`).join("")}
          </div>
          <p class="mono hintline">${r.bola ? "Elegida a mano." + (r.prioridad ? ` La investigación decía bola ${ballOf(r.prioridad, r.score)}.` : "") : "Viene de la investigación."} Si eliges la 8, pasa también a «Descartado».</p>
          <div class="linkrow">
            <button type="submit" class="go">Cambiar la bola</button>
            ${r.bola && r.prioridad ? `<button type="submit" name="reset" value="1">Volver a la de la investigación</button>` : ""}
          </div>
        </form>
      </section>
      <section class="sub" id="ubicacion">
        <h3>Ubicación</h3>
        <form class="pform" method="post" action="/admin/prospecto" id="placeForm">
          <input type="hidden" name="id" value="${esc(r.id)}"><input type="hidden" name="accion" value="ubicar">
          <input type="hidden" name="lat" value="${r.lat ?? ""}"><input type="hidden" name="lng" value="${r.lng ?? ""}">
          <div class="searchrow"><input id="placeQuery" value="${esc(r.direccion || "")}" placeholder="Buscar una dirección o un lugar"><button type="button" id="placeFind">Buscar</button></div>
          <div id="map" class="minimap"></div>
          <p class="mono hintline" id="placeMsg">${r.lat != null ? esc(GEO[r.geo] || "Ubicado") + ". Toca el mapa para moverlo." : "Todavía no está en el mapa. Busca la dirección o toca el punto exacto."}</p>
          <button type="submit" class="go" id="placeSave" disabled>Guardar la ubicación</button>
        </form>
      </section>
    </div>
    <div class="pgrid" id="seguimiento">
      <section class="sub">
        <h3>Seguimiento</h3>
        <form class="pform" method="post" action="/admin/prospecto">
          <input type="hidden" name="id" value="${esc(r.id)}"><input type="hidden" name="accion" value="seguimiento">
          <label>Etapa<select name="etapa">${Object.entries(STAGES).map(([k, l]) => `<option value="${k}"${k === r.etapa ? " selected" : ""}>${l}</option>`).join("")}</select></label>
          <label>Próximo paso<input name="proxima_accion" value="${esc(r.proxima_accion || "")}" placeholder="Ej.: escribir de nuevo, visitar, enviar MIRA"></label>
          <label>Fecha<input type="date" name="proxima_fecha" value="${esc(r.proxima_fecha || "")}"></label>
          <button type="submit" class="go">Guardar</button>
        </form>
      </section>
      <section class="sub">
        <h3>Anotar lo que pasó</h3>
        <form class="pform" method="post" action="/admin/prospecto">
          <input type="hidden" name="id" value="${esc(r.id)}"><input type="hidden" name="accion" value="evento">
          <label>Qué fue<select name="tipo">${["respuesta", "mensaje", "visita", "reunion", "nota"].map(k => `<option value="${k}">${EVENTS[k]}</option>`).join("")}</select></label>
          <label>Detalle<textarea name="texto" rows="3" required placeholder="Qué dijeron, con quién hablaste, qué quedó pendiente"></textarea></label>
          <button type="submit" class="go">Anotar</button>
        </form>
      </section>
    </div>
    <section class="sub">
      <h3>Historial</h3>
      ${timeline ? `<ul class="timeline">${timeline}</ul>` : `<p class="empty">Todavía no hay nada anotado.</p>`}
    </section>
    <section class="sub">
      <h3>La investigación</h3>
      ${profiles ? `<ul class="plist">${profiles}</ul>` : `<p class="empty">No se encontraron perfiles.</p>`}
      ${dropped ? `<p><b>Descartados</b></p><ul class="plist">${dropped}</ul>` : ""}
      <p class="mono">${d.origen === "manual" ? "Agregado a mano el " + esc(d.creado || "") : "Verificado el " + esc(v.fecha || "")}${d.telefono ? " · teléfono: " + esc(d.telefono) : ""}</p>
    </section>
  `, 200, COPY_SCRIPT + LEAFLET + `<script>window.__MINI = ${JSON.stringify(MINI)};</script><script>${MINI_MAP_SCRIPT}</script>`);
}

export async function updateProspect(request, env, url){
  const form = await request.formData();
  const id = String(form.get("id") || "");
  const r = await env.DB.prepare("SELECT id, etapa, canal, prioridad, score, bola, mensaje FROM prospects WHERE id = ?1").bind(id).first();
  if(!r){ return Response.redirect(url.origin + "/admin/prospectos", 303); }
  let anchor = "#seguimiento";
  const log = (tipo, texto) => env.DB.prepare("INSERT INTO prospect_events (prospect_id, tipo, texto) VALUES (?1, ?2, ?3)").bind(id, tipo, texto);
  const accion = form.get("accion");
  const batch = [];

  const logData = (tipo, texto, data) => env.DB.prepare("INSERT INTO prospect_events (prospect_id, tipo, texto, data) VALUES (?1, ?2, ?3, ?4)").bind(id, tipo, texto, JSON.stringify(data));
  /* the first message can be edited until it is sent; then it stays as sent */
  const typed = form.has("mensaje") ? String(form.get("mensaje") || "").replace(/\r\n/g, "\n").trim().slice(0, 4000) : null;
  const editable = r.etapa === "por_contactar" && typed !== null;
  if(editable && typed !== (r.mensaje || "").trim() && (accion === "mensaje" || accion === "enviado")){
    batch.push(env.DB.prepare("UPDATE prospects SET mensaje = ?1, mensaje_editado = 1, updated_at = datetime('now') WHERE id = ?2").bind(typed || null, id));
  }

  if(accion === "mensaje"){
    anchor = "#mensaje";
  } else if(accion === "enviado"){
    /* the first message is out: wait three days, then the follow-up */
    const sent = editable ? typed : (r.mensaje || "");
    batch.push(log("mensaje", "Primer mensaje enviado por " + (r.canal || "chat") + "." + (sent ? "\n\n" + sent : "")));
    if(r.etapa === "por_contactar"){ batch.push(log("etapa", "Por contactar → Contactado")); }
    batch.push(env.DB.prepare(
      "UPDATE prospects SET etapa = CASE WHEN etapa = 'por_contactar' THEN 'contactado' ELSE etapa END, " +
      "proxima_accion = 'Seguimiento si no responde', proxima_fecha = ?1, updated_at = datetime('now') WHERE id = ?2"
    ).bind(plusDays(todayIso(), 3), id));
  } else if(accion === "seguimiento"){
    const etapa = STAGES[form.get("etapa")] ? form.get("etapa") : r.etapa;
    const next = String(form.get("proxima_accion") || "").trim().slice(0, 200);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(form.get("proxima_fecha") || "") ? form.get("proxima_fecha") : null;
    if(etapa !== r.etapa){ batch.push(log("etapa", STAGES[r.etapa] + " → " + STAGES[etapa])); }
    batch.push(env.DB.prepare(
      "UPDATE prospects SET etapa = ?1, proxima_accion = ?2, proxima_fecha = ?3, updated_at = datetime('now') WHERE id = ?4"
    ).bind(etapa, next || null, date, id));
  } else if(accion === "bola"){
    anchor = "#jerarquia";
    const before = ballOf(r.prioridad, r.score, r.bola);
    const choice = form.get("reset") ? "auto" : form.get("bola");
    const next = choice === "auto" ? null : (BALLS[choice] ? +choice : r.bola);
    const after = ballOf(r.prioridad, r.score, next);
    if(next !== r.bola){
      batch.push(env.DB.prepare("UPDATE prospects SET bola = ?1, updated_at = datetime('now') WHERE id = ?2").bind(next, id));
      if(after !== before){ batch.push(log("nota", `Jerarquía: bola ${before} (${BALLS[before].label}) → bola ${after} (${BALLS[after].label})${choice === "auto" ? ", la de la investigación" : ""}.`)); }
      /* the 8 is the discarded ball: the stage follows */
      if(after === 8 && r.etapa !== "descartado"){
        batch.push(env.DB.prepare("UPDATE prospects SET etapa = 'descartado' WHERE id = ?1").bind(id));
        batch.push(log("etapa", STAGES[r.etapa] + " → " + STAGES.descartado));
      }
    }
  } else if(accion === "ubicar"){
    anchor = "#ubicacion";
    const lat = parseFloat(form.get("lat")), lng = parseFloat(form.get("lng"));
    if(lat >= -5 && lat <= 13 && lng >= -82 && lng <= -66){
      batch.push(env.DB.prepare("UPDATE prospects SET lat = ?1, lng = ?2, geo = 'manual', updated_at = datetime('now') WHERE id = ?3").bind(lat, lng, id));
      batch.push(log("nota", "Ubicación marcada a mano en el mapa."));
    }
  } else if(accion === "agendar"){
    anchor = "#llamada";
    const fecha = /^\d{4}-\d{2}-\d{2}$/.test(form.get("fecha") || "") ? form.get("fecha") : null;
    const hora = /^\d{2}:\d{2}$/.test(form.get("hora") || "") ? form.get("hora") : null;
    const medio = MEDIOS[form.get("medio")] ? form.get("medio") : "videollamada";
    if(fecha && hora){
      const stamp = fecha + "T" + hora;
      batch.push(logData("reunion", `Llamada agendada · ${callWhen(stamp)} · ${MEDIOS[medio].toLowerCase()}`, { estado:"agendada", fecha:stamp, medio }));
      if(BEFORE_CALL.includes(r.etapa)){ batch.push(log("etapa", STAGES[r.etapa] + " → " + STAGES.reunion)); }
      batch.push(env.DB.prepare(
        "UPDATE prospects SET etapa = CASE WHEN etapa IN ('por_contactar', 'contactado', 'descartado', 'respondio') THEN 'reunion' ELSE etapa END, " +
        "proxima_accion = 'Registrar llamada', proxima_fecha = ?1, updated_at = datetime('now') WHERE id = ?2"
      ).bind(fecha, id));
    }
  } else if(accion === "registrar"){
    anchor = "#llamada";
    const f = k => String(form.get(k) || "").trim().slice(0, 300);
    const asistio = ATTENDED[f("asistio")] ? f("asistio") : "si";
    const resultado = OUTCOME[f("resultado")] ? f("resultado") : "lo_piensa";
    const today = todayIso();
    const proximoFecha = /^\d{4}-\d{2}-\d{2}$/.test(f("proximo_fecha")) ? f("proximo_fecha") : null;
    const data = {
      estado:asistio === "si" ? "realizada" : asistio === "no" ? "no_asistio" : "reprogramada",
      asistio, duracion:parseInt(f("duracion"), 10) || null, meta:f("meta"), dolor:f("dolor"), decide:f("decide"),
      fecha_clave:f("fecha_clave"), presupuesto:f("presupuesto"), paquete:PACKAGES[f("paquete")] ? +f("paquete") : null,
      temperatura:TEMPERATURE[f("temperatura")] ? f("temperatura") : null, objeciones:f("objeciones"),
      resultado:asistio === "si" ? resultado : null, proximo:f("proximo"), proximo_fecha:proximoFecha, aprendizaje:f("aprendizaje")
    };
    let etapa = r.etapa, next, nextDate, texto;
    if(asistio !== "si"){
      texto = asistio === "no" ? "LLAMADA NO REALIZADA · no se presentó" : "LLAMADA REPROGRAMADA";
      next = "Reagendar"; nextDate = proximoFecha || plusDays(today, 1);
    } else {
      const lines = [
        ["Meta", data.meta], ["Dolor", data.dolor], ["Decide", data.decide], ["Fecha clave", data.fecha_clave],
        ["Presupuesto", data.presupuesto || "no lo mencionó"], ["Bola candidata", data.paquete ? PACKAGES[data.paquete] : ""],
        ["Objeciones", data.objeciones], ["Próximo paso", [data.proximo, data.proximo_fecha].filter(Boolean).join(" · ")], ["Aprendizaje", data.aprendizaje]
      ].filter(([, x]) => x).map(([k, x]) => k + ": " + x);
      texto = ["LLAMADA REALIZADA", data.duracion ? data.duracion + " min" : "", data.temperatura ? TEMPERATURE[data.temperatura].toLowerCase() : "", OUTCOME[resultado]]
        .filter(Boolean).join(" · ") + (lines.length ? "\n" + lines.join("\n") : "");
      if(resultado === "sigue"){ next = "Enviar MIRA"; nextDate = plusWorkdays(today, 2); }
      else if(resultado === "lo_piensa"){ next = data.proximo || "Seguimiento: lo está pensando"; nextDate = proximoFecha || plusDays(today, 3); }
      else { etapa = "descartado"; next = null; nextDate = null; }
    }
    if(etapa !== "descartado" && BEFORE_CALL.includes(r.etapa)){ etapa = "reunion"; }
    batch.push(logData("reunion", texto, data));
    if(etapa !== r.etapa){ batch.push(log("etapa", STAGES[r.etapa] + " → " + STAGES[etapa] + (etapa === "descartado" ? " · no encaja" : ""))); }
    batch.push(env.DB.prepare("UPDATE prospects SET etapa = ?1, proxima_accion = ?2, proxima_fecha = ?3, updated_at = datetime('now') WHERE id = ?4")
      .bind(etapa, next, nextDate, id));
  } else if(accion === "contacto"){
    anchor = "#contacto";
    const full = await env.DB.prepare("SELECT * FROM prospects WHERE id = ?1").bind(id).first();
    let data = {};
    try{ data = JSON.parse(full.data); }catch(e){}
    const t = k => String(form.get(k) || "").trim().slice(0, 300);
    /* a handle becomes its profile's link; a bare phone number, a WhatsApp chat */
    const profile = (v, base) => /^@?[\w.]+$/.test(v) && !/^\d+$/.test(v) && v ? base + v.replace(/^@/, "") : v;
    const chat = v => {
      const digits = v.replace(/\D/g, "");
      if(/^https?:\/\//i.test(v) || digits.length < 10 || /[a-z]/i.test(v)){ return v; }
      return "https://wa.me/" + (digits.length === 10 && digits[0] === "3" ? "57" + digits : digits);
    };
    const next = {
      canal:t("canal"), enlace:chat(t("enlace")), respaldo:t("respaldo"), direccion:t("direccion"), barrio:t("barrio"),
      instagram:profile(t("instagram"), "https://www.instagram.com/"), facebook:t("facebook"),
      tiktok:profile(t("tiktok"), "https://www.tiktok.com/@"), web:t("web")
    };
    const LABELS = { canal:"Escribir por", enlace:"Enlace", respaldo:"Respaldo", direccion:"Dirección", barrio:"Barrio",
      instagram:"Instagram", facebook:"Facebook", tiktok:"TikTok", web:"Web", telefono:"Teléfono", correo:"Correo", correo_fuente:"Dónde encontramos el correo" };
    const changed = Object.keys(next).filter(k => (full[k] || "") !== next[k]);
    const phone = t("telefono");
    if(phone !== (data.telefono || "")){ changed.push("telefono"); data.telefono = phone || undefined; }
    /* the email is saved as typed: one or several, wherever they were found */
    const mail = t("correo");
    if(mail !== (data.correo || "")){ changed.push("correo"); data.correo = mail || null; }
    const mailFrom = t("correo_fuente");
    if(mailFrom !== (data.correo_fuente || "")){ changed.push("correo_fuente"); data.correo_fuente = mailFrom || undefined; }
    if(changed.length){
      const extra = { telefono:phone, correo:mail, correo_fuente:mailFrom };
      const was = k => k in extra ? "" : (full[k] || "—");
      const now = k => k in extra ? (extra[k] || "—") : (next[k] || "—");
      batch.push(env.DB.prepare(
        "UPDATE prospects SET canal = ?1, enlace = ?2, respaldo = ?3, direccion = ?4, barrio = ?5, instagram = ?6, facebook = ?7, tiktok = ?8, web = ?9, " +
        "dir_fuente = CASE WHEN ?10 = 1 THEN 'editada en el panel' ELSE dir_fuente END, data = ?11, contacto_editado = 1, updated_at = datetime('now') WHERE id = ?12"
      ).bind(next.canal || null, next.enlace || null, next.respaldo || null, next.direccion || null, next.barrio || null,
        next.instagram || null, next.facebook || null, next.tiktok || null, next.web || null,
        changed.includes("direccion") ? 1 : 0, JSON.stringify(data), id));
      batch.push(log("nota", "Contacto editado:\n" + changed.map(k => LABELS[k] + ": " + (k in extra ? now(k) : was(k) + " → " + now(k))).join("\n")));
    }
  } else if(accion === "notas"){
    anchor = "#notas";
    const full = await env.DB.prepare("SELECT gancho, nota FROM prospects WHERE id = ?1").bind(id).first();
    const t = k => String(form.get(k) || "").replace(/\r\n/g, "\n").trim().slice(0, 3000);
    const gancho = t("gancho"), nota = t("nota");
    const changed = [gancho !== (full.gancho || "") ? "el gancho" : "", nota !== (full.nota || "") ? "la nota de la verificación" : ""].filter(Boolean);
    if(changed.length){
      batch.push(env.DB.prepare("UPDATE prospects SET gancho = ?1, nota = ?2, notas_editadas = 1, updated_at = datetime('now') WHERE id = ?3")
        .bind(gancho || null, nota || null, id));
      batch.push(log("nota", "Notas editadas: " + changed.join(" y ") + "."));
    }
  } else if(accion === "evento"){
    const tipo = ["respuesta", "mensaje", "visita", "reunion", "nota"].includes(form.get("tipo")) ? form.get("tipo") : "nota";
    const texto = String(form.get("texto") || "").trim().slice(0, 2000);
    if(texto){
      batch.push(log(tipo, texto));
      batch.push(env.DB.prepare("UPDATE prospects SET updated_at = datetime('now') WHERE id = ?1").bind(id));
    }
  }
  if(batch.length){ await env.DB.batch(batch); }
  return Response.redirect(url.origin + "/admin/prospecto?id=" + encodeURIComponent(id) + anchor, 303);
}

/* ---------- the funnel, one row per prospect, for the weekly review ---------- */
export async function funnelCsv(env){
  const [{ results:pros }, { results:miras }, { results:calls }] = await env.DB.batch([
    env.DB.prepare("SELECT id, campaign, code, negocio, etapa, prioridad, score, bola FROM prospects ORDER BY campaign, rank"),
    env.DB.prepare("SELECT prospect_id, origen, created_at, json_extract(data, '$.semaforo.color') AS semaforo, json_extract(data, '$.semaforo.puntos') AS puntos, json_extract(data, '$.proyecto.inversion') AS inversion, json_extract(data, '$.idioma') AS idioma FROM submissions WHERE kind = 'mira' AND prospect_id IS NOT NULL ORDER BY created_at"),
    env.DB.prepare("SELECT prospect_id, data FROM prospect_events WHERE tipo = 'reunion' AND data IS NOT NULL ORDER BY id")
  ]);
  const mira = new Map(), scheduled = new Map(), recorded = new Map();
  for(const m of miras){ if(!mira.has(m.prospect_id)){ mira.set(m.prospect_id, m); } }
  for(const c of calls){
    let d = {};
    try{ d = JSON.parse(c.data); }catch(e){ continue; }
    if(d.estado === "agendada"){ scheduled.set(c.prospect_id, d); } else { recorded.set(c.prospect_id, d); }
  }
  const cell = v => { const t = v == null ? "" : String(v); return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
  const head = ["campana", "codigo", "negocio", "etapa", "bola", "mira_origen", "mira_fecha", "mira_semaforo", "mira_puntos", "mira_inversion", "llamada_agendada", "asistio", "temperatura", "resultado", "bola_candidata"];
  const rows = pros.map(p => {
    const m = mira.get(p.id), s = scheduled.get(p.id), c = recorded.get(p.id);
    return [p.campaign, p.code, p.negocio, p.etapa, ballOf(p.prioridad, p.score, p.bola), m ? m.origen || "" : "", m ? m.created_at.slice(0, 10) : "",
      m ? m.semaforo || "" : "", m && m.puntos != null ? m.puntos : "", m && m.inversion ? qualifyLabel("inversion", m.inversion, m.idioma) : "",
      s ? s.fecha : "", c ? c.asistio : "", c ? c.temperatura || "" : "", c ? c.resultado || "" : "", c && c.paquete ? c.paquete : ""].map(cell).join(",");
  });
  return new Response("\ufeff" + [head.join(","), ...rows].join("\r\n"), { headers:{
    "Content-Type":"text/csv; charset=utf-8", "Content-Disposition":`attachment; filename="embudo-${todayIso()}.csv"`, "Cache-Control":"no-store"
  } });
}

/* ---------- adding a prospect by hand ---------- */
export function bogotaMonth(){ return todayIso().slice(0, 7); }

/* what a MIRA already says about a brand, as the fields of a new prospect */
export function prospectFromMira(sub){
  let d = {};
  try{ d = JSON.parse(sub.data); }catch(e){}
  const handle = [...igHandles(d.enlaces)][0];
  const contact = String(d.contacto || sub.contact || "");
  const digits = contact.replace(/\D/g, "");
  const phone = digits.length >= 7 ? contact : "";
  const wa = digits.length === 10 && digits[0] === "3" ? "https://wa.me/57" + digits : digits.length === 12 && digits.startsWith("57") ? "https://wa.me/" + digits : "";
  const web = (String(d.enlaces || "").match(/(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.[a-z.]{2,}(?:\/\S*)?/i) || [""])[0];
  return {
    negocio:d.marca || sub.brand || "", categoria:d.queHace ? String(d.queHace).slice(0, 80) : "",
    canal:handle ? "Instagram (DM)" : wa ? "WhatsApp" : /@/.test(contact) ? "Correo" : "Llamada",
    enlace:handle ? "https://www.instagram.com/" + handle : wa,
    instagram:handle ? "https://www.instagram.com/" + handle : "",
    telefono:phone, web:web && !/instagram\.com/i.test(web) ? web : "", bola:"3"
  };
}

export async function newProspectPage(env, url, error = "", values = {}){
  const campaigns = (await env.DB.prepare("SELECT campaign, COUNT(*) AS n FROM prospects GROUP BY campaign ORDER BY campaign DESC").all()).results;
  /* from a MIRA nobody linked: its data, in this month's campaign of people who came on their own */
  const miraId = parseInt(values.mira || url.searchParams.get("mira"), 10) || null;
  const sub = miraId ? await env.DB.prepare("SELECT * FROM submissions WHERE id = ?1 AND kind = 'mira' AND prospect_id IS NULL").bind(miraId).first() : null;
  const incoming = "entrantes-" + bogotaMonth();
  if(sub && !values.negocio){ values = { ...prospectFromMira(sub), campaign:incoming, ...values }; }
  const chosen = values.campaign || url.searchParams.get("c") || (campaigns[0] && campaigns[0].campaign) || "";
  const v = k => esc(values[k] || "");
  const listed = sub && !campaigns.some(c => c.campaign === incoming) ? [{ campaign:incoming, n:0 }, ...campaigns] : campaigns;
  const options = listed.map(c => ({ ...c, ...campaignParts(c.campaign) }))
    .map(c => `<option value="${esc(c.campaign)}"${c.campaign === chosen ? " selected" : ""}>${esc(c.zone)} · ${esc(c.group)} (${c.n})</option>`).join("");
  const ball = values.bola || "3";
  return adminPage(env, "prospectos", "Nuevo prospecto", `
    <header class="top"><div><p class="kicker"><a href="${sub ? "/admin/mira#m" + sub.id : "/admin/prospectos" + (chosen ? "?c=" + encodeURIComponent(chosen) : "")}">← ${sub ? "Las MIRA" : "Prospectos"}</a> · nuevo</p><h1>Un prospecto <em>nuevo</em></h1>
      ${sub ? `<p class="mono">Con los datos de la MIRA de ${esc(sub.brand || sub.name || "")}. Queda en «Respondió», vinculado a esa MIRA.</p>` : ""}</div></header>
    ${error ? `<p class="errline">${esc(error)}</p>` : ""}
    <form class="newauth" method="post" action="/admin/prospecto/nuevo">
      ${sub ? `<input type="hidden" name="mira" value="${sub.id}">` : ""}
      <label>Zona<select name="campaign" id="campSel">${options}<option value="__nueva"${chosen === "__nueva" || !campaigns.length ? " selected" : ""}>+ Una zona nueva…</option></select></label>
      <label id="zoneBox">Nombre de la zona nueva<input name="zona" value="${v("zona")}" placeholder="Ej.: Envigado, Laureles, Sabaneta"></label>
      <label>Negocio<input name="negocio" required value="${v("negocio")}" placeholder="Nombre del negocio"></label>
      <label>Categoría<input name="categoria" value="${v("categoria")}" placeholder="Ej.: café, barbería, veterinaria"></label>
      <label>Barrio<input name="barrio" value="${v("barrio")}"></label>
      <label>Dirección<input name="direccion" value="${v("direccion")}" placeholder="Ej.: Cra. 76 #30-49"></label>
      <label>Escribir por<select name="canal">${channelOptions(values.canal || "Instagram (DM)")}</select></label>
      <label>Enlace del chat<input name="enlace" value="${v("enlace")}" placeholder="https://instagram.com/… o https://wa.me/57…"></label>
      <label>Instagram<input name="instagram" value="${v("instagram")}" placeholder="https://www.instagram.com/…"></label>
      <label>Facebook<input name="facebook" value="${v("facebook")}" placeholder="https://www.facebook.com/…"></label>
      <label>Teléfono<input name="telefono" value="${v("telefono")}"></label>
      <label>Página web<input name="web" value="${v("web")}" placeholder="https://"></label>
      <label class="wide">Lo que vimos (el gancho para escribirle)<textarea name="gancho" rows="2" placeholder="Ej.: tres nombres distintos entre Instagram, Google y el letrero">${v("gancho")}</textarea></label>
      <label class="wide">Primer mensaje (opcional)<textarea name="mensaje" rows="4">${v("mensaje")}</textarea></label>
      <div class="wide"><span class="flabel">Bola</span>
        <div class="ballpick" role="radiogroup" aria-label="Bola">
          ${Object.keys(BALLS).map(n => `<label title="${BALLS[n].label}"><input type="radio" name="bola" value="${n}"${String(ball) === n ? " checked" : ""}><i class="pb pb${n}"><b>${n}</b></i><span>${BALLS[n].label}</span></label>`).join("")}
        </div>
      </div>
      <p class="mono hintline">Al guardarlo te llevo a su ficha para ubicarlo en el mapa.</p>
      <button type="submit" class="go">Agregar el prospecto</button>
    </form>
    <script>
      (function(){ var s = document.getElementById("campSel"), z = document.getElementById("zoneBox");
        function sync(){ z.hidden = s.value !== "__nueva"; z.querySelector("input").required = s.value === "__nueva"; }
        s.addEventListener("change", sync); sync(); })();
    </script>`);
}

export async function createProspect(request, env, url){
  const form = await request.formData();
  const values = Object.fromEntries([...form.entries()].map(([k, x]) => [k, String(x).trim().slice(0, k === "mensaje" || k === "gancho" ? 2000 : 300)]));
  if(!values.negocio){ return newProspectPage(env, url, "Falta el nombre del negocio.", values); }
  let campaign = values.campaign;
  if(campaign === "__nueva"){
    const zone = slug(values.zona || "");
    if(!zone){ return newProspectPage(env, url, "Escribe el nombre de la zona nueva.", values); }
    campaign = zone + "-" + bogotaMonth();
  } else if(!/^[a-z0-9-]+$/.test(campaign || "")){
    return newProspectPage(env, url, "Elige una zona.", values);
  }
  const bola = BALLS[values.bola] ? +values.bola : 3;
  const miraId = parseInt(values.mira, 10) || null;
  const sub = miraId ? await env.DB.prepare("SELECT id, origen FROM submissions WHERE id = ?1 AND kind = 'mira' AND prospect_id IS NULL").bind(miraId).first() : null;
  const stats = await env.DB.prepare(
    "SELECT MAX(rank) AS r, MAX(CASE WHEN code LIKE 'N%' THEN CAST(SUBSTR(code, 2) AS INTEGER) END) AS n FROM prospects WHERE campaign = ?1"
  ).bind(campaign).first();
  const code = "N" + String((stats.n || 0) + 1).padStart(3, "0");
  const id = campaign + ":" + code;
  const link = u => /^https?:\/\//.test(u || "") ? u : null;
  const data = { origen:sub ? "mira" : "manual", creado:todayIso(), telefono:values.telefono || null };
  /* from a MIRA it starts where the MIRA leaves it: answered, the call to schedule */
  const etapa = bola === 8 ? "descartado" : sub ? "respondio" : "por_contactar";
  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO prospects (id, campaign, code, negocio, categoria, barrio, direccion, dir_fuente, rank, canal, enlace, instagram, facebook, web, gancho, mensaje, data, bola, etapa) " +
      "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'manual', ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)"
    ).bind(id, campaign, code, values.negocio, values.categoria || null, values.barrio || null, values.direccion || null, (stats.r || 0) + 1,
      values.canal || null, link(values.enlace), link(values.instagram), link(values.facebook), values.web || null,
      values.gancho || null, values.mensaje || null, JSON.stringify(data), bola, etapa),
    env.DB.prepare("INSERT INTO prospect_events (prospect_id, tipo, texto) VALUES (?1, 'nota', ?2)")
      .bind(id, `Agregado ${sub ? "desde su MIRA" : "a mano en el panel"}, con la bola ${bola} (${BALLS[bola].label}).`),
    ...(sub ? linkMira(env, sub.id, { id, etapa }, "manual", sub.origen) : [])
  ]);
  return Response.redirect(url.origin + "/admin/prospecto?id=" + encodeURIComponent(id) + (sub ? "#mira" : "#ubicacion"), 303);
}
