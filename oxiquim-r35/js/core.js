'use strict';
/* ───────── tiempo, easing, utilidades ───────── */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const E = {
  lin: t => t,
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inCubic: t => t * t * t,
  inOutCubic: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outQuart: t => 1 - Math.pow(1 - t, 4),
  outQuint: t => 1 - Math.pow(1 - t, 5),
  outExpo: t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t),
  inExpo: t => t <= 0 ? 0 : Math.pow(2, 10 * t - 10),
  inOutExpo: t => t <= 0 ? 0 : t >= 1 ? 1 : t < .5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  inOutQuint: t => t < .5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2,
  outBack: t => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
};
// progreso 0..1 del intervalo [a,b] con easing
const P = (t, a, b, e = E.outExpo) => e(clamp((t - a) / (b - a)));
const $ = id => document.getElementById(id);
const el = (tag, cls, css, html) => { const d = document.createElement(tag); if (cls) d.className = cls; if (css) d.style.cssText = css; if (html != null) d.innerHTML = html; return d; };

function S(node, o = {}) {
  const { op = 1, x = 0, y = 0, s = 1, sx, sy, r = 0, b = 0 } = o;
  node.style.opacity = op < 0.002 ? 0 : op > 0.998 ? 1 : op.toFixed(3);
  node.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) scale(${(sx ?? s).toFixed(4)},${(sy ?? s).toFixed(4)})${r ? ` rotate(${r.toFixed(2)}deg)` : ''}`;
  node.style.filter = b > 0.08 ? `blur(${b.toFixed(2)}px)` : 'none';
}
function show(node, on) {
  if (node._d === undefined) node._d = node.style.display && node.style.display !== 'none' ? node.style.display : 'block';
  const v = on ? node._d : 'none'; if (node.style.display !== v) node.style.display = v;
}

// entrada/salida estándar: sube con desenfoque → nítido; sale hacia arriba con desenfoque
function inOut(t, a, dIn, c, dOut, dist = 50, blur = 16) {
  const i = P(t, a, a + dIn, E.outExpo), o = P(t, c, c + dOut, E.inCubic);
  return { op: i * (1 - o), y: (1 - i) * dist - o * dist * 0.7, b: (1 - i) * blur + o * blur };
}

// divide en palabras (cada una dentro de una máscara para el "rise")
function splitWords(node, text, cls = '') {
  node.innerHTML = '';
  return text.split(' ').map((w, i, arr) => {
    const m = el('span', 'mask'); const s = el('span', 'w ' + cls); s.textContent = w;
    m.appendChild(s); node.appendChild(m);
    if (i < arr.length - 1) node.appendChild(document.createTextNode(' '));
    return s;
  });
}
function splitChars(node, text, cls = '') {
  node.innerHTML = '';
  return [...text].map(ch => { const s = el('span', 'w ' + cls); s.textContent = ch === ' ' ? ' ' : ch; node.appendChild(s); return s; });
}
// animación de subida por elementos con escalonamiento
function rise(items, t, a, stagger, dur = 0.9, dist = 1.0, blur = 12, unit = 'em') {
  items.forEach((w, i) => {
    const k = P(t, a + i * stagger, a + i * stagger + dur, E.outExpo);
    w.style.transform = `translateY(${((1 - k) * dist * 100).toFixed(2)}%)`;
    w.style.opacity = k < 0.002 ? 0 : k.toFixed(3);
    w.style.filter = k < 0.995 ? `blur(${((1 - k) * blur).toFixed(2)}px)` : 'none';
  });
}

// PRNG determinista
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ───────── color ───────── */
const C = {
  ink: '#1D1D1F', ink2: '#424245', gray: '#6E6E73', gray2: '#A1A1A6', line: '#E3E6EC', faint: '#D9DDE4',
  navy: '#0A2A66', deep: '#0B3D91', brand: '#005EC2', blue: '#1A7CF0', sky: '#4DA8FF', ice: '#BFE0FF', mist: '#EAF3FF', card: '#F3F6FB',
};
const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
function mix(a, b, k) { const A = hex2rgb(a), B = hex2rgb(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], k))).join(',')})`; }
function rgba(h, a) { const [r, g, b] = hex2rgb(h); return `rgba(${r},${g},${b},${a})`; }

/* ───────── canvas ───────── */
function rr(c, x, y, w, h, r) { if (w <= 0 || h <= 0) return; r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function dot(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); c.arc(x, y, Math.max(0, r), 0, Math.PI * 2); c.fill(); }
function ring(c, x, y, r, col, lw) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.arc(x, y, Math.max(0, r), 0, Math.PI * 2); c.stroke(); }
function glow(c, x, y, r, col, a = 1) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, 0.55 * a)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
function label(c, txt, x, y, { size = 22, w = 600, col = C.gray, align = 'center', base = 'middle', a = 1, track = 0 } = {}) {
  if (a <= 0.002) return;
  c.save(); c.globalAlpha *= a; c.font = `${w} ${size}px InterV`; c.textAlign = align; c.textBaseline = base; c.fillStyle = col;
  if (track) c.letterSpacing = track + 'px';
  c.fillText(txt, x, y); c.restore();
}
// dibuja una polilínea parcialmente (0..1) y devuelve el punto final
function polyPartial(c, pts, k) {
  if (k <= 0 || pts.length < 2) return pts[0];
  let L = 0; const seg = [];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  let rem = L * clamp(k); c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
  let end = pts[0];
  for (let i = 1; i < pts.length; i++) {
    if (rem >= seg[i - 1]) { c.lineTo(pts[i][0], pts[i][1]); rem -= seg[i - 1]; end = pts[i]; }
    else { const f = rem / seg[i - 1]; end = [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]; c.lineTo(end[0], end[1]); break; }
  }
  c.stroke(); return end;
}
// muestrea una curva Bézier cúbica
function bez(p0, p1, p2, p3, n = 48) { const o = []; for (let i = 0; i <= n; i++) { const u = i / n, v = 1 - u; o.push([v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0], v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]]); } return o; }
function pointAt(pts, k) {
  let L = 0; const seg = [];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  let rem = L * clamp(k);
  for (let i = 1; i < pts.length; i++) { if (rem <= seg[i - 1]) { const f = seg[i - 1] ? rem / seg[i - 1] : 0; return [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]; } rem -= seg[i - 1]; }
  return pts[pts.length - 1];
}
function hexPath(c, x, y, r, rot = 0) { c.beginPath(); for (let i = 0; i < 6; i++) { const a = rot + Math.PI / 6 + i * Math.PI / 3; const px = x + r * Math.cos(a), py = y + r * Math.sin(a); i ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath(); }
function arrowHead(c, x, y, ang, s, col) { c.save(); c.translate(x, y); c.rotate(ang); c.fillStyle = col; c.beginPath(); c.moveTo(s, 0); c.lineTo(-s * 0.7, -s * 0.65); c.lineTo(-s * 0.35, 0); c.lineTo(-s * 0.7, s * 0.65); c.closePath(); c.fill(); c.restore(); }
