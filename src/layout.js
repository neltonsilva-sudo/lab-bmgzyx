// Contrato de coordenadas do laboratório (metros, y para cima). Todos os módulos leem daqui.
// Sala: x = 0 (parede esquerda, cabines) → x = W (parede direita); z = 0 (parede do FUNDO, painéis solares) → z = D (entrada, correntes).
// Quem entra olha para -z: a esquerda da tela é x pequeno, a direita é x grande.
export const ROOM = { W: 12.0, D: 10.8, H: 2.85, soffitH: 2.5 };

// Cabines de treinamento (5 baias) na parede esquerda, abertas para +x, de z0 até z0 + n*bayW.
export const BOOTHS = { x0: 0, depth: 0.87, z0: 1.15, bayW: 1.52, n: 5, pillarW: 0.18, zEnd: 8.57 }; // ajustado pelo agente boxes: projeção da cam foto2 sobre as quinas dos pilares (erro ~3 px); zEnd = face da parede APR que fecha o 1º box (box mais estreito na foto)

// Painéis fotovoltaicos em carrinhos, encostados na parede do fundo (retrato, ~1,13 x 2,28 m).
export const SOLAR = { z: 0.45, xs: [2.86, 4.34, 5.82], w: 1.134, h: 2.278 };

// Bancadas didáticas em fila, frente voltada para -x (para o centro da sala).
// b1 (amarela) é a mais próxima da entrada; as demais seguem para o fundo (pitch negativo em z).
export const BENCH_ROW = { x: 6.9, z0: 7.95, pitch: -1.2, n: 5, width: 1.15 };
export const BENCHES = [
  { id: 'b1', titulo: 'KET-1030 · Proteção', cor: 'amarela' },
  { id: 'b2', titulo: 'KET 1070 · Industrial', cor: 'branca' },
  { id: 'b3', titulo: 'Proteção', cor: 'branca' },
  { id: 'b4', titulo: 'Instalações', cor: 'branca' },
  { id: 'b5', titulo: 'Automação', cor: 'branca' },
];

// Área central demarcada em amarelo com a bancada de montagem (perfil de alumínio + tampo preto + gabinete).
export const CENTER = { x0: 2.1, x1: 5.43, z0: 1.5, z1: 7.2, bench: { x: 3.7, z: 5.0 } };

// Faixas amarelas no piso: corredor em frente às bancadas.
export const WALK = { xLine: 6.51 };

// Correntes com pedestais na entrada.
export const STANCHIONS = [[4.0, 8.5], [4.68, 8.44], [5.25, 8.43], [4.28, 9.29]];

// Vistas equivalentes às fotos (câmera ultra-angular do iPhone 0,5x ≈ fov vertical 72° em 16:9).
// Calibradas por fotogrametria (painéis solares de tamanho conhecido + linhas do piso + pilares das baias):
// as 3 fotos foram tiradas quase do mesmo ponto, em frente à b1, logo à esquerda da faixa do corredor.
export const CAMS = {
  foto1: { pos: [5.634, 1.47, 9.052], look: [9.787, 0.449, 4.844], fov: 72 },
  foto2: { pos: [5.756, 1.635, 8.65], look: [1.807, 0.931, 4.188], fov: 72 },
  foto3: { pos: [6.189, 1.757, 9.554], look: [4.141, 0.721, 4.01], fov: 72 },
  geral: { pos: [6.0, 9.0, 17.0], look: [6.0, 0.4, 5.2], fov: 45 },
};
