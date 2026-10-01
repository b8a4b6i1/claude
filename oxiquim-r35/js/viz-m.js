'use strict';
/* Visualizaciones para la versión móvil 9:16. Lienzo común 920×760, rótulos ≥ 26 px, trazos ≥ 5 px.
   Reutiliza helpers de core.js y viz.js (spline, gradLine, frac, pulseY, slerp, gproj, GLOBE). */
const VM = {};
const MW = 920, MH = 760;

/* ── Ola 1 · Gobierno de decisiones de personas ── */
VM.gobierno = (c, k, t) => {
  const F = [380, 360], D = [790, 360];
  const N = bez([70, 170], [240, 170], [270, 360], F), Pe = bez([70, 550], [240, 550], [270, 360], F);
  c.lineCap = 'round'; c.lineJoin = 'round';
  dot(c, 70, 170, 13 * P(k, 0, 0.5, E.outBack), C.navy); dot(c, 70, 550, 13 * P(k, 0.1, 0.6, E.outBack), C.sky);
  c.lineWidth = 9; c.strokeStyle = C.navy; polyPartial(c, N, P(k, 0.2, 1.3, E.inOutCubic));
  c.strokeStyle = C.sky; polyPartial(c, Pe, P(k, 0.35, 1.45, E.inOutCubic));
  const kB = P(k, 1.5, 2.7, E.inOutCubic), xe = lerp(F[0], D[0] - 50, kB);
  if (kB > 0) for (const [sg, col] of [[1, C.navy], [-1, C.sky]]) {
    const pts = []; for (let x = F[0]; x <= xe; x += 4) { const amp = 13 * Math.min(1, (x - F[0]) / 50); pts.push([x, F[1] + sg * amp * Math.sin((x - F[0]) / 50 - t * 2.2)]); }
    if (pts.length > 1) { c.strokeStyle = col; c.lineWidth = 9; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); }
  }
  const fa = P(k, 2.7, 3.3);
  if (fa > 0) for (let j = 0; j < 3; j++) { const u = frac(t * 0.45 + j / 3), a = pointAt(N, u), b = pointAt(Pe, u); c.globalAlpha = fa * Math.sin(Math.PI * u); dot(c, a[0], a[1], 7, '#fff'); dot(c, b[0], b[1], 7, '#fff'); c.globalAlpha = 1; }
  const kF = P(k, 1.25, 1.85, E.outBack);
  if (kF > 0) { const pr = P(k, 1.3, 2.4, E.outCubic); c.globalAlpha = 1 - pr; ring(c, F[0], F[1], 28 + 55 * pr, C.sky, 4); c.globalAlpha = 1; dot(c, F[0], F[1], 28 * kF, '#fff'); ring(c, F[0], F[1], 28 * kF, C.navy, 7); dot(c, F[0], F[1], 10 * kF, C.brand); }
  const kD = P(k, 2.6, 3.3, E.outBack);
  if (kD > 0) {
    glow(c, D[0], D[1], 130 * kD, C.sky, 0.8);
    const g = c.createLinearGradient(D[0] - 50, D[1] - 50, D[0] + 50, D[1] + 50); g.addColorStop(0, C.brand); g.addColorStop(1, C.navy);
    c.fillStyle = g; c.beginPath(); c.arc(D[0], D[1], 54 * kD, 0, 7); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 9; polyPartial(c, [[D[0] - 21, D[1] + 2], [D[0] - 6, D[1] + 17], [D[0] + 22, D[1] - 15]], P(k, 2.9, 3.5, E.outCubic));
  }
  label(c, 'Negocio', 50, 110, { size: 34, w: 700, col: C.navy, align: 'left', a: P(k, 0.3, 0.9) });
  label(c, 'Personas', 50, 612, { size: 34, w: 700, col: C.brand, align: 'left', a: P(k, 0.45, 1.05) });
  label(c, 'Formulación', F[0], F[1] + 74, { size: 30, w: 600, col: C.gray, a: P(k, 1.4, 2.0) });
  label(c, 'Decisión', D[0], D[1] + 98, { size: 34, w: 700, col: C.ink, a: P(k, 2.8, 3.4) });
};

