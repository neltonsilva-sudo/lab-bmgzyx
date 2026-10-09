// DONO: agente "centro-solar". Texturas procedurais (canvas) dos módulos azuis de instrumentos, medidores, mostradores,
// painel de comando inclinado, fonte de bancada, células fotovoltaicas e tampo fenólico.
import * as THREE from 'three';
import { canvas, tex, rng, txt, rrect } from './center_lib.js?v=20261009095432';

const NAVY = '#18236e', NAVY2 = '#131c5c';
const PX = 1400; // pixels por metro nas faces dos módulos

// Base de face de módulo: chapa azul-marinho com serigrafia branca, parafusos e etiqueta.
function faceBase(x, W, H, R, opt = {}) {
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, opt.c1 || NAVY); g.addColorStop(1, opt.c2 || NAVY2);
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  // leve textura de pintura eletrostática
  for (let i = 0; i < W * H / 60; i++) { x.fillStyle = `rgba(${R() > 0.5 ? '255,255,255' : '0,0,0'},${0.02 + R() * 0.03})`; x.fillRect(R() * W, R() * H, 1.5, 1.5); }
  // borda dobrada (chanfro claro em cima, sombra embaixo)
  x.strokeStyle = 'rgba(255,255,255,0.22)'; x.lineWidth = 3; x.strokeRect(2, 2, W - 4, H - 4);
  x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 2; x.beginPath(); x.moveTo(2, H - 2); x.lineTo(W - 2, H - 2); x.stroke();
  // parafusos
  const s = Math.max(5, W * 0.022);
  for (const [a, b] of [[s * 2, s * 2], [W - s * 2, s * 2], [s * 2, H - s * 2], [W - s * 2, H - s * 2]]) {
    const gr = x.createRadialGradient(a - s * 0.3, b - s * 0.3, 0, a, b, s); gr.addColorStop(0, '#f4f4f4'); gr.addColorStop(1, '#7c8088');
    x.fillStyle = gr; x.beginPath(); x.arc(a, b, s, 0, 7); x.fill(); x.strokeStyle = '#44474e'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(a - s * 0.6, b); x.lineTo(a + s * 0.6, b); x.stroke();
  }
  // desgaste: riscos finos, poeira na borda inferior, marcas de dedo
  for (let i = 0; i < W * H / 9000 + 6; i++) { x.strokeStyle = `rgba(200,210,235,${0.06 + R() * 0.12})`; x.lineWidth = 0.8; const a = R() * W, b = R() * H, t = R() * 6.28, L = 4 + R() * W * 0.08; x.beginPath(); x.moveTo(a, b); x.lineTo(a + Math.cos(t) * L, b + Math.sin(t) * L); x.stroke(); }
  const gd = x.createLinearGradient(0, H * 0.82, 0, H); gd.addColorStop(0, 'rgba(150,150,140,0)'); gd.addColorStop(1, 'rgba(150,150,140,0.10)'); x.fillStyle = gd; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 3; i++) { const a = R() * W, b = R() * H, r = 8 + R() * 18; const gr = x.createRadialGradient(a, b, 0, a, b, r); gr.addColorStop(0, 'rgba(180,190,220,0.07)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(a - r, b - r, 2 * r, 2 * r); }
  if (opt.label !== false) { // etiqueta branca no topo
    const lw = W * (opt.lw || 0.5), lh = Math.max(14, H * 0.09);
    x.fillStyle = '#eef0f2'; rrect(x, (W - lw) / 2, H * 0.035, lw, lh, 3); x.fill();
    txt(x, opt.label || 'MÓDULO', lh * 0.62, W / 2, H * 0.035 + lh / 2, '#1a2458', 'center', '700');
  }
}
function silk(x, pts, w = 1.6) { x.strokeStyle = 'rgba(235,240,255,0.85)'; x.lineWidth = w; x.beginPath(); x.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); x.stroke(); }
function ring(x, a, b, r, col = 'rgba(235,240,255,0.9)') { x.strokeStyle = col; x.lineWidth = 1.5; x.beginPath(); x.arc(a, b, r, 0, 7); x.stroke(); }

