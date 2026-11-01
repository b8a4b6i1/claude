import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 900, height: 600 } }); const errs = [];
p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await p.goto('http://127.0.0.1:4180/index.html?t=1', { waitUntil: 'load' }); await p.waitForFunction(() => window.__dioramaReady === true, null, { timeout: 120000 });
const r = await p.evaluate(() => {
  const d = window.__diorama, A = d.stage.actors, THREE = d.THREE; const out = { nan: 0, steps: {}, seat: null, loopSeam: null, inSlab: {} };
  const roots = { devil: A.devil.root, fish: A.fish.root, sentA: A.sent[0].root, sentB: A.sent[1].root, cubeA: A.cubes[0].root, cubeB: A.cubes[1].root, visitor: A.vis.root };
  const prev = {}; const v = new THREE.Vector3();
  for (let t = 0; t <= 70.0001; t += 0.05) {
    d.stage.update(t); d.scene.updateMatrixWorld(true);
    d.scene.traverse((o) => { if (o.matrixWorld.elements.some((e) => !Number.isFinite(e))) out.nan++; });
    for (const [k, o] of Object.entries(roots)) { o.getWorldPosition(v); if (prev[k]) { const s = v.distanceTo(prev[k]); out.steps[k] = Math.max(out.steps[k] || 0, s); } prev[k] = v.clone(); if (Math.abs(v.x) <= 12 && Math.abs(v.z) <= 8) out.inSlab[k] = (out.inSlab[k] || 0) + 1; }
    if (Math.abs(t - 45) < 0.001) { const pv = new THREE.Vector3(); A.vis.pel.getWorldPosition(pv); const kn = new THREE.Vector3(); A.vis.legs[0].kn.getWorldPosition(kn); const an = new THREE.Vector3(); A.vis.legs[0].an.getWorldPosition(an); out.seat = { pelvisY: +pv.y.toFixed(3), kneeY: +kn.y.toFixed(3), ankleY: +an.y.toFixed(3), pelvisXZ: [+pv.x.toFixed(2), +pv.z.toFixed(2)], stool: d.parts.stool.toArray().map((x) => +x.toFixed(2)), kneeXZ: [+kn.x.toFixed(2), +kn.z.toFixed(2)] }; }
  }
  const sig = (t) => { d.stage.update(t); d.scene.updateMatrixWorld(true); return Object.values(roots).flatMap((o) => { o.getWorldPosition(v); return [v.x, v.y, v.z]; }); };
  const a = sig(0), z = sig(70); out.loopSeam = Math.max(...a.map((x, i) => Math.abs(x - z[i]))).toFixed(4);
  for (const k of Object.keys(out.steps)) out.steps[k] = +out.steps[k].toFixed(3);
  return out;
});
console.log(JSON.stringify(r, null, 1)); console.log('errors:', errs.length ? errs : 'none'); await b.close();
