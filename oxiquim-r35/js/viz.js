'use strict';
/* Visualizaciones por iniciativa. Firma: draw(c, k, t)
   k = segundos desde que la iniciativa entra en pantalla · t = tiempo global (bucles continuos). */

function spline(pts, n = 16) { // Catmull-Rom → polilínea
  const o = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < n; j++) {
      const u = j / n, u2 = u * u, u3 = u2 * u;
      o.push([0, 1].map(d => 0.5 * ((2 * p1[d]) + (-p0[d] + p2[d]) * u + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * u2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * u3)));
    }
  }
  o.push(pts[pts.length - 1]); return o;
}
function gradLine(c, x0, y0, x1, y1, a, b) { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
const frac = x => x - Math.floor(x);

const V = {};

/* ── Ola 1 · 1 · Gobierno de decisiones de personas ── */
V.gobierno = (c, k, t) => {
  const F = [420, 200], D = [930, 200];
  const N = bez([80, 95], [250, 95], [300, 200], F), Pe = bez([80, 305], [250, 305], [300, 200], F);
  c.lineCap = 'round'; c.lineJoin = 'round';
  const kN = P(k, 0.2, 1.3, E.inOutCubic), kP = P(k, 0.35, 1.45, E.inOutCubic);
  dot(c, 80, 95, 9 * P(k, 0, 0.5, E.outBack), C.navy);
  dot(c, 80, 305, 9 * P(k, 0.1, 0.6, E.outBack), C.sky);
  c.lineWidth = 6; c.strokeStyle = C.navy; polyPartial(c, N, kN);
  c.strokeStyle = C.sky; polyPartial(c, Pe, kP);
  // trenza: negocio + personas avanzan juntos desde la formulación
  const kB = P(k, 1.5, 2.7, E.inOutCubic), xe = lerp(F[0], D[0] - 34, kB);
  if (kB > 0) {
    for (const [sg, col] of [[1, C.navy], [-1, C.sky]]) {
      const pts = []; for (let x = F[0]; x <= xe; x += 4) { const ph = (x - F[0]) / 46 - t * 2.2; const amp = 8 * Math.min(1, (x - F[0]) / 40); pts.push([x, F[1] + sg * amp * Math.sin(ph)]); }
      if (pts.length > 1) { c.strokeStyle = col; c.lineWidth = 6; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); }
    }
  }
  // flujo continuo
  const flowA = P(k, 2.7, 3.3);
  if (flowA > 0) for (let j = 0; j < 3; j++) {
    const u = frac(t * 0.45 + j / 3);
    const a = pointAt(N, u), b = pointAt(Pe, u);
    c.globalAlpha = flowA * Math.sin(Math.PI * u); dot(c, a[0], a[1], 5, '#fff'); dot(c, b[0], b[1], 5, '#fff'); c.globalAlpha = 1;
  }
  // nodo formulación
  const kF = P(k, 1.25, 1.85, E.outBack);
  if (kF > 0) {
    const pr = P(k, 1.3, 2.4, E.outCubic); c.globalAlpha = 1 - pr; ring(c, F[0], F[1], 20 + 40 * pr, C.sky, 3); c.globalAlpha = 1;
    dot(c, F[0], F[1], 20 * kF, '#fff'); ring(c, F[0], F[1], 20 * kF, C.navy, 5); dot(c, F[0], F[1], 7 * kF, C.brand);
  }
  // nodo decisión
  const kD = P(k, 2.6, 3.3, E.outBack);
  if (kD > 0) {
    glow(c, D[0], D[1], 90 * kD, C.sky, 0.8);
    const g = c.createLinearGradient(D[0] - 34, D[1] - 34, D[0] + 34, D[1] + 34); g.addColorStop(0, C.brand); g.addColorStop(1, C.navy);
    c.fillStyle = g; c.beginPath(); c.arc(D[0], D[1], 36 * kD, 0, 7); c.fill();
    const kc = P(k, 2.9, 3.5, E.outCubic); c.strokeStyle = '#fff'; c.lineWidth = 6;
    polyPartial(c, [[D[0] - 14, D[1] + 1], [D[0] - 4, D[1] + 11], [D[0] + 15, D[1] - 10]], kc);
  }
  label(c, 'Negocio', 70, 58, { size: 24, w: 700, col: C.navy, align: 'left', a: P(k, 0.3, 0.9) });
  label(c, 'Personas', 70, 344, { size: 24, w: 700, col: C.brand, align: 'left', a: P(k, 0.45, 1.05) });
  label(c, 'Formulación', F[0], F[1] + 52, { size: 22, w: 600, col: C.gray, a: P(k, 1.4, 2.0) });
  label(c, 'Decisión', D[0], D[1] + 68, { size: 24, w: 700, col: C.ink, a: P(k, 2.8, 3.4) });
};

