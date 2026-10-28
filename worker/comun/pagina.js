/* La página del panel: el marco HTML, el menú, los encabezados y los botones de copiar. */

import { esc, todayIso } from "./util.js";

/* ---------- the admin shell: a menu, one section per thing ---------- */

export const SECTION_PATHS = { mira:"/admin/mira", contacto:"/admin/contacto", autorizaciones:"/admin/autorizaciones", testimonios:"/admin/testimonios" };

/* what needs attention, for the menu badges and the home page */
export async function attention(env){
  const today = todayIso();
  const [subs, auth, testi, pros, res] = await env.DB.batch([
    env.DB.prepare("SELECT kind, COUNT(*) AS n, SUM(CASE WHEN reviewed = 0 THEN 1 ELSE 0 END) AS p FROM submissions GROUP BY kind"),
    env.DB.prepare("SELECT COUNT(*) AS n, SUM(CASE WHEN client_signed_at IS NULL THEN 1 ELSE 0 END) AS p FROM authorizations"),
    env.DB.prepare("SELECT COUNT(*) AS n, SUM(CASE WHEN reviewed = 0 THEN 1 ELSE 0 END) AS p FROM testimonials"),
    env.DB.prepare(
      "SELECT COUNT(*) AS n, SUM(CASE WHEN proxima_fecha IS NOT NULL AND proxima_fecha <= ?1 AND etapa NOT IN ('cliente', 'descartado') THEN 1 ELSE 0 END) AS p, " +
      "SUM(CASE WHEN etapa = 'por_contactar' THEN 1 ELSE 0 END) AS nuevos, SUM(CASE WHEN etapa IN ('respondio', 'reunion', 'propuesta') THEN 1 ELSE 0 END) AS vivos, " +
      "SUM(CASE WHEN etapa = 'cliente' THEN 1 ELSE 0 END) AS clientes FROM prospects"
    ).bind(today),
    env.DB.prepare("SELECT COUNT(*) AS n FROM resources")
  ]);
  const a = {
    mira:{ n:0, p:0 }, contacto:{ n:0, p:0 },
    autorizaciones:{ n:auth.results[0].n || 0, p:auth.results[0].p || 0 },
    testimonios:{ n:testi.results[0].n || 0, p:testi.results[0].p || 0 },
    prospectos:{ n:pros.results[0].n || 0, p:pros.results[0].p || 0, nuevos:pros.results[0].nuevos || 0, vivos:pros.results[0].vivos || 0, clientes:pros.results[0].clientes || 0 },
    recursos:{ n:res.results[0].n || 0, p:0 }
  };
  for(const r of subs.results){ a[r.kind] = { n:r.n, p:r.p || 0 }; }
  return a;
}

export const MENU = [
  { group:null, items:[{ key:"inicio", href:"/admin", label:"Inicio" }] },
  { group:"Ventas", items:[
    { key:"prospectos", href:"/admin/prospectos", label:"Prospectos", hint:"para hoy" },
    { key:"mapa", href:"/admin/mapa", label:"Mapa" },
    { key:"recursos", href:"/admin/recursos", label:"Recursos" }
  ]},
  { group:"Lo que llega", items:[
    { key:"contacto", href:"/admin/contacto", label:"Contacto", hint:"sin revisar" }
  ]},
  { group:"Clientes", items:[
    { key:"mira", href:"/admin/mira", label:"MIRA", hint:"sin revisar" },
    { key:"propuestas", href:"/admin/propuestas", label:"Propuestas" },
    { key:"autorizaciones", href:"/admin/autorizaciones", label:"Autorizaciones", hint:"sin firmar" },
    { key:"testimonios", href:"/admin/testimonios", label:"Testimonios", hint:"sin revisar" }
  ]},
  { group:"Ajustes", items:[
    { key:"correo", href:"/admin/correo", label:"Correo enviado" },
    { key:"firma", href:"/admin/firma", label:"Tu firma" }
  ]}
];

export async function adminPage(env, active, title, content, status = 200, script = ""){
  let a = null;
  try{ a = await attention(env); }catch(e){}
  const nav = MENU.map(g => `
    ${g.group ? `<p class="nav-group">${g.group}</p>` : ""}
    ${g.items.map(it => {
      const p = a && a[it.key] ? a[it.key].p : 0;
      return `<a class="nav-item${it.key === active ? " on" : ""}" href="${it.href}"${it.key === active ? ' aria-current="page"' : ""}>
        <span>${it.label}</span>${p ? `<span class="badge" title="${p} ${it.hint || ""}">${p}</span>` : ""}</a>`;
    }).join("")}`).join("");
  return page(title, `
    <div class="shell">
      <aside class="side">
        <a class="side-brand" href="/admin"><img src="/assets/img/ball-16.png" alt="">16 Ball Creations<span>panel</span></a>
        <nav class="side-nav" aria-label="Secciones del panel">${nav}</nav>
        <a class="side-site" href="/" target="_blank" rel="noopener">Ver el sitio ↗</a>
        <form method="post" action="/admin/salir" class="side-out"><button type="submit">Salir</button></form>
      </aside>
      <div class="content">${content}</div>
    </div>`, status, script, true);
}

