// DONO: agente "bancadas". Layout de cada painel didático, reproduzido a partir de refs/foto1_full.jpg (recortes).
// Coordenadas da face em metros: x ∈ [-0.865, 0.865] (esq→dir para quem olha o painel), y ∈ [-0.465, 0.465].
// A API "A" pinta a serigrafia no canvas e instancia as peças 3D nos mesmos pontos (ver benches.js).
import { paintYellowBg, paintWhiteBg, paintB1Bg, rng } from './benches_tex.js';

export const TITLES = {
  b1: 'KET-1030: Proteção', b2: 'KET 1070: Industrial', b3: 'KET-1050: Proteção', b4: 'KET-1050: Proteção', b5: 'KET-1020: Comandos Elétricos',
};

// ---------------- b1 · amarela "KET-1030: Proteção" ----------------
// Reproduzido componente a componente da foto frontal refs/painel_4201.jpg (1012x1800): face em x 45–975, y 428–1008 px.
// X()/Y() convertem pixels da foto em coordenadas do layout; tamanhos de peças em unidades nominais (~0,00157 por px).
const X = (p) => (p - 510) * 0.0018602, Y = (p) => (718 - p) * 0.0016034;
function b1(A) {
  const P = A.P, g = P.g;
  paintB1Bg(P, X, Y);
  const L = (t, px, py, s = 0.0135, o = {}) => P.text(t, X(px), Y(py), s, { weight: 700, color: '#222', ...o });
  const J = (px, py, c = 'K') => A.jack(X(px), Y(py), c);
  const row = (xs, py, cols, labs, ly) => xs.forEach((x, i) => { J(x, py, cols[i]); if (labs && labs[i]) L(labs[i], x, ly ?? py - 10, 0.0125); });
  // título sobre etiqueta clara
  g.save(); g.fillStyle = 'rgba(255,255,248,0.55)'; g.fillRect(P.X(X(116)), P.Y(Y(440)), P.S(X(360) - X(116)), P.S(Y(440) - Y(469))); g.restore();
  P.text('KET-1030: Proteção', X(123), Y(455), 0.046, { align: 'left', weight: 600, color: '#242424', w: X(353) - X(123), font: '"DIN Condensed","Arial Narrow",Arial,sans-serif' });
  // fitas crepe (marcas de uso)
  for (const [x, y, w, h, a] of []) { // removidas a pedido
    g.save(); g.translate(P.X(X(x)), P.Y(Y(y))); g.rotate(a); g.fillStyle = 'rgba(214,196,160,0.85)'; g.fillRect(-P.S(w * 0.00186) / 2, -P.S(h * 0.0016) / 2, P.S(w * 0.00186), P.S(h * 0.0016)); g.restore();
  }
  // coluna de comando
  L('ENERGIZADO', 82, 480, 0.0145); A.lamp(X(84), Y(502), 'R', null, 0.45, true);
  L('LIGA', 85, 533); A.btn(X(88), Y(559), 'G', null, 1.35); L('CH1', 64, 558, 0.011); J(114, 550); J(115, 568);
  L('DESL', 89, 589); A.btn(X(91), Y(611), 'R', null, 1.35); L('CH2', 66, 610, 0.011); J(117, 601); J(119, 619);
  L('SN1', 64, 655, 0.011); L('(220Vca)', 64, 663, 0.010); A.lamp(X(95), Y(662), 'Y', null, 1.35, false); J(121, 653); J(123, 670);
  row([83, 99, 116], 735, 'KKK', ['NA', 'C', 'NF'], 723);
  for (const x of [83, 99, 116]) P.line([[X(x), Y(738)], [X(103), Y(752)]], 0.0022, '#222');
  A.sel(X(103), Y(765), 1.45, -0.35); L('CH5', 132, 765, 0.011);
  // temporizadores CTD-02 / CTD-03
  for (const [bx, by, top, name] of [[260, 558, 526, 'CTD-02'], [265, 674, 633, 'CTD-03']]) {
    const x0 = bx - 27;
    row([0, 1, 2, 3, 4].map((i) => x0 + i * 17), top, 'KKKKK', ['1', '2', '3', '4', '5']);
    A.ctd(X(bx), Y(by));
    L(name, bx - 46, by - 31, 0.0115); L('(220Vca)', bx - 48, by - 23, 0.0105);
    [0, 1, 2].forEach((i) => { J(bx + 43, by - 16 + i * 17.5, 'RRK'[i]); L(String(6 + i), bx + 54, by - 16 + i * 17.5, 0.0115); });
    [0, 1, 2, 3, 4].forEach((i) => { J(x0 + 4 + i * 16.7, by + 43, 'YYYRK'[i]); L(String(9 + i), x0 + 4 + i * 16.7, by + 53, 0.0115); });
  }
  // auto-transformador
  L('AUTO-TRANSFORMADOR', 482, 474, 0.0135);
  for (const gx of [423, 483, 543]) {
    P.coil(X(gx + 7), Y(531), 0.1, 6, '#222');
    P.line([[X(gx), Y(490)], [X(gx + 7), Y(497)]], 0.0022); P.line([[X(gx + 7), Y(564)], [X(gx), Y(567)]], 0.0022);
    P.line([[X(gx - 16), Y(512)], [X(gx + 3), Y(512)]], 0.0022); P.line([[X(gx - 16), Y(541)], [X(gx + 3), Y(541)]], 0.0022);
    J(gx, 490); L('100%', gx + 19, 490, 0.0115);
    J(gx - 16, 512); L('80%', gx - 13, 502, 0.0115);
    J(gx - 16, 541); L('60%', gx - 13, 531, 0.0115);
    J(gx, 567); L('0', gx + 16, 567, 0.0115);
  }
  // motor 110V~480V
  L('MOTOR 110V~480V', 666, 474, 0.0135);
  [['U1', 'X4', 623], ['V2', 'Y5', 666], ['W3', 'Z6', 710]].forEach(([a, b, x]) => {
    P.coil(X(x + 4), Y(531), 0.088, 6, '#222'); P.line([[X(x), Y(495)], [X(x + 4), Y(500)]], 0.0022); P.line([[X(x + 4), Y(562)], [X(x), Y(568)]], 0.0022);
    A.mini(X(x), Y(495)); A.mini(X(x), Y(568)); L(a, x - 13, 495, 0.0115); L(b, x - 14, 568, 0.0115);
  });
  // sensor indutivo
  L('SENSOR INDUTIVO', 743, 474, 0.0135);
  [['GND', 740, 495], ['+12Vcc', 739, 532], ['OUT', 737, 568]].forEach(([t, x, y]) => { A.mini(X(x), Y(y)); L(t, x + 1, y + 14, 0.0115); });
  A.hole(X(810), Y(533), 0.0135);
  for (const [x, y] of [[772, 492], [851, 492], [767, 573], [845, 573]]) { P.circle(X(x), Y(y), 0.0055, '#b9b9b0'); P.circle(X(x), Y(y), 0.0025, '#555'); }
  P.circle(X(910), Y(533), 0.0045, '#1a1a1a');
  // contatores K1..K5 (220Vca) no trilho DIN
  A.rail(X(418), X(942), Y(658), 1.25);
  [444, 546, 650, 752, 857].forEach((x0, k) => {
    const xs = [0, 1, 2, 3, 4].map((i) => x0 + i * 16.8);
    row(xs, 604.6, 'KWRKR', ['L1', 'L2', 'L3', 'NO', 'A1'], 595);
    row(xs, 719, 'KWRKR', ['T1', 'T2', 'T3', 'NO', 'A2'], 729);
    L(`K${k + 1} (220Vca)`, x0 - 4, 629, 0.012);
    A.k3rt(X(x0 + 34), Y(662.7), xs.map((x) => X(x)), Y(604.6), Y(719));
  });
  // barramentos L1 / L2 / L3 / N
  [['#141414', 'K', 'L1', '#fff', 750], ['#f6f6f2', 'W', 'L2', '#111', 772], ['#d42424', 'R', 'L3', '#fff', 795], ['#2a8be0', 'B', 'N', '#111', 817]].forEach(([c, jc, t, tc, y]) => {
    A.strip(X(467), X(893), Y(y), 0.016, c);
    for (const x of [498, 530, 563, 645, 677, 710, 795, 828, 862]) J(x, y, jc);
    for (const x of [478, 625, 773]) L(t, x, y, 0.0125, { color: tc });
  });
  // trilho inferior
  A.rail(X(60), X(938), Y(919), 1.25);
  A.dev('brk3', X(125), Y(913), 1.8, 1.04); ['L1', 'L2', 'L3'].forEach((t, i) => L(t, 108 + i * 21.5, 860, 0.0105));
  A.shortWires(X(125), Y(895), [0x151515, 0xf0f0f0, 0xc81e1e]);
  A.keySwitch(X(116), Y(975)); A.brand(X(205), Y(980), 0.024);
  A.dev('dr4', X(216), Y(915), 1.5, 1.04); L('DR', 219, 838, 0.0115); L('TRIFÁSICO', 219, 847, 0.0115); ['L1', 'L2', 'L3', 'N'].forEach((t, i) => L(t, 199 + i * 12, 862, 0.0095));
  A.shortWires(X(216), Y(897), [0xf0f0f0, 0xf0f0f0, 0xf0f0f0, 0xf0f0f0], 0.018);
  // RCA / RPT / FSN / RST
  const relay = (bx, by, sx, name, tops, topY, topL, mids, bots, dark) => {
    A.dev(dark ? 'tallD' : 'tall', X(bx), Y(by), sx, 1.0);
    L(name, bx - 20, by - 31, 0.0105); L('(220Vca)', bx - 20, by - 23, 0.0098);
    tops.forEach(([x, c, t]) => { J(x, topY, c); L(t, x, topY - 10, 0.0115); });
    if (mids) mids.forEach(([x, c, t]) => { J(x, 858, c); L(t, x, 849, 0.0115); });
    bots.forEach(([x, y, c, t]) => { J(x, y, c); L(t, x, y + 10, 0.0105); });
    A.relayWires(X(bx), Y(by), tops.map(([x]) => X(x)), Y(mids ? 858 : topY));
  };
  relay(304, 922, 1.4, 'RCA-01', [[297, 'R', 'A1'], [312, 'R', 'A2']], 840, 0, [[297, 'K', '-IN'], [312, 'K', '+IN']], [[301, 969, 'K', 'J'], [317, 969, 'K', 'R'], [301, 989, 'K', '14'], [317, 989, 'K', '11'], [332, 989, 'K', '12']]);
  relay(369, 918, 1.25, 'RPT-01', [[359, 'R', 'A1'], [375, 'R', 'A2'], [391, 'K', 'C']], 840, 0, [[359, 'K', 'P1'], [375, 'K', 'P2'], [391, 'K', 'P3']], [[361, 970, 'K', '14'], [377, 970, 'K', '11'], [393, 970, 'K', '12']]);
  // FSN-22: só os jumpers (sem módulo)
  [[422, 'K', 'L1'], [438, 'W', 'L2'], [454, 'R', 'L3']].forEach(([x, c, t]) => { J(x, 842, c); L(t, x, 832, 0.0115); });
  [[438, 'J'], [454, 'N']].forEach(([x, t]) => { J(x, 858); L(t, x, 849, 0.0115); });
  L('FSN-22', 412, 888, 0.0105); L('(220Vca)', 412, 896, 0.0098);
  A.jumpers(X(438), Y(858), X(454), Y(905)); [423, 439, 454].forEach((x, i) => { J(x, 971); L(['14', '11', '12'][i], x, 981, 0.0105); });
  A.jumpers(X(428), Y(950), X(450), Y(962));
  relay(499, 922, 1.1, 'RST-21', [[486, 'K', 'L1'], [501, 'W', 'L2'], [517, 'R', 'L3']], 884, 0, null, [[485, 971, 'K', '14'], [501, 971, 'K', '11'], [516, 971, 'K', '12']]);
  // RAX-02 x4, RYD-01, TCS-01
  [[566, 'RAX-02'], [629, 'RAX-02'], [695, 'RAX-02'], [760, 'RAX-02'], [826, 'RYD-01']].forEach(([bx, n]) => {
    const a = bx - 16;
    relay(bx, 920, 1.05, n, [[a, 'R', 'A1'], [a + 16, 'K', '15'], [a + 32, 'K', '25']], 884, 0, null,
      [[a - 3, 977, 'K', '26'], [a + 12, 977, 'K', '28'], [a - 3, 992, 'K', '16'], [a + 12, 992, 'K', '18'], [a + 28, 992, 'R', 'A2']]);
  });
  relay(892, 922, 1.25, 'TCS-01', [[873, 'R', 'A1'], [890, 'K', '15']], 884, 0, null, [[865, 983, 'K', '16'], [881, 983, 'K', '18'], [897, 985, 'R', 'A2']], false);
}

