import * as THREE from 'three';
import { conductor } from './cast2.js';
import { poseWalk } from './actors.js';
import { TAU, LOOP, clamp, lerp, smooth, win, bell } from '../config.js';

const lerpAngle = (a, b, k) => { const d = ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI; return a + d * k; };
export const CHOIR = { C: { x: 3.0, z: 0.0 }, summon: 17.0, formed: 22.0, singEnd: 36.0, gone: 40.0 };
const pos = (t) => ({ x: 4.5 + 3.5 * Math.sin(TAU * t / 45), z: 1.4 * Math.sin(TAU * t / 30 + 1) });
/** 0 = everyone at home, 1 = in the choir; smooth ramps in and out. */
export const choirW = (t) => smooth((t - CHOIR.summon) / (CHOIR.formed - CHOIR.summon)) * (1 - smooth((t - CHOIR.singEnd) / (CHOIR.gone - CHOIR.singEnd)));
export const BEAT_P = 1.5;
export const choirActive = (t) => Math.floor(Math.max(0, t - CHOIR.formed + 0.4) / BEAT_P) % 5;
export const SLOTS = [-0.9, -0.45, 0, 0.45, 0.9].map((a) => ({ x: CHOIR.C.x + 2.4 * Math.cos(a), z: CHOIR.C.z + 2.4 * Math.sin(a) }));

/** The conductor wanders with his baton, summons five characters into a choir, conducts them, then sends them spinning home. */
export function createChoir(scene, members) {
  const c = conductor(); scene.add(c.root);
  // arc length table so the stride is continuous across the loop seam
  const N = 1800, dist = new Float32Array(N + 1);
  for (let i = 1; i <= N; i++) { const a = pos((i - 1) * LOOP / N), b = pos(i * LOOP / N); dist[i] = dist[i - 1] + Math.hypot(b.x - a.x, b.z - a.z); }
  const stride = dist[N] / Math.max(1, Math.round(dist[N] / 1.55));
  const distAt = (t) => { const f = clamp(t / LOOP, 0, 1) * N, i = Math.min(N - 1, Math.floor(f)); return lerp(dist[i], dist[i + 1], f - i); };
  members.forEach((m) => { m.home = m.moving ? null : m.o.root.position.clone(); m.baseYaw = m.o.root.rotation.y; });

  function update(t) {
    const w = choirW(t), pp = pos(t), pn = pos(t + 0.05), dx = pn.x - pp.x, dz = pn.z - pp.z, sp = Math.hypot(dx, dz) / 0.05;
    const walkY = Math.atan2(dx, dz);
    c.root.position.set(lerp(pp.x, CHOIR.C.x, w), 0, lerp(pp.z, CHOIR.C.z, w)); c.root.rotation.y = lerpAngle(walkY, Math.PI / 2, w);
    const moving = clamp(sp / 0.5, 0, 1) * (1 - w);
    poseWalk(c, distAt(t) / stride * TAU, moving, 0.2 * Math.sin(t * 0.6), 0);
    const bw = TAU * t / 1.5, conducting = w;
    const act = choirActive(t), prev = (act + 4) % 5, ph = ((t - CHOIR.formed + 0.4) % BEAT_P + BEAT_P) % BEAT_P, mixAct = smooth(ph / 0.3);
    const aAng = (i) => -0.9 + i * 0.45, face = Math.PI / 2 - lerp(aAng(prev), aAng(act), mixAct);
    c.root.rotation.y = lerpAngle(c.root.rotation.y, face, w > 0.5 ? 0.85 * smooth((w - 0.5) / 0.5) : 0);
    c.arms[1].sh.rotation.set(-1.15 + 0.45 * Math.sin(bw) * (0.35 + conducting), 0, 0.28); c.arms[1].el.rotation.set(-0.9 + 0.5 * Math.cos(bw) * (0.35 + conducting), 0, 0);
    c.arms[0].sh.rotation.set(lerp(c.arms[0].sh.rotation.x, -1.0 + 0.4 * Math.sin(bw + 1), conducting), 0, lerp(-0.1, -0.7, conducting));
    members.forEach((m, i) => {
      const r = m.o.root, slot = SLOTS[i], base = m.home ? m.home : r.position;
      const toC = Math.atan2(CHOIR.C.x - slot.x, CHOIR.C.z - slot.z);
      const disp = smooth((t - CHOIR.singEnd) / (CHOIR.gone - CHOIR.singEnd)), spin = (disp > 0 && disp < 1) ? TAU * 2 * disp : 0;
      const hx = base.x, hz = base.z;
      r.position.set(lerp(hx, slot.x, w), (w > 0.8 ? 0.07 * Math.abs(Math.sin(t * 4.0 + i)) : 0) + 0.8 * Math.sin(Math.PI * clamp(disp, 0, 1)), lerp(hz, slot.z, w));
      r.rotation.y = lerpAngle(m.baseYaw === undefined ? r.rotation.y : r.rotation.y, toC, w) + spin;
      if (w > 0.8) {
        const solo = i === act ? Math.sin(Math.PI * clamp(ph / BEAT_P, 0, 1)) : 0; // the one the baton points at jumps and glows
        r.position.y += 0.55 * solo; r.scale.setScalar(1 + 0.1 * solo);
        r.rotation.y = lerpAngle(r.rotation.y, Math.atan2((SLOTS[(i + 1) % 5].x - slot.x), (SLOTS[(i + 1) % 5].z - slot.z)), 0.25 * (1 - solo)); // neighbours glance at each other
        r.rotation.z = 0.06 * Math.sin(t * 3 + i * 1.7) + 0.12 * solo * Math.sin(t * 20);
      } else r.scale.setScalar(1);
    });
  }
  return { update, root: c.root };
}
