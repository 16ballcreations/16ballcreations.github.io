/* Genera las páginas de servicio y de proyecto, en español y en inglés:
     /proyectos/ y /proyectos/<caso>/          desde scripts/proyectos-data.mjs
     /en/projects/ y /en/projects/<caso>/      (el mismo archivo, campo en)
     /servicios/ y /servicios/<slug>/          desde scripts/servicios-data.mjs
     /en/services/ y /en/services/<slug>/      desde scripts/services-en-data.mjs
     assets/js/servicios.js                    lo mínimo para las portadas
   y escribe la lista de servicios en index.html y en/index.html, entre los
   marcadores servicios:inicio y servicios-pie:inicio.
   Los proyectos de cada página salen de assets/js/projects.js (su campo en
   para el inglés). Cada página enlaza a su par en el otro idioma.

   Uso:  node scripts/servicios.mjs
   PREVIEW = true pone noindex a todo, para probar una versión aparte.
   Si agregas o quitas un servicio, hazlo en los dos idiomas (misma key) y
   actualiza sitemap.xml. */
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";
import { SERVICES, HOME_FAQ } from "./servicios-data.mjs";
import { SERVICES_EN, HOME_FAQ as HOME_FAQ_EN } from "./services-en-data.mjs";
import { CASES, CASE_WORDS } from "./proyectos-data.mjs";

const PREVIEW = false;
const ORIGIN = "https://16ballcreations.com";
const MAIL = "crea@16ballcreations.com";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/* projects.js is a browser script: run it with a window of its own */
const sandbox = { window: {} };
vm.runInNewContext(await readFile(join(root, "assets/js/projects.js"), "utf8"), sandbox);
const PROJECTS = sandbox.window.PROJECTS.filter(p => !p.archived && p.order).sort((a, b) => a.order - b.order);

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ball = (n, extra = "") => `<span class="ball${extra ? " " + extra : ""}" data-n="${n}" aria-hidden="true"></span>`;
const HEX = { 1:"#f4c20d", 2:"#4d7dff", 3:"#ff5c6e", 4:"#a375d8", 5:"#ff9d3d", 6:"#3ad389" };

/* everything that changes with the language */
const LOCALES = {
  es: {
    lang: "es", ogLocale: "es_CO", base: "/", dir: "servicios", home: "index.html", data: SERVICES, homeFaq: HOME_FAQ,
    mira: "/mira/", price: "$700.000 COP", minPrice: 700000, currency: "COP",
    status: {},
    t: {
      home: "Inicio", homeLabel: "16 Ball Creations, inicio", openMenu: "Abrir el men&uacute;", sections: "Secciones",
      work: "Proyectos", services: "Servicios", how: "Cómo trabajamos", studio: "Estudio", contact: "Contacto",
      miraBtn: "Haz tu MIRA", miraFree: "Haz tu MIRA gratis", write: "Escríbenos", seeWork: "Ver proyectos",
      slogan: "Si no existe, lo creamos.", mail: "Correo", other: "English", otherShort: "EN",
      forWhom: "Para quién es", includes: "Lo que incluye", howK: "Cómo lo hacemos", stepsH: "Paso a <em>paso</em>",
      stepsLead: "Siempre en el mismo orden: primero entendemos tu marca, después construimos. Ningún paso se salta.",
      workH: "Lo hemos <em>hecho</em>",
      workLead: (n, name) => `${n === 1 ? "Un proyecto" : n + " proyectos"} donde hicimos ${name.toLowerCase()}.`,
      faqK: "Preguntas frecuentes", faqH: "Lo que nos <em>preguntan</em>",
      faqLead: "Si tu pregunta no está aquí, escríbenos: respondemos en menos de 24 horas.",
      ctaH: "Empieza por tu <em>MIRA</em>",
      ctaP: price => `Cinco preguntas sobre tu marca, unos tres minutos y gratis. Con tus respuestas preparamos una llamada de 30 minutos. Si quieres el diagnóstico completo por escrito, la auditoría de marca cuesta ${price}.`,
      others: "Otros servicios", seeService: "Ver el servicio",
      desc: (s, price) => s.what + (s.price ? ` Cuesta ${price}.` : ""),
      where: "Dónde", price: "Precio", from: "Desde", reach: "Escríbenos",
      titleWhere: "desde Medellín",
      idxTitle: "Servicios: marca, páginas web, tiendas y redes · 16 Ball Creations",
      idxDesc: price => `Auditoría e identidad de marca, páginas web, tiendas en línea, sistemas y asesoría de imagen, desde Medellín. La auditoría cuesta ${price}.`,
      idxH1: "Servicios de marca y páginas web, <em>en orden</em>",
      idxH2: "Seis servicios, <em>una sola historia</em>",
      idxLine: price => `Primero entendemos tu marca: de dónde viene, por qué nació y a dónde va. Después le damos forma y la llevamos a donde vive. La puerta de entrada es la auditoría de marca, ${price}.`,
      listName: "Servicios de 16 Ball Creations", catalog: "Lo que incluye"
    }
  },
  en: {
    lang: "en", ogLocale: "en_US", base: "/en/", dir: "services", home: "en/index.html", data: SERVICES_EN, homeFaq: HOME_FAQ_EN,
    mira: "/en/mira/", price: "US$200", minPrice: 200, currency: "USD",
    status: { "En línea":"Live", "Por estrenar":"Coming soon", "Continuo":"Ongoing", "En desarrollo":"In development" },
    t: {
      home: "Home", homeLabel: "16 Ball Creations, home", openMenu: "Open the menu", sections: "Sections",
      work: "Work", services: "Services", how: "How we work", studio: "Studio", contact: "Contact",
      miraBtn: "Start your MIRA", miraFree: "Start your free MIRA", write: "Write to us", seeWork: "See our work",
      slogan: "If it doesn't exist, we create it.", mail: "Email", other: "Español", otherShort: "ES",
      forWhom: "Who it's for", includes: "What's included", howK: "How we do it", stepsH: "Step by <em>step</em>",
      stepsLead: "Always in the same order: first we understand your brand, then we build. No step gets skipped.",
      workH: "We've <em>done it</em>",
      workLead: (n, name) => `${n === 1 ? "One project" : n + " projects"} where we did ${name.toLowerCase()}.`,
      faqK: "Questions", faqH: "What people <em>ask us</em>",
      faqLead: "If your question isn't here, write to us: we reply within 24 hours.",
      ctaH: "Start with your <em>MIRA</em>",
      ctaP: price => `Five questions about your brand, about three minutes, and free. We use your answers to prepare a 30-minute call. If you want the full diagnosis in writing, the brand audit costs ${price}.`,
      others: "Other services", seeService: "See the service",
      desc: (s, price) => s.what + (s.price ? ` It costs ${price}.` : ""),
      where: "Where", price: "Price", from: "From", reach: "Write to us",
      titleWhere: "from Medellín",
      idxTitle: "Services: brand, websites and stores · 16 Ball Creations",
      idxDesc: price => `Brand audit and identity, websites, online stores, business systems and image advisory, from Medellín. The brand audit costs ${price}.`,
      idxH1: "Brand and website services, <em>in order</em>",
      idxH2: "Six services, <em>one story</em>",
      idxLine: price => `First we understand your brand: where it comes from, why it was born and where it's going. Then we give it shape and take it where it lives. The way in is the brand audit, ${price}.`,
      listName: "16 Ball Creations services", catalog: "What's included"
    }
  }
};
const OTHER = { es: "en", en: "es" };

