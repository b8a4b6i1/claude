import * as THREE from 'three';
import { P } from './palette.js';
import { M } from './scene/common.js';
import { HX, HZ, X0, X1, MARK, BEAT, LOOP, TAU, clamp, lerp, smooth, win, bell, pulse, hash, spellHit, sleepK, devilBody, ashPile, devilChar, BAND } from './config.js';
import { makeDevil, charDevil, makeDiablo, makeVisitor, poseDevil, makeFish, poseFish, makeSentinel, poseSentinel, makeCube, poseCube, makePerson, poseWalk, poseLookUp } from './scene/actors.js';
import { createExtras } from './scene/cast2.js';
import { createMagic } from './scene/magic.js';
import { createChoir, choirW, choirActive, SLOTS, CHOIR } from './scene/choir.js';
import { drawScreen, drawMonitor } from './scene/screens.js';
import { makeBurst, mouthGlow, makeMotes } from './scene/fx.js';

const lerpAngle = (a, b, k) => { let d = ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI; return a + d * k; };
const ease = (u) => lerp(u, smooth(u), 0.5);

/** Piecewise path: keys [t, x, z]. Returns position, heading, moving flag and travelled distance. */
function makePath(keys, lin = false) {
  const cum = [0]; for (let i = 1; i < keys.length; i++) cum.push(cum[i - 1] + Math.hypot(keys[i][1] - keys[i - 1][1], keys[i][2] - keys[i - 1][2]));
  return (t) => {
    t = clamp(t, keys[0][0], keys[keys.length - 1][0]); let i = 0;
    while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
    const a = keys[i], b = keys[i + 1], span = b[0] - a[0], u = span > 0 ? clamp((t - a[0]) / span, 0, 1) : 1, e = lin ? u : ease(u);
    const len = cum[i + 1] - cum[i];
    return { x: lerp(a[1], b[1], e), z: lerp(a[2], b[2], e), moving: len > 0.01, u, dist: cum[i] + len * e, heading: len > 0.01 ? Math.atan2(b[1] - a[1], b[2] - a[2]) : null };
  };
}
const keyed = (keys, t) => { // angle keys [t, yaw], shortest-arc interpolation
  if (t <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const a = keys[i - 1], b = keys[i]; return lerpAngle(a[1], b[1], smooth((t - a[0]) / Math.max(1e-6, b[0] - a[0]))); }
  return keys[keys.length - 1][1];
};

const VISITOR = makePath([[0, 17, 0.5], [3.5, 12.6, -0.3], [16, 12.6, -0.3], [30, -3, 2.2], [32, -6.5, 2.2], [38, -12.75, -2.4], [39, -12.75, -2.95], [52, -12.75, -2.95], [53, -12.75, -2.4], [58.5, -6.5, 2.2], [60.5, -3, 2.2], [74.5, 12.6, -0.3], [78, 17, 0.5], [90, 17, 0.5]]);
const VISITOR_YAW = [[0, -1.571], [3.5, -1.571], [9.8, 3.14], [15.4, 3.14], [16.6, -1.75], [30, -1.75], [31, -1.571], [32, -1.571], [33, -2.2], [37.5, -2.2], [39, 3.14], [52, 3.14], [52.8, 0.94], [58, 0.94], [59, 1.571], [90, 1.571]];
const DEVIL_AT = [10.2, -0.5], DEVIL_HOP = [-11.0, 1.5]; // sleeps by the entry, then patrols the whole hangar: long hall, through the passage, to the spiral in the mask hall and back
const DEVIL = makePath([[0, 10.2, -0.5], [12, 10.2, -0.5], [18, 4, -2.5], [25, -1, 1.6], [28, -3.2, 2.2], [31, -7, 2.2], [36, -11, 1.5], [61, -11, 1.5], [63.5, -7, 2.2], [66, -3.2, 2.2], [72, 4, -2.5], [76, 10.2, -0.5], [90, 10.2, -0.5]], true);
const CUBE_A = { x0: 3.5, a: 6.0, z: -0.6, w: 1, ph: 0 }, CUBE_B = { x0: 0, a: 1.5, z: 3.7, w: 1, ph: 2.1 };
const pacerDist = (a, t, ph) => { const u = TAU * t / LOOP + ph, m = Math.floor(u / Math.PI), r = u - m * Math.PI; return a * (2 * m + (r < Math.PI / 2 ? Math.sin(r) : 2 - Math.sin(r))) - a * (2 * Math.floor(ph / Math.PI) + 0); };

