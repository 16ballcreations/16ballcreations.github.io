/* The orb: the 16 as a sphere of particles, alone behind the whole page.
   A few thousand points on a sphere read as the ball: white caps, the stripe
   in faint points of the struck ball's colour, and a ring on each side with
   "16" written in particles inside it. It turns slowly, leans toward the
   pointer, and travels as the page scrolls: big behind the table, beside the
   manifesto, dim behind the index, blurred behind the glass, and front and
   centre next to the closing question.

   Plain 2D canvas, no library. Points are batched by colour and brightness,
   so a frame is a couple of dozen fills, not thousands. */
(function(){
  "use strict";

  var canvas = document.getElementById("orb");
  if(!canvas || !canvas.getContext){ return; }
  var ctx = canvas.getContext("2d");
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var CAP = 0, BAND = 1, MARK = 2, DUST = 3;
  var LEVELS = 6;

  var W = 0, H = 0, dpr = 1, narrow = false;
  var points = [];          /* flat: x, y, z, type */
  var count = 0;

  /* ---------- the ball, as points ---------- */
  function build(){
    var list = [];
    var n = narrow ? 1500 : 2800;
    var golden = Math.PI * (3 - Math.sqrt(5));
    var DISK = .885;        /* same number disk as the balls on the table */

    for(var i = 0; i < n; i++){
      var y = 1 - 2 * (i + .5) / n;
      var r = Math.sqrt(1 - y * y);
      var phi = i * golden;
      var x = Math.cos(phi) * r, z = Math.sin(phi) * r;
      if(Math.abs(z) > DISK){ continue; }             /* the disks stay dark, the number lights them */
      if(Math.abs(y) < .52){
        if(Math.random() < .55){ list.push(x, y, z, BAND); }
      } else {
        list.push(x, y, z, CAP);
      }
    }

    /* a ring round each number disk */
    var ringR = Math.sqrt(1 - DISK * DISK);
    for(var side = -1; side <= 1; side += 2){
      for(var k = 0; k < 110; k++){
        var a = k / 110 * Math.PI * 2;
        list.push(Math.cos(a) * ringR, Math.sin(a) * ringR, side * DISK, MARK);
      }
    }

    /* the digits: "16" set in Inter on a scratch canvas, read back as points */
    var S = 120, step = narrow ? 3.4 : 2.6;
    var mask = document.createElement("canvas");
    mask.width = S; mask.height = S;
    var m = mask.getContext("2d");
    m.fillStyle = "#fff";
    m.textAlign = "center";
    m.textBaseline = "middle";
    m.font = "600 74px Inter, system-ui, sans-serif";
    m.fillText("16", S / 2, S / 2 + 4);
    var data = m.getImageData(0, 0, S, S).data;
    var scale = ringR * .86;
    for(var py = 0; py < S; py += step){
      for(var px = 0; px < S; px += step){
        if(data[((py | 0) * S + (px | 0)) * 4 + 3] < 128){ continue; }
        var u = (px - S / 2) / (S / 2), v = (py - S / 2) / (S / 2);
        var lx = u * scale, ly = -v * scale;
        var lz = Math.sqrt(Math.max(0, 1 - lx * lx - ly * ly));
        list.push(lx, ly, lz, MARK);
        list.push(-lx, ly, -lz, MARK);                /* the far disk; seen through the sphere it reads mirrored, so it stays faint */
      }
    }

    /* a little dust in orbit, the way the Auros sphere sheds points */
    var dust = narrow ? 70 : 160;
    for(var d = 0; d < dust; d++){
      var t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
      var rr = 1.08 + Math.random() * .45;
      list.push(Math.sin(p) * Math.cos(t) * rr, Math.cos(p) * rr, Math.sin(p) * Math.sin(t) * rr, DUST);
    }

    points = new Float32Array(list);
    count = list.length / 4;
  }

  /* ---------- where the orb sits, section by section ---------- */
  /* x, y: centre as a fraction of the viewport; r: radius as a fraction of
     the shorter side; a: brightness */
  var WIDE = {
    "hero":       { x:.70, y:.46, r:.44, a:.85 },
    "manifiesto": { x:.80, y:.52, r:.36, a:1 },
    "proyectos":  { x:.94, y:.55, r:.50, a:.3 },
    "modularity": { x:.50, y:.50, r:.66, a:.28 },
    "servicios":  { x:.56, y:.60, r:.42, a:.95 },
    "por-que":    { x:.10, y:.52, r:.30, a:.4 },
    "proceso":    { x:.88, y:.30, r:.26, a:.7 },
    "estudio":    { x:.50, y:.55, r:.58, a:.22 },
    "contacto":   { x:.80, y:.40, r:.40, a:1 }
  };
  var NARROW = {
    "hero":       { x:.50, y:.30, r:.46, a:.75 },
    "manifiesto": { x:.72, y:.30, r:.40, a:.55 },
    "proyectos":  { x:.95, y:.50, r:.55, a:.22 },
    "modularity": { x:.50, y:.45, r:.70, a:.2 },
    "servicios":  { x:.50, y:.50, r:.50, a:.7 },
    "por-que":    { x:.10, y:.50, r:.40, a:.3 },
    "proceso":    { x:.90, y:.25, r:.34, a:.45 },
    "estudio":    { x:.50, y:.55, r:.60, a:.18 },
    "contacto":   { x:.76, y:.20, r:.34, a:.9 }
  };
  var anchors = [];
  function measure(){
    var table = narrow ? NARROW : WIDE;
    anchors = [];
    Object.keys(table).forEach(function(id){
      var el = document.getElementById(id);
      if(!el){ return; }
      var r = el.getBoundingClientRect();
      /* the scroll position at which this section is centred on screen */
      var at = Math.max(0, r.top + window.pageYOffset + Math.min(r.height, H) / 2 - H / 2);
      anchors.push({ at: at, s: table[id] });
    });
    anchors.sort(function(a, b){ return a.at - b.at; });
  }
  function target(){
    var y = window.pageYOffset;
    if(!anchors.length){ return { x:.7, y:.5, r:.4, a:.5 }; }
    if(y <= anchors[0].at){ return anchors[0].s; }
    for(var i = 0; i < anchors.length - 1; i++){
      var A = anchors[i], B = anchors[i + 1];
      if(y < B.at){
        var t = (y - A.at) / Math.max(1, B.at - A.at);
        t = t * t * (3 - 2 * t);
        return {
          x: A.s.x + (B.s.x - A.s.x) * t, y: A.s.y + (B.s.y - A.s.y) * t,
          r: A.s.r + (B.s.r - A.s.r) * t, a: A.s.a + (B.s.a - A.s.a) * t
        };
      }
    }
    return anchors[anchors.length - 1].s;
  }

  /* ---------- colour, read from the page as the accent moves ---------- */
  var accent = [58, 211, 137];
  function readAccent(){
    var v = getComputedStyle(root).getPropertyValue("--accent").trim();
    var m = v.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
    if(m){ accent = [+m[1], +m[2], +m[3]]; return; }
    m = v.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if(m){ accent = [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)]; }
  }

  /* ---------- the pointer tilts it, the scroll spins it, a pulse swells it ---------- */
  var tiltX = 0, tiltY = 0, aimX = 0, aimY = 0;
  window.addEventListener("pointermove", function(e){
    aimX = (e.clientY / (H || 1) - .5) * .5;
    aimY = (e.clientX / (W || 1) - .5) * .6;
  }, { passive:true });

  var lastScroll = window.pageYOffset, scrollSpin = 0;
  var pulse = 0, shed = 0;
  /* the table calls this when the 16 forms and when it is struck */
  window.orbPulse = function(){ pulse = 1; };

  /* The table builds its 16 out of the orb: it asks for points where they
     are on screen right now, and the orb dims for a moment, as if it had
     given them away. Front-facing points first, so the sparks visibly
     peel off the near side of the sphere. */
  var view = null;
  window.orbSample = function(n){
    if(!view || !count){ return []; }
    var out = [], tries = 0;
    while(out.length < n && tries < n * 6){
      tries++;
      var i = (Math.random() * count) | 0, o = i * 4;
      if(points[o + 3] === DUST){ continue; }
      var p = project(points[o], points[o + 1], points[o + 2]);
      if(p.z < -.2 && Math.random() < .8){ continue; }
      out.push({
        x: p.x, y: p.y,
        color: points[o + 3] === BAND ? "rgb(" + accent.join(",") + ")" : "#f6f3ea"
      });
    }
    shed = 1;
    return out;
  };
  function project(x, y, z){
    var v = view;
    var x1 = x * v.cy + z * v.syn, z1 = -x * v.syn + z * v.cy;
    var y2 = y * v.cx - z1 * v.sx, z2 = y * v.sx + z1 * v.cx;
    var x3 = x1 * v.cz - y2 * v.sz, y3 = x1 * v.sz + y2 * v.cz;
    var persp = 3.2 / (3.2 - z2);
    return { x: v.ox + x3 * v.R * persp, y: v.oy - y3 * v.R * persp, z: z2 };
  }

  /* ---------- drawing ---------- */
  var cur = null;
  var spin = 0;
  var buckets = [];
  for(var b = 0; b < LEVELS * 2; b++){ buckets.push([]); }

  function frame(dt){
    var tg = target();
    if(!cur){ cur = { x:tg.x, y:tg.y, r:tg.r, a:tg.a }; }
    var k = Math.min(1, dt * 3.2);
    cur.x += (tg.x - cur.x) * k; cur.y += (tg.y - cur.y) * k;
    cur.r += (tg.r - cur.r) * k; cur.a += (tg.a - cur.a) * k;

    var sy = window.pageYOffset;
    scrollSpin += (sy - lastScroll) * .0016;
    lastScroll = sy;
    var extra = scrollSpin * Math.min(1, dt * 5);
    scrollSpin -= extra;

    spin += dt * .16 + extra;
    tiltX += (aimX - tiltX) * Math.min(1, dt * 2);
    tiltY += (aimY - tiltY) * Math.min(1, dt * 2);
    pulse = Math.max(0, pulse - dt * .8);
    shed = Math.max(0, shed - dt * .5);

    /* rotation: spin about the vertical, then a fixed lean plus the pointer */
    var ay = spin + tiltY, ax = .32 + tiltX, az = .08;
    var cy = Math.cos(ay), syn = Math.sin(ay);
    var cx = Math.cos(ax), sx = Math.sin(ax);
    var cz = Math.cos(az), sz = Math.sin(az);

    var minSide = Math.min(W, H);
    var R = cur.r * minSide * (1 + pulse * .08 * Math.sin(pulse * Math.PI));
    var ox = cur.x * W, oy = cur.y * H;
    var alpha = Math.min(1, cur.a * (1 - shed * .55) + pulse * .5);
    view = { cy:cy, syn:syn, cx:cx, sx:sx, cz:cz, sz:sz, R:R, ox:ox, oy:oy };

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if(alpha <= .01){ return; }

    for(var q = 0; q < buckets.length; q++){ buckets[q].length = 0; }
    var base = (narrow ? 1.3 : 1.5) * dpr;

    for(var i = 0; i < count; i++){
      var o = i * 4;
      var x = points[o], y = points[o + 1], z = points[o + 2], type = points[o + 3];
      /* rotate about y */
      var x1 = x * cy + z * syn, z1 = -x * syn + z * cy;
      /* about x */
      var y2 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
      /* about z */
      var x3 = x1 * cz - y2 * sz, y3 = x1 * sz + y2 * cz;

      var persp = 3.2 / (3.2 - z2);
      var px = (ox + x3 * R * persp) * dpr;
      var py = (oy - y3 * R * persp) * dpr;
      if(px < -4 || py < -4 || px > canvas.width + 4 || py > canvas.height + 4){ continue; }

      var depth = (z2 + 1) / 2;                       /* 0 at the back, 1 at the front */
      var lum;
      if(type === MARK){ lum = .06 + .94 * depth * depth * depth; }
      else if(type === CAP){ lum = .12 + .7 * depth * depth; }
      else if(type === BAND){ lum = .1 + .55 * depth * depth; }
      else { lum = .12 + .25 * depth; }
      var level = Math.min(LEVELS - 1, (lum * LEVELS) | 0);
      var size = base * (type === MARK ? 1.25 : 1) * (.7 + depth * .8);
      buckets[(type === BAND ? LEVELS : 0) + level].push(px - size / 2, py - size / 2, size);
    }

    ctx.globalCompositeOperation = "lighter";
    for(var bi = 0; bi < buckets.length; bi++){
      var list = buckets[bi];
      if(!list.length){ continue; }
      var band = bi >= LEVELS;
      var a = ((bi % LEVELS) + .5) / LEVELS * alpha;
      ctx.fillStyle = band
        ? "rgba(" + accent[0] + "," + accent[1] + "," + accent[2] + "," + a.toFixed(3) + ")"
        : "rgba(246,243,234," + a.toFixed(3) + ")";
      ctx.beginPath();
      for(var j = 0; j < list.length; j += 3){ ctx.rect(list[j], list[j + 1], list[j + 2], list[j + 2]); }
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  }

  /* ---------- loop ---------- */
  var last = 0, ticks = 0, raf = null;
  function tick(now){
    raf = null;
    if(document.hidden){ return; }
    var dt = last ? Math.min((now - last) / 1000, .05) : 1 / 60;
    last = now;
    if(++ticks % 8 === 0){ readAccent(); }
    if(ticks % 90 === 0){ measure(); }                /* the index opens and closes, heights move */
    frame(dt);
    raf = requestAnimationFrame(tick);
  }
  function start(){ if(raf === null){ last = 0; raf = requestAnimationFrame(tick); } }

  function resize(){
    W = window.innerWidth; H = window.innerHeight;
    var wasNarrow = narrow;
    narrow = W < 720;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    if(!count || wasNarrow !== narrow){ build(); }
    measure();
    if(reduce){ readAccent(); frame(1); }
  }

  var resizeTimer = null;
  window.addEventListener("resize", function(){
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 100);
  });
  window.addEventListener("load", measure);
  document.addEventListener("visibilitychange", function(){ if(!document.hidden && !reduce){ start(); } });
  if(reduce){ window.addEventListener("scroll", function(){ frame(1); }, { passive:true }); }

  function boot(){
    resize();
    readAccent();
    if(!reduce){ start(); }
  }
  if(document.fonts && document.fonts.load){ document.fonts.load("600 20px Inter").then(boot, boot); }
  else { boot(); }
})();
