/* MIRA: Marca, Imagen, Redes y Alineación.
   Five shots about the brand, the 6 about the project (four quick choices
   the panel turns into a traffic light) and the 8 that closes. One question per screen; each one hands
   the page the colour of its ball. Answers are kept in this browser while
   the visitor fills them in, and at the end they are sorted into M·I·R·A and
   sent to the Worker (or, if that fails, through the visitor's mail app).
   The English page (/en/mira/) runs the same script: <html lang="en"> picks
   the words, keeps its own draft, and marks the answers as English. */
(function(){
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var HEX = { 1:"#f4c20d",2:"#4d7dff",3:"#ff5c6e",4:"#a375d8",5:"#ff9d3d",6:"#3ad389",7:"#e0765f",8:"#e8e8e8" };
  var EN = root.lang === "en";
  function T(es, en){ return EN ? en : es; }
  /* each language keeps its own draft: the chips' values differ */
  var STORE = EN ? "mira-en-v1" : "mira-v1";
  /* the personal link and the channel, kept apart from the answers */
  var ref = {};
  try{ ref = JSON.parse(localStorage.getItem(STORE + ":ref") || "{}") || {}; }catch(e){}
  var MAIL = "hola@16ballcreations.com";

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
    next.innerHTML = (at === qs.length - 1 ? T("Ver mi MIRA", "See my MIRA") : T("Siguiente", "Next")) + ' <span aria-hidden="true">&rarr;</span>';
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
  var PROJECT = ["resolver", "inversion", "decide", "cuando"];
  function one(name){ return picked(name)[0] || ""; }
  /* the label the visitor saw for a choice, for the result and the e-mail */
  function chosen(name){
    var i = form.querySelector('.chips-pick[data-name="' + name + '"] input:checked');
    return i && i.nextElementSibling ? i.nextElementSibling.textContent : "";
  }
  function answers(){
    var a = {
      marca: val("qName"), queHace: val("qWhat"), historia: val("qStory"),
      publico: picked("publico"), publicoDetalle: val("qWho"),
      objetivos: picked("objetivos"),
      tiene: picked("tiene"), enlaces: val("qLinks"),
      proyecto: { resolver: one("resolver"), inversion: one("inversion"), decide: one("decide"), cuando: one("cuando") },
      nombre: val("qPerson"), contacto: val("qReach"),
      token: ref.token, origen: ref.origen
    };
    /* the panel shows it as English, so the reply goes out in English */
    if(EN){ a.idioma = "en"; }
    return a;
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
      case 0: return a.marca ? true : bad("qName", T("Falta el nombre de tu marca, aunque sea provisional.", "Your brand's name is missing, even a working one."));
      case 1: return a.historia.length >= 10 ? true : bad("qStory", T("Cuéntanos un poco más; dos o tres líneas bastan.", "Tell us a little more; two or three lines will do."));
      case 2: if(a.publico.length || a.publicoDetalle){ return true; } say(T("Elige al menos una, o descríbelo con tus palabras.", "Pick at least one, or describe them in your own words."), true); return false;
      case 3: if(a.objetivos.length){ return true; } say(T("Elige al menos uno.", "Pick at least one."), true); return false;
      case 4: if(a.tiene.length){ return true; } say(T("Marca lo que tienes, o “Nada todavía”.", "Check what you have, or “Nothing yet”."), true); return false;
      case 5:
        var missing = PROJECT.filter(function(k){ return !a.proyecto[k]; });
        if(!missing.length){ return true; }
        var first = form.querySelector('.chips-pick[data-name="' + missing[0] + '"] input');
        if(first){ first.focus({ preventScroll:true }); }
        say(T("Elige una opción en cada pregunta; todas tienen una que no te compromete.", "Pick one option in each question; each has one that doesn't commit you."), true);
        return false;
      case 6:
        if(!a.nombre){ return bad("qPerson", T("¿Cómo te llamas?", "What's your name?")); }
        if(a.contacto.length < 6){ return bad("qReach", T("Déjanos un correo o un WhatsApp para escribirte.", "Leave us an email or a WhatsApp number so we can write to you.")); }
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

  /* chips: up to three goals; "Nada todavía" stands alone. The project's
     groups are radios: one choice each, nothing to sync */
  $$(".chips-pick").forEach(function(box){
    var max = +box.getAttribute("data-max") || 0;
    var inputs = $$("input", box);
    function sync(){
      var n = inputs.filter(function(i){ return i.checked; }).length;
      if(max){
        inputs.forEach(function(i){ i.disabled = !i.checked && n >= max; });
        var c = $("#goalCount"); if(c){ c.textContent = n + T(" de ", " of ") + max; }
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
    PROJECT.forEach(function(name){
      var v = (a.proyecto || {})[name];
      $('.chips-pick[data-name="' + name + '"] input', form).forEach(function(i){ i.checked = !!v && i.value === v; });
    });
    at = Math.min(+data.at || 0, qs.length - 1);
    /* someone coming back finds where they left it */
    if(a.marca || a.historia){
      $$('[data-go="next"]').forEach(function(b){ b.innerHTML = T("Continuar mi MIRA", "Continue my MIRA") + ' <span aria-hidden="true">&rarr;</span>'; });
    }
  }

  /* ---------- the result, sorted into M·I·R·A ---------- */
  /* the chips' values, in both languages */
  var IMAGEN = ["Logo", "Colores definidos", "Defined colors"];
  var REDES = ["Redes sociales", "Página web", "Tienda en línea", "Social media", "Website", "Online store"];
  var NOTHING = ["Nada todavía", "Nothing yet"];
  function split(list, keep){
    if(list.some(function(x){ return NOTHING.indexOf(x) !== -1; })){ return T("Empieza desde cero", "Starting from scratch"); }
    var l = list.filter(function(x){ return keep.indexOf(x) !== -1; });
    return l.length ? l.join(", ") : "";
  }
  function sections(a){
    return [
      { letter:"M", title:T("Marca", "Brand"), rows:[[T("Nombre", "Name"), a.marca], [T("Qué hace", "What it does"), a.queHace], [T("Su historia", "Its story"), a.historia]] },
      { letter:"I", title:T("Imagen", "Image"), rows:[[T("Ya cuenta con", "Already has"), split(a.tiene, IMAGEN) || T("Todavía sin logo ni colores definidos", "No logo or defined colors yet")]] },
      { letter:"R", title:T("Redes", "Social media"), rows:[[T("Ya cuenta con", "Already has"), split(a.tiene, REDES) || T("Todavía sin redes ni página", "No social media or website yet")], [T("Dónde encontrarla", "Where to find it"), a.enlaces]] },
      { letter:"A", title:T("Alineación", "Alignment"), rows:[[T("Le habla a", "Speaks to"), a.publico.concat(a.publicoDetalle ? [a.publicoDetalle] : []).join(", ")], [T("Quiere que sientan", "Wants people to feel"), a.objetivos.join(", ")]] },
      { letter:"6", title:T("Tu proyecto", "Your project"), rows:[[T("Resolver primero", "Solve first"), chosen("resolver")], [T("Inversión", "Investment"), chosen("inversion")], [T("Decide", "Decides"), chosen("decide")], [T("Empezar", "Start"), chosen("cuando")]] }
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
        else { p.appendChild(el("span", "empty", T("Sin respuesta", "No answer"))); }
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
    var lines = [T("MIRA de ", "MIRA for ") + (a.marca || T("mi marca", "my brand")), ""];
    sections(a).forEach(function(s){
      lines.push(s.letter + " · " + s.title.toUpperCase());
      s.rows.forEach(function(r){ lines.push(r[0] + ": " + (r[1] || "—")); });
      lines.push("");
    });
    lines.push(T("CONTACTO", "CONTACT"));
    lines.push(T("Nombre: ", "Name: ") + a.nombre);
    lines.push(T("Correo o WhatsApp: ", "Email or WhatsApp: ") + a.contacto);
    return lines.join("\n");
  }

  /* it posts to the Worker; if that fails, the visitor's mail app takes over */
  var API = /\.github\.io$/.test(location.hostname) ? "https://16ballcreations.com" : "";
  var sendBtn = $("#sendMira");
  sendBtn.addEventListener("click", function(){
    var a = answers();
    var done = $("#doneMsg");
    sendBtn.disabled = true;
    done.textContent = T("Enviando…", "Sending…");
    fetch(API + "/api/mira", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ data:a, website:(form.querySelector(".hp") || {}).value || "" })
    }).then(function(r){
      if(!r.ok){ throw new Error("HTTP " + r.status); }
      sendBtn.innerHTML = T("Enviada ✓", "Sent ✓");
      done.textContent = T("¡Recibida, " + a.nombre + "! Te escribimos en menos de 24 horas para agendar la llamada.", "Got it, " + a.nombre + "! We'll write back within 24 hours to schedule the call.");
      done.classList.add("is-ok");
      try{ localStorage.removeItem(STORE); localStorage.removeItem(STORE + ":ref"); }catch(e){}
    }).catch(function(){
      sendBtn.disabled = false;
      done.textContent = T("Usamos tu correo para enviarla.", "We're opening your email app to send it.");
      var subject = T("Mi MIRA: ", "My MIRA: ") + (a.marca || T("mi marca", "my brand")) + " (" + a.nombre + ")";
      window.location.href = "mailto:" + MAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(asText(a));
    });
  });
  $("#copyMira").addEventListener("click", function(){
    var text = asText(answers());
    var done = $("#doneMsg");
    function ok(){ done.textContent = T("Copiado. Pégalo donde prefieras y envíalo a ", "Copied. Paste it wherever you like and send it to ") + MAIL + "."; }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(ok, function(){ done.textContent = T("No se pudo copiar; usa “Enviar mi MIRA”.", "Couldn't copy; use “Send my MIRA”."); });
    }
  });
  $("#editMira").addEventListener("click", function(){ show("quiz"); goTo(0, -1, false); });

  /* ---------- start ---------- */
  $$('[data-go="next"]').forEach(function(b){
    b.addEventListener("click", function(){ show("quiz"); goTo(at, 1, true); });
  });
  restore();
  var params = new URLSearchParams(location.search);
  /* where the visitor came from: the personal link's code (?t=) ties the
     MIRA to its prospect; ?o= is the channel. Both outlive a reload. */
  var t = (params.get("t") || "").trim().toLowerCase(), o = (params.get("o") || "").trim().toLowerCase();
  if(/^[a-z2-9]{6}$/.test(t)){ ref.token = t; }
  if(/^[a-z]{2,12}$/.test(o)){ ref.origen = o; }
  try{ localStorage.setItem(STORE + ":ref", JSON.stringify(ref)); }catch(e){}
  /* ?nombre= and ?marca= greet and fill in; the English page also takes ?name= and ?brand= */
  var pName = (params.get("nombre") || params.get("name") || "").trim(), pBrand = (params.get("marca") || params.get("brand") || "").trim();
  if(pName && !val("qPerson")){ document.getElementById("qPerson").value = pName; }
  if(pBrand && !val("qName")){ document.getElementById("qName").value = pBrand; }
  if(pName){ $("#miraHello").textContent = T("Hola, " + pName + " · antes de cada tiro se lee la mesa", "Hi, " + pName + " · before every shot, you read the table"); }
  if(reduce){ root.style.transition = "none"; }
})();
