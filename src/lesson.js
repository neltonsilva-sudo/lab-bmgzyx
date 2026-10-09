// DONO: agente "aula-pratica". Modo de aula prática: segunda tela em tela cheia com o painel KET-1030 funcional
// (ligação de cabos, energização com procedimento NR-10, simulação elétrica, roteiros e relatório).
// Chamado pelo ui.js: buildLesson(ctx) → { open(benchId), close(), isOpen(), update(dt) }
import { createLessonScreen } from './lesson_ui.js?v=20261009091201';

export function buildLesson(ctx = {}) {
  let scr = null;
  const get = () => scr || (scr = createLessonScreen({ toast: ctx.toast, onClose: () => ctx.onClose && ctx.onClose() }));
  return {
    open() { get().open(); },
    close() { if (scr) scr.close(); },
    isOpen() { return !!scr && scr.isOpen(); },
    update(dt) { if (scr && scr.isOpen()) scr.update(dt); },
  };
}
