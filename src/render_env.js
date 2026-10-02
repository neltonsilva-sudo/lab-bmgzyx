// DONO: agente "luz-render". Ambiente de reflexão (PMREM) gerado a partir de uma "sala-proxy" com as luminárias,
// e projeção em caixa (parallax-corrected cubemap) injetada no shader PBR para que os reflexos alongados das
// luminárias caiam no lugar certo do piso epóxi.
import * as THREE from 'three';

let patched = false;
// Instala uma única vez, antes da primeira compilação de shader. Os limites da caixa e a posição da sonda viram
// uniforms globais compartilhados (mesmo objeto referenciado por todos os programas).
export const BOX = {
  min: { value: new THREE.Vector3(0, 0, 0) },
  max: { value: new THREE.Vector3(11.2, 2.85, 14.5) },
  probe: { value: new THREE.Vector3(5.6, 1.4, 7.25) },
  directSpec: { value: 0.2 },
};
export function installBoxProjection() {
  if (patched) return; patched = true;
  const C = THREE.ShaderChunk;
  const helper = /* glsl */`
    uniform vec3 uBoxMin; uniform vec3 uBoxMax; uniform vec3 uBoxProbe;
    vec3 twinWorldPos() { return cameraPosition + ( vec4( - vViewPosition, 0.0 ) * viewMatrix ).xyz; }
    vec3 twinBoxProject( vec3 v, vec3 wp ) {
      vec3 p = clamp( wp, uBoxMin + 0.01, uBoxMax - 0.01 );
      vec3 s = vec3( v.x >= 0.0 ? 1.0 : -1.0, v.y >= 0.0 ? 1.0 : -1.0, v.z >= 0.0 ? 1.0 : -1.0 );
      vec3 vv = s * max( abs( v ), vec3( 1e-4 ) );
      vec3 tmax = ( uBoxMax - p ) / vv; vec3 tmin = ( uBoxMin - p ) / vv;
      vec3 t = max( tmax, tmin );
      float d = min( min( t.x, t.y ), t.z );
      return normalize( p + vv * d - uBoxProbe );
    }
  `;
  let s = C.envmap_physical_pars_fragment;
  s = s.replace('#ifdef USE_ENVMAP', '#ifdef USE_ENVMAP\n' + helper);
  // irradiância: meio a meio entre a direção pura e a projetada (dá variação espacial suave perto das paredes).
  s = s.replace(
    'vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );',
    'vec3 bn = normalize( mix( worldNormal, twinBoxProject( worldNormal, twinWorldPos() ), 0.5 ) );\n\t\t\tvec4 envMapColor = textureCubeUV( envMap, envMapRotation * bn, 1.0 );');
  s = s.replace(
    'reflectVec = inverseTransformDirection( reflectVec, viewMatrix );\n\t\t\tvec4 envMapColor',
    'reflectVec = inverseTransformDirection( reflectVec, viewMatrix );\n\t\t\treflectVec = twinBoxProject( reflectVec, twinWorldPos() );\n\t\t\tvec4 envMapColor');
  C.envmap_physical_pars_fragment = s;
  // Especular DIRETO atenuado: spots/direcional (fontes pontuais) fariam pontinhos duros no piso; os reflexos
  // com a forma alongada dos tubos vêm do ambiente PMREM (projeção em caixa).
  C.lights_physical_pars_fragment = C.lights_physical_pars_fragment.replace(
    'reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );',
    'reflectedLight.directSpecular += uDirectSpec * irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );');
  C.lights_physical_pars_fragment = C.lights_physical_pars_fragment.replace(
    'clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat(',
    'clearcoatSpecularDirect += uDirectSpec * ccIrradiance * BRDF_GGX_Clearcoat(');
  C.lights_physical_pars_fragment = 'uniform float uDirectSpec;\n' + C.lights_physical_pars_fragment;
  // uniforms globais nos ShaderLib standard/physical (os programas os copiam por referência de objeto).
  for (const k of ['standard', 'physical']) {
    const u = THREE.ShaderLib[k].uniforms;
    u.uBoxMin = BOX.min; u.uBoxMax = BOX.max; u.uBoxProbe = BOX.probe; u.uDirectSpec = BOX.directSpec;
  }
}

