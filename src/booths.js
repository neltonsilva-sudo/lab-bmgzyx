// DONO: agente "boxes" (área predial). As 5 cabines/boxes de instalações prediais na parede esquerda.
// Pilares/divisórias de alvenaria com cantos arredondados, paredes de fundo com caixas 4x2 amarelas embutidas
// (InstancedMesh), quadros pretos abertos com trilhos DIN, eletrodutos aparentes com conduletes, bocais,
// quadros plastificados de ferramentas e placas azuis na testeira da sanca. Layout medido nas fotos 2 e 3.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { BOOTHS, ROOM } from './layout.js';
import { paintedWall, plasterNormal, yellowBoxTex, darkBoxTex, posterTex, plateTex, floorAOTex, rng } from './booths_tex.js';

// Conteúdo da parede de fundo de cada box, do fundo da sala (i=0) para a entrada (i=4).
// u = distância (m) a partir da borda +z (lado da entrada, esquerda na foto); v = altura do centro (m).
// y: caixa 4x2 amarela 'v' (em pé) ou 'h' (deitada); q: quadro preto aberto {w,h,rails}.
const WALLS = [
  { label: 'Box 06', y: [[0.30, 2.25, 'v'], [0.82, 2.24, 'v'], [0.80, 1.49, 'h'], [0.34, 0.40, 'v']] },
  { label: 'Box 05', y: [[0.24, 2.25, 'v'], [0.27, 1.49, 'v'], [0.30, 0.42, 'v']] },
  { label: 'Box 04', y: [[0.14, 2.25, 'v'], [0.80, 2.24, 'v'], [0.84, 1.49, 'h'], [0.90, 0.44, 'v']], q: [{ u: 0.27, v: 1.50, w: 0.20, h: 0.27, rails: 1 }] },
  { label: 'Box 03', y: [[0.38, 2.26, 'v'], [0.80, 2.25, 'v'], [0.90, 1.48, 'h'], [0.58, 0.30, 'v'], [0.97, 0.40, 'v']], q: [{ u: 0.38, v: 1.49, w: 0.30, h: 0.20, rails: 2 }] },
  { label: 'Box 02', y: [[0.07, 2.28, 'v'], [0.56, 2.26, 'v'], [0.95, 2.24, 'v'], [0.12, 1.53, 'h'], [0.98, 1.52, 'h'], [0.19, 0.36, 'v'], [0.66, 0.40, 'v'], [0.99, 0.46, 'v']], q: [{ u: 0.52, v: 1.53, w: 0.31, h: 0.20, rails: 2 }] },
];
const YB = { w: 0.07, h: 0.094, hw: 0.106, hh: 0.067 }; // caixa amarela com flange (m): em pé / deitada

const INFO = (label, i) => `<p><b>${label}</b> · cabine de treino de instalações elétricas prediais em alvenaria (parede de fundo com caixas 4x2 embutidas, eletroduto aparente com condulete e ponto de luz no teto).</p>
<ul><li>Montagem de pontos de <b>tomada</b> (2P+T, 10/20 A) e <b>interruptores</b> simples, paralelo (three-way) e intermediário.</li>
<li>${i >= 2 ? 'Quadro de distribuição embutido com trilho DIN: disjuntores, <b>DR</b> (30 mA) e <b>DPS</b>.' : 'Passagem de condutores em eletroduto, emendas e identificação por cores (fase, neutro azul-claro, PE verde-amarelo).'}</li>
<li>Dimensionamento e boas práticas da <b>NBR 5410</b> (seção dos condutores, circuitos separados, ensaio de continuidade e isolação).</li>
<li><b>NR-10</b>: desenergização, bloqueio e etiquetagem (LOTO), teste de ausência de tensão, aterramento temporário e uso de EPI/ferramentas isoladas.</li></ul>`;

