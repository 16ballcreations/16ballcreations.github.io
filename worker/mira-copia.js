/* La copia de la MIRA para quien la respondió: la manda Moody desde
   moody@ia.16ballcreations.com (Cloudflare Email Sending, binding EMAIL).
   Lleva lo que la persona contó de su marca (M·I·R·A) y nunca la parte de
   venta: ni el tiro 6 (qué resolver, presupuesto, cuándo) ni el semáforo. */

import { esc } from "./comun/util.js";

export const MOODY = { email:"moody@ia.16ballcreations.com", name:"Moody · 16 Ball Creations" };
const SITE_URL = "https://16ballcreations.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isEmail = s => EMAIL_RE.test(String(s || "").trim());

const IMAGEN = ["Logo", "Colores definidos", "Defined colors"];
const REDES = ["Redes sociales", "Página web", "Tienda en línea", "Social media", "Website", "Online store"];
const NOTHING = ["Nada todavía", "Nothing yet"];

/* the four parts, as the visitor saw them on the result screen */
export function copySections(d){
  const en = d.idioma === "en", T = (es, e) => en ? e : es;
  const tiene = Array.isArray(d.tiene) ? d.tiene : [];
  const split = keep => tiene.some(x => NOTHING.includes(x)) ? T("Empieza desde cero", "Starting from scratch")
    : tiene.filter(x => keep.includes(x)).join(", ");
  const arr = x => Array.isArray(x) ? x : [];
  return [
    { letter:"M", title:T("Marca", "Brand"), rows:[[T("Nombre", "Name"), d.marca], [T("Qué hace", "What it does"), d.queHace], [T("Su historia", "Its story"), d.historia]] },
    { letter:"I", title:T("Imagen", "Image"), rows:[[T("Ya cuenta con", "Already has"), split(IMAGEN) || T("Todavía sin logo ni colores definidos", "No logo or defined colors yet")]] },
    { letter:"R", title:T("Redes", "Social media"), rows:[[T("Ya cuenta con", "Already has"), split(REDES) || T("Todavía sin redes ni página", "No social media or website yet")], [T("Dónde encontrarla", "Where to find it"), d.enlaces]] },
    { letter:"A", title:T("Alineación", "Alignment"), rows:[[T("Le habla a", "Speaks to"), arr(d.publico).concat(d.publicoDetalle ? [d.publicoDetalle] : []).join(", ")], [T("Quiere que sientan", "Wants people to feel"), arr(d.objetivos).join(", ")], [T("Por qué le importa a su cliente", "Why its customers should care"), d.porQueImporta]] }
  ];
}

const FONT = "font-family:'trebuchet ms',sans-serif";
const SIGNATURE = `
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;${FONT};color:#141413;margin-top:28px">
  <tr>
    <td style="padding:0 14px 0 0;vertical-align:middle"><img src="${SITE_URL}/assets/img/moody/moody-ojo%402x.gif" width="96" height="96" alt="Moody" style="display:block;width:96px;height:96px"></td>
    <td style="vertical-align:middle;border-left:3px solid #F26B1D;padding:2px 0 2px 12px">
      <div style="font-size:16px;font-weight:bold;letter-spacing:.5px">Moody</div>
      <div style="font-size:12px;color:#5E5B55">Asistente de IA de Renne Castellanos</div>
      <div style="font-size:12px;margin-top:4px"><b><a href="${SITE_URL}/" style="color:#141413;text-decoration:none">16 Ball Creations</a></b> · Soluciones de marca y desarrollo web</div>
      <div style="font-size:11px;color:#B4470C;font-style:italic;margin-top:4px">Investigo, propongo y agendo. El café sigue siendo cosa de Renne.</div>
      <div style="font-size:11px;margin-top:4px"><a href="https://www.instagram.com/16ballcreations/" style="color:#141413">@16ballcreations</a> · <a href="http://wa.link/nww5qj" style="color:#141413">+57 310 49 49 979</a></div>
    </td>
  </tr>
</table>`;
const SIGNATURE_TEXT = `--
Moody
Asistente de IA de Renne Castellanos
16 Ball Creations · Soluciones de marca y desarrollo web
Investigo, propongo y agendo. El café sigue siendo cosa de Renne.
@16ballcreations · +57 310 49 49 979`;

