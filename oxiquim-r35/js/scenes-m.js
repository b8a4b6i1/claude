'use strict';
/* Versión móvil 9:16 (1080×1920). Criterios:
   · Zonas seguras: contenido clave entre y=200 y y=1600, márgenes laterales de 72 px (franjas superior e inferior
     quedan libres para las interfaces de WhatsApp / Instagram / sistema).
   · Tamaños mínimos sobre 1080 px de ancho: cuerpo ≥ 42 px, rótulos de gráficos ≥ 26 px.
   · Contraste: texto en azules ≥ 4:1 sobre blanco; el celeste informativo se oscurece a #2F8BEF (3,4:1).
   · Una idea por pantalla: cada iniciativa ocupa la pantalla completa, con avance tipo "historias". */
const CT = window.CONTENT;
const W = 1080, H = 1920, MX = 72, CW = W - 2 * MX;
const SCN = $('scenes');

/* ═════════ línea de tiempo ═════════ */
const TL = (() => {
  const o = { A: [0, 5.0], B: [5.0, 24.5], C: [24.5, 33.0] };
  const slots = CT.olas.map(ol => ol.items.map(([a, b]) => Math.round((1.6 + (a.length + 1 + b.length) / 18) * 10) / 10));
  let s = 33.0;
  o.olas = slots.map((sl, i) => {
    const intro = s, items = intro + 7.0, starts = []; let x = items;
    sl.forEach(d => { starts.push(x); x += d; });
    const r = { intro, items, starts, durs: sl, end: x }; s = x + (i < 2 ? 3.4 : 0); return r;
  });
  o.TR = [[o.olas[0].end, o.olas[1].intro], [o.olas[1].end, o.olas[2].intro]];
  o.OBJ = [o.olas[2].end, o.olas[2].end + 10.5];
  o.P5 = [o.OBJ[1], o.OBJ[1] + 4.8]; o.P6 = [o.P5[1], o.P5[1] + 6.0]; o.P7 = [o.P6[1], o.P6[1] + 6.0]; o.Z = [o.P7[1], o.P7[1] + 7.0];
  o.END = o.Z[1];
  return o;
})();
window.TL = TL; window.DURATION = TL.END;

const scenes = [];
function scene(id, a, b, pre = 0.6, post = 0.8) { const root = el('div', 'scene'); root.id = id; SCN.appendChild(root); const s = { id, root, a, b, pre, post, update: null }; scenes.push(s); return s; }

/* ═════════ fondo ═════════ */
const BG = $('bg').getContext('2d');
function drawBg(t) {
  let a = 0;
  const win = (x, y, fi = 0.8, fo = 0.8, v = 1) => { a = Math.max(a, v * P(t, x, x + fi, E.inOutSine) * (1 - P(t, y - fo, y, E.inOutSine))); };
  win(4.8, 14.6, 1.2, 1.2, 0.9);
  TL.olas.forEach(o => win(o.intro - 0.2, o.items, 0.8, 1.0));
  win(TL.P5[0], TL.Z[1] + 1, 1.0, 0.1, 0.8);
  const c = BG; c.clearRect(0, 0, W, H); if (a <= 0.003) return;
  [[240, 30, 900, 0.10, '#F1F7FF'], [170, 24, 700, -0.14, '#E7F1FE'], [105, 18, 520, 0.19, '#DDEBFD']].forEach(([h, A, wl, sp, col], i) => {
    c.beginPath(); c.moveTo(0, H); const base = H - h * a;
    for (let x = 0; x <= W; x += 12) c.lineTo(x, base + A * Math.sin(x / wl * Math.PI * 2 + t * sp * 6 + i * 1.7) + A * 0.4 * Math.sin(x / (wl * 0.43) - t * sp * 4));
    c.lineTo(W, H); c.closePath(); c.fillStyle = col; c.globalAlpha = a; c.fill();
  });
  c.globalAlpha = 1;
}

/* ═════════ logotipo (capas del PNG original) ═════════ */
const LOGO = { W: 1292, H: 276, hexR: 434, hexC: 224, parts: ['hex', 'X', 'I1', 'Q', 'U', 'I2', 'M'] };
function buildLogo(parent, x, y, w) {
  const s = w / LOGO.W, h = LOGO.H * s;
  const wrap = el('div', 'abs', `left:${x}px;top:${y}px;width:${w}px;height:${h}px`);
  const letters = el('div', 'abs', `left:0;top:0;width:${w}px;height:${h}px`), layers = {};
  LOGO.parts.forEach(p => { const d = el('div', 'abs', `left:0;top:0;width:${w}px;height:${h}px`); d.innerHTML = `<img class="logo" src="assets/logo/l-${p}.png" alt="">`; (p === 'hex' ? wrap : letters).appendChild(d); layers[p] = d; });
  wrap.insertBefore(letters, wrap.firstChild);
  const sheen = el('div', 'abs', `left:0;top:0;width:${w}px;height:${h}px;-webkit-mask:url(assets/logo/oxiquim.png) 0 0/100% 100% no-repeat;mask:url(assets/logo/oxiquim.png) 0 0/100% 100% no-repeat;background:linear-gradient(105deg,rgba(255,255,255,0) 40%,rgba(255,255,255,0.55) 50%,rgba(255,255,255,0) 60%);background-size:300% 100%;opacity:0`);
  wrap.appendChild(sheen); parent.appendChild(wrap);
  return { wrap, letters, layers, sheen, s, w, h, hexRight: LOGO.hexR * s, hexShift: w / 2 - LOGO.hexC * s };
}
const LET = ['X', 'I1', 'Q', 'U', 'I2', 'M'];
const softGlow = () => el('div', 'abs', 'left:-160px;top:460px;width:1400px;height:1000px;border-radius:50%;background:radial-gradient(ellipse,rgba(77,168,255,0.16) 0%,rgba(191,224,255,0.10) 38%,rgba(255,255,255,0) 66%)');

