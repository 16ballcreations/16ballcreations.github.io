/* Genera las páginas de servicio desde scripts/servicios-data.mjs:
     <BASE>servicios/                 el índice de los seis servicios
     <BASE>servicios/<slug>/          una página por servicio
     assets/js/servicios.js           lo mínimo para la portada (nombres, bolas)
   Los proyectos de cada página salen de assets/js/projects.js.

   Uso:  node scripts/servicios.mjs
   Mientras la v4 se evalúa, BASE es "/v4/" y las páginas llevan noindex.
   Para publicarla como portada: BASE = "/", PREVIEW = false, y volver a
   correr el script (las páginas quedan en servicios/ en la raíz). */
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";
import { SERVICES } from "./servicios-data.mjs";

const BASE = "/v4/";
const PREVIEW = true;
const ORIGIN = "https://page.16ballcreations.workers.dev";
const PRICE = "$1.500.000";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, BASE.replace(/^\/|\/$/g, ""), "servicios");

/* projects.js is a browser script: run it with a window of its own */
const sandbox = { window: {} };
vm.runInNewContext(await readFile(join(root, "assets/js/projects.js"), "utf8"), sandbox);
const PROJECTS = sandbox.window.PROJECTS.filter(p => !p.archived && p.order).sort((a, b) => a.order - b.order);

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const url = path => ORIGIN + BASE + path;
const ball = (n, extra = "") => `<span class="ball${extra ? " " + extra : ""}" data-n="${n}" aria-hidden="true"></span>`;
const HEX = { 1:"#f4c20d", 2:"#4d7dff", 3:"#ff5c6e", 4:"#a375d8", 5:"#ff9d3d", 6:"#3ad389" };

function head({ title, description, path, jsonld }){
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#000000">
<meta name="robots" content="${PREVIEW ? "noindex, follow" : "index, follow, max-image-preview:large"}">
<link rel="canonical" href="${url(path)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_CO">
<meta property="og:site_name" content="16 Ball Creations">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url(path)}">
<meta property="og:image" content="${ORIGIN}/assets/img/og-16ballcreations.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/assets/img/icon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<script type="application/ld+json">
${JSON.stringify(jsonld, null, 2)}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/site.css?v=6">
<link rel="stylesheet" href="/assets/css/v4.css?v=1">
</head>`;
}

function header(){
  return `<div class="progress" id="progress" aria-hidden="true"></div>
<header class="site-header is-stuck" id="siteHeader">
  <div class="wrap header-inner glass">
    <a class="brand" href="${BASE}" aria-label="16 Ball Creations, inicio">
      <img src="/assets/img/ball-16.png?v=2" alt="" width="340" height="341">
      <span>16 Ball Creations</span>
    </a>
    <button class="menu-btn" id="menuBtn" type="button" aria-expanded="false" aria-controls="siteNav" aria-label="Abrir el men&uacute;">
      <span class="menu-bars" aria-hidden="true"></span>
    </button>
    <nav class="nav" id="siteNav" aria-label="Secciones">
      <a href="${BASE}#proyectos">Proyectos<sup>${PROJECTS.length}</sup></a>
      <a href="${BASE}servicios/">Servicios</a>
      <a href="${BASE}#proceso">Cómo trabajamos</a>
      <a href="${BASE}#estudio">Estudio</a>
      <a href="${BASE}#contacto">Contacto</a>
      <a class="btn btn-sm btn-primary" href="/mira/?o=web">Haz tu MIRA</a>
    </nav>
  </div>
</header>`;
}

function footer(){
  return `<footer class="site-footer">
  <div class="wrap">
    <ul class="footer-svc">
