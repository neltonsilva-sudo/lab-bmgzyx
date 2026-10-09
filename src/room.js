// DONO: agente "sala". Paredes, piso epóxi azul com faixas amarelas, teto em painéis, eletrocalhas/eletrodutos,
// sanca, pórtico branco dos painéis solares, placas de sinalização (saída, extintor, APR, CHECKLIST, faixa institucional).
// As baias (pilares, caixas 4x4, eletrodutos verticais, placas das baias) são do agente "boxes" (src/booths.js).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ROOM, BOOTHS, SOLAR, CENTER, WALK, BENCH_ROW } from './layout.js?v=20261009142652';
import { floorTextures, stripeTextures, wallTexture, exitSign, extinguisherSign, boardSign, bannerTexture, bluePlate, rng } from './room_tex.js?v=20261009142652';
import { buildCeiling } from './room_ceiling.js?v=20261009142652';

const box = (w, h, d, x, y, z) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return g; };

export function buildRoom(scene, ctx) {
  const g = new THREE.Group(); g.name = 'room';
  const { W, D, H, soffitH } = ROOM;
  const bx = BOOTHS.x0 + BOOTHS.depth;
  const bz1 = BOOTHS.z0 + BOOTHS.n * BOOTHS.bayW;
  const aprZ = BOOTHS.zEnd ?? (bz1 - 0.18); // face da parede APR que fecha o 1º box (BOOTHS.zEnd)
  const frameD = 0.95;

  // ---------- piso epóxi ----------
  const B = BENCH_ROW, benchZ1 = B.z0 + B.width / 2, benchZ0 = B.z0 + (B.n - 1) * B.pitch - B.width / 2;
  const zones = [
    [WALK.xLine - 1.2, 0.5, WALK.xLine + 0.2, D, 1.6],                    // corredor das bancadas
    [CENTER.x0 + 0.3, CENTER.z1 - 2.5, CENTER.x1 - 0.2, CENTER.z1 + 0.2, 1.2], // frente da bancada central
    [bx, 0.8, bx + 1.4, bz1, 1.0],                                          // frente das baias
    [2.5, 8.2, 7.5, D, 1.6],                                                // entrada
    [B.x - 0.9, benchZ0, B.x - 0.2, benchZ1, 1.4],                          // diante das bancadas
  ];
  // ---------- faixas amarelas (≈10 cm), medidas nas fotos ----------
  const st = stripeTextures();
  const stripeM = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, map: st.map, alphaMap: st.alphaMap, alphaTest: 0.5, roughnessMap: st.roughnessMap, roughness: 0.6,
    clearcoat: 0.6, clearcoatRoughness: 0.15, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  const SW = 0.11;
  const segs = [];
  const seg = (x0, z0, x1, z1) => segs.push([x0, z0, x1, z1]);
  const rect = (x0, z0, x1, z1) => { seg(x0 - SW / 2, z0, x1 + SW / 2, z0); seg(x0 - SW / 2, z1, x1 + SW / 2, z1); seg(x0, z0 + SW / 2, x0, z1 - SW / 2); seg(x1, z0 + SW / 2, x1, z1 - SW / 2); };
  seg(WALK.xLine, 0.35, WALK.xLine, D);                          // corredor em frente às bancadas
  rect(CENTER.x0, CENTER.z0, CENTER.x1, CENTER.z1);              // área central
  seg(2.66 - SW / 2, 8.3, 6.05, 8.3); seg(2.66, 8.3 + SW / 2, 2.66, D); // faixa da entrada (L)
  seg(7.93, 8.2, 7.93, 9.0 + SW / 2); seg(7.35, 9.0, 7.93 - SW / 2, 9.0); // fecho atrás da b1
  rect(8.53, 8.41, 9.73, 8.99);                                  // zona demarcada atrás das bancadas
  const ft = floorTextures(W, D, zones, 7, segs);
  const floorM = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, map: ft.map, roughnessMap: ft.roughnessMap, roughness: 0.7, metalness: 0.0,
    clearcoat: 0.4, clearcoatRoughness: 0.35, specularIntensity: 0.5,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorM);
  floor.rotation.x = -Math.PI / 2; floor.position.set(W / 2, 0, D / 2); floor.receiveShadow = true; floor.name = 'floor';
  g.add(floor);

  const sg = segs.map(([x0, z0, x1, z1]) => {
    const along = Math.abs(x1 - x0) > Math.abs(z1 - z0);
    const L = along ? Math.abs(x1 - x0) : Math.abs(z1 - z0);
    const geo = new THREE.PlaneGeometry(L, SW);
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * L + Math.random());
    geo.rotateX(-Math.PI / 2); if (!along) geo.rotateY(Math.PI / 2);
    geo.translate((x0 + x1) / 2, 0.0015, (z0 + z1) / 2);
    return geo;
  });
  const stripes = new THREE.Mesh(mergeGeometries(sg), stripeM); stripes.receiveShadow = true; stripes.name = 'stripes'; g.add(stripes);

  // ---------- paredes ----------
  const wallMat = (len, h, seed) => new THREE.MeshStandardMaterial({ color: 0xffffff, map: wallTexture(len, h, seed), roughness: 0.88 });
  const wall = (len, h, mat, pos, ry) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len, h), mat);
    m.position.copy(pos); m.rotation.y = ry; m.receiveShadow = true; g.add(m); return m;
  };
  wall(D, H, wallMat(D, H, 11), new THREE.Vector3(0, H / 2, D / 2), Math.PI / 2);          // esquerda (atrás das baias)
  wall(W, H, wallMat(W, H, 12), new THREE.Vector3(W / 2, H / 2, 0), 0);                     // fundo
  wall(D, H, wallMat(D, H, 13), new THREE.Vector3(W, H / 2, D / 2), -Math.PI / 2);         // direita
  wall(W, H, wallMat(W, H, 14), new THREE.Vector3(W / 2, H / 2, D), Math.PI);               // frente (entrada)
  // bloco da parede APR/CHECKLIST: rente à frente das baias, de bz1 até a entrada
  const aprLen = D - aprZ;
  const aprM = wallMat(aprLen, H, 15);
  wall(aprLen, H, aprM, new THREE.Vector3(bx, H / 2, aprZ + aprLen / 2), Math.PI / 2);
  wall(bx, H, wallMat(bx, H, 16), new THREE.Vector3(bx / 2, H / 2, aprZ), Math.PI);          // testa (voltada ao fundo)

  // rodapé: meia-cana de epóxi azul + faixa de sujeira
  const skirtM = new THREE.MeshStandardMaterial({ color: 0x2f659c, roughness: 0.45 });
  const sk = 0.07, skt = 0.012;
  const skirts = [
    // só onde aparece nas fotos (parede direita e fundo atrás das bancadas); nada na parede APR nem atrás das baias
    box(W - 6.6, sk, skt, (W + 6.6) / 2, sk / 2, skt / 2), box(skt, sk, D, W - skt / 2, sk / 2, D / 2), box(W, sk, skt, W / 2, sk / 2, D - skt / 2),
  ];
  g.add(new THREE.Mesh(mergeGeometries(skirts), skirtM));

  // porta de entrada (parede da frente, fora das vistas das fotos)
  const doorM = new THREE.MeshStandardMaterial({ color: 0x8c9399, roughness: 0.5, metalness: 0.3 });
  const door = new THREE.Mesh(mergeGeometries([box(1.0, 2.1, 0.04, 7.1, 1.05, D - 0.03), box(1.12, 0.06, 0.08, 7.1, 2.13, D - 0.04), box(0.06, 2.1, 0.08, 6.54, 1.05, D - 0.04), box(0.06, 2.1, 0.08, 7.66, 1.05, D - 0.04)]), doorM);
  g.add(door);

  // ---------- pórtico branco dos painéis solares (pilares + viga), no fundo ----------
  const frameM = new THREE.MeshStandardMaterial({ color: 0xffffff, map: wallTexture(2, H, 31), roughness: 0.85 });
  const px = [bx + 0.12];
  const xs = SOLAR.xs, hw = SOLAR.w / 2;
  px.push(xs[0] - hw - 0.17);
  for (let i = 0; i < xs.length - 1; i++) px.push((xs[i] + xs[i + 1]) / 2);
  px.push(xs[xs.length - 1] + hw + 0.17);
  const pg = px.map((x) => box(0.24, soffitH, frameD, x, soffitH / 2, frameD / 2));
  const frame = new THREE.Mesh(mergeGeometries(pg), frameM); frame.castShadow = true; frame.receiveShadow = true; g.add(frame);
  // placas azuis na testeira do pórtico (identificação das aberturas)
  const plates = ['Sala 06', 'Sala 07', 'Sala 08', 'Sala 09'];
  const openings = [(px[0] + px[1]) / 2, ...xs];
  openings.forEach((x, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.1), new THREE.MeshStandardMaterial({ map: bluePlate(plates[i] || 'Sala'), roughness: 0.4 }));
    m.position.set(x, soffitH + 0.13, frameD + 0.052); g.add(m);
  });

  // ---------- placas ----------
  const signMat = (map) => new THREE.MeshStandardMaterial({ map, roughness: 0.35 });
  // SAÍDA verde pendurada (face para a entrada) por dois tirantes
  const exitG = new THREE.Group();
  const ex = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 0.008), [signMat(null), signMat(null), signMat(null), signMat(null), signMat(exitSign()), new THREE.MeshStandardMaterial({ color: 0x0f6b3a, roughness: 0.4 })]);
  ex.material.slice(0, 4).forEach((m) => m.color.set(0xf0f0f0));
  exitG.add(ex);
  const wireM = new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.6, roughness: 0.4 });
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, H - 2.12 - 0.09), wireM); w.position.set(s * 0.14, (H - 2.12 - 0.09) / 2 + 0.09, 0); exitG.add(w); }
  exitG.position.set(7.45, 2.12, 8.0); exitG.rotation.y = -Math.PI / 2; g.add(exitG); // casada pela foto 1; face para o centro (-x), seta para a entrada
  // placa de extintor na parede direita
  const exs = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.22), signMat(extinguisherSign()));
  exs.position.set(W - 0.006, 1.5, 9.4); exs.rotation.y = -Math.PI / 2; g.add(exs);
  // quadros APR e CHECKLIST na parede da entrada (rente às baias)
  for (const [txt, y, z, seed, bw, bh] of [['APR', 1.58, aprZ + 0.27, 2, 0.46, 0.4], ['CHECKLIST', 1.1, aprZ + 0.33, 3, 0.56, 0.34]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.012, bh, bw), [signMat(boardSign(txt, seed)), signMat(null), signMat(null), signMat(null), signMat(null), signMat(null)]);
    b.material.slice(1).forEach((m) => m.color.set(0xdddddd));
    b.material[0].map.center.set(0.5, 0.5);
    b.position.set(bx + 0.008, y, z); b.rotation.y = 0; g.add(b);
    // BoxGeometry face +x mapeia u ao longo de -z: corrige para a leitura de quem olha de +x
    b.material[0].map.repeat.set(1, 1);
  }
  // painel institucional na parede do fundo, atrás das bancadas
  const bnX0 = xs[xs.length - 1] + hw + 0.17 + 0.25, bnX1 = W - 0.4, bnH = 1.15, bnY1 = 2.47;
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(bnX1 - bnX0, bnH), new THREE.MeshStandardMaterial({ map: bannerTexture(bnX1 - bnX0, bnH), roughness: 0.6 }));
  banner.position.set((bnX0 + bnX1) / 2, bnY1 - bnH / 2, 0.012); g.add(banner);
  // tomadas / caixas cinza na parede do fundo abaixo da faixa
  const outM = new THREE.MeshStandardMaterial({ color: 0xb9bcbd, roughness: 0.5 });
  const outDark = new THREE.MeshStandardMaterial({ color: 0x1b1c1d, roughness: 0.7 });
  const og = [], od = [];
  const R = rng(44);
  for (let x = bnX0 + 2.0; x < W - 0.4; x += 0.5 + R() * 0.25) {
    og.push(box(0.26, 0.18, 0.08, x, 2.24, 0.05));
    for (const dx of [-0.06, 0.06]) od.push(new THREE.CylinderGeometry(0.032, 0.032, 0.01, 16).rotateX(Math.PI / 2).translate(x + dx, 2.24, 0.093));
  }
  og.push(new THREE.CylinderGeometry(0.012, 0.012, W - bnX0 - 1.4, 8).rotateZ(Math.PI / 2).translate((bnX0 + 1.4 + W) / 2, 2.37, 0.03));
  g.add(new THREE.Mesh(mergeGeometries(og), outM)); g.add(new THREE.Mesh(mergeGeometries(od), outDark));

  // ---------- teto ----------
  const ceil = buildCeiling(g, ctx);

  scene.add(g);
  g.userData.fixtures = ceil.fixtures;
  return { group: g, fixtures: ceil.fixtures, tubeMaterial: ceil.tubeMaterial, hotspots: [], update() {} };
}
