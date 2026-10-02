// DONO: agente "aula-pratica". Simulador elétrico puro (sem DOM) das bancadas didáticas.
// Rede 3F+N+PE 380/220 V 60 Hz. Condutores ideais (cabos, contatos fechados, barramentos) são unidos por union-find;
// cargas (bobinas, sinaleiros, enrolamentos do motor, instrumentos, polos de proteção) entram numa análise nodal fasorial
// complexa. Curto = mesmo nó com duas fontes diferentes (ou corrente acima do disparo magnético) → proteção dispara.
// Uso: const s = createSim(spec); s.addWire('PWR.L1','Q1.1'); s.setMain(true); s.step(0.05); s.dev('K1').st.on ...

const VF = 220, VL = 380;
const deg = Math.PI / 180;
const P = (m, a) => [m * Math.cos(a * deg), m * Math.sin(a * deg)];
export const PHASORS = { L1: P(VF, 0), L2: P(VF, -120), L3: P(VF, 120), N: [0, 0], PE: [0, 0] };
const cAbs = (z) => Math.hypot(z[0], z[1]);
const cSub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cMul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cAdd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const Y = (z, angDeg = 0) => P(1 / z, -angDeg); // admitância de impedância |z|∠ang
const ROT = P(1, 120), ROT2 = P(1, 240);

