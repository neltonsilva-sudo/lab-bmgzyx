// DONO: agente "bancadas". Texturas procedurais (canvas) das bancadas didáticas: ruído, chapa perfurada, prateleira,
// displays de medidores, face do módulo de instrumentos e utilidades de pintura do painel serigrafado.
import * as THREE from 'three';

export function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
export function texFrom(c, renderer, srgb = true, rep) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 4;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  t.needsUpdate = true;
  return t;
}

// Ruído cinza tileável (rugosidade / bump de pintura eletrostática).
export function noiseTex(renderer, size = 256, base = 150, amp = 40, seed = 7) {
  const c = canvas(size, size), g = c.getContext('2d'), r = rng(seed);
  const img = g.createImageData(size, size);
  // value noise em 2 oitavas + grão
  const grid = (n) => { const a = []; for (let i = 0; i < n * n; i++) a.push(r()); return a; };
  const g1 = grid(8), g2 = grid(32);
  const samp = (gr, n, x, y) => {
    const fx = x * n, fy = y * n, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
    const v = (i, j) => gr[((j % n + n) % n) * n + ((i % n + n) % n)];
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    return (v(x0, y0) * (1 - sx) + v(x0 + 1, y0) * sx) * (1 - sy) + (v(x0, y0 + 1) * (1 - sx) + v(x0 + 1, y0 + 1) * sx) * sy;
  };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const v = base + amp * ((samp(g1, 8, x / size, y / size) - 0.5) * 1.2 + (samp(g2, 32, x / size, y / size) - 0.5) * 0.7 + (r() - 0.5) * 0.6);
    const i = (y * size + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.max(0, Math.min(255, v)); img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return texFrom(c, renderer, false, [1, 1]);
}

// Chapa perfurada: furos quadrados em grade (alpha) + pintura levemente suja (cor).
export function perfTex(renderer, cols, rows, holeFrac = 0.24, seed = 3) {
  const cell = 64, W = cols * cell, H = rows * cell;
  const a = canvas(W, H), ga = a.getContext('2d');
  ga.fillStyle = '#fff'; ga.fillRect(0, 0, W, H); ga.fillStyle = '#000';
  const hs = cell * holeFrac;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) ga.fillRect(i * cell + cell / 2 - hs / 2, j * cell + cell / 2 - hs / 2, hs, hs);
  const c = canvas(W, H), gc = c.getContext('2d'), r = rng(seed);
  gc.fillStyle = '#e9eaea'; gc.fillRect(0, 0, W, H);
  const gr = gc.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(70,60,50,0.10)');
  gc.fillStyle = gr; gc.fillRect(0, 0, W, H);
  for (let k = 0; k < 90; k++) { gc.fillStyle = `rgba(60,55,50,${0.03 + r() * 0.05})`; gc.beginPath(); gc.ellipse(r() * W, r() * H, 2 + r() * 14, 2 + r() * 8, r() * 3, 0, 7); gc.fill(); }
  // sombra interna dos furos (borda)
  gc.fillStyle = 'rgba(0,0,0,0.35)';
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) gc.fillRect(i * cell + cell / 2 - hs / 2 - 2, j * cell + cell / 2 - hs / 2 - 2, hs + 4, hs + 4);
  return { map: texFrom(c, renderer), alpha: texFrom(a, renderer, false) };
}

// Chapa preta da prateleira com respingos brancos e poeira.
export function shelfTex(renderer, seed = 11, spots = 30) {
  const W = 512, H = 256, c = canvas(W, H), g = c.getContext('2d'), r = rng(seed);
  g.fillStyle = '#4a4c4f'; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 2500; k++) { g.fillStyle = `rgba(255,255,255,${r() * 0.05})`; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
  for (let k = 0; k < 14; k++) { g.strokeStyle = `rgba(200,200,200,${0.03 + r() * 0.05})`; g.lineWidth = 1 + r() * 2; g.beginPath(); const x = r() * W, y = r() * H; g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 200, y + (r() - 0.5) * 40); g.stroke(); }
  for (let k = 0; k < spots; k++) {
    const x = r() * W, y = r() * H * 0.9, s = 1.2 + r() * 3.5;
    g.fillStyle = `rgba(235,235,230,${0.6 + r() * 0.4})`; g.beginPath(); g.ellipse(x, y, s, s * (0.6 + r() * 0.6), r() * 3, 0, 7); g.fill();
    if (r() < 0.4) { g.beginPath(); g.ellipse(x + (r() - 0.5) * 14, y + (r() - 0.5) * 10, s * 0.4, s * 0.3, 0, 0, 7); g.fill(); }
  }
  return texFrom(c, renderer);
}

// Displays de medidores digitais (emissivo): LED vermelho, LCD azul, LCD verde.
export function displayTex(renderer, kind, seed = 1) {
  const W = 256, H = 128, c = canvas(W, H), g = c.getContext('2d'), r = rng(seed);
  const cfg = { off: ['#1c2026', '#39414b', ''], red: ['#140404', '#ff3a2a', '127.4'], blue: ['#0b1c3a', '#9fd8ff', '220.1'], green: ['#223018', '#d8ff9a', '60.00'], amber: ['#1a1204', '#ffb030', '0.00'] }[kind];
  g.fillStyle = cfg[0]; g.fillRect(0, 0, W, H);
  g.fillStyle = cfg[1]; g.shadowColor = cfg[1]; g.shadowBlur = kind === 'red' || kind === 'amber' ? 10 : 2;
  g.font = 'bold 74px "Courier New", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(cfg[2], W / 2, H / 2 + 4);
  g.shadowBlur = 0; g.font = 'bold 20px sans-serif'; g.fillStyle = cfg[1]; g.globalAlpha = 0.7; g.fillText(kind === 'green' ? 'Hz' : 'V', W - 20, H - 16);
  return texFrom(c, renderer);
}

