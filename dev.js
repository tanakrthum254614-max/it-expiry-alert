// เซิร์ฟเวอร์สำหรับรันในเครื่อง: เสิร์ฟ public/ และเรียก api/*.js แบบเดียวกับ Vercel
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC = path.resolve('public');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
};

http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://local');
  try {
    if (pathname.startsWith('/api/')) {
      const name = pathname.slice(5).replace(/\/$/, '');
      if (!/^[a-z-]+$/.test(name)) throw Object.assign(new Error('not found'), { code: 'ENOENT' });
      const mod = await import(pathToFileURL(path.resolve('api', `${name}.js`)).href);
      return await mod.default(req, res);
    }
    const file = path.resolve(PUBLIC, '.' + (pathname === '/' ? '/index.html' : decodeURIComponent(pathname)));
    if (!file.startsWith(PUBLIC)) throw Object.assign(new Error('not found'), { code: 'ENOENT' });
    const data = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch (e) {
    if (res.headersSent) return res.end();
    const notFound = e.code === 'ENOENT' || e.code === 'EISDIR' || e.code === 'ERR_MODULE_NOT_FOUND';
    res.writeHead(notFound ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(notFound ? 'Not found' : String(e.stack || e));
  }
}).listen(PORT, () => console.log(`พร้อมใช้งานที่ http://localhost:${PORT}`));
