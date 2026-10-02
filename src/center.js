// DONO: agente "centro-solar". Bancada central (tampo preto, gabinete branco com rodízios, estrutura em perfil de alumínio
// com módulos azuis de instrumentos), segunda mesa em L, painéis fotovoltaicos em carrinhos.
// Posições derivadas de layout.js (CENTER.bench = centro da mesa principal; SOLAR = painéis). Frente da bancada voltada para +z.
import * as THREE from 'three';
import { CENTER, SOLAR } from './layout.js';
import { makeEnv, roughMap, Batch } from './center_lib.js';
import { topColor, scuffTex } from './center_tex.js';
import { buildBench, buildLTable } from './center_bench.js';
import { buildSolar } from './center_solar.js';

function materials(env, q) {
  const S = (o) => new THREE.MeshStandardMaterial(o);
  const topRough = roughMap(1024, 512, 95, { seed: 3, blobs: 50, blobAmp: 60, wipes: 30, scratches: 260, grain: 10 });
  const M = {
    top: new THREE.MeshPhysicalMaterial({ name: 'tampo-fenolico', color: 0x7a7a7a, map: topColor(), roughnessMap: topRough, roughness: 0.75, metalness: 0, clearcoat: 0.4, clearcoatRoughness: 0.08, envMap: env, envMapIntensity: 0.6 }),
    topEdge: S({ name: 'borda', color: 0x0b0b0c, roughness: 0.6 }),
    steel: S({ name: 'aco-pintado', color: 0xa6aaae, roughness: 0.42, metalness: 0.55, envMap: env, envMapIntensity: 0.8 }),
    alu: S({ name: 'aluminio', color: 0xd4d7da, roughness: 0.3, metalness: 1.0, envMap: env, envMapIntensity: 1.0 }),
    aluBlue: S({ name: 'aluminio-azul', color: 0x4a7fcf, roughness: 0.35, metalness: 0.6, envMap: env }),
    panelFrame: S({ name: 'moldura-fv', color: 0x5a5e62, roughness: 0.35, metalness: 0.9, envMap: env, envMapIntensity: 0.9 }),
    cart: S({ name: 'carrinho', color: 0xd2d6da, roughness: 0.35, metalness: 0.75, envMap: env, envMapIntensity: 0.8 }),
    cab: S({ name: 'gabinete', color: 0xf2f3f2, roughness: 0.5, map: scuffTex(2), envMap: env, envMapIntensity: 0.5 }),
    cabDoor: S({ name: 'porta', color: 0xf6f7f6, roughness: 0.42, map: scuffTex(5), envMap: env, envMapIntensity: 0.55 }),
    cabDark: S({ name: 'rodape', color: 0x6d7073, roughness: 0.7 }),
    chrome: S({ name: 'cromado', color: 0xe6e6e6, roughness: 0.14, metalness: 1.0, envMap: env }),
    zinc: S({ name: 'zincado', color: 0xb4b8bb, roughness: 0.35, metalness: 0.9, envMap: env }),
    rubber: S({ name: 'borracha', color: 0x151515, roughness: 0.85 }),
    red: S({ name: 'vermelho', color: 0xb3161b, roughness: 0.5 }),
    navy: S({ name: 'azul-marinho', color: 0x161f62, roughness: 0.5, metalness: 0.2, envMap: env, envMapIntensity: 0.6 }),
    plasticBlack: S({ name: 'plastico-preto', color: 0x16171a, roughness: 0.55, envMap: env, envMapIntensity: 0.5 }),
    greyPlastic: S({ name: 'plastico-cinza', color: 0xb4b7ba, roughness: 0.55 }),
    whitePlastic: S({ name: 'plastico-branco', color: 0xe9ebeb, roughness: 0.5 }),
    cable: S({ name: 'cabo', color: 0x141414, roughness: 0.5, envMap: env, envMapIntensity: 0.6 }),
    cableRed: S({ name: 'cabo-vm', color: 0x9c1414, roughness: 0.5 }),
    matteBlack: S({ name: 'preto-fosco', color: 0x060607, roughness: 0.95 }),
    sheet: S({ name: 'chapa', color: 0xc6c9cc, roughness: 0.35, metalness: 0.85, envMap: env }),
    roll: S({ name: 'rolo', color: 0xe8eef6, roughness: 0.85 }),
    bulb: new THREE.MeshPhysicalMaterial({ name: 'lampada', color: 0xf4f4f0, roughness: 0.35, transmission: 0, emissive: 0xfff4e0, emissiveIntensity: 0.25 }),
    glassClear: new THREE.MeshPhysicalMaterial({ name: 'vidro', color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.25, envMap: env }),
    jackRed: S({ name: 'borne-vm', color: 0xc0151b, roughness: 0.4 }),
    jackBlack: S({ name: 'borne-pt', color: 0x121212, roughness: 0.4 }),
    jackYellow: S({ name: 'borne-am', color: 0xe8c21a, roughness: 0.4 }),
    jackBlue: S({ name: 'borne-az', color: 0x1d54c9, roughness: 0.4 }),
    jackGreen: S({ name: 'borne-vd', color: 0x1f9a3c, roughness: 0.4 }),
    btnWhite: S({ name: 'botao-br', color: 0xeeeeee, roughness: 0.35 }),
    btnRed: S({ name: 'botao-vm', color: 0xd01a1a, roughness: 0.35 }),
    btnGreen: S({ name: 'botao-vd', color: 0x21b14a, roughness: 0.35, emissive: 0x0a4a1a, emissiveIntensity: 0.4 }),
    btnYellow: S({ name: 'botao-am', color: 0xf0c419, roughness: 0.35 }),
    lampGreen: S({ name: 'sinal-vd', color: 0x3bd46a, emissive: 0x22aa44, emissiveIntensity: 0.6, roughness: 0.2 }),
    lampBlue: S({ name: 'sinal-az', color: 0x3b7cf0, emissive: 0x2255cc, emissiveIntensity: 0.5, roughness: 0.2 }),
    lampAmber: S({ name: 'sinal-am', color: 0xffb020, emissive: 0xcc7a00, emissiveIntensity: 0.5, roughness: 0.2 }),
  };
  return M;
}