const svcPath = (L, s) => `${L.dir}/${s.slug}/`;
const abs = (L, path) => ORIGIN + L.base + path;
/* the same page in the other language: a service by its key, or the index */
function pair(L, key){
  const O = LOCALES[OTHER[L.lang]];
  if(!key){ return O.base + O.dir + "/"; }
  return O.base + svcPath(O, O.data.find(s => s.key === key));
}
/* a project in this language: the English fields over the Spanish ones */
const tr = (L, p) => L.lang === "en" && p.en ? { ...p, ...p.en } : p;

function head(L, { title, description, path, key, jsonld, other, image }){
  const O = LOCALES[OTHER[L.lang]];
  const here = abs(L, path), there = ORIGIN + (other || pair(L, key));
  const es = L.lang === "es" ? here : there, en = L.lang === "en" ? here : there;
  return `<!DOCTYPE html>
<html lang="${L.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#000000">
<meta name="robots" content="${PREVIEW ? "noindex, follow" : "index, follow, max-image-preview:large"}">
<link rel="canonical" href="${here}">
<link rel="alternate" hreflang="es" href="${es}">
<link rel="alternate" hreflang="en" href="${en}">
<link rel="alternate" hreflang="x-default" href="${es}">
<meta property="og:type" content="website">
<meta property="og:locale" content="${L.ogLocale}">
<meta property="og:locale:alternate" content="${O.ogLocale}">
<meta property="og:site_name" content="16 Ball Creations">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${here}">
<meta property="og:image" content="${image ? ORIGIN + "/" + image.replace(/\?.*$/, "") : ORIGIN + "/assets/img/og-16ballcreations.jpg"}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="${image ? 750 : 630}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/assets/img/icon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<script type="application/ld+json">
${JSON.stringify(jsonld, null, 2)}
</script>
<link rel="preload" href="/assets/fonts/boska-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/recursive-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/fuentes.css?v=2">
<link rel="stylesheet" href="/assets/css/site.css?v=16">
<link rel="stylesheet" href="/assets/css/v4.css?v=15">
</head>`;
}