// Face do módulo de instrumentos de bancada (azul/branco, 3 displays, teclado, LCD "R S T").
export function moduleFaceTex(renderer, seed = 5) {
  const W = 1024, H = 512, c = canvas(W, H), g = c.getContext('2d'), r = rng(seed);
  g.fillStyle = '#e4e7e8'; g.fillRect(0, 0, W, H);
  // arte azul em onda
  g.fillStyle = '#2350b0';
  g.beginPath(); g.moveTo(0, 60); g.bezierCurveTo(180, 40, 260, 160, 250, 300); g.bezierCurveTo(240, 420, 330, 470, 420, 512); g.lineTo(0, 512); g.closePath(); g.fill();
  g.fillStyle = '#3a6fd8'; g.beginPath(); g.moveTo(420, 512); g.bezierCurveTo(470, 420, 560, 400, 640, 430); g.lineTo(640, 512); g.closePath(); g.fill();
  g.fillStyle = '#f4f5f5'; g.beginPath(); g.moveTo(40, 330); g.lineTo(200, 250); g.lineTo(215, 285); g.lineTo(60, 370); g.closePath(); g.fill();
  // 3 displays
  for (let i = 0; i < 3; i++) {
    const x = 60 + i * 150, y = 55;
    g.fillStyle = '#121212'; g.fillRect(x - 8, y - 8, 126, 86);
    g.fillStyle = '#9ea3a2'; g.fillRect(x, y, 110, 70);
    g.fillStyle = '#26292a'; g.font = 'bold 40px "Courier New", monospace'; g.textAlign = 'center'; g.fillText(['0.00', '12.5', '0.00'][i], x + 55, y + 50);
  }
  g.fillStyle = '#333'; g.font = 'bold 16px sans-serif'; g.textAlign = 'left';
  g.fillText('TENSÃO', 70, 170); g.fillText('CORRENTE', 215, 170); g.fillText('TEMPO', 370, 170);
  // bornes desenhados (serão sobrepostos por peças 3D se houver)
  const jk = (x, y, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, 13, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); };
  jk(300, 260, '#c42020'); jk(300, 310, '#161616'); jk(360, 260, '#c42020'); jk(360, 310, '#161616');
  g.fillStyle = '#fff'; g.fillRect(400, 230, 100, 110); g.fillStyle = '#2350b0';
  for (let i = 0; i < 6; i++) g.fillRect(410, 240 + i * 16, 80, 10);
  // LCD verde RST + teclado
  g.fillStyle = '#2a2d30'; g.fillRect(640, 60, 250, 90); g.fillStyle = '#9fbf6a'; g.fillRect(650, 70, 230, 70);
  g.fillStyle = '#1d2a10'; g.font = 'bold 44px sans-serif'; g.textAlign = 'center'; g.fillText('R   S   T', 765, 122);
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
    const x = 660 + i * 56, y = 185 + j * 70;
    const gr = g.createLinearGradient(x, y, x, y + 54); gr.addColorStop(0, '#fbfbfb'); gr.addColorStop(1, '#c9cccd');
    g.fillStyle = '#9ea2a4'; g.fillRect(x - 2, y - 2, 50, 58); g.fillStyle = gr; g.fillRect(x, y, 46, 54);
    g.fillStyle = '#333'; g.font = 'bold 22px sans-serif'; g.fillText('123A456B789C*0#D'[j * 4 + i], x + 23, y + 36);
  }
  g.fillStyle = '#555'; g.font = 'bold 22px sans-serif'; g.textAlign = 'left'; g.fillText('Medidor de Grandezas Elétricas', 540, 38);
  g.fillStyle = '#1f3f8f'; g.font = 'bold 26px sans-serif'; g.fillText('GST', 910, 40);
  // desgaste
  for (let k = 0; k < 400; k++) { g.fillStyle = `rgba(80,70,60,${r() * 0.05})`; g.fillRect(r() * W, r() * H, 2 + r() * 6, 2 + r() * 6); }
  return texFrom(c, renderer);
}

// ---------- Painel serigrafado ----------
// Pintor em coordenadas da face (metros, origem no centro, y para cima).
export function facePainter(Wf, Hf, ppm) {
  const W = Math.round(Wf * ppm), H = Math.round(Hf * ppm);
  const c = canvas(W, H), g = c.getContext('2d');
  const X = (x) => (x + Wf / 2) * ppm, Y = (y) => (Hf / 2 - y) * ppm, S = (m) => m * ppm;
  const P = {
    c, g, W, H, X, Y, S, Wf, Hf,
    text(s, x, y, size, o = {}) {
      g.save(); g.fillStyle = o.color || '#222'; g.textAlign = o.align || 'center'; g.textBaseline = 'middle';
      g.font = `${o.italic ? 'italic ' : ''}${o.weight || 600} ${Math.max(6, S(size))}px ${o.font || 'Arial, Helvetica, sans-serif'}`;
      if (o.w) { const m = g.measureText(s).width, k = S(o.w) / Math.max(1, m); g.translate(X(x), Y(y)); g.scale(k, 1); g.fillText(s, 0, 0); }
      else g.fillText(s, X(x), Y(y));
      g.restore();
    },
    line(pts, w = 0.0022, col = '#222', dash) {
      g.save(); g.strokeStyle = col; g.lineWidth = S(w); g.lineCap = 'round'; g.lineJoin = 'round'; if (dash) g.setLineDash(dash.map(S));
      g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); g.stroke(); g.restore();
    },
    rect(x, y, w, h, col, stroke) {
      g.save(); if (stroke) { g.strokeStyle = col; g.lineWidth = S(stroke); g.strokeRect(X(x - w / 2), Y(y + h / 2), S(w), S(h)); }
      else { g.fillStyle = col; g.fillRect(X(x - w / 2), Y(y + h / 2), S(w), S(h)); } g.restore();
    },
    circle(x, y, rad, col, stroke) {
      g.save(); g.beginPath(); g.arc(X(x), Y(y), S(rad), 0, Math.PI * 2);
      if (stroke) { g.strokeStyle = col; g.lineWidth = S(stroke); g.stroke(); } else { g.fillStyle = col; g.fill(); } g.restore();
    },
    coil(x, y, h, n = 4, col = '#222') { // indutor vertical
      g.save(); g.strokeStyle = col; g.lineWidth = S(0.002); g.beginPath();
      const r = h / n / 2; for (let i = 0; i < n; i++) g.arc(X(x), Y(y + h / 2 - r - i * 2 * r), S(r), -Math.PI / 2, Math.PI / 2, false);
      g.stroke(); g.restore();
    },
  };
  return P;
}

