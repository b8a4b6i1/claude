'use strict';
/* Composición completa. renderFrame(t) es una función pura del tiempo: cada cuadro se puede
   renderizar de forma aislada (captura determinista cuadro a cuadro). */
const CT = window.CONTENT;
const STAGE = $('stage'), SCN = $('scenes');

/* ═════════ línea de tiempo (s) ═════════
   Duración de cada iniciativa = 1,2 s + caracteres(título+descripción)/18 → lectura holgada (≈15–17 car/s). */
const TL = (() => {
  const o = { A: [0, 5.6], B: [5.6, 24.0], C: [24.0, 31.0] };
  const slots = CT.olas.map(ol => ol.items.map(([a, b]) => Math.round((1.2 + (a.length + 1 + b.length) / 18) * 10) / 10));
  let s = 31.0;
  o.olas = slots.map((sl, i) => {
    const intro = s, items = intro + 5.0, starts = []; let x = items;
    sl.forEach(d => { starts.push(x); x += d; });
    const r = { intro, items, starts, durs: sl, end: x };
    s = x + (i < 2 ? 3.4 : 0); return r;
  });
  o.TR = [[o.olas[0].end, o.olas[1].intro], [o.olas[1].end, o.olas[2].intro]];
  o.OBJ = [o.olas[2].end, o.olas[2].end + 10.2];
  o.P5 = [o.OBJ[1], o.OBJ[1] + 4.5];
  o.P6 = [o.P5[1], o.P5[1] + 5.6];
  o.P7 = [o.P6[1], o.P6[1] + 6.0];
  o.Z = [o.P7[1], o.P7[1] + 7.4];
  o.END = o.Z[1];
  return o;
})();
window.TL = TL; window.DURATION = TL.END;

const scenes = [];
function scene(id, a, b, update, pre = 0.6, post = 0.8) {
  const root = el('div', 'scene'); root.id = id; SCN.appendChild(root);
  const s = { id, root, a, b, update, pre, post }; scenes.push(s); return s;
}

/* ═════════ fondo: olas suaves ═════════ */
const BG = $('bg').getContext('2d');
function bgAlpha(t) {
  let a = 0;
  const win = (x, y, fi = 0.8, fo = 0.8, v = 1) => { a = Math.max(a, v * P(t, x, x + fi, E.inOutSine) * (1 - P(t, y - fo, y, E.inOutSine))); };
  win(5.4, 15.4, 1.2, 1.2, 0.9);
  TL.olas.forEach(o => win(o.intro - 0.2, o.intro + 5.0, 0.8, 1.0));
  win(TL.P5[0], TL.Z[1] + 1, 1.0, 0.1, 0.8);
  return a;
}
function drawBg(t) {
  const a = bgAlpha(t), c = BG;
  c.clearRect(0, 0, 1920, 1080);
  if (a <= 0.003) return;
  const layers = [[172, 26, 1500, 0.10, '#F1F7FF'], [124, 20, 1100, -0.14, '#E7F1FE'], [78, 14, 820, 0.19, '#DDEBFD']];
  layers.forEach(([h, A, wl, sp, col], i) => {
    c.beginPath(); c.moveTo(0, 1080);
    const base = 1080 - h * a;
    for (let x = 0; x <= 1920; x += 16) c.lineTo(x, base + A * Math.sin(x / wl * Math.PI * 2 + t * sp * 6 + i * 1.7) + A * 0.4 * Math.sin(x / (wl * 0.43) - t * sp * 4));
    c.lineTo(1920, 1080); c.closePath(); c.fillStyle = col; c.globalAlpha = a; c.fill();
  });
  c.globalAlpha = 1;
}

/* ═════════ marca: capas del PNG original ═════════ */
const LOGO = { W: 1292, H: 276, hexR: 434, hexC: 224, parts: ['hex', 'X', 'I1', 'Q', 'U', 'I2', 'M'] };
function buildLogo(parent, x, y, w) {
  const s = w / LOGO.W, h = LOGO.H * s;
  const wrap = el('div', 'abs', `left:${x}px;top:${y}px;width:${w}px;height:${h}px`);
  const letters = el('div', 'abs', `left:0;top:0;width:${w}px;height:${h}px`);
  const layers = {};
  LOGO.parts.forEach(p => {
    const d = el('div', 'abs', `left:0;top:0;width:${w}px;height:${h}px`);
    d.innerHTML = `<img class="logo" src="assets/logo/l-${p}.png" alt="">`;
    (p === 'hex' ? wrap : letters).appendChild(d); layers[p] = d;
  });
  wrap.insertBefore(letters, wrap.firstChild);
  // brillo especular recortado a la forma del logotipo
  const sheen = el('div', 'abs', `left:0;top:0;width:${w}px;height:${h}px;-webkit-mask:url(assets/logo/oxiquim.png) 0 0/100% 100% no-repeat;mask:url(assets/logo/oxiquim.png) 0 0/100% 100% no-repeat;background:linear-gradient(105deg,rgba(255,255,255,0) 40%,rgba(255,255,255,0.55) 50%,rgba(255,255,255,0) 60%);background-size:300% 100%;opacity:0`);
  wrap.appendChild(sheen);
  parent.appendChild(wrap);
  return { wrap, letters, layers, sheen, s, w, h, hexRight: LOGO.hexR * s, hexShift: w / 2 - LOGO.hexC * s };
}

/* ═════════ A · apertura con el logotipo ═════════ */
{
  const sc = scene('sA', TL.A[0], TL.A[1], null, 0, 0.2);
  const glowA = el('div', 'abs', 'left:360px;top:-60px;width:1200px;height:1200px;border-radius:50%;background:radial-gradient(circle,rgba(77,168,255,0.16) 0%,rgba(191,224,255,0.10) 38%,rgba(255,255,255,0) 66%)');
  sc.root.appendChild(glowA);
  const L = buildLogo(sc.root, 460, 420, 1000);
  const line = el('div', 'abs', 'left:460px;top:690px;width:1000px;height:4px;border-radius:2px;background:linear-gradient(90deg,rgba(77,168,255,0),#005EC2 30%,#4DA8FF 70%,rgba(77,168,255,0));transform-origin:50% 50%');
  sc.root.appendChild(line);
  const LET = ['X', 'I1', 'Q', 'U', 'I2', 'M'];
  sc.update = t => {
    S(glowA, { op: P(t, 0, 1.6, E.inOutSine) * (1 - P(t, 4.6, 5.6)), s: 0.8 + 0.2 * P(t, 0, 3, E.outCubic) });
    const kh = P(t, 0.25, 1.4, E.outExpo), slide = 1 - P(t, 1.25, 2.3, E.inOutQuint);
    S(L.layers.hex, { op: P(t, 0.25, 0.9), x: L.hexShift * slide, s: 0.35 + 0.65 * kh, b: (1 - kh) * 26 });
    L.layers.hex.style.transformOrigin = `${LOGO.hexC * L.s}px 50%`;
    const edge = L.hexRight + L.hexShift * slide;
    L.letters.style.clipPath = `polygon(${edge.toFixed(1)}px -40px,2000px -40px,2000px 400px,${edge.toFixed(1)}px 400px)`;
    LET.forEach((p, i) => { const k = P(t, 1.45 + i * 0.07, 2.45 + i * 0.07, E.outExpo); S(L.layers[p], { op: k, x: -(1 - k) * 190, b: (1 - k) * 8 }); });
    const ks = P(t, 2.5, 3.7, E.inOutCubic); L.sheen.style.opacity = ks > 0 && ks < 1 ? 1 : 0; L.sheen.style.backgroundPosition = `${(1 - ks) * 100}% 0`;
    const out = P(t, 4.5, 5.5, E.inCubic);
    S(L.wrap, { op: 1 - out, s: 1 - 0.06 * out, y: -30 * out, b: out * 14 });
    const kl = P(t, 2.4, 3.4, E.outExpo), ke = P(t, 4.4, 5.4, E.inOutCubic);
    S(line, { op: kl * (1 - P(t, 5.0, 5.6)), sx: 0.02 + 0.98 * kl + 1.2 * ke, sy: 1 });
  };
}

