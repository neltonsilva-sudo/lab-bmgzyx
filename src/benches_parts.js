// DONO: agente "bancadas". Geometrias (com cores por vértice) das peças repetidas dos painéis didáticos.
// Todas com origem no plano da face do painel, crescendo para +z (frente).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const C = (hex) => new THREE.Color(hex);
function paint(geo, col) {
  const c = col instanceof THREE.Color ? col : C(col);
  const n = geo.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return geo;
}
export function box(w, h, d, x, y, z, col) { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return paint(g, col); }
export function cylZ(r, h, z, col, seg = 14, x = 0, y = 0, r2) {
  const g = new THREE.CylinderGeometry(r2 ?? r, r, h, seg); g.rotateX(Math.PI / 2); g.translate(x, y, z); return paint(g, col);
}
const merge = (arr) => { const m = mergeGeometries(arr.map((g) => g.index ? g.toNonIndexed() : g)); m.computeBoundingSphere(); return m; };

// Borne fêmea tipo banana 4 mm (fotos d4319/d4320): flange + corpo serrilhado (recartilhado) colorido, borda chanfrada
// e furo; part 'm' = luva metálica de contato visível dentro do furo (InstancedMesh metálica gêmea).
function knurl(g, n, amp) {                         // serrilha: raio alterna a cada vértice radial (eixo y antes de girar)
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z); if (r < 1e-6) continue;
    const a = Math.atan2(z, x), k = Math.round(((a / (Math.PI * 2)) * n * 2 + n * 4)) % 2 ? 1 : 1 - amp;
    p.setX(i, x * k); p.setZ(i, z * k);
  }
  g.computeVertexNormals(); return g;
}
export function jackGeo(q, part = 'p') {
  const s = q === 'low' ? 8 : 12;
  if (part === 'm') return merge([cylZ(0.0037, 0.0008, 0.0161, 0xd6d6d2, s * 2), cylZ(0.0026, 0.0004, 0.0165, 0x77776f, s)]);
  const kn = q === 'low' ? 10 : 18, body = new THREE.CylinderGeometry(0.0079, 0.0084, 0.0115, kn * 2, 1);
  knurl(body, kn, 0.075); body.rotateX(Math.PI / 2); body.translate(0, 0, 0.0083); paint(body, 0xffffff);
  return merge([
    cylZ(0.0105, 0.0026, 0.0013, 0xb8b8b8, s),
    body,
    cylZ(0.0078, 0.0018, 0.0149, 0xf2f2f2, s * 2, 0, 0, 0.0064),       // borda chanfrada (pega o brilho)
    cylZ(0.0047, 0.0006, 0.0158, 0x2a2a2a, s),                           // rebaixo escuro em volta da luva
    cylZ(0.0017, 0.0004, 0.0168, 0x050505, 8),                           // furo
  ]);
}

// Contator tripolar + bloco preto (bobina/supressor) como nas fotos: módulo azul-acinzentado à esquerda, bloco preto à direita.
export function contactorGeo() {
  const parts = [
    box(0.108, 0.1, 0.012, 0, 0, 0.006, 0x8e9296),
    box(0.072, 0.1, 0.084, -0.018, 0, 0.042, 0x9fb0bf),
    box(0.068, 0.036, 0.008, -0.018, 0.024, 0.088, 0xc9d0d6),
    box(0.068, 0.03, 0.006, -0.018, -0.02, 0.087, 0xb4c0cb),
    box(0.016, 0.022, 0.002, -0.03, -0.004, 0.0905, 0xf4f4f2),
    box(0.034, 0.012, 0.004, -0.012, -0.036, 0.087, 0x8a9bb0),
    box(0.036, 0.096, 0.064, 0.036, 0, 0.032, 0x1e1f22),
    box(0.030, 0.078, 0.005, 0.036, -0.004, 0.066, 0x34363a),
  ];
  for (let i = 0; i < 3; i++) {
    const x = -0.045 + i * 0.015;
    parts.push(box(0.009, 0.007, 0.003, x, 0.043, 0.081, 0x25272a), box(0.009, 0.007, 0.003, x, -0.043, 0.081, 0x25272a));
    parts.push(cylZ(0.0025, 0.002, 0.0825, 0xa8aaad, 6, x, 0.043), cylZ(0.0025, 0.002, 0.0825, 0xa8aaad, 6, x, -0.043));
  }
  return merge(parts);
}

