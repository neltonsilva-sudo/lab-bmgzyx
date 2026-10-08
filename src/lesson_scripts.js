// DONO: agente "aula-pratica". Roteiros de aula prática no KET-1030 real (contatores K1–K5 com um NA, CH1/CH2, SN1,
// seletora CH5, RAX-02, RYD-01, TCS-01, CTD, RCA, RST-21): objetivo, passos, diagramas, verificação automática
// (topológica + ensaio funcional num clone do simulador) com feedback específico e defeitos injetáveis.
import * as D from './lesson_diagrams.js?v=20261008201615';

export function makeCtx(sim, panel) {
  const uf = sim.staticNet(), r = panel.roles, bus = panel.bus;
  const C = { sim, panel, r, bus, uf };
  C.same = (a, b) => uf.find(a) === uf.find(b);
  C.phaseOf = (t) => { for (const k of ['L1', 'L2', 'L3', 'N']) if (C.same(t, bus[k])) return k; return null; };
  C.conn3 = (outs, ins) => { const used = new Set(); return ins.every((i) => { const o = outs.find((o) => !used.has(o) && C.same(o, i)); if (!o) return false; used.add(o); return true; }); };
  C.withLinks = (links) => { const u = sim.staticNet(); for (const [a, b] of links) u.union(a, b); return (a, b) => u.find(a) === u.find(b); };
  return C;
}
const T = (d, t) => d + '.' + t;
const run = (s, sec, dt = 0.02) => { for (let t = 0; t < sec; t += dt) s.step(dt); };
const pulse = (s, b) => { s.press(b, true); run(s, 0.1); s.press(b, false); run(s, 0.1); };
const deltaOkS = (sm, M) => (sm(T(M, 1), T(M, 6)) && sm(T(M, 2), T(M, 4)) && sm(T(M, 3), T(M, 5))) || (sm(T(M, 1), T(M, 5)) && sm(T(M, 2), T(M, 6)) && sm(T(M, 3), T(M, 4)));
const starOkS = (sm, M) => sm(T(M, 4), T(M, 5)) && sm(T(M, 5), T(M, 6));
const poles = (K) => [[T(K, 1), T(K, 2)], [T(K, 3), T(K, 4)], [T(K, 5), T(K, 6)]];
const selo = (C, K, S) => (C.same(T(K, 13), T(S, 13)) && C.same(T(K, 14), T(S, 14))) || (C.same(T(K, 13), T(S, 14)) && C.same(T(K, 14), T(S, 13)));
const PH = ['L1', 'L2', 'L3'];
function energizeClone(C, setup) { const s = C.sim.clone(); if (setup) setup(s); s.setMain(true); run(s, 0.1); return s; }
function shortMsg(s) { const e = s.events.find((e) => e.type === 'short' || e.type === 'burn'); return e ? e.msg : null; }