/* ═════════ hoja de ruta (SVG compartido por B, C y transiciones) ═════════ */
const X = m => 200 + m * 1520 / 36, Y0 = 640, HW = [90, 170, 250];
const WAVES = CT.olas.map((o, i) => ({ a: o.m[0], b: o.m[1], h: HW[i], c: (o.m[0] + o.m[1]) / 2 }));
function crestY(m) { for (const w of WAVES) if (m >= w.a && m <= w.b) { const u = (m - w.a) / (w.b - w.a); return Y0 - w.h * (1 - Math.cos(2 * Math.PI * u)) / 2; } return Y0; }
const RD = {};
{
  const f = v => v.toFixed(1);
  let h = `<defs>
    <linearGradient id="rg" x1="${X(0)}" x2="${X(36)}" y1="0" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0A2A66"/><stop offset=".42" stop-color="#005EC2"/><stop offset="1" stop-color="#4DA8FF"/></linearGradient>
    ${['#0B3D91', '#005EC2', '#4DA8FF'].map((c, i) => `<linearGradient id="wf${i}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".55"/><stop offset="1" stop-color="${c}" stop-opacity=".03"/></linearGradient>`).join('')}
    <filter id="rgl" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="7"/></filter>
  </defs>`;
  h += `<line x1="${X(0)}" y1="${Y0}" x2="${X(36)}" y2="${Y0}" stroke="#E1E7F0" stroke-width="3" stroke-linecap="round"/>`;
  WAVES.forEach((w, i) => { const pts = []; for (let j = 0; j <= 60; j++) { const m = w.a + (w.b - w.a) * j / 60; pts.push(f(X(m)) + ',' + f(crestY(m))); } h += `<path id="rFill${i}" d="M${pts.join('L')}Z" fill="url(#wf${i})" opacity="0"/>`; });
  const all = []; for (let j = 0; j <= 432; j++) { const m = 36 * j / 432; all.push(f(X(m)) + ',' + f(crestY(m))); }
  const dAll = 'M' + all.join('L');
  h += `<path id="rTrG" d="${dAll}" fill="none" stroke="url(#rg)" stroke-width="12" stroke-linecap="round" filter="url(#rgl)" opacity=".35" pathLength="1" stroke-dasharray="1 1"/>`;
  h += `<path id="rTr" d="${dAll}" fill="none" stroke="url(#rg)" stroke-width="5" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1"/>`;
  [0, 6, 18, 36].forEach((m, i) => { h += `<g class="rTick" opacity="0"><circle cx="${X(m)}" cy="${Y0}" r="7" fill="#fff" stroke="#9FB4D0" stroke-width="3"/><text x="${X(m)}" y="${Y0 + 40}" text-anchor="middle" font-size="22" font-weight="600" fill="#6E6E73">Mes ${m}</text></g>`; });
  [[0, 12, '2026'], [12, 24, '2027'], [24, 36, '2028']].forEach(([a, b, y]) => {
    h += `<g class="rYear" opacity="0"><path d="M${X(a) + 8},${Y0 + 64}V${Y0 + 74}H${X(b) - 8}V${Y0 + 64}" fill="none" stroke="#C9D6E8" stroke-width="2"/><text x="${X((a + b) / 2)}" y="${Y0 + 106}" text-anchor="middle" font-size="26" font-weight="700" fill="#0B3D91" letter-spacing="1">${y}</text></g>`;
  });
  const yT = Y0 + 178;
  h += `<g id="rThread" opacity="0"><line id="rThL" x1="${X(0)}" y1="${yT}" x2="${X(36)}" y2="${yT}" stroke="#005EC2" stroke-width="4" stroke-dasharray="2 13" stroke-linecap="round"/><text x="${X(0)}" y="${yT + 46}" font-size="25" font-weight="700" fill="#005EC2">Gestión del cambio <tspan fill="#6E6E73" font-weight="500">· acompañamiento transversal que se sostiene de forma continua en todas las olas</tspan></text></g>`;
  CT.olas.forEach((o, i) => {
    const w = WAVES[i], cx = X(w.c), top = Y0 - w.h - 30;
    h += `<g id="rLab${i}" opacity="0"><text x="${cx}" y="${top - 76}" text-anchor="middle" font-size="20" font-weight="700" fill="#005EC2" letter-spacing="3">${o.n.toUpperCase()}</text><text id="rNm${i}" x="${cx}" y="${top - 38}" text-anchor="middle" font-size="34" font-weight="700" fill="#1D1D1F" letter-spacing="-0.8">${o.name}</text><text x="${cx}" y="${top - 6}" text-anchor="middle" font-size="22" font-weight="500" fill="#6E6E73">${o.span} · ${o.years}</text></g>`;
  });
  h += `<g id="r6m" opacity="0"><text x="${X(3)}" y="${Y0 - 128}" text-anchor="middle" font-size="27" font-weight="700" fill="#005EC2">Primeros seis meses</text><line x1="${X(3)}" y1="${Y0 - 116}" x2="${X(3)}" y2="${Y0 - 98}" stroke="#005EC2" stroke-width="3" stroke-linecap="round"/></g>`;
  h += `<g id="rDot" opacity="0"><circle id="rHalo" r="26" fill="#4DA8FF" opacity=".25"/><circle r="12" fill="#fff" stroke="#005EC2" stroke-width="5"/></g>`;
  $('road').innerHTML = h;
  Object.assign(RD, { wrap: $('roadwrap'), tr: $('rTr'), trg: $('rTrG'), fills: [0, 1, 2].map(i => $('rFill' + i)), labs: [0, 1, 2].map(i => $('rLab' + i)), names: [0, 1, 2].map(i => $('rNm' + i)), ticks: [...document.querySelectorAll('.rTick')], years: [...document.querySelectorAll('.rYear')], thread: $('rThread'), thL: $('rThL'), m6: $('r6m'), dot: $('rDot'), halo: $('rHalo') });
}
const RS = {
  p1: { F: [960, Y0], C: [960, 948], s: 0.8 },
  id: { F: [960, 560], C: [960, 560], s: 1 },
  z: i => ({ F: [X(WAVES[i].c), Y0 - WAVES[i].h * 0.5], C: [960, 540], s: 3.4 }),
};
function mixState(a, b, k) { const s = Math.exp(lerp(Math.log(a.s), Math.log(b.s), k)); return { F: [lerp(a.F[0], b.F[0], k), lerp(a.F[1], b.F[1], k)], C: [lerp(a.C[0], b.C[0], k), lerp(a.C[1], b.C[1], k)], s }; }
function roadState(t) {
  const r = { st: RS.id, op: 0, draw: 1, fill: [0, 0, 0], lab: 0, ticks: 0, years: 0, thread: 0, m6: 0, dot: 0, m: 3, act: -1 };
  const [Bs, Be] = TL.B, [Cs, Ce] = TL.C;
  if (t < 15.0 || t > TL.TR[1][1] + 0.1) return null;
  if (t < Be - 0.6) {
    Object.assign(r, { st: RS.p1, op: P(t, 15.0, 15.6), draw: P(t, 15.2, 17.6, E.inOutCubic), years: P(t, 16.4, 17.4) });
    const fk = P(t, 16.0, 17.8), hi = P(t, 19.8, 20.6);
    r.fill = [fk * lerp(0.7, 1, hi), fk * lerp(0.7, 0.35, hi), fk * lerp(0.7, 0.35, hi)]; r.m6 = hi; return r;
  }
  if (t < Ce - 0.8) {
    const k = P(t, Be - 0.4, Be + 1.0, E.inOutCubic);
    Object.assign(r, { st: mixState(RS.p1, RS.id, k), op: 1, years: 1, m6: 1 - P(t, Be - 0.6, Be), lab: P(t, Be + 0.8, Be + 1.6), ticks: P(t, Be + 1.2, Be + 1.8), thread: P(t, Be + 2.0, Be + 2.8), dot: P(t, Be + 2.6, Be + 3.2, E.outBack), m: WAVES[0].c, act: 0 });
    const hk = P(t, Be - 0.6, Be + 0.6);
    r.fill = [1, lerp(0.35, 1, hk), lerp(0.35, 1, hk)];
    const ak = P(t, Be + 2.6, Be + 3.2); r.fill = [1, lerp(r.fill[1], 0.4, ak), lerp(r.fill[2], 0.4, ak)];
    return r;
  }
  const full = { op: 1, years: 1, lab: 1, ticks: 1, thread: 1, dot: 1 };
  if (t <= Ce + 0.2) { const k = P(t, Ce - 0.8, Ce + 0.2, E.inOutCubic); return Object.assign(r, full, { st: mixState(RS.id, RS.z(0), k), op: 1 - P(t, Ce - 0.4, Ce + 0.2), m: WAVES[0].c, act: 0, fill: [1, 0.4, 0.4] }); }
  for (let i = 0; i < 2; i++) {
    const [a, b] = TL.TR[i];
    if (t >= a - 0.2 && t <= b + 0.2) {
      const kOut = P(t, a, a + 1.0, E.inOutCubic), kIn = P(t, b - 1.0, b, E.inOutCubic), kM = P(t, a + 0.9, a + 2.3, E.inOutCubic);
      const st = kIn > 0 ? mixState(RS.id, RS.z(i + 1), kIn) : mixState(RS.z(i), RS.id, kOut);
      const fill = [0, 1, 2].map(j => j <= i ? 1 : j === i + 1 ? lerp(0.4, 1, kM) : 0.4);
      return Object.assign(r, full, { st, op: P(t, a, a + 0.5) * (1 - P(t, b - 0.45, b)), m: lerp(WAVES[i].c, WAVES[i + 1].c, kM), act: kM < 0.5 ? i : i + 1, fill });
    }
  }
  return null;
}
function updateRoad(t) {
  const r = roadState(t);
  show(RD.wrap, !!r && r.op > 0.002);
  if (!r || r.op <= 0.002) return;
  const { F, C: Cc, s } = r.st;
  RD.wrap.style.transform = `translate(${(Cc[0] - F[0] * s).toFixed(2)}px,${(Cc[1] - F[1] * s).toFixed(2)}px) scale(${s.toFixed(4)})`;
  RD.wrap.style.opacity = r.op.toFixed(3);
  RD.tr.style.strokeDashoffset = (1 - r.draw).toFixed(4); RD.trg.style.strokeDashoffset = (1 - r.draw).toFixed(4);
  RD.fills.forEach((f, i) => f.setAttribute('opacity', r.fill[i].toFixed(3)));
  RD.labs.forEach((g, i) => { const k = clamp(r.lab * 3 - i); g.setAttribute('opacity', k.toFixed(3)); g.setAttribute('transform', `translate(0,${((1 - E.outCubic(k)) * 20).toFixed(1)})`); });
  RD.names.forEach((n, i) => n.setAttribute('fill', r.act < 0 || r.act === i ? C.ink : '#A1A1A6'));
  RD.ticks.forEach((g, i) => g.setAttribute('opacity', clamp(r.ticks * 4 - i).toFixed(3)));
  RD.years.forEach((g, i) => g.setAttribute('opacity', clamp(r.years * 3 - i).toFixed(3)));
  RD.thread.setAttribute('opacity', r.thread.toFixed(3)); RD.thL.style.strokeDashoffset = (-t * 30).toFixed(1);
  RD.m6.setAttribute('opacity', r.m6.toFixed(3));
  RD.dot.setAttribute('opacity', clamp(r.dot).toFixed(3));
  RD.dot.setAttribute('transform', `translate(${X(r.m).toFixed(1)},${crestY(r.m).toFixed(1)}) scale(${(0.4 + 0.6 * clamp(r.dot)).toFixed(3)})`);
  RD.halo.setAttribute('r', (20 + 14 * (0.5 + 0.5 * Math.sin(t * 4))).toFixed(1));
}