// Relé/dispositivo modular em trilho DIN (branco-bege), com degrau frontal, dial e LED.
export function relayGeo(kind = 'relay') {
  const body = kind === 'timer' ? 0xb9bcbf : 0xdedcd4;
  const parts = [
    box(0.036, 0.084, 0.046, 0, 0, 0.023, body),
    box(0.034, 0.044, 0.022, 0, 0, 0.057, kind === 'timer' ? 0xc6c9cc : 0xe7e5de),
    box(0.024, 0.012, 0.002, 0, 0.012, 0.0685, 0xfafafa),
  ];
  if (kind === 'breaker') parts.push(box(0.010, 0.016, 0.012, 0, -0.004, 0.074, 0x1a1a1a));
  else {
    parts.push(cylZ(0.0055, 0.004, 0.070, 0x3a3d42, 10, 0, -0.008));
    parts.push(box(0.001, 0.005, 0.001, 0, -0.005, 0.0725, 0xffffff));
    parts.push(cylZ(0.0018, 0.002, 0.069, 0x33dd55, 6, -0.011, 0.012));
  }
  for (const y of [0.034, -0.034]) for (const x of [-0.009, 0.009]) {
    parts.push(box(0.008, 0.006, 0.002, x, y, 0.0465, 0x2a2c2f), cylZ(0.002, 0.002, 0.0475, 0x9c9ea0, 6, x, y));
  }
  return merge(parts);
}

// Relé de proteção multifunção (2 módulos, display, teclas).
export function protRelayGeo() {
  return merge([
    box(0.072, 0.09, 0.05, 0, 0, 0.025, 0xcfd2d4),
    box(0.068, 0.056, 0.024, 0, 0.004, 0.062, 0xd9dbdc),
    box(0.040, 0.018, 0.002, 0, 0.018, 0.0745, 0x10202c),
    box(0.008, 0.006, 0.003, -0.018, -0.008, 0.075, 0x2f6fc8), box(0.008, 0.006, 0.003, -0.006, -0.008, 0.075, 0x2f6fc8),
    box(0.008, 0.006, 0.003, 0.006, -0.008, 0.075, 0x2f6fc8), box(0.008, 0.006, 0.003, 0.018, -0.008, 0.075, 0xc8302f),
    cylZ(0.0018, 0.002, 0.0745, 0x55ff66, 6, 0.028, 0.02),
  ]);
}

// Disjuntor/modular com alavanca (1 polo; escale x para 3 polos).
export function breakerGeo() { return relayGeo('breaker'); }

// Trilho DIN (perfil chapéu 35 mm), comprimento 1 m em x (escalado por instância).
export function railGeo() {
  return merge([box(1, 0.035, 0.0015, 0, 0, 0.00075, 0xd0d3d6), box(1, 0.005, 0.0075, 0, 0.015, 0.0045, 0xc4c7ca), box(1, 0.005, 0.0075, 0, -0.015, 0.0045, 0xc4c7ca),
    box(1, 0.0012, 0.0015, 0, 0.0005, 0.0018, 0x8a8d90)]);
}
// Lente de sinaleiro com anéis de Fresnel (fotos d4321: ENERGIZADO e SN1): perfil torneado com ondulações concêntricas.
export function domeGeo() {
  const pts = [], R = 0.0112, N = 22;
  for (let i = 0; i <= N; i++) {
    const t = i / N, r = R * t, z = 0.0068 * Math.sqrt(Math.max(0, 1 - t * t * 0.92)) + (t > 0.25 && t < 0.97 ? 0.00028 * Math.cos(t * Math.PI * 14) : 0);
    pts.push(new THREE.Vector2(Math.max(1e-5, r), z));
  }
  pts.push(new THREE.Vector2(R, 0)); pts.reverse();
  const g = new THREE.LatheGeometry(pts, 28); g.rotateX(Math.PI / 2); g.translate(0, 0, 0.0092); g.computeVertexNormals(); return g;
}

// Botão de emergência (cogumelo vermelho) sobre base.
export function emergGeo() {
  return merge([cylZ(0.018, 0.01, 0.005, 0x333333, 18), cylZ(0.009, 0.012, 0.016, 0x333333, 12), cylZ(0.022, 0.012, 0.028, 0xd01818, 22, 0, 0, 0.019)]);
}
// Medidor digital de painel (96x48 / 72x72): caixa preta com moldura; display é plano separado.
export function meterGeo() {
  return merge([box(0.072, 0.072, 0.03, 0, 0, 0.015, 0x1a1b1d), box(0.076, 0.076, 0.003, 0, 0, 0.0015, 0x111111),
    box(0.012, 0.006, 0.002, -0.02, -0.026, 0.031, 0x3a3a3a), box(0.012, 0.006, 0.002, 0.0, -0.026, 0.031, 0x3a3a3a), box(0.012, 0.006, 0.002, 0.02, -0.026, 0.031, 0x3a3a3a)]);
}
export function displayPlane() { const g = new THREE.PlaneGeometry(0.056, 0.03); g.translate(0, 0.008, 0.0306); return g; }