${SERVICES.map(s => `      <li><a href="${BASE}servicios/${s.slug}/">${esc(s.name)}</a></li>`).join("\n")}
      <li><a href="/mira/?o=web">MIRA</a></li>
    </ul>
    <div class="footer-inner">
      <p>&copy; 2026 16 Ball Creations &middot; Si no existe, lo creamos.</p>
      <p class="meta" aria-hidden="true"><span>Medellín</span><span>6.25°N 75.57°W</span><span>Est. 2013</span></p>
      <div class="footer-links">
        <a href="mailto:16ballcreations@gmail.com">Correo</a>
        <a href="https://www.instagram.com/16ballcreations" rel="noopener noreferrer">Instagram</a>
        <a href="https://github.com/16ballcreations" rel="noopener noreferrer">GitHub</a>
      </div>
    </div>
  </div>
</footer>
<script src="/assets/js/site.js?v=6" defer></script>
</body>
</html>
`;
}

/* a project card, the same markup v4.js draws on the home page */
function card(p, i){
  const first = (p.links || [])[0];
  const ext = l => l.url.startsWith("#") ? "" : ` rel="noopener noreferrer" target="_blank"`;
  const linkUrl = l => l.url.startsWith("#") ? BASE + l.url : l.url;
  const media = `<img src="/${esc(p.image)}" alt="${esc(p.alt || p.title)}" width="1200" height="750" loading="lazy"><span class="card-n">${String(i + 1).padStart(2, "0")}</span>`;
  const tags = (p.services || []).map(k => SERVICES.find(s => s.key === k)).filter(Boolean)
    .map(s => `<li><a href="${BASE}servicios/${s.slug}/">${esc(s.name)}</a></li>`).join("");
  return `<li class="card">
          ${first ? `<a class="card-media" href="${esc(linkUrl(first))}"${ext(first)} aria-label="${esc(p.title + ": " + first.label)}">${media}</a>` : `<div class="card-media">${media}</div>`}
          <div class="card-body">
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.short || p.summary)}</p>
            <div class="card-foot"><ul class="svc-tags">${tags}</ul><span class="status" data-s="${esc(p.status)}">${esc(p.status)}${p.year ? " · " + esc(p.year) : ""}</span></div>
            ${(p.links || []).length ? `<div class="card-links">${p.links.map(l => `<a class="btn btn-sm" href="${esc(linkUrl(l))}"${ext(l)}>${esc(l.label)}</a>`).join("")}</div>` : p.note ? `<span class="note mono">${esc(p.note)}</span>` : ""}
          </div>
        </li>`;
}

const PROVIDER = {
  "@type": "ProfessionalService",
  "@id": ORIGIN + "/#estudio",
  name: "16 Ball Creations",
  url: ORIGIN + "/"
};

function servicePage(s){
  const path = `servicios/${s.slug}/`;
  const projects = PROJECTS.filter(p => (p.services || []).includes(s.key));
  const others = SERVICES.filter(o => o !== s);
  const description = `${s.line} ${s.intro.split(". ")[0]}. Desde ${PRICE} COP; empieza con tu MIRA gratis.`.slice(0, 300);
  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": url(path) + "#servicio",
        name: s.name,
        serviceType: s.name,
        description: s.line + " " + s.intro,
        provider: PROVIDER,
        areaServed: [{ "@type": "City", name: "Medellín" }, { "@type": "Country", name: "Colombia" }],
        url: url(path),
        offers: {
          "@type": "Offer",
          priceCurrency: "COP",
          priceSpecification: { "@type": "PriceSpecification", minPrice: 1500000, priceCurrency: "COP" }
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Lo que incluye",
          itemListElement: s.includes.map(i => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: i } }))
        }
      },
      {
        "@type": "FAQPage",
        mainEntity: s.faq.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } }))
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: url("") },
          { "@type": "ListItem", position: 2, name: "Servicios", item: url("servicios/") },
          { "@type": "ListItem", position: 3, name: s.name, item: url(path) }
        ]
      }
    ]
  };

  return `${head({ title: `${s.title} · 16 Ball Creations`, description, path, jsonld })}
<body class="page-svc" style="--accent:${HEX[s.ball]}">
${header()}

