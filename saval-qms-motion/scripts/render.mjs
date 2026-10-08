// Renderiza index.html cuadro a cuadro (tiempo determinista) y lo codifica con ffmpeg.
//   node scripts/render.mjs --stills 2,6.5,14          → PNG sueltos en out/stills
//   node scripts/render.mjs --fps 60 --workers 4       → out/video.mp4 (sin audio)
// La página se sirve por HTTP local (las máscaras CSS con imágenes exigen CORS, que file:// no da).
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };

const server = http.createServer((req, res) => {
  const f = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Access-Control-Allow-Origin': '*' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const URL = `http://127.0.0.1:${server.address().port}/index.html`;

const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text'] });
async function openPage() {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto(URL);
  await page.waitForFunction(() => window.READY === true);
  return page;
}
fs.mkdirSync(path.join(root, 'out/stills'), { recursive: true });

const stills = arg('stills');
if (stills) {
  const page = await openPage();
  for (const s of stills.split(',').map(Number)) {
    await page.evaluate((t) => window.renderFrame(t), s);
    await page.screenshot({ path: path.join(root, `out/stills/t${s.toFixed(2).padStart(6, '0')}.png`) });
  }
  console.log('stills ok');
} else {
  const fps = +arg('fps', 60);
  const total = await (await openPage()).evaluate(() => window.DURATION);
  const from = +arg('from', 0), to = +arg('to', total);
  const W = +arg('workers', 4);
  const n = Math.round((to - from) * fps);
  const per = Math.ceil(n / W);
  const t0 = Date.now();
  const parts = [];
  await Promise.all(Array.from({ length: W }, async (_, w) => {
    const i0 = w * per, i1 = Math.min(n, i0 + per);
    if (i0 >= i1) return;
    const out = path.join(root, `out/part${w}.mp4`); parts[w] = out;
    const page = await openPage();
    const cdp = await page.context().newCDPSession(page);
    const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let i = i0; i < i1; i++) {
      await page.evaluate((t) => window.renderFrame(t), from + i / fps);
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
      if (!ff.stdin.write(Buffer.from(data, 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
      if ((i - i0) % 600 === 0) console.log(`w${w} frame ${i - i0}/${i1 - i0}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end();
    await new Promise((r) => ff.on('close', r));
  }));
  const list = path.join(root, 'out/parts.txt');
  fs.writeFileSync(list, parts.filter(Boolean).map((p) => `file '${p}'`).join('\n'));
  const out = path.join(root, arg('out', 'out/video.mp4'));
  await new Promise((r) => spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', out], { stdio: 'inherit' }).on('close', r));
  console.log('video ok', out, `${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
await browser.close();
server.close();