// Parafuso de cabeça abaulada (frame e fixações).
export function screwGeo() { const g = new THREE.SphereGeometry(0.0045, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2); g.rotateX(Math.PI / 2); return paint(g, 0xcfd2d4); }
// Cubo unitário genérico (caixas, blocos) com cor por vértice branca.
export function unitBox() { return box(1, 1, 1, 0, 0, 0.5, 0xffffff); }
// Pino banana macho do cabo de teste (capa colorida + pino metálico), ao longo de -y (pendurado).
export function plugGeo() {
  const a = new THREE.CylinderGeometry(0.0068, 0.0056, 0.046, 8); a.translate(0, -0.02, 0); paint(a, 0xffffff);
  const b = new THREE.CylinderGeometry(0.0055, 0.0055, 0.006, 8); b.translate(0, -0.034, 0); paint(b, 0xdddddd);
  const p = new THREE.CylinderGeometry(0.0019, 0.0019, 0.018, 6); p.translate(0, -0.05, 0); paint(p, 0x7a7266);
  return merge([a, b, p]);
}


// ---------------------------------------------------------------------------------------------------------------
// Peças detalhadas do KET-1030 (rodada "componentes-3d"): caixas com chanfro (ExtrudeGeometry com bevel) para que as
// arestas peguem luz, degraus frontais, rebaixos escuros dos bornes e parafusos metálicos em geometria separada
// (parte 'm' → material metálico; parte 'p' → plástico com cor por vértice). Origem no plano da face, +z para frente.
// ---------------------------------------------------------------------------------------------------------------
const V3 = THREE.Vector3;
// Caixa com cantos arredondados (raio r no plano xy) e chanfro b nas arestas frontais/traseiras; centrada em (x,y,z).
export function rbox(w, h, d, x, y, z, col, b = 0.0012, r = 0.0012) {
  b = Math.max(0.0002, Math.min(b, w / 4, h / 4, d / 3));
  const sw = w - 2 * b, sh = h - 2 * b; r = Math.max(0, Math.min(r, sw / 2.2, sh / 2.2));
  const s = new THREE.Shape(), X0 = -sw / 2, X1 = sw / 2, Y0 = -sh / 2, Y1 = sh / 2;
  if (r > 1e-5) {
    s.moveTo(X0 + r, Y0); s.lineTo(X1 - r, Y0); s.quadraticCurveTo(X1, Y0, X1, Y0 + r); s.lineTo(X1, Y1 - r); s.quadraticCurveTo(X1, Y1, X1 - r, Y1);
    s.lineTo(X0 + r, Y1); s.quadraticCurveTo(X0, Y1, X0, Y1 - r); s.lineTo(X0, Y0 + r); s.quadraticCurveTo(X0, Y0, X0 + r, Y0);
  } else { s.moveTo(X0, Y0); s.lineTo(X1, Y0); s.lineTo(X1, Y1); s.lineTo(X0, Y1); s.lineTo(X0, Y0); }
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.0001, d - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 2 });
  g.computeBoundingBox(); const c = g.boundingBox.getCenter(new V3()); g.translate(x - c.x, y - c.y, z - c.z);
  return paint(g, col);
}
// gira uma peça em torno do próprio centro (x,y,z) no eixo X (alavancas inclinadas)
function tiltX(g, a, x, y, z) { g.translate(-x, -y, -z); g.rotateX(a); g.translate(x, y, z); return g; }
// parafuso de borne: cabeça cilíndrica com fenda em cruz (metal) — cor clara; fenda escura
function screwHead(M, x, y, z, r = 0.0032) {
  M.push(cylZ(r, 0.0018, z, 0xd9dadb, 14, x, y, r * 0.9));
  M.push(box(r * 1.3, r * 0.2, 0.0008, x, y, z + 0.0007, 0x5c5d5e), box(r * 0.2, r * 1.3, 0.0008, x, y, z + 0.0007, 0x5c5d5e));
}
// marcas de impressão (linhas de "texto") em cinza escuro
function marks(P, x, y, z, w, rows, col = 0x55575a, lh = 0.0011, gap = 0.0026) {
  for (let i = 0; i < rows; i++) P.push(box(w * (i % 2 ? 0.7 : 1), lh, 0.0004, x - (i % 2 ? w * 0.15 : 0), y - i * gap, z, col));
}
// "luz de estúdio" assada nas cores por vértice: chanfros/laterais voltados para baixo-direita escurecem, para
// cima-esquerda clareiam; vértices perto da face (fundo da peça) recebem oclusão. Dá volume mesmo na vista frontal.
export function bakeShade(g, k = 1) {
  const n = g.attributes.normal, p = g.attributes.position, c = g.attributes.color; if (!n || !c) return g;
  g.computeBoundingBox(); const bb = g.boundingBox, zr = Math.max(1e-4, bb.max.z - bb.min.z), yr = Math.max(1e-4, bb.max.y - bb.min.y);
  for (let i = 0; i < n.count; i++) {
    const nx = n.getX(i), ny = n.getY(i), nz = n.getZ(i);
    let f = 0.8 + 0.2 * Math.max(0, nz) + 0.2 * ny - 0.12 * nx;                 // direcional (cima-esquerda)
    if (nz < 0.95) f -= 0.08 * (1 - Math.max(0, nz));                           // laterais/chanfros um pouco mais escuros
    f *= 0.72 + 0.28 * Math.min(1, Math.max(0, (p.getZ(i) - bb.min.z) / zr) * 1.6); // oclusão no fundo
    f *= 1 + 0.07 * ((p.getY(i) - bb.min.y) / yr - 0.5);                          // gradiente vertical suave
    f = 1 + (f - 1) * k;
    c.setXYZ(i, Math.min(1, c.getX(i) * f), Math.min(1, c.getY(i) * f), Math.min(1, c.getZ(i) * f));
  }
  c.needsUpdate = true; return g;
}
const build = (fn, part, sx = 1, sy = 1) => {
  const P = [], M = []; fn(P, M);
  const g = merge(part === 'm' ? M : P);
  if (part !== 'm') bakeShade(g);
  if (sx !== 1 || sy !== 1) { g.scale(1 / sx, 1 / sy, 1); g.computeBoundingSphere(); }
  return g;
};

