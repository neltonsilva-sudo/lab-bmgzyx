// DONO: agente "sala". Texturas procedurais (canvas) do piso epóxi, faixas amarelas, paredes, teto, eletrocalha e placas.
import * as THREE from 'three';

export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function tex(c, { srgb = true, repeat = null, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  t.needsUpdate = true;
  return t;
}
// Nuvem de manchas suaves (radial gradients) — base de todo o desgaste.
function blotches(g, R, n, w, h, rMin, rMax, color, aMin, aMax) {
  for (let i = 0; i < n; i++) {
    const x = R() * w, y = R() * h, r = rMin + R() * (rMax - rMin), a = aMin + R() * (aMax - aMin);
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, color.replace('A', a.toFixed(3))); gr.addColorStop(1, color.replace('A', '0'));
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
}

// Piso epóxi azul: cor (desgaste por trânsito, sujeira nos cantos, riscos, respingos de tinta) + rugosidade.
// zones: retângulos [x0,z0,x1,z1,força] em metros onde há mais trânsito (desgaste mais claro/fosco).
export function floorTextures(W, D, zones, seed = 7, lines = []) {
  const PX = 170; // px por metro
  const w = Math.round(W * PX), h = Math.round(D * PX);
  const R = rng(seed);
  const c = cv(w, h), g = c.getContext('2d');
  const rc = cv(w, h), rg = rc.getContext('2d');
  // base
  g.fillStyle = '#22476d'; g.fillRect(0, 0, w, h);
  rg.fillStyle = 'rgb(150,150,150)'; rg.fillRect(0, 0, w, h);
  // variação de tom grande (rolo de aplicação / demãos)
  blotches(g, R, 140, w, h, 80, 520, 'rgba(18,50,95,A)', 0.06, 0.22);
  // manchas alongadas (marcas de rodo/mop) ao longo do comprimento
  for (let i = 0; i < 260; i++) { const x = R() * w, y = R() * h; g.save(); g.translate(x, y); g.rotate((R() - 0.5) * 0.5 + (R() < 0.5 ? 0 : Math.PI / 2)); g.fillStyle = `rgba(${R() < 0.5 ? '15,45,90' : '110,150,195'},${0.03 + R() * 0.06})`; g.fillRect(-60 - R() * 200, -6 - R() * 18, 120 + R() * 400, 12 + R() * 36); g.restore(); }
  blotches(g, R, 70, w, h, 120, 480, 'rgba(95,140,190,A)', 0.04, 0.12);
  // zonas de trânsito: epóxi gasto, mais claro/acinzentado e mais fosco
  for (const [x0, z0, x1, z1, k] of zones) {
    for (let i = 0; i < 60 * k; i++) {
      const x = (x0 + R() * (x1 - x0)) * PX, y = (z0 + R() * (z1 - z0)) * PX, r = (0.15 + R() * 0.55) * PX;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      const a = 0.05 + R() * 0.13;
      gr.addColorStop(0, `rgba(150,175,200,${a})`); gr.addColorStop(1, 'rgba(150,175,200,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill();
      const gr2 = rg.createRadialGradient(x, y, 0, x, y, r);
      gr2.addColorStop(0, `rgba(170,170,170,${a * 1.6})`); gr2.addColorStop(1, 'rgba(170,170,170,0)');
      rg.fillStyle = gr2; rg.beginPath(); rg.arc(x, y, r, 0, 6.3); rg.fill();
    }
  }
  // sujeira acumulada junto às paredes (rodapé)
  const edge = (x, y, ww, hh, dir) => {
    const gr = dir === 'x' ? g.createLinearGradient(x, 0, x + ww, 0) : g.createLinearGradient(0, y, 0, y + hh);
    gr.addColorStop(0, 'rgba(40,50,60,0.35)'); gr.addColorStop(1, 'rgba(40,50,60,0)');
    g.fillStyle = gr; g.fillRect(x, y, ww, hh);
  };
  edge(0, 0, 0.35 * PX, h, 'x'); edge(0, 0, w, 0.35 * PX, 'z');
  { const gr = g.createLinearGradient(w, 0, w - 0.35 * PX, 0); gr.addColorStop(0, 'rgba(40,50,60,0.35)'); gr.addColorStop(1, 'rgba(40,50,60,0)'); g.fillStyle = gr; g.fillRect(w - 0.35 * PX, 0, 0.35 * PX, h); }
  // riscos de arraste / rodízios (curvas finas escuras e claras)
  for (let i = 0; i < 520; i++) {
    const x = R() * w, y = R() * h, L = (0.1 + R() * 0.9) * PX, ang = R() * Math.PI * 2, bend = (R() - 0.5) * 0.6;
    const light = R() < 0.55;
    g.strokeStyle = light ? `rgba(165,190,215,${0.03 + R() * 0.07})` : `rgba(20,30,45,${0.05 + R() * 0.12})`;
    g.lineWidth = 0.6 + R() * 1.8;
    g.beginPath(); g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(ang + bend) * L * 0.5, y + Math.sin(ang + bend) * L * 0.5, x + Math.cos(ang) * L, y + Math.sin(ang) * L); g.stroke();
    rg.strokeStyle = `rgba(200,200,200,${0.15 + R() * 0.3})`; rg.lineWidth = g.lineWidth + 1;
    rg.beginPath(); rg.moveTo(x, y); rg.lineTo(x + Math.cos(ang) * L, y + Math.sin(ang) * L); rg.stroke();
  }
  // marcas pretas de borracha (sapatos, rodízios)
  for (let i = 0; i < 160; i++) {
    const x = R() * w, y = R() * h;
    g.fillStyle = `rgba(15,18,25,${0.12 + R() * 0.3})`;
    g.save(); g.translate(x, y); g.rotate(R() * 6.3); g.fillRect(0, 0, 2 + R() * 14, 1 + R() * 3); g.restore();
  }
  // respingos de tinta branca / massa (como perto das bancadas nas fotos)
  for (let i = 0; i < 70; i++) {
    const x = R() * w, y = R() * h, r = 0.5 + R() * R() * 2.2;
    g.fillStyle = `rgba(215,220,222,${0.25 + R() * 0.4})`; g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill();
    rg.fillStyle = 'rgba(210,210,210,0.9)'; rg.beginPath(); rg.arc(x, y, r + 1, 0, 6.3); rg.fill();
  }
  // lascas no epóxi deixando o cimento cinza aparecer
  for (let i = 0; i < 170; i++) {
    const x = R() * w, y = R() * h;
    g.fillStyle = `rgba(${115 + R() * 30 | 0},${122 + R() * 25 | 0},${128 + R() * 20 | 0},${0.35 + R() * 0.4})`;
    g.beginPath(); const n = 5 + (R() * 4 | 0), rr = 0.8 + R() * R() * 5;
    for (let k = 0; k < n; k++) { const a = k / n * 6.3, q = rr * (0.5 + R()); k ? g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q) : g.moveTo(x + q, y); }
    g.fill();
    rg.fillStyle = 'rgb(235,235,235)'; rg.beginPath(); rg.arc(x, y, 4, 0, 6.3); rg.fill();
  }
  // sujeira escura acumulada junto às faixas amarelas (onde o mop não pega) e lascas na borda
  for (const [x0, z0, x1, z1] of lines) {
    const along = Math.abs(x1 - x0) > Math.abs(z1 - z0), L = (along ? Math.abs(x1 - x0) : Math.abs(z1 - z0)) * PX;
    for (let k = 0; k < L / 6; k++) {
      const f = R(), side = R() < 0.5 ? -1 : 1, off = (0.06 + R() * 0.06) * side * PX;
      const x = (x0 + (x1 - x0) * f) * PX + (along ? 0 : off), y = (z0 + (z1 - z0) * f) * PX + (along ? off : 0);
      g.fillStyle = `rgba(25,35,45,${0.05 + R() * 0.12})`; g.beginPath(); g.ellipse(x, y, along ? 4 + R() * 12 : 1.5 + R() * 3, along ? 1.5 + R() * 3 : 4 + R() * 12, 0, 0, 6.3); g.fill();
      if (R() < 0.08) { g.fillStyle = `rgba(150,148,140,${0.6 + R() * 0.3})`; g.beginPath(); g.arc(x - off * 0.4 * (along ? 0 : 1), y - off * 0.4 * (along ? 1 : 0), 1 + R() * 3, 0, 6.3); g.fill(); }
    }
  }
  // ruído fino (grão)
  const id = g.getImageData(0, 0, w, h), d = id.data;
  const rid = rg.getImageData(0, 0, w, h), rd = rid.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (R() - 0.5) * 4;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  g.putImageData(id, 0, 0); rg.putImageData(rid, 0, 0);
  return { map: tex(c), roughnessMap: tex(rc, { srgb: false }) };
}

