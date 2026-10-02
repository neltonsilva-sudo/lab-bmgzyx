// DONO: orquestrador. Mapa de riscos (NR-5 / CIPA) no ambiente 3D: por área, círculos nas cores dos grupos de risco,
// tamanho conforme a gravidade (pequeno / médio / grande) e um quadro com a lista dos riscos. Conteúdo didático de exemplo:
// deve ser validado pela CIPA do estabelecimento.
// buildRiskMap(ctx) → { group, areas, legendHTML(), setVisible(v), update() }
export const GRUPOS = {
  fisico: { nome: 'Físico', cor: '#2e9d3a' },
  quimico: { nome: 'Químico', cor: '#d6261f' },
  biologico: { nome: 'Biológico', cor: '#7a4a21' },
  ergonomico: { nome: 'Ergonômico', cor: '#f2c40f' },
  acidente: { nome: 'Acidentes', cor: '#1f5fd1' },
};
const R_SIZE = { P: 0.13, M: 0.19, G: 0.26 }; // raio do círculo (m)
const R_NOME = { P: 'pequeno', M: 'médio', G: 'grande' };

export function riskAreas(L) {
  const B = L.BENCH_ROW, BO = L.BOOTHS, C = L.CENTER, S = L.SOLAR;
  const zMid = B.z0 + (B.n - 1) * B.pitch / 2;
  return [
    { id: 'bancadas', nome: 'Bancadas didáticas (KET)', x: B.x - 0.65, z: zMid, h: 2.25, riscos: [
      ['acidente', 'G', 'Choque elétrico (380/220 V) e arco elétrico'],
      ['acidente', 'M', 'Curto-circuito e queimadura por contato'],
      ['ergonomico', 'M', 'Postura em pé prolongada'],
      ['fisico', 'P', 'Ruído de motores e contatores'],
    ] },
    { id: 'boxes', nome: 'Área predial (boxes)', x: BO.depth + 0.55, z: BO.z0 + BO.bayW * 2.5, h: 2.15, riscos: [
      ['acidente', 'G', 'Choque elétrico em tomadas, quadros e circuitos'],
      ['acidente', 'M', 'Queda de escada (trabalho acima do piso)'],
      ['acidente', 'P', 'Cortes com ferramentas manuais e eletrodutos'],
      ['ergonomico', 'M', 'Braços elevados e postura forçada'],
    ] },
    { id: 'central', nome: 'Bancada de montagem', x: C.bench.x, z: C.bench.z + 0.2, h: 2.25, riscos: [
      ['acidente', 'M', 'Choque elétrico nos módulos de instrumentos'],
      ['acidente', 'P', 'Prensamento e corte em perfis e bordas'],
      ['ergonomico', 'P', 'Postura sentada / repetitividade na montagem'],
    ] },
    { id: 'solar', nome: 'Módulos fotovoltaicos', x: S.xs[1], z: S.z + 1.1, h: 2.45, riscos: [
      ['acidente', 'G', 'Choque em corrente contínua (gera tensão com luz)'],
      ['ergonomico', 'M', 'Movimentação manual de painéis e carrinhos'],
      ['acidente', 'P', 'Corte no vidro / moldura'],
    ] },
    { id: 'circulacao', nome: 'Circulação e acesso', x: 2.3, z: 7.6, h: 2.1, riscos: [
      ['acidente', 'P', 'Tropeço em cabos de teste e piso escorregadio'],
      ['acidente', 'P', 'Rota de fuga e extintor: manter desobstruídos'],
      ['fisico', 'P', 'Ambiente sem luz natural (iluminação artificial)'],
    ] },
  ];
}

