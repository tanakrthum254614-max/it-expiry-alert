const KEY_STORE = 'adminKey';

export function getKey() {
  try { return localStorage.getItem(KEY_STORE) || ''; } catch { return ''; }
}

export function setKey(key) {
  try { key ? localStorage.setItem(KEY_STORE, key) : localStorage.removeItem(KEY_STORE); } catch {}
}

// เรียก API; ถ้าเจอ 401 จะถามรหัสแอดมินแล้วลองใหม่หนึ่งครั้ง
export async function api(path, { method = 'GET', body } = {}, retry = true) {
  const res = await fetch(path, {
    method,
    headers: { 'content-type': 'application/json', 'x-admin-key': getKey() },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && retry) {
    const key = prompt('ใส่รหัสแอดมิน');
    if (key) { setKey(key.trim()); return api(path, { method, body }, false); }
  }
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
  : '–';

export function toast(msg, bad = false) {
  const el = document.createElement('div');
  el.className = 'toast' + (bad ? ' bad' : '');
  el.textContent = msg;
  document.body.append(el);
  setTimeout(() => el.remove(), 3500);
}
