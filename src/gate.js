// Portão de acesso do site público: pede a senha da turma antes de carregar o simulador.
// Afasta curiosos (o código do site é público, então não é proteção forte). Em localhost não pede senha.
const SALT = 'labtwin-ket1030';
const HASH = '894eb8f7765e28c1f245b91adedbcb06cc85353e9a1594b1e7813be2cfad9f17';
const KEY = 'labtwin.acesso';

const sha = async (t) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)))].map((b) => b.toString(16).padStart(2, '0')).join('');
const start = () => import('./main.js?v=20261008191523');
let ok = /^(localhost|127\.)/.test(location.hostname) && !new URLSearchParams(location.search).has('gate');
// pede a senha a cada abertura ou recarga da página (nada fica guardado no navegador)

if (ok) start();
else {
  const css = document.createElement('style');
  css.textContent = `#gate{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;padding:16px;
    background:radial-gradient(circle at 30% 20%,#2a4a7a,#0d1622 70%);font:15px/1.5 "Segoe UI",system-ui,sans-serif;color:#1e2a3a}
  #gate form{width:min(380px,100%);background:rgba(255,255,255,.96);border-radius:16px;padding:22px 22px 18px;box-shadow:0 14px 40px rgba(0,0,0,.4)}
  #gate h1{font-size:18px;margin:0 0 4px} #gate p{margin:0 0 14px;color:#5d6b7e;font-size:13px}
  #gate input{width:100%;box-sizing:border-box;font:16px system-ui;padding:10px 12px;border:1px solid #c9d1dc;border-radius:9px;margin-bottom:10px}
  #gate button{width:100%;font:600 15px system-ui;padding:10px;border:0;border-radius:9px;background:#1a9c4a;color:#fff;cursor:pointer}
  #gate .err{color:#c9261a;font-size:13px;min-height:18px;margin-top:6px}`;
  document.head.appendChild(css);
  const g = document.createElement('div'); g.id = 'gate';
  g.innerHTML = `<form autocomplete="off"><h1>Gêmeo Digital · Laboratório de Eletricidade</h1><p>Acesso restrito à turma. Digite a senha informada pelo professor.</p>
    <input type="password" id="gPw" placeholder="Senha de acesso" autofocus><button>Entrar</button><div class="err" id="gErr"></div></form>`;
  document.body.appendChild(g);
  g.querySelector('form').onsubmit = async (e) => {
    e.preventDefault();
    const v = g.querySelector('#gPw').value.trim();
    // lê o hash atual sem cache (evita o navegador usar uma versão antiga da senha)
    let cur = HASH;
    try { const r = await fetch('acesso.json?t=' + Date.now(), { cache: 'no-store' }); if (r.ok) cur = (await r.json()).hash || HASH; } catch (er) {}
    if ((await sha(SALT + v)) === cur) { g.remove(); start(); }
    else { g.querySelector('#gErr').textContent = 'Senha incorreta.'; }
  };
}
