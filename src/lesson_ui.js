// DONO: agente "aula-pratica". Segunda tela (tela cheia) com o painel KET-1030 funcional: cabos de teste, botoeiras,
// medidores, multímetro, procedimento NR-10, roteiros com verificação automática, defeitos e relatório.
import { createSim, fmtA } from './lesson_sim.js?v=20261009142652';
import { getPanel, JACK_COL } from './lesson_panels.js?v=20261009142652';
import { build3DBackground } from './lesson_bg3d.js?v=20261009142652';
import { SCRIPTS, scriptById, makeCtx, FAULTS, clearFault } from './lesson_scripts.js?v=20261009142652';

const CABLE = { R: ['#d11f1f', '#7a0d0d', 'vermelho'], K: ['#202020', '#000', 'preto'], B: ['#1f56c9', '#0d2a6e', 'azul'], Y: ['#f0c419', '#8a6d05', 'amarelo'], W: ['#f2f2ee', '#8d8d86', 'branco'], G: ['#1f9a3c', '#0b4a1a', 'verde'] };
const NS = 'http://www.w3.org/2000/svg';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const mmss = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const num = (v, d = 1) => v.toFixed(d).replace('.', ',');

const CSS = `
#lz{position:fixed;inset:0;z-index:40;display:none;flex-direction:column;background:#dfe5ec;color:#1e2a3a;font:12px/1.4 "Segoe UI",system-ui,sans-serif;user-select:none;-webkit-user-select:none}
#lz.on{display:flex}
#lz button{all:unset;box-sizing:border-box;cursor:pointer;padding:5px 10px;border-radius:5px;background:#dfe5ee;color:#1e2a3a;font-weight:600;white-space:nowrap;display:inline-flex;align-items:center;gap:5px;min-height:28px}
#lz button:hover{filter:brightness(.95)} #lz button.p{background:var(--ac,#1f6fd1);color:#fff} #lz button.on{background:#dbe9fb;color:#1f6fd1;box-shadow:inset 0 0 0 1px #a9c8f0}
#lz button:disabled,#lz button.dis{opacity:.45;pointer-events:none}
#lz button.red{background:#c62828;color:#fff} #lz button.grn{background:#1a9c4a;color:#fff}
.lz-top{display:flex;align-items:center;gap:12px;padding:7px 14px;background:linear-gradient(#fbfcfe,#e9eef5);border-bottom:1px solid #c9d1dc;flex:none}
.lz-top .tt{font-weight:700;font-size:14px} .lz-top .tt small{display:block;font-weight:400;color:#5d6b7e;font-size:11px}
.lz-top .sp{flex:1} .lz-chip{background:#fff;border:1px solid #c9d1dc;border-radius:14px;padding:3px 10px;font-weight:600}
.lz-tools{display:flex;align-items:center;gap:6px;padding:6px 14px;background:#f3f6fa;border-bottom:1px solid #c9d1dc;flex:none;flex-wrap:wrap}
.lz-tools .sep{width:1px;height:24px;background:#c9d1dc;margin:0 4px}
.lz-sw{width:24px;height:24px;border-radius:50%;cursor:pointer;border:2px solid #fff;box-shadow:0 0 0 1px #8a97a8;flex:none}
.lz-sw.on{box-shadow:0 0 0 2px #1f6fd1,0 0 0 4px #dbe9fb}
.lz-qf{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #c9d1dc;border-radius:6px;padding:3px 8px}
.lz-qf .st{font-weight:700} .lz-qf .st.e{color:#c62828} .lz-qf .st.d{color:#1a7f3c} .lz-qf .st.t{color:#b26a00}
.lz-main{flex:1;display:flex;min-height:0}
.lz-col{flex:1;display:flex;flex-direction:column;min-width:0}
.lz-wrap{flex:1;position:relative;overflow:hidden;background:radial-gradient(ellipse at 50% 40%,#5d646c,#2c3036);touch-action:none;min-height:0}
.lz-stage{position:absolute;left:0;top:0;transform-origin:0 0}
.lz-stage svg.pnl{position:absolute;left:0;top:0;overflow:visible}
.pnl.bg3d .jk.on3d>*:not(:first-child):not(.hl){display:none} .jk{cursor:crosshair} .jk .hl{fill:none;stroke:none} .jk:hover .hl,.jk.pend .hl{stroke:#1f9bff;stroke-width:3} .jk.net .hl{stroke:#7cc4ff;stroke-width:2;stroke-dasharray:3 2}
.wd{cursor:pointer} .cb{cursor:pointer} .cb:hover .cbo{stroke:#1f9bff !important}
.lz-tip{position:fixed;z-index:60;pointer-events:none;background:#1e2a3a;color:#fff;padding:4px 8px;border-radius:4px;font-size:11.5px;max-width:330px;display:none;box-shadow:0 3px 10px rgba(0,0,0,.3)}
.lz-zoom{position:absolute;right:10px;bottom:10px;display:flex;flex-direction:column;gap:4px}
.lz-zoom button{background:rgba(246,248,251,.94)!important;width:34px;justify-content:center}
.lz-hint{position:absolute;left:10px;bottom:10px;color:#e9eef5;font-size:11px;text-shadow:0 1px 2px #000;opacity:.9;pointer-events:none}
.lz-flash{position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 120px 30px rgba(255,40,20,.0);transition:box-shadow .5s}
.lz-flash.go{box-shadow:inset 0 0 140px 40px rgba(255,40,20,.75);transition:none}
.lz-bot{flex:none;height:clamp(118px,17vh,158px);display:flex;gap:8px;padding:8px;background:#e9eef4;border-top:1px solid #c9d1dc}
.lz-card{background:rgba(246,248,251,.97);border:1px solid #c9d1dc;border-radius:7px;display:flex;flex-direction:column;min-width:0;overflow:hidden}
.lz-card .ph{background:linear-gradient(#f3f6fa,#e3e9f1);border-bottom:1px solid #c9d1dc;padding:3px 9px;font-weight:700;display:flex;justify-content:space-between;align-items:center;gap:6px}
.lz-card .bd{padding:6px 9px;flex:1;min-height:0;overflow:auto}
.lz-side{width:clamp(320px,24vw,400px);flex:none;display:flex;flex-direction:column;background:rgba(246,248,251,.97);border-left:1px solid #c9d1dc;min-height:0}
.lz-tabs{display:flex;border-bottom:1px solid #c9d1dc;background:#e9eef5;flex:none}
.lz-tabs div{flex:1;text-align:center;padding:8px 4px;cursor:pointer;font-weight:600;color:#5d6b7e;border-bottom:2px solid transparent}
.lz-tabs div.on{color:#1f6fd1;border-bottom-color:#1f6fd1;background:#f6f8fb}
.lz-tabs div .bdg{display:inline-block;min-width:16px;padding:0 4px;border-radius:8px;background:#c62828;color:#fff;font-size:10px;margin-left:4px}
.lz-pane{flex:1;overflow:auto;padding:10px 12px;display:none} .lz-pane.on{display:block}
.lz-pane h3{margin:10px 0 5px;font-size:12.5px;color:#1e2a3a} .lz-pane h3:first-child{margin-top:0}
.lz-pane p{margin:4px 0}
.lz-step{display:flex;gap:7px;padding:5px 6px;border-radius:5px;margin:2px 0} .lz-step.cur{background:#dbe9fb}
.lz-step .ck{width:18px;height:18px;border-radius:50%;flex:none;display:grid;place-items:center;font-size:11px;font-weight:700;background:#dfe5ee;color:#5d6b7e}
.lz-step.ok .ck{background:#1a9c4a;color:#fff}
.lz-res{padding:4px 6px;border-left:3px solid #1a9c4a;margin:3px 0;background:#eef8f1;border-radius:3px}
.lz-res.no{border-left-color:#c62828;background:#fdeeee}
.lz-res b{font-size:10.5px;color:#5d6b7e;text-transform:uppercase;letter-spacing:.3px;margin-right:4px}
.lz-nr{display:flex;gap:8px;align-items:flex-start;padding:6px;border:1px solid #d6dde7;border-radius:6px;margin:5px 0;background:#fff}
.lz-nr .n{width:22px;height:22px;border-radius:50%;flex:none;display:grid;place-items:center;font-weight:700;background:#dfe5ee}
.lz-nr.ok{border-color:#9fd5b1;background:#f1faf4} .lz-nr.ok .n{background:#1a9c4a;color:#fff}
.lz-nr .tx{flex:1} .lz-nr .tx small{color:#5d6b7e;display:block}
.lz-nr .act{margin-top:4px;display:flex;gap:5px;flex-wrap:wrap}
.lz-pairs{display:flex;flex-wrap:wrap;gap:3px;margin-top:4px} .lz-pairs span{padding:1px 6px;border-radius:9px;background:#eef1f5;font-size:11px;border:1px solid #d6dde7} .lz-pairs span.ok{background:#1a9c4a;color:#fff;border-color:#1a9c4a}
.lz-ban{padding:7px 9px;border-radius:6px;font-weight:700;margin:6px 0} .lz-ban.ok{background:#1a9c4a;color:#fff} .lz-ban.no{background:#fff4d6;color:#7a5600;border:1px solid #e0b43c} .lz-ban.dang{background:#c62828;color:#fff}
.lz-inf{font-size:11.5px;padding:3px 6px;border-left:3px solid #c62828;background:#fdeeee;margin:3px 0}
.lz-log{font-size:11.5px} .lz-log div{padding:1px 0;border-bottom:1px dotted #d6dde7} .lz-log .e{color:#c62828;font-weight:600} .lz-log .w{color:#9a6a00} .lz-log i{color:#5d6b7e;font-style:normal;margin-right:4px}
.lz-mm{display:flex;gap:8px;align-items:stretch;height:100%}
.lz-lcd{background:linear-gradient(#b9c7a6,#9fb08a);border:3px solid #333;border-radius:6px;font:700 26px/1 "Consolas","Courier New",monospace;color:#1d2618;padding:6px 8px;min-width:150px;text-align:right;display:flex;flex-direction:column;justify-content:center}
.lz-lcd small{font:600 10px "Segoe UI";color:#2c3a23;text-align:left}
.lz-mot{display:flex;gap:10px;align-items:center;height:100%}
.lz-mot .kv{display:grid;grid-template-columns:auto auto;gap:0 10px;font-size:11px;white-space:nowrap;line-height:1.35} .lz-mot .kv b{font-weight:700}
.lz-modal{position:absolute;inset:0;background:rgba(15,25,40,.55);display:none;align-items:center;justify-content:center;z-index:5}
.lz-modal.on{display:flex}
.lz-dlg{background:#f6f8fb;border-radius:9px;box-shadow:0 10px 40px rgba(0,0,0,.4);max-width:min(980px,calc(100vw - 32px));max-height:calc(100vh - 40px);display:flex;flex-direction:column;overflow:hidden}
.lz-dlg .ph{background:linear-gradient(#f3f6fa,#e3e9f1);border-bottom:1px solid #c9d1dc;padding:9px 14px;font-weight:700;font-size:14px;display:flex;justify-content:space-between;align-items:center}
.lz-dlg .bd{padding:14px;overflow:auto} .lz-dlg .ft{padding:10px 14px;border-top:1px solid #c9d1dc;display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
.lz-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}
.lz-sc{border:1px solid #c9d1dc;border-radius:7px;padding:10px;background:#fff;cursor:pointer} .lz-sc:hover{border-color:#1f6fd1} .lz-sc.on{border-color:#1f6fd1;box-shadow:0 0 0 2px #dbe9fb}
.lz-sc b{display:block;font-size:13px;margin-bottom:3px}
.lz-dlg input[type=text],.lz-dlg select,.lz-pane select,.lz-pane input[type=text]{font:inherit;padding:5px 8px;border:1px solid #b8c3d1;border-radius:4px;background:#fff}
.lz-dgs{display:flex;gap:12px;flex-wrap:wrap;justify-content:center} .lz-dgs svg{height:min(66vh,560px);width:auto;border:1px solid #c9d1dc;border-radius:6px;background:#fff}
.lz-dgs svg [data-coil].on{fill:#bff0c9} .lz-dgs svg [data-lamp].on circle,.lz-dgs svg [data-lamp].on path{fill:#ffe48a}
.lz-chk{display:flex;gap:8px;align-items:center;padding:6px;border:1px solid #d6dde7;border-radius:6px;margin:5px 0;background:#fff}
.lz-chk.ok{background:#f1faf4;border-color:#9fd5b1}
.lz-pop{position:fixed;z-index:61;background:#f6f8fb;border:1px solid #c9d1dc;border-radius:7px;box-shadow:0 6px 24px rgba(0,0,0,.3);padding:9px 11px;display:none;width:250px}
.lz-pop h4{margin:0 0 6px;font-size:12.5px} .lz-pop .row{display:flex;gap:6px;align-items:center;margin:5px 0} .lz-pop input[type=range]{flex:1}
textarea.lz-rep{width:min(760px,80vw);height:52vh;font:12px/1.45 Consolas,monospace;border:1px solid #c9d1dc;border-radius:5px;padding:8px;box-sizing:border-box;user-select:text;-webkit-user-select:text}
@media (max-width:1100px){.lz-side{width:300px}.lz-tools{gap:4px}.lz-top .tt small{display:none}}
@media (max-width:820px){.lz-main{flex-direction:column}.lz-side{width:auto;height:40vh;border-left:0;border-top:1px solid #c9d1dc}.lz-bot{height:auto;flex-wrap:wrap}}
`;