// Cada tipo de face devolve { map } desenhado em W x H proporcionais às medidas (m).
export function moduleFace(type, w, h, seed = 3) {
  const W = Math.round(w * PX), H = Math.round(h * PX); const [c, x] = canvas(W, H); const R = rng(seed);
  const u = (m) => m * PX; // metros → px (origem no canto sup. esq.)
  switch (type) {
    case 'term': {
      faceBase(x, W, H, R, { label: 'CONTATOR' });
      silk(x, [u(0.04), u(0.04), u(0.04), H - u(0.03), W - u(0.04), H - u(0.03)]);
      silk(x, [u(0.06), u(0.05), u(0.09), u(0.07), u(0.09), u(0.11)]); silk(x, [W - u(0.06), u(0.05), W - u(0.08), u(0.08)]);
      for (let i = 0; i < 3; i++) { txt(x, ['L1', 'L2', 'L3'][i], u(0.008), u(0.018), u(0.05 + i * 0.022), '#dfe6ff'); txt(x, ['T1', 'T2', 'T3'][i], u(0.008), W - u(0.018), u(0.05 + i * 0.022), '#dfe6ff'); }
      break;
    }
    case 'dials': {
      faceBase(x, W, H, R, { label: 'VOLT / AMP', lw: 0.4 });
      txt(x, 'V', u(0.012), u(0.055), H - u(0.022), '#e6ecff'); txt(x, 'A', u(0.012), W - u(0.055), H - u(0.022), '#e6ecff');
      break;
    }
    case 'wmeter': {
      faceBase(x, W, H, R, { label: 'TEMPORIZADOR', lw: 0.55 });
      for (let i = 0; i < 3; i++) ring(x, W - u(0.025), u(0.05 + i * 0.03), u(0.008));
      break;
    }
    case 'display': {
      faceBase(x, W, H, R, { label: 'MULTIMEDIDOR', lw: 0.55 });
      silk(x, [u(0.015), H - u(0.02), W - u(0.015), H - u(0.02)]);
      break;
    }
    case 'jacks': {
      faceBase(x, W, H, R, { label: 'ENTRADAS', lw: 0.45 });
      for (let i = 0; i < 4; i++) txt(x, ['R', 'S', 'T', 'N'][i], u(0.009), u(0.04 + i * 0.03), H - u(0.018), '#e6ecff');
      silk(x, [u(0.03), u(0.07), W - u(0.03), u(0.07)]);
      break;
    }
    case 'buttons6': {
      faceBase(x, W, H, R, { label: 'SEQUÊNCIA', lw: 0.5 });
      for (let i = 0; i < 6; i++) ring(x, u(0.04 + (i % 2) * 0.03), u(0.045 + Math.floor(i / 2) * 0.026), u(0.011));
      break;
    }
    case 'big': {
      faceBase(x, W, H, R, { label: 'COMANDOS · PARTIDA', lw: 0.5 });
      const lab = ['LIGA', 'DESL', 'EMERG', 'REARME'];
      for (let i = 0; i < 4; i++) { txt(x, lab[i], u(0.0075), u(0.05 + i * 0.045), u(0.118), '#e8eeff', 'center', '600'); ring(x, u(0.05 + i * 0.045), u(0.095), u(0.016)); }
      silk(x, [u(0.02), u(0.13), W - u(0.02), u(0.13)]);
      for (let i = 0; i < 3; i++) { txt(x, 'S' + (i + 1), u(0.008), W - u(0.075), u(0.155 + i * 0.03), '#e8eeff'); }
      for (let i = 0; i < 3; i++) silk(x, [u(0.03), u(0.155 + i * 0.03), W - u(0.1), u(0.155 + i * 0.03)], 1.2);
      break;
    }
    case 'relay': {
      faceBase(x, W, H, R, { label: 'RELÉ DE TEMPO', lw: 0.5 });
      silk(x, [u(0.02), H * 0.6, W - u(0.02), H * 0.6]);
      break;
    }
    case 'breaker': {
      faceBase(x, W, H, R, { label: 'PROTEÇÃO', lw: 0.45 });
      break;
    }
    case 'plain': default: {
      faceBase(x, W, H, R, { label: type === 'plain' ? 'AUXILIAR' : String(type).toUpperCase(), lw: 0.45 });
      silk(x, [u(0.02), H * 0.55, W - u(0.02), H * 0.55]);
    }
  }
  return tex(c);
}

