// DONO: agente "boxes". Texturas procedurais (canvas) da área predial: alvenaria pintada com desgaste,
// caixas 4x2 amarelas, quadro aberto, quadros plastificados de ferramentas, placas azuis.
import * as THREE from 'three';

export const PPM = 420; // pixels por metro nas paredes
export function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
export function tex(c, srgb = true, aniso = 8) {
  const t = new THREE.CanvasTexture(c); t.anisotropy = aniso;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t;
}

// Ruído de valor suave (tileável) em Float32Array.
function valueNoise(w, h, cells, r) {
  const g = []; const cx = cells, cy = Math.max(1, Math.round(cells * h / w));
  for (let i = 0; i < cx * cy; i++) g.push(r());
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const fx = x / w * cx, fy = y / h * cy, ix = Math.floor(fx), iy = Math.floor(fy);
    let tx = fx - ix, ty = fy - iy; tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
    const a = g[(iy % cy) * cx + ix % cx], b = g[(iy % cy) * cx + (ix + 1) % cx], c = g[((iy + 1) % cy) * cx + ix % cx], d = g[((iy + 1) % cy) * cx + (ix + 1) % cx];
    out[y * w + x] = (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
  }
  return out;
}
function fbm(w, h, base, oct, r) {
  const o = new Float32Array(w * h); let amp = 1, tot = 0;
  for (let k = 0; k < oct; k++) { const n = valueNoise(w, h, base << k, r); for (let i = 0; i < o.length; i++) o[i] += n[i] * amp; tot += amp; amp *= 0.5; }
  for (let i = 0; i < o.length; i++) o[i] /= tot; return o;
}

