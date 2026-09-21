/* The banner: the 16 as a real sphere, turning on its vertical axis.
   Three.js draws it over the hero; if WebGL or the library is missing,
   the flat PNG underneath stays and keeps its CSS spin. */
(function(){
  "use strict";

  var stage = document.getElementById("ballStage");
  if(!stage || !window.THREE){ return; }

  try {
    var probe = document.createElement("canvas");
    if(!(probe.getContext("webgl") || probe.getContext("experimental-webgl"))){ return; }
  } catch(e){ return; }

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  if("outputColorSpace" in renderer && THREE.SRGBColorSpace){ renderer.outputColorSpace = THREE.SRGBColorSpace; }
  else if("outputEncoding" in renderer && THREE.sRGBEncoding){ renderer.outputEncoding = THREE.sRGBEncoding; }
  stage.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 7);

  /* the spin axis is tilted a touch, the way a struck ball actually turns */
  var group = new THREE.Group();
  group.rotation.set(0.2, 0, 0.07);
  scene.add(group);

  var texture = new THREE.TextureLoader().load("assets/img/ball-texture.png?v=3", function(){
    if("colorSpace" in texture && THREE.SRGBColorSpace){ texture.colorSpace = THREE.SRGBColorSpace; }
    else if("encoding" in texture && THREE.sRGBEncoding){ texture.encoding = THREE.sRGBEncoding; }
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texture.needsUpdate = true;
    stage.classList.add("is-3d");
    renderer.render(scene, camera);
  });

  var material = new THREE.MeshPhysicalMaterial({
    map: texture,
    roughness: .26,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: .05,
    envMapIntensity: 1.15
  });
  var ball = new THREE.Mesh(new THREE.SphereGeometry(1.7, 96, 96), material);
  group.add(ball);

  scene.add(new THREE.AmbientLight(0xffffff, .22));
  var key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(-3.4, 3.2, 4.4);
  scene.add(key);
  /* A glossy black ball is mostly reflection, so the scene gets a small
     studio environment: a dark gradient with one soft box light. */
  function studioEnvironment(){
    var c = document.createElement("canvas");
    c.width = 512; c.height = 256;
    var ctx = c.getContext("2d");
    var sky = ctx.createLinearGradient(0, 0, 0, 256);
    sky.addColorStop(0, "#32363b");
    sky.addColorStop(.45, "#0f1113");
    sky.addColorStop(1, "#050506");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 512, 256);
    var box = ctx.createRadialGradient(150, 70, 4, 150, 70, 90);
    box.addColorStop(0, "rgba(255,255,255,.95)");
    box.addColorStop(.5, "rgba(255,255,255,.35)");
    box.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = box;
    ctx.fillRect(0, 0, 340, 220);
    var glow = ctx.createRadialGradient(400, 150, 4, 400, 150, 120);
    glow.addColorStop(0, "rgba(160,190,255,.35)");
    glow.addColorStop(1, "rgba(160,190,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(260, 20, 252, 236);
    var tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    if("colorSpace" in tex && THREE.SRGBColorSpace){ tex.colorSpace = THREE.SRGBColorSpace; }
    else if("encoding" in tex && THREE.sRGBEncoding){ tex.encoding = THREE.sRGBEncoding; }
    return tex;
  }
  scene.environment = studioEnvironment();

  function resize(){
    var size = Math.max(1, Math.round(stage.clientWidth));
    renderer.setSize(size, size, false);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  }
  if(window.ResizeObserver){ new ResizeObserver(resize).observe(stage); }
  else { window.addEventListener("resize", resize); }
  resize();

  if(reduce){
    ball.rotation.y = .45;
    renderer.render(scene, camera);
    stage.classList.add("is-3d");
    return;
  }

  /* one turn every 26 seconds, paused off-screen and on hidden tabs */
  var TURN = (Math.PI * 2) / 26;
  var onScreen = true;
  var last = 0;
  var frame = null;

  if("IntersectionObserver" in window){
    new IntersectionObserver(function(entries){
      onScreen = entries[0].isIntersecting;
      if(onScreen){ start(); }
    }, { threshold:0 }).observe(stage);
  }
  document.addEventListener("visibilitychange", function(){
    if(!document.hidden){ start(); }
  });

  function tick(now){
    if(document.hidden || !onScreen){ frame = null; return; }
    var delta = last ? Math.min((now - last) / 1000, .1) : 0;
    last = now;
    ball.rotation.y += TURN * delta;
    renderer.render(scene, camera);
    frame = requestAnimationFrame(tick);
  }
  function start(){
    if(frame !== null){ return; }
    last = 0;
    frame = requestAnimationFrame(tick);
  }
  start();
})();