/* the filter pills every list shares: all, or only what is pending */
export function pendingPills(base, pendientes, label){
  return `<nav class="filters"><a class="pill${pendientes ? "" : " on"}" href="${base}">Todo</a><a class="pill${pendientes ? " on" : ""}" href="${base}?ver=pendientes">${label}</a></nav>`;
}
export function sectionHead(group, h1, extra = ""){
  return `<header class="top"><div><p class="kicker">${group}</p><h1>${h1}</h1></div>${extra}</header>`;
}

/* copy buttons in the list */
export const COPY_SCRIPT = `<script>
document.addEventListener("submit", function(e){
  var f = e.target.closest("form[data-confirm]");
  if(f && !confirm(f.getAttribute("data-confirm"))){ e.preventDefault(); }
});
/* Cancelar: the form goes back to what was saved, and its editor closes */
document.addEventListener("click", function(e){
  var c = e.target.closest("[data-cancel]");
  if(!c){ return; }
  var f = c.closest("form"), d = c.closest("details");
  if(f){ f.reset(); }
  if(d){ d.open = false; d.querySelector("summary").focus(); }
});
document.addEventListener("click", function(e){
  var b = e.target.closest("[data-copy],[data-copy-from]");
  if(!b){ return; }
  var label = b.getAttribute("data-label") || "Copiar enlace";
  var from = b.getAttribute("data-copy-from"), field = from && document.getElementById(from);
  var text = field ? field.value : b.getAttribute("data-copy");
  navigator.clipboard.writeText(text).then(function(){ b.textContent = "Copiado ✓"; setTimeout(function(){ b.textContent = label; }, 1800); });
});
</script>`;