// ---------------- b2 · branca "KET 1070: INDUSTRIAL" ----------------
function b2(A) {
  const P = A.P, g = P.g;
  paintWhiteBg(P, 202, '#f7f6f1');
  // arte bege clara (torres de linha de transmissão, casa) ao fundo
  const beige = 'rgba(214,190,150,0.55)';
  for (const [x0, w] of [[0.05, 0.2], [0.38, 0.16]]) {
    const top = 0.26, bot = -0.02;
    P.line([[x0, bot], [x0 + w / 2, top], [x0 + w, bot]], 0.006, beige);
    for (let k = 1; k < 6; k++) { const y = bot + (top - bot) * k / 6, hw = (w / 2) * (1 - k / 6); P.line([[x0 + w / 2 - hw, y], [x0 + w / 2 + hw, y]], 0.004, beige); }
    P.line([[x0 + w * 0.2, 0.14], [x0 + w * 0.8, 0.14]], 0.004, beige);
  }
  P.line([[-0.70, -0.02], [-0.70, 0.06], [-0.62, 0.12], [-0.54, 0.06], [-0.54, -0.02], [-0.70, -0.02]], 0.004, 'rgba(160,160,160,0.6)');
  P.rect(-0.62, 0.02, 0.03, 0.05, 'rgba(160,160,160,0.6)', 0.003);
  g.save(); g.fillStyle = 'rgba(240,215,200,0.5)'; g.fillRect(P.X(-0.78), P.Y(-0.09), P.S(1.5), P.S(0.05)); g.restore();
  P.text('KET 1070: INDUSTRIAL', -0.18, 0.43, 0.034, { color: '#d8262a', weight: 800, font: '"Arial Narrow", Arial, sans-serif' });
  A.brand(0.5, 0.425, 0.03);
  P.circle(0.76, 0.425, 0.024, '#e04a2a', 0.004); P.line([[0.75, 0.41], [0.76, 0.44], [0.772, 0.41]], 0.003, '#e04a2a');
  // topo esquerdo
  A.lamp(-0.79, 0.415, 'R', null, 1, true); A.label('ENERGIZADO', -0.79, 0.445, 0.007);
  A.rail(-0.84, -0.52, 0.37);
  A.relay(-0.765, 0.37, 'breaker3', null, { top: null, bot: null });
  A.relay(-0.685, 0.37, 'relay', null, { top: null, bot: null });
  A.relay(-0.64, 0.37, 'relay', null, { top: null, bot: null });
  A.label('DISJUNTOR', -0.765, 0.44, 0.0075);
  A.label('SOFT-STARTER', -0.54, 0.435, 0.0075);
  A.jrow(-0.575, 0.405, 0.022, 'RKK'); A.jrow(-0.575, 0.37, 0.022, 'RKK');
  A.label('INVERSOR DE FREQUÊNCIA', -0.44, 0.34, 0.0075);
  // inversor de frequência (caixa preta grande) + soft-starter azul
  A.box(-0.445, 0.22, 0.29, 0.19, 0.15, 0x1d1e21);
  A.box(-0.385, 0.285, 0.1, 0.035, 0.002, 0xd8d8d4, 0.15);
  A.box(-0.49, 0.25, 0.07, 0.05, 0.004, 0x2c3136, 0.15);
  A.box(-0.645, 0.23, 0.09, 0.1, 0.1, 0x6f8499);
  A.box(-0.645, 0.25, 0.04, 0.03, 0.003, 0x1a2a3a, 0.1);
  A.redWires(-0.44, 0.125, 0.12);
  A.btn(-0.79, 0.19, 'G'); A.jcol(-0.745, 0.2, -0.024, 'KK');
  A.sel(-0.79, 0.105); A.lamp(-0.66, 0.095, 'G', null, 1, false);
  A.jcol(-0.795, 0.03, -0.028, 'KKKK');
  for (let k = 0; k < 5; k++) A.jrow(-0.72, 0.04 - k * 0.028, 0.024, k % 2 ? 'KR' : 'RK');
  P.line([[-0.74, -0.1], [-0.56, -0.1], [-0.56, 0.02]], 0.0025, '#c83030');
  // barramentos verticais vermelho / azul com bornes
  A.vstrip(-0.175, -0.03, 0.4, 0.014, '#d42a2a');
  A.vstrip(-0.095, -0.03, 0.4, 0.014, '#2b6fd0');
  A.vstrip(-0.06, 0.0, 0.3, 0.008, '#2b6fd0');
  for (let k = 0; k < 16; k++) {
    const y = 0.385 - k * 0.026;
    A.jack(-0.175, y, 'R'); A.jack(-0.135, y, 'K'); A.jack(-0.095, y, 'B');
    if (k > 3 && k < 13) A.jack(-0.06, y, k % 3 ? 'K' : 'B');
  }
  A.jrow(-0.18, -0.07, 0.022, 'GGGG', null);
  P.rect(-0.03, 0.05, 0.03, 0.14, '#555', 0.0015);
  for (let k = 0; k < 6; k++) A.jack(-0.03, 0.105 - k * 0.022, 'K');
  // auto-transformador / motor (grades de bornes)
  A.label('AUTO-TRANSFORMADOR', 0.06, 0.40, 0.0075); A.label('MOTOR 110V-440V', 0.22, 0.40, 0.0075);
  for (let r = 0; r < 4; r++) { A.jrow(0.02, 0.37 - r * 0.03, 0.028, r % 2 ? 'KRK' : 'RKK'); A.jrow(0.18, 0.37 - r * 0.03, 0.03, 'RKR'); }
  // sirene / buzzer redonda e horímetro
  A.siren(0.43, 0.345);
  A.box(0.70, 0.31, 0.1, 0.12, 0.05, 0x1c1c1e); A.box(0.70, 0.335, 0.05, 0.03, 0.002, 0x9aa89a, 0.05);
  A.label('HORÍMETRO', 0.70, 0.395, 0.0075); A.label('SIRENE', 0.43, 0.41, 0.0075);
  // 2 medidores + bornes
  A.meter(0.06, 0.2, 1.0, 'red'); A.meter(0.25, 0.2, 1.0, 'red');
  A.jrow(0.035, 0.12, 0.024, 'RK'); A.jrow(0.225, 0.12, 0.024, 'RK'); A.jrow(0.03, 0.09, 0.024, 'KK');
  // sinaleiros e botoeiras à direita
  A.lamp(0.46, 0.18, 'R', 'S1', 1, true); A.jrow(0.5, 0.19, 0.022, 'KK');
  A.lamp(0.46, 0.09, 'G', 'S2', 1, false); A.jrow(0.5, 0.1, 0.022, 'KK');
  A.sel(0.47, 0.0); A.jrow(0.505, 0.012, 0.022, 'KK'); A.jrow(0.505, -0.012, 0.022, 'KK');
  P.circle(0.44, 0.18, 0.05, 'rgba(200,60,60,0.35)', 0.002);
  A.btn(0.665, 0.175, 'R', 'B0'); A.jcol(0.71, 0.187, -0.024, 'KW');
  A.btn(0.66, 0.085, 'Y', 'B1'); A.jcol(0.705, 0.097, -0.024, 'KW');
  A.btn(0.655, -0.01, 'G', 'B2'); A.jcol(0.70, 0.002, -0.024, 'KW');
  // fila de pares de bornes
  for (let k = 0; k < 10; k++) A.jrow(-0.36 + k * 0.1, -0.12, 0.022, 'RK');
  // fila inferior: 5 contatores + 3 relés térmicos
  A.rail(-0.66, 0.56, -0.22);
  A.K(-0.60, -0.22, 'K1', { small: true }); A.K(-0.45, -0.22, 'K2', { small: true }); A.K(-0.29, -0.22, 'K3', { small: true }); A.K(-0.13, -0.22, 'K4', { small: true });
  A.relay(0.03, -0.235, 'thermal', 'FT1', { top: ['KKR', null], bot: ['KKK', null] });
  A.relay(0.22, -0.235, 'thermal', 'FT2', { top: ['KKR', null], bot: ['KKK', null] });
  A.relay(0.41, -0.235, 'thermal', 'FT3', { top: ['KKR', null], bot: ['KKK', null] });
  for (let k = 0; k < 7; k++) A.jrow(-0.62 + k * 0.17, -0.37, 0.022, 'KKR');
  for (let k = 0; k < 6; k++) A.jrow(-0.55 + k * 0.17, -0.41, 0.022, 'KK');
  A.label('CHAVE GERAL', 0.66, -0.28, 0.0075);
  A.keySwitch(0.64, -0.325);
  A.emerg(0.675, -0.39);
}

