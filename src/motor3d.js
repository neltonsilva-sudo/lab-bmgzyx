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
  const sc = f.width / 1.1; // escala relativa à face (~1,1 m)
  root.position.set(hole.x + 0.085 * sc, hole.y, 0); root.scale.setScalar(sc);
  f.face.add(root);

  const M = {
    body: new THREE.MeshStandardMaterial({ color: 0x5f6f7e, metalness: 0.35, roughness: 0.55 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x2c353e, metalness: 0.3, roughness: 0.6 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xb9c0c6, metalness: 0.9, roughness: 0.3 }),
    yel: new THREE.MeshStandardMaterial({ color: 0xe8b714, metalness: 0.2, roughness: 0.45 }),
    lite: new THREE.MeshStandardMaterial({ color: 0xd9dde1, metalness: 0.2, roughness: 0.45 }),
  };
  const R = 0.05, Lb = 0.15, z0 = R + 0.012; // raio da carcaça, comprimento, afastamento da face
  // carcaça (eixo ao longo de x) com aletas
  const housing = new THREE.Mesh(new THREE.CylinderGeometry(R, R, Lb, 40), M.body); housing.rotation.z = Math.PI / 2; housing.position.z = z0; root.add(housing);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2, fin = new THREE.Mesh(new THREE.BoxGeometry(Lb * 0.92, 0.006, 0.012), M.body);
    fin.position.set(0, Math.sin(a) * (R + 0.004), z0 + Math.cos(a) * (R + 0.004)); fin.rotation.x = -a; root.add(fin);
  }
  // tampas, tampa do ventilador (traseira, à direita) e pés/suporte preso à face
  const bell = (x, rr, len, m) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, len, 36), m); b.rotation.z = Math.PI / 2; b.position.set(x, 0, z0); root.add(b); return b; };
  bell(-Lb / 2 - 0.006, R * 0.92, 0.012, M.dark); bell(Lb / 2 + 0.022, R * 0.98, 0.044, M.dark);
  const grill = new THREE.Mesh(new THREE.CircleGeometry(R * 0.8, 32), new THREE.MeshStandardMaterial({ color: 0x14181b, roughness: 0.9 }));
  grill.rotation.y = Math.PI / 2; grill.position.set(Lb / 2 + 0.0445, 0, z0); root.add(grill);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(Lb * 0.9, 0.012, z0 * 0.95), M.dark); plate.position.set(0, -R - 0.004, z0 / 2); root.add(plate);
  const base = new THREE.Mesh(new THREE.BoxGeometry(Lb * 1.05, R * 2.3, 0.006), M.dark); base.position.set(0, -0.004, 0.003); root.add(base);
  // caixa de ligação (6 bornes) no topo e placa de identificação
  const tb = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.026, 0.04), M.body); tb.position.set(-0.01, R + 0.016, z0); root.add(tb);
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#e3e6e9'; g.fillRect(0, 0, 256, 128); g.strokeStyle = '#6c7680'; g.lineWidth = 4; g.strokeRect(2, 2, 252, 124);
  g.fillStyle = '#1e2a3a'; g.font = '700 22px Arial'; g.fillText('MOTOR 3~  M1', 14, 30);
  g.font = '600 17px Arial'; ['0,5 cv  0,37 kW  4 polos', '380 Δ / 660 Y V   1,05 A', '1720 rpm  60 Hz  IP55'].forEach((t, i) => g.fillText(t, 14, 58 + i * 24));
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
  const np = new THREE.Mesh(new THREE.PlaneGeometry(0.062, 0.031), new THREE.MeshStandardMaterial({ map: tx, roughness: 0.4, metalness: 0.3 }));
  np.position.set(0.0, 0.004, z0 + R + 0.0062); root.add(np);
  // eixo e disco de acoplamento (setores amarelo/cinza) saindo pelo lado do furo — é ele que gira
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.04, 16), M.steel); shaft.rotation.z = Math.PI / 2; shaft.position.set(-Lb / 2 - 0.03, 0, z0); root.add(shaft);
  // disco estroboscópico de frente (como na foto): fundo creme com anéis em zigue-zague pretos — girando dá para ver
  const rot = new THREE.Group(); rot.position.set(-Lb / 2 - 0.03, 0, z0 + 0.012); root.add(rot);
  const dc = document.createElement('canvas'); dc.width = dc.height = 512; const dg = dc.getContext('2d');
  const star = (n, r1, r2, off, fill) => { dg.beginPath(); for (let i = 0; i < n * 2; i++) { const a = off + (i * Math.PI) / n, r = i % 2 ? r2 : r1; dg.lineTo(256 + Math.cos(a) * r, 256 + Math.sin(a) * r); } dg.closePath(); dg.fillStyle = fill; dg.fill(); };
  dg.beginPath(); dg.arc(256, 256, 252, 0, 7); dg.fillStyle = '#efe4c4'; dg.fill(); dg.lineWidth = 6; dg.strokeStyle = '#c9b98e'; dg.stroke();
  star(24, 226, 176, 0, '#111'); star(24, 196, 150, Math.PI / 24, '#efe4c4'); star(18, 150, 104, 0, '#111'); star(18, 122, 82, Math.PI / 18, '#efe4c4');
  star(12, 84, 50, 0, '#111'); star(12, 60, 34, Math.PI / 12, '#efe4c4'); dg.beginPath(); dg.arc(256, 256, 16, 0, 7); dg.fillStyle = '#9a8f74'; dg.fill();
  const dtx = new THREE.CanvasTexture(dc); dtx.colorSpace = THREE.SRGBColorSpace; dtx.anisotropy = 4;
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.032, 48), new THREE.MeshStandardMaterial({ map: dtx, roughness: 0.6, metalness: 0.05 }));
  rot.add(disc);
  const blur = new THREE.Mesh(new THREE.CircleGeometry(0.0322, 48), new THREE.MeshBasicMaterial({ color: 0x8a8370, transparent: true, opacity: 0 })); blur.position.z = 0.0005; rot.add(blur);
  root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  // contatores K1–K5: o "botão de teste" frontal (armadura) recua e a janela indicadora fica verde quando a bobina energiza
  const Ks = [];
  const fx = (mm) => (mm / 1400) * f.width, fy = (mm) => (1 - mm / 910) * f.height;
  const mArm = new THREE.MeshStandardMaterial({ color: 0x8fa4b8, metalness: 0.2, roughness: 0.5 });
  for (let i = 0; i < 5; i++) {
    const g = new THREE.Group(); g.position.set(fx(675 + 158.5 * i) - 0.006 * sc, fy(339), 0.075 * sc); g.scale.setScalar(sc); f.face.add(g);
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
    housing.position.y = Math.abs(rpm) > 50 ? (Math.random() - 0.5) * 0.0004 : 0; // leve vibração ligado
  }
  return { group: root, update, contactorsOn, hotspot: { id: 'm1', titulo: 'Motor M1 · KET-1030', obj: root,
    info: 'Motor de indução trifásico de 6 pontas (U1-V2-W3 / X4-Y5-Z6). <b>0,5 cv (0,37 kW), 4 polos, 380 V Δ / 660 V Y, 1,05 A em 380 V, 1720 rpm, 60 Hz, IP55.</b> Na rede de 380 V: triângulo (U1-Z6, V2-X4, W3-Y5) para regime e estrela (X4-Y5-Z6 curto-circuitados) na partida estrela-triângulo. Gira quando o circuito montado na Aula Prática é energizado.<br><small>Especificação adotada: o manual do KET-1030 não está disponível publicamente.</small>' } };
}
