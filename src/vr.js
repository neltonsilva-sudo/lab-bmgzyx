// DONO: orquestrador. Modo óculos VR para celular (óculos de encaixar o celular, tipo Cardboard).
// Tela dividida estéreo + giroscópio (DeviceOrientation) + navegação pelo olhar (mira no centro):
// olhar 1,5 s para um ponto marcado no piso leva até ele; tocar na tela (ou no botão do óculos) leva até onde se olha no piso.
// buildVR(ctx) → { enter(), exit(), active, update(dt), render() }
export function buildVR(ctx) {
  const { THREE, L, camera, controls, scene, render, toast } = ctx;
  const R = render.renderer;
  const EYE = 1.6;
  const stereo = new THREE.StereoCamera(); stereo.eyeSep = 0.064;
  const S = { active: false, gyro: false, lastEvt: 0, q: new THREE.Quaternion(), yaw0: 0, devYaw0: null, drag: null, dragYaw: 0, dragPitch: 0 };

  // ---------- pontos de navegação no piso ----------
  const B = L.BENCH_ROW, BO = L.BOOTHS, C = L.CENTER;
  const SPOTS = [
    ['Entrada', 5.6, 9.3],
    ['KET-1030', B.x - 1.1, B.z0],
    ['Bancada 2', B.x - 1.1, B.z0 + B.pitch],
    ['Bancada 3', B.x - 1.1, B.z0 + 2 * B.pitch],
    ['Bancada 5', B.x - 1.1, B.z0 + 4 * B.pitch],
    ['Bancada central', (C.x0 + C.x1) / 2 + 0.2, C.bench.z + 1.4],
    ['Painéis solares', 4.3, 1.9],
    ['Boxes', BO.depth + 1.1, BO.z0 + BO.bayW * 3.5],
    ['Boxes (fundo)', BO.depth + 1.1, BO.z0 + BO.bayW * 1.2],
  ];
  const grp = new THREE.Group(); grp.name = 'vr-nav'; grp.visible = false; scene.add(grp);
  const ringGeo = new THREE.RingGeometry(0.22, 0.3, 40); ringGeo.rotateX(-Math.PI / 2);
  const discGeo = new THREE.CircleGeometry(0.22, 40); discGeo.rotateX(-Math.PI / 2);
  const label = (txt) => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d');
    g.fillStyle = 'rgba(18,40,70,.85)'; g.beginPath(); g.roundRect(8, 20, 496, 88, 44); g.fill();
    g.fillStyle = '#fff'; g.font = '600 52px Segoe UI, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 256, 66);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true })); s.scale.set(0.9, 0.225, 1); s.renderOrder = 20; return s;
  };
  const spots = SPOTS.map(([name, x, z]) => {
    const g = new THREE.Group(); g.position.set(x, 0.02, z);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x35c46a, transparent: true, opacity: 0.9, depthWrite: false }));
    const disc = new THREE.Mesh(discGeo, new THREE.MeshBasicMaterial({ color: 0x35c46a, transparent: true, opacity: 0.25, depthWrite: false }));
    const lb = label(name); lb.position.y = 0.55;
    g.add(ring, disc, lb); grp.add(g);
    return { name, x, z, g, ring, disc };
  });

  // ---------- mira (reticle) com anel de progresso ----------
  const ret = new THREE.Group(); ret.visible = false; scene.add(ret);
  const dot = new THREE.Mesh(new THREE.CircleGeometry(0.008, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false }));
  const ringBg = new THREE.Mesh(new THREE.RingGeometry(0.018, 0.024, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthTest: false }));
  const prog = new THREE.Mesh(new THREE.RingGeometry(0.018, 0.024, 32, 1, 0, 0.001), new THREE.MeshBasicMaterial({ color: 0x35c46a, depthTest: false }));
  [dot, ringBg, prog].forEach((m) => { m.renderOrder = 999; ret.add(m); });

  // ---------- interface de tela cheia (sair / dicas) ----------
  const css = document.createElement('style');
  css.textContent = `#vrOv{position:fixed;inset:0;z-index:30;display:none;touch-action:none}
  #vrOv .mid{position:absolute;left:50%;top:0;bottom:0;width:2px;background:#000;transform:translateX(-1px)}
  #vrOv .bar{position:absolute;left:50%;top:10px;transform:translateX(-50%);display:flex;gap:8px;transition:opacity .4s}
  #vrOv button{all:unset;cursor:pointer;background:rgba(10,20,35,.75);color:#fff;font:600 13px system-ui;padding:8px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.3)}
  #vrOv .msg{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);max-width:80vw;text-align:center;background:rgba(10,20,35,.8);color:#fff;font:13px/1.4 system-ui;padding:8px 14px;border-radius:10px;transition:opacity .6s}
  #vrRot{position:fixed;inset:0;z-index:31;display:none;align-items:center;justify-content:center;flex-direction:column;gap:14px;background:#0d1622;color:#fff;font:600 18px system-ui;text-align:center;padding:24px}
  @media (orientation:portrait){body.vr #vrRot{display:flex}}`;
  document.head.appendChild(css);
  const ov = document.createElement('div'); ov.id = 'vrOv';
  ov.innerHTML = `<div class="mid"></div><div class="bar"><button id="vrRecenter">Centralizar</button><button id="vrExit">Sair do VR</button></div><div class="msg"></div>`;
  const rot = document.createElement('div'); rot.id = 'vrRot';
  rot.innerHTML = `<div style="font-size:54px">📱↻</div>Gire o celular para a horizontal<br><span style="font-weight:400;font-size:14px;opacity:.8">e encaixe no óculos com a tela para dentro</span>`;
  document.body.append(ov, rot);
  const msg = ov.querySelector('.msg'), bar = ov.querySelector('.bar');
  let msgT = 0, barT = 0;
  const say = (t, s = 5) => { msg.textContent = t; msg.style.opacity = 1; msgT = s; };
  const showBar = () => { bar.style.opacity = 1; barT = 4; };
  ov.querySelector('#vrExit').onclick = (e) => { e.stopPropagation(); exit(); };
  ov.querySelector('#vrRecenter').onclick = (e) => { e.stopPropagation(); recenter(); say('Visão centralizada.', 2); };

  // ---------- giroscópio ----------
  const zee = new THREE.Vector3(0, 0, 1), eul = new THREE.Euler(), q0 = new THREE.Quaternion(), q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
  const yawOf = (q) => { const e = new THREE.Euler().setFromQuaternion(q, 'YXZ'); return e.y; };
  function onOri(e) {
    if (e.alpha == null) return;
    const d = THREE.MathUtils.degToRad;
    const orient = d((screen.orientation && screen.orientation.angle) || window.orientation || 0);
    eul.set(d(e.beta), d(e.alpha), -d(e.gamma), 'YXZ');
    S.q.setFromEuler(eul).multiply(q1).multiply(q0.setFromAxisAngle(zee, -orient));
    if (S.devYaw0 == null) S.devYaw0 = yawOf(S.q);
    S.gyro = true; S.lastEvt = performance.now();
  }
  function recenter() { S.devYaw0 = S.gyro ? yawOf(S.q) : null; S.yaw0 = camYaw; S.dragYaw = 0; S.dragPitch = 0; }

  // arrastar com o dedo (sem giroscópio) e toque = andar até onde se olha
  let tap = null;
  ov.addEventListener('pointerdown', (e) => { tap = { x: e.clientX, y: e.clientY, t: performance.now() }; S.drag = { x: e.clientX, y: e.clientY }; showBar(); });
  ov.addEventListener('pointermove', (e) => {
    if (!S.drag || S.gyro) return;
    S.dragYaw += (e.clientX - S.drag.x) * 0.005; S.dragPitch = THREE.MathUtils.clamp(S.dragPitch + (e.clientY - S.drag.y) * 0.005, -1.2, 1.2);
    S.drag = { x: e.clientX, y: e.clientY };
  });
  ov.addEventListener('pointerup', (e) => {
    S.drag = null;
    if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 12 && performance.now() - tap.t < 400) walkToGaze();
    tap = null;
  });

  // ---------- estado de câmera ----------
  let camYaw = 0, target = null, dwell = 0, gazeSpot = null;
  const pos = new THREE.Vector3();
  const ray = new THREE.Raycaster(), fwd = new THREE.Vector3(), floorPl = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
  const clampRoom = (v) => { v.x = THREE.MathUtils.clamp(v.x, 0.4, L.ROOM.W - 0.4); v.z = THREE.MathUtils.clamp(v.z, 0.4, L.ROOM.D - 0.4); return v; };
  function goTo(x, z) { target = clampRoom(new THREE.Vector3(x, EYE, z)); }
  function walkToGaze() {
    camera.getWorldDirection(fwd); ray.set(camera.position, fwd);
    if (fwd.y < -0.08 && ray.ray.intersectPlane(floorPl, hit)) { goTo(hit.x, hit.z); return; }
    say('Olhe para o piso (ou para um ponto verde) e toque para andar.', 3);
  }

  async function enter() {
    // iOS: precisa de permissão a partir de um toque
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const r = await DeviceOrientationEvent.requestPermission();
        if (r !== 'granted') toast && toast('Sem permissão de movimento: arraste o dedo para olhar em volta.', true, 5000);
      }
    } catch (e) { /* segue com arrastar */ }
    addEventListener('deviceorientation', onOri);
    try { await document.documentElement.requestFullscreen({ navigationUI: 'hide' }); } catch (e) {}
    try { await screen.orientation.lock('landscape'); } catch (e) {}
    S.active = true; document.body.classList.add('vr'); ov.style.display = 'block'; grp.visible = true; ret.visible = true;
    controls.enabled = false;
    // começa em pé onde a câmera está (ou na entrada), olhando na mesma direção
    pos.copy(camera.position); pos.y = EYE;
    if (pos.x < 0.4 || pos.x > L.ROOM.W - 0.4 || pos.z < 0.4 || pos.z > L.ROOM.D - 0.4 || camera.position.y > 3) pos.set(5.8, EYE, 9.2);
    const d = new THREE.Vector3().subVectors(controls.target, camera.position); camYaw = Math.atan2(-d.x, -d.z);
    if (camera.position.y > 3) camYaw = 0.35;
    S.yaw0 = camYaw; S.devYaw0 = null; S.dragYaw = 0; S.dragPitch = 0;
    S.savedPR = R.getPixelRatio(); R.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    S.savedFov = camera.fov; camera.fov = 80; camera.updateProjectionMatrix();
    say('Olhe para um ponto verde no piso por 1,5 s para ir até ele. Toque na tela para andar até onde está olhando.', 7); showBar();
    setTimeout(() => { if (S.active && !S.gyro) say('Giroscópio indisponível neste navegador: arraste o dedo para olhar em volta.', 6); }, 2000);
  }
  function exit() {
    removeEventListener('deviceorientation', onOri);
    S.active = false; document.body.classList.remove('vr'); ov.style.display = 'none'; grp.visible = false; ret.visible = false;
    controls.enabled = true;
    R.setPixelRatio(S.savedPR || Math.min(devicePixelRatio, 2)); camera.fov = S.savedFov || 72; camera.updateProjectionMatrix();
    const d = new THREE.Vector3(); camera.getWorldDirection(d); controls.target.copy(camera.position).addScaledVector(d, 1.5);
    R.setScissorTest(false); R.setViewport(0, 0, innerWidth, innerHeight);
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
    try { screen.orientation.unlock(); } catch (e) {}
  }

  const qYaw = new THREE.Quaternion(), qDrag = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0);
  function update(dt) {
    if (!S.active) return;
    if (msgT > 0 && (msgT -= dt) <= 0) msg.style.opacity = 0;
    if (barT > 0 && (barT -= dt) <= 0) bar.style.opacity = 0.15;
    // orientação
    if (S.gyro) {
      qYaw.setFromAxisAngle(Y, S.yaw0 - S.devYaw0);
      camera.quaternion.copy(qYaw).multiply(S.q);
    } else {
      camera.quaternion.setFromEuler(new THREE.Euler(-S.dragPitch, S.yaw0 - S.dragYaw, 0, 'YXZ'));
    }
    // deslocamento suave até o destino
    if (target) {
      const k = Math.min(1, dt * 3.2); pos.lerp(target, k);
      if (pos.distanceTo(target) < 0.03) { pos.copy(target); target = null; }
    }
    camera.position.copy(pos);
    camera.updateMatrixWorld();
    // mira e permanência do olhar
    camera.getWorldDirection(fwd);
    ret.position.copy(camera.position).addScaledVector(fwd, 0.6); ret.quaternion.copy(camera.quaternion);
    ray.set(camera.position, fwd);
    let best = null;
    if (fwd.y < -0.05 && ray.ray.intersectPlane(floorPl, hit)) {
      for (const s of spots) if (Math.hypot(hit.x - s.x, hit.z - s.z) < 0.45 && Math.hypot(s.x - pos.x, s.z - pos.z) > 0.5) best = s;
    }
    spots.forEach((s) => { const on = s === best; s.ring.material.color.setHex(on ? 0xffd84a : 0x35c46a); s.disc.material.opacity = on ? 0.45 : 0.22; s.g.visible = Math.hypot(s.x - pos.x, s.z - pos.z) > 0.5; });
    if (best && best === gazeSpot && !target) {
      dwell += dt;
      if (dwell >= 1.5) { goTo(best.x, best.z); say(best.name, 2); dwell = 0; gazeSpot = null; }
    } else { dwell = 0; gazeSpot = best; }
    prog.geometry.dispose(); prog.geometry = new THREE.RingGeometry(0.018, 0.024, 32, 1, Math.PI / 2, Math.max(0.001, (dwell / 1.5) * Math.PI * 2));
  }

  function renderStereo() {
    const W = innerWidth, H = innerHeight;
    camera.aspect = (W / 2) / H; camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    stereo.aspect = 1; stereo.update(camera);
    R.clippingPlanes = [];
    R.setScissorTest(true);
    const ov = ctx.overlay && ctx.overlay(), ac = R.autoClear;
    const eye = (x, cam) => { R.setScissor(x, 0, W / 2, H); R.setViewport(x, 0, W / 2, H); R.autoClear = true; R.render(scene, cam); if (ov) { R.autoClear = false; R.render(ov, cam); } };
    eye(0, stereo.cameraL); eye(W / 2, stereo.cameraR); R.autoClear = ac;
    R.setScissorTest(false); R.setViewport(0, 0, W, H);
  }

  return { enter, exit, update, render: renderStereo, get active() { return S.active; }, get cams() { return [stereo.cameraL, stereo.cameraR]; } };
}