export function copyMessage(d){
  const en = d.idioma === "en", T = (es, e) => en ? e : es;
  const first = String(d.nombre || "").trim().split(/\s+/)[0] || "";
  const brand = d.marca || T("tu marca", "your brand");
  const curious = d.intencion === "curiosidad";
  const intro = [
    T(`Hola, ${first}. Soy Moody, el asistente de inteligencia artificial de Renne Castellanos, de 16 Ball Creations.`,
      `Hi ${first}. I'm Moody, Renne Castellanos's AI assistant at 16 Ball Creations.`),
    T(`Aquí tienes lo que nos contaste de ${brand} en tu MIRA, para que lo tengas a mano. Leído así, de corrido, se nota todo lo que ya hay detrás de tu marca.`,
      `Here's what you told us about ${brand} in your MIRA, so you have it close. Read like this, all together, it shows how much is already behind your brand.`)
  ];
  const close = curious
    ? T("Guárdala. Cuando quieras volver a mirar tu marca con calma, aquí está, y si un día te provoca hablarlo, solo responde este correo.",
        "Keep it. Whenever you want to look at your brand again, it's here, and if one day you feel like talking it over, just reply to this email.")
    : T("Renne la lee con calma (analiza mucho; por eso diseña bien) y en menos de 24 horas te escribimos para agendar una llamada de 30 minutos. Yo me encargo de que la respuesta no tarde tanto como el análisis.",
        "Renne reads it carefully (lots of analysis; that's why the designs come out well) and we'll write back within 24 hours to schedule a 30-minute call. I make sure the reply doesn't take as long as the analysis.");
  const out = T("Si prefieres que no te escriba más, respóndeme «no» y no vuelvo a hacerlo.",
    "If you'd rather I didn't write again, reply “no” and I won't.");

  const sections = copySections(d);
  const empty = T("Sin respuesta", "No answer");
  const p = t => `<p style="margin:0 0 14px;font-size:15px;line-height:1.55">${esc(t)}</p>`;
  const block = s => `
  <div style="border:1px solid #E6E2DA;border-radius:10px;padding:16px 18px;margin:0 0 12px">
    <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#B4470C;font-weight:bold;margin-bottom:8px">${s.letter} · ${esc(s.title)}</div>
    ${s.rows.map(([k, v]) => `<p style="margin:0 0 8px;font-size:14px;line-height:1.5"><b style="color:#5E5B55;font-weight:normal">${esc(k)}:</b> ${v ? esc(v).replace(/\n/g, "<br>") : `<span style="color:#9A968E">${empty}</span>`}</p>`).join("")}
  </div>`;
  const html = `<!doctype html><html><body style="margin:0;padding:24px 16px;background:#ffffff">
<div style="max-width:560px;margin:0 auto;${FONT};color:#141413">
  ${intro.map(p).join("")}
  ${sections.map(block).join("")}
  <div style="margin-top:18px">${p(close)}${p(out)}</div>
  ${SIGNATURE}
</div></body></html>`;
  const text = [...intro, ""]
    .concat(sections.flatMap(s => [s.letter + " · " + s.title.toUpperCase(), ...s.rows.map(([k, v]) => k + ": " + (v || "—")), ""]))
    .concat([close, "", out, "", SIGNATURE_TEXT]).join("\n");
  return { subject:T(`Tu MIRA de ${brand}`, `Your MIRA for ${brand}`), html, text };
}

/* sends it; never throws, so a failed copy never loses the MIRA */
export async function sendCopy(env, d){
  if(!env.EMAIL || !isEmail(d.contacto)){ return false; }
  try{
    const m = copyMessage(d);
    await env.EMAIL.send({
      from:MOODY, to:{ email:String(d.contacto).trim(), name:d.nombre || "" }, replyTo:MOODY.email,
      subject:m.subject, html:m.html, text:m.text
    });
    return true;
  }catch(e){
    console.log("copia de MIRA no enviada:", e && (e.code || e.message));
    return false;
  }
}
