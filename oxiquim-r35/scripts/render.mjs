// Renderiza index.html cuadro a cuadro (tiempo determinista) y lo codifica con ffmpeg.
//   node scripts/render.mjs --stills 2,6.5,14            → out/stills/*.png
//   node scripts/render.mjs --fps 60 --workers 3          → out/video.mp4 (sin audio) + out/cues.json
import { createRequire } from 'node:module';
import { spawn, execFileSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json' };

const server = http.createServer((req, res) => {
  const f = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const URL0 = `http://127.0.0.1:${server.address().port}/index.html`;

async function open() {
  const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text', '--force-color-profile=srgb'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('pageerror', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('console', m.text()); });
  await page.goto(URL0);
  await page.waitForFunction(() => window.READY === true);
  return { browser, page };
}
fs.mkdirSync(path.join(root, 'out/stills'), { recursive: true });

const stills = arg('stills');
if (stills) {
  const { browser, page } = await open();
  for (const s of stills.split(',').map(Number)) {
    await page.evaluate(t => window.renderFrame(t), s);
    await page.screenshot({ path: path.join(root, `out/stills/t${s.toFixed(2).padStart(6, '0')}.png`) });
  }
  console.log('stills ok');
  await browser.close();
} else {
  const fps = +arg('fps', 60), workers = +arg('workers', 3);
  const probe = await open();
  const dur = await probe.page.evaluate(() => window.DURATION);
  fs.writeFileSync(path.join(root, 'out/cues.json'), JSON.stringify(await probe.page.evaluate(() => window.CUES), null, 1));
  await probe.browser.close();
  const from = +arg('from', 0), to = +arg('to', dur);
  const N = Math.round((to - from) * fps), per = Math.ceil(N / workers), t0 = Date.now();
  const segs = [];
  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const a = w * per, b = Math.min(N, a + per); if (a >= b) return;
    const out = path.join(root, `out/seg${w}.mp4`); segs[w] = out;
    const { browser, page } = await open();
    const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', out],
      { stdio: ['pipe', 'inherit', 'inherit'] });
    const cdp = await page.context().newCDPSession(page);
    for (let i = a; i < b; i++) {
      await page.evaluate(t => window.renderFrame(t), from + i / fps);
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
      if (!ff.stdin.write(Buffer.from(data, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
      if ((i - a) % 600 === 0) console.log(`w${w} frame ${i - a}/${b - a}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
    await browser.close();
  }));
  const list = path.join(root, 'out/segs.txt');
  fs.writeFileSync(list, segs.filter(Boolean).map(s => `file '${s}'`).join('\n'));
  const out = path.join(root, arg('out', 'out/video.mp4'));
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', out]);
  segs.forEach(s => s && fs.unlinkSync(s));
  console.log('video ok', out, ((Date.now() - t0) / 1000).toFixed(0) + 's');
}
server.close();
