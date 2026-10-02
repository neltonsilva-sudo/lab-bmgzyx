// DONO: orquestrador. Câmera, controles (órbita / caminhar), vistas das fotos, pontos de interesse, comparação cega.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as L from './layout.js';
import { createRenderer, buildLighting } from './render.js';
import { buildRoom } from './room.js';
import { buildBooths } from './booths.js';
import { buildBenches } from './benches.js';
import { buildCenter } from './center.js';
import { buildProps } from './props.js';
import { buildUI } from './ui.js';

const Q = new URLSearchParams(location.search);
const canvas = document.getElementById('c');
const R = createRenderer(canvas);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.03, 80);
const ctx = { THREE, renderer: R.renderer, scene, camera, layout: L, q: Q.get('q') || 'high' };

const parts = {};
ctx.parts = parts;
for (const [k, fn] of Object.entries({ room: buildRoom, booths: buildBooths, benches: buildBenches, center: buildCenter, props: buildProps, light: buildLighting })) {
  try { parts[k] = fn(scene, ctx) || {}; } catch (e) { console.error('falha ao montar', k, e); parts[k] = {}; }
}

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.495; controls.minDistance = 0.3; controls.maxDistance = 30;

let tween = null;
function setCam(name, instant) {
  let c = typeof name === 'object' ? name : L.CAMS[name];
  if (name === 'orbit') {
    const ang = +(Q.get('ang') || 30) * Math.PI / 180, r = +(Q.get('r') || 4), h = +(Q.get('h') || 1.6);
    const tx = +(Q.get('tx') || L.ROOM.W / 2), ty = +(Q.get('ty') || 1.0), tz = +(Q.get('tz') || L.ROOM.D / 2);
    c = { pos: [tx + Math.sin(ang) * r, h, tz + Math.cos(ang) * r], look: [tx, ty, tz], fov: +(Q.get('fov') || 55) };
  }
  if (!c) return;
  const to = { p: new THREE.Vector3(...c.pos), t: new THREE.Vector3(...c.look), fov: c.fov };
  if (instant) { camera.position.copy(to.p); controls.target.copy(to.t); camera.fov = to.fov; camera.updateProjectionMatrix(); return; }
  tween = { k: 0, p0: camera.position.clone(), t0: controls.target.clone(), f0: camera.fov, to };
}
setCam(Q.get('cam') || 'foto3', true);

// Caminhar (WASD + arrastar para olhar), preso dentro da sala.
const keys = {};
let walk = false;
addEventListener('keydown', (e) => { keys[e.code] = true; });
addEventListener('keyup', (e) => { keys[e.code] = false; });
function walkStep(dt) {
  const f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
  const s = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  if (!f && !s) return;
  const dir = new THREE.Vector3().subVectors(controls.target, camera.position); dir.y = 0; dir.normalize();
  const side = new THREE.Vector3(-dir.z, 0, dir.x);
  const mv = dir.multiplyScalar(f).add(side.multiplyScalar(s)).multiplyScalar(1.6 * dt * (keys.ShiftLeft ? 2 : 1));
  const np = camera.position.clone().add(mv);
  np.x = THREE.MathUtils.clamp(np.x, 0.35, L.ROOM.W - 0.35); np.z = THREE.MathUtils.clamp(np.z, 0.35, L.ROOM.D - 0.35);
  mv.subVectors(np, camera.position);
  camera.position.add(mv); controls.target.add(mv);
}
function setWalk(on) {
  walk = on;
  if (on) {
    const d = new THREE.Vector3().subVectors(controls.target, camera.position); d.y = 0; d.setLength(0.6);
    camera.position.y = 1.65; if (camera.position.x < 0.35 || camera.position.x > L.ROOM.W - 0.35 || camera.position.z < 0.35 || camera.position.z > L.ROOM.D - 0.35) camera.position.set(L.CAMS.foto3.pos[0], 1.65, L.CAMS.foto3.pos[2]);
    controls.target.copy(camera.position).add(d); controls.target.y = 1.55;
    controls.minDistance = controls.maxDistance = 0.6; controls.enablePan = false; controls.rotateSpeed = -0.35;
  } else { controls.minDistance = 0.3; controls.maxDistance = 30; controls.enablePan = true; controls.rotateSpeed = 1; }
}

const hotspots = [parts.benches, parts.booths, parts.center, parts.props, parts.room].flatMap((p) => p.hotspots || []);
const ui = Q.get('ui') === '0' ? null : buildUI({ THREE, L, camera, controls, canvas, scene, hotspots, setCam, setWalk, cams: Object.keys(L.CAMS), q: Q, render: R, parts });

function resize() { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); R.resize(innerWidth, innerHeight); }
addEventListener('resize', resize); resize();

const clock = new THREE.Clock();
let frames = 0, acc = 0;
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (tween) {
    tween.k = Math.min(1, tween.k + dt / 1.2); const e = tween.k * tween.k * (3 - 2 * tween.k);
    camera.position.lerpVectors(tween.p0, tween.to.p, e); controls.target.lerpVectors(tween.t0, tween.to.t, e);
    camera.fov = THREE.MathUtils.lerp(tween.f0, tween.to.fov, e); camera.updateProjectionMatrix();
    if (tween.k >= 1) tween = null;
  }
  if (walk) walkStep(dt);
  if (!(ui && ui.vrActive && ui.vrActive())) controls.update();
  for (const p of Object.values(parts)) p.update && p.update(dt, clock.elapsedTime);
  ui && ui.update(dt);
  if (ui) ui.draw(); else R.render(scene, camera);
  frames++; acc += dt; if (acc > 1) { window.__fps = Math.round(frames / acc); frames = 0; acc = 0; }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__twin = { scene, camera, controls, renderer: R.renderer, parts, setCam, L };
window.__ready = true;