// Fundo amarelo com arte clara (onda luminosa) — painel "Proteção" da b1.
export function paintYellowBg(P, seed) {
  const { g, W, H } = P, r = rng(seed);
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#f8f3dc'); gr.addColorStop(0.3, '#f7eab0'); gr.addColorStop(0.6, '#f6d955'); gr.addColorStop(1, '#f3c623');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const rg = g.createRadialGradient(W * 0.55, H * 0.05, 10, W * 0.55, H * 0.1, W * 0.55); rg.addColorStop(0, 'rgba(255,253,240,0.85)'); rg.addColorStop(1, 'rgba(255,250,220,0)');
  g.fillStyle = rg; g.fillRect(0, 0, W, H);
  const lg = g.createLinearGradient(0, 0, W * 0.12, 0); lg.addColorStop(0, 'rgba(240,180,0,0.45)'); lg.addColorStop(1, 'rgba(240,180,0,0)');
  g.fillStyle = lg; g.fillRect(0, 0, W, H);
  // ondas claras estilizadas
  g.save(); g.globalAlpha = 0.22; g.strokeStyle = '#fffbe8'; g.lineCap = 'round';
  for (let k = 0; k < 3; k++) {
    g.lineWidth = W * (0.05 - k * 0.012); g.beginPath();
    g.moveTo(W * 0.14, H * (0.95 - k * 0.06)); g.bezierCurveTo(W * 0.02, H * 0.5, W * 0.25, H * (0.2 + k * 0.05), W * (0.42 + k * 0.03), H * 0.62);
    g.bezierCurveTo(W * 0.5, H * 0.78, W * 0.62, H * 0.7, W * 0.7, H * (0.55 + k * 0.05)); g.stroke();
  }
  g.restore();
  g.save(); g.globalAlpha = 0.12; g.fillStyle = '#fff'; g.beginPath(); g.ellipse(W * 0.2, H * 0.55, W * 0.05, H * 0.3, 0.3, 0, 7); g.fill(); g.restore();
  grime(P, r, 1);
}

export function paintWhiteBg(P, seed, tint = '#f6f6f2') {
  const { g, W, H } = P, r = rng(seed);
  g.fillStyle = tint; g.fillRect(0, 0, W, H);
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(210,205,190,0.25)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  grime(P, r, 0.8);
}

// Sujeira leve, marcas de dedo e poeira acumulada embaixo.
export function grime(P, r, k = 1) {
  const { g, W, H } = P;
  const gr = g.createLinearGradient(0, H * 0.7, 0, H); gr.addColorStop(0, 'rgba(90,70,40,0)'); gr.addColorStop(1, `rgba(90,70,40,${0.12 * k})`);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 260 * k; i++) {
    g.fillStyle = `rgba(70,60,45,${0.015 + r() * 0.035})`;
    g.beginPath(); g.ellipse(r() * W, r() * H, 3 + r() * 16, 2 + r() * 10, r() * 3, 0, 7); g.fill();
  }
  // sujeira acumulada nas bordas (junto à moldura)
  const e = Math.min(W, H) * 0.05;
  for (const [x0, y0, x1, y1, rx, ry, rw, rh] of [[0, 0, e, 0, 0, 0, e, H], [W, 0, W - e, 0, W - e, 0, e, H], [0, 0, 0, e, 0, 0, W, e], [0, H, 0, H - e, 0, H - e, W, e]]) {
    const eg = g.createLinearGradient(x0, y0, x1, y1); eg.addColorStop(0, `rgba(70,58,40,${0.22 * k})`); eg.addColorStop(1, 'rgba(70,58,40,0)');
    g.fillStyle = eg; g.fillRect(rx, ry, rw, rh);
  }
  for (let i = 0; i < 18; i++) { g.strokeStyle = `rgba(60,50,40,${0.04 + r() * 0.05})`; g.lineWidth = 1; g.beginPath(); const x = r() * W, y = r() * H; g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 80, y + (r() - 0.5) * 12); g.stroke(); }
}

// Fundo da b1 (foto frontal 4201): creme claro no topo → amarelo saturado embaixo, com o símbolo claro (anel + seta) ao centro.
// px/py em pixels da foto reduzida painel_4201.jpg (face: x 45–975, y 428–1008).
export function paintB1Bg(P, X, Y) {
  const { g, W, H } = P, r = rng(4201);
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, '#f7f4e2'); gr.addColorStop(0.22, '#f6efc4'); gr.addColorStop(0.42, '#f5e07a'); gr.addColorStop(0.62, '#f4d23c'); gr.addColorStop(1, '#f1c21b');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const cx = P.X(X(395)), cy = P.Y(Y(775)), rx = P.X(X(560)) - cx, ry = P.Y(Y(570)) - cy;
  g.save(); g.lineCap = 'round';
  g.strokeStyle = 'rgba(255,250,226,0.55)'; g.lineWidth = P.X(X(60)) - P.X(X(15));
  g.beginPath(); g.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), 0, -0.95, 4.55, false); g.stroke();
  g.lineWidth *= 0.8; g.strokeStyle = 'rgba(255,250,226,0.5)';
  g.beginPath(); g.moveTo(P.X(X(300)), P.Y(Y(900))); g.bezierCurveTo(P.X(X(330)), P.Y(Y(780)), P.X(X(470)), P.Y(Y(800)), P.X(X(455)), P.Y(Y(680))); g.stroke();
  g.fillStyle = 'rgba(255,250,226,0.42)';
  g.beginPath(); g.moveTo(P.X(X(470)), P.Y(Y(600))); g.lineTo(P.X(X(640)), P.Y(Y(640))); g.lineTo(P.X(X(600)), P.Y(Y(760))); g.lineTo(P.X(X(520)), P.Y(Y(700))); g.closePath(); g.fill();
  g.restore();
  grime(P, r, 0.8);
}

