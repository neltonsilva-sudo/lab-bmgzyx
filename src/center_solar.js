// DONO: agente "centro-solar". Módulos fotovoltaicos de 144 meias-células (6 x 24) em carrinhos metálicos com rodízios.
import * as THREE from 'three';
import { Batch, mtx, bar, caster } from './center_lib.js?v=20261008192305';
import { solarTex, glassRough } from './center_tex.js?v=20261008192305';

export function buildSolar(M, SOLAR, env, q) {
  const g = new THREE.Group(); g.name = 'paineis-fv';
  const cells = solarTex(q), rough = glassRough();
  const glass = new THREE.MeshPhysicalMaterial({
    name: 'fv-vidro', map: cells, roughness: 0.28, roughnessMap: rough, metalness: 0.0, transparent: false, alphaTest: 0,
    clearcoat: 0.3, clearcoatRoughness: 0.08, ior: 1.5, specularIntensity: 0.7, envMap: env, envMapIntensity: 0.2,
  });
  const back = new THREE.MeshStandardMaterial({ name: 'fv-fundo', color: 0xd9dbdc, roughness: 0.8 });
  const w = SOLAR.w, h = SOLAR.h, y0 = 0.165, tilt = -0.03, fw = 0.032, fd = 0.035;
  SOLAR.xs.forEach((x, i) => {
    const p = new THREE.Group(); p.name = 'painel-fv-' + (i + 1); p.position.set(x, 0, SOLAR.z);
    p.rotation.y = [0.035, 0, -0.02][i] || 0; // carrinhos não ficam perfeitamente alinhados
    const B = new Batch();
    // módulo (vidro + células), inclinado levemente para trás
    B.within(mtx(0, y0, 0, tilt, 0, 0), () => {
      B.add(new THREE.PlaneGeometry(w - 0.05, h - 0.05), glass, mtx(0, h / 2, -0.002), false);
      B.box(back, w - 0.03, h - 0.03, 0.004, 0, h / 2, -0.03, 0, 0, 0, true);
      B.box(M.matteBlack, w + 0.12, h + 0.1, 0.004, 0, h / 2, -0.06); // folga escura atrás do módulo
      // moldura de alumínio anodizado (lábio frontal sobre o vidro)
      B.box(M.panelFrame, fw, h, fd, -w / 2 + fw / 2 - 0.004, h / 2, -fd / 2 + 0.006, 0, 0, 0, true);
      B.box(M.panelFrame, fw, h, fd, w / 2 - fw / 2 + 0.004, h / 2, -fd / 2 + 0.006, 0, 0, 0, true);
      B.box(M.panelFrame, w + 0.008, fw, fd, 0, fw / 2 - 0.004, -fd / 2 + 0.006);
      B.box(M.panelFrame, w + 0.008, fw, fd, 0, h - fw / 2 + 0.004, -fd / 2 + 0.006);
      B.box(M.plasticBlack, 0.12, 0.1, 0.025, 0, h * 0.85, -0.045); // caixa de junção
      for (const s of [-1, 1]) B.box(M.plasticBlack, 0.004, 0.004, 0.5, s * 0.03, h * 0.85, -0.05);
      for (const s of [-1, 1]) { B.box(M.greyPlastic, 0.03, 0.06, 0.05, s * (w / 2 + 0.012), h * 0.47, -0.012); B.box(M.zinc, 0.012, 0.02, 0.012, s * (w / 2 + 0.03), h * 0.47, -0.01); }
    });
    // carrinho: base retangular em tubo, rodízios, tubo inferior de apoio, montantes e mãos-francesas traseiras
    const bw = w + 0.04, zf = 0.12, zb = -0.3, yb = 0.115;
    bar(B, M.cart, [-bw / 2, yb, zf], [bw / 2, yb, zf], 0.05, 0.05, false);
    bar(B, M.cart, [-bw / 2, yb, zb], [bw / 2, yb, zb], 0.05, 0.05, false);
    for (const s of [-1, 1]) bar(B, M.cart, [s * bw / 2, yb, zb - 0.02], [s * bw / 2, yb, zf + 0.02], 0.05, 0.05, false);
    bar(B, M.cart, [-w / 2 - 0.03, 0.155, 0.0], [w / 2 + 0.03, 0.155, 0.0], 0.05, 0.04, false); // tubo inferior
    for (const s of [-1, 1]) {
      bar(B, M.cart, [s * 0.36, yb, -0.04], [s * 0.36, 1.35, -0.06], 0.03, 0.03, true);
      bar(B, M.cart, [s * 0.36, 0.95, -0.075], [s * 0.36, yb + 0.02, zb + 0.02], 0.025, 0.025, false);
      bar(B, M.cart, [s * (w / 2 + 0.03), yb, 0.0], [s * (w / 2 + 0.03), 0.16, 0.0], 0.03, 0.03, false);
      B.box(M.zinc, 0.05, 0.03, 0.03, s * 0.36, 1.2, -0.06); // grampo
    }
    bar(B, M.cart, [-0.36, 1.1, -0.065], [0.36, 1.1, -0.065], 0.025, 0.025, false);
    for (const xx of [-bw / 2, bw / 2]) for (const zz of [zf, zb]) caster(B, M, xx, yb - 0.025, zz, 0.032, 0.4 * (i + 1), zz === zf);
    B.build(p, 'fv' + (i + 1));
    g.add(p);
  });
  return { group: g };
}
