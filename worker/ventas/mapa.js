/* Ventas · el mapa de cada campaña. */

import { adminPage } from "../comun/pagina.js";
import { esc } from "../comun/util.js";
import { BALLS, STAGES, ballOf, campaignPicker } from "./modelo.js";

/* ---------- the map: every prospect of a campaign, as its ball ---------- */
export const GEO = { esquina:"En la esquina exacta", cuadra:"En su cuadra", cercana:"A una cuadra", barrio:"Aproximada, por barrio", manual:"Marcada a mano" };

export async function mapPage(env, url){
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

export const LEAFLET = `
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>`;

/* on a prospect's page: tap the map, or search, to put it where it is */
export const MINI_MAP_SCRIPT = `
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

export const MAP_SCRIPT = `
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
