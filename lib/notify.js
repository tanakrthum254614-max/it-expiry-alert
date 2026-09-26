export function channels() {
  const env = process.env;
  return [
    env.NOTIFY_WEBHOOK_URL && 'webhook',
    env.LINE_CHANNEL_ACCESS_TOKEN && env.LINE_TO && 'line',
    env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID && 'telegram',
  ].filter(Boolean);
}

const post = (url, body, headers = {}) => fetch(url, {
  method: 'POST',
  headers: { 'content-type': 'application/json', ...headers },
  body: JSON.stringify(body),
  signal: AbortSignal.timeout(10000),
}).then(async (r) => {
  if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 200)}`);
});

// ส่งทุกช่องทางที่ตั้งค่าไว้ คืนผลของแต่ละช่องทาง
export async function notify(text) {
  const env = process.env;
  const senders = {
    // Discord อ่าน content, Slack/Google Chat อ่าน text (Discord จำกัด 2000 ตัวอักษร)
    webhook: () => post(env.NOTIFY_WEBHOOK_URL, { text, content: text.slice(0, 1990) }),
    line: () => post('https://api.line.me/v2/bot/message/push',
      { to: env.LINE_TO, messages: [{ type: 'text', text: text.slice(0, 4900) }] },
      { authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}` }),
    telegram: () => post(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      { chat_id: env.TELEGRAM_CHAT_ID, text: text.slice(0, 4000) }),
  };
  const names = channels();
  const settled = await Promise.allSettled(names.map((n) => senders[n]()));
  return names.map((name, i) => ({ name, ok: settled[i].status === 'fulfilled', error: settled[i].reason?.message }));
}