/* ═════════ A · apertura (el primer cuadro ya muestra el isotipo: sirve de miniatura) ═════════ */
{
  const sc = scene('sA', TL.A[0], TL.A[1], 0, 0.2);
  const g = softGlow(); sc.root.appendChild(g);
  const L = buildLogo(sc.root, 100, 866, 880);
  const line = el('div', 'abs', 'left:100px;top:1110px;width:880px;height:5px;border-radius:3px;background:linear-gradient(90deg,rgba(47,139,239,0),#005EC2 30%,#2F8BEF 70%,rgba(47,139,239,0));transform-origin:50% 50%');
  sc.root.appendChild(line);
  sc.update = t => {
    S(g, { op: 0.6 + 0.4 * P(t, 0, 1.4, E.inOutSine) * (1 - P(t, 4.0, 5.0)) - 0.6 * P(t, 4.0, 5.0) });
    const kh = P(t, 0, 1.1, E.outExpo), slide = 1 - P(t, 1.0, 2.0, E.inOutQuint);
    L.layers.hex.style.transformOrigin = `${LOGO.hexC * L.s}px 50%`;
    S(L.layers.hex, { x: L.hexShift * slide, s: 1.25 - 0.25 * kh });
    const edge = L.hexRight + L.hexShift * slide;
    L.letters.style.clipPath = `polygon(${edge.toFixed(1)}px -60px,1400px -60px,1400px 400px,${edge.toFixed(1)}px 400px)`;
    LET.forEach((p, i) => { const k = P(t, 1.2 + i * 0.07, 2.2 + i * 0.07, E.outExpo); S(L.layers[p], { op: k, x: -(1 - k) * 170, b: (1 - k) * 8 }); });
    const ks = P(t, 2.3, 3.4, E.inOutCubic); L.sheen.style.opacity = ks > 0 && ks < 1 ? 1 : 0; L.sheen.style.backgroundPosition = `${(1 - ks) * 100}% 0`;
    const out = P(t, 4.0, 5.0, E.inCubic); S(L.wrap, { op: 1 - out, s: 1 - 0.06 * out, y: -30 * out, b: out * 14 });
    const kl = P(t, 2.2, 3.2, E.outExpo), ke = P(t, 3.9, 4.9, E.inOutCubic);
    S(line, { op: kl * (1 - P(t, 4.5, 5.0)), sx: 0.02 + 0.98 * kl + 0.3 * ke, sy: 1 });
  };
}

