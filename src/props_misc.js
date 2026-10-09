// DONO: agente "acessórios". Extintor com suporte de piso, mesa lateral branca, bancada escura com caixas de ferramentas,
// armário/painel elétrico cinza-claro com porta, visor, dobradiças e estrutura tubular lateral.
import * as THREE from 'three';
import { merge, box, cyl, tube, RoundedBoxGeometry } from './props_util.js?v=20261009141848';
import { extLabel, powderMaps, tabletopMaps, noiseTex, shockSticker, grimeMap } from './props_tex.js?v=20261009141848';

// ─────────────────────────── Extintor PQS 6 kg em suporte de piso
export function buildExtinguisher() {
  const g = new THREE.Group(); g.name = 'extintor';
  const red = new THREE.MeshPhysicalMaterial({ color: 0xa3150f, roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.18, roughnessMap: noiseTex(111, 120, 40, 2) });
  const black = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.55 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, metalness: 1, roughness: 0.22 });
  const wire = new THREE.MeshStandardMaterial({ color: 0x2a2a2c, metalness: 0.5, roughness: 0.5 });
  const y0 = 0.1, R = 0.083, H = 0.45;
  // corpo (lathe com fundo e ombro arredondados)
  const prof = [[0, y0], [R - 0.012, y0], [R - 0.002, y0 + 0.008], [R, y0 + 0.03], [R, y0 + H - 0.05], [R - 0.012, y0 + H - 0.018], [R - 0.035, y0 + H - 0.002], [0.022, y0 + H + 0.008], [0, y0 + H + 0.008]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 40), red); body.castShadow = true; body.receiveShadow = true; g.add(body);
  // rótulo envolvente (frente = -x local → gira depois)
  const lab = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.0015, R + 0.0015, 0.2, 32, 1, true, Math.PI * 0.05, Math.PI * 0.9),
    new THREE.MeshStandardMaterial({ map: extLabel(), roughness: 0.45 }));
  lab.position.y = y0 + H * 0.55; g.add(lab);
  // selo/etiqueta de inspeção amarela
  const tagc = document.createElement('canvas'); tagc.width = 64; tagc.height = 96; const tx = tagc.getContext('2d');
  tx.fillStyle = '#f2d23a'; tx.fillRect(0, 0, 64, 96); tx.fillStyle = '#1d3f8f'; tx.fillRect(0, 0, 64, 20); tx.fillStyle = '#222';
  for (let i = 0; i < 6; i++) tx.fillRect(6, 28 + i * 10, 40 + (i % 2) * 12, 4);
  const tagT = new THREE.CanvasTexture(tagc); tagT.colorSpace = THREE.SRGBColorSpace;
  const tag = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.003, R + 0.003, 0.085, 16, 1, true, -0.25, 0.5), new THREE.MeshStandardMaterial({ map: tagT, roughness: 0.6 }));
  tag.position.y = y0 + H * 0.36; tag.rotation.y = Math.PI / 2 + 0.35; g.add(tag);
  // válvula, alça, manômetro
  const valve = merge([cyl(0.016, 0.02, 0.05, 0, y0 + H + 0.03, 0, 16), box(0.07, 0.022, 0.03, 0.015, y0 + H + 0.06, 0)]);
  const vm = new THREE.Mesh(valve, chrome); g.add(vm);
  const lever = merge([box(0.12, 0.008, 0.028, 0.035, y0 + H + 0.09, 0), box(0.11, 0.008, 0.028, 0.03, y0 + H + 0.075, 0)]);
  lever.rotateZ(0); const lm = new THREE.Mesh(lever, black); g.add(lm);
  const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.012, 20), new THREE.MeshStandardMaterial({ color: 0xf0f0ea, roughness: 0.3 }));
  gauge.rotation.set(0, 0, Math.PI / 2); gauge.position.set(0.006, y0 + H + 0.062, 0.034); g.add(gauge);
  // mangueira preta fazendo laço por cima (como na foto) até o esguicho preso no corpo
  const T = y0 + H;
  const hose = tube(new THREE.CatmullRomCurve3([
    [0.035, T + 0.058, 0.0], [0.04, T + 0.1, 0.03], [0.0, T + 0.19, 0.05], [-0.035, T + 0.2, 0.13], [-0.04, T + 0.12, 0.19],
    [-0.04, T + 0.03, 0.16], [-0.05, T - 0.02, 0.09], [-0.075, T - 0.08, 0.04], [-0.086, T - 0.2, 0.03],
].map((p) => new THREE.Vector3(...p))), 0.009, 0, 64, 8);
  const hm = new THREE.Mesh(hose, black); hm.castShadow = true; g.add(hm);
  // suporte de piso em arame (anel no corpo + base + 3 pernas)
  const ws = [];
  const ring = (y, r) => { const t = new THREE.TorusGeometry(r, 0.004, 6, 32); t.rotateX(Math.PI / 2); t.translate(0, y, 0); return t; };
  ws.push(ring(0.38, R + 0.012), ring(y0 - 0.004, R + 0.005));
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI * 2 / 3 + 0.5, c = Math.cos(a), s = Math.sin(a);
    ws.push(tube([[c * (R + 0.012), 0.38, s * (R + 0.012)], [c * (R + 0.02), 0.2, s * (R + 0.02)], [c * 0.14, 0.004, s * 0.14]], 0.0042, 0.04, 20, 6));
    ws.push(tube([[c * (R + 0.005), y0 - 0.004, s * (R + 0.005)], [c * 0.02, y0 - 0.004, s * 0.02]], 0.0035, 0, 4, 6));
    const foot = new THREE.SphereGeometry(0.008, 8, 6); foot.translate(c * 0.14, 0.006, s * 0.14); ws.push(foot);
  }
  const wm = new THREE.Mesh(merge(ws), wire); wm.castShadow = true; g.add(wm);
  return g;
}

