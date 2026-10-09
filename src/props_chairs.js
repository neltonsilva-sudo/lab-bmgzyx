// DONO: agente "acessórios". Cadeira fixa de escritório preta (assento/encosto estofados, estrutura tubular em trapézio, sapatas).
import * as THREE from 'three';
import { tube, merge, cyl, RoundedBoxGeometry } from './props_util.js?v=20261009092129';
import { fabricMaps, noiseTex } from './props_tex.js?v=20261009092129';

let GEO = null, MAT = null;

function superShape(a, b, n, seg = 64) {
  const sh = new THREE.Shape();
  for (let i = 0; i <= seg; i++) {
    const t = i / seg * Math.PI * 2, c = Math.cos(t), si = Math.sin(t);
    const x = a * Math.sign(c) * Math.abs(c) ** (2 / n), y = b * Math.sign(si) * Math.abs(si) ** (2 / n);
    i ? sh.lineTo(x, y) : sh.moveTo(x, y);
  }
  return sh;
}
// Almofada estofada: forma superelíptica extrudada com chanfro arredondado; espessura em +y, abaulada no topo.
function cushion(w, d, t, n, bevel, dome) {
  const g = new THREE.ExtrudeGeometry(superShape(w / 2 - bevel, d / 2 - bevel, n), { depth: t - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5, curveSegments: 64 });
  g.rotateX(-Math.PI / 2); g.translate(0, bevel, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / (w / 2), y = p.getY(i), z = p.getZ(i) / (d / 2);
    const k = Math.max(0, 1 - x * x) * Math.max(0, 1 - z * z);
    const sink = Math.exp(-((x * 1.3) ** 2 + ((z - 0.15) * 1.6) ** 2)) * dome * 0.5;
    p.setY(i, y + (y / t) * (dome * k - sink));
  }
  g.computeVertexNormals();
  return g;
}

function build() {
  const fab = fabricMaps();
  MAT = {
    fabric: new THREE.MeshStandardMaterial({ color: 0x2a2a2c, map: fab.col, roughness: 0.9, roughnessMap: fab.rough, normalMap: fab.nrm, normalScale: new THREE.Vector2(0.55, 0.55) }),
    frame: new THREE.MeshPhysicalMaterial({ color: 0x111112, roughness: 0.55, metalness: 0.3, clearcoat: 0.15, clearcoatRoughness: 0.5, roughnessMap: noiseTex(81, 150, 50, 3) }),
    shell: new THREE.MeshStandardMaterial({ color: 0x161617, roughness: 0.82, metalness: 0.0, roughnessMap: noiseTex(82, 160, 40, 2) }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.85 }),
  };
  // ── estofados (assento + encosto oval)
  const seat = cushion(0.46, 0.43, 0.058, 3.6, 0.02, 0.012); seat.translate(0, 0.418, 0.015);
  const bend = (g, k) => { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, p.getZ(i) - k * x * x); } g.computeVertexNormals(); };
  const back = cushion(0.375, 0.31, 0.05, 2.5, 0.018, 0.008);
  back.rotateX(Math.PI / 2); // topo abaulado → frente (+z)... após girar, espessura vai para -z
  bend(back, 0.3); back.rotateX(-0.13); back.translate(0, 0.785, -0.27);
  const fabric = merge([seat, back]);
  // ── carenagens plásticas (sob o assento e atrás do encosto)
  const shSeat = cushion(0.43, 0.40, 0.016, 3.6, 0.006, 0); shSeat.translate(0, 0.404, 0.015);
  const shBack = cushion(0.35, 0.285, 0.014, 2.5, 0.005, 0); shBack.rotateX(Math.PI / 2);
  bend(shBack, 0.3); shBack.rotateX(-0.13); shBack.translate(0, 0.785, -0.286);
  const shell = merge([shSeat, shBack]);
  // ── estrutura tubular em trapézio (dois laterais dobrados + travessas + barra do encosto)
  const r = 0.0105, parts = [];
  for (const s of [-1, 1]) {
    parts.push(tube([[s * 0.245, 0.012, 0.235], [s * 0.2, 0.405, 0.185], [s * 0.2, 0.405, -0.17], [s * 0.245, 0.012, -0.225]], r, 0.05, 64, 10));
  }
  // travessas sob o assento
  for (const z of [0.15, -0.13]) { const t = new THREE.CylinderGeometry(r * 0.9, r * 0.9, 0.4, 10); t.rotateZ(Math.PI / 2); t.translate(0, 0.405, z); parts.push(t); }
  // travessa baixa entre as pernas traseiras (reforço)
  { const t = new THREE.CylinderGeometry(r * 0.8, r * 0.8, 0.45, 10); t.rotateZ(Math.PI / 2); t.translate(0, 0.16, -0.19); parts.push(t); }
  // hastes do encosto: dois tubos curvos saindo da traseira do assento até o verso do encosto
  for (const s of [-1, 1]) {
    parts.push(tube(new THREE.CatmullRomCurve3([[s * 0.2, 0.405, -0.1], [s * 0.2, 0.41, -0.2], [s * 0.19, 0.46, -0.27], [s * 0.165, 0.58, -0.3], [s * 0.13, 0.7, -0.3], [s * 0.1, 0.76, -0.284]].map((p) => new THREE.Vector3(...p))), r * 0.95, 0, 40, 8));
    // travessa lateral baixa entre perna dianteira e traseira
    parts.push(tube([[s * 0.232, 0.13, 0.205], [s * 0.232, 0.13, -0.193]], r * 0.8, 0, 2, 8));
  }
  const frame = merge(parts);
  const feet = [];
  for (const s of [-1, 1]) for (const z of [0.236, -0.226]) feet.push(cyl(0.0135, 0.0155, 0.02, s * 0.246, 0.01, z, 12));
  const rubber = merge(feet);
  GEO = { fabric, shell, frame, rubber };
}

// list: [{x, z, ry}] → { group, meshes, state, apply(i) }. Estado por instância (x, z, ry, visible) para mover/retirar cadeiras.
export function buildChairs(list) {
  if (!GEO) build();
  const g = new THREE.Group(); g.name = 'cadeiras';
  const n = list.length;
  const mk = (geo, mat, cast) => { const m = new THREE.InstancedMesh(geo, mat, n); m.castShadow = cast; m.receiveShadow = true; m.userData.chairs = true; return m; };
  const meshes = [mk(GEO.fabric, MAT.fabric, true), mk(GEO.shell, MAT.shell, true), mk(GEO.frame, MAT.frame, true), mk(GEO.rubber, MAT.rubber, false)];
  const state = list.map((c) => ({ x: c.x, z: c.z, ry: c.ry || 0, visible: true }));
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3();
  const apply = (i, refresh = true) => {
    const c = state[i];
    e.set(0, c.ry, 0); q.setFromEuler(e); P.set(c.x, 0, c.z); S.setScalar(c.visible ? 1 : 0);
    M.compose(P, q, S);
    meshes.forEach((m) => { m.setMatrixAt(i, M); if (refresh) { m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); } });
  };
  for (let i = 0; i < n; i++) apply(i, false);
  meshes.forEach((m) => { m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); g.add(m); });
  return { group: g, meshes, state, apply };
}

// Caixa local da cadeira (para box(id)).
export const CHAIR_BOX = new THREE.Box3(new THREE.Vector3(-0.26, 0, -0.32), new THREE.Vector3(0.26, 0.93, 0.26));
