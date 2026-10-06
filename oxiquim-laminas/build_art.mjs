// Exporta cada pieza de art.html como PNG transparente en art/ (node build_art.mjs)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const root = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch();
const p = await b.newPage();
p.on('pageerror', (e) => { console.error('PAGE ERROR', e.message); process.exit(1); });
await p.goto(pathToFileURL(path.join(root, 'art.html')).href);
await p.waitForFunction(() => window.READY === true);
// la foto entra como data URL para no contaminar el lienzo (file://)
const photo = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(root, 'assets/aceite-color.jpg')).toString('base64');
await p.evaluate((s) => window.setPhoto(s), photo);
fs.mkdirSync(path.join(root, 'art'), { recursive: true });
for (const name of ['results', 'groups', 'priorities', 'summary', 'reasons', 'kpi', 'road', 'r35', 'logo']) {
  const { url, w, h } = await p.evaluate((n) => { const c = window.ART[n](); return { url: c.toDataURL('image/png'), w: c.width, h: c.height }; }, name);
  fs.writeFileSync(path.join(root, 'art', name + '.png'), Buffer.from(url.split(',')[1], 'base64'));
  console.log(name, w + '×' + h);
}
await b.close();
