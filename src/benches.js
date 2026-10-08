// DONO: agente "bancadas". Fila de bancadas didáticas (painel frontal com contatores, bornes, instrumentos, trilhos DIN,
// chapa perfurada, prateleira inclinada, estrutura tubular, cabos de teste pendurados, cabos descendo do teto).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BENCH_ROW, BENCHES, ROOM } from './layout.js?v=20261008192305';
import * as TX from './benches_tex.js?v=20261008192305';
import * as PG from './benches_parts.js?v=20261008192305';
import { LAYOUTS, TITLES } from './benches_layouts.js?v=20261008192305';

const LW = 1.73, LH = 0.93;            // face nominal do layout (m)
const JC = { K: 0x161616, R: 0xc41c1c, W: 0xe4e4dc, B: 0x1c4fc8, Y: 0xe8bf12, G: 0x1f9a3c };
const BC = { R: 0xd01a18, G: 0x1e9c3a, Y: 0xf0c418, K: 0x1a1a1a, B: 0x1f5fd0, W: 0xeeeeee };

const INFO = {
  b1: `<p><b>Treina:</b> proteção de motores e circuitos — partida direta com proteção, relés de falta de fase, sequência de fase, sub/sobretensão, temporizadores e relé de proteção térmica (TCS).</p>
<p><b>Componentes:</b> 5 contatores tripolares em trilho DIN, disjuntor-motor, relé térmico, 7 relés de proteção, 2 medidores digitais, auto-transformador e barramentos L1/L2/L3/N com bornes de 4 mm. Na prateleira, o medidor de grandezas trifásicas.</p>
<p><b>NR-10:</b> montar e alterar ligações só desenergizado; confirmar ausência de tensão com o medidor; cabos de teste íntegros, categoria adequada; botão de emergência ao alcance.</p>`,
  b2: `<p><b>Treina:</b> comandos industriais — partida direta, reversão, estrela-triângulo, soft-starter e inversor de frequência, sinalização e intertravamentos.</p>
<p><b>Componentes:</b> inversor de frequência, soft-starter, 4 contatores, 3 relés térmicos, botoeiras (liga/desliga/emergência), sinaleiros, sirene, horímetro, medidores e barramentos verticais.</p>
<p><b>NR-10:</b> bloqueio e etiquetagem na chave geral antes de religar o circuito; aguardar descarga do barramento CC do inversor; teste de emergência antes de iniciar.</p>`,
  b3: `<p><b>Treina:</b> proteção e seletividade — relés de proteção, temporização, disjuntores e diagramas unifilares.</p>
<p><b>Componentes:</b> contatores, relés de proteção e temporizadores, barramentos de bornes, botoeiras e emergência.</p>
<p><b>NR-10:</b> procedimento de trabalho escrito, APR preenchida e uso de EPI (óculos, luvas isolantes quando aplicável).</p>`,
  b4: `<p><b>Treina:</b> proteção de sistemas — relés de sobrecorrente, falta de fase e monitoramento de tensão.</p>
<p><b>Componentes:</b> relés de proteção em caixa preta, contatores, relés modulares, bornes e emergência.</p>
<p><b>NR-10:</b> zona controlada: só pessoas autorizadas; conferir aterramento da bancada antes de energizar.</p>`,
  b5: `<p><b>Treina:</b> comandos elétricos básicos — circuitos de comando e força, sinalização e partida de motores.</p>
<p><b>Componentes:</b> contatores, relés, botoeiras, sinaleiros e bornes de ligação.</p>
<p><b>NR-10:</b> desenergizar, bloquear, testar ausência de tensão e só então montar as ligações.</p>`,
};