// GST "Gerador de Sistemas Trifásicos" (frente). Canvas 1200x500; devolve teclas e bornes em px do canvas.
export function gstTex(renderer) {
  const W = 1200, H = 500, c = canvas(W, H), g = c.getContext('2d'), r = rng(77);
  g.fillStyle = '#f2f1ea'; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#2b2b2b'; g.lineWidth = 6; g.strokeRect(3, 3, W - 6, H - 6);
  // campo azul: grande disco à esquerda + faixas
  g.save(); g.beginPath(); g.rect(10, 10, 720, H - 20); g.clip();
  g.fillStyle = '#2f5fc4'; g.beginPath(); g.arc(270, 300, 250, 0, 7); g.fill();
  g.fillStyle = '#2f5fc4'; g.fillRect(10, 40, 60, H - 50);
  g.fillStyle = '#f2f1ea'; g.beginPath(); g.moveTo(70, 480); g.lineTo(150, 200); g.lineTo(230, 480); g.closePath(); g.fill();
  g.fillStyle = '#2f5fc4'; g.beginPath(); g.moveTo(110, 480); g.lineTo(150, 330); g.lineTo(190, 480); g.closePath(); g.fill();
  g.restore();
  g.fillStyle = '#2f5fc4'; g.fillRect(470, 285, 245, 52); g.fillRect(470, 342, 245, 52);
  g.fillStyle = '#f2f1ea'; g.fillRect(160, 285, 195, 6);
  g.save(); g.translate(45, 400); g.rotate(-Math.PI / 2); g.fillStyle = '#fff'; g.font = 'bold 30px Arial'; g.fillText('SAÍDAS', 0, 0); g.restore();
  // 3 displays R S T Volts
  ['R', 'S', 'T'].forEach((t, i) => {
    const x = 66 + i * 224;
    g.fillStyle = '#121212'; g.beginPath(); g.roundRect(x, 52, 195, 142, 10); g.fill();
    g.fillStyle = '#8f9a8f'; g.fillRect(x + 23, 74, 148, 66);
    const lg = g.createLinearGradient(0, 74, 0, 140); lg.addColorStop(0, 'rgba(255,255,255,0.18)'); lg.addColorStop(1, 'rgba(0,0,0,0.1)'); g.fillStyle = lg; g.fillRect(x + 23, 74, 148, 66);
    g.fillStyle = '#fff'; g.font = 'bold 34px Arial'; g.fillText(t, x + 30, 182); g.font = 'bold 22px Arial'; g.fillText('Volts', x + 120, 180);
  });
  // saídas
  g.fillStyle = '#fff'; g.font = 'bold 20px Arial';
  [['Fase R', 153], ['Fase S', 379], ['Fase T', 607]].forEach(([t, x]) => { g.fillStyle = x > 500 ? '#fff' : '#fff'; g.fillText(t, x - 30, 335); g.fillText('Neutro', x - 32, 392); });
  g.fillStyle = '#fff'; g.font = '13px Arial'; g.fillText('Potência máx.: 300 W', 95, 445); g.fillText('Corrente máx.: 1,5 A', 95, 462);
  // coluna central de rótulos azuis
  const lab = (y, h, t) => { g.fillStyle = '#2f5fc4'; g.fillRect(752, y, 92, h); g.fillStyle = '#fff'; g.font = 'bold 12px Arial'; t.split('|').forEach((s, i) => g.fillText(s, 758, y + 15 + i * 14)); g.fillStyle = '#333'; g.beginPath(); g.arc(740, y + h / 2, 5, 0, 7); g.fill(); };
  lab(85, 32, 'SAÍDAS|ENERGIZADAS'); lab(122, 22, 'STAND BY'); lab(162, 24, 'LIGADO'); lab(200, 28, 'SISTEMA|SELECIONADO');
  g.fillStyle = '#2f5fc4'; g.fillRect(752, 232, 92, 118); g.fillStyle = '#fff'; g.font = 'bold 11px Arial';
  ['3 N ~ 110Vca', '3 N ~ 220Vca', '3 N ~ 380Vca', '3 N ~ 440Vca', '3 N ~ 480Vca', '3 x ± 30Vcc'].forEach((t, i) => { g.fillText(t, 760, 250 + i * 18); g.fillStyle = '#333'; g.beginPath(); g.arc(740, 246 + i * 18, 4, 0, 7); g.fill(); g.fillStyle = '#fff'; });
  lab(390, 20, 'FREQUÊNCIA'); g.fillStyle = '#2f5fc4'; g.fillRect(752, 414, 92, 50); g.fillStyle = '#fff'; g.font = 'bold 11px Arial'; ['Ajustável', '50 Hz', '60 Hz'].forEach((t, i) => g.fillText(t, 772, 428 + i * 15));
  // título, LCD RST e teclado
  g.fillStyle = '#2a2a2a'; g.font = 'bold 25px Arial'; g.fillText('Gerador de Sistemas Trifásicos', 728, 50); g.font = 'bold 34px Arial'; g.fillText('GST', 1100, 52);
  g.fillStyle = '#151515'; g.beginPath(); g.roundRect(865, 78, 245, 112, 10); g.fill();
  g.fillStyle = '#9fb27c'; g.fillRect(878, 88, 219, 46); g.fillStyle = '#fff'; g.font = 'bold 38px Arial'; g.fillText('R', 892, 178); g.fillText('S', 975, 178); g.fillText('T', 1058, 178);
  const keys = [];
  g.fillStyle = '#4a4c4e'; g.fillRect(880, 200, 215, 215);
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const x = 887 + i * 52, y = 207 + j * 52; keys.push([x, y, 46, 46]); g.fillStyle = '#d9dbdc'; g.fillRect(x, y, 46, 46); }
  g.fillStyle = '#1b1b1b'; g.font = 'bold 22px Arial Black, Arial'; g.fillText('ALTRONIC', 905, 462); g.font = 'bold 22px Arial'; g.fillStyle = '#1f3f8f'; g.fillText('TRON', 1065, 462);
  for (let k = 0; k < 500; k++) { g.fillStyle = `rgba(90,80,60,${r() * 0.05})`; g.fillRect(r() * W, r() * H, 2 + r() * 5, 2 + r() * 5); }
  const jacks = [[153, 309, 0xc41c1c], [153, 362, 0x161616], [379, 309, 0x1c4fc8], [379, 362, 0x161616], [607, 312, 0xe4e4dc], [607, 366, 0x161616]];
  return { tex: texFrom(c, renderer), W, H, keys, jacks };
}