// Sala-proxy: caixa com as cores/radiâncias médias da sala real + tiras emissivas nas posições das luminárias.
// Tudo em MeshBasic (invisível na cena principal; só alimenta o PMREM).
export function buildEnvironment(renderer, L, fixtures, opt = {}) {
  const { W, D, H } = L.ROOM;
  const probe = new THREE.Vector3(W / 2, 1.35, D / 2);
  BOX.min.value.set(0, 0, 0); BOX.max.value.set(W, H, D); BOX.probe.value.copy(probe);
  const sc = new THREE.Scene();
  const g = new THREE.Group(); g.position.copy(probe).multiplyScalar(-1); sc.add(g);
  const mat = (r, gg, b) => new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(r, gg, b), side: THREE.DoubleSide });
  const plane = (w, h, m, pos, rot) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(...pos); p.rotation.set(...rot); g.add(p); return p; };
  const k = opt.bounce ?? 1;
  // superfícies principais
  plane(W, D, mat(0.085 * k, 0.10 * k, 0.13 * k), [W / 2, 0, D / 2], [-Math.PI / 2, 0, 0]);        // piso azul
  plane(W, D, mat(0.15 * k, 0.15 * k, 0.155 * k), [W / 2, H, D / 2], [Math.PI / 2, 0, 0]);           // teto
  plane(D, H, mat(0.40 * k, 0.375 * k, 0.34 * k), [0, H / 2, D / 2], [0, Math.PI / 2, 0]);           // parede esq. (cabines)
  plane(D, H, mat(0.36 * k, 0.345 * k, 0.32 * k), [W, H / 2, D / 2], [0, -Math.PI / 2, 0]);          // parede dir.
  plane(W, H, mat(0.36 * k, 0.345 * k, 0.32 * k), [W / 2, H / 2, 0], [0, 0, 0]);                     // fundo
  plane(W, H, mat(0.30 * k, 0.29 * k, 0.27 * k), [W / 2, H / 2, D], [0, Math.PI, 0]);                // entrada
  // faixas amarelas do piso (dão o brilho amarelado nos reflexos baixos)
  const yel = mat(0.30 * k, 0.20 * k, 0.02 * k);
  if (L.WALK) plane(0.1, D - 3, yel, [L.WALK.xLine, 0.002, D / 2 + 0.5], [-Math.PI / 2, 0, 0]);
  if (L.CENTER) {
    const c = L.CENTER;
    plane(c.x1 - c.x0, 0.1, yel, [(c.x0 + c.x1) / 2, 0.002, c.z1], [-Math.PI / 2, 0, 0]);
    plane(0.1, c.z1 - c.z0, yel, [c.x0, 0.002, (c.z0 + c.z1) / 2], [-Math.PI / 2, 0, 0]);
    plane(0.1, c.z1 - c.z0, yel, [c.x1, 0.002, (c.z0 + c.z1) / 2], [-Math.PI / 2, 0, 0]);
  }
  // painéis solares escuros no fundo
  if (L.SOLAR) for (const x of L.SOLAR.xs) plane(L.SOLAR.w, L.SOLAR.h, mat(0.012, 0.014, 0.022), [x, 0.25 + L.SOLAR.h / 2, 0.02], [0, 0, 0]);
  // cabines: pilares brancos e fundo das baias um pouco mais escuro
  if (L.BOOTHS) {
    const bo = L.BOOTHS;
    for (let i = 0; i < bo.n; i++) plane(bo.bayW - bo.pillarW, 2.2, mat(0.30 * k, 0.285 * k, 0.26 * k), [0.02, 1.1, bo.z0 + (i + 0.5) * bo.bayW], [0, Math.PI / 2, 0]);
  }
  // luminárias: carcaça clara + 2 tubos muito brilhantes
  const tubeE = opt.tube ?? 14;
  const tubeM = mat(tubeE, tubeE * 0.985, tubeE * 0.97), houseM = mat(0.9, 0.9, 0.92);
  for (const f of fixtures) {
    const alongZ = f.axis === 'z';
    const len = f.len, y = f.pos.y;
    const hw = alongZ ? 0.24 : len + 0.05, hd = alongZ ? len + 0.05 : 0.24;
    plane(hw, hd, houseM, [f.pos.x, H - 0.01, f.pos.z], [Math.PI / 2, 0, 0]);
    for (const o of [-0.055, 0.055]) {
      const tw = alongZ ? 0.035 : len, td = alongZ ? len : 0.035;
      plane(tw, td, tubeM, [f.pos.x + (alongZ ? o : 0), y - 0.02, f.pos.z + (alongZ ? 0 : o)], [Math.PI / 2, 0, 0]);
    }
  }
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(sc, opt.sigma ?? 0.05, 0.05, 40);
  pm.dispose();
  sc.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  return rt.texture;
}
