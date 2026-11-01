import * as THREE from 'three';
import { P } from '../palette.js';
import { LOOP, TAU, BEAT, clamp, smooth, bell, hash } from '../config.js';

/** Beams and bolts. Each ray is a box stretched between two points that are pure functions of t. */
export function createRays(scene, ctx) {
  const rays = []; const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const ray = (o) => { rays.push(o); return o; };
  const flick = (t, r = 18) => (hash(Math.floor(t * r)) > 0.22 ? 1 : 0.35);

  // devil spells: a bolt leaves his hand every 4.5 s toward a rotating target, comet-style (tail behind head)
  const PS = 4.5, FLIGHT = 0.9;
  ray({ th: 0.16, color: 'magenta', gate: (t) => (t > 4 && t % PS < FLIGHT ? 1 : 0), seg: (t) => {
    const ph = t % PS, idx = Math.floor(t / PS) % 3, u = ph / FLIGHT, d = ctx.devilPos(t), a = V(d.x, 2.3 + ctx.lev(t), d.z), b = ctx.spellTarget(idx);
    const head = a.clone().lerp(b, smooth(u)), tail = a.clone().lerp(b, smooth(Math.max(0, u - 0.18))); head.y += 0.4 * Math.sin(Math.PI * u); tail.y += 0.4 * Math.sin(Math.PI * Math.max(0, u - 0.18)); return [tail, head]; } });
  ray({ th: 0.08, color: 'cyan2', gate: (t) => (t > 4 && t % PS < FLIGHT ? 1 : 0), seg: (t) => {
    const ph = t % PS, idx = Math.floor(t / PS) % 3, u = Math.max(0, ph / FLIGHT - 0.08), d = ctx.devilPos(t), a = V(d.x, 2.3 + ctx.lev(t), d.z), b = ctx.spellTarget(idx);
    const head = a.clone().lerp(b, smooth(u)), tail = a.clone().lerp(b, smooth(Math.max(0, u - 0.25))); head.y += 0.4 * Math.sin(Math.PI * u) + 0.1; tail.y += 0.4 * Math.sin(Math.PI * Math.max(0, u - 0.25)) + 0.1; return [tail, head]; } });
  // sentinels fire red beams from their eyes to the stone mouse eyes when the mask roars
  for (const sg of [-1, 1]) ray({ th: 0.14, color: 'red', gate: (t) => bell(t, BEAT.burst - 0.3, BEAT.burst + 0.5, BEAT.burstEnd - 2, BEAT.burstEnd) * flick(t), seg: (t) => { const s = ctx.sentPos(sg, t); return [V(s.x + 0.2, 2.15 + s.y, s.z), V(-ctx.HX + 1.4, 3.9, sg * 0.8)]; } });
  // deer man sprays rays in a rotating fan when he digs
  for (let k = 0; k < 6; k++) ray({ th: 0.1, color: k % 2 ? 'yellow' : 'orange', gate: (t) => (Math.sin(TAU * t / 2.0) > 0.45 ? flick(t + k, 16) : 0), seg: (t) => {
    const a = TAU * k / 6 + t * 2.0, h = V(11.0, 2.3, -2.8); return [h, h.clone().add(V(Math.cos(a) * 2.6, 0.9 + 0.5 * Math.sin(t * 5 + k), Math.sin(a) * 2.6))]; } });
  // singer radiates a golden fan from her chest
  for (let k = 0; k < 5; k++) ray({ th: 0.09, color: 'yellow2', gate: (t) => 0.5 + 0.5 * Math.sin(t * 2.4 + k) > 0.3 ? 1 : 0, seg: (t) => { const a = -0.9 + k * 0.45 + 0.2 * Math.sin(t * 1.3); return [V(0.5, 1.4, -3.7), V(0.5 + Math.sin(a) * 0.6, 1.4 + Math.cos(a) * 3.2, -3.7 + 1.2 * Math.sin(a))]; } });
  // cabin searchlight sweeps the hall
  ray({ th: 0.12, color: 'cyan2', gate: () => 1, seg: (t) => [V(18.5, 1.9, 2.7), V(11.5, 0.3, 2.7 - 4.2 * (0.5 + 0.5 * Math.sin(TAU * t / 9)))] });
  // goldfish drops a thunderbolt now and then
  ray({ th: 0.16, color: 'yellow', gate: (t) => ((t % 6) < 0.45 && Math.abs(ctx.fishAt(t).x) < 23 ? flick(t, 24) : 0), seg: (t) => { const f = ctx.fishAt(t); return [f.clone(), V(f.x + 0.8 * Math.sin(t * 40), 0.05, f.z)]; } });
  // choir: the baton throws a ray to each singer on the beat
  for (let k = 0; k < 5; k++) ray({ th: 0.1, color: ['pink', 'cyan', 'yellow2', 'lime', 'purple2'][k], gate: (t) => (ctx.choirW(t) > 0.8 && Math.sin(TAU * t / 1.5 + k * 0.8) > 0.55 ? 1 : 0), seg: () => { const s = ctx.choirSlots[k]; return [V(ctx.choirC.x + 0.4, 1.7, ctx.choirC.z), V(s.x, 1.9, s.z)]; } });
  // eclipse ring shoots a crimson lance down the mask hall at the burst
  ray({ th: 0.2, color: 'red3', gate: (t) => bell(t, BEAT.burst + 0.2, BEAT.burst + 0.9, BEAT.burst + 4, BEAT.burst + 5) * flick(t, 14), seg: () => [V(-3.6, 2.2, -4.3), V(-14, 0.8, 0.6)] });

  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ toneMapped: false }), rays.length);
  mesh.frustumCulled = false; scene.add(mesh);
  rays.forEach((r, i) => mesh.setColorAt(i, new THREE.Color(P[r.color])));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), mid = new THREE.Vector3(), dir = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  function update(t) {
    rays.forEach((r, i) => {
      const g = r.gate(t);
      if (!(g > 0.02)) { s.set(0, 0, 0); mid.set(0, -9, 0); q.identity(); m4.compose(mid, q, s); mesh.setMatrixAt(i, m4); return; }
      const [a, b] = r.seg(t); dir.subVectors(b, a); const len = dir.length(); if (len < 1e-3) { s.set(0, 0, 0); mid.copy(a); q.identity(); }
      else { dir.divideScalar(len); q.setFromUnitVectors(up, dir); mid.addVectors(a, b).multiplyScalar(0.5); s.set(r.th * g, len, r.th * g); }
      m4.compose(mid, q, s); mesh.setMatrixAt(i, m4);
    });
    mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }
  return { update, mesh };
}