// Contator compacto tipo 3RT (foto frontal do KET-1030): base escura atrás, corpo azul-acinzentado em dois níveis
// (blocos de bornes em cima/embaixo mais altos), janela do indicador de posição, plaqueta branca, bloco auxiliar à direita.
// Os terminais (x=-0.019/-0.0065/0.006, y=±0.04, z≈0.09 e aux x=0.025, y=±0.028, z≈0.077) casam com os fios do layout.
// cilindro ao longo de x (tambor das alavancas)
function cylX(r, len, x, y, z, col, seg = 16) { const g = new THREE.CylinderGeometry(r, r, len, seg); g.rotateZ(Math.PI / 2); g.translate(x, y, z); return paint(g, col); }

// Decalques (impressões) do atlas TX.b1Atlas: items = [nome, x, y, z] em coordenadas FINAIS (mundo) da peça; a geometria é
// reduzida por 1/sx,1/sy para compensar a escala da instância (texto sem distorção).
export function decalGeo(R, items, sx = 1, sy = 1) {
  const gs = items.map(([n, x, y, z]) => {
    const r = R[n], g = new THREE.PlaneGeometry(r.w, r.h), uv = g.attributes.uv, [u0, v0, u1, v1] = r.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
    g.translate(x, y, z); return g;
  });
  const m = mergeGeometries(gs); if (sx !== 1 || sy !== 1) m.scale(1 / sx, 1 / sy, 1); m.computeBoundingSphere(); return m;
}

// Contator compacto tipo 3RT (foto d4319): corpo azul-claro em dois níveis, 3 janelas escuras com corrediças cinza
// (indicadores de posição), bloco auxiliar lateral plano com etiqueta branca. Sem base preta atrás (removida a pedido).
// Os terminais (x=-0.019/-0.0065/0.006, y=±0.04, z≈0.09 e aux x=0.025, y=±0.028, z≈0.077) casam com os fios do layout.
export function contactor3rtGeo(part = 'p') {
  return build((P, M) => {
    const BL = 0x8fb0d2, BL2 = 0xa2c0de, DK = 0x17181b, EDGE = 0x6f88a3;
    P.push(rbox(0.049, 0.101, 0.056, -0.006, 0, 0.034, BL, 0.0042, 0.003));                // corpo (chanfro largo)
    for (const s of [1, -1]) P.push(box(0.0012, 0.094, 0.05, -0.006 + s * 0.0247, 0, 0.036, EDGE)); // vinco lateral
    for (const s of [1, -1]) {
      P.push(rbox(0.046, 0.026, 0.026, -0.006, s * 0.036, 0.077, BL2, 0.0032, 0.002));     // blocos de bornes (degrau)
      P.push(box(0.044, 0.0012, 0.001, -0.006, s * 0.0235, 0.0655, 0x5d7590));               // sombra do degrau
      for (let i = 0; i < 3; i++) {
        const x = -0.019 + i * 0.0125;
        P.push(rbox(0.0095, 0.0095, 0.002, x, s * 0.04, 0.0895, DK, 0.0004, 0.0008));        // rebaixo do borne
        P.push(box(0.009, 0.0035, 0.004, x, s * 0.0485, 0.08, DK));                           // entrada do cabo
        P.push(box(0.0006, 0.02, 0.0006, x + 0.00625, s * 0.036, 0.0902, 0x7e97b2));          // nervura entre polos
        screwHead(M, x, s * 0.04, 0.0898, 0.0031);
      }
    }
    P.push(rbox(0.043, 0.046, 0.006, -0.006, 0, 0.0655, 0x6f87a2, 0.001, 0.002));           // rebaixo em volta da frente
    P.push(rbox(0.041, 0.042, 0.018, -0.006, 0, 0.073, BL2, 0.003, 0.002));                 // frente central
    for (let i = 0; i < 3; i++) {                                                           // janelas + corrediças
      const x = -0.019 + i * 0.0125;
      P.push(rbox(0.0098, 0.0165, 0.0016, x, -0.0012, 0.0822, 0x26282b, 0.0004, 0.0009));
      P.push(rbox(0.0064, 0.0088, 0.0042, x, 0.0011, 0.0834, 0x5a5e64, 0.0009, 0.0009));
      P.push(box(0.0042, 0.0007, 0.0004, x, -0.0021, 0.0857, 0x2c2e31), box(0.0042, 0.0007, 0.0004, x, 0.0042, 0.0857, 0x7a7e84));
    }
    // bloco auxiliar lateral (frente plana com etiqueta)
    P.push(rbox(0.0155, 0.074, 0.066, 0.0255, 0, 0.039, 0x9fbcd9, 0.0028, 0.002));
    P.push(box(0.0008, 0.07, 0.06, 0.0178, 0, 0.038, 0x5f7894));                           // junta com o contator
    for (const y of [0.028, -0.028]) { P.push(rbox(0.0085, 0.0085, 0.002, 0.0255, y, 0.0722, DK, 0.0004, 0.004)); screwHead(M, 0.0255, y, 0.0727, 0.0027); }
  }, part);
}

