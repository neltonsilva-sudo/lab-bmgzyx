// DONO: agente "aula-pratica". Diagramas de comando e de força (símbolos IEC 60617, desenho vertical) em SVG.
// Os elementos levam data-coil / data-lamp / data-motor para a interface colorir o estado ao vivo.

const S = '#1e2a3a';
const ln = (x1, y1, x2, y2, o = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${S}" stroke-width="1.6" ${o}/>`;
const dash = (x1, y1, x2, y2) => ln(x1, y1, x2, y2, 'stroke-dasharray="4 3" stroke-width="1.1"');
const tx = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.size || 10}" text-anchor="${o.a || 'start'}" fill="${o.c || S}" font-weight="${o.w || 600}" font-family="Segoe UI,system-ui,sans-serif">${s}</text>`;
const dot = (x, y) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${S}"/>`;

// contato NA vertical (ocupa y..y+40)
function no(x, y, tag, t1, t2, act) {
  let s = ln(x, y, x, y + 12) + ln(x, y + 28, x, y + 40) + ln(x, y + 28, x - 10, y + 13);
  if (t1) s += tx(x + 5, y + 10, t1, { size: 8, w: 500 }); if (t2) s += tx(x + 5, y + 38, t2, { size: 8, w: 500 });
  if (tag) s += tx(act ? x - 38 : x - 14, y + 24, tag, { a: 'end' });
  return s + actuator(x - 6, y + 20, act, -1);
}
// contato NF vertical
function nc(x, y, tag, t1, t2, act) {
  let s = ln(x, y, x, y + 12) + ln(x, y + 12, x + 9, y + 12) + ln(x, y + 28, x, y + 40) + ln(x, y + 28, x + 11, y + 9);
  if (t1) s += tx(x - 5, y + 10, t1, { size: 8, w: 500, a: 'end' }); if (t2) s += tx(x - 5, y + 38, t2, { size: 8, w: 500, a: 'end' });
  if (tag) s += tx(act ? x - 28 : x - 14, y + 24, tag, { a: 'end' });
  return s + actuator(x + 5, y + 19, act, -1);
}
function actuator(x, y, kind, dir) {
  if (!kind) return '';
  const e = x - 20;
  let s = dash(x, y, e, y);
  if (kind === 'push') s += ln(e, y - 6, e, y + 6) + ln(e, y - 6, e - 4, y - 6) + ln(e, y + 6, e - 4, y + 6);
  if (kind === 'emerg') s += `<path d="M${e} ${y - 8} a8 8 0 0 0 0 16" fill="none" stroke="${S}" stroke-width="1.6"/>`;
  if (kind === 'thermal') s += `<path d="M${e} ${y - 6} h-6 v4 h4 v4 h-4 v4 h6" fill="none" stroke="${S}" stroke-width="1.3"/>`;
  if (kind === 'onDelay') s += `<path d="M${e} ${y - 7} a7 7 0 0 1 0 14" fill="none" stroke="${S}" stroke-width="1.4"/>` + ln(e, y - 7, e, y + 7);
  if (kind === 'sel') s += `<path d="M${e} ${y - 6} l-6 6 l6 6" fill="none" stroke="${S}" stroke-width="1.4"/>`;
  return s;
}
function coil(x, y, tag, extra = '') {
  return ln(x, y, x, y + 8) + `<rect data-coil="${tag}" x="${x - 15}" y="${y + 8}" width="30" height="20" fill="#fff" stroke="${S}" stroke-width="1.6"/>` + ln(x, y + 28, x, y + 40) +
    tx(x + 19, y + 22, tag) + tx(x - 18, y + 14, 'A1', { size: 8, w: 500, a: 'end' }) + tx(x - 18, y + 33, 'A2', { size: 8, w: 500, a: 'end' }) + extra;
}
function lamp(x, y, tag, color) {
  return ln(x, y, x, y + 8) + `<g data-lamp="${tag}"><circle cx="${x}" cy="${y + 20}" r="11" fill="#fff" stroke="${S}" stroke-width="1.6"/>` +
    ln(x - 7.8, y + 12.2, x + 7.8, y + 27.8) + ln(x + 7.8, y + 12.2, x - 7.8, y + 27.8) + `</g>` + ln(x, y + 31, x, y + 40) + tx(x + 15, y + 24, tag) + (color ? tx(x + 15, y + 35, color, { size: 8, w: 500 }) : '');
}
function siren(x, y, tag) {
  return ln(x, y, x, y + 8) + `<g data-lamp="${tag}"><path d="M${x - 12} ${y + 30} a12 12 0 0 1 24 0 z" fill="#fff" stroke="${S}" stroke-width="1.6"/></g>` + ln(x, y + 30, x, y + 40) + tx(x + 16, y + 26, tag);
}
const wrap = (w, h, body, title) => `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" class="dg"><rect width="${w}" height="${h}" fill="#fff"/>${tx(8, 14, title, { size: 11, w: 700, c: '#1f6fd1' })}${body}</svg>`;
const rails = (w, yL, yN, lab = 'L1') => ln(30, yL, w - 20, yL, 'stroke-width="2.4"') + tx(6, yL + 4, lab, { w: 700 }) + ln(30, yN, w - 20, yN, 'stroke-width="2.4"') + tx(10, yN + 4, 'N', { w: 700 });

