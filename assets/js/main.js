(function(){
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var header = document.getElementById("siteHeader");

  /* ---------- the break: one ball is drawn per visit ---------- */
  var rollBall = document.getElementById("rollBall");
  var rollLabel = document.getElementById("rollLabel");
  var rollBtn = document.getElementById("rollBtn");
  var current = 0;

  function draw(){
    var n;
    do { n = 1 + Math.floor(Math.random() * 8); } while(n === current);
    return n;
  }
  function setBall(n){
    current = n;
    root.setAttribute("data-ball", String(n));
    if(rollBall){ rollBall.setAttribute("data-n", String(n)); }
    if(rollLabel){ rollLabel.textContent = "bola " + n; }
  }
  setBall(draw());
  if(rollBtn){ rollBtn.addEventListener("click", function(){ setBall(draw()); }); }

  /* ---------- projects, rendered from assets/js/projects.js ---------- */
  var grid = document.getElementById("projects");
  var filterBar = document.getElementById("filters");
  var emptyNote = document.getElementById("projectsEmpty");
  var items = window.PROJECTS || [];

  function el(tag, cls, text){
    var node = document.createElement(tag);
    if(cls){ node.className = cls; }
    if(text != null){ node.textContent = text; }
    return node;
  }

  function card(p){
    var article = el("article", "project reveal");

    if(p.image){
      var shot = el("div", "project-shot");
      var img = el("img");
      img.src = p.image;
      img.alt = p.alt || p.title;
      img.loading = "lazy";
      img.width = 1200; img.height = 750;
      shot.appendChild(img);
      if(p.year){ shot.appendChild(el("span", "project-year", p.year)); }
      article.appendChild(shot);
    }

    var body = el("div", "project-body");
    body.appendChild(el("h3", null, p.title));
    if(p.summary){ body.appendChild(el("p", null, p.summary)); }

    if(p.tags && p.tags.length){
      var tags = el("ul", "tags");
      p.tags.forEach(function(t){ tags.appendChild(el("li", null, t)); });
      body.appendChild(tags);
    }

    var foot = el("div", "project-links");
    (p.links || []).forEach(function(link){
      var a = el("a", "btn btn-sm", link.label);
      a.href = link.url;
      /* only outside links open elsewhere; in-page anchors stay put */
      if(link.url.indexOf("#") !== 0){ a.rel = "noopener noreferrer"; }
      foot.appendChild(a);
    });
    if(p.note){ foot.appendChild(el("span", "project-note", p.note)); }
    body.appendChild(foot);

    article.appendChild(body);
    return article;
  }

  function render(filter){
    if(!grid){ return; }
    grid.innerHTML = "";
    var shown = items.filter(function(p){
      return filter === "Todos" || (p.types || []).indexOf(filter) !== -1;
    });
    shown.forEach(function(p){ grid.appendChild(card(p)); });
    if(emptyNote){ emptyNote.hidden = shown.length > 0; }
    watch(grid.querySelectorAll(".reveal"));
  }

  if(grid && items.length){
    var types = ["Todos"];
    items.forEach(function(p){
      (p.types || []).forEach(function(t){ if(types.indexOf(t) === -1){ types.push(t); } });
    });
    types.forEach(function(t, i){
      var btn = el("button", "filter" + (i === 0 ? " is-on" : ""), t);
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

  /* ---------- header hairline once the page moves ---------- */
  function onScroll(){ header.classList.toggle("is-stuck", window.pageYOffset > 8); }
  window.addEventListener("scroll", onScroll, { passive:true });
  onScroll();

  /* ---------- nav follows the section on screen ---------- */
  var navLinks = [].slice.call(document.querySelectorAll('.nav a[href^="#"]:not(.btn)'));
  function syncNav(){
    var top = header.offsetHeight, bottom = window.innerHeight, best = null, bestVisible = 0;
    navLinks.forEach(function(a){
      var sec = document.querySelector(a.getAttribute("href"));
      if(!sec){ return; }
      var r = sec.getBoundingClientRect();
      var visible = Math.min(r.bottom, bottom) - Math.max(r.top, top);
      if(visible > bestVisible){ bestVisible = visible; best = a; }
    });
    navLinks.forEach(function(a){ a.classList.toggle("is-active", a === best); });
  }
  window.addEventListener("scroll", syncNav, { passive:true });
  window.addEventListener("resize", syncNav);
  syncNav();

  /* ---------- reveal on scroll ---------- */
  var io = null;
  if(!reduce && "IntersectionObserver" in window){
    io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold:.1, rootMargin:"0px 0px -40px 0px" });
  }
  function watch(nodes){
    [].forEach.call(nodes, function(el){
      if(io){ io.observe(el); } else { el.classList.add("is-visible"); }
    });
  }
  watch(document.querySelectorAll(".reveal"));
})();
