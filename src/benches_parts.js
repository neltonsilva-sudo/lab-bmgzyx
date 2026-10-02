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

// Botão de comando 22 mm: aro escuro + tampa (instanceColor).
export function buttonGeo() {
  return merge([cylZ(0.0145, 0.005, 0.0025, 0x2a2a2a, 18), cylZ(0.0118, 0.004, 0.0065, 0x9a9a9a, 18), cylZ(0.0105, 0.010, 0.013, 0xffffff, 18, 0, 0, 0.0100)]);
}
// Aro de sinaleiro (a cúpula é malha emissiva separada).
export function bezelGeo() { return merge([cylZ(0.0145, 0.005, 0.0025, 0x252525, 18), cylZ(0.012, 0.006, 0.008, 0x8e8e8e, 18)]); }
export function domeGeo() { const g = new THREE.SphereGeometry(0.0105, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2); g.rotateX(Math.PI / 2); g.translate(0, 0, 0.010); return g; }

// Chave seletora: aro + manopla preta com traço branco.
export function selectorGeo() {
  return merge([cylZ(0.0145, 0.005, 0.0025, 0x2a2a2a, 18), cylZ(0.012, 0.006, 0.008, 0x1a1a1a, 18), box(0.006, 0.024, 0.012, 0, 0, 0.017, 0x151515), box(0.0015, 0.016, 0.001, 0, 0.002, 0.0235, 0xf2f2f2)]);
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

// Contator compacto tipo 3RT (como na foto frontal do KET-1030): corpo azul-acinzentado 0x9fb3c6, base escura atrás à esquerda,
// bloco auxiliar claro à direita, janelas pretas dos contatos e bornes de parafuso em cima e embaixo. Largura ~0,064 (nominal).
export function contactor3rtGeo() {
  const parts = [
    box(0.058, 0.106, 0.03, -0.006, 0, 0.015, 0x2a2b2e),
    box(0.046, 0.098, 0.082, -0.006, 0, 0.041, 0x8aa2bb),
    box(0.044, 0.026, 0.006, -0.006, 0.033, 0.085, 0x9fb3c6),
    box(0.044, 0.024, 0.006, -0.006, -0.034, 0.085, 0x9fb3c6),
    box(0.015, 0.072, 0.074, 0.025, 0, 0.037, 0xc9d0d6),
    box(0.009, 0.022, 0.002, 0.025, -0.004, 0.075, 0xf3f3f1),
  ];
  for (let i = 0; i < 3; i++) {
    const x = -0.019 + i * 0.0125;
    parts.push(box(0.006, 0.016, 0.003, x, -0.002, 0.083, 0x111111));
    for (const y of [0.04, -0.04]) parts.push(box(0.008, 0.008, 0.003, x, y, 0.0885, 0x24272a), cylZ(0.0022, 0.002, 0.0895, 0xa8aaad, 6, x, y));
  }
  for (const y of [0.028, -0.028]) parts.push(box(0.007, 0.007, 0.003, 0.025, y, 0.0755, 0x24272a));
  return merge(parts);
}

// Temporizador digital 48x48 (CTD): caixa preta, tela escura, faixa de 4 teclas azuis.
export function ctdGeo() {
  const parts = [box(0.1, 0.1, 0.006, 0, 0, 0.003, 0x141516), box(0.092, 0.092, 0.03, 0, 0, 0.018, 0x1b1c1e),
    box(0.064, 0.044, 0.002, 0, 0.012, 0.0335, 0x23272c), box(0.074, 0.016, 0.002, 0, -0.026, 0.0335, 0x1d3f8f)];
  for (let i = 0; i < 4; i++) parts.push(cylZ(0.0045, 0.003, 0.035, 0x3f74e0, 10, -0.026 + i * 0.0173, -0.026));
  return merge(parts);
}

// Módulo DIN alto (RAX/RPT/RST/RCA/RYD): frente cinza-clara, base preta atrás, bornes em cima e embaixo, LED.
export function tallRelayGeo(dark = false) {
  const parts = [
    box(0.034, 0.124, 0.03, 0.003, 0, 0.015, 0x1e1f21),
    box(0.03, 0.118, 0.05, 0, 0, 0.025, dark ? 0x232426 : 0xdadcda),
    box(0.028, 0.06, 0.024, 0, 0.002, 0.062, dark ? 0x2b2c2e : 0xe3e4e1),
    box(0.024, 0.04, 0.002, 0, 0.004, 0.0745, dark ? 0xd9dbd9 : 0xf1f1ee),
    cylZ(0.0016, 0.002, 0.0755, 0xd23a2a, 6, -0.008, -0.016),
  ];
  for (const y of [0.048, -0.048]) for (const x of [-0.009, 0, 0.009]) parts.push(box(0.007, 0.007, 0.002, x, y, 0.051, 0x2a2c2f), cylZ(0.002, 0.002, 0.052, 0x9c9ea0, 6, x, y));
  return merge(parts);
}

// Disjuntor tripolar / DR (largura em módulos), alavancas pretas, faixa de identificação.
export function breakerNGeo(n = 3, dr = false) {
  const w = 0.018 * n, parts = [box(w, 0.12, 0.045, 0, 0, 0.0225, 0xe6e6e2), box(w - 0.002, 0.06, 0.022, 0, 0, 0.056, 0xeeeeea)];
  if (!dr) for (let i = 0; i < n; i++) {
    const x = -w / 2 + 0.009 + i * 0.018;
    parts.push(box(0.008, 0.02, 0.012, x, 0.002, 0.072, 0x151515), box(0.012, 0.008, 0.002, x, 0.034, 0.068, i === 1 ? 0x34a853 : 0x9a9a9a));
  } else parts.push(box(0.012, 0.018, 0.012, w / 2 - 0.014, 0.004, 0.072, 0x151515), box(0.012, 0.01, 0.003, w / 2 - 0.03, -0.018, 0.068, 0x1a1a1a), box(0.03, 0.012, 0.002, -0.01, 0.01, 0.068, 0xc9c9c4));
  for (const y of [0.05, -0.05]) for (let i = 0; i < n; i++) parts.push(cylZ(0.0035, 0.002, 0.046, 0x9c9ea0, 8, -w / 2 + 0.009 + i * 0.018, y));
  return merge(parts);
}