export function buildCenter(scene, ctx) {
  const g = new THREE.Group(); g.name = 'center';
  const q = ctx.q || 'high';
  let env = null;
  try { env = makeEnv(ctx.renderer); } catch (e) { console.warn('center: ambiente de reflexo indisponível', e); }
  const M = materials(env, q);

  const benchRoot = new THREE.Group(); benchRoot.name = 'Bancada central de montagem';
  // medido nas fotos calibradas: centro do tampo ≈ 3 cm à direita e 16 cm à frente do ponto CENTER.bench
  benchRoot.position.set(CENTER.bench.x + 0.03, 0, CENTER.bench.z + 0.165);
  if (CENTER.bench.rot) benchRoot.rotation.y = CENTER.bench.rot;
  const bench = buildBench(M, q); benchRoot.add(bench.group);
  const lt = buildLTable(M); benchRoot.add(lt.group);
  g.add(benchRoot);

  const solar = buildSolar(M, SOLAR, env, q); g.add(solar.group);
  // caixa branca (gabinete baixo) diante do 2º painel, medida nas fotos calibradas
  { const b = new Batch(); b.box(M.cab, 0.46, 0.72, 0.5, 0, 0.36, 0, 0, 0, 0, true); b.box(M.cabDark, 0.44, 0.02, 0.48, 0, 0.01, 0);
    const box = new THREE.Group(); box.name = 'caixa-branca'; box.position.set(SOLAR.xs[1] + 0.56, 0, SOLAR.z + 1.5); box.rotation.y = 0.05; b.build(box, 'caixa'); g.add(box); }

  scene.add(g);
  const hotspots = [
    {
      id: 'centro-bancada', titulo: 'Bancada de montagem · Comandos e medição', obj: bench.group,
      info: `<p><b>Finalidade:</b> montar e testar circuitos de comando, proteção e medição de energia em baixa tensão, com módulos
        didáticos intercambiáveis presos a uma estrutura de perfil de alumínio (ranhura em "T").</p>
        <p><b>Componentes:</b> medidor de energia trifásico, multimedidor digital, voltímetro/amperímetro analógicos, botoeiras,
        sinaleiros, relé de tempo, disjuntores, bornes de 4 mm, painel de comando inclinado com botão de emergência, fonte CC 0–30 V.</p>
        <p><b>Segurança (NR-10):</b> montar e alterar ligações sempre desenergizado; testar ausência de tensão; usar cabos com
        plugues protegidos; manter a emergência acessível; tampo fenólico isolante e seco; óculos e calçado isolante.</p>`,
    },
    {
      id: 'centro-mesaL', titulo: 'Mesa auxiliar em L', obj: lt.group,
      info: `<p>Tampo fenólico preto sobre estrutura tubular com mãos-francesas. Serve para apoiar instrumentos, cabos de teste e o
        registro das medições durante as práticas.</p><p><b>Cuidado:</b> não deixar cabos pendurados na passagem nem ferramentas sobre instrumentos.</p>`,
    },
    {
      id: 'centro-solar', titulo: 'Módulos fotovoltaicos (3 x 144 meias-células)', obj: solar.group,
      info: `<p><b>Finalidade:</b> práticas de sistemas fotovoltaicos: leitura de placa, medição de tensão de circuito aberto (Voc)
        e corrente de curto (Isc), ligação em série/paralelo, string box, inversor e aterramento da moldura.</p>
        <p><b>Componentes:</b> módulos monocristalinos de 144 meias-células (6 x 24), vidro temperado, moldura de alumínio anodizado,
        caixa de junção com diodos de bypass e conectores MC4; carrinhos com rodízios travantes.</p>
        <p><b>Segurança:</b> módulo iluminado gera tensão CC mesmo desligado da rede (dezenas de volts por módulo, centenas em série);
        cobrir o vidro antes de conectar, nunca desconectar MC4 sob carga, travar os rodízios e cuidar do tombamento.</p>`,
    },
  ];
  // Opcional (?cenv=scene): usar o ambiente global do render em vez do reflexo próprio.
  let swapped = new URLSearchParams(location.search).get('cenv') !== 'scene';
  function update() {
    if (swapped || !scene.environment) return; swapped = true;
    g.traverse((o) => { if (o.material && o.material.envMap) { o.material.envMap = null; o.material.needsUpdate = true; } });
  }
  return { group: g, hotspots, update };
}