/* ── Ola 1 · Rediseño de la gestión del desempeño ── */
VM.desempeno = (c, k, t) => {
  c.lineCap = 'round';
  const root = [460, 60], L1 = [250, 460, 670].map(x => [x, 160]), L2 = [190, 310, 400, 520, 610, 730].map(x => [x, 245]);
  const kb = P(k, 2.3, 3.1, E.outCubic);
  const pill = (x, y, w, h, kk, kbb) => {
    if (kk <= 0) return;
    c.save(); c.globalAlpha = kk; c.translate(x, y); c.scale(0.6 + 0.4 * kk, 0.6 + 0.4 * kk);
    rr(c, -w / 2, -h / 2, w, h, h / 2); c.fillStyle = C.navy; c.fill();
    if (kbb > 0) { c.save(); rr(c, -w / 2, -h / 2, w, h, h / 2); c.clip(); c.fillStyle = C.sky; c.fillRect(w / 2 - w * 0.4 * kbb, -h / 2, w * 0.4 * kbb, h); c.restore(); }
    c.restore();
  };
  const link = (a, b, kk) => { if (kk <= 0) return; c.strokeStyle = rgba(C.navy, 0.3); c.lineWidth = 3.5; polyPartial(c, bez([a[0], a[1] + 20], [a[0], (a[1] + b[1]) / 2], [b[0], (a[1] + b[1]) / 2], [b[0], b[1] - 16], 24), kk); };
  L1.forEach((p, i) => link(root, p, P(k, 0.5 + i * 0.08, 1.0 + i * 0.08)));
  L2.forEach((p, i) => link(L1[Math.floor(i / 2)], p, P(k, 0.9 + i * 0.06, 1.4 + i * 0.06)));
  pill(root[0], root[1], 300, 62, P(k, 0.15, 0.7, E.outCubic), 0);
  label(c, 'KPI del negocio', root[0], root[1] + 1, { size: 30, w: 700, col: '#fff', a: P(k, 0.3, 0.8) });
  L1.forEach((p, i) => pill(p[0], p[1], 130, 40, P(k, 0.8 + i * 0.08, 1.3 + i * 0.08, E.outCubic), kb));
  L2.forEach((p, i) => pill(p[0], p[1], 70, 30, P(k, 1.2 + i * 0.06, 1.7 + i * 0.06, E.outCubic), kb));
  const kc = P(k, 1.6, 2.2, E.inOutCubic);
  if (kc > 0) { c.strokeStyle = rgba(C.brand, 0.6); c.lineWidth = 4; c.setLineDash([3, 11]); polyPartial(c, [[460, 275], [460, 340]], kc); c.setLineDash([]); if (kc > 0.98) arrowHead(c, 460, 350, Math.PI / 2, 14, C.brand); }
  const O = [460, 520], R = 140, sweep = P(k, 0.8, 2.4, E.inOutCubic) * Math.PI * 2, th = -Math.PI / 2 + t * 0.55;
  c.globalAlpha = P(k, 0.6, 1.2); ring(c, O[0], O[1], R, '#E4ECF7', 30); c.globalAlpha = 1;
  if (sweep > 0) {
    c.lineWidth = 30; c.lineCap = 'round';
    c.strokeStyle = C.navy; c.beginPath(); c.arc(O[0], O[1], R, th, th + sweep / 2); c.stroke();
    c.strokeStyle = C.sky; c.beginPath(); c.arc(O[0], O[1], R, th + sweep / 2, th + sweep); c.stroke();
    const ea = th + sweep; arrowHead(c, O[0] + R * Math.cos(ea), O[1] + R * Math.sin(ea), ea + Math.PI / 2, 20, '#fff');
  }
  label(c, 'Ciclo de', O[0], O[1] - 20, { size: 34, w: 700, col: C.ink, a: P(k, 1.0, 1.6) });
  label(c, 'evaluación', O[0], O[1] + 20, { size: 34, w: 700, col: C.ink, a: P(k, 1.0, 1.6) });
  const la = P(k, 2.4, 3.0);
  dot(c, 40, 470, 12 * la, C.navy); label(c, 'KPI', 62, 470, { size: 30, w: 700, col: C.ink2, align: 'left', a: la });
  dot(c, 690, 470, 12 * la, C.sky); label(c, 'Dimensión', 712, 456, { size: 30, w: 700, col: C.ink2, align: 'left', a: la }); label(c, 'conductual', 712, 492, { size: 30, w: 700, col: C.ink2, align: 'left', a: la });
};

