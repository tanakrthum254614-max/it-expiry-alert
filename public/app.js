import { api, esc, fmtDate, toast } from './common.js';

const TYPE_LABEL = { ssl: 'SSL', domain: 'โดเมน', license: 'License', contract: 'สัญญา/MA', other: 'อื่น ๆ' };
const AUTO = ['ssl', 'domain'];
const $ = (s) => document.querySelector(s);

let items = [];
let statusFilter = '';

const daysLeft = (iso) => Math.floor((new Date(iso) - Date.now()) / 86400000);

function status(item) {
  if (!item.expiresAt) return 'unknown';
  const d = daysLeft(item.expiresAt);
  return d < 0 ? 'expired' : d <= 7 ? 'soon7' : d <= 30 ? 'soon30' : 'ok';
}

const STATUS = {
  expired: { label: 'หมดอายุแล้ว', cls: 'late' },
  soon7: { label: 'เหลือ ≤ 7 วัน', cls: 'danger' },
  soon30: { label: 'เหลือ ≤ 30 วัน', cls: 'warn' },
  ok: { label: 'ปกติ', cls: 'ok' },
  unknown: { label: 'ยังไม่รู้วันหมดอายุ', cls: '' },
};

function daysText(item) {
  if (!item.expiresAt) return '–';
  const d = daysLeft(item.expiresAt);
  return d < 0 ? `เลยมา ${-d} วัน` : d === 0 ? 'วันนี้' : `${d} วัน`;
}

function renderStats() {
  const count = (s) => items.filter((i) => status(i) === s).length;
  const keys = ['expired', 'soon7', 'soon30', 'ok'];
  if (count('unknown')) keys.push('unknown');
  $('#stats').innerHTML = keys.map((k) => `
    <button class="card stat ${statusFilter === k ? 'active' : ''}" data-status="${k}">
      <div class="n days ${STATUS[k].cls}">${count(k)}</div>
      <div class="l">${STATUS[k].label}</div>
    </button>`).join('');
}

function render() {
  renderStats();
  const q = $('#q').value.trim().toLowerCase();
  const type = $('#fType').value;
  const list = items
    .filter((i) => !type || i.type === type)
    .filter((i) => !statusFilter || status(i) === statusFilter)
    .filter((i) => !q || [i.name, i.target, i.owner, i.note].join(' ').toLowerCase().includes(q))
    .sort((a, b) => (a.expiresAt || '9999').localeCompare(b.expiresAt || '9999'));

  $('#rows').innerHTML = list.length ? list.map((i) => `
    <tr>
      <td><strong>${esc(i.name)}</strong>
        ${i.target ? `<div class="sub">${esc(i.target)}${i.issuer ? ` · ${esc(i.issuer)}` : ''}</div>` : ''}
        ${i.note ? `<div class="sub">${esc(i.note)}</div>` : ''}
        ${i.checkError ? `<div class="err">⚠ ${esc(i.checkError)}</div>` : ''}</td>
      <td><span class="badge">${TYPE_LABEL[i.type] || i.type}</span></td>
      <td>${fmtDate(i.expiresAt)}
        ${i.lastChecked ? `<div class="sub">ตรวจล่าสุด ${fmtDate(i.lastChecked)}</div>` : ''}</td>
      <td><span class="days ${STATUS[status(i)].cls}">${daysText(i)}</span></td>
      <td>${esc(i.owner) || '<span class="sub">–</span>'}</td>
      <td class="actions">
        ${AUTO.includes(i.type) ? `<button class="small" data-check="${i.id}" title="ตรวจใหม่">🔄</button>` : ''}
        <button class="small" data-edit="${i.id}">แก้ไข</button>
        <button class="small danger" data-del="${i.id}">ลบ</button>
      </td>
    </tr>`).join('')
    : `<tr><td colspan="6" class="empty">${items.length ? 'ไม่พบรายการที่ตรงกับตัวกรอง' : 'ยังไม่มีรายการ กด “＋ เพิ่มรายการ” เพื่อเริ่ม'}</td></tr>`;
}

async function refresh() {
  try {
    ({ items } = await api('/api/items'));
    render();
  } catch (e) { toast(e.message, true); }
}