/* ── Ola 1 · 2 · Rediseño de la gestión del desempeño ── */
V.desempeno = (c, k, t) => {
  c.lineCap = 'round';
  const root = [230, 70], L1 = [100, 230, 360].map(x => [x, 172]), L2 = [66, 134, 196, 264, 326, 394].map(x => [x, 262]);
  const pill = (x, y, w, h, kk, kb) => {
    if (kk <= 0) return;
    c.save(); c.globalAlpha = kk; c.translate(x, y); c.scale(0.6 + 0.4 * kk, 0.6 + 0.4 * kk);
    rr(c, -w / 2, -h / 2, w, h, h / 2); c.fillStyle = C.navy; c.fill();
    if (kb > 0) { c.save(); rr(c, -w / 2, -h / 2, w, h, h / 2); c.clip(); c.fillStyle = C.sky; c.fillRect(w / 2 - w * 0.4 * kb, -h / 2, w * 0.4 * kb, h); c.restore(); }
    c.restore();
  };
  const link = (a, b, kk) => { if (kk <= 0) return; c.strokeStyle = rgba(C.navy, 0.28); c.lineWidth = 2.5; polyPartial(c, bez([a[0], a[1] + 14], [a[0], (a[1] + b[1]) / 2], [b[0], (a[1] + b[1]) / 2], [b[0], b[1] - 12], 24), kk); };
  const kb = P(k, 2.3, 3.1, E.outCubic);
  L1.forEach((p, i) => link(root, p, P(k, 0.5 + i * 0.08, 1.0 + i * 0.08)));
  L2.forEach((p, i) => link(L1[Math.floor(i / 2)], p, P(k, 0.9 + i * 0.06, 1.4 + i * 0.06)));
  pill(root[0], root[1], 210, 46, P(k, 0.15, 0.7, E.outCubic), 0);
  label(c, 'KPI del negocio', root[0], root[1] + 1, { size: 20, w: 700, col: '#fff', a: P(k, 0.3, 0.8) });
  L1.forEach((p, i) => pill(p[0], p[1], 88, 28, P(k, 0.8 + i * 0.08, 1.3 + i * 0.08, E.outCubic), kb));
  L2.forEach((p, i) => pill(p[0], p[1], 44, 20, P(k, 1.2 + i * 0.06, 1.7 + i * 0.06, E.outCubic), kb));
  // conector cascada → ciclo
  const kc = P(k, 1.6, 2.3, E.inOutCubic);
  if (kc > 0) { c.strokeStyle = rgba(C.brand, 0.5); c.lineWidth = 3; c.setLineDash([2, 9]); const pts = bez([428, 262], [525, 262], [560, 205], [640, 205], 30); const e = polyPartial(c, pts, kc); c.setLineDash([]); if (kc > 0.98) arrowHead(c, 648, 205, 0, 10, C.brand); }
  // ciclo de evaluación: dos arcos (KPI + conductual) que se integran
  const O = [790, 200], R = 125, sweep = P(k, 0.8, 2.4, E.inOutCubic) * Math.PI * 2, th = -Math.PI / 2 + t * 0.55;
  c.globalAlpha = P(k, 0.6, 1.2); ring(c, O[0], O[1], R, '#E4ECF7', 22); c.globalAlpha = 1;
  if (sweep > 0) {
    const half = sweep / 2;
    c.lineWidth = 22; c.lineCap = 'round';
    c.strokeStyle = C.navy; c.beginPath(); c.arc(O[0], O[1], R, th, th + half); c.stroke();
    c.strokeStyle = C.sky; c.beginPath(); c.arc(O[0], O[1], R, th + half, th + sweep); c.stroke();
    const ea = th + sweep; arrowHead(c, O[0] + R * Math.cos(ea), O[1] + R * Math.sin(ea), ea + Math.PI / 2, 15, '#fff');
  }
  label(c, 'Ciclo de', O[0], O[1] - 16, { size: 26, w: 700, col: C.ink, a: P(k, 1.0, 1.6) });
  label(c, 'evaluación', O[0], O[1] + 16, { size: 26, w: 700, col: C.ink, a: P(k, 1.0, 1.6) });
  // leyenda
  const la = P(k, 2.4, 3.0);
  dot(c, 470, 372, 8 * la, C.navy); label(c, 'KPI', 486, 372, { size: 20, w: 600, col: C.ink2, align: 'left', a: la });
  dot(c, 560, 372, 8 * la, C.sky); label(c, 'Dimensión conductual', 576, 372, { size: 20, w: 600, col: C.ink2, align: 'left', a: la });
};

