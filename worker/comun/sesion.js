/* La puerta del panel: inicio de sesión, sesiones, límite de intentos y CSRF. */

import { page } from "./pagina.js";
import { esc } from "./util.js";

/* ---------- the panel's door: sign-in, sessions, CSRF ---------- */

/* The panel used to sit behind Basic Auth. Now it has a sign-in page and a
   session in a cookie (30 days, renewed while in use), a way out, a limit on
   wrong passwords, and every POST must come from this same site. Same design
   as the KaffeePlatz panel.

   The password: ADMIN_CLAVE_HASH (PBKDF2, made with scripts/hash-clave.mjs)
   when it is set; otherwise ADMIN_PASSWORD, compared as it is. There is no
   user name: one shared password, one person. */
export const SESSION_COOKIE = "bc_sesion";
export const SESSION_DAYS = 30;
export const SESSION_SECONDS = SESSION_DAYS * 24 * 60 * 60;
export const RENEW_UNDER_SECONDS = 24 * 60 * 60;
export const MAX_FAILS = 10;
export const FAIL_WINDOW_MINUTES = 15;

export function panelHeaders(extra = {}){
  return { "Cache-Control":"no-store, no-cache, must-revalidate", "X-Robots-Tag":"noindex, nofollow, noarchive", "Referrer-Policy":"same-origin", ...extra };
}
export function sessionCookie(id){
  return `${SESSION_COOKIE}=${id}; HttpOnly; Secure; SameSite=Strict; Path=/admin; Max-Age=${SESSION_SECONDS}`;
}
export function emptySessionCookie(){
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/admin; Max-Age=0`;
}
export function sessionIdOf(request){
  for(const part of (request.headers.get("Cookie") || "").split(";")){
    const i = part.indexOf("=");
    if(i > 0 && part.slice(0, i).trim() === SESSION_COOKIE){
      const v = part.slice(i + 1).trim();
      return /^[0-9a-f]{64}$/.test(v) ? v : null;
    }
  }
  return null;
}
export const sqlTime = d => d.toISOString().slice(0, 19).replace("T", " ");
export function ipOf(request){
  return request.headers.get("CF-Connecting-IP") || (request.headers.get("X-Forwarded-For") || "").split(",")[0].trim() || "desconocida";
}

/* a POST only counts when the browser says it comes from this same site */
export function sameOrigin(request, url){
  const origin = request.headers.get("Origin");
  if(!origin){ return false; }
  try{ return new URL(origin).origin === url.origin; }catch(e){ return false; }
}

export function sameText(a, b){
  /* compare in constant time, so the answer time does not leak the key */
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for(let i = 0; i < Math.max(x.length, y.length); i++){ diff |= (x[i] || 0) ^ (y[i] || 0); }
  return diff === 0;
}
/* "pbkdf2$sha256$<iterations>$<salt b64>$<hash b64>"; fails closed */
export async function matchesHash(password, stored){
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
export async function isThePassword(env, password){
  if(!password){ return false; }
  if(env.ADMIN_CLAVE_HASH){ return matchesHash(password, env.ADMIN_CLAVE_HASH); }
  return env.ADMIN_PASSWORD ? sameText(password, env.ADMIN_PASSWORD) : false;
}

export async function validSession(env, id){
  if(!id){ return null; }
  try{
    const r = await env.DB.prepare("SELECT id, expires_at FROM sesiones WHERE id = ?1 AND expires_at > datetime('now')").bind(id).first();
    return r ? { id:r.id, expires:new Date(r.expires_at.replace(" ", "T") + "Z") } : null;
  }catch(e){ return null; }
}
export async function openSession(env, request){
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
export async function renewIfDue(env, session){
  if((session.expires.getTime() - Date.now()) / 1000 > RENEW_UNDER_SECONDS){ return null; }
  try{
    await env.DB.prepare("UPDATE sesiones SET expires_at = ?2 WHERE id = ?1").bind(session.id, sqlTime(new Date(Date.now() + SESSION_SECONDS * 1000))).run();
    return sessionCookie(session.id);
  }catch(e){ return null; }
}

export async function failsOf(env, ip){
  try{
    const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM intentos WHERE ip = ?1 AND ok = 0 AND created_at > datetime('now', ?2)")
      .bind(ip, `-${FAIL_WINDOW_MINUTES} minutes`).first();
    return r ? r.n : 0;
  }catch(e){ return MAX_FAILS; }   /* if it cannot count, it does not let anyone try */
}
export async function noteAttempt(env, ip, ok){
  try{
    await env.DB.prepare("INSERT INTO intentos (ip, ok) VALUES (?1, ?2)").bind(ip, ok ? 1 : 0).run();
    if(ok){ await env.DB.prepare("DELETE FROM intentos WHERE ip = ?1 AND ok = 0").bind(ip).run(); }
    if(Math.random() < .05){ await env.DB.prepare("DELETE FROM intentos WHERE created_at < datetime('now', '-1 day')").run(); }
  }catch(e){}
}

/* where to go after signing in: only somewhere inside the panel */
export function safeReturn(raw){
  if(!raw || !raw.startsWith("/admin") || raw.startsWith("//") || raw.startsWith("/admin/entrar") || raw.startsWith("/admin/salir")){ return "/admin"; }
  return raw;
}

export function signInPage(volver, error = "", status = 200){
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

export async function signIn(request, env, url){
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

export async function signOut(request, env, url){
  const id = sessionIdOf(request);
  if(id){ try{ await env.DB.prepare("DELETE FROM sesiones WHERE id = ?1").bind(id).run(); }catch(e){} }
  return new Response(null, { status:303, headers:panelHeaders({ Location:url.origin + "/admin/entrar", "Set-Cookie":emptySessionCookie() }) });
}