// Pinta alvenaria branca-acinzentada com sujeira de base e marcas de uso.
// spec: { wm, hm, seed, ao(u,v)->0..1 escurecimento, base:[r,g,b], scuffs, holes:[{u,v,w,h}] (m, cantos de recorte) }
export function paintedWall(spec) {
  const { wm, hm, seed = 1, base = [214, 214, 208] } = spec;
  const W = Math.round(wm * PPM), H = Math.round(hm * PPM);
  const c = mk(W, H), x = c.getContext('2d'), r = rng(seed);
  const img = x.createImageData(W, H), d = img.data;
  const big = fbm(W, H, 3, 3, r), fine = fbm(W, H, 24, 3, r), grit = fbm(W, H, 90, 2, r);
  for (let j = 0; j < H; j++) {
    const ym = (H - 1 - j) / PPM; // altura em m
    const low = (Math.exp(-ym / 0.06) * 0.10 + Math.exp(-ym / 0.35) * 0.02) * (spec.dirt ?? 1); // encardido de base
    for (let i = 0; i < W; i++) {
      const k = j * W + i, um = i / PPM;
      let s = 1 + (big[k] - 0.5) * (spec.mottle ?? 0.07) + (fine[k] - 0.5) * 0.025 + (grit[k] - 0.5) * 0.012;
      s -= low * (0.6 + big[k] * 0.8);
      if (spec.ao) s *= 1 - spec.ao(um, ym);
      const warm = low * 10;
      d[k * 4] = Math.min(255, base[0] * s + warm * 0.6); d[k * 4 + 1] = Math.min(255, base[1] * s + warm * 0.3); d[k * 4 + 2] = Math.min(255, base[2] * s - warm * 0.2); d[k * 4 + 3] = 255;
    }
  }
  x.putImageData(img, 0, 0);
  // marcas de rolo verticais muito sutis
  x.globalAlpha = 0.005;
  for (let i = 0; i < wm * 6; i++) { x.fillStyle = r() < 0.5 ? '#000' : '#fff'; x.fillRect(r() * W, 0, 0.1 * PPM + r() * 0.1 * PPM, H); }
  x.globalAlpha = 1;
  // riscos/escuros de uso perto do chão (sapatos, escadas, carrinhos)
  const nS = spec.scuffs ?? Math.round(wm * 14);
  for (let i = 0; i < nS; i++) {
    const u = r() * W, v = H - Math.pow(r(), 1.8) * 0.75 * PPM;
    x.strokeStyle = `rgba(${70 + r() * 40},${68 + r() * 35},${62 + r() * 30},${0.05 + r() * 0.12})`;
    x.filter = 'blur(1px)'; x.lineWidth = 2 + r() * 5; x.beginPath(); x.moveTo(u, v);
    const a = (r() - 0.5) * 0.9, L = (0.02 + r() * 0.12) * PPM; x.quadraticCurveTo(u + L * 0.5, v + (r() - 0.5) * 6, u + Math.cos(a) * L, v + Math.sin(a) * L); x.stroke();
  }
  x.filter = 'none';
  // manchas de mão / pontos
  for (let i = 0; i < wm * (spec.spots ?? 3); i++) {
    const u = r() * W, v = H - (0.6 + r() * 1.2) * PPM, rr = (0.004 + r() * 0.02) * PPM;
    const gr = x.createRadialGradient(u, v, 0, u, v, rr); gr.addColorStop(0, `rgba(90,88,80,${0.04 + r() * 0.07})`); gr.addColorStop(1, 'rgba(90,88,80,0)');
    x.fillStyle = gr; x.beginPath(); x.arc(u, v, rr, 0, 7); x.fill();
  }
  // recortes de alvenaria ao redor das caixas embutidas (reboco refeito, borda irregular) + flange amarela
  for (const h of spec.holes || []) {
    const cx = h.u * PPM, cy = H - h.v * PPM, hw = h.w / 2 * PPM, hh = h.h / 2 * PPM, m = (h.m ?? 0.012) * PPM;
    const blob = (grow, col) => {
      x.fillStyle = col; x.beginPath(); const n = 28;
      for (let q = 0; q < n; q++) {
        const t = q / n * Math.PI * 2, ex = Math.cos(t), ey = Math.sin(t);
        const px = cx + Math.sign(ex) * Math.min(1, Math.abs(ex) * 1.8) * (hw + grow * (0.3 + r() * 0.9)), py = cy + Math.sign(ey) * Math.min(1, Math.abs(ey) * 1.8) * (hh + grow * (0.3 + r() * 0.9));
        q ? x.lineTo(px, py) : x.moveTo(px, py);
      }
      x.closePath(); x.fill();
    };
    if (h.flange) blob(m * 0.5, 'rgba(200,196,184,0.35)');                    // leve marca de massa, borda nítida
    else { blob(m * 1.2, 'rgba(190,186,174,0.4)'); blob(m * 0.6, 'rgba(140,136,124,0.5)'); } // recorte do quadro
    if (h.flange) { // flange da caixa 4x2 (amarelo fosco, sujo de massa)
      x.fillStyle = '#d8b530'; x.fillRect(cx - hw, cy - hh, hw * 2, hh * 2);
      for (let q = 0; q < 40; q++) { x.fillStyle = r() < 0.5 ? `rgba(120,95,20,${0.15 + r() * 0.2})` : `rgba(235,230,210,${0.2 + r() * 0.3})`; const sx = cx + (r() - 0.5) * hw * 2, sy = cy + (r() - 0.5) * hh * 2; x.fillRect(sx, sy, 1 + r() * 2.5, 1 + r() * 2.5); }
      x.strokeStyle = 'rgba(70,55,10,0.7)'; x.lineWidth = 1.5; x.strokeRect(cx - hw + h.flange * PPM, cy - hh + h.flange * PPM, (hw - h.flange * PPM) * 2, (hh - h.flange * PPM) * 2);
    } else { x.strokeStyle = 'rgba(40,40,38,0.7)'; x.lineWidth = 2; x.strokeRect(cx - hw, cy - hh, hw * 2, hh * 2); }
    for (let q = 0; q < (h.flange ? 2 : 6); q++) { x.fillStyle = `rgba(150,146,134,${0.15 + r() * 0.2})`; x.fillRect(cx + (r() - 0.5) * hw * 3.2, cy + (r() - 0.5) * hh * 3, 1 + r() * 3, 1 + r() * 3); }
  }
  const t = tex(c); t.wrapS = THREE.RepeatWrapping; return t;
}