// Face de medidor de energia (caixa cinza, LCD, tampa de bornes).
export function kwhFace() {
  const W = 220, H = 300; const [c, x] = canvas(W, H); const R = rng(11);
  x.fillStyle = '#b9bcbf'; x.fillRect(0, 0, W, H);
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,255,255,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0.12)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.fillStyle = '#a7aaae'; x.fillRect(12, 12, W - 24, 170);
  x.fillStyle = '#9ea88f'; x.fillRect(36, 32, W - 72, 46); x.fillStyle = '#2b3325'; x.font = 'bold 30px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('004527', W / 2, 56);
  txt(x, 'kWh', 13, W - 50, 92, '#333'); txt(x, 'MEDIDOR TRIFÁSICO', 11, W / 2, 112, '#333'); txt(x, '3x120/208 V  10(100) A', 9, W / 2, 128, '#444', 'center', '500');
  x.fillStyle = '#c33'; x.beginPath(); x.arc(42, 150, 5, 0, 7); x.fill(); txt(x, 'imp/kWh', 9, 80, 150, '#444', 'center', '500');
  x.fillStyle = '#8f9396'; x.fillRect(12, 196, W - 24, 92);
  for (let i = 0; i < 10; i++) { x.fillStyle = '#7b7f83'; x.fillRect(20 + i * 18, 206, 12, 72); x.fillStyle = '#d0d0d0'; x.beginPath(); x.arc(26 + i * 18, 228, 4, 0, 7); x.fill(); }
  for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(0,0,0,${R() * 0.05})`; x.fillRect(R() * W, R() * H, 2, 2); }
  return tex(c);
}
// Mostrador analógico (tampa do cilindro).
export function dialFace(unit = 'V') {
  const S = 256; const [c, x] = canvas(S, S);
  x.fillStyle = '#1a1a1a'; x.fillRect(0, 0, S, S);
  x.fillStyle = '#f3f1ea'; x.beginPath(); x.arc(S / 2, S / 2, S * 0.44, 0, 7); x.fill();
  x.strokeStyle = '#111'; x.lineWidth = 2;
  const cx = S / 2, cy = S * 0.6, r = S * 0.3;
  x.beginPath(); x.arc(cx, cy, r, Math.PI * 1.2, Math.PI * 1.8); x.stroke();
  for (let i = 0; i <= 20; i++) { const a = Math.PI * 1.2 + i / 20 * Math.PI * 0.6, l = i % 5 ? 7 : 13; x.beginPath(); x.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); x.lineTo(cx + Math.cos(a) * (r + l), cy + Math.sin(a) * (r + l)); x.stroke(); }
  for (let i = 0; i <= 4; i++) { const a = Math.PI * 1.2 + i / 4 * Math.PI * 0.6; txt(x, String(i * (unit === 'V' ? 75 : 25)), 13, cx + Math.cos(a) * (r + 24), cy + Math.sin(a) * (r + 24), '#111'); }
  x.strokeStyle = '#c21'; x.lineWidth = 4; x.beginPath(); x.arc(cx, cy, r - 3, Math.PI * 1.7, Math.PI * 1.8); x.stroke();
  txt(x, unit, 26, cx, cy - 18, '#111', 'center', '700');
  const a = Math.PI * 1.33; x.strokeStyle = '#111'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * (r + 6), cy + Math.sin(a) * (r + 6)); x.stroke();
  x.fillStyle = '#222'; x.beginPath(); x.arc(cx, cy, 7, 0, 7); x.fill();
  return tex(c);
}
// Visor LCD / 7 segmentos.
export function lcdFace(lines, bg = '#0f1a14', fg = '#7cf0b5', bezel = '#141414', W = 256, H = 192) {
  const [c, x] = canvas(W, H);
  x.fillStyle = bezel; x.fillRect(0, 0, W, H);
  x.fillStyle = bg; x.fillRect(W * 0.1, H * 0.12, W * 0.8, H * 0.52);
  x.fillStyle = fg; x.font = `bold ${Math.round(H * 0.17)}px monospace`; x.textAlign = 'right'; x.textBaseline = 'middle';
  lines.forEach((l, i) => x.fillText(l, W * 0.86, H * (0.24 + i * 0.16)));
  for (let i = 0; i < 4; i++) { x.fillStyle = '#3a3d42'; rrect(x, W * (0.14 + i * 0.19), H * 0.74, W * 0.14, H * 0.12, 4); x.fill(); }
  return tex(c);
}
// Controlador preto (tipo CLP) com bornes e LEDs.
export function plcFace() {
  const W = 300, H = 330; const [c, x] = canvas(W, H); const R = rng(5);
  x.fillStyle = '#17181a'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#e9ebec'; x.fillRect(10, 18, 110, 34); x.fillRect(W - 82, 18, 64, 30); x.fillRect(90, 70, 90, 20);
  txt(x, 'CONTROLADOR', 11, 65, 35, '#222', 'center', '700');
  for (let r = 0; r < 2; r++) for (let i = 0; i < 12; i++) { x.fillStyle = '#5b5e62'; x.fillRect(14 + i * 23, r ? 290 : 115, 18, 26); x.fillStyle = '#9ea2a6'; x.beginPath(); x.arc(23 + i * 23, r ? 303 : 128, 5, 0, 7); x.fill(); }
  for (let i = 0; i < 8; i++) { x.fillStyle = R() > 0.5 ? '#3f6' : '#1b3a1f'; x.fillRect(30 + i * 28, 170, 9, 6); }
  x.fillStyle = '#2a2c30'; x.fillRect(20, 200, W - 40, 70); txt(x, 'IN 0-7   OUT 0-5', 12, W / 2, 235, '#bbb', 'center', '600');
  return tex(c);
}
export function whiteBoxFace() {
  const W = 200, H = 180; const [c, x] = canvas(W, H);
  x.fillStyle = '#eceeee'; x.fillRect(0, 0, W, H); x.fillStyle = '#d7dadb'; x.fillRect(0, H - 18, W, 18);
  x.fillStyle = '#c9d0cc'; x.fillRect(22, 26, 100, 44); txt(x, '12.0 s', 22, 72, 48, '#333', 'center', '700');
  txt(x, 'TIMER', 13, 150, 40, '#555'); x.fillStyle = '#2a8'; x.beginPath(); x.arc(160, 70, 6, 0, 7); x.fill();
  return tex(c);
}
// Painel de comando inclinado (face superior).
export function cmdFace() {
  const W = 1000, H = 560; const [c, x] = canvas(W, H); const R = rng(21);
  faceBase(x, W, H, R, { label: 'PAINEL DE COMANDO', lw: 0.32 });
  // quadros serigrafados
  x.strokeStyle = 'rgba(230,236,255,0.8)'; x.lineWidth = 2;
  x.strokeRect(40, 70, 230, 440); x.strokeRect(300, 70, 280, 200); x.strokeRect(300, 300, 280, 210); x.strokeRect(610, 70, 350, 440);
  txt(x, 'EMERGÊNCIA', 20, 155, 470, '#e8eeff'); txt(x, 'ENTRADAS DIGITAIS', 18, 440, 92, '#e8eeff'); txt(x, 'SAÍDAS', 18, 440, 322, '#e8eeff'); txt(x, 'IHM', 18, 785, 92, '#e8eeff');
  // anel amarelo da emergência
  x.fillStyle = '#f2c417'; x.beginPath(); x.arc(155, 360, 78, 0, 7); x.fill(); txt(x, 'EMERGÊNCIA', 11, 155, 300, '#222', 'center', '700');
  // bornes vermelhos (desenho de base)
  for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) { x.fillStyle = '#5a1216'; x.beginPath(); x.arc(345 + i * 60, 380 + r * 70, 17, 0, 7); x.fill(); }
  // visor IHM
  x.fillStyle = '#111'; x.fillRect(650, 130, 270, 150); x.fillStyle = '#1d3a4a'; x.fillRect(668, 146, 234, 118);
  txt(x, 'MOTOR 1  PARADO', 20, 785, 180, '#8fd8ff', 'center', '600'); txt(x, 'I = 0,0 A', 20, 785, 222, '#8fd8ff', 'center', '600');
  x.fillStyle = '#eceeee'; x.fillRect(650, 320, 120, 90); x.fillStyle = '#ccc'; x.fillRect(800, 320, 120, 90);
  return tex(c);
}
// Frente da fonte de bancada.
export function psuFace() {
  const W = 400, H = 220; const [c, x] = canvas(W, H);
  x.fillStyle = '#20295e'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#0d0d0d'; x.fillRect(20, 20, 110, 56); x.fillRect(150, 20, 110, 56);
  x.fillStyle = '#ff5b3a'; x.font = 'bold 34px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('12.0', 75, 49); x.fillStyle = '#6cf080'; x.fillText('0.35', 205, 49);
  txt(x, 'V', 16, 75, 92, '#dde'); txt(x, 'A', 16, 205, 92, '#dde'); txt(x, 'FONTE CC 0-30 V', 16, 330, 30, '#eef', 'center', '700');
  return tex(c);
}
// Células fotovoltaicas: 6 colunas x 24 linhas de meias-células, fita central, fundo branco.
export function solarTex(q) {
  const W = q === 'low' ? 512 : 1024, H = W * 2; const [c, x] = canvas(W, H); const R = rng(77);
  const mmx = W / 1134, mmy = H / 2278;
  x.fillStyle = '#eef0f2'; x.fillRect(0, 0, W, H); // backsheet
  const fr = 32, cw = 176, ch = 87.5, gx = 5.5, gy = 4.0, mid = 16;
  const x0 = (1134 - (6 * cw + 5 * gx)) / 2, y0 = (2278 - (24 * ch + 22 * gy + mid)) / 2;
  for (let j = 0; j < 24; j++) for (let i = 0; i < 6; i++) {
    const X = (x0 + i * (cw + gx)) * mmx, Y = (y0 + j * (ch + gy) + (j >= 12 ? mid - gy : 0)) * mmy, w = cw * mmx, h = ch * mmy;
    const v = 8 + R() * 3, b = 22 + R() * 6;
    const g = x.createLinearGradient(X, Y, X + w, Y + h); g.addColorStop(0, `rgb(${v + 2},${v + 8},${b + 6})`); g.addColorStop(1, `rgb(${v - 2},${v + 4},${b - 4})`);
    x.fillStyle = g; x.fillRect(X, Y, w, h);
    // barramentos finos (busbars) verticais e dedos quase invisíveis
    x.fillStyle = 'rgba(175,182,195,0.38)'; for (let k = 1; k <= 9; k++) x.fillRect(X + k * w / 10 - 0.35, Y, 0.7, h);
    x.fillStyle = 'rgba(90,100,130,0.07)'; for (let k = 1; k < 14; k++) x.fillRect(X, Y + k * h / 14, w, 0.5);
  }
  // fitas de interconexão no topo/base e no meio
  x.fillStyle = 'rgba(200,204,210,0.75)'; x.fillRect(x0 * mmx, (y0 - 8) * mmy, 6 * cw * mmx, 3 * mmy); x.fillRect(x0 * mmx, (2278 - y0 + 5) * mmy, 6 * cw * mmx, 3 * mmy);
  x.fillRect(x0 * mmx, (y0 + 12 * (ch + gy) + mid / 2 - 3) * mmy, 6 * cw * mmx, 3 * mmy);
  // moldura (fica sob o perfil) – borda escura do vidro
  x.strokeStyle = '#8f949a'; x.lineWidth = fr * mmx; x.strokeRect(0, 0, W, H);
  const t = tex(c); t.anisotropy = 16; return t;
}
// Rugosidade do vidro (poeira e digitais).
export function glassRough() {
  const W = 256, H = 512; const [c, x] = canvas(W, H); const R = rng(9);
  x.fillStyle = 'rgb(205,205,205)'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) { const a = R() * W, b = R() * H, r = 6 + R() * 40, v = 225 + R() * 30; const g = x.createRadialGradient(a, b, 0, a, b, r); g.addColorStop(0, `rgba(${v},${v},${v},0.5)`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(a - r, b - r, 2 * r, 2 * r); }
  const g = x.createLinearGradient(0, H * 0.75, 0, H); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0.5)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  return tex(c, false);
}
// Cor do tampo fenólico (preto com poeira/marcas claras).
export function topColor() {
  const W = 1024, H = 512; const [c, x] = canvas(W, H); const R = rng(4);
  x.fillStyle = '#0c0d0f'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) { const a = R() * W, b = R() * H, r = 10 + R() * 90; const g = x.createRadialGradient(a, b, 0, a, b, r); g.addColorStop(0, `rgba(120,120,125,${0.03 + R() * 0.05})`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(a - r, b - r, 2 * r, 2 * r); }
  for (let i = 0; i < 700; i++) { x.strokeStyle = `rgba(165,165,170,${0.06 + R() * 0.18})`; x.lineWidth = 0.7; const a = R() * W, b = R() * H, t = R() * 6.28, L = 4 + R() * 40; x.beginPath(); x.moveTo(a, b); x.lineTo(a + Math.cos(t) * L, b + Math.sin(t) * L); x.stroke(); }
  for (let i = 0; i < 12; i++) { x.strokeStyle = 'rgba(190,190,190,0.06)'; x.lineWidth = 3; const a = R() * W, b = R() * H; x.beginPath(); x.arc(a, b, 20 + R() * 25, 0, 7); x.stroke(); } // marcas de copo/fita
  return tex(c);
}
// Arranhões/sujeira do gabinete branco (multiplicador de cor).
export function scuffTex(seed = 2) {
  const W = 512, H = 512; const [c, x] = canvas(W, H); const R = rng(seed);
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H);
  const g = x.createLinearGradient(0, H * 0.8, 0, H); g.addColorStop(0, 'rgba(120,110,100,0)'); g.addColorStop(1, 'rgba(120,110,100,0.07)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i++) { x.strokeStyle = `rgba(90,90,90,${0.02 + R() * 0.04})`; x.lineWidth = 0.8 + R(); const a = R() * W, b = H * (0.6 + R() * 0.4); x.beginPath(); x.moveTo(a, b); x.lineTo(a + (R() - 0.5) * 30, b + (R() - 0.5) * 6); x.stroke(); }
  for (let i = 0; i < 30; i++) { const a = R() * W, b = R() * H, r = 5 + R() * 30; const gg = x.createRadialGradient(a, b, 0, a, b, r); gg.addColorStop(0, 'rgba(140,135,125,0.015)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gg; x.fillRect(a - r, b - r, 2 * r, 2 * r); }
  return tex(c);
}
export const COLORS = { NAVY };
export { THREE };
