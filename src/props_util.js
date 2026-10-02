// DONO: agente "acessórios". Utilitários de geometria (tubos dobrados, merge, caixas arredondadas).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export { mergeGeometries, RoundedBoxGeometry };

// Polilinha com cantos arredondados (raio bend) → CurvePath 3D.
export function bentPath(pts, bend = 0.03) {
  const P = pts.map((p) => (p.isVector3 ? p.clone() : new THREE.Vector3(...p)));
  const path = new THREE.CurvePath();
  let cur = P[0].clone();
  for (let i = 1; i < P.length; i++) {
    const a = P[i - 1], b = P[i];
    if (i < P.length - 1) {
      const c = P[i + 1];
      const d1 = b.clone().sub(a), d2 = c.clone().sub(b);
      const r = Math.min(bend, d1.length() * 0.45, d2.length() * 0.45);
      const p1 = b.clone().sub(d1.normalize().multiplyScalar(r));
      const p2 = b.clone().add(d2.normalize().multiplyScalar(r));
      if (cur.distanceTo(p1) > 1e-5) path.add(new THREE.LineCurve3(cur.clone(), p1));
      path.add(new THREE.QuadraticBezierCurve3(p1, b.clone(), p2));
      cur = p2;
    } else if (cur.distanceTo(b) > 1e-5) path.add(new THREE.LineCurve3(cur.clone(), b.clone()));
  }
  return path;
}

export function tube(pts, r, bend = 0.03, seg = 48, radial = 8) {
  const path = pts instanceof THREE.Curve ? pts : bentPath(pts, bend);
  const g = new THREE.TubeGeometry(path, seg, r, radial, false);
  return g;
}

// Remove atributos que atrapalham o merge (garante uv + normal + position, sem index misto).
export function norm(g) {
  const n = g.index ? g.toNonIndexed() : g;
  for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(k)) n.deleteAttribute(k);
  if (!n.attributes.uv) n.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2));
  return n;
}

export function merge(list) { return mergeGeometries(list.map(norm), false); }

export function box(w, h, d, x = 0, y = 0, z = 0, ry = 0) {
  const g = new THREE.BoxGeometry(w, h, d); if (ry) g.rotateY(ry); g.translate(x, y, z); return g;
}
export function cyl(rt, rb, h, x = 0, y = 0, z = 0, seg = 16) {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg); g.translate(x, y, z); return g;
}

// Disco de sombra de contato (AO falso) sob objetos apoiados no piso.
let _aoTex = null;
export function contactShadow(w, d, opacity = 0.55) {
  if (!_aoTex) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, '#fff'); g.addColorStop(0.5, '#777'); g.addColorStop(1, '#000');
    x.fillStyle = '#000'; x.fillRect(0, 0, 128, 128); x.fillStyle = g; x.fillRect(0, 0, 128, 128); _aoTex = new THREE.CanvasTexture(c);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ alphaMap: _aoTex, transparent: true, opacity, depthWrite: false, color: 0x000000, roughness: 1, metalness: 0, envMapIntensity: 0, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.002; m.renderOrder = 1; m.name = 'ao';
  return m;
}
