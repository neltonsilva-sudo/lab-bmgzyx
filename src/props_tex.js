// DONO: agente "acessórios". Texturas procedurais (canvas) dos acessórios: tecido, listras de pedestal, fibra de vidro,
// etiquetas, pintura eletrostática, borracha. Tudo gerado em código, com cache.
import * as THREE from 'three';

const cache = new Map();
function once(key, fn) { if (!cache.has(key)) cache.set(key, fn()); return cache.get(key); }

function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

function tex(c, { srgb = false, rep = [1, 1], aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]);
  t.anisotropy = aniso; if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true; return t;
}

// Converte um mapa de altura (canvas em tons de cinza) em normal map tangente.
function heightToNormal(src, strength = 2) {
  const w = src.width, h = src.height;
  const d = src.getContext('2d').getImageData(0, 0, w, h).data;
  const out = mkCanvas(w, h), octx = out.getContext('2d'), od = octx.createImageData(w, h);
  const H = (x, y) => d[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
    od.data[i] = (-dx / l * 0.5 + 0.5) * 255; od.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; od.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; od.data[i + 3] = 255;
  }
  octx.putImageData(od, 0, 0); return out;
}

// Ruído de valor suave em canvas (para rugosidade/sujeira).
function noiseCanvas(size, seed, oct = 4, base = 128, amp = 60) {
  const c = mkCanvas(size, size), ctx = c.getContext('2d'), img = ctx.createImageData(size, size), r = rng(seed);
  const layers = [];
  for (let o = 0; o < oct; o++) { const n = 4 << o, g = []; for (let i = 0; i < n * n; i++) g.push(r()); layers.push({ n, g }); }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0, a = 1, tot = 0;
    for (const { n, g } of layers) {
      const fx = x / size * n, fy = y / size * n, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
      const s = (i, j) => g[((j % n) * n + (i % n))];
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const val = (s(ix, iy) * (1 - sx) + s(ix + 1, iy) * sx) * (1 - sy) + (s(ix, iy + 1) * (1 - sx) + s(ix + 1, iy + 1) * sx) * sy;
      v += val * a; tot += a; a *= 0.5;
    }
    const k = base + (v / tot - 0.5) * 2 * amp, i = (y * size + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = k; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0); return c;
}

// Tecido preto de cadeira (trama fina, fiapos, pilling).
export function fabricMaps() {
  return once('fabric', () => {
    const S = 256, hc = mkCanvas(S, S), ctx = hc.getContext('2d'), r = rng(7);
    ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, S, S);
    for (let y = 0; y < S; y += 2) for (let x = 0; x < S; x += 2) {
      const over = ((x >> 1) + (y >> 1)) % 2;
      const v = 110 + over * 70 + (r() - 0.5) * 40;
      ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(x, y, 2, 2);
    }
    for (let i = 0; i < 400; i++) { const v = 180 + r() * 60; ctx.fillStyle = `rgba(${v},${v},${v},0.5)`; ctx.fillRect(r() * S, r() * S, 1 + r() * 2, 1 + r() * 2); }
    const nrm = tex(heightToNormal(hc, 3.5), { rep: [6, 6] });
    const rc = noiseCanvas(128, 11, 4, 225, 25);
    const rough = tex(rc, { rep: [2, 2] });
    // cor: preto com leve variação e brilho de uso no centro
    const cc = noiseCanvas(128, 12, 4, 225, 22);
    const col = tex(cc, { srgb: true, rep: [1, 1] });
    return { nrm, rough, col };
  });
}

