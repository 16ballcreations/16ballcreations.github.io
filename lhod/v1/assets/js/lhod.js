/* =============================================================
   La House of Demons — demo de propuesta
   Sin dependencias. Cada bloque comprueba que su marcado exista.
   ============================================================= */
(function () {
  "use strict";

  /* ---------- Menú en móvil ---------- */
  var toggle = document.querySelector(".nav__toggle");
  var links = document.getElementById("navLinks");
  if (toggle && links) {
    var sync = function () {
      var small = window.matchMedia("(max-width:900px)").matches;
      links.hidden = small;
      toggle.setAttribute("aria-expanded", "false");
    };
    sync();
    window.addEventListener("resize", sync);
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      links.hidden = open;
    });
  }

  /* ---------- ¿Abierto ahora? ----------
     Horario real del bar: jueves 16–24, viernes 16–02, sábado 14–02.
     Domingo a miércoles cerrado. Las franjas que cruzan medianoche
     se resuelven mirando también el día anterior.                  */
  var HORARIO = {
    0: null,                 // domingo
    1: null,                 // lunes
    2: null,                 // martes
    3: null,                 // miércoles
    4: { abre: 16, cierra: 24 },
    5: { abre: 16, cierra: 26 },   // 26 = 02:00 del día siguiente
    6: { abre: 14, cierra: 26 }
  };
  var DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

  function estadoAhora(ahora) {
    var d = ahora.getDay();
    var h = ahora.getHours() + ahora.getMinutes() / 60;
    var hoy = HORARIO[d];
    if (hoy && h >= hoy.abre && h < hoy.cierra) return { abierto: true, cierra: hoy.cierra };
    var ayer = HORARIO[(d + 6) % 7];
    if (ayer && ayer.cierra > 24 && h < ayer.cierra - 24) return { abierto: true, cierra: ayer.cierra };
    for (var i = 0; i < 7; i++) {
      var dd = (d + i) % 7;
      if (HORARIO[dd]) return { abierto: false, proximo: DIAS[dd], abre: HORARIO[dd].abre };
    }
    return { abierto: false };
  }

  function dosDigitos(n) { return (n < 10 ? "0" : "") + n; }

  var estado = document.querySelector("[data-estado]");
  if (estado) {
    var e = estadoAhora(new Date());
    var punto = estado.querySelector(".dot");
    if (e.abierto) {
      var cierre = e.cierra > 24 ? e.cierra - 24 : e.cierra;
      estado.querySelector("[data-estado-texto]").innerHTML =
        "<b>Abierto ahora</b> · cierra a las " + dosDigitos(cierre) + ":00";
    } else {
      if (punto) punto.classList.add("dot--off");
      estado.querySelector("[data-estado-texto]").innerHTML =
        "<b>Cerrado</b> · abre el " + e.proximo + " a las " + dosDigitos(e.abre) + ":00";
    }
  }

  /* ---------- Filtro de la agenda ---------- */
  var filtros = document.querySelector("[data-filtros]");
  if (filtros) {
    var eventos = Array.prototype.slice.call(document.querySelectorAll("[data-tipo]"));
    var vacio = document.querySelector("[data-agenda-vacia]");
    filtros.addEventListener("click", function (ev) {
      var btn = ev.target.closest("button[data-filtro]");
      if (!btn) return;
      var filtro = btn.dataset.filtro;
      filtros.querySelectorAll("button").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      var visibles = 0;
      eventos.forEach(function (el) {
        var ok = filtro === "todos" || el.dataset.tipo === filtro;
        el.hidden = !ok;
        if (ok) visibles++;
      });
      if (vacio) vacio.hidden = visibles > 0;
    });
  }

  /* ---------- Asistente de reserva ----------
     Demo: al final compone el mensaje que se enviaría por WhatsApp
     y lo muestra. No envía nada a ningún sitio.                    */
  var wizard = document.querySelector("[data-wizard]");
  if (!wizard) return;

  var pasos = Array.prototype.slice.call(wizard.querySelectorAll(".step"));
  var indicadores = Array.prototype.slice.call(wizard.querySelectorAll(".wizard__steps li"));
  var actual = 0;

  function pintarPaso() {
    pasos.forEach(function (p, i) { p.hidden = i !== actual; });
    indicadores.forEach(function (li, i) {
      li.classList.toggle("is-done", i < actual);
      if (i === actual) { li.setAttribute("aria-current", "step"); }
      else { li.removeAttribute("aria-current"); }
    });
    var foco = pasos[actual].querySelector("h2,h3,.step__title");
    if (foco) { foco.setAttribute("tabindex", "-1"); foco.focus({ preventScroll: true }); }
    wizard.scrollIntoView({ block: "nearest" });
  }

  function valorDe(nombre) {
    var campo = wizard.querySelector("[name='" + nombre + "']:checked, [name='" + nombre + "']:not([type=radio])");
    return campo ? campo.value.trim() : "";
  }

  function etiquetaDe(nombre) {
    var campo = wizard.querySelector("[name='" + nombre + "']:checked");
    if (campo) {
      var sp = campo.parentElement.querySelector("span");
      return sp ? sp.firstChild.textContent.trim() : campo.value;
    }
    return valorDe(nombre);
  }

  /* Solo jueves, viernes y sábado son seleccionables */
  var fecha = wizard.querySelector("[name='fecha']");
  var avisoFecha = wizard.querySelector("[data-aviso-fecha]");
  if (fecha) {
    var hoy = new Date();
    fecha.min = hoy.toISOString().slice(0, 10);
    fecha.addEventListener("change", function () {
      if (!fecha.value) return;
      var partes = fecha.value.split("-");
      var d = new Date(+partes[0], +partes[1] - 1, +partes[2]).getDay();
      var abierto = !!HORARIO[d];
      if (avisoFecha) {
        avisoFecha.textContent = abierto
          ? "Perfecto: ese " + DIAS[d] + " estamos abiertos."
          : "Ese día (" + DIAS[d] + ") el bar está cerrado. Abrimos jueves, viernes y sábado.";
        avisoFecha.className = abierto ? "field__hint" : "field__error";
      }
    });
  }

  function validarPaso(i) {
    var paso = pasos[i];
    var requeridos = Array.prototype.slice.call(paso.querySelectorAll("[data-requerido]"));
    var ok = true;
    requeridos.forEach(function (campo) {
      var lleno = campo.type === "radio"
        ? !!paso.querySelector("[name='" + campo.name + "']:checked")
        : campo.value.trim() !== "";
      if (!lleno) ok = false;
    });
    var error = paso.querySelector("[data-error-paso]");
    if (error) error.hidden = ok;
    return ok;
  }

  wizard.addEventListener("click", function (ev) {
    var siguiente = ev.target.closest("[data-siguiente]");
    var atras = ev.target.closest("[data-atras]");
    if (siguiente) {
      if (!validarPaso(actual)) return;
      if (actual < pasos.length - 1) { actual++; if (actual === pasos.length - 1) rellenarResumen(); pintarPaso(); }
    }
    if (atras && actual > 0) { actual--; pintarPaso(); }
  });

  function rellenarResumen() {
    var datos = {
      plan: etiquetaDe("plan"),
      fecha: valorDe("fecha"),
      hora: valorDe("hora"),
      personas: valorDe("personas"),
      nombre: valorDe("nombre"),
      whatsapp: valorDe("whatsapp"),
      nota: valorDe("nota")
    };
    Object.keys(datos).forEach(function (k) {
      var destino = wizard.querySelector("[data-resumen='" + k + "']");
      if (destino) destino.textContent = datos[k] || "—";
    });

    var mensaje =
      "Hola, quiero reservar en La House of Demons.\n" +
      "Plan: " + datos.plan + "\n" +
      "Fecha: " + datos.fecha + " a las " + datos.hora + "\n" +
      "Personas: " + datos.personas + "\n" +
      "Nombre: " + datos.nombre + "\n" +
      (datos.nota ? "Nota: " + datos.nota + "\n" : "") +
      "(Enviado desde la web)";

    var preview = wizard.querySelector("[data-mensaje]");
    if (preview) preview.textContent = mensaje;

    var enlace = wizard.querySelector("[data-wa]");
    if (enlace) enlace.dataset.href = "https://wa.me/573175122155?text=" + encodeURIComponent(mensaje);
  }

  /* En la demo el botón final no abre WhatsApp: solo lo explica. */
  var envio = wizard.querySelector("[data-wa]");
  if (envio) {
    envio.addEventListener("click", function (ev) {
      ev.preventDefault();
      var aviso = wizard.querySelector("[data-envio-aviso]");
      if (aviso) { aviso.hidden = false; aviso.setAttribute("tabindex", "-1"); aviso.focus({ preventScroll: true }); }
    });
  }

  pintarPaso();
})();
