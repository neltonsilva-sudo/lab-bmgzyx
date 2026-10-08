// DONO: agente "aula-pratica". Face do painel KET-1030 "Proteção" reproduzida das fotos frontais refs/painel_4201/4202
// (retificadas em perspectiva: 1 unidade = 1 mm, origem no canto superior esquerdo da face amarela, y para baixo).
// Tudo procedural (canvas). Também define o mapa elétrico: borne → borne de dispositivo do simulador.

export const FW = 1400, FH = 910;           // face (mm)
export const GST = { x: 424, y: FH + 70, w: 526, h: 205 };   // GST na bancada, abaixo do painel
export const EXT = { x: 1060, y: FH + 80, w: 250, h: 150 };  // acessório externo (emergência)

const KX = (i) => 622 + 158.5 * i;          // borne L1 de cada contator
const RAXX = [786, 888.7, 991.4, 1094.1];   // borne A1 dos RAX-02
const RYDX = 1198, TCSX = 1303;

function painter(ppm) {
  const k = ppm / 1000, c = document.createElement('canvas');
  c.width = Math.round(FW * k); c.height = Math.round(FH * k);
  const g = c.getContext('2d');
  const P = {
    c, g, k, X: (x) => x * k, S: (m) => m * k,
    text(s, x, y, size, o = {}) {
      g.save(); g.fillStyle = o.color || '#1d1d1d'; g.textAlign = o.align || 'center'; g.textBaseline = 'middle';
      g.font = `${o.weight || 700} ${size * k}px ${o.font || 'Arial, Helvetica, sans-serif'}`;
      if (o.sx) { g.translate(x * k, y * k); g.scale(o.sx, 1); g.fillText(s, 0, 0); } else g.fillText(s, x * k, y * k);
      g.restore();
    },
    circle(x, y, r, fill, stroke, lw = 0.8) { g.beginPath(); g.arc(x * k, y * k, r * k, 0, Math.PI * 2); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw * k; g.stroke(); } },
    rect(x, y, w, h, fill, stroke, lw = 0.8) { if (fill) { g.fillStyle = fill; g.fillRect(x * k, y * k, w * k, h * k); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw * k; g.strokeRect(x * k, y * k, w * k, h * k); } },
    rrect(x, y, w, h, r, fill, stroke, lw = 0.8) { g.beginPath(); g.roundRect(x * k, y * k, w * k, h * k, r * k); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw * k; g.stroke(); } },
    line(pts, w = 1.2, col = '#1d1d1d') { g.save(); g.strokeStyle = col; g.lineWidth = w * k; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x * k, y * k) : g.moveTo(x * k, y * k))); g.stroke(); g.restore(); },
    lg(x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0 * k, y0 * k, x1 * k, y1 * k); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; },
    shadow(fn, blur = 5, dx = 2, dy = 4, a = 0.4) { g.save(); g.shadowColor = `rgba(0,0,0,${a})`; g.shadowBlur = blur * k; g.shadowOffsetX = dx * k; g.shadowOffsetY = dy * k; fn(); g.restore(); },
  };
  return P;
}
const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// ---------- fundo: branco no alto → amarelo/laranja embaixo, marca d'água clara da ALTRONIC, sujeira leve ----------
function background(P) {
  const { g } = P;
  g.fillStyle = P.lg(0, 0, 0, FH, [[0, '#f8f7f2'], [0.25, '#f8f4e0'], [0.45, '#f6e48e'], [0.62, '#f5d548'], [0.82, '#f2c524'], [1, '#eeb714']]); g.fillRect(0, 0, P.X(FW), P.X(FH));
  g.fillStyle = P.lg(0, 0, FW, 0, [[0, 'rgba(255,255,255,0.0)'], [0.55, 'rgba(255,255,255,0.10)'], [1, 'rgba(240,200,60,0.12)']]); g.fillRect(0, 0, P.X(FW), P.X(FH));
  // marca d'água: "gota" estilizada clara (arco grosso em torno de x≈560, y≈560)
  g.save(); g.globalAlpha = 0.28; g.strokeStyle = '#fff6d0'; g.lineCap = 'round';
  g.lineWidth = P.S(48); g.beginPath(); g.arc(P.X(600), P.X(520), P.S(250), Math.PI * 0.62, Math.PI * 1.75); g.stroke();
  g.lineWidth = P.S(36); g.beginPath(); g.arc(P.X(640), P.X(560), P.S(150), Math.PI * 1.05, Math.PI * 2.2); g.stroke();
  g.lineWidth = P.S(30); g.beginPath(); g.moveTo(P.X(820), P.X(330)); g.quadraticCurveTo(P.X(980), P.X(560), P.X(860), P.X(820)); g.stroke();
  g.restore();
  const r = rng(77);
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(80,65,40,${0.012 + r() * 0.03})`; g.beginPath(); g.ellipse(r() * P.X(FW), r() * P.X(FH), P.S(1 + r() * 5), P.S(0.8 + r() * 3), r() * 3, 0, 7); g.fill(); }
  const e = 25; for (const [x0, y0, x1, y1, rx, ry, rw, rh] of [[0, 0, e, 0, 0, 0, e, FH], [FW, 0, FW - e, 0, FW - e, 0, e, FH], [0, FH, 0, FH - e, 0, FH - e, FW, e]]) { g.fillStyle = P.lg(x0, y0, x1, y1, [[0, 'rgba(90,70,30,0.16)'], [1, 'rgba(90,70,30,0)']]); g.fillRect(P.X(rx), P.X(ry), P.X(rw), P.X(rh)); }
}

// ---------- peças pintadas ----------
function tape(P, x, y, w, h, rot) { const { g } = P; g.save(); g.translate(P.X(x), P.X(y)); g.rotate(rot); g.fillStyle = 'rgba(214,190,150,0.82)'; g.fillRect(0, 0, P.S(w), P.S(h)); g.strokeStyle = 'rgba(150,120,80,0.35)'; g.lineWidth = P.S(0.6); g.strokeRect(0, 0, P.S(w), P.S(h)); g.restore(); }
function whiteWire(P, x0, y0, x1, y1, bend = 10) {
  const { g } = P; g.save(); g.lineCap = 'round';
  for (const [w, c] of [[3.4, 'rgba(0,0,0,0.25)'], [2.7, '#f4f4f0'], [0.8, '#fff']]) {
    g.strokeStyle = c; g.lineWidth = P.S(w); g.beginPath(); g.moveTo(P.X(x0), P.X(y0));
    g.bezierCurveTo(P.X(x0 + bend * 0.2), P.X(y0 + (y1 - y0) * 0.35 - bend), P.X(x1 - bend * 0.3), P.X(y1 - (y1 - y0) * 0.3 - bend * 0.4), P.X(x1), P.X(y1)); g.stroke();
  }
  g.restore();
}
function rail(P, x0, x1, y0, h = 41) {
  P.shadow(() => P.rect(x0, y0, x1 - x0, h, P.lg(0, y0, 0, y0 + h, [[0, '#d5d9dc'], [0.15, '#aeb4b9'], [0.5, '#c3c8cc'], [0.85, '#9aa0a5'], [1, '#c9cdd0']])), 4, 1, 2, 0.35);
  P.rect(x0, y0 + 6, x1 - x0, 1.2, 'rgba(255,255,255,0.55)'); P.rect(x0, y0 + h - 7, x1 - x0, 1.2, 'rgba(0,0,0,0.18)');
  for (let x = x0 + 14; x < x1 - 10; x += 25) P.rrect(x, y0 + h / 2 - 2.6, 13, 5.2, 2.6, 'rgba(50,55,60,0.45)');
}
function contactor(P, L1x, dark) {
  const bx = L1x + 22, bw = 62, by = 290, bh = 98;
  for (let i = 0; i < 5; i++) { const jx = L1x + [0, 27, 53, 78, 104][i]; const tx = bx + 8 + i * 11.5; whiteWire(P, jx, 254, tx, by + 6, 9); whiteWire(P, jx, 414, tx, by + bh - 6, -9); }
  P.shadow(() => P.rrect(bx - 4, by - 3, bw + 8, bh + 6, 3, '#8f969c'), 16, 7, 11, 0.42);
  P.rrect(bx, by, bw, bh, 4, P.lg(bx, 0, bx + bw, 0, [[0, '#a9bccd'], [0.5, '#9bb0c3'], [1, '#7f95aa']]));
  P.rrect(bx + 3, by + 3, bw - 6, 20, 2, '#b9c8d5');
  for (let i = 0; i < 4; i++) { screw(P, bx + 10 + i * 13.5, by + 13, 3.6); screw(P, bx + 10 + i * 13.5, by + bh - 12, 3.6); }
  for (let i = 0; i < 3; i++) P.rrect(bx + 8 + i * 13, by + 38, 9, 26, 1.5, '#16191c');
  P.rrect(bx + 47, by + 30, 11, 44, 1.5, '#f2f2ee', '#8a96a2', 0.6); P.rrect(bx + 48.5, by + 50, 8, 10, 1, '#d8dde1');
  P.rrect(bx + 6, by + 70, 36, 8, 1.5, '#8ea3b8'); P.text('SIEMENS', bx + 24, by + 28, 4.2, { color: '#33475b' });
  bevel(P, bx, by, bw, bh, 4); bevel(P, bx + 47, by + 30, 11, 44, 1.5, 0.7);
}
function altronicRelay(P, A1x, kind) {
  const cx = A1x + 30, bx = cx - 16, by = 707, bw = 32, bh = 119;
  if (kind === 'tcs') { const tx = TCSX + 13; whiteWire(P, TCSX, 674, tx + 4, by + 4, 8); whiteWire(P, TCSX + 26, 674, tx + 18, by + 4, 8); }
  else if (kind !== 'fsn') for (let i = 0; i < 3; i++) whiteWire(P, A1x + i * 26, 674, bx + 6 + i * 10, by + 4, 9);
  P.shadow(() => P.rrect(bx, by, bw, bh, 2.5, P.lg(bx, 0, bx + bw, 0, [[0, '#f3f2ee'], [1, '#cfccc4']])), 16, 7, 11, 0.42);
  P.rrect(bx + 2, by + 22, bw - 4, 74, 2, '#e9e8e3');
  for (let i = 0; i < 3; i++) { screw(P, bx + 6 + i * 10, by + 8, 3); screw(P, bx + 6 + i * 10, by + bh - 8, 3); }
  bevel(P, bx, by, bw, bh, 2.5);
  P.text('ALTRONIC', cx, by + 30, 3.2, { color: '#2a2a2a', weight: 800 });
  if (kind === 'timer' || kind === 'ryd' || kind === 'rst' || kind === 'rca') { P.circle(cx + 2, by + 58, 7, '#f4f4f2', '#777', 0.7); P.line([[cx + 2, by + 58], [cx + 6, by + 53]], 1.1, '#333'); for (let a = 0; a < 8; a++) { const t = -2.4 + a * 0.6; P.line([[cx + 2 + Math.cos(t) * 8.5, by + 58 + Math.sin(t) * 8.5], [cx + 2 + Math.cos(t) * 10, by + 58 + Math.sin(t) * 10]], 0.5, '#555'); } }
  P.rrect(bx + 4, by + 82, 22, 4, 1, '#3a3d42'); P.text('■■■', cx - 4, by + 92, 2.6, { color: '#555' });
  for (let i = 0; i < 3; i++) whiteWire(P, bx + 6 + i * 10, by + bh - 4, bx + 4 + i * 11, by + bh + 22, -6);
}
function tcs(P) {
  const bx = TCSX + 13, by = 702, bw = 61, bh = 126;
  P.shadow(() => P.rrect(bx + 16, by + 14, 36, 98, 2, '#cfccc4'), 16, 7, 11, 0.42);
  P.rrect(bx + 16, by + 14, 36, 98, 2, P.lg(bx, 0, bx + bw, 0, [[0, '#e9e9e4'], [1, '#c9c9c2']]));
  for (let i = 0; i < 3; i++) { screw(P, bx + 22 + i * 12, by + 22, 3); screw(P, bx + 22 + i * 12, by + 103, 3); }
  bevel(P, bx + 16, by + 14, 36, 98, 2);
  P.rrect(bx + 22, by + 40, 24, 8, 1, '#c7cbc0'); P.circle(bx + 34, by + 66, 6, '#f2f2ee', '#777', 0.6); P.text('TCS-01', bx + 34, by + 90, 3.2, { color: '#444' });
}
function ctdBody(P, y0) {
  const bx = 288, by = y0, bw = 99, bh = 95;
  P.shadow(() => P.rrect(bx, by, bw, bh, 3, '#121315'), 18, 8, 12, 0.5);
  P.rrect(bx + 3, by + 3, bw - 6, bh - 6, 2, P.lg(0, by, 0, by + bh, [[0, '#26282c'], [1, '#141518']]));
  P.text('ALTRONIC', bx + 44, by + 11, 4.6, { color: '#e8e8e8', weight: 800 }); P.circle(bx + 30, by + 11, 2.4, '#e8e8e8');
  P.rrect(bx + 10, by + 20, bw - 20, 42, 2, '#07090a');
  P.text('OUT1  OUT2  ALM  TIMER', bx + 49, by + 66, 2.4, { color: '#9aa', weight: 600 });
  P.rrect(bx + 8, by + 70, bw - 16, 12, 3, '#2f62c9');
  for (let i = 0; i < 4; i++) P.circle(bx + 20 + i * 20, by + 76, 4.2, '#4a7ee6', '#cfe0ff', 0.6);
  P.line([[bx + 8, by + 87], [bx + bw - 8, by + 87]], 0.8, '#666'); P.text('CTD', bx + bw - 12, by + 89, 2.6, { color: '#aaa' });
  bevel(P, bx, by, bw, bh, 3, 0.6);
  const gl = P.lg(bx + 10, by + 20, bx + bw - 10, by + 62, [[0, 'rgba(255,255,255,0.16)'], [0.45, 'rgba(255,255,255,0.03)'], [0.5, 'rgba(255,255,255,0)']]); P.rrect(bx + 10, by + 20, bw - 20, 42, 2, gl);
}
function breaker3(P) {
  const bx = 36, by = 687, bw = 101, bh = 134;
  [53, 86, 120].forEach((x, i) => { const col = ['#151515', '#f0f0ec', '#c21d1d'][i]; P.line([[x, 668], [x - 2, 680], [x, 694]], 3, col); P.text(['L1', 'L2', 'L3'][i], x, 660, 5.5); });
  P.shadow(() => P.rrect(bx, by, bw, bh, 3, P.lg(bx, 0, bx + bw, 0, [[0, '#f5f5f2'], [1, '#d4d4cf']])), 18, 8, 12, 0.45);
  bevel(P, bx, by, bw, bh, 3);
  for (let i = 0; i < 3; i++) { const x = bx + i * 33.7; P.rect(x + 33.7, by + 4, 0.8, bh - 8, 'rgba(0,0,0,0.12)'); P.circle(x + 17, by + 10, 4, '#3a3a3a'); P.circle(x + 17, by + bh - 10, 4, '#3a3a3a'); P.rect(x + 5, by + 26, 24, 9, i === 1 ? '#5fb38a' : '#d9d9d4'); P.rrect(x + 7, by + 46, 20, 44, 2, '#e7e7e3', '#aaa', 0.6); }
}
function drBody(P) {
  const bx = 180, by = 689, bw = 118, bh = 132;
  [216, 234, 250, 269].forEach((x, i) => { P.text(['L1', 'L2', 'L3', 'N'][i], x, 660, 5.5); P.line([[x, 668], [x - 3, 684], [x, 694]], 2.6, '#f4f4f0'); });
  P.shadow(() => P.rrect(bx, by, bw, bh, 3, P.lg(bx, 0, bx + bw, 0, [[0, '#f6f6f3'], [1, '#d6d6d1']])), 18, 8, 12, 0.45);
  bevel(P, bx, by, bw, bh, 3);
  for (let i = 0; i < 4; i++) { P.circle(bx + 16 + i * 22, by + 12, 4.5, '#3a3a3a'); P.circle(bx + 16 + i * 22, by + bh - 12, 4.5, '#3a3a3a'); }
  P.rrect(bx + 8, by + 30, 64, 70, 2, '#ededea', '#bbb', 0.6); for (let i = 0; i < 6; i++) P.rect(bx + 14, by + 40 + i * 8, 40 - i * 3, 1.6, '#888');
  P.text('SIEMENS', bx + 30, by + 34, 3.2, { color: '#3b6d7a' });
}
// acabamento fotográfico: grão de impressão, brilho do laminado e queda de luz (aplicado sobre o fundo)
function finish(P) {
  const { g, c } = P, W = c.width, H = c.height;
  // grão fino (padrão de ruído repetido)
  const n = document.createElement('canvas'); n.width = n.height = 256; const ng = n.getContext('2d'), id = ng.createImageData(256, 256), r = rng(9);
  for (let i = 0; i < id.data.length; i += 4) { const v = 118 + (r() - 0.5) * 70; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 26; }
  ng.putImageData(id, 0, 0);
  g.save(); g.globalCompositeOperation = 'overlay'; g.fillStyle = g.createPattern(n, 'repeat'); g.fillRect(0, 0, W, H); g.restore();
  // brilho difuso do laminado (faixa diagonal suave) e luz vinda do alto
  g.save(); g.globalCompositeOperation = 'soft-light';
  let gr = g.createLinearGradient(W * 0.15, 0, W * 0.75, H); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.42, 'rgba(255,255,255,0.35)'); gr.addColorStop(0.55, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.12)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  gr = g.createRadialGradient(W * 0.45, -H * 0.2, H * 0.2, W * 0.5, H * 0.5, W * 0.8); gr.addColorStop(0, 'rgba(255,255,255,0.18)'); gr.addColorStop(1, 'rgba(0,0,0,0.16)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
}
// relevo: borda clara em cima/esquerda e escura embaixo/direita (peças moldadas)
function bevel(P, x, y, w, h, r = 3, a = 1) {
  const { g } = P; g.save(); g.lineWidth = P.S(1.1);
  g.strokeStyle = `rgba(255,255,255,${0.55 * a})`; g.beginPath(); g.moveTo(P.X(x + r), P.X(y + 0.6)); g.lineTo(P.X(x + w - r), P.X(y + 0.6)); g.moveTo(P.X(x + 0.6), P.X(y + r)); g.lineTo(P.X(x + 0.6), P.X(y + h - r)); g.stroke();
  g.strokeStyle = `rgba(0,0,0,${0.28 * a})`; g.beginPath(); g.moveTo(P.X(x + r), P.X(y + h - 0.6)); g.lineTo(P.X(x + w - r), P.X(y + h - 0.6)); g.moveTo(P.X(x + w - 0.6), P.X(y + r)); g.lineTo(P.X(x + w - 0.6), P.X(y + h - r)); g.stroke();
  const sh = g.createLinearGradient(P.X(x), 0, P.X(x + w), 0); sh.addColorStop(0, 'rgba(255,255,255,0.10)'); sh.addColorStop(0.35, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.08)');
  g.fillStyle = sh; g.beginPath(); g.roundRect(P.X(x), P.X(y), P.S(w), P.S(h), P.S(r)); g.fill(); g.restore();
}
// parafuso de borne (fenda cruzada)
function screw(P, x, y, r = 3.4) {
  P.circle(x, y, r, P.lg(x - r, y - r, x + r, y + r, [[0, '#f2f4f5'], [1, '#8e959b']]), '#4b5157', 0.6);
  P.line([[x - r * 0.65, y], [x + r * 0.65, y]], 0.75, '#3a3f44'); P.line([[x, y - r * 0.65], [x, y + r * 0.65]], 0.75, '#3a3f44');
}
function jackShadow(P, x, y) { P.shadow(() => P.circle(x + 1.5, y + 2.5, 9.5, 'rgba(0,0,0,0.22)'), 6, 1.5, 2.5, 0.35); }

export function buildPanelB1(B, ppm = 2000) {
  const P = painter(ppm);
  background(P); finish(P);
  const L = (t, x, y, s = 6.2, o = {}) => P.text(t, x, y, s * 1.28, o);
  // título
  P.text('KET-1030:', 138, 26, 33, { align: 'left', weight: 700, color: '#202020', font: '"Arial Rounded MT Bold","Arial Narrow",Arial,sans-serif', sx: 0.86 });
  P.text('Proteção', 306, 26, 33, { align: 'left', weight: 600, color: '#202020', font: '"Arial Rounded MT Bold","Arial Narrow",Arial,sans-serif', sx: 0.9 });

  // ===== alimentação e coluna de comando =====
  B.dev('PWR', 'supply', 'Alimentação da bancada');
  L('ENERGIZADO', 67, 63, 7.4);
  B.w({ type: 'lamp', x: 68, y: 96, c: 'R', s: 0.55, src: 'ENERG', tip: 'Sinaleiro ENERGIZADO: aceso com o disjuntor geral, o DR e a chave de comando ligados' });
  L('LIGA', 66, 143, 7); L('CH1', 28, 182, 5.8);
  B.dev('CH1', 'pbNO', 'CH1 · LIGA'); B.w({ type: 'btn', dev: 'CH1', x: 67, y: 182, c: 'G', r: 1.3, tip: 'Botão LIGA (CH1) — contato NA, retorno por mola' });
  B.term(109, 168, 'CH1.13', 'CH1 LIGA · contato NA (borne 1)'); B.term(109, 194, 'CH1.14', 'CH1 LIGA · contato NA (borne 2)');
  L('DESL', 72, 228, 7); L('CH2', 29, 259, 5.8);
  B.dev('CH2', 'pbNC', 'CH2 · DESLIGA'); B.w({ type: 'btn', dev: 'CH2', x: 67, y: 261, c: 'R', r: 1.3, tip: 'Botão DESLIGA (CH2) — contato NF, retorno por mola' });
  B.term(110, 245, 'CH2.11', 'CH2 DESL · contato NF (borne 1)'); B.term(110, 272, 'CH2.12', 'CH2 DESL · contato NF (borne 2)');
  // fitas crepe removidas a pedido
  L('SN1', 20, 331, 5.8); L('(220Vca)', 20, 343, 5.2);
  B.dev('SN1', 'lamp', 'SN1 · sinaleiro amarelo'); B.w({ type: 'lamp', x: 66, y: 340, c: 'Y', s: 1.3, dev: 'SN1', tip: 'Sinaleiro SN1 amarelo 220 Vca (bornes X1-X2)' });
  B.term(111, 325, 'SN1.X1', 'Sinaleiro SN1 · X1'); B.term(111, 352, 'SN1.X2', 'Sinaleiro SN1 · X2');
  [['NA', 40], ['C', 67], ['NF', 93]].forEach(([t, x]) => { L(t, x, 435, 7); P.line([[x, 462], [x, 476], [68 + (x - 67) * 0.35, 492]], 1.6, '#2a2a2a'); });
  B.dev('CH5', 'selector', 'CH5 · seletora');
  B.term(40, 456, 'CH5.NA', 'Seletora CH5 · NA (fecha com C na posição 1)'); B.term(67, 456, 'CH5.C', 'Seletora CH5 · C (comum)'); B.term(93, 456, 'CH5.NF', 'Seletora CH5 · NF (fecha com C na posição 0)');
  L('CH5', 113, 504, 5.8); B.w({ type: 'sel', dev: 'CH5', x: 68, y: 506, r: 1.5, tip: 'Chave seletora CH5 (0 – 1): clique para girar' });

  // ===== CTD-02 / CTD-03 =====
  [['CTD2', 'CTD-02', 114], ['CTD3', 'CTD-03', 293]].forEach(([id, nome, yt]) => {
    const dy = yt - 114;
    L(nome, 286, 132 + dy, 6.2, { align: 'right' }); L('(220Vca)', 286, 143 + dy, 6, { align: 'right' });
    ctdBody(P, 131 + dy);
    B.dev(id, 'ctd', `${nome} · controlador temporizador digital`, { T: 5 });
    const tips = { 1: 'saída 1 — comum', 2: 'saída 1 — NA (fecha após o tempo)', 3: 'saída 1 — NF (abre após o tempo)', 4: 'saída 2 — comum', 5: 'saída 2 — NA', 6: 'alimentação 220 Vca (L)', 7: 'alimentação 220 Vca (N)', 8: 'auxiliar (sem uso no simulador)', 9: 'entrada digital (sem uso no simulador)', 10: 'entrada digital (sem uso no simulador)', 11: 'entrada digital — comum (sem uso no simulador)', 12: 'saída +12 Vcc p/ sensor (não simulada)', 13: '0 V (não simulada)' };
    [300, 326, 352, 378, 404].forEach((x, i) => { L(String(i + 1), x, 100 + dy, 6.4); B.term(x, 114 + dy, `${id}.${i + 1}`, `${nome} · ${i + 1} — ${tips[i + 1]}`, 'K'); });
    [[6, 155, 'R'], [7, 180, 'R'], [8, 207, 'K']].forEach(([n, y, c]) => { L(String(n), 422, y + dy, 6.4); B.term(404, y + dy, `${id}.${n}`, `${nome} · ${n} — ${tips[n]}`, c); });
    [300, 326, 352, 378, 404].forEach((x, i) => { const n = 9 + i; L(String(n), x, 258 + dy, 6.4); B.term(x, 243 + dy, `${id}.${n}`, `${nome} · ${n} — ${tips[n]}`, 'YYYRK'[i]); });
    B.w({ type: 'ctd', dev: id, x: 337, y: 172 + dy, tip: `${nome}: temporizador com retardo na energização (alimentação 6-7; saída 1-2 NA / 1-3 NF). Clique para ajustar o tempo.` });
  });

  // ===== auto-transformador =====
  L('AUTO-TRANSFORMADOR', 684, 52, 6.6);
  [0, 1, 2].forEach((i) => {
    const x0 = 592 + 90.5 * i, id = 'T' + (i + 1); B.dev(id, 'autotrafo', 'Auto-transformador ' + id);
    let d = ''; P.g.save(); P.g.strokeStyle = '#1d1d1d'; P.g.lineWidth = P.S(1.3); P.g.beginPath();
    const cx = x0 + 9; for (let n = 0; n < 9; n++) P.g.arc(P.X(cx), P.X(92 + n * 10.5 + 5.25), P.S(5.25), -Math.PI / 2, Math.PI / 2);
    P.g.stroke(); P.g.restore();
    P.line([[x0, 81], [x0 + 3, 88], [cx, 92]], 1.3); P.line([[x0 - 26, 109], [cx - 1, 109]], 1.3); P.line([[x0 - 26, 150], [cx - 1, 150]], 1.3); P.line([[cx, 186], [x0, 189]], 1.3);
    L('100%', x0 + 29, 81, 6.4, { weight: 600 }); L('80%', x0 - 20, 95, 6.4, { weight: 600 }); L('60%', x0 - 20, 137, 6.4, { weight: 600 }); L('0', x0 + 23, 190, 6.4, { weight: 600 });
    B.term(x0, 81, id + '.100', `${id} · tap 100%`); B.term(x0 - 26, 109, id + '.80', `${id} · tap 80%`); B.term(x0 - 26, 150, id + '.60', `${id} · tap 60%`); B.term(x0, 189, id + '.0', `${id} · 0 (comum)`);
  });
  // ===== motor =====
  L('MOTOR 110V~480V', 960, 52, 6.6);
  B.dev('M1', 'motor3', 'Motor M1', { load: 0.8 });
  [['1', 'U1', '4', 'X4', 895], ['2', 'V2', '5', 'Y5', 960], ['3', 'W3', '6', 'Z6', 1025]].forEach(([a, la, b, lb, x]) => {
    P.g.save(); P.g.strokeStyle = '#1d1d1d'; P.g.lineWidth = P.S(1.3); P.g.beginPath(); for (let n = 0; n < 9; n++) P.g.arc(P.X(x + 9), P.X(95 + n * 9.6 + 4.8), P.S(4.8), -Math.PI / 2, Math.PI / 2); P.g.stroke(); P.g.restore();
    P.line([[x, 81], [x + 9, 86], [x + 9, 95]], 1.3); P.line([[x + 9, 181], [x + 9, 185], [x, 189]], 1.3);
    L(la, x - 17, 84, 6.2, { weight: 600 }); L(lb, x - 20, 192, 6.2, { weight: 600 });
    B.term(x, 81, 'M1.' + a, `Motor M1 · ${la} (início do enrolamento ${a}-${b})`, 'K', null, 0.6); B.term(x, 189, 'M1.' + b, `Motor M1 · ${lb} (fim do enrolamento ${a}-${b})`, 'K', null, 0.6);
  });
  B.w({ type: 'motorArea', x: 960, y: 135, w: 175, h: 125 });
  // ===== sensor indutivo =====
  L('SENSOR INDUTIVO', 1075, 52, 6.6);
  [['GND', 81, 101], ['+12Vcc', 135, 154], ['OUT', 187, 207]].forEach(([t, y, yl]) => { L(t, 1075, yl, 6.2, { weight: 600 }); B.term(1072, y, 'SNS.' + t, `Sensor indutivo PNP · ${t} (não simulado)`, 'K', null, 0.6); });
  P.circle(1181, 137, 12.5, 'rgba(255,255,255,0.6)'); P.circle(1181, 137, 11, '#0b0b0b');
  // motor M1 montado no furo do painel (eixo + disco no furo, carcaça à direita) — gira com o simulador
  B.w({ type: 'motorMount', x: 1262, y: 137, tip: 'Motor M1 — indução trifásico, 6 pontas (U1-V2-W3 / X4-Y5-Z6), 0,5 cv (0,37 kW), 4 polos, 380 V Δ / 660 V Y, 1,05 A em 380 V, 1720 rpm, 60 Hz, IP55. Ligue em triângulo (Δ) na rede de 380 V; em estrela (Y) parte com 1/3 da corrente.' });
  for (const [x, y] of [[1121, 76], [1239, 75], [1333, 135], [1118, 196], [1237, 195], [1140, 160], [1100, 172]]) { P.circle(x, y, 3.6, 'rgba(255,255,255,0.5)'); P.circle(x, y, 2.6, '#222'); }

  // ===== contatores K1–K5 =====
  rail(P, 635, 1376, 311, 43);
  for (let i = 0; i < 5; i++) {
    const x = KX(i), id = 'K' + (i + 1), xs = [0, 27, 53, 78, 104].map((d) => x + d);
    contactor(P, x, i >= 2);
    L(`K${i + 1} (220Vca)`, x + 20, 281, 6.2, { align: 'right' });
    B.dev(id, 'contactor', id);
    [['1', 'L1', 'K', 'L1 (1) — entrada de força'], ['3', 'L2', 'W', 'L2 (3) — entrada de força'], ['5', 'L3', 'R', 'L3 (5) — entrada de força'], ['13', 'NO', 'K', 'NO (13) — contato auxiliar NA'], ['A1', 'A1', 'R', 'A1 — bobina 220 Vca']]
      .forEach(([t, lab, c, d], k) => { L(lab, xs[k], 232, 6.4); B.term(xs[k], 246, `${id}.${t}`, `${id} · ${d}`, c); });
    [['2', 'T1', 'K', 'T1 (2) — saída de força'], ['4', 'T2', 'W', 'T2 (4) — saída de força'], ['6', 'T3', 'R', 'T3 (6) — saída de força'], ['14', 'NO', 'K', 'NO (14) — contato auxiliar NA'], ['A2', 'A2', 'R', 'A2 — bobina 220 Vca']]
      .forEach(([t, lab, c, d], k) => { L(lab, xs[k], 437, 6.4); B.term(xs[k], 422, `${id}.${t}`, `${id} · ${d}`, c); });
    B.w({ type: 'K', dev: id, x: x + 53, y: 339, tip: `Contator ${id} (bobina 220 Vca): força 1-2/3-4/5-6 e um auxiliar NA (NO 13-14)` });
  }
  // ===== barramentos =====
  [['L1', 468, '#141414', 'K', '#f2f2f2'], ['L2', 504, '#f1f1ee', 'W', '#222'], ['L3', 539, '#d42424', 'R', '#fff'], ['N', 575, '#1f9bd8', 'B', '#111']].forEach(([ph, y, col, jc, tc]) => {
    P.shadow(() => P.rect(658, y - 7.5, 672, 15, col), 2, 0.5, 1, 0.25);
    [665, 904, 1141].forEach((x) => L(ph, x + 5, y, 6.8, { color: tc, align: 'left' }));
    [706, 757, 807, 938, 989, 1041, 1173, 1226, 1278].forEach((x) => B.term(x, y, 'PWR.' + ph, ph === 'N' ? 'Barramento N (neutro) — 0 V' : `Barramento ${ph} — fase (220 V para N, 380 V entre fases)`, jc));
  });

  // ===== trilho inferior =====
  rail(P, 135, 1312, 727, 41);
  breaker3(P);
  B.w({ type: 'mainBreaker', x: 86, y: 754, tip: 'Disjuntor geral tripolar da bancada (QF0) — seccionamento. Clique para ligar/desligar.' });
  B.w({ type: 'key', x: 66, y: 854, tip: 'Chave de comando com chave (liberação da bancada). Retire a chave no bloqueio (LOTO).' });
  L('DR', 241, 623, 6.4); L('TRIFÁSICO', 241, 633, 6.4); drBody(P);
  B.w({ type: 'dr', x: 239, y: 755, tip: 'DR trifásico 30 mA: desarma em fuga para a terra. Clique em T para testar; alavanca para rearmar.' });
  // logotipo
  P.g.save(); P.g.fillStyle = '#1b1b1b'; P.g.beginPath(); P.g.arc(P.X(186), P.X(866), P.S(11), 0, 7); P.g.fill(); P.g.fillStyle = '#f2c41f'; P.g.beginPath(); P.g.moveTo(P.X(180), P.X(874)); P.g.lineTo(P.X(186), P.X(856)); P.g.lineTo(P.X(193), P.X(874)); P.g.closePath(); P.g.fill(); P.g.restore();
  P.text('ALTRONIC', 238, 868, 16, { weight: 800, color: '#1b1b1b', font: 'Arial Black, Arial, sans-serif', sx: 0.9 }); P.text('®', 290, 860, 5);
  // RCA
  B.dev('RCA', 'rca', 'RCA · relé de sobrecorrente', { Iset: 1.3, td: 2 });
  L('A1', 376, 605, 6.4); L('A2', 404, 605, 6.4); L('-IN', 376, 637, 6.4); L('+IN', 404, 637, 6.4); L('J', 376, 853, 6.2); L('R', 404, 853, 6.2); [['14', 376], ['11', 403], ['12', 429]].forEach(([t, x]) => L(t, x, 887, 6.2));
  L('RCA', 360, 697, 6.2, { align: 'right' }); L('(220Vca)', 362, 709, 6.2, { align: 'right' });
  altronicRelay(P, 355, 'rca');
  B.term(376, 621, 'RCA.A1', 'RCA · A1 — alimentação 220 Vca', 'R'); B.term(404, 621, 'RCA.A2', 'RCA · A2 — alimentação 220 Vca', 'R');
  B.term(376, 653, 'RCA.INm', 'RCA · -IN — entrada de corrente (em série com a carga)', 'K'); B.term(404, 653, 'RCA.INp', 'RCA · +IN — entrada de corrente (em série com a carga)', 'K');
  B.term(376, 840, 'RCA.J', 'RCA · J — interligado a R = rearme automático', 'K'); B.term(404, 840, 'RCA.R', 'RCA · R — rearme', 'K');
  B.term(376, 874, 'RCA.14', 'RCA · 14 — NA (fechado com relé alimentado e sem disparo)', 'K'); B.term(403, 874, 'RCA.11', 'RCA · 11 — comum', 'K'); B.term(429, 874, 'RCA.12', 'RCA · 12 — NF (fecha no disparo)', 'K');
  B.w({ type: 'relay', dev: 'RCA', x: 385, y: 766, kind: 'rca', tip: 'RCA — relé de sobrecorrente com entrada -IN/+IN em série (ajuste 0,5–3 A, retardo). Clique para ajustar/rearmar.' });
  // RPT
  B.dev('RPT', 'rpt', 'RPT · relé de proteção térmica (PTC)');
  [['A1', 481, 'R'], ['A2', 507, 'R'], ['C', 532, 'K']].forEach(([t, x, c]) => { L(t, x, 605, 6.4); B.term(x, 621, 'RPT.' + t, `RPT · ${t}${t === 'C' ? ' — comum do sensor' : ' — alimentação 220 Vca'}`, c); });
  [['P1', 481], ['P2', 507], ['P3', 532]].forEach(([t, x]) => { L(t, x, 637, 6.4); B.term(x, 653, 'RPT.' + t, `RPT · ${t} — sensor PTC do motor (P1-P2 interligados = motor frio)`, 'K'); });
  [['14', 481], ['11', 506], ['12', 531]].forEach(([t, x]) => { L(t, x, 853, 6.2); B.term(x, 840, 'RPT.' + t, `RPT · ${t} — ${t === '11' ? 'comum' : t === '14' ? 'NA (fechado com PTC normal)' : 'NF (fecha na sobretemperatura)'}`, 'K'); });
  L('RPT-01', 466, 697, 6.2, { align: 'right' }); L('(220Vca)', 466, 709, 6.2, { align: 'right' });
  altronicRelay(P, 462, 'relay');
  B.w({ type: 'relay', dev: 'RPT', x: 492, y: 766, tip: 'RPT — relé de proteção térmica por termistor PTC (P1-P2)' });
  // FSN-22 (módulo ausente na foto: só a fiação)
  [['L1', 583, 'K'], ['L2', 607, 'W'], ['L3', 634, 'R']].forEach(([t, x, c]) => { L(t, x, 605, 6.4); B.term(x, 622, 'FSN.' + t, `FSN-22 · ${t} — módulo ausente na bancada (sem função)`, c); });
  [['J', 607], ['N', 634]].forEach(([t, x]) => { L(t, x, 637, 6.4); B.term(x, 653, 'FSN.' + t, `FSN-22 · ${t} — módulo ausente`, 'K'); });
  [['14', 582], ['11', 607], ['12', 633]].forEach(([t, x]) => { L(t, x, 853, 6.2); B.term(x, 840, 'FSN.' + t, `FSN-22 · ${t} — módulo ausente`, 'K'); });
  L('FSN-22', 585, 697, 6.2, { align: 'right' }); L('(220Vca)', 585, 709, 6.2, { align: 'right' });
  for (let i = 0; i < 3; i++) { whiteWire(P, 583 + i * 25, 630, 600 + i * 8, 712, 10); P.line([[600 + i * 8, 712], [598 + i * 8, 745]], 2.2, '#f2f2ee'); P.line([[603 + i * 9, 800], [601 + i * 9, 818]], 2, '#ececec'); P.circle(601 + i * 9, 818, 1.6, '#999'); }
  // RST-21
  B.dev('RST', 'phaseMon', 'RST-21 · relé de falta e sequência de fase');
  [['L1', 686, 'K'], ['L2', 711, 'W'], ['L3', 736, 'R']].forEach(([t, x, c]) => { L(t, x, 650, 6.4); B.term(x, 666, 'RST.' + t, `RST-21 · ${t} — entrada de medição/alimentação`, c); });
  [['14', 685, 'NA (fechado com rede correta)'], ['11', 709, 'comum'], ['12', 735, 'NF (fecha na falta/inversão)']].forEach(([t, x, d]) => { L(t, x, 853, 6.2); B.term(x, 840, 'RST.' + t, `RST-21 · ${t} — ${d}`, 'K'); });
  L('RST-21', 692, 698, 6.2, { align: 'right' }); L('(220Vca)', 692, 709, 6.2, { align: 'right' });
  altronicRelay(P, 676, 'rst');
  B.w({ type: 'relay', dev: 'RST', x: 706, y: 766, tip: 'RST-21 — relé de falta e de sequência de fase (autoalimentado por L1-L2-L3): 11-14 fecha com a rede correta' });
  // RAX-02 ×4, RYD-01
  const relay6 = (id, A1x, nome, kind, tipName) => {
    L(nome, A1x - 10, 698, 6.2); L('(220Vca)', A1x - 10, 709, 6.2);
    altronicRelay(P, A1x, kind);
    const d = kind === 'ryd' ? { 15: 'comum (estrela)', 16: 'NF (estrela)', 18: 'NA estrela — fecha ao energizar e abre após o tempo', 25: 'comum (triângulo)', 26: 'NF (triângulo)', 28: 'NA triângulo — fecha 100 ms após abrir a estrela' } : { 15: 'comum 1', 16: 'NF 1', 18: 'NA 1', 25: 'comum 2', 26: 'NF 2', 28: 'NA 2' };
    [['A1', 0, 'R'], ['15', 26, 'K'], ['25', 52, 'K']].forEach(([t, dx, c]) => { L(t, A1x + dx, 650, 6.4); B.term(A1x + dx, 666, `${id}.${t}`, `${nome} · ${t} — ${t === 'A1' ? 'alimentação 220 Vca' : d[t]}`, c); });
    [['26', 0], ['28', 26]].forEach(([t, dx]) => { L(t, A1x + dx, 854, 6.2); B.term(A1x + dx, 840, `${id}.${t}`, `${nome} · ${t} — ${d[t]}`, 'K'); });
    [['16', 0, 'K'], ['18', 26, 'K'], ['A2', 51, 'R']].forEach(([t, dx, c]) => { L(t, A1x + dx, 887, 6.2); B.term(A1x + dx, 873, `${id}.${t}`, `${nome} · ${t} — ${t === 'A2' ? 'alimentação 220 Vca' : d[t]}`, c); });
    B.w({ type: 'relay', dev: id, x: A1x + 30, y: 766, kind: kind === 'ryd' ? 'ydRelay' : 'aux', tip: tipName });
  };
  RAXX.forEach((x, i) => { B.dev('RAX' + (i + 1), 'auxRelay', `RAX-02 nº ${i + 1} · relé auxiliar`); relay6('RAX' + (i + 1), x, 'RAX-02', 'relay', `RAX-02 nº ${i + 1} — relé auxiliar 220 Vca com 2 reversores (15-16/18 e 25-26/28)`); });
  B.dev('RYD', 'ydRelay', 'RYD-01 · relé estrela-triângulo', { T: 5 }); relay6('RYD', RYDX, 'RYD-01', 'ryd', 'RYD-01 — relé de partida estrela-triângulo (15-18 estrela, 25-28 triângulo). Clique para ajustar o tempo.');
  // TCS-01
  B.dev('TCS', 'timerOn', 'TCS-01 · temporizador', { T: 5 });
  L('TCS-01', TCSX - 9, 698, 6.2); L('(220Vca)', TCSX - 9, 709, 6.2); tcs(P);
  [['A1', 0, 'R'], ['15', 26, 'K']].forEach(([t, dx, c]) => { L(t, TCSX + dx, 650, 6.4); B.term(TCSX + dx, 666, `TCS.${t}`, `TCS-01 · ${t} — ${t === 'A1' ? 'alimentação 220 Vca' : 'comum'}`, c); });
  [['16', 0, 'K', 'NF (abre após o tempo)'], ['18', 26, 'K', 'NA (fecha após o tempo)'], ['A2', 53, 'R', 'alimentação 220 Vca']].forEach(([t, dx, c, d]) => { L(t, TCSX + dx - 1, 859, 6.2); B.term(TCSX + dx - 1, 844, `TCS.${t}`, `TCS-01 · ${t} — ${d}`, c); });
  B.w({ type: 'relay', dev: 'TCS', x: TCSX + 43, y: 766, kind: 'timerOn', tip: 'TCS-01 — temporizador com retardo na energização (15 comum, 16 NF, 18 NA). Clique para ajustar.' });

  // ===== GST (fonte trifásica de ensaio, na bancada) =====
  B.w({ type: 'gst', x: GST.x, y: GST.y, tip: 'GST — Gerador de Sistemas Trifásicos (fonte de ensaio R/S/T com falta de fase, inversão de sequência e ajuste de tensão). Clique para configurar.' });
  [['R', 'R', 60], ['S', 'B', 150], ['T', 'W', 240]].forEach(([ph, c, dx]) => { B.term(GST.x + dx, GST.y + 128, 'GST.' + ph, `GST · saída ${ph}`, c, null, 1, true); B.term(GST.x + dx, GST.y + 165, 'GST.N', `GST · neutro da saída ${ph}`, 'K', null, 1, true); });
  // ===== acessório externo: botoeira de emergência =====
  B.dev('SE', 'emerg', 'SE · emergência (acessório externo)');
  B.w({ type: 'extEmerg', dev: 'SE', x: EXT.x, y: EXT.y, tip: 'ACESSÓRIO EXTERNO (não faz parte do KET-1030): botoeira de emergência com trava, contato NF 11-12' });
  B.term(EXT.x + 185, EXT.y + 62, 'SE.11', 'Emergência (acessório externo) · 11 — NF', 'K', '11', 1, true); B.term(EXT.x + 185, EXT.y + 100, 'SE.12', 'Emergência (acessório externo) · 12 — NF', 'K', '12', 1, true);

  return {
    canvas: P.c, FW, FH, GST, EXT,
    bus: { L1: 'PWR.L1', L2: 'PWR.L2', L3: 'PWR.L3', N: 'PWR.N', PE: 'PWR.PE' },
    roles: { K: ['K1', 'K2', 'K3', 'K4', 'K5'], S1: 'CH1', S0: 'CH2', SEL: 'CH5', SN: 'SN1', RAX: ['RAX1', 'RAX2', 'RAX3', 'RAX4'], YD: 'RYD', T: 'TCS', CTD: ['CTD2', 'CTD3'], RCA: 'RCA', RPT: 'RPT', RST: 'RST', M: 'M1', SE: 'SE' },
  };
}