/* ═════════ hoja de ruta vertical (SVG) ═════════ */
const AX = 260, YM = m => 420 + m * 29.5, HW = [190, 300, 380];
const WAVES = CT.olas.map((o, i) => ({ a: o.m[0], b: o.m[1], h: HW[i], c: (o.m[0] + o.m[1]) / 2 }));
const crestX = m => { for (const w of WAVES) if (m >= w.a && m <= w.b) { const u = (m - w.a) / (w.b - w.a); return AX + w.h * (1 - Math.cos(2 * Math.PI * u)) / 2; } return AX; };
const RD = {};
{
  const f = v => v.toFixed(1);
  let h = `<defs>
    <linearGradient id="rg" x1="0" x2="0" y1="${YM(0)}" y2="${YM(36)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0A2A66"/><stop offset=".45" stop-color="#005EC2"/><stop offset="1" stop-color="#2F8BEF"/></linearGradient>
    ${['#0B3D91', '#005EC2', '#2F8BEF'].map((c, i) => `<linearGradient id="wf${i}" x1="1" x2="0" y1="0" y2="0"><stop offset="0" stop-color="${c}" stop-opacity=".5"/><stop offset="1" stop-color="${c}" stop-opacity=".03"/></linearGradient>`).join('')}
    <filter id="rgl" x="-60%" y="-20%" width="220%" height="140%"><feGaussianBlur stdDeviation="8"/></filter></defs>`;
  h += `<line x1="${AX}" y1="${YM(0)}" x2="${AX}" y2="${YM(36)}" stroke="#DCE3EE" stroke-width="4" stroke-linecap="round"/>`;
  WAVES.forEach((w, i) => { const pts = []; for (let j = 0; j <= 60; j++) { const m = w.a + (w.b - w.a) * j / 60; pts.push(f(crestX(m)) + ',' + f(YM(m))); } h += `<path id="rFill${i}" d="M${pts.join('L')}Z" fill="url(#wf${i})" opacity="0"/>`; });
  const all = []; for (let j = 0; j <= 432; j++) { const m = 36 * j / 432; all.push(f(crestX(m)) + ',' + f(YM(m))); }
  const dAll = 'M' + all.join('L');
  h += `<path id="rTrG" d="${dAll}" fill="none" stroke="url(#rg)" stroke-width="14" stroke-linecap="round" filter="url(#rgl)" opacity=".35" pathLength="1" stroke-dasharray="1 1"/>`;
  h += `<path id="rTr" d="${dAll}" fill="none" stroke="url(#rg)" stroke-width="7" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1"/>`;
  [0, 6, 18, 36].forEach(m => { h += `<g class="rTick" opacity="0"><circle cx="${AX}" cy="${YM(m)}" r="10" fill="#fff" stroke="#8FA6C6" stroke-width="4"/><text x="${AX - 28}" y="${YM(m) + 10}" text-anchor="end" font-size="28" font-weight="600" fill="#6E6E73">Mes ${m}</text></g>`; });
  h += `<g id="rThread" opacity="0"><line id="rThL" x1="110" y1="${YM(0)}" x2="110" y2="${YM(36)}" stroke="#005EC2" stroke-width="5" stroke-dasharray="2 16" stroke-linecap="round"/></g>`;
  CT.olas.forEach((o, i) => {
    const w = WAVES[i], x = AX + w.h + 34, y = YM(w.c);
    h += `<g id="rLab${i}" opacity="0"><text x="${x}" y="${y - 52}" font-size="26" font-weight="800" fill="#005EC2" letter-spacing="3">${o.n.toUpperCase()}</text><text id="rNm${i}" x="${x}" y="${y - 6}" font-size="44" font-weight="700" fill="#1D1D1F" letter-spacing="-1">${o.name}</text><text x="${x}" y="${y + 36}" font-size="29" font-weight="500" fill="#6E6E73">${o.span}</text><text x="${x}" y="${y + 74}" font-size="29" font-weight="700" fill="#0B3D91">${o.years}</text></g>`;
  });
  h += `<g id="rDot" opacity="0"><circle id="rHalo" r="34" fill="#2F8BEF" opacity=".25"/><circle r="16" fill="#fff" stroke="#005EC2" stroke-width="7"/></g>`;
  $('road').innerHTML = h;
  Object.assign(RD, { wrap: $('roadwrap'), tr: $('rTr'), trg: $('rTrG'), fills: [0, 1, 2].map(i => $('rFill' + i)), labs: [0, 1, 2].map(i => $('rLab' + i)), names: [0, 1, 2].map(i => $('rNm' + i)), ticks: [...document.querySelectorAll('.rTick')], thread: $('rThread'), thL: $('rThL'), dot: $('rDot'), halo: $('rHalo') });
}
const SPAN = YM(36) - YM(0);
const RS = {
  p1: { F: [AX, (YM(0) + YM(36)) / 2], C: [540, 1480], s: CW / SPAN, r: -90 },
  id: { F: [540, 960], C: [540, 960], s: 1, r: 0 },
  z: i => ({ F: [AX + WAVES[i].h * 0.5, YM(WAVES[i].c)], C: [540, 960], s: 2.6, r: 0 }),
};
const mixS = (a, b, k) => ({ F: [lerp(a.F[0], b.F[0], k), lerp(a.F[1], b.F[1], k)], C: [lerp(a.C[0], b.C[0], k), lerp(a.C[1], b.C[1], k)], s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), k)), r: lerp(a.r, b.r, k) });
function roadState(t) {
  const r = { st: RS.id, op: 0, draw: 1, fill: [0, 0, 0], lab: 0, ticks: 0, thread: 0, dot: 0, m: 3, act: -1 };
  const [, Be] = TL.B, [, Ce] = TL.C;
  if (t < 14.8 || t > TL.TR[1][1] + 0.1) return null;
  if (t < Be - 0.4) {
    const fk = P(t, 15.6, 17.4), hi = P(t, 19.8, 20.6);
    return Object.assign(r, { st: RS.p1, op: P(t, 14.8, 15.4), draw: P(t, 15.0, 17.4, E.inOutCubic), fill: [fk * lerp(0.7, 1, hi), fk * lerp(0.7, 0.35, hi), fk * lerp(0.7, 0.35, hi)] });
  }
  if (t < Ce - 1.0) {
    const k = P(t, Be - 0.4, Be + 1.2, E.inOutCubic), hk = P(t, Be - 0.4, Be + 0.8), ak = P(t, Be + 2.9, Be + 3.5);
    return Object.assign(r, { st: mixS(RS.p1, RS.id, k), op: 1, lab: P(t, Be + 1.3, Be + 2.5), ticks: P(t, Be + 1.9, Be + 2.5), thread: P(t, Be + 2.5, Be + 3.2), dot: P(t, Be + 2.9, Be + 3.5, E.outBack), m: WAVES[0].c, act: 0, fill: [1, lerp(lerp(0.35, 1, hk), 0.4, ak), lerp(lerp(0.35, 1, hk), 0.4, ak)] });
  }
  const full = { op: 1, lab: 1, ticks: 1, thread: 1, dot: 1 };
  if (t <= Ce + 0.2) { const k = P(t, Ce - 1.0, Ce, E.inOutCubic); return Object.assign(r, full, { st: mixS(RS.id, RS.z(0), k), op: 1 - P(t, Ce - 0.5, Ce + 0.1), m: WAVES[0].c, act: 0, fill: [1, 0.4, 0.4] }); }
  for (let i = 0; i < 2; i++) {
    const [a, b] = TL.TR[i];
    if (t >= a - 0.2 && t <= b + 0.2) {
      const kOut = P(t, a, a + 1.0, E.inOutCubic), kIn = P(t, b - 1.0, b, E.inOutCubic), kM = P(t, a + 0.9, a + 2.3, E.inOutCubic);
      return Object.assign(r, full, { st: kIn > 0 ? mixS(RS.id, RS.z(i + 1), kIn) : mixS(RS.z(i), RS.id, kOut), op: P(t, a, a + 0.5) * (1 - P(t, b - 0.45, b)), m: lerp(WAVES[i].c, WAVES[i + 1].c, kM), act: kM < 0.5 ? i : i + 1, fill: [0, 1, 2].map(j => j <= i ? 1 : j === i + 1 ? lerp(0.4, 1, kM) : 0.4) });
    }
  }
  return null;
}
function updateRoad(t) {
  const r = roadState(t);
  show(RD.wrap, !!r && r.op > 0.002); if (!r || r.op <= 0.002) return;
  const { F, C: Cc, s, r: rot } = r.st;
  RD.wrap.style.transform = `translate(${Cc[0].toFixed(2)}px,${Cc[1].toFixed(2)}px) rotate(${rot.toFixed(3)}deg) scale(${s.toFixed(4)}) translate(${(-F[0]).toFixed(2)}px,${(-F[1]).toFixed(2)}px)`;
  RD.wrap.style.opacity = r.op.toFixed(3);
  RD.tr.style.strokeDashoffset = (1 - r.draw).toFixed(4); RD.trg.style.strokeDashoffset = (1 - r.draw).toFixed(4);
  RD.fills.forEach((f, i) => f.setAttribute('opacity', r.fill[i].toFixed(3)));
  RD.labs.forEach((g, i) => { const k = clamp(r.lab * 3 - i); g.setAttribute('opacity', k.toFixed(3)); g.setAttribute('transform', `translate(${((1 - E.outCubic(k)) * 24).toFixed(1)},0)`); });
  RD.names.forEach((n, i) => n.setAttribute('fill', r.act < 0 || r.act === i ? C.ink : '#8E8E93'));
  RD.ticks.forEach((g, i) => g.setAttribute('opacity', clamp(r.ticks * 4 - i).toFixed(3)));
  RD.thread.setAttribute('opacity', r.thread.toFixed(3)); RD.thL.style.strokeDashoffset = (-t * 34).toFixed(1);
  RD.dot.setAttribute('opacity', clamp(r.dot).toFixed(3));
  RD.dot.setAttribute('transform', `translate(${crestX(r.m).toFixed(1)},${YM(r.m).toFixed(1)}) scale(${(0.4 + 0.6 * clamp(r.dot)).toFixed(3)})`);
  RD.halo.setAttribute('r', (28 + 18 * (0.5 + 0.5 * Math.sin(t * 4))).toFixed(1));
}