// Temporizador digital CTD (foto d4320): moldura preta chanfrada, tela recuada com vidro, 4 teclas redondas azuis.
export function ctdGeo(part = 'p') {
  return build((P, M) => {
    P.push(rbox(0.1, 0.1, 0.007, 0, 0, 0.0035, 0x121314, 0.0015, 0.003));
    P.push(rbox(0.094, 0.094, 0.004, 0, 0, 0.009, 0x1a1b1d, 0.0015, 0.0035));                 // aba da moldura
    P.push(rbox(0.092, 0.092, 0.026, 0, 0, 0.020, 0x18191b, 0.0022, 0.004));
    P.push(rbox(0.066, 0.05, 0.002, 0, 0.0115, 0.0335, 0x08090a, 0.0005, 0.0015));            // moldura da tela (rebaixo)
    P.push(rbox(0.060, 0.044, 0.0012, 0, 0.0115, 0.0338, 0x33373c, 0.0003, 0.001));           // LCD
    P.push(box(0.058, 0.0007, 0.0004, 0, 0.0328, 0.0346, 0x4a535e));                          // reflexo superior
    for (const x of [-0.0315, -0.0105, 0.0105, 0.0315]) {
      P.push(cylZ(0.0058, 0.0012, 0.0337, 0x1a3c9c, 24, x, -0.0311));                         // assento
      P.push(cylZ(0.0054, 0.0018, 0.0350, 0x3a6fe0, 24, x, -0.0311, 0.0049));                 // tecla
    }
    for (const x of [-0.044, 0.044]) for (const y of [-0.044, 0.044]) screwHead(M, x, y, 0.0072, 0.0022);
  }, part);
}
export function ctdDecals(R) {
  return decalGeo(R, [['ctdFace', 0, 0, 0.03305], ...[-0.0315, -0.0105, 0.0105, 0.0315].map((x, i) => ['ctdI' + i, x, -0.0311, 0.0360])]);
}
export function contactorDecals(R) {
  return decalGeo(R, [['kFront', -0.006, 0, 0.0821], ['kTop', -0.006, 0.036, 0.0901], ['kBot', -0.006, -0.036, 0.0901], ['kAux', 0.0255, 0, 0.0721]]);
}