// ---------- força ----------
function tri(xs, y, fn) { return xs.map((x, i) => fn(x, y, i)).join(''); }
function noTriple(xs, y, tag, labs, opt = {}) {
  let s = tri(xs, y, (x, yy, i) => ln(x, yy, x, yy + 12) + ln(x, yy + 28, x, yy + 40) + ln(x, yy + 28, x - 10, yy + 13) +
    (opt.breaker ? ln(x - 3, yy + 9, x + 3, yy + 15) + ln(x + 3, yy + 9, x - 3, yy + 15) : '') + (labs ? tx(x + 4, yy + 10, labs[0][i], { size: 7, w: 500 }) + tx(x + 4, yy + 39, labs[1][i], { size: 7, w: 500 }) : ''));
  s += dash(xs[0] - 5, y + 20, xs[2] - 5, y + 20) + tx(xs[0] - 16, y + 24, tag, { a: 'end' });
  if (opt.breaker) s += `<rect x="${xs[2] + 8}" y="${y + 12}" width="18" height="14" fill="#fff" stroke="${S}" stroke-width="1.2"/>` + tx(xs[2] + 17, y + 23, 'I&gt;', { size: 8, a: 'middle' }) + dash(xs[2] - 5, y + 20, xs[2] + 8, y + 20);
  return s;
}
function thermalTriple(xs, y, tag) {
  let s = tri(xs, y, (x, yy) => ln(x, yy, x, yy + 10) + `<rect x="${x - 6}" y="${yy + 10}" width="12" height="20" fill="#fff" stroke="${S}" stroke-width="1.4"/><path d="M${x} ${yy + 12} v5 h-3 v6 h3 v5" fill="none" stroke="${S}" stroke-width="1.2"/>` + ln(x, yy + 30, x, yy + 40));
  return s + dash(xs[0] + 6, y + 20, xs[2] - 6, y + 20) + tx(xs[0] - 16, y + 24, tag, { a: 'end' });
}
function ammeter(x, y) { return ln(x, y, x, y + 8) + `<circle cx="${x}" cy="${y + 20}" r="11" fill="#fff" stroke="${S}" stroke-width="1.6"/>` + tx(x, y + 24, 'A', { a: 'middle', w: 700 }) + ln(x, y + 31, x, y + 40); }
function motor(cx, cy, labels = ['U1', 'V2', 'W3'], tag = 'M1') {
  return `<g data-motor="1"><circle cx="${cx}" cy="${cy}" r="30" fill="#fff" stroke="${S}" stroke-width="1.8"/>` + tx(cx, cy - 2, 'M', { a: 'middle', size: 15, w: 700 }) + tx(cx, cy + 14, '3~', { a: 'middle', size: 11 }) + `</g>` +
    tx(cx + 34, cy + 4, tag) + labels.map((l, i) => tx(cx - 26 + i * 26, cy - 34, l, { size: 7, a: 'middle', w: 500 })).join('');
}

