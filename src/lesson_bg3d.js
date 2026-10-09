// DONO: aula prática. Fundo 3D do painel KET-1030: renderiza o próprio gêmeo digital (bancada b1) de frente,
// com câmera ortográfica fixa, e alinha a camada interativa da aula (bornes, botões, cabos) ao modelo 3D.
// O alinhamento é um ajuste afim (mm da aula → metros da face 3D) calculado casando os bornes da aula com os
// bornes do modelo 3D (ICP); depois cada borne da aula é "encaixado" no borne 3D correspondente.

function solveAffine(pairs) {
  // mínimos quadrados: [fx, fy] = [a b c; d e f] · [x, y, 1]
  const M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], bx = [0, 0, 0], by = [0, 0, 0];
  for (const [x, y, fx, fy] of pairs) {
    const v = [x, y, 1];
    for (let i = 0; i < 3; i++) { bx[i] += v[i] * fx; by[i] += v[i] * fy; for (let j = 0; j < 3; j++) M[i][j] += v[i] * v[j]; }
  }
  const solve = (A, b) => {
    const m = A.map((r, i) => [...r, b[i]]);
    for (let c = 0; c < 3; c++) {
      let p = c; for (let r = c + 1; r < 3; r++) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r;
      [m[c], m[p]] = [m[p], m[c]];
      for (let r = 0; r < 3; r++) if (r !== c) { const k = m[r][c] / m[c][c]; for (let j = c; j < 4; j++) m[r][j] -= k * m[c][j]; }
    }
    return [m[0][3] / m[0][0], m[1][3] / m[1][1], m[2][3] / m[2][2]];
  };
  return [solve(M, bx), solve(M, by)];
}