// ---------- tipos de dispositivo ----------
// terms: bornes; links(d, s): pares de bornes ligados idealmente no estado atual; elems(d, s): cargas {a,b,y,k};
// update(d, s, dt): lógica com o resultado da última solução (s.V, s.I).
const R_POLE = 1 / 200;
export const TYPES = {
  supply: { terms: ['L1', 'L2', 'L3', 'N', 'PE'],
    links(d, s) {
      const L = [[d.id + '.PE', 'SRC:PE']];
      if (s.mainOn && !s.mainTrip) for (const k of ['L1', 'L2', 'L3', 'N']) if (!(s.faults.phaseLoss === k)) L.push([d.id + '.' + k, 'SRC:' + k]);
      if (s.grounding) for (const k of ['L1', 'L2', 'L3', 'N']) L.push([d.id + '.' + k, d.id + '.PE']);
      return L;
    } },
  contactor: { terms: ['1', '2', '3', '4', '5', '6', '13', '14', '21', '22', 'A1', 'A2'], R: { 'A1-A2': 550 },
    elems(d) { return d.st.burnt ? [] : [{ a: 'A1', b: 'A2', y: Y(6050, 20), k: 'coil' }]; },
    links(d) {
      const on = d.st.on, L = [];
      if (on) { L.push(['1', '2'], ['3', '4'], ['5', '6']); if (!d.st.wornAux) L.push(['13', '14']); } else L.push(['21', '22']);
      return L;
    },
    coil(d, s) {
      const v = s.vd(d, 'A1', 'A2');
      if (v > 300 && !d.st.burnt) { d.st.burnt = true; s.event('burn', `Bobina de ${d.name} (220 V) submetida a ${Math.round(v)} V — bobina queimada.`, d.id); }
      const on = !d.st.burnt && (d.st.on ? v > 120 : v > 170);
      return on;
    } },
  pbNO: { terms: ['13', '14'], links(d) { return d.st.pressed ? [['13', '14']] : []; } },
  pbNC: { terms: ['11', '12'], links(d) { return d.st.pressed ? [] : [['11', '12']]; } },
  emerg: { terms: ['11', '12'], links(d) { return d.st.latched ? [] : [['11', '12']]; } },
  selector: { terms: ['NA', 'C', 'NF'], links(d) { return d.st.pos ? [['C', 'NA']] : [['C', 'NF']]; } },
  selector2: { terms: ['13', '14', '21', '22'], links(d) { return d.st.pos ? [['13', '14']] : [['21', '22']]; } },
  lamp: { terms: ['X1', 'X2'], R: { 'X1-X2': 1500 }, elems() { return [{ a: 'X1', b: 'X2', y: Y(11000), k: 'lamp' }]; },
    update(d, s) { d.st.lit = s.vd(d, 'X1', 'X2') > 150; } },
  siren: { terms: ['X1', 'X2'], R: { 'X1-X2': 900 }, elems() { return [{ a: 'X1', b: 'X2', y: Y(4000, 30), k: 'siren' }]; },
    update(d, s) { d.st.on = s.vd(d, 'X1', 'X2') > 150; } },
  hourmeter: { terms: ['X1', 'X2'], R: { 'X1-X2': 3000 }, elems() { return [{ a: 'X1', b: 'X2', y: Y(20000), k: 'h' }]; },
    update(d, s, dt) { d.st.on = s.vd(d, 'X1', 'X2') > 150; if (d.st.on) d.st.h = (d.st.h || 0) + dt / 3600; } },
  voltmeter: { terms: ['V', 'COM'], R: { 'V-COM': 1e6 }, elems() { return [{ a: 'V', b: 'COM', y: Y(1e6), k: 'v' }]; },
    update(d, s) { d.st.val = s.vd(d, 'V', 'COM'); } },
  ammeter: { terms: ['A', 'COM'], R: { 'A-COM': 0.01 }, elems() { return [{ a: 'A', b: 'COM', y: Y(0.01), k: 'a' }]; },
    update(d, s) { d.st.val = s.elemI(d, 'a'); } },
  // disjuntor-motor 3P: térmico + magnético (13 × Ir)
  breaker3: { terms: ['1', '2', '3', '4', '5', '6'], R: { '1-2': 0.005, '3-4': 0.005, '5-6': 0.005 },
    init(d) { d.st.closed = d.p.closed ?? true; d.st.H = 0; },
    elems(d) { return d.st.closed && !d.st.trip ? [['1', '2'], ['3', '4'], ['5', '6']].map(([a, b], i) => ({ a, b, y: [200, 0], k: 'p' + i })) : []; },
    protect(d, s) {
      const I = Math.max(...[0, 1, 2].map((i) => s.elemI(d, 'p' + i)));
      d.st.I = I;
      if (I > 13 * d.p.Ir) { d.st.trip = true; s.event('trip', `${d.name} desarmou por curto-circuito (disparo magnético, ${fmtA(I)}).`, d.id); return true; }
      return false;
    },
    update(d, s, dt) { thermalStep(d, d.st.I || 0, dt, s, 'disparo térmico do disjuntor-motor'); } },
  // relé térmico de sobrecarga: polos 1-2/3-4/5-6, 95-96 NF, 97-98 NA
  thermal: { terms: ['1', '2', '3', '4', '5', '6', '95', '96', '97', '98'], R: { '1-2': 0.005, '3-4': 0.005, '5-6': 0.005 },
    init(d) { d.st.H = 0; d.st.Ir = d.p.Ir || 1.1; },
    elems() { return [['1', '2'], ['3', '4'], ['5', '6']].map(([a, b], i) => ({ a, b, y: [200, 0], k: 'p' + i })); },
    links(d) { return d.st.trip ? [['97', '98']] : [['95', '96']]; },
    update(d, s, dt) {
      const Ip = [0, 1, 2].map((i) => s.elemI(d, 'p' + i)); d.st.Ip = Ip;
      let I = Math.max(...Ip);
      // falta de fase com motor ligado: a corrente nas fases restantes sobe — o modelo do motor já reflete isso.
      thermalStep(d, I, dt, s, 'sobrecarga');
    } },
  motor3: { terms: ['1', '2', '3', '4', '5', '6'], R: { '1-4': 18, '2-5': 18, '3-6': 18 },
    init(d) { d.st.w = 0; d.st.load = d.p.load ?? 0.8; },
    elems(d) {
      const st = d.st, wr = Math.max(0, st.w * (st.dir || 1)), lf = st.load;
      // por enrolamento (380 V, 0,606 A nominal): magnetização + rotor (rotor bloqueado ≈ 6 × In)
      const Yn = 1 / 627, slip = 1 - Math.min(1, wr / Math.max(0.05, st.fr || 1));
      const ymag = P(Yn * 0.45, -78), yrun = P(Yn * Math.max(0.05, lf) * 0.8, -12), ylr = P(Yn * 6, -62);
      const k = Math.pow(Math.max(0, Math.min(1, (slip - 0.05) / 0.95)), 1.5); // 0 em rotação plena, 1 parado
      const y = cAdd(ymag, cAdd(cMul(yrun, [1 - k, 0]), cMul(ylr, [k, 0])));
      return [['1', '4'], ['2', '5'], ['3', '6']].filter((_, i) => d.st.openW !== i).map(([a, b], i) => ({ a, b, y, k: 'w' + i }));
    },
    update(d, s, dt) {
      const st = d.st, va = s.vdc(d, '1', '4'), vb = s.vdc(d, '2', '5'), vc = s.vdc(d, '3', '6');
      const v1 = cAbs(cAdd(va, cAdd(cMul(ROT, vb), cMul(ROT2, vc)))) / 3 / VL, v2 = cAbs(cAdd(va, cAdd(cMul(ROT2, vb), cMul(ROT, vc)))) / 3 / VL;
      const net = v1 * v1 - v2 * v2, fr = s.freqOf ? s.freqOf(d) : 1;
      st.v1 = v1; st.v2 = v2; st.fr = fr;
      st.Vw = [cAbs(va), cAbs(vb), cAbs(vc)];
      st.hum = (v1 > 0.15 || v2 > 0.15) && Math.abs(net) < 0.25;
      let target = 0, rate = 1.2;
      if (Math.abs(net) >= 0.25 && fr > 0.02) {
        const dir = Math.sign(net);
        const m = Math.abs(net) * fr * fr / Math.max(fr * fr, 0.04);
        const stall = st.load > 3 * m + 0.1;
        target = stall ? 0 : dir * fr * (1 - 0.045 * st.load / Math.max(0.3, m));
        rate = 2.4 * Math.max(0.3, m) / (0.6 + st.load * 0.5);
        if (Math.sign(st.w) !== dir && Math.abs(st.w) > 0.02) rate *= 1.4; // frenagem por contracorrente na reversão
        st.dir = dir;
      } else if (Math.abs(st.w) > 0) rate = 0.9 + 0.6 * st.load;
      const dw = target - st.w;
      st.w += Math.sign(dw) * Math.min(Math.abs(dw), rate * dt);
      if (Math.abs(st.w) < 1e-3 && target === 0) st.w = 0;
      st.rpm = st.w * 1800;
      st.Iw = [0, 1, 2].map((i) => s.elemI(d, 'w' + i));
      st.running = Math.abs(st.w) > 0.05;
      st.conn = s.motorConn(d);
    } },
  // autotransformador (divisor ideal aproximado): 100% – 80% – 60% – 0
  autotrafo: { terms: ['100', '80', '60', '0'], R: { '100-0': 40 },
    elems() { const R = 2000; return [{ a: '100', b: '80', y: Y(0.2 * R), k: 'a' }, { a: '80', b: '60', y: Y(0.2 * R), k: 'b' }, { a: '60', b: '0', y: Y(0.6 * R), k: 'c' }]; } },
  // temporizador com retardo na energização: 15 comum, 16 NF, 18 NA
  timerOn: { terms: ['A1', 'A2', '15', '16', '18', '25'], R: { 'A1-A2': 2000 },
    init(d) { d.st.t = 0; d.st.T = d.p.T ?? 5; },
    elems() { return [{ a: 'A1', b: 'A2', y: Y(20000), k: 'coil' }]; },
    links(d) { return d.st.on && d.st.t >= d.st.T ? [['15', '18']] : [['15', '16']]; },
    coil(d, s) { return s.vd(d, 'A1', 'A2') > 170; },
    update(d, s, dt) { if (d.st.on) d.st.t = Math.min(d.st.T + 1, d.st.t + dt); else d.st.t = 0; } },
  // relé estrela-triângulo: 15-16 estrela (fecha ao energizar, abre após T); 15-18 triângulo (fecha 100 ms depois)
  // relé de partida estrela-triângulo RYD-01: 15-18 fecha ao energizar (estrela) e abre após T; 25-28 fecha 100 ms depois
  // (triângulo). Desenergizado: 15-16 e 25-26 fechados.
  ydRelay: { terms: ['A1', 'A2', '15', '16', '18', '25', '26', '28'], R: { 'A1-A2': 2000 },
    init(d) { d.st.t = 0; d.st.T = d.p.T ?? 5; },
    elems() { return [{ a: 'A1', b: 'A2', y: Y(20000), k: 'coil' }]; },
    links(d) {
      if (!d.st.on) return [['15', '16'], ['25', '26']];
      if (d.st.t < d.st.T) return [['15', '18'], ['25', '26']];
      if (d.st.t < d.st.T + 0.1) return [['15', '16'], ['25', '26']];
      return [['15', '16'], ['25', '28']];
    },
    coil(d, s) { return s.vd(d, 'A1', 'A2') > 170; },
    update(d, s, dt) { if (d.st.on) d.st.t = Math.min(d.st.T + 1, d.st.t + dt); else d.st.t = 0; } },
  // relé auxiliar RAX-02: dois contatos reversores 15-16/18 e 25-26/28
  auxRelay: { terms: ['A1', 'A2', '15', '16', '18', '25', '26', '28'], R: { 'A1-A2': 2000 },
    elems() { return [{ a: 'A1', b: 'A2', y: Y(20000), k: 'coil' }]; },
    links(d) { return d.st.on ? [['15', '18'], ['25', '28']] : [['15', '16'], ['25', '26']]; },
    coil(d, s) { return s.vd(d, 'A1', 'A2') > 170; } },
  // controlador temporizador digital CTD (alimentação 6-7): retardo na energização; 1 comum, 2 NA, 3 NF; 4 comum, 5 NA
  ctd: { terms: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'], R: { '6-7': 3000 },
    init(d) { d.st.t = 0; d.st.T = d.p.T ?? 5; },
    elems() { return [{ a: '6', b: '7', y: Y(30000), k: 'coil' }]; },
    links(d) { const done = d.st.on && d.st.t >= d.st.T; return done ? [['1', '2'], ['4', '5']] : [['1', '3']]; },
    coil(d, s) { return s.vd(d, '6', '7') > 170; },
    update(d, s, dt) { if (d.st.on) d.st.t = Math.min(d.st.T + 1, d.st.t + dt); else d.st.t = 0; } },
  // relé de sobrecorrente RCA: entrada de corrente -IN/+IN em série; ajuste Iset e retardo; 11 comum, 12 NF, 14 NA
  // (alimentado e sem disparo: 11-14 fechado). J-R interligados = rearme automático.
  rca: { terms: ['A1', 'A2', 'INm', 'INp', 'J', 'R', '11', '12', '14'], R: { 'A1-A2': 2000, 'INm-INp': 0.01 },
    init(d) { d.st.Iset = d.p.Iset ?? 1.3; d.st.td = d.p.td ?? 2; d.st.acc = 0; },
    elems() { return [{ a: 'A1', b: 'A2', y: Y(20000), k: 'coil' }, { a: 'INm', b: 'INp', y: [100, 0], k: 'ct' }]; },
    links(d) { return d.st.on && !d.st.trip ? [['11', '14']] : [['11', '12']]; },
    coil(d, s) { return s.vd(d, 'A1', 'A2') > 170; },
    update(d, s, dt) {
      const I = s.elemI(d, 'ct'); d.st.I = I;
      if (d.st.on && I > d.st.Iset) { d.st.acc += dt; if (!d.st.trip && d.st.acc >= d.st.td) { d.st.trip = true; s.dirty = true; s.event('trip', `${d.name} atuou por sobrecorrente (${fmtA(I)} > ajuste ${fmtA(d.st.Iset)} por ${d.st.td} s).`, d.id); } }
      else d.st.acc = Math.max(0, d.st.acc - dt);
      if (d.st.trip && I < 0.9 * d.st.Iset && s.same(d.id + '.J', d.id + '.R') && !d.st.stuck) { d.st.trip = false; s.dirty = true; s.event('info', `${d.name}: rearme automático (J-R interligados).`, d.id); }
    } },
  // relé de proteção térmica por termistor RPT: P1-P2 (PTC frio ≈ curto); alimentado e PTC normal → 11-14 fechado
  rpt: { terms: ['A1', 'A2', 'C', 'P1', 'P2', 'P3', '11', '12', '14'], R: { 'A1-A2': 2000 },
    elems() { return [{ a: 'A1', b: 'A2', y: Y(20000), k: 'coil' }]; },
    links(d) { return d.st.on && d.st.ok ? [['11', '14']] : [['11', '12']]; },
    coil(d, s) { d.st.ok = s.same(d.id + '.P1', d.id + '.P2'); return s.vd(d, 'A1', 'A2') > 170; } },
  // relés de monitoramento da rede da bancada (falta de fase, sequência, sobre/subtensão): alimentados por A1-A2
  monRelay: { terms: ['A1', 'A2', '15', '16', '18', '25'], R: { 'A1-A2': 2000 },
    elems() { return [{ a: 'A1', b: 'A2', y: Y(20000), k: 'coil' }]; },
    links(d) { return d.st.on && d.st.ok ? [['15', '18']] : [['15', '16']]; },
    coil(d, s) {
      const v = s.vd(d, 'A1', 'A2'), f = s.faults;
      const m = d.p.mon;
      d.st.ok = m === 'phase' ? !f.phaseLoss : m === 'seq' ? !f.seqSwap : m === 'over' ? !f.overV : m === 'under' ? !f.underV && v > 187 : true;
      return v > 170;
    } },
  // relé de falta e sequência de fase autoalimentado pelas fases: 11 comum, 12 NF, 14 NA
  phaseMon: { terms: ['L1', 'L2', 'L3', '11', '12', '14'], R: { 'L1-L2': 4000, 'L2-L3': 4000 },
    elems() { return [{ a: 'L1', b: 'L2', y: Y(40000), k: 'a' }, { a: 'L2', b: 'L3', y: Y(40000), k: 'b' }]; },
    links(d) { return d.st.ok ? [['11', '14']] : [['11', '12']]; },
    update(d, s) {
      const a = s.v(d, 'L1'), b = s.v(d, 'L2'), c = s.v(d, 'L3');
      const ok3 = [cSub(a, b), cSub(b, c), cSub(c, a)].every((z) => cAbs(z) > 300);
      const pos = cAbs(cAdd(a, cAdd(cMul(ROT, b), cMul(ROT2, c)))) > cAbs(cAdd(a, cAdd(cMul(ROT2, b), cMul(ROT, c))));
      const ok = ok3 && pos;
      if (ok !== d.st.ok) { d.st.ok = ok; s.dirty = true; }
    } },
  // inversor de frequência: R S T entrada, U V W saída (V/f), DI1 = gira, DI2 = reverso (contato seco com COM)
  inverter: { terms: ['R', 'S', 'T', 'U', 'V', 'W', 'DI1', 'DI2', 'COM'], R: {},
    init(d) { d.st.f = 0; d.st.fset = d.p.fset ?? 60; },
    elems() { return [{ a: 'R', b: 'S', y: Y(3000, 10), k: 'a' }, { a: 'S', b: 'T', y: Y(3000, 10), k: 'b' }]; },
    update(d, s, dt) {
      const a = s.v(d, 'R'), b = s.v(d, 'S'), c = s.v(d, 'T');
      d.st.dc = [cSub(a, b), cSub(b, c), cSub(c, a)].every((z) => cAbs(z) > 300);
      const run = d.st.dc && !d.st.fault && s.same(d.id + '.DI1', d.id + '.COM');
      const rev = s.same(d.id + '.DI2', d.id + '.COM');
      const tgt = run ? d.st.fset : 0;
      const df = tgt - d.st.f; d.st.f += Math.sign(df) * Math.min(Math.abs(df), 20 * dt); // rampa 3 s
      if (Math.abs(d.st.f) < 0.05 && !run) d.st.f = 0;
      d.st.rev = rev; d.st.run = run;
      s.dirty = s.dirty || Math.abs(df) > 0.01;
    } },
};

