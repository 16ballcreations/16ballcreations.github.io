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

import { getAuthorization, signAuthorization } from "./autorizaciones.js";
import { json, preflight } from "./comun/api.js";
import { INBOX, MOVED_HOSTS, RETIRED, SITE } from "./comun/config.js";
import { dmarcXmls, saveDmarc } from "./correo.js";
import { receive } from "./mira.js";
import { admin } from "./panel.js";
import { receiveTestimonial } from "./testimonios.js";

export default {
  /* dmarc@16ballcreations.com is routed here by Cloudflare Email Routing:
     the daily DMARC reports are read and kept for /admin/correo. Anything
     that is not a report goes on to the studio's inbox, so nothing is lost. */
  async email(message, env){
    try{
      const raw = new Uint8Array(await new Response(message.raw).arrayBuffer());
      const xmls = await dmarcXmls(raw);
      let saved = 0;
      for(const xml of xmls){ saved += await saveDmarc(env, xml); }
      if(!xmls.length){ await message.forward(INBOX); }
      console.log(`dmarc: ${xmls.length} informe(s), ${saved} fila(s) nuevas, de ${message.from}`);
    }catch(e){
      console.log("dmarc: no se pudo leer", e && e.message);
      await message.forward(INBOX);
    }
  },

  async fetch(request, env){
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    /* plain http goes to https on the main domain in a single hop, www or not
       (with "Always Use HTTPS" on, Cloudflare does it first and it takes two:
       http://www → https://www → https://16ballcreations.com). Only our own
       hostnames, and only when Cloudflare's edge says the visit came over http
       (cf-visitor): wrangler dev rewrites localhost to http://16ballcreations.com */
    if(/"scheme":"http"/.test(request.headers.get("cf-visitor") || "") && (url.hostname === "16ballcreations.com" || MOVED_HOSTS.includes(url.hostname))){
      return Response.redirect(SITE + url.pathname + url.search, request.method === "GET" || request.method === "HEAD" ? 301 : 308);
    }
    if(MOVED_HOSTS.includes(url.hostname) && (request.method === "GET" || request.method === "HEAD") && !path.startsWith("/api/")){
      return Response.redirect(SITE + url.pathname + url.search, 301);
    }
    /* pages that no longer exist go, for good, to the closest one */
    if(RETIRED[path]){ return Response.redirect(url.origin + RETIRED[path], 301); }
    /* .../index.html is the same page as .../: the asset handling would send
       it there with a 307, and Google wants a permanent one */
    if(/\/index\.html$/.test(url.pathname) && (request.method === "GET" || request.method === "HEAD")){
      return Response.redirect(url.origin + url.pathname.slice(0, -"index.html".length) + url.search, 301);
    }

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
    /* plain-text files (llms.txt, the IndexNow key) say they are UTF-8, so the accents survive */
    if(path.endsWith(".txt")){
      const res = await env.ASSETS.fetch(request);
      if(!res.ok){ return res; }
      const out = new Response(res.body, res);
      out.headers.set("Content-Type", "text/plain; charset=utf-8");
      return out;
    }
    const res = await env.ASSETS.fetch(request);
    /* the asset handling adds the trailing slash (/servicios → /servicios/)
       with a 307; the page did move for good, so it goes as a 301 */
    if(res.status === 307 && (request.method === "GET" || request.method === "HEAD") && res.headers.get("Location")){
      return Response.redirect(new URL(res.headers.get("Location"), url).toString(), 301);
    }
    return res;
  }
};