/* ── Ola 1 · 3 · Pulso de clima ── */
function pulseY(u) {
  const f = u - Math.floor(u); let v = 0;
  v += -Math.exp(-Math.pow((f - 0.30) / 0.02, 2)) * 0.22;
  v += Math.exp(-Math.pow((f - 0.36) / 0.016, 2)) * 1.0;
  v += -Math.exp(-Math.pow((f - 0.42) / 0.02, 2)) * 0.42;
  v += Math.exp(-Math.pow((f - 0.64) / 0.055, 2)) * 0.2;
  return v;
}
V.clima = (c, k, t) => {
  // termómetro
  const ka = P(k, 0.1, 0.8, E.outCubic), tx = 150;
  c.globalAlpha = ka;
  rr(c, tx - 26, 50, 52, 270, 26); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = '#D6E2F2'; c.lineWidth = 3; c.stroke();
  for (let i = 0; i < 6; i++) { c.strokeStyle = '#D6E2F2'; c.lineWidth = 2; c.beginPath(); c.moveTo(tx + 36, 80 + i * 40); c.lineTo(tx + 50, 80 + i * 40); c.stroke(); }
  const lvl = P(k, 0.5, 1.8, E.outCubic) * (0.66 + 0.07 * Math.sin(t * 1.3) + 0.025 * Math.sin(t * 3.7));
  const top = 312 - 250 * lvl;
  const g = c.createLinearGradient(0, 312, 0, 60); g.addColorStop(0, C.brand); g.addColorStop(1, C.sky);
  rr(c, tx - 15, top, 30, 330 - top, 15); c.fillStyle = g; c.fill();
  dot(c, tx, 340, 40, C.brand); dot(c, tx - 10, 330, 9, 'rgba(255,255,255,0.35)');
  c.globalAlpha = 1;
  label(c, 'Compromiso', tx, 22, { size: 20, w: 700, col: C.gray, a: ka });
  // electro continuo
  const x0 = 290, x1 = 990, y0 = 205, A = 92;
  c.globalAlpha = P(k, 0.3, 1.0);
  for (const y of [y0 - 100, y0, y0 + 100]) { c.strokeStyle = '#EDF2F9'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke(); }
  for (let x = x0 + ((-t * 60) % 70 + 70) % 70; x < x1; x += 70) { c.strokeStyle = '#F1F5FB'; c.beginPath(); c.moveTo(x, y0 - 110); c.lineTo(x, y0 + 110); c.stroke(); }
  c.globalAlpha = 1;
  const rev = P(k, 0.5, 1.8, E.inOutCubic), xe = lerp(x0, x1, rev);
  if (rev > 0) {
    c.lineWidth = 5; c.lineJoin = 'round'; c.lineCap = 'round';
    c.strokeStyle = gradLine(c, x0, 0, x1, 0, rgba(C.sky, 0.15), C.brand);
    c.beginPath();
    for (let x = x0; x <= xe; x += 2) { const y = y0 - A * pulseY((x - x0) / 235 - t * 0.85); x === x0 ? c.moveTo(x, y) : c.lineTo(x, y); }
    c.stroke();
    const yy = y0 - A * pulseY((xe - x0) / 235 - t * 0.85);
    glow(c, xe, yy, 40, C.sky, 1); dot(c, xe, yy, 8, C.brand); dot(c, xe, yy, 3.5, '#fff');
  }
  const ka2 = P(k, 1.4, 2.0);
  c.globalAlpha = ka2; c.strokeStyle = C.gray2; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x0, 352); c.lineTo(x1 - 6, 352); c.stroke(); arrowHead(c, x1, 352, 0, 9, C.gray2); c.globalAlpha = 1;
  label(c, 'Transformación', x0, 380, { size: 20, w: 600, col: C.gray, align: 'left', a: ka2 });
  label(c, 'Termómetro continuo', x1, 70, { size: 20, w: 700, col: C.brand, align: 'right', a: P(k, 1.6, 2.2) });
};

/* ── Ola 1 · 4 · Institucionalizar la gestión del cambio ── */
const CAMBIO_BLOCKS = [100, 205, 310, 415, 520, 625, 730, 835, 940].map((cx, i) => { const w = [84, 88, 92, 88, 96, 90, 100, 92, 96][i]; return [cx - w / 2, [155, 225, 155, 85, 155, 225, 295, 225, 155][i], w]; });
const CAMBIO_PATH = (() => {
  const cs = CAMBIO_BLOCKS.map(([x, y, w]) => [x + w / 2, y + 20]).sort((a, b) => a[0] - b[0]);
  return spline([[30, 200], ...cs, [1010, 200]], 14);
})();
V.cambio = (c, k, t) => {
  const cols = [[40, 200, 'Ola 1'], [200, 520, 'Ola 2'], [520, 1000, 'Ola 3']];
  const ka = P(k, 0.1, 0.8);
  cols.forEach(([a, b, n], i) => {
    label(c, n.toUpperCase(), (a + b) / 2, 30, { size: 18, w: 700, col: C.brand, a: ka, track: 2 });
    rr(c, a + 4, 52, b - a - 8, 4, 2); c.fillStyle = rgba([C.navy, C.brand, C.sky][i], 0.9 * ka); c.fill();
    if (i) { c.globalAlpha = ka; c.strokeStyle = '#DCE4F0'; c.lineWidth = 2; c.setLineDash([4, 8]); c.beginPath(); c.moveTo(a, 70); c.lineTo(a, 335); c.stroke(); c.setLineDash([]); c.globalAlpha = 1; }
  });
  const kt = P(k, 1.0, 3.6, E.inOutCubic);
  // bloques de proyecto
  const order = CAMBIO_BLOCKS.map(([x, y, w]) => x + w / 2).sort((a, b) => a - b);
  CAMBIO_BLOCKS.forEach(([x, y, w], i) => {
    const kk = P(k, 0.2 + i * 0.1, 0.8 + i * 0.1, E.outCubic); if (kk <= 0) return;
    const reached = (x + w / 2 - 30) / 980 < kt;
    c.save(); c.globalAlpha = kk; c.translate(0, (1 - kk) * 14);
    rr(c, x, y, w, 40, 12); c.fillStyle = reached ? C.mist : '#fff'; c.fill(); c.strokeStyle = reached ? rgba(C.brand, 0.55) : '#DCE4F0'; c.lineWidth = 2; c.stroke();
    rr(c, x + 14, y + 16, Math.min(60, w - 40), 8, 4); c.fillStyle = reached ? rgba(C.brand, 0.45) : '#E6ECF4'; c.fill();
    c.restore();
  });
  // hilo continuo
  if (kt > 0) {
    c.lineWidth = 5; c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = gradLine(c, 30, 0, 1010, 0, C.navy, C.sky);
    const e = polyPartial(c, CAMBIO_PATH, kt);
    if (kt < 1) { glow(c, e[0], e[1], 34, C.sky); dot(c, e[0], e[1], 7, C.brand); }
  }
  const fa = P(k, 3.6, 4.2);
  for (let j = 0; j < 4; j++) { const u = frac(t * 0.12 + j / 4), p = pointAt(CAMBIO_PATH, u); c.globalAlpha = fa; dot(c, p[0], p[1], 6, '#fff'); ring(c, p[0], p[1], 6, C.brand, 2.5); c.globalAlpha = 1; }
  label(c, 'Acompañamiento transversal', 520, 378, { size: 21, w: 700, col: C.brand, a: P(k, 2.4, 3.0) });
};

