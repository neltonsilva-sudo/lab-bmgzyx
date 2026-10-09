// DONO: agente "acessórios". Cadeiras, pedestais com correntes, escadas de fibra, extintor, mesas laterais, armário/painel elétrico
// do fundo à direita e pequenos objetos. Todas as posições derivam das constantes de layout.js (nada fixo em coordenada absoluta).
import * as THREE from 'three';
import { ROOM, BOOTHS, CENTER, BENCH_ROW, SOLAR, STANCHIONS } from './layout.js?v=20261009142652';
import { buildChairs, CHAIR_BOX } from './props_chairs.js?v=20261009142652';
import { buildStanchions } from './props_chain.js?v=20261009142652';
import { stepLadder, straightLadder } from './props_ladders.js?v=20261009142652';
import { buildExtinguisher, buildSideTable, buildToolBench, buildCabinet } from './props_misc.js?v=20261009142652';
import { contactShadow } from './props_util.js?v=20261009142652';

// Posições (derivadas do layout) — exportadas para inspeção/ajuste.
export function propPlacements() {
  const bz = (k) => BOOTHS.z0 + k * BOOTHS.bayW; // z do pilar k (0 = fundo)
  const pw = BOOTHS.pillarW;
  const lastBench = BENCH_ROW.z0 + (BENCH_ROW.n - 1) * BENCH_ROW.pitch;
  const solarR = SOLAR.xs[SOLAR.xs.length - 1] + SOLAR.w / 2;
  return {
    // 3 cadeiras encostadas na mesa em L, voltadas para +x (posições triangularizadas das 3 fotos)
    chairsCenter: [
      { x: CENTER.x1 - 0.53, z: CENTER.bench.z + 0.3, ry: Math.PI / 2 - 0.3 },
      { x: CENTER.x1 - 0.06, z: CENTER.bench.z - 0.45, ry: Math.PI / 2 - 0.12 },  // x ≥ 5,3: livre da mesa em L
      { x: CENTER.x1 - 0.05, z: CENTER.bench.z - 1.3, ry: Math.PI / 2 - 0.05 },
    ],
    // cadeira atrás da bancada b1 (lado da entrada), voltada para -x
    chairBack: { x: BENCH_ROW.x + 2.95, z: BENCH_ROW.z0 + 0.72, ry: -2.45 },
    cabinet: { x: ROOM.W - 1.02, z: BENCH_ROW.z0 + 0.7, ry: Math.PI }, // frente para -x
    extinguisher: { x: ROOM.W - 0.13, z: BENCH_ROW.z0 + 1.6, ry: Math.PI },
    ladders: [
      // baia mais perto da entrada: escada FECHADA, encostada no pilar da frente (+z), inclinada ~8°
      { kind: 'step', x: BOOTHS.x0 + 0.55, z: bz(BOOTHS.n - 1) - pw / 2 - 0.24, ry: Math.PI / 2, lean: 0.14, h: 1.35, spreadF: 0.06, spreadR: 0.04, steps: 5, tone: 'tan' },
      // baia seguinte: montantes marrom-escuros e manchados
      { kind: 'step', x: BOOTHS.x0 + 0.5, z: bz(BOOTHS.n - 2) - pw / 2 - 0.25, ry: Math.PI / 2 - 0.1, lean: 0.03, h: 1.18, spreadF: 0.07, spreadR: 0.05, steps: 4, tone: 'dark' },
      // baia do fundo: escada simples de alumínio azulado, até quase a viga, no canto ao lado do pilar
      { kind: 'straight', x: BOOTHS.x0 + 0.4, z: bz(1) - pw / 2 - 1.03, ry: 0, len: 2.5, tilt: 0.14 },
    ],
    // mesa lateral branca (eixo longo em z) atrás do fim da fila de bancadas; bancada escura com maletas junto à parede do fundo
    sideTable: { x: solarR + 0.46, z: lastBench - 1.15, ry: Math.PI / 2 },
    toolBench: { x: solarR + 1.1, z: 0.33, ry: 0 },
    // pedestais: os do layout; se só houver 3, o 4º fecha o cercado (triangulado nas fotos 2 e 3)
    posts: (() => {
      const p = STANCHIONS.map(([x, z]) => ({ x, z }));
      if (p.length === 3) p.push({ x: p[0].x + 0.28, z: p[0].z + 0.79 });
      // ganchos (eixo x local) apontando para os vizinhos
      p.forEach((q, i) => { const a = p[(i + p.length - 1) % p.length], b = p[(i + 1) % p.length]; q.ry = -Math.atan2(b.z - a.z, b.x - a.x); });
      return p;
    })(),
    lastBench,
  };
}