// Faixa amarela pintada: bordas irregulares, lascas mostrando o azul, sujeira. Mapeada 1 m por repetição em u.
export function stripeTextures(seed = 3) {
  const w = 512, h = 64, R = rng(seed);
  const c = cv(w, h), g = c.getContext('2d');
  const ac = cv(w, h), ag = ac.getContext('2d');
  g.fillStyle = '#e3b51c'; g.fillRect(0, 0, w, h);
  blotches(g, R, 40, w, h, 10, 50, 'rgba(160,120,30,A)', 0.08, 0.25);
  blotches(g, R, 30, w, h, 8, 40, 'rgba(255,215,80,A)', 0.05, 0.2);
  for (let i = 0; i < 140; i++) { g.fillStyle = `rgba(40,40,40,${0.08 + R() * 0.25})`; g.fillRect(R() * w, R() * h, 1 + R() * 10, 1 + R() * 2); }
  // lascas (azul aparecendo)
  for (let i = 0; i < 26; i++) {
    const x = R() * w, y = R() * h; g.fillStyle = `rgba(70,115,165,${0.6 + R() * 0.4})`;
    g.beginPath(); g.ellipse(x, y, 1 + R() * 6, 1 + R() * 3, R() * 3, 0, 6.3); g.fill();
  }
  ag.fillStyle = '#fff'; ag.fillRect(0, 0, w, h);
  // bordas serrilhadas
  ag.fillStyle = '#000';
  for (let x = 0; x < w; x += 2) {
    const t1 = Math.max(0, (R() < 0.08 ? 3 + R() * 5 : R() * 2.2)), t2 = Math.max(0, (R() < 0.08 ? 3 + R() * 5 : R() * 2.2));
    ag.fillRect(x, 0, 2, t1); ag.fillRect(x, h - t2, 2, t2);
  }
  // falhas: tinta gasta/arrancada em manchas
  for (let i = 0; i < 7; i++) { const x = R() * w, y = R() * h; ag.beginPath(); ag.ellipse(x, y, 3 + R() * 14, 2 + R() * 9, R() * 3, 0, 6.3); ag.fill(); }
  for (let i = 0; i < 90; i++) { ag.fillRect(R() * w, R() * h, 1 + R() * 3, 1 + R() * 3); }
  const rc = cv(w, h), rgc = rc.getContext('2d');
  rgc.fillStyle = 'rgb(120,120,120)'; rgc.fillRect(0, 0, w, h);
  for (let i = 0; i < 200; i++) { rgc.fillStyle = `rgba(220,220,220,${R() * 0.5})`; rgc.fillRect(R() * w, R() * h, 2 + R() * 8, 1 + R() * 3); }
  return { map: tex(c, { repeat: [1, 1] }), alphaMap: tex(ac, { srgb: false, repeat: [1, 1] }), roughnessMap: tex(rc, { srgb: false, repeat: [1, 1] }) };
}