// ─────────────────────────── Mesa lateral branca (tampo melamínico, estrutura grafite em quadro)
export function buildSideTable({ w = 1.2, d = 0.6, h = 0.76 } = {}) {
  const g = new THREE.Group(); g.name = 'mesa_lateral';
  const tt = tabletopMaps();
  const top = new THREE.Mesh(new RoundedBoxGeometry(w, 0.026, d, 2, 0.004), new THREE.MeshStandardMaterial({ color: 0xffffff, map: tt.col, roughness: 0.5, roughnessMap: tt.rough }));
  top.position.y = h - 0.013; top.castShadow = true; top.receiveShadow = true; g.add(top);
  const edge = new THREE.Mesh(box(w + 0.002, 0.02, d + 0.002, 0, h - 0.014, 0), new THREE.MeshStandardMaterial({ color: 0xd9d7d0, roughness: 0.6 }));
  g.add(edge);
  const s = 0.04, fr = [];
  for (const sx of [-1, 1]) {
    const x = sx * (w / 2 - 0.07);
    for (const sz of [-1, 1]) fr.push(box(s, h - 0.05, s, x, (h - 0.05) / 2 + 0.03, sz * (d / 2 - 0.05)));
    fr.push(box(0.05, 0.03, d - 0.02, x, 0.015, 0));               // sapata/esqui no piso
    fr.push(box(s, s, d - 0.1, x, h - 0.05, 0));                    // travessa superior
  }
  fr.push(box(w - 0.14, 0.05, 0.025, 0, h - 0.06, -(d / 2 - 0.05)));  // viga traseira
  const frame = new THREE.Mesh(merge(fr), new THREE.MeshStandardMaterial({ color: 0x9a9ea3, roughness: 0.4, metalness: 0.65, roughnessMap: noiseTex(121, 150, 50, 3) }));
  frame.castShadow = true; frame.receiveShadow = true; g.add(frame);
  return g;
}