export function buildBooths(scene, ctx) {
  const g = new THREE.Group(); g.name = 'booths';
  const { depth: D, z0, bayW, n, pillarW: pw, x0 } = BOOTHS;
  const H = ROOM.soffitH || 2.5;
  const zk = (k) => z0 + k * bayW;
  const Wb = bayW - pw;
  const zEnd = BOOTHS.zEnd ?? zk(n);
  const plaster = plasterNormal();
  const hotspots = [];

  // ---------- pilares / divisórias ----------
  // UV contínuo em volta da divisória (m), sem saltos nas quinas arredondadas:
  // face +z u∈[0,D] (u=0 no fundo) → frente u∈[D, D+pw] → face -z u∈[D+pw, 2D+pw] (u=2D+pw no fundo).
  const uF = D, uB = D + pw, TW = 2 * D + pw;
  const pillarU = (px, pz, nx, nz, L = pw) => {
    if (Math.abs(nx) > Math.abs(nz) && px > D * 0.5) return D + (L - pz) * (pw / L);       // frente
    if (nz >= 0 || pz > L / 2) return Math.min(px, D);                                     // face +z
    return uB + (D - Math.min(px, D));                                                     // face -z
  };
  const vGrad = (v) => 0.04 * Math.pow(1 - v / H, 1.6);            // escurece rumo ao piso (luz vem do teto)
  const pillarMats = [0, 1, 2].map((s) => {
    const map = paintedWall({ wm: TW, hm: H, seed: 101 + s * 17, base: [229, 233, 237], scuffs: 3, mottle: 0.012, spots: 1,
      ao: (u, v) => {
        let a = 0;
        const sm = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
        const side = 1 - sm(uF - 0.04, uF + 0.02, u) * (1 - sm(uB - 0.02, uB + 0.04, u)); // 1 nas laterais, 0 na frente
        a += side * (0.12 * Math.exp(-Math.min(u, TW - u) / 0.3) + 0.02) + vGrad(v) * (0.5 + 0.5 * side);
        a += 0.07 * Math.exp(-(H - v) / 0.12);                                // junto à laje
        return Math.min(a, 0.7);
      } });
    const nm = plaster.clone(); nm.repeat.set(3, 3); nm.wrapS = nm.wrapT = THREE.RepeatWrapping; nm.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map, normalMap: nm, normalScale: new THREE.Vector2(0.02, 0.02), roughness: 0.9, color: 0xffffff });
  });
  for (let k = 0; k < n; k++) {
    const geo = new RoundedBoxGeometry(D, H, pw, 3, 0.014);
    const P = geo.attributes.position, N = geo.attributes.normal, UV = geo.attributes.uv;
    for (let i = 0; i < P.count; i++) {
      const px = P.getX(i) + D / 2, py = P.getY(i) + H / 2, pz = P.getZ(i) + pw / 2;
      const nx = N.getX(i), ny = N.getY(i), nz = N.getZ(i);
      UV.setXY(i, pillarU(px, pz, nx, nz) / TW, py / H);
    }
    const m = new THREE.Mesh(geo, pillarMats[k % 3]);
    m.position.set(x0 + D / 2, H / 2, zk(k)); m.castShadow = true; m.receiveShadow = true; m.name = `booth-pilar-${k}`;
    g.add(m);
  }

  // ---------- paredes de fundo: alvenaria com recortes reais (ShapeGeometry com furos) ----------
  // A face da parede fica em WX; caixas e quadros são cavidades recuadas atrás dela.
  const WX = x0 + 0.045, YD = 0.022, QD = 0.03, FL = 0.008; // recuo das caixas 4x2, recuo dos quadros, flange
  const cavityGeo = (() => { // caixa aberta unitária (boca em x=0, fundo em x=-1), faces viradas para dentro, cor por vértice
    const parts = [];
    const quad = (a, b, c, d, shade) => parts.push({ v: [a, b, c, a, c, d], shade });
    const p = (x, y, z) => [x, y, z];
    quad(p(-1, -0.5, 0.5), p(-1, -0.5, -0.5), p(-1, 0.5, -0.5), p(-1, 0.5, 0.5), 1.0);   // fundo (+x)
    quad(p(0, 0.5, 0.5), p(-1, 0.5, 0.5), p(-1, 0.5, -0.5), p(0, 0.5, -0.5), 0.35);     // teto (normal -y)
    quad(p(0, -0.5, -0.5), p(-1, -0.5, -0.5), p(-1, -0.5, 0.5), p(0, -0.5, 0.5), 0.85);  // piso (normal +y)
    quad(p(0, -0.5, 0.5), p(-1, -0.5, 0.5), p(-1, 0.5, 0.5), p(0, 0.5, 0.5), 0.55);     // lado +z (normal -z)
    quad(p(0, 0.5, -0.5), p(-1, 0.5, -0.5), p(-1, -0.5, -0.5), p(0, -0.5, -0.5), 0.7);  // lado -z (normal +z)
    const pos = [], col = [], uv = [];
    for (const q of parts) for (const v of q.v) { pos.push(...v); col.push(q.shade, q.shade, q.shade); uv.push(0.5 - v[2], v[1] + 0.5); }
    const gg = new THREE.BufferGeometry();
    gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    gg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); gg.computeVertexNormals(); return gg;
  })();
  const yMat = new THREE.MeshStandardMaterial({ map: yellowBoxTex(), vertexColors: true, roughness: 0.6 });
  const yCount = WALLS.reduce((s, w) => s + w.y.length, 0);
  const yInst = new THREE.InstancedMesh(cavityGeo, yMat, yCount); yInst.name = 'booth-caixas-4x2'; yInst.receiveShadow = true;
  const qCount = WALLS.reduce((s, w) => s + (w.q ? w.q.length : 0), 0);
  const qInst = new THREE.InstancedMesh(cavityGeo, new THREE.MeshStandardMaterial({ map: darkBoxTex(41), vertexColors: true, color: 0x74777c, metalness: 0.5, roughness: 0.55 }), qCount);
  qInst.name = 'booth-quadros-embutidos'; qInst.receiveShadow = true;
  const railMat = new THREE.MeshStandardMaterial({ color: 0xb0b4b8, metalness: 0.85, roughness: 0.3 });
  const wireMats = [0x9aa0a8, 0x2a62c9, 0x1d1d1d, 0xb52a2a, 0x2f8f3a].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 }));
  const holeMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.9 });
  const breakerMat = new THREE.MeshStandardMaterial({ color: 0xd9d9d4, roughness: 0.5 });
  const leverMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5 });
  const dummy = new THREE.Object3D(); let yi = 0, qi = 0;
  const wallNM = plaster.clone(); wallNM.wrapS = wallNM.wrapT = THREE.RepeatWrapping; wallNM.repeat.set(3, 3); wallNM.needsUpdate = true;

  const booths = [];
  for (let i = 0; i < n; i++) {
    const W = WALLS[i] || WALLS[0];
    const zA = i === n - 1 ? zEnd - 0.002 : zk(i + 1) - pw / 2, zB = zk(i) + pw / 2; // zA = borda +z (u=0)
    const Wi = zA - zB, sc = Wi / Wb;
    const Y = W.y.map(([u, v, o]) => [u * sc, v, o]), Q = (W.q || []).map((q) => ({ ...q, u: q.u * sc }));
    const zc = (zA + zB) / 2;
    const bg = new THREE.Group(); bg.name = `booth-${i}`; g.add(bg);
    // aberturas: caixas (boca = externo - flange) e quadros
    const ops = [];
    for (const [u, v, o] of Y) { const w = o === 'v' ? YB.w : YB.hw, h = o === 'v' ? YB.h : YB.hh; ops.push({ u, v, w, h, kind: 'y', o }); }
    for (const q of Q) ops.push({ u: q.u, v: q.v, w: q.w, h: q.h, kind: 'q', q });
    const holes = ops.map((o) => ({ u: o.u, v: o.v, w: o.w, h: o.h, m: o.kind === 'q' ? 0.022 : 0.01, flange: o.kind === 'y' ? FL : 0 }));
    const map = paintedWall({ wm: Wi, hm: H, seed: 300 + i * 31, base: [229, 233, 237], holes, mottle: 0.012, scuffs: 3, spots: 1,
      ao: (uc, v) => Math.min(0.3, 0.12 * Math.exp(-uc / 0.2) + 0.12 * Math.exp(-(Wi - uc) / 0.2) + 0.07 * Math.exp(-(H - v) / 0.12) + vGrad(v)) });
    const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(Wi, 0); shape.lineTo(Wi, H); shape.lineTo(0, H); shape.closePath();
    for (const o of ops) {
      const iw = o.kind === 'y' ? o.w - 2 * FL : o.w, ih = o.kind === 'y' ? o.h - 2 * FL : o.h;
      const hp = new THREE.Path(); hp.moveTo(o.u - iw / 2, o.v - ih / 2); hp.lineTo(o.u - iw / 2, o.v + ih / 2); hp.lineTo(o.u + iw / 2, o.v + ih / 2); hp.lineTo(o.u + iw / 2, o.v - ih / 2); hp.closePath();
      shape.holes.push(hp); o.iw = iw; o.ih = ih;
    }
    const sg = new THREE.ShapeGeometry(shape);
    { const P = sg.attributes.position, UV = sg.attributes.uv; for (let k = 0; k < P.count; k++) UV.setXY(k, P.getX(k) / Wi, P.getY(k) / H); }
    sg.rotateY(Math.PI / 2);
    const wm = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ map, normalMap: wallNM, normalScale: new THREE.Vector2(0.02, 0.02), roughness: 0.92 }));
    wm.position.set(WX, 0, zA); wm.receiveShadow = true; wm.name = `booth-fundo-${i}`;
    bg.add(wm);
    // tampa traseira atrás dos recortes (esconde a parede da sala)
    for (const o of ops) {
      const dpt = o.kind === 'y' ? YD : QD;
      dummy.position.set(WX, o.v, zA - o.u); dummy.rotation.set(0, 0, 0);
      dummy.scale.set(dpt, o.ih, o.iw); dummy.updateMatrix();
      if (o.kind === 'y') yInst.setMatrixAt(yi++, dummy.matrix);
      else qInst.setMatrixAt(qi++, dummy.matrix);
    }
    // trilhos DIN prateados e fiação dentro dos quadros
    for (const o of ops.filter((x) => x.kind === 'q')) {
      const q = o.q, qz = zA - q.u, bx = WX - QD; // fundo do quadro
      for (let r = 0; r < q.rails; r++) {
        const rz = qz + (q.rails === 1 ? -q.w * 0.25 : (r ? -1 : 1) * q.w * 0.17);
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.0075, q.h * 0.9, 0.035), railMat);
        rail.position.set(bx + 0.004, q.v, rz); bg.add(rail);
        for (const e of [-1, 1]) { const lip = new THREE.Mesh(new THREE.BoxGeometry(0.006, q.h * 0.9, 0.004), railMat); lip.position.set(bx + 0.01, q.v, rz + e * 0.0155); bg.add(lip); }
        for (let s = 0; s < 5; s++) {
          const hole = new THREE.Mesh(new THREE.PlaneGeometry(0.008, 0.02), holeMat);
          hole.rotation.y = Math.PI / 2; hole.position.set(bx + 0.0081, q.v - q.h * 0.36 + s * q.h * 0.18, rz); bg.add(hole);
        }
      }
      const R = rng(500 + i);
      // módulos no trilho (vertical): disjuntores cinza-claro deitados, com alavanca escura (1 a 3 por quadro)
      const rz0 = qz + (q.rails === 1 ? -q.w * 0.25 : q.w * 0.17), nb = 1 + (i % 3);
      for (let b = 0; b < nb; b++) {
        const y = q.v - q.h * 0.28 + b * 0.036;
        const brk = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.034, 0.05), breakerMat);
        brk.position.set(bx + 0.03, y, rz0); bg.add(brk);
        const lev = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.008, 0.012), leverMat); lev.position.set(bx + 0.057, y, rz0); bg.add(lev);
      }
      for (let w = 0; w < 2; w++) { // 1–2 condutores discretos
        const sz = qz + q.w * (0.32 - w * 0.06), sy = q.v + q.h * 0.5 - 0.005;
        const pts = [new THREE.Vector3(bx + 0.006, sy, sz), new THREE.Vector3(bx + 0.014, sy - 0.04, sz - 0.01 - R() * 0.02), new THREE.Vector3(bx + 0.02, sy - 0.08 - R() * 0.03, sz - 0.03 - R() * 0.03)];
        bg.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.002, 5), wireMats[w ? 2 : 0]));
      }
    }
    // volume invisível para enquadramento/seleção do hotspot
    const vol = new THREE.Mesh(new THREE.BoxGeometry(D, H, Wi), new THREE.MeshBasicMaterial());
    vol.position.set(x0 + D / 2, H / 2, zc); vol.visible = false; bg.add(vol);
    booths.push({ bg, zc, zA, zB, label: W.label });
  }
  yInst.instanceMatrix.needsUpdate = true; g.add(yInst);
  qInst.instanceMatrix.needsUpdate = true; g.add(qInst);

  // ---------- eletrodutos, conduletes, caixas de teto e bocais (instanciados) ----------
  const pvc = new THREE.MeshStandardMaterial({ color: 0xc8ccd0, metalness: 0.8, roughness: 0.35, envMapIntensity: 1.2 });
  const condY = 1.24, cr = 0.0115;
  const pipeTop = H - 0.03;
  const pipeGeo = new THREE.CylinderGeometry(cr, cr, 1, 10);
  const pipes = new THREE.InstancedMesh(pipeGeo, pvc, n); pipes.castShadow = false;
  const condGeo = new THREE.BoxGeometry(0.058, 0.105, 0.044);
  const conds = new THREE.InstancedMesh(condGeo, pvc, n);
  const coverGeo = new THREE.BoxGeometry(0.066, 0.12, 0.004);
  const covers = new THREE.InstancedMesh(coverGeo, new THREE.MeshStandardMaterial({ color: 0xa9adb1, metalness: 0.8, roughness: 0.38 }), n);
  const screwGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.004, 8); screwGeo.rotateX(Math.PI / 2);
  const screws = new THREE.InstancedMesh(screwGeo, railMat, n * 2);
  const clampGeo = new THREE.BoxGeometry(0.03, 0.016, 0.03);
  const clamps = new THREE.InstancedMesh(clampGeo, pvc, n * 3);
  const roseGeo = new THREE.CylinderGeometry(0.062, 0.065, 0.045, 24);
  const roses = new THREE.InstancedMesh(roseGeo, new THREE.MeshStandardMaterial({ color: 0xd8d8d4, roughness: 0.6 }), n);
  const sockGeo = new THREE.CylinderGeometry(0.022, 0.03, 0.05, 14); sockGeo.rotateX(Math.PI / 2);
  const socks = new THREE.InstancedMesh(sockGeo, new THREE.MeshStandardMaterial({ color: 0xf1f0ea, roughness: 0.35 }), n);
  const px = x0 + D - 0.065;
  for (let k = 0; k < n; k++) {
    const pz = zk(k) + pw / 2 + cr + 0.004, lastSock = k === n - 1;
    const len = pipeTop - (condY + 0.05);
    dummy.rotation.set(0, 0, 0); dummy.scale.set(1, len, 1); dummy.position.set(px, condY + 0.05 + len / 2, pz); dummy.updateMatrix(); pipes.setMatrixAt(k, dummy.matrix);
    dummy.scale.set(1, 1, 1); dummy.position.set(px, condY, pz + 0.006); dummy.updateMatrix(); conds.setMatrixAt(k, dummy.matrix);
    dummy.position.set(px, condY, pz + 0.03); dummy.updateMatrix(); covers.setMatrixAt(k, dummy.matrix);
    for (let s = 0; s < 2; s++) { dummy.position.set(px, condY + (s ? 0.048 : -0.048), pz + 0.033); dummy.updateMatrix(); screws.setMatrixAt(k * 2 + s, dummy.matrix); }
    for (let s = 0; s < 3; s++) { dummy.position.set(px, 1.65 + s * 0.38, zk(k) + pw / 2 + 0.008); dummy.updateMatrix(); clamps.setMatrixAt(k * 3 + s, dummy.matrix); }
    dummy.position.set(px - 0.015, H - 0.023, pz + 0.045); dummy.updateMatrix(); roses.setMatrixAt(k, dummy.matrix);
    // bocal branco na face -z do pilar seguinte (aparece logo atrás da quina, alto)
    dummy.position.set(x0 + D - 0.11, 2.17, (k === n - 1 ? zEnd : zk(k + 1) - pw / 2) - 0.025); if (lastSock) dummy.scale.set(0, 0, 0); dummy.updateMatrix(); socks.setMatrixAt(k, dummy.matrix); dummy.scale.set(1, 1, 1);
  }
  for (const im of [pipes, conds, covers, screws, clamps, roses, socks]) { im.instanceMatrix.needsUpdate = true; im.receiveShadow = true; g.add(im); }

  // ---------- quadros plastificados nas faces +z dos pilares ----------
  const posterMats = [];
  for (let k = 0; k < n; k++) {
    const mat = new THREE.MeshPhysicalMaterial({ map: posterTex(700 + k * 13, k), roughness: 0.3, clearcoat: 0.25, clearcoatRoughness: 0.3 });
    posterMats.push(mat);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.46), mat);
    p.position.set(x0 + D - 0.27, 1.70, zk(k) + pw / 2 + 0.006); p.rotation.set(0, 0, (k % 2 ? 1 : -1) * 0.012);
    p.name = `booth-quadro-${k}`; booths[k].bg.add(p);
    // fio de pendurar e prego
    const nail = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.01, 6), railMat); nail.rotation.x = Math.PI / 2;
    nail.position.set(p.position.x, 1.97, p.position.z + 0.003); booths[k].bg.add(nail);
  }

  // ---------- placas azuis na testeira da sanca ----------
  scene.updateMatrixWorld(true);
  const ray = new THREE.Raycaster();
  const room = scene.getObjectByName('room');
  for (const b of booths) {
    let fx = x0 + D + 0.05;
    if (room) {
      ray.set(new THREE.Vector3(x0 + D + 1.5, H + 0.1, b.zc), new THREE.Vector3(-1, 0, 0)); ray.far = 1.9;
      const hit = ray.intersectObject(room, true).find((h) => h.point.x > x0 + D - 0.2 && h.point.x < x0 + D + 0.4);
      if (hit) fx = hit.point.x;
    }
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.09), new THREE.MeshStandardMaterial({ map: plateTex(b.label), roughness: 0.45 }));
    plate.rotation.y = Math.PI / 2; plate.position.set(fx + 0.003, H + 0.11, b.zc - 0.1); plate.name = `booth-placa-${b.label}`;
    b.bg.add(plate);
    hotspots.push({ id: `box${b.label.slice(-2)}`, titulo: `${b.label} · Instalações prediais`, obj: b.bg, info: INFO(b.label, booths.indexOf(b)) });
  }
  hotspots.reverse(); // da entrada para o fundo

  // ---------- oclusão de contato no piso (base das paredes e pilares) ----------
  const aoT = floorAOTex();
  const aoMat = new THREE.MeshStandardMaterial({ color: 0x000000, transparent: true, opacity: 0.38, alphaMap: aoT, depthWrite: false, roughness: 1 });
  const aoGeo = new THREE.PlaneGeometry(1, 1); aoGeo.rotateX(-Math.PI / 2);
  const strips = [];
  for (let i = 0; i < n; i++) strips.push({ x: x0 + 0.105, z: booths[i].zc, w: 0.12, l: booths[i].zA - booths[i].zB, rot: Math.PI / 2 }); // ao longo do fundo
  for (let k = 0; k <= n; k++) for (const s of (k === n ? [-1] : [1, -1])) strips.push({ x: x0 + D / 2, z: k === n ? zEnd - 0.05 : zk(k) + s * (pw / 2 + 0.05), w: 0.1, l: D, rot: s > 0 ? 0 : Math.PI });
  const aoInst = new THREE.InstancedMesh(aoGeo, aoMat, strips.length); aoInst.renderOrder = 1;
  strips.forEach((s, j) => {
    dummy.rotation.set(0, s.rot, 0); dummy.scale.set(s.l, 1, s.w); dummy.position.set(s.x, 0.0025, s.z); dummy.updateMatrix(); aoInst.setMatrixAt(j, dummy.matrix);
  });
  aoInst.instanceMatrix.needsUpdate = true; g.add(aoInst);

  scene.add(g);
  return { group: g, hotspots, update() {} };
}