// Normal map fino de reboco pintado (tileável), compartilhado.
let _plaster;
export function plasterNormal() {
  if (_plaster) return _plaster;
  const S = 256, r = rng(77), hgt = fbm(S, S, 16, 4, r), c = mk(S, S), x = c.getContext('2d'), img = x.createImageData(S, S);
  const Hh = (i, j) => hgt[((j + S) % S) * S + ((i + S) % S)];
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const dx = (Hh(i + 1, j) - Hh(i - 1, j)) * 3, dy = (Hh(i, j + 1) - Hh(i, j - 1)) * 3, l = Math.hypot(dx, dy, 1), k = (j * S + i) * 4;
    img.data[k] = (-dx / l * 0.5 + 0.5) * 255; img.data[k + 1] = (dy / l * 0.5 + 0.5) * 255; img.data[k + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  _plaster = tex(c, false); _plaster.wrapS = _plaster.wrapT = THREE.RepeatWrapping; return _plaster;
}

// Caixa 4x2 amarela embutida vista de frente (retrato): flange, cavidade, orelhas com furo, furo central e knockouts.
export function yellowBoxTex() {
  const W = 128, H = 176, c = mk(W, H), x = c.getContext('2d'), r = rng(9);
  x.fillStyle = '#cfae32'; x.fillRect(0, 0, W, H);
  // cavidade levemente mais escura (vista quase rente: sombra no alto)
  const ix = 10, iy = 12, iw = W - 20, ih = H - 24;
  const g = x.createLinearGradient(0, iy, 0, iy + ih); g.addColorStop(0, '#8a7020'); g.addColorStop(0.2, '#bf9f2e'); g.addColorStop(1, '#d2b236');
  x.fillStyle = g; x.fillRect(ix, iy, iw, ih);
  // textura granulada (plástico + pó de reboco)
  const img = x.getImageData(0, 0, W, H), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 34; d[i] += n; d[i + 1] += n * 0.9; d[i + 2] += n * 0.4; }
  x.putImageData(img, 0, 0);
  for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(90,70,12,${0.1 + r() * 0.25})`; x.beginPath(); x.arc(r() * W, r() * H, 1 + r() * 3.5, 0, 7); x.fill(); }
  // nervuras/knockouts discretos
  x.strokeStyle = 'rgba(70,55,10,0.45)'; x.lineWidth = 2;
  for (const py of [iy + 30, iy + ih - 30]) { x.beginPath(); x.arc(W / 2, py, 12, 0, 7); x.stroke(); }
  // furo central
  x.fillStyle = '#231b06'; x.beginPath(); x.arc(W / 2, H / 2, 6, 0, 7); x.fill();
  // orelhas com furo de parafuso
  for (const py of [iy + 2, iy + ih - 12]) { x.fillStyle = 'rgba(200,175,60,0.8)'; x.fillRect(W / 2 - 13, py, 26, 10); x.fillStyle = '#2a2208'; x.beginPath(); x.arc(W / 2, py + 5, 3, 0, 7); x.fill(); }
  // borda irregular (massa de reboco sobre a flange)
  x.fillStyle = 'rgba(205,200,182,0.85)';
  for (let i = 0; i < 70; i++) { const e = r() * 4 | 0, t = r(); const px = e < 2 ? t * W : (e === 2 ? 0 : W), py = e < 2 ? (e ? H : 0) : t * H; x.beginPath(); x.arc(px, py, 1.5 + r() * 4.5, 0, 7); x.fill(); }
  x.strokeStyle = 'rgba(50,40,10,0.5)'; x.lineWidth = 2; x.strokeRect(ix, iy, iw, ih);
  return tex(c);
}

// Interior de caixa/quadro preto aberto (fundo de chapa preta, sombras de profundidade, knockouts).
export function darkBoxTex(seed) {
  const W = 256, H = 160, c = mk(W, H), x = c.getContext('2d'), r = rng(seed);
  x.fillStyle = '#18191b'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(${r() < 0.5 ? 255 : 0},${r() < 0.5 ? 255 : 0},255,${r() * 0.04})`; x.fillRect(r() * W, r() * H, 2, 2); }
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(0,0,0,0.75)'); g.addColorStop(0.2, 'rgba(0,0,0,0)'); g.addColorStop(0.9, 'rgba(255,255,255,0.05)'); g.addColorStop(1, 'rgba(255,255,255,0.12)');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const g2 = x.createLinearGradient(0, 0, W, 0); g2.addColorStop(0, 'rgba(0,0,0,0.5)'); g2.addColorStop(0.1, 'rgba(0,0,0,0)'); g2.addColorStop(0.9, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(255,255,255,0.08)');
  x.fillStyle = g2; x.fillRect(0, 0, W, H);
  // bordas internas da caixa (paredes laterais iluminadas embaixo)
  x.fillStyle = 'rgba(120,120,125,0.25)'; x.fillRect(6, H - 12, W - 12, 6);
  for (let i = 0; i < 4; i++) { x.strokeStyle = 'rgba(90,90,95,0.5)'; x.lineWidth = 1.5; x.beginPath(); x.arc(20 + r() * (W - 40), 14 + r() * 16, 7, 0, 7); x.stroke(); }
  // reboco irregular nas bordas
  x.fillStyle = 'rgba(170,166,150,0.9)';
  for (let i = 0; i < 40; i++) { const e = r() * 4 | 0, t = r(); const px = e < 2 ? t * W : (e === 2 ? 0 : W), py = e < 2 ? (e ? H : 0) : t * H; x.beginPath(); x.arc(px, py, 2 + r() * 5, 0, 7); x.fill(); }
  return tex(c);
}