function thermalStep(d, I, dt, s, why) {
  const Ir = d.st.Ir || d.p.Ir || 1.1, k = I / Ir;
  d.st.H += (k * k - d.st.H) * dt / 40;           // constante térmica acelerada (didática)
  if (d.st.H < 0) d.st.H = 0;
  if (!d.st.trip && d.st.H > 1.32) {
    d.st.trip = true; s.dirty = true;
    s.event('trip', `${d.name} atuou por ${why} (${fmtA(I)} para ajuste ${fmtA(Ir)}).`, d.id);
  }
}
export const fmtA = (I) => (I >= 100 ? Math.round(I) + ' A' : I.toFixed(I < 10 ? 2 : 1).replace('.', ',') + ' A');

// ---------- álgebra complexa: eliminação gaussiana com pivotamento parcial ----------
function solveComplex(n, Ar, Ai, br, bi) {
  for (let c = 0; c < n; c++) {
    let p = c, best = -1;
    for (let r = c; r < n; r++) { const m = Ar[r][c] * Ar[r][c] + Ai[r][c] * Ai[r][c]; if (m > best) { best = m; p = r; } }
    if (best < 1e-300) continue;
    if (p !== c) { [Ar[p], Ar[c]] = [Ar[c], Ar[p]]; [Ai[p], Ai[c]] = [Ai[c], Ai[p]]; [br[p], br[c]] = [br[c], br[p]]; [bi[p], bi[c]] = [bi[c], bi[p]]; }
    const dr = Ar[c][c], di = Ai[c][c], dd = dr * dr + di * di;
    for (let r = c + 1; r < n; r++) {
      const nr = Ar[r][c], ni = Ai[r][c]; if (nr === 0 && ni === 0) continue;
      const fr = (nr * dr + ni * di) / dd, fi = (ni * dr - nr * di) / dd;
      for (let k = c; k < n; k++) { const ar = Ar[c][k], ai = Ai[c][k]; Ar[r][k] -= fr * ar - fi * ai; Ai[r][k] -= fr * ai + fi * ar; }
      br[r] -= fr * br[c] - fi * bi[c]; bi[r] -= fr * bi[c] + fi * br[c];
    }
  }
  const xr = new Float64Array(n), xi = new Float64Array(n);
  for (let r = n - 1; r >= 0; r--) {
    let sr = br[r], si = bi[r];
    for (let k = r + 1; k < n; k++) { sr -= Ar[r][k] * xr[k] - Ai[r][k] * xi[k]; si -= Ar[r][k] * xi[k] + Ai[r][k] * xr[k]; }
    const dr = Ar[r][r], di = Ai[r][r], dd = dr * dr + di * di;
    if (dd < 1e-300) { xr[r] = 0; xi[r] = 0; continue; }
    xr[r] = (sr * dr + si * di) / dd; xi[r] = (si * dr - sr * di) / dd;
  }
  return [xr, xi];
}

