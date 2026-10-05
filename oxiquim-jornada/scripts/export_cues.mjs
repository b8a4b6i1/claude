// Extrae de index.html los tiempos aleatorios (deterministas) que necesitan los efectos de sonido → out/cues.json
import { createRequire } from 'node:module'; import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto(pathToFileURL(path.join(root, 'index.html')).href); await p.waitForFunction(() => window.READY === true);
const cues = await p.evaluate(() => ({
  team: TEAM.map(q => q.d),                                  // escena 7: retardo de llegada de cada persona
  people: PEOPLE.map(q => ({ d: q.d, dm: q.dm, x: q.x })),    // escena 10: llegada a «R35» y convergencia al isotipo
  tiles: NT, special: SPECIAL,
}));
fs.writeFileSync(path.join(root, 'out/cues.json'), JSON.stringify(cues));
console.log('cues', cues.team.length, cues.people.length);
await b.close();