/* ── Ola 2 · 1 · Cultura y valores ── */
const CULT = (() => { const r = rng(7), o = []; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) o.push({ x: 50 + j * 50, y: 70 + i * 50, a0: r() * Math.PI * 2, d: r() }); return o; })();
V.cultura = (c, k, t) => {
  const T = [492, 245];
  label(c, 'Valores corporativos', 30, 28, { size: 19, w: 700, col: C.gray, align: 'left', a: P(k, 0.2, 0.8) });
  CULT.forEach((p, i) => {
    const ka = P(k, 0.05 + i * 0.008, 0.6 + i * 0.008, E.outCubic); if (ka <= 0) return;
    const target = Math.atan2(T[1] - p.y, T[0] - p.x);
    let da = target - p.a0; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
    const kr = P(k, 0.8 + p.d * 0.6 + (p.x / 500) * 0.4, 2.0 + p.d * 0.6 + (p.x / 500) * 0.4, E.inOutCubic);
    const ang = p.a0 + da * kr + 0.04 * Math.sin(t * 2 + i) * kr;
    const col = mix('#C3CCD9', Math.hypot(T[0] - p.x, T[1] - p.y) > 260 ? C.navy : C.brand, kr);
    c.save(); c.globalAlpha = ka; c.translate(p.x, p.y); c.rotate(ang);
    c.strokeStyle = col; c.lineWidth = 3.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(-12, 0); c.lineTo(8, 0); c.stroke();
    arrowHead(c, 12, 0, 0, 8, col); c.restore();
  });
  const kt = P(k, 1.8, 2.5, E.outBack);
  if (kt > 0) { glow(c, T[0], T[1], 110 * kt, C.sky); dot(c, T[0], T[1], 42 * kt, C.brand); label(c, 'R35', T[0], T[1] + 1, { size: 24, w: 800, col: '#fff', a: kt }); }
  const kc = P(k, 2.4, 3.1, E.outCubic);
  [['Internacionalización', 150], ['Nuevos negocios', 395]].forEach(([s, x], i) => {
    const kk = P(k, 2.4 + i * 0.15, 3.1 + i * 0.15, E.outCubic); if (kk <= 0) return;
    c.save(); c.globalAlpha = kk; c.translate(0, (1 - kk) * 16);
    c.font = '700 19px InterV'; const w = c.measureText(s).width + 36;
    rr(c, x - w / 2, 486, w, 42, 21); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = '#CFE3FA'; c.lineWidth = 2; c.stroke();
    label(c, s, x, 507, { size: 19, w: 700, col: C.deep });
    c.restore();
    c.globalAlpha = kc * 0.5; c.strokeStyle = C.brand; c.lineWidth = 2; c.setLineDash([3, 7]);
    c.beginPath(); c.moveTo(x, 484); c.bezierCurveTo(x, 380, T[0], 380, T[0], T[1] + 46); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
  });
};

