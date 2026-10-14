/* v4: the work as numbered cards, filtered by service.
   Reads window.PROJECTS (assets/js/projects.js) and window.SERVICES
   (assets/js/servicios.js, written by scripts/servicios.mjs). The page's
   own language (<html lang>) picks the words: Spanish, or English under /en/. */
(function(){
  "use strict";

  var grid = document.getElementById("work");
  if(!grid){ return; }
  var bar = document.getElementById("workFilters");
  var countEl = document.getElementById("workCount");
  var navCount = document.getElementById("navWorkCount");

  var EN = document.documentElement.lang === "en";
  var SERVICES = (EN ? window.SERVICES_EN : window.SERVICES) || [];
  var SVC_DIR = EN ? "services/" : "servicios/";
  var STATUS = EN ? { "En línea":"Live", "Por estrenar":"Coming soon", "Continuo":"Ongoing", "En desarrollo":"In development" } : {};
  var SVC = {};
  SERVICES.forEach(function(s){ SVC[s.key] = s; });
  /* the English text of a project, falling back to the Spanish one */
  function tr(p){
    if(!EN || !p.en){ return p; }
    var o = {}; for(var k in p){ o[k] = p[k]; }
    for(var e in p.en){ o[e] = p.en[e]; }
    return o;
  }
  /* the page may live under a folder (/v4/), the images do not */
  function asset(p){ return /^(https?:)?\/|^#/.test(p) ? p : "/" + p; }

  var items = (window.PROJECTS || [])
    .filter(function(p){ return !p.archived && p.order; })
    .sort(function(a, b){ return a.order - b.order; })
    .map(tr);

  function el(tag, cls, text){
    var n = document.createElement(tag);
    if(cls){ n.className = cls; }
    if(text != null){ n.textContent = text; }
    return n;
  }

  function card(p, i){
    var li = el("li", "card tile");
    var first = (p.links || [])[0];
    var media = el(first ? "a" : "div", "card-media");
    if(first){
      media.href = first.url;
      if(first.url.charAt(0) !== "#"){ media.rel = "noopener noreferrer"; media.target = "_blank"; }
      media.setAttribute("aria-label", p.title + ": " + first.label);
    }
    var img = el("img");
    img.src = asset(p.image); img.alt = p.alt || p.title; img.loading = "lazy";
    img.width = 1200; img.height = 750;
    media.appendChild(img);
    media.appendChild(el("span", "card-n", String(i + 1).padStart(2, "0")));
    li.appendChild(media);

    var body = el("div", "card-body");
    body.appendChild(el("h3", null, p.title));
    if(p.short || p.summary){ body.appendChild(el("p", null, p.short || p.summary)); }

    var foot = el("div", "card-foot");
    var tags = el("ul", "svc-tags");
    (p.services || []).forEach(function(k){
      var s = SVC[k]; if(!s){ return; }
      var t = el("li"); var a = el("a", null, s.name);
      a.href = SVC_DIR + s.slug + "/";
      t.appendChild(a); tags.appendChild(t);
    });
    foot.appendChild(tags);
    var st = el("span", "status", (STATUS[p.status] || p.status) + (p.year ? " · " + p.year : ""));
    st.setAttribute("data-s", p.status || "");
    foot.appendChild(st);
    body.appendChild(foot);

    if((p.links || []).length){
      var links = el("div", "card-links");
      p.links.forEach(function(l){
        var a = el("a", "btn btn-sm", l.label);
        a.href = l.url;
        if(l.url.charAt(0) !== "#"){ a.rel = "noopener noreferrer"; a.target = "_blank"; }
        links.appendChild(a);
      });
      body.appendChild(links);
    } else if(p.note){
      body.appendChild(el("span", "note mono", p.note));
    }
    li.appendChild(body);
    return li;
  }

  /* the empty seat: a card the size of the wide ones, inviting the next project */
  function invite(){
    var li = el("li", "card tile card-wide card-invite");
    var media = el("a", "card-media invite-slot");
    media.href = EN ? "/en/mira/?o=web" : "/mira/?o=web";
    media.setAttribute("aria-label", EN ? "Start your free MIRA" : "Haz tu MIRA gratis");
    var ball = el("img");
    ball.src = "/assets/img/ball-16.png?v=2"; ball.alt = ""; ball.width = 340; ball.height = 341; ball.loading = "lazy";
    media.appendChild(ball);
    media.appendChild(el("span", "card-n", "16"));
    li.appendChild(media);
    var body = el("div", "card-body");
    body.appendChild(el("p", "invite-k mono", EN ? "Ball 16 is yours" : "La bola 16 es la tuya"));
    var h = el("h3"); h.appendChild(document.createTextNode(EN ? "Your project " : "Aquí podría estar ")); h.appendChild(el("em", null, EN ? "could be here" : "tu proyecto"));
    body.appendChild(h);
    body.appendChild(el("p", null, EN
      ? "Join the brands that tell a single story everywhere, with coherence and a touch of invention. It starts with your MIRA: five questions about your brand and a free 30-minute call."
      : "Súmate a las marcas que cuentan una sola historia en todas partes, con coherencia y con algo de invención. Empieza con tu MIRA: cinco preguntas sobre tu marca y una llamada de 30 minutos, gratis."));
    var links = el("div", "card-links");
    var a1 = el("a", "btn btn-sm btn-primary", EN ? "Start your free MIRA" : "Haz tu MIRA gratis");
    a1.href = media.href;
    var a2 = el("a", "btn btn-sm", EN ? "Write to us" : "Escríbenos");
    a2.href = "#contacto";
    links.appendChild(a1); links.appendChild(a2);
    body.appendChild(links);
    li.appendChild(body);
    return li;
  }

  function render(key){
    grid.innerHTML = "";
    var shown = items.filter(function(p){ return !key || (p.services || []).indexOf(key) !== -1; });
    var regular = shown.filter(function(p){ return !p.wide; });
    var wide = shown.filter(function(p){ return p.wide; });
    regular.forEach(function(p, i){
      var c = card(p, i);
      /* an odd one out at the end spans the row, so the grid never ends on a hole */
      if(regular.length % 2 && i === regular.length - 1){ c.classList.add("card-wide"); }
      grid.appendChild(c);
    });
    grid.appendChild(invite());
    wide.forEach(function(p, i){
      var c = card(p, regular.length + i);
      c.classList.add("card-wide");
      grid.appendChild(c);
    });
    if(countEl){ countEl.textContent = "(" + shown.length + ")"; }
  }

  if(navCount){ navCount.textContent = String(items.length); }

  /* the filters: every service that has at least one project, with its count */
  if(bar){
    var keys = [""];
    SERVICES.forEach(function(s){
      if(items.some(function(p){ return (p.services || []).indexOf(s.key) !== -1; })){ keys.push(s.key); }
    });
    keys.forEach(function(k, i){
      var n = k ? items.filter(function(p){ return (p.services || []).indexOf(k) !== -1; }).length : items.length;
      var b = el("button", "filter" + (i === 0 ? " is-on" : ""), k ? SVC[k].name : (EN ? "All" : "Todos"));
      b.type = "button";
      b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      b.appendChild(el("sup", null, String(n)));
      b.addEventListener("click", function(){
        [].forEach.call(bar.querySelectorAll(".filter"), function(o){
          o.classList.toggle("is-on", o === b);
          o.setAttribute("aria-pressed", o === b ? "true" : "false");
        });
        render(k);
      });
      bar.appendChild(b);
    });
  }
  render("");
})();