export function buildRiskMap(ctx) {
  const { THREE, L, scene } = ctx;
  // cena própria, desenhada por cima da imagem final (o pós-processamento não lida bem com sprites transparentes)
  const rscene = new THREE.Scene();
  const group = new THREE.Group(); group.name = 'mapa-riscos'; group.visible = false; rscene.add(group);
  const areas = riskAreas(L);

  const circleTex = (cor, txt) => {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    g.beginPath(); g.arc(128, 128, 118, 0, Math.PI * 2); g.fillStyle = cor; g.fill();
    g.lineWidth = 8; g.strokeStyle = 'rgba(255,255,255,.95)'; g.stroke();
    if (txt) { g.fillStyle = cor === '#f2c40f' ? '#3a2e00' : '#fff'; g.font = '700 92px Segoe UI, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 128, 134); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  for (const a of areas) {
    const BASE = 1.72; const g = new THREE.Group(); g.position.set(a.x, BASE, a.z); g.userData.area = a;
    const bh = 0.8; // topo do card de vidro (HTML), que desce até perto da base
    g.userData.cardTop = bh; // topo do card, em coordenadas locais
    // haste fina até o piso, para marcar o local da área
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, BASE, 6), new THREE.MeshBasicMaterial({ color: 0x1e2a3a, transparent: true, opacity: 0.35, depthTest: false, toneMapped: false }));
    stem.position.y = -BASE / 2; g.add(stem);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.42, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x1e2a3a, transparent: true, opacity: 0.3, depthWrite: false, depthTest: false, toneMapped: false }));
    ring.position.y = -BASE + 0.025; g.add(ring);
    group.add(g);
  }

  const legendHTML = () => `<b>Mapa de riscos</b> <span style="opacity:.7">(NR-5 · exemplo didático — validar com a CIPA)</span>
    <div style="display:flex;flex-wrap:wrap;gap:6px 12px;margin-top:6px">${Object.values(GRUPOS).map((g) => `<span style="display:flex;align-items:center;gap:5px"><i style="width:12px;height:12px;border-radius:50%;background:${g.cor};display:inline-block"></i>${g.nome}</span>`).join('')}</div>
    <div style="margin-top:6px;display:flex;align-items:center;gap:10px">Gravidade: ${['P', 'M', 'G'].map((s) => `<span style="display:flex;align-items:center;gap:4px"><i style="width:${{ P: 8, M: 12, G: 17 }[s]}px;height:${{ P: 8, M: 12, G: 17 }[s]}px;border-radius:50%;background:#8a96a8;display:inline-block"></i>${R_NOME[s]}</span>`).join('')}</div>`;

  // ---------- cards de vidro líquido (HTML sobre o canvas, com backdrop-filter) ----------
  if (!document.getElementById('lgCss')) {
    const st = document.createElement('style'); st.id = 'lgCss';
    st.textContent = `.lgWrap{position:fixed;top:0;bottom:0;overflow:hidden;pointer-events:none;z-index:4}
    .lgCard{position:absolute;left:0;top:0;width:330px;transform-origin:50% 0;padding:12px 14px 12px;border-radius:22px;color:#0d1520;
      font:600 13px/1.35 "Segoe UI",system-ui,sans-serif;letter-spacing:.1px;
      background:linear-gradient(135deg,rgba(255,255,255,.30),rgba(255,255,255,.12) 45%,rgba(255,255,255,.22));
      -webkit-backdrop-filter:blur(26px) saturate(210%) brightness(1.12);backdrop-filter:blur(26px) saturate(210%) brightness(1.12);
      border:1px solid rgba(255,255,255,.55);
      box-shadow:inset 0 1.5px 0 rgba(255,255,255,.85),inset 0 -1px 0 rgba(255,255,255,.25),inset 0 0 22px rgba(255,255,255,.18),0 10px 30px rgba(10,25,50,.28),0 2px 6px rgba(10,25,50,.18)}
    .lgCard::before{content:'';position:absolute;inset:1px 1px auto 1px;height:46%;border-radius:21px 21px 60% 60%/21px 21px 22px 22px;
      background:linear-gradient(180deg,rgba(255,255,255,.55),rgba(255,255,255,0));pointer-events:none;z-index:0}
    .lgCard::after{content:'';position:absolute;inset:0;border-radius:22px;pointer-events:none;
      background:radial-gradient(120% 60% at 15% 0%,rgba(255,255,255,.35),transparent 60%),radial-gradient(80% 50% at 100% 100%,rgba(140,190,255,.18),transparent 70%);z-index:0}
    .lgCard h4{position:relative;z-index:1;margin:0 0 7px;font:700 15px "Segoe UI",system-ui,sans-serif;text-shadow:0 0 4px rgba(255,255,255,1),0 0 10px rgba(255,255,255,.85),0 1px 0 rgba(255,255,255,.9)}
    .lgCard .r{position:relative;z-index:1;display:flex;gap:8px;align-items:flex-start;margin:4px 0;text-shadow:0 0 4px rgba(255,255,255,1),0 0 10px rgba(255,255,255,.85),0 1px 0 rgba(255,255,255,.9)}
    .lgCard .d{flex:none;border-radius:50%;margin-top:3px;box-shadow:0 0 0 1.5px rgba(255,255,255,.9),0 1px 3px rgba(0,0,0,.3)}
    .lgCard .r b{font-weight:700}
    .lgCard .cs{position:relative;z-index:1;display:flex;justify-content:center;align-items:flex-end;gap:10px;margin:2px 0 10px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,.55)}
    .lgCard .c{border-radius:50%;box-shadow:0 0 0 2.5px rgba(255,255,255,.95),inset 0 -6px 10px rgba(0,0,0,.18),inset 0 5px 8px rgba(255,255,255,.45),0 3px 8px rgba(0,0,0,.28)}`;
    document.head.appendChild(st);
  }
  const cardHTML = (a) => `<div class="cs">${[...a.riscos].sort((p, q) => R_SIZE[q[1]] - R_SIZE[p[1]]).map(([grp, sz]) => { const d = { P: 24, M: 34, G: 46 }[sz]; return `<i class="c" title="${GRUPOS[grp].nome} (${R_NOME[sz]})" style="width:${d}px;height:${d}px;background:${GRUPOS[grp].cor}"></i>`; }).join('')}</div><h4>${a.nome}</h4>${a.riscos.map(([grp, sz, txt]) => { const px = { P: 9, M: 12, G: 15 }[sz];
    return `<div class="r"><i class="d" style="width:${px}px;height:${px}px;background:${GRUPOS[grp].cor}"></i><span><b>${GRUPOS[grp].nome}</b> (${R_NOME[sz]}): ${txt}</span></div>`; }).join('')}`;
  const wraps = [];
  const wrapAt = (i) => {
    if (!wraps[i]) {
      const w = document.createElement('div'); w.className = 'lgWrap';
      const cards = group.children.map((g) => { const c = document.createElement('div'); c.className = 'lgCard'; c.innerHTML = cardHTML(g.userData.area); w.appendChild(c); return c; });
      document.body.appendChild(w); wraps[i] = { w, cards };
    }
    return wraps[i];
  };
  const pv = new THREE.Vector3(), pv2 = new THREE.Vector3();
  // views: [{cam, x, w, h}] (1 no computador, 2 no modo óculos). [] esconde.
  function layoutCards(views) {
    wraps.forEach((wp, i) => { wp.w.style.display = group.visible && views[i] ? 'block' : 'none'; });
    if (!group.visible) return;
    views.forEach((v, i) => {
      const wp = wrapAt(i); wp.w.style.display = 'block'; wp.w.style.left = v.x + 'px'; wp.w.style.width = v.w + 'px';
      group.children.forEach((g, k) => {
        const c = wp.cards[k];
        if (!g.visible) { c.style.display = 'none'; return; }
        pv.set(0, g.userData.cardTop, 0); g.localToWorld(pv);
        const dist = pv.distanceTo(v.cam.position);
        pv2.copy(pv).project(v.cam);
        if (pv2.z > 1 || pv2.z < -1 || Math.abs(pv2.x) > 1.3 || pv2.y < -1.2 || pv2.y > 1.3) { c.style.display = 'none'; return; }
        // escala: o card tem ~1,15 m de largura no mundo
        const fovR = THREE.MathUtils.degToRad(v.fov ?? v.cam.fov), pxPerM = v.h / (2 * Math.tan(fovR / 2) * dist);
        const sc = Math.min(1.3, Math.max(0.45, (1.35 * pxPerM) / 330));
        c.style.display = 'block';
        c.style.opacity = g.userData.op ?? 1;
        c.style.transform = `translate(${((pv2.x + 1) / 2) * v.w - 165}px, ${((1 - pv2.y) / 2) * v.h}px) scale(${sc.toFixed(3)})`;
        c.style.zIndex = String(1000 - Math.round(dist * 10));
      });
    });
  }

  // some suavemente o que estiver muito perto da câmera (evita placas gigantes na frente do rosto)
  const tmp = new THREE.Vector3();
  function update(cam) {
    if (!group.visible) return;
    for (const g of group.children) {
      g.getWorldPosition(tmp); const d = Math.hypot(tmp.x - cam.position.x, tmp.z - cam.position.z);
      const op = Math.min(1, Math.max(0, (d - 0.9) / 0.9));
      g.traverse((o) => { if (o.material) { o.material.opacity = (o.isSprite ? 1 : 0.35) * op; o.material.transparent = true; } });
      g.visible = op > 0.02; g.userData.op = op;
    }
  }
  return { group, scene: rscene, areas, legendHTML, update, layoutCards, setVisible(v) { group.visible = v; if (!v) layoutCards([]); }, get visible() { return group.visible; } };
}
