/* MIRA: Marca, Imagen, Redes y Alineación.
   Five shots and the 8 that closes. One question per screen; each one hands
   the page the colour of its ball. Answers are kept in this browser while
   the visitor fills them in, and at the end they are sorted into M·I·R·A and
   sent by e-mail (GitHub Pages has no server, so the visitor's mail app does
   the sending). */
(function(){
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var HEX = { 1:"#f4c20d",2:"#4d7dff",3:"#ff5c6e",4:"#a375d8",5:"#ff9d3d",6:"#3ad389",7:"#e0765f",8:"#e8e8e8" };
  var STORE = "mira-v1";
  var MAIL = "16ballcreations@gmail.com";

  function setAccent(n){ if(HEX[n]){ root.style.setProperty("--accent", HEX[n]); } }
  function $(s, r){ return (r || document).querySelector(s); }
  function $$(s, r){ return [].slice.call((r || document).querySelectorAll(s)); }

  /* ---------- screens ---------- */
  var screens = {};
  $$(".screen").forEach(function(s){ screens[s.getAttribute("data-screen")] = s; });
  function show(name){
    Object.keys(screens).forEach(function(k){ screens[k].classList.toggle("is-on", k === name); });
    window.scrollTo(0, 0);
  }

  /* ---------- the shots ---------- */
  var form = $("#quiz");
  var qs = $$(".q", form);
  var rail = $$(".rail-steps .ball");
  var back = $("#qBack");
  var next = $("#qNext");
  var msg = $("#qMsg");
  var at = 0;

  function goTo(i, dir, focus){
    at = Math.max(0, Math.min(qs.length - 1, i));
    qs.forEach(function(q, k){
      q.classList.toggle("is-on", k === at);
      q.classList.toggle("is-back", k === at && dir < 0);
    });
    rail.forEach(function(b, k){
      b.classList.toggle("is-current", k === at);
      b.classList.toggle("is-done", k < at);
    });
    setAccent(+qs[at].getAttribute("data-ball"));
    back.hidden = at === 0;
    next.innerHTML = at === qs.length - 1 ? 'Ver mi MIRA <span aria-hidden="true">&rarr;</span>' : 'Siguiente <span aria-hidden="true">&rarr;</span>';
    say("");
    if(focus){
      var first = qs[at].querySelector(".mfield");
      /* text shots take the cursor; chip shots leave the keyboard down on phones */
      if(first && !qs[at].querySelector(".chips-pick")){ first.focus({ preventScroll:true }); }
      else { var c = qs[at].querySelector("input"); if(c){ c.focus({ preventScroll:true }); } }
    }
    if(window.innerWidth < 720){ window.scrollTo(0, 0); }
  }
  function say(text, bad){
    msg.textContent = text;
    msg.classList.toggle("is-bad", !!bad);
  }

  /* ---------- reading the answers ---------- */
  function val(id){ var el = document.getElementById(id); return el ? el.value.trim() : ""; }
  function picked(name){
    var box = form.querySelector('.chips-pick[data-name="' + name + '"]');
    return box ? $$("input:checked", box).map(function(i){ return i.value; }) : [];
  }
  function answers(){
    return {
      marca: val("qName"), queHace: val("qWhat"), historia: val("qStory"),
      publico: picked("publico"), publicoDetalle: val("qWho"),
      objetivos: picked("objetivos"),
      tiene: picked("tiene"), enlaces: val("qLinks"),
      nombre: val("qPerson"), contacto: val("qReach")
    };
  }

  /* each shot asks only for what it needs, and says so kindly */
  function check(i){
    var a = answers();
    function bad(id, text){
      var el = document.getElementById(id);
      if(el){ el.classList.add("is-bad"); el.focus({ preventScroll:true }); }
      say(text, true);
      return false;
    }
    switch(i){
      case 0: return a.marca ? true : bad("qName", "Falta el nombre de tu marca, aunque sea provisional.");
      case 1: return a.historia.length >= 10 ? true : bad("qStory", "Cuéntanos un poco más; dos o tres líneas bastan.");
      case 2: if(a.publico.length || a.publicoDetalle){ return true; } say("Elige al menos una, o descríbelo con tus palabras.", true); return false;
      case 3: if(a.objetivos.length){ return true; } say("Elige al menos uno.", true); return false;
      case 4: if(a.tiene.length){ return true; } say("Marca lo que tienes, o “Nada todavía”.", true); return false;
      case 5:
        if(!a.nombre){ return bad("qPerson", "¿Cómo te llamas?"); }
        if(a.contacto.length < 6){ return bad("qReach", "Déjanos un correo o un WhatsApp para escribirte."); }
        return true;
    }
    return true;
  }

  form.addEventListener("submit", function(e){
    e.preventDefault();
    if(!check(at)){ return; }
    save();
    if(at < qs.length - 1){ goTo(at + 1, 1, true); }
    else { finish(); }
  });
  back.addEventListener("click", function(){ goTo(at - 1, -1, true); });
  $$(".mfield", form).forEach(function(f){
    f.addEventListener("input", function(){ f.classList.remove("is-bad"); say(""); save(); });
  });
  /* in the story, Enter makes a new line; Ctrl or Cmd + Enter moves on */
  $("#qStory").addEventListener("keydown", function(e){
    if(e.key === "Enter" && (e.ctrlKey || e.metaKey)){ e.preventDefault(); form.requestSubmit ? form.requestSubmit() : next.click(); }
  });

  /* starters drop a first line into the story */
  $$(".starter").forEach(function(b){
    b.addEventListener("click", function(){
      var t = $("#qStory");
      var line = b.textContent.replace(/…$/, " ");
      t.value = t.value.trim() ? t.value.replace(/\s*$/, "\n") + line : line;
      t.focus();
      t.setSelectionRange(t.value.length, t.value.length);
      t.classList.remove("is-bad"); say(""); save();
    });
  });

  /* chips: up to three goals; "Nada todavía" stands alone */
  $$(".chips-pick").forEach(function(box){
    var max = +box.getAttribute("data-max") || 0;
    var inputs = $$("input", box);
    function sync(){
      var n = inputs.filter(function(i){ return i.checked; }).length;
      if(max){
        inputs.forEach(function(i){ i.disabled = !i.checked && n >= max; });
        var c = $("#goalCount"); if(c){ c.textContent = n + " de " + max; }
      }
    }
    inputs.forEach(function(i){
      i.addEventListener("change", function(){
        if(i.checked && i.hasAttribute("data-alone")){ inputs.forEach(function(o){ if(o !== i){ o.checked = false; } }); }
        else if(i.checked){ inputs.forEach(function(o){ if(o.hasAttribute("data-alone")){ o.checked = false; } }); }
        sync(); say(""); save();
      });
    });
    box._sync = sync;
  });

  /* ---------- kept in this browser while filling in ---------- */
  function save(){
    try{ localStorage.setItem(STORE, JSON.stringify({ a: answers(), at: at })); }catch(e){}
  }
  function restore(){
    var data = null;
    try{ data = JSON.parse(localStorage.getItem(STORE) || "null"); }catch(e){}
    if(!data || !data.a){ return; }
    var a = data.a;
    [["qName","marca"],["qWhat","queHace"],["qStory","historia"],["qWho","publicoDetalle"],["qLinks","enlaces"],["qPerson","nombre"],["qReach","contacto"]].forEach(function(p){
      var el = document.getElementById(p[0]); if(el && a[p[1]]){ el.value = a[p[1]]; }
    });
    ["publico","objetivos","tiene"].forEach(function(name){
      var box = form.querySelector('.chips-pick[data-name="' + name + '"]');
      if(!box){ return; }
      $$("input", box).forEach(function(i){ i.checked = (a[name] || []).indexOf(i.value) !== -1; });
      if(box._sync){ box._sync(); }
    });
    at = Math.min(+data.at || 0, qs.length - 1);
    /* someone coming back finds where they left it */
    if(a.marca || a.historia){
      $$('[data-go="next"]').forEach(function(b){ b.innerHTML = 'Continuar mi MIRA <span aria-hidden="true">&rarr;</span>'; });
    }
  }

  /* ---------- the result, sorted into M·I·R·A ---------- */
  var IMAGEN = ["Logo", "Colores definidos"];
  var REDES = ["Redes sociales", "Página web", "Tienda en línea"];
  function split(list, keep){
    if(list.indexOf("Nada todavía") !== -1){ return "Empieza desde cero"; }
    var l = list.filter(function(x){ return keep.indexOf(x) !== -1; });
    return l.length ? l.join(", ") : "";
  }
  function sections(a){
    return [
      { letter:"M", title:"Marca", rows:[["Nombre", a.marca], ["Qué hace", a.queHace], ["Su historia", a.historia]] },
      { letter:"I", title:"Imagen", rows:[["Ya cuenta con", split(a.tiene, IMAGEN) || "Todavía sin logo ni colores definidos"]] },
      { letter:"R", title:"Redes", rows:[["Ya cuenta con", split(a.tiene, REDES) || "Todavía sin redes ni página"], ["Dónde encontrarla", a.enlaces]] },
      { letter:"A", title:"Alineación", rows:[["Le habla a", a.publico.concat(a.publicoDetalle ? [a.publicoDetalle] : []).join(", ")], ["Quiere que sientan", a.objetivos.join(", ")]] }
    ];
  }
  function el(tag, cls, text){ var n = document.createElement(tag); if(cls){ n.className = cls; } if(text != null){ n.textContent = text; } return n; }

  function finish(){
    var a = answers();
    var box = $("#result");
    box.innerHTML = "";
    sections(a).forEach(function(s){
      var card = el("article", "res glass");
      card.appendChild(el("span", "res-letter", s.letter));
      card.appendChild(el("h3", null, s.letter + " · " + s.title));
      s.rows.forEach(function(r){
        var p = el("p");
        p.appendChild(el("b", null, r[0]));
        if(r[1]){ p.appendChild(document.createTextNode(r[1])); }
        else { p.appendChild(el("span", "empty", "Sin respuesta")); }
        card.appendChild(p);
      });
      box.appendChild(card);
    });
    rail.forEach(function(b){ b.classList.add("is-done"); b.classList.remove("is-current"); });
    setAccent(6);
    show("done");
    $("#doneTitle").focus && $("#doneTitle").setAttribute("tabindex", "-1");
    $("#doneTitle").focus({ preventScroll:true });
  }

  function asText(a){
    var lines = ["MIRA de " + (a.marca || "mi marca"), ""];
    sections(a).forEach(function(s){
      lines.push(s.letter + " · " + s.title.toUpperCase());
      s.rows.forEach(function(r){ lines.push(r[0] + ": " + (r[1] || "—")); });
      lines.push("");
    });
    lines.push("CONTACTO");
    lines.push("Nombre: " + a.nombre);
    lines.push("Correo o WhatsApp: " + a.contacto);
    return lines.join("\n");
  }

  /* it posts to the Worker; if that fails, the visitor's mail app takes over */
  var API = /\.github\.io$/.test(location.hostname) ? "https://page.16ballcreations.workers.dev" : "";
  var sendBtn = $("#sendMira");
  sendBtn.addEventListener("click", function(){
    var a = answers();
    var done = $("#doneMsg");
    sendBtn.disabled = true;
    done.textContent = "Enviando…";
    fetch(API + "/api/mira", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ data:a, website:(form.querySelector(".hp") || {}).value || "" })
    }).then(function(r){
      if(!r.ok){ throw new Error("HTTP " + r.status); }
      sendBtn.innerHTML = "Enviada ✓";
      done.textContent = "¡Recibida, " + a.nombre + "! Con tu MIRA preparamos la propuesta y te escribimos con los siguientes pasos.";
      done.classList.add("is-ok");
      try{ localStorage.removeItem(STORE); }catch(e){}
    }).catch(function(){
      sendBtn.disabled = false;
      done.textContent = "Usamos tu correo para enviarla.";
      var subject = "Mi MIRA: " + (a.marca || "mi marca") + " (" + a.nombre + ")";
      window.location.href = "mailto:" + MAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(asText(a));
    });
  });
  $("#copyMira").addEventListener("click", function(){
    var text = asText(answers());
    var done = $("#doneMsg");
    function ok(){ done.textContent = "Copiado. Pégalo donde prefieras y envíalo a " + MAIL + "."; }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(ok, function(){ done.textContent = "No se pudo copiar; usa “Enviar mi MIRA”."; });
    }
  });
  $("#editMira").addEventListener("click", function(){ show("quiz"); goTo(0, -1, false); });

  /* ---------- start ---------- */
  $$('[data-go="next"]').forEach(function(b){
    b.addEventListener("click", function(){ show("quiz"); goTo(at, 1, true); });
  });
  restore();
  var params = new URLSearchParams(location.search);
  var pName = (params.get("nombre") || "").trim(), pBrand = (params.get("marca") || "").trim();
  if(pName && !val("qPerson")){ document.getElementById("qPerson").value = pName; }
  if(pBrand && !val("qName")){ document.getElementById("qName").value = pBrand; }
  if(pName){ $("#miraHello").textContent = "Hola, " + pName + " · antes de cada tiro se lee la mesa"; }
  if(reduce){ root.style.transition = "none"; }
})();