// Pedestal: listras helicoidais preto/amarelo com desgaste. u = volta, v = altura.
export function stanchionStripeMap() {
  return once('stripe', () => {
    const W = 256, H = 1024, c = mkCanvas(W, H), ctx = c.getContext('2d'), r = rng(21);
    const img = ctx.createImageData(W, H);
    const turns = 3.3; // listras ao longo da altura
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const u = x / W, v = y / H;
      const s = (v * turns + u) % 1;
      const yellow = s < 0.5;
      const edge = Math.min(Math.abs(s - 0.5), s, 1 - s);
      const i = (y * W + x) * 4;
      let R, G, B;
      if (yellow) { R = 217; G = 169; B = 28; } else { R = 20; G = 20; B = 19; }
      // desgaste: riscos e sujeira
      const n = r();
      if (yellow && n < 0.004) { R *= 0.6; G *= 0.6; B *= 0.6; }
      if (edge < 0.006) { R = R * 0.8 + 20; G = G * 0.8 + 18; B = B * 0.8 + 10; }
      const dirt = (1 - v) * 0.25; // mais sujo embaixo
      R = R * (1 - dirt * 0.6); G = G * (1 - dirt * 0.62); B = B * (1 - dirt * 0.5);
      img.data[i] = R; img.data[i + 1] = G; img.data[i + 2] = B; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    // riscos verticais claros (arranhões)
    for (let k = 0; k < 220; k++) { ctx.strokeStyle = `rgba(200,195,180,${0.06 + r() * 0.18})`; ctx.lineWidth = 0.6; const x = r() * W, y = r() * H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 6, y + 10 + r() * 50); ctx.stroke(); }
    const t = tex(c, { srgb: true }); t.wrapT = THREE.ClampToEdgeWrapping; return t;
  });
}

