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
/* ---------- rubros: the lists are found by what the business does ----------
   A campaign is one search (a zone, a month), so it mixes many kinds of
   business (Belén and Laureles have restaurants, barbers, vets and gyms
   together). Each prospect gets a rubro from its category; the dropdown lists
   rubro first, then the campaigns that have it (Renne, 16 nov 2026). */
export const RUBROS = {
  comida:"Restaurantes y comida", cafes:"Cafés, panaderías y heladerías", bares:"Bares, eventos y planes",
  belleza:"Belleza y barberías", salud:"Salud", mascotas:"Mascotas y veterinarias", deporte:"Gimnasios y academias",
  educacion:"Educación", moda:"Ropa, regalos y tiendas", servicios:"Ferreterías y servicios técnicos", mercados:"Mercados de barrio",
  talleres:"Talleres y motos", arquitectura:"Arquitectura e interiorismo", construccion:"Constructoras e inmobiliarias",
  ingenieria:"Ingeniería", abogados:"Abogados", otros:"Otros"
};
/* campaigns of a single rubro: everything in them is that rubro */
const CAMPAIGN_RUBRO = { talleres:"talleres", abogados:"abogados", ingenieria:"ingenieria", belleza:"belleza", cafes:"cafes" };
/* campaigns of the building trade: split between studios and builders, else their own */
const TRADE = { arquitectura:"arquitectura", construccion:"construccion" };
const RULES = [
  ["talleres", /taller|mecanic|\bmotos?\b|concesionario|automovil/],
  ["belleza", /barber|peluquer|\bhair\b|\bunas\b|\bnail|estetic|\bspa\b|pestan|eyelash|beauty|belleza|tattoo|tatuaj/],
  ["mascotas", /veterin|\bvet\b|\bpets?\b|mascota/],
  ["salud", /odonto|dental|fisiotera|psicolog|optic|pharmacy|drogueri|farmac|medic|clinica|salud/],
  ["cafes", /cafe|bakery|panader|pastr|bunuel|ice cream|helad|postre|dessert|waffle|brunch|cake/],
  ["comida", /restaur|comida|food|pizz|burger|hamburg|chicken|pollo|arepa|asad|parrilla|grill|bbq|steak|salchi|corrientazo|langos|chuzo/],
  ["bares", /\bbar\b|gastrobar|resto-?bar|evento|banquet|mirador|glamping|finca/],
  ["deporte", /\bgym\b|gimnas|crossfit|pilates|dance|baile|music|karate|deportiv|academ/],
  ["educacion", /jardin infantil|preescolar|colegio|educaci/],
  ["moda", /ropa|cloth|boutique|calzado|shoe|tailor|sastr|perfum|regalo|flor|relojer|bicicleta|papeler|librer|swimwear|\bsuit/],
  ["servicios", /hardware|ferreter|cerrajer|vidrier|tecnico|reparaci|computador|celular|electrodom|laundry|lavander|impresi|litograf|fotocop/],
  ["mercados", /granero|supermercado|fruver|alimentos|tienda de barrio/],
  ["construccion", /inmobiliari|constructora/],
  ["arquitectura", /arquitect|interior|paisaj|carpinter|remodel/],
  ["ingenieria", /ingenier|interventor|estructural/],
  ["construccion", /constru|obra/],
  ["abogados", /abogad|derecho|bufete|juridic/]
];
const plain = s => String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
const campaignKey = campaign => String(campaign).replace(/-\d{4}-\d{2}$/, "").split("-")[0];
export function rubroOf(categoria, campaign){
  const key = campaignKey(campaign);
  if(CAMPAIGN_RUBRO[key]){ return CAMPAIGN_RUBRO[key]; }
  const c = plain(categoria);
  if(TRADE[key]){
    if(/inmobiliari|constructora|obra/.test(c) && !/arquitect|interior/.test(c)){ return "construccion"; }
    if(/arquitect|interior|paisaj|carpinter|remodel|ilumina|mobiliar/.test(c)){ return "arquitectura"; }
    return TRADE[key];
  }
  for(const [r, re] of RULES){ if(re.test(c)){ return r; } }
  return "otros";
}
/* gives a rubro to the prospects that still have none (new loads, new ones by hand) */
export async function fillRubros(env){
  const { results } = await env.DB.prepare("SELECT id, campaign, categoria FROM prospects WHERE rubro IS NULL LIMIT 1000").all();
  if(!results.length){ return; }
  const st = env.DB.prepare("UPDATE prospects SET rubro = ?1 WHERE id = ?2");
  await env.DB.batch(results.map(r => st.bind(rubroOf(r.categoria, r.campaign), r.id)));
}
/* where a campaign was searched, said as a place (the old ids say the trade instead) */
const PLACES = { "cafes-medellin":"Medellín", "abogados-medellin":"Medellín", arquitectura:"Medellín", construccion:"Medellín y el área", ingenieria:"Medellín",
  talleres:"Medellín, el área y el Oriente", belleza:"Medellín", clientes:"Clientes", directos:"Contacto directo", entrantes:"Llegaron solos" };