/* ═════════ B · Pantalla 1 ═════════ */
{
  const [B0, B1] = TL.B;
  const sc = scene('sB', B0, B1, 0.1, 0.6);
  const head = el('div', 'abs', `left:${MX}px;top:700px;width:${CW}px;text-align:center;transform-origin:50% 0`);
  const kick = el('div', 'kick', 'font-size:34px;letter-spacing:0.2em'); const kickW = splitWords(kick, CT.p1.kicker);
  const title = el('div', 'h gradw', 'font-size:136px;margin-top:26px;display:inline-block;line-height:1.02');
  const tA = el('span', '', 'white-space:nowrap'), tB = el('span', '', 'white-space:nowrap');
  const titleW = [...splitChars(tA, 'Gerencia de'), ...splitChars(tB, 'Personas')];
  title.append(tA, el('br'), tB); head.append(kick, el('br'), title); sc.root.appendChild(head);
  const para = el('div', 'abs', `left:${MX}px;top:430px;width:${CW}px;font-size:53px;font-weight:650;letter-spacing:-0.022em;line-height:1.3`);
  const words = [];
  CT.p1.body.forEach((ph, pi) => { const ws = ph.split(' '); ws.forEach((w, wi) => {
    const sp = el('span', 'w'); sp.textContent = w;
    const g = (pi === 1 && wi >= ws.length - 2) || (pi === 2 && wi >= 3) || (pi === 4 && wi >= ws.length - 3), b = pi === 3 && wi >= 2;
    words.push({ sp, pi, g, b, idx: words.filter(x => x.pi === pi).length }); para.appendChild(sp); para.appendChild(document.createTextNode(' '));
  }); });
  sc.root.appendChild(para);
  const m6 = el('div', 'abs', `left:${MX}px;top:1124px;width:400px;height:180px`, '<div style="font-size:34px;font-weight:700;color:#005EC2;white-space:nowrap">Primeros seis meses</div><div style="position:absolute;left:76px;top:58px;width:4px;height:112px;border-radius:2px;background:#005EC2"></div>');
  sc.root.appendChild(m6);
  const PH = [10.2, 12.6, 15.0, 17.4, 19.8];
  sc.update = t => {
    const toHead = P(t, 8.9, 10.0, E.inOutCubic), out = P(t, B1 - 0.8, B1, E.inCubic);
    rise(kickW, t, B0 + 0.15, 0.08, 1.0, 1.0, 10); rise(titleW, t, B0 + 0.35, 0.03, 1.1, 0.9, 14);
    S(head, { y: lerp(0, -540, toHead) - out * 40, s: lerp(1, 0.62, toHead), op: 1 - out, b: out * 12 });
    kick.style.opacity = (1 - toHead).toFixed(3);
    const pin = P(t, 9.4, 10.3, E.outExpo);
    S(para, { op: pin * (1 - out), y: (1 - pin) * 40 - out * 50, b: (1 - pin) * 12 + out * 12 });
    words.forEach(({ sp, pi, g, b, idx }) => {
      const k = P(t, PH[pi] + idx * 0.05, PH[pi] + idx * 0.05 + 0.6, E.outCubic);
      if (g) { sp.style.background = `linear-gradient(100deg,${mix('#C9D0DB', '#0A2A66', k)},${mix('#C9D0DB', '#005EC2', k)} 55%,${mix('#C9D0DB', '#1A7CF0', k)})`; sp.style.webkitBackgroundClip = 'text'; sp.style.backgroundClip = 'text'; sp.style.color = 'transparent'; }
      else sp.style.color = mix('#C9D0DB', b ? '#005EC2' : '#1D1D1F', k);
    });
    const km = P(t, 19.9, 20.7, E.outExpo) * (1 - P(t, B1 - 1.0, B1 - 0.4));
    S(m6, { op: km, y: (1 - km) * 20 });
  };
}

/* ═════════ C · hoja de ruta: título ═════════ */
{
  const [C0, C1] = TL.C;
  const sc = scene('sC', C0, C1, 0, 0.3);
  const ttl = el('div', 'abs h', `left:${MX}px;top:218px;width:${CW}px;font-size:78px;line-height:1.08`);
  const l1 = el('div', '', 'white-space:nowrap'), l2 = el('div', '', 'white-space:nowrap');
  const w1 = splitWords(l1, '3 olas de ejecución'), w2 = splitWords(l2, '2026–2028'); w2.forEach(w => w.classList.add('grad'));
  ttl.append(l1, l2); sc.root.appendChild(ttl);
  const th = el('div', 'abs', `left:${MX}px;top:1520px;width:${CW}px`);
  th.innerHTML = '<div style="font-size:34px;font-weight:700;color:#005EC2">Gestión del cambio</div><div style="font-size:30px;font-weight:500;color:#6E6E73;margin-top:6px;line-height:1.3">Acompañamiento transversal, continuo en todas las olas</div>';
  sc.root.appendChild(th);
  sc.update = t => {
    rise([...w1, ...w2], t, C0 + 0.5, 0.07, 1.0, 1.0, 12);
    const out = P(t, C1 - 1.0, C1 - 0.4, E.inCubic);
    S(ttl, { op: 1 - out, y: -out * 40, b: out * 10 });
    const kt = P(t, C0 + 3.0, C0 + 3.8, E.outExpo); S(th, { op: kt * (1 - out), y: (1 - kt) * 24 + out * 30, b: out * 10 });
  };
}

