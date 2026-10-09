// DONO: agente "acessórios". Escadas de fibra de abrir (laranja-marrom, degraus, etiquetas) e escada simples de alumínio.
import * as THREE from 'three';
import { merge } from './props_util.js?v=20261009092129';
import { fiberMaps, ladderLabel, railPrint, noiseTex } from './props_tex.js?v=20261009092129';

const Y = new THREE.Vector3(0, 1, 0);
// Viga retangular de p0 a p1; w = espessura em z (largura da escada), d = profundidade no plano xy.
function beam(p0, p1, d, w, uvLen = 1) {
  const dir = p1.clone().sub(p0), len = dir.length();
  const g = new THREE.BoxGeometry(d, len, w);
  // UV v ao longo do comprimento (para os veios da fibra)
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * len * uvLen);
  const q = new THREE.Quaternion().setFromUnitVectors(Y, dir.normalize());
  g.applyQuaternion(q); const m = p0.clone().add(p1).multiplyScalar(0.5); g.translate(m.x, m.y, m.z);
  return g;
}

let MATS = null;
function mats() {
  if (MATS) return MATS;
  const f = fiberMaps();
  MATS = {
    fiber: new THREE.MeshPhysicalMaterial({ color: 0xe0cdb4, map: f.col, normalMap: f.nrm, normalScale: new THREE.Vector2(0.4, 0.4), roughness: 0.62, roughnessMap: noiseTex(103, 160, 60, 2), clearcoat: 0.12, clearcoatRoughness: 0.6 }),
    fiberDark: new THREE.MeshPhysicalMaterial({ color: 0x86654a, map: f.col, normalMap: f.nrm, normalScale: new THREE.Vector2(0.4, 0.4), roughness: 0.7, roughnessMap: noiseTex(104, 170, 60, 2), clearcoat: 0.08, clearcoatRoughness: 0.7 }),
    alu: new THREE.MeshStandardMaterial({ color: 0xb9bcbf, metalness: 0.85, roughness: 0.42, roughnessMap: noiseTex(101, 150, 50, 2) }),
    aluBlue: new THREE.MeshStandardMaterial({ color: 0x92a4ba, metalness: 0.6, roughness: 0.4, roughnessMap: noiseTex(102, 150, 50, 2) }),
    dark: new THREE.MeshStandardMaterial({ color: 0x5d5f62, roughness: 0.55, metalness: 0.3 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.9 }),
    label: new THREE.MeshStandardMaterial({ map: ladderLabel(), roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2 }),
    print: new THREE.MeshStandardMaterial({ color: 0x111111, alphaMap: railPrint(), transparent: true, roughness: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
  };
  return MATS;
}

// Escada de abrir. h = altura vertical; spreadF/spreadR = afastamento dos pés (frente/trás) em x local; largura em z.
export function stepLadder({ h = 1.45, steps = 5, spreadF = 0.26, spreadR = 0.2, wTop = 0.36, wBot = 0.46, tone = 'tan' } = {}) {
  const M = mats();
  const fiberMat = tone === 'dark' ? M.fiberDark : M.fiber;
  const fiber = [], alu = [], dark = [], rubber = [];
  const railD = 0.072, railW = 0.026;
  const topF = new THREE.Vector3(0.035, h - 0.04, 0), topR = new THREE.Vector3(-0.035, h - 0.04, 0);
  for (const s of [-1, 1]) {
    const zt = s * (wTop / 2), zb = s * (wBot / 2);
    fiber.push(beam(new THREE.Vector3(topF.x, topF.y, zt), new THREE.Vector3(spreadF, 0.03, zb), railD, railW));
    fiber.push(beam(new THREE.Vector3(topR.x, topR.y, zt * 0.97), new THREE.Vector3(-spreadR, 0.03, zb * 0.97), railD * 0.8, railW));
    // sapatas de borracha
    const sf = new THREE.BoxGeometry(0.085, 0.035, 0.04); sf.translate(spreadF + 0.004, 0.0175, zb); rubber.push(sf);
    const sr = new THREE.BoxGeometry(0.07, 0.035, 0.04); sr.translate(-spreadR - 0.004, 0.0175, zb * 0.97); rubber.push(sr);
    // barras de travamento (abridor) metálicas
    const yb = h * 0.42, kF = 1 - yb / h;
    alu.push(beam(new THREE.Vector3(topF.x + (spreadF - topF.x) * (1 - kF) - 0.01, yb, s * (wTop / 2 + 0.018)), new THREE.Vector3(topR.x - (spreadR + topR.x) * (1 - kF) + 0.01, yb + 0.02, s * (wTop / 2 + 0.018)), 0.012, 0.004));
  }
  // degraus (frente): planos, alumínio estriado
  for (let i = 1; i <= steps - 1; i++) {
    const y = (h - 0.04) * i / steps; const k = 1 - y / (h - 0.04);
    const x = topF.x + (spreadF - topF.x) * k, w = wTop + (wBot - wTop) * k;
    const st = new THREE.BoxGeometry(0.085, 0.022, w - railW * 1.2); st.translate(x - 0.006, y, 0); alu.push(st);
  }
  // travessas traseiras
  for (const y of [h * 0.28, h * 0.62]) {
    const k = 1 - y / (h - 0.04), x = topR.x - (spreadR + topR.x) * k, w = (wTop + (wBot - wTop) * k) * 0.97;
    const t = new THREE.BoxGeometry(0.03, 0.03, w - railW); t.translate(x, y, 0); fiber.push(t);
  }
  // topo (plataforma plástica)
  const cap = new THREE.BoxGeometry(0.15, 0.035, wTop + 0.04); cap.translate(0, h - 0.02, 0); dark.push(cap);
  const g = new THREE.Group(); g.name = 'escada_abrir';
  const add = (list, mat, cast = true) => { if (!list.length) return; const m = new THREE.Mesh(merge(list), mat); m.castShadow = cast; m.receiveShadow = true; g.add(m); };
  add(fiber, fiberMat); add(alu, M.alu); add(dark, M.dark); add(rubber, M.rubber, false);
  // etiquetas: adesivo na lateral externa dos montantes da frente + impressão vertical
  const railLen = Math.hypot(h - 0.07, spreadF - topF.x), ang = Math.atan2(spreadF - topF.x, h - 0.07);
  for (const s of [-1, 1]) {
    const zt = s * ((wTop + wBot) / 4 + railW / 2 + 0.0015);
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.055, 0.2), M.label);
    lab.position.set(topF.x + (spreadF - topF.x) * 0.3, (h - 0.04) * 0.7, zt); lab.rotation.set(0, s > 0 ? 0 : Math.PI, -ang * s);
    g.add(lab);
    const pr = new THREE.Mesh(new THREE.PlaneGeometry(0.05, railLen * 0.45), M.print);
    pr.position.set(topF.x + (spreadF - topF.x) * 0.62, (h - 0.04) * 0.38, zt); pr.rotation.set(0, s > 0 ? 0 : Math.PI, -ang * s);
    g.add(pr);
  }
  return g;
}