// Fibra de vidro laranja-marrom (veios longitudinais).
export function fiberMaps() {
  return once('fiber', () => {
    const W = 64, H = 512, c = mkCanvas(W, H), ctx = c.getContext('2d'), r = rng(33);
    ctx.fillStyle = '#a8743a'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 220; i++) {
      const x = r() * W, a = 0.04 + r() * 0.1, dark = r() < 0.55;
      ctx.strokeStyle = dark ? `rgba(90,40,12,${a})` : `rgba(240,170,100,${a})`; ctx.lineWidth = 0.5 + r() * 1.5;
      ctx.beginPath(); ctx.moveTo(x, 0); for (let y = 0; y <= H; y += 32) ctx.lineTo(x + Math.sin(y * 0.02 + i) * 1.5, y); ctx.stroke();
    }
    for (let i = 0; i < 90; i++) { ctx.fillStyle = `rgba(45,30,18,${0.06 + r() * 0.16})`; ctx.beginPath(); ctx.ellipse(r() * W, r() * H, 2 + r() * 10, 3 + r() * 26, 0, 0, 7); ctx.fill(); }
    // sujeira escurecendo a base dos montantes (v baixo = pé da escada)
    { const gr = ctx.createLinearGradient(0, H, 0, H * 0.65); gr.addColorStop(0, 'rgba(35,25,15,0.45)'); gr.addColorStop(1, 'rgba(35,25,15,0)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }
    // respingos de tinta branca (as escadas das fotos são usadas para pintar as baias)
    // manchas e escorridos de tinta branca irregulares (poucos, grandes) + respingos finos
    for (let i = 0; i < 14; i++) {
      const x0 = r() * W, y0 = r() * H; ctx.fillStyle = `rgba(240,238,230,${0.6 + r() * 0.35})`;
      ctx.beginPath(); ctx.moveTo(x0, y0);
      for (let k = 0; k < 7; k++) { const a2 = k / 7 * Math.PI * 2, rr = 3 + r() * 9; ctx.lineTo(x0 + Math.cos(a2) * rr * 0.7, y0 + Math.sin(a2) * rr * 1.8); }
      ctx.closePath(); ctx.fill();
      if (r() < 0.6) ctx.fillRect(x0 - 0.8, y0, 1.6, 10 + r() * 40);
    }
    for (let i = 0; i < 25; i++) { ctx.fillStyle = `rgba(240,238,230,${0.4 + r() * 0.4})`; ctx.beginPath(); ctx.arc(r() * W, r() * H, 0.4 + r() * 1.2, 0, 7); ctx.fill(); }
    const col = tex(c, { srgb: true });
    const hc = mkCanvas(W, H), hx = hc.getContext('2d'); hx.drawImage(c, 0, 0);
    const nrm = tex(heightToNormal(hc, 1.2));
    return { col, nrm };
  });
}

// Etiqueta de escada (fundo branco/amarelo, faixas, texto genérico).
export function ladderLabel() {
  return once('ladderLabel', () => {
    const c = mkCanvas(128, 512), x = c.getContext('2d');
    x.fillStyle = '#f1efe6'; x.fillRect(0, 0, 128, 512);
    x.fillStyle = '#e8b400'; x.fillRect(0, 0, 128, 70);
    x.fillStyle = '#111'; x.font = 'bold 34px Arial'; x.textAlign = 'center'; x.fillText('ATENÇÃO', 64, 48);
    x.fillStyle = '#c21d1d'; x.fillRect(0, 70, 128, 8);
    x.fillStyle = '#333';
    for (let i = 0; i < 26; i++) { const w = 60 + ((i * 37) % 40); x.fillRect(10, 96 + i * 14, w, 5); }
    x.strokeStyle = '#111'; x.lineWidth = 4; x.beginPath(); x.moveTo(64, 470); x.lineTo(34, 500); x.lineTo(94, 500); x.closePath(); x.stroke();
    return tex(c, { srgb: true, rep: [1, 1] });
  });
}

// Rótulo do extintor.
export function extLabel() {
  return once('extLabel', () => {
    const c = mkCanvas(512, 256), x = c.getContext('2d');
    x.fillStyle = '#b3120f'; x.fillRect(0, 0, 512, 256);
    x.fillStyle = '#f4f1e8'; x.fillRect(150, 30, 220, 190);
    x.fillStyle = '#111'; x.font = 'bold 30px Arial'; x.textAlign = 'center';
    x.fillText('EXTINTOR', 260, 70); x.font = 'bold 22px Arial'; x.fillText('PÓ QUÍMICO ABC', 260, 100);
    x.fillStyle = '#b3120f'; x.fillRect(165, 112, 190, 4);
    x.fillStyle = '#333'; for (let i = 0; i < 6; i++) x.fillRect(170, 128 + i * 13, 150 - (i % 3) * 25, 5);
    ['A', 'B', 'C'].forEach((L, i) => { x.fillStyle = ['#1f7a2e', '#1f4fa0', '#1f4fa0'][i]; x.fillRect(180 + i * 55, 196 - 20, 44, 20); x.fillStyle = '#fff'; x.font = 'bold 16px Arial'; x.fillText(L, 202 + i * 55, 192); });
    x.fillStyle = '#fff'; x.fillRect(395, 150, 70, 50); x.fillStyle = '#1b5e20'; x.fillRect(400, 155, 60, 20);
    return tex(c, { srgb: true });
  });
}

// Pintura eletrostática texturizada (casca de laranja) — normal + rugosidade.
export function powderMaps() {
  return once('powder', () => {
    const hc = noiseCanvas(256, 41, 5, 128, 70);
    const nrm = tex(heightToNormal(hc, 1.6), { rep: [3, 3] });
    const rough = tex(noiseCanvas(128, 42, 4, 150, 30), { rep: [1, 1] });
    return { nrm, rough };
  });
}

// Sujeira genérica (multiplicador de cor claro→escuro nas bordas inferiores).
export function grimeMap() {
  return once('grime', () => {
    const c = noiseCanvas(256, 51, 5, 235, 25), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 180, 0, 256); g.addColorStop(0, 'rgba(90,85,75,0)'); g.addColorStop(1, 'rgba(90,85,75,0.45)');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    return tex(c, { srgb: true });
  });
}

