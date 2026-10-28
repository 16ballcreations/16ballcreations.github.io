/* Ventas · el modelo: etapas, bolas (prioridades), canales y campañas. */

import { esc, list } from "../comun/util.js";

/* the stages a MIRA moves forward: it is the prospect's answer */
export const BEFORE_CALL = ["por_contactar", "contactado", "descartado", "respondio"];
/* the channel the link goes out by, as the MIRA's origin */
/* the ways we write to a prospect, for the "Escribir por" dropdowns */
export const CHANNELS = ["WhatsApp", "Instagram (DM)", "Facebook (Messenger)", "TikTok (DM)", "Correo", "Llamada", "Visita al local"];

/* the options of a channel dropdown; a value from an older campaign that isn't
   on the list stays as its own option, so saving never changes it silently */
export function channelOptions(current, blank = ""){
  const v = String(current || "");
  const list = v && !CHANNELS.includes(v) ? [v, ...CHANNELS] : CHANNELS;
  return (blank ? `<option value=""${v ? "" : " selected"}>${blank}</option>` : "") +
    list.map(c => `<option${c === v ? " selected" : ""}>${esc(c)}</option>`).join("");
}

export function originOfChannel(canal){
  const c = String(canal || "").toLowerCase();
  if(c.includes("instagram")){ return "ig"; }
  if(c.includes("whatsapp")){ return "whatsapp"; }
  if(c.includes("facebook")){ return "facebook"; }
  if(c.includes("visita")){ return "visita"; }
  if(c.includes("correo")){ return "correo"; }
  return "ig";
}

/* ---------- prospects ---------- */

export const STAGES = {
  por_contactar:"Por contactar", contactado:"Contactado", respondio:"Respondió", reunion:"Reunión",
  propuesta:"Propuesta", cliente:"Cliente", descartado:"Descartado"
};
export const EVENTS = { mensaje:"Mensaje enviado", respuesta:"Respuesta", visita:"Visita", reunion:"Reunión", nota:"Nota", etapa:"Cambio de etapa" };
export const NETWORK = {
  verificado:"Redes verificadas", probable:"Redes probables", no_confirmado:"Redes sin confirmar",
  sin_redes:"Sin redes", fuera_de_zona:"Fuera de la zona", requiere_sesion:"Requiere sesión"
};
/* The order to go after prospects, as pool balls: 1 first, 5 last, and the 8
   for the discarded (6 and 7 are skipped on purpose). The research ranks them
   A to D; D is wide, so it splits by score: 25 and up is the 4, below is the 5.
   Derived when shown, so reloading a campaign keeps working. A ball picked
   by hand in the panel (column bola) wins over the research. */
export const BALLS = {
  1:{ label:"Primero", sql:"prioridad = 'A'" },
  2:{ label:"Muy probable", sql:"prioridad = 'B'" },
  3:{ label:"Probable", sql:"prioridad = 'C'" },
  4:{ label:"Poco probable", sql:"prioridad = 'D' AND score >= 25" },
  5:{ label:"El menos probable", sql:"prioridad = 'D' AND (score < 25 OR score IS NULL)" },
  8:{ label:"Descartado", sql:"prioridad = 'Descartar'" }
};
export const OLD_PRIORITY = { A:"1", B:"2", C:"3", Descartar:"8" };
/* the same rule in SQL, for filtering and ordering */
export const BALL_SQL = "COALESCE(bola, CASE WHEN prioridad = 'A' THEN 1 WHEN prioridad = 'B' THEN 2 WHEN prioridad = 'C' THEN 3 " +
  "WHEN prioridad = 'D' AND score >= 25 THEN 4 WHEN prioridad = 'D' THEN 5 ELSE 8 END)";
export function ballOf(prioridad, score, bola){
  if(BALLS[bola]){ return +bola; }
  if(prioridad === "A"){ return 1; }
  if(prioridad === "B"){ return 2; }
  if(prioridad === "C"){ return 3; }
  if(prioridad === "D"){ return score >= 25 ? 4 : 5; }
  return 8;
}
export function stageTag(etapa){
  return `<span class="tag st-${esc(etapa)}">${esc(STAGES[etapa] || etapa)}</span>`;
}
export function ballTag(prioridad, score, withLabel = false, bola = null){
  const n = ballOf(prioridad, score, bola);
  return `<span class="pball" title="Bola ${n} · ${BALLS[n].label}"><i class="pb pb${n}"><b>${n}</b></i>${withLabel ? `<span>${BALLS[n].label}</span>` : ""}</span>`;
}

/* campaigns are "zone-yyyy-mm" (e.g. "laureles-2026-10"). They are many and
   growing, so they go in a dropdown grouped by month, newest first. */
export const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export function campaignParts(id){
  const m = String(id).match(/^(.*)-(\d{4})-(\d{2})$/);
  const words = (m ? m[1] : id).split("-").map(w => w ? w[0].toUpperCase() + w.slice(1) : w).join(" ");
  const zone = words.replace(/\bBelen\b/g, "Belén");
  if(!m){ return { zone, group:"Otras", order:"0000-00" }; }
  const month = MONTHS[+m[3] - 1] || m[3];
  return { zone, group:month[0].toUpperCase() + month.slice(1) + " " + m[2], order:m[2] + "-" + m[3] };
}
export function campaignPicker(campaigns, current, base){
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