/* ═════════ B · Pantalla 1 ═════════ */
{
  const [B0, B1] = TL.B;
  const sc = scene('sB', B0, B1, null, 0.1, 0.6);
  const head = el('div', 'abs', 'left:0;top:330px;width:1920px;text-align:center;transform-origin:50% 0');
  const kick = el('div', 'kick', 'font-size:30px;letter-spacing:0.2em');
  const kickW = splitWords(kick, CT.p1.kicker);
  const title = el('div', 'h gradw', 'font-size:150px;white-space:nowrap;margin-top:22px;display:inline-block');
  const titleW = splitChars(title, CT.p1.title);
  head.append(kick, el('br'), title); sc.root.appendChild(head);
  // párrafo con resaltado progresivo
  const para = el('div', 'abs', 'left:190px;top:268px;width:1540px;text-align:center;font-size:50px;font-weight:650;letter-spacing:-0.022em;line-height:1.32');
  const words = [];
  CT.p1.body.forEach((ph, pi) => {
    const ws = ph.split(' ');
    ws.forEach((w, wi) => {
      const sp = el('span', 'w'); sp.textContent = w; sp.dataset.ph = pi;
      const isG = (pi === 1 && wi >= ws.length - 2) || (pi === 2 && wi >= 3) || (pi === 4 && wi >= ws.length - 3);
      const isB = pi === 3 && wi >= 2;
      words.push({ sp, pi, g: isG, b: isB, i: words.length });
      para.appendChild(sp); para.appendChild(document.createTextNode(' '));
    });
  });
  sc.root.appendChild(para);
  const PH = [10.6, 12.9, 15.2, 17.5, 19.8];
  sc.update = t => {
    const toHead = P(t, 9.9, 11.0, E.inOutCubic), out = P(t, B1 - 0.7, B1 + 0.1, E.inCubic);
    rise(kickW, t, 5.75, 0.08, 1.0, 1.0, 10);
    rise(titleW, t, 5.95, 0.032, 1.1, 0.9, 14);
    S(head, { y: lerp(0, -232, toHead) - out * 40, s: lerp(1, 0.46, toHead), op: 1 - out, b: out * 12 });
    const pin = P(t, 10.1, 11.0, E.outExpo);
    para.style.opacity = (pin * (1 - out)).toFixed(3);
    para.style.transform = `translateY(${((1 - pin) * 40 - out * 50).toFixed(1)}px)`;
    para.style.filter = (1 - pin) * 12 + out * 12 > 0.1 ? `blur(${((1 - pin) * 12 + out * 12).toFixed(1)}px)` : 'none';
    const n = words.length;
    words.forEach(({ sp, pi, g, b, i }) => {
      const pw = words.filter(w => w.pi === pi), idx = pw.findIndex(w => w.i === i);
      const k = P(t, PH[pi] + idx * 0.05, PH[pi] + idx * 0.05 + 0.6, E.outCubic);
      if (g) { sp.style.background = `linear-gradient(100deg,${mix('#D3D9E2', '#0A2A66', k)},${mix('#D3D9E2', '#005EC2', k)} 55%,${mix('#D3D9E2', '#3FA0FF', k)})`; sp.style.webkitBackgroundClip = 'text'; sp.style.backgroundClip = 'text'; sp.style.color = 'transparent'; }
      else sp.style.color = mix('#D3D9E2', b ? '#005EC2' : '#1D1D1F', k);
    });
  };
}

