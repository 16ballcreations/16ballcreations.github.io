/* La API pública: CORS, respuestas JSON y limpieza de lo que llega. */

import { ALLOWED_ORIGINS, MAX_TEXT } from "./config.js";

/* ---------- the API ---------- */

export function corsHeaders(request, url){
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
export function preflight(request, url){
  return new Response(null, { status:204, headers:corsHeaders(request, url) });
}
export function json(body, status, request, url){
  return new Response(JSON.stringify(body), {
    status,
    headers:{ "Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store", ...corsHeaders(request, url) }
  });
}

/* every string is trimmed and capped; arrays and objects are walked */
export function clean(value, depth = 0){
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
