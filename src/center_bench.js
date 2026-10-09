// DONO: agente "centro-solar". Bancada central de montagem: mesa de tampo fenólico preto, gabinete branco de 2 portas com
// rodízios, estrutura em perfil de alumínio (níveis com módulos azuis de instrumentos), painel de comando inclinado, fonte,
// lâmpada, rolo branco, cabos; mesa em L e caixa branca. Coordenadas locais: origem no centro da mesa, no piso; +z = frente.
import * as THREE from 'three';
import { Batch, mtx, profile, bar, caster, cylGeo, BOX } from './center_lib.js?v=20261009091201';
import { moduleFace, kwhFace, dialFace, lcdFace, plcFace, whiteBoxFace, cmdFace, psuFace } from './center_tex.js?v=20261009091201';

export const BENCH_DIM = { TW: 1.58, TD: 0.75, TH: 0.9 };
// Estrutura de alumínio (local): montantes em x = XL/XR, frente ZF, fundo ZB (medidos nas fotos calibradas).
export function frameDims(hw, hd) { return { XL: -hw + 0.3, XR: hw + 0.02, ZF: hd - 0.24, ZB: hd - 0.24 - 0.8 }; }

export function buildBench(M, q) {
  const g = new THREE.Group(); g.name = 'bancada-central';
  const B = new Batch();
  const { TW, TD, TH } = BENCH_DIM; const TT = 0.028;
  const hw = TW / 2, hd = TD / 2;

  // ---------------- mesa principal ----------------
  B.box(M.top, TW, TT, TD, 0, TH - TT / 2, 0, 0, 0, 0, true);
  B.box(M.topEdge, TW + 0.002, 0.004, TD + 0.002, 0, TH - TT + 0.001, 0); // borda inferior (núcleo fenólico)
  const legs = [[-hw + 0.04, hd - 0.1], [-hw + 0.04, -hd + 0.06]]; // lado direito apoiado na estrutura de alumínio
  for (const [x, z] of legs) {
    B.box(M.steel, 0.035, TH - TT - 0.1, 0.035, x, 0.1 + (TH - TT - 0.1) / 2, z, 0, 0, 0, true);
    B.box(M.steel, 0.05, 0.008, 0.05, x, 0.104, z);
    caster(B, M, x, 0.1, z, 0.038, x < 0 ? 0.3 : -0.4, x < 0 && z > 0);
  }
  // avental sob o tampo e travessas inferiores
  B.box(M.steel, TW - 0.12, 0.04, 0.025, -0.02, TH - TT - 0.02, hd - 0.1);
  B.box(M.steel, TW - 0.12, 0.04, 0.025, -0.02, TH - TT - 0.02, -hd + 0.06);
  { const x = -hw + 0.04; B.box(M.steel, 0.025, 0.04, TD - 0.16, x, TH - TT - 0.02, -0.02); B.box(M.steel, 0.025, 0.03, TD - 0.16, x, 0.24, -0.02); }
  

  // ---------------- gabinete branco (móvel sobre rodízios) ----------------
  const CW = 0.95, CD = 0.48, CH = 0.71, cx0 = -hw + 0.2, cz = hd - 0.08 - CD / 2, cy0 = 0.075;
  const ccx = cx0 + CW / 2;
  B.box(M.cab, CW, CH, CD - 0.02, ccx, cy0 + CH / 2, cz - 0.01, 0, 0, 0, true);
  B.box(M.cabDark, CW - 0.02, 0.03, 0.02, ccx, cy0 + 0.015, cz + CD / 2 - 0.02); // rodapé recuado
  const dw = (CW - 0.006) / 2;
  for (const s of [-1, 1]) {
    const dx = ccx + s * (dw / 2 + 0.002);
    B.box(M.cabDoor, dw, CH - 0.035, 0.018, dx, cy0 + 0.03 + (CH - 0.035) / 2, cz + CD / 2 - 0.009);
    // puxador em alça (barra cromada + 2 pés)
    const hx = ccx + s * 0.045, hy = cy0 + CH * 0.62;
    B.add(cylGeo(12), M.zinc, mtx(hx, hy, cz + CD / 2 + 0.015, 0, 0, 0, 0.006, 0.11, 0.006));
    for (const oy of [-0.045, 0.045]) B.add(cylGeo(8), M.zinc, mtx(hx, hy + oy, cz + CD / 2 + 0.0075, Math.PI / 2, 0, 0, 0.0045, 0.015, 0.0045));
  }
  for (const [x, z] of [[cx0 + 0.05, cz + CD / 2 - 0.06], [cx0 + CW - 0.05, cz + CD / 2 - 0.06], [cx0 + 0.05, cz - CD / 2 + 0.06], [cx0 + CW - 0.05, cz - CD / 2 + 0.06]]) caster(B, M, x, cy0, z, 0.026, 0.5);

  // ---------------- estrutura em perfil de alumínio ----------------
  const { XL, XR, ZF, ZB } = frameDims(hw, hd), XM = XL + 0.42, XBM = (XL + XR) / 2 + 0.05;
  const YT = 1.72, Y0 = 0.1, R2 = 1.46, R3 = 1.34, R4 = 1.22; // quadro baixo e comprido (foto2)
  const P = (a, b, s = 1, sy = 1) => profile(B, M.alu, a, b, s, true, sy);
  const Ps = (a, b, s = 1, sy = 1) => profile(B, M.alu, a, b, s, false, sy);
  // montantes
  for (const x of [XL, XR]) for (const z of [ZF, ZB]) {
    const onTable = x === XL && z === ZF; // montante dianteiro esquerdo apoiado no tampo (atrás do painel de comando)
    P([x, onTable ? TH : Y0, z], [x, YT + 0.02, z]); if (!onTable) caster(B, M, x, Y0, z, 0.04, 0.2, z === ZF); B.box(M.plasticBlack, 0.041, 0.006, 0.041, x, YT + 0.023, z); }
  P([XM, TH, ZF], [XM, YT - 0.02, ZF]); P([XBM, TH, ZB], [XBM, YT - 0.02, ZB]);
  // tira azul na ranhura frontal dos montantes da frente
  for (const x of [XL, XM, XR]) { const y0 = x === XR ? Y0 : TH; B.box(M.aluBlue, 0.009, YT - y0 - 0.02, 0.004, x, (y0 + YT) / 2, ZF + 0.0185); }
  for (const z of [ZF, ZB]) B.box(M.aluBlue, 0.004, YT - Y0 - 0.02, 0.009, XR + 0.0185, (Y0 + YT) / 2, z);
  // travessas frontais (x): topo, dupla, simples, dupla
  const front = [[YT, 1], [R2, 2], [R3, 1], [R4, 2]];
  for (const [y, n] of front) P([XL + 0.02, y, ZF], [XR - 0.02, y, ZF], 1, n);
  // travessas traseiras e laterais
  for (const y of [YT, 1.46, 1.2]) P([XL + 0.02, y, ZB], [XR - 0.02, y, ZB]);
  for (const x of [XL, XR]) { for (const y of [YT, R2, R3, R4]) Ps([x, y, ZF - 0.02], [x, y, ZB + 0.02]); P([x, 0.14, x === XL ? -0.24 : ZF - 0.02], [x, 0.14, ZB + 0.02]); }
  P([XL + 0.02, 0.14, ZB], [XR - 0.02, 0.14, ZB]);
  P([XR, TH - 0.05, ZF - 0.02], [XR, TH - 0.05, ZB + 0.02]);
  P([XR, 0.17, ZB + 0.03], [XR, TH - 0.08, ZF - 0.04], 0.9); // diagonal lateral
  // longarinas internas em profundidade (o "escalonamento" visto nas fotos)
  for (const x of [XM, XBM + 0.3]) for (const y of [R2, R3]) Ps([x, y, ZF - 0.02], [x, y, ZB + 0.02]);
  Ps([XL + 0.02, 1.53, ZF - 0.07], [XR - 0.02, 1.53, ZF - 0.07]); // trilho recuado atrás da 1ª fileira
  Ps([XL + 0.02, 1.43, ZF - 0.32], [XR - 0.02, 1.43, ZF - 0.32]);
  Ps([XL + 0.02, 1.3, ZF - 0.52], [XR - 0.02, 1.3, ZF - 0.52]);
  // cantoneiras nas junções frontais
  for (const [y] of front) for (const x of [XL, XM, XR]) { if (x === XM && y > 1.9) continue; B.box(M.zinc, 0.032, 0.032, 0.004, x + (x === XR ? -0.036 : 0.036), y - 0.036, ZF + 0.0205); }
  // tampas pretas das pontas das travessas laterais
  // ---------------- módulos azuis ----------------
  const faceCache = {};
  const faceMat = (type, w, h, seed) => {
    const k = type + w.toFixed(3) + h.toFixed(3);
    if (!faceCache[k]) faceCache[k] = new THREE.MeshStandardMaterial({ map: moduleFace(type, w, h, seed), roughness: 0.55, metalness: 0.15, name: 'face-' + type });
    return faceCache[k];
  };
  const JC = { r: M.jackRed, k: M.jackBlack, y: M.jackYellow, b: M.jackBlue, g: M.jackGreen };
  const jack = (x, y, c, z = 0) => { B.add(cylGeo(10), JC[c], mtx(x, y, z + 0.006, Math.PI / 2, 0, 0, 0.0058, 0.012, 0.0058)); B.add(cylGeo(8), M.jackBlack, mtx(x, y, z + 0.0125, Math.PI / 2, 0, 0, 0.0022, 0.002, 0.0022)); };
  const button = (x, y, mat, r = 0.011, z = 0) => { B.add(cylGeo(16), M.chrome, mtx(x, y, z + 0.004, Math.PI / 2, 0, 0, r * 1.25, 0.008, r * 1.25)); B.add(cylGeo(16), mat, mtx(x, y, z + 0.012, Math.PI / 2, 0, 0, r, 0.012, r)); };
  const lcdMats = {};
  const lcdMat = (key, lines, bg, fg) => lcdMats[key] || (lcdMats[key] = new THREE.MeshStandardMaterial({ map: lcdFace(lines, bg, fg), emissive: 0xffffff, emissiveMap: lcdFace(lines, '#000', fg, '#000'), emissiveIntensity: 0.55, roughness: 0.3, name: 'lcd' }));
  const kwhM = new THREE.MeshStandardMaterial({ map: kwhFace(), roughness: 0.5, name: 'kwh' });
  const dialV = new THREE.MeshStandardMaterial({ map: dialFace('V'), roughness: 0.25, name: 'dialV' }), dialA = new THREE.MeshStandardMaterial({ map: dialFace('A'), roughness: 0.25, name: 'dialA' });
  const plcM = new THREE.MeshStandardMaterial({ map: plcFace(), roughness: 0.6, name: 'plc' });
  const wbM = new THREE.MeshStandardMaterial({ map: whiteBoxFace(), roughness: 0.5, name: 'wbox' });

  // module(tipo, w, h, matriz da face (origem no centro, +z para fora), prof.)
  function module(type, w, h, m, d = 0.07, seed = 1) {
    B.within(m, () => {
      B.box(M.navy, w, h, d, 0, 0, -d / 2 - 0.001, 0, 0, 0, w * h > 0.03);
      B.add(new THREE.PlaneGeometry(1, 1), faceMat(type, w, h, seed), mtx(0, 0, 0.0005, 0, 0, 0, w, h, 1));
      const u = (a) => -w / 2 + a, v = (b) => h / 2 - b; // coordenadas a partir do canto sup. esq.
      switch (type) {
        case 'plc': {
          B.box(M.plasticBlack, w * 0.86, h * 0.72, 0.06, 0, -h * 0.08, 0.03);
          B.add(new THREE.PlaneGeometry(1, 1), plcM, mtx(0, -h * 0.08, 0.0605, 0, 0, 0, w * 0.86, h * 0.72, 1));
          for (let i = 0; i < 5; i++) B.box(M.plasticBlack, 0.012, 0.05, 0.012, u(0.04 + i * 0.035), -h / 2 - 0.02, 0.04);
          break;
        }
        case 'kwh': {
          B.box(M.greyPlastic, w * 0.9, h * 0.92, 0.055, 0, 0, 0.0275);
          B.add(new THREE.PlaneGeometry(1, 1), kwhM, mtx(0, 0, 0.0555, 0, 0, 0, w * 0.9, h * 0.92, 1));
          break;
        }
        case 'term': {
          for (let i = 0; i < 6; i++) button(u(0.035 + (i % 2) * (w - 0.07)), v(0.06 + Math.floor(i / 2) * 0.035), M.btnWhite, 0.009);
          break;
        }
        case 'dials': {
          for (let i = 0; i < 2; i++) {
            const x = u(w * (0.3 + i * 0.4)), y = v(h * 0.45);
            B.add(cylGeo(28), M.plasticBlack, mtx(x, y, 0.014, Math.PI / 2, 0, 0, 0.04, 0.028, 0.04));
            B.add(cylGeo(28), i ? dialA : dialV, mtx(x, y, 0.0285, Math.PI / 2, 0, 0, 0.034, 0.002, 0.034));
            B.add(cylGeo(28), M.glassClear, mtx(x, y, 0.031, Math.PI / 2, 0, 0, 0.037, 0.003, 0.037));
          }
          for (let i = 0; i < 4; i++) jack(u(w * (0.2 + i * 0.2)), v(h * 0.85), i % 2 ? 'k' : 'y');
          break;
        }
        case 'wmeter': {
          B.box(M.whitePlastic, w * 0.55, h * 0.55, 0.05, u(w * 0.35), v(h * 0.5), 0.025);
          B.add(new THREE.PlaneGeometry(1, 1), wbM, mtx(u(w * 0.35), v(h * 0.5), 0.0505, 0, 0, 0, w * 0.55, h * 0.55, 1));
          for (let i = 0; i < 3; i++) jack(u(w * 0.85), v(h * (0.3 + i * 0.22)), 'r');
          break;
        }
        case 'display': {
          B.box(M.plasticBlack, w * 0.62, h * 0.66, 0.06, u(w * 0.42), v(h * 0.5), 0.03);
          B.add(new THREE.PlaneGeometry(1, 1), lcdMat('mm', ['220.4 V', '12.37 A', '2.71 kW'], '#0e1b22', '#9fe7ff'), mtx(u(w * 0.42), v(h * 0.5), 0.0605, 0, 0, 0, w * 0.58, h * 0.6, 1));
          for (let i = 0; i < 3; i++) jack(u(w * 0.88), v(h * (0.3 + i * 0.2)), i === 2 ? 'k' : 'r');
          break;
        }
        case 'jacks': {
          for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) jack(u(w * (0.2 + i * 0.2)), v(h * (0.42 + r * 0.25)), r ? 'k' : (i === 3 ? 'b' : 'r'));
          B.box(M.whitePlastic, 0.036, 0.07, 0.05, u(w * 0.88), v(h * 0.5), 0.025);
          B.box(M.plasticBlack, 0.01, 0.014, 0.01, u(w * 0.88), v(h * 0.47), 0.053);
          break;
        }
        case 'buttons6': {
          for (let i = 0; i < 6; i++) button(u(0.04 + (i % 2) * 0.03), v(0.045 + Math.floor(i / 2) * 0.026), M.btnWhite, 0.0085);
          B.box(M.plasticBlack, w * 0.3, h * 0.25, 0.02, u(w * 0.78), v(h * 0.72), 0.01);
          B.add(new THREE.PlaneGeometry(1, 1), lcdMat('b6', ['2.14'], '#200', '#ff4a3a'), mtx(u(w * 0.78), v(h * 0.72), 0.0205, 0, 0, 0, w * 0.28, h * 0.22, 1));
          break;
        }
        case 'big': {
          const cols = [M.btnYellow, M.btnYellow, M.btnYellow, M.btnYellow];
          for (let i = 0; i < 4; i++) button(u(0.05 + i * 0.045), v(0.045), cols[i], 0.01);
          for (let i = 0; i < 4; i++) { B.add(cylGeo(16), M.btnRed, mtx(u(0.05 + i * 0.045), v(0.095), 0.018, Math.PI / 2, 0, 0, 0.014, 0.02, 0.014)); }
          for (let i = 0; i < 3; i++) for (let k = 0; k < 2; k++) button(u(w - 0.11 + k * 0.07), v(0.155 + i * 0.03), M.btnWhite, 0.009);
          for (let i = 0; i < 3; i++) button(u(0.04 + i * 0.03), v(0.03 + 0.2), [M.lampGreen, M.lampBlue, M.lampAmber][i], 0.008);
          for (let i = 0; i < 5; i++) jack(u(0.04 + i * 0.025), v(0.16), i % 2 ? 'k' : 'r');
          break;
        }
        case 'relay': {
          B.box(M.plasticBlack, w * 0.5, h * 0.32, 0.03, u(w * 0.32), v(h * 0.38), 0.015);
          B.add(new THREE.PlaneGeometry(1, 1), lcdMat('rl', ['88.8'], '#200', '#ff3b2f'), mtx(u(w * 0.32), v(h * 0.38), 0.0305, 0, 0, 0, w * 0.46, h * 0.28, 1));
          for (let i = 0; i < 3; i++) button(u(w * (0.2 + i * 0.25)), v(h * 0.78), [M.btnYellow, M.btnRed, M.btnGreen][i], 0.009);
          jack(u(w * 0.8), v(h * 0.3), 'r'); jack(u(w * 0.8), v(h * 0.5), 'k');
          break;
        }
        case 'breaker': {
          B.box(M.zinc, w * 0.85, 0.035, 0.008, 0, v(h * 0.55), 0.004);
          for (let i = 0; i < 3; i++) { B.box(M.whitePlastic, 0.0175, 0.085, 0.06, u(w * 0.25) + i * 0.018, v(h * 0.55), 0.035); B.box(M.plasticBlack, 0.009, 0.016, 0.012, u(w * 0.25) + i * 0.018, v(h * 0.55) + 0.006, 0.068); }
          jack(u(w * 0.8), v(h * 0.4), 'r'); jack(u(w * 0.8), v(h * 0.65), 'k');
          break;
        }
        default: {
          for (let i = 0; i < 3; i++) jack(u(w * (0.25 + i * 0.25)), v(h * 0.75), ['r', 'k', 'b'][i]);
        }
      }
    });
  }
  const fx = (a) => XL + a * (XR - XL) / 1.58; // posições medidas numa estrutura de 1,58 m, reescaladas
  // Fileira 1 (frente, sob a travessa do topo), da esquerda para a direita.
  // Fileira 1: tamanhos variados, presos à travessa do topo (fundo alinhado em ~1,58)
  const row1 = [['plc', 0.25, 0.2], ['kwh', 0.15, 0.17], ['term', 0.17, 0.13], ['dials', 0.28, 0.15], ['wmeter', 0.22, 0.14], ['display', 0.3, 0.17], ['jacks', 0.26, 0.13]];
  const inner = XR - XL - 0.05, sum = row1.reduce((a, r) => a + r[1], 0), sc = inner / sum;
  let xx = XL + 0.025;
  row1.forEach(([t, w, h], i) => { const W = w * sc - 0.012; module(t, W, h, mtx(xx + W / 2 + 0.006, YT - 0.02 - h / 2, ZF + 0.02 + 0.07), 0.07, i + 1); xx += w * sc; });
  // poucos módulos recuados (níveis escalonados) e no fundo
  module('wmeter', 0.12, 0.1, mtx(fx(0.42), R3 + 0.07, ZF - 0.32), 0.05, 11);
  module('buttons6', 0.17, 0.13, mtx(fx(0.68), R3 + 0.08, ZF - 0.32), 0.06, 12);
  module('big', 0.3, 0.24, mtx(fx(1.18), 1.18, ZF - 0.52), 0.07, 13);
  module('display', 0.22, 0.14, mtx(XR - 0.22, 1.4, ZB + 0.08), 0.06, 14);
  module('relay', 0.2, 0.14, mtx(fx(0.35), 1.3, ZB + 0.08), 0.06, 16);
  module('jacks', 0.18, 0.12, mtx(XR + 0.1, 1.6, ZF - 0.3, 0, Math.PI / 2, 0), 0.08, 19); // saliente na lateral
  module('relay', 0.2, 0.15, mtx(XR + 0.025 + 0.06, 1.25, ZB + 0.25, 0, Math.PI / 2, 0), 0.06, 20);
  module('breaker', 0.22, 0.15, mtx(fx(0.95), 1.4, ZB + 0.08), 0.06, 27);
  module('dials', 0.2, 0.13, mtx(fx(1.35), 1.05, ZF - 0.45), 0.06, 15);
  module('buttons6', 0.17, 0.14, mtx(XR - 0.13, 1.13, ZB + 0.12), 0.06, 30);
  module('kwh', 0.13, 0.16, mtx(XR - 0.42, 1.58, ZB + 0.08), 0.06, 31);

  // ---------------- itens sobre a mesa ----------------
  // painel de comando inclinado (perfil trapezoidal extrudado)
  const cw = 0.6, cd = 0.2, chF = 0.06, chB = 0.26;
  const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0, chB); sh.lineTo(-0.03, chB); sh.lineTo(-cd, chF); sh.lineTo(-cd, 0); sh.closePath();
  const cg = new THREE.ExtrudeGeometry(sh, { depth: cw, bevelEnabled: false }); // x=-prof (frente em -x), y=alt, z=largura
  const cX0 = -hw + 0.02, cZ0 = hd - 0.01; // canto frontal esquerdo
  B.add(cg, M.navy, mtx(cX0, TH, cZ0 - cd, 0, Math.PI / 2, 0), true);
  const slope = Math.atan2(chB - chF, cd - 0.03), sl = Math.hypot(chB - chF, cd - 0.03);
  const faceM = new THREE.MeshStandardMaterial({ map: cmdFace(), roughness: 0.5, metalness: 0.15, name: 'cmd' });
  const fcx = cX0 + cw / 2, fcy = TH + (chB + chF) / 2, fcz = cZ0 - cd + 0.03 + (cd - 0.03) / 2;
  const fm = mtx(fcx, fcy, fcz, -Math.PI / 2 + slope, 0, 0);
  B.add(new THREE.PlaneGeometry(1, 1), faceM, fm.clone().multiply(mtx(0, 0, 0.001, 0, 0, 0, cw, sl, 1)));
  B.within(fm, () => {
    const fx = (px) => -cw / 2 + px / 1000 * cw, fy = (py) => sl / 2 - py / 560 * sl;
    B.add(cylGeo(24), M.btnRed, mtx(fx(155), fy(360), 0.02, Math.PI / 2, 0, 0, 0.028, 0.03, 0.028)); // emergência cogumelo
    B.add(cylGeo(24), M.btnRed, mtx(fx(155), fy(360), 0.038, Math.PI / 2, 0, 0, 0.034, 0.012, 0.034));
    B.add(cylGeo(20), M.btnYellow, mtx(fx(155), fy(360), 0.003, Math.PI / 2, 0, 0, 0.045, 0.006, 0.045));
    button(fx(155), fy(140), M.btnGreen, 0.012); button(fx(230), fy(200), M.btnRed, 0.011);
    for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) button(fx(345 + i * 60), fy(150 + r * 60), M.btnWhite, 0.0095);
    for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) jack(fx(345 + i * 60), fy(380 + r * 70), 'r');
    B.add(new THREE.PlaneGeometry(1, 1), lcdMat('ihm', ['MOTOR 1', '0,0 A'], '#0f2a38', '#8fe0ff'), mtx(fx(785), fy(205), 0.004, 0, 0, 0, 0.16, 0.08, 1));
    B.box(M.whitePlastic, 0.07, 0.05, 0.02, fx(710), fy(365), 0.01);
    B.box(M.plasticBlack, 0.07, 0.05, 0.025, fx(860), fy(365), 0.012);
  });
  // equipamento preto atrás do painel
  B.box(M.plasticBlack, 0.16, 0.12, 0.14, cX0 + cw + 0.08, TH + 0.06, ZF - 0.05, 0, 0.3, 0, true);
  B.add(cylGeo(20), M.plasticBlack, mtx(cX0 + cw + 0.1, TH + 0.07, ZF + 0.03, Math.PI / 2, 0, 0, 0.045, 0.05, 0.045));
  // caixa azul com lâmpada
  const lx = 0.02, lz = hd - 0.33;
  B.box(M.navy, 0.22, 0.09, 0.15, lx, TH + 0.045, lz, 0, 0, 0, true);
  B.add(cylGeo(16), M.whitePlastic, mtx(lx, TH + 0.1, lz, 0, 0, 0, 0.018, 0.022, 0.018));
  B.add(cylGeo(16), M.zinc, mtx(lx, TH + 0.12, lz, 0, 0, 0, 0.013, 0.02, 0.013));
  B.add(new THREE.SphereGeometry(1, 20, 14), M.bulb, mtx(lx, TH + 0.165, lz, 0, 0, 0, 0.03, 0.036, 0.03));
  // fonte de bancada (chapa prateada com grelha + frente azul)
  const px_ = 0.38, pz = hd - 0.3;
  B.box(M.sheet, 0.25, 0.12, 0.2, px_, TH + 0.06, pz, 0, -0.08, 0, true);
  B.within(mtx(px_, TH, pz, 0, -0.08, 0), () => {
    for (let i = 0; i < 16; i++) B.box(M.plasticBlack, 0.006, 0.002, 0.15, -0.09 + i * 0.012, 0.1205, -0.01);
    B.add(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ map: psuFace(), roughness: 0.5, name: 'psu' }), mtx(0, 0.045, 0.1005, 0, 0, 0, 0.23, 0.08, 1));
    for (let i = 0; i < 4; i++) jack(-0.06 + i * 0.04, 0.02, i % 2 ? 'k' : 'r', 0.1);
    for (let i = 0; i < 2; i++) B.add(cylGeo(16), M.plasticBlack, mtx(0.06 + i * 0.035, 0.03, 0.108, Math.PI / 2, 0, 0, 0.011, 0.016, 0.011));
  });
  // painel inclinado pequeno (direita, junto ao montante)
  B.within(mtx(hw - 0.12, TH, ZF - 0.02, 0, -0.5, 0), () => {
    B.add(cg, M.navy, mtx(-0.09, 0, 0.06, 0, Math.PI / 2, 0, 0.45, 0.5, 0.3));
    const a = Math.atan2(0.5 * (chB - chF), 0.45 * (cd - 0.03));
    B.within(mtx(0, 0.5 * (chB + chF) / 2 + 0.004, 0.06 - 0.45 * cd / 2 + 0.01, -Math.PI / 2 + a, 0, 0), () => {
      for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) jack(-0.06 + i * 0.035, -0.02 + r * 0.04, i % 2 ? 'k' : 'r');
    });
  });
  // rolo branco (papel/espuma) deitado
  B.add(cylGeo(24), M.roll, mtx(-0.06, TH + 0.036, hd - 0.1, 0, 0.18, Math.PI / 2, 0.036, 0.3, 0.036));
  B.add(cylGeo(16), M.plasticBlack, mtx(-0.06, TH + 0.036, hd - 0.1, 0, 0.18, Math.PI / 2, 0.012, 0.302, 0.012));

  // ---------------- cabos ----------------
  const R = (s => () => ((s = (s * 16807) % 2147483647) / 2147483647))(9);
  const tube = (pts, r = 0.0045, seg = 64, mat = M.cable) => B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), seg, r, 6, false), mat, new THREE.Matrix4());
  const coil = (cx, cz, r0, loops, r = 0.004, y = TH + 0.005) => {
    const pts = []; const n = loops * 24;
    for (let i = 0; i <= n; i++) { const a = i / 24 * Math.PI * 2, rr = r0 * (0.8 + 0.25 * Math.sin(i * 0.37) + 0.1 * R()); pts.push([cx + Math.cos(a) * rr * 1.25, y + (i / n) * 0.02 + r, cz + Math.sin(a) * rr]); }
    tube(pts, r, n * 2);
  };
  if (q !== 'low') {
    coil(-hw + 0.3, hd - 0.2, 0.11, 3); coil(0.25, hd - 0.12, 0.16, 3, 0.0045); coil(0.62, hd - 0.14, 0.09, 2, 0.003);
    // cabos de teste soltos sobre o tampo (laços) e vermelhos pendurados nas travessas
    const yT = TH + 0.006;
    for (let k = 0; k < 7; k++) {
      const x0 = -hw + 0.15 + k * 0.2 + R() * 0.05, z0 = hd - 0.05 - R() * 0.15, pts = [];
      for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([x0 + Math.sin(t * 6.3 + k) * 0.09 + t * 0.12, yT + (i % 4 === 2 ? 0.006 : 0), z0 - t * 0.28 + Math.cos(t * 6.3 + k) * 0.06]); }
      tube(pts, 0.0032, 60, k === 3 ? M.cableRed : M.cable);
    }
    for (let k = 0; k < 4; k++) { const x = XL + 0.15 + k * 0.33, z = ZF - 0.32 - k * 0.04;
      tube([[x, R3 + 0.03, z], [x + 0.01, R3 - 0.12, z + 0.02], [x + 0.04, R3 - 0.2, z + 0.01], [x + 0.08, R3 - 0.1, z], [x + 0.09, R3 + 0.03, z]], 0.0028, 30, k % 2 ? M.cable : M.cableRed); }
    // cabos do CLP descendo até a mesa
    // cabos vermelho e preto saindo do inversor/CLP (canto sup. esquerdo) até a mesa
    tube([[XL + 0.07, 1.5, ZF + 0.08], [XL + 0.02, 1.35, ZF + 0.12], [XL - 0.02, 1.1, ZF + 0.12], [XL + 0.1, TH + 0.01, hd - 0.12]], 0.0045, 64, M.cableRed);
    tube([[XL + 0.11, 1.5, ZF + 0.08], [XL + 0.08, 1.3, ZF + 0.11], [XL + 0.12, 1.05, ZF + 0.13], [XL + 0.22, TH + 0.01, hd - 0.1]], 0.0045, 64);
    tube([[XL + 0.15, 1.5, ZF + 0.08], [XL + 0.18, 1.35, ZF + 0.09], [XL + 0.24, TH + 0.25, ZF + 0.1]], 0.004);
    tube([[XL - 0.01, 1.66, ZF + 0.06], [XL - 0.06, 1.4, ZF + 0.03], [XL - 0.05, 1.1, ZF], [XL + 0.02, TH + 0.2, ZF - 0.02]], 0.003, 64, M.cableRed);
    // dois cabos pretos descendo do teto até o quadro, com leve catenária
    for (const [x0, x1, zz] of [[XR - 0.12, XR - 0.06, ZF - 0.1]])
      tube([[x0, 2.84, zz - 0.15], [x0 + 0.03, 2.5, zz - 0.06], [(x0 + x1) / 2 + 0.04, 2.15, zz + 0.02], [x1, YT + 0.04, zz + 0.05], [x1 + 0.05, YT - 0.02, zz + 0.15]], 0.0028, 48);
    // cabos do painel de comando se espalhando
    tube([[cX0 + 0.25, TH + 0.08, cZ0 - 0.05], [cX0 + 0.3, TH + 0.01, cZ0 + 0.02], [cX0 + 0.5, TH + 0.006, cZ0 - 0.08], [0.1, TH + 0.006, hd - 0.2], [0.4, TH + 0.006, hd - 0.05]], 0.0035, 80);
    tube([[cX0 + 0.12, TH + 0.06, cZ0 - 0.02], [cX0 + 0.05, TH + 0.005, cZ0 + 0.03], [cX0 + 0.02, TH + 0.005, cZ0 - 0.2]], 0.003);
    // cabo da fonte descendo pela lateral até o piso
    tube([[px_ + 0.1, TH + 0.03, pz - 0.08], [hw - 0.02, TH + 0.01, pz - 0.1], [hw + 0.01, TH - 0.1, pz - 0.12], [hw + 0.02, 0.4, pz - 0.15], [hw + 0.1, 0.005, pz - 0.05], [hw + 0.3, 0.005, pz + 0.3]], 0.004, 80);
    // cabos traseiros pendurados nos módulos
    for (let i = 0; i < 4; i++) { const x = XL + 0.3 + i * 0.32; tube([[x, 1.53, ZF - 0.03], [x + 0.03, 1.3 - R() * 0.1, ZF - 0.2 - R() * 0.1], [x + 0.08, 1.2, ZB + 0.1]], 0.003, 24); }
  }

  B.build(g, 'bancada');
  return { group: g, frame: { XL, XR, ZF, ZB, YT } };
}

