import { P } from '../palette.js';
import { TAU, BEAT, smooth, bell, pulse, hash } from '../config.js';
import { IMGS } from './footage.js';
const REEL = ['audience', 'stage', 'face', 'police'];

const RB = ['red', 'orange', 'yellow', 'lime', 'green', 'cyan', 'blue', 'purple', 'magenta', 'pink'];
const col = (n) => P[n];

/** Every wall screen is a pure function of t; abstract colour fields only. */
function cover(ctx, im, w, h, z = 1, ox = 0) {
  const ar = w / h, iw = im.width, ih = im.height; let sw = iw, sh = iw / ar; if (sh > ih) { sh = ih; sw = ih * ar; } sw /= z; sh /= z;
  ctx.drawImage(im, (iw - sw) / 2 + ox, (ih - sh) / 2, sw, sh, 0, 0, w, h);
}
function fixed(s, t, ctx, w, h) {
  const k = (t % 12) / 12;
  if (s.mode === 'audience' || s.mode === 'stage' || s.mode === 'face' || s.mode === 'police') { if (IMGS[s.mode]) cover(ctx, IMGS[s.mode], w, h, 1 + 0.08 * k); else { ctx.fillStyle = col('ink'); ctx.fillRect(0, 0, w, h); } return; }
  if (s.mode === 'big') { ctx.fillStyle = col('navy'); ctx.fillRect(0, 0, w, h); for (let i = 0; i < 7; i++) { ctx.fillStyle = col(['magenta', 'purple', 'blue2', 'pink', 'purple2', 'blue', 'red3'][i]); ctx.beginPath(); ctx.moveTo(w * (0.05 + i * 0.15), 0); ctx.lineTo(w * (0.05 + i * 0.15) + Math.sin(t * 0.8 + i) * w * 0.25, h); ctx.lineTo(w * (0.05 + i * 0.15) + Math.sin(t * 0.8 + i) * w * 0.25 + 8, h); ctx.lineTo(w * (0.05 + i * 0.15) + 6, 0); ctx.fill(); } ctx.fillStyle = col('ink'); ctx.fillRect(w * 0.3, h * 0.35, w * 0.4, h * 0.65); return; }
  if (s.mode === 'film') { ctx.fillStyle = col('grey2'); ctx.fillRect(0, 0, w, h); ctx.fillStyle = col('ink'); ctx.fillRect(0, h * 0.55, w, h * 0.45); ctx.fillStyle = col('wall0'); ctx.fillRect(w * 0.45, h * 0.15, w * 0.12, h * 0.8); ctx.fillStyle = col('skin0'); ctx.fillRect(w * 0.46, h * 0.1, w * 0.1, h * 0.12); for (let i = 0; i < 20; i++) { ctx.fillStyle = col('con0'); ctx.fillRect(hash(i + Math.floor(t * 12)) * w, hash(i * 3 + Math.floor(t * 12)) * h, 1, 3); } return; }
  if (s.mode === 'pink') { ctx.fillStyle = col('pink'); ctx.fillRect(0, 0, w, h); ctx.fillStyle = col('ink'); ctx.fillRect(w * 0.3, h * 0.2, w * 0.4, h * 0.7); ctx.fillStyle = col('skin0'); ctx.fillRect(w * 0.36, h * 0.3, w * 0.28, h * 0.4); ctx.fillStyle = col('ink'); ctx.fillRect(w * 0.4, h * 0.42, w * 0.06, h * 0.05); ctx.fillRect(w * 0.54, h * 0.42, w * 0.06, h * 0.05); return; }
  if (s.mode === 'blackface') { ctx.fillStyle = col('ink'); ctx.fillRect(0, 0, w, h); for (let i = 0; i < 9; i++) { ctx.fillStyle = col(i % 2 ? 'white' : 'wall0'); ctx.fillRect(w * (0.3 + 0.05 * Math.sin(i * 1.7 + t * 0.6)), h * (0.1 + i * 0.09), w * (0.3 + 0.08 * Math.sin(i * 2.3)), h * 0.07); } return; }
}
export function drawScreen(s, t) {
  const { ctx, canvas } = s.tex.userData; const w = canvas.width, h = canvas.height;
  if (s.mode) { fixed(s, t, ctx, w, h); const f2 = pulse(t, BEAT.burst, 0.55); if (f2 > 0.05) { ctx.globalAlpha = Math.min(0.8, f2); ctx.fillStyle = col(RB[Math.floor(t * 10) % RB.length]); ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1; } s.tex.needsUpdate = true; return; }
  const flash = pulse(t, BEAT.burst, 0.55) * 1.0, on = smooth((t - 0.4 - s.id * 0.25) / 0.8);
  ctx.fillStyle = col('ink'); ctx.fillRect(0, 0, w, h);
  const kind = s.id % 5, tt = t + s.id * 3.7; const reel = REEL.map((k) => IMGS[k]).filter(Boolean);
  if (reel.length) { // cut through the stills; slow push-in on each, a hard cut every 5 s
    const slot = Math.floor((t + s.id * 2.3) / 5), im = reel[(slot + s.id) % reel.length], k = ((t + s.id * 2.3) % 5) / 5, z = 1.0 + 0.1 * k;
    const ar = canvas.width / canvas.height, iw = im.width, ih = im.height; let sw = iw, sh = iw / ar; if (sh > ih) { sh = ih; sw = ih * ar; } sw /= z; sh /= z;
    ctx.drawImage(im, (iw - sw) / 2, (ih - sh) / 2, sw, sh, 0, 0, w, h);
    if (k < 0.04) { ctx.globalAlpha = 0.5; ctx.fillStyle = col('white'); ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1; }
  } else if (kind === 0) { // stage beams
    ctx.fillStyle = col('navy'); ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) { const a = Math.sin(tt * 0.9 + i) * 0.5; ctx.fillStyle = col(RB[(i * 2 + Math.floor(tt / 2)) % RB.length]);
      ctx.beginPath(); ctx.moveTo(w * (0.1 + i * 0.16), 0); ctx.lineTo(w * (0.1 + i * 0.16) + a * w * 0.35 - 5, h); ctx.lineTo(w * (0.1 + i * 0.16) + a * w * 0.35 + 5, h); ctx.lineTo(w * (0.1 + i * 0.16) + 2, 0); ctx.fill(); }
    ctx.fillStyle = col('ink'); ctx.fillRect(0, h * 0.78, w, h * 0.22); for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.arc(6 + i * (w / 14), h * 0.8 + Math.sin(tt * 2 + i) * 2, 5, 0, TAU); ctx.fill(); }
  } else if (kind === 1) { // colour bars rolling
    for (let i = 0; i < 8; i++) { ctx.fillStyle = col(RB[(i + Math.floor(tt * 1.5)) % RB.length]); ctx.fillRect((i * w) / 8, 0, w / 8 + 1, h * (0.45 + 0.5 * Math.abs(Math.sin(tt + i)))); }
  } else if (kind === 2) { // drawing: sky, ground, two blocky figures
    ctx.fillStyle = col('wood0'); ctx.fillRect(0, 0, w, h); ctx.fillStyle = col('cyan2'); ctx.fillRect(0, 0, w, h * 0.35);
    const bx = w * 0.3 + Math.sin(tt * 0.8) * 8; ctx.fillStyle = col('pink'); ctx.fillRect(bx, h * 0.3, 18, 8); ctx.fillStyle = col('green'); ctx.fillRect(w * 0.55, h * 0.35, 26, 30); ctx.fillStyle = col('skin0'); ctx.fillRect(w * 0.56, h * 0.15, 14, 14);
    ctx.fillStyle = col('blue2'); ctx.fillRect(w * 0.55, h * 0.65, 10, 22); ctx.fillRect(w * 0.55 + 14, h * 0.65, 10, 22);
  } else if (kind === 3) { // static
    for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) { const v = hash(x * 13 + y * 7 + Math.floor(tt * 8) * 101); ctx.fillStyle = v < 0.5 ? col('con4') : v < 0.8 ? col('con2') : col('con0'); ctx.fillRect(x, y, 4, 4); }
  } else { // spectrum
    ctx.fillStyle = col('teal2'); ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 16; i++) { const v = 0.2 + 0.7 * Math.abs(Math.sin(tt * 1.3 + i * 0.7)); ctx.fillStyle = col(RB[i % RB.length]); ctx.fillRect(i * (w / 16) + 1, h * (1 - v), w / 16 - 2, h * v); }
  }
  if (flash > 0.02) { ctx.globalAlpha = Math.min(1, flash); ctx.fillStyle = col(RB[Math.floor(t * 10) % RB.length]); ctx.fillRect(0, 0, w, h); ctx.fillStyle = col('white'); ctx.fillRect(0, 0, w, h * 0.12); ctx.globalAlpha = 1; }
  if (on < 1) { ctx.globalAlpha = 1 - on; ctx.fillStyle = col('ink'); ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1; }
  s.tex.needsUpdate = true;
}

export function drawMonitor(tex, t) {
  const { ctx, canvas } = tex.userData; const w = canvas.width, h = canvas.height;
  ctx.fillStyle = col('navy'); ctx.fillRect(0, 0, w, h); ctx.fillStyle = col('con1'); ctx.fillRect(0, 0, w, 7);
  const head = Math.floor((t * 4) % 16);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 16; c++) { const on = hash(r * 31 + c * 7) < 0.35; ctx.fillStyle = on ? col(RB[(r * 2) % RB.length]) : col('blue'); if (c === head) ctx.fillStyle = col('white'); ctx.fillRect(2 + c * 3.8, 12 + r * 7, 3, 5); }
  ctx.fillStyle = col('green'); for (let c = 0; c < 20; c++) ctx.fillRect(2 + c * 3, 44 - Math.abs(Math.sin(t * 5 + c)) * 6, 2, 6);
  const f = pulse(t, BEAT.burst, 0.5); if (f > 0.02) { ctx.globalAlpha = Math.min(1, f); ctx.fillStyle = col('white'); ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1; }
  tex.needsUpdate = true;
}
