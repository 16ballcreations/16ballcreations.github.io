/* 16 Ball Creations: the Worker.
   The site itself is static and served straight from the assets; this code
   only runs for what is not a file:

   POST /api/mira               a MIRA, sent from /mira/
   POST /api/contacto           the contact form on the home page
   POST /api/testimonio         a testimonial, sent from /testimonio/
   GET  /api/autorizacion/:t    an image-use authorisation, for its signing page
   POST /api/autorizacion/:t    the client signs it (once)
   GET  /admin/entrar           sign in to the panel; POST checks the password and opens a session
   POST /admin/salir            close the session
   GET  /admin                  the review panel (a session cookie; see "the panel's door")
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
   GET  /admin/mira/vincular?id=   link a MIRA that came without a prospect: suggestions and search
   POST /admin/mira/vincular       link it to the prospect picked
   POST /admin/mira/desvincular    undo a link (the stage stays as it is)
   GET  /admin/embudo.csv       one row per prospect: MIRA, call and result, for the funnel review

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
    /* Google Search Console checks this exact address. As a static file the
       asset handling would redirect it to drop the .html, so it is served here */
    if(url.pathname === "/googlee3f0630cfd72f21f.html"){
      return new Response("google-site-verification: googlee3f0630cfd72f21f.html", { headers:{ "Content-Type":"text/html; charset=utf-8" } });
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

  /* a MIRA may come from a prospect's personal link (?t=) and says where it
     came from (?o=); neither is part of the answers */
  const token = kind === "mira" && /^[a-z2-9]{6}$/.test(data.token || "") ? data.token : null;
  const origen = kind === "mira" && ORIGINS[data.origen] ? data.origen : null;
  delete data.token; delete data.origen;

  const saved = await env.DB.prepare(
    "INSERT INTO submissions (kind, name, brand, contact, data, origen) VALUES (?1, ?2, ?3, ?4, ?5, ?6) RETURNING id"
  ).bind(kind, name, brand, contact, JSON.stringify(data), origen).first();

  /* only the personal link ties it to a prospect on its own; anything else
     waits in the panel to be linked by hand. The answer is the same either
     way, so the page never tells whether a code exists. */
  if(token && saved){
    const p = await env.DB.prepare("SELECT id, etapa FROM prospects WHERE mira_token = ?1").bind(token).first();
    if(p){ await env.DB.batch(linkMira(env, saved.id, p, "enlace", origen)); }
  }

  return json({ ok:true }, 201, request, url);
}

/* ---------- a MIRA and its prospect ---------- */

const ORIGINS = { ig:"Instagram", bio:"la bio de Instagram", historia:"una historia", web:"el sitio", referido:"un referido",
  whatsapp:"WhatsApp", facebook:"Facebook", visita:"una visita" };
/* the stages a MIRA moves forward: it is the prospect's answer */
const BEFORE_CALL = ["por_contactar", "contactado", "descartado", "respondio"];

/* The same steps for the personal link and for a link made by hand: the MIRA
   points to the prospect, the timeline says so, and an early stage moves to
   "respondió" with the call to schedule today. A prospect already past it
   (reunión, propuesta, cliente) keeps its stage. */
function linkMira(env, subId, p, how, origen){
  const log = (tipo, texto) => env.DB.prepare("INSERT INTO prospect_events (prospect_id, tipo, texto) VALUES (?1, ?2, ?3)").bind(p.id, tipo, texto);
  const out = [
    env.DB.prepare("UPDATE submissions SET prospect_id = ?1, vinculo = ?2 WHERE id = ?3").bind(p.id, how, subId),
    log("nota", `MIRA recibida · ${how === "enlace" ? "enlace personal" : "vinculada a mano"} · origen: ${ORIGINS[origen] || "sin dato"} · /admin/mira#m${subId}`)
  ];
  if(BEFORE_CALL.includes(p.etapa)){
    if(p.etapa !== "respondio"){
      out.push(log("etapa", STAGES[p.etapa] + " → " + STAGES.respondio + (p.etapa === "descartado" ? " · reabierto: llenó la MIRA" : "")));
    }
    out.push(env.DB.prepare(
      "UPDATE prospects SET etapa = 'respondio', proxima_accion = 'Agendar llamada', proxima_fecha = ?1, updated_at = datetime('now') WHERE id = ?2"
    ).bind(todayIso(), p.id));
  } else {
    out.push(env.DB.prepare("UPDATE prospects SET updated_at = datetime('now') WHERE id = ?1").bind(p.id));
  }
  return out;
}