// Mesa em L (tampo preto, pés de tubo com mãos-francesas) + caixa branca ao fundo.
export function buildLTable(M) {
  const g = new THREE.Group(); g.name = 'mesa-L';
  const B = new Batch();
  const { TW, TD, TH } = BENCH_DIM;
  const fd = frameDims(TW / 2, TD / 2);
  // tampo longo emendado ao tampo principal, recuando em diagonal até a caixa branca; estrutura em perfil com rodízios
  const W = 0.64, L = 1.9;
  const piv = new THREE.Group(); piv.position.set(fd.XR + 0.02, 0, TD / 2 - 0.47); piv.rotation.y = -0.13; g.add(piv);
  const cx = W / 2, cz = -L / 2;
  B.box(M.top, W, 0.028, L, cx, TH - 0.014, cz, 0, 0, 0, true);
  B.box(M.topEdge, W + 0.002, 0.004, L + 0.002, cx, TH - 0.027, cz);
  const P = (a, b) => profile(B, M.alu, a, b, 1, true);
  const lx = [0.05, W - 0.05], lz = [-0.06, -L / 2, -L + 0.06];
  for (const x of lx) for (const z of lz) { P([x, 0.1, z], [x, TH - 0.03, z]); caster(B, M, x, 0.1, z, 0.038, 0.4 + x, z === lz[0]); }
  for (const x of lx) { P([x, TH - 0.05, -0.04], [x, TH - 0.05, -L + 0.04]); P([x, 0.16, -0.04], [x, 0.16, -L + 0.04]);
    P([x, 0.2, -0.1], [x, TH - 0.08, -L / 2 + 0.06]); P([x, 0.2, -L + 0.1], [x, TH - 0.08, -L / 2 - 0.06]); }
  for (const z of lz) { P([0.07, TH - 0.05, z], [W - 0.07, TH - 0.05, z]); }
  P([0.07, 0.16, -L / 2], [W - 0.07, 0.16, -L / 2]);
  // cabos enrolados e objetos
  const coil = (ccx, ccz, rr, loops, mat, r = 0.0038) => { const p2 = []; const n = loops * 22; for (let i = 0; i <= n; i++) { const a = i / 22 * Math.PI * 2, q = rr * (0.85 + 0.2 * Math.sin(i * 0.6)); p2.push(new THREE.Vector3(ccx + Math.cos(a) * q * 1.3, TH + 0.005 + i * 0.0003, ccz + Math.sin(a) * q)); }
    B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p2), n * 2, r, 6), mat, new THREE.Matrix4()); };
  coil(cx - 0.02, -0.35, 0.13, 3, M.cable); coil(cx + 0.1, -1.0, 0.1, 3, M.cable); coil(cx - 0.1, -1.5, 0.08, 2, M.cable, 0.003);
  B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[cx + 0.2, TH + 0.006, -0.5], [W + 0.01, TH, -0.6], [W + 0.03, TH - 0.25, -0.62], [W + 0.02, TH - 0.45, -0.58]].map((p) => new THREE.Vector3(...p))), 40, 0.003, 6), M.cableRed, new THREE.Matrix4());
  B.add(cylGeo(20), M.glassClear, mtx(0.12, TH + 0.06, -0.12, 0, 0, 0, 0.04, 0.12, 0.04));
  B.box(M.sheet, 0.1, 0.06, 0.08, 0.25, TH + 0.03, -0.16);
  B.build(piv, 'mesaL');
  return { group: g };
}
