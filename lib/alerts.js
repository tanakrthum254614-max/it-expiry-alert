// แจ้งเตือนเมื่อเหลือไม่เกินจำนวนวันเหล่านี้ (แต่ละช่วงแจ้งครั้งเดียว)
export const THRESHOLDS = [0, 1, 3, 7, 14, 30, 60];

export function daysLeft(iso, now = Date.now()) {
  return Math.floor((new Date(iso) - now) / 86400000);
}

export function dueAlert(item, now = Date.now()) {
  if (!item.expiresAt) return null;
  const days = daysLeft(item.expiresAt, now);
  const bucket = days < 0 ? 'expired' : THRESHOLDS.find((t) => days <= t);
  if (bucket === undefined) return null;
  // key ผูกกับวันหมดอายุ: ต่ออายุแล้ววันเปลี่ยน รอบแจ้งเตือนก็เริ่มใหม่เอง
  const key = `${item.expiresAt.slice(0, 10)}:${bucket}`;
  if ((item.notified || []).includes(key)) return null;
  return { key, days };
}

export const TYPE_LABEL = { ssl: 'SSL', domain: 'โดเมน', license: 'License', contract: 'สัญญา/MA', other: 'อื่น ๆ' };

const fmt = (iso) => new Date(iso).toLocaleDateString('th-TH', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok',
});

export function composeMessage(alerts, errors) {
  const lines = ['⏰ IT Expiry Alert: รายการใกล้หมดอายุ', ''];
  for (const { item, days } of [...alerts].sort((a, b) => a.days - b.days)) {
    const head = days < 0 ? `❌ หมดอายุแล้ว ${-days} วัน`
      : days === 0 ? '🔴 หมดอายุวันนี้'
      : days <= 7 ? `🟠 เหลือ ${days} วัน`
      : `🟡 เหลือ ${days} วัน`;
    const owner = item.owner ? ` · ผู้ดูแล: ${item.owner}` : '';
    lines.push(`${head}: ${item.name} [${TYPE_LABEL[item.type] || item.type}] (${fmt(item.expiresAt)})${owner}`);
  }
  if (errors.length) {
    if (alerts.length) lines.push('');
    lines.push('🔍 ตรวจอัตโนมัติไม่สำเร็จ:');
    for (const item of errors) lines.push(`• ${item.name} (${item.target}): ${item.checkError}`);
  }
  return lines.join('\n');
}
