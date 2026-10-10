// Renderiza index.html cuadro a cuadro (tiempo determinista) y lo codifica con ffmpeg.
//   node scripts/render.mjs --style holo --stills 3,7      → PNG en out/stills
//   node scripts/render.mjs --style holo --fps 60           → out/<estilo>.mp4
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
const style = arg('style', 'holo');
const bg = arg('bg', '');
const tag = arg('tag', style);

const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(root, 'index.html')).href + '?style=' + style + (bg ? '&bg=' + encodeURIComponent(bg) : ''));
await page.waitForFunction(() => window.READY === true);
const cdp = await page.context().newCDPSession(page);
if (bg === 'transparent') {
  await page.addStyleTag({ content: 'html,body{background:transparent!important}' });
  await cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
}
fs.mkdirSync(path.join(root, 'out/stills'), { recursive: true });

const stills = arg('stills'), frames = arg('frames');
if (frames) {
  // Secuencia PNG con alfa: out/<frames>/f0000.png …
  const fps = +arg('fps', 60), from = +arg('from', 0), to = +arg('to', 8), dir = path.join(root, 'out', frames);
  fs.mkdirSync(dir, { recursive: true });
  const n = Math.round((to - from) * fps);
  for (let i = 0; i < n; i++) {
    await page.evaluate(([t, st]) => window.renderFrame(t, st), [from + i / fps, style]);
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(dir, `f${String(i).padStart(4, '0')}.png`), Buffer.from(data, 'base64'));
  }
  console.log('frames ok', n);
} else if (stills) {
  for (const s of stills.split(',').map(Number)) {
    await page.evaluate(([t, st]) => window.renderFrame(t, st), [s, style]);
    await page.screenshot({ path: path.join(root, `out/stills/${tag}_t${s.toFixed(2)}.png`), omitBackground: bg === 'transparent' });
  }
  console.log('stills ok');
} else {
  const fps = +arg('fps', 60), from = +arg('from', 0), to = +arg('to', 8);
  const out = path.join(root, arg('out', `out/${tag}.mp4`));
  const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round((to - from) * fps);
  for (let i = 0; i < n; i++) {
    await page.evaluate(([t, st]) => window.renderFrame(t, st), [from + i / fps, style]);
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
    if (!ff.stdin.write(Buffer.from(data, 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log('video ok', out);
}
await browser.close();