// Quadro plastificado (2x resolução): cabeçalho azul, ferramentas desenhadas; layout varia por seed.
const POSTERS = [
  { t: 'CHAVES DE FENDA E PHILLIPS', sub: 'Isoladas 1000 V · NR-10', tools: ['sd', 'sd', 'sd', 'sd'] },
  { t: 'FERRAMENTAS MANUAIS', sub: 'Uso correto e conservação', tools: ['pl', 'sd', 'sd', 'ct'] },
  { t: 'TESTE DE AUSÊNCIA DE TENSÃO', sub: 'Desenergização · NR-10 10.5', tools: ['tt', 'sd', 'sd', 'pl'] },
  { t: 'ALICATES ISOLADOS', sub: 'Universal · Corte · Bico', tools: ['pl', 'ct', 'pl'] },
  { t: 'CHAVES ISOLADAS', sub: 'Fenda · Phillips · Teste', tools: ['sd', 'sd', 'tt', 'sd', 'sd'] },
];
export function posterTex(seed, kind) {
  const S = 2, W = 360 * S, H = 504 * S, c = mk(W, H), x = c.getContext('2d'), r = rng(seed), P = POSTERS[kind % POSTERS.length];
  x.scale(S, S); const w = 360, h = 504;
  x.fillStyle = '#2a4fa0'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#f3f5f7'; x.fillRect(10, 10, w - 20, h - 20);
  x.fillStyle = '#2a4fa0'; x.fillRect(10, 10, w - 20, 60);
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = 'bold 19px Arial, Helvetica, sans-serif'; x.fillText(P.t, w / 2, 32, w - 40);
  x.font = '12px Arial, Helvetica, sans-serif'; x.fillText(P.sub, w / 2, 54);
  const n = P.tools.length, top = 92, bot = h - 74, span = w - 90;
  P.tools.forEach((k, i) => {
    const cx = 45 + (n === 1 ? span / 2 : i * span / (n - 1));
    const grad = (c0, c1, c2) => { const g = x.createLinearGradient(cx - 22, 0, cx + 22, 0); g.addColorStop(0, c0); g.addColorStop(0.45, c1); g.addColorStop(1, c2); return g; };
    const green = grad('#124a24', '#1f7a3a', '#0e3d1d');
    if (k === 'sd' || k === 'tt') { // chave de fenda / chave teste
      const hl = 140 + r() * 40, hw = k === 'tt' ? 14 : 20;
      x.fillStyle = k === 'tt' ? grad('#111', '#3a3a3a', '#0a0a0a') : green;
      x.beginPath(); x.moveTo(cx - hw, top); x.lineTo(cx + hw, top); x.lineTo(cx + hw - 3, top + hl); x.lineTo(cx + 8, top + hl + 16); x.lineTo(cx - 8, top + hl + 16); x.lineTo(cx - hw + 3, top + hl); x.closePath(); x.fill();
      x.fillStyle = 'rgba(0,0,0,0.35)'; for (let q = 0; q < 6; q++) x.fillRect(cx - hw + 3, top + 14 + q * 20, hw * 2 - 6, 4);
      x.fillStyle = k === 'tt' ? '#e53935' : '#e7d23a'; x.fillRect(cx - hw + 3, top + hl - 24, hw * 2 - 6, 7);
      x.fillStyle = k === 'tt' ? '#c62828' : '#17602d'; x.fillRect(cx - 5, top + hl + 16, 10, bot - top - hl - 42);
      x.fillStyle = '#9ea4aa'; x.beginPath(); x.moveTo(cx - 4, bot - 26); x.lineTo(cx + 4, bot - 26); x.lineTo(cx + 2, bot - 4); x.lineTo(cx - 2, bot - 4); x.closePath(); x.fill();
    } else { // alicate (pl) ou alicate de corte (ct)
      const jaw = k === 'ct' ? 46 : 70, y0 = top + 10;
      x.fillStyle = '#7d848b'; x.beginPath(); x.moveTo(cx - 6, y0); x.lineTo(cx + 6, y0); x.lineTo(cx + 12, y0 + jaw); x.lineTo(cx - 12, y0 + jaw); x.closePath(); x.fill();
      x.fillStyle = '#5c636a'; x.beginPath(); x.arc(cx, y0 + jaw + 8, 11, 0, 7); x.fill();
      for (const sgn of [-1, 1]) {
        x.fillStyle = green; x.beginPath(); x.moveTo(cx + sgn * 6, y0 + jaw + 16); x.lineTo(cx + sgn * 22, bot - 10); x.lineTo(cx + sgn * 8, bot - 6); x.lineTo(cx + sgn * 1, y0 + jaw + 18); x.closePath(); x.fill();
        x.fillStyle = '#e7d23a'; x.fillRect(cx + sgn * 13 - 5, y0 + jaw + 40, 10, 6);
      }
    }
    x.fillStyle = '#5d6b7c'; x.font = '10px Arial, sans-serif'; x.fillText(['1', '2', '3', '4', '5'][i], cx, bot + 12);
  });
  x.fillStyle = '#8c96a3'; x.fillRect(24, h - 52, 30, 24); x.beginPath(); x.moveTo(20, h - 52); x.lineTo(39, h - 66); x.lineTo(58, h - 52); x.fill();
  x.fillStyle = '#9aa6b5'; for (let q = 0; q < 3; q++) x.fillRect(70, h - 60 + q * 10, 150 + r() * 110, 4);
  return tex(c);
}

// Placa azul de identificação do box.
export function plateTex(text) {
  const W = 1024, H = 256, c = mk(W, H), x = c.getContext('2d');
  x.fillStyle = '#2c5fb4'; x.fillRect(0, 0, W, H);
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,255,255,0.08)'); g.addColorStop(1, 'rgba(0,0,0,0.12)');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(255,255,255,0.18)'; x.lineWidth = 6; x.strokeRect(10, 10, W - 20, H - 20);
  x.fillStyle = '#f2f5fa'; x.font = 'bold 68px Arial, Helvetica, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, W / 2, H / 2 + 2);
  return tex(c);
}

// Gradiente de oclusão no piso (sombra de contato ao longo de paredes): canvas alfa.
export function floorAOTex() {
  const W = 256, H = 256, c = mk(W, H), x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#fff'); g.addColorStop(0.25, '#777'); g.addColorStop(1, '#000');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  return tex(c, false);
}
