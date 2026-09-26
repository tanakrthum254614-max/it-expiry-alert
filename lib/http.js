import crypto from 'node:crypto';

export function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

export async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
  }
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

export function query(req) {
  return Object.fromEntries(new URL(req.url, 'http://local').searchParams);
}

// ไม่ตั้ง ADMIN_KEY ได้เฉพาะตอนรันในเครื่อง บน Vercel ต้องตั้งเสมอ
export function isAdmin(req) {
  const key = process.env.ADMIN_KEY;
  if (!key) return !process.env.VERCEL;
  const given = String(req.headers['x-admin-key'] || '');
  return given.length === key.length &&
    crypto.timingSafeEqual(Buffer.from(given), Buffer.from(key));
}

export function denyUnlessAdmin(req, res) {
  if (isAdmin(req)) return false;
  send(res, 401, { error: 'ต้องใช้รหัสแอดมิน' });
  return true;
}

export const uid = () => crypto.randomUUID().slice(0, 8);
