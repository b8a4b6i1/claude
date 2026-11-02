import * as THREE from 'three';
import { P } from '../palette.js';
import { LOOP, TAU, BEAT, clamp, smooth, bell, hash, X0, X1, BAND, bandReturn } from '../config.js';

const col = (n) => new THREE.Color(P[n]);

/**
 * Magic particles. Every particle is a pure function of t: a slot k is reborn every `P` seconds
 * (continuous mode) or in a burst at `off + n*P` (burst mode); position = origin(tb) + v*age + g*age^2/2.
 * `P` divides the loop length so the loop closes without a pop.
 */
export function createMagic(scene, ctx) {
  const specs = [];
  const spec = (o) => { o.id = specs.length; specs.push(o); return o; };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // --- goldfish: rainbow sparkle trail
  spec({ n: 24, P: 1.8, life: 1.8, size: 0.34, grav: -0.4, colors: ['red', 'orange', 'yellow', 'lime', 'cyan', 'blue2', 'magenta'],
    gate: (t) => { const f = ctx.fishAt(t); return f.x > X0 + 1 && f.x < X1 - 1 ? 1 : 0; },
    origin: (tb, r) => ctx.fishAt(tb).add(V((r[0] - 0.5) * 0.5, (r[1] - 0.5) * 0.5, (r[2] - 0.5) * 0.5)), vel: (r) => V((r[0] - 0.5) * 0.6, 0.2 + r[1] * 0.5, (r[2] - 0.5) * 0.6) });
  // --- singer: music notes drift up
  spec({ n: 8, P: 0.9, life: 0.9 * 2.8, lifeMax: 2.6, size: 0.3, grav: 0, colors: ['pink', 'cyan', 'yellow', 'lime'], sway: 0.18,
    gate: () => 1, origin: (tb) => { const q = ctx.singerPos(tb); return V(q.x, 1.9, q.z); }, vel: (r) => V(0.3 + 0.3 * r[0], 0.7 + 0.2 * r[1], (r[2] - 0.5) * 0.3) });
  // --- boulder coins when the deer man digs
  spec({ n: 10, P: 2.0, off: 0.5, life: 1.5, size: 0.3, grav: -9, colors: ['yellow', 'orange2', 'orange'], mode: 'burst',
    gate: (t) => (t > 6 ? 1 : 0), origin: () => V(7.3, 0.7, -2.4), vel: (r) => V((r[0] - 0.5) * 2.4, 3.6 + r[1] * 1.6, (r[2] - 0.5) * 2.4) });
  // --- swordsman slashes: ring of cold sparks
  spec({ n: 8, P: 2.5, off: 0.3, life: 0.9, size: 0.3, grav: -1, colors: ['cyan', 'blue2', 'purple2'], mode: 'burst', gate: () => 1,
    origin: (tb) => { const c = ctx.cubeA(tb); return V(c.x, 1.0, c.z); }, vel: (r, k, n) => { const a = (k / n) * TAU; return V(Math.cos(a) * 2.6, 0.4 + r[0] * 0.8, Math.sin(a) * 2.6); } });
  // --- cabin: stars pour out of the hatch, dust ring when it lands
  spec({ n: 6, P: 3.0, life: 3.0, size: 0.3, grav: -0.1, colors: ['yellow', 'pink', 'cyan'], gate: () => 1,
    origin: () => V(9.7, 1.9, 3.75), vel: (r) => V(1.0 + 0.8 * r[0], 0.9 + 0.5 * r[1], (r[2] - 0.5) * 1.4) });
  // --- Proxy leaves a rainbow trail on the floor as he skates
  spec({ n: 36, P: 3.0, life: 3.0, size: 0.3, grav: 0, colors: ['red', 'orange', 'yellow', 'lime', 'cyan', 'blue2', 'purple2'],
    gate: () => 1, origin: (tb) => { const q = ctx.proxyPos(tb); return V(q.x, 0.08, q.z); }, vel: () => V(0, 0, 0) });
  // --- notes drift up from Romi's theremin
  spec({ n: 5, P: 1.5, life: 1.5, size: 0.3, grav: 0, colors: ['teal', 'pink', 'cyan', 'yellow'], sway: 0.2, gate: () => 1, origin: (tb) => { const q = ctx.romiPos(tb); return V(q.x + 0.5, 1.45, q.z + 0.2); }, vel: (r) => V((r[0] - 0.5) * 0.4, 0.7, (r[1] - 0.5) * 0.4) });
  // --- computer glyphs while the visitor sits
  spec({ n: 14, P: 1.5, life: 1.5, size: 0.28, grav: 0, colors: ['green', 'lime', 'cyan'],
    gate: (t) => bell(t, 39.5, 41, 51, 52.5), origin: () => V(-12.8, 1.15, -3.55), vel: (r) => V((r[0] - 0.5) * 0.5, 0.8, 0.5 + 0.3 * r[1]) });
  // --- eclipse embers
  spec({ n: 8, P: 1.5, life: 1.5, size: 0.28, grav: 0, colors: ['orange', 'red3', 'yellow'],
    gate: (t) => 0.45 + 0.55 * bell(t, BEAT.burst - 0.4, BEAT.burst + 0.8, BEAT.burstEnd - 1, BEAT.burstEnd + 1),
    origin: () => V(-3.6, 2.2, -4.55), vel: (r) => V((r[0] - 0.5) * 0.9, 0.7, 0.3 + 0.2 * r[1]) });
  // --- devil: swirling sparks while he levitates, plus one summoning ring
  spec({ n: 18, P: 1.8, life: 1.8, size: 0.34, grav: -0.2, colors: ['red3', 'orange', 'magenta', 'yellow'], gate: (t) => bell(t, 36, 39, 51, 54),
    origin: (tb, r) => { const d = ctx.devilPos(tb), a = r[0] * TAU; return V(d.x + Math.cos(a) * 0.9, 0.3 + ctx.lev(tb), d.z + Math.sin(a) * 0.9); }, vel: (r) => V((r[1] - 0.5) * 0.6, 1.3 + r[2] * 0.8, (r[2] - 0.5) * 0.6) });
  // --- choir: notes rise over each singer
  spec({ n: 4, P: 1.5, life: 1.5, size: 0.3, grav: 0, colors: ['pink', 'cyan', 'yellow', 'lime', 'purple2'], sway: 0.14, gate: (t) => (ctx.choirW(t) > 0.8 ? 1 : 0),
    origin: (tb, r, k) => { const s = ctx.choirSlots[ctx.choirActive(tb)]; return V(s.x, 1.9, s.z); }, vel: (r) => V((r[0] - 0.5) * 0.3, 0.8 + 0.3 * r[1], (r[2] - 0.5) * 0.3) });
  // --- devil spell impact: sparks where each bolt lands
  spec({ n: 10, P: 4.5, off: 0.9, life: 1.0, size: 0.34, grav: -3, colors: ['magenta', 'cyan', 'purple2', 'pink'], mode: 'burst', gate: (t) => (t > 14 && t < 73.5 && !(t > 53.4 && t < 61.4) ? 1 : 0),
    origin: (tb) => { const p = ctx.spellTarget(Math.floor((tb - 0.9) / 4.5 + 1e-6) % 3, tb); return V(p.x, p.y, p.z); }, vel: (r, k, n) => { const a = (k / n) * TAU; return V(Math.cos(a) * (1 + 2 * r[0]), 1.2 + 2 * r[1], Math.sin(a) * (1 + 2 * r[0])); } });
  // --- the devil sleeps: slow Z's rise; wakes with a ring of stars
  spec({ n: 3, P: 2.0, life: 2.0, size: 0.34, grav: 0, colors: ['blue2', 'cyan'], sway: 0.25, gate: (t) => (ctx.sleepK(t) > 0.5 ? 1 : 0),
    origin: (tb) => { const d = ctx.devilPos(tb); return V(d.x, 2.7, d.z); }, vel: (r) => V(0.3, 0.5, (r[0] - 0.5) * 0.2) });
  spec({ n: 12, P: LOOP, off: 10.5, life: 1.0, size: 0.34, grav: -1, colors: ['yellow', 'orange', 'red3'], mode: 'burst', gate: () => 1,
    origin: (tb) => { const d = ctx.devilPos(tb); return V(d.x, 2.0, d.z); }, vel: (r, k, n) => { const a = (k / n) * TAU; return V(Math.cos(a) * 2.2, 0.8 + r[0], Math.sin(a) * 2.2); } });
  // --- the devil burns to ash: embers and soot rise as he crumbles, then sparks converge on the pile when he re-forms
  spec({ n: 26, P: LOOP, off: 53.6, life: 2.4, size: 0.34, grav: 0.5, colors: ['con4', 'orange', 'ink', 'yellow', 'con3', 'red3'], mode: 'burst', gate: () => 1,
    origin: (tb, r) => { const d = ctx.devilPos(tb); return V(d.x + (r[0] - 0.5) * 0.8, 0.4 + r[1] * 1.6, d.z + (r[2] - 0.5) * 0.8); }, vel: (r) => V((r[0] - 0.5) * 1.6, 0.8 + r[1] * 1.6, (r[2] - 0.5) * 1.6) });
  spec({ n: 22, P: LOOP, off: 58.4, life: 1.8, size: 0.34, grav: 0, colors: ['orange', 'yellow', 'red3', 'orange2'], mode: 'burst', gate: () => 1,
    origin: (tb, r) => { const d = ctx.devilPos(tb), a = r[0] * TAU; return V(d.x + Math.cos(a) * 2.0, 0.2 + r[1] * 1.8, d.z + Math.sin(a) * 2.0); }, vel: (r, k, n) => { const a = r[0] * TAU; return V(-Math.cos(a) * 1.05, 0.2 + 0.2 * r[1], -Math.sin(a) * 1.05); } });
  // --- the goldfish eliminates the musicians one by one: a poof at each, and a pop of sparks when they return
  BAND.forEach((b, i) => {
    spec({ n: 16, P: LOOP, off: b.tk, life: 1.2, size: 0.36, grav: -3, colors: ['red', 'orange', 'yellow', 'magenta', 'cyan'], mode: 'burst', gate: () => 1,
      origin: () => V(b.x, 1.0, b.z), vel: (r, k, n) => { const a = (k / n) * TAU; return V(Math.cos(a) * (1.2 + 1.6 * r[0]), 1.6 + 2 * r[1], Math.sin(a) * (1.2 + 1.6 * r[0])); } });
    spec({ n: 8, P: LOOP, off: bandReturn(i), life: 0.9, size: 0.3, grav: -1, colors: ['yellow', 'lime', 'cyan'], mode: 'burst', gate: () => 1,
      origin: () => V(b.x, 0.3, b.z), vel: (r, k, n) => { const a = (k / n) * TAU; return V(Math.cos(a) * 1.4, 0.8 + r[0], Math.sin(a) * 1.4); } });
  });
  // --- wish machine: sparkles where the prize bursts every 9 s (prize apex is 1.8 m in front of the booth, 3.4 m high)
  spec({ n: 12, P: 9.0, off: 5.0, life: 1.0, size: 0.32, grav: -2, colors: ['pink', 'yellow', 'cyan', 'lime', 'magenta'], mode: 'burst', gate: () => 1,
    origin: () => V(10.1, 3.3, 3.75), vel: (r, k, n) => { const a = (k / n) * TAU; return V(Math.cos(a) * 1.3, 0.8 + r[0] * 1.2, Math.sin(a) * 1.3); } });
  // --- summoning and dispersal puffs (once per loop)
  spec({ n: 14, P: LOOP, off: 16.2, life: 1.6, size: 0.36, grav: -1, colors: ['cyan', 'purple2', 'pink', 'yellow'], mode: 'burst', gate: () => 1,
    origin: () => V(ctx.choirC.x, 1.6, ctx.choirC.z), vel: (r, k, n) => { const a = (k / n) * TAU; return V(Math.cos(a) * (1.5 + 2 * r[0]), 1.0 + r[1] * 1.8, Math.sin(a) * (1.5 + 2 * r[0])); } });
  spec({ n: 25, P: LOOP, off: 36.0, life: 1.8, size: 0.36, grav: -2, colors: ['red', 'yellow', 'lime', 'cyan', 'magenta'], mode: 'burst', gate: () => 1,
    origin: (tb, r, k) => { const s = ctx.choirSlots[k % ctx.choirSlots.length]; return V(s.x, 1.0, s.z); }, vel: (r, k, n) => { const a = r[0] * TAU; return V(Math.cos(a) * (1 + 3 * r[1]), 1.5 + 2 * r[2], Math.sin(a) * (1 + 3 * r[1])); } });

  const total = specs.reduce((s, sp) => s + sp.n, 0) + 4 * 2;
  const geo = new THREE.OctahedronGeometry(0.5, 0);
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ toneMapped: false }), total);
  mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);
  const colCache = {}; const cc = (n) => colCache[n] || (colCache[n] = col(n));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
  const r3 = [0, 0, 0];
  let colourSet = false;
  const hide = (i) => { s.set(0, 0, 0); p.set(0, -9, 0); q.identity(); m4.compose(p, q, s); mesh.setMatrixAt(i, m4); };

  function update(t) {
    let i = 0;
    for (const sp of specs) {
      const dt = sp.P / sp.n, burst = sp.mode === 'burst', off = sp.off || 0;
      for (let k = 0; k < sp.n; k++, i++) {
        const tb0 = burst ? Math.floor((t - off) / sp.P) * sp.P + off + k * 0.004 : Math.floor((t - k * dt) / sp.P) * sp.P + k * dt;
        const age = t - tb0;
        const tbw = ((tb0 % LOOP) + LOOP) % LOOP, life = sp.lifeMax || sp.life;
        const g = age >= 0 && age <= life ? sp.gate(tbw) : 0;
        if (!(g > 0.02)) { hide(i); continue; }
        const batch = Math.round((tb0 - k * (burst ? 0.004 : dt)) / sp.P);
        r3[0] = hash(k * 12.9 + batch * 78.2 + sp.id * 3.1); r3[1] = hash(k * 7.7 + batch * 31.4 + sp.id * 5.3); r3[2] = hash(k * 3.3 + batch * 91.7 + sp.id * 9.7);
        const o = sp.origin(tbw, r3, k), v = sp.vel(r3, k, sp.n);
        p.set(o.x + v.x * age, o.y + v.y * age + 0.5 * (sp.grav || 0) * age * age, o.z + v.z * age);
        if (sp.sway) p.x += Math.sin(age * 3 + r3[0] * 6) * sp.sway;
        if (p.y < 0.05) p.y = 0.05;
        const f = clamp(1 - age / life, 0, 1), sc = 0.5 * sp.size * Math.pow(f, 0.6) * Math.min(1, age * 8) * Math.min(1, g * 2);
        s.set(sc, sc * 1.3, sc); e.set(age * 2 + r3[1] * 6, age * 3 + r3[2] * 6, 0); q.setFromEuler(e); m4.compose(p, q, s); mesh.setMatrixAt(i, m4);
        mesh.setColorAt(i, cc(sp.colors[((k + batch) % sp.colors.length + sp.colors.length) % sp.colors.length]));
      }
    }
    // orbiting orbs around the devil and around the singer in red
    for (const [oi, who] of [[0, 'devil'], [1, 'woman']]) for (let k = 0; k < 4; k++, i++) {
      const g = oi === 0 ? bell(t, 16, 20, 70, 76) : bell(t, 41, 43, 49, 51);
      if (g < 0.02) { hide(i); continue; }
      const c = oi === 0 ? ctx.devilPos(t) : ctx.womanPos(t), a = t * (oi ? 2.2 : 1.6) + (k / 4) * TAU, rr = oi ? 0.9 : 1.5;
      p.set(c.x + Math.cos(a) * rr, (oi ? 1.3 : 1.4) + (oi === 0 ? ctx.lev(t) : 0.6 * bell(t, 41, 43, 49, 51)) + 0.35 * Math.sin(a * 2 + k), c.z + Math.sin(a) * rr);
      const sc = 0.3 * g; s.set(sc, sc * 1.3, sc); e.set(a, a * 1.3, 0); q.setFromEuler(e); m4.compose(p, q, s); mesh.setMatrixAt(i, m4);
      mesh.setColorAt(i, cc(['cyan', 'yellow', 'magenta', 'lime'][k]));
    }
    colourSet = true;
    mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }
  return { update, mesh };
}