function openForm(item = {}) {
  const f = $('#form');
  f.reset();
  f.id.value = item.id || '';
  f.name.value = item.name || '';
  f.type.value = item.type || 'ssl';
  f.target.value = item.target || '';
  f.expiresAt.value = item.expiresAt ? item.expiresAt.slice(0, 10) : '';
  f.owner.value = item.owner || '';
  f.note.value = item.note || '';
  $('#dlgTitle').textContent = item.id ? 'แก้ไขรายการ' : 'เพิ่มรายการ';
  syncType();
  $('#dlg').returnValue = ''; // กด Esc ปิดแล้วจะไม่บันทึกซ้ำจากค่าเก่า
  $('#dlg').showModal();
}

function syncType() {
  const f = $('#form');
  const auto = AUTO.includes(f.type.value);
  $('#targetWrap').hidden = !auto;
  f.target.required = auto;
  f.expiresAt.required = !auto;
}

$('#form').type.addEventListener('change', syncType);

$('#dlg').addEventListener('close', async () => {
  if ($('#dlg').returnValue !== 'save') return;
  const f = $('#form');
  const body = Object.fromEntries(new FormData(f));
  toast('กำลังบันทึก…');
  try {
    const { item } = await api('/api/items', { method: 'POST', body });
    toast(item.checkError ? `บันทึกแล้ว แต่ตรวจอัตโนมัติไม่สำเร็จ: ${item.checkError}` : 'บันทึกแล้ว', !!item.checkError);
    refresh();
  } catch (e) { toast(e.message, true); }
});

document.addEventListener('click', async (e) => {
  const t = e.target.closest('button');
  if (!t) return;
  if (t.dataset.status) { statusFilter = statusFilter === t.dataset.status ? '' : t.dataset.status; return render(); }
  if (t.dataset.edit) return openForm(items.find((i) => i.id === t.dataset.edit));
  if (t.dataset.del) {
    const item = items.find((i) => i.id === t.dataset.del);
    if (!confirm(`ลบ “${item.name}” ?`)) return;
    try { await api(`/api/items?id=${item.id}`, { method: 'DELETE' }); refresh(); } catch (err) { toast(err.message, true); }
  }
  if (t.dataset.check) {
    t.disabled = true;
    try { ({ items } = await api('/api/check', { method: 'POST', body: { id: t.dataset.check } })); render(); }
    catch (err) { toast(err.message, true); t.disabled = false; }
  }
});

$('#btnAdd').onclick = () => openForm();
$('#q').oninput = render;
$('#fType').onchange = render;

$('#btnCheck').onclick = async (e) => {
  e.target.disabled = true;
  try {
    const r = await api('/api/check', { method: 'POST', body: {} });
    items = r.items; render();
    toast(`ตรวจแล้ว ${r.checked} รายการ`);
  } catch (err) { toast(err.message, true); }
  e.target.disabled = false;
};

$('#btnNotify').onclick = async (e) => {
  e.target.disabled = true;
  try {
    const r = await api('/api/cron', { method: 'POST' });
    const out = $('#notifyResult');
    if (!r.message) {
      out.innerHTML = '<p>ไม่มีรายการที่ถึงรอบแจ้งเตือน (แต่ละช่วงแจ้งครั้งเดียว: 60/30/14/7/3/1/0 วัน)</p>';
    } else {
      out.innerHTML = `<pre class="preview">${esc(r.message)}</pre>` +
        (r.warning ? `<p class="days warn">${esc(r.warning)}</p>` : '') +
        r.sent.map((s) => `<div>${s.ok ? '✅' : '❌'} ${esc(s.name)} ${s.error ? `<span class="hint">${esc(s.error)}</span>` : ''}</div>`).join('');
    }
    $('#dlgNotify').showModal();
    refresh();
  } catch (err) { toast(err.message, true); }
  e.target.disabled = false;
};

fetch('/api/config').then((r) => r.json()).then((c) => {
  $('#channels').textContent = c.channels.length ? `แจ้งเตือนผ่าน: ${c.channels.join(', ')}` : '⚠ ยังไม่ตั้งช่องทางแจ้งเตือน';
}).catch(() => {});

refresh();