function header(L, key, other){
  const t = L.t;
  return `<div class="progress" id="progress" aria-hidden="true"></div>
<header class="site-header is-stuck" id="siteHeader">
  <div class="wrap header-inner glass">
    <a class="brand" href="${L.base}" aria-label="${t.homeLabel}">
      <img src="/assets/img/ball-16.png?v=2" alt="" width="340" height="341">
      <span>16 Ball Creations</span>
    </a>
    <button class="menu-btn" id="menuBtn" type="button" aria-expanded="false" aria-controls="siteNav" aria-label="${t.openMenu}">
      <span class="menu-bars" aria-hidden="true"></span>
    </button>
    <nav class="nav" id="siteNav" aria-label="${t.sections}">
      <a href="${L.base}#proyectos">${t.work}<sup>${PROJECTS.length}</sup></a>
      <a href="${L.base}${L.dir}/">${t.services}</a>
      <a href="${L.base}#proceso">${t.how}</a>
      <a href="${L.base}#estudio">${t.studio}</a>
      <a href="${L.base}#contacto">${t.contact}</a>
      <a class="lang" href="${other || pair(L, key)}" hreflang="${OTHER[L.lang]}" lang="${OTHER[L.lang]}" aria-label="${t.other}">${t.otherShort}</a>
      <a class="btn btn-sm btn-primary" href="${L.mira}">${t.miraBtn}</a>
    </nav>
  </div>
</header>`;
}

function footer(L){
  const t = L.t;
  return `<footer class="site-footer">
  <div class="wrap">
    ${footerServices(L, L.base)}
    <div class="footer-inner">
      <p>&copy; 2026 16 Ball Creations &middot; ${esc(t.slogan)}</p>
      <p class="meta" aria-hidden="true"><span>Medellín</span><span>6.25°N 75.57°W</span><span>Est. 2013</span></p>
      <div class="footer-links">
        <a href="mailto:${MAIL}">${t.mail}</a>
        <a href="https://www.instagram.com/16ballcreations" rel="noopener noreferrer">Instagram</a>
        <a href="https://github.com/16ballcreations" rel="noopener noreferrer">GitHub</a>
      </div>
    </div>
  </div>
</footer>
<script src="/assets/js/site.js?v=8" defer></script>
</body>
</html>
`;
}
function footerServices(L, base){
  return `<ul class="footer-svc">${L.data.map(s => `<li><a href="${base}${svcPath(L, s)}">${esc(s.name)}</a></li>`).join("")}<li><a href="${L.mira}">MIRA</a></li></ul>`;
}

/* Modularity's own site, and its two styles shown with the dark/light slider
   (assets/js/site.js): the home section and the case page share this markup */
const MODY_SITE = { es: "https://modularity.16ballcreations.com/", en: "https://modularity.16ballcreations.com/en/" };
const MODY_STYLES = {
  es: { list: "Estilos de la interfaz", bar: "modularity / taller demo", slider: "Comparar el tema oscuro y el claro", half: "Mitad oscuro, mitad claro", dark: "Oscuro", light: "Claro",
    note: "Dos estilos, Glass y Classic, cada uno en oscuro o claro: cada negocio elige cómo se ve. Desliza para comparar.",
    altDark: s => `Panel principal de Modularity en estilo ${s} y tema oscuro, para un taller de demostración: ventas del día, citas, facturas pendientes, órdenes de reparación y estado del equipo`,
    altLight: s => `El mismo panel en estilo ${s} y tema claro` },
  en: { list: "Interface styles", bar: "modularity / demo shop", slider: "Compare the dark and light themes", half: "Half dark, half light", dark: "Dark", light: "Light",
    note: "Two styles, Glass and Classic, each in dark or light: every business picks how it looks. Drag to compare.",
    altDark: s => `Modularity's main dashboard in the ${s} style and dark theme, for a demo repair shop: today's sales, appointments, pending invoices, repair orders and team status (interface in Spanish)`,
    altLight: s => `The same dashboard in the ${s} style and light theme` }
};
function modShowcase(L, lazy = true){
  const W = MODY_STYLES[L.lang];
  const img = (style, theme) => `/assets/img/modularity-${style}-${theme}.jpg?v=1`;
  const styles = [["glass", "Glass"], ["classic", "Classic"]];
  const tabs = styles.map(([k, name], i) => `<button type="button" role="tab" id="modTab-${k}" aria-controls="modWindow" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ""} data-dark="${img(k, "dark")}" data-light="${img(k, "light")}" data-alt-dark="${esc(W.altDark(name))}" data-alt-light="${esc(W.altLight(name))}">${name}</button>`).join("");
  const ld = lazy ? ' loading="lazy"' : "";
  return `<div class="stage" id="modStage">
        <div class="mod-tabs" role="tablist" aria-label="${W.list}">${tabs}</div>
        <figure class="window" id="modWindow" role="tabpanel" aria-labelledby="modTab-glass">
          <div class="window-bar" aria-hidden="true"><span></span><span></span><span></span><em class="mono">${W.bar}</em></div>
          <!-- the same screen in both themes, one over the other; the divider
               shows the light one to its right (assets/js/site.js) -->
          <div class="compare" id="compare" style="--pos:50%">
            <img class="cmp-dark" src="${img("glass", "dark")}" alt="${esc(W.altDark("Glass"))}" width="1301" height="900"${ld}>
            <img class="cmp-light" src="${img("glass", "light")}" alt="${esc(W.altLight("Glass"))}" width="1301" height="900"${ld}>
            <span class="cmp-tag cmp-tag-dark mono" aria-hidden="true">${W.dark}</span>
            <span class="cmp-tag cmp-tag-light mono" aria-hidden="true">${W.light}</span>
            <div class="cmp-handle" id="compareHandle" role="slider" tabindex="0" aria-label="${W.slider}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" aria-valuetext="${W.half}"><span class="cmp-knob" aria-hidden="true"></span></div>
          </div>
        </figure>
        <p class="cmp-note mono">${W.note}</p>
      </div>`;
}