// força: partida direta (barramento → K1 → [RCA em série] → motor Δ). O disjuntor geral QF0 e o DR alimentam o barramento.
const busTop = (xs) => tri(xs, 30, (x, y, i) => tx(x - 6, y - 4, 'L' + (i + 1), { size: 9, w: 700 }) + ln(x, y, x, y + 20)) + tx(xs[2] + 12, 44, 'barramentos', { size: 8, w: 500 });
export function forcaDireta(N, rca) {
  const xs = [70, 110, 150];
  let b = busTop(xs) + tri(xs, 50, (x) => ln(x, 50, x, 80)) + noTriple(xs, 80, N.K1, [['1', '3', '5'], ['2', '4', '6']]);
  if (rca) { b += ln(xs[0], 120, xs[0], 150) + `<rect x="${xs[0] - 9}" y="150" width="18" height="30" fill="#fff" stroke="${S}" stroke-width="1.6"/>` + tx(xs[0], 169, 'I&gt;', { a: 'middle', size: 8 }) + tx(xs[0] - 14, 168, N.RCA + ' -IN/+IN', { a: 'end', size: 9 }) + ln(xs[0], 180, xs[0], 230) + tri(xs.slice(1), 120, (x) => ln(x, 120, x, 230)); }
  else b += tri(xs, 120, (x) => ln(x, 120, x, 230));
  b += tri(xs, 230, (x, y, i) => ln(x, y, xs[1] - 26 + i * 26, 268)) + motor(110, 298, ['U1', 'V2', 'W3']);
  b += tx(14, 355, 'Motor 380 V em triângulo (Δ): U1–Z6, V2–X4, W3–Y5', { size: 9, w: 500 });
  return wrap(260, 370, b, 'Circuito de força');
}
export function comandoDireta(N, opt = {}) {
  const x = 120, yN = 450;
  let b = rails(300, 34, yN), y = 34;
  if (opt.emerg) { b += ln(x, y, x, y + 10) + nc(x, y + 10, N.SE, '11', '12', 'emerg') + tx(x + 18, y + 34, '(acessório externo)', { size: 7.5, w: 500 }); y += 50; }
  if (opt.rca) { b += ln(x, y, x, y + 10) + no(x, y + 10, N.RCA, '11', '14') + tx(x + 18, y + 34, 'NA fechado sem sobrecorrente', { size: 7.5, w: 500 }); y += 50; }
  b += ln(x, y, x, y + 10) + nc(x, y + 10, N.S0, '', '', 'push'); y += 50;
  const yA = y + 10;
  b += ln(x, y, x, yA) + dot(x, yA) + no(x, yA, N.S1, '', '', 'push') + ln(x, yA, x + 60, yA) + no(x + 60, yA, N.K1, '13', '14') + ln(x, yA + 40, x + 60, yA + 40) + dot(x, yA + 40);
  y = yA + 40;
  b += ln(x, y, x, y + 30) + coil(x, y + 30, N.K1) + ln(x, y + 70, x, yN);
  if (opt.lamp) b += dot(x, y + 16) + ln(x, y + 16, x + 110, y + 16) + ln(x + 110, y + 16, x + 110, y + 30) + lamp(x + 110, y + 30, N.SN, 'motor ligado') + ln(x + 110, y + 70, x + 110, yN);
  b += tx(14, yN + 18, `${N.S0} = DESL (NF) · ${N.S1} = LIGA (NA) · selo ${N.K1} NO 13-14`, { size: 8.5, w: 500 });
  return wrap(300, yN + 26, b, 'Circuito de comando (220 V)');
}

