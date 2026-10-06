/* 16 Ball Creations: the Worker.
   The site itself is static and served straight from the assets; this code
   only runs for what is not a file:

   POST /api/mira               a MIRA, sent from /mira/
   POST /api/contacto           the contact form on the home page
   POST /api/testimonio         a testimonial, sent from /testimonio/
   GET  /api/autorizacion/:t    an image-use authorisation, for its signing page
   POST /api/autorizacion/:t    the client signs it (once)
   GET  /admin                  the review panel (basic auth, ADMIN_PASSWORD secret)
   POST /admin/revisado         mark a submission as reviewed, or not
   GET  /admin/autorizacion     new authorisation: the data; Renne's signature goes on it
   POST /admin/autorizacion     create it, and get the client's link
   GET  /admin/autorizacion/editar?id=   fix the data of one nobody signed yet
   POST /admin/autorizacion/editar
   POST /admin/autorizacion/borrar       delete one (signed or not), after a confirm
   POST /admin/testimonio/revisado | /borrar   review or delete a testimonial
   GET  /admin/firma            Renne's registered signature: see it, replace it
   POST /admin/firma            save it (cleaned up in the browser before upload)
   GET  /admin/prospectos       the prospects of every campaign: filters and stages
   GET  /admin/prospecto?id=    one prospect: contact, message, research, timeline
   POST /admin/prospecto        move its stage, log what happened, set the next action
   GET  /admin/recursos         the documents behind the campaigns (script, notes)
   GET  /admin/recurso?slug=    one of them, rendered

   While the site still lives on GitHub Pages too, its pages post here
   across origins, so the API answers CORS for the known origins. */

const ALLOWED_ORIGINS = [
  "https://16ballcreations.github.io",
  "http://localhost:8717",
  "http://localhost:8787",
  "http://127.0.0.1:8787"
];
const MAX_BODY = 32 * 1024;
const MAX_TEXT = 3000;

export default {
  async fetch(request, env){
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if(path === "/api/mira" || path === "/api/contacto"){
      if(request.method === "OPTIONS"){ return preflight(request, url); }
      if(request.method === "POST"){ return receive(request, env, url, path === "/api/mira" ? "mira" : "contacto"); }
      return json({ ok:false, error:"Método no permitido" }, 405, request, url);
    }
    if(path === "/api/testimonio"){
      if(request.method === "OPTIONS"){ return preflight(request, url); }
      if(request.method === "POST"){ return receiveTestimonial(request, env, url); }
      return json({ ok:false, error:"Método no permitido" }, 405, request, url);
    }
    const auth = path.match(/^\/api\/autorizacion\/([a-f0-9]{32})$/);
    if(auth){
      if(request.method === "OPTIONS"){ return preflight(request, url); }
      if(request.method === "GET"){ return getAuthorization(request, env, url, auth[1]); }
      if(request.method === "POST"){ return signAuthorization(request, env, url, auth[1]); }
      return json({ ok:false, error:"Método no permitido" }, 405, request, url);
    }
    if(path === "/admin" || path.startsWith("/admin/")){
      return admin(request, env, url, path);
    }
    return env.ASSETS.fetch(request);
  }
};

/* ---------- the API ---------- */

function corsHeaders(request, url){
  const origin = request.headers.get("Origin") || "";
  const allowed = origin === url.origin || ALLOWED_ORIGINS.includes(origin);
  return allowed ? {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  } : { "Vary": "Origin" };
}
function preflight(request, url){
  return new Response(null, { status:204, headers:corsHeaders(request, url) });
}
function json(body, status, request, url){
  return new Response(JSON.stringify(body), {
    status,
    headers:{ "Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store", ...corsHeaders(request, url) }
  });
}

/* every string is trimmed and capped; arrays and objects are walked */
function clean(value, depth = 0){
  if(depth > 4){ return null; }
  if(typeof value === "string"){ return value.trim().slice(0, MAX_TEXT); }
  if(typeof value === "number" || typeof value === "boolean"){ return value; }
  if(Array.isArray(value)){ return value.slice(0, 30).map(v => clean(v, depth + 1)); }
  if(value && typeof value === "object"){
    const out = {};
    for(const key of Object.keys(value).slice(0, 40)){ out[key.slice(0, 40)] = clean(value[key], depth + 1); }
    return out;
  }
  return null;
}

async function receive(request, env, url, kind){
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

  await env.DB.prepare(
    "INSERT INTO submissions (kind, name, brand, contact, data) VALUES (?1, ?2, ?3, ?4, ?5)"
  ).bind(kind, name, brand, contact, JSON.stringify(data)).run();

  return json({ ok:true }, 201, request, url);
}

/* ---------- testimonials ---------- */

const PUBLISH = ["nombre", "iniciales", "no"];