/* a project card, the same markup v4.js draws on the home pages */
function card(L, raw, i, cls = ""){
  const p = tr(L, raw);
  const first = (p.links || [])[0];
  const ext = l => l.url.startsWith("#") ? "" : ` rel="noopener noreferrer" target="_blank"`;
  const linkUrl = l => l.url.startsWith("#") ? L.base + l.url : l.url;
  const media = `<img src="/${esc(p.image)}" alt="${esc(p.alt || p.title)}" width="1200" height="750" loading="lazy"><span class="card-n">${String(i + 1).padStart(2, "0")}</span>`;
  const tags = (p.services || []).map(k => L.data.find(s => s.key === k)).filter(Boolean)
    .map(s => `<li><a href="${L.base}${svcPath(L, s)}">${esc(s.name)}</a></li>`).join("");
  const status = L.status[p.status] || p.status;
  const casePage = p.case ? caseUrl(L, p.case) : "";
  return `<li class="card tile${cls}">
          ${casePage ? `<a class="card-media" href="${casePage}" aria-label="${esc(CASE_WORDS[L.lang].seeCase + ": " + p.title)}">${media}</a>`
            : first ? `<a class="card-media" href="${esc(linkUrl(first))}"${ext(first)} aria-label="${esc(p.title + ": " + first.label)}">${media}</a>` : `<div class="card-media">${media}</div>`}
          <div class="card-body">
            <h3>${casePage ? `<a href="${casePage}">${esc(p.title)}</a>` : esc(p.title)}</h3>
            <p>${esc(p.short || p.summary)}</p>
            <div class="card-foot"><ul class="svc-tags">${tags}</ul><span class="status" data-s="${esc(p.status)}">${esc(status)}${p.year ? " · " + esc(p.year) : ""}</span></div>
            ${(p.links || []).length || casePage ? `<div class="card-links">${casePage ? `<a class="btn btn-sm btn-primary" href="${casePage}">${esc(CASE_WORDS[L.lang].seeCase)}</a>` : ""}${(p.links || []).map(l => `<a class="btn btn-sm" href="${esc(linkUrl(l))}"${ext(l)}>${esc(l.label)}</a>`).join("")}</div>` : p.note ? `<span class="note mono">${esc(p.note)}</span>` : ""}
          </div>
        </li>`;
}

const PROVIDER = {
  "@type": "ProfessionalService",
  "@id": ORIGIN + "/#estudio",
  name: "16 Ball Creations",
  url: ORIGIN + "/"
};
/* where we work, in words: the same zone the JSON-LD marks (areaServed) */
const ZONE = {
  es: "En persona en Medellín y el resto de Antioquia; por videollamada, en cualquier país",
  en: "In person in Medellín and the rest of Antioquia; by video call, anywhere in the world"
};
const WA = { label: "+57 310 494 9979", href: "https://wa.me/573104949979" };

/* the studio is in Medellín and works with brands anywhere */
const AREAS = [{ "@type": "City", name: "Medellín" }, { "@type": "AdministrativeArea", name: "Antioquia" }, "Worldwide"];
/* a price in the page's currency: $1.500.000 COP or US$750 */
const money = (L, n) => L.currency === "COP" ? `$${n.toLocaleString("es-CO")} COP` : `US$${n.toLocaleString("en-US")}`;