// alimentação do contator pelo barramento (1-3-5 em três fases distintas)
function busToK(C, K) {
  const ph = ['1', '3', '5'].map((t) => C.phaseOf(T(K, t)));
  const ok = new Set(ph.filter((p) => PH.includes(p))).size === 3;
  return { g: 'Força', ok, ph, msg: ok ? `${K} alimentado por L1, L2 e L3 nos bornes L1-L2-L3 (1-3-5).` : ph.includes('N') ? `${K} recebeu o neutro N num polo de força: os bornes L1-L2-L3 (1-3-5) do contator vão aos barramentos L1, L2 e L3.` : `Ligue os bornes L1, L2 e L3 (1-3-5) de ${K} aos barramentos L1, L2 e L3 (um em cada fase)${ph.some(Boolean) ? ' — hoje há fase repetida ou faltando' : ''}.` };
}
function kToMotor(C, K, sm = C.same) {
  const outs = ['2', '4', '6'].map((t) => T(K, t)), mins = ['1', '2', '3'].map((t) => T(C.r.M, t));
  const used = new Set(); const ok = mins.every((m) => { const o = outs.find((o) => !used.has(o) && sm(o, m)); if (!o) return false; used.add(o); return true; });
  return { g: 'Força', ok, msg: ok ? `Saídas T1-T2-T3 de ${K} nas pontas U1, V2 e W3 do motor.` : `Ligue as saídas T1, T2 e T3 (2-4-6) de ${K} às pontas U1, V2 e W3 do motor.` };
}
function deltaItem(C) {
  const M = C.r.M, ok = deltaOkS(C.same, M), st = starOkS(C.same, M);
  return { g: 'Força', ok, msg: ok ? 'Motor fechado em triângulo (Δ, 380 V).' : st ? 'O motor está em estrela: em 380 V este motor (380 V Δ) fica com só 220 V por enrolamento. Feche em triângulo: U1–Z6, V2–X4, W3–Y5.' : 'Feche o motor em triângulo (Δ) com 3 cabos: U1–Z6, V2–X4 e W3–Y5.' };
}
function coilN(C, K) { const ok = C.same(T(K, 'A2'), C.bus.N); return { g: 'Comando', ok, msg: ok ? `A2 de ${K} no neutro.` : C.phaseOf(T(K, 'A2')) ? `A2 de ${K} está em ${C.phaseOf(T(K, 'A2'))}: a bobina é 220 Vca — A2 vai ao neutro N.` : `Ligue A2 da bobina de ${K} ao barramento N (bobina 220 Vca entre fase e neutro).` }; }
function seloItem(C, K) { const S = C.r.S1, ok = selo(C, K, S); return { g: 'Comando', ok, msg: ok ? `Contato de selo NO (13-14) de ${K} em paralelo com o LIGA (${S}).` : `Falta o contato de selo NO 13-14 de ${K} em paralelo com o LIGA (${S}): ligue o NO de cima ao primeiro borne do ${S} e o NO de baixo ao segundo.` }; }
// partida direta: ensaio funcional comum
function ensaioDireta(C, out, opt = {}) {
  const r = C.r, K = r.K[0], s = energizeClone(C, opt.setup), k = () => !!s.dev(K).st.on, sm = shortMsg(s);
  out.push({ g: 'Ensaio', ok: !sm && !k(), msg: sm ? `Ao energizar: ${sm}` : k() ? `Ao energizar, ${K} ligou sozinho — A1 está recebendo fase sem passar pelo LIGA.` : 'Ao energizar, nada parte sozinho e não há curto.' });
  if (sm) return { s, ok: false };
  s.press(r.S1, true); run(s, 0.1); const on1 = k();
  out.push({ g: 'Ensaio', ok: on1, msg: on1 ? `LIGA (${r.S1}) energiza ${K}.` : `Ao pressionar LIGA (${r.S1}), ${K} não energiza: confira L1 →${opt.chain || ''} ${r.S0} (NF) → ${r.S1} (NA) → A1 de ${K}; A2 → N.` });
  s.press(r.S1, false); run(s, 0.1); const hold = k();
  out.push({ g: 'Ensaio', ok: on1 && hold, msg: !on1 ? 'Selo não testado (o contator não ligou).' : hold ? `Ao soltar o LIGA, ${K} permanece (selo funcionando).` : `Ao soltar o LIGA, ${K} desliga: falta o selo NO 13-14 em paralelo com ${r.S1}.` });
  if (!hold && on1) { s.press(r.S1, true); run(s, 0.1); }
  run(s, 3); const m = s.dev(r.M).st, spin = Math.abs(m.rpm) > 1500;
  out.push({ g: 'Ensaio', ok: spin, msg: spin ? `Motor gira a ${Math.abs(m.rpm).toFixed(0)} rpm (${m.rpm > 0 ? 'horário' : 'anti-horário'}), ${m.conn === 'Δ' ? 'em triângulo' : 'fechamento ' + (m.conn || 'indefinido')}.` : m.hum ? 'O motor zumbe e não parte: falta uma fase na força.' : `O motor não gira com ${K} ligado: confira o circuito de força e o fechamento do motor.` });
  return { s, ok: on1, k, spin };
}
function ensaioDesliga(C, out, s, k) {
  const r = C.r, K = r.K[0]; s.press(r.S0, true); run(s, 0.1); const off = !k(); s.press(r.S0, false); run(s, 0.1);
  out.push({ g: 'Ensaio', ok: off, msg: off ? `DESLIGA (${r.S0}) interrompe a bobina.` : `DESLIGA (${r.S0}) não desliga ${K}: o NF do ${r.S0} deve ficar em série antes do LIGA e do selo.` });
}