/* ═════════ C · hoja de ruta: título ═════════ */
{
  const [C0, C1] = TL.C;
  const sc = scene('sC', C0, C1, null, 0, 0.3);
  const ttl = el('div', 'abs h', 'left:0;top:96px;width:1920px;text-align:center;font-size:76px;white-space:nowrap');
  const tw = splitWords(ttl, '3 olas de ejecución · 2026–2028');
  tw.slice(-1)[0].classList.add('grad');
  sc.root.appendChild(ttl);
  sc.update = t => {
    rise(tw, t, C0 + 0.35, 0.07, 1.0, 1.0, 12);
    const out = P(t, C1 - 0.9, C1 - 0.3, E.inCubic);
    S(ttl, { op: 1 - out, y: -out * 40, s: 1 + out * 0.08, b: out * 10 });
  };
}

/* ═════════ cabecera de cada ola (layout grande → cabecera, interpolado) ═════════ */
function buildHead(root, o, i, I) {
  const ghost = el('div', 'abs', `right:90px;top:40px;font-size:880px;font-weight:800;line-height:1;letter-spacing:-0.06em;background:linear-gradient(180deg,#DCEBFD 0%,rgba(234,243,255,0) 86%);-webkit-background-clip:text;background-clip:text;color:transparent;transform-origin:70% 50%`, String(i + 1));
  const pill = el('div', 'abs pill', 'left:160px;top:250px;transform-origin:0 0', o.n);
  const name = el('div', 'abs h gradw', 'left:160px;top:330px;font-size:170px;white-space:nowrap;transform-origin:0 0');
  const nameW = splitChars(name, o.name);
  const span = el('div', 'abs', 'left:164px;top:532px;font-size:44px;font-weight:650;letter-spacing:-0.02em;color:#0B3D91;white-space:nowrap;transform-origin:0 0', `${o.span} · ${o.years}`);
  const intro = el('div', 'abs', 'left:164px;top:614px;width:1260px;font-size:38px;font-weight:500;line-height:1.38;color:#6E6E73;letter-spacing:-0.012em;transform-origin:0 0');
  const introW = splitWords(intro, o.intro);
  root.append(ghost, pill, name, span, intro);
  const G = {};
  const measure = () => {
    const pw = pill.offsetWidth, ph = pill.offsetHeight, nw = name.offsetWidth, nh = name.offsetHeight, sh = span.offsetHeight;
    const cy = 72 + ph * 0.62 / 2, sN = 54 / 170, sS = 26 / 44;
    G.pill = { x: 120 - 160, y: 72 - 250, s: 0.62 };
    const nx = 120 + pw * 0.62 + 18;
    G.name = { x: nx - 160, y: cy - nh * sN / 2 - 330, s: sN };
    G.span = { x: nx + nw * sN + 24 - 164, y: cy - sh * sS / 2 - 532, s: sS };
    G.intro = { x: 120 - 164, y: 134 - 614, s: 27 / 38 };
  };
  const update = t => {
    const rel = t - I, f = P(t, I + 4.0, I + 5.0, E.inOutQuint);
    const gi = P(rel, 0, 1.4, E.outExpo), go = P(rel, 3.6, 4.5, E.inOutCubic);
    S(ghost, { op: gi * (1 - go), y: (1 - gi) * 120, s: 1 + go * 0.08, b: go * 16 });
    const kp = P(rel, 0.1, 1.0, E.outExpo);
    S(pill, { op: kp, x: G.pill.x * f, y: G.pill.y * f + (1 - kp) * 30, s: lerp(1, G.pill.s, f), b: (1 - kp) * 10 });
    rise(nameW, t, I + 0.22, 0.03, 1.1, 0.8, 14);
    S(name, { x: G.name.x * f, y: G.name.y * f, s: lerp(1, G.name.s, f) });
    const ks = P(rel, 0.75, 1.6, E.outExpo);
    S(span, { op: ks * Math.max(clamp(1 - f * 4), clamp((f - 0.8) / 0.2)), x: G.span.x * f, y: G.span.y * f + (1 - ks) * 24, s: lerp(1, G.span.s, f), b: (1 - ks) * 10 });
    rise(introW, t, I + 1.0, 0.022, 0.9, 1.0, 10);
    S(intro, { x: G.intro.x * f, y: G.intro.y * f, s: lerp(1, G.intro.s, f) });
  };
  return { measure, update };
}
// entrada (llegada de la cámara) y salida (retroceso) de cada ola
function olaRoot(root, t, I, end, last) {
  const ki = P(t, I - 0.3, I + 0.9, E.outCubic);
  const ko = last ? P(t, end - 0.2, end + 0.6, E.inCubic) : P(t, end - 0.1, end + 0.7, E.inCubic);
  S(root, { op: ki * (1 - ko), s: lerp(1.06, 1, ki) * lerp(1, last ? 1.04 : 0.9, ko), b: ko * 12 + (1 - ki) * 6 });
  root.style.transformOrigin = '50% 50%';
}
function slotOf(o, t) { let j = -1; o.starts.forEach((s, i) => { if (t >= s) j = i; }); return j; }

/* ═════════ D · Ola 1 — lista + tarjeta ═════════ */
const VIZ1 = ['gobierno', 'desempeno', 'clima', 'cambio'];
const measures = [];
{
  const o = CT.olas[0], T = TL.olas[0];
  const sc = scene('sO1', T.intro, T.end, null, 0.4, 0.8);
  const R = el('div', 'fill'); sc.root.appendChild(R);
  const head = buildHead(R, o, 0, T.intro); measures.push(head.measure);
  const rows = o.items.map(([tt], i) => {
    const row = el('div', 'abs', `left:130px;top:${292 + i * 162}px;width:560px`);
    const num = el('div', 'num', '', String(i + 1).padStart(2, '0'));
    const ti = el('div', '', 'font-size:34px;font-weight:650;letter-spacing:-0.022em;line-height:1.16;margin-top:8px', tt);
    const tr = el('div', 'abs', `left:-30px;top:4px;width:4px;height:112px;border-radius:2px;background:#E6EBF2;overflow:hidden`);
    const fl = el('div', '', 'width:100%;height:0;background:linear-gradient(180deg,#005EC2,#4DA8FF);border-radius:2px');
    tr.appendChild(fl); row.append(tr, num, ti); R.appendChild(row);
    return { row, num, ti, fl };
  });
  const card = el('div', 'card', 'left:760px;top:262px;width:1040px;height:688px'); R.appendChild(card);
  const items = o.items.map(([tt, dd], i) => {
    const cv = el('canvas', '', 'left:0;top:24px;width:1040px;height:400px'); cv.width = 1040; cv.height = 400;
    const tx = el('div', 'abs', 'left:56px;right:56px;bottom:50px');
    const h = el('div', 'h', 'font-size:44px;letter-spacing:-0.03em', tt);
    const d = el('div', '', 'font-size:30px;font-weight:500;line-height:1.4;color:#424245;margin-top:14px;letter-spacing:-0.01em', dd);
    tx.append(h, d); card.append(cv, tx);
    return { cv, ctx: cv.getContext('2d'), tx };
  });
  sc.update = t => {
    olaRoot(R, t, T.intro, T.end, false);
    head.update(t);
    const cur = slotOf(T, t);
    rows.forEach((r, i) => {
      const k = P(t, T.items - 0.4 + i * 0.08, T.items + 0.6 + i * 0.08, E.outExpo);
      S(r.row, { op: k, y: (1 - k) * 40, b: (1 - k) * 10 });
      const s = T.starts[i], d = T.durs[i];
      const act = P(t, s, s + 0.45) * (1 - P(t, s + d, s + d + 0.45));
      const past = t >= s + d;
      r.ti.style.color = mix(past ? '#8E8E93' : '#B9BEC7', '#1D1D1F', act);
      r.num.style.color = mix(past ? '#8E8E93' : '#B9BEC7', '#005EC2', act);
      r.fl.style.height = (past ? 100 : clamp((t - s) / d) * 100).toFixed(2) + '%';
      r.fl.style.opacity = past ? 0.35 : 1;
    });
    const kc = P(t, T.items - 0.3, T.items + 0.8, E.outExpo);
    S(card, { op: kc, s: 0.96 + 0.04 * kc, x: (1 - kc) * 60, b: (1 - kc) * 12 });
    items.forEach((it, j) => {
      const s = T.starts[j], d = T.durs[j], last = j === items.length - 1;
      const kin = P(t, s + (j ? 0.2 : 0), s + (j ? 1.0 : 0.8), E.outExpo), kout = last ? 0 : P(t, s + d, s + d + 0.45, E.inCubic);
      const op = kin * (1 - kout), vis = op > 0.002;
      show(it.cv, vis); show(it.tx, vis);
      if (!vis) return;
      S(it.tx, { op, y: (1 - kin) * 36 - kout * 24, b: (1 - kin) * 10 + kout * 10 });
      S(it.cv, { op, s: 0.97 + 0.03 * kin, b: kout * 8 });
      it.ctx.clearRect(0, 0, 1040, 400); V[VIZ1[j]](it.ctx, t - s, t);
    });
  };
}