function servicePage(L, s){
  const t = L.t;
  const path = svcPath(L, s);
  const projects = PROJECTS.filter(p => (p.services || []).includes(s.key));
  const others = L.data.filter(o => o !== s);
  const description = s.desc || t.desc(s, L.price);
  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": abs(L, path) + "#servicio",
        name: s.name,
        serviceType: s.name,
        description: s.line + " " + s.intro,
        provider: PROVIDER,
        areaServed: AREAS,
        availableLanguage: ["es", "en"],
        url: abs(L, path),
        ...(s.price ? { offers: { "@type": "Offer", price: String(s.price), priceCurrency: L.currency } } : {}),
        ...(s.from ? { offers: { "@type": "Offer", priceSpecification: { "@type": "PriceSpecification", minPrice: s.from, priceCurrency: L.currency } } } : {}),
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: t.catalog,
          itemListElement: s.includes.map(i => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: i } }))
        }
      },
      {
        "@type": "FAQPage",
        inLanguage: L.lang,
        mainEntity: s.faq.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } }))
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t.home, item: abs(L, "") },
          { "@type": "ListItem", position: 2, name: t.services, item: abs(L, L.dir + "/") },
          { "@type": "ListItem", position: 3, name: s.name, item: abs(L, path) }
        ]
      }
    ]
  };

  return `${head(L, { title: `${s.seo || s.title} ${t.titleWhere} · 16 Ball Creations`, description, path, key: s.key, jsonld })}
<body class="page-svc" style="--accent:${HEX[s.ball]}">
${header(L, s.key)}

<main id="top">
  <section class="svc-hero">
    <div class="wrap">
      <ol class="crumbs">
        <li><a href="${L.base}">${t.home}</a></li>
        <li><a href="${L.base}${L.dir}/">${t.services}</a></li>
        <li aria-current="page">${esc(s.name)}</li>
      </ol>
      ${ball(s.ball)}
      <h1>${esc(s.title)}, <em>${esc(s.em)}</em></h1>
      <p class="line">${esc(s.what)}</p>
      <div class="actions">
        <a class="btn btn-primary" href="${L.mira}">${t.miraFree}</a>
        <a class="btn" href="${L.base}#contacto">${t.write}</a>
      </div>
      <dl class="svc-facts">
        ${s.price ? `<div><dt>${t.price}</dt><dd>${L.price}</dd></div>` : ""}
        ${s.from ? `<div><dt>${esc(s.fromLabel || t.from)}</dt><dd>${money(L, s.from)}${s.fromNote ? " · " + esc(s.fromNote) : ""}</dd></div>` : ""}
        <div><dt>${t.where}</dt><dd>${ZONE[L.lang]}</dd></div>
        <div><dt>${t.reach}</dt><dd><a href="${WA.href}" rel="noopener">WhatsApp ${WA.label}</a> · <a href="mailto:${MAIL}">${MAIL}</a></dd></div>
      </dl>
    </div>
  </section>

  <section class="sec" id="incluye">
    <div class="wrap svc-intro">
      <div>
        <p class="kicker">${t.forWhom}</p>
        <p class="lead">${esc(s.intro)}</p>
      </div>
      <div>
        <p class="kicker">${t.includes}</p>
        <ul class="inc">
${s.includes.map(i => `          <li>${esc(i)}</li>`).join("\n")}
        </ul>
      </div>
    </div>
  </section>

${s.examples ? `
  <section class="sec" id="ejemplos">
    <div class="wrap">
      <div class="sec-head row-head">
        <div>
          <p class="kicker">${esc(s.examples.kicker)}</p>
          <h2 class="big">${s.examples.h}</h2>
        </div>
        <p class="lead">${esc(s.examples.lead)}</p>
      </div>
      <ul class="svc examples">
${s.examples.items.map(([h, p]) => `        <li class="tile reveal"><h3>${esc(h)}</h3><p>${esc(p)}</p></li>`).join("\n")}
      </ul>
      ${s.examples.demo ? `<div class="demo-line"><p>${esc(s.examples.demo.note)}</p><a class="btn btn-primary" href="${esc(s.examples.demo.url)}" target="_blank" rel="noopener">${esc(s.examples.demo.label)} <span aria-hidden="true">&rarr;</span></a></div>` : ""}
    </div>
  </section>` : ""}
  <section class="sec" id="proceso">
    <div class="wrap">
      <div class="sec-head row-head">
        <div>
          <p class="kicker">${t.howK}</p>
          <h2 class="big">${t.stepsH}</h2>
        </div>
        <p class="lead">${t.stepsLead}</p>
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
          <p class="kicker">${t.work}</p>
          <h2 class="big">${t.workH}</h2>
        </div>
        <p class="lead">${esc(t.workLead(projects.length, s.name))}</p>
      </div>
      <ol class="work">
        ${projects.map((p, i) => card(L, p, i)).join("\n        ")}
      </ol>
    </div>
  </section>
` : ""}
  <section class="sec" id="preguntas">
    <div class="wrap">
      <div class="sec-head row-head">
        <div>
          <p class="kicker">${t.faqK}</p>
          <h2 class="big">${t.faqH}</h2>
        </div>
        <p class="lead">${t.faqLead}</p>
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
          <h2>${t.ctaH}</h2>
          <p>${esc(t.ctaP(L.price))}</p>
        </div>
        <a class="btn btn-primary" href="${L.mira}">${t.miraFree} <span aria-hidden="true">&rarr;</span></a>
      </div>
    </div>
  </section>

  <section class="sec" id="otros">
    <div class="wrap">
      <p class="kicker">${t.others}</p>
      <ul class="others">