// Parede branca levemente suja: manchas, marcas de mão, mais escura perto do piso. (u: largura em m, v: altura)
export function wallTexture(lenM, hM, seed = 11, opts = {}) {
  const PX = 64, w = Math.max(64, Math.min(2048, Math.round(lenM * PX))), h = Math.round(hM * PX);
  const R = rng(seed), c = cv(w, h), g = c.getContext('2d');
  g.fillStyle = opts.base || '#d6d9da'; g.fillRect(0, 0, w, h);
  blotches(g, R, Math.round(lenM * 6), w, h, 10, 80, 'rgba(120,118,110,A)', 0.02, 0.07);
  blotches(g, R, Math.round(lenM * 3), w, h, 20, 90, 'rgba(255,255,255,A)', 0.05, 0.15);
  // faixa de sujeira inferior (0–0,5 m)
  const gr = g.createLinearGradient(0, h, 0, h - 0.4 * PX);
  gr.addColorStop(0, 'rgba(80,84,88,0.38)'); gr.addColorStop(1, 'rgba(80,84,88,0)');
  g.fillStyle = gr; g.fillRect(0, h - 0.4 * PX, w, 0.4 * PX);
  for (let i = 0; i < lenM * 6; i++) { const x = R() * w, y = h - R() * 0.4 * PX, r = 2 + R() * 9; const gr2 = g.createRadialGradient(x, y, 0, x, y, r); gr2.addColorStop(0, `rgba(60,62,66,${0.05 + R() * 0.12})`); gr2.addColorStop(1, 'rgba(60,62,66,0)'); g.fillStyle = gr2; g.fillRect(x - r, y - r, 2 * r, 2 * r); } // chutes/sujeira baixa (0–0,4 m)
  // marcas de mão (grupos de 4 dedos) entre 0,9 e 1,7 m
  for (let i = 0; i < lenM * 0.9; i++) { const x = R() * w, y = h - (0.9 + R() * 0.8) * PX; for (let k = 0; k < 4; k++) { g.fillStyle = `rgba(90,85,78,${0.04 + R() * 0.05})`; g.beginPath(); g.ellipse(x + k * 3.2, y - (k === 0 || k === 3 ? 0 : 2), 1.3, 3.5, 0.15, 0, 6.3); g.fill(); } g.beginPath(); g.ellipse(x + 5, y + 7, 5, 4, 0, 0, 6.3); g.fill(); }
  // marcas / arranhões / mãos
  for (let i = 0; i < lenM * 8; i++) {
    const x = R() * w, y = h * (0.3 + R() * 0.65);
    g.fillStyle = `rgba(70,70,70,${0.03 + R() * 0.08})`; g.fillRect(x, y, 1 + R() * 6, 1 + R() * 2);
  }
  for (let i = 0; i < lenM * 1.2; i++) { // escorridos verticais sutis
    const x = R() * w, y0 = R() * h * 0.6; g.fillStyle = `rgba(120,120,110,${0.03 + R() * 0.05})`; g.fillRect(x, y0, 1 + R() * 2, 10 + R() * 60);
  }
  const id = g.getImageData(0, 0, w, h), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (R() - 0.5) * 6; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(id, 0, 0);
  return tex(c);
}

