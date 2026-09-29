(function(){
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var header = document.getElementById("siteHeader");
  var fine = window.matchMedia && window.matchMedia("(pointer: fine)").matches;

  /* ---------- the accent: whatever ball the visitor last struck ---------- */
  var HEX = { 1:"#f4c20d",2:"#4d7dff",3:"#ff5c6e",4:"#a375d8",5:"#ff9d3d",6:"#3ad389",7:"#e0765f",8:"#e8e8e8" };
  window.setAccent = function(n){
    if(HEX[n]){ root.style.setProperty("--accent", HEX[n]); root.setAttribute("data-ball", String(n)); }
  };

  function clamp01(v){ return v < 0 ? 0 : v > 1 ? 1 : v; }
  function el(tag, cls, text){
    var node = document.createElement(tag);
    if(cls){ node.className = cls; }
    if(text != null){ node.textContent = text; }
    return node;
  }

  /* ---------- manifesto: split into words, lit by scroll ---------- */
  var manifesto = document.getElementById("manifesto");
  var words = [];
  if(manifesto){
    var HOT = { "dieciséis":1, "inventamos.":1 };
    var parts = manifesto.textContent.trim().split(/\s+/);
    manifesto.textContent = "";
    parts.forEach(function(w, i){
      var s = el("span", "w" + (HOT[w] ? " hot" : ""), w);
      manifesto.appendChild(s);
      if(i < parts.length - 1){ manifesto.appendChild(document.createTextNode(" ")); }
      words.push(s);
    });
  }

  /* ---------- marquee: doubled for a seamless loop, pushed by the scroll ---------- */
  var track = document.getElementById("marqueeTrack");
  if(track){ track.innerHTML += track.innerHTML; }

  /* ---------- projects: an index, rendered from assets/js/projects.js ---------- */
  var list = document.getElementById("projects");
  var filterBar = document.getElementById("filters");
  var emptyNote = document.getElementById("projectsEmpty");
  var peek = document.getElementById("peek");
  var peekImg = document.getElementById("peekImg");
  var items = window.PROJECTS || [];

  function fix(url){ return url && url.indexOf("assets/") === 0 ? "../" + url : url; }

  function row(p, i){
    var li = el("li", "row");
    var id = "p" + i;
    var btn = el("button", "row-btn");
    btn.type = "button";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", id);
    btn.appendChild(el("span", "row-n", String(i + 1).padStart(2, "0")));
    btn.appendChild(el("span", "row-title", p.title));
    var meta = el("span", "row-meta");
    meta.appendChild(el("b", null, p.year || ""));
    meta.appendChild(el("span", null, (p.types || []).join(" · ")));
    btn.appendChild(meta);
    btn.appendChild(el("span", "row-plus"));
    li.appendChild(btn);

    var body = el("div", "row-body");
    body.id = id;
    var inner = el("div", "row-inner");
    var content = el("div", "row-content");
    var text = el("div");
    if(p.summary){ text.appendChild(el("p", null, p.summary)); }
    if(p.tags && p.tags.length){
      var tags = el("ul", "tags");
      p.tags.forEach(function(t){ tags.appendChild(el("li", null, t)); });
      text.appendChild(tags);
    }
    var links = el("div", "links");
    (p.links || []).forEach(function(link){
      var a = el("a", "btn btn-sm", link.label);
      a.href = link.url;
      if(link.url.indexOf("#") !== 0){ a.rel = "noopener noreferrer"; }
      links.appendChild(a);
    });
    if(p.note){ links.appendChild(el("span", "note mono", p.note)); }
    text.appendChild(links);
    content.appendChild(text);
    if(p.image){
      var img = el("img");
      img.src = fix(p.image);
      img.alt = p.alt || p.title;
      img.loading = "lazy";
      img.width = 1200; img.height = 750;
      content.appendChild(img);
    }
    inner.appendChild(content);
    body.appendChild(inner);
    body.inert = true;
    li.appendChild(body);

    btn.addEventListener("click", function(){
      var open = !li.classList.contains("is-open");
      [].forEach.call(list.querySelectorAll(".row.is-open"), function(o){
        if(o !== li){ setOpen(o, false); }
      });
      setOpen(li, open);
      hidePeek();
    });
    btn.addEventListener("mouseenter", function(){
      if(!fine || li.classList.contains("is-open") || !p.image){ return; }
      peekImg.src = fix(p.image);
      peek.classList.add("is-on");
    });
    btn.addEventListener("mouseleave", hidePeek);
    return li;
  }
  function setOpen(li, open){
    li.classList.toggle("is-open", open);
    li.querySelector(".row-btn").setAttribute("aria-expanded", open ? "true" : "false");
    li.querySelector(".row-body").inert = !open;
  }

  function render(filter){
    if(!list){ return; }
    list.innerHTML = "";
    var shown = items.filter(function(p){
      return filter === "Todos" || (p.types || []).indexOf(filter) !== -1;
    });
    shown.forEach(function(p, i){ list.appendChild(row(p, i)); });
    if(emptyNote){ emptyNote.hidden = shown.length > 0; }
  }

  if(list && items.length){
    var types = ["Todos"];
    items.forEach(function(p){
      (p.types || []).forEach(function(t){ if(types.indexOf(t) === -1){ types.push(t); } });
    });
    types.forEach(function(t, i){
      var count = t === "Todos" ? items.length : items.filter(function(p){ return (p.types || []).indexOf(t) !== -1; }).length;
      var btn = el("button", "filter" + (i === 0 ? " is-on" : ""), t);
      btn.appendChild(el("sup", null, String(count)));
      btn.type = "button";
      btn.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      btn.addEventListener("click", function(){
        filterBar.querySelectorAll(".filter").forEach(function(b){
          b.classList.toggle("is-on", b === btn);
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        render(t);
      });
      filterBar.appendChild(btn);
    });
    render("Todos");
  }

  /* the preview trails the cursor with a little lag, and leans into the motion */
  var mouse = { x: 0, y: 0 }, peekPos = { x: 0, y: 0 }, peekLoop = null;
  function hidePeek(){ if(peek){ peek.classList.remove("is-on"); } }
  if(peek && fine && !reduce){
    window.addEventListener("pointermove", function(e){
      mouse.x = e.clientX; mouse.y = e.clientY;
      if(!peekLoop){ peekLoop = requestAnimationFrame(movePeek); }
    }, { passive:true });
  }
  function movePeek(){
    peekLoop = null;
    var dx = mouse.x - peekPos.x;
    peekPos.x += dx * .16;
    peekPos.y += (mouse.y - peekPos.y) * .16;
    peek.style.left = peekPos.x + 40 + "px";
    peek.style.top = peekPos.y + "px";
    peek.style.setProperty("--tilt", Math.max(-10, Math.min(10, dx * .08)) + "deg");
    if(Math.abs(dx) > .5 || Math.abs(mouse.y - peekPos.y) > .5){ peekLoop = requestAnimationFrame(movePeek); }
  }

  /* ---------- services: a light that follows the cursor on each tile ---------- */
  [].forEach.call(document.querySelectorAll(".tile"), function(t){
    t.addEventListener("pointermove", function(e){
      var r = t.getBoundingClientRect();
      t.style.setProperty("--mx", (e.clientX - r.left) + "px");
      t.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* the test run types itself out once the tile is on screen */
  var term = document.querySelector(".term");
  if(term){
    term.innerHTML = term.innerHTML.split("\n").map(function(l){ return '<span class="ln">' + l + "</span>"; }).join("");
  }
  function runTerm(){
    [].forEach.call(term.querySelectorAll(".ln"), function(l, i){
      setTimeout(function(){ l.classList.add("on"); }, reduce ? 0 : 250 + i * 260);
    });
  }

  /* ---------- count-up numbers ---------- */
  function countUp(node){
    var target = parseFloat(node.getAttribute("data-count"));
    var dec = (node.getAttribute("data-count").split(".")[1] || "").length;
    if(reduce){ node.textContent = target.toFixed(dec); return; }
    var t0 = null, dur = 1400;
    function f(now){
      if(!t0){ t0 = now; }
      var p = clamp01((now - t0) / dur);
      var e = 1 - Math.pow(1 - p, 4);
      node.textContent = (target * e).toFixed(dec);
      if(p < 1){ requestAnimationFrame(f); }
    }
    node.textContent = (0).toFixed(dec);
    requestAnimationFrame(f);
  }

  /* ---------- reveal on scroll ---------- */
  var io = null;
  if("IntersectionObserver" in window){
    io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(!e.isIntersecting){ return; }
        var t = e.target;
        t.classList.add("is-visible");
        if(t.hasAttribute("data-count")){ countUp(t); }
        if(t === term){ runTerm(); }
        io.unobserve(t);
      });
    }, { threshold:.15, rootMargin:"0px 0px -40px 0px" });
  }
  [].forEach.call(document.querySelectorAll(".reveal, .modules, [data-count]"), function(n){
    if(io && !reduce){ io.observe(n); }
    else { n.classList.add("is-visible"); }
  });
  if(term){ if(io){ io.observe(term); } else { runTerm(); } }

  /* ---------- the menu, on narrow screens ---------- */
  var menuBtn = document.getElementById("menuBtn");
  var siteNav = document.getElementById("siteNav");
  var behind = [].slice.call(document.querySelectorAll("main, .site-footer"));
  function setMenu(open){
    root.classList.toggle("is-menu", open);
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuBtn.setAttribute("aria-label", open ? "Cerrar el menú" : "Abrir el menú");
    behind.forEach(function(n){ n.inert = open; });
    if(open){
      requestAnimationFrame(function(){
        var first = siteNav.querySelector("a");
        if(first){ first.focus(); }
      });
    }
  }
  if(menuBtn && siteNav){
    menuBtn.addEventListener("click", function(){ setMenu(!root.classList.contains("is-menu")); });
    siteNav.addEventListener("click", function(e){ if(e.target.closest("a")){ setMenu(false); } });
    document.addEventListener("keydown", function(e){
      if(e.key === "Escape" && root.classList.contains("is-menu")){ setMenu(false); menuBtn.focus(); }
    });
    window.addEventListener("resize", function(){
      if(window.innerWidth > 720 && root.classList.contains("is-menu")){ setMenu(false); }
    });
  }

  /* ---------- everything the scroll drives, in one frame ---------- */
  var progress = document.getElementById("progress");
  var navLinks = [].slice.call(document.querySelectorAll('.nav a[href^="#"]:not(.btn)'));
  var modSec = document.getElementById("modularity");
  var modWindow = document.getElementById("modWindow");
  var trackEl = document.getElementById("track");
  var railFill = document.getElementById("railFill");
  var railBall = document.getElementById("railBall");
  var steps = [].slice.call(document.querySelectorAll("#steps li"));
  var lastY = window.pageYOffset, velocity = 0, marqueeX = 0, lastT = 0, dir = 1;
  var ticking = false;

  function onScroll(){
    if(!ticking){ ticking = true; requestAnimationFrame(scrollFrame); }
  }

  function scrollFrame(){
    ticking = false;
    var y = window.pageYOffset, vh = window.innerHeight;
    var max = document.documentElement.scrollHeight - vh;

    if(progress){ progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")"; }
    header.classList.toggle("is-stuck", y > vh * .6);

    /* nav follows the section on screen */
    var top = header.offsetHeight, best = null, bestVisible = 0;
    navLinks.forEach(function(a){
      var sec = document.querySelector(a.getAttribute("href"));
      if(!sec){ return; }
      var r = sec.getBoundingClientRect();
      var v = Math.min(r.bottom, vh) - Math.max(r.top, top);
      if(v > bestVisible){ bestVisible = v; best = a; }
    });
    navLinks.forEach(function(a){ a.classList.toggle("is-active", a === best); });

    /* manifesto words light up as it passes */
    if(words.length){
      var mr = manifesto.getBoundingClientRect();
      var mp = reduce ? 1 : clamp01((vh * .82 - mr.top) / (mr.height + vh * .25));
      var lit = Math.round(mp * words.length);
      for(var i = 0; i < words.length; i++){ words[i].classList.toggle("on", i < lit); }
    }

    /* the dashboard tips up flat as it arrives */
    if(modSec && modWindow && !reduce){
      var wr = modWindow.parentNode.getBoundingClientRect();
      var wp = clamp01((vh - wr.top) / (vh * .75));
      var e = 1 - Math.pow(1 - wp, 3);
      modWindow.style.setProperty("--rx", (26 * (1 - e)).toFixed(2) + "deg");
      modWindow.style.setProperty("--sc", (.86 + .14 * e).toFixed(4));
    }

    /* the 16 rolls along the rail through the five shots */
    if(trackEl && railBall){
      var tr = trackEl.getBoundingClientRect();
      var vertical = window.innerWidth <= 1000;
      /* across: the run spans half a screen of scroll; down: the ball keeps
         pace with the reading line, a little past the middle of the screen */
      var tp = reduce ? 1 : vertical
        ? clamp01((vh * .6 - tr.top) / tr.height)
        : clamp01((vh * .85 - tr.top) / (vh * .55));
      var railLen = vertical ? tr.height : tr.width;
      var dist = tp * railLen;
      railFill.style.setProperty("--p", tp.toFixed(4));
      railBall.style.setProperty(vertical ? "--y" : "--x", dist.toFixed(1) + "px");
      railBall.style.setProperty(vertical ? "--x" : "--y", "0px");
      railBall.style.setProperty("--rot", (dist / 18 * 57.3).toFixed(1) + "deg");
      steps.forEach(function(li){
        var at = vertical ? li.offsetTop : li.offsetLeft;
        li.classList.toggle("on", dist >= at - 4);
      });
    }

    velocity = y - lastY;
    if(velocity !== 0){ dir = velocity > 0 ? 1 : -1; }
    lastY = y;
  }

  /* the marquee runs on its own clock; the scroll only lends it speed */
  function marqueeFrame(now){
    var dt = lastT ? Math.min((now - lastT) / 1000, .05) : 0;
    lastT = now;
    var boost = Math.min(Math.abs(velocity) * 6, 900);
    velocity *= .9;
    marqueeX -= (70 + boost) * dt * dir;
    var half = track.scrollWidth / 2;
    if(half > 0){
      if(marqueeX <= -half){ marqueeX += half; }
      if(marqueeX > 0){ marqueeX -= half; }
    }
    var skew = Math.max(-8, Math.min(8, boost / 60 * -dir));
    track.style.transform = "translate3d(" + marqueeX.toFixed(2) + "px,0,0) skewX(" + skew.toFixed(2) + "deg)";
    requestAnimationFrame(marqueeFrame);
  }
  if(track && !reduce){ requestAnimationFrame(marqueeFrame); }

  window.addEventListener("scroll", onScroll, { passive:true });
  window.addEventListener("resize", onScroll);
  scrollFrame();
})();