/* ── Ola 1 · Pulso de clima ── */
VM.clima = (c, k, t) => {
  const ka = P(k, 0.1, 0.8, E.outCubic), tx = 120;
  c.globalAlpha = ka;
  rr(c, tx - 36, 110, 72, 470, 36); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = '#D6E2F2'; c.lineWidth = 4; c.stroke();
  for (let i = 0; i < 7; i++) { c.strokeStyle = '#C9D7EA'; c.lineWidth = 3; c.beginPath(); c.moveTo(tx + 50, 150 + i * 60); c.lineTo(tx + 70, 150 + i * 60); c.stroke(); }
  const lvl = P(k, 0.5, 1.8, E.outCubic) * (0.66 + 0.07 * Math.sin(t * 1.3) + 0.025 * Math.sin(t * 3.7));
  const top = 570 - 440 * lvl;
  const g = c.createLinearGradient(0, 570, 0, 120); g.addColorStop(0, C.brand); g.addColorStop(1, C.sky);
  rr(c, tx - 21, top, 42, 600 - top, 21); c.fillStyle = g; c.fill();
  dot(c, tx, 625, 58, C.brand); dot(c, tx - 15, 610, 13, 'rgba(255,255,255,0.35)');
  c.globalAlpha = 1;
  label(c, 'Compromiso', 40, 60, { size: 32, w: 700, col: C.ink2, align: 'left', a: ka });
  const x0 = 270, x1 = 890, y0 = 330, A = 150;
  c.globalAlpha = P(k, 0.3, 1.0);
  for (const y of [y0 - 160, y0, y0 + 160]) { c.strokeStyle = '#E8EEF7'; c.lineWidth = 3; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke(); }
  c.globalAlpha = 1;
  const rev = P(k, 0.5, 1.8, E.inOutCubic), xe = lerp(x0, x1, rev);
  if (rev > 0) {
    c.lineWidth = 8; c.lineJoin = 'round'; c.lineCap = 'round';
    c.strokeStyle = gradLine(c, x0, 0, x1, 0, rgba(C.sky, 0.25), C.brand);
    c.beginPath(); for (let x = x0; x <= xe; x += 2) { const y = y0 - A * pulseY((x - x0) / 230 - t * 0.85); x === x0 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke();
    const yy = y0 - A * pulseY((xe - x0) / 230 - t * 0.85);
    glow(c, xe, yy, 60, C.sky, 1); dot(c, xe, yy, 12, C.brand); dot(c, xe, yy, 5, '#fff');
  }
  const ka2 = P(k, 1.4, 2.0);
  c.globalAlpha = ka2; c.strokeStyle = C.gray; c.lineWidth = 4; c.beginPath(); c.moveTo(x0, 600); c.lineTo(x1 - 10, 600); c.stroke(); arrowHead(c, x1, 600, 0, 14, C.gray); c.globalAlpha = 1;
  label(c, 'Transformación', x0, 650, { size: 30, w: 600, col: C.gray, align: 'left', a: ka2 });
  label(c, 'Termómetro continuo', x1, 60, { size: 30, w: 700, col: C.brand, align: 'right', a: P(k, 1.6, 2.2) });
};

/* ── Ola 1 · Institucionalizar la gestión del cambio ── */
const CAMBIO_M = (() => {
  const xs = [75, 171, 267, 363, 459, 555, 651, 747, 843], ys = [360, 490, 360, 230, 360, 490, 620, 490, 360];
  const blocks = xs.map((cx, i) => [cx - 38, ys[i] - 26, 76]);
  return { blocks, path: spline([[15, 425], ...xs.map((x, i) => [x, ys[i]]), [905, 425]], 14) };
})();
VM.cambio = (c, k, t) => {
  const cols = [[30, 173, 'Ola 1'], [173, 460, 'Ola 2'], [460, 890, 'Ola 3']], ka = P(k, 0.1, 0.8);
  cols.forEach(([a, b, n], i) => {
    label(c, n.toUpperCase(), (a + b) / 2, 60, { size: 28, w: 800, col: C.brand, a: ka, track: 3 });
    rr(c, a + 5, 100, b - a - 10, 7, 3.5); c.fillStyle = rgba([C.navy, C.brand, C.sky][i], ka); c.fill();
    if (i) { c.globalAlpha = ka; c.strokeStyle = '#D3DDEB'; c.lineWidth = 3; c.setLineDash([5, 10]); c.beginPath(); c.moveTo(a, 140); c.lineTo(a, 660); c.stroke(); c.setLineDash([]); c.globalAlpha = 1; }
  });
  const kt = P(k, 1.0, 3.6, E.inOutCubic);
  CAMBIO_M.blocks.forEach(([x, y, w], i) => {
    const kk = P(k, 0.2 + i * 0.1, 0.8 + i * 0.1, E.outCubic); if (kk <= 0) return;
    const reached = (x + w / 2 - 15) / 890 < kt;
    c.save(); c.globalAlpha = kk; c.translate(0, (1 - kk) * 18);
    rr(c, x, y, w, 52, 14); c.fillStyle = reached ? C.mist : '#fff'; c.fill(); c.strokeStyle = reached ? rgba(C.brand, 0.6) : '#D3DDEB'; c.lineWidth = 3; c.stroke();
    c.restore();
  });
  if (kt > 0) {
    c.lineWidth = 8; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = gradLine(c, 15, 0, 905, 0, C.navy, C.sky);
    const e = polyPartial(c, CAMBIO_M.path, kt);
    if (kt < 1) { glow(c, e[0], e[1], 50, C.sky); dot(c, e[0], e[1], 11, C.brand); }
  }
  const fa = P(k, 3.6, 4.2);
  for (let j = 0; j < 4; j++) { const u = frac(t * 0.12 + j / 4), p = pointAt(CAMBIO_M.path, u); c.globalAlpha = fa; dot(c, p[0], p[1], 9, '#fff'); ring(c, p[0], p[1], 9, C.brand, 4); c.globalAlpha = 1; }
  label(c, 'Proyectos', 40, 715, { size: 28, w: 600, col: C.gray, align: 'left', a: P(k, 1.0, 1.6) });
  label(c, 'Acompañamiento transversal', 890, 715, { size: 30, w: 700, col: C.brand, align: 'right', a: P(k, 2.4, 3.0) });
};

/* ── Ola 2 · Cultura y valores ── */
const CULT_M = (() => { const r = rng(7), o = []; for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) o.push({ x: 70 + j * 82, y: 130 + i * 76, a0: r() * Math.PI * 2, d: r() }); return o; })();
VM.cultura = (c, k, t) => {
  const T = [800, 358];
  label(c, 'Valores corporativos', 40, 55, { size: 32, w: 700, col: C.ink2, align: 'left', a: P(k, 0.2, 0.8) });
  CULT_M.forEach((p, i) => {
    const ka = P(k, 0.05 + i * 0.01, 0.6 + i * 0.01, E.outCubic); if (ka <= 0) return;
    let da = Math.atan2(T[1] - p.y, T[0] - p.x) - p.a0; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
    const kr = P(k, 0.8 + p.d * 0.6 + (p.x / 600) * 0.4, 2.0 + p.d * 0.6 + (p.x / 600) * 0.4, E.inOutCubic);
    const ang = p.a0 + da * kr + 0.04 * Math.sin(t * 2 + i) * kr, col = mix('#B7C3D4', p.x < 300 ? C.navy : C.brand, kr);
    c.save(); c.globalAlpha = ka; c.translate(p.x, p.y); c.rotate(ang);
    c.strokeStyle = col; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(-19, 0); c.lineTo(11, 0); c.stroke(); arrowHead(c, 18, 0, 0, 13, col); c.restore();
  });
  const kt = P(k, 1.8, 2.5, E.outBack);
  if (kt > 0) { glow(c, T[0], T[1], 160 * kt, C.sky); dot(c, T[0], T[1], 72 * kt, C.brand); label(c, 'R35', T[0], T[1] + 2, { size: 40, w: 800, col: '#fff', a: kt }); }
  const kc = P(k, 2.4, 3.1, E.outCubic);
  [['Internacionalización', 210], ['Nuevos negocios', 620]].forEach(([s, x], i) => {
    const kk = P(k, 2.4 + i * 0.15, 3.1 + i * 0.15, E.outCubic); if (kk <= 0) return;
    c.globalAlpha = kc * 0.55; c.strokeStyle = C.brand; c.lineWidth = 3; c.setLineDash([4, 9]);
    c.beginPath(); c.moveTo(x, 662); c.bezierCurveTo(x, 560, T[0], 560, T[0], T[1] + 78); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
    c.save(); c.globalAlpha = kk; c.translate(0, (1 - kk) * 20);
    c.font = '700 30px InterV'; const w = c.measureText(s).width + 52;
    rr(c, x - w / 2, 664, w, 64, 32); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = '#BFD6F2'; c.lineWidth = 3; c.stroke();
    label(c, s, x, 697, { size: 30, w: 700, col: C.deep }); c.restore();
  });
};

