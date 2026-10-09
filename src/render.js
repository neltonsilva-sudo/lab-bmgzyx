// DONO: agente "luz-render". Renderizador, exposição, luminárias fluorescentes (luz), sombras, ambiente e pós-processamento.
// Pipeline (q=high): RenderPass (MSAA 4x, HalfFloat) → GTAO (meia resolução) → Bloom leve → OutputPass (Neutral, sRGB)
//                    → PhonePass (distorção/aberração/nitidez/vinheta/ruído de celular).
// Luz: PMREM de uma sala-proxy com projeção em caixa (reflexos no piso no lugar certo) + RectAreaLight por luminária
//      (reflexo especular alongado e gradiente local) + luz direcional vertical com sombra VSM bem suave (contato sob bancadas).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UpscaleShader } from './render_upscale.js?v=20261009142652';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { installBoxProjection, buildEnvironment } from './render_env.js?v=20261009142652';
import { PhoneShader } from './render_post.js?v=20261009142652';
import { findFixtures, buildFixtureMeshes } from './render_fixtures.js?v=20261009142652';

const QS = new URLSearchParams(location.search);
const QUALITY = QS.get('q') || 'high';
const HIGH = QUALITY !== 'low';
const DBG = new Set((QS.get('dbg') || '').split(','));   // perfis: noao, nort, nomsaa, nobloom

// Cor da luz: fluorescente/LED ~5600 K (branco levemente frio depois do balanço de branco do celular).
const LIGHT_COLOR = new THREE.Color().setRGB(1.0, 0.985, 0.965);
export const LOOK = {
  exposure: 1.95,
  tube: 16,          // radiância dos tubos (linear) – satura e alimenta o bloom
  rect: 5.5,         // intensidade das RectAreaLight (nits) – só com ?dbg=rect
  point: 2.1,        // candela por luminária (luz pontual)
  sun: 0.55,         // direcional vertical (sombras de contato)
  env: 1.4,          // intensidade do ambiente PMREM
  aoScale: 0.75,     // resolução do GTAO (fração)
  bloom: [0.18, 0.2, 3.0],   // strength, radius, threshold
  ao: { radius: 0.4, distanceExponent: 1.5, thickness: 0.15, scale: 1.0, samples: 8, distanceFallOff: 1.0 },
};

// Ajuste fino por URL para iteração: ?lk=exposure:1.4,rect:6,env:1.1
for (const kv of (QS.get('lk') || '').split(',').filter(Boolean)) { const [k, v] = kv.split(':'); if (k.startsWith('ao.')) LOOK.ao[k.slice(3)] = +v; else if (k in LOOK && typeof LOOK[k] === 'number') LOOK[k] = +v; }