export function build3DBackground(panel, view) {
  const T = window.__twin;
  if (!T || !T.THREE || !T.parts || !T.parts.benches || !T.parts.benches.faces) return null;
  const f = T.parts.benches.faces.find((x) => x.id === 'b1');
  if (!f || !f.jacksW || f.jacksW.length < 20) return null;
  const THREE = T.THREE;
  const R = T.renderer, scene = T.scene, V3 = T.camera.position.constructor;
  f.face.updateMatrixWorld(true);
  const inv = f.face.matrixWorld.clone().invert();
  const j3 = f.jacksW.map((w) => { const p = w.clone().applyMatrix4(inv); return [p.x, p.y]; });
  const { FW, FH } = panel;

  // ---------- ajuste afim por ICP ----------
  let A = [[f.width / FW, 0, 0], [0, -f.height / FH, f.height]];
  const map = (x, y, a = A) => [a[0][0] * x + a[0][1] * y + a[0][2], a[1][0] * x + a[1][1] * y + a[1][2]];
  const lj = panel.jacks.filter((j) => !j.ext);
  const nearest = (fx, fy) => { let b = -1, bd = 1e9; j3.forEach(([x, y], i) => { const d = (x - fx) ** 2 + (y - fy) ** 2; if (d < bd) { bd = d; b = i; } }); return [b, Math.sqrt(bd)]; };
  for (const tol of [0.06, 0.04, 0.025, 0.015, 0.012, 0.01]) {
    const pairs = [];
    for (const j of lj) { const [fx, fy] = map(j.x, j.y); const [i, d] = nearest(fx, fy); if (d < tol) pairs.push([j.x, j.y, j3[i][0], j3[i][1]]); }
    if (pairs.length >= 12) A = solveAffine(pairs);
  }
  // matriz inversa (face → mm)
  const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
  const Ai = [[A[1][1] / det, -A[0][1] / det], [-A[1][0] / det, A[0][0] / det]];
  const unmap = (fx, fy) => { const dx = fx - A[0][2], dy = fy - A[1][2]; return [Ai[0][0] * dx + Ai[0][1] * dy, Ai[1][0] * dx + Ai[1][1] * dy]; };
  // casamento por fileiras: agrupa os bornes em fileiras (mesma altura) e alinha cada fileira da aula com a fileira
  // 3D correspondente em ordem da esquerda para a direita (alinhamento de sequências, permite sobras) — assim cada
  // borne da aula cai exatamente sobre o borne do modelo 3D, sem deslocar para o vizinho.
  // campo local: pares "certos" (vizinho mais próximo mútuo, < 9 mm) corrigem as diferenças regionais antes do casamento
  const seeds = [];
  lj.forEach((j) => { const [fx, fy] = map(j.x, j.y), [i, d] = nearest(fx, fy); if (d > 0.009) return;
    let b = null, bd = 1e9; lj.forEach((k) => { const [gx, gy] = map(k.x, k.y), dd = Math.hypot(gx - j3[i][0], gy - j3[i][1]); if (dd < bd) { bd = dd; b = k; } });
    if (b === j) seeds.push([fx, fy, j3[i][0] - fx, j3[i][1] - fy]); });
  const field = (fx, fy) => { const near = seeds.map(([x, y, dx, dy]) => [Math.hypot(x - fx, y - fy), dx, dy]).sort((a, b) => a[0] - b[0]).slice(0, 4);
    let sw = 0, sx = 0, sy = 0; for (const [d, dx, dy] of near) { const w = 1 / (d * d + 0.0004); sw += w; sx += w * dx; sy += w * dy; } return sw ? [sx / sw, sy / sw] : [0, 0]; };
  const L2 = lj.map((j, li) => { const [fx0, fy0] = map(j.x, j.y), [dx, dy] = field(fx0, fy0); return { li, fx: fx0 + dx, fy: fy0 + dy }; });
  // rótulo impresso ao lado de cada borne 3D x rótulo esperado do terminal da aula → só casa rótulos iguais
  const KTOP = { 1: 'L1', 3: 'L2', 5: 'L3', 13: 'NO', A1: 'A1' }, KBOT = { 2: 'T1', 4: 'T2', 6: 'T3', 14: 'NO', A2: 'A2' };
  const DEV = { CTD2: 'CTD-02', CTD3: 'CTD-03', RAX1: 'RAX-02@566', RAX2: 'RAX-02@629', RAX3: 'RAX-02@695', RAX4: 'RAX-02@760', RYD: 'RYD-01@826', TCS: 'TCS-01@892',
    RCA: 'RCA-01@304', RPT: 'RPT-01@369', RST: 'RST-21@499', FSN: 'FSN', CH5: 'CH5' };
  const labOf = (t) => { const m = /^([A-Z]+\d*)\.(.+)$/.exec(t); if (!m) return null; const [, dev, suf] = m;
    if (/^K\d$/.test(dev)) { const l = KTOP[suf] || KBOT[suf]; return l ? `${dev}:${l}` : null; }
    return DEV[dev] ? `${DEV[dev]}:${suf}` : null; };
  const T3 = j3.map(([fx, fy], i) => ({ i, fx, fy, lab: f.jacksW[i].label || null }));
  const usedL = new Set(), used3 = new Set(), res = [];
  const take = (pairs) => { pairs.sort((a, b) => a[0] - b[0]);
    for (const [, li, q] of pairs) { if (usedL.has(li) || used3.has(q.i)) continue; usedL.add(li); used3.add(q.i);
      const jj = lj[li], [x, y] = unmap(q.fx, q.fy); res.push([jj.x, jj.y, x - jj.x, y - jj.y]); jj.x = x; jj.y = y; jj.on3d = true; } };
  // 1) rótulos iguais, até 5 cm (com o campo local corrigindo diferenças regionais)
  { const c = []; L2.forEach((p) => { const lb = labOf(lj[p.li].t); if (!lb) return;
      T3.forEach((q) => { if (q.lab !== lb) return; const d = Math.hypot(q.fx - p.fx, q.fy - p.fy); if (d < 0.15) c.push([d, p.li, q]); }); }); take(c); }
  // 2) barramentos: mesma fileira, qualquer posição (todos os bornes da fileira são o mesmo ponto elétrico)
  { const c = []; L2.forEach((p) => { if (usedL.has(p.li) || !/^PWR\./.test(lj[p.li].t)) return;
      T3.forEach((q) => { if (used3.has(q.i) || q.lab) return; const dy = Math.abs(q.fy - p.fy); if (dy < 0.01) c.push([Math.abs(q.fx - p.fx) + dy, p.li, q]); }); }); take(c); }
  // 3) demais (sem rótulo): por posição, até 2 cm
  { const c = []; L2.forEach((p) => { if (usedL.has(p.li)) return;
      T3.forEach((q) => { if (used3.has(q.i)) return; const d = Math.hypot(q.fx - p.fx, q.fy - p.fy); if (d < 0.02) c.push([d, p.li, q]); }); }); take(c); }
  const snapped = res.length;
  // campo de deslocamento suave (média ponderada dos resíduos vizinhos) para levar botões, lâmpadas e
  // bornes sem par junto com o desenho 3D
  const disp = (x, y) => {
    const near = res.map(([rx, ry, dx, dy]) => [Math.hypot(rx - x, ry - y), dx, dy]).sort((a, b) => a[0] - b[0]).slice(0, 6);
    let sw = 0, sx = 0, sy = 0; for (const [d, dx, dy] of near) { const w = 1 / (d * d + 400); sw += w; sx += w * dx; sy += w * dy; }
    return sw ? [sx / sw, sy / sw] : [0, 0];
  };
  lj.forEach((j, li) => { if (!usedL.has(li)) { const [dx, dy] = disp(j.x, j.y); j.x += dx; j.y += dy; } });
  for (const w of panel.widgets) { if (w.type === 'gst' || w.type === 'extEmerg') continue; const [dx, dy] = disp(w.x, w.y); w.x += dx; w.y += dy; }

  // ---------- renderização ortográfica de frente ----------
  const { VX, VY, VW, VH } = view;
  const mob = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  const k = mob ? 1.3 : 2.4;                                  // px por mm
  const cw = Math.round(VW * k), ch = Math.round(VH * k);
  const corners = [[VX, VY], [VX + VW, VY], [VX, VY + VH], [VX + VW, VY + VH]].map(([x, y]) => map(x, y));
  const fx0 = Math.min(...corners.map((c) => c[0])), fx1 = Math.max(...corners.map((c) => c[0]));
  const fy0 = Math.min(...corners.map((c) => c[1])), fy1 = Math.max(...corners.map((c) => c[1]));
  const cx = (fx0 + fx1) / 2, cy = (fy0 + fy1) / 2, hw = (fx1 - fx0) / 2, hh = (fy1 - fy0) / 2;
  const rw = Math.round(cw * (2 * hw) / Math.abs(VW * A[0][0])), rh = Math.round(ch * (2 * hh) / Math.abs(VH * A[1][1]));
  const cam = new THREE.OrthographicCamera(-hw, hw, hh, -hh, 0.01, 10);
  const eye = new V3(cx, cy, 3).applyMatrix4(f.face.matrixWorld), tgt = new V3(cx, cy, 0).applyMatrix4(f.face.matrixWorld);
  const up = new V3(cx, cy + 1, 0).applyMatrix4(f.face.matrixWorld).sub(tgt).normalize();
  cam.position.copy(eye); cam.up.copy(up); cam.lookAt(tgt); cam.near = 3 - 0.4; cam.far = 3 + 0.6; cam.updateProjectionMatrix();

  const hide = [];
  scene.traverse((o) => { if (o.isBox3Helper && o.visible) { o.visible = false; hide.push(o); } });
  const pr = R.getPixelRatio(), size = R.getSize(new V3());
  R.setPixelRatio(1); R.setSize(rw, rh, false); R.setRenderTarget(null); R.setScissorTest(false); R.setViewport(0, 0, rw, rh);
  R.clippingPlanes = [];
  const fm = f.faceMesh; if (fm) { fm.mesh.material.map = fm.texClean; fm.mesh.material.needsUpdate = true; }
  R.render(scene, cam);
  if (fm) { fm.mesh.material.map = fm.tex; fm.mesh.material.needsUpdate = true; }
  const shot = document.createElement('canvas'); shot.width = rw; shot.height = rh;
  shot.getContext('2d').drawImage(R.domElement, 0, 0, rw, rh, 0, 0, rw, rh);
  R.setPixelRatio(pr); R.setSize(size.x, size.y, false);
  hide.forEach((o) => (o.visible = true));
  if (window.__renderAPI) window.__renderAPI.resize(innerWidth, innerHeight);

  // ---------- compõe o fundo no espaço da aula (mm) ----------
  const c = document.createElement('canvas'); c.width = cw; c.height = ch;
  const g = c.getContext('2d');
  g.fillStyle = '#c9ccd0'; g.fillRect(0, 0, cw, ch);
  // pixel (u, v) da imagem → face (fx, fy) → mm → pixel do fundo
  const fxOf = (u) => cx - hw + (u / rw) * 2 * hw, fyOf = (v) => cy + hh - (v / rh) * 2 * hh;
  const P0 = unmap(fxOf(0), fyOf(0)), PU = unmap(fxOf(1), fyOf(0)), PV = unmap(fxOf(0), fyOf(1));
  g.setTransform((PU[0] - P0[0]) * k, (PU[1] - P0[1]) * k, (PV[0] - P0[0]) * k, (PV[1] - P0[1]) * k, (P0[0] - VX) * k, (P0[1] - VY) * k);
  g.imageSmoothingQuality = 'high';
  g.drawImage(shot, 0, 0);
  g.setTransform(1, 0, 0, 1, 0, 0);

  // posição do disco da ventoinha do motor 3D (para animar na aula)
  let fan = null;
  const m = scene.getObjectByName('motorM1');
  if (m) {
    const rot = m.children.find((o) => o.isGroup && o.children.some((c) => c.geometry && c.geometry.type === 'CircleGeometry'));
    if (rot) {
      const wp = rot.getWorldPosition(new V3()).applyMatrix4(inv), sc = m.getWorldScale(new V3()).x;
      const [x, y] = unmap(wp.x, wp.y); const [, y2] = unmap(wp.x, wp.y + 0.032 * sc);
      fan = { x, y, r: Math.abs(y2 - y) };
    }
  }
  // textos da face (vetoriais na aula): posição em mm e tamanho da letra em mm
  const sy = Math.abs(1 / A[1][1]);
  const texts = fm ? (f.textsW || []).map((r) => { const p = r.pos.clone().applyMatrix4(inv); const [x, y] = unmap(p.x, p.y); const x2 = r.pos2 ? unmap(...(() => { const q = r.pos2.clone().applyMatrix4(inv); return [q.x, q.y]; })())[0] : null; return { t: r.t, x, y, fs: r.s * sy, w: r.w, color: r.color, title: !!r.title, x2 }; }) : [];
  return { canvas: c, k, snapped, total: lj.length, fan, texts, sx: Math.abs(1 / A[0][0]) };
}
