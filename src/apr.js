// DONO: orquestrador. APR — Análise Preliminar de Risco que o aluno preenche antes das atividades práticas.
// buildAPR({ toast, riskAreas }) → { open(onDone?), doneToday(), last() }
const KEY = 'labtwin.apr';
const hoje = () => new Date().toISOString().slice(0, 10);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const ATIVIDADES = [
  'Aula prática no painel KET-1030 (comandos e proteção)',
  'Montagem e testes nas bancadas didáticas',
  'Instalações prediais nos boxes (tomadas, interruptores, quadro)',
  'Bancada de montagem / medições elétricas',
  'Módulos fotovoltaicos (manuseio e medições em CC)',
  'Outra (descrever nas etapas)',
];
const EPI = ['Óculos de segurança', 'Calçado de segurança isolante', 'Luvas isolantes (classe adequada)', 'Vestimenta (sem adornos metálicos)', 'Ferramentas isoladas', 'Detector / multímetro CAT III', 'Cadeado e etiqueta (LOTO)', 'Tapete isolante'];
const NR10 = ['Seccionamento (desligar o disjuntor geral)', 'Impedimento de reenergização (bloqueio e etiquetagem)', 'Constatação da ausência de tensão (multímetro testado em fonte conhecida)', 'Aterramento temporário (quando aplicável)', 'Proteção dos elementos energizados na zona controlada', 'Sinalização de impedimento de reenergização'];
const PERGUNTAS = ['Estou em condições de saúde para a atividade (sem mal-estar, sono ou medicação que afete a atenção).', 'Conheço a localização do extintor, da rota de fuga e do botão de emergência.', 'Retirei anéis, relógio, pulseiras, correntes e outros adornos metálicos.', 'Entendi os riscos do mapa de riscos da área onde vou trabalhar.', 'Sei que só posso energizar a bancada com autorização do instrutor.'];