// Forro: chapa metálica contínua com frisos lineares finos a cada 0,15 m (1 friso por repetição; repetir W/0,15 em u).
export function ceilingTextures(seed = 5) {
  const w = 64, h = 1024, R = rng(seed);
  const c = cv(w, h), g = c.getContext('2d');
  const b = cv(w, h), bg = b.getContext('2d');
  g.fillStyle = '#b6b9bb'; g.fillRect(0, 0, w, h);
  bg.fillStyle = '#808080'; bg.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 4) { g.fillStyle = `rgba(${R() < 0.5 ? '255,255,255' : '120,120,120'},${R() * 0.03})`; g.fillRect(0, y, w, 4); }
  g.fillStyle = 'rgba(105,110,114,0.55)'; g.fillRect(0, 0, 3, h);
  g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(3, 0, 2, h);
  bg.fillStyle = '#2a2a2a'; bg.fillRect(0, 0, 3, h); bg.fillStyle = '#b0b0b0'; bg.fillRect(3, 0, 2, h);
  return { map: tex(c, { repeat: [1, 1] }), bumpMap: tex(b, { srgb: false, repeat: [1, 1] }) };
}

// Chapa perfurada da eletrocalha (alpha: furos oblongos), 1 unidade = 0,25 m.
export function perforatedAlpha() {
  const w = 128, h = 128, c = cv(w, h), g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#000';
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
    const x = 10 + i * 30 + (j % 2) * 15, y = 20 + j * 64;
    g.beginPath(); g.roundRect(x, y, 8, 26, 4); g.fill();
  }
  return tex(c, { srgb: false, repeat: [1, 1] });
}