export function buildBenches(scene, ctx) {
  const renderer = ctx && ctx.renderer, q = (ctx && ctx.q) || 'high', low = q === 'low';
  const g = new THREE.Group(); g.name = 'benches';
  const hotspots = [], faces = [];
  const pitch = Math.abs(BENCH_ROW.pitch);
  const PW = Math.min((BENCH_ROW.width || 1.8) + 0.02, pitch - 0.03);   // largura real do painel (quase encostados, como na foto)
  // O painel é modelado em escala nominal (1,8 x 1,0 m) e reduzido uniformemente para a largura do layout.
  const PS = Math.min(0.76, PW / 1.5), NPW = PW / PS, PB = 0.84, PTOP = PB + PS, PDw = 0.3 * PS;  // PB/PTOP calibrados pela foto 1
  const SX = (NPW - 0.08) / LW;

  // ---------- materiais ----------
  const noise = TX.noiseTex(renderer, 256, 150, 60, 9);
  const noiseRep = noise.clone(); noiseRep.repeat.set(4, 4); noiseRep.needsUpdate = true;
  const mGray = new THREE.MeshStandardMaterial({ color: 0xc9cccd, roughness: 0.75, metalness: 0.05, roughnessMap: noiseRep, bumpMap: noiseRep, bumpScale: 0.06 });
  const mTube = new THREE.MeshStandardMaterial({ color: 0xa9adb0, roughness: 0.5, metalness: 0.35, roughnessMap: noiseRep, bumpMap: noiseRep, bumpScale: 0.08 });
  const mBlack = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.7 });
  const mVC = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.0 });
  const mRail = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.38, metalness: 0.55 });
  const mCable = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 });
  const mPerf = []; // por bancada (densidade dos furos)
  const perfA = TX.perfTex(renderer, 10, 3, 0.2, 3), perfB = TX.perfTex(renderer, 11, 5, 0.19, 4);
  for (const p of [perfA, perfB]) mPerf.push(new THREE.MeshStandardMaterial({ map: p.map, alphaMap: p.alpha, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.05 }));
  const shelfT = TX.shelfTex(renderer, 11, 26), shelfT2 = TX.shelfTex(renderer, 12, 9);
  const mShelf = [new THREE.MeshStandardMaterial({ map: shelfT, roughness: 0.6, metalness: 0.15, roughnessMap: noiseRep }), new THREE.MeshStandardMaterial({ map: shelfT2, roughness: 0.6, metalness: 0.15, roughnessMap: noiseRep })];
  const GST = TX.gstTex(renderer);
  const mModFace = new THREE.MeshStandardMaterial({ map: GST.tex, roughness: 0.5 });
  const mModBody = new THREE.MeshStandardMaterial({ color: 0xdfe2e3, roughness: 0.6, roughnessMap: noiseRep });
  const dispMat = {};
  for (const k of ['red', 'blue', 'green']) { const t = TX.displayTex(renderer, k); dispMat[k] = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.9, roughness: 0.2 }); }
  const domeMat = {
    R: [new THREE.MeshStandardMaterial({ color: 0xff3020, emissive: 0xff2010, emissiveIntensity: 1.6, roughness: 0.25 }), new THREE.MeshStandardMaterial({ color: 0x9a1810, emissive: 0x300000, roughness: 0.25 })],
    G: [new THREE.MeshStandardMaterial({ color: 0x40ff60, emissive: 0x10ff30, emissiveIntensity: 1.4, roughness: 0.25 }), new THREE.MeshStandardMaterial({ color: 0x1f8a30, emissive: 0x002a08, roughness: 0.25 })],
    Y: [new THREE.MeshStandardMaterial({ color: 0xffd040, emissive: 0xffb000, emissiveIntensity: 1.4, roughness: 0.25 }), new THREE.MeshStandardMaterial({ color: 0xd8a818, emissive: 0x302000, roughness: 0.25 })],
  };

  // ---------- registro de instâncias (todas as bancadas juntas) ----------
  const defs = {
    jack: [PG.jackGeo(q), mVC], contactor: [PG.contactorGeo(), mVC], contactorS: [PG.contactorGeo(), mVC],
    relay: [PG.relayGeo('relay'), mVC], timer: [PG.relayGeo('timer'), mVC], breaker: [PG.breakerGeo(), mVC], prot: [PG.protRelayGeo(), mVC],
    rail: [PG.railGeo(), mRail], button: [PG.buttonGeo(), mVC], bezel: [PG.bezelGeo(), mVC], selector: [PG.selectorGeo(), mVC],
    emerg: [PG.emergGeo(), mVC], meter: [PG.meterGeo(), mVC], screw: [PG.screwGeo(), mRail], box: [PG.unitBox(), mVC], plug: [PG.plugGeo(), mVC],
    k3rt: [PG.contactor3rtGeo(), mVC], ctd: [PG.ctdGeo(), mVC], tall: [PG.tallRelayGeo(false), mVC], tallD: [PG.tallRelayGeo(true), mVC],
    brk3: [PG.breakerNGeo(3, false), mVC], dr4: [PG.breakerNGeo(4, true), mVC],
    tube: [PG.box(1, 1, 1, 0, 0, 0, 0xffffff), mTube], foot: [PG.cylZ(0.022, 0.018, 0, 0x202020, 12), mVC],
  };
  for (const k of ['red', 'blue', 'green']) defs['disp_' + k] = [PG.displayPlane(), dispMat[k]];
  const dome = PG.domeGeo();
  for (const c of 'RGY') for (const on of [0, 1]) defs[`dome${c}${on}`] = [dome, domeMat[c][on ? 0 : 1]];
  const inst = {}; for (const k in defs) inst[k] = { m: [], c: [] };
  const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler(), tmpC = new THREE.Color();
  function put(key, parent, x, y, z, sx = 1, sy = 1, sz = 1, color = 0xffffff, rx = 0, ry = 0, rz = 0) {
    tmpE.set(rx, ry, rz); tmpQ.setFromEuler(tmpE);
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), tmpQ, new THREE.Vector3(sx, sy, sz));
    m.premultiply(parent);
    inst[key].m.push(m); inst[key].c.push(tmpC.set(color).clone());
  }
  // tubos (cabos) mesclados por grupo
  const cableGeos = { wireW: [], wireR: [], lead: [], ceiling: [] };
  function tube(listKey, pts, radius, color, segs, rad = 4, parent) {
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const geo = new THREE.TubeGeometry(curve, segs, radius, rad, false);
    if (parent) geo.applyMatrix4(parent);
    const c = new THREE.Color(color), n = geo.attributes.position.count, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
    geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); geo.deleteAttribute('uv');
    cableGeos[listKey].push(geo);
  }

  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const rnd = TX.rng(77);

  BENCHES.forEach((b, bi) => {
    const bench = new THREE.Group(); bench.name = 'bench_' + b.id;
    const wx = BENCH_ROW.x - PDw / 2 + 0.02, wz = BENCH_ROW.z0 + bi * BENCH_ROW.pitch;
    bench.position.set(wx, 0, wz); bench.rotation.y = -Math.PI / 2; bench.updateMatrixWorld(true);
    const BM = bench.matrixWorld.clone();
    g.add(bench);

    const panel = new THREE.Group(); panel.position.y = PB - PS; panel.scale.setScalar(PS); bench.add(panel); panel.updateMatrixWorld(true);
    const PM = panel.matrixWorld.clone();
    {
    const PW = NPW, PH = 1.0, PY0 = 1.0, PD = 0.3, FCY = 1.5, BM = PM;
    // ---------- gabinete do painel ----------
    const cab = new THREE.Mesh(new THREE.BoxGeometry(PW, PH, PD), mGray);
    cab.position.set(0, FCY, -PD / 2 - 0.004); cab.castShadow = true; cab.receiveShadow = true; panel.add(cab);
    const FW = PW - 0.08, FH = PH - 0.08;
    // face serigrafada
    const ppm = low ? 700 : 1250;
    const P = TX.facePainter(LW, LH, ppm);
    const faceMat = b.id === 'b1' ? new THREE.MeshPhysicalMaterial({ color: 0xdcdcdc, roughness: 0.55, clearcoat: 0.2, clearcoatRoughness: 0.35 }) : new THREE.MeshPhysicalMaterial({ color: 0xcfd1d2, roughness: 0.72, clearcoat: 0.1, clearcoatRoughness: 0.4 });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(FW, FH), faceMat);
    face.position.set(0, FCY, 0); face.receiveShadow = true; panel.add(face);
    // moldura (borda cinza levemente saliente)
    const fr = 0.04 / PS;
    for (const [w, h, x, y] of [[PW, fr, 0, PY0 + PH - fr / 2], [PW, fr, 0, PY0 + fr / 2], [fr, PH, -PW / 2 + fr / 2, FCY], [fr, PH, PW / 2 - fr / 2, FCY]]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.012), mGray); m.position.set(x, y, 0.0); m.receiveShadow = true; panel.add(m);
    }
    for (const [x, y] of [[-1, -1], [-1, 1], [1, -1], [1, 1], [0, 1], [0, -1]]) put('screw', BM, x * (PW / 2 - 0.018), FCY + y * (PH / 2 - 0.018), 0.006, 1, 1, 1, 0xffffff);

    // ---------- API de layout ----------
    const Z0 = 0.0;
    const px = (x) => x * SX, py = (y) => FCY + y;
    const A = {
      P,
      label(t, x, y, s = 0.009, o = {}) { P.text(t, x, y, s, { weight: 700, color: '#262626', ...o }); },
      jack(x, y, c = 'K', label) {
        put('jack', BM, px(x), py(y), Z0, 1, 1, 1, JC[c] ?? c);
        P.circle(x, y, 0.0092, 'rgba(0,0,0,0.18)');
        if (label) A.label(label, x, y + 0.0155, 0.0085);
      },
      jrow(x0, y, dx, cols, labels) { [...cols].forEach((c, i) => A.jack(x0 + i * dx, y, c, labels && labels[i])); },
      jcol(x, y0, dy, cols, labels) { [...cols].forEach((c, i) => A.jack(x, y0 + i * dy, c, labels && labels[i])); },
      rail(x0, x1, y, sy = 1) { put('rail', BM, px((x0 + x1) / 2), py(y), Z0, (x1 - x0) * SX, sy, 1); },
      dev(key, x, y, sx = 1, sy = 1) { put(key, BM, px(x), py(y), Z0 + 0.0075, sx, sy, 1, 0xffffff); },
      ctd(x, y) { put('ctd', BM, px(x), py(y), Z0, 1, 1, 1, 0xffffff); },
      mini(x, y) { put('jack', BM, px(x), py(y), Z0, 0.55, 0.55, 0.7, JC.K); P.circle(x, y, 0.0062, 'rgba(0,0,0,0.25)'); },
      wire(jx, jy, ex, ey, ez, col = 0xf4f4f2) {
        if (low) return;
        const x0 = px(jx), y0 = py(jy), s = ey > y0 ? 1 : -1;
        tube('wireW', [V(x0, y0, 0.013), V(x0, y0 + s * 0.008, 0.032), V((x0 + ex) / 2, ey - s * 0.018, ez + 0.016), V(ex, ey - s * 0.004, ez)], 0.0016, col, 8, 4, BM);
      },
      k3rt(x, y, xs, topY, botY) {
        const X = px(x), Y = py(y), zc = Z0 + 0.0075;
        put('k3rt', BM, X, Y, zc, 1, 1, 1, 0xffffff);
        const tx = [-0.019, -0.0065, 0.006, 0.025, 0.025], ty = [0.04, 0.04, 0.04, 0.028, 0.028], tz = [0.09, 0.09, 0.09, 0.077, 0.077];
        xs.forEach((jx, i) => { A.wire(jx, topY, X + tx[i], Y + ty[i], zc + tz[i]); A.wire(jx, botY, X + tx[i], Y - ty[i], zc + tz[i]); });
      },
      relayWires(x, y, xs, jy) { const X = px(x), Y = py(y); xs.forEach((jx, i) => A.wire(jx, jy, X - 0.009 + Math.min(i, 2) * 0.009, Y + 0.05, Z0 + 0.06)); },
      shortWires(x, y, cols, dx = 0.021) {
        if (low) return;
        const X = px(x), Y = py(y);
        cols.forEach((c, i) => { const x0 = X + (i - (cols.length - 1) / 2) * dx; tube('wireW', [V(x0, Y, 0.05), V(x0, Y + 0.02, 0.06), V(x0 + 0.01, Y + 0.035, 0.03), V(x0 + 0.012, Y + 0.04, 0.012)], 0.0018, c, 8, 4, BM); });
      },
      jumpers(x0, y0, x1, y1) {
        if (low) return;
        for (const xx of [x0, x1]) { const X = px(xx); tube('wireW', [V(X, py(y0), 0.014), V(X, py(y0) - 0.01, 0.04), V(X + 0.004, py(y1) + 0.01, 0.045), V(X + 0.006, py(y1), 0.02)], 0.0016, 0xf4f4f2, 8, 4, BM); }
      },
      K(x, y, name, o = {}) {
        const X = px(x), Y = py(y), zc = Z0 + 0.0075;
        put('contactor', BM, X, Y, zc, 1, 1, 1, 0xffffff);
        const cols = o.topCols || 'KWRKR', dx = o.small ? 0.024 : 0.028, x0 = x - dx * 2 - 0.004;
        A.jrow(x0, y + 0.092, dx, cols, o.small ? null : ['L1', 'L2', 'L3', 'NO', 'A1']);
        A.jrow(x0, y - 0.094, dx, cols, o.small ? null : ['T1', 'T2', 'T3', 'NO', 'A2']);
        if (name) A.label(name, x - 0.068, y + 0.04, 0.0095);
        if (o.noWires || low) return;
        // fios brancos dos bornes aos terminais do contator
        const term = [[-0.045, 0.043, 0.082], [-0.03, 0.043, 0.082], [-0.015, 0.043, 0.082], [0.012, 0.05, 0.07], [0.036, 0.05, 0.07]];
        for (let i = 0; i < 5; i++) for (const s of [1, -1]) {
          const jx = px(x0 + i * dx), jy = py(y + s * (s > 0 ? 0.092 : 0.094));
          const [tx, ty, tz] = term[i];
          const ex = X + tx, ey = Y + s * ty, ez = zc + tz;
          tube('wireW', [V(jx, jy, 0.013), V(jx, jy - s * 0.008, 0.03 + i * 0.003), V((jx + ex) / 2, ey + s * 0.02, ez + 0.012), V(ex, ey + s * 0.004, ez)], 0.0016, 0xf4f4f2, 8, 4, BM);
        }
      },
      relay(x, y, kind, name, o = {}) {
        const X = px(x), Y = py(y), zc = Z0 + 0.0075;
        if (kind === 'breaker3') put('breaker', BM, X, Y, zc, 1.9, 1.15, 1.2, 0xffffff);
        else if (kind === 'thermal') put('relay', BM, X, Y, zc, 1.9, 1.15, 1.25, 0xffffff);
        else if (kind === 'prot') put('prot', BM, X, Y, zc, 0.8, 1.2, 1.2, 0xffffff);
        else put(kind, BM, X, Y, zc, 1.2, 1.2, 1.25, 0xffffff);
        if (kind !== 'prot' && kind !== 'breaker3' && kind !== 'thermal') put('box', BM, X + 0.031, Y - 0.004, zc, 0.012, 0.098, 0.05, 0x1a1a1c);
        const row = (spec, yy) => { if (!spec) return; const [cols, labs] = spec; const dx = 0.026; A.jrow(x - dx * (cols.length - 1) / 2, yy, dx, cols, labs); };
        row(o.top === undefined ? ['RKK', ['A1', '15', '25']] : o.top, y + 0.1);
        row(o.bot === undefined ? ['KKR', ['16', '18', 'A2']] : o.bot, y - 0.1);
        row(o.bot2, y - 0.075);
        if (name) A.label(name, x - 0.03, y + 0.058, 0.0075);
        if (o.top !== null && !low) {
          const n = (o.top || ['RKK'])[0].length;
          for (let i = 0; i < n; i++) {
            const jx = px(x - 0.026 * (n - 1) / 2 + i * 0.026), jy = py(y + 0.1), ex = X - 0.011 + i * 0.011, ey = Y + 0.041, ez = zc + 0.06;
            tube('wireW', [V(jx, jy, 0.013), V(jx, jy - 0.01, 0.035), V(ex, ey + 0.018, ez + 0.02), V(ex, ey + 0.003, ez)], 0.0016, 0xf4f4f2, 8, 4, BM);
          }
        }
      },
      btn(x, y, c, label, sc = 1) { put('button', BM, px(x), py(y), Z0, sc, sc, sc, BC[c]); if (label) A.label(label, x, y + 0.026, 0.0075); P.circle(x, y, 0.018 * sc, 'rgba(0,0,0,0.12)'); },
      lamp(x, y, c, label, s = 1, on = false) {
        put('bezel', BM, px(x), py(y), Z0, s, s, s, 0xffffff); put(`dome${c}${on ? 1 : 0}`, BM, px(x), py(y), Z0, s, s, s);
        if (label) A.label(label, x, y + 0.026, 0.0075);
      },
      sel(x, y, sc, rz = -0.6) { put('selector', BM, px(x), py(y), Z0, sc || 1, sc || 1, sc || 1, 0xffffff, 0, 0, rz); if (!sc) A.label('0   1', x, y + 0.026, 0.0075); },
      knob(x, y, col = 0x1a1a1a) { put('button', BM, px(x), py(y), Z0, 0.8, 0.8, 1.2, col); },
      keySwitch(x, y) { put('selector', BM, px(x), py(y), Z0, 0.8, 0.8, 0.8, 0xffffff); put('box', BM, px(x) + 0.01, py(y) - 0.03, 0.02, 0.018, 0.035, 0.002, 0xd8b890, 0, 0, 0.2); },
      emerg(x, y) {
        P.circle(x, y, 0.036, '#f2c514'); P.circle(x, y, 0.036, 'rgba(0,0,0,0.3)', 0.0015);
        P.text('EMERGÊNCIA', x, y - 0.043, 0.007, { weight: 700 });
        put('emerg', BM, px(x), py(y), Z0, 1, 1, 1, 0xffffff);
      },
      meter(x, y, s = 1, disp = 'red') {
        put('meter', BM, px(x), py(y), Z0, s, s, 1, 0xffffff);
        put('disp_' + disp, BM, px(x), py(y), Z0, s, s, 1);
        if (disp === 'blue') for (let i = 0; i < 4; i++) put('box', BM, px(x) + (-0.018 + i * 0.012) * s, py(y) - 0.02 * s, 0.03, 0.008 * s, 0.005 * s, 0.003, 0x2f6fe0);
      },
      box(x, y, w, h, d, col, z0 = 0) { put('box', BM, px(x), py(y), Z0 + z0, w, h, d, col); },
      strip(x0, x1, y, h, col) { P.rect((x0 + x1) / 2, y, x1 - x0, h, col); P.rect((x0 + x1) / 2, y - h / 2, x1 - x0, 0.0015, 'rgba(0,0,0,0.18)'); },
      vstrip(x, y0, y1, w, col) { P.rect(x, (y0 + y1) / 2, w, y1 - y0, col); },
      hole(x, y, r) { P.circle(x, y, r + 0.004, 'rgba(255,255,255,0.5)'); P.circle(x, y, r, '#0c0c0c'); },
      brand(x, y, s) {
        const gg = P.g; gg.save(); gg.fillStyle = '#1b1b1b';
        const X = P.X(x - s * 2.4), Y = P.Y(y), S = P.S(s);
        gg.beginPath(); gg.moveTo(X, Y + S * 0.5); gg.lineTo(X + S * 0.45, Y - S * 0.55); gg.lineTo(X + S * 0.9, Y + S * 0.5); gg.lineTo(X + S * 0.62, Y + S * 0.5);
        gg.lineTo(X + S * 0.45, Y + S * 0.05); gg.lineTo(X + S * 0.28, Y + S * 0.5); gg.closePath(); gg.fill(); gg.restore();
        P.text('ALTRONIC', x + s * 0.5, y, s * 0.72, { weight: 800, color: '#1b1b1b', font: 'Arial Black, Arial, sans-serif' });
      },
      siren(x, y) {
        const gg = P.g; P.circle(x, y, 0.045, '#e8e8e4');
        gg.save(); gg.strokeStyle = '#1a1a1a'; gg.lineWidth = P.S(0.004);
        for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2; gg.beginPath(); gg.moveTo(P.X(x + Math.cos(a) * 0.012), P.Y(y + Math.sin(a) * 0.012)); gg.lineTo(P.X(x + Math.cos(a) * 0.042), P.Y(y + Math.sin(a) * 0.042)); gg.stroke(); }
        gg.restore(); put('button', BM, px(x), py(y), Z0, 3.4, 3.4, 0.5, 0xdedede);
      },
      redWires(x, y, w) {
        if (low) return;
        for (let k = 0; k < 12; k++) {
          const x0 = px(x - w / 2 + (k / 11) * w), dy = 0.05 + rnd() * 0.07;
          tube('wireR', [V(x0, py(y), 0.06), V(x0 + 0.01, py(y) - dy, 0.09), V(x0 - 0.02 + rnd() * 0.03, py(y) - dy - 0.02, 0.04), V(px(x - 0.2) , py(y - 0.03 - rnd() * 0.05), 0.012)], 0.0016, 0xb81818, 10, 3, BM);
        }
      },
    };
    LAYOUTS[b.id](A);
    const tex = TX.texFrom(P.c, renderer); faceMat.map = tex; faceMat.needsUpdate = true;

    }
    // ---------- estrutura inferior (unidades reais) ----------
    const uL = -0.346 * PW, uR = 0.30 * PW, uz = -PDw / 2, sy = 0.63, tilt = 0.25;
    const tubeBox = (x, y, z, w, h, d) => put('tube', BM, x, y, z, w, h, d, 0xffffff);
    for (const x of [uL, uR]) {
      tubeBox(x, (0.04 + PB + 0.1) / 2, uz, 0.045, PB + 0.06, 0.04);            // montante
      tubeBox(x, 0.03, uz + 0.03, 0.045, 0.035, 0.56);                          // pé em "T"
      put('foot', BM, x, 0.008, uz + 0.29, 0.8, 0.8, 1, 0xffffff, Math.PI / 2); put('foot', BM, x, 0.008, uz - 0.23, 0.8, 0.8, 1, 0xffffff, Math.PI / 2);
    }
    tubeBox((uL + uR) / 2, sy - 0.02, uz, uR - uL, 0.035, 0.035);                // travessas
    tubeBox((uL + uR) / 2, 0.14, uz, uR - uL, 0.028, 0.028);
    // chapa perfurada entre os montantes
    const pw = uR - uL - 0.045, ph = PB - sy;
    const perf = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), mPerf[b.id === 'b1' ? 0 : 1]);
    perf.position.set((uL + uR) / 2, sy + ph / 2, uz + 0.015); perf.receiveShadow = true; bench.add(perf);
    const pfr = new THREE.Mesh(new THREE.BoxGeometry(pw + 0.02, 0.03, 0.025), mGray); pfr.position.set((uL + uR) / 2, PB - 0.015, uz + 0.008); bench.add(pfr);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshStandardMaterial({ color: 0x060606, roughness: 1.0 }));
    back.position.set((uL + uR) / 2, sy + ph / 2, uz - 0.04); bench.add(back);

    // prateleira preta com cantos chanfrados, abas laterais e suporte próprio
    const sw = PW * 0.69, sx0 = -0.02 * PW - sw / 2, sx1 = sx0 + sw, sd = 0.42, ch = 0.09;
    const shp = new THREE.Shape();
    shp.moveTo(sx0, 0); shp.lineTo(sx1, 0); shp.lineTo(sx1, sd - ch); shp.lineTo(sx1 - ch, sd); shp.lineTo(sx0 + ch, sd); shp.lineTo(sx0, sd - ch); shp.closePath();
    const sg = new THREE.ExtrudeGeometry(shp, { depth: 0.003, bevelEnabled: false }); sg.rotateX(Math.PI / 2);
    const uv = sg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) - sx0) / sw, uv.getY(i) / sd);
    const shelf = new THREE.Group(); shelf.position.set(0, sy, uz + 0.025); shelf.rotation.x = tilt; bench.add(shelf);
    const bed = new THREE.Mesh(sg, mShelf[bi === 0 ? 0 : 1]); bed.castShadow = true; bed.receiveShadow = true; shelf.add(bed);
    for (const sxe of [sx0, sx1]) {
      const lip = new THREE.Shape(); lip.moveTo(0, 0); lip.lineTo(sd - ch, 0); lip.lineTo(0, 0.035); lip.closePath();
      const lg = new THREE.ExtrudeGeometry(lip, { depth: 0.0025, bevelEnabled: false }); lg.rotateY(-Math.PI / 2);
      const l = new THREE.Mesh(lg, mShelf[1]); l.position.set(sxe + 0.00125, 0, 0); l.castShadow = true; shelf.add(l);
    }
    const bl = new THREE.Mesh(new THREE.BoxGeometry(sw, 0.022, 0.0025), mShelf[1]); bl.position.set((sx0 + sx1) / 2, 0.011, 0.00125); shelf.add(bl);
    const fl = new THREE.Mesh(new THREE.BoxGeometry(sw - 2 * ch, 0.028, 0.0025), mShelf[1]); fl.position.set((sx0 + sx1) / 2, 0.012, sd); fl.rotation.x = -tilt; shelf.add(fl);
    const fe = new THREE.Mesh(new THREE.BoxGeometry(sw - 2 * ch, 0.004, 0.006), new THREE.MeshStandardMaterial({ color: 0x8a8d90, roughness: 0.4, metalness: 0.6 })); fe.position.set((sx0 + sx1) / 2, 0.026, sd - 0.004); shelf.add(fe);
    for (const sg2 of [-1, 1]) { const cl = new THREE.Mesh(new THREE.BoxGeometry(ch * 1.414, 0.028, 0.0025), mShelf[1]); cl.position.set((sx0 + sx1) / 2 + sg2 * (sw / 2 - ch / 2), 0.012, sd - ch / 2); cl.rotation.set(0, sg2 * Math.PI / 4, 0); shelf.add(cl); }
    const scx = (sx0 + sx1) / 2;
    for (const x of [sx0 + 0.08, sx1 - 0.08]) {
      const st = sy - 0.13 * Math.sin(tilt) - 0.03; tubeBox(x, st / 2, uz + 0.14, 0.032, st, 0.028);
      tubeBox(x, 0.028, uz + 0.18, 0.036, 0.03, 0.42);
      put('foot', BM, x, 0.007, uz + 0.37, 0.7, 0.7, 1, 0xffffff, Math.PI / 2);
      put('tube', BM, x, sy - 0.14 * Math.sin(tilt) - 0.018, uz + 0.025 + 0.14 * Math.cos(tilt), 0.025, 0.025, 0.26, 0xffffff, tilt);
    }
    tubeBox(scx, 0.16, uz + 0.14, sw - 0.16, 0.025, 0.025);

    // GST "Gerador de Sistemas Trifásicos" preso na chapa perfurada, logo acima da prateleira, quase vertical (b1, b3, b4, b5)
    if (b.id !== 'b2') {
      const mw = b.id === 'b1' ? 0.415 : 0.32, mh = mw * GST.H / GST.W, md = 0.045;
      const mod = new THREE.Group(); mod.position.set(b.id === 'b1' ? -0.023 : scx, sy + 0.022, uz + 0.015 + md / 2 + 0.006); mod.rotation.x = -0.1; bench.add(mod);
      const bg = new THREE.BoxGeometry(mw + 0.01, mh + 0.01, md); bg.translate(0, mh / 2, 0);
      const body = new THREE.Mesh(bg, mModBody); body.castShadow = true; body.receiveShadow = true; mod.add(body);
      const fm = new THREE.Mesh(new THREE.PlaneGeometry(mw, mh), mModFace); fm.position.set(0, mh / 2, md / 2 + 0.0008); mod.add(fm);
      const U = (x) => (x / GST.W - 0.5) * mw, Vv = (y) => (0.5 - y / GST.H) * mh;
      const kp = GST.keys.map(([x, y, w, h]) => PG.box(w / GST.W * mw * 0.92, h / GST.H * mh * 0.92, 0.005, U(x + w / 2), Vv(y + h / 2), 0.0025, 0xe9ebec));
      const keys = new THREE.Mesh(mergeGeometries(kp.map((q) => q.toNonIndexed())), mVC); keys.position.copy(fm.position); keys.castShadow = true; mod.add(keys);
      mod.updateMatrixWorld(true); const FMm = fm.matrixWorld;
      for (const [x, y, c] of GST.jacks) put('jack', FMm, U(x), Vv(y), 0, 0.75, 0.75, 0.75, c);
      for (const sx2 of [-1, 1]) tubeBox(mod.position.x + sx2 * (mw / 2 - 0.04), sy + 0.014, uz + 0.04, 0.03, 0.012, 0.05);
    }

    // âncora da face para outros módulos (aula prática): origem no canto inferior esquerdo, x→direita, y→cima, z→fora; metros
    const FWw = (NPW - 0.08) * PS, FHw = 0.92 * PS;
    const faceAnchor = new THREE.Object3D(); faceAnchor.name = 'face_' + b.id; faceAnchor.position.set(-FWw / 2, PB + 0.04 * PS, 0.001); bench.add(faceAnchor);
    faces.push({ id: b.id, face: faceAnchor, width: FWw, height: FHw,
      layoutToFace: (fx, fy) => ({ x: (fx * SX) * PS + FWw / 2, y: (fy + 0.46) * PS }) });

    // hotspot
    const titulo = `Bancada ${bi + 1} · ${TITLES[b.id] || b.titulo}`;
    hotspots.push({ id: b.id, titulo, obj: panel, info: INFO[b.id] || '' });

    // ---------- cabos do teto: pares grossos saindo da eletrocalha (x≈BENCH_ROW.x+0,55, y≈2,6) com folga ----------
    const trayZ = wx - (BENCH_ROW.x + 0.55), trayY = (ROOM.soffitH || 2.5) + 0.1, zp = -PDw * 0.55;
    const nC = 3 + Math.floor(rnd() * 3);
    for (let k = 0; k < nC; k++) {
      const x1 = (rnd() - 0.5) * PW * 0.75, xt = x1 + (rnd() - 0.5) * 0.16, tz = trayZ + (rnd() - 0.5) * 0.1, j = (a) => (rnd() - 0.5) * a;
      const loop = rnd() < 0.3, lz = 0.04 + rnd() * 0.08, ly = PTOP + 0.12 + rnd() * 0.25;
      const pts = [V(xt, trayY + 0.03, tz), V(xt + j(0.03), trayY - 0.15, tz + j(0.05)), V(xt * 0.6 + x1 * 0.4 + j(0.06), (trayY + ly) / 2, tz * 0.6 + zp * 0.4 + j(0.08))];
      if (loop) pts.push(V(x1 + j(0.06), ly, zp + lz), V(x1 + j(0.05), ly - 0.07, zp + lz * 1.2));
      pts.push(V(x1 + j(0.02), PTOP + 0.06, zp), V(x1, PTOP - 0.02, zp));
      tube('ceiling', pts, 0.003, 0x0e0e0e, low ? 20 : 44, 5, BM);
    }

    // ---------- cabos de teste pendurados (laços em U e cabos dobrados no gancho) ----------
    const plugAt = (p, col, up) => put('plug', BM, p.x, p.y, p.z, 0.85, 0.85, 0.85, col, up ? Math.PI + (rnd() - 0.5) * 0.4 : (rnd() - 0.5) * 0.4, 0, (rnd() - 0.5) * 0.4);
    const hang = (hx, hy, hz, n, color, lenMin, lenMax, o = {}) => {
      const spread = o.spread ?? 0.2, bowMax = o.bow ?? 0.25;
      for (const [dz, dy] of [[-0.035, 0], [0.035, -0.05]]) put("tube", BM, hx + 0.018, hy + dy, hz + dz, 0.036, 0.006, 0.008, 0xb7babd);
      for (let k = 0; k < n; k++) {
        const hk = k % 2, H = V(hx + 0.035, hy + (hk ? -0.05 : 0) + 0.004, hz + (hk ? 0.035 : -0.035) + (rnd() - 0.5) * 0.02);
        const L = lenMin + rnd() * (lenMax - lenMin), bow = 0.06 + rnd() * (bowMax - 0.06), zmid = rnd() < 0.5 ? (rnd() - 0.5) * 0.16 : (rnd() - 0.5) * 0.04;
        const j = (a) => (rnd() - 0.5) * a;
        if (rnd() < 0.72) {
          // laço em U: os dois plugues presos perto do gancho, o cabo forma um U comprido para baixo
          const w = 0.02 + rnd() * 0.06;
          const P1 = V(H.x + j(0.02), H.y - 0.03 - rnd() * 0.12, H.z - w / 2), P2 = V(H.x + j(0.02), H.y - 0.03 - rnd() * 0.12, H.z + w / 2);
          const B = V(H.x + 0.012 + bow * 0.4 * rnd(), H.y - L, H.z + zmid + (rnd() - 0.5) * bow);
          const pts = [P1, V(P1.x + j(0.01), P1.y - 0.05, P1.z), V(H.x + bow * 0.15 + j(0.015), H.y - L * 0.55, H.z + zmid * 0.6 - w * 0.5 - bow * 0.3 + j(spread * 0.3)),
            V(B.x - 0.01, B.y + 0.05, B.z - w / 3), B, V(B.x + 0.01, B.y + 0.05, B.z + w / 3),
            V(H.x + bow * 0.15 + j(0.015), H.y - L * 0.5, H.z + zmid * 0.5 + w * 0.5 + bow * 0.3 + j(spread * 0.3)), V(P2.x + j(0.01), P2.y - 0.05, P2.z), P2];
          tube('lead', pts, 0.0027, color, low ? 18 : 40, 5, BM);
          plugAt(P1, color, true); plugAt(P2, color, true);
        } else {
          // cabo dobrado no gancho: duas pernas de comprimentos diferentes, plugues em alturas variadas
          const ends = [-1, 1].map((sg) => V(H.x + 0.008 + bow * 0.45 * rnd(), H.y - L * (sg < 0 ? 1 : 0.55 + rnd() * 0.45), H.z + zmid + sg * (0.01 + rnd() * bow * 0.4) + j(spread * 0.4)));
          const leg = (E, t) => V(H.x + (E.x - H.x) * t + Math.sin(t * Math.PI) * bow * 0.12 + j(0.012), H.y + (E.y - H.y) * Math.pow(t, 0.8), H.z + (E.z - H.z) * t + Math.sin(t * Math.PI) * zmid * 0.5 + j(0.02));
          const [E1, E2] = ends;
          const pts = [E1, V(E1.x + j(0.01), E1.y + 0.04, E1.z), leg(E1, 0.65), leg(E1, 0.3), V(H.x, H.y + 0.004, H.z), leg(E2, 0.3), leg(E2, 0.65), V(E2.x + j(0.01), E2.y + 0.04, E2.z), E2];
          tube('lead', pts, 0.0027, color, low ? 16 : 36, 5, BM);
          plugAt(E1, color, false); plugAt(E2, color, false);
        }
      }
    };
    if (b.id === 'b1') {
      const sx = PW / 2 + 0.005, hz = -PDw / 2;
      hang(sx, PTOP - 0.03, hz, low ? 20 : 42, 0xe8c416, 0.1, 0.28);
      hang(sx, PTOP - 0.3, hz + 0.01, low ? 14 : 32, 0xe8e8e2, 0.3, 0.62);
      hang(sx, PB + 0.1, hz, low ? 18 : 40, 0x2a4fb0, 0.35, 0.6);
      // gabinete lateral atrás da b1 com cabos pretos e vermelhos
      const cx1 = PW / 2 + 0.1, cx0 = cx1 - 0.3, cz0 = -PDw - 0.3, cz1 = cz0 - 0.5, cy0 = PB - 0.08;
      const cb = new THREE.Mesh(new THREE.BoxGeometry(cx1 - cx0, PTOP + 0.02 - cy0, cz0 - cz1), mGray);
      cb.position.set((cx0 + cx1) / 2, (cy0 + PTOP + 0.02) / 2, (cz0 + cz1) / 2); cb.castShadow = true; cb.receiveShadow = true; bench.add(cb);
      for (const z of [cz0 - 0.04, cz1 + 0.04]) for (const x of [cx0 + 0.03, cx1 - 0.03]) { tubeBox(x, cy0 / 2, z, 0.04, cy0, 0.04); }
      for (const x of [cx0 + 0.03, cx1 - 0.03]) { tubeBox(x, 0.03, (cz0 + cz1) / 2, 0.045, 0.035, 0.8); }
      put('screw', BM, cx1 + 0.001, PTOP - 0.04, cz1 + 0.05, 1, 1, 1, 0xffffff, 0, Math.PI / 2); put('screw', BM, cx1 + 0.001, cy0 + 0.05, cz1 + 0.05, 1, 1, 1, 0xffffff, 0, Math.PI / 2);
      hang(cx1 + 0.004, PTOP - 0.01, cz1 + 0.07, low ? 20 : 42, 0x121212, 0.3, 0.6);
      hang(cx1 + 0.004, PB + 0.14, cz1 + 0.14, low ? 18 : 34, 0xa8120e, 0.72, 0.94, { spread: 0.15 });
    }
  });

  // ---------- cria as InstancedMesh ----------
  for (const k in defs) {
    const L = inst[k].m.length; if (!L) continue;
    const [geo, mat] = defs[k];
    const im = new THREE.InstancedMesh(geo, mat, L); im.name = 'bench_' + k;
    for (let i = 0; i < L; i++) { im.setMatrixAt(i, inst[k].m[i]); im.setColorAt(i, inst[k].c[i]); }
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.computeBoundingSphere();
    im.castShadow = ['tube', 'box', 'k3rt', 'ctd', 'tall', 'tallD', 'brk3', 'dr4', 'contactor', 'relay', 'timer', 'prot', 'meter'].includes(k); im.receiveShadow = k === 'tube';
    g.add(im);
  }
  for (const k in cableGeos) {
    if (!cableGeos[k].length) continue;
    const m = new THREE.Mesh(mergeGeometries(cableGeos[k]), mCable); m.name = 'bench_cables_' + k;
    m.castShadow = k === 'ceiling'; g.add(m);
  }

  scene.add(g);
  return { group: g, hotspots, faces, update() {} };
}
