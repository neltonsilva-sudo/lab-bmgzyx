// DONO: orquestrador. Motor M1 (indução trifásico, 6 pontas) montado no furo da face do painel KET-1030 (b1),
// à direita do "SENSOR INDUTIVO". Gira conforme o simulador da aula prática (window.__lesson.sim).
// Especificação adotada (manual do KET-1030 não está publicado): 0,5 cv · 0,37 kW · 4 polos · 380 V Δ / 660 V Y ·
// 1,05 A (380 V) · 1720 rpm · 60 Hz · IP55 — a mesma usada pelo simulador.
export function buildMotor3D(ctx) {
  const { THREE, parts, scene } = ctx;
  const f = parts.benches && parts.benches.faces && parts.benches.faces.find((x) => x.id === 'b1');
  if (!f) return null;
  const hole = f.layoutToFace((810 - 510) * 0.0018602, (718 - 533) * 0.0016034); // furo do painel (benches_layouts)
  const root = new THREE.Group(); root.name = 'motorM1';
  // montado pelo flange no furo do painel, eixo saindo para a frente (vista frontal = tampa + disco estroboscópico
  // coaxial na ponta do eixo). Escala ~60% da versão anterior; fica à direita do sensor indutivo, sem cobri-lo.
  const sc = (f.width / 1.1) * 0.72 * 0.68;
  root.position.set(hole.x, hole.y, 0); root.scale.setScalar(sc);
  f.face.add(root);

  const M = {
    body: new THREE.MeshStandardMaterial({ color: 0x5f6f7e, metalness: 0.35, roughness: 0.55 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x2c353e, metalness: 0.3, roughness: 0.6 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xb9c0c6, metalness: 0.9, roughness: 0.3 }),
    yel: new THREE.MeshStandardMaterial({ color: 0xe8b714, metalness: 0.2, roughness: 0.45 }),
    lite: new THREE.MeshStandardMaterial({ color: 0xd9dde1, metalness: 0.2, roughness: 0.45 }),
  };
  const R = 0.05, Lb = 0.13, zf = 0.008; // raio da carcaça, comprimento (ao longo de z), espessura do flange
  const cylZ = (r, len, z, m, seg = 40, r2) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r2 ?? r, r, len, seg), m); c.rotation.x = Math.PI / 2; c.position.z = z; root.add(c); return c; };
  // flange quadrado preso à face com 4 parafusos
  const fl = new THREE.Mesh(new THREE.BoxGeometry(0.118, 0.118, zf), M.dark); fl.position.z = zf / 2; root.add(fl);
  for (const [x, y] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) { const s2 = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.004, 12), M.steel); s2.rotation.x = Math.PI / 2; s2.position.set(x * 0.046, y * 0.046, zf + 0.002); root.add(s2); }
  // carcaça aletada (eixo z)
  const housing = cylZ(R, Lb, zf + Lb / 2, M.body);
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2, fin = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.012, Lb * 0.9), M.body);
    fin.position.set(Math.cos(a) * (R + 0.004), Math.sin(a) * (R + 0.004), zf + Lb / 2); fin.rotation.z = a + Math.PI / 2; root.add(fin);
  }
  // tampa dianteira (escura), mancal e eixo
  const zb = zf + Lb;
  cylZ(R * 0.97, 0.01, zb + 0.005, M.dark); cylZ(R * 0.55, 0.008, zb + 0.014, M.dark, 32, R * 0.62);
  cylZ(0.014, 0.008, zb + 0.022, M.steel, 24);
  const shaft = cylZ(0.007, 0.03, zb + 0.036, M.steel, 16);
  // caixa de ligação no topo (com tampa) e prensa-cabo
  const tb = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.026, 0.052), M.body); tb.position.set(0, R + 0.013, zf + Lb * 0.55); root.add(tb);
  const tbl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.004, 0.056), M.dark); tbl.position.set(0, R + 0.028, zf + Lb * 0.55); root.add(tbl);
  const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.012, 12), M.dark); gl.rotation.z = Math.PI / 2; gl.position.set(0.029, R + 0.012, zf + Lb * 0.55); root.add(gl);
  // plaqueta de identificação (grande, legível) num suporte ao lado do motor, de frente para quem olha o painel
  const c = document.createElement('canvas'); c.width = 640; c.height = 320; const g = c.getContext('2d');
  const gp = g.createLinearGradient(0, 0, 0, 320); gp.addColorStop(0, '#eef1f3'); gp.addColorStop(1, '#c9cfd4'); g.fillStyle = gp; g.fillRect(0, 0, 640, 320);
  g.strokeStyle = '#4c5864'; g.lineWidth = 10; g.strokeRect(5, 5, 630, 310);
  g.fillStyle = '#1e2a3a'; g.fillRect(5, 5, 630, 84); g.fillStyle = '#f2f4f6'; g.font = '800 64px Arial'; g.fillText('MOTOR 3~ M1', 24, 70, 592);
  g.fillStyle = '#101820'; g.font = '800 60px Arial';
  ['0,5 cv  380Δ/660Y V', '1,05 A  1720 rpm', '60 Hz  IP55  4 polos'].forEach((t, i) => g.fillText(t, 24, 150 + i * 70, 592));
  for (const [x, y] of [[22, 296], [618, 296]]) { g.beginPath(); g.arc(x, y, 8, 0, 7); g.fillStyle = '#8a949c'; g.fill(); }
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8;
  const pw = 0.16, ph = 0.08, pxc = 0.06 + 0.03 + pw / 2;
  const bk = new THREE.Mesh(new THREE.BoxGeometry(pw + 0.006, ph + 0.006, 0.004), M.dark); bk.position.set(pxc, 0, 0.002); root.add(bk);
  const np = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshStandardMaterial({ map: tx, roughness: 0.45, metalness: 0.25 }));
  np.position.set(pxc, 0, 0.0042); root.add(np);
  // disco estroboscópico preso na ponta do eixo (coaxial), de frente — é ele que gira
  const rot = new THREE.Group(); rot.position.set(0, 0, zb + 0.052); root.add(rot);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.01, 20), M.steel); hub.rotation.x = Math.PI / 2; hub.position.z = -0.005; rot.add(hub);
  const dc = document.createElement('canvas'); dc.width = dc.height = 512; const dg = dc.getContext('2d');
  const star = (n, r1, r2, off, fill) => { dg.beginPath(); for (let i = 0; i < n * 2; i++) { const a = off + (i * Math.PI) / n, r = i % 2 ? r2 : r1; dg.lineTo(256 + Math.cos(a) * r, 256 + Math.sin(a) * r); } dg.closePath(); dg.fillStyle = fill; dg.fill(); };
  dg.beginPath(); dg.arc(256, 256, 252, 0, 7); dg.fillStyle = '#efe4c4'; dg.fill(); dg.lineWidth = 6; dg.strokeStyle = '#c9b98e'; dg.stroke();
  star(24, 226, 176, 0, '#111'); star(24, 196, 150, Math.PI / 24, '#efe4c4'); star(18, 150, 104, 0, '#111'); star(18, 122, 82, Math.PI / 18, '#efe4c4');
  star(12, 84, 50, 0, '#111'); star(12, 60, 34, Math.PI / 12, '#efe4c4'); dg.beginPath(); dg.arc(256, 256, 22, 0, 7); dg.fillStyle = '#9aa1a8'; dg.fill();
  dg.beginPath(); dg.arc(256, 256, 8, 0, 7); dg.fillStyle = '#333'; dg.fill();
  const dtx = new THREE.CanvasTexture(dc); dtx.colorSpace = THREE.SRGBColorSpace; dtx.anisotropy = 4;
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.032, 48), new THREE.MeshStandardMaterial({ map: dtx, roughness: 0.6, metalness: 0.05 }));
  rot.add(disc);
  const discBack = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.003, 48), M.dark); discBack.rotation.x = Math.PI / 2; discBack.position.z = -0.0016; rot.add(discBack);
  const blur = new THREE.Mesh(new THREE.CircleGeometry(0.0322, 48), new THREE.MeshBasicMaterial({ color: 0x8a8370, transparent: true, opacity: 0 })); blur.position.z = 0.0005; rot.add(blur);
  root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  // contatores K1–K5: o "botão de teste" frontal (armadura) recua e a janela indicadora fica verde quando a bobina energiza
  const Ks = [];
  const fx = (mm) => (mm / 1400) * f.width, fy = (mm) => (1 - mm / 910) * f.height;
  const mArm = new THREE.MeshStandardMaterial({ color: 0x8fa4b8, metalness: 0.2, roughness: 0.5 });
  for (let i = 0; i < 5; i++) {
    const g = new THREE.Group(); g.position.set(fx(675 + 158.5 * i) - 0.006 * sc, fy(339), 0.075 * sc); g.scale.setScalar(sc); f.face.add(g); g.visible = false; // desalinhado com o contator 3D novo (que já tem janela indicadora)
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.03, 0.01), mArm); g.add(arm);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.012, 0.008), new THREE.MeshBasicMaterial({ color: 0x2a2f33 }));
    win.position.set(0, 0.024, 0.0052); g.add(win);
    Ks.push({ id: 'K' + (i + 1), arm, win, on: false, t: 0 });
  }
  const contactorsOn = () => Ks.filter((k) => k.on).map((k) => k.id);

  let ang = 0, spd = 0;
  function update(dt) {
    const L = window.__lesson, sim = L && L.sim;
    let rpm = 0;
    if (sim && sim.dev) {
      const d = sim.dev('M1');
      // com a tela da aula fechada o circuito continua: avança o simulador aqui
      const open = document.querySelector('.lz-root.on, #lz.on, .lz.on');
      if (!open && sim.step && sim.mainOn) { try { sim.step(Math.min(dt, 0.05)); } catch (e) {} }
      rpm = (d && d.st && d.st.rpm) || 0;
    }
    for (const k of Ks) {
      const d = sim && sim.dev && sim.dev(k.id); k.on = !!(d && d.st && d.st.on && !d.st.burnt);
      k.t += ((k.on ? 1 : 0) - k.t) * Math.min(1, dt * 25);
      k.arm.position.z = -0.0045 * k.t;
      k.win.material.color.setHex(k.on ? 0x22d35a : 0x2a2f33);
    }
    spd += (Math.sign(rpm) * Math.min(Math.abs(rpm) / 1736, 1) * 0.9 * Math.PI * 2 - spd) * Math.min(1, dt * 3);
    ang += spd * dt;
    rot.rotation.z = ang;
    blur.material.opacity = Math.min(1, Math.abs(spd) / 10) * 0.12;
    housing.position.y = Math.abs(rpm) > 50 ? (Math.random() - 0.5) * 0.0004 : 0; shaft.rotation.y = ang; // leve vibração ligado
  }
  return { group: root, update, contactorsOn, hotspot: { id: 'm1', titulo: 'Motor M1 · KET-1030', obj: root,
    info: 'Motor de indução trifásico de 6 pontas (U1-V2-W3 / X4-Y5-Z6). <b>0,5 cv (0,37 kW), 4 polos, 380 V Δ / 660 V Y, 1,05 A em 380 V, 1720 rpm, 60 Hz, IP55.</b> Na rede de 380 V: triângulo (U1-Z6, V2-X4, W3-Y5) para regime e estrela (X4-Y5-Z6 curto-circuitados) na partida estrela-triângulo. Gira quando o circuito montado na Aula Prática é energizado.<br><small>Especificação adotada: o manual do KET-1030 não está disponível publicamente.</small>' } };
}
