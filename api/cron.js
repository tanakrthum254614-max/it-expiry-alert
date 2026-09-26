import { send, isAdmin } from '../lib/http.js';
import { load, save } from '../lib/store.js';
import { AUTO_TYPES, refreshItem } from '../lib/checks.js';
import { dueAlert, composeMessage } from '../lib/alerts.js';
import { notify, channels } from '../lib/notify.js';

// Vercel Cron เรียกวันละครั้ง (08:00 น. เวลาไทย) หรือแอดมินกด "ส่งแจ้งเตือนตอนนี้"
export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  const fromCron = secret && req.headers.authorization === `Bearer ${secret}`;
  if (!fromCron && !isAdmin(req)) return send(res, 401, { error: 'ต้องใช้รหัสแอดมิน' });

  try {
    const items = await load('items', []);
    await Promise.all(items.filter((i) => AUTO_TYPES.includes(i.type)).map(refreshItem));

    const now = Date.now();
    const alerts = items.map((item) => ({ item, ...dueAlert(item, now) })).filter((a) => a.key);
    // แจ้ง error ของการตรวจเฉพาะครั้งแรกที่ข้อความ error เปลี่ยน กันแจ้งซ้ำทุกวัน
    const errors = items.filter((i) => i.checkError && i.errorNotified !== i.checkError);

    let sent = [];
    const message = alerts.length || errors.length ? composeMessage(alerts, errors) : null;
    if (message && channels().length) {
      sent = await notify(message);
      if (sent.some((s) => s.ok)) {
        for (const { item, key } of alerts) item.notified = [...(item.notified || []), key].slice(-20);
        for (const item of errors) item.errorNotified = item.checkError;
      }
    }
    await save('items', items);

    send(res, 200, {
      alerts: alerts.length,
      errors: errors.length,
      message,
      sent,
      warning: message && !channels().length ? 'ยังไม่ได้ตั้งช่องทางแจ้งเตือน (ดู .env.example)' : undefined,
    });
  } catch (e) {
    send(res, 500, { error: e.message });
  }
}