/* ── Ola 2 · Planificación estratégica de personas ── */
const PLAN_M = (() => {
  const r = 33, w = Math.sqrt(3) * r, seeds = [[240, 190], [600, 175], [255, 470], [610, 480]], cells = [], rnd = rng(11);
  for (let row = 0; row < 12; row++) for (let col = 0; col < 13; col++) {
    const x = 70 + col * w + (row % 2) * w / 2, y = 50 + row * r * 1.5;
    if (x > 880 || y > 640) continue;
    let bi = 0, bd = 1e9; seeds.forEach((s, i) => { const d = Math.hypot(s[0] - x, s[1] - y) * (0.85 + 0.3 * rnd()); if (d < bd) { bd = d; bi = i; } });
    cells.push({ x, y, u: bi, d: bd, crit: false });
  }
  seeds.forEach((s, i) => { const mine = cells.filter(c => c.u === i && c.d < 130).sort((a, b) => a.d - b.d); [0, 3].forEach(j => { if (mine[j]) mine[j].crit = true; }); });
  return { r, cells };
})();
VM.planificacion = (c, k, t) => {
  const tints = [C.navy, C.brand, C.blue, C.sky], crit = [], RB = 128, RP = 178;
  PLAN_M.cells.forEach(p => {
    const base = p.d < RB, proj = !base && p.d < RP;
    if (!base && !proj) { const ka = P(k, 0.1, 0.8); if (ka > 0) dot(c, p.x, p.y, 3.2, rgba('#B9C6D8', 0.7 * ka)); return; }
    if (base) {
      const kk = P(k, 0.2 + p.d / RB * 0.9 + p.u * 0.12, 0.7 + p.d / RB * 0.9 + p.u * 0.12, E.outBack); if (kk <= 0) return;
      hexPath(c, p.x, p.y, (PLAN_M.r - 3.5) * kk); c.fillStyle = rgba(tints[p.u], 0.3); c.fill();
      if (p.crit) crit.push(p);
    } else {
      const kk = P(k, 1.7 + (p.d - RB) / 50 * 0.8 + p.u * 0.1, 2.2 + (p.d - RB) / 50 * 0.8 + p.u * 0.1, E.outCubic); if (kk <= 0) return;
      c.globalAlpha = kk; hexPath(c, p.x, p.y, PLAN_M.r - 6); c.strokeStyle = tints[p.u]; c.lineWidth = 3; c.setLineDash([5, 5]); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
    }
  });
  const kn = P(k, 3.3, 4.3, E.inOutCubic);
  if (kn > 0) { c.strokeStyle = rgba(C.navy, 0.4); c.lineWidth = 4; for (let i = 0; i < crit.length; i++) for (let j = i + 1; j < crit.length; j++) { const a = crit[i], b = crit[j]; if (Math.hypot(a.x - b.x, a.y - b.y) > 380) continue; polyPartial(c, [[a.x, a.y], [b.x, b.y]], kn); } }
  crit.forEach((p, i) => {
    const kk = P(k, 2.9 + i * 0.07, 3.5 + i * 0.07, E.outBack); if (kk <= 0) return;
    const pu = frac(t * 0.6 + i * 0.13);
    c.globalAlpha = (1 - pu) * 0.6 * kk; hexPath(c, p.x, p.y, PLAN_M.r * (1 + pu * 0.8)); c.strokeStyle = C.sky; c.lineWidth = 3; c.stroke(); c.globalAlpha = 1;
    hexPath(c, p.x, p.y, (PLAN_M.r - 2) * kk); c.fillStyle = C.navy; c.fill(); dot(c, p.x, p.y, 7 * kk, '#fff');
  });
  const la = P(k, 3.6, 4.2);
  if (la > 0) {
    c.globalAlpha = la;
    hexPath(c, 52, 712, 17); c.fillStyle = rgba(C.brand, 0.3); c.fill();
    hexPath(c, 402, 712, 14); c.strokeStyle = C.brand; c.lineWidth = 3; c.setLineDash([4, 4]); c.stroke(); c.setLineDash([]);
    hexPath(c, 632, 712, 17); c.fillStyle = C.navy; c.fill();
    c.globalAlpha = 1;
    label(c, 'Dotación por unidad', 78, 712, { size: 28, w: 600, col: C.ink2, align: 'left', a: la });
    label(c, 'Proyección', 426, 712, { size: 28, w: 600, col: C.ink2, align: 'left', a: la });
    label(c, 'Roles críticos', 658, 712, { size: 28, w: 600, col: C.ink2, align: 'left', a: la });
  }
};