// reversão: seletora CH5 escolhe o sentido; RAX-02 dão o intertravamento (NF 15-16), pois os contatores têm só um NA
export function comandoReversao(N) {
  let b = rails(400, 30, 470);
  const x = 150;
  b += ln(x, 30, x, 40) + nc(x, 40, N.S0, '', '', 'push') + ln(x, 80, x, 95) + dot(x, 95);
  b += no(x, 95, N.S1, '', '', 'push') + ln(x, 95, x + 55, 95) + ln(x + 55, 95, x + 55, 105) + no(x + 55, 105, N.K1, '13', '14') + ln(x + 55, 95, x + 110, 95) + ln(x + 110, 95, x + 110, 105) + no(x + 110, 105, N.K2, '13', '14');
  b += ln(x + 55, 145, x + 55, 150) + ln(x + 110, 145, x + 110, 150) + ln(x, 135, x, 150) + ln(x, 150, x + 110, 150) + dot(x, 150) + dot(x + 55, 150);
  // seletora
  b += ln(x, 150, x, 170) + dot(x, 170) + tx(x + 8, 168, 'C', { size: 8 }) + ln(x, 170, 80, 190) + ln(x, 170, 260, 190) + dash(x - 30, 180, x + 30, 180) + tx(x + 34, 184, N.SEL, { size: 9 }) + tx(84, 203, 'NA (pos. 1)', { size: 7.5 }) + tx(236, 203, 'NF (pos. 0)', { size: 7.5 });
  const br = (bx, Kx, RAo) => ln(bx, 190, bx, 230) + nc(bx, 230, RAo, '15', '16') + ln(bx, 270, bx, 330) + coil(bx, 330, Kx) + ln(bx, 370, bx, 470);
  b += br(80, N.K1, N.RA2) + br(260, N.K2, N.RA1);
  b += ln(80, 300, 30 + 10, 300) + dot(80, 300) + ln(40, 300, 40, 330) + coil(40, 330, N.RA1) + ln(40, 370, 40, 470);
  b += ln(260, 300, 340, 300) + dot(260, 300) + ln(340, 300, 340, 330) + coil(340, 330, N.RA2) + ln(340, 370, 340, 470);
  b += tx(12, 490, `Intertravamento: ${N.RA1} (∥ ${N.K1}) abre 15-16 no ramo de ${N.K2} e ${N.RA2} (∥ ${N.K2}) no ramo de ${N.K1}`, { size: 8.5, w: 500 });
  return wrap(400, 500, b, 'Comando: reversão com intertravamento');
}
export function forcaReversao(N) {
  const xs = [60, 100, 140];
  let b = busTop(xs) + tri(xs, 50, (x) => ln(x, 50, x, 70));
  const k2 = [190, 230, 270];
  b += tri(xs, 70, (x, y, i) => dot(x, y) + ln(x, y, k2[i], y) + ln(k2[i], y, k2[i], 90)) + tri(xs, 70, (x) => ln(x, 70, x, 90));
  b += noTriple(xs, 90, N.K1, [['1', '3', '5'], ['2', '4', '6']]) + noTriple(k2, 90, N.K2, [['1', '3', '5'], ['2', '4', '6']]);
  b += ln(k2[0], 130, k2[0], 145) + ln(k2[0], 145, xs[2], 165) + ln(k2[1], 130, k2[1], 155) + ln(k2[1], 155, xs[1], 165) + ln(k2[2], 130, k2[2], 140) + ln(k2[2], 140, xs[0], 165);
  b += tri(xs, 130, (x) => ln(x, 130, x, 200) + dot(x, 165)) + tri(xs, 200, (x, y, i) => ln(x, y, 74 + i * 26, 238)) + motor(100, 268);
  b += tx(14, 325, `${N.K2} inverte L1 ↔ L3 (sentido anti-horário)`, { size: 9, w: 500 });
  return wrap(300, 340, b, 'Circuito de força');
}

