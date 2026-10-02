// DONO: agente "aula-pratica". Monta o painel interativo do KET-1030 (face própria em mm, lesson_spec_b1.js) e o mapa
// elétrico: cada borne banana → borne de um dispositivo do simulador (lesson_sim.js). Não depende dos módulos 3D.
import { buildPanelB1 } from './lesson_spec_b1.js';

export const JACK_COL = { K: '#1b1b1b', R: '#c8201c', W: '#ecebe4', B: '#1d55c9', Y: '#e9bf14', G: '#1f9a3c' };

function makeBuilder() {
  const B = { devices: [], links: [], jacks: [], widgets: [] };
  B.dev = (id, type, name, p, extra = {}) => { B.devices.push({ id, type, name, p, ...extra }); return id; };
  // borne banana na posição (x, y) em mm (origem no canto superior esquerdo da face), ligado ao borne t do simulador
  B.term = (x, y, t, tip, c = 'K', label = null, scale = 1, ext = false) => { B.jacks.push({ x, y, t, tip, c, label, scale, ext }); };
  B.w = (o) => { B.widgets.push(o); return o; };
  return B;
}

let cache = null;
export function getPanel(ppm = 2000) {
  if (cache) return cache;
  const B = makeBuilder();
  const extra = buildPanelB1(B, ppm);
  return (cache = { id: 'b1', title: 'KET-1030: Proteção', spec: { devices: B.devices, links: B.links }, jacks: B.jacks.map((j, i) => ({ ...j, id: 'j' + i })), widgets: B.widgets, ...extra });
}
