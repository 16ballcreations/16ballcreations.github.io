/* Propuestas: los sitios de clientes publicados en GitHub. */

import { COPY_SCRIPT, adminPage, sectionHead } from "./comun/pagina.js";
import { esc, list, markdown, plain, row, whenInBogota } from "./comun/util.js";
import { card } from "./mira.js";

/* ---------- proposals: the client sites published on GitHub ----------
   Each proposal is a public repository of the 16ballcreations organisation
   published with GitHub Pages, so it lives at 16ballcreations.github.io/<repo>/.
   The list is read from GitHub (repositories with Pages, but not the main
   site), each README gives the title, the state ("**Estado: …**") and a
   summary, and the published page gives its cover (og:image). A new
   repository published that way shows up on its own.
   GitHub answers 60 requests an hour without a token, and Cloudflare shares
   its addresses, so the last good list is kept in settings and shown for ten
   minutes, or whenever GitHub fails. With a GITHUB_TOKEN secret (read-only,
   public repositories) the limit stops being a concern. */
export const GH_ORG = "16ballcreations";
export const PROPOSALS_KEY = "propuestas:cache";
export const PROPOSALS_FRESH = 10 * 60 * 1000;

export function ghHeaders(env, raw){
  const h = { "User-Agent":"16bc-panel", "Accept":raw ? "application/vnd.github.raw" : "application/vnd.github+json", "X-GitHub-Api-Version":"2022-11-28" };
  if(env.GITHUB_TOKEN){ h.Authorization = "Bearer " + env.GITHUB_TOKEN; }
  return h;
}

/* what the README says: its title, its state and its first paragraph */
export function readmeInfo(md){
  const plain = t => t.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*_`]/g, "").replace(/\s+/g, " ").trim();
  const title = plain((md.match(/^#\s+(.+)$/m) || [])[1] || "");
  const estado = plain((md.match(/\*\*Estado:\s*([^*]+?)\.?\*\*/i) || [])[1] || "");
  const summary = md.split(/\n\s*\n/).map(b => b.trim())
    .find(b => b && !/^(#|>|\||-{3}|```|!\[|<)/.test(b)) || "";
  return { title, estado, summary:plain(summary).slice(0, 320) };
}

/* the cover the published page announces for when it is shared */
export function ogImage(html, base){
  const m = html.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  try{ return m ? new URL(m[1], base).href : ""; }catch(e){ return ""; }
}

export async function fetchProposals(env){
  const res = await fetch(`https://api.github.com/orgs/${GH_ORG}/repos?per_page=100&type=public&sort=pushed`, { headers:ghHeaders(env) });
  if(!res.ok){ throw new Error("GitHub respondió " + res.status + (res.status === 403 ? " (límite de consultas)" : "")); }
  const repos = (await res.json()).filter(r => r.has_pages && !r.private && !r.archived && r.name.toLowerCase() !== GH_ORG + ".github.io");
  return Promise.all(repos.map(async r => {
    const site = `https://${GH_ORG}.github.io/${r.name}/`;
    const [readme, html] = await Promise.all([
      fetch(`https://api.github.com/repos/${GH_ORG}/${r.name}/readme`, { headers:ghHeaders(env, true) }).then(x => x.ok ? x.text() : "").catch(() => ""),
      fetch(site, { headers:{ "User-Agent":"16bc-panel" } }).then(x => x.ok ? x.text() : "").catch(() => "")
    ]);
    return {
      repo:r.name, repoUrl:r.html_url, site, description:r.description || "", pushed:r.pushed_at,
      image:ogImage(html, site), ...readmeInfo(readme), readme:readme.slice(0, 40000)
    };
  }));
}

/* the list: fresh from GitHub at most every ten minutes, or the last good one */
export async function getProposals(env, force){
  const row = await env.DB.prepare("SELECT value FROM settings WHERE key = ?1").bind(PROPOSALS_KEY).first();
  let cached = null;
  try{ cached = row ? JSON.parse(row.value) : null; }catch(e){}
  if(cached && !force && Date.now() - cached.at < PROPOSALS_FRESH){ return { ...cached, error:"" }; }
  try{
    const items = await fetchProposals(env);
    const fresh = { at:Date.now(), items };
    await env.DB.prepare("INSERT INTO settings (key, value, updated_at) VALUES (?1, ?2, datetime('now')) " +
      "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at").bind(PROPOSALS_KEY, JSON.stringify(fresh)).run();
    return { ...fresh, error:"" };
  }catch(e){
    return cached ? { ...cached, error:e.message } : { at:0, items:[], error:e.message };
  }
}