// Módulo DIN alto Altronic (RAX/RPT/RST/RCA/RYD) / WEG RTW-RE (TCS, corpo preto e frente clara): corpo com cantos
// chanfrados, bornes de parafuso em rebaixo em cima/embaixo (3 por lado), frente elevada (impressões no atlas),
// LED em cúpula e potenciômetro de ajuste só nos modelos que têm (pot).
export function tallRelayGeo(dark = false, part = 'p', pot = true) {
  return build((P, M) => {
    const W = dark ? 0x232427 : 0xe4e4df, W2 = dark ? 0xe3e3df : 0xedede8, DK = 0x18191b;
    P.push(rbox(0.031, 0.118, 0.048, 0, 0, 0.025, W, 0.0035, 0.0022));
    for (const s of [1, -1]) P.push(box(0.0009, 0.11, 0.04, s * 0.0152, 0, 0.026, dark ? 0x0e0e0f : 0xa9a9a3)); // junta das meias-carcaças
    for (const s of [1, -1]) {
      P.push(box(0.028, 0.0012, 0.0008, 0, s * 0.033, 0.049, dark ? 0x111111 : 0xb9b9b3));  // sombra do degrau
      for (const x of [-0.009, 0, 0.009]) {
        P.push(rbox(0.0074, 0.0074, 0.0018, x, s * 0.047, 0.0492, DK, 0.0003, 0.0007));
        P.push(box(0.0066, 0.003, 0.004, x, s * 0.0565, 0.044, DK));                          // entrada do cabo
        screwHead(M, x, s * 0.047, 0.0494, 0.0025);
      }
    }
    P.push(rbox(0.0285, 0.065, 0.004, 0, 0.0, 0.0495, dark ? 0x101011 : 0xb2b2ac, 0.0008, 0.0015)); // sombra do degrau frontal
    P.push(rbox(0.028, 0.062, 0.024, 0, 0.0, 0.0605, W2, 0.003, 0.002));                    // frente elevada
    if (pot) {
      P.push(cylZ(0.0052, 0.001, 0.0729, 0x9fa2a4, 18, 0.003, -0.016), cylZ(0.0042, 0.003, 0.0742, 0xd4d6d6, 18, 0.003, -0.016, 0.0038));
      P.push(box(0.0009, 0.0066, 0.0008, 0.003, -0.016, 0.0759, 0x3a3a3a));
    }
    P.push(cylZ(0.0017, 0.0012, 0.0729, 0x5a0d0a, 10, -0.008, -0.016));                    // LED (aro)
    const led = new THREE.SphereGeometry(0.0013, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2); led.rotateX(Math.PI / 2); led.translate(-0.008, -0.016, 0.0733); P.push(paint(led, 0xd42a20));
  }, part);
}
export function relayDecals(R, v, sx, sy) {
  return decalGeo(R, [['rf_' + v, 0, 0, 0.07265], ['rbt_' + v, 0, 0.03825 * sy, 0.0502], ['rbb_' + v, 0, -0.03825 * sy, 0.0502]], sx, sy);
}