/* ═════════ E · Ola 2 — carrusel horizontal ═════════ */
const VIZ2 = ['cultura', 'planificacion', 'liderazgo', 'atraccion'];
{
  const o = CT.olas[1], T = TL.olas[1];
  const sc = scene('sO2', T.intro, T.end, null, 0.4, 0.8);
  const R = el('div', 'fill'); sc.root.appendChild(R);
  const head = buildHead(R, o, 1, T.intro); measures.push(head.measure);
  const track = el('div', 'abs', 'left:0;top:0;width:1920px;height:1080px'); R.appendChild(track);
  const cards = o.items.map(([tt, dd], i) => {
    const card = el('div', 'card', 'left:340px;top:262px;width:1240px;height:660px;transform-origin:50% 50%');
    const tx = el('div', 'abs', 'left:72px;top:0;bottom:0;width:520px;display:flex;flex-direction:column;justify-content:center');
    const num = el('div', 'num', '', `${String(i + 1).padStart(2, '0')} / ${String(o.items.length).padStart(2, '0')}`);
    const h = el('div', 'h', 'font-size:56px;letter-spacing:-0.035em;margin-top:18px');
    const hw = splitWords(h, tt);
    const d = el('div', '', 'font-size:30px;font-weight:500;line-height:1.4;color:#424245;margin-top:24px;letter-spacing:-0.01em', dd);
    tx.append(num, h, d);
    const cv = el('canvas', '', 'left:640px;top:50px;width:560px;height:560px'); cv.width = 560; cv.height = 560;
    card.append(tx, cv); track.appendChild(card);
    return { card, num, hw, d, cv, ctx: cv.getContext('2d') };
  });
  const posAt = t => { let p = -1.25 * (1 - P(t, T.items - 0.7, T.items + 0.6, E.outExpo)); for (let j = 1; j < T.starts.length; j++) p += P(t, T.starts[j] - 0.15, T.starts[j] + 0.85, E.inOutCubic); return p; };
  sc.update = t => {
    olaRoot(R, t, T.intro, T.end, false);
    head.update(t);
    const pos = posAt(t), vel = Math.abs(posAt(t) - posAt(t - 1 / 60)) * 60;
    const kin = P(t, T.items - 0.7, T.items + 0.4);
    cards.forEach((c, i) => {
      const dp = i - pos, w = 1 - clamp(Math.abs(dp));
      const x = dp * 1320;
      const vis = Math.abs(x) < 1700 && kin > 0;
      show(c.card, vis); if (!vis) return;
      S(c.card, { op: kin * (0.42 + 0.58 * w), x, s: 0.9 + 0.1 * w, b: Math.min(6, vel * 1.6) });
      const s = T.starts[i];
      rise(c.hw, t, s + 0.15, 0.06, 1.0, 1.0, 10);
      const kd = P(t, s + 0.45, s + 1.3, E.outExpo);
      S(c.d, { op: kd, y: (1 - kd) * 24, b: (1 - kd) * 8 });
      c.ctx.clearRect(0, 0, 560, 560);
      if (t > s - 0.3) V[VIZ2[i]](c.ctx, t - s, t);
    });
  };
}

/* ═════════ F · Ola 3 — texto grande + visualización ═════════ */
{
  const o = CT.olas[2], T = TL.olas[2];
  const sc = scene('sO3', T.intro, T.end, null, 0.4, 0.8);
  const R = el('div', 'fill'); sc.root.appendChild(R);
  const head = buildHead(R, o, 2, T.intro); measures.push(head.measure);
  const VZ = ['compensaciones', 'globo'];
  const items = o.items.map(([tt, dd], i) => {
    const tx = el('div', 'abs', 'left:140px;top:250px;width:760px;height:690px;display:flex;flex-direction:column;justify-content:center');
    const num = el('div', 'num', '', `${String(i + 1).padStart(2, '0')} / 02`);
    const h = el('div', 'h', 'font-size:84px;letter-spacing:-0.04em;margin-top:20px');
    const hw = splitWords(h, tt);
    const d = el('div', '', 'font-size:34px;font-weight:500;line-height:1.42;color:#424245;margin-top:30px;letter-spacing:-0.012em');
    d.innerHTML = i === 0 ? dd.replace('metas estratégicas de Rumbo 35', '<span class="kw">metas estratégicas de Rumbo 35</span>')
      : dd.replace('regulaciones tributarias, permisología y normativas internacionales', '<span class="kw">regulaciones tributarias, permisología y normativas internacionales</span>').replace('fuera de Chile', '<span class="kw">fuera de Chile</span>');
    tx.append(num, h, d);
    const cv = el('canvas', '', 'left:930px;top:262px;width:900px;height:680px'); cv.width = 900; cv.height = 680;
    R.append(cv, tx);
    return { tx, num, hw, d, cv, ctx: cv.getContext('2d') };
  });
  const chips = el('div', 'abs', 'left:930px;top:874px;width:900px;display:flex;justify-content:center;gap:14px');
  const chipEls = ['Regulaciones tributarias', 'Permisología', 'Normativas internacionales'].map(s => { const c = el('div', 'chip', '', s); chips.appendChild(c); return c; });
  R.appendChild(chips);
  sc.update = t => {
    olaRoot(R, t, T.intro, T.end, true);
    head.update(t);
    items.forEach((it, j) => {
      const s = T.starts[j], d = T.durs[j], last = j === items.length - 1;
      const kin = P(t, s + (j ? 0.25 : -0.1), s + (j ? 1.1 : 0.8), E.outExpo), kout = last ? 0 : P(t, s + d - 0.05, s + d + 0.45, E.inCubic);
      const op = kin * (1 - kout), vis = op > 0.002 || (t > s - 0.5 && t < s + d + 0.5);
      show(it.tx, vis); show(it.cv, vis); if (!vis) return;
      S(it.tx, { op: 1 - kout, y: -kout * 40, b: kout * 12 });
      S(it.num, { op: kin, y: (1 - kin) * 20 });
      rise(it.hw, t, s + (j ? 0.3 : 0), 0.07, 1.0, 1.0, 12);
      const kd = P(t, s + (j ? 0.75 : 0.45), s + (j ? 1.6 : 1.3), E.outExpo);
      S(it.d, { op: kd, y: (1 - kd) * 26, b: (1 - kd) * 8 });
      S(it.cv, { op, s: 0.95 + 0.05 * kin, b: (1 - kin) * 10 + kout * 10 });
      it.ctx.clearRect(0, 0, 900, 680); if (op > 0.002) V[VZ[j]](it.ctx, t - s, t);
    });
    const s2 = T.starts[1];
    chipEls.forEach((c, i) => { const k = P(t, s2 + 2.0 + i * 0.15, s2 + 2.8 + i * 0.15, E.outBack); S(c, { op: clamp(k), y: (1 - k) * 24, s: 0.9 + 0.1 * k }); });
  };
}