/* comparing names: no accents, no case, words only */
function plain(text){
  return String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9@._]+/g, " ").trim();
}
function igHandles(text){
  const out = new Set(), t = String(text || "").toLowerCase();
  for(const m of t.matchAll(/instagram\.com\/([a-z0-9._]{2,30})/g)){ out.add(m[1].replace(/\.+$/, "")); }
  for(const m of t.matchAll(/(?:^|[\s,(])@([a-z0-9._]{2,30})/g)){ out.add(m[1].replace(/\.+$/, "")); }
  return out;
}
/* how much a prospect looks like the brand that filled in a MIRA: the same
   Instagram is near certain, the same name is strong, shared words are weak */
function likeness(d, p){
  let score = 0;
  const handles = igHandles(d.enlaces), theirs = igHandles(p.instagram);
  for(const h of handles){ if(theirs.has(h)){ score += 100; } }
  const brand = plain(d.marca), biz = plain(p.negocio);
  if(brand && biz){
    if(brand === biz){ score += 80; }
    else if(brand.length > 3 && biz.length > 3 && (biz.includes(brand) || brand.includes(biz))){ score += 40; }
    const words = new Set(biz.split(" ").filter(w => w.length > 2));
    for(const w of brand.split(" ")){ if(w.length > 2 && words.has(w)){ score += 15; } }
  }
  return score;
}

/* a short code for the personal MIRA link: no 0/o or 1/l to misread */
const CODE_CHARS = "abcdefghijkmnpqrstuvwxyz23456789";
function miraCode(){
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return [...bytes].map(b => CODE_CHARS[b % CODE_CHARS.length]).join("");
}
/* the code is made the first time the prospect's page asks for its link */
async function miraTokenFor(env, r){
  if(r.mira_token){ return r.mira_token; }
  for(let i = 0; i < 4; i++){
    try{
      await env.DB.prepare("UPDATE prospects SET mira_token = ?1 WHERE id = ?2 AND mira_token IS NULL").bind(miraCode(), r.id).run();
      const back = await env.DB.prepare("SELECT mira_token FROM prospects WHERE id = ?1").bind(r.id).first();
      if(back && back.mira_token){ return back.mira_token; }
    }catch(e){ /* the code was taken: try another one */ }
  }
  return null;
}
/* the channel the link goes out by, as the MIRA's origin */
function originOfChannel(canal){
  const c = String(canal || "").toLowerCase();
  if(c.includes("instagram")){ return "ig"; }
  if(c.includes("whatsapp")){ return "whatsapp"; }
  if(c.includes("facebook")){ return "facebook"; }
  if(c.includes("visita")){ return "visita"; }
  return "ig";
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

/* ---------- the panel's door: sign-in, sessions, CSRF ---------- */

/* The panel used to sit behind Basic Auth. Now it has a sign-in page and a
   session in a cookie (30 days, renewed while in use), a way out, a limit on
   wrong passwords, and every POST must come from this same site. Same design
   as the KaffeePlatz panel.

   The password: ADMIN_CLAVE_HASH (PBKDF2, made with scripts/hash-clave.mjs)
   when it is set; otherwise ADMIN_PASSWORD, compared as it is. There is no
   user name: one shared password, one person. */
const SESSION_COOKIE = "bc_sesion";
const SESSION_DAYS = 30;
const SESSION_SECONDS = SESSION_DAYS * 24 * 60 * 60;
const RENEW_UNDER_SECONDS = 24 * 60 * 60;
const MAX_FAILS = 10;
const FAIL_WINDOW_MINUTES = 15;

function panelHeaders(extra = {}){
  return { "Cache-Control":"no-store, no-cache, must-revalidate", "X-Robots-Tag":"noindex, nofollow, noarchive", "Referrer-Policy":"same-origin", ...extra };
}
function sessionCookie(id){
  return `${SESSION_COOKIE}=${id}; HttpOnly; Secure; SameSite=Strict; Path=/admin; Max-Age=${SESSION_SECONDS}`;
}
function emptySessionCookie(){
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/admin; Max-Age=0`;
}
function sessionIdOf(request){
  for(const part of (request.headers.get("Cookie") || "").split(";")){
    const i = part.indexOf("=");
    if(i > 0 && part.slice(0, i).trim() === SESSION_COOKIE){
      const v = part.slice(i + 1).trim();
      return /^[0-9a-f]{64}$/.test(v) ? v : null;
    }
  }
  return null;
}
const sqlTime = d => d.toISOString().slice(0, 19).replace("T", " ");
function ipOf(request){
  return request.headers.get("CF-Connecting-IP") || (request.headers.get("X-Forwarded-For") || "").split(",")[0].trim() || "desconocida";
}

/* a POST only counts when the browser says it comes from this same site */
function sameOrigin(request, url){
  const origin = request.headers.get("Origin");
  if(!origin){ return false; }
  try{ return new URL(origin).origin === url.origin; }catch(e){ return false; }
}

function sameText(a, b){
  /* compare in constant time, so the answer time does not leak the key */
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for(let i = 0; i < Math.max(x.length, y.length); i++){ diff |= (x[i] || 0) ^ (y[i] || 0); }
  return diff === 0;
}
/* "pbkdf2$sha256$<iterations>$<salt b64>$<hash b64>"; fails closed */
async function matchesHash(password, stored){
  const parts = String(stored || "").split("$");
  if(parts.length !== 5 || parts[0] !== "pbkdf2" || parts[1] !== "sha256"){ return false; }
  const iterations = Number(parts[2]);
  /* Workers refuses PBKDF2 above 100,000 iterations */
  if(!Number.isInteger(iterations) || iterations < 1 || iterations > 100000){ return false; }
  try{
    const salt = Uint8Array.from(atob(parts[3]), c => c.charCodeAt(0));
    const want = Uint8Array.from(atob(parts[4]), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const got = new Uint8Array(await crypto.subtle.deriveBits({ name:"PBKDF2", salt, iterations, hash:"SHA-256" }, key, 256));
    let diff = got.length ^ want.length;
    for(let i = 0; i < Math.max(got.length, want.length); i++){ diff |= (got[i] || 0) ^ (want[i] || 0); }
    return diff === 0;
  }catch(e){ return false; }
}
async function isThePassword(env, password){
  if(!password){ return false; }
  if(env.ADMIN_CLAVE_HASH){ return matchesHash(password, env.ADMIN_CLAVE_HASH); }
  return env.ADMIN_PASSWORD ? sameText(password, env.ADMIN_PASSWORD) : false;
}

async function validSession(env, id){
  if(!id){ return null; }
  try{
    const r = await env.DB.prepare("SELECT id, expires_at FROM sesiones WHERE id = ?1 AND expires_at > datetime('now')").bind(id).first();
    return r ? { id:r.id, expires:new Date(r.expires_at.replace(" ", "T") + "Z") } : null;
  }catch(e){ return null; }
}
async function openSession(env, request){
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const id = [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
  await env.DB.prepare("INSERT INTO sesiones (id, expires_at, ultima_ip, ultima_ua) VALUES (?1, ?2, ?3, ?4)")
    .bind(id, sqlTime(new Date(Date.now() + SESSION_SECONDS * 1000)), ipOf(request).slice(0, 64), (request.headers.get("User-Agent") || "").slice(0, 256)).run();
  /* signing in is the natural moment to sweep what expired */
  try{ await env.DB.prepare("DELETE FROM sesiones WHERE expires_at < datetime('now')").run(); }catch(e){}
  return id;
}
/* while in use, a session close to expiring gets another 30 days */
async function renewIfDue(env, session){
  if((session.expires.getTime() - Date.now()) / 1000 > RENEW_UNDER_SECONDS){ return null; }
  try{
    await env.DB.prepare("UPDATE sesiones SET expires_at = ?2 WHERE id = ?1").bind(session.id, sqlTime(new Date(Date.now() + SESSION_SECONDS * 1000))).run();
    return sessionCookie(session.id);
  }catch(e){ return null; }
}

async function failsOf(env, ip){
  try{
    const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM intentos WHERE ip = ?1 AND ok = 0 AND created_at > datetime('now', ?2)")
      .bind(ip, `-${FAIL_WINDOW_MINUTES} minutes`).first();
    return r ? r.n : 0;
  }catch(e){ return MAX_FAILS; }   /* if it cannot count, it does not let anyone try */
}
async function noteAttempt(env, ip, ok){
  try{
    await env.DB.prepare("INSERT INTO intentos (ip, ok) VALUES (?1, ?2)").bind(ip, ok ? 1 : 0).run();
    if(ok){ await env.DB.prepare("DELETE FROM intentos WHERE ip = ?1 AND ok = 0").bind(ip).run(); }
    if(Math.random() < .05){ await env.DB.prepare("DELETE FROM intentos WHERE created_at < datetime('now', '-1 day')").run(); }
  }catch(e){}
}

/* where to go after signing in: only somewhere inside the panel */
function safeReturn(raw){
  if(!raw || !raw.startsWith("/admin") || raw.startsWith("//") || raw.startsWith("/admin/entrar") || raw.startsWith("/admin/salir")){ return "/admin"; }
  return raw;
}

function signInPage(volver, error = "", status = 200){
  return new Response(page("Entrar", `
    <div class="signin">
      <img src="/assets/img/ball-16.png" alt="" class="signin-ball">
      <p class="kicker">16 Ball Creations · panel</p>
      <h1>Entra al <em>panel</em></h1>
      <form method="post" action="/admin/entrar" class="pform">
        <input type="hidden" name="volver" value="${esc(volver)}">
        <input type="text" name="usuario" value="16ball" autocomplete="username" hidden>
        <label>Clave<input type="password" name="clave" autocomplete="current-password" required autofocus></label>
        ${error ? `<p class="errline" role="alert">${esc(error)}</p>` : ""}
        <button type="submit" class="go">Entrar</button>
      </form>
      <p class="mono hintline">La sesión dura ${SESSION_DAYS} días en este navegador. Puedes salir desde el menú.</p>
    </div>`, status).body, { status, headers:panelHeaders({ "Content-Type":"text/html; charset=utf-8" }) });
}

async function signIn(request, env, url){
  const form = await request.formData();
  const volver = safeReturn(String(form.get("volver") || ""));
  const ip = ipOf(request);
  /* the limit goes first, before any password is checked */
  const fails = await failsOf(env, ip);
  if(fails >= MAX_FAILS){ return signInPage(volver, `Demasiados intentos. Espera ${FAIL_WINDOW_MINUTES} minutos y vuelve a probar.`, 429); }
  const ok = await isThePassword(env, String(form.get("clave") || ""));
  await noteAttempt(env, ip, ok);
  if(!ok){
    const left = Math.max(0, MAX_FAILS - fails - 1);
    return signInPage(volver, left ? `Esa no es la clave. Te quedan ${left} ${left === 1 ? "intento" : "intentos"}.` : `Esa no es la clave. Espera ${FAIL_WINDOW_MINUTES} minutos y vuelve a probar.`, 401);
  }
  let id;
  try{ id = await openSession(env, request); }catch(e){ return signInPage(volver, "No se pudo abrir la sesión. Intenta de nuevo en un momento.", 503); }
  return new Response(null, { status:303, headers:panelHeaders({ Location:new URL(volver, url.origin).toString(), "Set-Cookie":sessionCookie(id) }) });
}

async function signOut(request, env, url){
  const id = sessionIdOf(request);
  if(id){ try{ await env.DB.prepare("DELETE FROM sesiones WHERE id = ?1").bind(id).run(); }catch(e){} }
  return new Response(null, { status:303, headers:panelHeaders({ Location:url.origin + "/admin/entrar", "Set-Cookie":emptySessionCookie() }) });
}

async function admin(request, env, url, path){
  if(!env.ADMIN_CLAVE_HASH && !env.ADMIN_PASSWORD){
    return page("Falta la clave", `<p class="empty">El panel todavía no tiene clave. Créala con <code>node scripts/hash-clave.mjs</code> y <code>npx wrangler secret put ADMIN_CLAVE_HASH</code>, y vuelve a entrar.</p>`, 503);
  }
  if(!["GET", "HEAD", "POST"].includes(request.method)){
    return new Response("Método no permitido.\n", { status:405, headers:panelHeaders({ "Content-Type":"text/plain; charset=utf-8", Allow:"GET, HEAD, POST" }) });
  }
  /* CSRF: every POST of the panel, signing in included, must come from here */
  if(request.method === "POST" && !sameOrigin(request, url)){
    return new Response("Petición rechazada: origen no válido.\n", { status:403, headers:panelHeaders({ "Content-Type":"text/plain; charset=utf-8" }) });
  }
  if(path === "/admin/entrar"){
    if(request.method === "POST"){ return signIn(request, env, url); }
    const volver = safeReturn(url.searchParams.get("volver"));
    if(await validSession(env, sessionIdOf(request))){ return Response.redirect(new URL(volver, url.origin).toString(), 303); }
    return signInPage(volver);
  }
  if(path === "/admin/salir"){
    return request.method === "POST" ? signOut(request, env, url) : Response.redirect(url.origin + "/admin", 303);
  }

  const session = await validSession(env, sessionIdOf(request));
  if(!session){
    const back = url.pathname + url.search;
    const to = new URL("/admin/entrar", url.origin);
    if(back !== "/admin"){ to.searchParams.set("volver", back); }
    return new Response(null, { status:303, headers:panelHeaders({ Location:to.toString() }) });
  }
  const renewed = await renewIfDue(env, session);
  const res = await adminRoutes(request, env, url, path);
  if(!renewed){ return res; }
  /* a redirect's headers are fixed: copy the response to add the cookie */
  const out = new Response(res.body, res);
  out.headers.append("Set-Cookie", renewed);
  return out;
}

async function adminRoutes(request, env, url, path){
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
    return Response.redirect(url.origin + "/admin/testimonios", 303);
  }
  if(path === "/admin/testimonio/borrar" && request.method === "POST"){
    const form = await request.formData();
    const id = parseInt(form.get("id"), 10);
    if(id){ await env.DB.prepare("DELETE FROM testimonials WHERE id = ?1").bind(id).run(); }
    return Response.redirect(url.origin + "/admin/testimonios", 303);
  }
  if(path === "/admin/firma"){
    return request.method === "POST" ? saveSignature(request, env, url) : signaturePage(env, url);
  }
  if(path === "/admin/prospectos"){ return prospectsPage(env, url); }
  if(path === "/admin/prospecto/nuevo"){
    return request.method === "POST" ? createProspect(request, env, url) : newProspectPage(env, url);
  }
  if(path === "/admin/prospecto"){
    return request.method === "POST" ? updateProspect(request, env, url) : prospectPage(env, url);
  }
  if(path === "/admin/mapa"){ return mapPage(env, url); }
  if(path === "/admin/recursos"){ return resourcesPage(env); }
  if(path === "/admin/recurso"){ return resourcePage(env, url); }

  if(path === "/admin/mira/vincular"){
    return request.method === "POST" ? linkMiraByHand(request, env, url) : linkMiraPage(env, url);
  }
  if(path === "/admin/mira/desvincular" && request.method === "POST"){ return unlinkMira(request, env, url); }
  if(path === "/admin/embudo.csv"){ return funnelCsv(env); }
  if(path === "/admin/mira" || path === "/admin/contacto"){ return submissionsPage(env, url, path.slice(7)); }
  if(path === "/admin/autorizaciones"){ return authorizationsPage(env, url); }
  if(path === "/admin/testimonios"){ return testimonialsPage(env, url); }

  /* the panel used to be one page with ?tipo=; old links land in the right section */
  const legacy = url.searchParams.get("tipo");
  if(path === "/admin" && SECTION_PATHS[legacy]){
    const q = new URLSearchParams(url.search); q.delete("tipo");
    return Response.redirect(url.origin + SECTION_PATHS[legacy] + (q.toString() ? "?" + q : ""), 303);
  }
  if(path !== "/admin"){ return Response.redirect(url.origin + "/admin", 303); }
  return dashboardPage(env);
}

/* ---------- the admin shell: a menu, one section per thing ---------- */

const SECTION_PATHS = { mira:"/admin/mira", contacto:"/admin/contacto", autorizaciones:"/admin/autorizaciones", testimonios:"/admin/testimonios" };

/* what needs attention, for the menu badges and the home page */
async function attention(env){
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

const MENU = [
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
    { key:"autorizaciones", href:"/admin/autorizaciones", label:"Autorizaciones", hint:"sin firmar" },
    { key:"testimonios", href:"/admin/testimonios", label:"Testimonios", hint:"sin revisar" }
  ]},
  { group:"Ajustes", items:[{ key:"firma", href:"/admin/firma", label:"Tu firma" }] }
];

async function adminPage(env, active, title, content, status = 200, script = ""){
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

/* ---------- home: what needs you today ---------- */
async function dashboardPage(env){
  const a = await attention(env);
  const today = todayIso();
  const [{ results:due }, { results:unscheduled }, { results:unrecorded }] = await env.DB.batch([
    env.DB.prepare(
      "SELECT id, negocio, proxima_accion, proxima_fecha FROM prospects WHERE proxima_fecha IS NOT NULL AND proxima_fecha <= ?1 " +
      "AND etapa NOT IN ('cliente', 'descartado') ORDER BY proxima_fecha, rank LIMIT 8"
    ).bind(today),
    /* MIRAs of the last 30 days still waiting for their call to be scheduled */
    env.DB.prepare(
      "SELECT COUNT(*) AS n, SUM(CASE WHEN s.prospect_id IS NULL THEN 1 ELSE 0 END) AS sueltas FROM submissions s LEFT JOIN prospects p ON p.id = s.prospect_id " +
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
  const miraWaiting = unscheduled[0].n || 0, miraLoose = unscheduled[0].sueltas || 0;
  const tile = (href, label, big, line, hot) => `
    <a class="tile${hot ? " hot" : ""}" href="${href}"><span class="tile-label">${label}</span><b>${big}</b><span class="tile-line">${line}</span></a>`;
  const plural = (n, one, many) => n + " " + (n === 1 ? one : many);
  return adminPage(env, "inicio", "Panel", `
    <header class="top"><div><p class="kicker">16 Ball Creations · panel</p><h1>Lo que <em>te espera</em></h1></div></header>
    <section class="tiles">
      ${tile("/admin/prospectos?ver=hoy", "Prospectos para hoy", a.prospectos.p, `${plural(a.prospectos.vivos, "conversación abierta", "conversaciones abiertas")} · ${plural(a.prospectos.nuevos, "por contactar", "por contactar")}`, a.prospectos.p)}
      ${tile("/admin/contacto?ver=pendientes", "Contacto sin revisar", a.contacto.p, plural(a.contacto.n, "mensaje en total", "mensajes en total"), a.contacto.p)}
      ${tile("/admin/mira?ver=sinagendar", "MIRA sin agendar", miraWaiting, miraLoose ? plural(miraLoose, "sin prospecto", "sin prospecto") + " · últimos 30 días" : "Últimos 30 días", miraWaiting)}
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

/* the filter pills every list shares: all, or only what is pending */
function pendingPills(base, pendientes, label){
  return `<nav class="filters"><a class="pill${pendientes ? "" : " on"}" href="${base}">Todo</a><a class="pill${pendientes ? " on" : ""}" href="${base}?ver=pendientes">${label}</a></nav>`;
}
function sectionHead(group, h1, extra = ""){
  return `<header class="top"><div><p class="kicker">${group}</p><h1>${h1}</h1></div>${extra}</header>`;
}

/* ---------- MIRA and contact ---------- */
async function submissionsPage(env, url, kind){
  const ver = url.searchParams.get("ver");
  const pendientes = ver === "pendientes";
  const isMira = kind === "mira";
  /* "sin agendar": the MIRAs of the last 30 days whose call is still to be
     scheduled, because nobody linked them or their prospect is in "respondió" */
  const unscheduled = isMira && ver === "sinagendar";
  const { results } = await env.DB.prepare(
    "SELECT s.*, p.negocio AS p_negocio, p.etapa AS p_etapa FROM submissions s LEFT JOIN prospects p ON p.id = s.prospect_id WHERE s.kind = ?1" +
    (pendientes ? " AND s.reviewed = 0" : "") +
    (unscheduled ? " AND s.created_at >= datetime('now', '-30 days') AND (s.prospect_id IS NULL OR p.etapa = 'respondio')" : "") +
    " ORDER BY s.created_at DESC, s.id DESC LIMIT 200"
  ).bind(kind).all();
  const here = url.pathname + url.search;
  const pills = isMira
    ? `<nav class="filters"><a class="pill${!pendientes && !unscheduled ? " on" : ""}" href="/admin/mira">Todo</a><a class="pill${pendientes ? " on" : ""}" href="/admin/mira?ver=pendientes">Solo sin revisar</a><a class="pill${unscheduled ? " on" : ""}" href="/admin/mira?ver=sinagendar">Sin agendar</a></nav>`
    : pendingPills("/admin/" + kind, pendientes, "Solo sin revisar");
  return adminPage(env, kind, isMira ? "MIRA" : "Contacto", `
    ${sectionHead(isMira ? "Clientes · MIRA" : "Lo que llega · contacto", isMira ? "Las <em>MIRA</em>" : "Lo que <em>escriben</em>",
      `<p class="totals mono">${isMira ? "Marca, Imagen, Redes y Alineación: el primer filtro, antes de la llamada" : "El formulario de contacto del sitio"}</p>`)}
    ${pills}
    ${results.length ? results.map(r => card(r, here)).join("") : `<p class="empty">No hay ${isMira ? "MIRA" : "mensajes"} ${pendientes ? "sin revisar " : unscheduled ? "sin agendar " : ""}todavía.</p>`}
  `, 200, COPY_SCRIPT);
}

/* linking by hand: the prospects that look like the brand first, then a search */
async function linkMiraPage(env, url){
  const id = parseInt(url.searchParams.get("id"), 10);
  const sub = id ? await env.DB.prepare("SELECT * FROM submissions WHERE id = ?1 AND kind = 'mira'").bind(id).first() : null;
  if(!sub){ return Response.redirect(url.origin + "/admin/mira", 303); }
  if(sub.prospect_id){ return Response.redirect(url.origin + "/admin/mira#m" + id, 303); }
  let d = {};
  try{ d = JSON.parse(sub.data); }catch(e){}
  const q = (url.searchParams.get("q") || "").trim().slice(0, 80);
  const all = (await env.DB.prepare(
    "SELECT id, campaign, code, negocio, categoria, barrio, instagram, etapa, prioridad, score, bola FROM prospects"
  ).all()).results;
  const suggested = all.map(p => ({ p, n:likeness(d, p) })).filter(x => x.n >= 15).sort((a, b) => b.n - a.n).slice(0, 5);
  const needle = plain(q);
  const found = needle ? all.filter(p => plain([p.negocio, p.instagram, p.code, p.barrio, p.categoria].join(" ")).includes(needle)).slice(0, 20) : [];
  const item = (p, why) => `
    <li class="pick">
      <div>${ballTag(p.prioridad, p.score, false, p.bola)} <a class="biz" href="/admin/prospecto?id=${encodeURIComponent(p.id)}" target="_blank" rel="noopener">${esc(p.negocio)}</a>
        <span class="mono sub2">${esc(p.campaign)} · ${esc(p.code)}${p.barrio ? " · " + esc(p.barrio) : ""}${p.instagram ? " · " + esc(p.instagram.replace(/^https?:\/\/(www\.)?/, "")) : ""}${why ? " · " + why : ""}</span></div>
      <span>${stageTag(p.etapa)}</span>
      <form method="post" action="/admin/mira/vincular"><input type="hidden" name="id" value="${id}"><input type="hidden" name="prospect" value="${esc(p.id)}"><button type="submit" class="go">Vincular a este</button></form>
    </li>`;
  const why = n => n >= 100 ? "mismo Instagram" : n >= 80 ? "mismo nombre" : n >= 40 ? "nombre parecido" : "palabras en común";
  return adminPage(env, "mira", "Vincular MIRA", `
    <header class="top"><div><p class="kicker"><a href="/admin/mira#m${id}">← Las MIRA</a> · vincular</p><h1>¿De quién es <em>esta MIRA</em>?</h1>
      <p class="mono">${esc(d.marca || sub.brand || "")} · respondió ${esc(d.nombre || sub.name || "")} · ${esc(d.contacto || sub.contact || "")}${d.enlaces ? " · " + esc(d.enlaces) : ""}</p></div></header>
    <section class="sub">
      <h3>Se parecen</h3>
      ${suggested.length ? `<ul class="picks">${suggested.map(x => item(x.p, why(x.n))).join("")}</ul>` : `<p class="empty">Ningún prospecto se parece por nombre ni por Instagram.</p>`}
      <p class="mono hintline">Son sugerencias: nada se vincula hasta que elijas uno.</p>
    </section>
    <section class="sub">
      <h3>Buscar</h3>
      <form method="get" action="/admin/mira/vincular" class="search"><input type="hidden" name="id" value="${id}"><input name="q" value="${esc(q)}" placeholder="Negocio, Instagram, código o barrio" autofocus></form>
      ${q ? (found.length ? `<ul class="picks">${found.map(p => item(p, "")).join("")}</ul>` : `<p class="empty">Nada con «${esc(q)}».</p>`) : ""}
    </section>
    <section class="sub">
      <h3>No está en la base</h3>
      <p>Si es alguien nuevo, crea el prospecto con los datos de la MIRA. Queda en la campaña de entrantes del mes, en «Respondió».</p>
      <div class="linkrow"><a class="pill new" href="/admin/prospecto/nuevo?mira=${id}">+ Crear prospecto con esta MIRA</a></div>
    </section>`);
}

async function linkMiraByHand(request, env, url){
  const form = await request.formData();
  const id = parseInt(form.get("id"), 10);
  const sub = id ? await env.DB.prepare("SELECT id, prospect_id, origen FROM submissions WHERE id = ?1 AND kind = 'mira'").bind(id).first() : null;
  const p = await env.DB.prepare("SELECT id, etapa FROM prospects WHERE id = ?1").bind(String(form.get("prospect") || "")).first();
  if(sub && !sub.prospect_id && p){ await env.DB.batch(linkMira(env, sub.id, p, "manual", sub.origen)); }
  return Response.redirect(url.origin + "/admin/mira#m" + (id || ""), 303);
}

/* a link made by mistake comes undone; the stage is left for Renne to judge */
async function unlinkMira(request, env, url){
  const form = await request.formData();
  const id = parseInt(form.get("id"), 10);
  const sub = id ? await env.DB.prepare("SELECT id, prospect_id FROM submissions WHERE id = ?1 AND kind = 'mira'").bind(id).first() : null;
  if(sub && sub.prospect_id){
    await env.DB.batch([
      env.DB.prepare("UPDATE submissions SET prospect_id = NULL, vinculo = NULL WHERE id = ?1").bind(id),
      env.DB.prepare("INSERT INTO prospect_events (prospect_id, tipo, texto) VALUES (?1, 'nota', ?2)")
        .bind(sub.prospect_id, `MIRA desvinculada (/admin/mira#m${id}). La etapa no cambió.`)
    ]);
  }
  return Response.redirect(url.origin + "/admin/mira#m" + (id || ""), 303);
}

/* ---------- authorisations ---------- */
async function authorizationsPage(env, url){
  const pendientes = url.searchParams.get("ver") === "pendientes";
  const { results } = await env.DB.prepare(
    "SELECT id, token, created_at, cliente, proyecto, client_doc, client_signed_at FROM authorizations" +
    (pendientes ? " WHERE client_signed_at IS NULL" : "") + " ORDER BY created_at DESC, id DESC LIMIT 200"
  ).all();
  const fresh = url.searchParams.get("nueva");
  return adminPage(env, "autorizaciones", "Autorizaciones", `
    ${sectionHead("Clientes · autorizaciones", "Uso de <em>imagen</em>", `<a class="pill new" href="/admin/autorizacion">+ Nueva autorización</a>`)}
    ${pendingPills("/admin/autorizaciones", pendientes, "Solo sin firmar")}
    ${results.length ? results.map(r => authorizationCard(r, url.origin, fresh)).join("") : `<p class="empty">No hay autorizaciones ${pendientes ? "esperando firma " : ""}todavía.</p>`}
  `, 200, COPY_SCRIPT);
}

/* ---------- testimonials ---------- */
async function testimonialsPage(env, url){
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
  return adminPage(env, "autorizaciones", "Nueva autorización", `
    <header class="top">
      <div>
        <p class="kicker"><a href="/admin/autorizaciones">← Autorizaciones</a> · nueva autorización</p>
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
  return adminPage(env, "firma", "Tu firma", `
    <header class="top">
      <div>
        <p class="kicker">Ajustes · tu firma</p>
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
    return adminPage(env, "firma", "Falta la firma", `<p class="empty">No llegó una firma válida. <a href="/admin/firma">Volver</a></p>`, 400);
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
  if(!r){ return Response.redirect(url.origin + "/admin/autorizaciones", 303); }
  if(r.client_signed_at){
    return adminPage(env, "autorizaciones", "Ya está firmada", `
      <p class="kicker"><a href="/admin/autorizaciones">← Autorizaciones</a></p>
      <p class="empty">Esta autorización ya fue firmada, así que no se puede cambiar: el cliente firmó estos datos. Si hay un error, bórrala y crea una nueva para que la firme otra vez.</p>`, 409);
  }
  return adminPage(env, "autorizaciones", "Editar autorización", `
    <header class="top">
      <div>
        <p class="kicker"><a href="/admin/autorizaciones">← Autorizaciones</a> · editar autorización</p>
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
    return adminPage(env, "autorizaciones", "Falta algo", `<p class="empty">Faltan el cliente o el proyecto. <a href="/admin/autorizacion/editar?id=${id || ""}">Volver</a></p>`, 400);
  }
  /* only an unsigned authorisation can change: the client signs what they read */
  const result = await env.DB.prepare(
    "UPDATE authorizations SET cliente = ?1, proyecto = ?2, web = ?3, redes = ?4 WHERE id = ?5 AND client_signed_at IS NULL"
  ).bind(cliente, proyecto, web || null, redes || null, id).run();
  if(!result.meta.changes){
    return adminPage(env, "autorizaciones", "No se pudo editar", `<p class="empty">Esta autorización ya fue firmada o no existe, así que no se cambió. <a href="/admin/autorizaciones">Volver al panel</a></p>`, 409);
  }
  const row = await env.DB.prepare("SELECT token FROM authorizations WHERE id = ?1").bind(id).first();
  return Response.redirect(url.origin + "/admin/autorizaciones?nueva=" + row.token, 303);
}

async function deleteAuthorization(request, env, url){
  const form = await request.formData();
  const id = parseInt(form.get("id"), 10);
  if(id){ await env.DB.prepare("DELETE FROM authorizations WHERE id = ?1").bind(id).run(); }
  return Response.redirect(url.origin + "/admin/autorizaciones", 303);
}

async function createAuthorization(request, env, url){
  const form = await request.formData();
  const field = (k, max) => String(form.get(k) || "").trim().slice(0, max);
  const cliente = field("cliente", 160), proyecto = field("proyecto", 160);
  const web = field("web", 300), redes = field("redes", 600);
  let firma = String(form.get("firma") || "");
  if(!firma && form.get("registrada") === "1"){ firma = (await registeredSignature(env)) || ""; }
  if(!cliente || !proyecto || !isSignature(firma)){
    return adminPage(env, "autorizaciones", "Falta algo", `<p class="empty">Faltan el cliente, el proyecto o tu firma. <a href="/admin/autorizacion">Volver</a></p>`, 400);
  }
  const token = newToken();
  await env.DB.prepare(
    "INSERT INTO authorizations (token, cliente, proyecto, web, redes, fecha, renne_sig) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)"
  ).bind(token, cliente, proyecto, web || null, redes || null, todayInBogota(), firma).run();
  return Response.redirect(url.origin + "/admin/autorizaciones?nueva=" + token, 303);
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
/* The order to go after prospects, as pool balls: 1 first, 5 last, and the 8
   for the discarded (6 and 7 are skipped on purpose). The research ranks them
   A to D; D is wide, so it splits by score: 25 and up is the 4, below is the 5.
   Derived when shown, so reloading a campaign keeps working. A ball picked
   by hand in the panel (column bola) wins over the research. */
const BALLS = {
  1:{ label:"Primero", sql:"prioridad = 'A'" },
  2:{ label:"Muy probable", sql:"prioridad = 'B'" },
  3:{ label:"Probable", sql:"prioridad = 'C'" },
  4:{ label:"Poco probable", sql:"prioridad = 'D' AND score >= 25" },
  5:{ label:"El menos probable", sql:"prioridad = 'D' AND (score < 25 OR score IS NULL)" },
  8:{ label:"Descartado", sql:"prioridad = 'Descartar'" }
};
const OLD_PRIORITY = { A:"1", B:"2", C:"3", Descartar:"8" };
/* the same rule in SQL, for filtering and ordering */
const BALL_SQL = "COALESCE(bola, CASE WHEN prioridad = 'A' THEN 1 WHEN prioridad = 'B' THEN 2 WHEN prioridad = 'C' THEN 3 " +
  "WHEN prioridad = 'D' AND score >= 25 THEN 4 WHEN prioridad = 'D' THEN 5 ELSE 8 END)";
function ballOf(prioridad, score, bola){
  if(BALLS[bola]){ return +bola; }
  if(prioridad === "A"){ return 1; }
  if(prioridad === "B"){ return 2; }
  if(prioridad === "C"){ return 3; }
  if(prioridad === "D"){ return score >= 25 ? 4 : 5; }
  return 8;
}

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
function ballTag(prioridad, score, withLabel = false, bola = null){
  const n = ballOf(prioridad, score, bola);
  return `<span class="pball" title="Bola ${n} · ${BALLS[n].label}"><i class="pb pb${n}"><b>${n}</b></i>${withLabel ? `<span>${BALLS[n].label}</span>` : ""}</span>`;
}

/* campaigns are "zone-yyyy-mm" (e.g. "laureles-2026-10"). They are many and
   growing, so they go in a dropdown grouped by month, newest first. */
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
function campaignParts(id){
  const m = String(id).match(/^(.*)-(\d{4})-(\d{2})$/);
  const words = (m ? m[1] : id).split("-").map(w => w ? w[0].toUpperCase() + w.slice(1) : w).join(" ");
  const zone = words.replace(/\bBelen\b/g, "Belén");
  if(!m){ return { zone, group:"Otras", order:"0000-00" }; }
  const month = MONTHS[+m[3] - 1] || m[3];
  return { zone, group:month[0].toUpperCase() + month.slice(1) + " " + m[2], order:m[2] + "-" + m[3] };
}
function campaignPicker(campaigns, current, base){
  const groups = new Map();
  for(const c of campaigns.map(c => ({ ...c, ...campaignParts(c.campaign) })).sort((a, b) => b.order.localeCompare(a.order) || a.zone.localeCompare(b.zone, "es"))){
    if(!groups.has(c.group)){ groups.set(c.group, []); }
    groups.get(c.group).push(c);
  }
  const options = [...groups].map(([g, list]) => `<optgroup label="${esc(g)}">${list.map(c =>
    `<option value="${esc(c.campaign)}"${c.campaign === current ? " selected" : ""}>${esc(c.zone)}${c.n != null ? " (" + c.n + ")" : ""}</option>`).join("")}</optgroup>`).join("");
  return `<form class="campaign" method="get" action="${base}"><label><span>Campaña</span>
    <select name="c" onchange="this.form.submit()">${options}</select></label><noscript><button type="submit">Ver</button></noscript></form>`;
}

async function prospectsPage(env, url){
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
  if(text){ binds.push("%" + text + "%"); const n = binds.length; where.push(`(negocio LIKE ?${n} OR barrio LIKE ?${n} OR categoria LIKE ?${n} OR code LIKE ?${n})`); }
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
        <input name="q" value="${esc(text)}" placeholder="Buscar negocio, barrio o categoría">
      </form>
    </nav>
    ${results.length ? `
    <div class="tablewrap"><table class="ptable">
      <thead><tr><th>#</th><th>Bola</th><th>Negocio</th><th>Barrio</th><th>Escribir por</th><th>Etapa</th><th>Próximo paso</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>` : `<p class="empty">Ningún prospecto con estos filtros.</p>`}
  `);
}

async function prospectPage(env, url){
  const id = url.searchParams.get("id") || "";
  const r = await env.DB.prepare("SELECT * FROM prospects WHERE id = ?1").bind(id).first();
  if(!r){ return Response.redirect(url.origin + "/admin/prospectos", 303); }
  const [{ results:events }, { results:miras }] = await env.DB.batch([
    env.DB.prepare("SELECT * FROM prospect_events WHERE prospect_id = ?1 ORDER BY created_at DESC, id DESC").bind(id),
    env.DB.prepare("SELECT * FROM submissions WHERE prospect_id = ?1 AND kind = 'mira' ORDER BY created_at DESC, id DESC").bind(id)
  ]);
  const token = await miraTokenFor(env, r);
  const miraLink = token ? url.origin + "/mira/?" + new URLSearchParams({ t:token, marca:r.negocio, o:originOfChannel(r.canal) }) : "";
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
      </section>
      <section class="sub">
        <h3>Lo que vimos</h3>
        <p><b>Gancho</b>${esc(r.gancho || "")}</p>
        <p><b>Nota de la verificación</b>${esc(r.nota || "")}</p>
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

/* ---------- the call: scheduled, then recorded ---------- */

const MEDIOS = { videollamada:"Videollamada", visita:"Visita", llamada:"Llamada" };
const ATTENDED = { si:"Sí", no:"No se presentó", reprogramo:"Reprogramó" };
const TEMPERATURE = { caliente:"Caliente", tibio:"Tibio", frio:"Frío" };
const OUTCOME = { sigue:"Sigue a MIRA escrita", no_encaja:"No encaja", lo_piensa:"Lo piensa" };
const PACKAGES = { 1:"Bola 1 · La Página", 3:"Bola 3 · Marca + Página", 5:"Bola 5 · La Tienda", 8:"Bola 8 · El Sistema" };

/* the latest call event with fields (scheduled or recorded); events come newest first */
function lastCall(events){
  for(const e of events){
    if(e.tipo !== "reunion" || !e.data){ continue; }
    try{ return { e, data:JSON.parse(e.data) }; }catch(err){}
  }
  return null;
}
/* "2026-10-14T10:00" is already Bogotá time: shown as it is written */
function callWhen(stamp){
  const d = new Date(String(stamp) + ":00Z");
  if(isNaN(d)){ return String(stamp || ""); }
  return d.toLocaleString("es-CO", { timeZone:"UTC", day:"numeric", month:"short", hour:"numeric", minute:"2-digit" });
}
function bogotaStamp(minutesAgo = 0){
  return new Date(Date.now() - minutesAgo * 60000).toLocaleString("sv-SE", { timeZone:"America/Bogota" }).replace(" ", "T").slice(0, 16);
}
function plusWorkdays(iso, n){
  let d = iso;
  while(n > 0){ d = plusDays(d, 1); const day = new Date(d + "T12:00:00Z").getUTCDay(); if(day !== 0 && day !== 6){ n--; } }
  return d;
}

function callBlock(r, call){
  const opts = (map, chosen = "") => Object.entries(map).map(([k, l]) => `<option value="${k}"${k === chosen ? " selected" : ""}>${l}</option>`).join("");
  const schedule = (label, data = {}) => `
        <form class="pform" method="post" action="/admin/prospecto">
          <input type="hidden" name="id" value="${esc(r.id)}"><input type="hidden" name="accion" value="agendar">
          <div class="frow">
            <label>Fecha<input type="date" name="fecha" required value="${esc(String(data.fecha || "").slice(0, 10))}"></label>
            <label>Hora<input type="time" name="hora" required value="${esc(String(data.fecha || "").slice(11, 16))}"></label>
            <label>Medio<select name="medio">${opts(MEDIOS, data.medio || "videollamada")}</select></label>
          </div>
          <button type="submit" class="go">${label}</button>
        </form>`;
  const record = `
        <form class="pform" method="post" action="/admin/prospecto">
          <input type="hidden" name="id" value="${esc(r.id)}"><input type="hidden" name="accion" value="registrar">
          <div class="frow">
            <label>Asistió<select name="asistio">${opts(ATTENDED)}</select></label>
            <label>Duración (min)<input type="number" name="duracion" min="0" max="240" inputmode="numeric" placeholder="30"></label>
            <label>Temperatura<select name="temperatura"><option value="">—</option>${opts(TEMPERATURE)}</select></label>
          </div>
          <label>Meta, en sus palabras<input name="meta" maxlength="300"></label>
          <label>Dolor, en sus palabras<input name="dolor" maxlength="300"></label>
          <div class="frow">
            <label>Decide<input name="decide" maxlength="120" placeholder="Solo / con su socio…"></label>
            <label>Fecha clave<input name="fecha_clave" maxlength="120" placeholder="Ej.: abre en diciembre"></label>
          </div>
          <div class="frow">
            <label>Presupuesto<input name="presupuesto" maxlength="120" placeholder="Lo que mencionó, o vacío"></label>
            <label>Bola candidata<select name="paquete"><option value="">—</option>${opts(PACKAGES)}</select></label>
          </div>
          <label>Objeciones<input name="objeciones" maxlength="300"></label>
          <div class="frow">
            <label>Resultado<select name="resultado">${opts(OUTCOME)}</select></label>
            <label>Próximo paso<input name="proximo" maxlength="200" placeholder="Si lo piensa: qué quedó"></label>
            <label>Fecha<input type="date" name="proximo_fecha"></label>
          </div>
          <label>Aprendizaje (una línea)<input name="aprendizaje" maxlength="200"></label>
          <p class="mono hintline">Si no se presentó o reprogramó, basta con «Asistió»: queda para reagendar.</p>
          <button type="submit" class="go">Guardar el registro</button>
        </form>`;
  if(call && call.data.estado === "agendada"){
    const late = String(call.data.fecha) <= bogotaStamp(120);
    return `
        <p class="${late ? "due" : "okline"}">Agendada · ${esc(callWhen(call.data.fecha))} · ${esc(MEDIOS[call.data.medio] || call.data.medio || "")}${late ? " · ya pasó: falta registrarla" : ""}</p>
        <details${late ? " open" : ""}><summary>Registrar la llamada</summary>${record}</details>
        <details><summary>Cambiar la fecha</summary>${schedule("Guardar la nueva fecha", call.data)}</details>`;
  }
  const last = call ? `<p class="mono">Última: ${esc(String(call.e.texto).split("\n")[0])}</p>` : "";
  return `${last}${schedule("Agendar la llamada")}
        <details><summary>Registrar una llamada que no se agendó</summary>${record}</details>`;
}

async function updateProspect(request, env, url){
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
async function funnelCsv(env){
  const [{ results:pros }, { results:miras }, { results:calls }] = await env.DB.batch([
    env.DB.prepare("SELECT id, campaign, code, negocio, etapa, prioridad, score, bola FROM prospects ORDER BY campaign, rank"),
    env.DB.prepare("SELECT prospect_id, origen, created_at FROM submissions WHERE kind = 'mira' AND prospect_id IS NOT NULL ORDER BY created_at"),
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
  const head = ["campana", "codigo", "negocio", "etapa", "bola", "mira_origen", "mira_fecha", "llamada_agendada", "asistio", "temperatura", "resultado", "bola_candidata"];
  const rows = pros.map(p => {
    const m = mira.get(p.id), s = scheduled.get(p.id), c = recorded.get(p.id);
    return [p.campaign, p.code, p.negocio, p.etapa, ballOf(p.prioridad, p.score, p.bola), m ? m.origen || "" : "", m ? m.created_at.slice(0, 10) : "",
      s ? s.fecha : "", c ? c.asistio : "", c ? c.temperatura || "" : "", c ? c.resultado || "" : "", c && c.paquete ? c.paquete : ""].map(cell).join(",");
  });
  return new Response("\ufeff" + [head.join(","), ...rows].join("\r\n"), { headers:{
    "Content-Type":"text/csv; charset=utf-8", "Content-Disposition":`attachment; filename="embudo-${todayIso()}.csv"`, "Cache-Control":"no-store"
  } });
}

/* ---------- adding a prospect by hand ---------- */
function bogotaMonth(){ return todayIso().slice(0, 7); }
function slug(text){
  return String(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

/* what a MIRA already says about a brand, as the fields of a new prospect */
function prospectFromMira(sub){
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

async function newProspectPage(env, url, error = "", values = {}){
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
      <label>Escribir por<select name="canal">${["Instagram (DM)", "WhatsApp", "Facebook (Messenger)", "Visita al local", "Correo", "Llamada"].map(c => `<option${values.canal === c ? " selected" : ""}>${c}</option>`).join("")}</select></label>
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

async function createProspect(request, env, url){
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

/* ---------- the map: every prospect of a campaign, as its ball ---------- */
const GEO = { esquina:"En la esquina exacta", cuadra:"En su cuadra", cercana:"A una cuadra", barrio:"Aproximada, por barrio", manual:"Marcada a mano" };

async function mapPage(env, url){
  const campaigns = (await env.DB.prepare("SELECT campaign, COUNT(*) AS n FROM prospects GROUP BY campaign ORDER BY campaign DESC").all()).results;
  if(!campaigns.length){ return Response.redirect(url.origin + "/admin/prospectos", 303); }
  const campaign = campaigns.some(c => c.campaign === url.searchParams.get("c")) ? url.searchParams.get("c") : campaigns[0].campaign;
  const { results } = await env.DB.prepare(
    "SELECT id, code, rank, prioridad, score, bola, negocio, categoria, barrio, direccion, canal, enlace, etapa, proxima_accion, proxima_fecha, lat, lng, geo " +
    "FROM prospects WHERE campaign = ?1 ORDER BY rank"
  ).bind(campaign).all();
  const originRow = await env.DB.prepare("SELECT value FROM settings WHERE key = ?1").bind("origen:" + campaign).first();
  let origin = null;
  try{ origin = originRow ? JSON.parse(originRow.value) : null; }catch(e){}

  const placed = [], missing = [];
  for(const r of results){
    const item = { id:r.id, code:r.code, rank:r.rank, ball:ballOf(r.prioridad, r.score, r.bola), negocio:r.negocio, categoria:r.categoria,
      barrio:r.barrio, direccion:r.direccion, canal:r.canal, enlace:r.enlace, etapa:r.etapa, proxima:r.proxima_accion, fecha:r.proxima_fecha,
      lat:r.lat, lng:r.lng, geo:r.geo };
    (r.lat != null ? placed : missing).push(item);
  }
  const DATA = { placed, origin, focus:url.searchParams.get("id") || "", balls:BALLS, stages:STAGES, geo:GEO };

  return adminPage(env, "mapa", "Mapa", `
    <header class="top">
      <div><p class="kicker">Ventas · mapa</p><h1>Dónde <em>están</em></h1></div>
      <div class="totals mono">${campaignPicker(campaigns, campaign, "/admin/mapa")}
      <span class="pickline">${placed.length} en el mapa · ${missing.length} sin dirección</span></div>
    </header>
    <nav class="filters" id="mapBalls">
      ${Object.keys(BALLS).map(n => `<label class="pill ballpill mapf${n === "8" ? "" : " on"}"><input type="checkbox" value="${n}"${n === "8" ? "" : " checked"} hidden><i class="pb pb${n}"><b>${n}</b></i>${BALLS[n].label}</label>`).join("")}
    </nav>
    <nav class="filters" id="mapStages">
      <span class="mono mapnote">Etapa:</span>
      ${Object.entries(STAGES).map(([k, l]) => `<label class="pill mapf${k === "descartado" ? "" : " on"}"><input type="checkbox" value="${k}"${k === "descartado" ? "" : " checked"} hidden>${l}</label>`).join("")}
    </nav>
    <div class="mapwrap"><div id="map" aria-label="Mapa de prospectos"></div></div>
    <p class="mono mapnote">El círculo punteado es una ubicación aproximada (solo se conoce el barrio). La bola 16 es el punto de partida${origin && origin.lugar ? ": " + esc(origin.lugar) : ""}.</p>
    ${missing.length ? `<section class="sub"><h3>Sin dirección (${missing.length})</h3><ul class="plist">${missing.map(m => `
      <li><span class="pball"><i class="pb pb${m.ball}"><b>${m.ball}</b></i></span> <a class="biz" href="/admin/prospecto?id=${encodeURIComponent(m.id)}">${esc(m.negocio)}</a> <span class="mono">· ${esc(m.direccion || "sin dato")}</span></li>`).join("")}</ul></section>` : ""}
  `, 200, `
${LEAFLET}
<script>window.__MAP = ${JSON.stringify(DATA).replace(/</g, "\\u003c")};</script>
<script>${MAP_SCRIPT}</script>`);
}

const LEAFLET = `
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>`;

/* on a prospect's page: tap the map, or search, to put it where it is */
const MINI_MAP_SCRIPT = `
(function(){
  var M = window.__MINI, form = document.getElementById("placeForm");
  if(!form || !window.L){ return; }
  var map = L.map("map", { scrollWheelZoom:false });
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom:19, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
  var icon = L.divIcon({ className:"mk", iconSize:[28, 28], iconAnchor:[14, 14], html:'<i class="pb pb' + M.ball + '"><b>' + M.ball + '</b></i>' });
  var marker = null, save = document.getElementById("placeSave"), msg = document.getElementById("placeMsg");
  function put(lat, lng, why){
    if(marker){ marker.setLatLng([lat, lng]); } else { marker = L.marker([lat, lng], { icon:icon, draggable:true }).addTo(map); marker.on("dragend", function(){ var p = marker.getLatLng(); put(p.lat, p.lng, "Movido. Guarda para dejarlo ahí."); }); }
    form.lat.value = lat.toFixed(6); form.lng.value = lng.toFixed(6);
    save.disabled = false; msg.textContent = why;
  }
  if(M.lat != null){ marker = L.marker([M.lat, M.lng], { icon:icon, draggable:true }).addTo(map); map.setView([M.lat, M.lng], 17);
    marker.on("dragend", function(){ var p = marker.getLatLng(); put(p.lat, p.lng, "Movido. Guarda para dejarlo ahí."); }); }
  else { map.setView(M.centre, 15); }
  map.on("click", function(e){ put(e.latlng.lat, e.latlng.lng, "Marcado. Guarda para dejarlo ahí."); });
  var q = document.getElementById("placeQuery");
  function find(){
    if(!q.value.trim()){ return; }
    msg.textContent = "Buscando…";
    fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=co&viewbox=-75.72,6.36,-75.48,6.10&q=" + encodeURIComponent(q.value + ", Medellín"))
      .then(function(r){ return r.json(); }).then(function(j){
        if(!j[0]){ msg.textContent = "No la encontré. Toca el punto en el mapa."; return; }
        map.setView([+j[0].lat, +j[0].lon], 17); put(+j[0].lat, +j[0].lon, "Encontrado: revisa que esté bien y guarda. Si no, toca el punto exacto.");
      }).catch(function(){ msg.textContent = "No pude buscar ahora. Toca el punto en el mapa."; });
  }
  document.getElementById("placeFind").addEventListener("click", find);
  q.addEventListener("keydown", function(e){ if(e.key === "Enter"){ e.preventDefault(); find(); } });
})();
`;

const MAP_SCRIPT = `
(function(){
  var D = window.__MAP, map = L.map("map", { zoomControl:true, scrollWheelZoom:true });
  /* OpenStreetMap's own tiles: free and without a key; darkened in CSS to sit on the panel */
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom:19,
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]; }); }
  function icon(ball, approx, focus){
    return L.divIcon({ className:"mk" + (approx ? " approx" : "") + (focus ? " focus" : ""), iconSize:[28, 28], iconAnchor:[14, 14], popupAnchor:[0, -14],
      html:'<i class="pb pb' + ball + '"><b>' + ball + '</b></i>' });
  }
  var markers = [], bounds = [];
  D.placed.forEach(function(p){
    var m = L.marker([p.lat, p.lng], { icon:icon(p.ball, p.geo === "barrio", p.id === D.focus), riseOnHover:true, zIndexOffset:(9 - p.ball) * 100 });
    var dir = "https://www.google.com/maps/dir/?api=1&destination=" + p.lat + "," + p.lng;
    m.bindPopup('<div class="mpop"><p class="mono">' + esc(p.code) + ' · puesto ' + esc(p.rank) + ' · ' + esc(D.balls[p.ball].label) + '</p>' +
      '<h4>' + esc(p.negocio) + '</h4><p>' + esc(p.categoria || "") + '</p>' +
      '<p class="mono">' + esc(p.direccion || p.barrio || "") + '<br>' + esc(D.geo[p.geo] || "") + '</p>' +
      '<p><span class="tag st-' + esc(p.etapa) + '">' + esc(D.stages[p.etapa] || p.etapa) + '</span>' + (p.proxima ? ' <span class="mono">' + esc(p.proxima) + (p.fecha ? " · " + esc(p.fecha) : "") + '</span>' : "") + '</p>' +
      '<p class="mlinks"><a href="/admin/prospecto?id=' + encodeURIComponent(p.id) + '">Abrir ficha</a>' +
      (p.enlace ? '<a href="' + esc(p.enlace) + '" target="_blank" rel="noopener">' + esc(p.canal) + '</a>' : "") +
      '<a href="' + dir + '" target="_blank" rel="noopener">Cómo llegar</a></p></div>');
    m._p = p; markers.push(m); bounds.push([p.lat, p.lng]);
  });
  if(D.origin){
    L.marker([D.origin.lat, D.origin.lon], { icon:L.divIcon({ className:"mk origin", iconSize:[30, 30], iconAnchor:[15, 15], html:'<i class="pb pb16"><b>16</b></i>' }), zIndexOffset:2000 })
      .bindPopup('<div class="mpop"><h4>Punto de partida</h4><p>' + esc(D.origin.lugar || "") + '</p></div>').addTo(map);
    bounds.push([D.origin.lat, D.origin.lon]);
  }
  function apply(){
    var balls = [].map.call(document.querySelectorAll("#mapBalls input:checked"), function(i){ return +i.value; });
    var stages = [].map.call(document.querySelectorAll("#mapStages input:checked"), function(i){ return i.value; });
    markers.forEach(function(m){
      var on = balls.indexOf(m._p.ball) !== -1 && stages.indexOf(m._p.etapa) !== -1;
      if(on && !map.hasLayer(m)){ m.addTo(map); } else if(!on && map.hasLayer(m)){ map.removeLayer(m); }
    });
  }
  [].forEach.call(document.querySelectorAll(".mapf input"), function(i){
    i.addEventListener("change", function(){ i.parentNode.classList.toggle("on", i.checked); apply(); });
  });
  apply();
  var focus = markers.filter(function(m){ return m._p.id === D.focus; })[0];
  if(focus){ if(!map.hasLayer(focus)){ focus.addTo(map); } map.setView(focus.getLatLng(), 17); focus.openPopup(); }
  else if(bounds.length){ map.fitBounds(bounds, { padding:[30, 30] }); }
  else { map.setView([6.2275, -75.602], 14); }
})();
`;

async function resourcesPage(env){
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

async function resourcePage(env, url){
  const r = await env.DB.prepare("SELECT * FROM resources WHERE slug = ?1").bind(url.searchParams.get("slug") || "").first();
  if(!r){ return Response.redirect(url.origin + "/admin/recursos", 303); }
  return adminPage(env, "recursos", r.title, `
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
  var b = e.target.closest("[data-copy],[data-copy-from]");
  if(!b){ return; }
  var label = b.getAttribute("data-label") || "Copiar enlace";
  var from = b.getAttribute("data-copy-from"), field = from && document.getElementById(from);
  var text = field ? field.value : b.getAttribute("data-copy");
  navigator.clipboard.writeText(text).then(function(){ b.textContent = "Copiado ✓"; setTimeout(function(){ b.textContent = label; }, 1800); });
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

/* the four parts of a MIRA, as the panel shows them */
function miraAnswers(d){
  return `
      <div class="mira">
        <section><h3><i>M</i> Marca</h3>${row("Nombre", d.marca)}${row("Qué hace", d.queHace)}${row("Su historia", d.historia)}</section>
        <section><h3><i>I</i> Imagen</h3>${row("Ya cuenta con", list(d.tiene))}</section>
        <section><h3><i>R</i> Redes</h3>${row("Dónde encontrarla", d.enlaces)}</section>
        <section><h3><i>A</i> Alineación</h3>${row("Le habla a", [list(d.publico), d.publicoDetalle].filter(Boolean).join(", "))}${row("Quiere que sientan", list(d.objetivos))}</section>
      </div>`;
}

/* where a MIRA came from and whose it is, with what can be done about it */
function miraLinkLine(r){
  const origin = `<span class="tag t-net">${r.origen ? "Desde " + esc(ORIGINS[r.origen] || r.origen) : "Sin origen"}</span>`;
  if(r.prospect_id){
    return `<div class="mlink">${origin}
      <span class="tag t-ok">${r.vinculo === "enlace" ? "Enlace personal" : "Vinculada a mano"}</span>
      <a class="biz" href="/admin/prospecto?id=${encodeURIComponent(r.prospect_id)}">${esc(r.p_negocio || r.prospect_id)}</a>${r.p_etapa ? " " + stageTag(r.p_etapa) : ""}
      <form method="post" action="/admin/mira/desvincular" data-confirm="¿Desvincular esta MIRA de ${esc(r.p_negocio || "su prospecto")}? La etapa del prospecto no cambia.">
        <input type="hidden" name="id" value="${r.id}"><button type="submit">Desvincular</button></form>
    </div>`;
  }
  return `<div class="mlink">${origin}<span class="tag t-wait">Sin prospecto</span>
      <a class="pill" href="/admin/mira/vincular?id=${r.id}">Vincular a un prospecto</a>
      <a class="pill" href="/admin/prospecto/nuevo?mira=${r.id}">Crear prospecto</a>
    </div>`;
}

function card(r, here){
  let d = {};
  try{ d = JSON.parse(r.data); }catch(e){}
  const when = new Date(r.created_at.replace(" ", "T") + "Z").toLocaleString("es-CO", { timeZone:"America/Bogota", dateStyle:"medium", timeStyle:"short" });
  let body;
  if(r.kind === "mira"){
    body = `${miraLinkLine(r)}${miraAnswers(d)}
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
    <article class="sub${r.reviewed ? " done" : ""}" id="${r.kind === "mira" ? "m" : "c"}${r.id}">
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

function page(title, content, status = 200, script = "", shell = false){
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
  .campaign label{display:flex;align-items:center;gap:10px;justify-content:flex-end}
  .campaign span{font:11px "JetBrains Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--iron)}
  .campaign select{min-width:230px;padding:9px 36px 9px 14px;border-radius:999px;border:1px solid var(--line);background:#0b0c0d;color:var(--white);
    font:14px Inter,sans-serif;cursor:pointer;appearance:none;
    background-image:linear-gradient(45deg,transparent 50%,var(--ash) 50%),linear-gradient(135deg,var(--ash) 50%,transparent 50%);
    background-position:calc(100% - 18px) 50%,calc(100% - 13px) 50%;background-size:5px 5px;background-repeat:no-repeat}
  .campaign select:focus{outline:2px solid var(--accent);outline-offset:2px}
  .campaign optgroup{font-style:normal;color:var(--iron);background:#0b0c0d}
  .campaign option{color:var(--white);background:#0b0c0d}
  .totals{text-align:right}
  .totals .campaign ~ a,.totals .pickline{display:inline-block;margin-top:10px}
  @media (max-width:720px){.totals{text-align:left}.campaign label{justify-content:flex-start}}
  .pipeline{display:grid;grid-template-columns:repeat(8,1fr);gap:8px;margin-bottom:18px}
  .pipeline a{display:flex;flex-direction:column;gap:2px;padding:12px 14px;border:1px solid var(--line);border-radius:14px;color:var(--ash);text-decoration:none;font:11px "JetBrains Mono",monospace;text-transform:uppercase;letter-spacing:.05em}
  .pipeline b{font:400 1.9rem/1 "Instrument Serif",serif;color:var(--white);letter-spacing:0}
  .pipeline a.on{border-color:var(--accent)} .pipeline a.on b{color:var(--accent)}
  .pipeline a.today{border-style:dashed}
  /* the search gets its own row, as wide as the filters above it */
  .search{flex:1 1 100%;display:flex;margin-top:4px}
  .search input,.pform input,.pform select,.pform textarea{padding:8px 12px;border-radius:10px;border:1px solid var(--line);background:#0b0c0d;color:var(--white);font:14px Inter,sans-serif}
  .search input{flex:1;width:100%;min-width:0;border-radius:999px}
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
  .pball{display:inline-flex;align-items:center;gap:8px;white-space:nowrap;font:11px "JetBrains Mono",monospace;letter-spacing:.06em;text-transform:uppercase;color:var(--ash)}
  .pb{--c:#888;position:relative;display:inline-grid;place-items:center;flex:none;width:26px;height:26px;border-radius:50%;font-style:normal;
    background:var(--c);box-shadow:inset -3px -4px 6px rgba(0,0,0,.4),inset 2px 2px 4px rgba(255,255,255,.3)}
  .pb::before{content:"";position:absolute;width:13px;height:13px;border-radius:50%;background:#fffdf5}
  .pb b{position:relative;font:600 9px/1 Inter,sans-serif;color:#111}
  .pb1{--c:#f4c20d} .pb2{--c:#4d7dff} .pb3{--c:#ff5c6e} .pb4{--c:#a375d8} .pb5{--c:#ff9d3d}
  .pb8{--c:#0b0b0b;box-shadow:inset -3px -4px 6px rgba(0,0,0,.6),inset 2px 2px 4px rgba(255,255,255,.18),0 0 0 1px #2a2e31}
  /* the ball picker */
  .ballpick{display:flex;flex-wrap:wrap;gap:8px}
  form .ballpick label{position:relative;display:inline-flex;align-items:center;gap:8px;padding:5px 12px 5px 5px;border:1px solid var(--line);border-radius:999px;cursor:pointer;
    font:11px "JetBrains Mono",monospace;letter-spacing:.04em;text-transform:none;color:var(--ash);flex-direction:row;gap:8px}
  .ballpick input{position:absolute;opacity:0;pointer-events:none}
  .ballpick label:has(input:checked){border-color:var(--white);color:var(--white);background:rgba(255,255,255,.05)}
  .ballpick label:has(input:focus-visible){outline:2px solid var(--accent);outline-offset:2px}
  .ballpick .pb{width:24px;height:24px}
  .searchrow{display:flex;gap:8px}
  .searchrow input{flex:1}
  .minimap{height:300px !important;border:1px solid var(--line);border-radius:12px;overflow:hidden}
  .pform button[disabled]{opacity:.4;cursor:not-allowed}
  .newauth select,.newauth textarea{padding:10px 12px;border-radius:10px;border:1px solid var(--line);background:#0b0c0d;color:var(--white);font:15px Inter,sans-serif;text-transform:none;letter-spacing:0}
  .newauth .wide{grid-column:1 / -1}
  .newauth label[hidden]{display:none}
  .flabel{display:block;margin-bottom:8px;font:11px "JetBrains Mono",monospace;letter-spacing:.06em;text-transform:uppercase;color:var(--iron)}
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
  .mpop{min-width:220px;font:14px/1.4 Inter,sans-serif}
  #map .mpop h4{margin:2px 0 4px;font:400 1.4rem/1.1 "Instrument Serif",serif;color:var(--white)}
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
  @media (max-width:720px){.pipeline{grid-template-columns:repeat(2,1fr)}.search{margin-left:0;width:100%}.search input{min-width:0;width:100%}.tiles{grid-template-columns:1fr}.mira{grid-template-columns:1fr}.when{margin-left:0}.newauth{grid-template-columns:1fr}}
  /* the admin shell: menu on the left, the section on the right */
  main.wide{max-width:none;padding:0}
  .shell{display:grid;grid-template-columns:240px minmax(0,1fr);min-height:100vh}
  .side{position:sticky;top:0;height:100vh;overflow-y:auto;display:flex;flex-direction:column;gap:18px;padding:26px 16px;border-right:1px solid var(--line);background:#030404}
  .side-brand{display:flex;align-items:center;gap:10px;padding:0 8px;color:var(--white);text-decoration:none;font:500 13px "JetBrains Mono",monospace}
  .side-brand img{width:26px;height:auto}
  .side-brand span{margin-left:auto;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--iron)}
  .side-nav{display:flex;flex-direction:column;gap:2px}
  .nav-group{margin:16px 8px 6px;font:11px "JetBrains Mono",monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--iron)}
  .nav-item{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 12px;border-radius:10px;color:var(--ash);text-decoration:none;font-size:14px}
  .nav-item:hover{background:rgba(255,255,255,.04);color:var(--white)}
  .nav-item.on{background:rgba(58,211,137,.1);color:var(--white);box-shadow:inset 2px 0 0 var(--accent)}
  .badge{min-width:22px;padding:1px 7px;border-radius:999px;background:var(--b1);color:#000;font:600 11px "JetBrains Mono",monospace;text-align:center}
  .side-site{margin-top:auto;padding:8px;color:var(--iron);font:12px "JetBrains Mono",monospace;text-decoration:none}
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
  details > summary{cursor:pointer;color:var(--accent);font:500 13px Inter,sans-serif}
  details[open] > summary{margin-bottom:12px}
  @media (max-width:720px){.pick{grid-template-columns:1fr}}
  .tile{display:flex;flex-direction:column;gap:4px;padding:18px 20px;border:1px solid var(--line);border-radius:16px;text-decoration:none;background:rgba(255,255,255,.02)}
  .tile:hover{border-color:var(--ash)}
  .tile.hot{border-color:var(--b1)}
  .tile-label{font:11px "JetBrains Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--iron)}
  .tile b{font:400 3rem/1 "Instrument Serif",serif;color:var(--white)}
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
