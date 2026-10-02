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