export function createStage(scene, parts) {
  const devil = new URLSearchParams(location.search).get('devil') === 'diablada' ? makeDiablo() : makeDevil(), fish = makeFish(), sent = [makeSentinel(), makeSentinel()], cubes = [makeCube('red'), makeCube('blue')], vis = makeVisitor();
  for (const o of [devil.root, fish.root, ...sent.map((s) => s.root), ...cubes.map((c) => c.root), vis.root]) scene.add(o);
  cubes[1].root.visible = false; // the purple blocky figure stood on the open side
  scene.add(fish.shadow); fish.shadow.visible = true; const extras = createExtras(scene);
  const burst = makeBurst(scene);
  const pile = new THREE.Group(); { const dark = ['con4', 'con3', 'ink', 'grey2'].map((n) => M(n)); for (let i = 0; i < 16; i++) { const a = i * 2.4, r = 0.15 + 0.5 * hash(i + 3), m = new THREE.Mesh(new THREE.SphereGeometry(0.18 + 0.15 * hash(i + 9), 8, 6), dark[i % 4]); m.scale.set(1, 0.38, 1); m.position.set(Math.cos(a) * r, 0.05 + 0.08 * (1 - r), Math.sin(a) * r); pile.add(m); }
    for (let i = 0; i < 5; i++) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), new THREE.MeshBasicMaterial({ color: P.orange })); e.position.set(Math.cos(i * 1.3) * 0.3, 0.12, Math.sin(i * 1.3) * 0.3); e.userData.i = i; pile.add(e); } }
  pile.position.set(DEVIL_HOP[0], 0.02, DEVIL_HOP[1]); pile.visible = false; scene.add(pile);
  const levAt = (t) => 0.9 * bell(t, 38, 40, 50, 52) + 0.06 * Math.sin(t * 2.5) * bell(t, 38, 40, 50, 52);
  const sentStep = (t) => bell(t, BEAT.burst - 0.5, BEAT.burst + 1.2, BEAT.burstEnd - 1.5, BEAT.burstEnd + 0.5);
  const sentPos = (sg, t) => ({ x: X0 + 0.95 + sentStep(t), y: 0.7 * bell(t, BEAT.burst + 0.5, BEAT.burst + 2, BEAT.burstEnd - 2, BEAT.burstEnd) * (1 + 0.2 * Math.sin(t * 3)), z: sg * 2.7 });
  const SPELL_TARGETS = [[2.0, 1.4, 1.2], [8.2, 1.2, -2.8], [11.8, 1.4, 3.75]];
  const ctx = { HX, fishAt: (t) => fishAt(t), cubeA: (t) => ({ x: CUBE_A.x0 + CUBE_A.a * Math.sin(TAU * t / LOOP + CUBE_A.ph), z: CUBE_A.z }), devilPos: (t) => { const d = DEVIL(t); return { x: d.x, z: d.z }; }, lev: levAt,
    sleepK, choirW, choirActive, choirSlots: SLOTS, choirC: CHOIR.C, sentPos, spellTarget: (i) => ({ x: SPELL_TARGETS[i][0], y: SPELL_TARGETS[i][1], z: SPELL_TARGETS[i][2] }) };
  ctx.spellTarget = (i, tb) => { const j = ((i % 3) + 3) % 3; if (j === 1 && tb !== undefined) { const d = extras.named.deerPos(tb); return new THREE.Vector3(d.x, 1.2, d.z); } const p = SPELL_TARGETS[j]; return new THREE.Vector3(p[0], p[1], p[2]); };
  const magic = createMagic(scene, ctx);
  const nm = extras.named; const choir = createChoir(scene, [{ o: nm.cat }, { o: nm.woman }, { o: nm.singer }, { o: nm.roller, moving: true }, { o: { root: cubes[0].root }, moving: true }]);
  const fishPos = new THREE.Vector3(); const stool = parts.stool;
  const FISH = (() => { const k = [[0, X1 + 8, 4.0, 1.0], [30, X1 + 8, 4.0, 1.0], [38, 4, 3.9, 0.5], [46, -8, 3.7, 2.5], [52, -3, 4.0, -2.0], [58, -12, 3.6, 0.0], [62.8, -16, 3.3, 0.5]];
    BAND.forEach((b) => { k.push([b.tk - 1.5, b.x, 3.2, b.z]); k.push([b.tk, b.x + 0.15, 1.75, b.z]); k.push([b.tk + 0.9, b.x, 3.2, b.z]); });
    k.push([81.5, -20, 3.4, 0.5], [86, 2, 3.9, 1.0], [89, X1 + 8, 4.0, 1.0], [90, X1 + 8, 4.0, 1.0]); return k; })();
  const fishAt = (t) => { t = clamp(t, 0, 90); let i = 0; while (i < FISH.length - 2 && t > FISH[i + 1][0]) i++; const a = FISH[i], b = FISH[i + 1], u = smooth(clamp((t - a[0]) / Math.max(1e-6, b[0] - a[0]), 0, 1)); return new THREE.Vector3(lerp(a[1], b[1], u), lerp(a[2], b[2], u) + 0.22 * Math.sin(t * 2.1), lerp(a[3], b[3], u)); };

  function update(t) {
    t = ((t % LOOP) + LOOP) % LOOP;
    extras.update(t);
    // screens, monitor, floor, mouth
    parts.screens.forEach((s) => drawScreen(s, t)); drawMonitor(parts.monitor, t);
    const burstE = bell(t, BEAT.burst, BEAT.burst + 1, BEAT.burstEnd - 1, BEAT.burstEnd + 1);
    if (parts.maskEye) parts.maskEye.emissiveIntensity = 2.2 * (smooth((t - 24) / 16) * (1 - smooth((t - 56) / 5)) + burstE);
    parts.spiral.userData.recolor(t, burstE * 1.2); parts.eclipse.emissiveIntensity = 0.6 + 1.6 * burstE + 0.2 * Math.sin(t * 3); mouthGlow(parts.glow, t); burst.update(t);

    // devil: dance energy, arms-up + flames at the burst, hop-walk between marks, head follows the fish
    const dp = DEVIL(t); const dpa = DEVIL(t - 0.6), dpb = DEVIL(t + 0.6), dvx = dpb.x - dpa.x, dvz = dpb.z - dpa.z, dsp = Math.hypot(dvx, dvz) / 1.2, walkAmt = smooth(clamp(dsp / 0.35, 0, 1));
    const k = 0.75 + 0.45 * bell(t, 32, 34, 40, 42) + 0.55 * bell(t, BEAT.burst, BEAT.burst + 1, BEAT.burstEnd - 2, BEAT.burstEnd), up = bell(t, BEAT.burst - 0.4, BEAT.burst + 0.8, BEAT.burstEnd - 2.5, BEAT.burstEnd - 1), flame = bell(t, BEAT.burst + 0.4, BEAT.burst + 1.2, BEAT.burstEnd - 2.5, BEAT.burstEnd - 1.5);
    const sl = sleepK(t), cp = t % 4.5, cast = (t < 13.0 || t > 72.4 || (t > 52.8 && t < 61.2)) ? 0 : (cp > 3.9 ? (cp - 3.9) / 0.6 : (cp < 0.35 ? 1 - cp / 0.35 : 0));
    poseDevil(devil, t, k * (1 - walkAmt * 0.4) * (1 - 0.95 * sl), Math.max(up, 0.85 * cast, bell(t, 52.3, 52.7, 54.2, 54.8)) * (1 - sl), Math.max(flame, cast, bell(t, 52.3, 52.6, 54.3, 54.9)) * (1 - sl), { phase: dp.dist * TAU / 1.0, amt: walkAmt });
    devil.head.rotation.x += 0.75 * sl; devil.torso.rotation.x += 0.45 * sl; const body = devilBody(t); charDevil(devil, devilChar(t), bell(t, 52.3, 53.0, 54.0, 55.2)); devil.root.scale.set(1.4 * (0.45 + 0.55 * body), 1.4 * body * (1 + 0.012 * Math.sin(t * 1.6) * sl), 1.4 * (0.45 + 0.55 * body)); devil.root.visible = body > 0.01;
    devil.root.position.set(dp.x, levAt(t) + 0.35 * Math.sin(Math.PI * clamp((t - 10.4) / 0.7, 0, 1)), dp.z); if (t > 52.4 && t < 54.6) { devil.root.position.x += 0.06 * Math.sin(t * 55); devil.root.position.z += 0.05 * Math.cos(t * 47); } devil.root.rotation.y = lerpAngle(Math.PI / 4 + 0.2 * Math.sin(t * 0.8), Math.atan2(dvx, dvz), walkAmt);
    fishPos.copy(fishAt(t)); const dd = Math.hypot(fishPos.x - dp.x, fishPos.z - dp.z), near = smooth(1 - dd / 6);
    const toFish = Math.atan2(fishPos.x - dp.x, fishPos.z - dp.z) - devil.root.rotation.y;
    devil.head.rotation.y += clamp(Math.atan2(Math.sin(toFish), Math.cos(toFish)), -0.9, 0.9) * near; devil.head.rotation.x -= 0.35 * near; devil.torso.rotation.x -= 0.12 * near;

    // goldfish crossing the hangar, banking into turns
    const fp = fishAt(t), fn = fishAt(t + 0.05), dir = fn.clone().sub(fp).normalize(); fish.root.position.copy(fp);
    fish.root.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir); poseFish(fish, t, 0, clamp((fn.z - fp.z) * 6, -0.8, 0.8));
    fish.shadow.position.set(fp.x, 0.02, fp.z); fish.shadow.material.opacity = 0.55 * (fp.x > X0 + 2 && fp.x < X1 - 2 ? 1 : 0);

    // sentinels bow and step forward at the burst
    sent.forEach((s, i) => {
      const step = bell(t, BEAT.burst - 0.5, BEAT.burst + 1.2, BEAT.burstEnd - 1.5, BEAT.burstEnd + 0.5);
      s.root.position.set(X0 + 0.95 + step * 1.0, sentPos(i ? -1 : 1, t).y, i ? MARK.mask[1] - 2.7 : MARK.mask[1] + 2.7); s.root.rotation.y = Math.PI / 2 + (i ? 0.15 : -0.15);
      poseSentinel(s, t, i, bell(t, BEAT.burst + 0.5, BEAT.burst + 1.8, BEAT.burst + 4.5, BEAT.burst + 6), step);
    });

    // cube figures pace a lane (phase driven by distance travelled)
    [CUBE_A, CUBE_B].forEach((c, i) => {
      const u = TAU * t / LOOP + c.ph, x = c.x0 + c.a * Math.sin(u), vx = Math.cos(u);
      cubes[i].root.position.set(x, 0, c.z); cubes[i].root.rotation.y = Math.PI / 2 * Math.tanh(vx * 6);
      poseCube(cubes[i], pacerPhase(c, t), 0.5 * Math.sin(t * 0.5 + i * 2) * (1 - Math.abs(vx)));
      if (i === 0) { const ph = t % 5, fl = ph < 1 && choirW(t) < 0.15; cubes[0].root.rotation.x = fl ? TAU * smooth(ph) : 0; cubes[0].root.position.y = fl ? 1.1 * Math.sin(Math.PI * ph) : 0; cubes[0].shadow.visible = !fl; }
    });
    if (parts.cabin) { const sh = spellHit(t), hit = sh && sh.idx === 2 && sh.age < 0.8 ? sh.age : -1; parts.cabin.position.y = hit >= 0 ? 0.7 * Math.sin(Math.PI * hit / 0.8) : 0; parts.cabin.scale.y = hit >= 0 ? 1 + 0.04 * Math.sin(Math.PI * hit / 0.8) : (sh && sh.idx === 2 && sh.age < 1.1 ? 1 - 0.08 * Math.sin(Math.PI * (sh.age - 0.8) / 0.3) : 1); parts.cabin.rotation.z = hit >= 0 ? 0.08 * Math.sin(hit * 24) : 0; }
    if (parts.updBooth) parts.updBooth(t);

    // visitor: walks in from the entry, looks at the wall screens, crosses the passage, sits at the desk, watches the burst, walks back out
    const vp = VISITOR(t), yaw = keyed(VISITOR_YAW, t); vis.root.position.set(vp.x, 0, vp.z); vis.root.rotation.y = yaw;
    const seat = smooth(win(t, 38.6, 1.2)) * (1 - smooth(win(t, 51.4, 1.2)));
    const phase = vp.dist * TAU / 1.55;
    if (seat > 0.001) {
      poseWalk(vis, vp.moving ? phase : 0, vp.moving ? 1 - seat : 0, 0, 0);
      for (const l of vis.legs) { l.hip.rotation.x = lerp(l.hip.rotation.x, -1.45, seat); l.kn.rotation.x = lerp(l.kn.rotation.x, 1.4, seat); l.an.rotation.x = lerp(l.an.rotation.x, 0.05, seat); }
      vis.arms.forEach((a) => { a.sh.rotation.x = lerp(a.sh.rotation.x, -0.75, seat); a.el.rotation.x = lerp(a.el.rotation.x, -1.0, seat); });
      vis.root.position.y = lerp(0, -0.26, seat); const ty = seat * bell(t, 40, 41, 51, 52); vis.arms.forEach((a, ai) => { a.el.rotation.x += ty * 0.14 * Math.sin(t * 14 + ai * 2); });
      vis.head.rotation.y = seat * (0.0 + 0.9 * bell(t, BEAT.burst - 0.5, BEAT.burst + 1, BEAT.burstEnd - 1, BEAT.burstEnd)); vis.head.rotation.x = -0.1 * seat;
    } else if (!vp.moving && t > 9 && t < 16.6) { poseLookUp(vis, 0.3 * Math.sin(t * 0.7), 0.22 * bell(t, 10, 11.4, 15, 16.4), t); vis.root.position.y = 0; }
    else if (vp.moving) { poseWalk(vis, phase, 1, 0, 0); vis.root.position.y = 0; }
    else { poseWalk(vis, 0, 0, 0, 0); vis.root.position.y = 0; }
    vis.shadow.position.y = 0.02 - vis.root.position.y;
    choir.update(t); magic.update(t);
    { const pk = ashPile(t); pile.visible = pk > 0.01; pile.scale.set(pk, pk, pk); pile.children.forEach((c) => { if (c.userData.i !== undefined) { c.visible = Math.sin(t * 9 + c.userData.i * 2.3) > -0.2; c.scale.setScalar(0.6 + 0.4 * Math.sin(t * 13 + c.userData.i)); } }); }
    devil.shadow.position.y = (0.02 - devil.root.position.y) / Math.max(0.05, devil.root.scale.y); devil.shadow.material.opacity = 0.85 * (1 - 0.6 * clamp(levAt(t), 0, 1));
  }
  return { update, actors: { deer: extras.named.deer, devil, fish, sent, cubes, vis, extras: extras.list.map((e) => e.o) }, burst };
}
const pacerPhase = (c, t) => { const u = TAU * t / LOOP + c.ph, m = Math.floor(u / Math.PI), r = u - m * Math.PI; const s = c.a * (2 * m + (r < Math.PI / 2 ? Math.sin(r) : 2 - Math.sin(r))); return s * TAU / 1.3; };