/* ═════════ olas: intro + iniciativas en pantalla completa (avance tipo historias) ═════════ */
function buildOla(i, VIZ) {
  const o = CT.olas[i], Tm = TL.olas[i];
  const sc = scene('sO' + (i + 1), Tm.intro, Tm.end, 0.4, 0.8);
  const R = el('div', 'fill'); sc.root.appendChild(R);
  // intro
  const ghost = el('div', 'abs', `right:20px;top:150px;font-size:1000px;font-weight:800;line-height:1;letter-spacing:-0.06em;background:linear-gradient(180deg,#DCEBFD 0%,rgba(234,243,255,0) 86%);-webkit-background-clip:text;background-clip:text;color:transparent;transform-origin:70% 40%`, String(i + 1));
  const intro = el('div', 'abs', `left:${MX}px;top:500px;width:${CW}px`);
  const pill = el('div', 'pill', 'height:68px;font-size:32px;padding:0 32px', o.n);
  const name = el('div', 'h gradw', 'font-size:124px;margin-top:30px;line-height:1.04');
  const nameW = splitWords(name, o.name);
  const span = el('div', '', 'font-size:48px;font-weight:650;color:#0B3D91;margin-top:26px;letter-spacing:-0.02em', `${o.span} · ${o.years}`);
  const desc = el('div', '', 'font-size:46px;font-weight:500;line-height:1.38;color:#6E6E73;margin-top:40px;letter-spacing:-0.012em');
  const descW = splitWords(desc, o.intro);
  intro.append(pill, name, span, desc); R.append(ghost, intro);
  // cabecera de iniciativas
  const hdr = el('div', 'abs', `left:${MX}px;top:196px;width:${CW}px`);
  const bars = el('div', '', 'display:flex;gap:10px');
  const fills = o.items.map(() => { const b = el('div', '', 'flex:1;height:8px;border-radius:4px;background:#E2E8F1;overflow:hidden'); const f = el('div', '', 'height:100%;width:0;background:linear-gradient(90deg,#0A2A66,#005EC2)'); b.appendChild(f); bars.appendChild(b); return f; });
  const row = el('div', '', 'display:flex;justify-content:space-between;align-items:baseline;margin-top:24px;white-space:nowrap');
  row.innerHTML = `<div style="font-size:36px;font-weight:700;letter-spacing:-0.02em">${o.n} · <span class="grad">${o.name}</span></div><div style="font-size:30px;font-weight:650;color:#0B3D91">${o.span} · ${o.years}</div>`;
  hdr.append(bars, row); R.appendChild(hdr);
  // tarjetas
  const cards = o.items.map(([tt, dd], j) => {
    const card = el('div', 'card', 'left:40px;top:320px;width:1000px;height:1270px;transform-origin:50% 50%');
    const cv = el('canvas', '', 'left:40px;top:30px;width:920px;height:760px'); cv.width = 920; cv.height = 760;
    const tx = el('div', 'abs', 'left:40px;right:40px;bottom:46px');
    const num = el('div', 'num', 'font-size:30px', `${String(j + 1).padStart(2, '0')} / ${String(o.items.length).padStart(2, '0')}`);
    const h = el('div', 'h', 'font-size:58px;letter-spacing:-0.035em;margin-top:14px;line-height:1.08'); const hw = splitWords(h, tt);
    const d = el('div', '', 'font-size:42px;font-weight:500;line-height:1.38;color:#424245;margin-top:22px;letter-spacing:-0.01em');
    d.innerHTML = dd.replace('metas estratégicas de Rumbo 35', '<span class="kw">metas estratégicas de Rumbo 35</span>').replace('regulaciones tributarias, permisología y normativas internacionales', '<span class="kw">regulaciones tributarias, permisología y normativas internacionales</span>').replace('fuera de Chile', '<span class="kw">fuera de Chile</span>');
    tx.append(num, h, d); card.append(cv, tx); R.appendChild(card);
    return { card, cv, ctx: cv.getContext('2d'), num, hw, d };
  });
  const last = i === 2;
  sc.update = t => {
    const I = Tm.intro;
    const ki = P(t, I - 0.3, I + 0.9, E.outCubic), ko = last ? P(t, Tm.end - 0.2, Tm.end + 0.6, E.inCubic) : P(t, Tm.end - 0.1, Tm.end + 0.7, E.inCubic);
    R.style.transformOrigin = '50% 50%';
    S(R, { op: ki * (1 - ko), s: lerp(1.06, 1, ki) * lerp(1, last ? 1.04 : 0.9, ko), b: ko * 12 + (1 - ki) * 6 });
    // intro
    const io = P(t, Tm.items - 0.7, Tm.items - 0.1, E.inCubic);
    show(intro, io < 1); show(ghost, io < 1);
    const gi = P(t, I, I + 1.4, E.outExpo); S(ghost, { op: gi * (1 - io), y: (1 - gi) * 140, s: 1 + io * 0.08, b: io * 16 });
    const kp = P(t, I + 0.1, I + 1.0, E.outExpo); S(pill, { op: kp, y: (1 - kp) * 30, b: (1 - kp) * 10 });
    rise(nameW, t, I + 0.25, 0.08, 1.1, 1.0, 14);
    const ks = P(t, I + 0.8, I + 1.6, E.outExpo); S(span, { op: ks, y: (1 - ks) * 24, b: (1 - ks) * 10 });
    rise(descW, t, I + 1.1, 0.025, 0.9, 1.0, 10);
    S(intro, { op: 1 - io, y: -io * 60, b: io * 14 });
    // cabecera
    const kh = P(t, Tm.items - 0.3, Tm.items + 0.6, E.outExpo); S(hdr, { op: kh, y: (1 - kh) * -20 });
    fills.forEach((f, j) => { f.style.width = (clamp((t - Tm.starts[j]) / Tm.durs[j]) * 100).toFixed(2) + '%'; });
    // tarjetas: deslizamiento horizontal
    cards.forEach((c, j) => {
      const s = Tm.starts[j], d = Tm.durs[j], lastC = j === cards.length - 1;
      const kin = P(t, s - (j ? 0.15 : 0.35), s + 0.75, E.outExpo), kout = lastC ? 0 : P(t, s + d - 0.15, s + d + 0.55, E.inOutCubic);
      const vis = kin > 0.001 && kout < 0.999; show(c.card, vis); if (!vis) return;
      const x = (1 - kin) * (j ? 1080 : 0) - kout * 1080;
      S(c.card, { op: j ? 1 : kin, x, s: (j ? 1 : 0.94 + 0.06 * kin) * (1 - 0.06 * kout), y: j ? 0 : (1 - kin) * 60 });
      rise(c.hw, t, s + 0.2, 0.06, 1.0, 1.0, 10);
      const kd = P(t, s + 0.5, s + 1.3, E.outExpo); S(c.d, { op: kd, y: (1 - kd) * 26, b: (1 - kd) * 8 });
      c.ctx.clearRect(0, 0, 920, 760); VM[VIZ[j]](c.ctx, t - s, t);
    });
  };
}
buildOla(0, ['gobierno', 'desempeno', 'clima', 'cambio']);
buildOla(1, ['cultura', 'planificacion', 'liderazgo', 'atraccion']);
buildOla(2, ['compensaciones', 'globo']);

