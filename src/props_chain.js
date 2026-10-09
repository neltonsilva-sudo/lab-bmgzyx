// DONO: agente "acessórios". Pedestais sinalizadores (poste listrado preto/amarelo, base cônica preta, topo com ganchos)
// e correntes plásticas amarelas/pretas em catenária, instanciadas.
import * as THREE from 'three';
import { merge, cyl } from './props_util.js?v=20261009091201';
import { stanchionStripeMap, noiseTex } from './props_tex.js?v=20261009091201';

const POLE_H = 0.93, POLE_R = 0.029, HOOK_Y = 0.875;

function pedestalGeos() {
  // base cônica (sino) de plástico preto, lastreada
  const prof = [[0, 0], [0.172, 0], [0.176, 0.005], [0.175, 0.018], [0.165, 0.03], [0.128, 0.08], [0.09, 0.13], [0.055, 0.18], [0.04, 0.215], [0.034, 0.24], [0, 0.24]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const base = new THREE.LatheGeometry(prof, 40);
  // tampa superior + colar dos ganchos
  const capProf = [[0, POLE_H + 0.018], [0.03, POLE_H + 0.018], [0.034, POLE_H + 0.012], [0.034, POLE_H - 0.004], [0.031, POLE_H - 0.01], [0.031, HOOK_Y - 0.03], [0.033, HOOK_Y - 0.034], [0.033, HOOK_Y + 0.03], [0.031, HOOK_Y + 0.034], [0, HOOK_Y + 0.034]]
    .reverse().map(([x, y]) => new THREE.Vector2(x, y));
  const cap = new THREE.LatheGeometry(capProf, 32);
  // ganchos em "C" (dois, opostos) — orientados depois por pedestal
  const hooks = [];
  for (const s of [-1, 1]) {
    const t = new THREE.TorusGeometry(0.014, 0.0035, 6, 14, Math.PI * 1.5);
    t.rotateY(Math.PI / 2); t.rotateX(Math.PI * 0.25); t.translate(s * 0.046, HOOK_Y + 0.004, 0);
    const lug = new THREE.BoxGeometry(0.018, 0.012, 0.01); lug.translate(s * 0.037, HOOK_Y + 0.016, 0);
    hooks.push(t, lug);
  }
  const top = merge([cap, ...hooks]);
  const pole = new THREE.CylinderGeometry(POLE_R, POLE_R, POLE_H - 0.2, 28, 1, true); pole.translate(0, 0.2 + (POLE_H - 0.2) / 2, 0);
  return { base, top, pole };
}

// Elo de corrente plástica: anel oval (estádio) — comprimento externo ~5 cm.
function linkGeo() {
  const L = 0.026, R = 0.0118, r = 0.0048; // meio-comprimento reto, raio da curva, raio do fio
  const shape = new THREE.CurvePath();
  const arc = (cx, a0) => new THREE.EllipseCurve(cx, 0, R, R, a0, a0 + Math.PI, false, 0);
  const pts = [];
  const N = 14;
  for (let i = 0; i <= N; i++) { const a = -Math.PI / 2 + Math.PI * i / N; pts.push(new THREE.Vector3(L / 2 + Math.cos(a) * R, Math.sin(a) * R, 0)); }
  for (let i = 0; i <= N; i++) { const a = Math.PI / 2 + Math.PI * i / N; pts.push(new THREE.Vector3(-L / 2 + Math.cos(a) * R, Math.sin(a) * R, 0)); }
  const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
  const g = new THREE.TubeGeometry(curve, 40, r, 6, true);
  // leve achatamento (elo plástico injetado tem seção oval)
  g.scale(1, 1, 0.8);
  return { g, pitch: L + 2 * R - 2 * r * 1.15 };
}

// Catenária entre a e b com comprimento de corrente len (>|ab|). Retorna função t→ponto (t em comprimento de arco).
function catenary(a, b, len) {
  const dx = Math.hypot(b.x - a.x, b.z - a.z), dy = b.y - a.y;
  const horiz = new THREE.Vector3(b.x - a.x, 0, b.z - a.z).normalize();
  // resolve parâmetro c da catenária: sqrt(len²-dy²) = 2c sinh(dx/2c)
  const target = Math.sqrt(Math.max(len * len - dy * dy, dx * dx * 1.0001));
  let lo = 1e-3, hi = 100;
  for (let i = 0; i < 80; i++) { const c = (lo + hi) / 2; if (2 * c * Math.sinh(dx / (2 * c)) > target) lo = c; else hi = c; }
  const c = (lo + hi) / 2;
  // deslocamento horizontal do vértice
  const x0 = dx / 2 - c * Math.asinh(dy / (2 * c * Math.sinh(dx / (2 * c))));
  const y = (x) => c * Math.cosh((x - x0) / c);
  const y0 = a.y - y(0);
  const N = 400, samples = [];
  for (let i = 0; i <= N; i++) { const x = dx * i / N; samples.push(new THREE.Vector3(a.x + horiz.x * x, y0 + y(x), a.z + horiz.z * x)); }
  const acc = [0]; for (let i = 1; i <= N; i++) acc.push(acc[i - 1] + samples[i].distanceTo(samples[i - 1]));
  const total = acc[N];
  const at = (s) => {
    s = Math.min(Math.max(s, 0), total);
    let lo2 = 0, hi2 = N; while (hi2 - lo2 > 1) { const m = (lo2 + hi2) >> 1; if (acc[m] < s) lo2 = m; else hi2 = m; }
    const f = (s - acc[lo2]) / Math.max(1e-9, acc[hi2] - acc[lo2]);
    return samples[lo2].clone().lerp(samples[hi2], f);
  };
  return { at, total };
}

// posts: [{x,z}] ; spans: [{from:[x,y,z] | idx, to: idx, sag}] ; pattern de cores por trecho.
export function buildStanchions({ posts, spans, wallAnchors = [], q = 'high' }) {
  const g = new THREE.Group(); g.name = 'pedestais_correntes';
  const G = pedestalGeos();
  const stripe = stanchionStripeMap();
  const matPole = new THREE.MeshStandardMaterial({ map: stripe, roughness: 0.7, metalness: 0, roughnessMap: noiseTex(91, 190, 50, 2) });
  const matBlack = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.55, roughnessMap: noiseTex(92, 150, 60, 2) });
  const matBase = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7, roughnessMap: noiseTex(93, 150, 70, 3) });
  const n = posts.length;
  const iBase = new THREE.InstancedMesh(G.base, matBase, n), iPole = new THREE.InstancedMesh(G.pole, matPole, n), iTop = new THREE.InstancedMesh(G.top, matBlack, n);
  [iBase, iPole, iTop].forEach((m) => { m.castShadow = true; m.receiveShadow = true; });
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(1, 1, 1);
  posts.forEach((p, i) => {
    Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.ry || 0);
    M.compose(new THREE.Vector3(p.x, 0, p.z), Q, S);
    iBase.setMatrixAt(i, M); iTop.setMatrixAt(i, M);
    Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (p.ry || 0) + i * 1.7); // listras com fase diferente
    M.compose(new THREE.Vector3(p.x, 0, p.z), Q, S); iPole.setMatrixAt(i, M);
  });
  g.add(iBase, iPole, iTop);

  // ── correntes
  const { g: lg, pitch } = linkGeo();
  const links = [];
  const hookPt = (i, towards) => {
    const p = posts[i], d = new THREE.Vector3(towards.x - p.x, 0, towards.z - p.z).normalize();
    return new THREE.Vector3(p.x + d.x * 0.048, HOOK_Y - 0.004, p.z + d.z * 0.048);
  };
  const up = new THREE.Vector3(0, 1, 0);
  spans.forEach((s, si) => {
    const pB = posts[s.to];
    const a = s.wall ? new THREE.Vector3(...s.wall) : hookPt(s.from, pB);
    const b = hookPt(s.to, s.wall ? { x: s.wall[0], z: s.wall[2] } : posts[s.from]);
    const len = a.distanceTo(b) * (s.slack || 1.18);
    const cat = catenary(a, b, len);
    const count = Math.floor(cat.total / pitch);
    const runs = s.runs || [[14, 'y'], [9, 'k'], [40, 'y']];
    const colorAt = (k) => { let acc = 0; for (let r = 0; ; r = (r + 1) % runs.length) { acc += runs[r][0]; if (k < acc) return runs[r][1]; } };
    const off = (cat.total - count * pitch) / 2;
    for (let k = 0; k < count; k++) {
      const s0 = off + k * pitch, s1 = s0 + pitch;
      const p0 = cat.at(s0), p1 = cat.at(s1), mid = p0.clone().add(p1).multiplyScalar(0.5);
      const dir = p1.clone().sub(p0).normalize();
      // eixo X do elo = tangente; alterna o plano 90° a cada elo, com leve torção aleatória
      const side = new THREE.Vector3().crossVectors(dir, up).normalize();
      const roll = (k % 2 ? Math.PI / 2 : 0) + Math.sin(si * 7.1 + k * 1.37) * 0.25;
      const n1 = new THREE.Vector3().crossVectors(side, dir).normalize();
      const yv = n1.clone().multiplyScalar(Math.cos(roll)).add(side.clone().multiplyScalar(Math.sin(roll)));
      const zv = new THREE.Vector3().crossVectors(dir, yv);
      const m = new THREE.Matrix4().makeBasis(dir, yv, zv).setPosition(mid);
      links.push({ m, c: colorAt(k) });
    }
  });
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, metalness: 0, roughnessMap: noiseTex(94, 200, 40, 4) });
  const im = new THREE.InstancedMesh(lg, mat, links.length);
  const cY = new THREE.Color(0xd9a91c), cK = new THREE.Color(0x141414);
  links.forEach((l, i) => { im.setMatrixAt(i, l.m); im.setColorAt(i, l.c === 'y' ? cY.clone().offsetHSL(0, 0, (Math.sin(i * 12.9) * 0.03)) : cK); });
  im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.castShadow = q !== 'low'; im.receiveShadow = true; im.computeBoundingSphere();
  g.add(im);
  // chapinhas de parede (olhal) para as correntes presas na parede
  spans.filter((s) => s.wall).forEach((s) => {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.05, 0.035), matBlack);
    plate.position.set(...s.wall); plate.position.x -= 0.004; g.add(plate);
  });
  return g;
}