// Escada simples (alumínio azulado), apoiada: comprimento len, inclinação a (rad da vertical).
export function straightLadder({ len = 2.3, w = 0.4, rungs = 8, tilt = 0.2 } = {}) {
  const M = mats();
  const rails = [], rung = [], rub = [];
  const dx = Math.sin(tilt) * len, h = Math.cos(tilt) * len;
  for (const s of [-1, 1]) {
    rails.push(beam(new THREE.Vector3(0, 0.02, s * w / 2), new THREE.Vector3(-dx, h, s * w / 2), 0.065, 0.022));
    const f = new THREE.BoxGeometry(0.07, 0.03, 0.035); f.translate(0, 0.015, s * w / 2); rub.push(f);
  }
  for (let i = 1; i <= rungs; i++) {
    const t = i / (rungs + 1), c = new THREE.CylinderGeometry(0.014, 0.014, w, 10); c.rotateX(Math.PI / 2); c.translate(-dx * t, h * t, 0); rung.push(c);
  }
  const g = new THREE.Group(); g.name = 'escada_simples';
  const m1 = new THREE.Mesh(merge(rails), M.aluBlue), m2 = new THREE.Mesh(merge(rung), M.dark), m3 = new THREE.Mesh(merge(rub), M.rubber);
  m1.castShadow = m2.castShadow = true; m1.receiveShadow = m2.receiveShadow = true; g.add(m1, m2, m3);
  return g;
}