/* ═════════ G · Objetivo de los plazos ═════════ */
{
  const [O0, O1] = TL.OBJ, ob = CT.objetivo;
  const sc = scene('sObj', O0, O1, 0.2, 0.6);
  const cv = el('canvas', '', 'left:0;top:0;width:1080px;height:1920px'); cv.width = W; cv.height = H; sc.root.appendChild(cv);
  const ctx = cv.getContext('2d');
  const center = (top, css, html) => el('div', 'abs', `left:${MX}px;top:${top}px;width:${CW}px;text-align:center;${css}`, html);
  const k1 = center(270, ''); k1.className += ' kick'; k1.style.fontSize = '32px'; k1.textContent = ob.k;
  const a = center(330, 'font-size:82px;line-height:1.08'); a.className += ' h';
  const aw = [...splitWords(a.appendChild(el('div')), 'Reconvertir la función'), ...splitWords(a.appendChild(el('div')), 'hacia 2028')]; aw.slice(-1)[0].classList.add('grad');
  const b = center(540, 'font-size:46px;font-weight:500;color:#6E6E73;line-height:1.3;letter-spacing:-0.015em', ob.b);
  const n = center(660, 'font-size:330px;line-height:1;letter-spacing:-0.05em;font-variant-numeric:tabular-nums;font-weight:800', ob.n); n.className += ' h grad';
  const c = center(1030, 'font-size:62px;font-weight:650;letter-spacing:-0.03em;line-height:1.12');
  const cw = [...splitWords(c.appendChild(el('div')), 'el EBITDA proyectado'), ...splitWords(c.appendChild(el('div')), 'al año 2035.')]; cw.slice(-1)[0].classList.add('grad');
  sc.root.append(k1, a, b, n, c);
  const yx = y => 110 + (y - 2026) * 860 / 9, base = 1470, vy = v => base - (v - 1) * 140;
  const curve = []; for (let y = 2026; y <= 2035.001; y += 0.05) curve.push([yx(y), vy(1 + 1.5 * Math.pow((y - 2026) / 9, 1.6))]);
  sc.update = t => {
    const out = P(t, O1 - 0.5, O1 + 0.1, E.inCubic);
    S(cv, { op: 1 - out });
    const kk = P(t, O0 + 0.2, O0 + 1.0, E.outExpo); S(k1, { op: kk * (1 - out), y: (1 - kk) * 20 - out * 30, b: (1 - kk) * 8 + out * 10 });
    rise(aw, t, O0 + 0.45, 0.08, 1.0, 1.0, 12); S(a, { op: 1 - out, y: -out * 30, b: out * 10 });
    const kb = P(t, O0 + 1.7, O0 + 2.5, E.outExpo); S(b, { op: kb * (1 - out), y: (1 - kb) * 24 - out * 30, b: (1 - kb) * 8 + out * 10 });
    const kn = P(t, O0 + 2.4, O0 + 3.1, E.outExpo), cnt = P(t, O0 + 2.5, O0 + 4.6, E.outCubic);
    n.textContent = (1 + 1.5 * cnt).toFixed(1).replace('.', ',') + 'x';
    S(n, { op: kn * (1 - out), s: 0.86 + 0.14 * kn + 0.02 * P(t, O0 + 4.5, O0 + 4.9, E.outBack) - 0.02 * P(t, O0 + 4.9, O0 + 5.4), b: (1 - kn) * 20 + out * 14 });
    rise(cw, t, O0 + 3.8, 0.08, 1.0, 1.0, 12); S(c, { op: 1 - out, y: -out * 30, b: out * 10 });
    ctx.clearRect(0, 0, W, H);
    const ka = P(t, O0 + 0.3, O0 + 1.2);
    ctx.globalAlpha = ka; ctx.strokeStyle = '#D3DDEB'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(yx(2026), base); ctx.lineTo(yx(2035), base); ctx.stroke();
    for (let y = 2026; y <= 2035; y++) { ctx.beginPath(); ctx.moveTo(yx(y), base - 8); ctx.lineTo(yx(y), base + 8); ctx.stroke(); }
    ctx.globalAlpha = 1;
    [2026, 2028, 2035].forEach((y, i) => label(ctx, String(y), yx(y), base + 46, { size: 32, w: 700, col: y === 2026 ? C.gray : C.deep, a: ka * P(t, O0 + 0.6 + i * 0.4, O0 + 1.2 + i * 0.4) }));
    const kc = P(t, O0 + 1.0, O0 + 4.6, E.inOutCubic);
    if (kc > 0) {
      const g = ctx.createLinearGradient(0, vy(2.5), 0, base); g.addColorStop(0, rgba(C.sky, 0.18)); g.addColorStop(1, rgba(C.sky, 0));
      const pts = curve.slice(0, Math.max(2, Math.floor(curve.length * kc)));
      ctx.beginPath(); ctx.moveTo(pts[0][0], base); pts.forEach(p => ctx.lineTo(p[0], p[1])); ctx.lineTo(pts[pts.length - 1][0], base); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = gradLine(ctx, yx(2026), 0, yx(2035), 0, rgba(C.navy, 0.45), C.sky); ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
      const e = pts[pts.length - 1]; glow(ctx, e[0], e[1], 54, C.sky); dot(ctx, e[0], e[1], 11, C.brand);
      const p28 = curve[Math.round(2 / 9 * (curve.length - 1))], k28 = P(t, O0 + 1.6, O0 + 2.2, E.outBack);
      if (kc > 0.22 && k28 > 0) { dot(ctx, p28[0], p28[1], 13 * k28, '#fff'); ring(ctx, p28[0], p28[1], 13 * k28, C.navy, 5); }
    }
  };
}