export function galvTexture(seed = 9) {
  const w = 256, h = 256, R = rng(seed), c = cv(w, h), g = c.getContext('2d');
  g.fillStyle = '#cfd2d4'; g.fillRect(0, 0, w, h);
  blotches(g, R, 60, w, h, 6, 40, 'rgba(230,232,235,A)', 0.1, 0.35); // lantejoulas da galvanização
  blotches(g, R, 40, w, h, 6, 40, 'rgba(120,125,128,A)', 0.1, 0.3);
  blotches(g, R, 14, w, h, 10, 60, 'rgba(90,85,75,A)', 0.05, 0.12); // poeira
  return tex(c, { repeat: [1, 1] });
}

// ---------- placas (canvas com texto/pictogramas) ----------
export function exitSign() {
  const w = 512, h = 256, c = cv(w, h), g = c.getContext('2d');
  g.fillStyle = '#0f6b3a'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#f4f6f4'; g.lineWidth = 10; g.strokeRect(10, 10, w - 20, h - 20);
  // porta
  g.fillStyle = '#f4f6f4'; g.fillRect(40, 40, 150, 176);
  g.fillStyle = '#0f6b3a'; g.fillRect(58, 58, 114, 158);
  // boneco correndo (branco)
  g.fillStyle = '#f4f6f4'; g.strokeStyle = '#f4f6f4'; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.arc(152, 78, 17, 0, 6.3); g.fill();
  g.lineWidth = 22;
  g.beginPath(); g.moveTo(140, 104); g.lineTo(118, 160); g.stroke();              // tronco
  g.lineWidth = 17;
  g.beginPath(); g.moveTo(118, 160); g.lineTo(152, 186); g.lineTo(176, 214); g.stroke(); // perna frente
  g.beginPath(); g.moveTo(118, 160); g.lineTo(96, 190); g.lineTo(62, 196); g.stroke();   // perna trás
  g.lineWidth = 13;
  g.beginPath(); g.moveTo(138, 112); g.lineTo(170, 132); g.lineTo(196, 122); g.stroke(); // braço frente
  g.beginPath(); g.moveTo(134, 112); g.lineTo(104, 118); g.lineTo(86, 140); g.stroke();  // braço trás
  // seta
  g.beginPath(); g.moveTo(255, 110); g.lineTo(390, 110); g.lineTo(390, 72); g.lineTo(470, 128); g.lineTo(390, 184); g.lineTo(390, 146); g.lineTo(255, 146); g.closePath(); g.fill();
  return tex(c);
}

