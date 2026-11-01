import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const times = (process.env.T || '2').split(',').map(Number); const W = +(process.env.W || 1280), H = +(process.env.H || 800); const out = process.env.OUT || 'qa/shots';
mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium', headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const DPR = +(process.env.DPR || 1); const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: DPR }); const errs = [];
p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
await p.goto(process.env.URL || 'http://127.0.0.1:4180/index.html?t=2', { waitUntil: 'load' });
await p.waitForFunction(() => window.__dioramaReady === true, null, { timeout: 120000 });
for (const t of times) { await p.evaluate((t) => window.__diorama.freeze(t), t); await p.waitForTimeout(150); const clip = process.env.CLIP ? (([x, y, w, h]) => ({ x, y, width: w, height: h }))(process.env.CLIP.split(',').map(Number)) : undefined; await p.screenshot({ path: `${out}/${process.env.TAG || 't'}-${t.toFixed(2)}.png`, clip, fullPage: false }); }
console.log(JSON.stringify(await p.evaluate(() => { const d = window.__diorama; let meshes = 0, tris = 0; d.scene.traverse((o) => { if (o.isMesh) { meshes++; const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); } }); return { meshes, tris: Math.round(tris), post: [d.post.size.x, d.post.size.y], cam: d.camera.position.toArray().map((v) => +v.toFixed(2)), dist: d.camera.userData.distance }; })));
console.log('errors:', errs.length ? errs : 'none'); await b.close();
