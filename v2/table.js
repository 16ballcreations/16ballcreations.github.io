/* The hero table.
   Fifteen balls racked, a cue ball that breaks on its own, and then the 16,
   the ball that does not exist, appears on the felt. After that the table is
   the visitor's: drag to pull back the cue and let go, or tap to shoot at a
   point. The first ball the cue touches tints the site (window.setAccent).

   Every ball is a real sphere, shaded per pixel into a small sprite and
   carrying its own orientation, so the numbers and stripes roll with it.
   A sprite is only redrawn when its ball has turned. */
(function(){
  "use strict";

  var canvas = document.getElementById("table");
  var hero = document.getElementById("hero");
  if(!canvas || !hero || !canvas.getContext){ return; }
  var ctx = canvas.getContext("2d");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var COLORS = {
    1:[244,194,13], 2:[77,125,255], 3:[255,92,110], 4:[163,117,216],
    5:[255,157,61], 6:[58,211,137], 7:[224,118,95], 8:[14,14,14]
  };
  var HEX = { 1:"#f4c20d",2:"#4d7dff",3:"#ff5c6e",4:"#a375d8",5:"#ff9d3d",6:"#3ad389",7:"#e0765f",8:"#e8e8e8" };
  var CREAM = [246,243,234];
  var BLACK = [14,14,14];

  /* light from the upper left, in a y-up frame with z toward the viewer */
  var L = norm([-.45,.55,.72]);
  var H = norm([L[0],L[1],L[2]+1]);

  var W = 0, Hh = 0, dpr = 1, R = 20;
  /* the top cushion sits under the header, so no ball rolls beneath the nav */
  var TOP = 76;
  var balls = [];
  var cue = null;
  var shots = 0;
  var firstHit = null;
  var running = false;
  var frame = null;
  var visible = true;
  var ball16 = null;
  var ripples = [];
  var aim = null;
  var intro = true;

  var hudShots = document.getElementById("hudShots");
  var hudBall = document.getElementById("hudBall");
  var hintText = document.getElementById("hintText");
  var kicker = document.getElementById("heroKicker");

  function norm(v){ var l = Math.hypot(v[0],v[1],v[2]); return [v[0]/l,v[1]/l,v[2]/l]; }

  /* ---------- orientation: a 3x3 rotation, columns are the local axes ---------- */
  function ident(){ return [1,0,0, 0,1,0, 0,0,1]; }
  function rotAxis(ax, ay, az, a){
    var c = Math.cos(a), s = Math.sin(a), t = 1 - c;
    return [
      t*ax*ax + c,    t*ax*ay - s*az, t*ax*az + s*ay,
      t*ax*ay + s*az, t*ay*ay + c,    t*ay*az - s*ax,
      t*ax*az - s*ay, t*ay*az + s*ax, t*az*az + c
    ];
  }
  function mul(a, b){
    var o = new Array(9);
    for(var i = 0; i < 3; i++){
      for(var j = 0; j < 3; j++){
        o[i*3+j] = a[i*3]*b[j] + a[i*3+1]*b[3+j] + a[i*3+2]*b[6+j];
      }
    }
    return o;
  }
  function orthonormalize(m){
    var x = norm([m[0],m[3],m[6]]);
    var y = [m[1],m[4],m[7]];
    var d = x[0]*y[0]+x[1]*y[1]+x[2]*y[2];
    y = norm([y[0]-d*x[0], y[1]-d*x[1], y[2]-d*x[2]]);
    var z = [x[1]*y[2]-x[2]*y[1], x[2]*y[0]-x[0]*y[2], x[0]*y[1]-x[1]*y[0]];
    return [x[0],y[0],z[0], x[1],y[1],z[1], x[2],y[2],z[2]];
  }
  function randomOrientation(){
    var m = ident();
    m = mul(rotAxis(1,0,0, (Math.random()-.5)*1.2), m);
    m = mul(rotAxis(0,1,0, (Math.random()-.5)*1.2), m);
    m = mul(rotAxis(0,0,1, Math.random()*Math.PI*2), m);
    return m;
  }

  /* rolling without slipping: moving (dx, dy) on screen turns the ball about
     the horizontal axis perpendicular to the motion, by distance / radius */
  function roll(b, dx, dy){
    var len = Math.hypot(dx, dy);
    if(len < 1e-4){ return; }
    var ux = dx / len, uy = -dy / len;
    b.m = mul(rotAxis(-uy, ux, 0, len / b.r), b.m);
    b.dirty = true;
    if(++b.turns > 60){ b.m = orthonormalize(b.m); b.turns = 0; }
  }

  /* ---------- the ball sprite ---------- */
  function makeBall(n, x, y){
    var b = {
      n:n, x:x, y:y, vx:0, vy:0, r:R, m:randomOrientation(), turns:0,
      stripe: n >= 9 && n <= 15, base: null, dirty:true, scale:1,
      sprite: document.createElement("canvas"), label: n === 0 ? "" : String(n)
    };
    if(n === 0){ b.base = CREAM; }
    else if(n === 16){ b.base = BLACK; b.stripe = true; }
    else if(n <= 8){ b.base = COLORS[n]; }
    else { b.base = COLORS[n - 8]; }
    return b;
  }

  function paint(b){
    var size = Math.ceil(b.r * 2 * dpr) + 2;
    var s = b.sprite;
    if(s.width !== size){ s.width = size; s.height = size; }
    var sctx = s.getContext("2d");
    var img = sctx.createImageData(size, size);
    var data = img.data;
    var rad = b.r * dpr, c = size / 2, m = b.m;
    var isCue = b.n === 0;
    var disk = .885; /* cos of the number disk's angular radius */

    for(var py = 0; py < size; py++){
      var ny = (c - py - .5) / rad;
      for(var px = 0; px < size; px++){
        var nx = (px + .5 - c) / rad;
        var d2 = nx*nx + ny*ny;
        if(d2 >= 1.02){ continue; }
        var dd = Math.sqrt(d2);
        var edge = Math.max(0, Math.min(1, (1 - dd) * rad + .5));
        if(edge <= 0){ continue; }
        var nz = Math.sqrt(Math.max(0, 1 - Math.min(d2, 1)));
        var sx = dd > 1 ? nx/dd : nx, sy = dd > 1 ? ny/dd : ny;

        /* world normal into the ball's own frame: local = transpose(m) * n */
        var lx = m[0]*sx + m[3]*sy + m[6]*nz;
        var ly = m[1]*sx + m[4]*sy + m[7]*nz;
        var lz = m[2]*sx + m[5]*sy + m[8]*nz;

        var col;
        if(isCue){ col = CREAM; }
        else if(Math.abs(lz) > disk){ col = CREAM; }
        else if(b.stripe){ col = Math.abs(ly) < .52 ? b.base : CREAM; }
        else { col = b.base; }

        var diff = Math.max(0, sx*L[0] + sy*L[1] + nz*L[2]);
        var spec = Math.pow(Math.max(0, sx*H[0] + sy*H[1] + nz*H[2]), 70);
        var rim = Math.pow(1 - nz, 3) * .35;
        var shade = .3 + .78 * diff - rim;
        var i = (py * size + px) * 4;
        data[i]   = Math.min(255, col[0] * shade + spec * 255 + rim * 40);
        data[i+1] = Math.min(255, col[1] * shade + spec * 255 + rim * 40);
        data[i+2] = Math.min(255, col[2] * shade + spec * 255 + rim * 46);
        data[i+3] = 255 * edge;
      }
    }
    sctx.putImageData(img, 0, 0);

    /* the number, printed on whichever disk faces us, foreshortened with it */
    if(b.label){
      for(var side = -1; side <= 1; side += 2){
        var wx = m[2] * side, wy = m[5] * side, wz = m[8] * side;
        if(wz < .2){ continue; }
        var ox = c + wx * rad, oy = c - wy * rad;
        var theta = Math.atan2(-wy, wx);
        var phi = Math.atan2(-m[3] * side, m[0]);
        sctx.save();
        sctx.beginPath();
        sctx.arc(c, c, rad - .5, 0, Math.PI*2);
        sctx.clip();
        sctx.translate(ox, oy);
        sctx.rotate(theta);
        sctx.scale(wz, 1);
        sctx.rotate(-theta + phi);
        sctx.fillStyle = "rgba(17,17,17," + Math.min(1, (wz - .2) * 3) + ")";
        sctx.font = "600 " + (rad * (b.label.length > 1 ? .5 : .6)) + "px Inter, system-ui, sans-serif";
        sctx.textAlign = "center";
        sctx.textBaseline = "middle";
        sctx.fillText(b.label, 0, rad * .03);
        sctx.restore();
      }
    }
    b.dirty = false;
  }

  /* ---------- layout ---------- */
  function narrow(){ return W < 720; }

  function rack(){
    balls = [];
    var drawn = 1 + Math.floor(Math.random() * 7);
    var apexX = narrow() ? W * .5 : W * .66;
    var apexY = narrow() ? Hh * .30 : Hh * .44;
    var dx = R * 2 * .88, gap = R * 2 + 1;

    /* the drawn ball leads the rack, the 8 sits in the middle, the rest shuffled */
    var rest = [];
    for(var k = 1; k <= 15; k++){ if(k !== drawn && k !== 8){ rest.push(k); } }
    for(var i = rest.length - 1; i > 0; i--){ var j = Math.floor(Math.random()*(i+1)); var t = rest[i]; rest[i] = rest[j]; rest[j] = t; }

    var slot = 0;
    for(var row = 0; row < 5; row++){
      for(var c = 0; c <= row; c++){
        var n;
        if(slot === 0){ n = drawn; }
        else if(row === 2 && c === 1){ n = 8; }
        else { n = rest.shift(); }
        var x, y;
        if(narrow()){ /* on a phone the rack points down the screen */
          x = apexX + (c - row / 2) * gap;
          y = apexY - row * dx;
        } else {
          x = apexX + row * dx;
          y = apexY + (c - row / 2) * gap;
        }
        balls.push(makeBall(n, x, y));
        slot++;
      }
    }
    cue = makeBall(0, narrow() ? W * .5 : W * .2, narrow() ? Hh * .64 : apexY);
    balls.push(cue);
    firstHit = null;
    if(window.setAccent){ window.setAccent(drawn); }
    if(hudBall){ hudBall.textContent = String(drawn).padStart(2, "0"); }
  }

  function resize(){
    var rect = hero.getBoundingClientRect();
    var oldW = W, oldH = Hh;
    W = rect.width; Hh = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(Hh * dpr);
    R = Math.max(12, Math.min(28, Math.min(W, Hh) * .03));
    var hdr = document.getElementById("siteHeader");
    TOP = (hdr ? hdr.offsetHeight : 68) + 8;
    if(!balls.length){ return; }
    /* keep the table as it was, scaled into the new frame */
    balls.forEach(function(b){
      if(oldW){ b.x = b.x / oldW * W; b.y = b.y / oldH * Hh; }
      b.r = R * b.scale; b.dirty = true;
      clamp(b);
    });
    draw();
  }

  function clamp(b){
    if(b.x < b.r){ b.x = b.r; } if(b.x > W - b.r){ b.x = W - b.r; }
    if(b.y < TOP + b.r){ b.y = TOP + b.r; } if(b.y > Hh - b.r){ b.y = Hh - b.r; }
  }

  /* ---------- physics ---------- */
  var FRICTION = .987;  /* per 1/60 s */
  var REST = .92;       /* ball to ball */
  var CUSHION = .72;

  function step(dt){
    var f = Math.pow(FRICTION, dt * 60);
    var moving = false;
    var i, j, b;
    for(i = 0; i < balls.length; i++){
      b = balls[i];
      if(b.vx === 0 && b.vy === 0){ continue; }
      var mx = b.vx * dt, my = b.vy * dt;
      b.x += mx; b.y += my;
      roll(b, mx, my);
      b.vx *= f; b.vy *= f;
      if(Math.hypot(b.vx, b.vy) < 6){ b.vx = 0; b.vy = 0; } else { moving = true; }

      if(b.x < b.r){ b.x = b.r; b.vx = Math.abs(b.vx) * CUSHION; }
      else if(b.x > W - b.r){ b.x = W - b.r; b.vx = -Math.abs(b.vx) * CUSHION; }
      if(b.y < TOP + b.r){ b.y = TOP + b.r; b.vy = Math.abs(b.vy) * CUSHION; }
      else if(b.y > Hh - b.r){ b.y = Hh - b.r; b.vy = -Math.abs(b.vy) * CUSHION; }
    }
    for(i = 0; i < balls.length; i++){
      for(j = i + 1; j < balls.length; j++){
        collide(balls[i], balls[j]);
      }
    }
    return moving;
  }

  function collide(a, b){
    var dx = b.x - a.x, dy = b.y - a.y;
    var min = a.r + b.r;
    var d2 = dx*dx + dy*dy;
    if(d2 >= min*min || d2 === 0){ return; }
    var d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
    var push = (min - d) / 2;
    a.x -= nx * push; a.y -= ny * push;
    b.x += nx * push; b.y += ny * push;
    var rv = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
    if(rv <= 0){ return; }
    var imp = rv * (1 + REST) / 2;
    a.vx -= imp * nx; a.vy -= imp * ny;
    b.vx += imp * nx; b.vy += imp * ny;

    if(firstHit === null && (a === cue || b === cue)){
      var other = a === cue ? b : a;
      firstHit = other.n;
      if(!intro){ onFirstHit(other); }
    }
    if(rv > 120){ ripples.push({ x:a.x + nx * a.r, y:a.y + ny * a.r, t:0, max: Math.min(1, rv / 900) }); }
  }

  function onFirstHit(b){
    var n = b.n === 16 ? 16 : (b.n > 8 ? b.n - 8 : b.n);
    if(n !== 16 && window.setAccent){ window.setAccent(n); }
    if(hudBall){ hudBall.textContent = String(b.n).padStart(2, "0"); }
    if(hintText){
      hintText.textContent = b.n === 16
        ? "Le diste a la 16. La que no existía. Buen tiro."
        : "Bola " + b.n + ". El sitio ahora es de ese color. Sigue tirando.";
    }
  }

  /* ---------- drawing ---------- */
  function draw(){
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, Hh);

    /* ripples where balls strike each other */
    for(var k = ripples.length - 1; k >= 0; k--){
      var rp = ripples[k];
      var a = 1 - rp.t;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, 4 + rp.t * 48 * (.4 + rp.max), 0, Math.PI*2);
      ctx.strokeStyle = "rgba(255,255,255," + (a * .35 * rp.max + .04 * a) + ")";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    /* soft shadows first, so no ball sits under another's shadow */
    balls.forEach(function(b){
      if(b.scale <= 0){ return; }
      var g = ctx.createRadialGradient(b.x + b.r*.35, b.y + b.r*.5, b.r*.2, b.x + b.r*.35, b.y + b.r*.5, b.r*1.35);
      g.addColorStop(0, "rgba(0,0,0,.55)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x + b.r*.35, b.y + b.r*.5, b.r*1.35, 0, Math.PI*2);
      ctx.fill();
    });

    if(aim){ drawAim(); }

    balls.forEach(function(b){
      if(b.scale <= 0){ return; }
      if(b.dirty){ paint(b); }
      var s = b.r * 2 + 2 / dpr;
      ctx.drawImage(b.sprite, b.x - s/2, b.y - s/2, s, s);
    });

    /* the 16 announces itself with a ring in the drawn colour */
    if(ball16 && ball16.glow > 0){
      ctx.beginPath();
      ctx.arc(ball16.x, ball16.y, ball16.r * (1.2 + (1 - ball16.glow) * 2.4), 0, Math.PI*2);
      ctx.strokeStyle = accentRGBA(ball16.glow * .9);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function accentRGBA(a){
    var hex = (getComputedStyle(document.documentElement).getPropertyValue("--accent") || "#ffffff").trim();
    var m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if(m){ return "rgba(" + parseInt(m[1],16) + "," + parseInt(m[2],16) + "," + parseInt(m[3],16) + "," + a + ")"; }
    var rgb = hex.match(/rgba?\(([^)]+)\)/);
    if(rgb){ var p = rgb[1].split(","); return "rgba(" + p[0] + "," + p[1] + "," + p[2] + "," + a + ")"; }
    return "rgba(255,255,255," + a + ")";
  }

  function drawAim(){
    var dx = aim.dx, dy = aim.dy;
    var len = Math.hypot(dx, dy);
    if(len < 4){ return; }
    var ux = dx / len, uy = dy / len;
    var power = Math.min(1, len / 260);

    /* the guide: dotted line ahead of the cue ball */
    ctx.save();
    ctx.setLineDash([2, 8]);
    ctx.lineCap = "round";
    ctx.strokeStyle = accentRGBA(.85);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cue.x + ux * (cue.r + 6), cue.y + uy * (cue.r + 6));
    ctx.lineTo(cue.x + ux * (cue.r + 60 + power * 360), cue.y + uy * (cue.r + 60 + power * 360));
    ctx.stroke();
    ctx.restore();

    /* the cue itself, pulled back behind the ball */
    var back = cue.r + 10 + power * 70;
    var sx = cue.x - ux * back, sy = cue.y - uy * back;
    var ex = cue.x - ux * (back + 320), ey = cue.y - uy * (back + 320);
    var g = ctx.createLinearGradient(sx, sy, ex, ey);
    g.addColorStop(0, "#f3f1ea");
    g.addColorStop(.04, "#f3f1ea");
    g.addColorStop(.05, "#2a2c2e");
    g.addColorStop(1, "rgba(60,62,64,0)");
    ctx.strokeStyle = g;
    ctx.lineWidth = Math.max(4, cue.r * .32);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    /* power ring */
    ctx.beginPath();
    ctx.arc(cue.x, cue.y, cue.r + 8, -Math.PI/2, -Math.PI/2 + power * Math.PI * 2);
    ctx.strokeStyle = accentRGBA(.9);
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /* ---------- loop ---------- */
  var last = 0;
  function tick(now){
    frame = null;
    if(!visible || document.hidden){ running = false; return; }
    var dt = last ? Math.min((now - last) / 1000, 1/30) : 1/60;
    last = now;
    /* two substeps keep a hard break from tunnelling through the rack */
    var moving = step(dt / 2);
    moving = step(dt / 2) || moving;

    for(var k = ripples.length - 1; k >= 0; k--){
      ripples[k].t += dt * 1.6;
      if(ripples[k].t >= 1){ ripples.splice(k, 1); }
    }
    var animating = ripples.length > 0 || !!aim;
    if(ball16 && ball16.scale < 1){
      ball16.scale = Math.min(1, ball16.scale + dt * 2.2);
      var e = 1 - Math.pow(1 - ball16.scale, 3);
      ball16.r = R * (e * 1.08 - Math.max(0, e - .92));
      ball16.dirty = true;
      animating = true;
    }
    if(ball16 && ball16.glow > 0){ ball16.glow = Math.max(0, ball16.glow - dt * .7); animating = true; }

    draw();
    if(moving || animating){ frame = requestAnimationFrame(tick); }
    else { running = false; last = 0; }
  }
  function wake(){
    if(frame !== null){ return; }
    running = true;
    last = 0;
    frame = requestAnimationFrame(tick);
  }

  /* ---------- the 16 ---------- */
  function spawn16(){
    var spot = null;
    for(var tries = 0; tries < 60 && !spot; tries++){
      var x = W * (narrow() ? .2 + Math.random() * .6 : .45 + Math.random() * .45);
      var y = Hh * (narrow() ? .15 + Math.random() * .45 : .2 + Math.random() * .55);
      var ok = balls.every(function(b){ return Math.hypot(b.x - x, b.y - y) > b.r + R * 2.2; });
      if(ok){ spot = [x, y]; }
    }
    if(!spot){ spot = [W * .8, Hh * .3]; }
    ball16 = makeBall(16, spot[0], spot[1]);
    ball16.scale = 0; ball16.r = 0.01; ball16.glow = 1;
    ball16.m = ident();
    ball16.m = mul(rotAxis(1,0,0,.25), ball16.m);
    balls.push(ball16);
    if(kicker){
      kicker.textContent = "La bola 16 no existía. Ya existe.";
    }
    wake();
  }

  /* ---------- the player ---------- */
  function point(e){
    var r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function tableQuiet(){
    return balls.every(function(b){ return b.vx === 0 && b.vy === 0; });
  }
  function shoot(vx, vy){
    if(intro){ return; }
    firstHit = null;
    cue.vx = vx; cue.vy = vy;
    shots++;
    if(hudShots){ hudShots.textContent = String(shots).padStart(2, "0"); }
    wake();
  }

  var down = null;
  canvas.addEventListener("pointerdown", function(e){
    if(intro || e.button > 0){ return; }
    down = { p: point(e), id: e.pointerId, type: e.pointerType, t: performance.now() };
    if(e.pointerType === "mouse"){
      canvas.setPointerCapture(e.pointerId);
      aim = { dx:0, dy:0 };
    }
  });
  canvas.addEventListener("pointermove", function(e){
    if(!down || down.id !== e.pointerId || !aim){ return; }
    var p = point(e);
    /* slingshot: pull away from where you want the ball to go */
    aim.dx = down.p.x - p.x; aim.dy = down.p.y - p.y;
    if(Math.hypot(aim.dx, aim.dy) > 6){ canvas.classList.add("is-aiming"); }
    wake();
  });
  function release(e){
    if(!down || down.id !== e.pointerId){ return; }
    var p = point(e);
    var pulled = aim ? Math.hypot(aim.dx, aim.dy) : 0;
    if(aim && pulled > 12){
      var power = Math.min(1, pulled / 260);
      shoot(aim.dx / pulled * power * 2100, aim.dy / pulled * power * 2100);
    } else if(Math.hypot(p.x - down.p.x, p.y - down.p.y) < 12){
      /* a tap or a click: the cue ball goes to that point */
      var dx = p.x - cue.x, dy = p.y - cue.y, d = Math.hypot(dx, dy);
      if(d > 1){
        var speed = Math.min(1900, 500 + d * 2.6);
        shoot(dx / d * speed, dy / d * speed);
      }
    }
    aim = null;
    down = null;
    canvas.classList.remove("is-aiming");
    wake();
  }
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", function(){ aim = null; down = null; canvas.classList.remove("is-aiming"); wake(); });

  /* on a touch screen there is no dragging: a tap shoots */
  if(hintText && window.matchMedia && !window.matchMedia("(pointer: fine)").matches){
    hintText.textContent = "Toca la mesa para tirar. La bola que golpees pinta el sitio.";
  }

  /* ---------- start ---------- */
  function start(){
    resize();
    rack();
    draw();

    if(reduce){
      /* no break, no motion: the balls simply lie scattered, the 16 among them */
      balls.forEach(function(b){
        b.x = W * (.08 + Math.random() * .84);
        b.y = Hh * (.1 + Math.random() * .5);
      });
      for(var n = 0; n < 40; n++){ for(var i = 0; i < balls.length; i++){ for(var j = i+1; j < balls.length; j++){ collide(balls[i], balls[j]); } } }
      ball16 = makeBall(16, W * .82, Hh * .3); ball16.scale = 1; balls.push(ball16);
      intro = false;
      draw();
      return;
    }

    /* the break */
    setTimeout(function(){
      var target = balls[0];
      var dx = target.x - cue.x, dy = target.y - cue.y + (Math.random() - .5) * 2;
      var d = Math.hypot(dx, dy);
      var speed = Math.min(2600, Math.max(1700, d * 4.2));
      cue.vx = dx / d * speed; cue.vy = dy / d * speed;
      wake();
      setTimeout(function(){
        intro = false;
        spawn16();
      }, 1500);
    }, 1100);
  }

  if("IntersectionObserver" in window){
    new IntersectionObserver(function(entries){
      visible = entries[0].isIntersecting;
      if(visible && running === false && !tableQuiet()){ wake(); }
    }).observe(hero);
  }
  document.addEventListener("visibilitychange", function(){ if(!document.hidden && !tableQuiet()){ wake(); } });

  var resizeTimer = null;
  window.addEventListener("resize", function(){
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 80);
  });

  /* the numbers are set in Inter; wait for it so the sprites print with it */
  if(document.fonts && document.fonts.load){
    document.fonts.load("600 20px Inter").then(start, start);
  } else { start(); }

  window.__table = { balls: function(){ return balls; } };
})();
