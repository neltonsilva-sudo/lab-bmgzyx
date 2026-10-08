// DONO: orquestrador. Interface no estilo de software de gêmeo digital industrial: barra de ferramentas, cubo de navegação,
// navegador de objetos, propriedades, zonas NR-10 translúcidas, medição, corte do teto, 3 visualizadores e comparação cega.
export function buildUI(o) {
  const { THREE, L, camera, controls, canvas, scene, hotspots, setCam, setWalk, render, parts } = o;
  const R = render.renderer;
  let lesson = null;
  const $ = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };

  const css = document.createElement('style');
  css.textContent = `
  :root{--pn:rgba(246,248,251,.94);--ln:#c9d1dc;--tx:#1e2a3a;--mu:#5d6b7e;--ac:#1f6fd1;--acs:#dbe9fb;--hd:#e9eef5}
  .pn{background:var(--pn);border:1px solid var(--ln);box-shadow:0 4px 18px rgba(10,25,50,.18);backdrop-filter:blur(8px);color:var(--tx);font:12px/1.45 "Segoe UI",system-ui,sans-serif}
  #ttl{position:fixed;left:16px;top:12px;z-index:6;border-radius:8px;padding:7px 12px;font-weight:600;font-size:13px}
  #ttl small{display:block;font-weight:400;color:var(--mu);font-size:11px}
  #tb{position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:7;display:flex;align-items:center;gap:2px;padding:4px 6px;border-radius:7px;max-width:calc(100vw - 32px);flex-wrap:wrap;justify-content:center}
  #tb .sep{width:1px;height:22px;background:var(--ln);margin:0 4px}
  #tb button{all:unset;position:relative;cursor:pointer;width:30px;height:28px;display:grid;place-items:center;border-radius:5px;color:#2b3b52}
  #tb button:hover{background:var(--hd)} #tb button.on{background:var(--acs);color:var(--ac);box-shadow:inset 0 0 0 1px #a9c8f0}
  #tb button svg{width:19px;height:19px} #tb button b{position:absolute;right:3px;bottom:1px;font-size:9px;font-weight:700}
  #tb button[data-tip]:hover::after{content:attr(data-tip);position:absolute;top:34px;left:50%;transform:translateX(-50%);white-space:nowrap;background:#1e2a3a;color:#fff;padding:4px 8px;border-radius:4px;font-size:11px;pointer-events:none}
  #tree{position:fixed;left:16px;top:64px;z-index:6;width:250px;max-height:calc(100vh - 250px);overflow:auto;border-radius:7px;display:none}
  .ph{background:linear-gradient(#f3f6fa,#e3e9f1);border-bottom:1px solid var(--ln);padding:5px 9px;font-weight:600;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0}
  .ph .x{cursor:pointer;color:var(--mu);font-weight:400}
  .tn{display:flex;align-items:center;gap:6px;padding:3px 8px;cursor:pointer;white-space:nowrap}
  .tn:hover{background:var(--hd)} .tn.sel{background:var(--acs)} .tn input{margin:0} .tn .ic{width:14px;height:14px;border-radius:3px;flex:none}
  .tn.l1{padding-left:26px}
  #props{position:fixed;right:16px;bottom:16px;z-index:6;width:min(340px,calc(100vw - 32px));max-height:52vh;overflow:auto;border-radius:7px;display:none}
  #props .bd{padding:9px 11px} #props table{border-collapse:collapse;width:100%;margin:6px 0} #props td{border-top:1px solid #e1e6ee;padding:3px 4px}
  #props td:first-child{color:var(--mu);width:42%} #props .btns{display:flex;gap:6px;margin-top:6px}
  #props button,.dlg button{all:unset;cursor:pointer;padding:4px 10px;border-radius:4px;background:var(--ac);color:#fff;font-weight:600}
  #props button.g{background:#dfe5ee;color:var(--tx)}
  .hs{position:fixed;z-index:4;transform:translate(-50%,-100%);cursor:pointer;color:#fff;font:600 11px "Segoe UI",system-ui;padding:3px 8px;border-radius:3px;background:rgba(31,111,209,.9);border:1px solid rgba(255,255,255,.6);white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.3)}
  .hs::after{content:'';position:absolute;left:50%;top:100%;width:1px;height:9px;background:#fff}
  #meas{position:fixed;z-index:5;transform:translate(-50%,-130%);background:#1e2a3a;color:#ffd84a;font:700 12px "Segoe UI";padding:2px 7px;border-radius:3px;display:none;pointer-events:none}
  #toast{position:fixed;left:50%;top:60px;transform:translateX(-50%);z-index:8;padding:7px 14px;border-radius:6px;display:none;max-width:calc(100vw - 32px)}
  #toast.warn{background:#fff4d6;border-color:#e0b43c}
  #vwt{position:fixed;inset:0;pointer-events:none;z-index:3;display:none}
  #vwt div{position:absolute;top:0;height:24px;background:linear-gradient(#f3f6fa,#dfe6ef);border:1px solid var(--ln);box-sizing:border-box;font:12px "Segoe UI";color:#2b3b52;padding:3px 8px}
  #cubeHit{position:fixed;left:16px;bottom:16px;width:110px;height:110px;z-index:4;cursor:pointer}
  #help{position:fixed;left:140px;bottom:18px;color:#e9eef5;font:11px "Segoe UI",system-ui;z-index:4;text-shadow:0 1px 2px #000;opacity:.85}
  #cmp{position:fixed;inset:0;z-index:20;background:#0b0f16;display:none;flex-direction:column;gap:12px;padding:16px;box-sizing:border-box;color:#fff;font:14px system-ui}
  #cmp .row{flex:1;display:flex;gap:12px;min-height:0} #cmp .cell{flex:1;position:relative;min-width:0}
  #cmp img{width:100%;height:100%;object-fit:cover;border-radius:8px;display:block}
  #cmp .lab{position:absolute;left:10px;top:10px;background:#000b;padding:3px 12px;border-radius:6px;font-weight:700}
  #cmp .ctl{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
  #cmp button{all:unset;cursor:pointer;background:#1f6fd1;padding:8px 14px;border-radius:6px;font-weight:600}
  #cmp button.g{background:#333c4a} #cmp .verd{flex-basis:100%;opacity:.92}
  #mv{position:fixed;right:16px;top:64px;z-index:6;width:240px;border-radius:7px;display:none}
  #mv .bd{padding:6px 9px} #mv .row{display:flex;align-items:center;gap:6px;padding:3px 0} #mv .row span{flex:1}
  #mv button{all:unset;cursor:pointer;padding:3px 8px;border-radius:4px;background:#dfe5ee;color:var(--tx);font-weight:600;font-size:11px}
  #mv button.p{background:var(--ac);color:#fff} #mv .tip{color:var(--mu);font-size:11px;margin-top:4px}
  #bAula{position:fixed;right:16px;top:12px;z-index:7;all:unset;position:fixed;right:16px;top:12px;cursor:pointer;display:flex;align-items:center;gap:8px;padding:9px 16px;border-radius:9px;background:#1a9c4a;color:#fff;font:600 14px "Segoe UI",system-ui,sans-serif;box-shadow:0 4px 14px rgba(10,60,30,.35)}
  #bAula:hover{background:#158a40} #bAula svg{width:18px;height:18px}
  @media (max-width:760px){#bAula{top:auto;bottom:16px;right:16px}}
  #bVR{all:unset;position:fixed;right:16px;top:60px;z-index:7;cursor:pointer;display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:9px;background:#5b3fd1;color:#fff;font:600 13px "Segoe UI",system-ui,sans-serif;box-shadow:0 4px 14px rgba(40,20,90,.35)}
  #bVR:hover{background:#4a31b8} #bVR svg{width:18px;height:18px}
  #vrQR{position:fixed;inset:0;z-index:25;display:none;align-items:center;justify-content:center;background:rgba(8,14,24,.6)}
  #vrQR .card{background:#fff;color:#1e2a3a;border-radius:14px;padding:20px 22px;max-width:min(440px,calc(100vw - 32px));font:14px/1.5 system-ui;box-shadow:0 10px 40px rgba(0,0,0,.35)}
  #vrQR h3{margin:0 0 8px;font-size:17px} #vrQR .qr{display:flex;justify-content:center;margin:12px 0} #vrQR .qr img,#vrQR .qr canvas{width:220px;height:220px;image-rendering:pixelated}
  #vrQR ol{margin:6px 0 10px;padding-left:20px} #vrQR .row{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
  #vrQR button{all:unset;cursor:pointer;padding:7px 14px;border-radius:8px;background:#5b3fd1;color:#fff;font-weight:600} #vrQR button.g{background:#e3e8ef;color:#1e2a3a}
  #vrQR .url{font:11px monospace;word-break:break-all;color:#5d6b7e;text-align:center}
  @media (max-width:760px){#bVR{top:auto;bottom:66px;right:16px}}
  body.vr #bar,body.vr #ttl,body.vr #tb,body.vr #bAula,body.vr #bVR,body.vr #help,body.vr .hs,body.vr #props,body.vr #tree,body.vr #cubeHit,body.vr #riskLeg{display:none!important}
  #riskLeg{position:fixed;left:140px;bottom:40px;z-index:5;border-radius:8px;padding:8px 12px;display:none;max-width:min(520px,calc(100vw - 170px))}
  @media (max-width:760px){#riskLeg{left:16px;bottom:140px;max-width:calc(100vw - 32px)}}
  #lBtns{position:fixed;left:16px;top:76px;z-index:6;display:flex;flex-direction:column;gap:10px}
  #lBtns button{all:unset;cursor:pointer;position:relative;display:flex;align-items:center;gap:10px;min-width:150px;padding:12px 16px;border-radius:22px;overflow:hidden;
    font:600 14px -apple-system,"SF Pro Text","Segoe UI",system-ui,sans-serif;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.35);
    background:linear-gradient(160deg,rgba(255,255,255,.22),rgba(255,255,255,.06) 55%,rgba(255,255,255,.12));
    -webkit-backdrop-filter:blur(18px) saturate(170%);backdrop-filter:blur(18px) saturate(170%);
    border:1px solid rgba(255,255,255,.38);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.55),inset 0 -1px 0 rgba(255,255,255,.12),inset 0 0 18px rgba(255,255,255,.08),0 8px 24px rgba(5,15,35,.28);
    transition:transform .15s,box-shadow .2s,background .2s}
  #lBtns button::before{content:'';position:absolute;inset:0 0 auto 0;height:50%;border-radius:22px 22px 40% 40%/22px 22px 14px 14px;background:linear-gradient(180deg,rgba(255,255,255,.28),rgba(255,255,255,0));pointer-events:none}
  #lBtns button:hover{transform:translateY(-1px);box-shadow:inset 0 1px 0 rgba(255,255,255,.65),inset 0 0 22px rgba(255,255,255,.14),0 12px 28px rgba(5,15,35,.32)}
  #lBtns button svg{width:20px;height:20px;flex:none;filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
  #lBtns button span,#lBtns button svg{position:relative}
  #lBtns #bRisk.on{background:linear-gradient(160deg,rgba(90,150,255,.42),rgba(40,95,210,.22) 60%,rgba(90,150,255,.32));border-color:rgba(170,205,255,.6)}
  #lBtns #bAPR{background:linear-gradient(160deg,rgba(255,190,80,.38),rgba(230,140,20,.18) 60%,rgba(255,190,80,.28));border-color:rgba(255,215,150,.55)}
  #lBtns #bAPR.done{background:linear-gradient(160deg,rgba(90,220,140,.38),rgba(26,156,74,.2) 60%,rgba(90,220,140,.28));border-color:rgba(170,240,195,.55)}
  #lBtns #bAPR span{line-height:1.15} #bAPR small{font-weight:500;opacity:.92;font-size:11.5px}
  body #bAula,body #bVR{border-radius:22px;overflow:hidden;padding:11px 18px;font:600 14px -apple-system,"SF Pro Text","Segoe UI",system-ui,sans-serif;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.35);
    -webkit-backdrop-filter:blur(18px) saturate(170%);backdrop-filter:blur(18px) saturate(170%);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.55),inset 0 -1px 0 rgba(255,255,255,.12),inset 0 0 18px rgba(255,255,255,.08),0 8px 24px rgba(5,15,35,.28);transition:transform .15s,box-shadow .2s}
  body #bAula{background:linear-gradient(160deg,rgba(90,220,140,.42),rgba(26,156,74,.24) 60%,rgba(90,220,140,.32));border:1px solid rgba(170,240,195,.6)}
  body #bVR{top:64px;background:linear-gradient(160deg,rgba(160,130,255,.42),rgba(91,63,209,.24) 60%,rgba(160,130,255,.32));border:1px solid rgba(205,190,255,.6)}
  body #bAula::before,body #bVR::before{content:'';position:absolute;inset:0 0 auto 0;height:50%;border-radius:22px 22px 40% 40%/22px 22px 14px 14px;background:linear-gradient(180deg,rgba(255,255,255,.28),rgba(255,255,255,0));pointer-events:none}
  body #bAula:hover,body #bVR:hover{transform:translateY(-1px);filter:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.65),inset 0 0 22px rgba(255,255,255,.14),0 12px 28px rgba(5,15,35,.32)}
  body #bAula svg,body #bVR svg{filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
  @media (max-width:760px){body #bVR{top:auto}}
  #tree{top:190px!important}
  @media (max-width:760px){#lBtns{top:auto;bottom:16px;left:16px}#lBtns button{padding:8px 11px;font-size:12px}}
  body.vr #lBtns{display:none!important}
  body.multi #ttl{display:none} body.multi #tb{top:32px} body.multi #tree{top:84px}
  @media (max-width:760px){#ttl{display:none}#tb{top:8px}#tree{top:auto;bottom:140px}#help{display:none}#cmp .row{flex-direction:column}}`;
  document.head.appendChild(css);

  const I = {
    fit: '<path d="M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5" fill="none" stroke="currentColor" stroke-width="2"/><rect x="8" y="8" width="8" height="8" rx="1" fill="currentColor" opacity=".35"/>',
    cam: '<path d="M4 7h3l2-2h6l2 2h3v11H4z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12.5" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    walk: '<circle cx="13" cy="4" r="2" fill="currentColor"/><path d="M12 7l-3 5 3 2-1 7M12 7l3 4 3 1M9 12l-3 1M13 14l3 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    tree: '<path d="M4 4h6v4H4zM10 6h4v12h2M14 11h2M16 9h4v4h-4zM16 16h4v4h-4z" fill="none" stroke="currentColor" stroke-width="1.7"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="7.5" cy="8" r="1.6" fill="currentColor"/>',
    zone: '<path d="M4 17l8 4 8-4V7l-8-4-8 4z" fill="#f5d33a" fill-opacity=".45" stroke="#b8920e" stroke-width="1.5"/><path d="M4 7l8 4 8-4M12 11v10" fill="none" stroke="#b8920e" stroke-width="1.5"/>',
    meas: '<path d="M3 16L16 3l5 5L8 21z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7 12l2 2M10 9l2 2M13 6l2 2" stroke="currentColor" stroke-width="1.6"/>',
    cut: '<path d="M3 9h18" stroke="#d33" stroke-width="2" stroke-dasharray="3 2"/><path d="M5 12h14v8H5z" fill="currentColor" opacity=".35"/><path d="M5 12h14v8H5z" fill="none" stroke="currentColor" stroke-width="1.6"/>',
    multi: '<rect x="3" y="4" width="18" height="16" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9 4v16M15 4v16" stroke="currentColor" stroke-width="1.8"/>',
    aula: '<rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="8" cy="9" r="1.8" fill="#1a9c4a"/><circle cx="8" cy="15" r="1.8" fill="#d33"/><path d="M12 8h6M12 12h6M12 16h4" stroke="currentColor" stroke-width="1.6"/>',
    risk: '<circle cx="7" cy="8" r="4" fill="#2e9d3a"/><circle cx="16.5" cy="7" r="3" fill="#d6261f"/><circle cx="9" cy="17" r="3.3" fill="#f2c40f"/><circle cx="17" cy="16" r="4.5" fill="#1f5fd1"/>',
    move: '<path d="M12 2l3 3h-2v6h6V9l3 3-3 3v-2h-6v6h2l-3 3-3-3h2v-6H5v2l-3-3 3-3v2h6V5H9z" fill="currentColor"/>',
    cmp: '<rect x="3" y="5" width="8" height="14" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="13" y="5" width="8" height="14" rx="1" fill="currentColor" opacity=".35" stroke="currentColor" stroke-width="1.8"/>',
  };
  const btn = (id, ic, tip, badge = '') => `<button id="${id}" data-tip="${tip}"><svg viewBox="0 0 24 24">${I[ic]}</svg>${badge ? `<b>${badge}</b>` : ''}</button>`;
  document.body.append(
    $(`<div id="ttl" class="pn">Gêmeo Digital · Laboratório de Eletricidade<small>Réplica 3D em escala real · NR-10</small></div>`),
    $(`<div id="tb" class="pn">${btn('tAula', 'aula', 'Aula Prática - Ket 1030: abrir painel funcional')}<span class="sep"></span>${btn('tFit', 'fit', 'Visão geral (enquadrar tudo)')}${btn('tF1', 'cam', 'Vista da foto 1', '1')}${btn('tF2', 'cam', 'Vista da foto 2', '2')}${btn('tF3', 'cam', 'Vista da foto 3', '3')}<span class="sep"></span>
      ${btn('tWalk', 'walk', 'Caminhar (W A S D)')}<span class="sep"></span>${btn('tTree', 'tree', 'Navegador de objetos')}${btn('tTag', 'tag', 'Rótulos')}<span class="sep"></span>
      ${btn('tRisk', 'risk', 'Mapa de riscos (NR-5)')}${btn('tZone', 'zone', 'Zonas NR-10 (risco e controlada)')}${btn('tMove', 'move', 'Mover ou retirar cadeiras')}${btn('tMeas', 'meas', 'Medir distância')}${btn('tCut', 'cut', 'Corte: remover o teto')}<span class="sep"></span>
      ${btn('tMulti', 'multi', '3 visualizadores gráficos')}${btn('tCmp', 'cmp', 'Comparar com a foto (às cegas)')}</div>`),
    $(`<div id="tree" class="pn"><div class="ph">Navegador de objetos <span class="x">✕</span></div><div id="treeB"></div></div>`),
    $(`<div id="props" class="pn"><div class="ph"><span id="pT">Propriedades</span><span class="x">✕</span></div><div class="bd" id="pB"></div></div>`),
    $(`<button id="bAula" title="Abrir o painel funcional para a aula prática"><svg viewBox="0 0 24 24">${I.aula}</svg>Aula Prática - Ket 1030</button>`),
    $(`<button id="bVR" title="Ver o laboratório no celular com óculos de realidade virtual"><svg viewBox="0 0 24 24"><path d="M3 8h18v8h-6l-2-3h-2l-2 3H3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="7.5" cy="12" r="1.6" fill="currentColor"/><circle cx="16.5" cy="12" r="1.6" fill="currentColor"/></svg>Modo Óculos VR</button>`),
    $(`<div id="vrQR"><div class="card"></div></div>`),
    $(`<div id="lBtns"><button id="bRisk" title="Mostrar/ocultar o mapa de riscos no ambiente"><svg viewBox="0 0 24 24">${I.risk}</svg><span>Mapa de Riscos</span></button><button id="bAPR" title="Análise Preliminar de Risco — preencher antes das atividades"><svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9 11l2 2 4-4M9 17h7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><span>APR<br><small>preencher antes</small></span></button></div>`),
    $(`<div id="riskLeg" class="pn"></div>`),
    $(`<div id="meas"></div>`), $(`<div id="toast" class="pn"></div>`), $(`<div id="vwt"></div>`), $(`<div id="cubeHit" title="Cubo de navegação: clique numa face"></div>`),
    $(`<div id="help">Arraste: girar · Botão direito: mover · Roda: zoom · Clique: selecionar</div>`),
  );
  const g = (id) => document.getElementById(id);
  const toast = (msg, warn, ms = 3200) => { const t = g('toast'); t.innerHTML = msg; t.className = 'pn' + (warn ? ' warn' : ''); t.style.display = 'block'; clearTimeout(toast.h); if (ms) toast.h = setTimeout(() => t.style.display = 'none', ms); };

  // ---------- estado ----------
  let walking = false, multi = false, cut = false, measuring = false, zonesOn = false, tagsOn = o.q.get('tags') !== '0';
  const setOn = (id, v) => g(id).classList.toggle('on', !!v);
  const markView = (c) => ['tF1', 'tF2', 'tF3', 'tFit'].forEach((id, i) => setOn(id, ['foto1', 'foto2', 'foto3', 'geral'][i] === c));
  const view = (c) => { if (walking) toggleWalk(); setCam(c); markView(c); };
  g('tFit').onclick = () => view('geral'); g('tF1').onclick = () => view('foto1'); g('tF2').onclick = () => view('foto2'); g('tF3').onclick = () => view('foto3');
  markView(o.q.get('cam') || 'foto3');
  function toggleWalk() { walking = !walking; setWalk(walking); setOn('tWalk', walking); markView(''); if (walking) toast('Modo caminhar: W A S D para andar, arraste para olhar, Shift para correr.'); }
  g('tWalk').onclick = toggleWalk;
  const tree = g('tree');
  g('tTree').onclick = () => { const v = tree.style.display !== 'block'; tree.style.display = v ? 'block' : 'none'; setOn('tTree', v); };
  tree.querySelector('.x').onclick = () => { tree.style.display = 'none'; setOn('tTree', false); };
  g('tTag').onclick = () => { tagsOn = !tagsOn; setOn('tTag', tagsOn); }; setOn('tTag', tagsOn);
  g('tCut').onclick = () => { cut = !cut; setOn('tCut', cut); if (cut) { toast('Teto removido por um plano de corte a 2,30 m.'); if (camera.position.y < 3) view('geral'); } };
  g('tMulti').onclick = () => { multi = !multi; setOn('tMulti', multi); g('vwt').style.display = multi ? 'block' : 'none'; document.body.classList.toggle('multi', multi); layoutTitles(); };
  g('props').querySelector('.x').onclick = () => select(null);

  // ---------- objetos: árvore, seleção, propriedades ----------
  const items = [];
  const ownerOf = new Map();
  const PARTS = [['room', 'Sala e infraestrutura', '#9aa7b8'], ['booths', 'Área predial (boxes)', '#e8c21a'], ['benches', 'Bancadas didáticas', '#f2d64b'], ['center', 'Área central e fotovoltaico', '#3b5ba5'], ['props', 'Acessórios e segurança', '#333']];
  const treeB = g('treeB');
  treeB.append($(`<div class="tn" style="font-weight:600"><span class="ic" style="background:#1f6fd1"></span>Laboratório de Eletricidade</div>`));
  const addNode = (it, lvl, color) => {
    const el = $(`<div class="tn l${lvl}"><input type="checkbox" checked><span class="ic" style="background:${color}"></span><span>${it.titulo}</span></div>`);
    el.querySelector('input').onclick = (e) => { e.stopPropagation(); it.obj.visible = e.target.checked; };
    el.onclick = () => { select(it); fit(it); };
    it.el = el; treeB.append(el); items.push(it);
  };
  for (const [k, name, color] of PARTS) {
    const p = parts[k]; if (!p || !p.group) continue;
    const it = { titulo: name, obj: p.group, info: '', part: true }; addNode(it, 0, color);
    ownerOf.set(p.group, it);
    for (const h of p.hotspots || []) { addNode(h, 1, color); ownerOf.set(h.obj, h); }
  }
  const box = new THREE.Box3(), selHelper = new THREE.Box3Helper(box, 0xffc400);
  selHelper.visible = false; selHelper.material.depthTest = false; selHelper.renderOrder = 999; scene.add(selHelper);
  let selected = null;
  function select(it) {
    selected = it; items.forEach((x) => x.el.classList.toggle('sel', x === it));
    if (!it) { selHelper.visible = false; g('props').style.display = 'none'; return; }
    box.setFromObject(it.obj); selHelper.visible = true;
    const s = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    const f = (n) => n.toFixed(2).replace('.', ',');
    g('pT').textContent = it.titulo;
    g('pB').innerHTML = `${it.info || ''}<table><tr><td>Dimensões (L × A × P)</td><td>${f(s.z)} × ${f(s.y)} × ${f(s.x)} m</td></tr>
      <tr><td>Posição (x, y, z)</td><td>${f(c.x)} · ${f(box.min.y)} · ${f(c.z)} m</td></tr><tr><td>Tipo</td><td>${it.part ? 'Grupo de recursos' : 'Recurso'}</td></tr></table>
      <div class="btns"><button id="pFit">Enquadrar</button><button class="g" id="pHide">Ocultar</button></div>`;
    g('pFit').onclick = () => fit(it);
    g('pHide').onclick = () => { it.obj.visible = false; const cb = it.el.querySelector('input'); cb.checked = false; select(null); };
    g('props').style.display = 'block';
  }
  async function openLesson(id) {
    { const a = await getAPR(); if (!a.doneToday() && !(/^(localhost|127\.)/.test(location.hostname) && o.q.get('aprok') === '1')) { toast('Antes da aula prática, preencha a APR (Análise Preliminar de Risco).', true, 5000); a.open(() => { markAPR(); openLesson(id); }); return; } }
    if (!lesson) {
      let mod;
      try { mod = await import('./lesson.js'); } catch (e) { console.error(e); toast('Não foi possível abrir a aula prática agora (módulo em atualização). Tente de novo em instantes.', true, 6000); return; }
      lesson = mod.buildLesson({ THREE, L, camera, controls, canvas, scene, parts, setCam, render, toast, ui: { setWalk: (v) => { if (walking !== v) toggleWalk(); } } });
    }
    if (walking) toggleWalk();
    if (/^(localhost|127\.)/.test(location.hostname) && o.q.get('aulademo') === '1') setTimeout(() => { try { const Ls = window.__lesson; Ls.startScript('direta', 'Demo'); Ls.nrAction('secc'); Ls.nrAction('loto'); Ls.testMeter(); [['PWR.L1','PWR.L2'],['PWR.L2','PWR.L3'],['PWR.L1','PWR.L3'],['PWR.L1','PWR.N'],['PWR.L2','PWR.N'],['PWR.L3','PWR.N']].forEach(([a, b]) => Ls.probe(a, b)); Ls.nrAction('ground'); Ls.nrAction('protect'); Ls.nrAction('sign');
      [['PWR.L1','K1.1'],['PWR.L2','K1.3'],['PWR.L3','K1.5'],['K1.2','M1.1'],['K1.4','M1.2'],['K1.6','M1.3'],['M1.1','M1.6'],['M1.2','M1.4'],['M1.3','M1.5'],['PWR.L1','CH2.11'],['CH2.12','CH1.13'],['CH1.14','K1.A1'],['K1.A2','PWR.N'],['CH1.13','K1.13'],['CH1.14','K1.14']].forEach(([a, b], i) => { Ls.setColor('RKBYWG'[i % 6]); Ls.wireT(a, b); });
      if (o.q.get('ligar') === '1') { Ls.openEnergize(); setTimeout(() => { const d = document.getElementById('lzDlg'); let k = 0; const step = () => { d.querySelectorAll('[data-r]').forEach((b) => b.click()); d.querySelectorAll('[data-c]').forEach((b) => { if (!b.checked) { b.checked = true; b.dispatchEvent(new Event('change')); } }); if (++k < 6) setTimeout(step, 80); else { document.getElementById('lzDoEn').click(); setTimeout(() => { Ls.press('CH1', true); setTimeout(() => Ls.press('CH1', false), 250); }, 300); } }; step(); }, 200); }
    } catch (e) { console.error(e); } }, 900);
    try { lesson.open(id); } catch (e) { console.error(e); toast('Erro ao abrir a aula prática: ' + e.message, true, 6000); }
  }
  if (o.q.get('aula')) setTimeout(() => openLesson(o.q.get('aula')), 800);
  g('tAula').onclick = g('bAula').onclick = () => openLesson('b1');
  function fit(it) {
    box.setFromObject(it.obj); const c = box.getCenter(new THREE.Vector3()), r = Math.max(0.6, box.getSize(new THREE.Vector3()).length() * 0.5);
    const d = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
    if (it.obj === (parts.benches && parts.benches.group) || String(it.id || '').startsWith('b')) d.set(-1, 0.25, 0.35).normalize();
    const dist = Math.min(r / Math.sin(THREE.MathUtils.degToRad(27)), 16);
    const p = c.clone().addScaledVector(d, dist); p.x = THREE.MathUtils.clamp(p.x, -8, L.ROOM.W + 8); p.y = Math.max(p.y, 0.5);
    if (walking) toggleWalk();
    setCam({ pos: p.toArray(), look: c.toArray(), fov: 55 }); markView('');
  }

  // ---------- zonas NR-10 (Anexo II: até 1 kV → Rr = 0,20 m; Rc = 0,70 m) ----------
  const zones = new THREE.Group(); zones.name = 'zonas-nr10'; zones.visible = false; scene.add(zones);
  const zoneBoxes = [];
  const zmat = (c, op) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide });
  const mkZone = (b, r, color, op, kind) => {
    const bb = new THREE.Box3(new THREE.Vector3(b.min.x - r, Math.max(0.02, b.min.y - r), b.min.z - r), new THREE.Vector3(b.max.x + (kind === 'ZR' ? r : 0.05), b.max.y + r, b.max.z + r));
    const s = bb.getSize(new THREE.Vector3()), c = bb.getCenter(new THREE.Vector3());
    const geo = new THREE.BoxGeometry(s.x, s.y, s.z);
    const m = new THREE.Mesh(geo, zmat(color, op)); m.position.copy(c); m.renderOrder = 10;
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 })); e.position.copy(c);
    zones.add(m, e); zoneBoxes.push({ bb, kind });
  };
  function buildZones() {
    zones.clear(); zoneBoxes.length = 0;
    for (const h of (parts.benches && parts.benches.hotspots) || []) {
      const b = new THREE.Box3().setFromObject(h.panel || h.obj);
      if (b.isEmpty()) continue;
      // Parte energizada: face frontal do painel (voltada para -x). Limita a altura ao painel (acima da prateleira).
      const live = new THREE.Box3(new THREE.Vector3(b.min.x, Math.max(b.min.y, 0.95), b.min.z), new THREE.Vector3(Math.min(b.max.x, b.min.x + 0.35), b.max.y, b.max.z));
      mkZone(live, 0.70, 0xf5c400, 0.13, 'ZC');
      mkZone(live, 0.20, 0xff3b1f, 0.22, 'ZR');
    }
    if (!zoneBoxes.length) { const b = (() => { const B = L.BENCH_ROW, za = B.z0 + B.width / 2, zb = B.z0 + (B.n - 1) * B.pitch - Math.sign(B.pitch) * B.width / 2; return new THREE.Box3(new THREE.Vector3(B.x - 0.2, 0.95, Math.min(za, zb)), new THREE.Vector3(B.x + 0.15, 2.05, Math.max(za, zb))); })(); mkZone(b, 0.7, 0xf5c400, 0.13, 'ZC'); mkZone(b, 0.2, 0xff3b1f, 0.22, 'ZR'); }
  }
  g('tZone').onclick = () => {
    zonesOn = !zonesOn; setOn('tZone', zonesOn); if (zonesOn) buildZones(); zones.visible = zonesOn;
    if (zonesOn) toast('<b>Zonas NR-10</b> em volta das partes energizadas das bancadas (até 1 kV):<br><span style="color:#c9261a">■</span> Zona de risco — raio 0,20 m: só com técnicas, EPI e ferramentas adequadas.<br><span style="color:#b8920e">■</span> Zona controlada — raio 0,70 m: só profissionais autorizados (NR-10, Anexo II).', false, 9000);
  };
  let zoneState = '';

  // ---------- medição ----------
  const mPts = [], mLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xffd84a, depthTest: false }));
  mLine.renderOrder = 1000; mLine.visible = false; scene.add(mLine);
  const mDots = new THREE.Group(); scene.add(mDots);
  const dotGeo = new THREE.SphereGeometry(0.025, 12, 8), dotMat = new THREE.MeshBasicMaterial({ color: 0xffd84a, depthTest: false });
  g('tMeas').onclick = () => { measuring = !measuring; setOn('tMeas', measuring); mPts.length = 0; mDots.clear(); mLine.visible = false; g('meas').style.display = 'none'; if (measuring) toast('Medir: clique em dois pontos da cena.'); };

  // ---------- clique: seleção / medição ----------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let down = null;
  canvas.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerup', (e) => {
    if (moving || !down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5 || e.button !== 0) return;
    const vp = viewportAt(e.clientX, e.clientY); if (!vp || vp.cam !== camera) return;
    ndc.set(((e.clientX - vp.x) / vp.w) * 2 - 1, -((e.clientY - vp.y) / vp.h) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(scene.children, true).filter((h) => h.object.isMesh && visibleChain(h.object) && !zones.children.includes(h.object) && !mDots.children.includes(h.object) && (!cut || h.point.y < 2.3));
    if (measuring) {
      if (!hits.length) return;
      if (mPts.length >= 2) { mPts.length = 0; mDots.clear(); }
      mPts.push(hits[0].point.clone()); const d = new THREE.Mesh(dotGeo, dotMat); d.position.copy(hits[0].point); d.renderOrder = 1001; mDots.add(d);
      if (mPts.length === 2) { mLine.geometry.setFromPoints(mPts); mLine.visible = true; } else mLine.visible = false;
      return;
    }
    for (const h of hits) { let x = h.object; while (x && !ownerOf.has(x)) x = x.parent; if (x) { select(ownerOf.get(x)); return; } }
    select(null);
  });
  const visibleChain = (x) => { for (; x; x = x.parent) if (!x.visible) return false; return true; };

  // ---------- mover / retirar cadeiras (API parts.props.movables) ----------
  document.body.append($(`<div id="mv" class="pn"><div class="ph">Mover cadeiras <span class="x">✕</span></div><div class="bd"><div id="mvL"></div>
    <div class="row"><button class="p" id="mvAll">Restaurar posições</button></div>
    <div class="tip">Arraste uma cadeira no piso para movê-la. Com ela selecionada: Q/E giram 15°, Delete retira do ambiente.</div></div></div>`));
  let moving = false, drag = null, mvSel = null;
  const MV = () => parts.props && parts.props.movables;
  const floorPl = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), fp = new THREE.Vector3();
  const mvBox = new THREE.Box3(), mvHelper = new THREE.Box3Helper(mvBox, 0x2f9bff);
  mvHelper.visible = false; mvHelper.material.depthTest = false; mvHelper.renderOrder = 999; scene.add(mvHelper);
  let mvHome = null;
  const mvSave = () => { try { const m = MV(); localStorage.setItem('labtwin.cadeiras', JSON.stringify(m.list.map((c) => [c.id, m.get(c.id)]))); } catch (e) {} };
  const mvLoad = () => { try { const m = MV(), j = JSON.parse(localStorage.getItem('labtwin.cadeiras') || 'null'); if (m && j) j.forEach(([id, st]) => m.list.some((c) => c.id === id) && m.set(id, st)); } catch (e) {} };
  function mvRefresh() {
    const m = MV(); if (!m) return;
    const L2 = g('mvL'); L2.innerHTML = '';
    for (const c of m.list) {
      const st = m.get(c.id);
      const r = $(`<div class="row"><input type="checkbox" ${st.visible ? 'checked' : ''} title="No ambiente"><span>${c.titulo}</span><button>${st.visible ? 'Retirar' : 'Repor'}</button></div>`);
      const tog = () => { const v = !m.get(c.id).visible; m.set(c.id, { ...m.get(c.id), visible: v }); if (!v && mvSel === c.id) mvPick(null); mvSave(); mvRefresh(); };
      r.querySelector('input').onclick = tog; r.querySelector('button').onclick = tog;
      r.querySelector('span').onclick = () => m.get(c.id).visible && mvPick(c.id);
      if (c.id === mvSel) r.style.fontWeight = '700';
      L2.append(r);
    }
  }
  function mvPick(id) { mvSel = id; mvHelper.visible = !!id; if (id) mvBox.copy(MV().box(id)); mvRefresh(); }
  if (MV()) { mvHome = MV().list.map((c) => [c.id, { ...MV().get(c.id) }]); mvLoad(); }
  g('mvAll').onclick = () => { const m = MV(); if (!m || !mvHome) return; mvHome.forEach(([id, st]) => m.set(id, { ...st })); mvSave(); mvPick(null); };
  g('mv').querySelector('.x').onclick = () => g('tMove').click();
  g('tMove').onclick = () => {
    if (!MV()) { toast('As cadeiras ainda não estão prontas para mover (o módulo de acessórios está sendo atualizado).', true); return; }
    moving = !moving; setOn('tMove', moving); g('mv').style.display = moving ? 'block' : 'none';
    if (moving) { if (measuring) g('tMeas').click(); mvRefresh(); toast('Mover cadeiras: arraste no piso; Q/E giram; Delete retira.'); } else mvPick(null);
  };
  const rayAt = (e) => { const vp = viewportAt(e.clientX, e.clientY); if (!vp || vp.cam !== camera) return false; ndc.set(((e.clientX - vp.x) / vp.w) * 2 - 1, -((e.clientY - vp.y) / vp.h) * 2 + 1); ray.setFromCamera(ndc, camera); return true; };
  canvas.addEventListener('pointerdown', (e) => {
    if (!moving || e.button !== 0 || !rayAt(e)) return;
    const m = MV();
    const hit = ray.intersectObjects(scene.children, true).find((h) => h.object.isMesh && visibleChain(h.object) && m.pick(h.object, h.instanceId));
    if (!hit) return;
    const id = m.pick(hit.object, hit.instanceId); mvPick(id);
    ray.ray.intersectPlane(floorPl, fp); const st = m.get(id);
    drag = { id, dx: st.x - fp.x, dz: st.z - fp.z };
    controls.enabled = false; canvas.setPointerCapture(e.pointerId);
    e.stopImmediatePropagation(); e.preventDefault();
  }, { capture: true });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag || !rayAt(e) || !ray.ray.intersectPlane(floorPl, fp)) return;
    const m = MV(), st = m.get(drag.id);
    const x = THREE.MathUtils.clamp(fp.x + drag.dx, 0.3, L.ROOM.W - 0.3), z = THREE.MathUtils.clamp(fp.z + drag.dz, 0.3, L.ROOM.D - 0.3);
    m.set(drag.id, { ...st, x, z }); mvBox.copy(m.box(drag.id));
  });
  const endDrag = () => { if (!drag) return; drag = null; controls.enabled = true; mvSave(); };
  canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
  addEventListener('keydown', (e) => {
    if (!moving || !mvSel || walking) return;
    const m = MV(), st = m.get(mvSel);
    if (e.code === 'KeyQ' || e.code === 'KeyE') { m.set(mvSel, { ...st, ry: st.ry + (e.code === 'KeyQ' ? 1 : -1) * Math.PI / 12 }); mvBox.copy(m.box(mvSel)); mvSave(); }
    if (e.code === 'Delete' || e.code === 'Backspace') { m.set(mvSel, { ...st, visible: false }); mvPick(null); mvSave(); toast('Cadeira retirada. Use “Repor” no painel para trazê-la de volta.'); }
  });

  // ---------- rótulos ----------
  const tags = hotspots.map((h) => {
    const el = document.createElement('div'); el.className = 'hs'; el.textContent = h.titulo; document.body.appendChild(el);
    el.onclick = () => select(h);
    const b = new THREE.Box3().setFromObject(h.obj); const top = new THREE.Vector3(); b.getCenter(top); top.y = b.max.y + 0.08;
    return { el, top };
  });

  // ---------- cubo de navegação (cena própria, desenhada no canto) ----------
  const cubeScene = new THREE.Scene(), cubeCam = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
  const face = (txt) => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    const gr = x.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#fbfcfe'); gr.addColorStop(1, '#dde4ee');
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128); x.strokeStyle = '#8a97a8'; x.lineWidth = 4; x.strokeRect(2, 2, 124, 124);
    x.fillStyle = '#2b3b52'; x.font = '600 25px Segoe UI, system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 64, 66);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return new THREE.MeshBasicMaterial({ map: t, toneMapped: false });
  };
  const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), ['Direita', 'Esquerda', 'Topo', 'Base', 'Entrada', 'Fundo'].map(face));
  cubeScene.add(cube);
  const axis = (dir, col) => { const a = new THREE.ArrowHelper(dir, new THREE.Vector3(-0.62, -0.62, 0.62), 0.9, col, 0.16, 0.09); a.line.material.toneMapped = false; a.cone.material.toneMapped = false; cubeScene.add(a); };
  axis(new THREE.Vector3(1, 0, 0), 0xe53935); axis(new THREE.Vector3(0, 1, 0), 0x2e9d3a); axis(new THREE.Vector3(0, 0, -1), 0x1e5fd8);
  const CUBE = 110;
  g('cubeHit').addEventListener('click', (e) => {
    const r = g('cubeHit').getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, cubeCam); const h = ray.intersectObject(cube)[0]; if (!h) return;
    const n = h.face.normal.clone(), t = controls.target.clone(), dist = Math.max(4, camera.position.distanceTo(t));
    if (n.y > 0.5) n.set(0, 1, 0.0015); if (n.y < -0.5) n.set(0, -1, 0.0015);
    if (walking) toggleWalk();
    setCam({ pos: t.clone().addScaledVector(n.normalize(), dist).toArray(), look: t.toArray(), fov: camera.fov }); markView('');
  });

  // ---------- 3 visualizadores ----------
  const topCam = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
  const detCam = new THREE.PerspectiveCamera(45, 1, 0.05, 40);
  const cutPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 2.3);
  function layoutTitles() {
    const w = innerWidth / 3; const el = g('vwt'); el.innerHTML = '';
    ['Visualizador gráfico (1) · câmera livre', 'Visualizador gráfico (2) · planta', 'Visualizador gráfico (3) · detalhe'].forEach((t, i) => el.append($(`<div style="left:${i * w}px;width:${w}px">${t}</div>`)));
  }
  addEventListener('resize', () => multi && layoutTitles());
  function viewportAt(x, y) {
    if (!multi) return { x: 0, y: 0, w: innerWidth, h: innerHeight, cam: camera };
    const w = innerWidth / 3, i = Math.min(2, Math.floor(x / w));
    return { x: i * w, y: 24, w, h: innerHeight - 24, cam: [camera, topCam, detCam][i] };
  }
  let tSim = 0;
  function renderVP(cam, x, y, w, h, clip) {
    const H = innerHeight; R.setViewport(x, H - y - h, w, h); R.setScissor(x, H - y - h, w, h);
    cam.aspect = w / h; cam.updateProjectionMatrix();
    R.clippingPlanes = clip ? [cutPlane] : []; R.render(scene, cam);
  }

  // ---------- comparação cega ----------
  const cmp = $(`<div id="cmp"></div>`); document.body.appendChild(cmp);
  let verdicts = {};
  fetch('shots/compare.json').then((r) => r.ok ? r.json() : {}).then((j) => verdicts = j || {}).catch(() => {});
  function openCompare(n) {
    const name = 'foto' + n;
    if (multi) g('tMulti').click();
    const wasCut = cut, wasZ = zones.visible, wasSel = selHelper.visible; cut = false; zones.visible = false; selHelper.visible = false;
    setCam(name, true); controls.update(); R.clippingPlanes = [];
    render.render(scene, camera);
    const shot = canvas.toDataURL('image/jpeg', 0.92);
    cut = wasCut; zones.visible = wasZ; selHelper.visible = wasSel; markView(name);
    const swap = Math.random() < 0.5, imgs = swap ? [`refs/${name}.jpg`, shot] : [shot, `refs/${name}.jpg`];
    cmp.style.display = 'flex';
    cmp.innerHTML = `<div class="row">${imgs.map((s, i) => `<div class="cell"><img src="${s}"><div class="lab">${'AB'[i]}</div></div>`).join('')}</div>
      <div class="ctl"><b>Vista ${n} · qual é a foto real?</b><button data-p="0">A</button><button data-p="1">B</button>
      <button class="g" data-n>Próxima vista</button><button class="g" data-x>Fechar</button><div class="verd"></div></div>`;
    const vd = cmp.querySelector('.verd');
    cmp.querySelectorAll('[data-p]').forEach((b) => b.onclick = () => {
      const real = swap ? 0 : 1, ok = +b.dataset.p === real, ver = verdicts[name];
      vd.innerHTML = `${ok ? 'Acertou' : 'Errou'}: a foto real é <b>${'AB'[real]}</b>; o gêmeo digital é <b>${'AB'[1 - real]}</b>.` +
        (ver ? `<br>Inspetor independente: melhor aparência = <b>${ver.vencedor}</b> · nota do gêmeo ${ver.nota}/10 — ${ver.frase}` : '');
    });
    cmp.querySelector('[data-n]').onclick = () => openCompare(n % 3 + 1);
    cmp.querySelector('[data-x]').onclick = () => { cmp.style.display = 'none'; };
  }
  g('tCmp').onclick = () => openCompare(3);
  if (/github\.io$/.test(location.hostname)) g('tCmp').style.display = 'none';
  if (o.q.get('compare')) setTimeout(() => openCompare(+o.q.get('compare') || 3), 1500);
  if (o.q.get('zones') === '1') setTimeout(() => g('tZone').click(), 300);
  if (o.q.get('multi') === '1') setTimeout(() => g('tMulti').click(), 300);
  if (o.q.get('cut') === '1') cut = true, setOn('tCut', true);

  // ---------- mapa de riscos (NR-5) ----------
  let risk = null, riskOn = false;
  async function setRisk(on) {
    if (on && !risk) { const m = await import('./riskmap.js'); risk = m.buildRiskMap({ THREE, L, scene }); g('riskLeg').innerHTML = risk.legendHTML(); }
    riskOn = on; if (risk) risk.setVisible(on); setOn('tRisk', on); g('bRisk').classList.toggle('on', on); g('riskLeg').style.display = on ? 'block' : 'none';
    try { localStorage.setItem('labtwin.riscos', on ? '1' : '0'); } catch (e) {}
  }
  g('tRisk').onclick = g('bRisk').onclick = () => setRisk(!riskOn);

  // ---------- APR (Análise Preliminar de Risco) ----------
  let apr = null;
  const getAPR = async () => { if (!apr) { const [a, r] = await Promise.all([import('./apr.js'), import('./riskmap.js')]); apr = a.buildAPR({ toast, riskAreas: r.riskAreas(L) }); } return apr; };
  const markAPR = () => { const a = apr && apr.last(); g('bAPR').classList.toggle('done', !!a); g('bAPR').querySelector('small').textContent = a ? 'preenchida ✓' : 'preencher antes'; };
  g('bAPR').onclick = async () => { (await getAPR()).open(markAPR); };
  getAPR().then(markAPR).catch(() => {});
  if (o.q.get('apr') === '1') setTimeout(() => g('bAPR').click(), 1500);
  { let saved = null; try { saved = localStorage.getItem('labtwin.riscos'); } catch (e) {}
    if (o.q.get('riscos') === '1' || saved === '1') setRisk(true); }

  // ---------- modo óculos VR (celular): QR code no computador, tela dividida no celular ----------
  const APP_URL = 'https://claude.ai/artifact/7gZB9MuoipwuRiMBbZmRcJ';
  const PUBLIC_URL = 'https://neltonsilva-sudo.github.io/lab-bmgzyx/'; // endereço público do simulador (Netlify/GitHub Pages), quando existir
  const isPhone = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (matchMedia('(pointer:coarse)').matches && Math.min(screen.width, screen.height) < 820);
  let vr = null;
  async function startVR() {
    if (!vr) { const m = await import('./vr.js'); vr = m.buildVR({ THREE, L, camera, controls, scene, render, toast, overlay: () => (risk && riskOn ? risk.scene : null) }); }
    if (walking) toggleWalk(); if (multi) g('tMulti').click(); if (lesson && lesson.isOpen()) lesson.close();
    g('vrQR').style.display = 'none'; select(null);
    await vr.enter();
  }
  // sessão professor → celulares (QR code): fechar a página do professor ou clicar em Encerrar bloqueia os celulares
  let sess = null, sid = null;
  const ensureSession = async () => { if (sid && sess && !sess.closed) return sid; const m = await import('./session.js'); sid = m.newSessionId(); sess = m.hostSession(sid); return sid; };
  const inClaudeHost = /claude|anthropic/i.test(location.hostname);
  function lockPhone(why) {
    try { if (vr && vr.active) vr.exit(); } catch (e) {}
    try { sessionStorage.clear(); } catch (e) {}
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:300;display:flex;align-items:center;justify-content:center;padding:20px;background:radial-gradient(circle at 30% 20%,#2a4a7a,#0d1622 70%);font:16px/1.5 system-ui;color:#fff;text-align:center';
    ov.innerHTML = '<div style="max-width:420px"><div style="font-size:46px">🔒</div><h2 style="margin:8px 0">' + (why === 'old' || why === 'expired' ? 'QR code expirado' : 'Sessão encerrada pelo professor') + '</h2><p style="opacity:.85">' + (why === 'old' || why === 'expired' ? 'Este QR code não é mais válido. Peça ao professor o QR code da aula de hoje.' : 'Para entrar de novo, escaneie um novo QR code e digite a senha de acesso.') + '</p></div>';
    document.body.appendChild(ov);
    try { R.setAnimationLoop && R.setAnimationLoop(null); } catch (e) {}
    setTimeout(() => { try { document.getElementById('c').remove(); } catch (e) {} }, 300);
  }
  // QR antigo (sem sessão, encerrado ou expirado) não dá mais acesso
  if (o.q.get('vr') === '1' && !inClaudeHost) {
    const s0 = o.q.get('s');
    if (!s0) lockPhone('old');
    else import('./session.js').then(async (m) => {
      const st = await m.checkSession(s0);
      if (st === 'closed' || st === 'expired') lockPhone(st); else m.watchSession(s0, lockPhone);
    }).catch(() => {});
  }

 new Promise((res, rej) => { if (window.qrcode) return res(); const sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js'; sc.onload = res; sc.onerror = rej; document.head.appendChild(sc); });
  async function openVRDialog() {
    const box = g('vrQR'), card = box.querySelector('.card');
    // fora do Claude (site próprio ou rede local): o QR aponta para esta mesma página; dentro do Claude: para o site público, se houver
    const inClaude = /claude|anthropic/i.test(location.hostname);
    let url = !inClaude ? location.origin + location.pathname + '?vr=1&riscos=1' : (PUBLIC_URL ? PUBLIC_URL + '?vr=1&riscos=1' : APP_URL);
    if (!isPhone && url !== APP_URL) { try { url += '&s=' + (await ensureSession()); } catch (e) {} }
    card.innerHTML = `<h3>Modo Óculos VR</h3>
      ${isPhone ? '<p>Você já está no celular. Toque em <b>Entrar no VR</b>, gire o celular na horizontal e encaixe-o no óculos.</p>'
        : `<p>Aponte a câmera do celular para o QR code para abrir o laboratório no celular:</p><div class="qr" id="vrQRimg">gerando…</div><div class="url">${url}</div>`}
      <ol><li>No celular, toque em <b>Modo Óculos VR</b> → <b>Entrar no VR</b> (no iPhone, permita o acesso ao movimento).</li>
      <li>Gire o celular na horizontal e encaixe-o no óculos, com a tela para dentro.</li>
      <li>Olhe em volta mexendo a cabeça. Olhe para um <b>ponto verde</b> no piso por 1,5 s para ir até ele, ou toque na tela (botão do óculos) para andar até onde está olhando.</li></ol>
      <label style="display:flex;align-items:center;gap:8px;margin:4px 0 12px;font-weight:600"><input type="checkbox" id="vrRisk" ${riskOn || isPhone ? 'checked' : ''}> Mostrar o mapa de riscos no ambiente</label>
      <div class="row"><button class="g" id="vrClose">Fechar</button>${isPhone ? '<button class="g" id="vrMap">Ver sem óculos</button>' : ''}${isPhone ? '<button id="vrGo">Entrar no VR</button>' : '<button class="g" id="vrEnd" style="background:#fde2e0;color:#a3170f">Encerrar sessão dos celulares</button><button class="g" id="vrHere">Testar neste computador</button>'}</div>`;
    box.style.display = 'flex';
    card.querySelector('#vrClose').onclick = () => { box.style.display = 'none'; };
    const ve = card.querySelector('#vrEnd'); if (ve) ve.onclick = () => { if (sess) sess.close(); sess = null; sid = null; box.style.display = 'none'; toast('Sessão encerrada: os celulares conectados por este QR code foram bloqueados. Um novo QR será gerado na próxima vez.', false, 6000); };
    const rk = card.querySelector('#vrRisk'); rk.onchange = () => setRisk(rk.checked);
    if (isPhone && rk.checked && !riskOn) setRisk(true);
    const vm = card.querySelector('#vrMap'); if (vm) vm.onclick = () => { box.style.display = 'none'; setRisk(true); setCam('geral'); };
    const go = card.querySelector('#vrGo') || card.querySelector('#vrHere'); go.onclick = startVR;
    if (!isPhone) {
      try { await loadQR(); const q = window.qrcode(0, 'M'); q.addData(url); q.make(); card.querySelector('#vrQRimg').innerHTML = q.createImgTag(6, 8); }
      catch (e) { card.querySelector('#vrQRimg').textContent = 'Não foi possível gerar o QR code (sem internet?). Abra o endereço abaixo no celular.'; }
    }
  }
  g('bVR').onclick = openVRDialog;
  g('vrQR').addEventListener('click', (e) => { if (e.target.id === 'vrQR') g('vrQR').style.display = 'none'; });
  // aberto pelo QR (ou já no celular): oferece entrar no VR direto
  if (o.q.get('vrtest') === '1') setTimeout(startVR, 1500);
  else if (o.q.get('vr') === '1' || (isPhone && o.q.get('vr') !== '0')) setTimeout(openVRDialog, 1200);

  const v = new THREE.Vector3();
  return {
    vrActive: () => !!(vr && vr.active),
    update(dt) {
      tSim += dt;
      if (lesson) lesson.update(dt);
      if (risk && riskOn) {
        risk.update(camera);
        const W2 = innerWidth, H2 = innerHeight;
        if (vr && vr.active) risk.layoutCards([{ cam: vr.cams[0], fov: camera.fov, x: 0, w: W2 / 2, h: H2 }, { cam: vr.cams[1], fov: camera.fov, x: W2 / 2, w: W2 / 2, h: H2 }]);
        else if (multi || (lesson && lesson.isOpen())) risk.layoutCards([]);
        else risk.layoutCards([{ cam: camera, x: 0, w: W2, h: H2 }]);
      }
      if (vr && vr.active) { vr.update(dt); return; }
      const W = innerWidth, H = innerHeight, vw = multi ? W / 3 : W, vh = multi ? H - 24 : H, oy = multi ? 24 : 0;
      for (const t of tags) {
        v.copy(t.top).project(camera);
        const vis = tagsOn && !measuring && v.z < 1 && Math.abs(v.x) < 1 && Math.abs(v.y) < 1 && camera.position.distanceTo(t.top) < 9 && !(cut && false);
        t.el.style.display = vis ? 'block' : 'none';
        if (vis) { t.el.style.left = ((v.x + 1) / 2 * vw) + 'px'; t.el.style.top = (oy + (1 - v.y) / 2 * vh) + 'px'; }
      }
      const ml = g('meas');
      if (mPts.length === 2) {
        v.addVectors(mPts[0], mPts[1]).multiplyScalar(0.5).project(camera);
        ml.style.display = v.z < 1 ? 'block' : 'none'; ml.style.left = ((v.x + 1) / 2 * vw) + 'px'; ml.style.top = (oy + (1 - v.y) / 2 * vh) + 'px';
        ml.textContent = mPts[0].distanceTo(mPts[1]).toFixed(2).replace('.', ',') + ' m';
      } else ml.style.display = 'none';
      if (selected && selHelper.visible) box.setFromObject(selected.obj);
      // Alerta de zona NR-10 quando a pessoa (câmera no modo caminhar) entra nela.
      if (zonesOn && walking) {
        const p = camera.position.clone(); p.y = 1.2;
        const k = zoneBoxes.some((z) => z.kind === 'ZR' && z.bb.containsPoint(p)) ? 'ZR' : zoneBoxes.some((z) => z.kind === 'ZC' && z.bb.containsPoint(p)) ? 'ZC' : '';
        if (k !== zoneState) {
          zoneState = k;
          if (k === 'ZR') toast('⚠ Você entrou na <b>zona de risco</b>: só com desenergização comprovada ou técnicas de trabalho em tensão, EPI e ferramentas isoladas (NR-10).', true, 5000);
          else if (k === 'ZC') toast('⚠ <b>Zona controlada</b>: acesso restrito a profissionais autorizados (NR-10, item 10.8).', true, 5000);
        }
      }
      // câmeras auxiliares
      topCam.position.set(L.ROOM.W / 2, 13.5, L.ROOM.D / 2 + 0.01); topCam.up.set(0, 0, -1); topCam.lookAt(L.ROOM.W / 2, 0, L.ROOM.D / 2);
      const tgt = selected ? new THREE.Box3().setFromObject(selected.obj) : new THREE.Box3().setFromObject((parts.benches && parts.benches.hotspots && parts.benches.hotspots[0] && parts.benches.hotspots[0].obj) || scene);
      const c = tgt.getCenter(new THREE.Vector3()), r = Math.min(6, Math.max(1.2, tgt.getSize(new THREE.Vector3()).length() * 0.7));
      const a = tSim * 0.25; detCam.position.set(c.x - Math.abs(Math.cos(a)) * r, c.y + 0.4, c.z + Math.sin(a) * r);
      detCam.position.x = THREE.MathUtils.clamp(detCam.position.x, 0.3, L.ROOM.W - 0.3); detCam.position.z = THREE.MathUtils.clamp(detCam.position.z, 0.3, L.ROOM.D - 0.3);
      detCam.lookAt(c);
    },
    draw() {
      if (lesson && lesson.isOpen()) return;
      if (vr && vr.active) { vr.render(); return; }
      const W = innerWidth, H = innerHeight;
      if (!multi) {
        R.clippingPlanes = cut ? [cutPlane] : [];
        render.render(scene, camera);
        if (risk && riskOn) { const ac = R.autoClear; R.autoClear = false; R.clippingPlanes = []; R.render(risk.scene, camera); R.autoClear = ac; }
      } else {
        const w = W / 3, asp = camera.aspect;
        R.setScissorTest(true); R.autoClear = true;
        renderVP(camera, 0, 24, w, H - 24, cut);
        renderVP(topCam, w, 24, w, H - 24, true);
        renderVP(detCam, 2 * w, 24, w, H - 24, cut);
        camera.aspect = asp; camera.updateProjectionMatrix();
        R.setScissorTest(false); R.setViewport(0, 0, W, H);
      }
      // cubo de navegação
      const d = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
      cubeCam.position.copy(d.multiplyScalar(3.4)); cubeCam.up.copy(camera.up); cubeCam.lookAt(0, 0, 0);
      const ac = R.autoClear, cp = R.clippingPlanes;
      R.autoClear = false; R.clippingPlanes = []; R.setScissorTest(true);
      R.setViewport(16, 16, CUBE, CUBE); R.setScissor(16, 16, CUBE, CUBE); R.clearDepth(); R.render(cubeScene, cubeCam);
      R.setScissorTest(false); R.setViewport(0, 0, W, H); R.autoClear = ac; R.clippingPlanes = cp;
    },
  };
}