${others.map(o => `        <li><a class="tile" href="${L.base}${svcPath(L, o)}">${ball(o.ball)}<span>${esc(o.name)}</span></a></li>`).join("\n")}
      </ul>
    </div>
  </section>
</main>

${footer(L)}`;
}

/* a service as a list item: shared by the overview pages and the home pages */
/* on /servicios/ each one is an h2 with who it's for; on the home page, an h3 under the section's h2 */
function serviceItem(L, s, base, index = false){
  const h = index ? "h2" : "h3";
  return `<li class="tile reveal" style="--c:${HEX[s.ball]}">
          ${ball(s.ball)}
          <${h}><a href="${base}${svcPath(L, s)}">${esc(s.name)}</a></${h}>
          ${index && s.who ? `<p class="who">${esc(s.who)}</p>` : ""}
          <p>${esc(s.line)}</p>
          <p class="inc-label">${L.t.includes}</p>
          <ul class="inc">${s.includes.slice(0, 4).map(i => `<li>${esc(i)}</li>`).join("")}</ul>
          <a class="more" href="${base}${svcPath(L, s)}">${L.t.seeService} <span aria-hidden="true">&rarr;</span></a>
        </li>`;
}

function indexPage(L){
  const t = L.t;
  const path = L.dir + "/";
  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        name: t.listName,
        itemListElement: L.data.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: s.name, url: abs(L, svcPath(L, s)) }))
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t.home, item: abs(L, "") },
          { "@type": "ListItem", position: 2, name: t.services, item: abs(L, path) }
        ]
      }
    ]
  };
  return `${head(L, { title: t.idxTitle, description: t.idxDesc(L.price), path, key: null, jsonld })}
<body class="page-svc">
${header(L, null)}

<main id="top">
  <section class="svc-hero">
    <div class="wrap">
      <ol class="crumbs">
        <li><a href="${L.base}">${t.home}</a></li>
        <li aria-current="page">${t.services}</li>
      </ol>
      <h1>${t.idxH1}</h1>
      <p class="line">${esc(t.idxLine(L.price))}</p>
      <div class="actions">
        <a class="btn btn-primary" href="${L.mira}">${t.miraFree}</a>
        <a class="btn" href="${L.base}#proyectos">${t.seeWork}</a>
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="wrap">
      <div class="sec-head"><h2 class="big">${t.idxH2}</h2></div>
      <ul class="svc svc-all">
        ${L.data.map(s => serviceItem(L, s, L.base, true)).join("\n        ")}
      </ul>
    </div>
  </section>
</main>

${footer(L)}`;
}

/* the home pages need the names, slugs and balls: nothing more */
const slim = list => JSON.stringify(list.map(({ key, slug, ball, name }) => ({ key, slug, ball, name })), null, 2);
const clientData = `/* Generado por scripts/servicios.mjs desde scripts/servicios-data.mjs y
   scripts/services-en-data.mjs: no lo edites a mano. */
window.SERVICES = ${slim(SERVICES)};
window.SERVICES_EN = ${slim(SERVICES_EN)};
`;

/* the home pages carry the same list, written in place between markers so
   search engines read it without running any script */
const fill = (html, name, body, indent) => html.replace(
  new RegExp(`(<!-- ${name}:inicio[^>]*-->)[\\s\\S]*?(\\r?\\n\\s*<!-- ${name}:fin -->)`),
  (m, a, b) => `${a}\n${indent}${body}${b}`
);

for(const L of Object.values(LOCALES)){
  const keys = L.data.map(s => s.key).join();
  if(keys !== SERVICES.map(s => s.key).join()){ throw new Error(`Los servicios en ${L.lang} no coinciden con los del español`); }
  const outDir = join(root, L.base.replace(/^\/|\/$/g, ""), L.dir);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, "index.html"), indexPage(L));
  for(const s of L.data){
    await mkdir(join(outDir, s.slug), { recursive: true });
    await writeFile(join(outDir, s.slug, "index.html"), servicePage(L, s));
  }
  const homePath = join(root, L.home);
  let home = await readFile(homePath, "utf8");
  home = fill(home, "servicios", L.data.map(s => serviceItem(L, s, "")).join("\n        "), "        ");
  home = fill(home, "servicios-pie", footerServices(L, ""), "    ");
  /* the project cards, in the same order v4.js draws them (it redraws them
     with the filters and the invitation card): the odd one out spans the row */
  if(home.includes("<!-- proyectos:inicio")){
    const regular = PROJECTS.filter(p => !p.wide), wide = PROJECTS.filter(p => p.wide);
    const cards = [
      ...regular.map((p, i) => card(L, p, i, regular.length % 2 && i === regular.length - 1 ? " card-wide" : "")),
      ...wide.map((p, i) => card(L, p, regular.length + i, " card-wide"))
    ];
    home = fill(home, "proyectos", cards.join("\n        "), "        ");
  }
  if(home.includes("<!-- modularity:inicio")){
    home = fill(home, "modularity", modShowcase(L), "      ");
  }
  /* the home questions, visible and as FAQPage data, from the same text */
  if(home.includes("<!-- faq:inicio")){
    home = fill(home, "faq", L.homeFaq.map((f, i) => `<details${i === 0 ? " open" : ""}><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("\n        "), "        ");
    home = fill(home, "faq-ld", `<script type="application/ld+json">
${JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", inLanguage: L.lang, mainEntity: L.homeFaq.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }, null, 2)}
</script>`, "");
  }
  await writeFile(homePath, home);
  console.log(`${L.lang}: ${L.data.length} páginas en ${L.base}${L.dir}/ ${PREVIEW ? "(vista previa, noindex)" : ""}`);
}
await writeFile(join(root, "assets/js/servicios.js"), clientData);

