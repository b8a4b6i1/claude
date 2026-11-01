import * as THREE from 'three';
import { HX, HZ, MARK, BEAT, LOOP, TAU, clamp, lerp, smooth, win, bell, pulse, hash } from './config.js';
import { makeDevil, makeDiablo, makeVisitor, poseDevil, makeFish, poseFish, makeSentinel, poseSentinel, makeCube, poseCube, makePerson, poseWalk, poseLookUp } from './scene/actors.js';
import { createExtras } from './scene/cast2.js';
import { drawScreen, drawMonitor } from './scene/screens.js';
import { makeBurst, mouthGlow, makeMotes } from './scene/fx.js';

const lerpAngle = (a, b, k) => { let d = ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI; return a + d * k; };
const ease = (u) => lerp(u, smooth(u), 0.5);

/** Piecewise path: keys [t, x, z]. Returns position, heading, moving flag and travelled distance. */
function makePath(keys) {
  const cum = [0]; for (let i = 1; i < keys.length; i++) cum.push(cum[i - 1] + Math.hypot(keys[i][1] - keys[i - 1][1], keys[i][2] - keys[i - 1][2]));
  return (t) => {
    t = clamp(t, keys[0][0], keys[keys.length - 1][0]); let i = 0;
    while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
    const a = keys[i], b = keys[i + 1], span = b[0] - a[0], u = span > 0 ? clamp((t - a[0]) / span, 0, 1) : 1, e = ease(u);
    const len = cum[i + 1] - cum[i];
    return { x: lerp(a[1], b[1], e), z: lerp(a[2], b[2], e), moving: len > 0.01, u, dist: cum[i] + len * e, heading: len > 0.01 ? Math.atan2(b[1] - a[1], b[2] - a[2]) : null };
  };
}
const keyed = (keys, t) => { // angle keys [t, yaw], shortest-arc interpolation
  if (t <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const a = keys[i - 1], b = keys[i]; return lerpAngle(a[1], b[1], smooth((t - a[0]) / Math.max(1e-6, b[0] - a[0]))); }
  return keys[keys.length - 1][1];
};

const VISITOR = makePath([[0, 30, 2.6], [11, 15.5, 1.4], [17, 15.5, 1.4], [33, -4.5, 1.4], [37.5, -8.9, 3.45], [39, -9.55, 3.45], [51.2, -9.55, 3.45], [56, -9.0, 6.6], [70, -9.0, 6.6]]);
const VISITOR_YAW = [[0, -1.653], [10.2, -1.653], [11.2, 3.14], [16.2, 3.14], [17.2, -1.571], [32.4, -1.571], [33.4, -1.134], [37.0, -1.134], [37.8, -1.571], [51.2, -1.571], [51.8, 0.173], [70, 0.173]];
const DEVIL_AT = [6.0, 0.6], DEVIL_HOP = [9.5, 2.0]; // the red devil lives in the long hall
const DEVIL = makePath([[0, DEVIL_AT[0], DEVIL_AT[1]], [28, DEVIL_AT[0], DEVIL_AT[1]], [31, DEVIL_HOP[0], DEVIL_HOP[1]], [50, DEVIL_HOP[0], DEVIL_HOP[1]], [54, DEVIL_AT[0], DEVIL_AT[1]], [70, DEVIL_AT[0], DEVIL_AT[1]]]);
const CUBE_A = { x0: 9, a: 4, z: 3.4, w: 1, ph: 0 }, CUBE_B = { x0: 13, a: 2, z: -1.8, w: 1, ph: 2.1 };
const pacerDist = (a, t, ph) => { const u = TAU * t / LOOP + ph, m = Math.floor(u / Math.PI), r = u - m * Math.PI; return a * (2 * m + (r < Math.PI / 2 ? Math.sin(r) : 2 - Math.sin(r))) - a * (2 * Math.floor(ph / Math.PI) + 0); };