/* ── Ola 2 · Modelo de talento y liderazgo ── */
const LID_M = (() => { const r = rng(23), pts = []; while (pts.length < 40) { const p = { x: 60 + r() * 290, y: 120 + r() * 520, ph: r() * 6.28 }; if (pts.every(q => Math.hypot(q.x - p.x, q.y - p.y) > 44)) pts.push(p); } return pts; })();
const LID_ML = [3, 10, 17, 24, 33];
VM.liderazgo = (c, k, t) => {
  const slots = [150, 265, 380, 495, 610], H = [[760, 190], [760, 385], [760, 580]];
  const lp = LID_ML.map((idx, j) => { const p = LID_M[idx], km = P(k, 1.0 + j * 0.08, 2.0 + j * 0.08, E.inOutCubic); return [lerp(p.x, 450, km), lerp(p.y, slots[j], km)]; });
  const kt = P(k, 1.8, 2.6);
  LID_M.forEach((p, i) => {
    if (LID_ML.includes(i)) return;
    const ka = P(k, 0.05 + i * 0.01, 0.5 + i * 0.01); if (ka <= 0) return;
    const x = p.x + 4 * Math.sin(t * 0.8 + p.ph), y = p.y + 4 * Math.cos(t * 0.7 + p.ph);
    if (kt > 0) { let bj = 0, bd = 1e9; lp.forEach((q, j) => { const d = Math.hypot(q[0] - x, q[1] - y); if (d < bd) { bd = d; bj = j; } }); c.strokeStyle = rgba(C.brand, 0.2 * kt); c.lineWidth = 2.5; c.beginPath(); c.moveTo(x, y); c.lineTo(lp[bj][0], lp[bj][1]); c.stroke(); }
    dot(c, x, y, 11 * ka, '#BFCCE0');
  });
  const kh = P(k, 1.9, 2.5, E.outCubic);
  label(c, 'Negocios futuros', 760, 70, { size: 32, w: 700, col: C.ink2, a: kh });
  H.forEach(([x, y], i) => {
    if (kh <= 0) return;
    const kf = P(k, 3.0 + i * 0.15, 3.6 + i * 0.15, E.outCubic);
    if (kf > 0) glow(c, x, y, 120 * kf, C.sky, 0.7);
    if (kf > 0) { hexPath(c, x, y, 70 * kh, 0); c.fillStyle = rgba(C.brand, 0.9 * kf); c.fill(); }
    c.globalAlpha = kh; c.strokeStyle = C.brand; c.lineWidth = 5; c.setLineDash(kf > 0 ? [] : [9, 9]); hexPath(c, x, y, 70 * kh, 0); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
  });
  lp.forEach(([x, y], j) => {
    const hi = j < 2 ? 0 : j < 4 ? 1 : 2, kl = P(k, 2.3 + j * 0.1, 3.1 + j * 0.1, E.inOutCubic);
    if (kl > 0) { c.strokeStyle = rgba(C.brand, 0.75); c.lineWidth = 5; c.lineCap = 'round'; polyPartial(c, bez([x + 24, y], [x + 110, y], [H[hi][0] - 160, H[hi][1]], [H[hi][0] - 72, H[hi][1]], 24), kl); }
    const kg = P(k, 0.5 + j * 0.12, 1.4 + j * 0.12, E.outBack), r = lerp(11, 24, kg);
    if (kg > 0) { c.globalAlpha = kg; ring(c, x, y, r + 13, rgba(C.sky, 0.6), 4); c.globalAlpha = 1; }
    dot(c, x, y, r, kg > 0 ? mix('#BFCCE0', C.navy, kg) : '#BFCCE0');
  });
  label(c, 'Líderes', 450, 712, { size: 32, w: 700, col: C.ink2, a: P(k, 1.8, 2.4) });
};