export function campaignPlace(campaign){
  const p = campaignParts(campaign), m = String(campaign).match(/^(.*)-(\d{4})-(\d{2})$/);
  const place = (m && PLACES[m[1]]) || p.zone;
  return m ? `${place} · ${MONTHS[+m[3] - 1].slice(0, 3)} ${m[2]}` : place;
}
/* the dropdown of lists: rubro, then each campaign that has it; at the end, whole campaigns */
export function listPicker(lists, campaign, rubro, base){
  const by = new Map();
  for(const l of lists){
    const k = l.rubro || "otros";
    if(!by.has(k)){ by.set(k, []); }
    by.get(k).push(l);
  }
  const order = Object.keys(RUBROS).filter(k => by.has(k));
  const groups = order.map(k => {
    const items = by.get(k).sort((a, b) => b.campaign.localeCompare(a.campaign));
    const total = items.reduce((s, l) => s + l.n, 0);
    return `<optgroup label="${esc(RUBROS[k])} (${total})">${items.map(l => {
      const v = l.campaign + "|" + k;
      return `<option value="${esc(v)}"${l.campaign === campaign && k === rubro ? " selected" : ""}>${esc(campaignPlace(l.campaign))} (${l.n})</option>`;
    }).join("")}</optgroup>`;
  }).join("");
  const whole = new Map();
  for(const l of lists){ whole.set(l.campaign, (whole.get(l.campaign) || 0) + l.n); }
  const all = `<optgroup label="Campañas completas, todos los rubros">${[...whole].sort((a, b) => b[0].localeCompare(a[0])).map(([c, n]) =>
    `<option value="${esc(c)}|"${c === campaign && !rubro ? " selected" : ""}>${esc(campaignPlace(c))} (${n})</option>`).join("")}</optgroup>`;
  return `<form class="campaign" method="get" action="${base}"><label><span>Lista</span>
    <select name="l" onchange="this.form.submit()">${groups}${all}</select></label><noscript><button type="submit">Ver</button></noscript></form>`;
}
/* reads ?l=campaign|rubro (the dropdown) or ?c=&r= (links); unknown values fall back to the first list */
export function pickList(lists, params){
  let c = params.get("c") || "", r = params.get("r") || "";
  if(params.get("l")){ [c, r = ""] = params.get("l").split("|"); }
  if(lists.some(l => l.campaign === c) && (!r || lists.some(l => l.campaign === c && l.rubro === r))){ return { campaign:c, rubro:r }; }
  const first = Object.keys(RUBROS).map(k => lists.filter(l => l.rubro === k).sort((a, b) => b.campaign.localeCompare(a.campaign))[0]).find(Boolean) || lists[0];
  return { campaign:first.campaign, rubro:first.rubro || "" };
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