<main id="top">
  <section class="svc-hero">
    <div class="wrap">
      <ol class="crumbs">
        <li><a href="${BASE}">Inicio</a></li>
        <li><a href="${BASE}servicios/">Servicios</a></li>
        <li aria-current="page">${esc(s.name)}</li>
      </ol>
      ${ball(s.ball)}
      <h1>${esc(s.title)}, <em>${esc(s.em)}</em></h1>
      <p class="line">${esc(s.line)}</p>
      <div class="actions">
        <a class="btn btn-primary" href="/mira/?o=web">Haz tu MIRA gratis</a>
        <a class="btn" href="${BASE}#contacto">Escríbenos</a>
      </div>
    </div>
  </section>

  <section class="sec" id="incluye">
    <div class="wrap svc-intro">
      <div>
        <p class="kicker">Para quién es</p>
        <p class="lead">${esc(s.intro)}</p>
      </div>
      <div>
        <p class="kicker">Lo que incluye</p>
        <ul class="inc">
${s.includes.map(i => `          <li>${esc(i)}</li>`).join("\n")}
        </ul>
      </div>
    </div>
  </section>

  <section class="sec" id="proceso">
    <div class="wrap">
      <div class="sec-head row-head">
        <div>
          <p class="kicker">Cómo lo hacemos</p>
          <h2 class="big">Paso a <em>paso</em></h2>
        </div>
        <p class="lead">Siempre en el mismo orden: primero entendemos tu marca, después construimos. Ningún paso se salta.</p>
      </div>
      <ol class="svc-steps">
${s.steps.map((st, i) => `        <li class="reveal">${ball(i + 1)}<h3>${esc(st.t)}</h3><p>${esc(st.d)}</p></li>`).join("\n")}
      </ol>
    </div>
  </section>
${projects.length ? `
  <section class="sec" id="proyectos">
    <div class="wrap">
      <div class="sec-head row-head">
        <div>
          <p class="kicker">Proyectos</p>
          <h2 class="big">Lo hemos <em>hecho</em></h2>
        </div>
        <p class="lead">${projects.length === 1 ? "Un proyecto" : projects.length + " proyectos"} donde hicimos ${esc(s.name.toLowerCase())}.</p>
      </div>
      <ol class="work">
        ${projects.map(card).join("\n        ")}
      </ol>
    </div>
  </section>
` : ""}
  <section class="sec" id="preguntas">
    <div class="wrap">
      <div class="sec-head row-head">
        <div>
          <p class="kicker">Preguntas frecuentes</p>
          <h2 class="big">Lo que nos <em>preguntan</em></h2>
        </div>
        <p class="lead">Si tu pregunta no está aquí, escríbenos: respondemos en menos de 24 horas.</p>
      </div>
      <div class="faq">