// ---------------------------------------------------------------------------------------------------------------
// Atlas de impressões dos componentes da b1 (fotos refs/det/d4318–d4324): etiquetas holográficas e textos dos
// disjuntores Siemens 5SX, frente do DR 5SM1, contator 3RT + bloco auxiliar, frente do CTD, frentes dos módulos
// Altronic (RAX/RPT/RST/RCA/RYD) e WEG RTW-RE (TCS). Cada região é desenhada em METROS DO MUNDO (já na escala final
// da peça), então os textos não ficam esticados pela escala não uniforme das instâncias.
// R[nome] = { uv:[u0,v0,u1,v1], w, h } → usado por PG.decalGeo.
// ---------------------------------------------------------------------------------------------------------------
export const RELAY_SY = 0.92;
export const RELAY_VAR = {
  RCA: { sx: 1.4, pot: true, mode: 'PROTEÇÃO', top: ['A1', 'A2', ''], bot: ['J', 'R', ''] },
  RPT: { sx: 1.25, mode: 'PROTEÇÃO', desc: ['proteção', 'térmica'], top: ['P1', 'P2', 'P3'], bot: ['24', '21', '22'] },
  RST: { sx: 1.1, mode: 'PROTEÇÃO', desc: ['falta e seq.', 'de fase'], top: ['L1', 'L2', 'L3'], bot: ['14', '11', '12'] },
  RAX: { sx: 1.05, mode: 'TEMPO', desc: ['relé auxiliar'], top: ['A1', '15', '25'], bot: ['26', '28', 'A2'] },
  RYD: { sx: 1.05, pot: true, mode: 'TEMPO', name: 'RYΔ', top: ['A1', '15', '25'], bot: ['26', '28', 'A2'] },
  TCS: { sx: 1.25, pot: true, dark: true, top: ['A1', '15', 'A3'], bot: ['16', '18', 'A2'] },
};
function regionPainter(g, k) {
  const F = 'Arial, Helvetica, sans-serif';
  const P = {
    g, k,
    text(s, x, y, sz, o = {}) {
      g.save(); g.fillStyle = o.c || '#222'; g.textAlign = o.a || 'center'; g.textBaseline = 'middle';
      g.font = `${o.it ? 'italic ' : ''}${o.w || 700} ${Math.max(1, sz * k)}px ${o.f || F}`;
      const m = g.measureText(s).width;
      g.translate(x * k, y * k); if (o.mw && m > o.mw * k) g.scale(o.mw * k / m, 1); if (o.sx) g.scale(o.sx, 1);
      g.fillText(s, 0, 0); g.restore();
      return (o.mw && m > o.mw * k ? o.mw * k : m * (o.sx || 1)) / k;
    },
    rect(x, y, w, h, c, r = 0) { g.fillStyle = c; g.beginPath(); g.roundRect(x * k, y * k, w * k, h * k, r * k); g.fill(); },
    srect(x, y, w, h, c, lw, r = 0) { g.strokeStyle = c; g.lineWidth = lw * k; g.beginPath(); g.roundRect(x * k, y * k, w * k, h * k, r * k); g.stroke(); },
    circ(x, y, r, c) { g.fillStyle = c; g.beginPath(); g.arc(x * k, y * k, r * k, 0, Math.PI * 2); g.fill(); },
    scirc(x, y, r, c, lw) { g.strokeStyle = c; g.lineWidth = lw * k; g.beginPath(); g.arc(x * k, y * k, r * k, 0, Math.PI * 2); g.stroke(); },
    line(pts, c, lw) { g.strokeStyle = c; g.lineWidth = lw * k; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x * k, y * k) : g.moveTo(x * k, y * k))); g.stroke(); },
    // logotipo ALTRONIC (círculo preto com o "X" vazado + nome); x = início, y = linha central, h = altura das letras
    logo(x, y, h, c = '#151515', bg = '#fff', reg = true) {
      const r = h * 0.62; P.circ(x + r, y, r, c);
      g.save(); g.strokeStyle = bg; g.lineWidth = r * 0.34 * k; g.lineCap = 'butt';
      g.beginPath(); g.moveTo((x + r * 0.45) * k, (y + r * 0.7) * k); g.lineTo((x + r * 1.35) * k, (y - r * 0.75) * k); g.stroke();
      g.lineWidth = r * 0.26 * k; g.beginPath(); g.moveTo((x + r * 0.55) * k, (y - r * 0.55) * k); g.lineTo((x + r * 1.5) * k, (y + r * 0.62) * k); g.stroke(); g.restore();
      const tw = P.text('ALTRONIC', x + r * 2.05, y + h * 0.04, h, { a: 'left', w: 900, c, f: '"Arial Black", Arial, sans-serif', sx: 0.92 });
      if (reg) P.scirc(x + r * 2.05 + tw + h * 0.25, y - h * 0.45, h * 0.14, c, h * 0.05);
    },
    grime(w, h, n, a = 0.05, seed = 1) {
      const r = rng(seed);
      for (let i = 0; i < n; i++) { g.fillStyle = `rgba(90,80,62,${a * 0.35 * r()})`; g.beginPath(); g.ellipse(r() * w * k, r() * h * k, (0.0004 + r() * 0.0018) * k, (0.0003 + r() * 0.0012) * k, r() * 3, 0, 7); g.fill(); }
    },
  };
  return P;
}

