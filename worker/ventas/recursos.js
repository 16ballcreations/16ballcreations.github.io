/* Ventas · los recursos de las campañas (guiones, notas). */

import { adminPage } from "../comun/pagina.js";
import { esc, markdown, whenInBogota } from "../comun/util.js";

export async function resourcesPage(env){
  const { results } = await env.DB.prepare("SELECT slug, campaign, title, updated_at FROM resources ORDER BY campaign DESC, title").all();
  return adminPage(env, "recursos", "Recursos", `
    <header class="top">
      <div>
        <p class="kicker">Ventas · recursos</p>
        <h1>Los <em>recursos</em></h1>
      </div>
    </header>
    ${results.length ? results.map(r => `
      <article class="sub">
        <header><span class="tag t-net">${esc(r.campaign || "general")}</span><h2><a class="biz" href="/admin/recurso?slug=${encodeURIComponent(r.slug)}">${esc(r.title)}</a></h2>
        <span class="when mono">Actualizado el ${esc(whenInBogota(r.updated_at))}</span></header>
      </article>`).join("") : `<p class="empty">Todavía no hay recursos cargados.</p>`}
  `);
}

export async function resourcePage(env, url){
  const r = await env.DB.prepare("SELECT * FROM resources WHERE slug = ?1").bind(url.searchParams.get("slug") || "").first();
  if(!r){ return Response.redirect(url.origin + "/admin/recursos", 303); }
  return adminPage(env, "recursos", r.title, `
    <p class="kicker"><a href="/admin/recursos">← Recursos</a> · ${esc(r.campaign || "")}</p>
    <article class="md">${markdown(r.body)}</article>
  `);
}