/* ── Ola 2 · 2 · Planificación estratégica de personas ── */
const PLAN = (() => {
  const r = 23, w = Math.sqrt(3) * r, seeds = [[150, 150], [390, 135], [165, 355], [395, 360]], cells = [], rnd = rng(11);
  for (let row = 0; row < 11; row++) for (let col = 0; col < 11; col++) {
    const x = 60 + col * w + (row % 2) * w / 2, y = 45 + row * r * 1.5;
    let bi = 0, bd = 1e9; seeds.forEach((s, i) => { const d = Math.hypot(s[0] - x, s[1] - y) * (0.85 + 0.3 * rnd()); if (d < bd) { bd = d; bi = i; } });
    cells.push({ x, y, u: bi, d: bd, crit: false });
  }
  seeds.forEach((s, i) => {
    const mine = cells.filter(c => c.u === i && c.d < 90).sort((a, b) => a.d - b.d);
    [0, 3].forEach(j => { if (mine[j]) mine[j].crit = true; });
  });
  return { r, cells, seeds };
})();
V.planificacion = (c, k, t) => {
  const tints = [C.navy, C.brand, C.blue, C.sky];
  const crit = [];
  PLAN.cells.forEach((p, i) => {
    const base = p.d < 92, proj = !base && p.d < 128;
    if (!base && !proj) { const ka = P(k, 0.1, 0.8); if (ka > 0) dot(c, p.x, p.y, 2.2, rgba('#B9C6D8', 0.6 * ka)); return; }
    if (base) {
      const kk = P(k, 0.2 + p.d / 92 * 0.9 + p.u * 0.12, 0.7 + p.d / 92 * 0.9 + p.u * 0.12, E.outBack); if (kk <= 0) return;
      hexPath(c, p.x, p.y, (PLAN.r - 2.5) * kk); c.fillStyle = rgba(tints[p.u], 0.22); c.fill();
      if (p.crit) crit.push(p);
    } else {
      const kk = P(k, 1.7 + (p.d - 92) / 36 * 0.8 + p.u * 0.1, 2.2 + (p.d - 92) / 36 * 0.8 + p.u * 0.1, E.outCubic); if (kk <= 0) return;
      c.globalAlpha = kk; hexPath(c, p.x, p.y, PLAN.r - 4); c.strokeStyle = rgba(tints[p.u], 0.75); c.lineWidth = 2; c.setLineDash([4, 4]); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
    }
  });
  // red de roles críticos
  const kn = P(k, 3.3, 4.3, E.inOutCubic);
  if (kn > 0) {
    c.strokeStyle = rgba(C.navy, 0.35); c.lineWidth = 2.5;
    for (let i = 0; i < crit.length; i++) for (let j = i + 1; j < crit.length; j++) {
      const a = crit[i], b = crit[j]; if (Math.hypot(a.x - b.x, a.y - b.y) > 260) continue;
      polyPartial(c, [[a.x, a.y], [b.x, b.y]], kn);
    }
  }
  crit.forEach((p, i) => {
    const kk = P(k, 2.9 + i * 0.07, 3.5 + i * 0.07, E.outBack); if (kk <= 0) return;
    const pulse = frac(t * 0.6 + i * 0.13);
    c.globalAlpha = (1 - pulse) * 0.6 * kk; hexPath(c, p.x, p.y, PLAN.r * (1 + pulse * 0.8)); c.strokeStyle = C.sky; c.lineWidth = 2; c.stroke(); c.globalAlpha = 1;
    hexPath(c, p.x, p.y, (PLAN.r - 1.5) * kk); c.fillStyle = C.navy; c.fill(); dot(c, p.x, p.y, 4.5 * kk, '#fff');
  });
  const la = P(k, 3.6, 4.2);
  if (la > 0) {
    c.globalAlpha = la;
    hexPath(c, 48, 512, 11); c.fillStyle = rgba(C.brand, 0.25); c.fill();
    hexPath(c, 258, 512, 9); c.strokeStyle = C.brand; c.lineWidth = 2; c.setLineDash([3, 3]); c.stroke(); c.setLineDash([]);
    hexPath(c, 398, 512, 11); c.fillStyle = C.navy; c.fill();
    c.globalAlpha = 1;
    label(c, 'Dotación por unidad', 66, 512, { size: 18, w: 600, col: C.ink2, align: 'left', a: la });
    label(c, 'Proyección', 274, 512, { size: 18, w: 600, col: C.ink2, align: 'left', a: la });
    label(c, 'Roles críticos', 416, 512, { size: 18, w: 600, col: C.ink2, align: 'left', a: la });
  }
};

/* ── Ola 2 · 3 · Modelo de talento y liderazgo ── */
const LID = (() => { const r = rng(23), pts = []; while (pts.length < 44) { const p = { x: 40 + r() * 200, y: 70 + r() * 410, ph: r() * 6.28 }; if (pts.every(q => Math.hypot(q.x - p.x, q.y - p.y) > 30)) pts.push(p); } return pts; })();
const LID_LEAD = [3, 11, 19, 27, 36];
V.liderazgo = (c, k, t) => {
  const slots = [110, 195, 280, 365, 450], H = [[470, 150], [470, 290], [470, 430]];
  const leadPos = LID_LEAD.map((idx, j) => { const p = LID[idx], km = P(k, 1.0 + j * 0.08, 2.0 + j * 0.08, E.inOutCubic); return [lerp(p.x, 300, km), lerp(p.y, slots[j], km)]; });
  // equipos
  const kt = P(k, 1.8, 2.6);
  LID.forEach((p, i) => {
    if (LID_LEAD.includes(i)) return;
    const ka = P(k, 0.05 + i * 0.01, 0.5 + i * 0.01); if (ka <= 0) return;
    const x = p.x + 3 * Math.sin(t * 0.8 + p.ph), y = p.y + 3 * Math.cos(t * 0.7 + p.ph);
    if (kt > 0) { let bj = 0, bd = 1e9; leadPos.forEach((q, j) => { const d = Math.hypot(q[0] - x, q[1] - y); if (d < bd) { bd = d; bj = j; } }); c.strokeStyle = rgba(C.brand, 0.16 * kt); c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y); c.lineTo(leadPos[bj][0], leadPos[bj][1]); c.stroke(); }
    dot(c, x, y, 7 * ka, '#C9D6EA');
  });
  // negocios futuros
  const kh = P(k, 1.9, 2.5, E.outCubic);
  label(c, 'Negocios futuros', 470, 70, { size: 19, w: 700, col: C.gray, a: kh });
  H.forEach(([x, y], i) => {
    if (kh <= 0) return;
    const kf = P(k, 3.0 + i * 0.15, 3.6 + i * 0.15, E.outCubic);
    if (kf > 0) glow(c, x, y, 80 * kf, C.sky, 0.7);
    hexPath(c, x, y, 46 * kh, 0); c.fillStyle = kf > 0 ? rgba(C.brand, 0.9 * kf) : 'rgba(0,0,0,0)'; c.fill();
    c.globalAlpha = kh; c.strokeStyle = C.brand; c.lineWidth = 3; c.setLineDash(kf > 0 ? [] : [6, 6]); hexPath(c, x, y, 46 * kh, 0); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
  });
  // líderes → negocios futuros
  leadPos.forEach(([x, y], j) => {
    const hi = j < 2 ? 0 : j < 4 ? 1 : 2, kl = P(k, 2.3 + j * 0.1, 3.1 + j * 0.1, E.inOutCubic);
    if (kl > 0) { c.strokeStyle = rgba(C.brand, 0.7); c.lineWidth = 3; c.lineCap = 'round'; polyPartial(c, bez([x + 16, y], [x + 80, y], [H[hi][0] - 110, H[hi][1]], [H[hi][0] - 48, H[hi][1]], 24), kl); }
    const kg = P(k, 0.5 + j * 0.12, 1.4 + j * 0.12, E.outBack), r = lerp(7, 16, kg);
    if (kg > 0) { c.globalAlpha = kg; ring(c, x, y, r + 9, rgba(C.sky, 0.6), 3); c.globalAlpha = 1; }
    dot(c, x, y, r, kg > 0 ? mix('#C9D6EA', C.navy, kg) : '#C9D6EA');
  });
  label(c, 'Líderes', 300, 518, { size: 19, w: 700, col: C.gray, a: P(k, 1.8, 2.4) });
};

