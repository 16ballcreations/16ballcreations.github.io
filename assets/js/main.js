(function(){
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var header = document.getElementById("siteHeader");

  /* The break: every visit draws one of the solid balls (1-8) and the page
     takes its colour. Re-rolling never repeats the ball already on the table. */
  var rollBall = document.getElementById("rollBall");
  var rollLabel = document.getElementById("rollLabel");
  var rollBtn = document.getElementById("rollBtn");
  var current = 0;

  function draw(){
    var n;
    do { n = 1 + Math.floor(Math.random() * 8); } while(n === current);
    return n;
  }
  function setBall(n, animate){
    current = n;
    root.setAttribute("data-ball", String(n));
    if(rollBall){
      rollBall.setAttribute("data-n", String(n));
      if(animate && !reduce){
        rollBall.classList.remove("is-rolling");
        void rollBall.offsetWidth; /* restart the animation */
        rollBall.classList.add("is-rolling");
      }
    }
    if(rollLabel){ rollLabel.textContent = "bola " + n; }
  }
  setBall(draw(), true);
  if(rollBtn){ rollBtn.addEventListener("click", function(){ setBall(draw(), true); }); }

  /* header background once the page moves */
  function onScroll(){ header.classList.toggle("is-stuck", window.pageYOffset > 20); }
  window.addEventListener("scroll", onScroll, { passive:true });
  onScroll();

  /* the rack follows the section that fills most of the screen */
  var rackLinks = [].slice.call(document.querySelectorAll(".rack a"));
  function syncRack(){
    var best = null, bestVisible = 0, top = header.offsetHeight, bottom = window.innerHeight;
    rackLinks.forEach(function(a){
      var sec = document.querySelector(a.getAttribute("href"));
      if(!sec){ return; }
      var r = sec.getBoundingClientRect();
      var visible = Math.min(r.bottom, bottom) - Math.max(r.top, top);
      if(visible > bestVisible){ bestVisible = visible; best = a; }
    });
    var hero = document.querySelector(".hero").getBoundingClientRect();
    if(Math.min(hero.bottom, bottom) - Math.max(hero.top, top) >= bestVisible){ best = null; }
    rackLinks.forEach(function(a){
      a.classList.toggle("is-active", a === best);
      if(a === best){ a.setAttribute("aria-current", "true"); } else { a.removeAttribute("aria-current"); }
    });
  }
  window.addEventListener("scroll", syncRack, { passive:true });
  window.addEventListener("resize", syncRack);
  syncRack();

  /* reveal on scroll */
  var items = document.querySelectorAll(".reveal");
  if(reduce || !("IntersectionObserver" in window)){
    items.forEach(function(el){ el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold:.12, rootMargin:"0px 0px -40px 0px" });
    items.forEach(function(el){ io.observe(el); });
  }
})();