export function buildProps(scene, ctx) {
  const g = new THREE.Group(); g.name = 'props';
  const P = propPlacements();
  const hotspots = [];
  const q = (ctx && ctx.q) || 'high';

  // ── cadeiras
  const chairs = [...P.chairsCenter, P.chairBack];
  const CH = buildChairs(chairs);
  g.add(CH.group);
  const chairShadows = chairs.map((c) => { const s = contactShadow(0.7, 0.7, 0.42); s.position.x = c.x; s.position.z = c.z; g.add(s); return s; });
  // API para mover / retirar cadeiras (interface no ui.js)
  const ids = chairs.map((_, i) => 'cad' + (i + 1));
  const idx = (id) => ids.indexOf(id);
  const movables = {
    list: ids.map((id, i) => ({ id, titulo: 'Cadeira ' + (i + 1) })),
    pick(object, instanceId) { return object && CH.meshes.includes(object) && instanceId != null && instanceId < ids.length ? ids[instanceId] : null; },
    get(id) { const i = idx(id); if (i < 0) return null; const c = CH.state[i]; return { x: c.x, z: c.z, ry: c.ry, visible: c.visible }; },
    set(id, v = {}) {
      const i = idx(id); if (i < 0) return false;
      const c = CH.state[i];
      for (const k of ['x', 'z', 'ry']) if (Number.isFinite(v[k])) c[k] = v[k];
      if (typeof v.visible === 'boolean') c.visible = v.visible;
      CH.apply(i);
      const sh = chairShadows[i]; sh.position.x = c.x; sh.position.z = c.z; sh.visible = c.visible;
      return true;
    },
    box(id) {
      const i = idx(id); if (i < 0) return null; const c = CH.state[i];
      const m = new THREE.Matrix4().compose(new THREE.Vector3(c.x, 0, c.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), c.ry), new THREE.Vector3(1, 1, 1));
      return CHAIR_BOX.clone().applyMatrix4(m);
    },
  };

  // ── pedestais + correntes
  const posts = P.posts;
  // cercado fechado: p1→p2→p3→p4→p1 (como nas fotos 2 e 3)
  const runsList = [[[9, 'y'], [11, 'k'], [40, 'y']], [[3, 'k'], [14, 'y'], [3, 'k'], [60, 'y']], [[16, 'y'], [7, 'k'], [60, 'y']], [[5, 'k'], [60, 'y']]];
  const slacks = [1.3, 1.28, 1.14, 1.12];
  const spans = [];
  for (let i = 0; i < posts.length; i++) spans.push({ from: i, to: (i + 1) % posts.length, slack: slacks[i % 4], runs: runsList[i % 4] });
  g.add(buildStanchions({ posts, spans, q }));
  posts.forEach((p) => { const s = contactShadow(0.55, 0.55, 0.5); s.position.x = p.x; s.position.z = p.z; g.add(s); });

  // ── escadas
  P.ladders.forEach((L) => {
    const lad = L.kind === 'step' ? stepLadder({ h: L.h, spreadF: L.spreadF, spreadR: L.spreadR, steps: L.steps || 5, tone: L.tone }) : straightLadder({ len: L.len, tilt: L.tilt });
    // escada de abrir: abertura em x local, largura em z local; 'lean' inclina o topo para +z do mundo (encosta no pilar)
    lad.rotation.y = L.ry;
    const holder = new THREE.Group(); holder.add(lad); holder.position.set(L.x, 0, L.z); holder.rotation.x = L.lean || 0;
    g.add(holder);
    const s = contactShadow(0.6, 0.6, 0.35); s.position.set(L.x, 0.002, L.z); g.add(s);
  });

  // ── extintor
  const ext = buildExtinguisher();
  ext.position.set(P.extinguisher.x, 0, P.extinguisher.z); ext.rotation.y = P.extinguisher.ry; g.add(ext);
  { const s = contactShadow(0.4, 0.4, 0.45); s.position.set(P.extinguisher.x, 0.002, P.extinguisher.z); g.add(s); }
  hotspots.push({
    id: 'extintor', titulo: 'Extintor PQS ABC 6 kg', obj: ext,
    info: 'Extintor de pó químico ABC (6 kg) em suporte de piso. NR-23 / IT de proteção contra incêndio: sinalização vertical acima, ' +
      'área livre de obstrução, inspeção visual mensal, recarga anual e teste hidrostático a cada 5 anos (selo do INMETRO).',
  });

  // ── mesa lateral + bancada de ferramentas (fundo à direita)
  const tb = buildToolBench(); tb.position.set(P.toolBench.x, 0, P.toolBench.z); tb.rotation.y = P.toolBench.ry; g.add(tb);
  { const s = contactShadow(1.6, 0.9, 0.45); s.position.set(P.toolBench.x, 0.002, P.toolBench.z); g.add(s); }
  const st = buildSideTable(); st.position.set(P.sideTable.x, 0, P.sideTable.z); st.rotation.y = P.sideTable.ry; g.add(st);
  { const s = contactShadow(1.5, 0.9, 0.35); s.position.set(P.sideTable.x, 0.002, P.sideTable.z); g.add(s); }

  // ── armário elétrico (frente = +x local; ry = π → frente para -x)
  const cab = buildCabinet({ w: 0.46, d: 0.38, h: 1.02, plinth: 0.08 }); cab.position.set(P.cabinet.x, 0, P.cabinet.z); cab.rotation.y = P.cabinet.ry; g.add(cab);
  { const s = contactShadow(0.9, 1.0, 0.6); s.position.set(P.cabinet.x, 0.002, P.cabinet.z); g.add(s); }

  scene.add(g);
  return { group: g, hotspots, movables, update() {} };
}