async function receiveTestimonial(request, env, url){
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

/* ---------- image-use authorisations ---------- */

const MAX_SIG = 400 * 1024;

function newToken(){
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
}
function isSignature(value){
  return typeof value === "string" && value.startsWith("data:image/png;base64,") && value.length > 200 && value.length < MAX_SIG;
}
function todayInBogota(){
  return new Date().toLocaleDateString("es-CO", { timeZone:"America/Bogota", day:"numeric", month:"long", year:"numeric" });
}
function whenInBogota(sqlDate){
  if(!sqlDate){ return null; }
  return new Date(sqlDate.replace(" ", "T") + "Z").toLocaleString("es-CO", { timeZone:"America/Bogota", dateStyle:"long", timeStyle:"short" });
}

/* what the signing page needs; never the client's IP or browser */
async function getAuthorization(request, env, url, token){
  const r = await env.DB.prepare("SELECT * FROM authorizations WHERE token = ?1").bind(token).first();
  if(!r){ return json({ ok:false, error:"No encontramos esta autorización" }, 404, request, url); }
  return json({
    ok:true,
    cliente:r.cliente, proyecto:r.proyecto, web:r.web, redes:r.redes, fecha:r.fecha,
    renne:{ firma:r.renne_sig, fecha:whenInBogota(r.created_at) },
    firmado: r.client_signed_at ? { firma:r.client_sig, documento:r.client_doc, fecha:whenInBogota(r.client_signed_at) } : null
  }, 200, request, url);
}

async function signAuthorization(request, env, url, token){
  let body;
  try{
    const text = await request.text();
    if(text.length > MAX_SIG + 4096){ return json({ ok:false, error:"La firma es demasiado grande" }, 413, request, url); }
    body = JSON.parse(text);
  }catch(e){
    return json({ ok:false, error:"No se pudo leer la firma" }, 400, request, url);
  }
  const documento = String(body.documento || "").trim().slice(0, 40);
  if(body.acepto !== true){ return json({ ok:false, error:"Falta aceptar el documento" }, 400, request, url); }
  if(documento.length < 4){ return json({ ok:false, error:"Falta el número de documento" }, 400, request, url); }
  if(!isSignature(body.firma)){ return json({ ok:false, error:"Falta la firma" }, 400, request, url); }

  /* a signature is final: it only lands on an authorisation nobody signed yet */
  const result = await env.DB.prepare(
    "UPDATE authorizations SET client_sig = ?1, client_doc = ?2, client_signed_at = datetime('now'), client_ip = ?3, client_ua = ?4 " +
    "WHERE token = ?5 AND client_signed_at IS NULL"
  ).bind(body.firma, documento, request.headers.get("CF-Connecting-IP") || "", (request.headers.get("User-Agent") || "").slice(0, 300), token).run();

  if(!result.meta.changes){
    const exists = await env.DB.prepare("SELECT client_signed_at FROM authorizations WHERE token = ?1").bind(token).first();
    return exists
      ? json({ ok:false, error:"Esta autorización ya fue firmada" }, 409, request, url)
      : json({ ok:false, error:"No encontramos esta autorización" }, 404, request, url);
  }
  return getAuthorization(request, env, url, token);
}

/* ---------- the review panel ---------- */

function unauthorized(){
  return new Response("Se necesita la clave del panel.", {
    status:401,
    headers:{ "WWW-Authenticate":'Basic realm="16bc admin", charset="UTF-8"', "Cache-Control":"no-store" }
  });
}
function sameText(a, b){
  /* compare in constant time, so the answer time does not leak the key */
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for(let i = 0; i < Math.max(x.length, y.length); i++){ diff |= (x[i] || 0) ^ (y[i] || 0); }
  return diff === 0;
}
function authorized(request, env){
  const header = request.headers.get("Authorization") || "";
  if(!header.startsWith("Basic ")){ return false; }
  let decoded = "";
  try{ decoded = atob(header.slice(6)); }catch(e){ return false; }
  const password = decoded.slice(decoded.indexOf(":") + 1);
  return sameText(password, env.ADMIN_PASSWORD);
}

async function admin(request, env, url, path){
  if(!env.ADMIN_PASSWORD){
    return page("Falta la clave", `<p class="empty">El panel todavía no tiene clave. Créala con <code>npx wrangler secret put ADMIN_PASSWORD</code> y vuelve a entrar.</p>`, 503);
  }
  if(!authorized(request, env)){ return unauthorized(); }

  if(path === "/admin/revisado" && request.method === "POST"){
    const form = await request.formData();
    const id = parseInt(form.get("id"), 10);
    const value = form.get("revisado") === "1" ? 1 : 0;
    if(id){ await env.DB.prepare("UPDATE submissions SET reviewed = ?1 WHERE id = ?2").bind(value, id).run(); }
    const back = form.get("volver") || "/admin";
    return Response.redirect(new URL(back.startsWith("/admin") ? back : "/admin", url.origin).toString(), 303);
  }

  if(path === "/admin/autorizacion"){
    return request.method === "POST" ? createAuthorization(request, env, url) : newAuthorizationPage(env);
  }
  if(path === "/admin/autorizacion/editar"){
    return request.method === "POST" ? updateAuthorization(request, env, url) : editAuthorizationPage(env, url);
  }
  if(path === "/admin/autorizacion/borrar" && request.method === "POST"){
    return deleteAuthorization(request, env, url);
  }
  if(path === "/admin/testimonio/revisado" && request.method === "POST"){
    const form = await request.formData();
    const id = parseInt(form.get("id"), 10), value = form.get("revisado") === "1" ? 1 : 0;
    if(id){ await env.DB.prepare("UPDATE testimonials SET reviewed = ?1 WHERE id = ?2").bind(value, id).run(); }
    return Response.redirect(url.origin + "/admin?tipo=testimonios", 303);
  }
  if(path === "/admin/testimonio/borrar" && request.method === "POST"){
    const form = await request.formData();
    const id = parseInt(form.get("id"), 10);
    if(id){ await env.DB.prepare("DELETE FROM testimonials WHERE id = ?1").bind(id).run(); }
    return Response.redirect(url.origin + "/admin?tipo=testimonios", 303);
  }
  if(path === "/admin/firma"){
    return request.method === "POST" ? saveSignature(request, env, url) : signaturePage(env, url);
  }
  if(path === "/admin/prospectos"){ return prospectsPage(env, url); }
  if(path === "/admin/prospecto"){
    return request.method === "POST" ? updateProspect(request, env, url) : prospectPage(env, url);
  }
  if(path === "/admin/recursos"){ return resourcesPage(env); }
  if(path === "/admin/recurso"){ return resourcePage(env, url); }

  if(path !== "/admin"){ return Response.redirect(url.origin + "/admin", 303); }

  const tipo = ["mira", "contacto", "autorizaciones", "testimonios"].includes(url.searchParams.get("tipo")) ? url.searchParams.get("tipo") : "";
  const pendientes = url.searchParams.get("ver") === "pendientes";

  const counts = await env.DB.prepare(
    "SELECT kind, COUNT(*) AS n, SUM(CASE WHEN reviewed = 0 THEN 1 ELSE 0 END) AS p FROM submissions GROUP BY kind"
  ).all();
  const c = { mira:{ n:0, p:0 }, contacto:{ n:0, p:0 } };
  for(const r of counts.results){ c[r.kind] = { n:r.n, p:r.p || 0 }; }
  const ac = await env.DB.prepare(
    "SELECT COUNT(*) AS n, SUM(CASE WHEN client_signed_at IS NULL THEN 1 ELSE 0 END) AS p FROM authorizations"
  ).first();

  const here = url.pathname + url.search;
  const link = (t, v, label) => {
    const q = new URLSearchParams();
    if(t){ q.set("tipo", t); }
    if(v){ q.set("ver", v); }
    const href = "/admin" + (q.toString() ? "?" + q : "");
    const on = (t || "") === tipo && (v === "pendientes") === pendientes;
    return `<a class="pill${on ? " on" : ""}" href="${href}">${label}</a>`;
  };

  const tc = await env.DB.prepare(
    "SELECT COUNT(*) AS n, SUM(CASE WHEN reviewed = 0 THEN 1 ELSE 0 END) AS p FROM testimonials"
  ).first();

  let list;
  if(tipo === "testimonios"){
    const { results } = await env.DB.prepare(
      "SELECT * FROM testimonials" + (pendientes ? " WHERE reviewed = 0" : "") + " ORDER BY created_at DESC, id DESC LIMIT 200"
    ).all();
    list = results.length
      ? results.map(testimonialCard).join("")
      : `<p class="empty">No hay testimonios ${pendientes ? "sin revisar " : ""}todavía.</p>`;
  } else if(tipo === "autorizaciones"){
    const where = pendientes ? " WHERE client_signed_at IS NULL" : "";
    const { results } = await env.DB.prepare(
      "SELECT id, token, created_at, cliente, proyecto, client_doc, client_signed_at FROM authorizations" + where + " ORDER BY created_at DESC, id DESC LIMIT 200"
    ).all();
    const fresh = url.searchParams.get("nueva");
    list = results.length
      ? results.map(r => authorizationCard(r, url.origin, fresh)).join("")
      : `<p class="empty">No hay autorizaciones ${pendientes ? "esperando firma " : ""}todavía.</p>`;
  } else {
    const where = [], binds = [];
    if(tipo){ where.push("kind = ?" + (binds.length + 1)); binds.push(tipo); }
    if(pendientes){ where.push("reviewed = 0"); }
    const sql = "SELECT * FROM submissions" + (where.length ? " WHERE " + where.join(" AND ") : "") + " ORDER BY created_at DESC, id DESC LIMIT 200";
    const { results } = await env.DB.prepare(sql).bind(...binds).all();
    list = results.length
      ? results.map(r => card(r, here)).join("")
      : `<p class="empty">No hay envíos ${pendientes ? "pendientes " : ""}todavía.</p>`;
  }

  return page("Panel", `
    <header class="top">
      <div>
        <p class="kicker">16 Ball Creations · panel</p>
        <h1>Lo que <em>ha llegado</em></h1>
      </div>
      <p class="totals mono">MIRA ${c.mira.n} (${c.mira.p} sin revisar) · Contacto ${c.contacto.n} (${c.contacto.p} sin revisar) · Autorizaciones ${ac.n || 0} (${ac.p || 0} sin firmar) · Testimonios ${tc.n || 0} (${tc.p || 0} sin revisar)</p>
    </header>
    <nav class="filters">
      ${link("", "", "Todo")}${link("mira", "", "MIRA")}${link("contacto", "", "Contacto")}${link("autorizaciones", "", "Autorizaciones")}${link("testimonios", "", "Testimonios")}${link(tipo, "pendientes", tipo === "autorizaciones" ? "Solo sin firmar" : "Solo sin revisar")}
      <a class="pill" href="/admin/prospectos">Prospectos</a>
      <a class="pill" href="/admin/firma">Tu firma</a>
      <a class="pill new" href="/admin/autorizacion">+ Nueva autorización</a>
    </nav>
    ${list}
  `, 200, COPY_SCRIPT);
}

const SATISFACTION = { 1:"No cumplió lo que esperaba", 2:"Le faltó algo", 3:"Cumplió", 4:"Me encantó", 5:"Superó lo que esperaba" };
const APPEAR = { nombre:"Publicar con nombre y marca", iniciales:"Publicar solo con iniciales", no:"No publicar" };

function testimonialCard(r){
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

function authorizationCard(r, origin, fresh){
  const link = origin + "/autorizacion/?t=" + r.token;
  const signed = !!r.client_signed_at;
  return `
    <article class="sub${signed ? "" : " waiting"}${r.token === fresh ? " fresh" : ""}">
      <header>
        <span class="tag ${signed ? "t-ok" : "t-wait"}">${signed ? "Firmada" : "Esperando firma"}</span>
        <h2>${esc(r.proyecto)}</h2>
        <span class="when mono">${esc(r.cliente)}</span>
      </header>
      <p class="mono">Creada el ${esc(whenInBogota(r.created_at))}${signed ? " · firmada el " + esc(whenInBogota(r.client_signed_at)) + " · documento " + esc(r.client_doc) : ""}</p>
      <div class="linkrow">
        <input class="mono" value="${esc(link)}" readonly aria-label="Enlace para el cliente">
        <button type="button" data-copy="${esc(link)}">Copiar enlace</button>
        <a class="pill" href="${esc(link)}" target="_blank" rel="noopener">${signed ? "Ver y descargar" : "Ver"}</a>
        ${signed ? "" : `<a class="pill" href="/admin/autorizacion/editar?id=${r.id}">Editar</a>`}
        <form method="post" action="/admin/autorizacion/borrar" data-confirm="${signed
          ? "Esta autorización ya está firmada. Si la borras, se pierde la firma del cliente y el enlace deja de funcionar. ¿Borrarla?"
          : "¿Borrar esta autorización? El enlace que enviaste dejará de funcionar."}">
          <input type="hidden" name="id" value="${r.id}">
          <button type="submit" class="danger">Borrar</button>
        </form>
      </div>
    </article>`;
}

async function registeredSignature(env){
  const row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'renne_sig'").first();
  return row ? row.value : null;
}

async function newAuthorizationPage(env){
  const sig = await registeredSignature(env);
  return page("Nueva autorización", `
    <header class="top">
      <div>
        <p class="kicker"><a href="/admin?tipo=autorizaciones">← Panel</a> · nueva autorización</p>
        <h1>Va firmada <em>por ti</em></h1>
      </div>
    </header>
    <form class="newauth" method="post" action="/admin/autorizacion" id="newAuth">
      <label>Cliente<input name="cliente" required placeholder="Nombre completo o razón social"></label>
      <label>Proyecto o marca<input name="proyecto" required placeholder="Nombre del proyecto"></label>
      <label>Sitio web<input name="web" placeholder="https://"></label>
      <label>Redes sociales<input name="redes" placeholder="Instagram, TikTok… (enlaces o usuarios)"></label>
      ${sig ? `
      <div class="padwrap" id="sigReady">
        <span class="padlabel mono">Tu firma registrada · se aplica sola</span>
        <img class="sigprev" src="${sig}" alt="Tu firma registrada">
        <div class="padtools"><button type="button" id="drawOther">Firmar a mano esta vez</button><a class="pill" href="/admin/firma">Cambiar mi firma</a></div>
      </div>` : `
      <p class="mono hintline">Todavía no registras tu firma. <a href="/admin/firma">Regístrala una vez</a> y se aplicará sola, o firma a mano aquí.</p>`}
      <div class="padwrap" id="padBox"${sig ? " hidden" : ""}>
        <span class="padlabel mono">Tu firma, Renne</span>
        <canvas id="pad" width="600" height="180" aria-label="Recuadro para firmar"></canvas>
        <div class="padtools"><button type="button" id="padClear">Borrar</button></div>
      </div>
      <input type="hidden" name="firma" id="firma">
      <input type="hidden" name="registrada" id="registrada" value="${sig ? "1" : "0"}">
      <p class="mono" id="padMsg"></p>
      <button type="submit" class="go">Crear y obtener el enlace</button>
    </form>
  `, 200, PAD_SCRIPT);
}

/* Renne's signature, registered once */
async function signaturePage(env, url){
  const sig = await registeredSignature(env);
  const saved = url.searchParams.get("guardada") === "1";
  return page("Tu firma", `
    <header class="top">
      <div>
        <p class="kicker"><a href="/admin?tipo=autorizaciones">← Panel</a> · tu firma</p>
        <h1>Tu firma, <em>una sola vez</em></h1>
      </div>
    </header>
    ${saved ? '<p class="okline mono">Firma guardada. Las autorizaciones nuevas ya salen firmadas con ella.</p>' : ""}
    <form class="newauth" method="post" action="/admin/firma" id="sigForm">
      <div class="padwrap">
        <span class="padlabel mono">${sig ? "Firma registrada" : "Todavía no hay firma registrada"}</span>
        <img class="sigprev" id="sigPreview" src="${sig || ""}" alt="Vista previa de tu firma"${sig ? "" : " hidden"}>
      </div>
      <label>Sube una foto o escaneo de tu firma (tinta oscura sobre papel blanco)<input type="file" id="sigFile" accept="image/*"></label>
      <p class="mono hintline">Se le quita el fondo blanco y se recorta aquí mismo, en tu navegador. Solo se guarda la firma limpia, en la base privada del panel.</p>
      <input type="hidden" name="firma" id="firma">
      <p class="mono" id="padMsg"></p>
      <button type="submit" class="go" id="sigSave" disabled>Guardar mi firma</button>
    </form>
  `, 200, SIG_SCRIPT);
}

async function saveSignature(request, env, url){
  const form = await request.formData();
  const firma = String(form.get("firma") || "");
  if(!isSignature(firma)){
    return page("Falta la firma", `<p class="empty">No llegó una firma válida. <a href="/admin/firma">Volver</a></p>`, 400);
  }
  await env.DB.prepare(
    "INSERT INTO settings (key, value, updated_at) VALUES ('renne_sig', ?1, datetime('now')) " +
    "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
  ).bind(firma).run();
  return Response.redirect(url.origin + "/admin/firma?guardada=1", 303);
}

async function editAuthorizationPage(env, url){
  const id = parseInt(url.searchParams.get("id"), 10);
  const r = id ? await env.DB.prepare("SELECT * FROM authorizations WHERE id = ?1").bind(id).first() : null;
  if(!r){ return Response.redirect(url.origin + "/admin?tipo=autorizaciones", 303); }
  if(r.client_signed_at){
    return page("Ya está firmada", `
      <p class="kicker"><a href="/admin?tipo=autorizaciones">← Panel</a></p>
      <p class="empty">Esta autorización ya fue firmada, así que no se puede cambiar: el cliente firmó estos datos. Si hay un error, bórrala y crea una nueva para que la firme otra vez.</p>`, 409);
  }
  return page("Editar autorización", `
    <header class="top">
      <div>
        <p class="kicker"><a href="/admin?tipo=autorizaciones">← Panel</a> · editar autorización</p>
        <h1>Corrige <em>antes de que firme</em></h1>
      </div>
    </header>
    <form class="newauth" method="post" action="/admin/autorizacion/editar">
      <input type="hidden" name="id" value="${r.id}">
      <label>Cliente<input name="cliente" required value="${esc(r.cliente)}"></label>
      <label>Proyecto o marca<input name="proyecto" required value="${esc(r.proyecto)}"></label>
      <label>Sitio web<input name="web" value="${esc(r.web || "")}" placeholder="https://"></label>
      <label>Redes sociales<input name="redes" value="${esc(r.redes || "")}" placeholder="Instagram, TikTok… (enlaces o usuarios)"></label>
      <p class="mono hintline">El enlace que ya enviaste sigue siendo el mismo; el cliente verá los datos corregidos.</p>
      <button type="submit" class="go">Guardar cambios</button>
    </form>`);
}

async function updateAuthorization(request, env, url){
  const form = await request.formData();
  const id = parseInt(form.get("id"), 10);
  const field = (k, max) => String(form.get(k) || "").trim().slice(0, max);
  const cliente = field("cliente", 160), proyecto = field("proyecto", 160);
  const web = field("web", 300), redes = field("redes", 600);
  if(!id || !cliente || !proyecto){
    return page("Falta algo", `<p class="empty">Faltan el cliente o el proyecto. <a href="/admin/autorizacion/editar?id=${id || ""}">Volver</a></p>`, 400);
  }
  /* only an unsigned authorisation can change: the client signs what they read */
  const result = await env.DB.prepare(
    "UPDATE authorizations SET cliente = ?1, proyecto = ?2, web = ?3, redes = ?4 WHERE id = ?5 AND client_signed_at IS NULL"
  ).bind(cliente, proyecto, web || null, redes || null, id).run();
  if(!result.meta.changes){
    return page("No se pudo editar", `<p class="empty">Esta autorización ya fue firmada o no existe, así que no se cambió. <a href="/admin?tipo=autorizaciones">Volver al panel</a></p>`, 409);
  }
  const row = await env.DB.prepare("SELECT token FROM authorizations WHERE id = ?1").bind(id).first();
  return Response.redirect(url.origin + "/admin?tipo=autorizaciones&nueva=" + row.token, 303);
}

async function deleteAuthorization(request, env, url){
  const form = await request.formData();
  const id = parseInt(form.get("id"), 10);
  if(id){ await env.DB.prepare("DELETE FROM authorizations WHERE id = ?1").bind(id).run(); }
  return Response.redirect(url.origin + "/admin?tipo=autorizaciones", 303);
}

async function createAuthorization(request, env, url){
  const form = await request.formData();
  const field = (k, max) => String(form.get(k) || "").trim().slice(0, max);
  const cliente = field("cliente", 160), proyecto = field("proyecto", 160);
  const web = field("web", 300), redes = field("redes", 600);
  let firma = String(form.get("firma") || "");
  if(!firma && form.get("registrada") === "1"){ firma = (await registeredSignature(env)) || ""; }
  if(!cliente || !proyecto || !isSignature(firma)){
    return page("Falta algo", `<p class="empty">Faltan el cliente, el proyecto o tu firma. <a href="/admin/autorizacion">Volver</a></p>`, 400);
  }
  const token = newToken();
  await env.DB.prepare(
    "INSERT INTO authorizations (token, cliente, proyecto, web, redes, fecha, renne_sig) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)"
  ).bind(token, cliente, proyecto, web || null, redes || null, todayInBogota(), firma).run();
  return Response.redirect(url.origin + "/admin?tipo=autorizaciones&nueva=" + token, 303);
}

/* ---------- prospects ---------- */

const STAGES = {
  por_contactar:"Por contactar", contactado:"Contactado", respondio:"Respondió", reunion:"Reunión",
  propuesta:"Propuesta", cliente:"Cliente", descartado:"Descartado"
};
const EVENTS = { mensaje:"Mensaje enviado", respuesta:"Respuesta", visita:"Visita", reunion:"Reunión", nota:"Nota", etapa:"Cambio de etapa" };
const NETWORK = {
  verificado:"Redes verificadas", probable:"Redes probables", no_confirmado:"Redes sin confirmar",
  sin_redes:"Sin redes", fuera_de_zona:"Fuera de la zona", requiere_sesion:"Requiere sesión"
};
const PRIORITIES = ["A", "B", "C", "D", "Descartar"];

function todayIso(){
  return new Date().toLocaleDateString("en-CA", { timeZone:"America/Bogota" });
}
function plusDays(iso, n){
  const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function stageTag(etapa){
  return `<span class="tag st-${esc(etapa)}">${esc(STAGES[etapa] || etapa)}</span>`;
}
function priorityTag(p){
  return `<span class="tag pr-${esc(String(p || "").slice(0, 1))}">${esc(p || "–")}</span>`;
}

async function prospectsPage(env, url){
  const campaigns = (await env.DB.prepare(
    "SELECT campaign, COUNT(*) AS n FROM prospects GROUP BY campaign ORDER BY campaign DESC"
  ).all()).results;
  const head = (h1, extra = "") => `
    <header class="top">
      <div>
        <p class="kicker"><a href="/admin">← Panel</a> · prospectos</p>
        <h1>${h1}</h1>
      </div>
      ${extra}
    </header>`;
  if(!campaigns.length){
    return page("Prospectos", head("Todavía <em>no hay prospectos</em>") + `
      <p class="empty">Carga una campaña desde su carpeta privada:<br>
      <code>node scripts/prospectos-sql.mjs prospectos/&lt;campaña&gt;</code> y después
      <code>npx wrangler d1 execute 16bc --remote --file tmp/prospectos-&lt;campaña&gt;.sql</code></p>`);
  }

  const p = url.searchParams;
  const campaign = campaigns.some(c => c.campaign === p.get("c")) ? p.get("c") : campaigns[0].campaign;
  const prioridad = PRIORITIES.includes(p.get("prioridad")) ? p.get("prioridad") : "";
  const etapa = STAGES[p.get("etapa")] ? p.get("etapa") : "";
  const hoy = p.get("ver") === "hoy";
  const text = (p.get("q") || "").trim().slice(0, 80);
  const today = todayIso();

  const where = ["campaign = ?1"], binds = [campaign];
  if(prioridad){ binds.push(prioridad); where.push("prioridad = ?" + binds.length); }
  if(etapa){ binds.push(etapa); where.push("etapa = ?" + binds.length); }
  if(hoy){ binds.push(today); where.push("proxima_fecha IS NOT NULL AND proxima_fecha <= ?" + binds.length + " AND etapa NOT IN ('cliente', 'descartado')"); }
  if(text){ binds.push("%" + text + "%"); const n = binds.length; where.push(`(negocio LIKE ?${n} OR barrio LIKE ?${n} OR categoria LIKE ?${n} OR code LIKE ?${n})`); }
  const { results } = await env.DB.prepare(
    "SELECT id, code, rank, prioridad, negocio, categoria, barrio, canal, enlace, etapa, proxima_accion, proxima_fecha FROM prospects WHERE " +
    where.join(" AND ") + " ORDER BY rank LIMIT 300"
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
    const cur = { prioridad, etapa, q:text, ver:hoy ? "hoy" : "" };
    for(const [k, v] of Object.entries({ ...cur, ...changes })){ if(v){ q.set(k, v); } }
    return "/admin/prospectos?" + q;
  };
  const pill = (changes, label, on) => `<a class="pill${on ? " on" : ""}" href="${href(changes)}">${label}</a>`;

  const rows = results.map(r => `
    <tr>
      <td class="mono">${r.rank ?? ""}</td>
      <td>${priorityTag(r.prioridad)}</td>
      <td><a class="biz" href="/admin/prospecto?id=${encodeURIComponent(r.id)}">${esc(r.negocio)}</a><span class="mono sub2">${esc(r.code)} · ${esc(r.categoria || "")}</span></td>
      <td>${esc(r.barrio || "")}</td>
      <td>${r.enlace ? `<a href="${esc(r.enlace)}" target="_blank" rel="noopener">${esc(r.canal)}</a>` : esc(r.canal || "")}</td>
      <td>${stageTag(r.etapa)}</td>
      <td class="mono${r.proxima_fecha && r.proxima_fecha <= today ? " due" : ""}">${esc(r.proxima_accion || "")}${r.proxima_fecha ? "<br>" + esc(r.proxima_fecha) : ""}</td>
    </tr>`).join("");

  return page("Prospectos", head("Los <em>prospectos</em>", `
      <p class="totals mono">${campaigns.map(c => `<a class="${c.campaign === campaign ? "on" : ""}" href="/admin/prospectos?c=${esc(c.campaign)}">${esc(c.campaign)} (${c.n})</a>`).join(" · ")}<br>
      <a href="/admin/recursos">Recursos de las campañas →</a></p>`) + `
    <nav class="pipeline">
      ${Object.entries(STAGES).map(([k, label]) => `<a class="${etapa === k ? "on" : ""}" href="${href({ etapa:etapa === k ? "" : k })}"><b>${sc[k] || 0}</b>${label}</a>`).join("")}
      <a class="${hoy ? "on" : ""} today" href="${href({ ver:hoy ? "" : "hoy" })}"><b>${due.n || 0}</b>Para hoy</a>
    </nav>
    <nav class="filters">
      ${pill({ prioridad:"" }, "Todas", !prioridad)}
      ${PRIORITIES.map(x => pill({ prioridad:x }, "Prioridad " + x, prioridad === x)).join("")}
      <form method="get" action="/admin/prospectos" class="search">
        <input type="hidden" name="c" value="${esc(campaign)}">
        ${prioridad ? `<input type="hidden" name="prioridad" value="${esc(prioridad)}">` : ""}
        ${etapa ? `<input type="hidden" name="etapa" value="${esc(etapa)}">` : ""}
        <input name="q" value="${esc(text)}" placeholder="Buscar negocio, barrio o categoría">
      </form>
    </nav>
    ${results.length ? `
    <div class="tablewrap"><table class="ptable">
      <thead><tr><th>#</th><th>Prior.</th><th>Negocio</th><th>Barrio</th><th>Escribir por</th><th>Etapa</th><th>Próximo paso</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>` : `<p class="empty">Ningún prospecto con estos filtros.</p>`}
  `);
}

async function prospectPage(env, url){
  const id = url.searchParams.get("id") || "";
  const r = await env.DB.prepare("SELECT * FROM prospects WHERE id = ?1").bind(id).first();
  if(!r){ return Response.redirect(url.origin + "/admin/prospectos", 303); }
  const { results:events } = await env.DB.prepare(
    "SELECT * FROM prospect_events WHERE prospect_id = ?1 ORDER BY created_at DESC, id DESC"
  ).bind(id).all();
  let d = {};
  try{ d = JSON.parse(r.data); }catch(e){}
  const v = d.redes_verificacion || {};
  const back = "/admin/prospectos?c=" + encodeURIComponent(r.campaign);
  const maps = r.direccion ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(r.direccion + ", Medellín") : null;
  const link = (u, label) => u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(label || u.replace(/^https?:\/\/(www\.)?/, ""))}</a>` : "";
  const profiles = (v.perfiles || []).map(x => `
    <li><b>${esc(x.red)}</b> ${link(x.url)}${x.visible_sin_sesion
      ? ` · ${esc(x.nombre_visible || "")}${x.seguidores != null ? " · " + Number(x.seguidores).toLocaleString("es-CO") + " seg." : ""}${x.publicaciones != null ? " · " + x.publicaciones + " publ." : ""}${x.bio || x.intro ? `<br><span class="bio">«${esc(x.bio || x.intro)}»</span>` : ""}`
      : " · no se ve sin sesión"}</li>`).join("");
  const dropped = (v.perfiles_descartados || []).map(x => `<li>${link(x.url)} · ${esc(x.motivo)}</li>`).join("");
  const timeline = events.map(e => `
    <li><span class="mono">${esc(whenInBogota(e.created_at))} · ${esc(EVENTS[e.tipo] || e.tipo)}</span>${esc(e.texto).replace(/\n/g, "<br>")}</li>`).join("");

  return page(r.negocio, `
    <header class="top">
      <div>
        <p class="kicker"><a href="${back}">← Prospectos</a> · ${esc(r.campaign)} · ${esc(r.code)} · puesto ${r.rank ?? "–"}</p>
        <h1>${esc(r.negocio)}</h1>
        <p class="mono">${esc(r.categoria || "")}</p>
      </div>
      <p class="tags">${priorityTag(r.prioridad)} ${stageTag(r.etapa)} <span class="tag t-net">${esc(NETWORK[r.estado_redes] || r.estado_redes || "")}</span></p>
    </header>
    <div class="pgrid">
      <section class="sub">
        <h3>Dónde y cómo</h3>
        <p><b>Dirección</b>${esc(r.direccion || "Sin dato")}${r.dir_fuente ? ` <span class="mono">(${esc(r.dir_fuente)})</span>` : ""}${maps ? `<br>${link(maps, "Abrir en Google Maps")}` : ""}</p>
        <p><b>Barrio</b>${esc(r.barrio || "")}${r.distancia_km != null ? ` · ${r.distancia_km} km del punto de partida` : ""}</p>
        <p><b>Escribir por</b>${r.enlace ? `<a class="pill go-chat" href="${esc(r.enlace)}" target="_blank" rel="noopener">Abrir ${esc(r.canal)}</a>` : esc(r.canal || "")}</p>
        ${r.respaldo ? `<p><b>Respaldo</b>${esc(r.respaldo)}</p>` : ""}
        <p><b>Redes y web</b>${[link(r.instagram), link(r.facebook), link(r.tiktok)].filter(Boolean).join("<br>") || "Ninguna verificada"}${r.web && /^(https?:\/\/|www\.)/.test(r.web) ? "<br>" + link(r.web.startsWith("http") ? r.web : "https://" + r.web) : ""}</p>
      </section>
      <section class="sub">
        <h3>Lo que vimos</h3>
        <p><b>Gancho</b>${esc(r.gancho || "")}</p>
        <p><b>Nota de la verificación</b>${esc(r.nota || "")}</p>
      </section>
    </div>
    ${r.mensaje ? `
    <section class="sub">
      <h3>Primer mensaje</h3>
      <textarea class="msg" readonly rows="9">${esc(r.mensaje)}</textarea>
      <p class="mono hintline">Cambia [tu nombre] antes de enviarlo.</p>
      <div class="linkrow">
        <button type="button" data-copy="${esc(r.mensaje)}" data-done="Copiado ✓" data-label="Copiar mensaje">Copiar mensaje</button>
        ${r.enlace ? `<a class="pill" href="${esc(r.enlace)}" target="_blank" rel="noopener">Abrir el chat</a>` : ""}
        <form method="post" action="/admin/prospecto"><input type="hidden" name="id" value="${esc(r.id)}"><input type="hidden" name="accion" value="enviado"><button type="submit">Ya lo envié</button></form>
      </div>
    </section>` : ""}
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
      <p class="mono">Verificado el ${esc(v.fecha || "")}${d.telefono ? " · teléfono del listado: " + esc(d.telefono) : ""}</p>
    </section>
  `, 200, COPY_SCRIPT);
}

async function updateProspect(request, env, url){
  const form = await request.formData();
  const id = String(form.get("id") || "");
  const r = await env.DB.prepare("SELECT id, etapa, canal FROM prospects WHERE id = ?1").bind(id).first();
  if(!r){ return Response.redirect(url.origin + "/admin/prospectos", 303); }
  const log = (tipo, texto) => env.DB.prepare("INSERT INTO prospect_events (prospect_id, tipo, texto) VALUES (?1, ?2, ?3)").bind(id, tipo, texto);
  const accion = form.get("accion");
  const batch = [];

  if(accion === "enviado"){
    /* the first message is out: wait three days, then the follow-up */
    batch.push(log("mensaje", "Primer mensaje enviado por " + (r.canal || "chat") + "."));
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
  } else if(accion === "evento"){
    const tipo = ["respuesta", "mensaje", "visita", "reunion", "nota"].includes(form.get("tipo")) ? form.get("tipo") : "nota";
    const texto = String(form.get("texto") || "").trim().slice(0, 2000);
    if(texto){
      batch.push(log(tipo, texto));
      batch.push(env.DB.prepare("UPDATE prospects SET updated_at = datetime('now') WHERE id = ?1").bind(id));
    }
  }
  if(batch.length){ await env.DB.batch(batch); }
  return Response.redirect(url.origin + "/admin/prospecto?id=" + encodeURIComponent(id) + "#seguimiento", 303);
}

async function resourcesPage(env){
  const { results } = await env.DB.prepare("SELECT slug, campaign, title, updated_at FROM resources ORDER BY campaign DESC, title").all();
  return page("Recursos", `
    <header class="top">
      <div>
        <p class="kicker"><a href="/admin/prospectos">← Prospectos</a> · recursos</p>
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

async function resourcePage(env, url){
  const r = await env.DB.prepare("SELECT * FROM resources WHERE slug = ?1").bind(url.searchParams.get("slug") || "").first();
  if(!r){ return Response.redirect(url.origin + "/admin/recursos", 303); }
  return page(r.title, `
    <p class="kicker"><a href="/admin/recursos">← Recursos</a> · ${esc(r.campaign || "")}</p>
    <article class="md">${markdown(r.body)}</article>
  `);
}

/* just enough Markdown for our own documents: headings, tables, quotes, lists */
function markdown(src){
  const inline = s => esc(s)
    .replace(/&lt;br&gt;/g, "<br>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\*)/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
  const lines = String(src).replace(/\r/g, "").split("\n");
  const out = [];
  for(let i = 0; i < lines.length;){
    const line = lines[i];
    if(!line.trim()){ i++; continue; }
    const h = line.match(/^(#{1,4})\s+(.*)/);
    if(h){ const n = h[1].length + 1; out.push(`<h${n}>${inline(h[2])}</h${n}>`); i++; continue; }
    if(/^\s*\|/.test(line)){
      const rows = [];
      while(i < lines.length && /^\s*\|/.test(lines[i])){ rows.push(lines[i]); i++; }
      const cells = l => l.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());
      const body = rows.filter((l, k) => !(k === 1 && /^[\s|:-]+$/.test(l)));
      out.push(`<div class="tablewrap"><table class="ptable"><thead><tr>${cells(body[0]).map(c => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>` +
        body.slice(1).map(l => `<tr>${cells(l).map(c => `<td>${inline(c)}</td>`).join("")}</tr>`).join("") + "</tbody></table></div>");
      continue;
    }
    if(/^>/.test(line)){
      const q = [];
      while(i < lines.length && /^>/.test(lines[i])){ q.push(lines[i].replace(/^>\s?/, "")); i++; }
      out.push(`<blockquote>${q.map(inline).join("<br>")}</blockquote>`);
      continue;
    }
    const li = /^\s*([-*]|\d+\.)\s+/;
    if(li.test(line)){
      const ordered = /^\s*\d+\./.test(line), items = [];
      while(i < lines.length && (li.test(lines[i]) || /^\s{2,}\S/.test(lines[i]) && items.length)){
        const raw = lines[i], deep = /^\s{2,}/.test(raw);
        const t = raw.replace(li, "").replace(/^\s+/, "").replace(/^\[ \]\s*/, "☐ ").replace(/^\[x\]\s*/i, "☑ ");
        items.push(`<li${deep ? ' class="deep"' : ""}>${inline(t)}</li>`); i++;
      }
      out.push(ordered ? `<ol>${items.join("")}</ol>` : `<ul>${items.join("")}</ul>`);
      continue;
    }
    const para = [];
    while(i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\s*\||>|\s*([-*]|\d+\.)\s)/.test(lines[i])){ para.push(lines[i]); i++; }
    out.push(`<p>${inline(para.join(" "))}</p>`);
  }
  return out.join("\n");
}

/* copy buttons in the list */
const COPY_SCRIPT = `<script>
document.addEventListener("submit", function(e){
  var f = e.target.closest("form[data-confirm]");
  if(f && !confirm(f.getAttribute("data-confirm"))){ e.preventDefault(); }
});
document.addEventListener("click", function(e){
  var b = e.target.closest("[data-copy]");
  if(!b){ return; }
  var label = b.getAttribute("data-label") || "Copiar enlace";
  navigator.clipboard.writeText(b.getAttribute("data-copy")).then(function(){ b.textContent = "Copiado ✓"; setTimeout(function(){ b.textContent = label; }, 1800); });
});
</script>`;

/* the signature pad on the new-authorisation page */
const PAD_SCRIPT = `<script>
(function(){
  var box = document.getElementById("padBox"), c = document.getElementById("pad"), ctx = c.getContext("2d");
  var drawn = false, down = false, dpr = Math.max(1, window.devicePixelRatio || 1);
  var useRegistered = document.getElementById("registrada");
  function size(){ var r = c.getBoundingClientRect(); c.width = r.width * dpr; c.height = r.height * dpr; ctx.lineWidth = 2.4 * dpr; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#111"; drawn = false; }
  if(!box.hidden){ size(); }
  var other = document.getElementById("drawOther");
  if(other){ other.addEventListener("click", function(){ document.getElementById("sigReady").hidden = true; box.hidden = false; useRegistered.value = "0"; size(); }); }
  function at(e){ var r = c.getBoundingClientRect(); return [(e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr]; }
  c.addEventListener("pointerdown", function(e){ down = true; c.setPointerCapture(e.pointerId); var p = at(e); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + .1, p[1] + .1); ctx.stroke(); drawn = true; });
  c.addEventListener("pointermove", function(e){ if(!down){ return; } var p = at(e); ctx.lineTo(p[0], p[1]); ctx.stroke(); });
  c.addEventListener("pointerup", function(){ down = false; });
  document.getElementById("padClear").addEventListener("click", function(){ ctx.clearRect(0, 0, c.width, c.height); drawn = false; });
  document.getElementById("newAuth").addEventListener("submit", function(e){
    if(useRegistered.value === "1"){ return; }
    if(!drawn){ e.preventDefault(); document.getElementById("padMsg").textContent = "Falta tu firma."; return; }
    document.getElementById("firma").value = c.toDataURL("image/png");
  });
})();
</script>`;

/* cleaning the uploaded signature: white paper out, ink kept, trimmed */
const SIG_SCRIPT = `<script>
(function(){
  var file = document.getElementById("sigFile"), out = document.getElementById("firma");
  var prev = document.getElementById("sigPreview"), save = document.getElementById("sigSave"), msg = document.getElementById("padMsg");
  file.addEventListener("change", function(){
    var f = file.files && file.files[0];
    if(!f){ return; }
    var img = new Image();
    img.onload = function(){
      var scale = Math.min(1, 1600 / Math.max(img.width, img.height));
      var w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      var c = document.createElement("canvas"); c.width = w; c.height = h;
      var ctx = c.getContext("2d"); ctx.drawImage(img, 0, 0, w, h);
      var d = ctx.getImageData(0, 0, w, h), p = d.data;
      var minX = w, minY = h, maxX = -1, maxY = -1;
      for(var y = 0; y < h; y++){ for(var x = 0; x < w; x++){
        var i = (y * w + x) * 4, lum = .299 * p[i] + .587 * p[i + 1] + .114 * p[i + 2];
        /* light paper becomes transparent; ink becomes near-black. Only four
           levels of ink, so scanner grain does not bloat the PNG */
        var a = lum > 200 ? 0 : lum < 130 ? 255 : lum < 165 ? 176 : 96;
        p[i] = p[i + 1] = p[i + 2] = 17; p[i + 3] = a;
        if(a > 60){ if(x < minX){ minX = x; } if(x > maxX){ maxX = x; } if(y < minY){ minY = y; } if(y > maxY){ maxY = y; } }
      } }
      if(maxX < 0){ msg.textContent = "No encontramos trazos oscuros en la imagen."; return; }
      ctx.putImageData(d, 0, 0);
      var pad = 8, cw = maxX - minX + 1 + pad * 2, ch = maxY - minY + 1 + pad * 2;
      var t = document.createElement("canvas");
      function render(k){
        t.width = Math.max(1, Math.round(cw * k)); t.height = Math.max(1, Math.round(ch * k));
        t.getContext("2d").drawImage(c, minX - pad, minY - pad, cw, ch, 0, 0, t.width, t.height);
        return t.toDataURL("image/png");
      }
      /* 700 px wide is plenty for a signature line; if it is still heavy,
         it shrinks a step at a time instead of being refused */
      var k = Math.min(1, 700 / cw), v = render(k);
      while(v.length > 200000 && k > .15){ k *= .85; v = render(k); }
      if(v.length > 380000){ msg.textContent = "No logramos aligerar la imagen; prueba con un recorte más ajustado a la firma."; save.disabled = true; return; }
      out.value = v;
      prev.src = out.value; prev.hidden = false;
      msg.textContent = "Así quedará. Si se ve bien, guárdala.";
      save.disabled = false;
    };
    img.src = URL.createObjectURL(f);
  });
})();
</script>`;

function esc(s){
  return String(s == null ? "" : s).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
}
function list(v){ return Array.isArray(v) ? v.filter(Boolean).join(", ") : (v || ""); }
function row(label, value){
  return `<p><b>${esc(label)}</b>${value ? esc(value).replace(/\n/g, "<br>") : '<span class="none">Sin respuesta</span>'}</p>`;
}

function card(r, here){
  let d = {};
  try{ d = JSON.parse(r.data); }catch(e){}
  const when = new Date(r.created_at.replace(" ", "T") + "Z").toLocaleString("es-CO", { timeZone:"America/Bogota", dateStyle:"medium", timeStyle:"short" });
  let body;
  if(r.kind === "mira"){
    const tiene = list(d.tiene);
    body = `
      <div class="mira">
        <section><h3><i>M</i> Marca</h3>${row("Nombre", d.marca)}${row("Qué hace", d.queHace)}${row("Su historia", d.historia)}</section>
        <section><h3><i>I</i> Imagen</h3>${row("Ya cuenta con", tiene)}</section>
        <section><h3><i>R</i> Redes</h3>${row("Dónde encontrarla", d.enlaces)}</section>
        <section><h3><i>A</i> Alineación</h3>${row("Le habla a", [list(d.publico), d.publicoDetalle].filter(Boolean).join(", "))}${row("Quiere que sientan", list(d.objetivos))}</section>
      </div>
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
    <article class="sub${r.reviewed ? " done" : ""}">
      <header>
        <span class="tag t-${r.kind}">${r.kind === "mira" ? "MIRA" : "Contacto"}</span>
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

function page(title, content, status = 200, script = ""){
  return new Response(`<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>${esc(title)} · 16 Ball Creations</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono&display=swap" rel="stylesheet">
<style>
  :root{--bg:#050606;--line:#25292c;--white:#fff;--bone:#ecebe6;--ash:#a1a4a5;--iron:#6e727a;--accent:#3ad389;
    --b1:#f4c20d;--b2:#4d7dff;--b3:#ff5c6e;--b4:#a375d8}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--bone);font:15px/1.5 Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  main{max-width:1100px;margin:0 auto;padding:40px 24px 80px}
  .mono{font-family:"JetBrains Mono",monospace;font-size:12px;color:var(--iron)}
  .kicker{margin:0 0 8px;font:12px "JetBrains Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--ash)}
  h1{margin:0;font:400 clamp(2.4rem,6vw,4rem)/1 "Instrument Serif",serif;color:var(--white)}
  h1 em{color:var(--accent)}
  .top{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap;margin-bottom:28px}
  .filters{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px}
  .pill{padding:7px 14px;border:1px solid var(--line);border-radius:999px;color:var(--ash);text-decoration:none;font:12px "JetBrains Mono",monospace}
  .pill.on{background:var(--accent);border-color:var(--accent);color:#000}
  .sub{border:1px solid var(--line);border-radius:18px;padding:22px 24px;margin-bottom:16px;background:rgba(255,255,255,.02)}
  .sub.done{opacity:.55}
  .sub header{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:16px}
  .sub h2{margin:0;font:400 1.8rem/1.1 "Instrument Serif",serif;color:var(--white)}
  .when{margin-left:auto}
  .tag{padding:3px 9px;border-radius:999px;font:11px "JetBrains Mono",monospace;letter-spacing:.06em;text-transform:uppercase;color:#000}
  .tag.t-mira{background:var(--accent)} .tag.t-contacto{background:var(--b2);color:#fff}
  form{margin:0}
  button{padding:7px 14px;border-radius:999px;border:1px solid var(--line);background:transparent;color:var(--white);cursor:pointer;font:500 13px Inter,sans-serif}
  .sub.done button{border-color:var(--accent);color:var(--accent)}
  .mira{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
  .mira section{padding:14px 16px;border:1px solid var(--line);border-radius:12px}
  .mira section:nth-child(1){--c:var(--b1)} .mira section:nth-child(2){--c:var(--b2)}
  .mira section:nth-child(3){--c:var(--b3)} .mira section:nth-child(4){--c:var(--b4)}
  h3{margin:0 0 10px;font:500 12px "JetBrains Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--c,var(--ash))}
  h3 i{font:italic 1.4rem "Instrument Serif",serif;margin-right:4px}
  .sub p{margin:0 0 10px}
  .sub p b{display:block;font:400 11px "JetBrains Mono",monospace;letter-spacing:.06em;text-transform:uppercase;color:var(--iron)}
  .none{color:#4a4e52;font-style:italic}
  .who{margin:14px 0 0 !important}
  .empty{color:var(--iron)}
  code{font-family:"JetBrains Mono",monospace;color:var(--accent)}
  .pill.new{margin-left:auto;border-color:var(--accent);color:var(--accent)}
  .tag.t-ok{background:var(--accent)} .tag.t-wait{background:var(--b1)}
  .sub.fresh{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}
  .linkrow{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:12px}
  .linkrow form{margin:0}
  .tquote{margin:0 0 12px;font:400 1.5rem/1.25 "Instrument Serif",serif;color:var(--white)}
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
  .newauth label{display:flex;flex-direction:column;gap:6px;font:11px "JetBrains Mono",monospace;letter-spacing:.06em;text-transform:uppercase;color:var(--iron)}
  .newauth input{padding:10px 12px;border-radius:10px;border:1px solid var(--line);background:#0b0c0d;color:var(--white);font:15px Inter,sans-serif;text-transform:none;letter-spacing:0}
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
  .pipeline{display:grid;grid-template-columns:repeat(8,1fr);gap:8px;margin-bottom:18px}
  .pipeline a{display:flex;flex-direction:column;gap:2px;padding:12px 14px;border:1px solid var(--line);border-radius:14px;color:var(--ash);text-decoration:none;font:11px "JetBrains Mono",monospace;text-transform:uppercase;letter-spacing:.05em}
  .pipeline b{font:400 1.9rem/1 "Instrument Serif",serif;color:var(--white);letter-spacing:0}
  .pipeline a.on{border-color:var(--accent)} .pipeline a.on b{color:var(--accent)}
  .pipeline a.today{border-style:dashed}
  .search{margin-left:auto}
  .search input,.pform input,.pform select,.pform textarea{padding:8px 12px;border-radius:10px;border:1px solid var(--line);background:#0b0c0d;color:var(--white);font:14px Inter,sans-serif}
  .search input{min-width:260px;border-radius:999px}
  .tablewrap{overflow-x:auto;border:1px solid var(--line);border-radius:14px;margin-bottom:18px}
  .ptable{width:100%;border-collapse:collapse;font-size:14px}
  .ptable th{text-align:left;padding:10px 12px;font:400 11px "JetBrains Mono",monospace;letter-spacing:.06em;text-transform:uppercase;color:var(--iron);border-bottom:1px solid var(--line)}
  .ptable td{padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top}
  .ptable tr:last-child td{border-bottom:0}
  .ptable .tag{white-space:nowrap}
  .ptable a{color:var(--bone)}
  a.biz{color:var(--white);text-decoration:none;font-weight:500}
  a.biz:hover{color:var(--accent)}
  .sub2{display:block;font-size:11px}
  .due{color:var(--b1)}
  .tag.pr-A{background:var(--accent)} .tag.pr-B{background:var(--b2);color:#fff} .tag.pr-C{background:var(--b1)} .tag.pr-D{background:var(--iron);color:#fff}
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
  textarea.msg{width:100%;padding:14px;border-radius:12px;border:1px solid var(--line);background:#0b0c0d;color:var(--bone);font:15px/1.5 Inter,sans-serif;resize:vertical}
  .pform{display:flex;flex-direction:column;gap:12px}
  .pform label{display:flex;flex-direction:column;gap:6px;font:11px "JetBrains Mono",monospace;letter-spacing:.06em;text-transform:uppercase;color:var(--iron)}
  .pform .go{align-self:flex-start;background:var(--white);color:#000;border-color:var(--white)}
  .timeline,.plist{list-style:none;margin:0;padding:0}
  .timeline li,.plist li{padding:10px 0;border-bottom:1px solid var(--line)}
  .timeline li:last-child,.plist li:last-child{border-bottom:0}
  .timeline .mono{display:block;margin-bottom:4px}
  .plist .bio{color:var(--ash);font-size:13px}
  .md{max-width:900px}
  .md h2{font:400 2.6rem/1.05 "Instrument Serif",serif;color:var(--white);margin:0 0 18px}
  .md h3{font:400 1.8rem/1.1 "Instrument Serif",serif;color:var(--white);text-transform:none;letter-spacing:0;margin:34px 0 12px}
  .md h4{font:400 1.35rem/1.2 "Instrument Serif",serif;color:var(--white);margin:24px 0 8px}
  .md h5{font:500 12px "JetBrains Mono",monospace;text-transform:uppercase;letter-spacing:.06em;color:var(--ash);margin:18px 0 8px}
  .md blockquote{margin:12px 0;padding:12px 16px;border-left:2px solid var(--accent);background:rgba(255,255,255,.03);color:var(--bone)}
  .md a{color:var(--accent)} .md li.deep{margin-left:22px;color:var(--ash)}
  @media (max-width:900px){.pipeline{grid-template-columns:repeat(4,1fr)}.pgrid{grid-template-columns:1fr}}
  @media (max-width:720px){.mira{grid-template-columns:1fr}.when{margin-left:0}.newauth{grid-template-columns:1fr}}
</style></head><body><main>${content}</main>${script}</body></html>`, {
    status,
    headers:{ "Content-Type":"text/html; charset=utf-8", "Cache-Control":"no-store", "X-Robots-Tag":"noindex, nofollow" }
  });
}