/* ── Ola 2 · 4 · Atracción, selección y movilidad ── */
V.atraccion = (c, k, t) => {
  const ka = [P(k, 0.1, 0.7), P(k, 0.4, 1.0), P(k, 0.7, 1.3)];
  // A · velocidad de incorporación
  label(c, 'Velocidad de incorporación', 30, 52, { size: 19, w: 700, col: C.gray, align: 'left', a: ka[0] });
  c.globalAlpha = ka[0]; c.strokeStyle = '#E2E9F3'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(40, 120); c.lineTo(450, 120); c.stroke(); c.globalAlpha = 1;
  if (ka[0] > 0) {
    hexPath(c, 498, 120, 28); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = C.brand; c.lineWidth = 3; c.stroke(); dot(c, 498, 120, 7, C.brand);
    const u = frac((t - 0.3) / 1.6), pos = E.inOutExpo(clamp(u / 0.8)), x = lerp(40, 470, pos);
    if (k > 0.6) {
      for (let i = 1; i <= 9; i++) { const xx = x - i * 20 * Math.min(1, Math.sin(Math.PI * clamp(u / 0.8)) * 1.6); if (xx > 40) { c.globalAlpha = (1 - i / 10) * 0.45; dot(c, xx, 120, 9 - i * 0.6, C.sky); } }
      c.globalAlpha = 1; dot(c, x, 120, 10, C.brand);
      const hit = clamp((u - 0.8) / 0.2); if (hit > 0) { c.globalAlpha = 1 - hit; hexPath(c, 498, 120, 28 + hit * 22); c.strokeStyle = C.sky; c.lineWidth = 3; c.stroke(); c.globalAlpha = 1; }
    }
    label(c, 'Rol clave', 498, 170, { size: 17, w: 600, col: C.gray, a: ka[0] });
  }
  // B · sucesión
  label(c, 'Sucesión', 30, 232, { size: 19, w: 700, col: C.gray, align: 'left', a: ka[1] });
  if (ka[1] > 0) {
    c.globalAlpha = ka[1];
    const u = frac((t - 0.5) / 3.4), m = E.inOutCubic(clamp((u - 0.12) / 0.32)), fade = 1 - clamp((u - 0.86) / 0.14);
    ring(c, 300, 298, 30, '#D6E2F2', 3);
    c.setLineDash([3, 7]); c.strokeStyle = rgba(C.brand, 0.4); c.lineWidth = 2; c.beginPath(); c.moveTo(140, 298); c.lineTo(470, 298); c.stroke(); c.setLineDash([]);
    c.globalAlpha = ka[1] * fade; dot(c, lerp(300, 470, m), 298, 17, C.navy); label(c, '↗', lerp(300, 470, m), 298, { size: 18, w: 800, col: '#fff', a: m });
    dot(c, lerp(140, 300, m), 298, 17, C.sky);
    c.globalAlpha = ka[1] * (1 - fade); dot(c, 300, 298, 17, C.navy); dot(c, 140, 298, 17 * (1 - fade), C.sky);
    c.globalAlpha = 1;
  }
  // C · planes de carrera
  label(c, 'Planes de carrera', 30, 392, { size: 19, w: 700, col: C.gray, align: 'left', a: ka[2] });
  if (ka[2] > 0) {
    const st = [[50, 520], [160, 520], [160, 480], [270, 480], [270, 440], [380, 440], [380, 400], [490, 400]];
    c.strokeStyle = gradLine(c, 50, 0, 490, 0, C.sky, C.navy); c.lineWidth = 5; c.lineJoin = 'round'; c.lineCap = 'round';
    polyPartial(c, st, P(k, 0.8, 1.8, E.inOutCubic));
    if (k > 1.8) { const u = frac((t - 0.2) / 3.0), p = pointAt(st, E.inOutCubic(clamp(u / 0.85))); c.globalAlpha = 1 - clamp((u - 0.9) / 0.1); dot(c, p[0], p[1] - 14, 10, C.brand); c.globalAlpha = 1; }
    dot(c, 490, 400, 7 * ka[2], C.navy);
  }
};

