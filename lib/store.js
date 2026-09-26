import fs from 'node:fs/promises';
import path from 'node:path';

const PREFIX = 'expiry';

// เก็บข้อมูลใน Upstash Redis ถ้ามี env ไม่งั้นเก็บเป็นไฟล์ .data/ (ใช้ตอน dev)
let redis;
async function getRedis() {
  if (redis !== undefined) return redis;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return (redis = null);
  const { Redis } = await import('@upstash/redis');
  return (redis = new Redis({ url, token }));
}

const DIR = path.join(process.cwd(), '.data');

export async function load(key, fallback) {
  const r = await getRedis();
  if (r) return (await r.get(`${PREFIX}:${key}`)) ?? fallback;
  try {
    return JSON.parse(await fs.readFile(path.join(DIR, `${key}.json`), 'utf8'));
  } catch {
    return fallback;
  }
}

export async function save(key, value) {
  const r = await getRedis();
  if (r) return void (await r.set(`${PREFIX}:${key}`, value));
  if (process.env.VERCEL) throw new Error('ยังไม่ได้เชื่อม Upstash Redis (ตั้ง KV_REST_API_URL / KV_REST_API_TOKEN)');
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, `${key}.json`), JSON.stringify(value, null, 2));
}