// Tampo branco de mesa (melamínico com riscos e marcas).
export function tabletopMaps() {
  return once('tabletop', () => {
    const S = 512, c = mkCanvas(S, S), x = c.getContext('2d'), r = rng(61);
    x.fillStyle = '#eceae4'; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 30; i++) { x.fillStyle = `rgba(120,110,95,${0.01 + r() * 0.025})`; x.beginPath(); x.ellipse(r() * S, r() * S, 5 + r() * 40, 4 + r() * 25, r() * 3, 0, 7); x.fill(); }
    for (let i = 0; i < 90; i++) { x.strokeStyle = `rgba(90,90,90,${0.05 + r() * 0.12})`; x.lineWidth = 0.6; const a = r() * S, b = r() * S; x.beginPath(); x.moveTo(a, b); x.lineTo(a + (r() - 0.5) * 60, b + (r() - 0.5) * 20); x.stroke(); }
    const col = tex(c, { srgb: true });
    const rough = tex(noiseCanvas(128, 62, 4, 110, 35));
    return { col, rough };
  });
}

// Visor do quadro elétrico: fileira de disjuntores vista através do acrílico.
export function panelInsideMap() {
  return once('panelInside', () => {
    const c = mkCanvas(256, 256), x = c.getContext('2d');
    x.fillStyle = '#d9d9d4'; x.fillRect(0, 0, 256, 256);
    for (let row = 0; row < 2; row++) {
      const y0 = 40 + row * 110; x.fillStyle = '#9a9a96'; x.fillRect(10, y0 + 30, 236, 14);
      for (let i = 0; i < 11; i++) {
        x.fillStyle = '#f2f2ee'; x.fillRect(16 + i * 21, y0, 18, 74);
        x.fillStyle = i % 4 === 0 ? '#1a1a1a' : '#2b56a8'; x.fillRect(20 + i * 21, y0 + 26, 10, 22);
        x.fillStyle = '#555'; x.fillRect(19 + i * 21, y0 + 4, 12, 3); x.fillRect(19 + i * 21, y0 + 66, 12, 3);
      }
    }
    return tex(c, { srgb: true });
  });
}

// Adesivo de risco elétrico (triângulo amarelo com raio).
export function shockSticker() {
  return once('shock', () => {
    const c = mkCanvas(128, 128), x = c.getContext('2d');
    x.clearRect(0, 0, 128, 128);
    x.fillStyle = '#111'; x.beginPath(); x.moveTo(64, 6); x.lineTo(124, 118); x.lineTo(4, 118); x.closePath(); x.fill();
    x.fillStyle = '#f2c200'; x.beginPath(); x.moveTo(64, 20); x.lineTo(112, 110); x.lineTo(16, 110); x.closePath(); x.fill();
    x.fillStyle = '#111'; x.beginPath(); x.moveTo(70, 40); x.lineTo(52, 78); x.lineTo(64, 78); x.lineTo(56, 104); x.lineTo(78, 66); x.lineTo(66, 66); x.lineTo(74, 40); x.closePath(); x.fill();
    const t = tex(c, { srgb: true }); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
  });
}

export function noiseTex(seed = 71, base = 150, amp = 40, rep = 1) {
  return once('noise' + seed + '_' + base + '_' + amp + '_' + rep, () => tex(noiseCanvas(128, seed, 4, base, amp), { rep: [rep, rep] }));
}

// Impressão vertical preta no montante da escada (texto genérico).
export function railPrint() {
  return once('railPrint', () => {
    const c = mkCanvas(64, 512), x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, 64, 512);
    x.save(); x.translate(40, 500); x.rotate(-Math.PI / 2); x.fillStyle = '#fff'; x.font = 'bold 34px Arial';
    x.fillText('ESCADA  FIBRA', 0, 0); x.font = '16px Arial'; x.fillText('CARGA MÁX. 120 kg · NBR', 10, 18); x.restore();
    const t = tex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; // alphaMap: texto branco sobre preto
  });
}