export function extinguisherSign() {
  const w = 256, h = 192, c = cv(w, h), g = c.getContext('2d');
  g.fillStyle = '#d4222a'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#fff'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
  g.fillStyle = '#fff';
  // extintor
  g.beginPath(); g.roundRect(100, 58, 48, 112, 12); g.fill();
  g.fillRect(114, 40, 20, 20); g.fillRect(120, 30, 34, 8);
  g.lineWidth = 7; g.strokeStyle = '#fff'; g.beginPath(); g.moveTo(150, 34); g.quadraticCurveTo(186, 44, 176, 110); g.stroke();
  // chama
  g.beginPath(); g.moveTo(40, 170); g.bezierCurveTo(24, 130, 60, 110, 52, 70); g.bezierCurveTo(78, 100, 90, 130, 72, 170); g.closePath(); g.fill();
  return tex(c);
}

// Quadro branco com selo verde arredondado ("APR" / "CHECKLIST"), como na foto 2.
export function boardSign(text, seed = 1) {
  const w = 512, h = 384, R = rng(seed), c = cv(w, h), g = c.getContext('2d');
  g.fillStyle = '#f3f3f1'; g.fillRect(0, 0, w, h);
  blotches(g, R, 12, w, h, 20, 120, 'rgba(160,160,150,A)', 0.03, 0.08);
  g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
  // folha plastificada presa (reflexo leve)
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.35)'); gr.addColorStop(0.55, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const fs = text.length > 4 ? 64 : 84;
  g.font = `italic 900 ${fs}px Arial Black, Arial, sans-serif`;
  const tw = g.measureText(text).width, bw = tw + 60, bh = fs * 1.25, bx = (w - bw) / 2, by = h * 0.62;
  g.fillStyle = '#2e9d46'; g.beginPath(); g.roundRect(bx, by, bw, bh, bh / 2); g.fill();
  g.strokeStyle = '#1d6f30'; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(text, bx + 30, by + bh / 2 + 3);
  // parafusos nos cantos
  g.fillStyle = '#999'; for (const [x, y] of [[18, 18], [w - 18, 18], [18, h - 18], [w - 18, h - 18]]) { g.beginPath(); g.arc(x, y, 6, 0, 6.3); g.fill(); }
  return tex(c);
}

// Painel/lona institucional: faixa azul no topo com "SENAI FIEMG" (branco, itálico) e moldura azul.
export function bannerTexture(lenM, hM) {
  const PX = 180, w = Math.min(2048, Math.round(lenM * PX)), h = Math.round(hM * PX), R = rng(21);
  const c = cv(w, h), g = c.getContext('2d');
  g.fillStyle = '#f1f2f0'; g.fillRect(0, 0, w, h);
  const top = Math.round(0.14 * PX), side = Math.round(0.05 * PX);
  // grafismos claros do painel (linhas e formas azuis suaves)
  for (let i = 0; i < 14; i++) {
    g.strokeStyle = `rgba(40,90,170,${0.06 + R() * 0.1})`; g.lineWidth = 2 + R() * 6;
    g.beginPath(); const x = R() * w, y = top + R() * (h - top);
    g.moveTo(x, y); g.bezierCurveTo(x + R() * 300, y - R() * 100, x + R() * 300, y + R() * 100, x + 200 + R() * 400, y + (R() - 0.5) * 80); g.stroke();
  }
  g.fillStyle = '#1f4f9e'; g.fillRect(0, 0, w, top); g.fillRect(0, 0, side, h); g.fillRect(w - side, 0, side, h); g.fillRect(0, h - side, w, side);
  g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(0, top - 5, w, 2);
  g.font = `italic 700 ${Math.round(top * 0.62)}px Arial, Helvetica, sans-serif`;
  g.fillStyle = '#ffffff'; g.textBaseline = 'middle';
  g.fillText('SENAI  FIEMG', side + 22, top * 0.5 + 1);
  return tex(c);
}

// Placa azul pequena (identificação em vigas/pórticos).
export function bluePlate(text) {
  const w = 256, h = 96, c = cv(w, h), g = c.getContext('2d');
  g.fillStyle = '#2f5fae'; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, 0, w, 10);
  g.fillStyle = '#fff'; g.font = 'bold 44px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + 2);
  return tex(c);
}
