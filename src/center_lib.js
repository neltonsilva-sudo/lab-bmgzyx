// DONO: agente "centro-solar". Utilitários: lote de geometrias (merge por material), texturas procedurais em canvas,
// ambiente de reflexo (luminárias do teto), perfil de alumínio estrutural com ranhura em "T", rodízios.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
export function mtx(x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  return new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
}

// Lote: acumula geometrias transformadas e funde uma malha por (material, sombra).
export class Batch {
  constructor() { this.map = new Map(); this.base = null; }
  within(m, fn) { const old = this.base; this.base = old ? old.clone().multiply(m) : m; fn(); this.base = old; }
  add(geo, mat, m, cast = false) {
    const k = mat.uuid + (cast ? 'c' : '');
    let e = this.map.get(k); if (!e) { e = { mat, cast, list: [] }; this.map.set(k, e); }
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const a of Object.keys(g.attributes)) if (a !== 'position' && a !== 'normal' && a !== 'uv') g.deleteAttribute(a);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.attributes.normal) g.computeVertexNormals();
    g.applyMatrix4(this.base ? this.base.clone().multiply(m) : m); e.list.push(g);
  }
  box(mat, w, h, d, x, y, z, rx = 0, ry = 0, rz = 0, cast = false) { this.add(BOX, mat, mtx(x, y, z, rx, ry, rz, w, h, d), cast); }
  cyl(mat, r, h, x, y, z, rx = 0, ry = 0, rz = 0, cast = false, seg = 16) { this.add(cylGeo(seg), mat, mtx(x, y, z, rx, ry, rz, r, h, r), cast); }
  build(parent, name = 'lote') {
    for (const e of this.map.values()) {
      const geo = mergeGeometries(e.list, false); e.list.forEach((g) => g.dispose());
      const mesh = new THREE.Mesh(geo, e.mat); mesh.name = name + ':' + (e.mat.name || 'mat');
      mesh.castShadow = e.cast; mesh.receiveShadow = true; parent.add(mesh);
    }
    this.map.clear();
  }
}
export const BOX = new THREE.BoxGeometry(1, 1, 1);
const _cyl = {};
export function cylGeo(seg = 16) { return _cyl[seg] || (_cyl[seg] = new THREE.CylinderGeometry(1, 1, 1, seg, 1)); }

// Perfil de alumínio 40x40 com ranhura em T nas 4 faces (seção extrudada).
let _prof;
function profileShape(s = 0.02, w = 0.0042, d = 0.0055, c = 0.0015) {
  const sh = new THREE.Shape();
  const P = [[-s + c, -s], [-w, -s], [-w, -s + d], [w, -s + d], [w, -s], [s - c, -s], [s, -s + c], [s, -w], [s - d, -w], [s - d, w], [s, w], [s, s - c],
    [s - c, s], [w, s], [w, s - d], [-w, s - d], [-w, s], [-s + c, s], [-s, s - c], [-s, w], [-s + d, w], [-s + d, -w], [-s, -w], [-s, -s + c]];
  sh.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) sh.lineTo(P[i][0], P[i][1]); sh.closePath();
  return sh;
}
function profGeo() {
  if (_prof) return _prof;
  _prof = new THREE.ExtrudeGeometry(profileShape(), { depth: 1, bevelEnabled: false, steps: 1 });
  _prof.translate(0, 0, -0.5); // comprimento unitário centrado em z
  return _prof;
}
// Barra de perfil entre dois pontos quaisquer (eixo do perfil = segmento a→b). roll gira em torno do eixo.
const _z = new THREE.Vector3(0, 0, 1), _d = new THREE.Vector3(), _qr = new THREE.Quaternion();
export function profile(batch, mat, a, b, size = 1, cast = true, sy = 1) {
  _d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const L = _d.length(); _d.normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(_z, _d);
  const m = new THREE.Matrix4().compose(new THREE.Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, new THREE.Vector3(size, size * sy, L));
  batch.add(profGeo(), mat, m, cast);
}
// Tubo retangular/quadrado genérico entre dois pontos (caixa alongada).
export function bar(batch, mat, a, b, w, h = w, cast = false) {
  _d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const L = _d.length(); _d.normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(_z, _d);
  batch.add(BOX, mat, new THREE.Matrix4().compose(new THREE.Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, new THREE.Vector3(w, h, L)), cast);
}