${s.faq.map((f, i) => `        <details${i === 0 ? " open" : ""}><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("\n")}
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="wrap">
      <div class="cta-band glass">
        <div>
          <h2>Empieza por tu <em>MIRA</em></h2>
          <p>Cinco preguntas sobre tu marca, unos tres minutos y gratis. Con tus respuestas preparamos una llamada de 30 minutos. Proyectos desde ${PRICE} COP.</p>
        </div>
        <a class="btn btn-primary" href="/mira/?o=web">Haz tu MIRA gratis <span aria-hidden="true">&rarr;</span></a>
      </div>
    </div>
  </section>

  <section class="sec" id="otros">
    <div class="wrap">
      <p class="kicker">Otros servicios</p>
      <ul class="others">
${others.map(o => `        <li><a href="${BASE}servicios/${o.slug}/">${ball(o.ball)}<span>${esc(o.name)}</span></a></li>`).join("\n")}
      </ul>
    </div>
  </section>
</main>

${footer()}`;
}

/* a service as a list item: shared by the overview page and the home page */
export function serviceItem(s, base = BASE){
  return `<li class="reveal" style="--c:${HEX[s.ball]}">
          ${ball(s.ball)}
          <h3><a href="${base}servicios/${s.slug}/">${esc(s.name)}</a></h3>
          <p>${esc(s.line)}</p>
          <p class="inc-label">Lo que incluye</p>
          <ul class="inc">${s.includes.slice(0, 4).map(i => `<li>${esc(i)}</li>`).join("")}</ul>
          <a class="more" href="${base}servicios/${s.slug}/">Ver el servicio <span aria-hidden="true">&rarr;</span></a>
        </li>`;
}

function indexPage(){
  const path = "servicios/";
  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        name: "Servicios de 16 Ball Creations",
        itemListElement: SERVICES.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: s.name, url: url(`servicios/${s.slug}/`) }))
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: url("") },
          { "@type": "ListItem", position: 2, name: "Servicios", item: url(path) }
        ]
      }
    ]
  };
  return `${head({
    title: "Servicios: marca, páginas web, tiendas y redes en Medellín · 16 Ball Creations",
    description: "Identidad de marca, páginas web, tiendas en línea, sistemas para tu negocio, video para redes y asesoría de imagen, desde Medellín. Todo empieza con tu MIRA, gratis. Proyectos desde " + PRICE + " COP.",
    path, jsonld
  })}
<body class="page-svc">
${header()}

<main id="top">
  <section class="svc-hero">
    <div class="wrap">
      <ol class="crumbs">
        <li><a href="${BASE}">Inicio</a></li>
        <li aria-current="page">Servicios</li>
      </ol>
      <h1>Lo que hacemos, <em>en orden</em></h1>
      <p class="line">Primero entendemos tu marca: de dónde viene, por qué nació y a dónde va. Después le damos forma y la llevamos a donde vive. Proyectos desde ${PRICE} COP.</p>
      <div class="actions">
        <a class="btn btn-primary" href="/mira/?o=web">Haz tu MIRA gratis</a>
        <a class="btn" href="${BASE}#proyectos">Ver proyectos</a>
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="wrap">
      <ul class="svc svc-all">
        ${SERVICES.map(s => serviceItem(s)).join("\n        ")}
      </ul>
    </div>
  </section>
</main>

${footer()}`;
}

/* the home page needs the names, slugs and balls: nothing more */
const clientData = `/* Generado por scripts/servicios.mjs desde scripts/servicios-data.mjs: no lo edites a mano. */
window.SERVICES = ${JSON.stringify(SERVICES.map(({ key, slug, ball, name }) => ({ key, slug, ball, name })), null, 2)};
`;

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, "index.html"), indexPage());
for(const s of SERVICES){
  await mkdir(join(outDir, s.slug), { recursive: true });
  await writeFile(join(outDir, s.slug, "index.html"), servicePage(s));
}
await writeFile(join(root, "assets/js/servicios.js"), clientData);

/* the home page carries the same list, written in place between markers so
   search engines read it without running any script */
const homePath = join(root, BASE.replace(/^\/|\/$/g, ""), "index.html");
const fill = (html, name, body, indent) => html.replace(
  new RegExp(`(<!-- ${name}:inicio[^>]*-->)[\\s\\S]*?(\\n\\s*<!-- ${name}:fin -->)`),
  (m, a, b) => `${a}\n${indent}${body}${b}`
);
let home = await readFile(homePath, "utf8");
home = fill(home, "servicios", SERVICES.map(s => serviceItem(s, "")).join("\n        "), "        ");
home = fill(home, "servicios-pie", `<ul class="footer-svc">${SERVICES.map(s => `<li><a href="servicios/${s.slug}/">${esc(s.name)}</a></li>`).join("")}<li><a href="/mira/?o=web">MIRA</a></li></ul>`, "    ");
await writeFile(homePath, home);
console.log(`servicios: ${SERVICES.length} páginas en ${BASE}servicios/ ${PREVIEW ? "(vista previa, noindex)" : ""}`);
