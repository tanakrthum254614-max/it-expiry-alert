import tls from 'node:tls';

export const AUTO_TYPES = ['ssl', 'domain'];

export function cleanTarget(s) {
  return String(s || '').trim().toLowerCase()
    .replace(/^[a-z]+:\/\//, '').replace(/[/?#].*$/, '');
}

export function sslExpiry(target) {
  const [host, port = '443'] = target.split(':');
  return new Promise((resolve, reject) => {
    // rejectUnauthorized: false เพื่อให้อ่านวันหมดอายุได้แม้ cert หมดอายุไปแล้ว
    const socket = tls.connect({ host, port: Number(port), servername: host, rejectUnauthorized: false, timeout: 8000 }, () => {
      const cert = socket.getPeerCertificate();
      socket.end();
      if (!cert?.valid_to) return reject(new Error('ไม่พบใบรับรอง SSL'));
      resolve({ expiresAt: new Date(cert.valid_to).toISOString(), issuer: cert.issuer?.O || cert.issuer?.CN || '' });
    });
    socket.on('timeout', () => { socket.destroy(); reject(new Error('เชื่อมต่อไม่ทันเวลา (8 วินาที)')); });
    socket.on('error', (e) => reject(new Error(`เชื่อมต่อไม่ได้: ${e.code || e.message}`)));
  });
}

export async function domainExpiry(domain) {
  const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
    // rdap.org ตอบ 403 ถ้าใช้ User-Agent เริ่มต้นของ Node
    headers: { accept: 'application/rdap+json', 'user-agent': 'it-expiry-alert/1.0' },
    signal: AbortSignal.timeout(10000),
  });
  if (res.status === 404) throw new Error('ไม่มีข้อมูล RDAP (เช่นโดเมน .th) ให้ใส่วันหมดอายุเอง');
  if (!res.ok) throw new Error(`RDAP ตอบกลับ ${res.status}`);
  const data = await res.json();
  const ev = (data.events || []).find((e) => e.eventAction === 'expiration');
  if (!ev) throw new Error('RDAP ไม่ได้ระบุวันหมดอายุ ให้ใส่เอง');
  return { expiresAt: new Date(ev.eventDate).toISOString() };
}

// ตรวจวันหมดอายุจริงของรายการ ssl/domain; รายการอื่นคืนค่าเดิม
export async function refreshItem(item) {
  if (!AUTO_TYPES.includes(item.type) || !item.target) return item;
  try {
    const found = item.type === 'ssl' ? await sslExpiry(item.target) : await domainExpiry(item.target);
    Object.assign(item, found, { checkError: null });
  } catch (e) {
    item.checkError = e.message;
  }
  item.lastChecked = new Date().toISOString();
  return item;
}
