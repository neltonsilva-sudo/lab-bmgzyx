// DONO: agente "sala". Teto: forro metálico, sanca rebaixada, luminárias (carcaça + tubos), eletrocalhas perfuradas,
// eletrodutos com braçadeiras, tirantes, grelha de ventilação e luminária quadrada âmbar.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ROOM, BOOTHS, SOLAR, BENCH_ROW } from './layout.js?v=20261009092323';
import { ceilingTextures, perforatedAlpha, galvTexture } from './room_tex.js?v=20261009092323';

const box = (w, h, d, x, y, z) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return g; };
const cyl = (r, len, axis, x, y, z, seg = 10) => {
  const g = new THREE.CylinderGeometry(r, r, len, seg);
  if (axis === 'x') g.rotateZ(Math.PI / 2); else if (axis === 'z') g.rotateX(Math.PI / 2);
  g.translate(x, y, z); return g;
};

export function buildCeiling(g, ctx) {
  const { W, D, H, soffitH } = ROOM;
  const bx = BOOTHS.x0 + BOOTHS.depth;           // frente das baias
  const bz1 = BOOTHS.zEnd ?? (BOOTHS.z0 + BOOTHS.n * BOOTHS.bayW); // fim das baias (face da parede APR)
  const frameD = 0.95;                            // profundidade do pórtico dos painéis no fundo
  const frameX1 = SOLAR.xs[SOLAR.xs.length - 1] + SOLAR.w / 2 + 0.36;

  // ---------- forro ----------
  const ct = ceilingTextures();
  ct.map.repeat.set(W / 0.15, 1); ct.bumpMap.repeat.set(W / 0.15, 1);
  const ceilM = new THREE.MeshStandardMaterial({ color: 0xffffff, map: ct.map, bumpMap: ct.bumpMap, bumpScale: 1.0, roughness: 0.5, metalness: 0.1 });
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), ceilM);
  ceil.rotation.x = Math.PI / 2; ceil.position.set(W / 2, H, D / 2); ceil.receiveShadow = true; g.add(ceil);

  // ---------- sanca rebaixada (sobre as baias e sobre o pórtico do fundo) ----------
  const white = new THREE.MeshStandardMaterial({ color: 0xeeeeea, roughness: 0.8 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.95 });
  const fasciaH = 0.12; // testeira fina; acima dela, recuo escuro + perfil metálico preto até a laje
  const sg = [
    box(bx + 0.05, 0.04, bz1, (bx + 0.05) / 2, soffitH + 0.02, bz1 / 2),            // laje inferior sobre baias
    box(0.06, fasciaH, bz1 + 0.06, bx + 0.02, soffitH + fasciaH / 2, bz1 / 2),         // testeira frontal
    box(frameX1 - bx, 0.04, frameD + 0.05, (bx + frameX1) / 2, soffitH + 0.02, (frameD + 0.05) / 2), // sobre pórtico
    box(frameX1 - bx + 0.06, fasciaH, 0.06, (bx + frameX1) / 2, soffitH + fasciaH / 2, frameD + 0.02),
    box(0.06, fasciaH, frameD + 0.08, frameX1, soffitH + fasciaH / 2, frameD / 2),     // retorno lateral
  ];
  const sanca = new THREE.Mesh(mergeGeometries(sg), white); sanca.castShadow = true; sanca.receiveShadow = true; g.add(sanca);
  // vão escuro acima da testeira (vê-se o entreforro, como nas fotos)
  const vg = [
    box(0.02, H - soffitH - fasciaH, bz1, bx - 0.35, soffitH + fasciaH + (H - soffitH - fasciaH) / 2, bz1 / 2),
    box(frameX1 - bx, H - soffitH - fasciaH, 0.02, (bx + frameX1) / 2, soffitH + fasciaH + (H - soffitH - fasciaH) / 2, frameD - 0.35),
    box(bx, 0.02, bz1, bx / 2, soffitH + 0.05, bz1 / 2),
  ];
  g.add(new THREE.Mesh(mergeGeometries(vg), dark));
  // perfil metálico preto (cantoneira) entre o topo da testeira e a laje
  const blackM = new THREE.MeshStandardMaterial({ color: 0x151617, roughness: 0.5, metalness: 0.5 });
  g.add(new THREE.Mesh(mergeGeometries([
    box(0.035, 0.035, bz1, bx - 0.01, soffitH + fasciaH + 0.018, bz1 / 2),
    box(frameX1 - bx, 0.035, 0.035, (bx + frameX1) / 2, soffitH + fasciaH + 0.018, frameD - 0.01),
  ]), blackM));

  // ---------- luminárias (carcaça branca + 2 tubos emissivos) ----------
  const fixtures = [];
  const zsGrid = [7.75, 5.4, 3.05, 0.75].map((z) => Math.min(z, D - 0.8));
  const rows = [
    { x: bx + 0.45, zs: [7.8, 4.6, 1.3] },
    { x: 3.5, zs: zsGrid }, { x: 5.7, zs: zsGrid }, { x: 8.9, zs: zsGrid }, { x: Math.min(10.8, W - 1.0), zs: zsGrid },
  ];
  const yF = H - 0.13; // centro dos tubos
  for (const r of rows) for (const z of r.zs) fixtures.push({ pos: new THREE.Vector3(r.x, yF, z), len: 1.24, dir: 'z' });
  const n = fixtures.length;
  const houseM = new THREE.MeshStandardMaterial({ color: 0xf3f4f4, roughness: 0.32, metalness: 0.05 });
  const reflM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.18, metalness: 0.0, emissive: 0xffffff, emissiveIntensity: 0.25 });
  const tubeM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: new THREE.Color(0xfff9f2), emissiveIntensity: 3.2, roughness: 0.3 });
  tubeM.name = 'room-tube';
  const capM = new THREE.MeshStandardMaterial({ color: 0xd0d2d4, roughness: 0.5 });
  const fxL = 1.32;
  const houseGeo = mergeGeometries([
    box(0.25, 0.012, fxL, 0, 0.06, 0),          // fundo (encostado ao forro)
    box(0.012, 0.075, fxL, -0.119, 0.024, 0),   // laterais
    box(0.012, 0.075, fxL, 0.119, 0.024, 0),
    box(0.25, 0.075, 0.012, 0, 0.024, fxL / 2), // cabeceiras
    box(0.25, 0.075, 0.012, 0, 0.024, -fxL / 2),
  ]);
  const reflGeo = new THREE.BoxGeometry(0.2, 0.004, fxL - 0.04); reflGeo.translate(0, 0.052, 0);
  const capGeo = mergeGeometries([box(0.2, 0.035, 0.03, 0, 0.0, 0.62), box(0.2, 0.035, 0.03, 0, 0.0, -0.62)]);
  const tubeGeo = mergeGeometries([cyl(0.0135, 1.2, 'z', -0.055, 0, 0, 12), cyl(0.0135, 1.2, 'z', 0.055, 0, 0, 12)]);
  const mkI = (geo, mat) => { const m = new THREE.InstancedMesh(geo, mat, n); g.add(m); return m; };
  const iH = mkI(houseGeo, houseM), iR = mkI(reflGeo, reflM), iC = mkI(capGeo, capM), iT = mkI(tubeGeo, tubeM);
  const M = new THREE.Matrix4();
  fixtures.forEach((f, i) => { M.makeTranslation(f.pos.x, f.pos.y, f.pos.z); iH.setMatrixAt(i, M); iR.setMatrixAt(i, M); iC.setMatrixAt(i, M); iT.setMatrixAt(i, M); });
  iT.name = 'room-tubes';

  // ---------- eletrocalhas perfuradas (perfil U 200x50) com tirantes ----------
  const galv = galvTexture();
  const alpha = perforatedAlpha();
  const trayM = new THREE.MeshStandardMaterial({ color: 0xc4c8cc, map: galv, roughness: 0.62, metalness: 0.25, alphaMap: alpha, alphaTest: 0.5, side: THREE.DoubleSide });
  const solidM = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, map: galv, roughness: 0.6, metalness: 0.4 });
  const trays = [
    { x: 3.5, z0: frameD + 0.1, z1: D - 0.2, y: H - 0.07 },
    { x: 5.7, z0: frameD + 0.1, z1: D - 0.2, y: H - 0.07 },
    { x: BENCH_ROW.x - 0.15, z0: 0.9, z1: D - 0.2, y: soffitH + 0.155, w: 0.3, h: 0.07, glands: true }, // calha das bancadas: cabos saem por prensa-cabos
    { x: bx - 0.25, z0: 0.3, z1: bz1, y: soffitH + 0.12, inVoid: true },
  ];
  const tg = [], tsolid = [], rods = [], glands = [];
  for (const t of trays) {
    const L = t.z1 - t.z0, zc = (t.z0 + t.z1) / 2, w = t.w || (t.inVoid ? 0.15 : 0.2), hgt = t.h || 0.05;
    const bottom = new THREE.PlaneGeometry(w, L); bottom.rotateX(-Math.PI / 2); bottom.translate(t.x, t.y - hgt / 2, zc);
    const uvb = bottom.attributes.uv; for (let i = 0; i < uvb.count; i++) uvb.setXY(i, uvb.getX(i) * w / 0.25, uvb.getY(i) * L / 0.25);
    tg.push(bottom);
    for (const s of [-1, 1]) {
      const side = new THREE.PlaneGeometry(L, hgt); side.rotateY(Math.PI / 2); side.translate(t.x + s * w / 2, t.y, zc);
      const uv = side.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * L / 0.25, uv.getY(i) * hgt / 0.25);
      tg.push(side);
      tsolid.push(box(0.012, 0.006, L, t.x + s * (w / 2 - 0.006), t.y + hgt / 2, zc)); // aba dobrada
    }
    // emendas a cada 3 m e tirantes + perfilado a cada 1,5 m
    for (let z = t.z0 + 0.4; z < t.z1; z += 1.5) {
      tsolid.push(box(w + 0.06, 0.02, 0.04, t.x, t.y - hgt / 2 - 0.012, z));            // perfilado/suporte
      if (!t.inVoid) for (const s of [-1, 1]) rods.push(cyl(0.004, H - t.y + hgt / 2, 'y', t.x + s * (w / 2 + 0.02), (H + t.y - hgt / 2) / 2, z, 6));
    }
    if (t.glands) for (let i = 0; i < BENCH_ROW.n; i++) {
      const zc0 = BENCH_ROW.z0 + i * BENCH_ROW.pitch;
      for (const dz of [-0.28, 0.05, 0.3]) for (const dx of [-0.07, 0.04]) glands.push(cyl(0.012, 0.03, 'y', t.x + dx, t.y - hgt / 2 - 0.017, zc0 + dz, 12));
    }
    for (let z = t.z0 + 3; z < t.z1; z += 3) for (const s of [-1, 1]) tsolid.push(box(0.004, hgt, 0.12, t.x + s * (w / 2 + 0.002), t.y, z));
  }
  const trayMesh = new THREE.Mesh(mergeGeometries(tg), trayM); trayMesh.castShadow = true; g.add(trayMesh);
  g.add(new THREE.Mesh(mergeGeometries([...tsolid, ...rods]), solidM));
  if (glands.length) g.add(new THREE.Mesh(mergeGeometries(glands), new THREE.MeshStandardMaterial({ color: 0xecebe6, roughness: 0.55 })));

  // ---------- eletrodutos cinza com braçadeiras ----------
  const condM = new THREE.MeshStandardMaterial({ color: 0x8a8e92, roughness: 0.45, metalness: 0.5 });
  const cg = [];
  const runX = (z, x0, x1, y, r = 0.016) => {
    cg.push(cyl(r, x1 - x0, 'x', (x0 + x1) / 2, y, z));
    for (let x = x0 + 0.3; x < x1; x += 1.2) { cg.push(box(0.03, H - y + r, 0.035, x, (H + y) / 2, z)); cg.push(cyl(r + 0.004, 0.025, 'x', x, y, z, 10)); }
    for (let x = x0 + 2.5; x < x1; x += 3) cg.push(cyl(r + 0.005, 0.05, 'x', x, y, z, 10)); // luvas
  };
  const runZ = (x, z0, z1, y, r = 0.016) => {
    cg.push(cyl(r, z1 - z0, 'z', x, y, (z0 + z1) / 2));
    for (let z = z0 + 0.3; z < z1; z += 1.2) { cg.push(box(0.035, H - y + r, 0.03, x, (H + y) / 2, z)); cg.push(cyl(r + 0.004, 0.025, 'z', x, y, z, 10)); }
    for (let z = z0 + 2.5; z < z1; z += 3) cg.push(cyl(r + 0.005, 0.05, 'z', x, y, z, 10));
  };
  runX(4.05, bx + 0.05, W - 0.05, H - 0.05);
  runX(4.12, bx + 0.05, W - 0.05, H - 0.05, 0.01);
  runX(8.05, bx + 0.05, W - 0.05, H - 0.045);
  runX(frameD + 0.25, frameX1, W - 0.05, H - 0.05);
  runZ(bx + 0.2, frameD + 0.1, D - 0.1, H - 0.045);
  runZ(W - 0.35, 0.1, D - 0.1, H - 0.05);
  runZ(9.9, 0.1, D - 0.1, H - 0.045, 0.01);
  // condulete na junção dos eletrodutos
  for (const [x, z] of [[3.5, 4.05], [5.7, 4.05], [9.9, 4.05], [9.9, 8.05], [W - 0.35, 4.05]]) cg.push(box(0.08, 0.05, 0.12, x, H - 0.05, z));
  const cond = new THREE.Mesh(mergeGeometries(cg), condM); g.add(cond);

  // ---------- grelha de ventilação escura e luminária quadrada âmbar ----------
  const grille = new THREE.Group();
  grille.add(new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.012, 0.36), new THREE.MeshStandardMaterial({ color: 0x8f9396, roughness: 0.6, metalness: 0.3 })));
  const hole = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.014, 0.3), new THREE.MeshStandardMaterial({ color: 0x141516, roughness: 1 }));
  hole.position.y = -0.001; grille.add(hole);
  const slats = [];
  for (let i = 0; i < 11; i++) slats.push(box(0.6, 0.02, 0.006, 0, -0.012, -0.14 + i * 0.028));
  grille.add(new THREE.Mesh(mergeGeometries(slats), new THREE.MeshStandardMaterial({ color: 0x3a3c3e, roughness: 0.7, metalness: 0.3 })));
  grille.scale.set(0.8, 1, 0.8); grille.position.set(2.35, H - 0.008, 7.35); g.add(grille);
  const amber = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.3), new THREE.MeshStandardMaterial({ color: 0xf2c46a, emissive: 0xffb84a, emissiveIntensity: 1.4, roughness: 0.6 }));
  amber.position.set(2.5, H - 0.01, 5.2); g.add(amber);
  const amberRim = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.014, 0.34), houseM); amberRim.position.set(2.5, H - 0.006, 5.2); g.add(amberRim);

  return { fixtures, tubeMaterial: tubeM };
}