/* ═════════ HUD: avance por olas + hilo de gestión del cambio ═════════ */
const HUD = (() => {
  const root = $('hud'), segs = [], x0 = 120, x1 = 1800, pm = (x1 - x0) / 36;
  CT.olas.forEach((o, i) => {
    const a = x0 + o.m[0] * pm + (i ? 5 : 0), b = x0 + o.m[1] * pm - (i < 2 ? 5 : 0);
    const tr = el('div', 'abs', `left:${a}px;top:1004px;width:${b - a}px;height:6px;border-radius:3px;background:#E5EAF1;overflow:hidden`);
    const fl = el('div', '', `width:0;height:100%;border-radius:3px;background:linear-gradient(90deg,#0A2A66,#005EC2 60%,#4DA8FF)`); tr.appendChild(fl);
    const lb = el('div', 'abs', `left:${a}px;top:1022px;font-size:17px;font-weight:600;letter-spacing:0.01em;white-space:nowrap`, `<b style="font-weight:800">${o.n}</b> · ${o.name}`);
    root.append(tr, lb); segs.push({ fl, lb });
  });
  const th = el('div', 'abs', `left:${x0}px;top:988px;width:${x1 - x0}px;height:3px;background-image:radial-gradient(circle,#4DA8FF 1.4px,transparent 1.6px);background-size:12px 3px;background-repeat:repeat-x`);
  const thl = el('div', 'abs', `right:120px;top:960px;font-size:16px;font-weight:700;color:#005EC2;white-space:nowrap`, 'Gestión del cambio <span style="color:#6E6E73;font-weight:500">· continua en todas las olas</span>');
  root.append(th, thl);
  return t => {
    let op = 0, cur = -1;
    TL.olas.forEach((o, i) => { const k = P(t, o.items - 0.6, o.items + 0.2) * (1 - P(t, o.end - 0.3, o.end + 0.2)); if (k > op) { op = k; cur = i; } });
    show(root, op > 0.002); if (op <= 0.002) return;
    root.style.opacity = op.toFixed(3);
    segs.forEach((s, i) => {
      const o = TL.olas[i], f = i < cur ? 1 : i > cur ? 0 : clamp((t - o.items) / (o.end - o.items));
      s.fl.style.width = (f * 100).toFixed(2) + '%';
      s.lb.style.color = i === cur ? '#1D1D1F' : '#A1A1A6';
    });
    th.style.backgroundPosition = `${(t * 24).toFixed(1)}px 0`;
  };
})();

/* ═════════ G · Objetivo de los plazos ═════════ */
{
  const [O0, O1] = TL.OBJ, ob = CT.objetivo;
  const sc = scene('sObj', O0, O1, null, 0.2, 0.6);
  const cv = el('canvas', '', 'left:0;top:0;width:1920px;height:1080px'); cv.width = 1920; cv.height = 1080; sc.root.appendChild(cv);
  const ctx = cv.getContext('2d');
  const k1 = el('div', 'abs kick', 'left:0;top:128px;width:1920px;text-align:center;font-size:26px', ob.k);
  const a = el('div', 'abs h', 'left:0;top:180px;width:1920px;text-align:center;font-size:78px;white-space:nowrap');
  const aw = splitWords(a, ob.a); aw.slice(-1)[0].classList.add('grad');
  const b = el('div', 'abs', 'left:0;top:300px;width:1920px;text-align:center;font-size:40px;font-weight:500;color:#6E6E73;letter-spacing:-0.015em', ob.b);
  const n = el('div', 'abs h grad', 'left:0;top:352px;width:1920px;text-align:center;font-size:330px;line-height:1;letter-spacing:-0.05em;font-variant-numeric:tabular-nums;font-weight:800', ob.n);
  const c = el('div', 'abs', 'left:0;top:704px;width:1920px;text-align:center;font-size:58px;font-weight:650;letter-spacing:-0.03em;white-space:nowrap');
  const cw = splitWords(c, ob.c); cw.slice(-1)[0].classList.add('grad');
  sc.root.append(k1, a, b, n, c);
  const yx = y => 240 + (y - 2026) * 1440 / 9, base = 960, vy = v => base - (v - 1) * 95;
  const curve = []; for (let y = 2026; y <= 2035.001; y += 0.05) { const u = (y - 2026) / 9; curve.push([yx(y), vy(1 + 1.5 * (Math.pow(u, 1.6)))]); }
  sc.update = t => {
    const out = P(t, O1 - 0.5, O1 + 0.1, E.inCubic);
    S(sc.root.firstChild, { op: 1 - out });
    const kk = P(t, O0 + 0.2, O0 + 1.0, E.outExpo); S(k1, { op: kk * (1 - out), y: (1 - kk) * 20 - out * 30, b: (1 - kk) * 8 + out * 10 });
    rise(aw, t, O0 + 0.45, 0.07, 1.0, 1.0, 12); S(a, { op: 1 - out, y: -out * 30, b: out * 10 });
    const kb = P(t, O0 + 1.6, O0 + 2.4, E.outExpo); S(b, { op: kb * (1 - out), y: (1 - kb) * 24 - out * 30, b: (1 - kb) * 8 + out * 10 });
    const kn = P(t, O0 + 2.2, O0 + 2.9, E.outExpo), cnt = P(t, O0 + 2.3, O0 + 4.4, E.outCubic);
    n.textContent = (1 + 1.5 * cnt).toFixed(1).replace('.', ',') + 'x';
    S(n, { op: kn * (1 - out), s: 0.86 + 0.14 * kn + 0.02 * P(t, O0 + 4.3, O0 + 4.7, E.outBack) - 0.02 * P(t, O0 + 4.7, O0 + 5.2), b: (1 - kn) * 20 + out * 14 });
    rise(cw, t, O0 + 3.6, 0.07, 1.0, 1.0, 12); S(c, { op: 1 - out, y: -out * 30, b: out * 10 });
    // gráfico de fondo
    ctx.clearRect(0, 0, 1920, 1080);
    const ka = P(t, O0 + 0.3, O0 + 1.2);
    ctx.globalAlpha = ka; ctx.strokeStyle = '#DCE4EF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(yx(2026), base); ctx.lineTo(yx(2035), base); ctx.stroke();
    for (let y = 2026; y <= 2035; y++) { ctx.beginPath(); ctx.moveTo(yx(y), base - 6); ctx.lineTo(yx(y), base + 6); ctx.stroke(); }
    ctx.globalAlpha = 1;
    [2026, 2028, 2035].forEach((y, i) => label(ctx, String(y), yx(y), base + 36, { size: 24, w: 700, col: y === 2026 ? C.gray : C.deep, a: ka * P(t, O0 + 0.6 + i * 0.4, O0 + 1.2 + i * 0.4) }));
    const kc = P(t, O0 + 1.0, O0 + 4.4, E.inOutCubic);
    if (kc > 0) {
      const g = ctx.createLinearGradient(0, vy(2.5), 0, base); g.addColorStop(0, rgba(C.sky, 0.16)); g.addColorStop(1, rgba(C.sky, 0));
      const n2 = Math.max(2, Math.floor(curve.length * kc)), pts = curve.slice(0, n2);
      ctx.beginPath(); ctx.moveTo(pts[0][0], base); pts.forEach(p => ctx.lineTo(p[0], p[1])); ctx.lineTo(pts[pts.length - 1][0], base); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = gradLine(ctx, yx(2026), 0, yx(2035), 0, rgba(C.navy, 0.35), rgba(C.sky, 0.9)); ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
      const e = pts[pts.length - 1]; glow(ctx, e[0], e[1], 40, C.sky); dot(ctx, e[0], e[1], 8, C.brand);
      const p28 = curve[Math.round(2 / 9 * (curve.length - 1))];
      const k28 = P(t, O0 + 1.6, O0 + 2.2, E.outBack);
      if (kc > 0.22 && k28 > 0) { dot(ctx, p28[0], p28[1], 10 * k28, '#fff'); ring(ctx, p28[0], p28[1], 10 * k28, C.navy, 4); ctx.globalAlpha = 0.5 * k28; ctx.setLineDash([3, 6]); ctx.strokeStyle = C.navy; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p28[0], p28[1] + 12); ctx.lineTo(p28[0], base); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
    }
  };
}