/* ── Ola 2 · Atracción, selección y movilidad ── */
VM.atraccion = (c, k, t) => {
  const ka = [P(k, 0.1, 0.7), P(k, 0.4, 1.0), P(k, 0.7, 1.3)];
  label(c, 'Velocidad de incorporación', 40, 50, { size: 32, w: 700, col: C.ink2, align: 'left', a: ka[0] });
  if (ka[0] > 0) {
    c.globalAlpha = ka[0]; c.strokeStyle = '#DCE5F1'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(50, 145); c.lineTo(760, 145); c.stroke(); c.globalAlpha = 1;
    hexPath(c, 836, 145, 42); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = C.brand; c.lineWidth = 5; c.stroke(); dot(c, 836, 145, 11, C.brand);
    if (k > 0.6) {
      const u = frac((t - 0.3) / 1.6), pos = E.inOutExpo(clamp(u / 0.8)), x = lerp(50, 790, pos);
      for (let i = 1; i <= 9; i++) { const xx = x - i * 30 * Math.min(1, Math.sin(Math.PI * clamp(u / 0.8)) * 1.6); if (xx > 50) { c.globalAlpha = (1 - i / 10) * 0.45; dot(c, xx, 145, 14 - i * 0.9, C.sky); } }
      c.globalAlpha = 1; dot(c, x, 145, 15, C.brand);
      const hit = clamp((u - 0.8) / 0.2); if (hit > 0) { c.globalAlpha = 1 - hit; hexPath(c, 836, 145, 42 + hit * 30); c.strokeStyle = C.sky; c.lineWidth = 4; c.stroke(); c.globalAlpha = 1; }
    }
    label(c, 'Rol clave', 836, 220, { size: 28, w: 600, col: C.gray, a: ka[0] });
  }
  label(c, 'Sucesión', 40, 300, { size: 32, w: 700, col: C.ink2, align: 'left', a: ka[1] });
  if (ka[1] > 0) {
    c.globalAlpha = ka[1];
    const u = frac((t - 0.5) / 3.4), m = E.inOutCubic(clamp((u - 0.12) / 0.32)), fade = 1 - clamp((u - 0.86) / 0.14), Y = 390;
    ring(c, 460, Y, 44, '#D3DDEB', 4);
    c.setLineDash([4, 10]); c.strokeStyle = rgba(C.brand, 0.45); c.lineWidth = 3; c.beginPath(); c.moveTo(160, Y); c.lineTo(800, Y); c.stroke(); c.setLineDash([]);
    c.globalAlpha = ka[1] * fade; dot(c, lerp(460, 800, m), Y, 26, C.navy); dot(c, lerp(160, 460, m), Y, 26, C.sky);
    c.globalAlpha = ka[1] * (1 - fade); dot(c, 460, Y, 26, C.navy); dot(c, 160, Y, 26 * (1 - fade), C.sky);
    c.globalAlpha = 1;
  }
  label(c, 'Planes de carrera', 40, 530, { size: 32, w: 700, col: C.ink2, align: 'left', a: ka[2] });
  if (ka[2] > 0) {
    const st = [[60, 720], [255, 720], [255, 673], [450, 673], [450, 626], [645, 626], [645, 580], [840, 580]];
    c.strokeStyle = gradLine(c, 60, 0, 840, 0, C.sky, C.navy); c.lineWidth = 8; c.lineJoin = 'round'; c.lineCap = 'round';
    polyPartial(c, st, P(k, 0.8, 1.8, E.inOutCubic));
    if (k > 1.8) { const u = frac((t - 0.2) / 3.0), p = pointAt(st, E.inOutCubic(clamp(u / 0.85))); c.globalAlpha = 1 - clamp((u - 0.9) / 0.1); dot(c, p[0], p[1] - 22, 15, C.brand); c.globalAlpha = 1; }
    dot(c, 840, 580, 11 * ka[2], C.navy);
  }
};

