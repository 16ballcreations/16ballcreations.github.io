/* Autorizaciones de uso de imagen: creación, firma del cliente y firma registrada. */

import { json } from "./comun/api.js";
import { SITE } from "./comun/config.js";
import { COPY_SCRIPT, adminPage, pendingPills, sectionHead } from "./comun/pagina.js";
import { esc, row, todayInBogota, whenInBogota } from "./comun/util.js";

/* ---------- image-use authorisations ---------- */

export const MAX_SIG = 400 * 1024;

export function newToken(){
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
}
export function isSignature(value){
  return typeof value === "string" && value.startsWith("data:image/png;base64,") && value.length > 200 && value.length < MAX_SIG;
}

/* what the signing page needs; never the client's IP or browser */
export async function getAuthorization(request, env, url, token){
  const r = await env.DB.prepare("SELECT * FROM authorizations WHERE token = ?1").bind(token).first();
  if(!r){ return json({ ok:false, error:"No encontramos esta autorización" }, 404, request, url); }
  return json({
    ok:true,
    cliente:r.cliente, proyecto:r.proyecto, web:r.web, redes:r.redes, fecha:r.fecha,
    renne:{ firma:r.renne_sig, fecha:whenInBogota(r.created_at) },
    firmado: r.client_signed_at ? { firma:r.client_sig, documento:r.client_doc, fecha:whenInBogota(r.client_signed_at) } : null
  }, 200, request, url);
}

export async function signAuthorization(request, env, url, token){
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

/* ---------- authorisations ---------- */
export async function authorizationsPage(env, url){
  const pendientes = url.searchParams.get("ver") === "pendientes";
  const { results } = await env.DB.prepare(
    "SELECT id, token, created_at, cliente, proyecto, client_doc, client_signed_at FROM authorizations" +
    (pendientes ? " WHERE client_signed_at IS NULL" : "") + " ORDER BY created_at DESC, id DESC LIMIT 200"
  ).all();
  const fresh = url.searchParams.get("nueva");
  return adminPage(env, "autorizaciones", "Autorizaciones", `
    ${sectionHead("Clientes · autorizaciones", "Uso de <em>imagen</em>", `<a class="pill new" href="/admin/autorizacion">+ Nueva autorización</a>`)}
    ${pendingPills("/admin/autorizaciones", pendientes, "Solo sin firmar")}
    ${results.length ? results.map(r => authorizationCard(r, SITE, fresh)).join("") : `<p class="empty">No hay autorizaciones ${pendientes ? "esperando firma " : ""}todavía.</p>`}
  `, 200, COPY_SCRIPT);
}

export function authorizationCard(r, origin, fresh){
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

export async function registeredSignature(env){
  const row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'renne_sig'").first();
  return row ? row.value : null;
}

export async function newAuthorizationPage(env){
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
export async function signaturePage(env, url){
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

export async function saveSignature(request, env, url){
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

export async function editAuthorizationPage(env, url){
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

export async function updateAuthorization(request, env, url){
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

export async function deleteAuthorization(request, env, url){
  const form = await request.formData();
  const id = parseInt(form.get("id"), 10);
  if(id){ await env.DB.prepare("DELETE FROM authorizations WHERE id = ?1").bind(id).run(); }
  return Response.redirect(url.origin + "/admin/autorizaciones", 303);
}

export async function createAuthorization(request, env, url){
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

/* the signature pad on the new-authorisation page */
export const PAD_SCRIPT = `<script>
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
export const SIG_SCRIPT = `<script>
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