export const SCRIPTS = [
  {
    id: 'direta', title: 'Partida direta com selo', icon: '▶',
    objetivo: 'Montar, energizar com segurança e testar a partida direta de um motor trifásico com o contator K1, o contato de selo NO e as botoeiras LIGA (CH1) e DESL (CH2).',
    materiais: 'Barramentos L1-L2-L3-N (após disjuntor geral e DR), contator K1 (220 Vca), CH1 LIGA, CH2 DESL, motor M1 (380 V Δ), cabos de teste.',
    diagrams: (N) => [D.comandoDireta(N), D.forcaDireta(N)],
    passos: [
      { t: 'Desenergize a bancada pelo procedimento NR-10 (aba NR-10) até aparecer “Bancada liberada”.', done: (X) => X.nr.liberado || X.everLiberado },
      { t: 'Força: barramentos L1, L2, L3 → K1 L1-L2-L3; K1 T1-T2-T3 → motor U1, V2, W3.', done: (X, R) => R.slice(0, 2).every((i) => i.ok) },
      { t: 'Feche o motor em triângulo: U1–Z6, V2–X4, W3–Y5.', done: (X, R) => R[2] && R[2].ok },
      { t: 'Comando: L1 → CH2 → CH1 → K1 A1; K1 A2 → N.', done: (X, R) => R.filter((i) => i.g === 'Comando' && !/selo/i.test(i.msg)).every((i) => i.ok) },
      { t: 'Selo: NO (13) de K1 no 1º borne do CH1 e NO (14) de K1 no 2º borne (em paralelo com o LIGA).', done: (X, R) => R.some((i) => /selo/i.test(i.msg) && i.ok) },
      { t: 'Clique em “Verificar montagem” e corrija o que for apontado.', done: (X) => X.checked && X.lastScore >= 10 },
      { t: 'Faça a reenergização, energize e teste: LIGA, selo, DESL. Observe o motor e o sentido de giro.', done: (X) => X.tested.direta },
      { t: 'Desenergize e bloqueie a bancada; gere o relatório.', done: (X) => X.reported },
    ],
    check(C) {
      const K = C.r.K[0], out = [busToK(C, K), kToMotor(C, K), deltaItem(C), coilN(C, K)];
      const a1 = !C.phaseOf(T(K, 'A1'));
      out.push({ g: 'Comando', ok: a1, msg: a1 ? `A1 de ${K} comandado pelas botoeiras.` : `A1 de ${K} está ligado direto a ${C.phaseOf(T(K, 'A1'))}: a bobina ficaria sempre energizada.` });
      out.push(seloItem(C, K));
      const e = ensaioDireta(C, out); if (e.ok) ensaioDesliga(C, out, e.s, e.k);
      return out;
    },
  },
  {
    id: 'reversao', title: 'Partida com reversão e intertravamento', icon: '⇄',
    objetivo: 'Inverter o sentido de giro trocando duas fases com K2. A seletora CH5 escolhe o sentido e os relés auxiliares RAX-02 fazem o intertravamento elétrico (os contatores do painel têm só um contato NA).',
    materiais: 'K1 (horário), K2 (anti-horário), CH1 LIGA, CH2 DESL, seletora CH5 (NA = horário, NF = anti-horário), RAX-02 nº 1 e nº 2, motor M1.',
    diagrams: (N) => [D.comandoReversao(N), D.forcaReversao(N)],
    passos: [
      { t: 'Desenergize pelo procedimento NR-10.', done: (X) => X.nr.liberado || X.everLiberado },
      { t: 'Força: barramentos → K1 e K2 (L1-L2-L3); K1 T1-T2-T3 → U1-V2-W3; K2 T1-T2-T3 → motor trocando duas fases (T1 → W3, T3 → U1).', done: (X, R) => R.filter((i) => i.g === 'Força').slice(0, 4).every((i) => i.ok) },
      { t: 'Feche o motor em triângulo.', done: (X, R) => R.some((i) => /triângulo/.test(i.msg) && i.g === 'Força' && i.ok) },
      { t: 'Comando: L1 → CH2 → (CH1 ∥ NO de K1 ∥ NO de K2) → C da CH5; CH5 NA → RAX2 15-16 → K1 A1; CH5 NF → RAX1 15-16 → K2 A1.', done: (X, R) => R.filter((i) => i.g === 'Comando' && /seletora|selo/.test(i.msg)).every((i) => i.ok) },
      { t: 'Intertravamento: bobina do RAX1 em paralelo com K1 e do RAX2 em paralelo com K2; A2 de todos no N.', done: (X, R) => R.filter((i) => i.g === 'Comando' && /intertrav|A2/.test(i.msg)).every((i) => i.ok) },
      { t: 'Verifique a montagem e corrija.', done: (X) => X.checked && X.lastScore >= 10 },
      { t: 'Reenergize e teste: CH5 em 1 + LIGA (horário); gire a CH5 (o motor para); LIGA de novo (anti-horário).', done: (X) => X.tested.reversao },
      { t: 'Desenergize, bloqueie e gere o relatório.', done: (X) => X.reported },
    ],
    check(C) {
      const r = C.r, K1 = r.K[0], K2 = r.K[1], M = r.M, SEL = r.SEL, out = [busToK(C, K1), busToK(C, K2)];
      out.push(kToMotor(C, K1));
      // sequência que chega ao motor por K2 deve ser invertida em relação a K1
      const seqOf = (K, ph) => { const idx = ['1', '2', '3'].map((mt) => { const o = ['2', '4', '6'].findIndex((t) => C.same(T(K, t), T(M, mt))); return o < 0 ? null : ph[o]; }); return idx.every((p) => PH.includes(p)) && new Set(idx).size === 3 ? idx : null; };
      const s1 = seqOf(K1, out[0].ph), s2 = seqOf(K2, out[1].ph);
      const par = (a) => { const n = a.map((p) => PH.indexOf(p)); let c = 0; for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (n[i] > n[j]) c++; return c % 2; };
      const inv = s1 && s2 && par(s1) !== par(s2);
      out.push({ g: 'Força', ok: !!inv, msg: !s2 ? `Ligue as saídas T1-T2-T3 de ${K2} às pontas U1, V2 e W3 do motor (trocando duas fases).` : inv ? `${K2} chega ao motor com duas fases trocadas (sentido oposto ao de ${K1}).` : `${K2} chega ao motor com a MESMA sequência de ${K1}: o motor não inverteria. Troque duas fases (ex.: ${K2} T1 → W3 e T3 → U1).` });
      out.push(deltaItem(C), coilN(C, K1), coilN(C, K2));
      const sl1 = selo(C, K1, r.S1), sl2 = selo(C, K2, r.S1);
      out.push({ g: 'Comando', ok: sl1 && sl2, msg: sl1 && sl2 ? `Selos NO de ${K1} e ${K2} em paralelo com o LIGA.` : `Falta o selo: o NO 13-14 de ${!sl1 ? K1 : K2} deve ficar em paralelo com o LIGA (${r.S1}).` });
      const selOk = (C.same(T(SEL, 'C'), T(r.S1, 13)) || C.same(T(SEL, 'C'), T(r.S1, 14))) && !C.phaseOf(T(SEL, 'C'));
      out.push({ g: 'Comando', ok: selOk, msg: selOk ? `A seletora ${SEL} (C) recebe o comando após o LIGA/selo.` : `Ligue o comum C da seletora ${SEL} na saída do LIGA (mesmo ponto dos selos).` });
      // intertravamento por RAX: algum RAX com bobina em paralelo com K2 e NF 15-16 (ou 25-26) em série com K1, e vice-versa
      const ilk = (Ka, Kb) => r.RAX.some((x) => C.same(T(x, 'A1'), T(Kb, 'A1')) && C.same(T(x, 'A2'), C.bus.N) && ([['15', '16'], ['25', '26']].some(([a, b]) => C.same(T(x, a), T(Ka, 'A1')) || C.same(T(x, b), T(Ka, 'A1')))));
      const i1 = ilk(K1, K2), i2 = ilk(K2, K1);
      out.push({ g: 'Comando', ok: i1 && i2, msg: i1 && i2 ? 'Intertravamento elétrico pelos NF 15-16 dos RAX-02 montado.' : `Falta o intertravamento do ramo de ${!i1 ? K1 : K2}: um RAX-02 com a bobina em paralelo com ${!i1 ? K2 : K1} (A1 junto, A2 no N) e o NF 15-16 em série com a bobina de ${!i1 ? K1 : K2}.` });
      const s = energizeClone(C), on = (k) => !!s.dev(k).st.on, sm = shortMsg(s);
      out.push({ g: 'Ensaio', ok: !sm && !on(K1) && !on(K2), msg: sm ? `Ao energizar: ${sm}` : on(K1) || on(K2) ? 'Ao energizar, um contator ligou sozinho.' : 'Ao energizar, nada parte sozinho.' });
      if (sm) return out;
      s.setPos(SEL, 1); run(s, 0.1); pulse(s, r.S1); const a = on(K1) && !on(K2); run(s, 3); const rpm1 = s.dev(M).st.rpm;
      out.push({ g: 'Ensaio', ok: a && Math.abs(rpm1) > 1500, msg: a ? (Math.abs(rpm1) > 1500 ? `CH5 em 1 + LIGA: ${K1} com selo, motor a ${Math.abs(rpm1).toFixed(0)} rpm.` : `${K1} liga, mas o motor não gira: revise a força.`) : `CH5 em 1 + LIGA não mantém ${K1}: revise CH2, CH1, selo, CH5 NA e o NF do RAX.` });
      s.setPos(SEL, 0); run(s, 0.3); const stop = !on(K1) && !s.mainTrip;
      out.push({ g: 'Ensaio', ok: a && stop, msg: s.mainTrip ? `Ao girar a seletora houve CURTO: ${shortMsg(s)}` : stop ? 'Ao girar a seletora com o motor ligado, o motor para sem curto.' : `Ao girar a seletora, ${K1} continua ligado.` });
      if (s.mainTrip) return out;
      run(s, 3); pulse(s, r.S1); const b = on(K2) && !on(K1); run(s, 4); const rpm2 = s.dev(M).st.rpm;
      out.push({ g: 'Ensaio', ok: b && rpm1 * rpm2 < 0 && Math.abs(rpm2) > 1500, msg: !b ? `CH5 em 0 + LIGA não mantém ${K2}: revise CH5 NF, NF do RAX e o selo de ${K2}.` : rpm1 * rpm2 < 0 ? `${K2} inverte o sentido (${rpm2 > 0 ? 'horário' : 'anti-horário'}).` : `Com ${K2}, o motor gira no MESMO sentido.` });
      pulse(s, r.S0); out.push({ g: 'Ensaio', ok: !on(K1) && !on(K2), msg: !on(K1) && !on(K2) ? `${r.S0} desliga.` : `${r.S0} não desliga.` });
      return out;
    },
    watch(X, sim, R) { const m = sim.dev(R.M).st, w = X.w = X.w || {}; if (m.rpm > 1500) w.cw = true; if (m.rpm < -1500) w.ccw = true; if (w.cw && w.ccw && !X.tested.reversao) { X.tested.reversao = true; return 'Ensaio realizado: motor girou nos dois sentidos.'; } },
  },
  {
    id: 'yd', title: 'Partida estrela-triângulo (relé RYD-01)', icon: 'Y',
    objetivo: 'Reduzir a corrente de partida a 1/3 partindo o motor em estrela (220 V por enrolamento) e comutando para triângulo (380 V) após o tempo do relé estrela-triângulo RYD-01.',
    materiais: 'K1 (rede), K2 (triângulo), K3 (estrela), RYD-01 (15-18 estrela, 25-28 triângulo), CH1, CH2, motor M1.',
    diagrams: (N) => [D.comandoYD(N), D.forcaYD(N)],
    passos: [
      { t: 'Desenergize pelo procedimento NR-10.', done: (X) => X.nr.liberado || X.everLiberado },
      { t: 'Força: barramentos → K1 → U1, V2, W3.', done: (X, R) => R.slice(0, 2).every((i) => i.ok) },
      { t: 'K3 (estrela): L1-L2-L3 em X4, Y5, Z6 e T1-T2-T3 interligados.', done: (X, R) => R[2] && R[2].ok },
      { t: 'K2 (triângulo): L1-L2-L3 em U1, V2, W3 e T1-T2-T3 em Z6, X4, Y5.', done: (X, R) => R[3] && R[3].ok },
      { t: 'Comando: CH2 → (CH1 ∥ NO de K1) → K1 A1 e RYD A1, 15 e 25; RYD 18 → K3 A1; RYD 28 → K2 A1; A2 → N.', done: (X, R) => R.filter((i) => i.g === 'Comando').every((i) => i.ok) },
      { t: 'Verifique a montagem e corrija.', done: (X) => X.checked && X.lastScore >= 10 },
      { t: 'Reenergize e teste: estrela, comutação após o tempo do RYD-01 e regime em triângulo.', done: (X) => X.tested.yd },
      { t: 'Desenergize, bloqueie e gere o relatório.', done: (X) => X.reported },
    ],
    check(C) {
      const r = C.r, K1 = r.K[0], K2 = r.K[1], K3 = r.K[2], M = r.M, KT = r.YD, out = [busToK(C, K1), kToMotor(C, K1)];
      const M456 = ['4', '5', '6'].map((t) => T(M, t)), k3in = C.conn3(M456, ['1', '3', '5'].map((t) => T(K3, t)));
      const starWhen = starOkS(C.withLinks(poles(K3)), M) && !starOkS(C.same, M);
      out.push({ g: 'Força', ok: starWhen && k3in, msg: starWhen && k3in ? `${K3} fecha a estrela em X4-Y5-Z6.` : starOkS(C.same, M) ? 'O motor já está em estrela por cabos fixos: quem fecha a estrela é K3.' : !k3in ? `Ligue L1-L2-L3 de ${K3} às pontas X4, Y5 e Z6.` : `Interligue T1, T2 e T3 de ${K3} (ponto da estrela).` });
      const dl = C.withLinks(poles(K2)), deltaWhen = deltaOkS(dl, M) && !deltaOkS(C.same, M);
      out.push({ g: 'Força', ok: deltaWhen, msg: deltaOkS(C.same, M) ? 'O motor já está em triângulo por cabos fixos: quem fecha o triângulo é K2.' : deltaWhen ? `${K2} fecha o triângulo (U1–Z6, V2–X4, W3–Y5).` : `${K2}: L1-L2-L3 em U1-V2-W3 e T1-T2-T3 em Z6-X4-Y5.` });
      for (const K of [K1, K2, K3]) out.push(coilN(C, K));
      out.push(seloItem(C, K1));
      const okT = C.same(T(KT, 'A2'), C.bus.N) && C.same(T(KT, 'A1'), T(K1, 'A1'));
      out.push({ g: 'Comando', ok: okT, msg: okT ? `${KT} alimentado junto com ${K1}.` : `Alimente o ${KT}: A1 junto ao A1 de ${K1} (após o selo) e A2 no neutro.` });
      const okC = C.same(T(KT, '15'), T(K1, 'A1')) && C.same(T(KT, '25'), T(K1, 'A1')) && C.same(T(KT, '18'), T(K3, 'A1')) && C.same(T(KT, '28'), T(K2, 'A1'));
      out.push({ g: 'Comando', ok: okC, msg: okC ? `${KT}: 15-18 comanda ${K3} (estrela) e 25-28 comanda ${K2} (triângulo).` : `Ligue os comuns 15 e 25 do ${KT} ao A1 de ${K1}; 18 → A1 de ${K3} (estrela); 28 → A1 de ${K2} (triângulo).` });
      const s = energizeClone(C), on = (k) => !!s.dev(k).st.on, sm = shortMsg(s);
      out.push({ g: 'Ensaio', ok: !sm && !on(K1), msg: sm ? `Ao energizar: ${sm}` : on(K1) ? `${K1} ligou sozinho.` : 'Ao energizar, nada parte sozinho.' });
      if (sm) return out;
      pulse(s, r.S1); run(s, 1);
      const mY = s.dev(M).st, yOk = on(K1) && on(K3) && !on(K2) && mY.conn === 'Y';
      out.push({ g: 'Ensaio', ok: yOk, msg: yOk ? `Partida em estrela: ${K1}+${K3}, ${Math.round(Math.max(...mY.Vw))} V por enrolamento.` : !on(K1) ? `${r.S1} não liga/mantém ${K1}.` : `Na partida devem estar ligados ${K1} e ${K3} (estrela): revise ${KT} 15-18.` });
      let both = false; const T0 = s.dev(KT).st.T;
      for (let t = 0; t < T0 + 2; t += 0.05) { run(s, 0.05); if (on(K2) && on(K3)) both = true; if (s.mainTrip) break; }
      const m = s.dev(M).st, dOk = on(K1) && on(K2) && !on(K3) && m.conn === 'Δ' && Math.abs(m.rpm) > 1600 && !both;
      out.push({ g: 'Ensaio', ok: dOk, msg: s.mainTrip ? `Na comutação houve curto: ${shortMsg(s) || 'K2 e K3 juntos'}.` : dOk ? `Após ${T0} s comutou para triângulo (${Math.abs(m.rpm).toFixed(0)} rpm).` : `Após o tempo, ${K3} deve abrir e ${K2} fechar: revise ${KT} 25-28.` });
      pulse(s, r.S0); const all = !on(K1) && !on(K2) && !on(K3);
      out.push({ g: 'Ensaio', ok: all, msg: all ? `${r.S0} desliga tudo.` : `${r.S0} não desliga todos os contatores.` });
      return out;
    },
    watch(X, sim, R) { const w = X.wy = X.wy || {}, K2 = sim.dev(R.K[1]).st, K3 = sim.dev(R.K[2]).st, m = sim.dev(R.M).st; if (K3.on && m.conn === 'Y') w.y = true; if (w.y && K2.on && m.conn === 'Δ' && Math.abs(m.rpm) > 1600 && !X.tested.yd) { X.tested.yd = true; return 'Ensaio realizado: partida em estrela e comutação para triângulo.'; } },
  },
  {
    id: 'protecao', title: 'Proteção de sobrecarga (relé de corrente RCA)', icon: 'I>',
    objetivo: 'O painel não tem relé térmico: a proteção de sobrecarga é feita pelo relé de sobrecorrente RCA com a entrada de corrente -IN/+IN em série com uma fase do motor e o contato 11-14 no comando. Ajustar, provocar sobrecarga, observar o desligamento e rearmar.',
    materiais: 'Partida direta (K1, CH1, CH2, motor) + RCA (A1-A2 220 Vca, -IN/+IN em série, 11-14 no comando).',
    diagrams: (N) => [D.comandoDireta(N, { rca: true }), D.forcaDireta(N, true)],
    passos: [
      { t: 'Desenergize pelo procedimento NR-10.', done: (X) => X.nr.liberado || X.everLiberado },
      { t: 'Monte a partida direta com selo, intercalando o RCA (-IN/+IN) entre K1 T1 e U1 do motor.', done: (X, R) => R.filter((i) => i.g === 'Força').every((i) => i.ok) },
      { t: 'Alimente o RCA (A1 em L1, A2 em N) e ponha o contato 11-14 dele em série no início do comando.', done: (X, R) => R.filter((i) => i.g === 'Relé').every((i) => i.ok) },
      { t: 'Clique no RCA e ajuste 1,1–1,5 A (acima da nominal de 1,05 A).', done: (X) => X.wp && X.wp.set },
      { t: 'Energize, ligue o motor e aumente a carga no eixo para ~170% até o RCA atuar e o motor parar.', done: (X) => X.wp && X.wp.trip },
      { t: 'Volte a carga a 80% e rearme o RCA (RESET).', done: (X) => X.wp && X.wp.reset },
      { t: 'Desenergize, bloqueie e gere o relatório.', done: (X) => X.reported },
    ],
    check(C) {
      const r = C.r, K = r.K[0], RC = r.RCA, sv = C.same;
      C.same = C.withLinks([[T(RC, 'INm'), T(RC, 'INp')]]);
      const out = [busToK(C, K), kToMotor(C, K), deltaItem(C)]; C.same = sv;
      const ser = !C.same(T(RC, 'INm'), T(RC, 'INp')) && ['2', '4', '6'].some((t) => C.same(T(K, t), T(RC, 'INm')) || C.same(T(K, t), T(RC, 'INp')));
      const par = C.phaseOf(T(RC, 'INm')) && C.phaseOf(T(RC, 'INp'));
      out.push({ g: 'Força', ok: ser, msg: ser ? `Entrada de corrente do ${RC} em série com o motor.` : par ? `A entrada -IN/+IN do ${RC} está em PARALELO com a rede: curto-circuito! Ela vai em série.` : `Intercale -IN/+IN do ${RC} em série numa fase: ${K} T1 → -IN; +IN → U1.` });
      const pw = C.phaseOf(T(RC, 'A1')) && PH.includes(C.phaseOf(T(RC, 'A1'))) && C.same(T(RC, 'A2'), C.bus.N);
      out.push({ g: 'Relé', ok: pw, msg: pw ? `${RC} alimentado (A1 na fase, A2 no N).` : `Alimente o ${RC}: A1 numa fase (ex.: L1) e A2 no neutro.` });
      out.push(coilN(C, K), seloItem(C, K));
      const e = ensaioDireta(C, out, { chain: ` 11-14 do ${RC} →` });
      if (!e.ok) { out.push({ g: 'Relé', ok: false, msg: `Coloque o contato 11-14 do ${RC} em série no início do comando (L1 → 11; 14 → ${r.S0}).` }); return out; }
      const s = e.s; s.dev(r.M).st.load = 1.9; run(s, 5);
      const tripOk = s.dev(RC).st.trip && !s.dev(K).st.on;
      out.push({ g: 'Relé', ok: tripOk, msg: tripOk ? `Com sobrecarga, o ${RC} atua e desliga ${K}.` : s.dev(RC).st.trip ? `O ${RC} atuou mas ${K} continua ligado: o contato 11-14 dele deve estar em série no comando.` : `O ${RC} não mediu a sobrecarga: confira -IN/+IN em série e o ajuste.` });
      return out;
    },
    watch(X, sim, R) {
      const w = X.wp = X.wp || {}, d = sim.dev(R.RCA).st, m = sim.dev(R.M).st;
      if (d.Iset >= 1.1 && d.Iset <= 1.5) w.set = true;
      if (d.trip && m.load > 1.2 && !w.trip) { w.trip = true; return 'RCA atuou por sobrecorrente — motor protegido.'; }
      if (w.trip && !d.trip && !w.reset) { w.reset = true; }
      if (w.set && w.trip && w.reset && !X.tested.protecao) { X.tested.protecao = true; return 'Ensaio de proteção de sobrecarga concluído.'; }
    },
  },
  {
    id: 'sinal', title: 'Sinalização e emergência', icon: '◉',
    objetivo: 'Completar a partida direta com o sinaleiro SN1 (motor ligado) e um botão de emergência com trava em série no início do comando. O KET-1030 não tem emergência: usa-se a botoeira de emergência como ACESSÓRIO EXTERNO. O sinaleiro ENERGIZADO indica a bancada energizada.',
    materiais: 'Partida direta + SN1 (220 Vca) + botoeira de emergência externa (NF 11-12).',
    diagrams: (N) => [D.comandoDireta(N, { emerg: true, lamp: true }), D.forcaDireta(N)],
    passos: [
      { t: 'Desenergize pelo procedimento NR-10.', done: (X) => X.nr.liberado || X.everLiberado },
      { t: 'Monte a partida direta com selo.', done: (X, R) => R.filter((i) => i.g === 'Força').every((i) => i.ok) },
      { t: 'Emergência (acessório externo, abaixo do painel): L1 → 11; 12 → CH2.', done: (X, R) => R.some((i) => /emergência/i.test(i.msg) && i.ok) },
      { t: 'SN1 em paralelo com a bobina de K1 (X1 no A1, X2 no N).', done: (X, R) => R.some((i) => /SN1/.test(i.msg) && i.ok) },
      { t: 'Verifique a montagem e corrija.', done: (X) => X.checked && X.lastScore >= 10 },
      { t: 'Reenergize (observe o ENERGIZADO) e teste: LIGA acende SN1; a EMERGÊNCIA desliga e impede religar; destrave.', done: (X) => X.tested.sinal },
      { t: 'Desenergize, bloqueie e gere o relatório.', done: (X) => X.reported },
    ],
    check(C) {
      const r = C.r, K = r.K[0], SN = r.SN, out = [busToK(C, K), kToMotor(C, K), deltaItem(C), coilN(C, K), seloItem(C, K)];
      const e = ensaioDireta(C, out, { chain: ' emergência 11-12 →' });
      if (!e.ok) return out;
      const s = e.s, lit = () => !!s.dev(SN).st.lit;
      out.push({ g: 'Sinalização', ok: lit(), msg: lit() ? `SN1 acende com ${K} ligado.` : `SN1 não acende com ${K} ligado: ligue X1 do SN1 no A1 de ${K} e X2 no N.` });
      s.toggleLatch(r.SE); run(s, 0.1); const off = !s.dev(K).st.on; s.press(r.S1, true); run(s, 0.1); const blk = !s.dev(K).st.on; s.press(r.S1, false); run(s, 0.1);
      out.push({ g: 'Comando', ok: off && blk, msg: off && blk ? 'A emergência desliga e impede religar enquanto travada.' : 'A emergência (acessório externo, NF 11-12) deve ficar em série no início do comando, antes do CH2, do LIGA e do selo.' });
      out.push({ g: 'Sinalização', ok: !lit(), msg: !lit() ? 'SN1 apaga com o motor desligado.' : 'SN1 continua aceso com o motor desligado: ele deve ficar em paralelo com a bobina.' });
      return out;
    },
    watch(X, sim, R) { const w = X.ws = X.ws || {}, K = sim.dev(R.K[0]).st, se = sim.dev(R.SE).st; if (sim.dev(R.SN).st.lit) w.sn = true; if (w.k && se.latched && !K.on) w.e = true; w.k = K.on; if (w.sn && w.e && !X.tested.sinal) { X.tested.sinal = true; return 'Ensaio da sinalização e da emergência concluído.'; } },
  },
  {
    id: 'livre', title: 'Modo livre', icon: '✎',
    objetivo: 'Explorar livremente o painel e o GST: monte qualquer circuito de comando e força; o simulador mostra o comportamento real (curtos, proteções, motor, temporizadores CTD/TCS/RYD, relé de sequência RST-21 com o GST).',
    materiais: 'Todos os componentes do KET-1030 e o GST.',
    diagrams: () => [],
    passos: [{ t: 'Faça a desenergização NR-10 antes de montar.', done: (X) => X.nr.liberado || X.everLiberado }, { t: 'Monte o circuito desejado.', done: (X) => X.sim.wires.length > 0 }, { t: 'Reenergize pelo procedimento e teste.', done: (X) => X.everEnergizedWithWires }],
    check(C) { const s = energizeClone(C), sm = shortMsg(s); return [{ g: 'Ensaio', ok: !sm, msg: sm ? `Ao energizar: ${sm}` : 'Nenhum curto-circuito ao energizar.' }]; },
  },
];
export const scriptById = (id) => SCRIPTS.find((s) => s.id === id) || SCRIPTS[0];