/* ---------- the case pages: what we did, and why ---------- */
for(const L of Object.values(LOCALES)){
  const W = CASE_WORDS[L.lang];
  const outDir = join(root, L.base.replace(/^\/|\/$/g, ""), W.dir);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, "index.html"), casesIndexPage(L));
  for(const c of CASES){
    await mkdir(join(outDir, c.slug), { recursive: true });
    await writeFile(join(outDir, c.slug, "index.html"), casePage(L, c));
  }
  console.log(`${L.lang}: ${CASES.length} casos en ${L.base}${W.dir}/`);
}

/* ---------- case pages ---------- */
function caseUrl(L, slug){ return L.base + CASE_WORDS[L.lang].dir + "/" + slug + "/"; }
function otherCaseUrl(L, slug){ const O = LOCALES[OTHER[L.lang]]; return O.base + CASE_WORDS[O.lang].dir + "/" + (slug ? slug + "/" : ""); }

function casesIndexPage(L){
  const t = L.t, W = CASE_WORDS[L.lang];
  const path = W.dir + "/";
  const list = CASES.map(c => ({ c, p:PROJECTS.find(p => p.case === c.slug) })).filter(x => x.p);
  const jsonld = { "@context":"https://schema.org", "@graph":[
    { "@type":"CollectionPage", name:W.indexTitle, url:abs(L, path), inLanguage:L.lang,
      hasPart:list.map(({ c }) => ({ "@type":"CreativeWork", name:c[L.lang].title, url:ORIGIN + caseUrl(L, c.slug) })) },
    { "@type":"BreadcrumbList", itemListElement:[
      { "@type":"ListItem", position:1, name:t.home, item:abs(L, "") },
      { "@type":"ListItem", position:2, name:W.crumb, item:abs(L, path) } ] }
  ] };
  return `${head(L, { title:W.indexTitle, description:W.indexDesc, path, jsonld, other:otherCaseUrl(L) })}
<body class="page-svc">
${header(L, null, otherCaseUrl(L))}

<main id="top">
  <section class="svc-hero">
    <div class="wrap">
      <ol class="crumbs"><li><a href="${L.base}">${t.home}</a></li><li aria-current="page">${W.crumb}</li></ol>
      <h1>${W.indexH1}</h1>
      <p class="line">${esc(W.indexLine)}</p>
    </div>
  </section>
  <section class="sec">
    <div class="wrap">
      <ol class="work">
        ${list.map(({ p }, i) => card(L, p, i, p.wide ? " card-wide" : "")).join("\n        ")}
      </ol>
    </div>
  </section>
</main>

${footer(L)}`;
}