// Rodízio giratório: placa, garfo, roda de borracha, cubo.
export function caster(batch, M, x, y0, z, r = 0.038, yaw = 0, brake = false) {
  // y0 = altura da placa superior (base do móvel); roda toca o chão.
  const wz = Math.sin(yaw) * 0.012, wx = Math.cos(yaw) * 0.012;
  batch.box(M.zinc, 0.06, 0.006, 0.06, x, y0 - 0.003, z);
  batch.cyl(M.zinc, 0.012, 0.012, x, y0 - 0.012, z);
  const fh = y0 - 0.018 - r;
  batch.box(M.zinc, 0.004, y0 - 0.018 - r * 0.6, 0.03, x - 0.014, (y0 - 0.018 + r * 0.6) / 2 + 0.002, z + wz, 0, yaw, 0);
  batch.box(M.zinc, 0.004, y0 - 0.018 - r * 0.6, 0.03, x + 0.014, (y0 - 0.018 + r * 0.6) / 2 + 0.002, z + wz, 0, yaw, 0);
  batch.add(cylGeo(18), M.rubber, mtx(x, r, z + wz, 0, yaw, Math.PI / 2, r, 0.022, r), false);
  batch.add(cylGeo(10), M.zinc, mtx(x, r, z + wz, 0, yaw, Math.PI / 2, r * 0.35, 0.03, r * 0.35), false);
  if (brake) batch.box(M.red, 0.02, 0.008, 0.03, x, r * 2 + 0.004, z + wz + 0.03);
  return fh + wx * 0;
}

// ---------- Canvas / texturas ----------
export function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
export function tex(c, srgb = true, rep = false, aniso = 8) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = aniso; if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true; return t;
}
// Ruído determinístico.
export function rng(seed = 1) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// Mapa de rugosidade com manchas, riscos, poeira (valores cinza: 0 liso … 255 áspero).
export function roughMap(w, h, base, opts = {}) {
  const [c, x] = canvas(w, h); const R = rng(opts.seed || 7);
  x.fillStyle = `rgb(${base},${base},${base})`; x.fillRect(0, 0, w, h);
  const blobs = opts.blobs ?? 60;
  for (let i = 0; i < blobs; i++) {
    const cx = R() * w, cy = R() * h, r = (0.03 + R() * 0.18) * Math.max(w, h), v = base + (R() - 0.5) * (opts.blobAmp ?? 50);
    const gr = x.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, `rgba(${v | 0},${v | 0},${v | 0},0.35)`); gr.addColorStop(1, `rgba(${v | 0},${v | 0},${v | 0},0)`);
    x.fillStyle = gr; x.fillRect(cx - r, cy - r, 2 * r, 2 * r);
  }
  // marcas de pano (arcos) e digitais
  for (let i = 0; i < (opts.wipes ?? 20); i++) {
    const v = base + 30 + R() * 40; x.strokeStyle = `rgba(${v | 0},${v | 0},${v | 0},0.12)`; x.lineWidth = 2 + R() * 10;
    x.beginPath(); const cx = R() * w, cy = R() * h, r = 20 + R() * w * 0.2, a = R() * 6; x.arc(cx, cy, r, a, a + 0.6 + R() * 1.5); x.stroke();
  }
  for (let i = 0; i < (opts.scratches ?? 120); i++) {
    const v = base + (R() > 0.5 ? 60 : -40); x.strokeStyle = `rgba(${v | 0},${v | 0},${v | 0},${0.15 + R() * 0.3})`; x.lineWidth = 0.6 + R() * 0.8;
    const x0 = R() * w, y0 = R() * h, a = (opts.scrDir ?? R() * 6.28) + (R() - 0.5) * 0.6, L = 5 + R() * (opts.scrLen ?? 60);
    x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + Math.cos(a) * L, y0 + Math.sin(a) * L); x.stroke();
  }
  const id = x.getImageData(0, 0, w, h), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (R() - 0.5) * (opts.grain ?? 14); d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  x.putImageData(id, 0, 0);
  return tex(c, false, !!opts.rep);
}

// Ambiente de reflexo próprio: caixa da sala com piso azul, paredes claras e fileiras de luminárias tubulares (HDR).
export function makeEnv(renderer) {
  const s = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(11, 2.85, 14),
    [0.3, 0.3, 0.42, 0.1, 0.3, 0.3].map((v, i) => new THREE.MeshBasicMaterial({ color: i === 3 ? new THREE.Color(0.05, 0.07, 0.11) : new THREE.Color(v, v, v * 1.02), side: THREE.BackSide })));
  room.position.y = 0.2; s.add(room);
  const tubeM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1.03).multiplyScalar(9) });
  const bodyM = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.9, 0.9, 0.9) });
  for (let ix = -2; ix <= 2; ix++) for (let iz = -3; iz <= 3; iz++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 1.3), bodyM); b.position.set(ix * 2.2, 1.6, iz * 2.0); s.add(b);
    for (const o of [-0.06, 0.06]) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 1.2), tubeM); t.position.set(ix * 2.2 + o, 1.57, iz * 2.0); s.add(t); }
  }
  // bancadas amarelas/brancas à direita e cabines à esquerda (manchas de cor no reflexo)
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(s, 0.015); pm.dispose();
  s.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
  return rt.texture;
}

// Texto utilitário
export function txt(x, s, px, cx, cy, col = '#fff', align = 'center', weight = '600') {
  x.font = `${weight} ${px}px Arial, Helvetica, sans-serif`; x.fillStyle = col; x.textAlign = align; x.textBaseline = 'middle'; x.fillText(s, cx, cy);
}
export function rrect(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
