// Renderiza index.html cuadro a cuadro (tiempo determinista) y lo codifica con ffmpeg.
//   node scripts/render.mjs --stills 2,6.5,14          → PNG sueltos en out/stills
//   node scripts/render.mjs --fps 60 [--from 0 --to 68.5] → out/video.mp4 (sin audio)
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const FFMPEG = process.env.FFMPEG || 'ffmpeg';

const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => { console.error('PAGE ERROR', e.message); process.exit(1); });
page.on('console', (m) => { if (m.type() === 'error') console.error('console:', m.text()); });
// --dpr 1.3333333333 → salida 2560 × 1440 («2K»): la página dibuja sus lienzos a esa densidad y CDP captura a esa escala
const DPRX = +arg('dpr', 1);
const SHOT = { format: 'png', optimizeForSpeed: true, ...(DPRX !== 1 ? { clip: { x: 0, y: 0, width: 1920, height: 1080, scale: DPRX } } : {}) };
await page.goto(pathToFileURL(path.join(root, arg('page', 'index.html'))).href + (DPRX !== 1 ? `?dpr=${DPRX}` : ''));
await page.waitForFunction(() => window.READY === true);
fs.mkdirSync(path.join(root, 'out/stills'), { recursive: true });

const stills = arg('stills');
if (stills) {
  for (const s of stills.split(',').map(Number)) {
    await page.evaluate((t) => window.renderFrame(t), s);
    const { data } = await (await page.context().newCDPSession(page)).send('Page.captureScreenshot', SHOT);
    fs.writeFileSync(path.join(root, `out/stills/t${s.toFixed(2).padStart(5, '0')}.png`), Buffer.from(data, 'base64'));
  }
  console.log('stills ok');
} else {
  const DUR = await page.evaluate(() => window.DUR);
  const fps = +arg('fps', 60), from = +arg('from', 0), to = +arg('to', DUR);
  const out = path.join(root, arg('out', 'out/video.mp4'));
  const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', arg('crf', '15'), '-tune', 'animation', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const cdp = await page.context().newCDPSession(page);
  const n = Math.round((to - from) * fps), t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await page.evaluate((t) => window.renderFrame(t), from + i / fps);
    const { data } = await cdp.send('Page.captureScreenshot', SHOT);
    if (!ff.stdin.write(Buffer.from(data, 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 300 === 0) console.log(`frame ${i}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log('video ok', out);
}
await browser.close();