/* ═════════ H · Pantalla 5 — "ya está trazado" ═════════ */
{
  const [Q0, Q1] = TL.P5;
  const sc = scene('sP5', Q0, Q1, null, 0.1, 0.4);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', 1920); svg.setAttribute('height', 1080); svg.style.cssText = 'position:absolute;left:0;top:0;overflow:visible';
  svg.innerHTML = `<defs><linearGradient id="p5g" x1="0" x2="1"><stop offset="0" stop-color="#0A2A66"/><stop offset=".5" stop-color="#005EC2"/><stop offset="1" stop-color="#4DA8FF"/></linearGradient><filter id="p5f" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="9"/></filter></defs>
    <path id="p5pG" d="M-60,880 C320,900 520,760 820,770 S1240,840 1500,700 S1820,470 2000,430" fill="none" stroke="url(#p5g)" stroke-width="16" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1" filter="url(#p5f)" opacity=".35"/>
    <path id="p5p" d="M-60,880 C320,900 520,760 820,770 S1240,840 1500,700 S1820,470 2000,430" fill="none" stroke="url(#p5g)" stroke-width="6" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1"/>
    <circle id="p5d" r="11" fill="#fff" stroke="#005EC2" stroke-width="5"/>`;
  sc.root.appendChild(svg);
  const pth = svg.querySelector('#p5p'), pg = svg.querySelector('#p5pG'), pd = svg.querySelector('#p5d'), L = pth.getTotalLength();
  const t1 = el('div', 'abs h', 'left:0;top:330px;width:1920px;text-align:center;font-size:140px;white-space:nowrap');
  const w1 = splitWords(t1, 'Nuestro éxito');
  const t2 = el('div', 'abs h', 'left:0;top:480px;width:1920px;text-align:center;font-size:140px;white-space:nowrap');
  const w2 = splitWords(t2, 'ya está trazado.'); w2.slice(-1)[0].classList.add('grad');
  sc.root.append(t1, t2);
  sc.update = t => {
    const kd = P(t, Q0 + 0.1, Q0 + 2.6, E.inOutCubic), out = P(t, Q1 - 0.45, Q1 + 0.1, E.inCubic);
    pth.style.strokeDashoffset = 1 - kd; pg.style.strokeDashoffset = 1 - kd;
    const p = pth.getPointAtLength(L * kd); pd.setAttribute('cx', p.x); pd.setAttribute('cy', p.y); pd.setAttribute('opacity', kd > 0 && kd < 1 ? 1 : 0);
    svg.style.opacity = 1 - out;
    rise(w1, t, Q0 + 0.3, 0.09, 1.0, 1.0, 14); rise(w2, t, Q0 + 0.75, 0.11, 1.0, 1.0, 14);
    S(t1, { op: 1 - out, y: -out * 40, b: out * 14 }); S(t2, { op: 1 - out, y: -out * 40, b: out * 14 });
  };
}

/* ═════════ I · Pantalla 6 — "se gana haciendo la diferencia" ═════════ */
{
  const [Q0, Q1] = TL.P6, L = CT.p6;
  const sc = scene('sP6', Q0, Q1, null, 0.1, 0.4);
  const l1 = el('div', 'abs h', 'left:0;top:292px;width:1920px;text-align:center;font-size:118px;white-space:nowrap');
  const w1 = splitChars(l1, L[0]);
  const l2 = el('div', 'abs h', 'left:0;top:432px;width:1920px;text-align:center;font-size:118px;white-space:nowrap;color:#6E6E73');
  const w2 = splitWords(l2, L[1]);
  const l3w = el('div', 'abs', 'left:0;top:580px;width:1920px;text-align:center');
  const hl = el('div', 'abs', 'left:0;top:2px;height:152px;border-radius:30px;background:linear-gradient(100deg,#EAF3FF,#D9EAFF);transform-origin:0 50%');
  const l3 = el('div', 'h', 'position:relative;display:inline-block;font-size:140px;white-space:nowrap;padding:0 34px');
  const w3 = splitWords(l3, L[2]); w3.forEach(w => w.classList.add('grad'));
  l3.insertBefore(hl, l3.firstChild); l3w.appendChild(l3);
  sc.root.append(l1, l2, l3w);
  sc.update = t => {
    const out = P(t, Q1 - 0.45, Q1 + 0.1, E.inCubic);
    const ks = P(t, Q0 + 0.2, Q0 + 2.2, E.outCubic);
    l1.style.letterSpacing = lerp(-0.075, 0.0, ks).toFixed(4) + 'em';
    rise(w1, t, Q0 + 0.2, 0.022, 1.0, 0.8, 12);
    rise(w2, t, Q0 + 1.05, 0.09, 1.0, 1.0, 12);
    rise(w3, t, Q0 + 1.8, 0.1, 1.0, 1.0, 14);
    const kh = P(t, Q0 + 2.2, Q0 + 3.0, E.inOutCubic);
    hl.style.width = '100%'; hl.style.transform = `scaleX(${kh.toFixed(4)})`; hl.style.opacity = kh > 0 ? 1 : 0;
    [l1, l2, l3w].forEach(n => S(n, { op: 1 - out, y: -out * 40, b: out * 14 }));
  };
}

