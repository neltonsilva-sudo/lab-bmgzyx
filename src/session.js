// DONO: orquestrador. Sessão "professor → celulares" do QR code, sem servidor próprio:
// o computador do professor publica um sinal de vida a cada 10 s num canal público e efêmero (ntfy.sh, gratuito,
// sem dados pessoais: só "alive"/"close"); os celulares que entraram pelo QR escutam o canal e se bloqueiam
// quando recebem "close" ou quando o sinal some por mais de 35 s.
const BASE = 'https://ntfy.sh/';
const topic = (sid) => 'labtwin-' + sid;

export function newSessionId() {
  const a = new Uint8Array(9); crypto.getRandomValues(a);
  return [...a].map((b) => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('');
}

// computador do professor
export function hostSession(sid) {
  const url = BASE + topic(sid);
  let timer = null, closed = false;
  const send = (msg) => fetch(url, { method: 'POST', body: msg, keepalive: true }).catch(() => {});
  const close = () => { if (closed) return; closed = true; clearInterval(timer); try { navigator.sendBeacon(url, 'close'); } catch (e) { send('close'); } };
  send('alive'); timer = setInterval(() => send('alive'), 10000);
  addEventListener('pagehide', close);
  return { close, get closed() { return closed; } };
}

// celular que entrou pelo QR
export function watchSession(sid, onEnd) {
  let last = 0, ended = false, es = null;
  const end = (why) => { if (ended) return; ended = true; try { es && es.close(); } catch (e) {} clearInterval(chk); onEnd(why); };
  try {
    es = new EventSource(BASE + topic(sid) + '/sse');
    es.onmessage = (ev) => {
      let m = ''; try { m = JSON.parse(ev.data).message || ''; } catch (e) { return; }
      if (m === 'close') end('close'); else if (m === 'alive') last = Date.now();
    };
  } catch (e) { /* sem canal: não bloqueia */ }
  // só bloqueia por silêncio se já tiver recebido algum sinal (evita bloquear quando o canal não funciona)
  const chk = setInterval(() => { if (last && Date.now() - last > 35000) end('timeout'); }, 5000);
  return { stop: () => { ended = true; clearInterval(chk); try { es && es.close(); } catch (e) {} } };
}

// celular: confere se o QR ainda é válido (sessão ativa nos últimos 40 s e não encerrada).
// → 'ok' | 'closed' | 'expired' | 'unknown' (sem internet para conferir)
export async function checkSession(sid) {
  try {
    const r = await fetch(BASE + topic(sid) + '/json?poll=1&since=45s', { cache: 'no-store' });
    if (!r.ok) return 'unknown';
    const msgs = (await r.text()).split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch (e) { return null; } }).filter((m) => m && m.event === 'message');
    if (msgs.some((m) => m.message === 'close')) return 'closed';
    return msgs.some((m) => m.message === 'alive') ? 'ok' : 'expired';
  } catch (e) { return 'unknown'; }
}