export function buildAPR(ctx = {}) {
  const { toast } = ctx;
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
  const save = (l) => { try { localStorage.setItem(KEY, JSON.stringify(l.slice(-30))); } catch (e) {} };
  let session = null; // APR desta abertura (vale mesmo sem armazenamento)

  const css = document.createElement('style');
  css.textContent = `
  #aprDlg{position:fixed;inset:0;z-index:40;display:none;align-items:flex-start;justify-content:center;overflow:auto;padding:24px 12px;background:rgba(8,14,24,.62)}
  #aprDlg .sheet{width:min(860px,100%);background:#fff;color:#1e2a3a;border-radius:14px;box-shadow:0 14px 50px rgba(0,0,0,.4);font:14px/1.45 "Segoe UI",system-ui,sans-serif}
  #aprDlg header{position:sticky;top:0;z-index:2;background:linear-gradient(#f6f8fb,#e9eef5);border-bottom:1px solid #c9d1dc;border-radius:14px 14px 0 0;padding:12px 18px;display:flex;align-items:center;gap:10px}
  #aprDlg header h2{margin:0;font-size:17px;flex:1} #aprDlg header .x{cursor:pointer;font-size:20px;color:#5d6b7e;border:0;background:none}
  #aprDlg .bd{padding:14px 18px 18px}
  #aprDlg fieldset{border:1px solid #d5dce6;border-radius:10px;margin:0 0 14px;padding:10px 14px 12px}
  #aprDlg legend{font-weight:700;color:#1f6fd1;padding:0 6px}
  #aprDlg .g2{display:grid;grid-template-columns:1fr 1fr;gap:10px} #aprDlg .g3{display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px}
  #aprDlg label.f{display:flex;flex-direction:column;gap:3px;font-weight:600;font-size:12.5px;color:#3b4a5e}
  #aprDlg input[type=text],#aprDlg input[type=date],#aprDlg select,#aprDlg textarea{font:14px system-ui;padding:7px 9px;border:1px solid #c9d1dc;border-radius:7px;background:#fff;color:#1e2a3a;width:100%;box-sizing:border-box}
  #aprDlg textarea{resize:vertical;min-height:38px}
  #aprDlg .req::after{content:' *';color:#c9261a}
  #aprDlg table{width:100%;border-collapse:collapse;font-size:13px} #aprDlg th{background:#eef2f7;text-align:left;padding:6px;border:1px solid #d5dce6;font-size:12px}
  #aprDlg td{border:1px solid #d5dce6;padding:4px;vertical-align:top} #aprDlg td textarea{border:0;min-height:52px;padding:4px}
  #aprDlg .chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 8px} #aprDlg .chip{cursor:pointer;border:1px solid #c9d1dc;border-radius:999px;padding:3px 10px;font-size:12px;background:#f6f8fb}
  #aprDlg .chip i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px}
  #aprDlg .chk{display:grid;grid-template-columns:1fr 1fr;gap:4px 14px} #aprDlg .chk label,#aprDlg .q label{display:flex;gap:7px;align-items:flex-start;cursor:pointer}
  #aprDlg .q label{margin:4px 0} #aprDlg input[type=checkbox]{margin-top:3px;flex:none}
  #aprDlg .row{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:6px}
  #aprDlg button.b{all:unset;cursor:pointer;padding:8px 14px;border-radius:8px;font-weight:600;background:#e3e8ef;color:#1e2a3a}
  #aprDlg button.p{background:#1a9c4a;color:#fff} #aprDlg button.s{background:#1f6fd1;color:#fff}
  #aprDlg .err{color:#c9261a;font-weight:600;margin-top:8px;min-height:18px}
  #aprDlg .ok{background:#e6f6ec;border:1px solid #9fd9b3;color:#14612f;border-radius:10px;padding:10px 12px;margin-bottom:12px}
  @media (max-width:640px){#aprDlg .g2,#aprDlg .g3,#aprDlg .chk{grid-template-columns:1fr}}
  @media print{body>*:not(#aprDlg){display:none!important} #aprDlg{position:static;background:none;padding:0;display:block!important}
    #aprDlg .sheet{box-shadow:none;width:100%} #aprDlg header .x,#aprDlg .row,#aprDlg .chips,#aprDlg .addRow,#aprDlg .err{display:none!important}}`;
  document.head.appendChild(css);

  const dlg = document.createElement('div'); dlg.id = 'aprDlg'; document.body.appendChild(dlg);
  const riscosMapa = (ctx.riskAreas || []).flatMap((a) => a.riscos.map(([grp, sz, txt]) => ({ area: a.nome, grp, sz, txt })));
  const CORES = { fisico: '#2e9d3a', quimico: '#d6261f', biologico: '#7a4a21', ergonomico: '#f2c40f', acidente: '#1f5fd1' };

  function rowHTML(r = {}) {
    return `<tr><td><textarea data-k="etapa" placeholder="Ex.: ligar os cabos de força no contator K1">${esc(r.etapa)}</textarea></td>
      <td><textarea data-k="risco" placeholder="Ex.: choque elétrico">${esc(r.risco)}</textarea></td>
      <td><textarea data-k="consequencia" placeholder="Ex.: queimadura, parada cardíaca">${esc(r.consequencia)}</textarea></td>
      <td><textarea data-k="controle" placeholder="Ex.: bancada desenergizada e bloqueada, luvas isolantes">${esc(r.controle)}</textarea></td>
      <td style="width:28px;text-align:center"><button class="b del" title="Remover etapa" style="padding:2px 7px">✕</button></td></tr>`;
  }

  function render(onDone) {
    const prev = session || load().filter((a) => a.data === hoje()).pop();
    const d = prev || {};
    dlg.innerHTML = `<div class="sheet"><header><h2>APR · Análise Preliminar de Risco</h2><button class="x" title="Fechar">✕</button></header><div class="bd">
      ${prev ? `<div class="ok">✓ APR de hoje já preenchida por <b>${esc(prev.aluno)}</b> às ${esc(prev.hora)}. Você pode revisar, imprimir ou preencher outra.</div>` : ''}
      <fieldset><legend>1. Identificação</legend>
        <div class="g3"><label class="f"><span class="req">Nome do aluno</span><input type="text" id="aAluno" value="${esc(d.aluno)}"></label>
          <label class="f"><span class="req">Turma</span><input type="text" id="aTurma" value="${esc(d.turma)}"></label>
          <label class="f"><span>Data</span><input type="date" id="aData" value="${esc(d.data || hoje())}"></label></div>
        <div class="g2" style="margin-top:10px"><label class="f"><span class="req">Atividade</span><select id="aAtiv">${ATIVIDADES.map((t) => `<option ${d.atividade === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
          <label class="f"><span>Local / bancada</span><input type="text" id="aLocal" value="${esc(d.local || 'Laboratório de eletricidade')}"></label></div>
        <div class="g2" style="margin-top:10px"><label class="f"><span>Equipe (nomes)</span><input type="text" id="aEquipe" value="${esc(d.equipe)}"></label>
          <label class="f"><span class="req">Instrutor responsável</span><input type="text" id="aInstr" value="${esc(d.instrutor)}"></label></div>
      </fieldset>
      <fieldset><legend>2. Etapas, riscos e medidas de controle</legend>
        <div style="font-size:12.5px;color:#5d6b7e">Descreva cada etapa da atividade. Toque num risco do mapa de riscos para adicioná-lo à última etapa.</div>
        <div class="chips">${riscosMapa.map((r, i) => `<span class="chip" data-i="${i}" title="${esc(r.area)}"><i style="background:${CORES[r.grp]}"></i>${esc(r.txt)}</span>`).join('')}</div>
        <table><thead><tr><th>Etapa da atividade</th><th>Perigo / risco</th><th>Possível consequência</th><th>Medida de controle</th><th></th></tr></thead>
          <tbody id="aRows">${(d.etapas && d.etapas.length ? d.etapas : [{}, {}, {}]).map(rowHTML).join('')}</tbody></table>
        <div class="row" style="justify-content:flex-start"><button class="b addRow">+ Adicionar etapa</button></div>
      </fieldset>
      <fieldset><legend>3. EPI e EPC necessários</legend><div class="chk">${EPI.map((t, i) => `<label><input type="checkbox" data-epi="${i}" ${d.epi && d.epi.includes(t) ? 'checked' : ''}>${esc(t)}</label>`).join('')}</div>
        <label class="f" style="margin-top:8px"><span>Outros</span><input type="text" id="aEpiOut" value="${esc(d.epiOutros)}"></label></fieldset>
      <fieldset><legend>4. Procedimento de desenergização (NR-10, 10.5.1)</legend><div class="q">${NR10.map((t, i) => `<label><input type="checkbox" data-nr="${i}" ${d.nr10 && d.nr10.includes(t) ? 'checked' : ''}>${esc(t)}</label>`).join('')}</div></fieldset>
      <fieldset><legend>5. Verificação antes de iniciar</legend><div class="q">${PERGUNTAS.map((t, i) => `<label><input type="checkbox" data-q="${i}" ${d.verif && d.verif.includes(t) ? 'checked' : ''}><span class="req">${esc(t)}</span></label>`).join('')}</div></fieldset>
      <fieldset><legend>6. Declaração</legend><label class="q" style="display:flex;gap:7px"><input type="checkbox" id="aDecl" ${prev ? 'checked' : ''}><span class="req">Declaro que analisei os riscos desta atividade, conheço as medidas de controle e só iniciarei o trabalho com a liberação do instrutor.</span></label></fieldset>
      <div class="err" id="aErr"></div>
      <div class="row"><button class="b" id="aPrint">Imprimir / salvar PDF</button><button class="b s" id="aBaixar">Baixar APR</button><button class="b p" id="aOk">Concluir APR</button></div>
    </div></div>`;
    const $ = (s) => dlg.querySelector(s);
    $('.x').onclick = () => close();
    dlg.onclick = (e) => { if (e.target === dlg) close(); };
    const rows = $('#aRows');
    rows.addEventListener('click', (e) => { if (e.target.classList.contains('del') && rows.children.length > 1) e.target.closest('tr').remove(); });
    $('.addRow').onclick = () => rows.insertAdjacentHTML('beforeend', rowHTML());
    dlg.querySelectorAll('.chip').forEach((c) => c.onclick = () => {
      const r = riscosMapa[+c.dataset.i]; const tr = rows.lastElementChild || (rows.insertAdjacentHTML('beforeend', rowHTML()), rows.lastElementChild);
      const ta = tr.querySelector('[data-k=risco]'); ta.value = (ta.value ? ta.value + '; ' : '') + r.txt; c.style.opacity = 0.5;
    });
    const collect = () => ({
      aluno: $('#aAluno').value.trim(), turma: $('#aTurma').value.trim(), data: $('#aData').value || hoje(), hora: new Date().toTimeString().slice(0, 5),
      atividade: $('#aAtiv').value, local: $('#aLocal').value.trim(), equipe: $('#aEquipe').value.trim(), instrutor: $('#aInstr').value.trim(),
      etapas: [...rows.children].map((tr) => Object.fromEntries([...tr.querySelectorAll('textarea')].map((t) => [t.dataset.k, t.value.trim()]))).filter((r) => r.etapa || r.risco || r.controle),
      epi: EPI.filter((_, i) => $(`[data-epi="${i}"]`).checked), epiOutros: $('#aEpiOut').value.trim(),
      nr10: NR10.filter((_, i) => $(`[data-nr="${i}"]`).checked), verif: PERGUNTAS.filter((_, i) => $(`[data-q="${i}"]`).checked), decl: $('#aDecl').checked,
    });
    const validate = (a) => {
      if (!a.aluno) return 'Informe o nome do aluno.'; if (!a.turma) return 'Informe a turma.'; if (!a.instrutor) return 'Informe o instrutor responsável.';
      const full = a.etapas.filter((r) => r.etapa && r.risco && r.controle);
      if (full.length < 2) return 'Descreva pelo menos 2 etapas completas (etapa, risco e medida de controle).';
      if (!a.epi.length) return 'Marque os EPI/EPC necessários.';
      if (a.verif.length < PERGUNTAS.length) return 'Confirme todos os itens da verificação antes de iniciar.';
      if (!a.decl) return 'Marque a declaração para concluir.';
      return '';
    };
    $('#aOk').onclick = () => {
      const a = collect(), er = validate(a);
      $('#aErr').textContent = er; if (er) return;
      session = a; const l = load(); l.push(a); save(l);
      close(); toast && toast(`APR concluída por ${esc(a.aluno)}. Atividades liberadas.`, false, 4500);
      onDone && onDone(a);
    };
    $('#aPrint').onclick = () => window.print();
    $('#aBaixar').onclick = () => {
      const a = collect(); const html = docHTML(a);
      const b = new Blob([html], { type: 'text/html' }); const u = URL.createObjectURL(b);
      const l = document.createElement('a'); l.href = u; l.download = `APR_${(a.aluno || 'aluno').replace(/\s+/g, '_')}_${a.data}.html`; document.body.appendChild(l); l.click(); l.remove();
      setTimeout(() => URL.revokeObjectURL(u), 2000);
    };
  }
  function docHTML(a) {
    const li = (arr) => arr.length ? `<ul>${arr.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '<p>—</p>';
    return `<!doctype html><meta charset="utf-8"><title>APR ${esc(a.aluno)}</title><style>body{font:14px/1.45 system-ui,sans-serif;margin:24px;color:#1e2a3a}h1{font-size:18px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:5px;text-align:left;vertical-align:top}th{background:#eef2f7}</style>
      <h1>APR · Análise Preliminar de Risco — Laboratório de Eletricidade</h1>
      <p><b>Aluno:</b> ${esc(a.aluno)} · <b>Turma:</b> ${esc(a.turma)} · <b>Data:</b> ${esc(a.data)} ${esc(a.hora)}<br><b>Atividade:</b> ${esc(a.atividade)} · <b>Local:</b> ${esc(a.local)}<br><b>Equipe:</b> ${esc(a.equipe || '—')} · <b>Instrutor:</b> ${esc(a.instrutor)}</p>
      <h3>Etapas, riscos e controles</h3><table><tr><th>Etapa</th><th>Risco</th><th>Consequência</th><th>Controle</th></tr>${a.etapas.map((r) => `<tr><td>${esc(r.etapa)}</td><td>${esc(r.risco)}</td><td>${esc(r.consequencia)}</td><td>${esc(r.controle)}</td></tr>`).join('')}</table>
      <h3>EPI / EPC</h3>${li(a.epi.concat(a.epiOutros ? [a.epiOutros] : []))}<h3>Desenergização (NR-10)</h3>${li(a.nr10)}<h3>Verificação</h3>${li(a.verif)}
      <p>${a.decl ? '☑' : '☐'} Declaro que analisei os riscos desta atividade e só iniciarei com a liberação do instrutor.</p>
      <p style="margin-top:40px">______________________________ Aluno &nbsp;&nbsp;&nbsp; ______________________________ Instrutor</p>`;
  }
  function open(onDone) { render(onDone); dlg.style.display = 'flex'; dlg.scrollTop = 0; }
  function close() { dlg.style.display = 'none'; }
  return { open, close, doneToday: () => !!session || load().some((a) => a.data === hoje()), last: () => session || load().filter((a) => a.data === hoje()).pop() };
}