/* ── Ola 3 · Compensaciones e incentivos ── */
VM.compensaciones = (c, k, t) => {
  const O = [460, 345];
  [[300, 0.06], [215, 0.1], [145, 0.18]].forEach(([r, a], i) => { const kk = P(k, 0.1 + i * 0.1, 0.9 + i * 0.1, E.outCubic); if (kk > 0) { c.fillStyle = rgba(C.sky, a * kk); c.beginPath(); c.arc(O[0], O[1], r * (0.8 + 0.2 * kk), 0, 7); c.fill(); } });
  const rot = t * 0.05;
  COMP.forEach((p, i) => {
    const ang = p.a + rot, x = O[0] + 370 * Math.cos(ang), y = O[1] + 270 * Math.sin(ang);
    const ka = P(k, 0.2 + i * 0.04, 0.8 + i * 0.04, E.outBack); if (ka <= 0) return;
    const kl = P(k, 0.7 + i * 0.07, 1.7 + i * 0.07, E.inOutCubic), ex = O[0] + 98 * Math.cos(ang), ey = O[1] + 98 * Math.sin(ang);
    if (kl > 0) {
      c.strokeStyle = gradLine(c, x, y, ex, ey, rgba(C.brand, 0.3), rgba(C.navy, 0.9)); c.lineWidth = 4; polyPartial(c, [[x, y], [ex, ey]], kl);
      const kp = P(k, 2.2, 2.8); if (kp > 0) { const u = frac(t * 0.5 + i * 0.29); c.globalAlpha = kp * Math.sin(Math.PI * u); dot(c, lerp(x, ex, u), lerp(y, ey, u), 7, C.brand); c.globalAlpha = 1; }
    }
    dot(c, x, y, 19 * ka, '#fff'); ring(c, x, y, 19 * ka, C.brand, 5); dot(c, x, y, 7 * ka, C.brand);
    const kb = P(k, 1.4 + i * 0.05, 2.2 + i * 0.05, E.outBack), bh = 58 * p.h * kb;
    if (kb > 0) { rr(c, x + 28, y + 18 - bh, 16, bh, 5); c.fillStyle = C.sky; c.fill(); }
  });
  const kc = P(k, 0.3, 1.0, E.outBack);
  if (kc > 0) {
    glow(c, O[0], O[1], 200 * kc, C.brand, 0.6);
    const g = c.createLinearGradient(O[0] - 98, O[1] - 98, O[0] + 98, O[1] + 98); g.addColorStop(0, C.brand); g.addColorStop(1, C.navy);
    c.fillStyle = g; c.beginPath(); c.arc(O[0], O[1], 98 * kc, 0, 7); c.fill();
    label(c, 'Metas', O[0], O[1] - 18, { size: 36, w: 800, col: '#fff', a: kc });
    label(c, 'Rumbo 35', O[0], O[1] + 22, { size: 28, w: 600, col: '#fff', a: kc });
  }
  const la = P(k, 2.4, 3.0);
  if (la > 0) {
    c.globalAlpha = la;
    dot(c, 50, 722, 14, '#fff'); ring(c, 50, 722, 14, C.brand, 4);
    rr(c, 342, 702, 14, 38, 4); c.fillStyle = C.sky; c.fill();
    c.globalAlpha = 1;
    label(c, 'Dotación crítica', 76, 722, { size: 27, w: 600, col: C.ink2, align: 'left', a: la });
    label(c, 'Componente variable', 368, 722, { size: 27, w: 600, col: C.ink2, align: 'left', a: la });
  }
};