// Disjuntores Siemens 5SX (3 módulos unipolares lado a lado, foto d4318) / DR 5SM1 tetrapolar. sx/sy = escala aplicada
// pela instância no layout (compensada aqui). Frente com janela REBAIXADA (moldura + fundo) onde fica a alavanca preta
// sobre o tambor branco, etiqueta holográfica azul acima; DR com parafusos aparentes, botão de teste quadrado e
// alavanca na janela da direita. As impressões vêm do atlas (breakerDecals).
export function breakerNGeo(n = 3, dr = false, part = 'p', sx = 1, sy = 1) {
  return build((P, M) => {
    const W = 0.018 * n * sx, H = 0.12 * sy, p = W / n, WH = 0xe2e1db, WH2 = 0xebe9e3, DK = 0x1a1b1d, NH = 0.033 * sy, yT = 0.047 * sy;
    const px = (i) => -W / 2 + p / 2 + i * p;
    P.push(rbox(W - 0.003, H - 0.004, 0.012, 0, 0, 0.006, 0x2f3134, 0.001, 0.0015));       // engate DIN
    // alavanca (desligada: lábio inferior saliente) sobre tambor branco
    const lever = (x, ww, yc, big) => {
      P.push(cylX(big ? 0.0105 : 0.0085, ww * 0.9, x, yc, 0.0595, 0xf0efea, 20));
      P.push(rbox(ww * 0.62, big ? 0.019 : 0.016, 0.010, x, yc + 0.002, 0.0695, 0x19191b, 0.0022, 0.002));
      P.push(cylZ(0.0018, 0.0004, 0.0747, 0x2c2c2e, 14, x, yc + 0.0045)); P.push(cylZ(0.0012, 0.0004, 0.0749, 0x141414, 12, x, yc + 0.0045));
      const ly = yc - (big ? 0.0135 : 0.0095);
      P.push(tiltX(rbox(ww * 0.72, big ? 0.0085 : 0.0068, 0.0085, x, ly, 0.0735, 0x121213, 0.0012, 0.001), -0.32, x, ly, 0.0735));
      for (let k = 0; k < 2; k++) P.push(tiltX(box(ww * 0.6, 0.0005, 0.0004, x, ly - 0.0012 + k * 0.0022, 0.0779, 0x2a2a2c), -0.32, x, ly, 0.0735));
    };
    if (!dr) {
      for (let i = 0; i < n; i++) {
        const x = px(i), pw = p - 0.0008, ww = 0.55 * p, wT = 0.030 * sy, wB = -0.010 * sy, wp = (pw - ww) / 2;
        P.push(rbox(pw, H, 0.042, x, 0, 0.025, WH, 0.0018, 0.0012));                          // corpo do polo (módulo separado)
        // borne superior: furo redondo com parafuso no fundo + fenda
        P.push(cylZ(0.0054, 0.0008, 0.0462, 0x403e3a, 22, x, yT), cylZ(0.0046, 0.0006, 0.0465, 0x262522, 20, x, yT));
        M.push(cylZ(0.0033, 0.0012, 0.0461, 0x3a3936, 14, x, yT - 0.0006), box(0.0046, 0.0008, 0.0006, x, yT - 0.0006, 0.0467, 0x151515));
        P.push(box(p * 0.72, 0.0005, 0.0004, x, yT - 0.0078, 0.0462, 0xa5a49e));
        P.push(box(0.0005, 0.0045, 0.0004, x, yT - 0.0055, 0.0462, 0xa5a49e));
        // borne inferior: abertura em "U"
        P.push(rbox(p * 0.46, 0.0125, 0.0014, x, -H / 2 + 0.0062, 0.0459, 0x9c9b95, 0.0003, 0.0012));
        P.push(rbox(p * 0.30, 0.0085, 0.0014, x, -H / 2 + 0.0042, 0.0462, 0x5c5b56, 0.0003, 0.001));
        P.push(box(p * 0.62, 0.0006, 0.0004, x, -H / 2 + 0.0135, 0.0462, 0xa5a49e));
        // frente (pescoço) com janela rebaixada
        P.push(rbox(pw, 2 * NH, 0.019, x, 0, 0.0545, WH2, 0.0014, 0.0012));                  // fundo (até z .064)
        P.push(rbox(ww, wT - wB, 0.0004, x, (wT + wB) / 2, 0.0641, 0xd9d8d1, 0.0001, 0.0015));
        P.push(box(ww, 0.0028, 0.0004, x, wT - 0.0014, 0.0643, 0xb9b8b1));                    // sombra sob a moldura
        for (const s of [-1, 1]) P.push(rbox(wp, 2 * NH, 0.0075, x + s * (ww / 2 + wp / 2), 0, 0.0672, WH2, 0.0012, 0.0008));
        P.push(rbox(ww + 0.0006, NH - wT, 0.0075, x, (NH + wT) / 2, 0.0672, WH2, 0.0008, 0.0006));
        P.push(rbox(ww + 0.0006, wB + NH, 0.0075, x, (wB - NH) / 2, 0.0672, WH2, 0.0012, 0.0008));
        lever(x, ww, 0.0105 * sy, false);
        if (i > 0) P.push(box(0.0006, H - 0.003, 0.034, x - p / 2, 0, 0.026, 0x55544f));      // fresta entre módulos
      }
    } else {
      P.push(rbox(W, H, 0.042, 0, 0, 0.025, WH, 0.0022, 0.002));
      for (let i = 0; i < n; i++) {
        const x = px(i);
        P.push(cylZ(0.0058, 0.0008, 0.0462, 0x77766f, 24, x, yT), cylZ(0.0050, 0.0006, 0.0465, 0x3c3b37, 22, x, yT));
        M.push(cylZ(0.0045, 0.0014, 0.0466, 0xb4b3ae, 18, x, yT, 0.0042));
        M.push(box(0.0062, 0.0011, 0.0006, x, yT, 0.0474, 0x4e4e4c), box(0.0011, 0.0062, 0.0006, x, yT, 0.0474, 0x4e4e4c));
        P.push(cylZ(0.0057, 0.0008, 0.0462, 0x8a8983, 24, x, -yT), cylZ(0.0050, 0.0006, 0.0465, 0x4a4843, 22, x, -yT));
        M.push(cylZ(0.0038, 0.001, 0.0464, 0x6f6e68, 14, x, -yT), box(0.005, 0.0009, 0.0005, x, -yT, 0.0470, 0x2a2a2a));
      }
      P.push(cylZ(0.0026, 0.0008, 0.0462, 0x8a8984, 16, (px(1) + px(2)) / 2, 0.0402 * sy)); M.push(cylZ(0.0016, 0.0008, 0.0466, 0xa9a8a4, 12, (px(1) + px(2)) / 2, 0.0402 * sy));
      P.push(cylZ(0.0012, 0.0006, 0.0462, 0x262626, 10, 0.0318, 0.0389 * sy));
      P.push(cylZ(0.0024, 0.0008, 0.0462, 0x8a8984, 16, -0.0042, -0.0405 * sy), cylZ(0.0016, 0.0006, 0.0465, 0xdcdbd6, 12, -0.0042, -0.0405 * sy));
      // frente: bloco impresso à esquerda + janela da alavanca à direita
      const xL = 0.0315, xR = W / 2 - 0.0015, ww = xR - xL - 0.0005, xw = (xL + xR) / 2 - 0.0002, wT = 0.0258 * sy, wB = -0.031 * sy;
      P.push(rbox(W - 0.002, 2 * NH, 0.019, 0, 0, 0.0545, WH2, 0.0016, 0.0012));
      P.push(rbox(ww, wT - wB, 0.0004, xw, (wT + wB) / 2, 0.0641, 0xd6d5ce, 0.0001, 0.0015));
      P.push(box(ww, 0.003, 0.0004, xw, wT - 0.0015, 0.0643, 0xb5b4ad));
      P.push(rbox(xL - (-W / 2 + 0.001), 2 * NH, 0.0075, (xL + (-W / 2 + 0.001)) / 2, 0, 0.0672, WH2, 0.0012, 0.0012));
      P.push(rbox(W / 2 - 0.001 - xR + 0.0004, 2 * NH, 0.0075, (xR + W / 2 - 0.001) / 2, 0, 0.0672, WH2, 0.0006, 0.0006));
      P.push(rbox(ww + 0.001, NH - wT, 0.0075, xw, (NH + wT) / 2, 0.0672, WH2, 0.0008, 0.0006));
      P.push(rbox(ww + 0.001, wB + NH, 0.0075, xw, (wB - NH) / 2, 0.0672, WH2, 0.0006, 0.0005));
      lever(xw, ww, -0.002 * sy, true);
      // botão de teste quadrado "T"
      P.push(rbox(0.0168, 0.0162, 0.0016, 0.0182, -0.0247 * sy, 0.0712, 0x3a3a3a, 0.0003, 0.001));
      P.push(rbox(0.0142, 0.0136, 0.0042, 0.0182, -0.0247 * sy, 0.0735, 0x151515, 0.0012, 0.0012));
      P.push(box(0.0052, 0.0006, 0.0004, 0.0182, -0.0232 * sy, 0.0757, 0x2e2e2e), box(0.0006, 0.0048, 0.0004, 0.0182, -0.0252 * sy, 0.0757, 0x2e2e2e));
    }
  }, part, sx, sy);
}
export function breakerDecals(R, n, dr, sx, sy) {
  const W = 0.018 * n * sx, p = W / n, it = [];
  if (!dr) for (let i = 0; i < n; i++) { const x = -W / 2 + p / 2 + i * p; it.push(['brkHolo', x, 0.039 * sy, 0.04625], ['brkNeck', x, 0, 0.0712], ['brkWin', x, 0.0265 * sy, 0.06445]); }
  else it.push(['drTop', 0, 0.033 * sy + 0.012, 0.04615], ['drNeck', 0, 0, 0.0712]);
  return decalGeo(R, it, sx, sy);
}