export const FAULTS = [
  { id: 'brokenWire', t: 'Cabo de teste rompido internamente', apply: (sim) => { const w = sim.wires[Math.floor(Math.random() * sim.wires.length)]; if (!w) return false; sim.faults.brokenWire = w.id; return w.id; } },
  { id: 'coil', t: 'Bobina do contator K1 queimada (aberta)', apply: (sim, r) => { sim.dev(r.K[0]).st.burnt = true; return r.K[0]; } },
  { id: 'aux', t: 'Contato de selo NO de K1 gasto (não fecha)', apply: (sim, r) => { sim.dev(r.K[0]).st.wornAux = true; return r.K[0]; } },
  { id: 'rca', t: 'Relé RCA atuado e travado', apply: (sim, r) => { const d = sim.dev(r.RCA).st; d.trip = true; d.stuck = true; return r.RCA; } },
  { id: 'phase', t: 'Falta de fase L3 na alimentação', apply: (sim) => { sim.faults.phaseLoss = 'L3'; return 'L3'; } },
];
export function clearFault(sim, f, r) {
  if (!f) return;
  if (f.id === 'brokenWire') delete sim.faults.brokenWire;
  if (f.id === 'coil') sim.dev(r.K[0]).st.burnt = false;
  if (f.id === 'aux') sim.dev(r.K[0]).st.wornAux = false;
  if (f.id === 'rca') { const d = sim.dev(r.RCA).st; d.stuck = false; d.trip = false; }
  if (f.id === 'phase') delete sim.faults.phaseLoss;
  sim.dirty = true;
}