// estrela-triângulo com o relé RYD-01 (15-18 estrela, 25-28 triângulo)
export function comandoYD(N) {
  let b = rails(390, 30, 450);
  const x = 70;
  b += ln(x, 30, x, 40) + nc(x, 40, N.S0, '', '', 'push') + ln(x, 80, x, 95) + dot(x, 95);
  b += no(x, 95, N.S1, '', '', 'push') + ln(x, 95, x + 50, 95) + no(x + 50, 95, N.K1, '13', '14') + ln(x, 135, x + 50, 135) + dot(x, 135) + ln(x, 135, x, 340) + coil(x, 340, N.K1) + ln(x, 380, x, 450);
  b += ln(x, 160, 340, 160) + dot(x, 160);
  b += dot(165, 160) + ln(165, 160, 165, 340) + coil(165, 340, N.KT) + ln(165, 380, 165, 450);
  b += dot(250, 160) + ln(250, 160, 250, 190) + no(250, 190, N.KT, '15', '18 Y', 'onDelay') + ln(250, 230, 250, 340) + coil(250, 340, N.K3, tx(269, 392, 'estrela', { size: 8, w: 500 })) + ln(250, 380, 250, 450);
  b += ln(340, 160, 340, 190) + no(340, 190, N.KT, '25', '28 Δ', 'onDelay') + ln(340, 230, 340, 340) + coil(340, 340, N.K2, tx(359, 392, 'triângulo', { size: 8, w: 500 })) + ln(340, 380, 340, 450);
  b += tx(12, 470, `${N.KT}: 15-18 fecha ao energizar (estrela) e abre após o tempo; 25-28 fecha 100 ms depois (triângulo)`, { size: 8.5, w: 500 });
  return wrap(430, 480, b, 'Comando: estrela-triângulo (RYD-01)');
}
export function forcaYD(N) {
  const xs = [60, 100, 140];
  let b = busTop(xs) + tri(xs, 50, (x) => ln(x, 50, x, 70)) + noTriple(xs, 70, N.K1, [['1', '3', '5'], ['2', '4', '6']]);
  b += tri(xs, 110, (x, y, i) => ln(x, y, x, 150) + dot(x, 150) + ln(x, 150, 74 + i * 26, 220));
  const k2 = [200, 240, 280];
  b += tri(xs, 150, (x, y, i) => ln(x, y, k2[i], y)) + tri(k2, 150, (x) => ln(x, 150, x, 165)) + noTriple(k2, 165, N.K2, [['1', '3', '5'], ['2', '4', '6']]);
  b += tri(k2, 205, (x) => ln(x, 205, x, 300)) + tx(206, 312, 'Z6', { size: 7 }) + tx(246, 312, 'X4', { size: 7 }) + tx(286, 312, 'Y5', { size: 7 });
  b += motor(100, 250) + tri([74, 100, 126], 280, (x) => ln(x, 280, x, 300)) + tri([74, 100, 126], 300, (x, y, i) => tx(x - 6, 312, ['X4', 'Y5', 'Z6'][i], { size: 7 }) + ln(x, 300, x, 330));
  b += noTriple([74, 100, 126], 330, N.K3, null) + ln(74, 370, 126, 370) + tri([74, 100, 126], 370, (x) => dot(x, 370));
  b += ln(k2[0], 300, 126, 320) + ln(k2[1], 300, 74, 320) + ln(k2[2], 300, 100, 320);
  b += tx(150, 395, `${N.K3} fecha a estrela · ${N.K2} fecha o triângulo`, { size: 8.5, w: 500 });
  return wrap(340, 410, b, 'Circuito de força');
}