installBoxProjection();

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
  const dpr = Math.min(devicePixelRatio, HIGH ? 1.5 : 1);
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = LOOK.exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = HIGH && !DBG.has('pcf') ? THREE.VSMShadowMap : THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;

  let composer = null, size = new THREE.Vector2(innerWidth, innerHeight), phone, gtao, bloom, up, lastScene, lastCam;
  // resolução dinâmica: a cena é calculada em escala 'rs' da tela e ampliada com nitidez (render_upscale.js)
  const QS = new URLSearchParams(location.search);
  const forced = QS.has('rs') ? Math.min(1, Math.max(0.4, +QS.get('rs') || 1)) : null;
  const phoneLike = matchMedia('(pointer:coarse)').matches || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  const RS_MIN = 0.5, RS_MAX = 1.0;
  let rs = forced ?? (phoneLike ? 0.75 : 1.0);
  const fps = { n: 0, t: 0, last: performance.now(), next: performance.now() + 2500 };
  const sharpFor = (r) => 0.18 + (1 - r) * 0.9;
  function applyScale() {
    if (!composer) return;
    composer.setPixelRatio(dpr * rs); composer.setSize(size.x, size.y);
    const sw = Math.round(size.x * dpr * rs), sh = Math.round(size.y * dpr * rs);
    phone.uniforms.resolution.value.set(sw, sh);
    up.uniforms.srcSize.value.set(sw, sh); up.uniforms.sharp.value = sharpFor(rs);
  }
  function adapt() {
    const now = performance.now(), dt = now - fps.last; fps.last = now;
    if (forced != null || document.hidden || dt > 250) return; // ignora pausas (aba oculta, travadas pontuais)
    fps.n++; fps.t += dt;
    if (now < fps.next) return;
    const avg = 1000 / (fps.t / fps.n); fps.n = 0; fps.t = 0; fps.next = now + 2000;
    let nr = rs;
    if (avg < 42) nr = Math.max(RS_MIN, rs - 0.1); else if (avg > 57 && rs < RS_MAX) nr = Math.min(RS_MAX, rs + 0.05);
    if (Math.abs(nr - rs) > 0.001) { rs = nr; applyScale(); }
    window.__rs = { scale: +rs.toFixed(2), fps: Math.round(avg) };
  }
  const clock = new THREE.Clock();
  function build(scene, camera) {
    const w = size.x, h = size.y;
    const rt = new THREE.WebGLRenderTarget(w * dpr, h * dpr, { type: THREE.HalfFloatType, samples: HIGH && !DBG.has('nomsaa') ? 4 : 0 });
    composer = new EffectComposer(renderer, rt);
    composer.setPixelRatio(dpr);
    composer.addPass(new RenderPass(scene, camera));
    if (HIGH && !DBG.has('noao')) {
      gtao = new GTAOPass(scene, camera, w, h, undefined, LOOK.ao, { lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
      const aoScale = LOOK.aoScale;
      const baseSetSize = gtao.setSize.bind(gtao);
      gtao.setSize = (ww, hh) => baseSetSize(Math.max(2, Math.round(ww * aoScale)), Math.max(2, Math.round(hh * aoScale)));
      gtao.blendIntensity = 1.0;
      gtao.normalMaterial.side = THREE.DoubleSide; // paredes/piso em BackSide também entram no G-buffer
      composer.addPass(gtao);
      bloom = new UnrealBloomPass(new THREE.Vector2(w, h), ...LOOK.bloom);
      composer.addPass(bloom);
    } else {
      bloom = new UnrealBloomPass(new THREE.Vector2(w / 2, h / 2), LOOK.bloom[0] * 0.8, LOOK.bloom[1], LOOK.bloom[2]);
      composer.addPass(bloom);
    }
    composer.addPass(new OutputPass());
    phone = new ShaderPass(PhoneShader);
    if (!HIGH) phone.uniforms.sharpen.value = 0.2;
    composer.addPass(phone);
    up = new ShaderPass(UpscaleShader); up.uniforms.srcSize.value = new THREE.Vector2(w * dpr, h * dpr);
    composer.addPass(up);
    lastScene = scene; lastCam = camera;
    applyScale();
  }
  const api = {
    renderer,
    get composer() { return composer; },
    get passes() { return { gtao, bloom, phone, up }; },
    get scale() { return rs; },
    setScale(v) { rs = Math.min(RS_MAX, Math.max(0.4, v)); applyScale(); },
    resize(w, h) {
      size.set(w, h);
      renderer.setSize(w, h, false);
      if (composer) applyScale();
    },
    render(scene, camera) {
      if (!composer || scene !== lastScene || camera !== lastCam) build(scene, camera);
      phone.uniforms.time.value = clock.getElapsedTime();
      composer.render();
      adapt();
    },
  };
  window.__renderAPI = api;
  return api;
}

// ctx: { THREE, renderer, scene, camera, layout, q, parts? }  → { update(dt) }
export function buildLighting(scene, ctx) {
  const L = ctx.layout, { W, D, H } = L.ROOM;
  const renderer = ctx.renderer;
  const fx = findFixtures(scene, ctx);
  const fixtures = fx.list;
  let tubeMat = null;
  if (fx.own) tubeMat = buildFixtureMeshes(scene, fixtures, LOOK.tube).tubeMaterial;
  else for (const t of fx.tubes || []) { t.material.emissiveIntensity = LOOK.tube; tubeMat = t.material; } // brilho calibrado p/ bloom

  scene.background = new THREE.Color().setRGB(0.12, 0.12, 0.125);
  // Ambiente (reflexos + luz rebatida)
  scene.environment = buildEnvironment(renderer, L, fixtures, { tube: LOOK.tube * 1.6 });
  scene.environmentIntensity = LOOK.env;

  const root = new THREE.Group(); root.name = 'lighting'; scene.add(root);

  // RectAreaLight por luminária (q=high) — dá o gradiente sob cada luminária e o reflexo alongado nítido no piso.
  const rects = [];
  if (HIGH && DBG.has('rect')) {
    RectAreaLightUniformsLib.init();
    for (const f of fixtures) {
      const alongZ = f.axis === 'z';
      const r = new THREE.RectAreaLight(LIGHT_COLOR, LOOK.rect, alongZ ? 0.16 : f.len, alongZ ? f.len : 0.16);
      r.position.set(f.pos.x, f.pos.y - 0.035, f.pos.z);
      r.rotation.set(-Math.PI / 2, 0, 0);
      root.add(r); rects.push(r);
    }
  } else if (HIGH && !DBG.has('nort')) {
    // Luz pontual por luminária (barata): poças suaves sob as luminárias e gradiente nas paredes.
    // (RectAreaLight x24 custava ~15 ms/quadro; o reflexo alongado vem do PMREM com projeção em caixa.)
    for (const f of fixtures) {
      // SpotLight bem aberto apontando para baixo: não acende o teto (o teto real só recebe luz rebatida).
      const p = new THREE.SpotLight(LIGHT_COLOR, LOOK.point, 0, 1.36, 1.0, 2);
      p.position.set(f.pos.x, f.pos.y - 0.06, f.pos.z);
      p.target.position.set(f.pos.x, 0, f.pos.z);
      root.add(p, p.target); rects.push(p);
    }
  } else {
    // q=low: poucas luzes pontuais baratas + ambiente mais forte.
    scene.environmentIntensity = LOOK.env * 1.35;
  }

  // Direcional quase vertical com sombra VSM bem borrada: sombras de contato suaves sob bancadas/cadeiras.
  // A câmera de sombra começa ABAIXO do teto (near) — teto/eletrocalhas não sombreiam a sala.
  const sun = new THREE.DirectionalLight(LIGHT_COLOR, LOOK.sun);
  const tgt = new THREE.Object3D(); tgt.position.set(W / 2, 0, D / 2); root.add(tgt);
  sun.target = tgt;
  sun.position.set(W / 2 + 0.25, H - 0.12, D / 2 + 0.18);
  sun.castShadow = true;
  const sm = HIGH ? 2048 : 1024;
  sun.shadow.mapSize.set(sm, sm);
  const cam = sun.shadow.camera;
  cam.left = -D / 2 - 0.5; cam.right = D / 2 + 0.5; cam.top = D / 2 + 0.5; cam.bottom = -D / 2 - 0.5;
  // começa em y≈2,38: sanca/forro/eletrocalhas (≥2,45 m) não sombreiam a sala
  cam.near = Math.max(0.02, (H - 0.12) - Math.min(2.38, (L.ROOM.soffitH || H) - 0.07)); cam.far = H + 0.5; cam.updateProjectionMatrix();
  sun.shadow.bias = HIGH ? -0.0004 : -0.0008;
  sun.shadow.normalBias = 0.02;
  if (HIGH) { sun.shadow.radius = 14; sun.shadow.blurSamples = 20; } else { sun.shadow.radius = 3; }
  root.add(sun);

  // Preenchimento muito fraco vindo de baixo (piso azul rebatendo) – evita fundos de bancada pretos demais.
  const hemi = new THREE.HemisphereLight(0xf4f4f2, 0x7d8894, HIGH ? 0.12 : 0.3);
  root.add(hemi);

  // Peças finas (planos/chapas de uma face) somem do mapa de sombra com o shadowSide padrão (face de trás).
  // Renderiza as duas faces no mapa de sombra de todos os projetores (VSM tolera o leve acne).
  function fixShadowSides() {
    scene.traverse((o) => {
      if (!o.isMesh || !o.castShadow) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) if (m && m.shadowSide == null) m.shadowSide = THREE.DoubleSide;
    });
  }
  if (!DBG.has("noside")) fixShadowSides();

  // Sombras são estáticas: atualiza nos primeiros quadros e depois só quando a cena mudar.
  let frames = 0, lastCount = -1, t = 0;
  function countMeshes() { let n = 0; scene.traverse((o) => { if (o.isMesh) n++; }); return n; }

  window.__look = { LOOK, sun, rects, hemi, scene, fixtures, tubeMat };
  return {
    fixtures,
    update(dt) {
      frames++; t += dt || 0;
      if (frames < 6) renderer.shadowMap.needsUpdate = true;
      if (t > 2) { t = 0; const n = countMeshes(); if (n !== lastCount) { lastCount = n; fixShadowSides(); renderer.shadowMap.needsUpdate = true; } }
    },
  };
}