export function page(title, content, status = 200, script = "", shell = false){
  return new Response(`<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>${esc(title)} · 16 Ball Creations</title>
<link rel="preload" href="/assets/fonts/recursive-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/fuentes.css?v=2">
<style>
  :root{--bg:#050606;--line:#25292c;--white:#fff;--bone:#ecebe6;--ash:#a1a4a5;--iron:#6e727a;--accent:#3ad389;
    --b1:#f4c20d;--b2:#4d7dff;--b3:#ff5c6e;--b4:#a375d8}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--bone);font:15px/1.5 "Recursive",system-ui,sans-serif;font-variation-settings:"MONO" 0;-webkit-font-smoothing:antialiased}
  main{max-width:1100px;margin:0 auto;padding:40px 24px 80px}
  .mono{font-family:"Recursive",monospace;font-variation-settings:"MONO" 1;font-size:12px;color:var(--iron)}
  .kicker{margin:0 0 8px;font:12px "Recursive",monospace;font-variation-settings:"MONO" 1;letter-spacing:.08em;text-transform:uppercase;color:var(--ash)}
  h1{margin:0;font:400 clamp(2.4rem,6vw,4rem)/1 "Boska",serif;color:var(--white)}
  /* the accent, as on the site: Recursive casual and slanted */
  h1 em{color:var(--accent);font-family:"Recursive",sans-serif;font-style:normal;font-weight:500;font-variation-settings:"CASL" 1,"slnt" -15,"MONO" 0;letter-spacing:-.02em;font-size:.9em}
  .top{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap;margin-bottom:28px}
  .filters{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px}
  .pill{padding:7px 14px;border:1px solid var(--line);border-radius:999px;color:var(--ash);text-decoration:none;font:12px "Recursive",monospace;font-variation-settings:"MONO" 1}
  .pill.on{background:var(--accent);border-color:var(--accent);color:#000}
  .sub{border:1px solid var(--line);border-radius:18px;padding:22px 24px;margin-bottom:16px;background:rgba(255,255,255,.02)}
  .sub.done{opacity:.55}
  .sub header{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:16px}
  .sub h2{margin:0;font:400 1.8rem/1.1 "Boska",serif;color:var(--white)}
  .when{margin-left:auto}
  .tag{padding:3px 9px;border-radius:999px;font:11px "Recursive",monospace;font-variation-settings:"MONO" 1;letter-spacing:.06em;text-transform:uppercase;color:#000}
  .tag.t-mira{background:var(--accent)} .tag.t-contacto{background:var(--b2);color:#fff}
  form{margin:0}
  button{padding:7px 14px;border-radius:999px;border:1px solid var(--line);background:transparent;color:var(--white);cursor:pointer;font:500 13px "Recursive",sans-serif;font-variation-settings:"MONO" 0}
  .sub.done button{border-color:var(--accent);color:var(--accent)}
  .mira{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
  .mira section{padding:14px 16px;border:1px solid var(--line);border-radius:12px}
  .mira section:nth-child(1){--c:var(--b1)} .mira section:nth-child(2){--c:var(--b2)}
  .mira section:nth-child(3){--c:var(--b3)} .mira section:nth-child(4){--c:var(--b4)}
  .mira section.mira-proj{grid-column:1 / -1;--c:var(--b6)}
  h3{margin:0 0 10px;font:500 12px "Recursive",monospace;font-variation-settings:"MONO" 1;letter-spacing:.08em;text-transform:uppercase;color:var(--c,var(--ash))}
  h3 i{font:500 1.15rem "Recursive",sans-serif;font-style:normal;font-variation-settings:"CASL" 1,"slnt" -15,"MONO" 0;letter-spacing:-.02em;text-transform:none;margin-right:4px}
  .sub p{margin:0 0 10px}
  .sub p b{display:block;font:400 11px "Recursive",monospace;font-variation-settings:"MONO" 1;letter-spacing:.06em;text-transform:uppercase;color:var(--iron)}
  .none{color:#4a4e52;font-style:italic}
  .who{margin:14px 0 0 !important}
  .empty{color:var(--iron)}
  code{font-family:"Recursive",monospace;font-variation-settings:"MONO" 1;color:var(--accent)}
  .pill.new{margin-left:auto;border-color:var(--accent);color:var(--accent)}
  .tag.t-ok{background:var(--accent)} .tag.t-wait{background:var(--b1)}
  .tag.t-verde{background:#3ad389} .tag.t-amarillo{background:#f4c20d} .tag.t-rojo{background:#ff5c6e}
  .mira .light{padding:8px 12px;border-radius:10px;border:1px solid var(--line)}
  .mira .light.l-verde{border-color:#3ad389} .mira .light.l-amarillo{border-color:#f4c20d} .mira .light.l-rojo{border-color:#ff5c6e}
  .sub.fresh{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}
  /* the MIRA list: one row each, details on demand, the answers in tabs */
  .mlist{border:1px solid var(--line);border-radius:18px;overflow:hidden}
  .mrow{margin:0;padding:0;border-top:0}
  .mrow + .mrow{border-top:1px solid var(--line)}
  .mrow > summary{display:grid;grid-template-columns:150px minmax(0,1fr) minmax(0,220px) 170px 120px;gap:16px;align-items:center;padding:14px 20px;cursor:pointer;list-style:none}
  .mrow > summary::-webkit-details-marker{display:none}
  .mrow > summary:hover{background:rgba(255,255,255,.03)}
  .mrow[open] > summary{background:rgba(255,255,255,.04);border-bottom:1px solid var(--line)}
  .mrow.done > summary{opacity:.55}
  .mr-name{display:flex;flex-direction:column;min-width:0}
  .mr-name b{font:400 1.3rem/1.15 "Boska",serif;color:var(--white);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .mr-owner{display:flex;flex-wrap:wrap;gap:6px;align-items:center;min-width:0}
  .mr-biz{color:var(--bone);font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}
  .mr-state{display:flex;align-items:center;gap:6px;justify-content:flex-end}
  .mr-state .dot{width:7px;height:7px;border-radius:50%;background:var(--accent)}
  .tag.t-none{background:transparent;border:1px solid var(--line);color:var(--iron)}
  .mrow-body{padding:18px 20px 22px}
  .mrow-body p{margin:0 0 10px}
  .mrow-body p b{display:block;font:400 11px "Recursive",monospace;font-variation-settings:"MONO" 1;letter-spacing:.06em;text-transform:uppercase;color:var(--iron)}
  .mrow-foot{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;margin-top:16px}
  .mrow-foot .who{margin:0 !important}
  .mrow.done .mrow-foot button{border-color:var(--accent);color:var(--accent)}
  .mtabs{position:relative;margin-top:16px}
  .mtabs > input{position:absolute;opacity:0;pointer-events:none}
  .mtabs > label{display:inline-flex;align-items:center;gap:6px;margin:0 6px 8px 0;padding:6px 14px;border:1px solid var(--line);border-radius:999px;cursor:pointer;
    font:12px "Recursive",monospace;font-variation-settings:"MONO" 1;letter-spacing:.06em;text-transform:uppercase;color:var(--ash)}
  .mtabs > label i{font:500 1rem "Recursive",sans-serif;font-style:normal;font-variation-settings:"CASL" 1,"slnt" -15,"MONO" 0;text-transform:none;color:var(--c)}
  .mt-l-m{--c:var(--b1)} .mt-l-i{--c:var(--b2)} .mt-l-r{--c:var(--b3)} .mt-l-a{--c:var(--b4)} .mt-l-p{--c:var(--accent)}
  .mtabs > input:checked + label{border-color:var(--c);color:var(--white);background:color-mix(in srgb,var(--c) 14%,transparent)}
  .mtabs > input:focus-visible + label{outline:2px solid var(--c);outline-offset:2px}
  .mpanes{padding:16px 18px;border:1px solid var(--line);border-radius:12px;min-height:120px}
  .mp{display:none}
  .mt-m:checked ~ .mpanes .mp-m,.mt-i:checked ~ .mpanes .mp-i,.mt-r:checked ~ .mpanes .mp-r,
  .mt-a:checked ~ .mpanes .mp-a,.mt-p:checked ~ .mpanes .mp-p{display:block}
  .mp .light{padding:8px 12px;border-radius:10px;border:1px solid var(--line)}
  .mp .light.l-verde{border-color:#3ad389} .mp .light.l-amarillo{border-color:#f4c20d} .mp .light.l-rojo{border-color:#ff5c6e}
  @media (max-width:760px){
    .mrow > summary{grid-template-columns:1fr auto;gap:6px 12px}
    .mr-light{grid-column:1 / -1} .mr-owner{grid-column:1 / -1} .mr-when{grid-column:1} .mr-state{grid-column:2}
    .mr-name{grid-column:1 / -1}
  }
  .linkrow{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:12px}
  .props{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:16px}
  .prop{display:flex;flex-direction:column;gap:10px;margin:0;padding:12px 12px 18px}
  .prop > header,.prop > .prop-sum,.prop > .linkrow{padding:0 8px}
  .prop > header{display:flex;flex-direction:column;align-items:flex-start;gap:6px}
  .prop h2{margin:0;font:400 24px/1.1 "Boska",serif}
  .prop-cover{display:block;aspect-ratio:1200/630;border-radius:12px;overflow:hidden;background:#0b0c0d;border:1px solid var(--line)}
  .prop-cover img{width:100%;height:100%;object-fit:cover;object-position:top;display:block}
  .prop-blank{display:grid;place-items:center;width:100%;height:100%}
  .prop-blank img{width:72px;height:auto;opacity:.85}
  .md hr{border:0;border-top:1px solid var(--line);margin:28px 0}
  .md pre{overflow:auto;padding:14px 16px;border:1px solid var(--line);border-radius:12px;background:#0b0c0d;font:12px/1.6 "Recursive",monospace;font-variation-settings:"MONO" 1}
  .md img{max-width:100%;height:auto;border-radius:10px}
  .prop-sum{margin:0;color:var(--ash);font-size:14px;line-height:1.5}
  .prop .linkrow{margin-top:auto}
  .linkrow form{margin:0}
  .tquote{margin:0 0 12px;font:400 1.5rem/1.25 "Boska",serif;color:var(--white)}
  .tmeta{margin:0 0 6px !important}
  .dots{display:inline-flex;gap:4px;vertical-align:-2px;margin-right:6px}
  .dot{width:10px;height:10px;border-radius:50%;display:inline-block}
  .dot.b1{background:var(--b1)} .dot.b2{background:var(--b2)} .dot.b3{background:var(--b3)} .dot.b4{background:var(--b4)} .dot.b5{background:#ff9d3d}
  .dot.off{opacity:.18}
  button.danger{border-color:rgba(255,92,110,.5);color:var(--b3)}
  button.danger:hover{background:var(--b3);color:#000}
  .linkrow input{flex:1;min-width:260px;padding:8px 12px;border-radius:999px;border:1px solid var(--line);background:#000;color:var(--bone)}
  .kicker a{color:var(--ash)}
  .newauth{display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:860px}
  .newauth label{display:flex;flex-direction:column;gap:6px;font:11px "Recursive",monospace;font-variation-settings:"MONO" 1;letter-spacing:.06em;text-transform:uppercase;color:var(--iron)}
  .newauth input{padding:10px 12px;border-radius:10px;border:1px solid var(--line);background:#0b0c0d;color:var(--white);font:15px "Recursive",sans-serif;font-variation-settings:"MONO" 0;text-transform:none;letter-spacing:0}
  .padwrap{grid-column:1 / -1;padding:14px;border-radius:14px;background:#f7f6f2}
  .padlabel{display:block;margin-bottom:8px;color:#6b6f75}
  #pad{display:block;width:100%;height:180px;border-bottom:1px solid #8c9094;touch-action:none;cursor:crosshair;background:#fff;border-radius:8px}
  .padtools{display:flex;gap:8px;margin-top:10px}
  .padtools button{color:#111;border-color:#c9c8c2}
  .newauth .go{grid-column:1 / -1;justify-self:start;background:var(--white);color:#000;border-color:var(--white);padding:11px 20px}
  #padMsg{grid-column:1 / -1;margin:0;color:var(--b3)}
  .sigprev{display:block;max-width:100%;max-height:150px;margin:4px 0 6px}
  .hintline{grid-column:1 / -1;margin:0}
  .hintline a{color:var(--accent)}
  .okline{color:var(--accent);margin:0 0 18px}
  .newauth label input[type=file]{padding:10px;color:var(--ash)}
  .padwrap[hidden]{display:none}
  .padtools .pill{color:#111;border-color:#c9c8c2}
  .totals a{color:var(--ash)} .totals a.on{color:var(--accent)}
  .campaign label{display:flex;align-items:center;gap:10px;justify-content:flex-end}
  .campaign span{font:11px "Recursive",monospace;font-variation-settings:"MONO" 1;letter-spacing:.08em;text-transform:uppercase;color:var(--iron)}
  .campaign select{min-width:230px;padding:9px 36px 9px 14px;border-radius:999px;border:1px solid var(--line);background:#0b0c0d;color:var(--white);
    font:14px "Recursive",sans-serif;font-variation-settings:"MONO" 0;cursor:pointer;appearance:none;
    background-image:linear-gradient(45deg,transparent 50%,var(--ash) 50%),linear-gradient(135deg,var(--ash) 50%,transparent 50%);
    background-position:calc(100% - 18px) 50%,calc(100% - 13px) 50%;background-size:5px 5px;background-repeat:no-repeat}
  .campaign select:focus{outline:2px solid var(--accent);outline-offset:2px}
  .campaign optgroup{font-style:normal;color:var(--iron);background:#0b0c0d}
  .campaign option{color:var(--white);background:#0b0c0d}
  .totals{text-align:right}
  .totals .campaign ~ a,.totals .pickline{display:inline-block;margin-top:10px}
  @media (max-width:720px){.totals{text-align:left}.campaign label{justify-content:flex-start}}
  .pipeline{display:grid;grid-template-columns:repeat(8,1fr);gap:8px;margin-bottom:18px}
  .pipeline a{display:flex;flex-direction:column;gap:2px;padding:12px 14px;border:1px solid var(--line);border-radius:14px;color:var(--ash);text-decoration:none;font:11px "Recursive",monospace;font-variation-settings:"MONO" 1;text-transform:uppercase;letter-spacing:.05em}
  .pipeline b{font:400 1.9rem/1 "Boska",serif;color:var(--white);letter-spacing:0}
  .pipeline a.on{border-color:var(--accent)} .pipeline a.on b{color:var(--accent)}
  .pipeline a.today{border-style:dashed}
  /* the search gets its own row, as wide as the filters above it */
  .search{flex:1 1 100%;display:flex;margin-top:4px}
  .search input,.pform input,.pform select,.pform textarea{padding:8px 12px;border-radius:10px;border:1px solid var(--line);background:#0b0c0d;color:var(--white);font:14px "Recursive",sans-serif;font-variation-settings:"MONO" 0}
  .search input{flex:1;width:100%;min-width:0;border-radius:999px}
  .tablewrap{overflow-x:auto;border:1px solid var(--line);border-radius:14px;margin-bottom:18px}
  .ptable{width:100%;border-collapse:collapse;font-size:14px}
  .ptable th{text-align:left;padding:10px 12px;font:400 11px "Recursive",monospace;font-variation-settings:"MONO" 1;letter-spacing:.06em;text-transform:uppercase;color:var(--iron);border-bottom:1px solid var(--line)}
  .ptable td{padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top}
  .ptable tr:last-child td{border-bottom:0}
  .ptable .tag{white-space:nowrap}
  .ptable a{color:var(--bone)}
  a.biz{color:var(--white);text-decoration:none;font-weight:500}
  a.biz:hover{color:var(--accent)}
  .sub2{display:block;font-size:11px}
  .due{color:var(--b1)}
  .pball{display:inline-flex;align-items:center;gap:8px;white-space:nowrap;font:11px "Recursive",monospace;font-variation-settings:"MONO" 1;letter-spacing:.06em;text-transform:uppercase;color:var(--ash)}
  .pb{--c:#888;position:relative;display:inline-grid;place-items:center;flex:none;width:26px;height:26px;border-radius:50%;font-style:normal;
    background:var(--c);box-shadow:inset -3px -4px 6px rgba(0,0,0,.4),inset 2px 2px 4px rgba(255,255,255,.3)}
  .pb::before{content:"";position:absolute;width:13px;height:13px;border-radius:50%;background:#fffdf5}
  .pb b{position:relative;font:600 9px/1 "Recursive",sans-serif;font-variation-settings:"MONO" 0;color:#111}
  .pb1{--c:#f4c20d} .pb2{--c:#4d7dff} .pb3{--c:#ff5c6e} .pb4{--c:#a375d8} .pb5{--c:#ff9d3d}
  .pb8{--c:#0b0b0b;box-shadow:inset -3px -4px 6px rgba(0,0,0,.6),inset 2px 2px 4px rgba(255,255,255,.18),0 0 0 1px #2a2e31}
  /* the ball picker */
  .ballpick{display:flex;flex-wrap:wrap;gap:8px}
  form .ballpick label{position:relative;display:inline-flex;align-items:center;gap:8px;padding:5px 12px 5px 5px;border:1px solid var(--line);border-radius:999px;cursor:pointer;
    font:11px "Recursive",monospace;font-variation-settings:"MONO" 1;letter-spacing:.04em;text-transform:none;color:var(--ash);flex-direction:row;gap:8px}
  .ballpick input{position:absolute;opacity:0;pointer-events:none}
  .ballpick label:has(input:checked){border-color:var(--white);color:var(--white);background:rgba(255,255,255,.05)}
  .ballpick label:has(input:focus-visible){outline:2px solid var(--accent);outline-offset:2px}
  .ballpick .pb{width:24px;height:24px}
  .searchrow{display:flex;gap:8px}
  .searchrow input{flex:1}
  .minimap{height:300px !important;border:1px solid var(--line);border-radius:12px;overflow:hidden}
  .pform button[disabled]{opacity:.4;cursor:not-allowed}
  .newauth select,.newauth textarea{padding:10px 12px;border-radius:10px;border:1px solid var(--line);background:#0b0c0d;color:var(--white);font:15px "Recursive",sans-serif;font-variation-settings:"MONO" 0;text-transform:none;letter-spacing:0}
  .newauth .wide{grid-column:1 / -1}
  .newauth label[hidden]{display:none}
  .flabel{display:block;margin-bottom:8px;font:11px "Recursive",monospace;font-variation-settings:"MONO" 1;letter-spacing:.06em;text-transform:uppercase;color:var(--iron)}
  .errline{color:var(--b3);margin:0 0 18px}
  .top .addp{align-self:flex-end;margin-bottom:10px}
  /* the map */
  .mapwrap{border:1px solid var(--line);border-radius:16px;overflow:hidden;margin-bottom:10px}
  #map{height:min(72vh,720px);background:#0b0c0d}
  .mapf{cursor:pointer;user-select:none}
  .mapf:not(.on){opacity:.45}
  .pill.mapf.on{background:transparent;border-color:var(--ash);color:var(--white)}
  .ballpill.mapf.on{background:transparent;border-color:var(--ash);color:var(--white)}
  .mapnote{align-self:center;margin:0 4px 0 0}
  .mk{background:none;border:0}
  .mk .pb{width:28px;height:28px;box-shadow:inset -3px -4px 6px rgba(0,0,0,.4),inset 2px 2px 4px rgba(255,255,255,.3),0 2px 6px rgba(0,0,0,.7)}
  .mk.approx .pb{opacity:.75;outline:2px dashed rgba(255,255,255,.55);outline-offset:2px}
  .mk.focus .pb{outline:3px solid var(--accent);outline-offset:3px}
  .mk.origin .pb{width:30px;height:30px}
  .pb16{--c:#0b0b0b;background:linear-gradient(#0b0b0b 0 62%,#f3f1ea 62%)}
  .pb16 b{font-size:8px}
  #map .leaflet-tile-pane{filter:invert(1) hue-rotate(180deg) brightness(.9) contrast(.85) saturate(.6)}
  #map .leaflet-popup-content-wrapper,#map .leaflet-popup-tip{background:#0b0c0d;color:var(--bone);border:1px solid var(--line);box-shadow:0 12px 30px rgba(0,0,0,.6)}
  #map .leaflet-popup-content{margin:14px 16px}
  #map a.leaflet-popup-close-button{color:var(--ash)}
  .mpop{min-width:220px;font:14px/1.4 "Recursive",sans-serif;font-variation-settings:"MONO" 0}
  #map .mpop h4{margin:2px 0 4px;font:400 1.4rem/1.1 "Boska",serif;color:var(--white)}
  #map .mpop p{margin:0 0 6px;color:var(--bone)}
  .mpop .mono{font-size:11px}
  .mlinks{display:flex;flex-wrap:wrap;gap:10px;margin-top:8px !important}
  #map .mlinks a{color:var(--accent)}
  .leaflet-control-attribution{background:rgba(0,0,0,.6) !important;color:var(--iron) !important}
  .leaflet-control-attribution a{color:var(--ash) !important}
  .ballpill{display:inline-flex;align-items:center;gap:8px;padding:4px 14px 4px 5px}
  .ballpill .pb{width:22px;height:22px;font-size:9px}
  .ballpill .pb::before{width:11px;height:11px}
  .tag.st-por_contactar{background:transparent;color:var(--ash);border:1px solid var(--line)}
  .tag.st-contactado{background:var(--b2);color:#fff} .tag.st-respondio{background:var(--b1)} .tag.st-reunion{background:#ff9d3d}
  .tag.st-propuesta{background:var(--b4);color:#fff} .tag.st-cliente{background:var(--accent)} .tag.st-descartado{background:#2a2e31;color:var(--ash)}
  .tag.t-net{background:transparent;color:var(--ash);border:1px solid var(--line)}
  .tags{display:flex;gap:6px;flex-wrap:wrap}
  .pgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .pgrid .sub{margin-bottom:16px}
  .sub h3{margin-bottom:14px}
  .sub a{color:var(--accent)}
  .pill.go-chat{display:inline-block;margin-top:4px;border-color:var(--accent);color:var(--accent)}
  textarea.msg{width:100%;padding:14px;border-radius:12px;border:1px solid var(--line);background:#0b0c0d;color:var(--bone);font:15px/1.5 "Recursive",sans-serif;font-variation-settings:"MONO" 0;resize:vertical}
  .pform{display:flex;flex-direction:column;gap:12px}
  .pform .fgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  @media (max-width:640px){ .pform .fgrid{grid-template-columns:1fr} }
  .pform label{display:flex;flex-direction:column;gap:6px;font:11px "Recursive",monospace;font-variation-settings:"MONO" 1;letter-spacing:.06em;text-transform:uppercase;color:var(--iron)}
  .pform .go{align-self:flex-start;background:var(--white);color:#000;border-color:var(--white)}
  .timeline,.plist{list-style:none;margin:0;padding:0}
  .timeline li,.plist li{padding:10px 0;border-bottom:1px solid var(--line)}
  .timeline li:last-child,.plist li:last-child{border-bottom:0}
  .timeline .mono{display:block;margin-bottom:4px}
  .plist .bio{color:var(--ash);font-size:13px}
  .md{max-width:900px}
  .md h2{font:400 2.6rem/1.05 "Boska",serif;color:var(--white);margin:0 0 18px}
  .md h3{font:400 1.8rem/1.1 "Boska",serif;color:var(--white);text-transform:none;letter-spacing:0;margin:34px 0 12px}
  .md h4{font:400 1.35rem/1.2 "Boska",serif;color:var(--white);margin:24px 0 8px}
  .md h5{font:500 12px "Recursive",monospace;font-variation-settings:"MONO" 1;text-transform:uppercase;letter-spacing:.06em;color:var(--ash);margin:18px 0 8px}
  .md blockquote{margin:12px 0;padding:12px 16px;border-left:2px solid var(--accent);background:rgba(255,255,255,.03);color:var(--bone)}
  .md a{color:var(--accent)} .md li.deep{margin-left:22px;color:var(--ash)}
  @media (max-width:900px){.pipeline{grid-template-columns:repeat(4,1fr)}.pgrid{grid-template-columns:1fr}}
  @media (max-width:720px){.pipeline{grid-template-columns:repeat(2,1fr)}.search{margin-left:0;width:100%}.search input{min-width:0;width:100%}.tiles{grid-template-columns:1fr}.mira{grid-template-columns:1fr}.when{margin-left:0}.newauth{grid-template-columns:1fr}}
  /* the admin shell: menu on the left, the section on the right */
  main.wide{max-width:none;padding:0}
  .shell{display:grid;grid-template-columns:240px minmax(0,1fr);min-height:100vh}
  .side{position:sticky;top:0;height:100vh;overflow-y:auto;display:flex;flex-direction:column;gap:18px;padding:26px 16px;border-right:1px solid var(--line);background:#030404}
  .side-brand{display:flex;align-items:center;gap:10px;padding:0 8px;color:var(--white);text-decoration:none;font:500 13px "Recursive",monospace;font-variation-settings:"MONO" 1}
  .side-brand img{width:26px;height:auto}
  .side-brand span{margin-left:auto;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--iron)}
  .side-nav{display:flex;flex-direction:column;gap:2px}
  .nav-group{margin:16px 8px 6px;font:11px "Recursive",monospace;font-variation-settings:"MONO" 1;letter-spacing:.1em;text-transform:uppercase;color:var(--iron)}
  .nav-item{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 12px;border-radius:10px;color:var(--ash);text-decoration:none;font-size:14px}
  .nav-item:hover{background:rgba(255,255,255,.04);color:var(--white)}
  .nav-item.on{background:rgba(58,211,137,.1);color:var(--white);box-shadow:inset 2px 0 0 var(--accent)}
  .badge{min-width:22px;padding:1px 7px;border-radius:999px;background:var(--b1);color:#000;font:600 11px "Recursive",monospace;font-variation-settings:"MONO" 1;text-align:center}
  .side-site{margin-top:auto;padding:8px;color:var(--iron);font:12px "Recursive",monospace;font-variation-settings:"MONO" 1;text-decoration:none}
  .side-site:hover{color:var(--accent)}
  .side-out{padding:0 8px}
  .side-out button{width:100%;font-size:12px;color:var(--ash)}
  /* the sign-in page */
  .signin{max-width:380px;margin:12vh auto 0;display:flex;flex-direction:column;gap:14px}
  .signin-ball{width:44px;height:auto}
  .signin h1{font-size:clamp(2.2rem,8vw,3rem)}
  .signin .pform input{font-size:16px;padding:12px 14px}
  .signin .go{align-self:stretch;padding:12px}
  .content{min-width:0;padding:40px 40px 80px;max-width:1240px}
  .tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
  @media (max-width:1100px){.tiles{grid-template-columns:repeat(3,1fr)}}
  /* a MIRA and its prospect */
  .mlink{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:-4px 0 14px}
  .mlink .biz{margin:0 2px}
  .picks{list-style:none;margin:0 0 10px;padding:0}
  .pick{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)}
  .pick:last-child{border-bottom:0}
  .pick .go,.linkrow .go{background:var(--white);color:#000;border-color:var(--white)}
  .linkline{display:block;word-break:break-all;color:var(--bone)}
  /* the call forms */
  .frow{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
  details{margin-top:12px;border-top:1px solid var(--line);padding-top:12px}
  details > summary{cursor:pointer;color:var(--accent);font:500 13px "Recursive",sans-serif;font-variation-settings:"MONO" 0}
  details[open] > summary{margin-bottom:12px}
  @media (max-width:720px){.pick{grid-template-columns:1fr}}
  .tile{display:flex;flex-direction:column;gap:4px;padding:18px 20px;border:1px solid var(--line);border-radius:16px;text-decoration:none;background:rgba(255,255,255,.02)}
  .tile:hover{border-color:var(--ash)}
  .tile.hot{border-color:var(--b1)}
  .tile-label{font:11px "Recursive",monospace;font-variation-settings:"MONO" 1;letter-spacing:.08em;text-transform:uppercase;color:var(--iron)}
  .tile b{font:400 3rem/1 "Boska",serif;color:var(--white)}
  .tile.hot b{color:var(--b1)}
  .tile-line{font-size:13px;color:var(--ash)}
  @media (max-width:900px){
    .shell{grid-template-columns:1fr}
    .side{position:sticky;top:0;z-index:5;height:auto;flex-direction:row;align-items:center;gap:10px;padding:10px 14px;border-right:0;border-bottom:1px solid var(--line);overflow-x:auto}
    .side-brand span,.side-site,.nav-group{display:none}
    .side-nav{flex-direction:row;gap:4px}
    .nav-item{white-space:nowrap;padding:7px 10px}
    .content{padding:24px 16px 60px}
    .tiles{grid-template-columns:1fr 1fr}
  }
</style></head><body><main${shell ? ' class="wide"' : ""}>${content}</main>${script}</body></html>`, {
    status,
    headers:{ "Content-Type":"text/html; charset=utf-8", "Cache-Control":"no-store", "X-Robots-Tag":"noindex, nofollow" }
  });
}
