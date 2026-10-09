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

// Borne fêmea tipo banana 4 mm: flange + corpo colorido + furo escuro (cor final = instanceColor × vértice).
export function jackGeo(q) {
  const s = q === 'low' ? 8 : 12;
  return merge([
    cylZ(0.0105, 0.0026, 0.0013, 0xb8b8b8, s),
    cylZ(0.0084, 0.012, 0.0085, 0xffffff, s, 0, 0, 0.0078),
    cylZ(0.0033, 0.0012, 0.0146, 0x101010, 8),
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
export function domeGeo() { const g = new THREE.SphereGeometry(0.0105, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2); g.rotateX(Math.PI / 2); g.translate(0, 0, 0.010); return g; }

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
const build = (fn, part, sx = 1, sy = 1) => {
  const P = [], M = []; fn(P, M);
  const g = merge(part === 'm' ? M : P);
  if (sx !== 1 || sy !== 1) { g.scale(1 / sx, 1 / sy, 1); g.computeBoundingSphere(); }
  return g;
};

// Contator compacto tipo 3RT (foto frontal do KET-1030): base escura atrás, corpo azul-acinzentado em dois níveis
// (blocos de bornes em cima/embaixo mais altos), janela do indicador de posição, plaqueta branca, bloco auxiliar à direita.
// Os terminais (x=-0.019/-0.0065/0.006, y=±0.04, z≈0.09 e aux x=0.025, y=±0.028, z≈0.077) casam com os fios do layout.
export function contactor3rtGeo(part = 'p') {
  return build((P, M) => {
    const BL = 0x8ba3ba, BL2 = 0x9cb1c5, DK = 0x17181b;
    P.push(rbox(0.058, 0.106, 0.03, -0.006, 0, 0.015, 0x2a2b2e, 0.0015, 0.002));          // base/trilho
    P.push(rbox(0.047, 0.1, 0.052, -0.006, 0, 0.04, BL, 0.002, 0.002));                    // corpo
    for (const s of [1, -1]) {
      P.push(rbox(0.046, 0.026, 0.026, -0.006, s * 0.036, 0.077, BL2, 0.0018, 0.0015));    // blocos de bornes (degrau)
      P.push(box(0.044, 0.0012, 0.001, -0.006, s * 0.0235, 0.0655, 0x5d6f80));               // sombra do degrau
      for (let i = 0; i < 3; i++) {
        const x = -0.019 + i * 0.0125;
        P.push(rbox(0.0095, 0.0095, 0.002, x, s * 0.04, 0.0895, DK, 0.0004, 0.0008));        // rebaixo do borne
        P.push(box(0.009, 0.0035, 0.004, x, s * 0.0485, 0.08, DK));                           // entrada do cabo
        P.push(box(0.0006, 0.02, 0.0006, x + 0.00625, s * 0.036, 0.0902, 0x6f8295));          // nervura entre polos
        screwHead(M, x, s * 0.04, 0.0898, 0.0031);
        P.push(box(0.004, 0.0022, 0.0004, x, s * 0.0285, 0.0902, 0xf2f2f0));                  // número do borne
      }
    }
    P.push(rbox(0.041, 0.042, 0.018, -0.006, 0, 0.073, BL2, 0.0016, 0.0015));               // frente central
    P.push(rbox(0.024, 0.009, 0.0024, -0.006, 0.01, 0.0822, DK, 0.0005, 0.001));            // janela do indicador
    P.push(rbox(0.008, 0.005, 0.002, -0.009, 0.01, 0.0828, 0xe8e8e4, 0.0004, 0.0005));      // corrediça (desligado)
    P.push(rbox(0.03, 0.013, 0.0012, -0.006, -0.009, 0.0822, 0xf4f4f1, 0.0003, 0.001));     // plaqueta
    marks(P, -0.006, -0.0055, 0.0829, 0.022, 3, 0x4d5257);
    P.push(box(0.008, 0.0035, 0.0006, -0.019, 0.0018, 0.0823, 0x0f6fb8));                   // logotipo azul
    // bloco auxiliar lateral
    P.push(rbox(0.0155, 0.074, 0.07, 0.0255, 0, 0.035, 0xbfc8d0, 0.0015, 0.0015));
    P.push(rbox(0.0135, 0.04, 0.005, 0.0255, 0.0, 0.0715, 0xcad2d9, 0.0012, 0.0012));
    for (let k = 0; k < 3; k++) P.push(box(0.009, 0.0008, 0.0008, 0.0255, -0.012 - k * 0.0028, 0.0742, 0x8e98a2));
    P.push(rbox(0.011, 0.02, 0.0012, 0.0255, 0.006, 0.0742, 0xf3f3f1, 0.0003, 0.0008));
    marks(P, 0.0255, 0.0125, 0.0749, 0.007, 5, 0x55595d, 0.0009, 0.0028);
    for (const y of [0.028, -0.028]) { P.push(rbox(0.008, 0.008, 0.002, 0.0255, y, 0.0722, DK, 0.0004, 0.0008)); screwHead(M, 0.0255, y, 0.0727, 0.0027); }
  }, part);
}

// Temporizador digital (CTD): moldura preta chanfrada, tela recuada com vidro, faixa e 4 teclas azuis em relevo.
export function ctdGeo(part = 'p') {
  return build((P, M) => {
    P.push(rbox(0.1, 0.1, 0.007, 0, 0, 0.0035, 0x141516, 0.0015, 0.003));
    P.push(rbox(0.092, 0.092, 0.028, 0, 0, 0.019, 0x1c1d20, 0.0025, 0.004));
    P.push(rbox(0.07, 0.05, 0.002, 0, 0.012, 0.0335, 0x0c0d0f, 0.0006, 0.002));             // moldura da tela (rebaixo)
    P.push(rbox(0.062, 0.042, 0.0012, 0, 0.012, 0.0338, 0x262c33, 0.0003, 0.001));          // vidro
    P.push(box(0.06, 0.0008, 0.0004, 0, 0.032, 0.0346, 0x4a535e));                          // reflexo superior
    P.push(rbox(0.076, 0.018, 0.0014, 0, -0.026, 0.0334, 0x1b3f8e, 0.0004, 0.002));         // faixa azul
    for (let i = 0; i < 4; i++) {
      const x = -0.026 + i * 0.0173;
      P.push(rbox(0.012, 0.0095, 0.004, x, -0.026, 0.035, 0x3f74e0, 0.0012, 0.0015));
      P.push(box(0.004, 0.0009, 0.0004, x, -0.026, 0.0372, 0xdfe8ff));
    }
    P.push(cylZ(0.0013, 0.001, 0.0336, 0xd23a2a, 8, 0.03, 0.04));                           // LED
    for (const x of [-0.044, 0.044]) for (const y of [-0.044, 0.044]) screwHead(M, x, y, 0.0072, 0.0022);
  }, part);
}

// Módulo DIN alto Altronic (RAX/RPT/RST/RCA/RYD/TCS): base preta atrás, corpo branco com cantos chanfrados, bornes de
// parafuso em rebaixo em cima/embaixo (3 por lado), frente elevada com etiqueta, LED, potenciômetro de ajuste.
export function tallRelayGeo(dark = false, part = 'p') {
  return build((P, M) => {
    const W = dark ? 0x26272a : 0xe2e2dd, W2 = dark ? 0x2e2f32 : 0xebebe6, DK = 0x18191b;
    P.push(rbox(0.034, 0.124, 0.03, 0.003, 0, 0.015, 0x1e1f21, 0.0012, 0.0015));
    P.push(rbox(0.03, 0.118, 0.048, 0, 0, 0.025, W, 0.0018, 0.0015));
    for (const s of [1, -1]) {
      P.push(box(0.028, 0.0012, 0.0008, 0, s * 0.033, 0.049, dark ? 0x111111 : 0xb9b9b3));  // sombra do degrau
      for (const x of [-0.009, 0, 0.009]) {
        P.push(rbox(0.0074, 0.0074, 0.0018, x, s * 0.047, 0.0492, DK, 0.0003, 0.0007));
        P.push(box(0.0066, 0.003, 0.004, x, s * 0.0565, 0.044, DK));                          // entrada do cabo
        screwHead(M, x, s * 0.047, 0.0494, 0.0025);
      }
      P.push(box(0.022, 0.0016, 0.0004, 0, s * 0.0395, 0.0501, dark ? 0x9a9a9a : 0x5a5d60)); // números dos bornes
    }
    P.push(rbox(0.028, 0.062, 0.024, 0, 0.0, 0.0605, W2, 0.0016, 0.0015));                  // frente elevada
    P.push(rbox(0.023, 0.028, 0.0008, 0, 0.012, 0.0727, dark ? 0xd9dbd9 : 0xf7f7f4, 0.0002, 0.0008)); // etiqueta
    P.push(box(0.014, 0.003, 0.0005, -0.003, 0.0225, 0.0732, 0x1f4fa8));                    // marca azul
    marks(P, 0, 0.0175, 0.0732, 0.018, 5, 0x4b4e52, 0.0008, 0.0024);
    P.push(cylZ(0.0058, 0.001, 0.0727, 0x9fa2a4, 16, 0.003, -0.016), cylZ(0.0044, 0.0028, 0.0738, 0xb9bcbd, 16, 0.003, -0.016, 0.004));                      // potenciômetro
    P.push(box(0.001, 0.0068, 0.0008, 0.003, -0.016, 0.0753, 0x3a3a3a));
    P.push(cylZ(0.0016, 0.0016, 0.0732, 0xd23a2a, 8, -0.008, -0.016));                     // LED
    P.push(box(0.022, 0.006, 0.0005, 0, -0.026, 0.0727, dark ? 0x4a4b4e : 0xd0d0cb));        // faixa inferior
  }, part);
}

// Disjuntor tripolar (Siemens 5SL) / DR tetrapolar. sx/sy = escala aplicada pela instância no layout (compensada aqui
// para que parafusos e alavancas não fiquem ovais). Geometria construída na medida final.
export function breakerNGeo(n = 3, dr = false, part = 'p', sx = 1, sy = 1) {
  return build((P, M) => {
    const W = 0.018 * n * sx, H = 0.12 * sy, p = W / n, WH = 0xdcdbd5, WH2 = 0xe6e5e0, DK = 0x1a1b1d;
    const px = (i) => -W / 2 + p / 2 + i * p;
    P.push(rbox(W - 0.003, H - 0.004, 0.012, 0, 0, 0.006, 0x2f3134, 0.001, 0.0015));       // base / engate DIN
    P.push(rbox(W, H, 0.042, 0, 0, 0.025, WH, 0.0022, 0.002));                               // corpo (z .004–.046)
    P.push(rbox(W - 0.002, 0.066 * sy, 0.026, 0, 0, 0.058, WH2, 0.0022, 0.002));             // pescoço frontal (até .071)
    for (const s of [1, -1]) P.push(box(W - 0.004, 0.0012, 0.0008, 0, s * 0.034 * sy, 0.0458, 0xb7b6b0)); // sombra do degrau
    for (let i = 1; i < n; i++) {                                                            // divisões entre polos
      const x = -W / 2 + i * p;
      if (!dr) P.push(box(0.0008, 0.062 * sy, 0.0008, x, 0, 0.0711, 0xb3b2ac));
      for (const s of [1, -1]) P.push(box(0.0008, 0.024 * sy, 0.0008, x, s * 0.047 * sy, 0.0461, 0xbdbcb6));
    }
    for (let i = 0; i < n; i++) {
      const x = px(i);
      for (const s of [1, -1]) {
        const y = s * 0.047 * sy;
        P.push(rbox(0.0115, 0.0115, 0.002, x, y, 0.0462, DK, 0.0004, 0.0009));              // rebaixo do borne
        screwHead(M, x, y, 0.0466, 0.0037);
        P.push(box(0.012, 0.0045, 0.012, x, s * (H / 2 - 0.0005), 0.03, 0x111214));        // entrada do cabo (topo/base)
        P.push(box(0.0035, 0.0018, 0.0004, x, y - s * 0.0095, 0.0462, 0x5a5c5f));            // nº do borne
      }
    }
    const lever = (x, w, on) => {                                                             // alavanca com volume
      P.push(rbox(w + 0.0035, 0.03, 0.004, x, -0.002, 0.0706, DK, 0.0006, 0.0015));          // rasgo/recesso
      const lv = rbox(w, 0.017, 0.017, x, on ? 0.004 : -0.008, 0.078, 0x161616, 0.0016, 0.0016);
      P.push(tiltX(lv, on ? 0.38 : -0.38, x, on ? 0.004 : -0.008, 0.078));
      P.push(tiltX(box(w * 0.18, 0.004, 0.0006, x, (on ? 0.004 : -0.008) + 0.0055, 0.0866, 0xe8e8e8), on ? 0.38 : -0.38, x, on ? 0.004 : -0.008, 0.078)); // marca I
      for (let k = 0; k < 3; k++) {                                                          // estrias de pega
        const g = box(w * 0.8, 0.0008, 0.0008, x, (on ? 0.004 : -0.008) + 0.004 - k * 0.003, 0.0866, 0x2c2c2c);
        P.push(tiltX(g, on ? 0.38 : -0.38, x, on ? 0.004 : -0.008, 0.078));
      }
    };
    if (!dr) {
      for (let i = 0; i < n; i++) {
        const x = px(i);
        lever(x, Math.min(0.011, p * 0.36), false);
        P.push(rbox(0.009, 0.0055, 0.0012, x, 0.024 * sy, 0.0712, 0x2fa04c, 0.0003, 0.0008)); // janela verde (O)
        P.push(box(0.008, 0.0022, 0.0004, x, -0.026 * sy, 0.0713, 0x36383b));                  // "C16"
        P.push(box(0.005, 0.0012, 0.0004, x, -0.0295 * sy, 0.0713, 0x6a6c6f));
        P.push(box(0.010, 0.0009, 0.0004, x, 0.0305 * sy, 0.0713, 0x6a6c6f));
      }
      P.push(rbox(W - p * 0.9, 0.0045, 0.004, 0, -0.016, 0.0815, 0x151515, 0.0008, 0.001));    // barra de acoplamento
      P.push(box(0.014, 0.003, 0.0004, px(0), 0.03 * sy, 0.0713, 0x009999));                   // marca (petróleo)
    } else {
      const xl = px(n - 1);
      lever(xl, 0.014, false);
      P.push(rbox(0.01, 0.006, 0.0012, xl, 0.025 * sy, 0.0712, 0x2fa04c, 0.0003, 0.0008));
      // botão de teste "T"
      const xt = px(n - 2);
      P.push(cylZ(0.0075, 0.0012, 0.0712, DK, 18, xt, -0.017 * sy));
      P.push(rbox(0.0105, 0.0105, 0.006, xt, -0.017 * sy, 0.0735, 0x9b9ea2, 0.0014, 0.002));
      P.push(box(0.0045, 0.001, 0.0004, xt, -0.0148 * sy, 0.0767, 0x2a2a2a), box(0.001, 0.0045, 0.0004, xt, -0.0175 * sy, 0.0767, 0x2a2a2a));
      // plaqueta de dados (esquerda)
      const xw = (px(0) + px(1)) / 2;
      P.push(rbox(p * 1.8, 0.044 * sy, 0.0008, xw, 0.002, 0.0712, 0xd3d4d0, 0.0002, 0.0012));
      marks(P, xw, 0.017 * sy, 0.0717, p * 1.4, 9, 0x4a4d50, 0.0009, 0.0034 * sy);
      P.push(box(p * 0.8, 0.003, 0.0005, xw - p * 0.4, 0.0215 * sy, 0.0717, 0x009999));
      P.push(box(0.009, 0.0016, 0.0004, xt, 0.014 * sy, 0.0713, 0x3a3c3f), box(0.006, 0.0012, 0.0004, xt, 0.0105 * sy, 0.0713, 0x6a6c6f)); // 30 mA
    }
  }, part, sx, sy);
}

// Botão de comando 22 mm: flange escura com chanfro, anel cromado, capa (instanceColor) com borda arredondada.
export function buttonGeo() {
  return merge([cylZ(0.0145, 0.004, 0.002, 0x232323, 28, 0, 0, 0.0138), cylZ(0.0128, 0.003, 0.0055, 0x2c2c2c, 28, 0, 0, 0.0122),
    cylZ(0.0122, 0.0025, 0.0081, 0xb8b8b8, 28, 0, 0, 0.0115), cylZ(0.0108, 0.004, 0.0108, 0x101010, 24),
    cylZ(0.0104, 0.0075, 0.0145, 0xffffff, 28, 0, 0, 0.0104), cylZ(0.0104, 0.0018, 0.0191, 0xf2f2f2, 28, 0, 0, 0.0094)]);
}
// Aro de sinaleiro (a cúpula é malha emissiva separada): flange chanfrada + anel metálico.
export function bezelGeo() {
  return merge([cylZ(0.0145, 0.004, 0.002, 0x222222, 28, 0, 0, 0.0138), cylZ(0.013, 0.003, 0.0055, 0x2a2a2a, 28, 0, 0, 0.0124),
    cylZ(0.0122, 0.004, 0.0088, 0xa9abad, 28, 0, 0, 0.0114)]);
}
// Chave seletora: flange chanfrada, colar, manopla preta com pega afinada e traço branco indicador.
export function selectorGeo() {
  const grip = rbox(0.0068, 0.026, 0.012, 0, 0, 0.0185, 0x141414, 0.0016, 0.0022);
  return merge([cylZ(0.0145, 0.004, 0.002, 0x232323, 28, 0, 0, 0.0138), cylZ(0.0128, 0.003, 0.0055, 0x2c2c2c, 28, 0, 0, 0.0122),
    cylZ(0.0122, 0.0022, 0.0079, 0xa9abad, 28, 0, 0, 0.0116), cylZ(0.0112, 0.0042, 0.011, 0x1a1a1a, 28, 0, 0, 0.0106), grip,
    box(0.0014, 0.017, 0.0006, 0, 0.003, 0.0248, 0xf2f2f2), box(0.0062, 0.0006, 0.0006, 0, 0.0118, 0.0248, 0x2a2a2a)]);
}