// ─────────────────────────── Bancada escura com prateleiras e caixas de ferramentas (fundo à direita)
export function buildToolBench({ w = 1.3, d = 0.55, h = 0.86 } = {}) {
  const g = new THREE.Group(); g.name = 'bancada_ferramentas';
  const pm = powderMaps();
  const steel = new THREE.MeshStandardMaterial({ color: 0x3a3b3e, roughness: 0.55, metalness: 0.35, normalMap: pm.nrm, normalScale: new THREE.Vector2(0.3, 0.3), roughnessMap: pm.rough });
  const parts = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) parts.push(box(0.04, h, 0.04, sx * (w / 2 - 0.02), h / 2, sz * (d / 2 - 0.02)));
  parts.push(box(w, 0.035, d, 0, h - 0.018, 0));
  for (const y of [0.12, 0.45]) parts.push(box(w - 0.02, 0.02, d - 0.02, 0, y, 0));
  const m = new THREE.Mesh(merge(parts), steel); m.castShadow = true; m.receiveShadow = true; g.add(m);
  // caixas de ferramentas azuis (maletas plásticas) + caixa verde-amarela + objetos nas prateleiras
  const plastic = (c, r = 0.45) => new THREE.MeshPhysicalMaterial({ color: c, roughness: r, clearcoat: 0.2 });
  const items = [
    [0.44, 0.17, 0.26, -0.36, h, 0.02, 0x1d3f7a, 0.12], [0.38, 0.2, 0.24, 0.06, h, -0.05, 0x24488d, -0.08], [0.3, 0.14, 0.22, 0.43, h, 0.04, 0x162f5e, 0.2],
    [0.2, 0.09, 0.16, -0.05, h + 0.2, -0.03, 0xc3cf3a, 0.3],
    [0.34, 0.2, 0.3, -0.35, 0.47, 0, 0x8a6a3a, 0], [0.36, 0.18, 0.3, 0.25, 0.47, 0.02, 0x7a5a2c, 0.05], [0.5, 0.24, 0.36, 0, 0.13, 0, 0x5b5d60, 0],
  ];
  for (const [bw, bh, bd, x, y, z, c, ry] of items) {
    const b = new THREE.Mesh(new RoundedBoxGeometry(bw, bh, bd, 2, 0.012), plastic(c));
    b.position.set(x, y + bh / 2, z); b.rotation.y = ry; b.castShadow = true; b.receiveShadow = true; g.add(b);
    if (c >> 16 < 0x30 && y >= h) { // alça + fechos da maleta azul
      const hd = new THREE.Mesh(merge([box(bw * 0.4, 0.02, 0.025, 0, bh + 0.02, 0), box(0.02, 0.03, 0.025, -bw * 0.2, bh + 0.005, 0), box(0.02, 0.03, 0.025, bw * 0.2, bh + 0.005, 0)]), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 }));
      hd.position.copy(b.position).setY(y); hd.rotation.y = ry; g.add(hd);
      const lat = new THREE.Mesh(merge([box(0.035, 0.03, 0.006, -bw * 0.3, bh * 0.75, bd / 2 + 0.003), box(0.035, 0.03, 0.006, bw * 0.3, bh * 0.75, bd / 2 + 0.003)]), new THREE.MeshStandardMaterial({ color: 0xd0d0d0, metalness: 0.6, roughness: 0.4 }));
      lat.position.copy(b.position).setY(y); lat.rotation.y = ry; g.add(lat);
    }
  }
  // carretel de cabo (extensão) no piso ao lado
  const reel = new THREE.Group();
  const rOr = new THREE.MeshStandardMaterial({ color: 0xd9a21b, roughness: 0.5 });
  for (const zz of [-0.07, 0.07]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.012, 32), rOr); f.rotation.x = Math.PI / 2; f.position.z = zz; reel.add(f); }
  const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.13, 32), new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.6, normalMap: powderMaps().nrm }));
  coil.rotation.x = Math.PI / 2; reel.add(coil);
  const hnd = new THREE.Mesh(tube([[0, 0.15, -0.075], [0, 0.26, -0.075], [0, 0.26, 0.075], [0, 0.15, 0.075]], 0.012, 0.03, 24, 6), rOr); reel.add(hnd);
  reel.position.set(w / 2 + 0.22, 0.155, 0.05); reel.rotation.y = 0.4; reel.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.add(reel);
  return g;
}

