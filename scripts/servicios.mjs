/* Genera las páginas de servicio, en español y en inglés:
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
import { SERVICES } from "./servicios-data.mjs";
import { SERVICES_EN } from "./services-en-data.mjs";

const PREVIEW = false;
const ORIGIN = "https://16ballcreations.com";
const MAIL = "hola@16ballcreations.com";

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
    lang: "es", ogLocale: "es_CO", base: "/", dir: "servicios", home: "index.html", data: SERVICES,
    mira: "/mira/?o=web", price: "$700.000 COP", minPrice: 700000, currency: "COP",
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
      ctaP: price => `Cinco preguntas sobre tu marca, unos tres minutos y gratis. Con tus respuestas preparamos una llamada de 30 minutos. Proyectos desde ${price}.`,
      others: "Otros servicios", seeService: "Ver el servicio",
      desc: (s, price) => `${s.line} ${s.intro.split(". ")[0]}. Desde ${price}; empieza con tu MIRA gratis.`,
      idxTitle: "Servicios: marca, páginas web, tiendas y redes · 16 Ball Creations",
      idxDesc: price => `Identidad de marca, páginas web, tiendas en línea, sistemas para tu negocio, video para redes y asesoría de imagen, para marcas de cualquier lugar. Todo empieza con tu MIRA, gratis. Proyectos desde ${price}.`,
      idxH1: "Lo que hacemos, <em>en orden</em>",
      idxLine: price => `Primero entendemos tu marca: de dónde viene, por qué nació y a dónde va. Después le damos forma y la llevamos a donde vive. Proyectos desde ${price}.`,
      listName: "Servicios de 16 Ball Creations", catalog: "Lo que incluye"
    }
  },
  en: {
    lang: "en", ogLocale: "en_US", base: "/en/", dir: "services", home: "en/index.html", data: SERVICES_EN,
    mira: "/en/mira/?o=web", price: "US$200", minPrice: 200, currency: "USD",
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
      ctaP: price => `Five questions about your brand, about three minutes, and free. We use your answers to prepare a 30-minute call. Projects from ${price}.`,
      others: "Other services", seeService: "See the service",
      desc: (s, price) => `${s.line} ${s.intro.split(". ")[0]}. From ${price}; start with your free MIRA.`,
      idxTitle: "Services: brand, websites, online stores and social media · 16 Ball Creations",
      idxDesc: price => `Brand identity, websites, online stores, business systems, social media video and image advisory, for brands anywhere. Everything starts with your free MIRA. Projects from ${price}.`,
      idxH1: "What we do, <em>in order</em>",
      idxLine: price => `First we understand your brand: where it comes from, why it was born and where it's going. Then we give it shape and take it where it lives. Projects from ${price}.`,
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

function head(L, { title, description, path, key, jsonld }){
  const O = LOCALES[OTHER[L.lang]];
  const here = abs(L, path), there = ORIGIN + pair(L, key);
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
<link rel="stylesheet" href="/assets/css/v4.css?v=10">
</head>`;
}

function header(L, key){
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
      <a class="lang" href="${pair(L, key)}" hreflang="${OTHER[L.lang]}" lang="${OTHER[L.lang]}" aria-label="${t.other}">${t.otherShort}</a>
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
<script src="/assets/js/site.js?v=7" defer></script>
</body>
</html>
`;
}
function footerServices(L, base){
  return `<ul class="footer-svc">${L.data.map(s => `<li><a href="${base}${svcPath(L, s)}">${esc(s.name)}</a></li>`).join("")}<li><a href="${L.mira}">MIRA</a></li></ul>`;
}

/* a project card, the same markup v4.js draws on the home pages */
function card(L, raw, i){
  const p = tr(L, raw);
  const first = (p.links || [])[0];
  const ext = l => l.url.startsWith("#") ? "" : ` rel="noopener noreferrer" target="_blank"`;
  const linkUrl = l => l.url.startsWith("#") ? L.base + l.url : l.url;
  const media = `<img src="/${esc(p.image)}" alt="${esc(p.alt || p.title)}" width="1200" height="750" loading="lazy"><span class="card-n">${String(i + 1).padStart(2, "0")}</span>`;
  const tags = (p.services || []).map(k => L.data.find(s => s.key === k)).filter(Boolean)
    .map(s => `<li><a href="${L.base}${svcPath(L, s)}">${esc(s.name)}</a></li>`).join("");
  const status = L.status[p.status] || p.status;
  return `<li class="card tile">
          ${first ? `<a class="card-media" href="${esc(linkUrl(first))}"${ext(first)} aria-label="${esc(p.title + ": " + first.label)}">${media}</a>` : `<div class="card-media">${media}</div>`}
          <div class="card-body">
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.short || p.summary)}</p>
            <div class="card-foot"><ul class="svc-tags">${tags}</ul><span class="status" data-s="${esc(p.status)}">${esc(status)}${p.year ? " · " + esc(p.year) : ""}</span></div>
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
const AREAS = [{ "@type": "Country", name: "Colombia" }, { "@type": "Country", name: "Venezuela" }, { "@type": "Country", name: "Costa Rica" }];

function servicePage(L, s){
  const t = L.t;
  const path = svcPath(L, s);
  const projects = PROJECTS.filter(p => (p.services || []).includes(s.key));
  const others = L.data.filter(o => o !== s);
  const description = t.desc(s, L.price).slice(0, 300);
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
        offers: {
          "@type": "Offer",
          priceCurrency: L.currency,
          priceSpecification: { "@type": "PriceSpecification", minPrice: L.minPrice, priceCurrency: L.currency }
        },
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

  return `${head(L, { title: `${s.title} · 16 Ball Creations`, description, path, key: s.key, jsonld })}
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
      <p class="line">${esc(s.line)}</p>
      <div class="actions">
        <a class="btn btn-primary" href="${L.mira}">${t.miraFree}</a>
        <a class="btn" href="${L.base}#contacto">${t.write}</a>
      </div>
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
function serviceItem(L, s, base){
  return `<li class="tile reveal" style="--c:${HEX[s.ball]}">
          ${ball(s.ball)}
          <h3><a href="${base}${svcPath(L, s)}">${esc(s.name)}</a></h3>
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
      <ul class="svc svc-all">
        ${L.data.map(s => serviceItem(L, s, L.base)).join("\n        ")}
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
  await writeFile(homePath, home);
  console.log(`${L.lang}: ${L.data.length} páginas en ${L.base}${L.dir}/ ${PREVIEW ? "(vista previa, noindex)" : ""}`);
}
await writeFile(join(root, "assets/js/servicios.js"), clientData);
