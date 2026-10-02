// DONO: agente "luz-render". Lista normalizada das luminárias (lida do dono "sala" quando existir) e, na falta dela,
// luminárias de reserva (carcaça branca + 2 tubos emissivos) em fileiras ao longo de z.
import * as THREE from 'three';

// Normaliza {pos:[x,y,z]|Vector3, len, dir:'x'|'z'|Vector3} → {pos:Vector3, len, axis:'x'|'z'}
function norm(f, H) {
  const p = f.pos || f.position || f;
  const pos = p.isVector3 ? p.clone() : new THREE.Vector3(p[0] ?? p.x, p[1] ?? p.y ?? H - 0.08, p[2] ?? p.z);
  if (!(pos.y > 0.5)) pos.y = H - 0.08;
  let axis = 'z';
  const d = f.dir ?? f.axis;
  if (d === 'x' || (d && (d.isVector3 || Array.isArray(d)) && Math.abs(d.x ?? d[0]) > Math.abs(d.z ?? d[2]))) axis = 'x';
  return { pos, len: f.len || f.length || 1.24, axis };
}

export function findFixtures(scene, ctx) {
  const H = ctx.layout.ROOM.H;
  scene.updateMatrixWorld(true);
  const room = scene.getObjectByName('room');
  const src = ctx.parts?.room?.fixtures || room?.userData?.fixtures;
  if (Array.isArray(src) && src.length) return { list: src.map((f) => norm(f, H)), own: false, tubes: findTubes(scene) };
  // Sem lista explícita: extrai as posições das instâncias dos tubos da sala (InstancedMesh 'room-tubes').
  const tubes = findTubes(scene);
  const im = tubes.find((o) => o.isInstancedMesh);
  if (im) {
    const m = new THREE.Matrix4(), v = new THREE.Vector3(), list = [];
    for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, m); v.setFromMatrixPosition(m); im.localToWorld(v); list.push({ pos: v.clone(), len: 1.24, axis: 'z' }); }
    if (list.length) return { list, own: false, tubes };
  }
  return { list: fallbackLayout(ctx.layout), own: true };
}

// Malhas de tubos emissivos já existentes na cena (dono "sala").
export function findTubes(scene) {
  const out = [];
  scene.traverse((o) => { if (o.isMesh && (o.name === 'room-tubes' || o.material?.name === 'room-tube')) out.push(o); });
  return out;
}

// Fileiras prováveis (fotos): 4 colunas em x, 5–6 luminárias por coluna ao longo de z, eixo longo em z.
export function fallbackLayout(L) {
  const { W, D, H } = L.ROOM;
  // 4 colunas distribuídas na largura, luminárias a cada ~2,45 m na profundidade (tudo derivado de ROOM).
  const nx = 4, nz = Math.max(2, Math.round(D / 2.45));
  const xs = Array.from({ length: nx }, (_, i) => W * (0.17 + i * 0.227));
  const zs = Array.from({ length: nz }, (_, i) => D * (i + 0.5) / nz);
  const booth = L.BOOTHS ? L.BOOTHS.x0 + L.BOOTHS.depth + 0.25 : 0;
  const out = [];
  for (const x of xs) for (const z of zs) {
    const y = (x < booth && L.ROOM.soffitH) ? L.ROOM.soffitH - 0.06 : H - 0.075;
    out.push({ pos: new THREE.Vector3(x, y, z), len: 1.24, axis: 'z' });
  }
  return out;
}

// Malhas de reserva (só quando a sala não fornece as suas).
export function buildFixtureMeshes(scene, list, tubeIntensity) {
  const g = new THREE.Group(); g.name = 'light-fixtures';
  const houseGeo = new THREE.BoxGeometry(0.24, 0.07, 1.30);
  const lipGeo = new THREE.BoxGeometry(0.02, 0.03, 1.30);
  const capGeo = new THREE.BoxGeometry(0.2, 0.05, 0.03);
  const tubeGeo = new THREE.CylinderGeometry(0.0135, 0.0135, 1.18, 10, 1, true); tubeGeo.rotateX(Math.PI / 2);
  const houseM = new THREE.MeshStandardMaterial({ color: 0xf2f3f4, roughness: 0.35, metalness: 0.0 });
  const capM = new THREE.MeshStandardMaterial({ color: 0xdadcdf, roughness: 0.5 });
  const tubeM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: new THREE.Color(0xf3f6ff), emissiveIntensity: tubeIntensity, roughness: 0.3 });
  const n = list.length;
  const house = new THREE.InstancedMesh(houseGeo, houseM, n);
  const lips = new THREE.InstancedMesh(lipGeo, houseM, n * 2);
  const caps = new THREE.InstancedMesh(capGeo, capM, n * 2);
  const tubes = new THREE.InstancedMesh(tubeGeo, tubeM, n * 2);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), v = new THREE.Vector3();
  list.forEach((f, i) => {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), f.axis === 'x' ? Math.PI / 2 : 0);
    const k = f.len / 1.24;
    const place = (mesh, idx, dx, dy, dz, sz = k) => {
      v.set(dx, dy, dz).applyQuaternion(q).add(f.pos); s.set(1, 1, sz); m.compose(v, q, s); mesh.setMatrixAt(idx, m);
    };
    place(house, i, 0, 0.045, 0);
    place(lips, i * 2, -0.115, -0.005, 0); place(lips, i * 2 + 1, 0.115, -0.005, 0);
    place(caps, i * 2, 0, -0.005, -0.6 * k, 1); place(caps, i * 2 + 1, 0, -0.005, 0.6 * k, 1);
    place(tubes, i * 2, -0.052, -0.012, 0); place(tubes, i * 2 + 1, 0.052, -0.012, 0);
  });
  for (const mm of [house, lips, caps, tubes]) { mm.castShadow = false; mm.receiveShadow = false; g.add(mm); }
  scene.add(g);
  return { group: g, tubeMaterial: tubeM };
}