// ---------------- b3/b4/b5 · brancas densas (proteção/comandos) ----------------
function denseWhite(A, seed, title, opts = {}) {
  const P = A.P, g = P.g, r = rng(seed);
  paintWhiteBg(P, seed, '#f6f5ef');
  // áreas creme serigrafadas (seções)
  g.save();
  for (const [x, y, w, h] of [[-0.62, 0.1, 0.3, 0.22], [-0.2, -0.05, 0.28, 0.3], [0.2, 0.18, 0.34, 0.2], [0.42, -0.1, 0.28, 0.16], [-0.55, -0.2, 0.5, 0.08]]) {
    g.fillStyle = 'rgba(242,232,190,0.75)'; g.fillRect(P.X(x - w / 2), P.Y(y + h / 2), P.S(w), P.S(h));
  }
  g.restore();
  P.text(title, -0.05, 0.43, 0.03, { color: '#333', weight: 600, font: '"Arial Narrow", Arial, sans-serif' });
  A.brand(0.52, 0.428, 0.026);
  P.circle(0.77, 0.428, 0.02, '#e0a020', 0.004);
  // linhas de diagrama
  for (let k = 0; k < 16; k++) {
    const x = -0.8 + r() * 1.55, y = -0.4 + r() * 0.78;
    P.line([[x, y], [x + (r() - 0.5) * 0.25, y], [x + (r() - 0.5) * 0.25, y + (r() - 0.5) * 0.12]], 0.0018, r() < 0.3 ? '#c83030' : '#444');
  }
  // coluna de relés pretos à esquerda (b4) ou contatores em cima
  A.rail(-0.84, 0.05, 0.33);
  const topK = opts.topK || [-0.74, -0.52, -0.26];
  topK.forEach((x, i) => A.K(x, 0.33, 'K' + (i + 1), { small: true, noWires: true }));
  A.box(-0.08, 0.33, 0.09, 0.07, 0.06, 0x1c1c1e);
  // barramento vertical azul e vermelho
  A.vstrip(0.12, -0.2, 0.4, 0.012, '#2a6fd0');
  A.vstrip(0.08, -0.2, 0.4, 0.01, '#d23030');
  for (let k = 0; k < 20; k++) { const y = 0.39 - k * 0.03; A.jack(0.12, y, 'B'); A.jack(0.08, y, k % 4 ? 'R' : 'K'); if (k % 2) A.jack(0.16, y, 'K'); }
  // grade de pares de bornes
  for (let k = 0; k < 7; k++) A.jrow(-0.8, 0.22 - k * 0.042, 0.022, k % 2 ? 'RK' : 'KR');
  for (let k = 0; k < 6; k++) A.jrow(-0.36, 0.2 - k * 0.042, 0.022, 'KRK');
  for (let k = 0; k < 5; k++) A.jrow(0.22, 0.4 - k * 0.028, 0.024, k % 2 ? 'RRK' : 'KKR');
  for (let k = 0; k < 8; k++) A.jrow(0.52, 0.38 - k * 0.028, 0.022, 'RK');
  A.jrow(0.76, 0.36, 0.0, 'W'); A.box(0.73, 0.3, 0.06, 0.08, 0.02, 0xe8dfc4);
  // relés pretos grandes (proteção)
  A.box(-0.62, 0.17, 0.09, 0.06, 0.07, 0x1c1c1e); A.box(-0.45, 0.07, 0.1, 0.07, 0.07, 0x1c1c1e);
  // trio de contatores no meio
  A.rail(0.18, 0.62, 0.12);
  (opts.midK || [0.25, 0.39]).forEach((x, i) => A.K(x, 0.12, 'K' + (i + 5), { small: true, noWires: true, topCols: 'KRK' }));
  A.box(0.53, 0.12, 0.07, 0.08, 0.075, 0x1c1c1e);
  // botões vermelhos em par, amarelos
  A.btn(0.0, 0.02, 'R'); A.btn(0.05, 0.02, 'R'); A.lamp(0.3, -0.04, 'Y', null, 1, false); A.lamp(0.36, -0.04, 'Y', null, 1, false);
  A.btn(-0.25, 0.02, 'R'); A.lamp(-0.2, 0.02, 'G', null, 1, false); A.btn(0.63, 0.0, 'Y');
  for (let k = 0; k < 12; k++) A.jrow(-0.82 + k * 0.14, -0.1, 0.022, r() < 0.5 ? 'RK' : 'KKR');
  // fila inferior: relés brancos + relés azuis + bloco preto/amarelo
  A.rail(-0.84, 0.62, -0.26);
  for (let k = 0; k < 8; k++) A.relay(-0.8 + k * 0.064, -0.26, k % 3 === 2 ? 'timer' : 'relay', null, { top: null, bot: null });
  A.box(-0.25, -0.26, 0.045, 0.1, 0.08, 0x2f6fc2); A.box(-0.2, -0.26, 0.045, 0.1, 0.08, 0x2f6fc2);
  A.box(-0.115, -0.26, 0.08, 0.1, 0.08, 0x1c1c1e); A.box(-0.16, -0.26, 0.012, 0.1, 0.082, 0xe9c21a);
  for (let k = 0; k < 6; k++) A.relay(-0.04 + k * 0.064, -0.26, k === 3 ? 'prot' : 'relay', null, { top: null, bot: null });
  A.box(0.44, -0.26, 0.04, 0.085, 0.07, 0x2f6fc2); A.box(0.49, -0.26, 0.04, 0.085, 0.07, 0x2f6fc2);
  A.box(0.57, -0.26, 0.07, 0.08, 0.07, 0x1c1c1e); A.box(0.535, -0.26, 0.012, 0.08, 0.072, 0xe9c21a);
  for (let k = 0; k < 16; k++) A.jrow(-0.8 + k * 0.095, -0.36, 0.02, k % 3 ? 'KK' : 'RK');
  for (let k = 0; k < 14; k++) A.jrow(-0.78 + k * 0.1, -0.41, 0.02, 'KR');
  A.knob(0.8, -0.3, 0xe9c21a);
  A.emerg(0.8, -0.395);
}

export const LAYOUTS = {
  b1, b2,
  b3: (A) => denseWhite(A, 303, TITLES.b3),
  b4: (A) => denseWhite(A, 404, TITLES.b4, { topK: [-0.7, -0.5, -0.3], midK: [0.3] }),
  b5: (A) => denseWhite(A, 505, TITLES.b5, { topK: [-0.72, -0.56, -0.4, -0.22] }),
};