export function createStage(scene, parts) {
  const devil = new URLSearchParams(location.search).get('devil') === 'diablada' ? makeDiablo() : makeDevil(), fish = makeFish(), sent = [makeSentinel(), makeSentinel()], cubes = [makeCube('red'), makeCube('blue')], vis = makeVisitor();
  for (const o of [devil.root, fish.root, ...sent.map((s) => s.root), ...cubes.map((c) => c.root), vis.root]) scene.add(o);
  scene.add(fish.shadow); fish.shadow.visible = true; const extras = createExtras(scene);
  const burst = makeBurst(scene), motes = makeMotes(scene, LOOP);
  const fishPos = new THREE.Vector3(); const stool = parts.stool;
  const fishAt = (t) => { const u = clamp((t - BEAT.fishIn) / (BEAT.fishOut - BEAT.fishIn), 0, 1); return new THREE.Vector3(lerp(-30, 30, u), 3.5 + 0.6 * Math.sin(u * TAU * 3.5) + 0.7 * bell(u, 0.25, 0.4, 0.6, 0.75), 0.5 + 3.0 * Math.sin(u * TAU * 2.2)); };

  function update(t) {
    t = ((t % LOOP) + LOOP) % LOOP;
    extras.update(t);
    // screens, monitor, floor, mouth
    parts.screens.forEach((s) => drawScreen(s, t)); drawMonitor(parts.monitor, t);
    const burstE = bell(t, BEAT.burst, BEAT.burst + 1, BEAT.burstEnd - 1, BEAT.burstEnd + 1);
    parts.spiral.userData.recolor(t, burstE * 1.2); parts.eclipse.emissiveIntensity = 0.6 + 1.6 * burstE + 0.2 * Math.sin(t * 3); mouthGlow(parts.glow, t); burst.update(t); motes.update(t);

    // devil: dance energy, arms-up + flames at the burst, hop-walk between marks, head follows the fish
    const dp = DEVIL(t); const walkAmt = dp.moving ? smooth(dp.u / 0.12) * (1 - smooth((dp.u - 0.88) / 0.12)) : 0;
    const k = 0.75 + 0.45 * bell(t, 30, 32, 40, 42) + 0.55 * bell(t, BEAT.burst, BEAT.burst + 1, BEAT.burstEnd - 2, BEAT.burstEnd), up = bell(t, BEAT.burst - 0.4, BEAT.burst + 0.8, BEAT.burstEnd - 2.5, BEAT.burstEnd - 1), flame = bell(t, BEAT.burst + 0.4, BEAT.burst + 1.2, BEAT.burstEnd - 2.5, BEAT.burstEnd - 1.5);
    poseDevil(devil, t, k * (1 - walkAmt * 0.4), up, flame, { phase: dp.dist * TAU / 1.0, amt: walkAmt });
    devil.root.position.set(dp.x, 0, dp.z); devil.root.rotation.y = Math.PI / 4 + 0.2 * Math.sin(t * 0.8) - walkAmt * 0.3;
    fishPos.copy(fishAt(t)); const dd = Math.hypot(fishPos.x - dp.x, fishPos.z - dp.z), near = smooth(1 - dd / 6);
    const toFish = Math.atan2(fishPos.x - dp.x, fishPos.z - dp.z) - devil.root.rotation.y;
    devil.head.rotation.y += clamp(Math.atan2(Math.sin(toFish), Math.cos(toFish)), -0.9, 0.9) * near; devil.head.rotation.x -= 0.35 * near; devil.torso.rotation.x -= 0.12 * near;

    // goldfish crossing the hangar, banking into turns
    const fp = fishAt(t), fn = fishAt(t + 0.05), dir = fn.clone().sub(fp).normalize(); fish.root.position.copy(fp);
    fish.root.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir); poseFish(fish, t, 0, clamp((fn.z - fp.z) * 6, -0.8, 0.8));
    fish.shadow.position.set(fp.x, 0.02, fp.z); fish.shadow.material.opacity = 0.55 * clamp(1 - Math.abs(fp.x) / 29, 0, 1);

    // sentinels bow and step forward at the burst
    sent.forEach((s, i) => {
      const step = bell(t, BEAT.burst - 0.5, BEAT.burst + 1.2, BEAT.burstEnd - 1.5, BEAT.burstEnd + 0.5);
      s.root.position.set(i ? MARK.mask[0] + 2.5 : MARK.mask[0] - 2.5, 0, -HZ + 0.95 + step * 1.0); s.root.rotation.y = i ? -0.15 : 0.15;
      poseSentinel(s, t, i, bell(t, BEAT.burst + 0.5, BEAT.burst + 1.8, BEAT.burst + 4.5, BEAT.burst + 6), step);
    });

    // cube figures pace a lane (phase driven by distance travelled)
    [CUBE_A, CUBE_B].forEach((c, i) => {
      const u = TAU * t / LOOP + c.ph, x = c.x0 + c.a * Math.sin(u), vx = Math.cos(u);
      cubes[i].root.position.set(x, 0, c.z); cubes[i].root.rotation.y = Math.PI / 2 * Math.tanh(vx * 6);
      poseCube(cubes[i], pacerPhase(c, t), 0.5 * Math.sin(t * 0.5 + i * 2) * (1 - Math.abs(vx)));
    });

    // visitor: walk in, read the screens, sit at the desk, watch the burst, walk out
    const vp = VISITOR(t), yaw = keyed(VISITOR_YAW, t); vis.root.position.set(vp.x, 0, vp.z); vis.root.rotation.y = yaw;
    const seat = smooth(win(t, 39.0, 1.3)) * (1 - smooth(win(t, 50.0, 1.2)));
    const phase = vp.dist * TAU / 1.55;
    if (vp.moving && t < 39.0 || t > 51.2) { poseWalk(vis, phase, 1, 0, 0); vis.root.position.y = 0; }
    else if (t >= 11 && t < 17) { poseLookUp(vis, 0.3 * Math.sin(t * 0.7), 0.22 * bell(t, 11.4, 12.6, 16, 17), t); vis.root.position.y = 0; }
    else if (t >= 39.0 && t <= 51.2) {
      poseWalk(vis, 0, 0, 0, 0); 
      for (const l of vis.legs) { l.hip.rotation.x = lerp(l.hip.rotation.x, -1.45, seat); l.kn.rotation.x = lerp(l.kn.rotation.x, 1.4, seat); l.an.rotation.x = lerp(l.an.rotation.x, 0.05, seat); }
      vis.arms.forEach((a) => { a.sh.rotation.x = lerp(a.sh.rotation.x, -0.75, seat); a.el.rotation.x = lerp(a.el.rotation.x, -1.0, seat); });
      vis.pel.position.y = lerp(0.86, 0.86, seat); vis.root.position.y = lerp(0, -0.26, seat);
      vis.head.rotation.y = seat * (-0.2 - 0.9 * bell(t, BEAT.burst - 0.5, BEAT.burst + 1, BEAT.burstEnd - 1, BEAT.burstEnd)); vis.head.rotation.x = -0.1 * seat;
    } else { poseWalk(vis, 0, 0, 0, 0); vis.root.position.y = 0; }
    vis.shadow.position.y = 0.02 - vis.root.position.y;
    devil.shadow.position.y = 0.02 / devil.root.scale.y;
  }
  return { update, actors: { devil, fish, sent, cubes, vis, extras: extras.list.map((e) => e.o) }, burst };
}
const pacerPhase = (c, t) => { const u = TAU * t / LOOP + c.ph, m = Math.floor(u / Math.PI), r = u - m * Math.PI; const s = c.a * (2 * m + (r < Math.PI / 2 ? Math.sin(r) : 2 - Math.sin(r))); return s * TAU / 1.3; };