// ─────────────────────────── Armário/painel elétrico cinza-claro (frente = +x local)
export function buildCabinet({ w = 0.6, d = 0.45, h = 1.52, plinth = 0.1 } = {}) {
  const g = new THREE.Group(); g.name = 'armario_eletrico';
  const pm = powderMaps();
  const paint = new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.6, normalMap: pm.nrm, normalScale: new THREE.Vector2(0.25, 0.25), roughnessMap: pm.rough, map: grimeMap() });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1a1b, roughness: 0.5 });
  const H = h, y0 = plinth;
  // corpo (a porta é peça separada, com fresta)
  const bodyParts = [box(d - 0.02, H, 0.018, -0.01, y0 + H / 2, -w / 2 + 0.009), box(d - 0.02, H, 0.018, -0.01, y0 + H / 2, w / 2 - 0.009), box(0.018, H, w, -d / 2 + 0.009, y0 + H / 2, 0),
    box(d - 0.02, 0.018, w, -0.01, y0 + 0.009, 0), box(d - 0.02, 0.018, w, -0.01, y0 + H - 0.009, 0)];
  const body = new THREE.Mesh(merge(bodyParts), paint); body.castShadow = true; body.receiveShadow = true; g.add(body);
  // teto/chapéu com pingadeira
  const roof = new THREE.Mesh(new RoundedBoxGeometry(d + 0.03, 0.03, w + 0.03, 2, 0.006), paint); roof.position.set(0, y0 + H + 0.035, 0); roof.castShadow = true; g.add(roof);
  const roofGap = new THREE.Mesh(box(d - 0.06, 0.02, w - 0.06, 0, y0 + H + 0.01, 0), dark); g.add(roofGap);
  // rodapé/plinth
  const pl = new THREE.Mesh(box(d - 0.02, plinth, w - 0.01, -0.01, plinth / 2, 0), new THREE.MeshStandardMaterial({ color: 0x2c2c2e, roughness: 0.6 })); pl.receiveShadow = true; g.add(pl);
  // porta (ligeiramente recuada, com fresta escura em volta)
  const door = new THREE.Mesh(new RoundedBoxGeometry(0.022, H - 0.02, w - 0.012, 2, 0.004), paint);
  door.position.set(d / 2 - 0.02, y0 + H / 2, 0); door.castShadow = true; door.receiveShadow = true; g.add(door);
  const gap = new THREE.Mesh(box(0.02, H - 0.008, w - 0.002, d / 2 - 0.032, y0 + H / 2, 0), dark); g.add(gap);
  const fx = d / 2 - 0.0085; // face frontal da porta
  // dobradiças (lado direito de quem olha = -z local quando frente é +x... ficam no lado +z)
  const hinges = [];
  for (const yy of [0.18, H / 2, H - 0.18]) hinges.push(cyl(0.008, 0.008, 0.07, fx - 0.004, y0 + yy, w / 2 - 0.004, 12));
  g.add(new THREE.Mesh(merge(hinges), new THREE.MeshStandardMaterial({ color: 0xa8a8a4, metalness: 0.8, roughness: 0.35 })));
  // fechos 1/4 de volta (lado -z)
  for (const yy of [H * 0.25, H * 0.75]) { const l = new THREE.Mesh(cyl(0.013, 0.013, 0.012, 0, 0, 0, 16), dark); l.rotation.z = Math.PI / 2; l.position.set(fx + 0.005, y0 + yy, -w / 2 + 0.05); g.add(l); }
  // visor: IHM/indicador digital (preto com dígitos), seletor, botão, grelhas de ventilação
  const dispC = document.createElement('canvas'); dispC.width = 128; dispC.height = 48; const dx = dispC.getContext('2d');
  dx.fillStyle = '#0b0d0c'; dx.fillRect(0, 0, 128, 48); dx.fillStyle = '#1d2a22'; dx.font = 'bold 26px monospace'; dx.fillText('60.0', 22, 34); dx.fillStyle = '#333'; dx.fillRect(100, 10, 18, 8);
  const dispT = new THREE.CanvasTexture(dispC); dispT.colorSpace = THREE.SRGBColorSpace;
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.055), new THREE.MeshStandardMaterial({ map: dispT, emissive: 0xffffff, emissiveMap: dispT, emissiveIntensity: 0.04, roughness: 0.15 }));
  disp.rotation.y = Math.PI / 2; disp.position.set(fx + 0.012, y0 + H * 0.87, -0.02); g.add(disp);
  const bezel = new THREE.Mesh(box(0.012, 0.075, 0.165, fx + 0.004, y0 + H * 0.87, -0.02), dark); g.add(bezel);
  const sel = new THREE.Mesh(box(0.012, 0.05, 0.05, fx + 0.004, y0 + H * 0.78, -0.03), dark); g.add(sel);
  const knob = new THREE.Mesh(cyl(0.012, 0.014, 0.025, 0, 0, 0, 12), new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.4 })); knob.rotation.z = Math.PI / 2; knob.position.set(fx + 0.02, y0 + H * 0.78, -0.03); g.add(knob);
  const btn = new THREE.Mesh(box(0.012, 0.045, 0.045, fx + 0.004, y0 + H * 0.69, -0.035), dark); g.add(btn);
  const btnc = new THREE.Mesh(cyl(0.011, 0.011, 0.012, 0, 0, 0, 12), new THREE.MeshStandardMaterial({ color: 0x1f6b2a, roughness: 0.4 })); btnc.rotation.z = Math.PI / 2; btnc.position.set(fx + 0.014, y0 + H * 0.69, -0.035); g.add(btnc);
  // grelhas (venezianas)
  const louv = [];
  const grille = (cy, cz, gw, gh, n) => { louv.push(box(0.006, gh + 0.012, gw + 0.012, fx + 0.002, cy, cz)); for (let i = 0; i < n; i++) louv.push(box(0.012, 0.006, gw, fx + 0.006, cy - gh / 2 + (i + 0.5) * gh / n, cz)); };
  grille(y0 + H * 0.4, 0.02, 0.13, 0.15, 9); grille(y0 + H * 0.17, 0.09, 0.1, 0.12, 7);
  g.add(new THREE.Mesh(merge(louv), paint));
  const louvBack = new THREE.Mesh(box(0.004, 0.15, 0.13, fx - 0.003, y0 + H * 0.4, 0.02), dark); g.add(louvBack);
  const louvBack2 = new THREE.Mesh(box(0.004, 0.12, 0.1, fx - 0.003, y0 + H * 0.17, 0.09), dark); g.add(louvBack2);
  // adesivo de risco elétrico
  const st = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.08), new THREE.MeshStandardMaterial({ map: shockSticker(), transparent: true, roughness: 0.4, polygonOffset: true, polygonOffsetFactor: -2 }));
  st.rotation.y = Math.PI / 2; st.position.set(fx + 0.001, y0 + H * 0.56, -0.03);
  // estrutura tubular cinza no lado +z (como na foto)
  const tb = [];
  const zt = -(w / 2 + 0.05);
  for (const xx of [d / 2 - 0.03, -d / 2 + 0.05]) tb.push(tube([[xx, 0.02, zt], [xx, y0 + H * 0.78, zt]], 0.016, 0, 2, 10));
  for (const yy of [0.08, y0 + H * 0.4, y0 + H * 0.78]) { const t = new THREE.CylinderGeometry(0.013, 0.013, d - 0.06, 10); t.rotateZ(Math.PI / 2); t.translate(0.01, yy, zt); tb.push(t); }
  for (const yy of [y0 + H * 0.4, y0 + H * 0.78]) { const t = new THREE.CylinderGeometry(0.01, 0.01, 0.05, 8); t.rotateX(Math.PI / 2); t.translate(0.01, yy, -(w / 2 + 0.025)); tb.push(t); }
  const tm = new THREE.Mesh(merge(tb), new THREE.MeshStandardMaterial({ color: 0xb4b6b8, roughness: 0.4, metalness: 0.6 })); tm.castShadow = true; g.add(tm);
  // prateleira lateral (lado +z local) com maleta preta, como na foto
  const trayM = new THREE.MeshStandardMaterial({ color: 0xe8e6e0, roughness: 0.5 });
  const tray = new THREE.Mesh(merge([box(d * 0.9, 0.015, 0.32, 0.03, y0 + H * 0.62, w / 2 + 0.17), box(0.02, 0.12, 0.3, 0.03 - d * 0.4, y0 + H * 0.62 - 0.06, w / 2 + 0.17)]), trayM); tray.castShadow = true; g.add(tray);
  const case_ = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.1, 0.26, 2, 0.02), new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.7 }));
  case_.position.set(0.0, y0 + H * 0.62 + 0.06, w / 2 + 0.17); case_.rotation.y = 0.15; case_.castShadow = true; g.add(case_);
  // prensa-cabos no teto + eletroduto subindo
  return g;
}
