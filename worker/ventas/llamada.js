/* Ventas · la llamada: agendada y después registrada. */

import { bogotaStamp, esc } from "../comun/util.js";

/* ---------- the call: scheduled, then recorded ---------- */

export const MEDIOS = { videollamada:"Videollamada", visita:"Visita", llamada:"Llamada" };
export const ATTENDED = { si:"Sí", no:"No se presentó", reprogramo:"Reprogramó" };
export const TEMPERATURE = { caliente:"Caliente", tibio:"Tibio", frio:"Frío" };
export const OUTCOME = { sigue:"Sigue a MIRA escrita", no_encaja:"No encaja", lo_piensa:"Lo piensa" };
export const PACKAGES = { 1:"Bola 1 · La Página", 3:"Bola 3 · Marca + Página", 5:"Bola 5 · La Tienda", 8:"Bola 8 · El Sistema" };

/* the latest call event with fields (scheduled or recorded); events come newest first */
export function lastCall(events){
  for(const e of events){
    if(e.tipo !== "reunion" || !e.data){ continue; }
    try{ return { e, data:JSON.parse(e.data) }; }catch(err){}
  }
  return null;
}
/* "2026-10-14T10:00" is already Bogotá time: shown as it is written */
export function callWhen(stamp){
  const d = new Date(String(stamp) + ":00Z");
  if(isNaN(d)){ return String(stamp || ""); }
  return d.toLocaleString("es-CO", { timeZone:"UTC", day:"numeric", month:"short", hour:"numeric", minute:"2-digit" });
}

export function callBlock(r, call){
  const opts = (map, chosen = "") => Object.entries(map).map(([k, l]) => `<option value="${k}"${k === chosen ? " selected" : ""}>${l}</option>`).join("");
  const schedule = (label, data = {}) => `
        <form class="pform" method="post" action="/admin/prospecto">
          <input type="hidden" name="id" value="${esc(r.id)}"><input type="hidden" name="accion" value="agendar">
          <div class="frow">
            <label>Fecha<input type="date" name="fecha" required value="${esc(String(data.fecha || "").slice(0, 10))}"></label>
            <label>Hora<input type="time" name="hora" required value="${esc(String(data.fecha || "").slice(11, 16))}"></label>
            <label>Medio<select name="medio">${opts(MEDIOS, data.medio || "videollamada")}</select></label>
          </div>
          <button type="submit" class="go">${label}</button>
        </form>`;
  const record = `
        <form class="pform" method="post" action="/admin/prospecto">
          <input type="hidden" name="id" value="${esc(r.id)}"><input type="hidden" name="accion" value="registrar">
          <div class="frow">
            <label>Asistió<select name="asistio">${opts(ATTENDED)}</select></label>
            <label>Duración (min)<input type="number" name="duracion" min="0" max="240" inputmode="numeric" placeholder="30"></label>
            <label>Temperatura<select name="temperatura"><option value="">—</option>${opts(TEMPERATURE)}</select></label>
          </div>
          <label>Meta, en sus palabras<input name="meta" maxlength="300"></label>
          <label>Dolor, en sus palabras<input name="dolor" maxlength="300"></label>
          <div class="frow">
            <label>Decide<input name="decide" maxlength="120" placeholder="Solo / con su socio…"></label>
            <label>Fecha clave<input name="fecha_clave" maxlength="120" placeholder="Ej.: abre en diciembre"></label>
          </div>
          <div class="frow">
            <label>Presupuesto<input name="presupuesto" maxlength="120" placeholder="Lo que mencionó, o vacío"></label>
            <label>Bola candidata<select name="paquete"><option value="">—</option>${opts(PACKAGES)}</select></label>
          </div>
          <label>Objeciones<input name="objeciones" maxlength="300"></label>
          <div class="frow">
            <label>Resultado<select name="resultado">${opts(OUTCOME)}</select></label>
            <label>Próximo paso<input name="proximo" maxlength="200" placeholder="Si lo piensa: qué quedó"></label>
            <label>Fecha<input type="date" name="proximo_fecha"></label>
          </div>
          <label>Aprendizaje (una línea)<input name="aprendizaje" maxlength="200"></label>
          <p class="mono hintline">Si no se presentó o reprogramó, basta con «Asistió»: queda para reagendar.</p>
          <button type="submit" class="go">Guardar el registro</button>
        </form>`;
  if(call && call.data.estado === "agendada"){
    const late = String(call.data.fecha) <= bogotaStamp(120);
    return `
        <p class="${late ? "due" : "okline"}">Agendada · ${esc(callWhen(call.data.fecha))} · ${esc(MEDIOS[call.data.medio] || call.data.medio || "")}${late ? " · ya pasó: falta registrarla" : ""}</p>
        <details${late ? " open" : ""}><summary>Registrar la llamada</summary>${record}</details>
        <details><summary>Cambiar la fecha</summary>${schedule("Guardar la nueva fecha", call.data)}</details>`;
  }
  const last = call ? `<p class="mono">Última: ${esc(String(call.e.texto).split("\n")[0])}</p>` : "";
  return `${last}${schedule("Agendar la llamada")}
        <details><summary>Registrar una llamada que no se agendó</summary>${record}</details>`;
}