function casePage(L, c){
  const t = L.t, W = CASE_WORDS[L.lang], C = c[L.lang];
  const p = tr(L, PROJECTS.find(x => x.case === c.slug) || {});
  const path = W.dir + "/" + c.slug + "/";
  const services = (p.services || []).map(k => L.data.find(s => s.key === k)).filter(Boolean);
  const live = (p.links || [])[0];
  const others = CASES.filter(o => o.slug !== c.slug);
  const jsonld = { "@context":"https://schema.org", "@graph":[
    { "@type":"CreativeWork", "@id":ORIGIN + caseUrl(L, c.slug) + "#caso", name:C.title, headline:C.seoTitle, description:C.desc, url:ORIGIN + caseUrl(L, c.slug),
      inLanguage:L.lang, image:p.image ? ORIGIN + "/" + p.image.replace(/\?.*$/, "") : undefined, creator:PROVIDER, dateCreated:c.year,
      about:services.map(s => s.name), ...(live && /^https?:/.test(live.url) ? { mainEntityOfPage:live.url } : {}) },
    { "@type":"BreadcrumbList", itemListElement:[
      { "@type":"ListItem", position:1, name:t.home, item:abs(L, "") },
      { "@type":"ListItem", position:2, name:W.crumb, item:abs(L, W.dir + "/") },
      { "@type":"ListItem", position:3, name:C.title, item:abs(L, path) } ] }
  ] };
  const accent = c.ball ? HEX[c.ball] : null;
  return `${head(L, { title:C.seoTitle + " · 16 Ball Creations", description:C.desc, path, jsonld, other:otherCaseUrl(L, c.slug), image:p.image })}
<body class="page-svc page-case"${accent ? ` style="--accent:${accent}"` : ""}>
${header(L, null, otherCaseUrl(L, c.slug))}

<main id="top">
  <section class="svc-hero">
    <div class="wrap">
      <ol class="crumbs">
        <li><a href="${L.base}">${t.home}</a></li>
        <li><a href="${L.base}${W.dir}/">${W.crumb}</a></li>
        <li aria-current="page">${esc(C.title)}</li>
      </ol>
      <p class="kicker">${esc([C.kind, c.year].filter(Boolean).join(" · "))}</p>
      <h1>${esc(C.title)}, <em>${esc(C.em)}</em></h1>
      <p class="line">${esc(C.line)}</p>
      <div class="actions">
        ${(C.links || p.links || []).filter(l => /^https?:/.test(l.url)).slice(0, 2).map((l, i) => `<a class="btn${i === 0 ? " btn-primary" : ""}" href="${esc(l.url)}" rel="noopener" target="_blank">${esc(l.label)} <span aria-hidden="true">&nearr;</span></a>`).join("\n        ")}
        <a class="btn" href="${L.mira}">${t.miraFree}</a>
      </div>
    </div>
  </section>

  ${c.slug === "modularity" ? `<section class="case-shot sec modularity"><div class="wrap">${modShowcase(L, false)}</div></section>` : p.image ? `<section class="case-shot"><div class="wrap"><img src="/${esc(p.image)}" alt="${esc(p.alt || C.title)}" width="1200" height="750" fetchpriority="high"></div></section>` : ""}

  <section class="sec" id="punto-de-partida">
    <div class="wrap case-two">
      <div><p class="kicker">${W.startK}</p><h2 class="big">${W.startH}</h2></div>
      <div class="case-text">${C.start.map(x => `<p>${esc(x)}</p>`).join("")}</div>
    </div>
  </section>

  <section class="sec" id="por-que">
    <div class="wrap">
      <div class="sec-head"><p class="kicker">${W.whyK}</p><h2 class="big">${W.whyH}</h2></div>
      <ol class="case-why">
${C.why.map(([h, x], i) => `        <li class="reveal">${ball(i + 1)}<h3>${esc(h)}</h3><p>${esc(x)}</p></li>`).join("\n")}
      </ol>
    </div>
  </section>

  <section class="sec" id="lo-que-hicimos">
    <div class="wrap case-two">
      <div><p class="kicker">${W.didK}</p><h2 class="big">${W.didH}</h2></div>
      <div>
        <ul class="inc">${C.did.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
        ${services.length ? `<p class="case-svc">${W.services}: ${services.map(s => `<a href="${L.base}${svcPath(L, s)}">${esc(s.name)}</a>`).join(" · ")}</p>` : ""}
      </div>
    </div>
  </section>

  <section class="sec" id="resultado">
    <div class="wrap case-two">
      <div><p class="kicker">${W.resultK}</p><h2 class="big">${W.resultH}</h2></div>
      <div class="case-text">${C.result.map(x => `<p>${esc(x)}</p>`).join("")}
        <dl class="case-facts">
          ${C.client ? `<div><dt>${W.client}</dt><dd>${esc(C.client)}</dd></div>` : ""}
          <div><dt>${W.year}</dt><dd>${esc(c.year)}</dd></div>
          ${C.tech ? `<div><dt>${W.tech}</dt><dd>${esc(C.tech)}</dd></div>` : ""}
        </dl>
      </div>
    </div>
  </section>

  <section class="sec" id="otros">
    <div class="wrap">
      <div class="sec-head"><p class="kicker">${W.crumb}</p><h2 class="big">${W.othersH}</h2></div>
      <ul class="others">
${others.map(o => `        <li><a class="tile" href="${caseUrl(L, o.slug)}"><span>${esc(o[L.lang].title)}</span><span class="mono">${esc(o[L.lang].em)}</span></a></li>`).join("\n")}
      </ul>
    </div>
  </section>

  <section class="sec cta-band">
    <div class="wrap">
      <h2>${t.ctaH}</h2>
      <p>${esc(t.ctaP(L.price))}</p>
      <div class="actions"><a class="btn btn-primary" href="${L.mira}">${t.miraFree}</a><a class="btn" href="${L.base}#contacto">${t.write}</a></div>
    </div>
  </section>
</main>

${footer(L)}`;
}