/* ═════════ H · Pantalla 5 ═════════ */
{
  const [Q0, Q1] = TL.P5;
  const sc = scene('sP5', Q0, Q1, 0.1, 0.4);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', W); svg.setAttribute('height', H); svg.style.cssText = 'position:absolute;left:0;top:0;overflow:visible';
  const d = 'M-60,1330 C200,1350 320,1200 540,1215 S860,1300 1000,1140 S1100,980 1160,960';
  svg.innerHTML = `<defs><linearGradient id="p5g" x1="0" x2="1"><stop offset="0" stop-color="#0A2A66"/><stop offset=".5" stop-color="#005EC2"/><stop offset="1" stop-color="#2F8BEF"/></linearGradient><filter id="p5f" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="10"/></filter></defs>
    <path id="p5pG" d="${d}" fill="none" stroke="url(#p5g)" stroke-width="18" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1" filter="url(#p5f)" opacity=".35"/>
    <path id="p5p" d="${d}" fill="none" stroke="url(#p5g)" stroke-width="8" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1"/>
    <circle id="p5d" r="15" fill="#fff" stroke="#005EC2" stroke-width="7"/>`;
  sc.root.appendChild(svg);
  const pth = svg.querySelector('#p5p'), pg = svg.querySelector('#p5pG'), pd = svg.querySelector('#p5d'), L = pth.getTotalLength();
  const lines = ['Nuestro éxito', 'ya está', 'trazado.'].map((s, i) => { const l = el('div', 'abs h', `left:0;top:${600 + i * 138}px;width:${W}px;text-align:center;font-size:126px;white-space:nowrap`); const ws = splitWords(l, s); if (i === 2) ws.forEach(w => w.classList.add('grad')); sc.root.appendChild(l); return { l, ws }; });
  sc.update = t => {
    const kd = P(t, Q0 + 0.1, Q0 + 2.8, E.inOutCubic), out = P(t, Q1 - 0.45, Q1 + 0.1, E.inCubic);
    pth.style.strokeDashoffset = 1 - kd; pg.style.strokeDashoffset = 1 - kd;
    const p = pth.getPointAtLength(L * kd); pd.setAttribute('cx', p.x); pd.setAttribute('cy', p.y); pd.setAttribute('opacity', kd > 0 && kd < 1 ? 1 : 0);
    svg.style.opacity = 1 - out;
    lines.forEach(({ l, ws }, i) => { rise(ws, t, Q0 + 0.3 + i * 0.4, 0.09, 1.0, 1.0, 14); S(l, { op: 1 - out, y: -out * 40, b: out * 14 }); });
  };
}

/* ═════════ I · Pantalla 6 ═════════ */
{
  const [Q0, Q1] = TL.P6;
  const sc = scene('sP6', Q0, Q1, 0.1, 0.4);
  const mk = (top, size, css = '') => { const l = el('div', 'abs h', `left:0;top:${top}px;width:${W}px;text-align:center;font-size:${size}px;white-space:nowrap;${css}`); sc.root.appendChild(l); return l; };
  const l1 = mk(560, 124), l2 = mk(700, 124), l3 = mk(866, 84, 'color:#6E6E73');
  const w1 = splitChars(l1, 'El espacio'), w2 = splitChars(l2, 'estratégico'), w3 = splitWords(l3, 'se gana haciendo');
  const l4w = el('div', 'abs', `left:0;top:990px;width:${W}px;text-align:center`);
  const l4 = el('div', 'h', 'position:relative;display:inline-block;font-size:118px;white-space:nowrap;padding:0 30px');
  const hl = el('div', 'abs', 'left:0;top:0;width:100%;height:136px;border-radius:30px;background:linear-gradient(100deg,#EAF3FF,#D9EAFF);transform-origin:0 50%');
  const w4 = splitWords(l4, 'la diferencia.'); w4.forEach(w => w.classList.add('grad'));
  l4.insertBefore(hl, l4.firstChild); l4w.appendChild(l4); sc.root.appendChild(l4w);
  sc.update = t => {
    const out = P(t, Q1 - 0.45, Q1 + 0.1, E.inCubic), ks = P(t, Q0 + 0.2, Q0 + 2.4, E.outCubic);
    [l1, l2].forEach(l => { l.style.letterSpacing = lerp(-0.075, 0.0, ks).toFixed(4) + 'em'; });
    rise(w1, t, Q0 + 0.2, 0.03, 1.0, 0.8, 12); rise(w2, t, Q0 + 0.6, 0.03, 1.0, 0.8, 12);
    rise(w3, t, Q0 + 1.3, 0.09, 1.0, 1.0, 12); rise(w4, t, Q0 + 2.0, 0.1, 1.0, 1.0, 14);
    const kh = P(t, Q0 + 2.4, Q0 + 3.2, E.inOutCubic); hl.style.transform = `scaleX(${kh.toFixed(4)})`; hl.style.opacity = kh > 0 ? 1 : 0;
    [l1, l2, l3, l4w].forEach(nd => S(nd, { op: 1 - out, y: -out * 40, b: out * 14 }));
  };
}