// ---------- union-find ----------
function UF() {
  const p = new Map();
  const f = (x) => { if (!p.has(x)) { p.set(x, x); return x; } let r = x; while (p.get(r) !== r) r = p.get(r); let y = x; while (p.get(y) !== r) { const n = p.get(y); p.set(y, r); y = n; } return r; };
  return { find: f, union: (a, b) => { const ra = f(a), rb = f(b); if (ra !== rb) p.set(ra, rb); }, keys: () => p.keys() };
}

// ---------- simulador ----------
export function createSim(spec) {
  const devs = new Map();
  for (const dd of spec.devices) {
    const d = { id: dd.id, type: dd.type, name: dd.name || dd.id, p: { ...(dd.p || {}) }, st: {} };
    const T = TYPES[d.type]; if (!T) throw new Error('tipo desconhecido ' + d.type);
    T.init && T.init(d); devs.set(d.id, d);
  }
  const staticLinks = (spec.links || []).slice();
  const s = {
    gst: { on: false, V: 220, seq: 1, loss: null, fault: false }, tripBy: null,
    spec, devs, wires: [], mainOn: false, mainTrip: false, grounding: false, faults: {}, events: [], time: 0,
    V: new Map(), group: null, elemCur: new Map(), dirty: true, lastShort: null, osc: false, wireSeq: 1,
  };
  const t = (d, k) => d.id + '.' + k;
  s.dev = (id) => devs.get(id);
  s.event = (type, msg, dev) => { s.events.push({ t: s.time, type, msg, dev }); };
  s.v = (d, k) => s.V.get(s.group.find(t(d, k))) || [0, 0];
  s.vt = (term) => (s.group ? s.V.get(s.group.find(term)) : null) || [0, 0];
  s.vdc = (d, a, b) => cSub(s.v(d, a), s.v(d, b));
  s.vd = (d, a, b) => cAbs(s.vdc(d, a, b));
  s.elemI = (d, k) => s.elemCur.get(d.id + ':' + k) || 0;
  s.same = (a, b) => !!s.group && s.group.find(a) === s.group.find(b);

  // ---- cabos ----
  s.addWire = (a, b, color = 'R', id) => { const w = { id: id ?? s.wireSeq++, a, b, color }; s.wireSeq = Math.max(s.wireSeq, w.id + 1); s.wires.push(w); s.dirty = true; return w; };
  s.removeWire = (id) => { const i = s.wires.findIndex((w) => w.id === id); if (i >= 0) { const [w] = s.wires.splice(i, 1); s.dirty = true; return w; } return null; };
  s.clearWires = () => { s.wires.length = 0; s.dirty = true; };
  s.setMain = (on) => { if (on && s.mainTrip) s.mainTrip = false; s.mainOn = !!on; s.dirty = true; };

  // ---- fontes ----
  function sources() {
    const src = new Map(Object.entries(PHASORS).map(([k, v]) => ['SRC:' + k, { v, id: k }]));
    for (const d of devs.values()) if (d.type === 'inverter' && Math.abs(d.st.f) > 0.05) {
      const m = VF * Math.min(1, d.st.f / 60), sg = d.st.rev ? -1 : 1;
      src.set(t(d, 'U'), { v: P(m, 0), id: d.id + ':U', inv: d }); src.set(t(d, 'V'), { v: P(m, -120 * sg), id: d.id + ':V', inv: d }); src.set(t(d, 'W'), { v: P(m, 120 * sg), id: d.id + ':W', inv: d });
    }
    const G = s.gst;
    if (G && G.on && !G.fault) {
      const sg = G.seq < 0 ? -1 : 1;
      for (const [k, ang] of [['R', 0], ['S', -120 * sg], ['T', 120 * sg]]) if (G.loss !== k) src.set('GST.' + k, { v: P(G.V, ang), id: 'GST-' + k, gst: true });
      src.set('GST.N', { v: [0, 0], id: 'N', gst: true });
    }
    return src;
  }
  s.freqOf = (d) => {
    for (const inv of devs.values()) if (inv.type === 'inverter') for (const k of ['1', '2', '3', '4', '5', '6']) for (const o of ['U', 'V', 'W']) if (s.same(t(d, k), t(inv, o))) return Math.abs(inv.st.f) / 60;
    return 1;
  };
  // fechamento do motor: estrela (Y), triângulo (Δ) ou indefinido
  s.motorConn = (d) => {
    const g = (k) => s.group.find(t(d, k));
    if (g('4') === g('5') && g('5') === g('6')) return 'Y';
    if (g('1') === g('6') && g('2') === g('4') && g('3') === g('5')) return 'Δ';
    if (g('1') === g('5') && g('2') === g('6') && g('3') === g('4')) return 'Δ';
    return '';
  };

  // ---- uma solução da rede no estado atual dos contatos ----
  function solveOnce() {
    const uf = UF(), elems = [];
    const src = sources();
    for (const w of s.wires) if (!(s.faults.brokenWire === w.id)) uf.union(w.a, w.b);
    for (const [a, b] of staticLinks) uf.union(a, b);
    for (const d of devs.values()) {
      const T = TYPES[d.type];
      if (T.links) for (const [a, b] of T.links(d, s)) uf.union(a.includes('.') || a.includes(':') ? a : t(d, a), b.includes('.') || b.includes(':') ? b : t(d, b));
      if (T.elems) for (const e of T.elems(d, s)) elems.push({ ...e, d, A: t(d, e.a), B: t(d, e.b) });
    }
    for (const k of src.keys()) uf.find(k);
    s.group = uf;
    // grupos com fonte
    const gsrc = new Map(); let short = null;
    for (const [k, o] of src) {
      const g = uf.find(k), prev = gsrc.get(g);
      if (prev && prev.id !== o.id && !short) short = { a: prev, b: o, g };
      if (!prev) gsrc.set(g, o);
    }
    if (short) return { short };
    // incógnitas
    const idx = new Map(); let n = 0;
    for (const e of elems) for (const T of [e.A, e.B]) { const g = uf.find(T); if (!gsrc.has(g) && !idx.has(g)) idx.set(g, n++); }
    const Ar = Array.from({ length: n }, () => new Float64Array(n)), Ai = Array.from({ length: n }, () => new Float64Array(n));
    const br = new Float64Array(n), bi = new Float64Array(n);
    for (let i = 0; i < n; i++) Ar[i][i] = 1e-9; // fuga desprezível (evita nós flutuantes singulares)
    for (const e of elems) {
      const ga = uf.find(e.A), gb = uf.find(e.B); e.ga = ga; e.gb = gb;
      if (ga === gb) continue;
      const ia = idx.get(ga), ib = idx.get(gb), [yr, yi] = e.y;
      if (ia !== undefined) { Ar[ia][ia] += yr; Ai[ia][ia] += yi; }
      if (ib !== undefined) { Ar[ib][ib] += yr; Ai[ib][ib] += yi; }
      if (ia !== undefined && ib !== undefined) { Ar[ia][ib] -= yr; Ai[ia][ib] -= yi; Ar[ib][ia] -= yr; Ai[ib][ia] -= yi; }
      else if (ia !== undefined) { const v = gsrc.get(gb).v; br[ia] += yr * v[0] - yi * v[1]; bi[ia] += yr * v[1] + yi * v[0]; }
      else if (ib !== undefined) { const v = gsrc.get(ga).v; br[ib] += yr * v[0] - yi * v[1]; bi[ib] += yr * v[1] + yi * v[0]; }
    }
    const [xr, xi] = n ? solveComplex(n, Ar, Ai, br, bi) : [[], []];
    const V = new Map();
    for (const [g, o] of gsrc) V.set(g, o.v);
    for (const [g, i] of idx) V.set(g, [xr[i], xi[i]]);
    s.V = V;
    s.elemCur = new Map();
    const srcCur = new Map();
    for (const e of elems) {
      const va = V.get(e.ga) || [0, 0], vb = V.get(e.gb) || [0, 0];
      const I = cMul(e.y, cSub(va, vb)), m = cAbs(I);
      s.elemCur.set(e.d.id + ':' + e.k, m);
      for (const [g, sgn] of [[e.ga, 1], [e.gb, -1]]) if (gsrc.has(g)) { const id = gsrc.get(g).id; const c = srcCur.get(id) || [0, 0]; srcCur.set(id, [c[0] + sgn * I[0], c[1] + sgn * I[1]]); }
    }
    s.srcCur = srcCur;
    return { ok: true, n };
  }

  function handleShort(sh) {
    const ids = [sh.a.id, sh.b.id];
    const inv = sh.a.inv || sh.b.inv;
    s.lastShort = { ids, t: s.time };
    if (inv) { inv.st.fault = 'F0001 sobrecorrente'; inv.st.f = 0; s.event('trip', `Inversor ${inv.name}: falha de sobrecorrente na saída (curto entre ${ids.join(' e ')}).`, inv.id); return; }
    if (ids.some((x) => String(x).startsWith('GST')) && s.gst) { s.gst.fault = true; s.event('short', `Curto na saída do GST (${ids.join(' – ')}): o gerador desligou as saídas por sobrecorrente.`); return; }
    const pe = ids.includes('PE');
    const nn = ids.includes('N');
    s.mainTrip = true; s.tripBy = pe ? 'DR' : 'QF0';
    let msg;
    if (s.grounding) msg = 'Energização com o ATERRAMENTO TEMPORÁRIO instalado: curto-circuito franco para a terra. O disjuntor geral da bancada desarmou.';
    else if (pe && nn) msg = 'Neutro em contato com o PE após o DR: o dispositivo DR (30 mA) da bancada desarmou.';
    else if (pe) msg = `Fuga franca de ${ids.find((x) => x !== 'PE')} para a terra (PE): o DR e o disjuntor geral da bancada desarmaram.`;
    else if (nn) msg = `Curto-circuito fase-neutro (${ids.join('–')}, 220 V): o disjuntor geral da bancada desarmou.`;
    else msg = `Curto-circuito entre fases ${ids.join('–')} (380 V): o disjuntor geral da bancada desarmou.`;
    s.event('short', msg);
  }

  // ---- acomoda o estado (contatores, proteções) até ficar estável ----
  s.settle = () => {
    s.osc = false;
    for (let it = 0; it < 40; it++) {
      const r = solveOnce();
      if (r.short) { handleShort(r.short); continue; }
      let changed = false;
      for (const d of devs.values()) { const T = TYPES[d.type]; if (T.protect && T.protect(d, s)) changed = true; }
      if (changed) continue;
      // disparo magnético do geral (sobrecorrente da fonte)
      for (const [id, I] of s.srcCur) if (cAbs(I) > 150 && !s.mainTrip && id !== 'PE') { s.mainTrip = true; s.event('short', `Sobrecorrente de ${fmtA(cAbs(I))} na fase ${id}: o disjuntor geral da bancada desarmou (curto através de carga de baixa impedância).`); changed = true; break; }
      if (changed) continue;
      for (const d of devs.values()) {
        const T = TYPES[d.type]; if (!T.coil) continue;
        const on = T.coil(d, s);
        // um dispositivo por iteração: modela a "corrida" entre bobinas (quem fecha primeiro abre o intertravamento do outro)
        if (on !== !!d.st.on) { d.st.on = on; changed = true; if (on && (T === TYPES.timerOn || T === TYPES.ydRelay)) d.st.t = 0; break; }
      }
      if (!changed) { s.dirty = false; return true; }
      if (it === 39) { s.osc = true; s.event('warn', 'O circuito não estabiliza (contator "batendo"/oscilando). Verifique o selo e os contatos NF em série com a própria bobina.'); }
    }
    s.dirty = false; return false;
  };

  s.step = (dt) => {
    s.time += dt;
    s.settle();
    for (const d of devs.values()) { const T = TYPES[d.type]; T.update && T.update(d, s, dt); }
    // o que mudou nas atualizações temporais (temporizadores, térmico, motor) vale na próxima solução
    s.settle();
  };

  // ---- comandos do usuário ----
  s.press = (id, v) => { const d = devs.get(id); if (!d) return; d.st.pressed = !!v; s.dirty = true; };
  s.toggleLatch = (id) => { const d = devs.get(id); d.st.latched = !d.st.latched; s.dirty = true; return d.st.latched; };
  s.setPos = (id, pos) => { const d = devs.get(id); d.st.pos = pos; s.dirty = true; };
  s.reset = (id) => {
    const d = devs.get(id); if (!d) return false;
    if (d.type === 'thermal') { if (d.st.stuck) return false; if (d.st.H > 1.05) return false; d.st.trip = false; s.dirty = true; return true; }
    if (d.type === 'breaker3') { if (d.st.H > 1.05) return false; d.st.trip = false; d.st.closed = true; s.dirty = true; return true; }
    if (d.type === 'inverter') { d.st.fault = null; return true; }
    return false;
  };
  s.testTrip = (id) => { const d = devs.get(id); d.st.trip = true; d.st.H = Math.max(d.st.H || 0, 1.0); s.event('info', `${d.name}: botão TESTE acionado — contato 95-96 abriu.`, id); s.dirty = true; };

  // ---- multímetro ----
  s.measureV = (a, b) => { if (!s.group) s.settle(); return cAbs(cSub(s.vt(a), s.vt(b))); };
  // resistência DC entre dois bornes (com a bancada desenergizada); devolve Infinity se aberto
  s.measureR = (a, b) => {
    const uf = UF(), R = [];
    for (const w of s.wires) if (!(s.faults.brokenWire === w.id)) uf.union(w.a, w.b);
    for (const [x, y] of staticLinks) uf.union(x, y);
    for (const d of devs.values()) {
      const T = TYPES[d.type];
      if (T.links) for (const [x, y] of T.links({ ...d }, { ...s, mainOn: false })) { const X = x.includes('.') || x.includes(':') ? x : t(d, x), Yy = y.includes('.') || y.includes(':') ? y : t(d, y); if (!X.startsWith('SRC:') && !Yy.startsWith('SRC:')) uf.union(X, Yy); }
      if (T.R && !(d.type === 'contactor' && d.st.burnt)) for (const [k, r] of Object.entries(T.R)) { if (d.type === 'motor3' && d.st.openW !== undefined && ['1-4', '2-5', '3-6'][d.st.openW] === k) continue; if ((d.type === 'breaker3' && (!d.st.closed || d.st.trip))) continue; const [x, y] = k.split('-'); R.push([t(d, x), t(d, y), r]); }
    }
    const ga = uf.find(a), gb = uf.find(b);
    if (ga === gb) return 0.1;
    const idx = new Map(); let n = 0; const id = (g) => { if (g === gb) return -1; if (!idx.has(g)) idx.set(g, n++); return idx.get(g); };
    id(ga);
    const E = R.map(([x, y, r]) => [id(uf.find(x)), id(uf.find(y)), 1 / r]);
    const A = Array.from({ length: n }, () => new Float64Array(n)), Z = Array.from({ length: n }, () => new Float64Array(n));
    const bb = new Float64Array(n), bz = new Float64Array(n);
    for (let i = 0; i < n; i++) A[i][i] = 1e-9;
    for (const [i, j, g] of E) { if (i === j) continue; if (i >= 0) A[i][i] += g; if (j >= 0) A[j][j] += g; if (i >= 0 && j >= 0) { A[i][j] -= g; A[j][i] -= g; } }
    bb[idx.get(ga)] = 1;
    const [x] = solveComplex(n, A, Z, bb, bz);
    const r = x[idx.get(ga)];
    return r > 2e7 ? Infinity : r + 0.1;
  };
  s.energized = () => s.mainOn && !s.mainTrip;

  // ---- conectividade só por cabos + ligações fixas (para a correção da montagem) ----
  s.staticNet = () => {
    const uf = UF();
    for (const w of s.wires) uf.union(w.a, w.b);
    for (const [a, b] of staticLinks) uf.union(a, b);
    return uf;
  };
  // clone sem estado de cabos rompidos (para testes funcionais automáticos)
  s.clone = () => {
    const c = createSim(spec);
    for (const w of s.wires) c.addWire(w.a, w.b, w.color, w.id);
    for (const d of devs.values()) { const cd = c.dev(d.id); if (d.type === 'thermal') cd.st.Ir = d.st.Ir; if (d.p.T) cd.st.T = d.st.T; }
    return c;
  };
  return s;
}