export function createLessonScreen(opts = {}) {
  const css = document.createElement('style'); css.textContent = CSS; document.head.appendChild(css);
  const root = document.createElement('div'); root.id = 'lz'; document.body.appendChild(root);
  const tip = document.createElement('div'); tip.className = 'lz-tip'; document.body.appendChild(tip);
  const pop = document.createElement('div'); pop.className = 'lz-pop'; document.body.appendChild(pop);
  const $ = (sel) => root.querySelector(sel);
  const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };

  const panel = getPanel();
  // fundo 3D: o próprio gêmeo digital do KET-1030 renderizado de frente (câmera fixa); se não der, usa o quadro 2D
  let bg3d = null;
  try { if (new URLSearchParams(location.search).get('quadro') !== '2d') bg3d = build3DBackground(panel, { VX: -40, VY: -40, VW: panel.FW + 80, VH: panel.GST.y + panel.GST.h + 30 + 40 }); } catch (e) { console.warn('fundo 3D indisponível', e); bg3d = null; }
  const sim = createSim(panel.spec);
  const R = panel.roles, BUS = panel.bus;
  const jackById = new Map(panel.jacks.map((j) => [j.id, j]));
  const jacksByTerm = new Map(); panel.jacks.forEach((j) => { if (!jacksByTerm.has(j.t)) jacksByTerm.set(j.t, []); jacksByTerm.get(j.t).push(j); });

  // ---------- estado da aula ----------
  const X = {
    sim, panel, script: null, student: '', t0: 0, elapsed: 0, color: 'R', mode: 'wire', undo: [], redo: [], pending: null,
    nr: { loto: false, meas: {}, testBefore: false, testAfter: false, ground: false, protect: false, sign: false, liberado: false },
    meter: { fn: 'V', red: null, black: null, next: 'red', test: 0 },
    infr: [], log: [], checked: false, lastScore: 0, results: [], tested: {}, reported: false, everLiberado: false, everEnergizedWithWires: false,
    fault: null, faultTarget: null, diag: null, requireNR: true, zoom: 1, pan: [0, 0], transparent: false, started: false, nrDone: [],
    stats: { shorts: 0, trips: 0, energizations: 0 }, tab: 'rot', qf: false, key: false,
  };
  window.__lesson = { X, sim, panel };

  // ---------- estrutura ----------
  root.innerHTML = `
  <div class="lz-top"><div class="tt">Aula prática · KET-1030: Proteção<small>Bancada didática de comandos e proteção · simulador elétrico 380/220 V · NR-10</small></div>
    <span class="lz-chip" id="lzScript">—</span><span class="lz-chip" id="lzStud">—</span><span class="lz-chip" id="lzTime">00:00</span>
    <div class="sp"></div><button id="lzNew">Trocar roteiro</button><button id="lzRep">Relatório</button><button class="p" id="lzClose">✕ Voltar ao laboratório</button></div>
  <div class="lz-tools">
    <span style="font-weight:600;color:#5d6b7e">Cabo:</span><span id="lzColors" style="display:flex;gap:5px"></span><span class="sep"></span>
    <button id="lzUndo" title="Desfazer (Ctrl+Z)">↶ Desfazer</button><button id="lzRedo" title="Refazer (Ctrl+Y)">↷ Refazer</button><button id="lzClear">Limpar cabos</button>
    <button id="lzTransp" title="Deixa os cabos semitransparentes para ler os bornes">Cabos translúcidos</button><span class="sep"></span>
    <button id="lzMeter" title="Multímetro: clique em dois bornes para posicionar as pontas">⎓ Multímetro</button><button id="lzDiag">Diagramas</button><button id="lzCheck" class="p">✓ Verificar montagem</button>
    <div class="sp" style="flex:1"></div>
    <div class="lz-qf"><span>QF0 geral da bancada:</span><span class="st" id="lzQfSt">—</span><span id="lzLock" title="Bloqueio e etiquetagem"></span></div>
    <button id="lzEnergy" class="grn">⚡ Energizar bancada</button>
  </div>
  <div class="lz-main"><div class="lz-col">
    <div class="lz-wrap" id="lzWrap"><div class="lz-stage" id="lzStage"></div><div class="lz-flash" id="lzFlash"></div>
      <div class="lz-hint" id="lzHint">Arraste de um borne a outro para ligar um cabo · clique num cabo para removê-lo · roda do mouse: zoom · arraste o fundo: mover</div>
      <div class="lz-zoom"><button id="lzZin">+</button><button id="lzZout">−</button><button id="lzZfit" title="Ajustar ao painel">⤢</button><button id="lzZall" title="Ver painel, GST e acessório externo" style="font-size:10px">GST</button></div></div>
    <div class="lz-bot">
      <div class="lz-card" style="flex:1.6"><div class="ph">Motor M1 · 3~ 380 V Δ · 0,37 kW · 1,05 A · 1720 rpm<span id="lzMotSt" class="lz-chip" style="padding:0 8px">parado</span></div><div class="bd"><div class="lz-mot">
        <svg id="lzMotSvg" viewBox="0 0 120 90" style="height:100%;max-height:92px;width:auto;flex:none"></svg>
        <div class="kv" id="lzMotKV"></div>
        <div style="flex:1;min-width:150px"><div style="font-weight:600">Carga no eixo: <span id="lzLoadV">80%</span></div><input id="lzLoad" type="range" min="0" max="200" value="80" style="width:100%"><div style="color:#5d6b7e;font-size:11px">Acima de ~130% o térmico atua (tempo acelerado).</div></div>
      </div></div></div>
      <div class="lz-card" style="flex:1"><div class="ph">Multímetro (CAT III 600 V)<span><button id="lzMV" class="on" style="min-height:22px;padding:1px 8px">V~</button> <button id="lzMR" style="min-height:22px;padding:1px 8px">Ω</button></span></div><div class="bd"><div class="lz-mm">
        <div class="lz-lcd" id="lzLcd"><small id="lzLcdF">V~</small><span id="lzLcdV">----</span></div>
        <div style="flex:1;display:flex;flex-direction:column;gap:4px">
          <div><span style="color:#c62828;font-weight:700">● vermelha:</span> <span id="lzPR">—</span></div><div><span style="font-weight:700">● preta:</span> <span id="lzPB">—</span></div>
          <div style="display:flex;gap:4px;flex-wrap:wrap"><button id="lzTest" title="Teste do instrumento numa fonte conhecida (tomada de 220 V da bancada vizinha)">Testar em fonte conhecida</button><button id="lzProbeOff">Recolher pontas</button></div>
        </div></div></div></div>
      <div class="lz-card" style="flex:1"><div class="ph">Registro de eventos</div><div class="bd lz-log" id="lzLog"></div></div>
    </div></div>
    <div class="lz-side"><div class="lz-tabs"><div data-t="rot" class="on">Roteiro</div><div data-t="nr">NR-10<span class="bdg" id="lzInfB" style="display:none">0</span></div><div data-t="prof">Professor</div></div>
      <div class="lz-pane on" id="lzProt"></div><div class="lz-pane" id="lzPnr"></div><div class="lz-pane" id="lzPprof"></div></div>
  </div>
  <div class="lz-modal" id="lzModal"><div class="lz-dlg" id="lzDlg"></div></div>`;

  // ---------- palco (canvas + svg), unidades em mm, origem no canto superior esquerdo da face ----------
  const FW = panel.FW, FH = panel.FH, GSTr = panel.GST, EXTr = panel.EXT;
  const VX = -40, VY = -40, VW = FW + 80, VH = GSTr.y + GSTr.h + 30 - VY;
  const stage = $('#lzStage'), wrap = $('#lzWrap');
  stage.style.width = VW + 'px'; stage.style.height = VH + 'px';
  if (bg3d) { Object.assign(bg3d.canvas.style, { position: 'absolute', left: '0px', top: '0px', width: VW + 'px', height: VH + 'px' }); stage.appendChild(bg3d.canvas); }
  else { Object.assign(panel.canvas.style, { position: 'absolute', left: -VX + 'px', top: -VY + 'px', width: FW + 'px', height: FH + 'px' }); stage.appendChild(panel.canvas); }
  // brilho do laminado que acompanha o ponteiro (reflexo da luz do teto), sem capturar cliques
  const sheen = document.createElement('div');
  Object.assign(sheen.style, { position: 'absolute', left: -VX + 'px', top: -VY + 'px', width: FW + 'px', height: FH + 'px', pointerEvents: 'none', mixBlendMode: 'soft-light', zIndex: 1,
    background: 'radial-gradient(520px 340px at 45% 18%, rgba(255,255,255,.55), rgba(255,255,255,0) 70%)', transition: 'background-position .2s' });
  if (!bg3d) stage.appendChild(sheen);
  wrap.addEventListener('pointermove', (e) => { const r = panel.canvas.getBoundingClientRect(); if (!r.width) return;
    if (bg3d) return; const px = ((e.clientX - r.left) / r.width) * 100, py = ((e.clientY - r.top) / r.height) * 100;
    sheen.style.background = `radial-gradient(520px 340px at ${(100 - px * 0.6).toFixed(1)}% ${(8 + py * 0.25).toFixed(1)}%, rgba(255,255,255,.55), rgba(255,255,255,0) 70%)`; });
  const svg = el('svg', { class: 'pnl' + (bg3d ? ' bg3d' : ''), viewBox: `${VX} ${VY} ${VW} ${VH}`, width: VW, height: VH }, stage);
  svg.style.width = VW + 'px'; svg.style.height = VH + 'px';
  const defs = el('defs', {}, svg);
  defs.innerHTML = `
    <radialGradient id="gMetal" cx="40%" cy="35%"><stop offset="0" stop-color="#f4f4f4"/><stop offset="1" stop-color="#8d8f92"/></radialGradient>
    <linearGradient id="gFrame" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eceeef"/><stop offset="1" stop-color="#c9ccd0"/></linearGradient>
    <linearGradient id="gBench" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6d9dc"/><stop offset="1" stop-color="#b9bdc1"/></linearGradient>
    <filter id="fGlow" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="6"/></filter>
    <radialGradient id="lzPlugSh" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>
    <radialGradient id="gNut" cx="35%" cy="30%"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#c3c6ca"/><stop offset="1" stop-color="#6f7378"/></radialGradient>
    <radialGradient id="gCone" cx="40%" cy="35%" r="65%"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>
    <radialGradient id="gHole" cx="62%" cy="66%" r="70%"><stop offset="0" stop-color="#3a3c3f"/><stop offset=".6" stop-color="#101112"/><stop offset="1" stop-color="#000"/></radialGradient>
    <filter id="fJs" x="-.5" y="-.5" width="2" height="2"><feGaussianBlur stdDeviation="1.6"/></filter>
    <filter id="fSh" x="-.3" y="-.3" width="1.6" height="1.6"><feDropShadow dx="1.5" dy="3" stdDeviation="2" flood-opacity=".45"/></filter>
    ${Object.entries(JACK_COL).map(([k, c]) => `<radialGradient id="gJ${k}" cx="38%" cy="32%"><stop offset="0" stop-color="${k === 'K' ? '#5a5a5a' : '#fff'}" stop-opacity="${k === 'K' ? 1 : 0.55}"/><stop offset=".45" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity=".85"/></radialGradient>`).join('')}`;
  // bancada abaixo do painel (chapa perfurada), moldura do painel
  const bench = el('g', {}, svg);
  let holes = ''; for (let y = FH + 95; y < VY + VH - 20; y += 85) for (let x = 40; x < FW; x += 110) if (!(x > GSTr.x - 30 && x < GSTr.x + GSTr.w + 30) && !(x > EXTr.x - 30 && x < EXTr.x + EXTr.w + 20)) holes += `<rect x="${x}" y="${y}" width="16" height="16" fill="#202326"/>`;
  bench.innerHTML = `<rect x="${VX + 70}" y="${FH + 40}" width="${VW - 140}" height="${VH - FH - 40 + VY}" fill="url(#gBench)" stroke="#9aa0a6"/>${holes}`;
  const frame = el('g', {}, svg);
  frame.innerHTML = `<path d="M-40 -40 H${FW + 40} V${FH + 40} H-40 Z M0 0 V${FH} H${FW} V0 Z" fill="url(#gFrame)" fill-rule="evenodd" stroke="#8d939a" stroke-width="2"/>
    <rect x="-1" y="-1" width="${FW + 2}" height="${FH + 2}" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="2"/>
    <circle cx="-22" cy="-22" r="12" fill="#cfe3f7" stroke="#9bb"/><text x="-22" y="-20" text-anchor="middle" font-size="4.5" fill="#557">ACION.</text>` +
    [[-20, FH + 20], [FW + 20, -20], [FW + 20, FH + 20], [FW / 2, -20], [FW / 2, FH + 20]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="url(#gMetal)" stroke="#777"/><path d="M${x - 3} ${y} h6" stroke="#555" stroke-width="1.2"/>`).join('');
  // sombra interna: a moldura projeta sombra sobre a face (painel embutido)
  const inner = el('g', { 'pointer-events': 'none' }, svg);
  inner.innerHTML = `<defs><linearGradient id="gIT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    <linearGradient id="gIL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient></defs>
    <rect x="0" y="0" width="${FW}" height="16" fill="url(#gIT)"/><rect x="0" y="0" width="14" height="${FH}" fill="url(#gIL)"/>`;
  if (bg3d) { bench.style.display = 'none'; frame.style.display = 'none'; inner.style.display = 'none'; }
  const gW = el('g', {}, svg), gJ = el('g', {}, svg), gC = el('g', {}, svg), gN = el('g', { 'pointer-events': 'none' }, svg), gP = el('g', {}, svg), gG = el('g', { 'pointer-events': 'none' }, svg);
  const SX = (x) => x, SY = (y) => y;

  // ---------- bornes ----------
  const jackEls = new Map();
  for (const j of panel.jacks) {
    const g = el('g', { class: 'jk' + (bg3d && j.on3d ? ' on3d' : ''), 'data-j': j.id, transform: `translate(${j.x.toFixed(1)},${j.y.toFixed(1)})${j.scale && j.scale !== 1 ? ` scale(${j.scale})` : ''}` }, gJ);
    // borne banana com profundidade: porca metálica, corpo isolante cônico, furo de 4 mm com sombra interna
    g.innerHTML = `<circle r="${j.scale < 1 ? 15 : 11.5}" fill="transparent"/><circle r="9.4" cx="1.6" cy="2.6" fill="rgba(0,0,0,.28)" filter="url(#fJs)"/>` +
      `<circle r="9" fill="url(#gNut)" stroke="#5e6164" stroke-width=".8"/><circle r="7.6" fill="none" stroke="rgba(255,255,255,.55)" stroke-width=".7" stroke-dasharray="2.6 1.4"/>` +
      `<circle r="6.8" fill="url(#gJ${j.c})" stroke="rgba(0,0,0,.4)" stroke-width=".6"/><circle r="6.8" fill="url(#gCone)"/>` +
      `<circle r="3.1" fill="url(#gHole)"/><circle r="3.1" fill="none" stroke="#9a9ca0" stroke-width=".55"/><path d="M-4.6 -3.4 A5.8 5.8 0 0 1 2.4 -5.5" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1" stroke-linecap="round"/><circle r="12.5" class="hl"/>` +
      (j.ext && j.label ? `<text x="16" y="3" font-size="8.5" font-weight="700" fill="#262626" font-family="Arial">${esc(j.label)}</text>` : '');
    jackEls.set(j.id, g);
  }

  // ---------- widgets ----------
  const W = [];
  const lampColor = { R: ['#ff3b28', '#7d1a12'], G: ['#4dff6a', '#1d6b2a'], Y: ['#ffe03a', '#b89a14'] };
  const btnColor = { R: '#e0201c', G: '#22a443', Y: '#f0c418', K: '#1a1a1a' };
  // ---- materiais dos widgets (luz de cima-esquerda; sombras para baixo-direita) ----
  const hx = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const mix = (c, t, k) => '#' + hx(c).map((v, i) => Math.round(v + (hx(t)[i] - v) * k).toString(16).padStart(2, '0')).join('');
  defs.insertAdjacentHTML('beforeend', `
    <filter id="wSh" x="-.5" y="-.5" width="2" height="2"><feGaussianBlur in="SourceAlpha" stdDeviation="1.6"/><feOffset dx="1.6" dy="2.6"/><feComponentTransfer><feFuncA type="linear" slope=".55"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="wShS" x="-.5" y="-.5" width="2" height="2"><feGaussianBlur in="SourceAlpha" stdDeviation=".7"/><feOffset dx=".8" dy="1.3"/><feComponentTransfer><feFuncA type="linear" slope=".6"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="wBl" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="1.4"/></filter>
    <filter id="wHalo" x="-1.5" y="-1.5" width="4" height="4"><feGaussianBlur stdDeviation="5"/></filter>
    <radialGradient id="wBlkBez" cx="34%" cy="28%" r="80%"><stop offset="0" stop-color="#6a6d72"/><stop offset=".38" stop-color="#2a2c2f"/><stop offset=".8" stop-color="#0d0e10"/><stop offset="1" stop-color="#000"/></radialGradient>
    <linearGradient id="wRim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".75"/><stop offset=".45" stop-color="#ffffff" stop-opacity="0"/><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></linearGradient>
    <linearGradient id="wRimIn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".85"/><stop offset=".5" stop-color="#000" stop-opacity=".2"/><stop offset="1" stop-color="#fff" stop-opacity=".55"/></linearGradient>
    <linearGradient id="wChrome" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".3" stop-color="#c9ccd1"/><stop offset=".55" stop-color="#7d8188"/><stop offset=".75" stop-color="#d5d8dc"/><stop offset="1" stop-color="#4a4d52"/></linearGradient>
    <radialGradient id="wSpec" cx="36%" cy="28%" r="62%"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".28" stop-color="#fff" stop-opacity=".18"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></radialGradient>
    <radialGradient id="wGlass" cx="50%" cy="50%" r="50%"><stop offset=".72" stop-color="#fff" stop-opacity="0"/><stop offset=".93" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>
    <radialGradient id="wBrass" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff6c8"/><stop offset=".35" stop-color="#d9b350"/><stop offset=".8" stop-color="#8a6a1c"/><stop offset="1" stop-color="#5a4410"/></radialGradient>
    <linearGradient id="wLvB" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#eef0f2"/><stop offset=".8" stop-color="#c3c7cc"/><stop offset="1" stop-color="#9da2a8"/></linearGradient>
    <linearGradient id="wLvTipU" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8d939a"/><stop offset="1" stop-color="#3d4146"/></linearGradient>
    <linearGradient id="wLvTipD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1c1f"/><stop offset="1" stop-color="#000"/></linearGradient>
    <linearGradient id="wLvK" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5d6268"/><stop offset=".22" stop-color="#2e3236"/><stop offset=".7" stop-color="#16181b"/><stop offset="1" stop-color="#060607"/></linearGradient>
    <linearGradient id="wTie" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b7076"/><stop offset=".35" stop-color="#2a2d31"/><stop offset="1" stop-color="#0a0b0c"/></linearGradient>
    <linearGradient id="wBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9e7e1"/><stop offset="1" stop-color="#e2e0da"/></linearGradient>
    <radialGradient id="wTst" cx="36%" cy="30%" r="75%"><stop offset="0" stop-color="#f4f6f8"/><stop offset=".6" stop-color="#b9bec4"/><stop offset="1" stop-color="#7d838a"/></radialGradient>
    <linearGradient id="wRec" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset=".45" stop-color="#14171a"/><stop offset="1" stop-color="#262a2e"/></linearGradient>
    <linearGradient id="wShD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".85"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    <linearGradient id="wWing" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5b5f64"/><stop offset=".25" stop-color="#2b2e31"/><stop offset=".7" stop-color="#141517"/><stop offset="1" stop-color="#050505"/></linearGradient>
    <linearGradient id="wTag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e7c4"/><stop offset="1" stop-color="#cdb684"/></linearGradient>
    <linearGradient id="wPad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6a55"/><stop offset=".45" stop-color="#d32f22"/><stop offset="1" stop-color="#7a1209"/></linearGradient>
    ${Object.entries(btnColor).map(([k, c]) => `<radialGradient id="wBt${k}" cx="36%" cy="30%" r="78%"><stop offset="0" stop-color="${mix(c, '#ffffff', 0.45)}"/><stop offset=".45" stop-color="${c}"/><stop offset=".85" stop-color="${mix(c, '#000000', 0.45)}"/><stop offset="1" stop-color="${mix(c, '#000000', 0.7)}"/></radialGradient>
      <radialGradient id="wBtF${k}" cx="62%" cy="68%" r="70%"><stop offset="0" stop-color="${mix(c, '#ffffff', 0.18)}"/><stop offset=".7" stop-color="${c}"/><stop offset="1" stop-color="${mix(c, '#000000', 0.3)}"/></radialGradient>`).join('')}
    ${Object.entries(lampColor).map(([k, [on, off]]) => `<radialGradient id="wLOn${k}" cx="42%" cy="40%" r="65%"><stop offset="0" stop-color="#ffffff"/><stop offset=".22" stop-color="${mix(on, '#ffffff', 0.55)}"/><stop offset=".6" stop-color="${on}"/><stop offset="1" stop-color="${mix(on, '#000000', 0.35)}"/></radialGradient>
      <radialGradient id="wLOff${k}" cx="38%" cy="34%" r="72%"><stop offset="0" stop-color="${mix(off, '#ffffff', 0.35)}"/><stop offset=".55" stop-color="${off}"/><stop offset="1" stop-color="${mix(off, '#000000', 0.6)}"/></radialGradient>`).join('')}`);
  // ajuste fino (em unidades do painel) do desenho de cada peça sobre a peça do render 3D (medido em captura 3200 px)
  const ALN = { ENERG: [-2.8, -7.4], SN1: [3.7, -0.3], CH1: [1.4, -2.7], CH2: [1.6, -1.2], CH5: [3.7, -1.9] };
  const bezel = (r) => `<circle r="${r + 0.6}" cx="1.5" cy="2.4" fill="#000" opacity=".5" filter="url(#wBl)"/><circle r="${r}" fill="url(#wBlkBez)"/><circle r="${r - 0.35}" fill="none" stroke="url(#wRim)" stroke-width=".9"/>`;
  // alavanca de disjuntor modular (plástico preto com estrias), vista frontal; a ponta voltada para fora fica
  // em cima (I) ou embaixo (O); sombra projetada para baixo no fundo do recorte
  const lever = (x, y0, y1, hw, up, mark) => {
    const x0 = x - hw, w = hw * 2, h = y1 - y0, ym = (y0 + y1) / 2;
    const tip = up ? `<rect x="${x0}" y="${y0}" width="${w}" height="${(h * 0.26).toFixed(2)}" rx="1.4" fill="url(#wLvTipU)"/>`
      : `<rect x="${x0}" y="${(y1 - h * 0.26).toFixed(2)}" width="${w}" height="${(h * 0.26).toFixed(2)}" rx="1.4" fill="url(#wLvTipD)"/>`;
    const r0 = up ? y0 + h * 0.36 : y0 + h * 0.18, ridges = [0, 1, 2, 3].map((i) => `<path d="M${x0 + 1.2} ${(r0 + i * h * 0.12).toFixed(2)} H${x0 + w - 1.2}" stroke="#000" stroke-width=".7" opacity=".8"/><path d="M${x0 + 1.2} ${(r0 + i * h * 0.12 + 0.7).toFixed(2)} H${x0 + w - 1.2}" stroke="#fff" stroke-width=".4" opacity=".22"/>`).join('');
    return `<rect x="${x0 - 1}" y="${y1 - 1}" width="${w + 2}" height="6" fill="url(#wShD)" opacity=".9"/>
      <rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="1.6" fill="url(#wLvK)" filter="url(#wShS)"/>${tip}${ridges}
      <path d="M${x0 + 0.7} ${y0 + 1.6} V${y1 - 1.6}" stroke="#fff" stroke-width=".6" stroke-opacity=".35"/>
      ${mark ? `<text x="${x}" y="${(up ? y1 - 1.6 : y0 + 4.6).toFixed(2)}" text-anchor="middle" font-size="4.2" font-weight="800" fill="${up ? '#ff5446' : '#4fd27a'}" font-family="Arial">${up ? 'I' : 'O'}</text>` : ''}`;
  };
  // recorte da alavanca na tampa: fundo escuro + chanfro claro na borda inferior/direita (que recebe a luz)
  const recess = (x, hw, y0, y1) => `<rect x="${x - hw}" y="${y0}" width="${hw * 2}" height="${y1 - y0}" rx="1.8" fill="url(#wRec)"/>
    <path d="M${x - hw + 0.6} ${y1 - 0.3} H${x + hw - 0.4} V${y0 + 1}" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width=".8"/><path d="M${x - hw + 0.3} ${y1 - 1} V${y0 + 0.3} H${x + hw - 1}" fill="none" stroke="#000" stroke-opacity=".8" stroke-width=".9"/>`;
  // indicador de posição dos contatos (verde = aberto, vermelho = fechado) sobre o indicador do 3D
  const flag = (x, y, w, h) => `<rect class="fl" x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="1.4" fill="#1f9a4a"/><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="1.4" fill="url(#wSpec)" opacity=".6"/><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="1.4" fill="none" stroke="#000" stroke-opacity=".45" stroke-width=".5"/>`;
  for (const w of panel.widgets) {
    const g = el('g', { class: 'wd', transform: `translate(${w.x},${w.y})` }, gW); w.g = g; W.push(w);
    if (w.tip) g.dataset.tip = w.tip;
    const [ax, ay] = ALN[w.dev || w.src] || [0, 0];
    if (w.type === 'lamp') {
      // sinaleiro: bisel preto, aro cromado, cúpula de vidro (núcleo quente + halo quando aceso)
      const s = w.s || 1, k = w.c;
      g.innerHTML = `<g transform="translate(${ax},${ay}) scale(${s})"><g class="glow" opacity="0"><circle r="26" fill="${lampColor[k][0]}" opacity=".55" filter="url(#wHalo)"/><circle r="16" fill="${lampColor[k][0]}" opacity=".7" filter="url(#wBl)"/></g>
        ${bezel(14.5)}<circle r="12.3" fill="url(#wChrome)"/><circle r="11" fill="#111"/>
        <circle class="dome" r="10.4" fill="url(#wLOff${k})"/><circle class="core" r="5.5" cx="-.6" cy="-.6" fill="#fff" opacity="0" filter="url(#wBl)"/>
        <circle r="10.4" fill="url(#wGlass)"/><path d="M-7.6 -3.2 A8 8 0 0 1 -2.6 -7.8" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".75"/><ellipse cx="4.4" cy="5.2" rx="2.2" ry="1.1" transform="rotate(-40 4.4 5.2)" fill="#fff" opacity=".22"/></g>`;
      w.on = `url(#wLOn${k})`; w.off = `url(#wLOff${k})`;
    } else if (w.type === 'btn') {
      // botão faceado: bisel preto, folga escura, cápsula com face côncava; ao pressionar afunda
      const s = w.r || 1, k = w.c;
      g.innerHTML = `<g transform="translate(${ax},${ay}) scale(${s})">${bezel(14.5)}<circle r="11.9" fill="#050505"/><circle r="11.9" fill="none" stroke="url(#wRimIn)" stroke-width="1"/>
        <g class="cap"><circle r="10.6" cx=".7" cy="1.1" fill="#000" opacity=".6" filter="url(#wBl)"/><circle r="10.4" fill="url(#wBt${k})"/><circle r="7.9" fill="url(#wBtF${k})"/><circle r="7.9" fill="none" stroke="#000" stroke-opacity=".25" stroke-width=".6"/>
        <circle r="10.4" fill="url(#wSpec)" opacity=".75"/><path d="M-8.3 -3.4 A9 9 0 0 1 -3.4 -8.4" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".8"/></g>
        <circle class="ps" r="10.6" fill="none" stroke="#000" stroke-width="2.4" opacity="0" filter="url(#wBl)"/></g>`;
    } else if (w.type === 'sel') {
      // seletora com manopla tipo alavanca (asa), cubo central e índice branco
      const s = w.r || 1;
      const wing = `<path d="M-4.4 -12.6 Q0 -14.4 4.4 -12.6 L3.6 12.6 Q0 14.2 -3.6 12.6 Z"/>`;
      g.innerHTML = `<g transform="translate(${ax},${ay}) scale(${s})">${bezel(14.5)}<circle r="12.2" fill="#0a0a0b"/><circle r="12.2" fill="none" stroke="url(#wRimIn)" stroke-width=".9"/>
        <g transform="translate(1.4,2.2)" opacity=".6" filter="url(#wBl)"><g class="knob" fill="#000">${wing}</g></g>
        <g class="knob"><g fill="url(#wWing)">${wing}</g><path d="M-3.9 -12 L-3.1 12" stroke="#fff" stroke-opacity=".28" stroke-width=".7"/></g>
        <circle r="6.2" fill="url(#wBlkBez)"/><circle r="6.2" fill="url(#wSpec)" opacity=".55"/>
        <g class="knob"><rect x="-.8" y="-11.6" width="1.6" height="8.6" rx=".6" fill="#f4f4f4"/></g></g>`;
    } else if (w.type === 'K') {
      g.innerHTML = `<rect x="-34" y="-52" width="70" height="104" rx="4" fill="transparent"/><rect class="flag" x="12" y="-2" width="7" height="9" rx="1" fill="#d8dde1" stroke="rgba(0,0,0,.35)" stroke-width=".5" filter="url(#wShS)"/>
        <rect class="ring" x="-34" y="-53" width="70" height="106" rx="5" fill="none" stroke="#3dff7a" stroke-width="1.3" opacity="0" pointer-events="none" style="filter:drop-shadow(0 0 1.6px #2bd96b)"/><text class="bt" x="0" y="64" text-anchor="middle" font-size="8.5" font-weight="700" fill="#1a7f3c" font-family="Arial"></text>`;
    } else if (w.type === 'relay') {
      g.innerHTML = `<rect x="-18" y="-62" width="36" height="124" fill="transparent"/><circle class="lh" cx="-9" cy="-8" r="6" fill="#3dff6a" opacity="0" filter="url(#wBl)"/><circle class="led" cx="-9" cy="-8" r="2.4" fill="#2a3a2c" stroke="rgba(0,0,0,.5)" stroke-width=".5"/><circle cx="-9.7" cy="-8.8" r=".8" fill="#fff" opacity=".6"/><text class="tm" x="0" y="76" text-anchor="middle" font-size="8" font-weight="700" fill="#1f6fd1" font-family="Arial"></text>`;
    } else if (w.type === 'ctd') {
      g.innerHTML = `<rect x="-50" y="-40" width="100" height="90" fill="transparent"/><text class="v" x="0" y="-2" text-anchor="middle" font-family="Consolas,monospace" font-weight="700" font-size="20" fill="#ff4b3a" style="filter:drop-shadow(0 0 2px #ff3b28)">0.0</text><text class="sv" x="0" y="12" text-anchor="middle" font-family="Consolas,monospace" font-weight="700" font-size="9" fill="#5ef06a" style="filter:drop-shadow(0 0 1.5px #3dff6a)">SP 5.0s</text>`;
    } else if (w.type === 'mainBreaker') {
      // alavancas sobre os recortes do modelo 3D (polos a -11,5 / 19,75 / 51 un; recorte y -22,1..8,6), com barra de acoplamento
      const XS = [-11.5, 19.75, 51], cx = 19.75, HW = 5.7;
      const POS = { u: [-19.2, -1.6, 1], m: [-15.6, 2, 1], d: [-12.2, 5.4, 0] };
      const tie = (y) => `<rect x="${XS[0] - HW}" y="${y + 1.4}" width="${XS[2] - XS[0] + HW * 2}" height="2.6" rx="1.2" fill="#000" opacity=".45" filter="url(#wBl)"/><rect x="${XS[0] - HW}" y="${y}" width="${XS[2] - XS[0] + HW * 2}" height="2.6" rx="1.2" fill="url(#wTie)"/>`;
      g.innerHTML = `<rect x="-50" y="-67" width="120" height="134" fill="transparent"/>` + XS.map((x) => recess(x, 7.6, -22.6, 9.1)).join('') + XS.map((x) => flag(x + 0.4, -33.7, 9.4, 6.2)).join('') +
        ['u', 'm', 'd'].map((s) => { const [a, b, up] = POS[s];
          return `<g class="lev" data-s="${s}" opacity="${s === 'd' ? 1 : 0}">${s !== 'd' ? [[-4.3, 12.4], [26.9, 43.6]].map(([p, q]) => `<rect x="${p}" y="5.6" width="${q - p}" height="4.2" fill="url(#wBody)"/>`).join('') : ''}${XS.map((x) => lever(x, a, b, HW, up, s !== 'm')).join('')}${tie(up ? a + 1.2 : b - 2.2)}</g>`; }).join('') +
        `<text class="st" x="${cx}" y="63" text-anchor="middle" font-size="8.5" font-weight="800" font-family="Arial" paint-order="stroke" stroke="rgba(255,250,225,.85)" stroke-width="1.6"></text>
        <g class="lock" opacity="0" transform="translate(${cx},0)"><g filter="url(#wSh)"><path d="M-7 -29 v-8 a7 7 0 0 1 14 0 v8" fill="none" stroke="url(#wChrome)" stroke-width="3.2"/>
        <rect x="-11" y="-31" width="22" height="18" rx="2.5" fill="url(#wPad)"/><rect x="-11" y="-31" width="22" height="18" rx="2.5" fill="url(#wSpec)" opacity=".5"/><circle cx="0" cy="-23.5" r="2" fill="#2a0b07"/><rect x="-.7" y="-23" width="1.4" height="4" fill="#2a0b07"/></g>
        <path d="M8 -20 Q14 -22 15 -26" fill="none" stroke="#777" stroke-width=".8"/><g filter="url(#wSh)"><rect x="14" y="-28" width="34" height="46" rx="2" fill="#fff" stroke="#c62828" stroke-width="2"/><circle cx="18" cy="-24" r="1.4" fill="#bbb"/></g><text x="31" y="-15" text-anchor="middle" font-size="5.5" font-weight="800" fill="#c62828" font-family="Arial">PERIGO</text><text x="31" y="-5" text-anchor="middle" font-size="4.6" font-weight="700" fill="#222" font-family="Arial">NÃO</text><text x="31" y="2" text-anchor="middle" font-size="4.6" font-weight="700" fill="#222" font-family="Arial">LIGUE</text></g>`;
    } else if (w.type === 'key') {
      // comutador com chave sobre o cilindro do 3D (+32,7 / -3,9 un); a etiqueta cobre a etiqueta do render
      g.innerHTML = `<g transform="translate(32.7,-3.9)"><circle r="16" fill="transparent"/>
        <g class="tag" filter="url(#wSh)"><path d="M-1.4 5 Q2 11 5.5 13" fill="none" stroke="#6b6b6b" stroke-width=".9"/><path d="M-1.5 12 L15.8 10.4 L17.6 29.4 L0.4 31 Z" fill="url(#wTag)" stroke="#a48d5c" stroke-width=".6"/><circle cx="5.6" cy="14.6" r="1.4" fill="#8a7650"/><path d="M3 21 h10 M3.4 24.4 h9" stroke="#8a7650" stroke-width=".7" opacity=".7"/></g>
        ${bezel(12)}<circle r="10.2" fill="url(#wChrome)"/><circle r="8.4" fill="#0b0b0c"/><circle r="7.6" fill="url(#wBrass)"/><circle r="7.6" fill="url(#wSpec)" opacity=".5"/>
        <g transform="rotate(0)"><rect x="-1.1" y="-5.6" width="2.2" height="11.2" rx=".6" fill="#2a2008"/></g>
        <g class="kb"><g transform="translate(1.4,2.2)" opacity=".55" filter="url(#wBl)"><path d="M-1.8 -2 V-8 Q-6 -9 -6 -14.5 Q-6 -20.5 0 -20.5 Q6 -20.5 6 -14.5 Q6 -9 1.8 -8 V-2 Z" fill="#000"/></g>
          <path d="M-1.8 -2 V-8 Q-6 -9 -6 -14.5 Q-6 -20.5 0 -20.5 Q6 -20.5 6 -14.5 Q6 -9 1.8 -8 V-2 Z" fill="url(#wBrass)" stroke="#6b5012" stroke-width=".5"/>
          <circle cx="0" cy="-15.5" r="1.8" fill="#3a2c08"/><path d="M-4.4 -16 Q-4 -19.2 -.6 -19.4" fill="none" stroke="#fff" stroke-width=".9" stroke-opacity=".8" stroke-linecap="round"/><rect x="-1.8" y="-4" width="3.6" height="2" fill="#000" opacity=".3"/></g>
        <text class="kt" x="-15" y="3" text-anchor="end" font-size="7.5" font-weight="700" fill="#1a7f3c" font-family="Arial" paint-order="stroke" stroke="rgba(255,250,225,.9)" stroke-width="1.6"></text></g>`;
    } else if (w.type === 'dr') {
      // DR: alavanca sobre o recorte do 3D (x 43,2..60,4; y -18,6..12,6) e botão redondo de teste T sobre o do 3D
      const lx = 51.8, HW = 6.6;
      g.innerHTML = `<rect x="-59" y="-66" width="124" height="132" fill="transparent"/>${recess(lx, 9, -19.1, 13.1)}${flag(51.9, -32.3, 10.4, 6.2)}` +
        `<g class="lev" data-s="u" opacity="0">${lever(lx, -17, 3.4, HW, 1, 1)}</g><g class="lev" data-s="d" opacity="1">${lever(lx, -9.5, 10.9, HW, 0, 1)}</g>` +
        `<g transform="translate(25.5,11.9)">${bezel(7.6)}<circle r="5.9" fill="#0a0a0a"/><circle r="5.4" fill="url(#wTst)"/><circle r="5.4" fill="url(#wSpec)" opacity=".6"/><text y="2" text-anchor="middle" font-size="6" font-weight="800" fill="#24272b" font-family="Arial">T</text></g>
        <text class="st" x="12.5" y="65" text-anchor="middle" font-size="8.5" font-weight="800" font-family="Arial" paint-order="stroke" stroke="rgba(255,250,225,.85)" stroke-width="1.6"></text>`;
    } else if (w.type === 'gst') {
      const { w: gw, h: gh } = GSTr;
      g.innerHTML = `<rect width="${gw}" height="${gh}" rx="5" fill="#f4f6f8" stroke="#8a96a2" stroke-width="2" filter="url(#fSh)"/>
        <path d="M0 20 Q120 -10 210 60 L210 ${gh} L0 ${gh} Z" fill="#2c66c4" opacity=".95"/><path d="M0 50 Q90 30 170 90 L170 ${gh} L0 ${gh} Z" fill="#fff" opacity=".18"/>
        ${['R', 'S', 'T'].map((p, i) => `<rect x="${24 + i * 92}" y="14" width="74" height="40" rx="3" fill="#1b1f24"/><rect x="${30 + i * 92}" y="19" width="62" height="24" fill="#a9bba0"/><text class="gv${p}" x="${88 + i * 92}" y="37" text-anchor="end" font-family="Consolas,monospace" font-size="16" font-weight="700" fill="#1d2618">0</text><text x="${30 + i * 92}" y="52" font-size="8" font-weight="800" fill="#fff" font-family="Arial">${p}</text><text x="${76 + i * 92}" y="52" font-size="6" fill="#fff" font-family="Arial">Volts</text>`).join('')}
        <text x="${gw - 20}" y="16" text-anchor="end" font-size="9" font-weight="800" fill="#1e2a3a" font-family="Arial">Gerador de Sistemas Trifásicos  GST</text>
        <rect x="${gw - 150}" y="26" width="120" height="34" rx="3" fill="#1b1f24"/><rect x="${gw - 144}" y="31" width="108" height="14" fill="#9fc28f"/><text class="gst" x="${gw - 90}" y="42" text-anchor="middle" font-family="Consolas,monospace" font-size="9" font-weight="700" fill="#1d2618">DESLIGADO</text><text x="${gw - 90}" y="56" text-anchor="middle" font-size="11" font-weight="800" fill="#fff" font-family="Arial" letter-spacing="8">RST</text>
        ${Array.from({ length: 16 }, (_, i) => `<rect x="${gw - 140 + (i % 4) * 26}" y="${70 + Math.floor(i / 4) * 24}" width="20" height="18" rx="2" fill="#e6e8ea" stroke="#9aa"/>`).join('')}
        <text x="14" y="${gh - 30}" font-size="9" font-weight="800" fill="#fff" font-family="Arial" transform="rotate(-90 14 ${gh - 30})">SAÍDAS</text>
        ${[60, 150, 240].map((x, i) => `<text x="${x + 16}" y="${GSTr.h - 72}" font-size="8" font-weight="700" fill="#fff" font-family="Arial">${'RST'[i]}</text><text x="${x + 16}" y="${GSTr.h - 36}" font-size="6" fill="#fff" font-family="Arial">Neutro</text>`).join('')}
        <circle class="gled" cx="${gw - 168}" cy="34" r="4" fill="#3a2a2a"/><text x="${gw - 176}" y="48" text-anchor="end" font-size="5.5" fill="#1e2a3a" font-family="Arial">SAÍDAS</text>`;
    } else if (w.type === 'extEmerg') {
      const { w: ew, h: eh } = EXTr;
      g.innerHTML = `<rect width="${ew}" height="${eh}" rx="6" fill="#2b2d30" stroke="#f2c514" stroke-width="3" stroke-dasharray="10 6" filter="url(#fSh)"/>
        <text x="${ew / 2}" y="18" text-anchor="middle" font-size="9.5" font-weight="800" fill="#f2c514" font-family="Arial">ACESSÓRIO EXTERNO</text><text x="${ew / 2}" y="30" text-anchor="middle" font-size="7" fill="#ddd" font-family="Arial">não faz parte do KET-1030</text>
        <circle cx="80" cy="88" r="40" fill="#f2c514"/><text x="80" y="140" text-anchor="middle" font-size="7.5" font-weight="800" fill="#f2c514" font-family="Arial">EMERGÊNCIA</text>
        <g transform="translate(80,88)"><circle r="20" fill="#333"/><g class="cap"><circle r="27" fill="#c81616" filter="url(#fSh)"/><ellipse cx="-8" cy="-10" rx="11" ry="6" fill="#fff" opacity=".3"/></g></g><text class="lt" x="150" y="136" font-size="8" font-weight="800" fill="#ff6b5a" font-family="Arial"></text>`;
    } else if (w.type === 'motorMount' && bg3d && bg3d.fan) {
      // disco estroboscópico de frente sobre o motor 3D (gira com o motor)
      const F = bg3d.fan, R0 = F.r; g.setAttribute('transform', `translate(${F.x.toFixed(1)},${F.y.toFixed(1)})`);
      const star = (n, r1, r2, off, fill) => `<polygon fill="${fill}" points="${Array.from({ length: n * 2 }, (_, i) => { const a = off + (i * Math.PI) / n, r = (i % 2 ? r2 : r1) * R0 / 256; return `${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`; }).join(' ')}"/>`;
      g.innerHTML = `<circle r="${R0 * 1.02}" cx="1.2" cy="1.8" fill="rgba(0,0,0,.3)"/><g class="rot"><circle r="${R0}" fill="#efe4c4" stroke="#c9b98e" stroke-width="${R0 * 0.025}"/>
        ${star(24, 226, 176, 0, '#111')}${star(24, 196, 150, Math.PI / 24, '#efe4c4')}${star(18, 150, 104, 0, '#111')}${star(18, 122, 82, Math.PI / 18, '#efe4c4')}${star(12, 84, 50, 0, '#111')}${star(12, 60, 34, Math.PI / 12, '#efe4c4')}
        <circle r="${R0 * 0.065}" fill="#9a8f74"/></g><circle class="blur" r="${R0}" fill="#8a8370" opacity="0"/>
        <text class="rpm" x="${R0 * 0.3}" y="${R0 + 11}" text-anchor="end" font-size="9" font-weight="800" fill="#1e2a3a" font-family="Arial">parado</text>`;
    } else if (w.type === 'motorMount') {
      const fins = Array.from({ length: 9 }, (_, i) => `<rect x="${-62 + i * 13}" y="-46" width="5" height="92" rx="2" fill="#4c5a68"/>`).join('');
      const sect = Array.from({ length: 6 }, (_, i) => `<path d="M0 0 L${(20 * Math.cos(i * Math.PI / 3)).toFixed(2)} ${(20 * Math.sin(i * Math.PI / 3)).toFixed(2)} A20 20 0 0 1 ${(20 * Math.cos((i + 0.5) * Math.PI / 3)).toFixed(2)} ${(20 * Math.sin((i + 0.5) * Math.PI / 3)).toFixed(2)} Z" fill="${i % 2 ? '#d9dde1' : '#e8b714'}"/>`).join('');
      g.innerHTML = `<g filter="url(#fSh)"><rect x="-70" y="-40" width="140" height="80" rx="16" fill="#5f6f7e"/>${fins}<rect x="-70" y="-40" width="140" height="80" rx="16" fill="none" stroke="#2f3a44" stroke-width="2"/>
        <rect x="64" y="-34" width="26" height="68" rx="10" fill="#3d4954"/><circle cx="77" cy="0" r="22" fill="#2a333b"/>${Array.from({ length: 8 }, (_, i) => `<rect x="${71 + (i % 2) * 6}" y="${-16 + Math.floor(i / 2) * 9}" width="4" height="6" fill="#121619"/>`).join('')}
        <rect x="-22" y="-62" width="46" height="24" rx="4" fill="#53626f" stroke="#2f3a44" stroke-width="1.5"/><text x="1" y="-46" text-anchor="middle" font-size="7" font-weight="700" fill="#e8ecef" font-family="Arial">M1 3~</text>
        <rect x="-50" y="16" width="44" height="18" rx="2" fill="#dfe3e6" stroke="#9aa3ab"/><text x="-28" y="24" text-anchor="middle" font-size="4.6" font-weight="700" fill="#1e2a3a" font-family="Arial">0,5 cv · 1720 rpm</text><text x="-28" y="31" text-anchor="middle" font-size="4.2" fill="#1e2a3a" font-family="Arial">380 Δ / 660 Y V · 1,05 A</text>
        <rect x="-86" y="-5" width="18" height="10" fill="#b9c0c6"/></g>
        <g transform="translate(-81,0)"><circle r="23" fill="#333"/><g class="rot">${sect}<circle r="4" fill="#555"/></g><circle class="blur" r="20" fill="#cfcfcf" opacity="0"/></g>
        <text class="rpm" x="0" y="58" text-anchor="middle" font-size="9" font-weight="800" fill="#1e2a3a" font-family="Arial">parado</text>`;
    } else if (w.type === 'motorArea') {
      g.innerHTML = `<rect class="glow" x="${-w.w / 2}" y="${-w.h / 2}" width="${w.w}" height="${w.h}" rx="8" fill="#ff9a1f" opacity="0"/>`;
      g.style.pointerEvents = 'none';
    }
  }

  // ---------- obstáculos (bornes, peças 3D, widgets, textos já colocados) ----------
  const jkAll = panel.jacks.filter((j) => !j.ext).map((j) => [j.x, j.y]);
  const placed = [];
  const ctx2 = document.createElement('canvas').getContext('2d');
  const widthOf = (t, fs, w) => { ctx2.font = `${w} ${fs}px Arial, Helvetica, sans-serif`; return ctx2.measureText(t).width; };
  const rectCirc = (x0, y0, x1, y1, x, y, r) => { const cx = Math.max(x0, Math.min(x, x1)), cy = Math.max(y0, Math.min(y, y1)); return (cx - x) ** 2 + (cy - y) ** 2 < r * r; };
  const hitsJack = (x0, y0, x1, y1, r = 8.5) => jkAll.some(([x, y]) => rectCirc(x0, y0, x1, y1, x, y, r));
  const hitsText = (x0, y0, x1, y1) => placed.some((q) => !(x1 < q[0] || x0 > q[2] || y1 < q[1] || y0 > q[3]));
  // ocupação real (máscara 3D: componentes, bornes, fios, trilhos)
  const hitsObj = (x0, y0, x1, y1) => { const B = bg3d; if (!B || !B.occ) return false; const st = 1.6;
    for (let y = y0; y <= y1; y += st) for (let x = x0; x <= x1; x += st) { const u = Math.round((x - B.VX) * B.k), v = Math.round((y - B.VY) * B.k); if (u >= 0 && v >= 0 && u < B.cw && v < B.ch && B.occ[v * B.cw + u]) return true; }
    return false; };
  // contorno aproximado dos widgets SVG (que podem extrapolar a peça 3D): círculos [x,y,r] e retângulos
  const wCirc = [], wRect = [];
  for (const w of W) {
    const [ax, ay] = ALN[w.dev || w.src] || [0, 0];
    if (w.type === 'lamp') wCirc.push([w.x + ax, w.y + ay, 15.5 * (w.s || 1)]);
    else if (w.type === 'btn' || w.type === 'sel') wCirc.push([w.x + ax, w.y + ay, 15.5 * (w.r || 1)]);
    else if (w.type === 'key') { const kx = w.x + 32.7, ky = w.y - 3.9; wCirc.push([kx, ky, 13.5], [kx, ky - 14.5, 7.5]); wRect.push([kx - 2.5, ky + 4, kx + 18.6, ky + 32]); }
    else if (w.type === 'motorMount' && bg3d && bg3d.fan) wCirc.push([bg3d.fan.x, bg3d.fan.y, bg3d.fan.r + 1]);
  }
  const hitsWid = (x0, y0, x1, y1) => wCirc.some(([x, y, r]) => rectCirc(x0, y0, x1, y1, x, y, r)) || wRect.some((q) => !(x1 < q[0] || x0 > q[2] || y1 < q[1] || y0 > q[3]));
  // textos ficam ACIMA dos cabos (legíveis), sem capturar cliques
  const gT = el('g', { 'pointer-events': 'none', class: 'ftx' }, svg);
  svg.insertBefore(gT, gN);
  const halo = (c) => (/^#(f|e|d)/i.test(c) ? 'rgba(0,0,0,.6)' : 'rgba(255,250,225,.95)');

  // ---------- textos da face (vetoriais, nítidos em qualquer zoom) sem sobrepor bornes, peças, widgets nem outros textos ----------
  if (bg3d && bg3d.texts && bg3d.texts.length) {
    // títulos e nomes grandes primeiro; rótulos curtos (bornes) depois
    const list = [...bg3d.texts].sort((a, b) => (b.title - a.title) || (b.fs - a.fs));
    let html = '';
    for (const r of list) {
      let fs = Math.max(r.fs * (r.t.length <= 3 ? 0.86 : 0.92), 7);
      const wd = r.title ? Math.abs(r.x2 - r.x) : widthOf(r.t, fs, r.w);
      const h = fs * 0.8;
      if (r.title) { html += `<text x="${r.x.toFixed(1)}" y="${r.y.toFixed(1)}" dominant-baseline="central" textLength="${wd.toFixed(1)}" lengthAdjust="spacingAndGlyphs" font-size="${fs.toFixed(1)}" font-weight="600" fill="${r.color}" font-family="DIN Condensed, Arial Narrow, Arial, sans-serif" paint-order="stroke" stroke="${halo(r.color)}" stroke-width="${(fs * 0.08).toFixed(2)}" stroke-linejoin="round">${esc(r.t)}</text>`; placed.push([r.x, r.y - h / 2, r.x + wd, r.y + h / 2]); continue; }
      // posição original e alternativas próximas, a primeira livre vence
      const cands = [[0, 0], [0, -6], [0, 6], [0, -10], [0, 10], [-wd / 2 - 9, 0], [wd / 2 + 9, 0], [0, -14], [0, 14], [-wd / 2 - 9, -7], [wd / 2 + 9, -7], [-wd / 2 - 9, 7], [wd / 2 + 9, 7], [wd / 2 + 11, 0], [-wd / 2 - 11, 0], [0, -18], [0, 18], [wd / 2 + 12, -10], [-wd / 2 - 12, -10], [wd / 2 + 12, 10], [-wd / 2 - 12, 10]];
      let best = null;
      for (let pass = 0; pass < 3 && !best; pass++) {
        for (const [dx, dy] of cands) {
          const cx = r.x + dx, cy = r.y + dy, x0 = cx - wd / 2 - 0.6, x1 = cx + wd / 2 + 0.6, y0 = cy - h / 2 - 0.4, y1 = cy + h / 2 + 0.4;
          if (y1 < FH + 34 && x0 > 4 && x1 < FW - 4 && !hitsJack(x0, y0, x1, y1) && !hitsText(x0, y0, x1, y1) && !hitsObj(x0, y0, x1, y1) && !hitsWid(x0, y0, x1, y1)) { best = [cx, cy, x0, y0, x1, y1]; break; }
        }
        if (!best) { fs *= 0.86; }
      }
      if (!best) best = [r.x, r.y, r.x - wd / 2, r.y - h / 2, r.x + wd / 2, r.y + h / 2];
      placed.push(best.slice(2));
      html += `<text x="${best[0].toFixed(1)}" y="${best[1].toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="${fs.toFixed(1)}" font-weight="${r.w}" fill="${r.color}" font-family="Arial, Helvetica, sans-serif" paint-order="stroke" stroke="${halo(r.color)}" stroke-width="${(fs * 0.24).toFixed(2)}" stroke-linejoin="round">${esc(r.t)}</text>`;
    }
    gT.innerHTML = html;
  }

  // ---------- etiquetas de estado dos widgets (LIGADO, I · LIGADO, LIGADA, temporizações, rpm) ----------
  // ficam na camada de textos (acima dos cabos) e são posicionadas em espaço livre perto da peça
  {
    const gL = el('g', { 'pointer-events': 'none', class: 'wtx' }, gT);
    const LBL = { K: ['.bt', 'LIGADO'], relay: ['.tm', '10.0/10 s'], mainBreaker: ['.st', 'O · DESLIGADO'], dr: ['.st', 'DR ATUADO'], key: ['.kt', 'chave retirada'], motorMount: ['.rpm', '1736 rpm ↻'] };
    // anéis de busca: primeiro abaixo, depois laterais, depois acima
    const ANG = [90, 60, 120, 30, 150, 0, 180, 45, 135, 15, 165, 270, 240, 300, 210, 330].map((a) => (a * Math.PI) / 180);
    for (const w of W) {
      const spec = LBL[w.type]; if (!spec) continue;
      const t = w.g.querySelector(spec[0]); if (!t) continue;
      // posição absoluta original do texto
      let ox = +t.getAttribute('x'), oy = +t.getAttribute('y');
      const inner = t.parentNode !== w.g ? t.parentNode.getAttribute('transform') : '';
      const tm = /translate\(([-\d.]+),\s*([-\d.]+)\)/.exec(inner || ''); if (tm) { ox += +tm[1]; oy += +tm[2]; }
      const gx = /translate\(([-\d.]+),\s*([-\d.]+)\)/.exec(w.g.getAttribute('transform') || '') || [0, w.x, w.y];
      const bx = +gx[1], by = +gx[2];
      const fs = +t.getAttribute('font-size') || 8.5, wt = t.getAttribute('font-weight') || 700;
      const wd = widthOf(spec[1], fs, wt), h = fs * 0.85;
      // ponto de partida: perto do texto original, mas só um pouco afastado da peça
      const isK = w.type === 'key', sx = isK ? bx + 32.7 - 17 - wd / 2 : bx + ox * 0.85, sy = isK ? by - 3.9 : by + oy * 0.85;
      let best = null;
      for (let rr = 0; rr <= 120 && !best; rr += 4) {
        for (const a of rr ? ANG : [0]) {
          const cx = sx + Math.cos(a) * rr * 1.3, cy = sy + Math.sin(a) * rr, mg = 4;
          const x0 = cx - wd / 2 - mg, x1 = cx + wd / 2 + mg, y0 = cy - h / 2 - mg, y1 = cy + h / 2 + mg;
          if (x0 > 8 && x1 < FW - 8 && y0 > 8 && y1 < FH - 6 && !hitsJack(x0, y0, x1, y1, 11) && !hitsText(x0, y0, x1, y1) && !hitsObj(x0, y0, x1, y1) && !hitsWid(x0, y0, x1, y1)) { best = [cx, cy, x0, y0, x1, y1]; break; }
        }
      }
      if (!best) best = [bx + ox, by + oy, bx + ox - wd / 2, by + oy - h / 2, bx + ox + wd / 2, by + oy + h / 2];
      placed.push(best.slice(2));
      w.gt = el('g', {}, gL);
      t.setAttribute('x', best[0].toFixed(1)); t.setAttribute('y', best[1].toFixed(1));
      t.setAttribute('text-anchor', 'middle'); t.setAttribute('dominant-baseline', 'central');
      t.setAttribute('paint-order', 'stroke'); t.setAttribute('stroke', 'rgba(255,250,225,.95)'); t.setAttribute('stroke-width', (fs * 0.24).toFixed(2)); t.setAttribute('stroke-linejoin', 'round');
      w.gt.appendChild(t);
    }
  }
  // ---------- cabos ----------
  const rnd = (i) => { const x = Math.sin(i * 127.1 + 31.7) * 43758.5453; return x - Math.floor(x); };
  function stackIndex() {
    const m = new Map(), idx = new Map();
    for (const w of sim.wires) for (const end of ['ja', 'jb']) { const j = w[end]; const k = m.get(j) || 0; idx.set(w.id + end, k); m.set(j, k + 1); }
    return idx;
  }
  // empilhamento de plugues no mesmo borne: desloca pouco e para o lado mais livre (longe de bornes vizinhos e widgets)
  const stackDirs = new Map();
  function stackDir(j) {
    let d = stackDirs.get(j.id); if (d) return d;
    const obs = jkAll.map(([x, y]) => [x, y, 1]).concat(wCirc.map(([x, y, r]) => [x, y, r / 9]));
    let best = [0.7071, -0.7071], bs = -1;
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8, ux = Math.cos(a), uy = Math.sin(a);
      // ponto de teste ~1 raio de plugue à frente; pontuação = folga mínima até obstáculos (preferindo cima/direita em empate)
      const px = j.x + ux * 9, py = j.y + uy * 9;
      let mn = 1e9; for (const [x, y, w] of obs) { if (Math.abs(x - j.x) < 0.5 && Math.abs(y - j.y) < 0.5) continue; mn = Math.min(mn, Math.hypot(px - x, py - y) / w); }
      const sc = Math.min(mn, 40) + (ux - uy) * 0.4 - (uy > 0.5 ? 3 : 0);
      if (sc > bs) { bs = sc; best = [ux, uy]; }
    }
    stackDirs.set(j.id, best); return best;
  }
  function cablePath(p1, p2, seed) {
    const dx = p2[0] - p1[0], dy = p2[1] - p1[1], d = Math.hypot(dx, dy);
    const sag = 18 + d * (0.2 + 0.08 * rnd(seed));
    return `M${p1[0].toFixed(1)} ${p1[1].toFixed(1)} C${(p1[0] + dx * 0.12).toFixed(1)} ${(p1[1] + sag).toFixed(1)} ${(p2[0] - dx * 0.12).toFixed(1)} ${(p2[1] + sag).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  // Pino banana 4 mm de segurança (IEC 61010-031 / ABNT NBR IEC 61010-031): luva isolante rígida que cobre o pino,
  // traseira empilhável (soquete de 4 mm), alívio de tração no cabo e marcação de categoria CAT III 1000 V / 32 A.
  function safetyPlug(p, u, c, dk) {
    const [x, y] = p;
    const ang = (Math.atan2(u[1], u[0]) * 180) / Math.PI; // alinhado com a saída do cabo
    return `<g class="plug">
      <g transform="translate(${x},${y}) rotate(${ang.toFixed(1)})">
        <rect x="4" y="-3.6" width="17" height="7.2" rx="3.2" fill="${dk}"/>
        <rect x="5" y="-2.7" width="15" height="5.4" rx="2.6" fill="${c}"/>
        ${[8.5, 11.5, 14.5, 17.5].map((r) => `<rect x="${r}" y="-2.7" width="1" height="5.4" fill="${dk}" opacity=".45"/>`).join('')}
      </g>
      <circle cx="${x}" cy="${y}" r="8.6" fill="${dk}"/>
      <circle cx="${x}" cy="${y}" r="7.5" fill="${c}"/>
      <circle cx="${x}" cy="${y}" r="7.5" fill="url(#lzPlugSh)"/>
      <circle cx="${x}" cy="${y}" r="3.6" fill="#1a1a1a"/>
      <circle cx="${x}" cy="${y}" r="3.6" fill="none" stroke="#c9ccd0" stroke-width="1.1"/>
      <circle cx="${x}" cy="${y}" r="1.5" fill="#000"/>
      <path d="M${x - 5.6} ${y - 4.4} A7 7 0 0 1 ${x + 2} ${y - 6.8}" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.3" stroke-linecap="round"/>
    </g>`;
  }
  function drawCables() {
    gC.innerHTML = '';
    const idx = stackIndex(), op = X.transparent ? 0.38 : 1;
    for (const w of sim.wires) {
      const A = jackById.get(w.ja), B = jackById.get(w.jb); if (!A || !B) continue;
      const ka = idx.get(w.id + 'ja'), kb = idx.get(w.id + 'jb');
      const da = stackDir(A), db = stackDir(B), ST = 3.2;
      const pa = [SX(A.x) + da[0] * ka * ST, SY(A.y) + da[1] * ka * ST], pb = [SX(B.x) + db[0] * kb * ST, SY(B.y) + db[1] * kb * ST];
      const [c, dk] = CABLE[w.color] || CABLE.R;
      // direção de saída do cabo em cada pino = tangente da curva; o cabo começa na ponta do alívio de tração
      const ddx = pb[0] - pa[0], dd = Math.hypot(ddx, pb[1] - pa[1]), sag = 18 + dd * (0.2 + 0.08 * rnd(w.id));
      const nrm = (x, y) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
      const ua = nrm(ddx * 0.12, sag), ub = nrm(-ddx * 0.12, sag), TL = 20;
      const ta = [pa[0] + ua[0] * TL, pa[1] + ua[1] * TL], tb = [pb[0] + ub[0] * TL, pb[1] + ub[1] * TL];
      const d = `M${ta[0].toFixed(1)} ${ta[1].toFixed(1)} C${(ta[0] + ua[0] * sag * 0.9).toFixed(1)} ${(ta[1] + ua[1] * sag * 0.9).toFixed(1)} ${(tb[0] + ub[0] * sag * 0.9).toFixed(1)} ${(tb[1] + ub[1] * sag * 0.9).toFixed(1)} ${tb[0].toFixed(1)} ${tb[1].toFixed(1)}`;
      const g = el('g', { class: 'cb', 'data-w': w.id, opacity: op }, gC);
      g.innerHTML = `<path d="${d}" fill="none" stroke="transparent" stroke-width="14"/><path class="cbo" d="${d}" fill="none" stroke="${dk}" stroke-width="6.4" stroke-linecap="round"/>
        <path d="${d}" fill="none" stroke="${c}" stroke-width="4.6" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1.2" transform="translate(-1,-1)"/>` +
        [[pa, ua], [pb, ub]].map(([p, u]) => safetyPlug(p, u, c, dk)).join('');
    }
  }
  const jackOfTerm = (t) => (jacksByTerm.get(t) || [])[0];
  function addWireJ(ja, jb, color, id) {
    const A = jackById.get(ja), B = jackById.get(jb);
    const w = sim.addWire(A.t, B.t, color, id); w.ja = ja; w.jb = jb; return w;
  }

  // ---------- registro / infrações ----------
  function log(msg, cls = '') {
    X.log.push({ t: X.elapsed, msg, cls });
    const d = document.createElement('div'); if (cls) d.className = cls; d.innerHTML = `<i>${mmss(X.elapsed)}</i>${msg}`;
    const L = $('#lzLog'); L.prepend(d); while (L.children.length > 80) L.lastChild.remove();
  }
  function infraction(code, msg) {
    const last = X.infr.filter((i) => i.code === code).pop();
    if (last && X.elapsed - last.t < 6) return;
    X.infr.push({ t: X.elapsed, code, msg });
    log('⚠ INFRAÇÃO NR-10: ' + msg, 'e');
    const b = $('#lzInfB'); b.style.display = 'inline-block'; b.textContent = X.infr.length;
    flash(); renderNR();
  }
  function flash() { const f = $('#lzFlash'); f.classList.add('go'); requestAnimationFrame(() => requestAnimationFrame(() => f.classList.remove('go'))); }
  const toast = (m, warn) => (opts.toast ? opts.toast(m, warn, 5200) : null);
  let toastBox = null;
  function say(msg, kind = 'info') {
    if (!toastBox) { toastBox = document.createElement('div'); toastBox.style.cssText = 'position:absolute;left:50%;top:12px;transform:translateX(-50%);z-index:4;max-width:min(720px,90%);padding:8px 14px;border-radius:7px;font-weight:600;box-shadow:0 4px 18px rgba(0,0,0,.3);display:none'; wrap.appendChild(toastBox); }
    toastBox.style.background = kind === 'err' ? '#c62828' : kind === 'warn' ? '#fff4d6' : '#f6f8fb'; toastBox.style.color = kind === 'err' ? '#fff' : '#1e2a3a';
    toastBox.style.border = kind === 'warn' ? '1px solid #e0b43c' : '1px solid #c9d1dc';
    toastBox.innerHTML = msg; toastBox.style.display = 'block'; clearTimeout(say.h); say.h = setTimeout(() => (toastBox.style.display = 'none'), kind === 'err' ? 7000 : 4500);
  }

  // ---------- NR-10 ----------
  const PAIRS = ['L1-L2', 'L1-L3', 'L2-L3', 'L1-N', 'L2-N', 'L3-N'];
  const energized = () => sim.mainOn && !sim.mainTrip;
  function nrUpdate() {
    const n = X.nr, meas = PAIRS.every((p) => n.meas[p]);
    n.liberado = !X.qf && n.loto && meas && n.testBefore && n.protect && n.sign;
    if (n.liberado && !X.everLiberado) { X.everLiberado = true; log('Bancada LIBERADA para intervenção (desenergizada, bloqueada, ausência de tensão constatada).'); }
  }
  function canModify(what) {
    if (sim.gst.on && !sim.gst.fault) {
      infraction('gst', `Tentativa de ${what} com as saídas do GST ENERGIZADAS — risco de choque elétrico (NR-10, 10.5.1).`);
      say(`⚡ As saídas do <b>GST</b> estão ligadas. Desligue-as antes de ${what}. Infração registrada.`, 'err'); return false;
    }
    if (energized()) {
      infraction('energ', `Tentativa de ${what} com a bancada ENERGIZADA — risco de choque elétrico. Intervenções só com a instalação desenergizada (NR-10, 10.5.1).`);
      say(`⚡ <b>Risco de choque elétrico!</b> A bancada está energizada. Desenergize e bloqueie antes de ${what}. Infração registrada.`, 'err');
      return false;
    }
    if (X.requireNR && !X.nr.liberado) {
      infraction('proc', `Tentativa de ${what} sem concluir o procedimento de desenergização (seccionamento, bloqueio, constatação de ausência de tensão, proteção e sinalização — NR-10, 10.5.1).`);
      say(`Complete a <b>desenergização NR-10</b> antes de ${what} (aba NR-10). Infração registrada.`, 'warn'); setTab('nr');
      return false;
    }
    return true;
  }
  function syncMain() { sim.mainOn = X.qf && X.key; sim.dirty = true; sim.settle(); renderTop(); }
  function setMain(on) {
    if (on) {
      X.qf = true; X.key = true; sim.setMain(true); X.stats.energizations++;
      if (sim.wires.length) X.everEnergizedWithWires = true;
      Object.assign(X.nr, { loto: false, meas: {}, testBefore: false, testAfter: false, protect: false, sign: false });
      log('Bancada ENERGIZADA (QF0 ligado).', 'w');
    } else { X.qf = false; sim.setMain(false); sim.mainTrip = false; log('Disjuntor geral QF0 desligado: bancada seccionada (ainda não bloqueada).'); }
    sim.settle(); nrUpdate(); renderNR(); renderTop();
  }
  function drawNRVisuals() {
    const n = X.nr; let h = '';
    if (n.ground) {
      const e = [620, 610];
      [['L1', 468], ['L2', 504], ['L3', 539], ['N', 575]].forEach(([ph, y], i) => {
        const a = [706, y], d = `M${a[0]} ${a[1]} C${a[0] - 40} ${a[1] + 30} ${e[0] + 20} ${e[1] - 10} ${e[0]} ${e[1]}`;
        h += `<path d="${d}" fill="none" stroke="#1d7a33" stroke-width="7" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#f0c419" stroke-width="7" stroke-dasharray="10 10"/><rect x="${a[0] - 7}" y="${a[1] - 9}" width="14" height="18" rx="3" fill="#888" stroke="#333"/>`;
      });
      h += `<circle cx="${e[0]}" cy="${e[1]}" r="9" fill="#777" stroke="#333"/><g transform="translate(${e[0] - 14},${e[1] - 16})"><rect x="-118" y="-9" width="122" height="14" rx="3" fill="rgba(255,255,255,.92)" stroke="#1d5b2a" stroke-width=".6"/><text x="0" y="1.5" text-anchor="end" font-size="8.5" font-weight="700" fill="#1d5b2a" font-family="Arial">aterramento temporário → terra da estrutura</text></g>`;
    }
    if (n.sign) h += `<g transform="translate(1250,${bg3d ? 958 : 880}) rotate(-2)"><rect x="-120" y="-34" width="240" height="68" rx="5" fill="#fff" stroke="#c62828" stroke-width="5"/><rect x="-120" y="-34" width="240" height="22" fill="#c62828"/><text y="-18" text-anchor="middle" font-size="13" font-weight="800" fill="#fff" font-family="Arial">PERIGO</text><text y="6" text-anchor="middle" font-size="12.5" font-weight="800" fill="#1e2a3a" font-family="Arial">EM MANUTENÇÃO</text><text y="24" text-anchor="middle" font-size="12.5" font-weight="800" fill="#c62828" font-family="Arial">NÃO ENERGIZE</text></g>`;
    gN.innerHTML = h;
  }
  function renderNR() {
    nrUpdate(); drawNRVisuals();
    const n = X.nr, off = !X.qf, P = $('#lzPnr');
    const item = (k, ok, title, sub, act) => `<div class="lz-nr ${ok ? 'ok' : ''}"><div class="n">${ok ? '✓' : k}</div><div class="tx"><b>${title}</b><small>${sub}</small>${act ? `<div class="act">${act}</div>` : ''}</div></div>`;
    const meas = PAIRS.map((p) => `<span class="${n.meas[p] ? 'ok' : ''}">${p}${n.meas[p] ? ' ' + num(n.meas[p].v, 1) + ' V' : ''}</span>`).join('');
    P.innerHTML = `
      <div class="lz-ban ${energized() ? 'dang' : n.liberado ? 'ok' : 'no'}">${energized() ? '⚡ BANCADA ENERGIZADA — não toque nas ligações' : n.liberado ? '✓ Bancada LIBERADA para montagem/alteração' : sim.mainTrip ? 'QF0 desarmado — desligue-o e siga o procedimento' : 'Bancada NÃO liberada — siga a sequência abaixo'}</div>
      <h3>Desenergização (NR-10, 10.5.1)</h3>
      ${item(1, off, 'Seccionamento', 'Desligar o disjuntor geral tripolar QF0 (canto inferior esquerdo do painel).', `<button data-a="secc" class="${off ? 'dis' : ''}">Desligar QF0</button>`)}
      ${item(2, n.loto, 'Impedimento de reenergização', 'Retirar a chave de comando e travar o disjuntor geral com cadeado pessoal + etiqueta “NÃO LIGUE” (LOTO).', `<button data-a="loto" class="${!off || n.loto ? 'dis' : ''}">Aplicar cadeado e etiqueta</button>`)}
      ${item(3, PAIRS.every((p) => n.meas[p]) && n.testBefore, 'Constatação da ausência de tensão', 'Testar o multímetro numa fonte conhecida e medir nos barramentos: entre fases e fase-neutro.', `<button data-a="meter">Usar multímetro</button>${n.testBefore ? '<span style="color:#1a7f3c;font-weight:600">✓ instrumento testado</span>' : ''}<div class="lz-pairs">${meas}</div>`)}
      ${item(4, n.ground, 'Aterramento temporário (quando aplicável)', 'Equipotencializar L1-L2-L3-N à terra da estrutura com o conjunto de aterramento temporário (o painel não tem borne PE). Em bancada didática de BT é opcional, mas deve ser retirado antes de energizar.', `<button data-a="ground">${n.ground ? 'Retirar aterramento' : 'Instalar aterramento temporário'}</button>`)}
      ${item(5, n.protect, 'Proteção dos elementos energizados', 'Bancadas vizinhas energizadas na zona controlada isoladas/sinalizadas (anteparo).', `<button data-a="protect" class="${n.protect ? 'dis' : ''}">Confirmar proteção</button>`)}
      ${item(6, n.sign, 'Sinalização de impedimento', 'Placa “EM MANUTENÇÃO — NÃO ENERGIZE” na bancada.', `<button data-a="sign" class="${n.sign ? 'dis' : ''}">Instalar sinalização</button>`)}
      <p style="color:#5d6b7e">A reenergização (10.5.2) é feita pelo botão “Energizar bancada”.</p>
      <h3>Infrações registradas (${X.infr.length})</h3>${X.infr.map((i) => `<div class="lz-inf"><b>${mmss(i.t)}</b> ${esc(i.msg)}</div>`).join('') || '<p style="color:#5d6b7e">Nenhuma.</p>'}`;
    P.querySelectorAll('[data-a]').forEach((b) => b.onclick = () => nrAction(b.dataset.a));
    renderTop();
  }
  function nrAction(a) {
    const n = X.nr;
    if (a === 'secc') { setMain(false); }
    if (a === 'loto') { if (X.qf) return say('Desligue o disjuntor geral QF0 antes de bloquear.', 'warn'); n.loto = true; X.key = false; syncMain(); log(`Bloqueio: chave de comando retirada, cadeado e etiqueta no disjuntor geral${X.student ? ' por ' + esc(X.student) : ''}.`); }
    if (a === 'meter') { setMode('meter'); say('Multímetro ativo: teste-o em fonte conhecida e depois clique em dois bornes dos barramentos (L1, L2, L3, N).'); }
    if (a === 'ground') { n.ground = !n.ground; sim.grounding = n.ground; sim.dirty = true; log(n.ground ? 'Aterramento temporário instalado (L1-L2-L3-N ↔ PE).' : 'Aterramento temporário retirado.'); }
    if (a === 'protect') { n.protect = true; log('Proteção dos elementos energizados da zona controlada confirmada.'); }
    if (a === 'sign') { n.sign = true; log('Sinalização de impedimento de reenergização instalada.'); }
    renderNR(); renderRot();
  }

  // ---------- reenergização ----------
  function openEnergize() {
    if (X.qf) { setMain(false); say('QF0 desligado. Para mexer nas ligações, complete o bloqueio e a constatação de ausência de tensão.', 'warn'); renderAll(); return; }
    if (!X.requireNR) { setMain(true); renderAll(); return; }
    const c = { tools: false, people: false };
    const draw = () => {
      const n = X.nr, rows = [
        ['tools', c.tools, 'Ferramentas, sobras e materiais retirados; ligações conferidas (use “Verificar montagem”).', null],
        ['people', c.people, 'Trabalhadores não envolvidos fora da zona controlada; aviso “vou energizar”.', null],
        ['ground', !n.ground, 'Aterramento temporário retirado.', n.ground ? 'Retirar aterramento' : null],
        ['sign', !n.sign, 'Sinalização de impedimento retirada.', n.sign ? 'Retirar sinalização' : null],
        ['loto', !n.loto, 'Cadeado e etiqueta retirados pelo próprio responsável.', n.loto ? 'Retirar bloqueio' : null],
      ];
      const all = rows.every((r) => r[1]);
      dialog('Reenergização da bancada (NR-10, 10.5.2)', `<p>Execute e confirme cada item, na ordem:</p>${rows.map(([k, ok, t, act]) => `<div class="lz-chk ${ok ? 'ok' : ''}">${act ? `<button data-r="${k}">${act}</button>` : `<input type="checkbox" data-c="${k}" ${ok ? 'checked' : ''}>`}<span>${ok ? '✓ ' : ''}${t}</span></div>`).join('')}`,
        `<button data-x>Cancelar</button><button class="red ${all ? '' : 'dis'}" id="lzDoEn">⚡ Religar QF0 e energizar</button>`);
      $('#lzDlg').querySelectorAll('[data-c]').forEach((b) => b.onchange = () => { c[b.dataset.c] = b.checked; draw(); });
      $('#lzDlg').querySelectorAll('[data-r]').forEach((b) => b.onclick = () => {
        const k = b.dataset.r;
        if (k === 'ground') { n.ground = false; sim.grounding = false; log('Aterramento temporário retirado.'); }
        if (k === 'sign') { n.sign = false; log('Sinalização de impedimento retirada.'); }
        if (k === 'loto') { n.loto = false; log('Bloqueio (cadeado e etiqueta) retirado.'); }
        draw(); renderNR();
      });
      const go = $('#lzDoEn'); if (go) go.onclick = () => { closeDialog(); setMain(true); renderAll(); };
    };
    draw();
  }

  // ---------- diálogo ----------
  function dialog(title, body, foot = '<button data-x class="p">Fechar</button>') {
    const D = $('#lzDlg'); D.innerHTML = `<div class="ph">${title}<button data-x style="background:transparent">✕</button></div><div class="bd">${body}</div><div class="ft">${foot}</div>`;
    D.querySelectorAll('[data-x]').forEach((b) => b.onclick = closeDialog);
    $('#lzModal').classList.add('on');
  }
  function closeDialog() { $('#lzModal').classList.remove('on'); dlgDiag = false; }
  let dlgDiag = false;

  // ---------- topo / estado ----------
  function renderTop() {
    const e = energized(), st = $('#lzQfSt');
    st.textContent = sim.mainTrip ? (sim.tripBy === 'DR' ? 'DR ATUADO' : 'DESARMADO') : X.qf ? (e ? 'LIGADO · energizada' : 'LIGADO · chave desligada') : 'DESLIGADO';
    st.className = 'st ' + (sim.mainTrip ? 't' : X.qf ? 'e' : 'd');
    $('#lzLock').innerHTML = X.nr.loto ? '🔒 <b style="color:#b26a00">bloqueado</b>' : '';
    const b = $('#lzEnergy');
    b.className = X.qf || sim.mainTrip ? 'red' : 'grn';
    b.textContent = sim.mainTrip ? 'Desligar QF0 (desarmado)' : X.qf ? '⏻ Desenergizar (desligar QF0)' : '⚡ Energizar bancada';
    $('#lzScript').textContent = X.script ? X.script.title : '—';
    $('#lzStud').textContent = X.student ? 'Aluno: ' + X.student : 'Aluno: —';
  }

  // ---------- roteiro ----------
  function names() { return { K1: R.K[0], K2: R.K[1], K3: R.K[2], S0: R.S0, S1: R.S1, SEL: R.SEL, SN: R.SN, SE: R.SE, KT: R.YD, RA1: R.RAX[0], RA2: R.RAX[1], RCA: R.RCA }; }
  function runCheck(show = true) {
    if (!X.script) return [];
    const C = makeCtx(sim, panel);
    let res = [];
    try { res = X.script.check(C); } catch (e) { console.warn(e); res = [{ g: 'Erro', ok: false, msg: 'Falha ao verificar: ' + e.message }]; }
    X.results = res;
    const ok = res.filter((r) => r.ok).length;
    X.lastScore = res.length ? Math.round((ok / res.length) * 100) / 10 : 0;
    if (show) { X.checked = true; log(`Verificação da montagem: ${ok}/${res.length} itens corretos.`); }
    renderRot();
    return res;
  }
  function renderRot() {
    const P = $('#lzProt'), s = X.script;
    if (!s) { P.innerHTML = '<p>Escolha um roteiro para começar.</p><button class="p" id="lzPick">Escolher roteiro</button>'; P.querySelector('#lzPick').onclick = openStart; return; }
    const res = X.results.length ? X.results : (() => { try { return s.check(makeCtx(sim, panel)); } catch (e) { return []; } })();
    let cur = -1;
    const steps = s.passos.map((p, i) => { let ok = false; try { ok = !!p.done(X, res); } catch (e) {} if (!ok && cur < 0) cur = i; return { ...p, ok }; });
    const grp = {}; for (const r of X.checked ? X.results : []) (grp[r.g] = grp[r.g] || []).push(r);
    P.innerHTML = `<h3>${esc(s.title)}</h3><p><b>Objetivo:</b> ${esc(s.objetivo)}</p><p style="color:#5d6b7e"><b>Materiais:</b> ${esc(s.materiais)}</p>
      ${s.diagrams(names()).length ? '<button id="lzDg2">Ver diagramas de comando e força</button>' : ''}
      <h3>Passos</h3>${steps.map((p, i) => `<div class="lz-step ${p.ok ? 'ok' : ''} ${i === cur ? 'cur' : ''}"><div class="ck">${p.ok ? '✓' : i + 1}</div><div>${esc(p.t)}</div></div>`).join('')}
      ${X.fault ? `<h3>Diagnóstico de defeito</h3><div class="lz-ban no">O professor injetou um defeito. Encontre-o (multímetro, observação) e informe:</div>
        <select id="lzDgSel" style="width:100%"><option value="">— selecione o defeito —</option>${FAULTS.map((f) => `<option value="${f.id}">${f.t}</option>`).join('')}</select>
        <div style="margin-top:5px"><button class="p" id="lzDgOk">Confirmar diagnóstico</button></div>${X.diag ? `<p>${X.diag.ok ? '✓ Diagnóstico correto!' : '✗ Diagnóstico incorreto.'}</p>` : ''}` : ''}
      <h3>Verificação automática ${X.checked ? `· nota da montagem ${num(X.lastScore, 1)}` : ''}</h3>
      <button class="p" id="lzChk2">✓ Verificar montagem</button>
      ${Object.entries(grp).map(([g, items]) => items.map((r) => `<div class="lz-res ${r.ok ? '' : 'no'}"><b>${g}</b>${r.ok ? '✓' : '✗'} ${esc(r.msg)}</div>`).join('')).join('')}
      <h3>Finalizar</h3><button id="lzRep2">Gerar relatório da aula</button>`;
    const q = (id) => P.querySelector(id);
    if (q('#lzDg2')) q('#lzDg2').onclick = openDiagrams;
    q('#lzChk2').onclick = () => runCheck(true);
    q('#lzRep2').onclick = openReport;
    if (q('#lzDgOk')) q('#lzDgOk').onclick = () => {
      const v = q('#lzDgSel').value; if (!v) return;
      X.diag = { guess: v, ok: v === X.fault.id, t: X.elapsed };
      log(X.diag.ok ? `Diagnóstico correto: ${X.fault.t}.` : `Diagnóstico incorreto (${FAULTS.find((f) => f.id === v).t}).`, X.diag.ok ? '' : 'w');
      renderRot();
    };
  }
  function openDiagrams() {
    const d = X.script.diagrams(names());
    dialog('Diagramas · ' + esc(X.script.title), `<div class="lz-dgs">${d.join('')}</div><p style="color:#5d6b7e;text-align:center;margin:8px 0 0">Bobinas e sinaleiros acendem no diagrama conforme o estado real da bancada.</p>`);
    dlgDiag = true;
  }

  // ---------- professor ----------
  function renderProf() {
    const P = $('#lzPprof');
    P.innerHTML = `<h3>Configuração</h3>
      <label class="lz-chk"><input type="checkbox" id="lzReq" ${X.requireNR ? 'checked' : ''}> Exigir o procedimento NR-10 completo antes de mexer nos cabos e para energizar</label>
      <div class="lz-chk">Tempo do temporizador RT1 / relé Y-Δ (s): <input type="range" id="lzTT" min="2" max="15" value="${sim.dev(R.YD).st.T}" style="flex:1"><b id="lzTTv">${sim.dev(R.YD).st.T}</b></div>
      <h3>Injeção de defeitos (diagnóstico)</h3>
      <p style="color:#5d6b7e">O defeito fica oculto para o aluno; ele deve localizá-lo com o multímetro e informá-lo na aba Roteiro.</p>
      <select id="lzFsel" style="width:100%">${FAULTS.map((f) => `<option value="${f.id}">${f.t}</option>`).join('')}</select>
      <div style="display:flex;gap:6px;margin-top:6px"><button class="p" id="lzFin">Injetar defeito</button><button id="lzFrm">Remover defeito</button></div>
      <p id="lzFst">${X.fault ? `Defeito ativo: <b>${X.fault.t}</b>${X.faultTarget ? ' (' + esc(String(X.faultTarget)) + ')' : ''}` : 'Nenhum defeito ativo.'}</p>
      <h3>Resumo da aula</h3><p>Tempo: ${mmss(X.elapsed)} · cabos: ${sim.wires.length} · energizações: ${X.stats.energizations} · curtos: ${X.stats.shorts} · infrações: ${X.infr.length}</p>`;
    P.querySelector('#lzReq').onchange = (e) => { X.requireNR = e.target.checked; log(`Exigência do procedimento NR-10: ${X.requireNR ? 'ativada' : 'desativada'} pelo professor.`, 'w'); };
    P.querySelector('#lzTT').oninput = (e) => { const v = +e.target.value; sim.dev(R.YD).st.T = v; sim.dev(R.T).st.T = v; P.querySelector('#lzTTv').textContent = v; };
    P.querySelector('#lzFin').onclick = () => {
      if (X.fault) clearFault(sim, X.fault, R);
      const f = FAULTS.find((x) => x.id === P.querySelector('#lzFsel').value);
      const tgt = f.apply(sim, R);
      if (tgt === false) return say('Para “cabo rompido”, o aluno precisa ter cabos montados.', 'warn');
      X.fault = f; X.faultTarget = f.id === 'brokenWire' ? (() => { const w = sim.wires.find((w) => w.id === tgt); return w ? `${w.a} ↔ ${w.b}` : tgt; })() : tgt; X.diag = null; sim.dirty = true;
      log('Professor injetou um defeito oculto para diagnóstico.', 'w'); renderProf(); renderRot();
    };
    P.querySelector('#lzFrm').onclick = () => { clearFault(sim, X.fault, R); X.fault = null; X.faultTarget = null; log('Defeito removido pelo professor.'); renderProf(); renderRot(); };
  }

  // ---------- abas ----------
  function setTab(t) { X.tab = t; root.querySelectorAll('.lz-tabs div').forEach((d) => d.classList.toggle('on', d.dataset.t === t)); ['rot', 'nr', 'prof'].forEach((k) => $('#lzP' + k).classList.toggle('on', k === t)); if (t === 'prof') renderProf(); if (t === 'nr') renderNR(); if (t === 'rot') renderRot(); }
  root.querySelectorAll('.lz-tabs div').forEach((d) => d.onclick = () => setTab(d.dataset.t));
  function renderAll() { renderTop(); renderNR(); renderRot(); if (X.tab === 'prof') renderProf(); }

  // ---------- início / roteiros ----------
  function openStart() {
    let pick = X.script ? X.script.id : 'direta';
    const draw = () => {
      dialog('Iniciar aula prática · KET-1030: Proteção', `<p>Painel didático de proteção e comandos elétricos com simulador real (380/220 V). Cada intervenção nas ligações exige o procedimento de desenergização da NR-10.</p>
        <p><b>Nome do aluno / equipe:</b> <input type="text" id="lzName" value="${esc(X.student)}" placeholder="ex.: Maria Souza" style="width:280px"></p>
        <p><b>Roteiro:</b></p><div class="lz-cards">${SCRIPTS.map((s) => `<div class="lz-sc ${s.id === pick ? 'on' : ''}" data-s="${s.id}"><b>${s.icon} ${esc(s.title)}</b>${esc(s.objetivo)}</div>`).join('')}</div>`,
        `${X.started ? '<button data-x>Cancelar</button>' : ''}<button class="p" id="lzGo">Começar aula</button>`);
      $('#lzDlg').querySelectorAll('[data-s]').forEach((c) => c.onclick = () => { X.student = $('#lzName').value.trim(); pick = c.dataset.s; draw(); });
      $('#lzGo').onclick = () => {
        X.student = $('#lzName').value.trim(); const changed = !X.script || X.script.id !== pick;
        X.script = scriptById(pick);
        if (!X.started || changed) { X.t0 = performance.now(); X.elapsed = 0; X.checked = false; X.results = []; X.tested = {}; X.reported = false; X.infr = []; X.stats = { shorts: 0, trips: 0, energizations: 0 }; $('#lzInfB').style.display = 'none'; }
        X.started = true; closeDialog(); log(`Aula iniciada: ${X.script.title}${X.student ? ' · ' + esc(X.student) : ''}.`);
        renderAll(); setTab('rot');
      };
    };
    draw();
  }

  // ---------- relatório ----------
  function reportText() {
    runCheck(false);
    const res = X.results, ok = res.filter((r) => r.ok).length, mont = res.length ? (ok / res.length) * 10 : 0;
    const nrPts = (X.everLiberado ? 6 : 0) + (X.nr.testBefore || X.everLiberado ? 1 : 0) + (X.stats.energizations > 0 ? 1 : 0);
    const pen = Math.min(4, X.infr.length * 1) + Math.min(2, X.stats.shorts * 0.5);
    const diag = X.fault ? (X.diag && X.diag.ok ? 1 : 0) : null;
    let nota = 0.6 * mont + 0.25 * (nrPts / 8) * 10 + 0.15 * (X.tested[X.script.id] ? 10 : 0) - pen;
    if (diag !== null) nota = nota * 0.85 + diag * 1.5;
    nota = Math.max(0, Math.min(10, nota));
    const L = [];
    L.push('RELATÓRIO DE AULA PRÁTICA — LABORATÓRIO DE ELETRICIDADE (SENAI FIEMG)', '='.repeat(66));
    L.push(`Bancada: KET-1030: Proteção (simulador)`, `Roteiro: ${X.script.title}`, `Aluno/equipe: ${X.student || '(não informado)'}`, `Data: ${new Date().toLocaleString('pt-BR')}`, `Duração: ${mmss(X.elapsed)}`, '');
    L.push(`NOTA FINAL: ${num(nota, 1)} / 10`, `  Montagem (60%): ${num(mont, 1)} — ${ok}/${res.length} itens corretos`, `  Procedimento NR-10 (25%): ${nrPts}/8`, `  Ensaio funcional concluído (15%): ${X.tested[X.script.id] ? 'sim' : 'não'}`, `  Penalidades: −${num(pen, 1)} (infrações: ${X.infr.length}, curtos-circuitos provocados: ${X.stats.shorts})`);
    if (diag !== null) L.push(`  Diagnóstico de defeito: ${X.diag ? (X.diag.ok ? 'correto' : 'incorreto') : 'não informado'} (defeito: ${X.fault.t})`);
    L.push('', 'VERIFICAÇÃO DA MONTAGEM', '-'.repeat(30)); res.forEach((r) => L.push(`[${r.ok ? 'OK' : '  '}] ${r.g}: ${r.msg}`));
    L.push('', 'SEGURANÇA — NR-10', '-'.repeat(30));
    L.push(`Bancada liberada pelo procedimento completo: ${X.everLiberado ? 'sim' : 'não'}`, `Energizações: ${X.stats.energizations} · disparos de proteção: ${X.stats.trips}`);
    L.push(`Infrações (${X.infr.length}):`); X.infr.forEach((i) => L.push(`  ${mmss(i.t)} — ${i.msg}`)); if (!X.infr.length) L.push('  nenhuma');
    L.push('', 'LIGAÇÕES (cabos de teste)', '-'.repeat(30)); sim.wires.forEach((w) => L.push(`  ${w.a} ↔ ${w.b} (${(CABLE[w.color] || CABLE.R)[2]})`));
    L.push('', 'REGISTRO DE EVENTOS', '-'.repeat(30)); X.log.forEach((e) => L.push(`  ${mmss(e.t)} ${e.msg.replace(/<[^>]+>/g, '')}`));
    return L.join('\n');
  }
  function openReport() {
    const txt = reportText(); X.reported = true; renderRot();
    dialog('Relatório da aula', `<textarea class="lz-rep" readonly>${esc(txt)}</textarea>`, '<button id="lzCopy">Copiar</button><button id="lzDl">Baixar .txt</button><button data-x class="p">Fechar</button>');
    $('#lzCopy').onclick = () => { const t = $('#lzDlg textarea'); t.select(); (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => say('Relatório copiado.'), () => { document.execCommand('copy'); say('Relatório copiado.'); }); };
    $('#lzDl').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain;charset=utf-8' })); a.download = `relatorio_aula_${(X.student || 'aluno').replace(/\W+/g, '_')}.txt`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  }

  // ---------- multímetro ----------
  function setMode(m) { X.mode = m; $('#lzMeter').classList.toggle('on', m === 'meter'); $('#lzHint').textContent = m === 'meter' ? 'Multímetro: clique num borne para a ponta vermelha e em outro para a preta · clique no botão Multímetro para voltar a ligar cabos' : 'Arraste de um borne a outro para ligar um cabo · clique num cabo para removê-lo · roda do mouse: zoom · arraste o fundo: mover'; drawProbes(); }
  function termName(j) { return j ? (j.tip || j.t).split(' — ')[0] : '—'; }
  function placeProbe(j) {
    const M = X.meter; M.test = 0; M[M.next] = j.id; M.next = M.next === 'red' ? 'black' : 'red';
    $('#lzPR').textContent = termName(jackById.get(M.red)); $('#lzPB').textContent = termName(jackById.get(M.black)); drawProbes();
  }
  function drawProbes() {
    gP.innerHTML = '';
    for (const [k, c] of [['red', '#d11f1f'], ['black', '#222']]) {
      const j = jackById.get(X.meter[k]); if (!j) continue;
      const x = SX(j.x), y = SY(j.y);
      gP.innerHTML += `<g pointer-events="none"><path d="M${x} ${y} l${k === 'red' ? 26 : -26} 60" stroke="${c}" stroke-width="7" stroke-linecap="round"/><path d="M${x} ${y} l${k === 'red' ? 6 : -6} 14" stroke="#c8c8c8" stroke-width="3"/><circle cx="${x}" cy="${y}" r="4" fill="${c}" stroke="#fff"/></g>`;
    }
  }
  const busPhase = (t) => Object.entries(BUS).find(([k, v]) => v === t)?.[0];
  function meterRead() {
    const M = X.meter, A = jackById.get(M.red), B = jackById.get(M.black);
    if (M.test > 0) return { txt: num(219.6 + Math.random() * 0.8, 1), f: 'V~ (fonte conhecida)' };
    if (!A || !B) return { txt: '----', f: M.fn === 'V' ? 'V~' : 'Ω' };
    if (M.fn === 'V') {
      const v = sim.measureV(A.t, B.t);
      // registro para a constatação de ausência de tensão
      const pa = busPhase(A.t), pb = busPhase(B.t);
      if (pa && pb && pa !== pb && pa !== 'PE' && pb !== 'PE') {
        const key = PAIRS.find((p) => p === `${pa}-${pb}` || p === `${pb}-${pa}`);
        if (key && !X.qf && v < 1 && !X.nr.meas[key]) { X.nr.meas[key] = { v, t: X.elapsed }; log(`Ausência de tensão constatada entre ${key}: ${num(v, 1)} V.`); renderNR(); }
      }
      return { txt: v < 0.05 ? '0,0' : num(v, 1), f: 'V~' };
    }
    const vv = sim.measureV(A.t, B.t);
    if (energized() && vv > 2) { infraction('ohm', 'Ohmímetro usado em circuito energizado (risco de dano ao instrumento e de arco elétrico).'); return { txt: 'Err', f: 'Ω — circuito energizado!' }; }
    const r = sim.measureR(A.t, B.t);
    return { txt: r === Infinity ? 'OL' : r < 1000 ? num(r, 1) : num(r / 1000, 2) + 'k', f: r === Infinity ? 'Ω (aberto)' : r < 2 ? 'Ω ♪ continuidade' : 'Ω' };
  }

  // ---------- interação no painel ----------
  const tipShow = (e, html) => { tip.innerHTML = html; tip.style.display = 'block'; tip.style.left = Math.min(innerWidth - 340, e.clientX + 14) + 'px'; tip.style.top = (e.clientY + 16) + 'px'; };
  const tipHide = () => (tip.style.display = 'none');
  const toSvg = (e) => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); };
  const jackAt = (e) => { const t = document.elementFromPoint(e.clientX, e.clientY); const g = t && t.closest && t.closest('.jk'); return g ? jackById.get(g.dataset.j) : null; };
  let drag = null, panDrag = null, netHl = [];
  function highlightNet(j) {
    netHl.forEach((g) => g.classList.remove('net')); netHl = [];
    if (!j) return;
    const uf = sim.staticNet(), r = uf.find(j.t);
    for (const k of panel.jacks) if (k !== j && uf.find(k.t) === r) { const g = jackEls.get(k.id); g.classList.add('net'); netHl.push(g); }
  }
  function doAdd(ja, jb) {
    if (ja === jb) return;
    const A = jackById.get(ja), B = jackById.get(jb);
    if (A.t === B.t) { say('Esses dois bornes já são o mesmo ponto elétrico (interligados internamente).', 'warn'); return; }
    if (!canModify('ligar um cabo')) return;
    const w = addWireJ(ja, jb, X.color); X.undo.push({ op: 'add', w: { ...w } }); X.redo = [];
    log(`Cabo ${(CABLE[X.color])[2]}: ${termName(A)} ↔ ${termName(B)}`);
    afterWires();
  }
  function doRemove(id) {
    const w = sim.wires.find((x) => x.id === id); if (!w) return;
    if (!canModify('retirar um cabo')) return;
    sim.removeWire(id); X.undo.push({ op: 'del', w: { ...w } }); X.redo = [];
    log(`Cabo retirado: ${termName(jackById.get(w.ja))} ↔ ${termName(jackById.get(w.jb))}`);
    afterWires();
  }
  function applyOp(op, inverse) {
    const add = (op.op === 'add') !== inverse;
    if (op.op === 'clear') { if (inverse) op.ws.forEach((w) => addWireJ(w.ja, w.jb, w.color, w.id)); else sim.clearWires(); return; }
    if (add) addWireJ(op.w.ja, op.w.jb, op.w.color, op.w.id); else sim.removeWire(op.w.id);
  }
  function undo() { const op = X.undo.pop(); if (!op) return; if (!canModify('alterar as ligações')) { X.undo.push(op); return; } applyOp(op, true); X.redo.push(op); afterWires(); }
  function redo() { const op = X.redo.pop(); if (!op) return; if (!canModify('alterar as ligações')) { X.redo.push(op); return; } applyOp(op, false); X.undo.push(op); afterWires(); }
  function afterWires() { drawCables(); X.results = []; X.checked = false; renderRot(); $('#lzUndo').classList.toggle('dis', !X.undo.length); $('#lzRedo').classList.toggle('dis', !X.redo.length); }

  wrap.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const t = e.target, jg = t.closest && t.closest('.jk'), cg = t.closest && t.closest('.cb'), wg = t.closest && t.closest('.wd');
    if (jg) {
      const j = jackById.get(jg.dataset.j);
      if (X.mode === 'meter') { placeProbe(j); return; }
      drag = { j, x: e.clientX, y: e.clientY, moved: false, id: e.pointerId }; wrap.setPointerCapture(e.pointerId); e.preventDefault(); return;
    }
    if (cg && X.mode === 'wire') { drag = { cable: +cg.dataset.w, x: e.clientX, y: e.clientY, moved: false, id: e.pointerId }; return; }
    if (wg) { widgetDown(wg, e); return; }
    panDrag = { x: e.clientX, y: e.clientY, p0: [...X.pan], id: e.pointerId }; wrap.setPointerCapture(e.pointerId);
  });
  wrap.addEventListener('pointermove', (e) => {
    if (drag && drag.j) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 4) drag.moved = true;
      if (drag.moved) {
        const p = toSvg(e), a = [SX(drag.j.x), SY(drag.j.y)], [c, dk] = CABLE[X.color];
        const over = jackAt(e), b = over ? [SX(over.x), SY(over.y)] : [p.x, p.y];
        gG.innerHTML = `<path d="${cablePath(a, b, 1)}" fill="none" stroke="${dk}" stroke-width="6.4" stroke-linecap="round" opacity=".8"/><path d="${cablePath(a, b, 1)}" fill="none" stroke="${c}" stroke-width="4.6" stroke-linecap="round" opacity=".85"/><circle cx="${b[0]}" cy="${b[1]}" r="6.2" fill="${c}" stroke="${dk}" stroke-width="1.2"/>`;
      }
      return;
    }
    if (panDrag) { X.pan = [panDrag.p0[0] + e.clientX - panDrag.x, panDrag.p0[1] + e.clientY - panDrag.y]; applyView(); return; }
    // dica
    const t = e.target, jg = t.closest && t.closest('.jk'), wg = t.closest && t.closest('[data-tip]'), cg = t.closest && t.closest('.cb');
    if (jg) {
      const j = jackById.get(jg.dataset.j); const n = sim.wires.filter((w) => w.ja === j.id || w.jb === j.id).length;
      let extra = ''; if (energized()) { const v = sim.measureV(j.t, BUS.N); if (v > 1) extra = `<br><span style="color:#ffb4a8">⚡ ${num(v, 0)} V em relação ao N</span>`; }
      tipShow(e, `<b>${esc(j.tip || j.t)}</b>${n ? `<br>${n} plugue(s) neste borne` : ''}${extra}`); if (hoverJ !== j) { hoverJ = j; highlightNet(j); }
    } else if (cg) { const w = sim.wires.find((x) => x.id === +cg.dataset.w); if (w) tipShow(e, `Cabo ${(CABLE[w.color] || CABLE.R)[2]}: ${esc(termName(jackById.get(w.ja)))} ↔ ${esc(termName(jackById.get(w.jb)))}<br><i>clique para retirar</i>`); }
    else if (wg) tipShow(e, esc(wg.dataset.tip));
    else { tipHide(); if (hoverJ) { hoverJ = null; highlightNet(null); } }
  });
  let hoverJ = null;
  const endPointer = (e) => {
    if (drag && drag.j) {
      gG.innerHTML = '';
      const over = jackAt(e);
      if (drag.moved && over && over.id !== drag.j.id) { doAdd(drag.j.id, over.id); if (X.pending) setPending(null); }
      else if (!drag.moved) {
        if (X.pending && X.pending !== drag.j.id) { const a = X.pending; setPending(null); doAdd(a, drag.j.id); }
        else if (X.pending === drag.j.id) setPending(null);
        else setPending(drag.j.id);
      }
    } else if (drag && drag.cable !== undefined && !drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 5) doRemove(drag.cable);
    drag = null; panDrag = null; widgetUp();
  };
  wrap.addEventListener('pointerup', endPointer); wrap.addEventListener('pointercancel', endPointer);
  wrap.addEventListener('pointerleave', tipHide);
  function setPending(id) {
    if (X.pending) jackEls.get(X.pending).classList.remove('pend');
    X.pending = id; if (id) { jackEls.get(id).classList.add('pend'); say('Borne selecionado: clique no borne de destino para ligar o cabo (ou no mesmo borne para cancelar).'); }
  }
  // zoom/pan: X.zoom = escala (px por mm), X.pan = deslocamento do palco (px)
  let fitted = false;
  function applyView() { stage.style.transform = `translate(${X.pan[0]}px,${X.pan[1]}px) scale(${X.zoom})`; }
  function fitRect(x0, y0, x1, y1) {
    const r = wrap.getBoundingClientRect(); if (!r.width) return;
    const s = Math.min(r.width / (x1 - x0), r.height / (y1 - y0));
    X.zoom = s; X.pan = [(r.width - (x1 - x0) * s) / 2 - (x0 - VX) * s, (r.height - (y1 - y0) * s) / 2 - (y0 - VY) * s];
    X.minZoom = Math.min(r.width / VW, r.height / VH) * 0.95; applyView(); fitted = true;
  }
  const fitPanel = () => fitRect(-50, -50, FW + 50, FH + 50);
  const fitAll = () => fitRect(VX, VY, VX + VW, VY + VH);
  function zoomAt(f, cxp, cyp) {
    const r = wrap.getBoundingClientRect(); if (cxp === undefined) { cxp = r.width / 2; cyp = r.height / 2; }
    const z0 = X.zoom, z1 = Math.max(X.minZoom || 0.3, Math.min(z0 * 6, Math.min(8, z0 * f)));
    X.pan = [cxp - (cxp - X.pan[0]) * z1 / z0, cyp - (cyp - X.pan[1]) * z1 / z0]; X.zoom = z1; applyView();
  }
  wrap.addEventListener('wheel', (e) => { e.preventDefault(); const r = wrap.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  $('#lzZin').onclick = () => zoomAt(1.3); $('#lzZout').onclick = () => zoomAt(1 / 1.3); $('#lzZfit').onclick = () => fitPanel();
  $('#lzZall').onclick = () => fitAll();
  addEventListener('resize', () => root.classList.contains('on') && fitPanel());

  // widgets: botões, seletora, disjuntor geral, chave, DR, relés, CTD, GST, emergência externa
  let held = null;
  function widgetDown(g, e) {
    const w = W.find((x) => x.g === g); if (!w) return;
    if (X.mode === 'meter' && !['btn', 'extEmerg'].includes(w.type)) return;
    const d = w.dev && sim.dev(w.dev);
    if (w.type === 'btn') { sim.press(w.dev, true); held = w; wrap.setPointerCapture(e.pointerId); log(`${d.name} pressionado.`); }
    else if (w.type === 'extEmerg') { const l = sim.toggleLatch(w.dev); log(l ? 'EMERGÊNCIA acionada (travada).' : 'Emergência destravada (girada).', l ? 'w' : ''); }
    else if (w.type === 'sel') { sim.setPos(w.dev, d.st.pos ? 0 : 1); log(`Seletora ${w.dev} na posição ${d.st.pos}.`); }
    else if (w.type === 'mainBreaker') { if (sim.mainTrip || energized()) { setMain(false); renderAll(); } else openEnergize(); }
    else if (w.type === 'key') {
      if (X.nr.loto) return say('Chave retirada e guardada pelo responsável do bloqueio (LOTO).', 'warn');
      X.key = !X.key; syncMain(); log(`Chave de comando ${X.key ? 'ligada' : 'desligada'}.`);
    } else if (w.type === 'dr') {
      if (energized()) { sim.mainTrip = true; sim.tripBy = 'DR'; sim.dirty = true; sim.event('trip', 'Botão de teste T do DR acionado: o DR desarmou (teste periódico OK).'); }
      else if (sim.mainTrip) { setMain(false); renderAll(); }
      else say('Com a bancada desenergizada o teste do DR não atua.');
    } else if (w.type === 'gst') openGST(e);
    else if (w.type === 'ctd' || (w.type === 'relay' && /timer|yd/i.test(w.kind || ''))) openTimer(w, e);
    else if (w.type === 'relay' && w.kind === 'rca') openRCA(w, e);
    else if (w.type === 'K' || w.type === 'relay') { if (d) tipShow(e, `<b>${esc(d.name)}</b><br>${d.st.on ? 'bobina energizada — contatos comutados' : 'bobina desenergizada'}`); }
    updateWidgets();
  }
  function widgetUp() { if (held) { sim.press(held.dev, false); held = null; updateWidgets(); } }
  const popAt = (e, h) => { pop.style.display = 'block'; pop.style.left = Math.min(innerWidth - 270, e.clientX + 10) + 'px'; pop.style.top = Math.max(10, Math.min(innerHeight - h, e.clientY - h / 2)) + 'px'; };
  function openRCA(w, e) {
    const d = sim.dev(w.dev);
    pop.innerHTML = `<h4>${esc(d.name)}</h4><div class="row">Ajuste: <input type="range" id="lzIs" min="0.5" max="3" step="0.05" value="${d.st.Iset}"><b id="lzIsV">${num(d.st.Iset, 2)} A</b></div>
      <div class="row">Retardo: <input type="range" id="lzTd" min="0.5" max="10" step="0.5" value="${d.st.td}"><b id="lzTdV">${num(d.st.td, 1)} s</b></div>
      <div class="row">Medindo: <b>${num(d.st.I || 0, 2)} A</b> ${d.st.trip ? '<b style="color:#c62828">· ATUADO</b>' : ''}</div>
      <div class="row"><button id="lzRr" style="background:#1f56c9;color:#fff">RESET</button><button id="lzRx">Fechar</button></div>
      <div style="color:#5d6b7e;font-size:11px">Ajuste acima da corrente nominal do motor (1,05 A). J-R interligados = rearme automático.</div>`;
    popAt(e, 190);
    pop.querySelector('#lzIs').oninput = (ev) => { d.st.Iset = +ev.target.value; pop.querySelector('#lzIsV').textContent = num(d.st.Iset, 2) + ' A'; };
    pop.querySelector('#lzIs').onchange = () => log(`${d.name}: ajuste ${num(d.st.Iset, 2)} A.`);
    pop.querySelector('#lzTd').oninput = (ev) => { d.st.td = +ev.target.value; pop.querySelector('#lzTdV').textContent = num(d.st.td, 1) + ' s'; };
    pop.querySelector('#lzRr').onclick = () => { if (d.st.stuck) say(`${d.name} não rearma (defeito?).`, 'warn'); else if ((d.st.I || 0) > d.st.Iset) say('Corrente ainda acima do ajuste: reduza a carga antes de rearmar.', 'warn'); else { d.st.trip = false; d.st.acc = 0; sim.dirty = true; log(`${d.name} rearmado.`); } pop.style.display = 'none'; };
    pop.querySelector('#lzRx').onclick = () => (pop.style.display = 'none');
  }
  function openTimer(w, e) {
    const d = sim.dev(w.dev);
    pop.innerHTML = `<h4>${esc(d.name)}</h4><div class="row">Tempo: <input type="range" id="lzTm" min="1" max="20" step="1" value="${d.st.T}"><b id="lzTmV">${d.st.T} s</b></div><div class="row"><button id="lzTmX">Fechar</button></div>`;
    popAt(e, 110);
    pop.querySelector('#lzTm').oninput = (ev) => { d.st.T = +ev.target.value; pop.querySelector('#lzTmV').textContent = d.st.T + ' s'; };
    pop.querySelector('#lzTm').onchange = () => log(`${d.name}: tempo ajustado em ${d.st.T} s.`);
    pop.querySelector('#lzTmX').onclick = () => (pop.style.display = 'none');
  }
  function openGST(e) {
    const G = sim.gst;
    pop.innerHTML = `<h4>GST · Gerador de Sistemas Trifásicos</h4>
      <div class="row"><button id="lzGon" class="${G.on ? 'red' : 'grn'}" style="background:${G.on ? '#c62828' : '#1a9c4a'};color:#fff">${G.on ? 'Desligar saídas' : 'Ligar saídas'}</button>${G.fault ? '<b style="color:#c62828">FALHA</b> <button id="lzGr">Rearmar</button>' : ''}</div>
      <div class="row">Tensão de fase: <input type="range" id="lzGv" min="0" max="240" step="5" value="${G.V}"><b id="lzGvV">${G.V} V</b></div>
      <div class="row">Sequência: <select id="lzGs"><option value="1" ${G.seq > 0 ? 'selected' : ''}>R-S-T (direta)</option><option value="-1" ${G.seq < 0 ? 'selected' : ''}>R-T-S (inversa)</option></select></div>
      <div class="row">Falta de fase: <select id="lzGl"><option value="">nenhuma</option>${['R', 'S', 'T'].map((p) => `<option ${G.loss === p ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
      <div class="row"><button id="lzGx">Fechar</button></div><div style="color:#5d6b7e;font-size:11px">Fonte de ensaio para relés de proteção (RST-21, RCA…). Saídas R/S/T + neutro.</div>`;
    popAt(e, 230);
    const re = () => { sim.dirty = true; renderTop(); };
    pop.querySelector('#lzGon').onclick = () => { if (!G.on && !X.started) return; G.on = !G.on; log(`GST: saídas ${G.on ? 'LIGADAS' : 'desligadas'} (${G.V} V, ${G.seq > 0 ? 'R-S-T' : 'R-T-S'}${G.loss ? ', falta de ' + G.loss : ''}).`, G.on ? 'w' : ''); re(); openGST(e); };
    if (pop.querySelector('#lzGr')) pop.querySelector('#lzGr').onclick = () => { G.fault = false; re(); openGST(e); };
    pop.querySelector('#lzGv').oninput = (ev) => { G.V = +ev.target.value; pop.querySelector('#lzGvV').textContent = G.V + ' V'; re(); };
    pop.querySelector('#lzGs').onchange = (ev) => { G.seq = +ev.target.value; log(`GST: sequência ${G.seq > 0 ? 'R-S-T' : 'R-T-S'}.`); re(); };
    pop.querySelector('#lzGl').onchange = (ev) => { G.loss = ev.target.value || null; log(`GST: ${G.loss ? 'falta de fase ' + G.loss : 'fases completas'}.`); re(); };
    pop.querySelector('#lzGx').onclick = () => (pop.style.display = 'none');
  }

  // ---------- atualização visual ----------
  function updateWidgets() {
    const e = energized();
    for (const w of W) {
      const d = w.dev && sim.dev(w.dev), g = w.g, Q = (sel) => g.querySelector(sel) || (w.gt && w.gt.querySelector(sel));
      if (w.type === 'lamp') {
        const on = w.src === 'ENERG' ? e : !!(d && d.st.lit);
        g.querySelector('.dome').setAttribute('fill', on ? w.on : w.off); g.querySelector('.glow').setAttribute('opacity', on ? 1 : 0); g.querySelector('.core').setAttribute('opacity', on ? 0.85 : 0);
      } else if (w.type === 'btn') { const p = d.st.pressed, c = g.querySelector('.cap'); c.setAttribute('transform', p ? 'translate(.5,.8) scale(.91)' : ''); c.style.filter = p ? 'brightness(.78)' : ''; g.querySelector('.ps').setAttribute('opacity', p ? 0.9 : 0); }
      else if (w.type === 'extEmerg') { g.querySelector('.cap').setAttribute('transform', d.st.latched ? 'scale(.88)' : ''); g.querySelector('.lt').textContent = d.st.latched ? 'TRAVADO' : ''; }
      else if (w.type === 'sel') g.querySelectorAll('.knob').forEach((k) => k.setAttribute('transform', `rotate(${d.st.pos ? 40 : -40})`));
      else if (w.type === 'K') {
        const on = !!d.st.on; g.querySelector('.flag').setAttribute('y', on ? 8 : -2); g.querySelector('.flag').setAttribute('fill', on ? '#1a9c4a' : '#d8dde1');
        g.querySelector('.ring').setAttribute('opacity', on ? 0.9 : 0); Q('.bt').textContent = on ? 'LIGADO' : '';
      } else if (w.type === 'relay' && d) {
        const on = d.type === 'phaseMon' ? d.st.ok : d.type === 'rca' ? d.st.on && !d.st.trip : d.st.on;
        const lc = d.type === 'rca' && d.st.trip ? '#ff3b28' : on ? '#3dff6a' : '#2a3a2c'; g.querySelector('.led').setAttribute('fill', lc); g.querySelector('.lh').setAttribute('fill', lc); g.querySelector('.lh').setAttribute('opacity', lc === '#2a3a2c' ? 0 : 0.8);
        const tm = Q('.tm'); tm.textContent = (d.type === 'timerOn' || d.type === 'ydRelay') && d.st.on ? `${num(Math.min(d.st.t, d.st.T), 1)}/${d.st.T} s` : d.type === 'rca' && d.st.trip ? 'ATUADO' : '';
      } else if (w.type === 'ctd') {
        g.querySelector('.v').textContent = d.st.on ? Math.min(d.st.t, d.st.T).toFixed(1) : '0.0'; g.querySelector('.v').setAttribute('opacity', d.st.on ? 1 : 0);
        g.querySelector('.sv').textContent = `SP ${d.st.T.toFixed(1)}s${d.st.on && d.st.t >= d.st.T ? ' OUT1' : ''}`; g.querySelector('.sv').setAttribute('opacity', d.st.on ? 1 : 0);
      } else if (w.type === 'mainBreaker') {
        const trip = sim.mainTrip && sim.tripBy !== 'DR', pos = trip ? 'm' : X.qf ? 'u' : 'd';
        g.querySelectorAll('.lev').forEach((l) => l.setAttribute('opacity', l.dataset.s === pos ? 1 : 0));
        g.querySelectorAll('.fl').forEach((f) => f.setAttribute('fill', pos === 'u' ? '#e0281c' : '#1f9a4a'));
        const t = Q('.st'); t.textContent = trip ? 'DESARMADO' : X.qf ? 'I · LIGADO' : 'O · DESLIGADO'; t.setAttribute('fill', trip ? '#c62828' : X.qf ? '#c62828' : '#1a7f3c');
        g.querySelector('.lock').setAttribute('opacity', X.nr.loto ? 1 : 0);
      } else if (w.type === 'key') {
        g.querySelector('.kb').setAttribute('opacity', X.nr.loto ? 0 : 1); g.querySelector('.tag').setAttribute('opacity', X.nr.loto ? 0 : 1);
        g.querySelector('.kb').setAttribute('transform', X.key ? 'rotate(60)' : ''); const kt = Q('.kt'); kt.textContent = X.nr.loto ? 'chave retirada' : X.key ? 'LIGADA' : ''; kt.setAttribute('fill', X.nr.loto ? '#b26a00' : '#1a7f3c');
      } else if (w.type === 'dr') {
        const trip = sim.mainTrip && sim.tripBy === 'DR', pos = !trip && X.qf ? 'u' : 'd'; g.querySelectorAll('.lev').forEach((l) => l.setAttribute('opacity', l.dataset.s === pos ? 1 : 0)); g.querySelector('.fl').setAttribute('fill', pos === 'u' ? '#e0281c' : '#1f9a4a');
        const t = Q('.st'); t.textContent = trip ? 'DR ATUADO' : ''; t.setAttribute('fill', '#c62828');
      } else if (w.type === 'gst') {
        const G = sim.gst, live = G.on && !G.fault;
        ['R', 'S', 'T'].forEach((p) => g.querySelector('.gv' + p).textContent = live && G.loss !== p ? String(G.V) : '0');
        g.querySelector('.gst').textContent = G.fault ? 'FALHA SAÍDA' : live ? `${G.seq > 0 ? 'RST' : 'RTS'} ${G.V}V${G.loss ? ' -' + G.loss : ''}` : 'DESLIGADO';
        g.querySelector('.gled').setAttribute('fill', live ? '#ff3b28' : '#3a2a2a');
      } else if (w.type === 'motorMount') {
        const rpm = sim.dev(R.M).st.rpm || 0;
        Q('.rpm').textContent = Math.abs(rpm) < 5 ? 'parado' : `${Math.round(Math.abs(rpm))} rpm ${rpm > 0 ? '↻' : '↺'}`;
      } else if (w.type === 'motorArea') { const m = sim.dev(R.M).st; const v = m.Vw ? Math.max(...m.Vw) : 0; g.querySelector('.glow').setAttribute('opacity', Math.min(0.32, v / 380 * 0.32)); }
    }
    if (dlgDiag) {
      $('#lzDlg').querySelectorAll('[data-coil]').forEach((c) => { const d = sim.dev(c.dataset.coil); c.classList.toggle('on', !!(d && d.st.on)); });
      $('#lzDlg').querySelectorAll('[data-lamp]').forEach((c) => { const d = sim.dev(c.dataset.lamp); c.classList.toggle('on', !!(d && (d.st.lit || d.st.on))); });
    }
  }
  // motor (cartão)
  const motSvg = $('#lzMotSvg');
  motSvg.innerHTML = `<defs><linearGradient id="mB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4c7fb8"/><stop offset=".5" stop-color="#2a5c96"/><stop offset="1" stop-color="#173a63"/></linearGradient></defs>
    <rect x="12" y="20" width="62" height="50" rx="6" fill="url(#mB)"/>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${16 + i * 8}" y="17" width="4" height="56" rx="1.5" fill="#21507f"/>`).join('')}
    <rect x="30" y="8" width="24" height="12" rx="2" fill="#2a5c96"/><rect x="20" y="70" width="10" height="10" fill="#333"/><rect x="58" y="70" width="10" height="10" fill="#333"/><rect x="74" y="30" width="8" height="30" fill="#2a5c96"/>
    <rect x="82" y="41" width="14" height="8" fill="#b9bcbf"/><g id="lzRot" transform="translate(102,45)"><circle r="17" fill="#e9eef5" stroke="#1e2a3a" stroke-width="1.5"/><path d="M0 -15 L4 0 L0 15 L-4 0 Z" fill="#c62828"/><path d="M-15 0 L0 4 L15 0 L0 -4 Z" fill="#1e2a3a" opacity=".7"/><circle r="3" fill="#1e2a3a"/></g>
    <text id="lzDir" x="102" y="86" text-anchor="middle" font-size="9" font-weight="700" fill="#1e2a3a"></text>`;
  let ang = 0;
  function updateMotor(dt) {
    const m = sim.dev(R.M).st; ang += (m.rpm || 0) / 60 * 360 * dt * 0.08;
    motSvg.querySelector('#lzRot').setAttribute('transform', `translate(102,45) rotate(${ang % 360})`);
    motSvg.querySelector('#lzDir').textContent = m.running ? (m.rpm > 0 ? '↻ horário' : '↺ anti-horário') : '';
  }
  function updateCards() {
    const m = sim.dev(R.M).st, rca = sim.dev(R.RCA).st;
    const Iw = m.Iw || [0, 0, 0], line = m.conn === 'Δ' ? Iw.map((x) => x * Math.sqrt(3)) : Iw;
    const st = !energized() && !m.running ? 'parado' : m.hum ? 'travado · zumbido' : m.running ? (Math.abs(m.rpm) > 1650 ? 'em regime' : 'acelerando') : 'parado';
    const ms = $('#lzMotSt'); ms.textContent = st; ms.style.background = m.hum ? '#fdeeee' : m.running ? '#eef8f1' : '#fff';
    $('#lzMotKV').innerHTML = `<span>Rotação</span><b>${Math.abs(m.rpm || 0).toFixed(0)} rpm</b><span>Sentido</span><b>${m.running ? (m.rpm > 0 ? 'horário' : 'anti-horário') : '—'}</b>
      <span>Fechamento</span><b>${m.conn === 'Δ' ? 'Δ triângulo' : m.conn === 'Y' ? 'Y estrela' : '—'}</b><span>Tensão/enrol.</span><b>${m.Vw ? Math.round(Math.max(...m.Vw)) : 0} V</b>
      <span>Corrente L1/L2/L3</span><b>${line.map((x) => num(x || 0, 2)).join(' / ')} A</b><span>Relé RCA</span><b style="color:${rca.trip ? '#c62828' : '#1e2a3a'}">${rca.trip ? 'ATUADO' : rca.on ? num(rca.I || 0, 2) + ' A' : '—'}</b>`;
    const r = meterRead(); $('#lzLcdV').textContent = r.txt; $('#lzLcdF').textContent = r.f;
    const sec = Math.floor(X.elapsed); if (sec !== updateCards.sec) { updateCards.sec = sec; $('#lzTime').textContent = mmss(X.elapsed); }
  }

  // eventos do simulador → registro, alerta, estatística
  let evN = 0;
  function pumpEvents() {
    while (evN < sim.events.length) {
      const ev = sim.events[evN++];
      if (ev.type === 'short') { X.stats.shorts++; flash(); say('💥 ' + ev.msg, 'err'); log('CURTO-CIRCUITO: ' + ev.msg, 'e'); renderTop(); renderNR(); }
      else if (ev.type === 'trip') { X.stats.trips++; say(ev.msg, 'warn'); log(ev.msg, 'w'); if (/curto/.test(ev.msg)) { X.stats.shorts++; flash(); } }
      else if (ev.type === 'burn') { say('🔥 ' + ev.msg, 'err'); log(ev.msg, 'e'); flash(); }
      else log(ev.msg, ev.type === 'warn' ? 'w' : '');
    }
  }
  // detecção do ensaio funcional concluído pelo aluno (energizado): LIGA → selo → motor gira → DESLIGA
  const fsm = { stage: 0 };
  function watchTest() {
    if (!X.script || !energized()) { fsm.stage = 0; return; }
    const K = sim.dev(R.K[0]).st, m = sim.dev(R.M).st, s1 = sim.dev(R.S1).st;
    const id = X.script.id;
    if (id === 'direta') {
      if (fsm.stage === 0 && K.on && s1.pressed) fsm.stage = 1;
      if (fsm.stage === 1 && K.on && !s1.pressed) fsm.stage = 2;
      if (fsm.stage === 2 && Math.abs(m.rpm) > 1500) fsm.stage = 3;
      if (fsm.stage === 3 && !K.on) { fsm.stage = 4; if (!X.tested[id]) { X.tested[id] = true; log('Ensaio funcional realizado: partida, selo, motor em regime e parada.'); renderRot(); } }
    }
    if (X.script.watch) { const m = X.script.watch(X, sim, R, log, renderRot); if (typeof m === 'string') { log(m); renderRot(); } }
  }

  // ---------- botões da barra ----------
  const colors = $('#lzColors');
  for (const [k, [c]] of Object.entries(CABLE)) {
    const s = document.createElement('div'); s.className = 'lz-sw' + (k === X.color ? ' on' : ''); s.style.background = c; s.title = 'Cabo ' + CABLE[k][2]; s.dataset.c = k;
    s.onclick = () => { X.color = k; colors.querySelectorAll('.lz-sw').forEach((x) => x.classList.toggle('on', x.dataset.c === k)); };
    colors.appendChild(s);
  }
  $('#lzUndo').onclick = undo; $('#lzRedo').onclick = redo;
  $('#lzClear').onclick = () => { if (!sim.wires.length || !canModify('retirar os cabos')) return; const ws = sim.wires.map((w) => ({ ...w })); sim.clearWires(); X.undo.push({ op: 'clear', ws }); X.redo = []; log('Todos os cabos retirados.'); afterWires(); };
  $('#lzTransp').onclick = () => { X.transparent = !X.transparent; $('#lzTransp').classList.toggle('on', X.transparent); drawCables(); };
  $('#lzMeter').onclick = () => setMode(X.mode === 'meter' ? 'wire' : 'meter');
  $('#lzMV').onclick = () => { X.meter.fn = 'V'; $('#lzMV').classList.add('on'); $('#lzMR').classList.remove('on'); };
  $('#lzMR').onclick = () => { X.meter.fn = 'R'; $('#lzMR').classList.add('on'); $('#lzMV').classList.remove('on'); };
  $('#lzTest').onclick = () => {
    X.meter.test = 2.2; X.meter.fn = 'V'; $('#lzMV').classList.add('on'); $('#lzMR').classList.remove('on');
    if (PAIRS.every((p) => X.nr.meas[p])) X.nr.testAfter = true; else X.nr.testBefore = true;
    log('Multímetro testado em fonte conhecida (220 V): instrumento funcionando.'); renderNR();
  };
  $('#lzProbeOff').onclick = () => { X.meter.red = X.meter.black = null; X.meter.next = 'red'; $('#lzPR').textContent = '—'; $('#lzPB').textContent = '—'; drawProbes(); };
  $('#lzDiag').onclick = () => { if (X.script && X.script.diagrams(names()).length) openDiagrams(); else say('Este roteiro não tem diagrama (modo livre).'); };
  $('#lzCheck').onclick = () => { runCheck(true); setTab('rot'); };
  $('#lzEnergy').onclick = () => { if (sim.mainTrip) { setMain(false); renderAll(); return; } openEnergize(); };
  $('#lzRep').onclick = () => { if (X.script) openReport(); };
  $('#lzNew').onclick = openStart;
  $('#lzClose').onclick = () => close();
  $('#lzLoad').oninput = (e) => { sim.dev(R.M).st.load = e.target.value / 100; $('#lzLoadV').textContent = e.target.value + '%'; };
  $('#lzLoad').onchange = (e) => log(`Carga no eixo do motor ajustada para ${e.target.value}%.`);
  addEventListener('keydown', (e) => {
    if (!root.classList.contains('on')) return;
    if (e.key === 'Escape') { e.stopPropagation(); if (pop.style.display === 'block') pop.style.display = 'none'; else if ($('#lzModal').classList.contains('on')) { if (X.started) closeDialog(); } else if (X.pending) setPending(null); else close(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
  }, true);
  document.addEventListener('pointerdown', (e) => { if (pop.style.display === 'block' && !pop.contains(e.target) && !(e.target.closest && e.target.closest('.wd'))) pop.style.display = 'none'; });

  // ---------- ciclo ----------
  let acc = 0, uiAcc = 0, last = 0;
  // ventoinha do motor M1: gira a cada quadro (velocidade visível, sem efeito estroboscópico)
  let fanA = 0, fanV = 0;
  function spinFan(dt) {
    const wm = W.find((w) => w.type === 'motorMount'); if (!wm) return;
    const rpm = sim.dev(R.M).st.rpm || 0;
    const target = Math.sign(rpm) * Math.min(Math.abs(rpm) / 1736, 1) * 0.9 * 360; // até 0,9 volta/s (sem efeito estroboscópico no padrão de 24 dentes)
    fanV += (target - fanV) * Math.min(1, dt * 3);                                 // acelera e desacelera suave
    fanA = (fanA + fanV * dt) % 360;
    wm.g.querySelector('.rot').setAttribute('transform', `rotate(${fanA.toFixed(1)})`);
    wm.g.querySelector('.blur').setAttribute('opacity', (Math.min(1, Math.abs(fanV) / 576) * (bg3d ? 0.12 : 0.3)).toFixed(2));
  }
  function update(dt) {
    if (!root.classList.contains('on')) return;
    dt = Math.min(dt, 0.1);
    if (X.started) X.elapsed = (performance.now() - X.t0) / 1000;
    acc += dt;
    while (acc >= 0.02) { sim.step(0.02); acc -= 0.02; }
    if (X.meter.test > 0) X.meter.test -= dt;
    pumpEvents(); watchTest(); updateMotor(dt); spinFan(dt);
    uiAcc += dt; if (uiAcc > 0.06) { uiAcc = 0; updateWidgets(); updateCards(); }
  }
  // laço próprio quando o orquestrador não chama update (tela aberta e 3D pausado)
  let raf = 0, lastCall = 0;
  const selfLoop = (t) => { raf = requestAnimationFrame(selfLoop); if (performance.now() - lastCall > 120) { const dt = last ? (t - last) / 1000 : 0.016; update(dt); } last = t; };
  function open() {
    root.classList.add('on'); fitPanel(); drawCables(); renderAll(); $('#lzUndo').classList.toggle('dis', !X.undo.length); $('#lzRedo').classList.toggle('dis', !X.redo.length);
    if (!raf) raf = requestAnimationFrame(selfLoop);
    if (!X.started) openStart();
  }
  function close() { root.classList.remove('on'); tipHide(); pop.style.display = 'none'; cancelAnimationFrame(raf); raf = 0; opts.onClose && opts.onClose(); }
  // API de teste
  Object.assign(window.__lesson, {
    wireT(a, b, color = 'R') { const A = jackOfTerm(a), B = jackOfTerm(b); if (!A || !B) throw new Error('borne inexistente ' + (!A ? a : b)); doAdd(A.id, B.id); },
    setColor(c) { X.color = c; }, check: () => runCheck(true), nrAction, setMain, openEnergize, openReport, openDiagrams, setTab, reportText, startScript(id, name = 'Teste') { X.student = name; X.script = scriptById(id); X.started = true; X.t0 = performance.now(); closeDialog(); renderAll(); },
    tick: (dt) => update(dt),
    probe(a, b) { X.meter.test = 0; X.meter.red = jackOfTerm(a).id; X.meter.black = jackOfTerm(b).id; drawProbes(); return meterRead(); }, press: (id, v) => sim.press(id, v), dialog, closeDialog, zoomAt, say, testMeter: () => $('#lzTest').click(),
  });
  return { open, close, isOpen: () => root.classList.contains('on'), update: (dt) => { lastCall = performance.now(); update(dt); } };
}