/* ═════════ J · Pantalla 7 ═════════ */
{
  const [Q0, Q1] = TL.P7;
  const sc = scene('sP7', Q0, Q1, 0.2, 0.4);
  const cv = el('canvas', '', 'left:0;top:0;width:1080px;height:1920px'); cv.width = W; cv.height = H; sc.root.appendChild(cv);
  const ctx = cv.getContext('2d');
  const l2 = el('div', 'abs', `left:0;top:1000px;width:${W}px;text-align:center;font-size:66px;font-weight:600;color:#6E6E73;letter-spacing:-0.02em`); const w2 = splitWords(l2, 'necesita a');
  const l3 = el('div', 'abs h', `left:0;top:1092px;width:${W}px;text-align:center;font-size:180px;white-space:nowrap;letter-spacing:-0.045em`); const w3 = splitWords(l3, 'Personas.'); w3.forEach(w => w.classList.add('grad'));
  sc.root.append(l2, l3);
  let parts = null;
  const build = () => {
    const oc = document.createElement('canvas'); oc.width = W; oc.height = 700; const o = oc.getContext('2d');
    o.font = '800 440px InterV'; o.textAlign = 'center'; o.textBaseline = 'middle'; o.letterSpacing = '-16px'; o.fillStyle = '#000'; o.fillText('R35', 540, 360);
    const d = o.getImageData(0, 0, W, 700).data, pts = [], st = 9;
    for (let y = 0; y < 700; y += st) for (let x = (y / st) % 2 ? st / 2 : 0; x < W; x += st) if (d[(y * W + Math.round(x)) * 4 + 3] > 140) pts.push([x, y + 380]);
    const r = rng(35), cols = [C.navy, C.deep, C.brand, C.brand, C.blue, C.sky];
    parts = pts.map(([x, y]) => { const a = r() * Math.PI * 2, rad = 500 + r() * 700; return { x, y, sx: 540 + Math.cos(a) * rad * 0.7, sy: 740 + Math.sin(a) * rad, dl: r() * 0.7, ph: r() * 6.28, col: cols[Math.floor(r() * cols.length)], sz: 3.4 + r() * 1.8 }; });
  };
  sc.update = t => {
    if (!parts) build();
    const out = P(t, Q1 - 0.5, Q1 + 0.1, E.inCubic);
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      const k = P(t, Q0 + 0.1 + p.dl, Q0 + 1.9 + p.dl, E.inOutCubic);
      const x = lerp(p.sx, p.x, k) + (1 - k) * 30 * Math.sin(t * 1.2 + p.ph) + Math.sin(t * 2 + p.ph) * 0.8 + out * (p.x - 540) * 0.3;
      const y = lerp(p.sy, p.y, k) + (1 - k) * 30 * Math.cos(t * 1.1 + p.ph) + Math.cos(t * 2.2 + p.ph) * 0.8 - out * 60;
      ctx.globalAlpha = P(t, Q0, Q0 + 0.6) * (1 - out) * (0.55 + 0.45 * k);
      ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(x, y, p.sz * (0.7 + 0.3 * k) * (1 - 0.5 * out), 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
    rise(w2, t, Q0 + 2.2, 0.1, 1.0, 1.0, 12); rise(w3, t, Q0 + 2.7, 0.1, 1.1, 1.0, 16);
    [l2, l3].forEach(nd => S(nd, { op: 1 - out, y: -out * 40, b: out * 14 }));
  };
}

/* ═════════ K · cierre ═════════ */
{
  const [Z0] = TL.Z;
  const sc = scene('sZ', Z0, TL.Z[1], 0.2, 0.5);
  const g = softGlow(); sc.root.appendChild(g);
  const L = buildLogo(sc.root, 100, 820, 880);
  const s1 = el('div', 'abs', `left:0;top:1080px;width:${W}px;text-align:center;font-size:54px;font-weight:650;letter-spacing:-0.02em`, CT.p1.title);
  const s2 = el('div', 'abs kick', `left:0;top:1162px;width:${W}px;text-align:center;font-size:27px;color:#6E6E73;letter-spacing:0.18em;line-height:1.6`, 'Plan de trabajo 2026–2028<br>Rumbo 35');
  sc.root.append(s1, s2);
  sc.update = t => {
    const r = t - Z0;
    S(g, { op: P(r, 0, 1.5, E.inOutSine) });
    const kh = P(r, 0.15, 1.3, E.outExpo);
    L.layers.hex.style.transformOrigin = `${LOGO.hexC * L.s}px 50%`;
    S(L.layers.hex, { op: P(r, 0.15, 0.7), s: 1.6 - 0.6 * kh, b: (1 - kh) * 22 });
    L.letters.style.clipPath = `polygon(-60px -60px,1400px -60px,1400px ${L.h.toFixed(1)}px,-60px ${L.h.toFixed(1)}px)`;
    LET.forEach((p, i) => { const k = P(r, 0.55 + i * 0.075, 1.55 + i * 0.075, E.outExpo); S(L.layers[p], { op: k, y: (1 - k) * L.h * 0.9, b: (1 - k) * 6 }); });
    const ks = P(r, 2.1, 3.2, E.inOutCubic); L.sheen.style.opacity = ks > 0 && ks < 1 ? 1 : 0; L.sheen.style.backgroundPosition = `${(1 - ks) * 100}% 0`;
    const k1 = P(r, 1.4, 2.3, E.outExpo), k2 = P(r, 1.7, 2.6, E.outExpo);
    S(s1, { op: k1, y: (1 - k1) * 26, b: (1 - k1) * 10 }); S(s2, { op: k2, y: (1 - k2) * 20, b: (1 - k2) * 8 });
  };
}

/* ═════════ render ═════════ */
const VEIL = $('veil');
window.renderFrame = t => {
  drawBg(t); updateRoad(t);
  for (const s of scenes) { const on = t >= s.a - s.pre && t <= s.b + s.post; show(s.root, on); if (on) s.update(t); }
  VEIL.style.opacity = P(t, TL.END - 0.5, TL.END, E.inOutSine).toFixed(3);
};
window.CUES = { end: TL.END, A: TL.A, B: TL.B, C: TL.C, olas: TL.olas, TR: TL.TR, OBJ: TL.OBJ, P5: TL.P5, P6: TL.P6, P7: TL.P7, Z: TL.Z, p1phrases: [10.2, 12.6, 15.0, 17.4, 19.8] };

(async () => {
  await document.fonts.load('700 100px InterV'); await document.fonts.load('500 40px InterV'); await document.fonts.ready;
  await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
  scenes.forEach(s => show(s.root, true));
  document.querySelectorAll('.gradw').forEach(g => { const gr = g.getBoundingClientRect(); g.style.setProperty('--gw', gr.width + 'px'); g.querySelectorAll('.w').forEach(w => { const r = w.getBoundingClientRect(); w.style.backgroundPosition = `${(gr.left - r.left).toFixed(1)}px ${(gr.top - r.top).toFixed(1)}px`; w.style.backgroundSize = `${gr.width}px ${gr.height}px`; }); });
  scenes.forEach(s => show(s.root, false));
  const q = new URLSearchParams(location.search);
  window.READY = true;
  if (q.has('play')) { const t0 = performance.now() - (+q.get('play') || 0) * 1000; const loop = () => { window.renderFrame(((performance.now() - t0) / 1000) % TL.END); requestAnimationFrame(loop); }; loop(); }
  else window.renderFrame(+(q.get('t') || 0));
})();