/* ═════════ J · Pantalla 7 — "R35 necesita a Personas" (partículas = personas) ═════════ */
{
  const [Q0, Q1] = TL.P7, L = CT.p7;
  const sc = scene('sP7', Q0, Q1, null, 0.2, 0.4);
  const cv = el('canvas', '', 'left:0;top:0;width:1920px;height:1080px'); cv.width = 1920; cv.height = 1080; sc.root.appendChild(cv);
  const ctx = cv.getContext('2d');
  const l2 = el('div', 'abs', 'left:0;top:604px;width:1920px;text-align:center;font-size:58px;font-weight:600;color:#6E6E73;letter-spacing:-0.02em');
  const w2 = splitWords(l2, L[1]);
  const l3 = el('div', 'abs h', 'left:0;top:688px;width:1920px;text-align:center;font-size:190px;white-space:nowrap;letter-spacing:-0.045em');
  const w3 = splitWords(l3, L[2]); w3.forEach(w => w.classList.add('grad'));
  sc.root.append(l2, l3);
  let parts = null;
  const build = () => {
    const oc = document.createElement('canvas'); oc.width = 1920; oc.height = 640; const o = oc.getContext('2d');
    o.font = '800 470px InterV'; o.textAlign = 'center'; o.textBaseline = 'middle'; o.letterSpacing = '-18px'; o.fillStyle = '#000'; o.fillText(L[0], 960, 330);
    const d = o.getImageData(0, 0, 1920, 640).data, pts = [], st = 9;
    for (let y = 0; y < 640; y += st) for (let x = (y / st) % 2 ? st / 2 : 0; x < 1920; x += st) if (d[(y * 1920 + Math.round(x)) * 4 + 3] > 140) pts.push([x, y - 10]);
    const r = rng(35), cols = [C.navy, C.deep, C.brand, C.brand, C.blue, C.sky];
    parts = pts.map(([x, y]) => { const a = r() * Math.PI * 2, rad = 700 + r() * 700; return { x, y, sx: 960 + Math.cos(a) * rad, sy: 330 + Math.sin(a) * rad * 0.65, dl: r() * 0.7, ph: r() * 6.28, col: cols[Math.floor(r() * cols.length)], sz: 3.2 + r() * 1.6 }; });
  };
  sc.update = t => {
    if (!parts) build();
    const out = P(t, Q1 - 0.5, Q1 + 0.1, E.inCubic);
    ctx.clearRect(0, 0, 1920, 1080);
    for (const p of parts) {
      const k = P(t, Q0 + 0.1 + p.dl, Q0 + 1.9 + p.dl, E.inOutCubic);
      const x = lerp(p.sx, p.x, k) + (1 - k) * 30 * Math.sin(t * 1.2 + p.ph) + Math.sin(t * 2 + p.ph) * 0.8 + out * (p.x - 960) * 0.3;
      const y = lerp(p.sy, p.y, k) + (1 - k) * 30 * Math.cos(t * 1.1 + p.ph) + Math.cos(t * 2.2 + p.ph) * 0.8 - out * 60;
      ctx.globalAlpha = P(t, Q0, Q0 + 0.6) * (1 - out) * (0.55 + 0.45 * k);
      ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(x, y, p.sz * (0.7 + 0.3 * k) * (1 - 0.5 * out), 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
    rise(w2, t, Q0 + 2.2, 0.1, 1.0, 1.0, 12); rise(w3, t, Q0 + 2.7, 0.1, 1.1, 1.0, 16);
    [l2, l3].forEach(n => S(n, { op: 1 - out, y: -out * 40, b: out * 14 }));
  };
}

/* ═════════ K · cierre con el logotipo ═════════ */
{
  const [Z0, Z1] = TL.Z;
  const sc = scene('sZ', Z0, Z1, null, 0.2, 0.5);
  const glowZ = el('div', 'abs', 'left:360px;top:-80px;width:1200px;height:1200px;border-radius:50%;background:radial-gradient(circle,rgba(77,168,255,0.16) 0%,rgba(191,224,255,0.10) 38%,rgba(255,255,255,0) 66%)');
  sc.root.appendChild(glowZ);
  const L = buildLogo(sc.root, 510, 370, 900);
  const s1 = el('div', 'abs', 'left:0;top:610px;width:1920px;text-align:center;font-size:44px;font-weight:650;letter-spacing:-0.02em;color:#1D1D1F', CT.p1.title);
  const s2 = el('div', 'abs kick', 'left:0;top:676px;width:1920px;text-align:center;font-size:22px;color:#6E6E73;letter-spacing:0.22em', 'Plan de trabajo 2026–2028 · Rumbo 35');
  sc.root.append(s1, s2);
  const LET = ['X', 'I1', 'Q', 'U', 'I2', 'M'];
  sc.update = t => {
    const r = t - Z0;
    S(glowZ, { op: P(r, 0, 1.5, E.inOutSine), s: 0.85 + 0.15 * P(r, 0, 3, E.outCubic) });
    const kh = P(r, 0.15, 1.3, E.outExpo);
    L.layers.hex.style.transformOrigin = `${LOGO.hexC * L.s}px 50%`;
    S(L.layers.hex, { op: P(r, 0.15, 0.7), s: 1.6 - 0.6 * kh, b: (1 - kh) * 22 });
    L.letters.style.clipPath = `polygon(-40px -40px,2000px -40px,2000px ${L.h.toFixed(1)}px,-40px ${L.h.toFixed(1)}px)`;
    LET.forEach((p, i) => { const k = P(r, 0.55 + i * 0.075, 1.55 + i * 0.075, E.outExpo); S(L.layers[p], { op: k, y: (1 - k) * L.h * 0.9, b: (1 - k) * 6 }); });
    const ks = P(r, 2.1, 3.2, E.inOutCubic); L.sheen.style.opacity = ks > 0 && ks < 1 ? 1 : 0; L.sheen.style.backgroundPosition = `${(1 - ks) * 100}% 0`;
    const k1 = P(r, 1.4, 2.3, E.outExpo), k2 = P(r, 1.7, 2.6, E.outExpo);
    S(s1, { op: k1, y: (1 - k1) * 26, b: (1 - k1) * 10 }); S(s2, { op: k2, y: (1 - k2) * 20, b: (1 - k2) * 8 });
  };
}

/* ═════════ render ═════════ */
const VEIL = $('veil');
window.renderFrame = t => {
  drawBg(t);
  updateRoad(t);
  HUD(t);
  for (const s of scenes) {
    const on = t >= s.a - s.pre && t <= s.b + s.post;
    show(s.root, on); if (on) s.update(t);
  }
  VEIL.style.opacity = P(t, TL.END - 0.5, TL.END, E.inOutSine).toFixed(3);
};

// marcas de tiempo para la banda sonora
window.CUES = {
  end: TL.END, A: TL.A, B: TL.B, C: TL.C, olas: TL.olas, TR: TL.TR, OBJ: TL.OBJ, P5: TL.P5, P6: TL.P6, P7: TL.P7, Z: TL.Z,
  p1phrases: [10.6, 12.9, 15.2, 17.5, 19.8],
};

(async () => {
  await document.fonts.load('700 100px InterV'); await document.fonts.load('500 40px InterV'); await document.fonts.ready;
  const imgs = [...document.images]; await Promise.all(imgs.map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
  // mediciones de layout (escenas visibles un instante)
  scenes.forEach(s => show(s.root, true));
  measures.forEach(m => m());
  document.querySelectorAll('.gradw').forEach(g => { const gr = g.getBoundingClientRect(); g.style.setProperty('--gw', gr.width + 'px'); g.querySelectorAll('.w').forEach(w => { w.style.backgroundPosition = `${(gr.left - w.getBoundingClientRect().left).toFixed(1)}px 0`; }); });
  scenes.forEach(s => show(s.root, false));
  const q = new URLSearchParams(location.search);
  window.READY = true;
  if (q.has('play')) { const t0 = performance.now() - (+q.get('play') || 0) * 1000; const loop = () => { window.renderFrame(((performance.now() - t0) / 1000) % TL.END); requestAnimationFrame(loop); }; loop(); }
  else window.renderFrame(+(q.get('t') || 0));
})();
