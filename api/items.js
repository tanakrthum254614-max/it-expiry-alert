import { send, readBody, query, denyUnlessAdmin, uid } from '../lib/http.js';
import { load, save } from '../lib/store.js';
import { AUTO_TYPES, cleanTarget, refreshItem } from '../lib/checks.js';
import { TYPE_LABEL } from '../lib/alerts.js';

export default async function handler(req, res) {
  if (denyUnlessAdmin(req, res)) return;
  try {
    const items = await load('items', []);

    if (req.method === 'GET') return send(res, 200, { items });

    if (req.method === 'POST') {
      const input = await readBody(req);
      const name = String(input.name || '').trim();
      const type = TYPE_LABEL[input.type] ? input.type : 'other';
      const target = AUTO_TYPES.includes(type) ? cleanTarget(input.target) : '';
      const expiresAt = input.expiresAt ? new Date(input.expiresAt).toISOString() : null;
      if (!name) return send(res, 400, { error: 'กรุณาใส่ชื่อรายการ' });
      if (AUTO_TYPES.includes(type) && !target) return send(res, 400, { error: 'กรุณาใส่โดเมน/โฮสต์ที่จะตรวจ' });
      if (!AUTO_TYPES.includes(type) && !expiresAt) return send(res, 400, { error: 'กรุณาใส่วันหมดอายุ' });

      let item = items.find((i) => i.id === input.id);
      if (!item) items.push((item = { id: uid(), createdAt: new Date().toISOString(), notified: [] }));
      const targetChanged = item.target !== target;
      Object.assign(item, {
        name, type, target, expiresAt,
        owner: String(input.owner || '').trim(),
        note: String(input.note || '').trim(),
        updatedAt: new Date().toISOString(),
      });
      // ssl/domain: ถ้าไม่ได้กรอกวันเอง หรือเปลี่ยนเป้าหมาย ให้ระบบตรวจทันที
      if (AUTO_TYPES.includes(type) && (!expiresAt || targetChanged)) await refreshItem(item);
      await save('items', items);
      return send(res, 200, { item });
    }

    if (req.method === 'DELETE') {
      const { id } = query(req);
      await save('items', items.filter((i) => i.id !== id));
      return send(res, 200, { ok: true });
    }

    send(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    send(res, 500, { error: e.message });
  }
}