/* ── Ola 3 · 1 · Compensaciones e incentivos ── */
const COMP = (() => { const r = rng(5); return Array.from({ length: 12 }, (_, i) => ({ a: i / 12 * Math.PI * 2 + 0.2 * r(), h: 0.45 + 0.55 * r() })); })();
V.compensaciones = (c, k, t) => {
  const O = [450, 315];
  [[230, 0.06], [165, 0.1], [110, 0.18]].forEach(([r, a], i) => { const kk = P(k, 0.1 + i * 0.1, 0.9 + i * 0.1, E.outCubic); if (kk > 0) { c.fillStyle = rgba(C.sky, a * kk); c.beginPath(); c.arc(O[0], O[1], r * (0.8 + 0.2 * kk), 0, 7); c.fill(); } });
  const rot = t * 0.05;
  COMP.forEach((p, i) => {
    const ang = p.a + rot, x = O[0] + 360 * Math.cos(ang), y = O[1] + 255 * Math.sin(ang);
    const ka = P(k, 0.2 + i * 0.04, 0.8 + i * 0.04, E.outBack); if (ka <= 0) return;
    const kl = P(k, 0.7 + i * 0.07, 1.7 + i * 0.07, E.inOutCubic);
    const ex = O[0] + 74 * Math.cos(ang), ey = O[1] + 74 * Math.sin(ang);
    if (kl > 0) {
      c.strokeStyle = gradLine(c, x, y, ex, ey, rgba(C.brand, 0.25), rgba(C.navy, 0.9)); c.lineWidth = 2.5; polyPartial(c, [[x, y], [ex, ey]], kl);
      const kp = P(k, 2.2, 2.8); if (kp > 0) { const u = frac(t * 0.5 + i * 0.29); c.globalAlpha = kp * Math.sin(Math.PI * u); dot(c, lerp(x, ex, u), lerp(y, ey, u), 4.5, C.brand); c.globalAlpha = 1; }
    }
    dot(c, x, y, 14 * ka, '#fff'); ring(c, x, y, 14 * ka, C.brand, 3.5); dot(c, x, y, 5 * ka, C.brand);
    const kb = P(k, 1.4 + i * 0.05, 2.2 + i * 0.05, E.outBack), bh = 44 * p.h * kb;
    if (kb > 0) { rr(c, x + 22, y + 14 - bh, 12, bh, 4); c.fillStyle = C.sky; c.fill(); }
  });
  const kc = P(k, 0.3, 1.0, E.outBack);
  if (kc > 0) {
    glow(c, O[0], O[1], 150 * kc, C.brand, 0.6);
    const g = c.createLinearGradient(O[0] - 70, O[1] - 70, O[0] + 70, O[1] + 70); g.addColorStop(0, C.brand); g.addColorStop(1, C.navy);
    c.fillStyle = g; c.beginPath(); c.arc(O[0], O[1], 74 * kc, 0, 7); c.fill();
    label(c, 'Metas', O[0], O[1] - 14, { size: 26, w: 800, col: '#fff', a: kc });
    label(c, 'Rumbo 35', O[0], O[1] + 17, { size: 20, w: 600, col: 'rgba(255,255,255,0.9)', a: kc });
  }
  const la = P(k, 2.4, 3.0);
  if (la > 0) {
    c.globalAlpha = la;
    dot(c, 110, 652, 11, '#fff'); ring(c, 110, 652, 11, C.brand, 3);
    rr(c, 360, 638, 11, 28, 3); c.fillStyle = C.sky; c.fill();
    c.strokeStyle = C.navy; c.lineWidth = 3; c.beginPath(); c.moveTo(610, 652); c.lineTo(640, 652); c.stroke();
    c.globalAlpha = 1;
    label(c, 'Dotación crítica', 132, 652, { size: 20, w: 600, col: C.ink2, align: 'left', a: la });
    label(c, 'Componente variable', 382, 652, { size: 20, w: 600, col: C.ink2, align: 'left', a: la });
    label(c, 'Metas estratégicas', 652, 652, { size: 20, w: 600, col: C.ink2, align: 'left', a: la });
  }
};