export function b1Atlas(renderer) {
  const regs = [];
  const add = (name, w, h, draw) => regs.push({ name, w, h, draw });
  const GR = '#6d6f72', DK = '#2a2b2d';

  // --- disjuntor Siemens 5SX (1 polo; o tripolar usa 3×). Polo p = 0,0324 m (escala do layout já aplicada) ---
  add('brkHolo', 0.026, 0.0078, (P, w, h) => {
    const { g, k } = P; g.save(); g.beginPath(); g.roundRect(0, 0, w * k, h * k, 0.0006 * k); g.clip();
    const gr = g.createLinearGradient(0, 0, w * k, h * k); gr.addColorStop(0, '#16248a'); gr.addColorStop(0.35, '#2340b8'); gr.addColorStop(0.6, '#1a2fa0'); gr.addColorStop(1, '#2a1c90');
    g.fillStyle = gr; g.fillRect(0, 0, w * k, h * k);
    for (let i = -6; i < 16; i++) {                                                         // faixas holográficas
      const x = i * 0.0026; g.strokeStyle = i % 3 ? 'rgba(40,200,170,0.5)' : 'rgba(120,240,110,0.55)'; g.lineWidth = 0.0007 * k;
      g.beginPath(); g.moveTo(x * k, h * k); g.lineTo((x + 0.006) * k, 0); g.stroke();
    }
    g.globalAlpha = 0.45; P.text('Produto Seriado  Produto Seriado', w * 0.5, h * 0.18, 0.0013, { c: '#9dffd8', w: 600 }); P.text('Seriado  Produto Seriado  Produto', w * 0.5, h * 0.86, 0.0013, { c: '#9dffd8', w: 600 }); g.globalAlpha = 1;
    P.text('SIEMENS', w * 0.5, h * 0.54, 0.0044, { c: '#ff7f8c', w: 800, mw: w * 0.78 });
    g.restore();
  });
  add('brkNeck', 0.0324, 0.0686, (P, w, h) => {                                             // impressões abaixo da janela da alavanca
    const c = w / 2;
    P.text('C16', c - 0.004, 0.0493, 0.0036, { c: '#9d9b94', w: 700 });
    P.text('220/380V~', c - 0.002, 0.0532, 0.0027, { c: '#8f8d86', w: 600 });
    P.rect(c - 0.0085, 0.0552, 0.0062, 0.0028, 'rgba(196,170,110,0.75)'); P.text('10000', c - 0.0054, 0.0566, 0.0018, { c: '#6b5f45', w: 700 });
    P.text('Ui 250/440V~', c - 0.0098, 0.0608, 0.0029, { c: '#4d4d4b', w: 600, a: 'left', mw: 0.022 });
    P.text('CE', c - 0.0098, 0.0648, 0.0026, { c: '#4d4d4b', w: 700, a: 'left' });
    P.grime(w, h, 60, 0.12, 31);
  });
  add('brkWin', 0.0178, 0.008, (P, w, h) => {
    P.text('SIEMENS', w / 2, h * 0.32, 0.0024, { c: '#c4c2bb', w: 700, mw: w * 0.8 }); P.text('5SX1 1', w / 2, h * 0.75, 0.0022, { c: '#c4c2bb', w: 700 });
  });

  // --- DR Siemens 5SM1 342-0MB (4 polos, W = 0,108 m). Coordenadas da foto d4318 (recorte) → m: (px-35, py-335)·1,31e-4 ---
  const W = 0.108, F = (v) => v * 1.31e-4;
  add('drTop', W, 0.024, (P, w, h) => {
    const p = W / 4; ['1', '3', '5', 'N'].forEach((t, i) => P.text(t, p / 2 + i * p, h - 0.0050, 0.0042, { c: '#9b9a95', w: 400 }));
    P.rect(w * 0.82, 0.0005, w * 0.17, h * 0.75, 'rgba(225,220,200,0.55)', 0.0008);
    P.grime(w, h, 120, 0.1, 41);
  });
  add('drNeck', W, 0.0686, (P, w, h) => {
    const t = (s, x, y, sz, o) => P.text(s, F(x - 35), F(y - 335), sz, { a: 'left', c: '#1d1d1f', ...o });
    t('SIEMENS', 80, 388, 0.0027, { w: 800 });
    t('5SM1 342-0MB', 80, 425, 0.0023, { w: 700 }); t('RCCB', 80, 450, 0.0021, { w: 700 }); t('FI', 185, 450, 0.0021, { w: 700 });
    t('In  25A', 75, 491, 0.0026, { w: 700 }); t('IΔn 30mA', 75, 514, 0.0026, { w: 700 }); t('Im  800A', 75, 539, 0.0024, { w: 700 }); t('Un ~ 230...400V', 75, 569, 0.0024, { w: 700, mw: F(190) });
    P.srect(F(208 - 35), F(525 - 335), F(50), F(27), '#1d1d1f', 0.00025); P.line([[F(214 - 35), F(540 - 335)], [F(224 - 35), F(532 - 335)], [F(234 - 35), F(545 - 335)], [F(250 - 35), F(535 - 335)]], '#1d1d1f', 0.00025);
    t('100A', 70, 590, 0.0016, { w: 700 }); P.srect(F(115 - 35), F(598 - 335), F(60), F(16), '#1d1d1f', 0.0002); t('10000', 120, 607, 0.0016, { w: 600 });
    P.line([[F(70 - 35), F(608 - 335)], [F(108 - 35), F(608 - 335)]], '#1d1d1f', 0.0002);
    // INMETRO, UC, IEC, IRAM, S
    P.line([[F(72 - 35), F(630 - 335)], [F(118 - 35), F(630 - 335)]], '#1d1d1f', 0.0006); P.line([[F(78 - 35), F(668 - 335)], [F(112 - 35), F(632 - 335)]], '#1d1d1f', 0.0009);
    P.line([[F(72 - 35), F(670 - 335)], [F(118 - 35), F(670 - 335)]], '#1d1d1f', 0.0006); t('INMETRO', 68, 680, 0.0009, { w: 700 });
    P.scirc(F(180 - 35), F(657 - 335), F(22), '#1d1d1f', 0.0003); t('UC', 168, 657, 0.0017, { w: 800 });
    t('IEC 61008', 75, 700, 0.0019, { w: 700 });
    P.g.save(); P.g.strokeStyle = '#1d1d1f'; P.g.lineWidth = 0.00025 * P.k; P.g.beginPath(); P.g.ellipse(F(97 - 35) * P.k, F(726 - 335) * P.k, F(32) * P.k, F(13) * P.k, 0, 0, 7); P.g.stroke(); P.g.restore();
    t('IRAM', 76, 727, 0.0013, { w: 800 });
    P.scirc(F(92 - 35), F(780 - 335), F(24), '#1d1d1f', 0.0004); t('S', 85, 781, 0.0028, { w: 800 });
    // esquema elétrico
    const L = (pts) => P.line(pts.map(([x, y]) => [F(x - 35), F(y - 335)]), '#1d1d1f', 0.0002);
    t('1 3 5 N', 453, 532, 0.0017, { w: 700 }); t('2 4 6 N', 445, 657, 0.0017, { w: 700 });
    P.srect(F(333 - 35), F(552 - 335), F(22), F(22), '#1d1d1f', 0.00022); P.srect(F(375 - 35), F(556 - 335), F(18), F(16), '#1d1d1f', 0.00022);
    L([[355, 563], [375, 563]]); L([[393, 563], [540, 563]]);
    for (let i = 0; i < 4; i++) { const x = 455 + i * 23; L([[x, 540], [x, 575], [x + 10, 600], [x, 615], [x, 645]]); }
    P.srect(F(405 - 35), F(585 - 335), F(22), F(30), '#1d1d1f', 0.00022); P.srect(F(505 - 35), F(598 - 335), F(40), F(30), '#1d1d1f', 0.00022);
    L([[380, 575], [380, 620], [540, 620]]); L([[540, 556], [580, 556], [580, 600]]); P.srect(F(575 - 35), F(600 - 335), F(10), F(28), '#1d1d1f', 0.0002);
    L([[580, 628], [580, 645], [560, 645], [560, 655]]); t('T', 585, 658, 0.0018, { w: 700 });
    // indicação I / ↕ / O e "Test"
    t('I', 638, 521, 0.0034, { w: 800 }); L([[636, 578], [636, 630]]); P.line([[F(629 - 35), F(588 - 335)], [F(636 - 35), F(576 - 335)], [F(643 - 35), F(588 - 335)]], '#1d1d1f', 0.0003);
    P.line([[F(629 - 35), F(620 - 335)], [F(636 - 35), F(632 - 335)], [F(643 - 35), F(620 - 335)]], '#1d1d1f', 0.0003);
    P.scirc(F(632 - 35), F(686 - 335), F(10), '#1d1d1f', 0.00035);
    t('Test', 364, 719, 0.0018, { w: 700 }); t('semestral', 362, 743, 0.0018, { w: 700 }); t('half-yearly', 362, 766, 0.0018, { w: 700 });
    P.grime(w, h, 220, 0.1, 43);
  });

  // --- contator 3RT (frente central 41×42 mm, blocos de bornes 46×26, bloco auxiliar) ---
  add('kFront', 0.041, 0.042, (P, w, h) => {
    P.logo(0.019, 0.0062, 0.0030, '#4f6f95', 'rgba(0,0,0,0)', false);
    P.text('3TS29', 0.0035, 0.0335, 0.0031, { a: 'left', c: '#3d5571', w: 700 }); P.text('10E', 0.0035, 0.0372, 0.0031, { a: 'left', c: '#3d5571', w: 700 });
    P.rect(0.0245, 0.029, 0.0135, 0.0105, '#eeeeea', 0.0004); P.grime(w, h, 30, 0.12, 51);
    P.text('K', 0.033, 0.0345, 0.004, { c: 'rgba(80,80,90,0.35)', w: 300, f: 'cursive' });
  });
  add('kTop', 0.046, 0.026, (P, w, h) => {
    ['1/L1', '3/L2', '5/L3'].forEach((t, i) => P.text(t, 0.0100 + i * 0.0125, 0.0026, 0.0021, { c: '#33475e', w: 700 }));
    ['2-', '3-', '4-'].forEach((t, i) => P.text(t, 0.0045 + i * 0.0125, 0.0205, 0.0018, { c: '#33475e', w: 700 }));
    P.grime(w, h, 40, 0.1, 52);
  });
  add('kBot', 0.046, 0.026, (P, w, h) => {
    ['2/T1', '4/T2', '6/T3'].forEach((t, i) => P.text(t, 0.0100 + i * 0.0125, h - 0.0026, 0.0021, { c: '#33475e', w: 700 }));
    P.grime(w, h, 40, 0.1, 53);
  });
  add('kAux', 0.0155, 0.074, (P, w, h) => {
    P.text('-3', w * 0.3, 0.0045, 0.0021, { c: '#33475e' }); P.text('NA', w * 0.72, 0.0045, 0.0019, { c: '#33475e' });
    P.text('-4', w * 0.3, h - 0.0045, 0.0021, { c: '#33475e' }); P.text('NA', w * 0.72, h - 0.0045, 0.0019, { c: '#33475e' });
    P.text('0446-2', w * 0.12, 0.016, 0.0014, { c: '#3d5571', w: 600 });
    P.rect(w * 0.13, 0.026, w * 0.74, 0.026, '#ecebe2', 0.0005); P.rect(w * 0.13, 0.026, w * 0.74, 0.026, 'rgba(150,130,90,0.12)', 0.0005);
    P.grime(w, h, 50, 0.14, 54);
  });

  // --- CTD (moldura 100 mm; face 92 mm) — foto d4320 ---
  add('ctdFace', 0.092, 0.092, (P, w, h) => {
    const cx = w / 2, cy = h / 2, Y = (y) => cy - y;
    P.logo(cx - 0.0175, Y(0.0412), 0.0052, '#f2f2f2', '#141516');
    ['OUT1', 'OUT2', 'CONT', 'TIMER'].forEach((t, i) => P.text(t, cx + [-0.0137, 0.0008, 0.0145, 0.0288][i], Y(-0.0178), 0.0026, { c: '#d8d8d8', w: 600 }));
    // faixa azul ondulada com as 4 teclas
    const g = P.g, k = P.k, bx = [-0.0315, -0.0105, 0.0105, 0.0315];
    g.fillStyle = '#1f47b8'; g.beginPath(); g.roundRect((cx - 0.039) * k, Y(-0.0275) * k, 0.078 * k, 0.0072 * k, 0.0036 * k); g.fill();
    for (const x of bx) P.circ(cx + x, Y(-0.0311), 0.0070, '#1f47b8');
    ['PROG', '▲', '▼', 'RESET'].forEach((t, i) => P.text(t, cx + bx[i], Y(-0.0393), i % 3 ? 0.0028 : 0.0021, { c: '#d8d8d8', w: 700 }));
    P.line([[cx - 0.041, Y(-0.0432)], [cx + 0.028, Y(-0.0432)]], '#8a8a8a', 0.0004); P.line([[cx - 0.041, Y(-0.0441)], [cx + 0.028, Y(-0.0441)]], '#8a8a8a', 0.0004);
    P.text('CTD', cx + 0.0355, Y(-0.0434), 0.0036, { c: '#e6e6e6', w: 800, it: true });
  });
  for (let i = 0; i < 4; i++) add('ctdI' + i, 0.011, 0.011, (P, w, h) => {
    const c = '#f4f6ff', x = w / 2, y = h / 2;
    P.scirc(x, y, 0.0037, c, 0.0005);
    if (i === 0) P.text('P', x, y + 0.0002, 0.0045, { c, w: 800 });
    if (i === 1) { P.line([[x - 0.0018, y - 0.0003], [x, y - 0.0022], [x + 0.0018, y - 0.0003]], c, 0.0007); P.rect(x - 0.0009, y - 0.0004, 0.0018, 0.0021, c); }
    if (i === 2) { P.line([[x - 0.0018, y + 0.0003], [x, y + 0.0022], [x + 0.0018, y + 0.0003]], c, 0.0007); P.rect(x - 0.0009, y - 0.0017, 0.0018, 0.0021, c); }
    if (i === 3) { P.scirc(x, y, 0.0021, c, 0.0006); P.line([[x - 0.0014, y - 0.0014], [x + 0.0014, y + 0.0014]], c, 0.0006); }
  });

  // --- módulos Altronic / WEG: frente elevada (28×62 mm locais) e faixas de numeração dos bornes ---
  for (const [v, o] of Object.entries(RELAY_VAR)) {
    const fw = 0.028 * o.sx, fh = 0.062 * RELAY_SY;
    add('rf_' + v, fw, fh, (P, w, h) => {
      const cx = w / 2, potX = cx + 0.003 * o.sx, ledX = cx - 0.008 * o.sx, potY = h / 2 + 0.016 * RELAY_SY;
      if (v === 'TCS') {                                                                     // WEG RTW-RE
        P.rect(0.002, 0.003, 0.010, 0.0055, '#1d4fa8', 0.0006); P.text('WEG', 0.007, 0.0058, 0.0035, { c: '#fff', w: 900, it: true });
        P.circ(w - 0.0045, 0.006, 0.0011, '#7a1010'); P.circ(w - 0.0045, 0.0095, 0.0011, '#145a1c');
        for (let i = 0; i <= 10; i++) { const a = Math.PI * (0.8 + i * 0.14); P.line([[potX + Math.cos(a) * 0.0066, potY + Math.sin(a) * 0.0066], [potX + Math.cos(a) * 0.0078, potY + Math.sin(a) * 0.0078]], '#333', 0.00028); }
        ['0,5', '1', '1,5', '2', '3'].forEach((t, i) => { const a = Math.PI * (0.85 + i * 0.33); P.text(t, potX + Math.cos(a) * 0.0098, potY + Math.sin(a) * 0.0098, 0.0017, { c: '#333', w: 600 }); });
        P.text('RTW-RE', cx, h - 0.0045, 0.0034, { c: '#222', w: 700 });
        P.grime(w, h, 40, 0.1, 61); return;
      }
      for (let i = 0; i < 3; i++) {                                                          // 2ª fileira de bornes (38 35 36)
        const x = cx + (i - 1) * 0.009 * Math.min(o.sx, 1.15);
        P.text(['38', '35', '36'][i], x, 0.0026, 0.0019, { c: '#3a3a3a', w: 700 });
        P.circ(x, 0.0074, 0.0026, '#8d8d88'); P.circ(x, 0.0074, 0.0019, '#d9d8d2'); P.circ(x, 0.0074, 0.0011, '#4a4a48');
      }
      P.logo(cx - 0.0122, 0.0145, 0.0029);
      P.text(o.mode, 0.003, 0.0196, 0.0021, { a: 'left', c: '#1a1a1a', w: 800 });
      if (o.mode === 'TEMPO') { P.scirc(w - 0.004, 0.0196, 0.0016, '#1a1a1a', 0.0003); P.line([[w - 0.004, 0.0186], [w - 0.004, 0.0196], [w - 0.0032, 0.0199]], '#1a1a1a', 0.0003); }
      else { P.rect(w - 0.0052, 0.0193, 0.0026, 0.0021, '#1a1a1a', 0.0002); P.scirc(w - 0.0039, 0.0192, 0.0009, '#1a1a1a', 0.0003); }
      (o.desc || []).forEach((t, i) => P.text(t, cx + 0.002, 0.0285 + i * 0.0036, 0.0031, { c: '#2c2c2c', w: 500, mw: w * 0.8 }));
      P.line([[ledX - 0.0012, potY - 0.0045], [ledX + 0.0004, potY - 0.0045], [ledX - 0.0006, potY - 0.0028]], '#555', 0.00025);  // símbolo do LED
      if (o.pot) {
        const n = v === 'RYD' ? ['6', '12', '18', '24', '30'] : ['1', '3', '5', '8', '10'];
        for (let i = 0; i <= 12; i++) { const a = Math.PI * (0.75 + i * 0.125); P.line([[potX + Math.cos(a) * 0.0063, potY + Math.sin(a) * 0.0063], [potX + Math.cos(a) * 0.0072, potY + Math.sin(a) * 0.0072]], '#333', 0.00025); }
        n.forEach((t, i) => { const a = Math.PI * (0.8 + i * 0.35); P.text(t, potX + Math.cos(a) * 0.0091, potY + Math.sin(a) * 0.0088, 0.0016, { c: '#333', w: 600 }); });
        if (v === 'RYD') P.text('seg', potX + 0.0085, potY + 0.0065, 0.0014, { c: '#333', w: 600 });
        if (v === 'RCA') { P.text('inibição', potX + 0.0002, potY - 0.0098, 0.0017, { c: '#333', w: 500 }); P.text('partida', potX, potY - 0.0080, 0.0017, { c: '#333', w: 500 }); }
        P.circ(ledX, potY + 0.0055, 0.0011, '#1c8a34');                                    // LED verde impresso/pequeno
      }
      // faixa preta com o nome + código de barras
      const sy = h - 0.0072;
      P.rect(0.0012, sy, w - 0.0024, 0.0042, '#f5f5f2'); P.rect(0.0012, sy, w * 0.42, 0.0042, '#141414');
      P.text(o.name || v, 0.0028, sy + 0.0022, 0.0030, { a: 'left', c: '#fff', w: 800, mw: w * 0.38 });
      for (let i = 0; i < 9; i++) P.rect(w * 0.47 + i * w * 0.054, sy + 0.0006, w * (i % 3 ? 0.022 : 0.034), 0.003, '#151515');
      P.grime(w, h, 50, 0.1, 60 + v.charCodeAt(1));
    });
    for (const s of ['t', 'b']) add(`rb${s}_` + v, 0.028 * o.sx, 0.0095 * RELAY_SY, (P, w, h) => {
      (s === 't' ? o.top : o.bot).forEach((t, i) => t && P.text(t, w / 2 + (i - 1) * 0.009 * o.sx, h / 2, 0.0024, { c: o.dark ? '#d0d0d0' : '#3a3a3a', w: 700 }));
    });
  }

  // --- empacotamento (prateleiras), ppm adaptativo para caber em 2048² ---
  const SZ = 2048, pad = 6;
  regs.sort((a, b) => b.h - a.h);
  let ppm = 11000, pos;
  for (; ppm > 2000; ppm *= 0.94) {
    pos = []; let x = pad, y = pad, sh = 0, ok = true;
    for (const r of regs) {
      const pw = Math.ceil(r.w * ppm), ph = Math.ceil(r.h * ppm);
      if (x + pw + pad > SZ) { x = pad; y += sh + pad; sh = 0; }
      if (y + ph + pad > SZ) { ok = false; break; }
      pos.push([x, y, pw, ph]); x += pw + pad; sh = Math.max(sh, ph);
    }
    if (ok) break;
  }
  const c = canvas(SZ, SZ), g = c.getContext('2d'), R = {};
  regs.forEach((r, i) => {
    const [x, y, pw, ph] = pos[i];
    g.save(); g.beginPath(); g.rect(x, y, pw, ph); g.clip(); g.translate(x, y);
    r.draw(regionPainter(g, ppm), r.w, r.h); g.restore();
    R[r.name] = { uv: [x / SZ, 1 - (y + ph) / SZ, (x + pw) / SZ, 1 - y / SZ], w: r.w, h: r.h };
  });
  const tex = texFrom(c, renderer);
  return { tex, R, ppm, canvas: c };
}