/* ── Ola 3 · Formación y desarrollo (globo) ── */
VM.globo = (c, k, t) => {
  const d = GLOBE.d2r, O = [460, 370], R = 345;
  const ka = P(k, 0, 1.2, E.outCubic), sc = 0.9 + 0.1 * ka;
  const l0 = (-62 + 18 * E.inOutSine(clamp(k / 10)) + 2 * Math.sin(t * 0.1)) * d, p0 = -12 * d;
  c.save(); c.translate(O[0], O[1]); c.scale(sc, sc); c.globalAlpha = ka;
  const g = c.createRadialGradient(-100, -130, 20, 0, 0, R * 1.05); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.75, '#F1F6FD'); g.addColorStop(1, '#E1ECFA');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, R, 0, 7); c.fill(); c.strokeStyle = '#D6E3F4'; c.lineWidth = 3; c.stroke();
  for (const p of GLOBE.pts) { if (p.cl) continue; const [x, y, cc] = gproj(p.la, p.lo, l0, p0, R); if (cc <= 0.02) continue; c.fillStyle = mix('#D6E4F6', '#6FA6E6', Math.pow(cc, 1.4)); c.fillRect(x - 2.6, y - 2.6, 5.2, 5.2); }
  const kc = P(k, 0.8, 1.6);
  for (const p of GLOBE.pts) { if (!p.cl) continue; const [x, y, cc] = gproj(p.la, p.lo, l0, p0, R); if (cc <= 0.02) continue; c.fillStyle = mix('#6FA6E6', C.navy, kc); c.beginPath(); c.arc(x, y, 3.2 + 1.8 * kc, 0, 7); c.fill(); }
  const src = [-33.45 * d, -70.67 * d];
  [[19.4, -99.1], [4.7, -74.1], [-23.5, -46.6], [40.4, -3.7], [-34.6, -58.4], [25.8, -80.2], [-12.0, -77.0]].forEach(([la, lo], i) => {
    const kk = P(k, 1.6 + i * 0.25, 3.0 + i * 0.25, E.inOutCubic); if (kk <= 0) return;
    const b = [la * d, lo * d], pts = [];
    for (let j = 0; j <= 48; j++) { const u = j / 48, [q, dd] = slerp(src, b, u), h = 0.22 * dd * Math.sin(Math.PI * u), [x, y, cc] = gproj(q[0], q[1], l0, p0, R, h); pts.push([x, y, cc + h]); }
    c.strokeStyle = gradLine(c, pts[0][0], pts[0][1], pts[48][0], pts[48][1], C.navy, C.sky); c.lineWidth = 4.5; c.lineCap = 'round';
    const vis = pts.filter(p => p[2] > -0.05).map(p => [p[0], p[1]]), e = polyPartial(c, vis, kk);
    if (kk >= 1) { const p = vis[vis.length - 1], pu = frac(t * 0.7 + i * 0.3); c.globalAlpha = (1 - pu) * ka; ring(c, p[0], p[1], 7 + pu * 22, C.sky, 3); c.globalAlpha = ka; dot(c, p[0], p[1], 7, C.brand); const q = pointAt(vis, frac(t * 0.35 + i * 0.17)); dot(c, q[0], q[1], 5, '#fff'); }
    else dot(c, e[0], e[1], 7, C.brand);
  });
  const [sx, sy, scc] = gproj(src[0], src[1], l0, p0, R);
  if (scc > 0 && kc > 0) {
    const pu = frac(t * 0.8); c.globalAlpha = ka * (1 - pu); ring(c, sx, sy, 11 + pu * 34, C.brand, 4); c.globalAlpha = ka;
    dot(c, sx, sy, 12 * kc, C.navy); dot(c, sx, sy, 5 * kc, '#fff');
    c.font = '700 32px InterV'; const w = c.measureText('Chile').width + 40;
    rr(c, sx - w - 26, sy - 26, w, 52, 26); c.fillStyle = rgba(C.navy, kc); c.fill();
    label(c, 'Chile', sx - 26 - w / 2, sy + 1, { size: 32, w: 700, col: '#fff', a: kc });
  }
  c.restore();
};
