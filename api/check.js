import { send, readBody, denyUnlessAdmin } from '../lib/http.js';
import { load, save } from '../lib/store.js';
import { AUTO_TYPES, refreshItem } from '../lib/checks.js';

// ตรวจวันหมดอายุ SSL/โดเมนใหม่ทันที (ส่ง id มา = ตรวจรายการเดียว)
export default async function handler(req, res) {
  if (denyUnlessAdmin(req, res)) return;
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  try {
    const { id } = await readBody(req);
    const items = await load('items', []);
    const targets = items.filter((i) => AUTO_TYPES.includes(i.type) && (!id || i.id === id));
    await Promise.all(targets.map(refreshItem));
    await save('items', items);
    send(res, 200, { checked: targets.length, items });
  } catch (e) {
    send(res, 500, { error: e.message });
  }
}
