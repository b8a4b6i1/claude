// Extrae de index.html los tiempos deterministas que necesitan los efectos de sonido → out/cues.json
import { createRequire } from 'node:module'; import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto(pathToFileURL(path.join(root, 'index.html')).href); await p.waitForFunction(() => window.READY === true);
const cues = await p.evaluate(() => ({
  people: PEOPLE.map(q => ({ d: q.d, dm: q.dm, x: q.x })),          // escena 9: «¡Vamos a trabajar!» → R35 → isotipo
  voices: VOICES.map(v => ({ i: v.i, g: v.g, rx: v.rx, cx: v.cx, s0: v.slot0, s1: v.slot1, th: v.th })),
  order: ORDER,
}));
fs.mkdirSync(path.join(root, 'out'), { recursive: true });
fs.writeFileSync(path.join(root, 'out/cues.json'), JSON.stringify(cues));
console.log('cues', cues.people.length, cues.voices.length);
await b.close();
