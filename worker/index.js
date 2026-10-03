/* 16 Ball Creations: the Worker.
   The site itself is static and served straight from the assets; this code
   only runs for what is not a file:

   POST /api/mira               a MIRA, sent from /mira/
   POST /api/contacto           the contact form on the home page
   GET  /api/autorizacion/:t    an image-use authorisation, for its signing page
   POST /api/autorizacion/:t    the client signs it (once)
   GET  /admin                  the review panel (basic auth, ADMIN_PASSWORD secret)
   POST /admin/revisado         mark a submission as reviewed, or not
   GET  /admin/autorizacion     new authorisation: the data; Renne's signature goes on it
   POST /admin/autorizacion     create it, and get the client's link
   GET  /admin/firma            Renne's registered signature: see it, replace it
   POST /admin/firma            save it (cleaned up in the browser before upload)

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
    const auth = path.match(/^\/api\/autorizacion\/([a-f0-9]{32})$/);
    if(auth){
      if(request.method === "OPTIONS"){ return preflight(request, url); }
      if(request.method === "GET"){ return getAuthorization(request, env, url, auth[1]); }
      if(request.method === "POST"){ return signAuthorization(request, env, url, auth[1]); }
      return json({ ok:false, error:"Método no permitido" }, 405, request, url);
    }
    if(path === "/admin" || path === "/admin/revisado" || path === "/admin/autorizacion" || path === "/admin/firma"){
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

/* ---------- image-use authorisations ---------- */

const MAX_SIG = 250 * 1024;

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
  if(path === "/admin/firma"){
    return request.method === "POST" ? saveSignature(request, env, url) : signaturePage(env, url);
  }

  const tipo = ["mira", "contacto", "autorizaciones"].includes(url.searchParams.get("tipo")) ? url.searchParams.get("tipo") : "";
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

  let list;
  if(tipo === "autorizaciones"){
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
      <p class="totals mono">MIRA ${c.mira.n} (${c.mira.p} sin revisar) · Contacto ${c.contacto.n} (${c.contacto.p} sin revisar) · Autorizaciones ${ac.n || 0} (${ac.p || 0} sin firmar)</p>
    </header>
    <nav class="filters">
      ${link("", "", "Todo")}${link("mira", "", "MIRA")}${link("contacto", "", "Contacto")}${link("autorizaciones", "", "Autorizaciones")}${link(tipo, "pendientes", tipo === "autorizaciones" ? "Solo sin firmar" : "Solo sin revisar")}
      <a class="pill" href="/admin/firma">Tu firma</a>
      <a class="pill new" href="/admin/autorizacion">+ Nueva autorización</a>
    </nav>
    ${list}
  `, 200, COPY_SCRIPT);
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

/* copy buttons in the list */
const COPY_SCRIPT = `<script>
document.addEventListener("click", function(e){
  var b = e.target.closest("[data-copy]");
  if(!b){ return; }
  navigator.clipboard.writeText(b.getAttribute("data-copy")).then(function(){ b.textContent = "Copiado ✓"; setTimeout(function(){ b.textContent = "Copiar enlace"; }, 1800); });
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
        /* light paper becomes transparent; ink becomes near-black, its edge soft */
        var a = lum > 205 ? 0 : lum < 120 ? 255 : Math.round((205 - lum) / 85 * 255);
        p[i] = p[i + 1] = p[i + 2] = 17; p[i + 3] = a;
        if(a > 60){ if(x < minX){ minX = x; } if(x > maxX){ maxX = x; } if(y < minY){ minY = y; } if(y > maxY){ maxY = y; } }
      } }
      if(maxX < 0){ msg.textContent = "No encontramos trazos oscuros en la imagen."; return; }
      ctx.putImageData(d, 0, 0);
      var pad = 8, cw = maxX - minX + 1 + pad * 2, ch = maxY - minY + 1 + pad * 2;
      var k = Math.min(1, 900 / cw), t = document.createElement("canvas");
      t.width = Math.round(cw * k); t.height = Math.round(ch * k);
      t.getContext("2d").drawImage(c, minX - pad, minY - pad, cw, ch, 0, 0, t.width, t.height);
      out.value = t.toDataURL("image/png");
      if(out.value.length > 240000){ msg.textContent = "La imagen quedó muy pesada; prueba con una foto más pequeña."; save.disabled = true; return; }
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
  @media (max-width:720px){.mira{grid-template-columns:1fr}.when{margin-left:0}.newauth{grid-template-columns:1fr}}
</style></head><body><main>${content}</main>${script}</body></html>`, {
    status,
    headers:{ "Content-Type":"text/html; charset=utf-8", "Cache-Control":"no-store", "X-Robots-Tag":"noindex, nofollow" }
  });
}
