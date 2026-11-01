import * as THREE from 'three';
import { M, hex } from './common.js';
import { HZ, HX, MARK, BEAT, TAU, clamp, lerp, smooth, hash, bell } from '../config.js';
import { P } from '../palette.js';

const RB = ['red', 'orange', 'yellow', 'lime', 'green', 'cyan', 'blue', 'purple', 'magenta', 'pink', 'red3', 'blue2'];

/** Confetti ribbons leave the stone mouth on solved arcs and land on the floor. Pure function of t. */
export function makeBurst(scene) {
  const N = 150; const geo = new THREE.BoxGeometry(0.34, 0.08, 0.24);
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.8 }), N);
  mesh.frustumCulled = false; mesh.castShadow = true;
  const items = [];
  for (let i = 0; i < N; i++) {
    const a = hash(i * 3 + 1) * TAU, r = Math.sqrt(hash(i * 3 + 2)) * 4.0;
    const B = new THREE.Vector3(MARK.spiral[0] + 1.5 + Math.cos(a) * r, 0.05, MARK.spiral[1] + Math.sin(a) * r * 0.9);
    const A = new THREE.Vector3(MARK.mask[0] + 1.0, 3.3 + (hash(i * 7) - 0.5) * 0.3, MARK.mask[1] + (hash(i * 5) - 0.5) * 0.5);
    const C = A.clone().lerp(B, 0.5).add(new THREE.Vector3((hash(i * 11) - 0.5) * 3, 2.2 + hash(i * 13) * 2.4, 1.0));
    items.push({ A, B, C, d: hash(i * 17) * 3.6, life: 2.4 + hash(i * 19) * 1.4, spin: hash(i * 23) * 9 + 3, ax: new THREE.Vector3(hash(i), hash(i + 5), hash(i + 9)).normalize(), land: hash(i * 29) * TAU });
    mesh.setColorAt(i, hex(RB[i % RB.length]));
  }
  scene.add(mesh);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), qf = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  return {
    mesh, update(t) {
      for (let i = 0; i < N; i++) {
        const it = items[i], u = (t - BEAT.burst - it.d) / it.life;
        const fade = 1 - smooth((t - BEAT.burstEnd - 2.0 - it.d * 0.5) / 2.0);
        if (u <= 0 || fade <= 0.01) { s.set(0, 0, 0); p.set(0, -5, 0); q.identity(); }
        else {
          const k = clamp(u, 0, 1), o = 1 - k;
          p.set(o * o * it.A.x + 2 * o * k * it.C.x + k * k * it.B.x, o * o * it.A.y + 2 * o * k * it.C.y + k * k * it.B.y, o * o * it.A.z + 2 * o * k * it.C.z + k * k * it.B.z);
          if (u < 1) q.setFromAxisAngle(it.ax, u * it.spin); else { q.setFromEuler(new THREE.Euler(0, it.land, 0)); }
          s.set(fade, fade, fade);
        }
        m4.compose(p, q, s); mesh.setMatrixAt(i, m4);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

/** Mouth glow: ink → ember → gold, pulsing while the burst is live. */
export function mouthGlow(glow, t) {
  const e = bell(t, BEAT.burst - 0.4, BEAT.burst + 0.5, BEAT.burstEnd - 1, BEAT.burstEnd + 1.5);
  const pal = e < 0.05 ? 'ink' : e < 0.35 ? 'rust2' : e < 0.65 ? 'rust0' : (Math.floor(t * 8) % 2 ? 'orange2' : 'yellow');
  glow.material.color.set(P[pal]);
}

/** Ambient dust motes, periodic over the loop. */
export function makeMotes(scene, loop) { // no longer used: the white specks made the cast hard to read
  const N = 90; const g = new THREE.Group(); const motes = [];
  for (let i = 0; i < N; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), M('wall0', { emit: 0.15 })); g.add(m); motes.push({ m, x: -23 + hash(i) * 46, y: 1 + hash(i + 3) * 4.5, z: -4 + hash(i + 7) * 8, ph: hash(i + 11) * TAU, k: 1 + Math.floor(hash(i + 13) * 2) }); }
  scene.add(g);
  return { g, update(t) { const w = TAU * t / loop; for (const o of motes) o.m.position.set(o.x + Math.sin(w * o.k + o.ph) * 0.8, o.y + Math.sin(w * 2 * o.k + o.ph) * 0.35, o.z + Math.cos(w * o.k + o.ph) * 0.8); } };
}
