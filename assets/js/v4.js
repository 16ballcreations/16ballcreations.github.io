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

  /* the 16 as a sketch: the idea of the brand before it exists. A pencil
     outline that doesn't quite close, a second pass that overshoots, hatched
     shading, guide lines, a scribbled number and a note in the margin. The
     lines "boil" (the turbulence changes seed a few times a second), the way
     hand-drawn animation does, and draw themselves in when the card arrives. */
  function sketch16(){
    var seed = 16;
    function rnd(){ seed = (seed * 9301 + 49297) % 233280; return seed / 233280 - .5; }
    var hatch = "";
    for(var k = -150; k <= 210; k += 7){
      /* 45° strokes, each a little off: start, end and slant */
      hatch += "M" + (40 + k + rnd() * 3).toFixed(1) + " " + (170 + rnd() * 4).toFixed(1) +
               "L" + (180 + k + rnd() * 5).toFixed(1) + " " + (25 + rnd() * 4).toFixed(1);
    }
    var note = EN ? "the missing one" : "la que falta";
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return '<svg class="sketch16" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">' +
      '<defs>' +
        '<filter id="rough16" x="-5%" y="-5%" width="110%" height="110%">' +
          '<feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="1" result="n">' +
            (reduceMotion ? "" : '<animate attributeName="seed" values="1;4;7;2" dur=".6s" calcMode="discrete" repeatCount="indefinite"/>') +
          '</feTurbulence>' +
          '<feDisplacementMap in="SourceGraphic" in2="n" scale="3.2"/>' +
        '</filter>' +
        /* the dark part of the 16: the ball above the band where the white begins */
        '<clipPath id="dark16"><path d="M58.9 157A95 95 0 1 1 241.1 157Z"/></clipPath>' +
      '</defs>' +
      '<g filter="url(#rough16)" fill="none" stroke-linecap="round" stroke-linejoin="round">' +
        /* construction: a guide circle and the centre, faint */
        '<circle class="s-guide" cx="154" cy="126" r="101" pathLength="1"/>' +
        '<path class="s-guide" d="M138 130H162M150 118V142M40 232H262" pathLength="1"/>' +
        /* hatching over the dark part, and the band where it ends */
        '<path class="s-hatch" clip-path="url(#dark16)" d="' + hatch + '" pathLength="1"/>' +
        '<path class="s-line" d="M60 158Q102 149 150 157T241 154" pathLength="1"/>' +
        /* the outline: one pass that leaves a gap, another that overshoots */
        '<path class="s-line s-main" d="M239.3 97.5A95 95 0 0 1 60.7 162.5A95 95 0 0 1 232.3 82.5" pathLength="1"/>' +
        '<path class="s-line s-soft" d="M243.5 148.8A97 97 0 0 1 52.5 115.2A97 97 0 1 1 241.7 157.1" pathLength="1"/>' +
        /* the number's circle, knocked out of the hatching, and the 16 */
        '<g transform="rotate(-14 180 98)">' +
          '<ellipse cx="180" cy="98" rx="31" ry="29" fill="#050606" stroke="none"/>' +
          '<path class="s-line" d="M210 96C211 79 196 68 180 69C162 70 149 83 150 99C151 116 166 128 182 127C199 126 212 113 209 92" pathLength="1"/>' +
          '<path class="s-ink" d="M163 88Q167 84 171 78L169 114M163 114H175" pathLength="1"/>' +
          '<path class="s-ink" d="M196 81Q182 84 181 100Q180 114 190 114Q199 113 198 103Q197 94 187 96Q182 98 181 104" pathLength="1"/>' +
        '</g>' +
        /* a glint, and the shadow scribbled under it */
        '<path class="s-line" d="M86 92Q96 70 120 58M98 104Q103 94 111 88" pathLength="1"/>' +
        '<path class="s-hatch" d="M88 240L102 233L112 241L126 232L138 242L152 232L164 242L178 232L190 241L203 234L214 240" pathLength="1"/>' +
        /* the note in the margin */
        '<path class="s-note" d="M318 74Q290 60 252 92M252 92L262 90M252 92L254 82" pathLength="1"/>' +
        '<text class="s-text" x="286" y="58">' + note + '</text>' +
      '</g>' +
    '</svg>';
  }

  /* the empty seat: a card the size of the wide ones, inviting the next project */
  function invite(){
    var li = el("li", "card tile card-wide card-invite");
    var media = el("a", "card-media invite-slot");
    media.href = EN ? "/en/mira/?o=web" : "/mira/?o=web";
    media.setAttribute("aria-label", EN ? "Start your free MIRA" : "Haz tu MIRA gratis");
    media.insertAdjacentHTML("beforeend", sketch16());
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
    /* the sketch draws itself the first time it comes on screen */
    if("IntersectionObserver" in window){
      var io = new IntersectionObserver(function(es){
        if(es[0].isIntersecting){ li.classList.add("is-drawn"); io.disconnect(); }
      }, { threshold:.35 });
      io.observe(li);
    } else { li.classList.add("is-drawn"); }
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
