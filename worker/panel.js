/* El enrutador del panel: cada ruta de /admin a su página. */

import { authorizationsPage, createAuthorization, deleteAuthorization, editAuthorizationPage, newAuthorizationPage, saveSignature, signaturePage, updateAuthorization } from "./autorizaciones.js";
import { SECTION_PATHS, page } from "./comun/pagina.js";
import { panelHeaders, renewIfDue, safeReturn, sameOrigin, sessionIdOf, signIn, signInPage, signOut, validSession } from "./comun/sesion.js";
import { mailPage } from "./correo.js";
import { dashboardPage } from "./inicio.js";
import { linkMiraByHand, linkMiraPage, submissionsPage, unlinkMira } from "./mira.js";
import { proposalPage, proposalsPage } from "./propuestas.js";
import { testimonialsPage } from "./testimonios.js";
import { mapPage } from "./ventas/mapa.js";
import { createProspect, funnelCsv, newProspectPage, prospectPage, prospectsPage, updateProspect } from "./ventas/prospectos.js";
import { resourcePage, resourcesPage } from "./ventas/recursos.js";

export async function admin(request, env, url, path){
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

export async function adminRoutes(request, env, url, path){
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
  if(path === "/admin/correo"){ return mailPage(env); }

  if(path === "/admin/mira/vincular"){
    return request.method === "POST" ? linkMiraByHand(request, env, url) : linkMiraPage(env, url);
  }
  if(path === "/admin/mira/desvincular" && request.method === "POST"){ return unlinkMira(request, env, url); }
  if(path === "/admin/embudo.csv"){ return funnelCsv(env); }
  if(path === "/admin/mira" || path === "/admin/contacto"){ return submissionsPage(env, url, path.slice(7)); }
  if(path === "/admin/autorizaciones"){ return authorizationsPage(env, url); }
  if(path === "/admin/testimonios"){ return testimonialsPage(env, url); }
  if(path === "/admin/propuestas"){ return proposalsPage(env, url); }
  if(path === "/admin/propuesta"){ return proposalPage(env, url); }

  /* the panel used to be one page with ?tipo=; old links land in the right section */
  const legacy = url.searchParams.get("tipo");
  if(path === "/admin" && SECTION_PATHS[legacy]){
    const q = new URLSearchParams(url.search); q.delete("tipo");
    return Response.redirect(url.origin + SECTION_PATHS[legacy] + (q.toString() ? "?" + q : ""), 303);
  }
  if(path !== "/admin"){ return Response.redirect(url.origin + "/admin", 303); }
  return dashboardPage(env);
}
