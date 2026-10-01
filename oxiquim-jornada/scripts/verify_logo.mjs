// Compara el logo vectorizado contra el PNG original: rasteriza a 1x en Chromium y mide la diferencia de alfa.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const L = JSON.parse(fs.readFileSync('assets/logo-paths.json'));
const png = fs.readFileSync('assets/oxiquim-logo-original.png').toString('base64');
const b = await chromium.launch(); const p = await b.newPage();
const res = await p.evaluate(async ({ L, png }) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + png; await img.decode();
  const c = new OffscreenCanvas(L.w, L.h), g = c.getContext('2d');
  g.drawImage(img, 0, 0); const A = g.getImageData(0, 0, L.w, L.h).data;
  g.clearRect(0, 0, L.w, L.h); g.fillStyle = L.color;
  for (const k in L.parts) g.fill(new Path2D(L.parts[k].d));
  const B = g.getImageData(0, 0, L.w, L.h).data;
  let sad = 0, inter = 0, uni = 0, maxd = 0, sumA = 0;
  for (let i = 3; i < A.length; i += 4) {
    const a = A[i] / 255, v = B[i] / 255, d = Math.abs(a - v);
    sad += d; sumA += a; maxd = Math.max(maxd, d);
    const fa = a > .5, fb = v > .5; if (fa && fb) inter++; if (fa || fb) uni++;
  }
  return { iou: inter / uni, meanAbsAlphaErrPerEdge: sad / sumA, maxd };
}, { L, png });
console.log(JSON.stringify(res));
// lámina comparativa 4x
await p.setContent(`<body style="margin:0;background:#fff"><img src="data:image/png;base64,${png}" style="width:1600px;height:400px;image-rendering:auto;display:block"><svg viewBox="0 0 400 100" width="1600" height="400" style="display:block">${Object.values(L.parts).map(q => `<path d="${q.d}" fill="${L.color}"/>`).join('')}</svg></body>`);
await p.setViewportSize({ width: 1600, height: 800 });
await p.screenshot({ path: 'out/logo-compare.png' });
await b.close();