export async function proposalsPage(env, url){
  const force = url.searchParams.has("refrescar");
  const { at, items, error } = await getProposals(env, force);
  const list = items.slice().sort((a, b) => String(b.pushed).localeCompare(String(a.pushed)));
  const card = p => `
      <article class="sub prop">
        <a class="prop-cover" href="/admin/propuesta?repo=${encodeURIComponent(p.repo)}">${p.image
          ? `<img src="${esc(p.image)}" alt="" loading="lazy">`
          : `<span class="prop-blank" aria-hidden="true"><img src="/assets/img/ball-16.png?v=2" alt=""></span>`}</a>
        <header>
          ${p.estado ? `<span class="tag t-wait">${esc(p.estado)}</span>` : ""}
          <h2><a class="biz" href="/admin/propuesta?repo=${encodeURIComponent(p.repo)}">${esc(p.title || p.repo)}</a></h2>
          <span class="when mono">Último cambio: ${esc(p.pushed ? whenInBogota(p.pushed.replace("T", " ").replace("Z", "")) : "—")}</span>
        </header>
        <p class="prop-sum">${esc(p.summary || p.description)}</p>
        <div class="linkrow">
          <a class="pill go-chat" href="${esc(p.site)}" target="_blank" rel="noopener">Abrir propuesta</a>
          <button type="button" data-copy="${esc(p.site)}" data-label="Copiar enlace">Copiar enlace</button>
          <a class="pill" href="${esc(p.repoUrl)}" target="_blank" rel="noopener">Ver repositorio</a>
        </div>
      </article>`;
  return adminPage(env, "propuestas", "Propuestas", `
    ${sectionHead("Clientes · propuestas", "Las <em>propuestas</em>", `<a class="pill" href="/admin/propuestas?refrescar">Actualizar desde GitHub</a>`)}
    <p class="totals mono">${list.length === 1 ? "1 propuesta" : list.length + " propuestas"} publicadas en ${GH_ORG}.github.io${at ? " · leídas de GitHub el " + esc(whenInBogota(new Date(at).toISOString().slice(0, 19).replace("T", " "))) : ""}</p>
    ${error ? `<p class="empty">No se pudo leer GitHub ahora (${esc(error)}).${at ? " Esta es la última lista que funcionó." : ""}</p>` : ""}
    ${list.length ? `<div class="props">${list.map(card).join("")}</div>`
      : `<p class="empty">Todavía no hay propuestas. Cada repositorio público de ${GH_ORG} publicado con GitHub Pages aparece aquí.</p>`}
  `, 200, COPY_SCRIPT);
}

export async function proposalPage(env, url){
  const { items } = await getProposals(env, false);
  const p = items.find(x => x.repo === url.searchParams.get("repo"));
  if(!p){ return Response.redirect(url.origin + "/admin/propuestas", 303); }
  /* relative images and links in the README point into the repository */
  const raw = `https://raw.githubusercontent.com/${GH_ORG}/${p.repo}/HEAD/`;
  const body = p.readme
    .replace(/(!\[[^\]]*\]\()(?!https?:|#|\/)([^)\s]+)/g, "$1" + raw + "$2")
    .replace(/((?:^|[^!])\[[^\]]*\]\()(?!https?:|#|mailto:)([^)\s]+)/g, "$1" + p.repoUrl + "/blob/HEAD/$2");
  return adminPage(env, "propuestas", p.title || p.repo, `
    <p class="kicker"><a href="/admin/propuestas">← Propuestas</a> · ${esc(p.repo)}${p.estado ? " · " + esc(p.estado) : ""}</p>
    <div class="linkrow" style="margin-bottom:20px">
      <a class="pill go-chat" href="${esc(p.site)}" target="_blank" rel="noopener">Abrir propuesta</a>
      <button type="button" data-copy="${esc(p.site)}" data-label="Copiar enlace">Copiar enlace</button>
      <a class="pill" href="${esc(p.repoUrl)}" target="_blank" rel="noopener">Ver repositorio</a>
    </div>
    ${p.readme ? `<article class="md">${markdown(body)}</article>` : `<p class="empty">Este repositorio no tiene README.</p>`}
  `, 200, COPY_SCRIPT);
}