// Botão de comando 22 mm faceado (foto d4321): flange e aro pretos finos, capa colorida (instanceColor) grande e plana.
export function buttonGeo() {
  return merge([cylZ(0.0145, 0.004, 0.002, 0x1c1c1c, 32, 0, 0, 0.0139), cylZ(0.0138, 0.0042, 0.0061, 0x232323, 32, 0, 0, 0.0131),
    cylZ(0.0123, 0.0058, 0.0095, 0xffffff, 32, 0, 0, 0.0119), cylZ(0.0118, 0.0012, 0.0129, 0xf6f6f6, 32, 0, 0, 0.0108)]);
}
// Aro de sinaleiro (a lente é malha separada): flange preta chanfrada + aro escuro.
export function bezelGeo() {
  return merge([cylZ(0.0145, 0.004, 0.002, 0x1e1e1e, 28, 0, 0, 0.0138), cylZ(0.0132, 0.0045, 0.0062, 0x262626, 28, 0, 0, 0.0124)]);
}
// Comutador com chave (foto d4318): corpo preto redondo, miolo cromado e chave com argola (part 'm' = metal).
export function keySwitchGeo(part = 'p') {
  if (part === 'm') {
    const ring = new THREE.TorusGeometry(0.0062, 0.0008, 6, 20); ring.translate(-0.002, -0.0145, 0.019); paint(ring, 0xbdbdb8);
    return merge([cylZ(0.0072, 0.003, 0.0185, 0xd8d8d4, 24, 0, 0, 0.0068), cylZ(0.0058, 0.0006, 0.0203, 0x8a8a86, 20),
      box(0.0016, 0.0012, 0.004, 0, 0, 0.0215, 0x9a9a95), rbox(0.0105, 0.0088, 0.0022, 0, -0.0062, 0.0238, 0xc7b071, 0.0005, 0.003), ring]);
  }
  return merge([cylZ(0.0165, 0.004, 0.002, 0x1a1a1a, 32, 0, 0, 0.0158), cylZ(0.0148, 0.012, 0.010, 0x202020, 32, 0, 0, 0.0136)]);
}
// Chave seletora: flange chanfrada, colar, manopla preta com pega afinada e traço branco indicador.
export function selectorGeo() {
  const grip = rbox(0.0068, 0.026, 0.012, 0, 0, 0.0185, 0x141414, 0.0016, 0.0022);
  return merge([cylZ(0.0145, 0.004, 0.002, 0x232323, 28, 0, 0, 0.0138), cylZ(0.0128, 0.003, 0.0055, 0x2c2c2c, 28, 0, 0, 0.0122),
    cylZ(0.0122, 0.0022, 0.0079, 0xa9abad, 28, 0, 0, 0.0116), cylZ(0.0112, 0.0042, 0.011, 0x1a1a1a, 28, 0, 0, 0.0106), grip,
    box(0.0014, 0.017, 0.0006, 0, 0.003, 0.0248, 0xf2f2f2), box(0.0062, 0.0006, 0.0006, 0, 0.0118, 0.0248, 0x2a2a2a)]);
}