/* ── Ola 3 · 2 · Formación y desarrollo (globo) ── */
const GLOBE = (() => {
  const d2r = Math.PI / 180, dots = window.GLOBE_DOTS || [];
  // Chile: puntos de tierra más occidentales de Sudamérica entre 17,5°S y 56°S
  const west = {};
  dots.forEach(([la, lo]) => { if (la < -17 && la > -56 && lo > -82 && lo < -60) west[la] = Math.min(west[la] ?? 0, lo); });
  const pts = dots.map(([la, lo]) => ({ la: la * d2r, lo: lo * d2r, cl: la < -17 && la > -56 && lo > -82 && lo <= (west[la] ?? -999) + 2.0 }));
  return { pts, d2r };
})();
function gproj(la, lo, l0, p0, R, h = 0) {
  const cc = Math.sin(p0) * Math.sin(la) + Math.cos(p0) * Math.cos(la) * Math.cos(lo - l0);
  const x = Math.cos(la) * Math.sin(lo - l0), y = Math.cos(p0) * Math.sin(la) - Math.sin(p0) * Math.cos(la) * Math.cos(lo - l0);
  return [x * R * (1 + h), -y * R * (1 + h), cc];
}
function slerp(a, b, u) { // a,b = [lat,lon] rad
  const v = ([la, lo]) => [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)];
  const A = v(a), B = v(b), d = Math.acos(clamp(A[0] * B[0] + A[1] * B[1] + A[2] * B[2], -1, 1)), s = Math.sin(d) || 1;
  const f1 = Math.sin((1 - u) * d) / s, f2 = Math.sin(u * d) / s, p = A.map((x, i) => f1 * x + f2 * B[i]);
  return [[Math.asin(p[2]), Math.atan2(p[1], p[0])], d];
}
V.globo = (c, k, t) => {
  const d = GLOBE.d2r, O = [450, 318], R = 292;
  const ka = P(k, 0, 1.2, E.outCubic), sc = 0.9 + 0.1 * ka;
  const l0 = (-62 + 18 * E.inOutSine(clamp(k / 10)) + 2 * Math.sin(t * 0.1)) * d, p0 = -12 * d;
  c.save(); c.translate(O[0], O[1]); c.scale(sc, sc); c.globalAlpha = ka;
  const g = c.createRadialGradient(-90, -110, 20, 0, 0, R * 1.05); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.75, '#F1F6FD'); g.addColorStop(1, '#E3EDFA');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, R, 0, 7); c.fill();
  c.strokeStyle = '#DCE7F5'; c.lineWidth = 2; c.stroke();
  for (const p of GLOBE.pts) {
    const [x, y, cc] = gproj(p.la, p.lo, l0, p0, R); if (cc <= 0.02) continue;
    if (p.cl) continue;
    c.fillStyle = mix('#DCE8F7', '#7FB3EE', Math.pow(cc, 1.4)); c.fillRect(x - 2.1, y - 2.1, 4.2, 4.2);
  }
  const kc = P(k, 0.8, 1.6);
  for (const p of GLOBE.pts) { if (!p.cl) continue; const [x, y, cc] = gproj(p.la, p.lo, l0, p0, R); if (cc <= 0.02) continue; c.fillStyle = mix('#7FB3EE', C.navy, kc); c.beginPath(); c.arc(x, y, 2.6 + 1.4 * kc, 0, 7); c.fill(); }
  // arcos desde Santiago (destinos ilustrativos, sin rotular)
  const src = [-33.45 * d, -70.67 * d];
  const dst = [[19.4, -99.1], [4.7, -74.1], [-23.5, -46.6], [40.4, -3.7], [-34.6, -58.4], [25.8, -80.2], [-12.0, -77.0]];
  dst.forEach(([la, lo], i) => {
    const kk = P(k, 1.6 + i * 0.25, 3.0 + i * 0.25, E.inOutCubic); if (kk <= 0) return;
    const b = [la * d, lo * d], [, ang] = slerp(src, b, 0), pts = [];
    for (let j = 0; j <= 48; j++) { const u = j / 48, [q, dd] = slerp(src, b, u); const h = 0.22 * dd * Math.sin(Math.PI * u); const [x, y, cc] = gproj(q[0], q[1], l0, p0, R, h); pts.push([x, y, cc + h]); }
    c.strokeStyle = gradLine(c, pts[0][0], pts[0][1], pts[48][0], pts[48][1], C.navy, C.sky); c.lineWidth = 3; c.lineCap = 'round';
    const vis = pts.filter(p => p[2] > -0.05);
    const e = polyPartial(c, vis.map(p => [p[0], p[1]]), kk);
    if (kk >= 1) { const p = vis[vis.length - 1]; const pu = frac(t * 0.7 + i * 0.3); c.globalAlpha = (1 - pu) * ka; ring(c, p[0], p[1], 5 + pu * 16, C.sky, 2); c.globalAlpha = ka; dot(c, p[0], p[1], 5, C.brand); }
    else dot(c, e[0], e[1], 5, C.brand);
    if (kk >= 1) { const u = frac(t * 0.35 + i * 0.17), p = pointAt(vis.map(p => [p[0], p[1]]), u); dot(c, p[0], p[1], 3.5, '#fff'); }
  });
  const [sx, sy, scc] = gproj(src[0], src[1], l0, p0, R);
  if (scc > 0 && kc > 0) {
    const pu = frac(t * 0.8); c.globalAlpha = ka * (1 - pu); ring(c, sx, sy, 8 + pu * 26, C.brand, 3); c.globalAlpha = ka;
    dot(c, sx, sy, 9 * kc, C.navy); dot(c, sx, sy, 3.5 * kc, '#fff');
    c.font = '700 22px InterV'; const w = c.measureText('Chile').width + 28;
    rr(c, sx - w - 20, sy - 18, w, 36, 18); c.fillStyle = rgba(C.navy, kc); c.fill();
    label(c, 'Chile', sx - 20 - w / 2, sy + 1, { size: 22, w: 700, col: '#fff', a: kc });
  }
  c.restore();
};
