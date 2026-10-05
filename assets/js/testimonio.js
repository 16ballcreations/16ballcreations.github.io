/* The testimonial: three questions about the person, and the 8 that closes
   (how they want to appear). Same mechanics as MIRA: one question per screen,
   each one hands the page its ball's colour, answers kept in this browser
   while filling in, and at the end a preview of the testimonial as it would
   read on the site. It posts to the Worker; if that fails, the visitor's
   mail app takes over. A personal link greets and fills in:
   /testimonio/?nombre=Ana&marca=Café%20La%20Esquina */
(function(){
  "use strict";

  var root = document.documentElement;
  var HEX = { 1:"#f4c20d",2:"#4d7dff",3:"#ff5c6e",4:"#a375d8",5:"#ff9d3d",6:"#3ad389",7:"#e0765f",8:"#e8e8e8" };
  var STORE = "testimonio-v1";
  var MAIL = "16ballcreations@gmail.com";
  var API = /\.github\.io$/.test(location.hostname) ? "https://page.16ballcreations.workers.dev" : "";
  var SAY = { 1:"No cumplió lo que esperaba", 2:"Le faltó algo", 3:"Cumplió", 4:"Me encantó", 5:"Superó lo que esperaba" };

  function setAccent(n){ if(HEX[n]){ root.style.setProperty("--accent", HEX[n]); } }
  function $(s, r){ return (r || document).querySelector(s); }
  function $$(s, r){ return [].slice.call((r || document).querySelectorAll(s)); }
  function el(tag, cls, text){ var n = document.createElement(tag); if(cls){ n.className = cls; } if(text != null){ n.textContent = text; } return n; }

  /* ---------- screens ---------- */
  var screens = {};
  $$(".screen").forEach(function(s){ screens[s.getAttribute("data-screen")] = s; });
  function show(name){
    Object.keys(screens).forEach(function(k){ screens[k].classList.toggle("is-on", k === name); });
    window.scrollTo(0, 0);
  }

  /* ---------- the questions ---------- */
  var form = $("#quiz"), qs = $$(".q", form), rail = $$(".rail-steps .ball");
  var back = $("#qBack"), next = $("#qNext"), msg = $("#qMsg");
  var at = 0;

  function say(text, bad){ msg.textContent = text; msg.classList.toggle("is-bad", !!bad); }
  function goTo(i, dir, focus){
    at = Math.max(0, Math.min(qs.length - 1, i));
    qs.forEach(function(q, k){ q.classList.toggle("is-on", k === at); q.classList.toggle("is-back", k === at && dir < 0); });
    rail.forEach(function(b, k){ b.classList.toggle("is-current", k === at); b.classList.toggle("is-done", k < at); });
    setAccent(+qs[at].getAttribute("data-ball"));
    back.hidden = at === 0;
    next.innerHTML = at === qs.length - 1 ? 'Ver mi testimonio <span aria-hidden="true">&rarr;</span>' : 'Siguiente <span aria-hidden="true">&rarr;</span>';
    say("");
    if(focus){
      var first = qs[at].querySelector(".mfield");
      if(first){ first.focus({ preventScroll:true }); }
      else { var c = qs[at].querySelector("input"); if(c){ c.focus({ preventScroll:true }); } }
    }
    if(window.innerWidth < 720){ window.scrollTo(0, 0); }
  }

  function val(id){ var e = document.getElementById(id); return e ? e.value.trim() : ""; }
  function radio(name){ var r = form.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ""; }
  function picked(name){
    var box = form.querySelector('.chips-pick[data-name="' + name + '"]');
    return box ? $$("input:checked", box).map(function(i){ return i.value; }) : [];
  }
  function answers(){
    return {
      impacto: val("tImpact"),
      sentimientos: picked("sentimientos"), sentirMas: val("tFeelMore"),
      satisfaccion: +radio("satisfaccion") || 0,
      nombre: val("tName"), marca: val("tBrand"), publicar: radio("publicar")
    };
  }

  function check(i){
    var a = answers();
    function bad(id, text){ var e = document.getElementById(id); if(e){ e.classList.add("is-bad"); e.focus({ preventScroll:true }); } say(text, true); return false; }
    switch(i){
      case 0: return a.impacto.length >= 10 ? true : bad("tImpact", "Cuéntanos un poco más; dos o tres líneas bastan.");
      case 1: if(a.sentimientos.length || a.sentirMas){ return true; } say("Elige al menos una, o escríbelo con tus palabras.", true); return false;
      case 2: if(a.satisfaccion){ return true; } say("Elige una bola.", true); return false;
      case 3:
        if(!a.nombre){ return bad("tName", "¿Cómo te llamas?"); }
        if(!a.publicar){ say("Elige cómo quieres aparecer, o que no se publique.", true); return false; }
        return true;
    }
    return true;
  }

  form.addEventListener("submit", function(e){
    e.preventDefault();
    if(!check(at)){ return; }
    save();
    if(at < qs.length - 1){ goTo(at + 1, 1, true); }
    else { preview(); }
  });
  back.addEventListener("click", function(){ goTo(at - 1, -1, true); });
  $$(".mfield", form).forEach(function(f){ f.addEventListener("input", function(){ f.classList.remove("is-bad"); say(""); save(); }); });
  $("#tImpact").addEventListener("keydown", function(e){
    if(e.key === "Enter" && (e.ctrlKey || e.metaKey)){ e.preventDefault(); form.requestSubmit ? form.requestSubmit() : next.click(); }
  });

  /* starters drop a first line into the answer */
  $$(".starter").forEach(function(b){
    b.addEventListener("click", function(){
      var t = $("#tImpact"), line = b.textContent.replace(/…$/, " ");
      t.value = t.value.trim() ? t.value.replace(/\s*$/, "\n") + line : line;
      t.focus(); t.setSelectionRange(t.value.length, t.value.length);
      t.classList.remove("is-bad"); say(""); save();
    });
  });

  /* feelings: up to three */
  $$(".chips-pick").forEach(function(box){
    var max = +box.getAttribute("data-max") || 0, inputs = $$("input", box);
    function sync(){
      var n = inputs.filter(function(i){ return i.checked; }).length;
      if(max){ inputs.forEach(function(i){ i.disabled = !i.checked && n >= max; }); var c = $("#feelCount"); if(c){ c.textContent = n + " de " + max; } }
    }
    inputs.forEach(function(i){ i.addEventListener("change", function(){ sync(); say(""); save(); }); });
    box._sync = sync;
  });

  /* satisfaction: the chosen ball and those before it light up; a phrase names it */
  var ratingLabels = $$(".rating label");
  function lightUp(){
    var n = +radio("satisfaccion") || 0;
    ratingLabels.forEach(function(l, k){ l.classList.toggle("is-lit", k < n); });
    $("#ratingSay").textContent = n ? SAY[n] : " ";
    /* the phrase wears the chosen ball, not the question's */
    $("#ratingSay").style.color = n ? HEX[n] : "";
  }
  $$('.rating input').forEach(function(i){ i.addEventListener("change", function(){ lightUp(); say(""); save(); }); });
  $$('.publish input').forEach(function(i){ i.addEventListener("change", function(){ say(""); save(); }); });

  /* ---------- kept in this browser while filling in ---------- */
  function save(){ try{ localStorage.setItem(STORE, JSON.stringify({ a: answers(), at: at })); }catch(e){} }
  function restore(){
    var data = null;
    try{ data = JSON.parse(localStorage.getItem(STORE) || "null"); }catch(e){}
    if(!data || !data.a){ return; }
    var a = data.a;
    [["tImpact","impacto"],["tFeelMore","sentirMas"],["tName","nombre"],["tBrand","marca"]].forEach(function(p){
      var e = document.getElementById(p[0]); if(e && a[p[1]]){ e.value = a[p[1]]; }
    });
    $$('.chips-pick[data-name="sentimientos"] input').forEach(function(i){ i.checked = (a.sentimientos || []).indexOf(i.value) !== -1; });
    var box = $('.chips-pick[data-name="sentimientos"]'); if(box && box._sync){ box._sync(); }
    $$('.rating input').forEach(function(i){ i.checked = +i.value === a.satisfaccion; });
    $$('.publish input').forEach(function(i){ i.checked = i.value === a.publicar; });
    lightUp();
    at = Math.min(+data.at || 0, qs.length - 1);
    if(a.impacto){ $$('[data-go="next"]').forEach(function(b){ b.innerHTML = 'Continuar <span aria-hidden="true">&rarr;</span>'; }); }
  }

  /* ---------- the preview ---------- */
  function initials(name){
    return name.split(/\s+/).filter(Boolean).map(function(w){ return w.charAt(0).toUpperCase() + "."; }).join(" ");
  }
  function preview(){
    var a = answers();
    var balls = $("#quoteBalls");
    balls.innerHTML = "";
    for(var n = 1; n <= 5; n++){
      var b = el("span", "ball" + (n > a.satisfaccion ? " off" : ""));
      b.setAttribute("data-n", String(n));
      balls.appendChild(b);
    }
    $("#quoteText").textContent = a.impacto;
    $("#quoteFeel").textContent = a.sentimientos.length ? "Se sintió: " + a.sentimientos.join(" · ").toLowerCase() : "";
    var who = $("#quoteWho");
    who.innerHTML = "";
    var shown = a.publicar === "iniciales" ? initials(a.nombre) : a.nombre;
    who.appendChild(document.createTextNode(shown));
    if(a.marca){ who.appendChild(el("span", null, a.marca)); }
    $("#quote").classList.toggle("is-private", a.publicar === "no");
    $("#quotePrivate").hidden = a.publicar !== "no";
    rail.forEach(function(b){ b.classList.add("is-done"); b.classList.remove("is-current"); });
    setAccent(6);
    show("done");
  }

  function asText(a){
    return [
      "Testimonio de " + a.nombre + (a.marca ? " (" + a.marca + ")" : ""), "",
      "Qué cambió: " + a.impacto,
      "Cómo se sintió: " + (a.sentimientos.join(", ") || "—") + (a.sentirMas ? ". " + a.sentirMas : ""),
      "Satisfacción: " + a.satisfaccion + " de 5 (" + SAY[a.satisfaccion] + ")",
      "Publicar: " + ({ nombre:"con nombre y marca", iniciales:"solo con iniciales", no:"no publicar" })[a.publicar]
    ].join("\n");
  }

  var sendBtn = $("#sendT");
  sendBtn.addEventListener("click", function(){
    var a = answers(), done = $("#doneMsg");
    sendBtn.disabled = true;
    done.textContent = "Enviando…";
    fetch(API + "/api/testimonio", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ data:a, website:(form.querySelector(".hp") || {}).value || "" })
    }).then(function(r){
      if(!r.ok){ throw new Error("HTTP " + r.status); }
      sendBtn.innerHTML = "Enviado ✓";
      done.textContent = "¡Gracias, " + a.nombre.split(" ")[0] + "! Fue un gusto jugar esta partida contigo.";
      done.classList.add("is-ok");
      $("#editT").hidden = true;
      try{ localStorage.removeItem(STORE); }catch(e){}
    }).catch(function(){
      sendBtn.disabled = false;
      done.textContent = "Usamos tu correo para enviarlo.";
      window.location.href = "mailto:" + MAIL + "?subject=" + encodeURIComponent("Mi testimonio (" + a.nombre + ")") + "&body=" + encodeURIComponent(asText(a));
    });
  });
  $("#editT").addEventListener("click", function(){ show("quiz"); goTo(0, -1, false); });

  /* ---------- start ---------- */
  $$('[data-go="next"]').forEach(function(b){ b.addEventListener("click", function(){ show("quiz"); goTo(at, 1, true); }); });
  restore();
  var params = new URLSearchParams(location.search);
  var pName = (params.get("nombre") || "").trim(), pBrand = (params.get("marca") || "").trim();
  if(pName && !val("tName")){ document.getElementById("tName").value = pName; }
  if(pBrand && !val("tBrand")){ document.getElementById("tBrand").value = pBrand; }
  if(pName){ $("#tHello").textContent = "Hola, " + pName + " · la partida terminó"; }
})();
