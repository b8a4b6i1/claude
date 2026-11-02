import * as THREE from 'three';
import { M, box, cyl, sph, cone, limb, beam, canvasTex, contactShadow } from './common.js';
import { makeMoises, makeRael, makeBoojie, makePoly, poseRun } from './heroes.js';
import { makePerson, poseWalk, makeCube, poseCube } from './actors.js';
import { TAU, clamp, smooth, hash, LOOP, bell, spellHit, bandPresence } from '../config.js';
import { P } from '../palette.js';

const J = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
const rot = (g, x = 0, y = 0, z = 0) => g.rotation.set(x, y, z);
const CAM = Math.PI / 4; // yaw that faces the locked camera

function twin() {
  const p = makePerson('cyan2', 'wall0', { hair: 'wood4', shoes: 'ink' }); p.root.scale.setScalar(0.76);
  cone(p.pel, 0.32, 0.62, M('cyan2'), 0, -0.22, 0, null, 14); box(p.torso, 0.4, 0.04, 0.3, M('wall0'), 0, 0.18, 0); sph(p.head, 0.13, M('wood4'), 0, 0.06, -0.07, [1, 1.3, 0.9]);
  return p;
}
export function conductor() {
  const p = makePerson('black', 'black', { skin: 'con0', hair: 'ink', shoes: 'ink' });
  box(p.torso, 0.14, 0.34, 0.02, M('wall0'), 0, 0.4, 0.18); box(p.torso, 0.1, 0.04, 0.02, M('ink'), 0, 0.58, 0.19); box(p.arms[1].w, 0.02, 0.02, 0.52, M('wall0'), 0, -0.05, 0.28);
  return p;
}
function thereminist() {
  const p = makePerson('navy', 'navy', { hair: 'wood5', shoes: 'wood4' });
  cone(p.pel, 0.3, 0.5, M('navy'), 0, -0.2, 0, null, 14); for (let i = 0; i < 7; i++) sph(p.pel, 0.03, M(i % 2 ? 'pink' : 'cyan2'), Math.cos(i * 0.9) * 0.22, -0.1 - (i % 3) * 0.12, Math.sin(i * 0.9) * 0.22);
  const stand = J(p.root, 0, 0, 0.55); cyl(stand, 0.015, 0.015, 1.0, M('steel2'), 0, 0.5, 0); box(stand, 0.5, 0.04, 0.2, M('wood1'), 0, 1.0, 0); cyl(stand, 0.012, 0.012, 0.3, M('steel1'), 0.22, 1.18, 0); beam(stand, [0, 0.02, 0], [0.3, 0.02, 0.3], 0.02, M('steel2')); beam(stand, [0, 0.02, 0], [-0.3, 0.02, 0.3], 0.02, M('steel2'));
  return p;
}
function tankWoman() { return makePerson('red', 'ink', { hair: 'wood0', shoes: 'ink' }); }
function singer() {
  const p = makePerson('teal2', 'red2', { hair: 'wood0', shoes: 'ink' });
  box(p.head, 0.2, 0.04, 0.03, M('pink'), 0, 0.12, 0.105); sph(p.arms[1].w, 0.04, M('ink'), 0, -0.05, 0.02);
  const lt = canvasTex(64, 16, (c, w, h) => { c.fillStyle = P.wall0; c.font = 'bold 10px Arial'; c.fillText('JIRAFA', 2, 11); });
  const lm = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.085), new THREE.MeshBasicMaterial({ map: lt, transparent: true, alphaTest: 0.4 })); lm.position.set(0, 0.36, 0.205); p.torso.add(lm);
  return p;
}
function flaredMan() {
  const p = makePerson('con1', 'con3', { skin: 'con0', hair: 'ink', shoes: 'ink' });
  for (const l of p.legs) cone(l.kn, 0.16, 0.42, M('con3'), 0, -0.2, 0, null, 12); box(p.pel, 0.36, 0.04, 0.3, M('ink'), 0, 0.1, 0);
  return p;
}
function deerMan() {
  // olive bomber jacket, faded light jeans, black boots; a deer head with wide white eyes and a mane of flame; a shovel
  const p = makePerson('stone1', 'steel0', { skin: 'skin1', hair: 'ink', shoes: 'ink' }); p.root.scale.setScalar(1.12);
  box(p.torso, 0.34, 0.07, 0.3, M('stone2'), 0, 0.02, 0); box(p.torso, 0.05, 0.5, 0.02, M('ink'), 0, 0.3, 0.19); for (const s of [-1, 1]) { box(p.torso, 0.12, 0.1, 0.03, M('stone2'), s * 0.09, 0.22, 0.19); box(p.torso, 0.12, 0.09, 0.03, M('stone2'), s * 0.09, 0.08, 0.19); }
  box(p.legs[1].hip, 0.07, 0.07, 0.02, M('skin1'), 0, -0.26, 0.075);
  const mask = J(p.head, 0, 0.1, 0.02); sph(mask, 0.16, M('orange2'), 0, 0.02, 0, [1, 1.1, 1]); cone(mask, 0.09, 0.34, M('orange2'), 0, -0.02, 0.2, [Math.PI / 2, 0, 0], 8); sph(mask, 0.03, M('ink'), 0, -0.02, 0.38);
  for (const s of [-1, 1]) { sph(mask, 0.045, M('white'), s * 0.085, 0.07, 0.13, [1, 1, 0.5]); sph(mask, 0.02, M('ink'), s * 0.085, 0.07, 0.165); cone(mask, 0.05, 0.22, M('orange2'), s * 0.14, 0.2, -0.02, [0, 0, -s * 0.5], 6); sph(mask, 0.04, M('wall0'), s * 0.15, 0.2, 0.0, [0.5, 1, 0.4]); }
  const flames = [];
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, f = cone(mask, 0.075, 0.4, M(i % 3 === 0 ? 'red3' : i % 2 ? 'orange' : 'yellow', { emit: 0.8 }), Math.cos(a) * 0.16, 0.2 + Math.sin(a) * 0.09, Math.sin(a) * 0.16 - 0.05, [Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5], 6); flames.push(f); }
  beam(p.arms[1].w, [0, 0.55, 0.0], [0, -0.7, 0.28], 0.025, M('red2')); box(p.arms[1].w, 0.15, 0.22, 0.02, M('steel1'), 0, -0.82, 0.31, [0.22, 0, 0]); box(p.arms[1].w, 0.14, 0.03, 0.03, M('ink'), 0, 0.6, 0.0);
  p.flames = flames; return p;
}
function boulder() {
  const g = new THREE.Group(); sph(g, 0.4, M('stone0'), 0, 0.3, 0, [1.15, 0.8, 1], 14, 10); sph(g, 0.3, M('stone1'), 0.1, 0.18, -0.05, [1.2, 0.5, 1], 12, 8);
  for (let i = 0; i < 8; i++) sph(g, 0.08 + hash(i) * 0.06, M('orange'), Math.cos(i * 2.1) * 0.32, 0.4 + Math.sin(i * 1.3) * 0.18, Math.sin(i * 2.1) * 0.25 + 0.05, [1, 0.5, 1]);
  for (const s of [-1, 1]) { sph(g, 0.065, M('white'), s * 0.13, 0.36, 0.33, [1, 1, 0.5]); sph(g, 0.025, M('ink'), s * 0.13, 0.36, 0.385); }
  box(g, 0.2, 0.06, 0.03, M('ink'), 0, 0.2, 0.4); for (let k = 0; k < 6; k++) box(g, 0.025, 0.035, 0.02, M('white'), -0.075 + k * 0.03, 0.215, 0.42); g.add(contactShadow(0.55)); return g;
}
function catStandee() {
  const g = new THREE.Group(); const body = J(g, 0, 0, 0);
  box(body, 0.78, 1.0, 0.05, M('yellow2'), 0, 0.95, 0); for (let i = 0; i < 12; i++) cyl(body, 0.045, 0.045, 0.012, M('orange2'), -0.28 + (i % 4) * 0.19, 0.55 + Math.floor(i / 4) * 0.3, 0.03, [Math.PI / 2, 0, 0], 8);
  box(body, 0.5, 0.52, 0.06, M('cyan2'), 0, 1.7, 0); for (const s of [-1, 1]) { cone(body, 0.1, 0.28, M('cyan2'), s * 0.2, 2.06, 0, [0, 0, -s * 0.2], 3); sph(body, 0.07, M('white'), s * 0.12, 1.75, 0.04, [1, 1, 0.4]); sph(body, 0.03, M('ink'), s * 0.12, 1.75, 0.07); box(body, 0.04, 0.5, 0.03, M('cyan2'), s * 0.14, 0.25, 0); box(body, 0.04, 0.5, 0.03, M('cyan2'), s * 0.43, 0.8, 0, [0, 0, s * 0.3]); }
  for (let i = 0; i < 6; i++) box(body, 0.05, 0.07, 0.03, M('white'), -0.14 + i * 0.056, 1.5, 0.04); g.add(contactShadow(0.5)); return { root: g, body };
}
function robot() {
  const g = new THREE.Group(); const hov = J(g, 0, 0.5, 0); sph(hov, 0.3, M('black'), 0, 0.5, 0, [1, 1.1, 1]); sph(hov, 0.22, M('red'), 0, 1.0, 0);
  for (const s of [-1, 1]) { beam(hov, [s * 0.1, 1.15, 0], [s * 0.2, 1.45, 0], 0.025, M('ink')); sph(hov, 0.04, M('orange2'), s * 0.2, 1.47, 0); sph(hov, 0.03, M('white'), s * 0.08, 1.02, 0.2); }
  sph(hov, 0.06, M('orange2'), 0, 0.55, 0.28, [1, 1, 0.4]);
  const arms = [-1, 1].map((s) => { const a = J(hov, s * 0.3, 0.7, 0); limb(a, 0.4, 0.05, M('red')); sph(a, 0.07, M('wall0'), 0, -0.42, 0); return a; });
  const legs = [-1, 1].map((s) => { const l = J(hov, s * 0.12, 0.25, 0); limb(l, 0.4, 0.055, M('red')); box(l, 0.12, 0.07, 0.2, M('black'), 0, -0.42, 0.05); return l; });
  g.add(contactShadow(0.45)); return { root: g, hov, arms, legs };
}
function roller() {
  const p = makePerson('pink', 'pink', { skin: 'wall0', hair: 'wall0', shoes: 'wall0' });
  const h = J(p.head, 0, 0.08, 0.08); box(h, 0.14, 0.15, 0.3, M('wall0'), 0, 0, 0.1); cone(h, 0.04, 0.3, M('pink2'), 0, 0.2, 0.05, [0.3, 0, 0], 6); for (const s of [-1, 1]) cone(h, 0.035, 0.14, M('wall0'), s * 0.07, 0.12, -0.02, null, 4);
  for (let i = 0; i < 6; i++) box(p.head, 0.07, 0.07, 0.07, M(['red', 'cyan', 'yellow', 'lime', 'magenta', 'blue'][i]), -0.1 + (i % 3) * 0.1, 0.0 + Math.floor(i / 3) * 0.1, -0.15); // glitch mane
  for (const l of p.legs) for (let i = 0; i < 3; i++) cyl(l.an, 0.035, 0.035, 0.025, M(['cyan', 'yellow', 'red'][i]), (i - 1) * 0.07, -0.08, 0.06, [0, 0, Math.PI / 2], 8);
  return p;
}

// Moises (the man in red) never stops running: a closed loop through both halls and the passage, 4 laps per loop at constant speed
const RUN = [[12, -3.8], [-3, -3.8], [-3.4, 3.0], [-7, 3.0], [-14.5, 3.0], [-14.5, -1.5], [-7, 1.2], [-3.4, 1.2], [6, 1.2], [12, -0.5]];
const RUNLEN = RUN.map((p, i) => Math.hypot(RUN[(i + 1) % RUN.length][0] - p[0], RUN[(i + 1) % RUN.length][1] - p[1])), RUNTOT = RUNLEN.reduce((a, b) => a + b, 0), LAPS = 4;
const runAt = (t) => { let d = (((t * LAPS / LOOP) % 1) + 1) % 1 * RUNTOT, i = 0; while (d > RUNLEN[i]) { d -= RUNLEN[i]; i++; } const a = RUN[i], b = RUN[(i + 1) % RUN.length], u = d / RUNLEN[i]; return { x: a[0] + (b[0] - a[0]) * u, z: a[1] + (b[1] - a[1]) * u, dx: b[0] - a[0], dz: b[1] - a[1], dist: ((t * LAPS / LOOP) % LAPS) * RUNTOT }; };

// closed walking loops through both halls and the passage (passage lanes z 0.6-3.8 at x = -5): used by the characters that roam the whole hangar
const loopPath = (pts) => { const len = pts.map((p, i) => Math.hypot(pts[(i + 1) % pts.length][0] - p[0], pts[(i + 1) % pts.length][1] - p[1])), tot = len.reduce((a, b) => a + b, 0);
  return { tot, at(f) { f = ((f % 1) + 1) % 1; let d = f * tot, i = 0; while (d > len[i]) { d -= len[i]; i++; } const a = pts[i], b = pts[(i + 1) % pts.length], u = d / len[i]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; } }; };
const BJ_PATH = loopPath([[-3.6, 2.6], [-7, 2.6], [-12, 2.8], [-15, 0.8], [-12, -1.8], [-8, -1.0], [-7, 1.2], [-3.6, 1.2], [2, 2.4], [7, 0.8], [11, -1.5], [8, -3.6], [0, -3.6], [-3.4, -0.6]]), BJ_LAPS = 3;
const PL_PATH = loopPath([[-3.4, 3.3], [-7, 3.3], [-10.5, 3.2], [-14, 1.0], [-13, -1.8], [-9.8, -0.2], [-7, 0.9], [-3.4, 0.9], [1.0, 1.6], [4.0, -0.8], [9.5, 0.3], [12.5, -2.0], [6, -3.7], [1, -3.0], [-1.8, -0.6]]), PL_LAPS = 2;
const pathState = (PATH, laps, t) => { const f = t * laps / LOOP, a = PATH.at(f - 0.004 * 2), b = PATH.at(f + 0.004 * 2), [x, z] = PATH.at(f); return { x, z, yaw: Math.atan2(b[0] - a[0], b[1] - a[1]), dist: f * PATH.tot }; };

/** Everyone the scan shows that the first pass left out. Real people appear as faceless cardboard-style figures. All motion is a pure function of t. */
export function createExtras(scene) {
  const list = []; const named = {}; const lerpYaw = (a, b, k) => { const d = ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI; return a + d * k; }; const add = (o, x, z, yaw, upd) => { const r = o.root; r.position.set(x, 0, z); r.rotation.y = yaw; scene.add(r); list.push({ o, upd }); if (o.shadow === undefined && r.children.every((c) => !c.isMesh || c.material.map == null)) {} return o; };
  const noShadow = (p) => { if (!p.shadow) { const s = contactShadow(0.45); p.root.add(s); p.shadow = s; } };
  const FACE = Math.PI / 2; // facing the entry, +X
  const mo = makeMoises(); const STRIDE_R = RUNTOT * LAPS / Math.round(RUNTOT * LAPS / 1.9);
  named.woman = add(mo, RUN[0][0], RUN[0][1], 0, (p, t) => { const r = runAt(t), a = runAt(t - 0.3), b = runAt(t + 0.3); p.root.position.set(r.x, 0, r.z); p.root.rotation.y = Math.atan2(b.x - a.x, b.z - a.z); poseRun(p, r.dist * TAU / STRIDE_R, 1, 0.3); });
  named.womanPos = (t) => { const r = runAt(t); return { x: r.x, z: r.z }; };
  const bj = makeBoojie(); named.singer = add(bj, BJ_PATH.at(0)[0], BJ_PATH.at(0)[1], 0, (p, t) => { const st = pathState(BJ_PATH, BJ_LAPS, t), w = TAU * t / 1.8, push = Math.sin(TAU * t / 1.2);
    p.root.position.set(st.x, 0, st.z); p.root.rotation.y = st.yaw;
    p.pel.position.y = 0.8 + 0.02 * Math.abs(Math.sin(w)); p.torso.rotation.set(0.12, 0.1 * Math.sin(w * 0.5), 0.05 * Math.sin(w)); p.head.rotation.set(-0.15 + 0.1 * Math.sin(w), 0.25 * Math.sin(w * 0.5), 0.1 * Math.sin(w));
    p.legs[0].hip.rotation.set(0.5 * push - 0.2, 0, 0.12); p.legs[1].hip.rotation.set(-0.5 * push - 0.2, 0, -0.12); p.legs[0].kn.rotation.set(0.5 + 0.25 * Math.max(0, push), 0, 0); p.legs[1].kn.rotation.set(0.5 + 0.25 * Math.max(0, -push), 0, 0); p.legs[0].an.rotation.set(-0.3, 0, 0); p.legs[1].an.rotation.set(-0.3, 0, 0);
    p.arms[1].sh.rotation.set(-1.9, 0, -0.1); p.arms[1].el.rotation.set(-1.7, 0, 0); p.arms[0].sh.rotation.set(-0.5 + 0.9 * Math.sin(w), 0, -0.6 - 0.3 * Math.sin(w * 0.5)); p.arms[0].el.rotation.set(-0.7, 0, 0); });
  named.singerPos = (t) => { const st = pathState(BJ_PATH, BJ_LAPS, t); return { x: st.x, z: st.z }; };
  // ---- the deer man digs a hole with the shovel, buries a treasure chest, tamps it down, glances around and walks to the next spot (6 spots x 15 s = the 90 s loop)
  const SPOTS = [[8.2, -2.8], [5.2, 0.3], [1.5, 2.4], [-1.8, -0.6], [2.0, -3.2], [5.5, -3.3]];
  const VIA = SPOTS.map((p, i) => [p, SPOTS[(i + 1) % SPOTS.length]]);
  const LEN = VIA.map((pl) => pl.slice(1).reduce((a, q, i) => a + Math.hypot(q[0] - pl[i][0], q[1] - pl[i][1]), 0)); const CUM = LEN.map((_, i) => LEN.slice(0, i).reduce((a, b) => a + b, 0)); const TOTAL = LEN.reduce((a, b) => a + b, 0);
  const STRIDE = TOTAL / Math.round(TOTAL / 1.45);                                   // whole number of strides per loop so the walk cycle closes
  const HOLE = (i) => [SPOTS[i][0] + 0.64, SPOTS[i][1] + 0.64];
  const DIG_END = 9.5, WALK0 = 12.0, US = DIG_END / WALK0;                       // digging runs on a 9.5-unit clock compressed into the first 8 s so the walk to the next spot gets 7 s
  const along = (pl, f) => { let d = f * pl.slice(1).reduce((a, q, i) => a + Math.hypot(q[0] - pl[i][0], q[1] - pl[i][1]), 0); for (let k = 1; k < pl.length; k++) { const l = Math.hypot(pl[k][0] - pl[k - 1][0], pl[k][1] - pl[k - 1][1]); if (d <= l || k === pl.length - 1) { const u = Math.min(1, d / l); return [pl[k - 1][0] + (pl[k][0] - pl[k - 1][0]) * u, pl[k - 1][1] + (pl[k][1] - pl[k - 1][1]) * u]; } d -= l; } return pl[pl.length - 1]; };
  const deerAt = (t) => { const tt = ((t % LOOP) + LOOP) % LOOP, i = Math.floor(tt / 15) % 6, u = tt - 15 * i;
    if (u < WALK0) return { x: SPOTS[i][0], z: SPOTS[i][1], dist: CUM[i], i, u: u * US, walking: false };
    const s = (u - WALK0) / (15 - WALK0), e = s * 0.5 + smooth(s) * 0.5, [x, z] = along(VIA[i], e); return { x, z, dist: CUM[i] + e * LEN[i], i, u, walking: true }; };
  const dirtMat = M('wood3'), darkMat = M('ink');
  const holes = SPOTS.map((sp, i) => { const [hx, hz] = HOLE(i), g = new THREE.Group(); g.position.set(hx, 0, hz);
    const pit = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.02, 20), darkMat); pit.position.y = 0.035; g.add(pit);
    const cover = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.05, 20), dirtMat); cover.position.y = 0.045; g.add(cover);
    const mound = new THREE.Group(); for (let k = 0; k < 7; k++) { const a = k * 0.9 + 0.3, m = new THREE.Mesh(new THREE.SphereGeometry(0.17 + 0.07 * hash(k + i), 8, 6), dirtMat); m.scale.set(1, 0.6, 1); m.position.set(0.5 + 0.18 * Math.cos(a), 0.06, 0.22 * Math.sin(a) + 0.2 * (hash(k + 4) - 0.5)); mound.add(m); } g.add(mound);
    const chest = new THREE.Group(); box(chest, 0.34, 0.18, 0.22, M('wood4'), 0, 0.09, 0); box(chest, 0.36, 0.1, 0.24, M('wood3'), 0, 0.23, 0); box(chest, 0.04, 0.3, 0.26, M('yellow'), -0.1, 0.15, 0); box(chest, 0.04, 0.3, 0.26, M('yellow'), 0.1, 0.15, 0); box(chest, 0.06, 0.08, 0.02, M('yellow2'), 0, 0.2, 0.12); g.add(chest);
    const glint = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), new THREE.MeshBasicMaterial({ color: P.yellow, toneMapped: false })); g.add(glint);
    const dirt = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), dirtMat); g.add(m); return m; });
    scene.add(g); return { g, pit, cover, mound, chest, glint, dirt, hx, hz }; });
  const updHoles = (t) => { const tt = ((t % LOOP) + LOOP) % LOOP;
    holes.forEach((h, i) => { const u = Math.min(99, (((tt - 15 * i) % LOOP + LOOP) % LOOP) * US), r = 0.1 + 0.34 * smooth(u / 4.0), fill = smooth((u - 5.7) / 2.6);
      const mw = ((tt - 15 * i - WALK0) % LOOP + LOOP) % LOOP;                          // the finished mound stays 14 s, with 1 s ramps
      const mk = u < DIG_END ? (u < 0.3 ? 0 : smooth((u - 0.3) / 3.5) * (1 - 0.5 * fill)) : (mw <= 14 ? Math.min(0.5, smooth(mw / 1.0) * 0.5, 0.5 * (1 - smooth((mw - 13.0) / 1.0))) : 0);
      const open = u > 0.2 && u < 8.4, shown = u > 0.2 && u < DIG_END;
      h.pit.visible = open && fill < 0.99; h.pit.scale.set(r, 1, r);
      h.cover.visible = shown && fill > 0.01; h.cover.scale.set(Math.max(0.01, r * fill * 1.02), 1, Math.max(0.01, r * fill * 1.02));
      h.mound.visible = mk > 0.02; h.mound.scale.setScalar(Math.max(0.01, mk > 0.5 ? 0.5 : mk) * (u < 0.3 ? 0 : 1) + (u >= DIG_END ? 0 : 0)); if (u >= DIG_END && mw <= 14) h.mound.scale.setScalar(Math.max(0.01, mk * 1.0));
      const cy = u < 3.9 ? 9 : 1.0 - 1.35 * smooth((u - 4.2) / 1.5); h.chest.visible = u >= 3.9 && u < 6.4; h.chest.position.y = cy; h.chest.rotation.y = 0.3;
      h.glint.visible = u >= 3.9 && u < 7.0 && Math.sin(t * 14) > -0.4; h.glint.position.set(0, Math.max(0.1, cy) + 0.35, 0); h.glint.rotation.y = t * 3; h.glint.scale.setScalar(0.7 + 0.5 * Math.sin(t * 9));
      const digging = (u >= 0.3 && u < 4.0), filling = (u >= 5.7 && u < 8.3);
      h.dirt.forEach((m, j) => { const on = digging || filling; m.visible = on; if (!on) return; const s = (u * (filling ? 1.25 : 1.0) + j / 4) % 1, side = filling ? 1 - s : s;
        m.position.set(0.15 + 0.6 * side, 0.3 + 1.1 * Math.sin(Math.PI * s), 0.12 * (j - 1.5)); m.scale.setScalar(1 - 0.3 * s); }); }); };
  named.deer = add(deerMan(), SPOTS[0][0], SPOTS[0][1], FACE, (p, t) => { const st = deerAt(t), ta = deerAt(t - 0.4), tb = deerAt(t + 0.4), vx = tb.x - ta.x, vz = tb.z - ta.z, sp = Math.hypot(vx, vz) / 0.8, wa = smooth(clamp(sp / 0.35, 0, 1)); updHoles(t);
    p.root.position.x = st.x; p.root.position.z = st.z; p.root.rotation.y = lerpYaw(Math.PI / 4, Math.atan2(vx, vz), wa);
    const u = st.u, w = TAU * u / 1.0, a = Math.sin(w), kb = (() => { const sh = spellHit(t), hit = sh && sh.idx === 1 && sh.age < 1.6 ? sh.age : -1; return { hit, k: hit >= 0 ? Math.exp(-hit * 2.6) : 0 }; })();
    poseWalk(p, st.dist * TAU / STRIDE, wa, 0, 0); p.root.position.y = 0;
    if (wa > 0.05) { p.arms[1].sh.rotation.set(-0.5, 0, 0.12); p.arms[1].el.rotation.set(-0.9, 0, 0); p.arms[0].sh.rotation.x *= 0.5; }
    if (!st.walking) { const dig = u >= 0.3 && u < 4.0, put = u >= 4.0 && u < 5.7, fill = u >= 5.7 && u < 8.3, tamp = u >= 8.3;
      if (dig || fill) { const f = fill ? Math.sin(TAU * u / 0.8) : a; p.arms[1].sh.rotation.set(-0.9 - 0.5 * f, 0, 0.1); p.arms[1].el.rotation.set(-0.9 + 0.4 * f, 0, 0); p.arms[0].sh.rotation.set(-0.9 - 0.5 * f, 0, -0.15); p.arms[0].el.rotation.set(-0.9 + 0.4 * f, 0, 0); p.torso.rotation.x = 0.3 + 0.3 * Math.max(0, f); p.legs[0].hip.rotation.x = -0.3; p.legs[1].hip.rotation.x = 0.1; p.legs[0].kn.rotation.x = 0.3; p.head.rotation.x = 0.35 + 0.1 * f; }
      else if (put) { const e = smooth((u - 4.0) / 0.4) * (1 - smooth((u - 5.2) / 0.5)); p.arms[1].sh.rotation.set(-1.2, 0, 0.2); p.arms[1].el.rotation.set(-0.5, 0, 0); p.arms[0].sh.rotation.set(-1.2, 0, -0.2); p.arms[0].el.rotation.set(-0.5, 0, 0); p.torso.rotation.x = 0.35 + 0.35 * e; p.legs[0].hip.rotation.x = -0.45; p.legs[1].hip.rotation.x = -0.3; p.legs[0].kn.rotation.x = 0.7; p.legs[1].kn.rotation.x = 0.5; p.head.rotation.x = 0.4; }
      else if (tamp) { const ts = TAU * (u - 8.3) / 0.4; p.arms[1].sh.rotation.set(-0.5, 0, 0.12); p.arms[1].el.rotation.set(-0.9, 0, 0); p.legs[0].hip.rotation.x = -0.5 * Math.max(0, Math.sin(ts)); p.legs[0].kn.rotation.x = 0.5 * Math.max(0, Math.sin(ts)); p.torso.rotation.x = 0.1; p.head.rotation.y = 0.9 * Math.sin(TAU * (u - 8.3) / 1.2); p.root.rotation.y += 0.5 * Math.sin(TAU * (u - 8.3) / 2.4); }
      else { p.torso.rotation.x = 0.1; }
    }
    p.root.rotation.z = -0.5 * kb.k * Math.cos(kb.hit * 9); p.root.position.y += kb.hit >= 0 && kb.hit < 0.5 ? 0.5 * Math.sin(Math.PI * kb.hit / 0.5) : 0; p.torso.rotation.x += 0.5 * kb.k;
    p.flames.forEach((f, i) => f.scale.set(1, 1 + 0.35 * Math.sin(t * 17 + i * 1.7), 1)); });
  named.deerPos = (t) => { const d = deerAt(t); return { x: d.x, z: d.z }; };
  const b = boulder(); b.position.set(7.3, 0, -2.4); scene.add(b); list.push({ o: { root: b }, upd: (o, t) => { b.rotation.z = 0.04 * Math.sin(t * 2.2); b.scale.y = 1 + 0.03 * Math.sin(t * 4.4); } });
  // Rael strolls slowly along the right wall of the mask hall, hands loose, now and then glancing at the screens
  { const ra = makeRael(); named.rael = add(ra, -9.2, -2.0, 0, (p, t) => { const u = TAU * t / 45, A = 2.6, x = -9.2 + A * Math.sin(u), vx = Math.cos(u), m = Math.floor(u / Math.PI), r = u - m * Math.PI, d = A * (2 * m + (r < Math.PI / 2 ? Math.sin(r) : 2 - Math.sin(r))), wk = smooth(clamp(Math.abs(vx) * 4, 0, 1));
      p.root.position.set(x, 0, -2.0); p.root.rotation.y = (Math.PI / 2) * Math.tanh(vx * 6); poseWalk(p, d * TAU / 1.1, wk, 0.5 * Math.sin(TAU * t / 9), 0); p.arms[1].sh.rotation.z = 0.5 * (1 - wk) + 0.1; p.arms[1].el.rotation.x = -0.3 - 1.0 * (1 - wk); p.torso.rotation.y += 0.12 * (1 - wk) * Math.sin(TAU * t / 9); }); }
  const po = makePoly(), PL_STRIDE = PL_PATH.tot * PL_LAPS / Math.round(PL_PATH.tot * PL_LAPS / 0.85);
  named.cat = add(po, PL_PATH.at(0)[0], PL_PATH.at(0)[1], 0, (c, t) => { const sh = spellHit(t), a = sh && sh.idx === 0 && sh.age < 0.9 ? sh.age : -1, st = pathState(PL_PATH, PL_LAPS, t), ph = st.dist * TAU / PL_STRIDE, step = Math.sin(ph);
    c.root.position.set(st.x, 0.05 * Math.abs(step) + (a >= 0 ? 0.6 * Math.sin(Math.PI * a / 0.9) : 0), st.z); c.root.rotation.y = st.yaw + (a >= 0 ? TAU * smooth(a / 0.9) : 0); c.shadow.position.y = (0.02 - c.root.position.y) / 0.88;
    c.body.rotation.z = 0.06 * step; c.body.rotation.x = 0.05 * Math.abs(step); c.head.rotation.z = 0.1 * Math.sin(TAU * t * 0.65); c.head.rotation.y = 0.35 * Math.sin(TAU * t / 6);
    c.armR.rotation.z = 2.4 + 0.3 * Math.sin(TAU * t * 1.3); c.stick.rotation.z = -1.0 + 0.3 * Math.sin(TAU * t * 1.3 + 1); c.armL.rotation.z = -0.15 - 0.25 * step;
    c.legs[0].rotation.x = 0.6 * step; c.legs[1].rotation.x = -0.6 * step; });
  named.catPos = (t) => { const st = pathState(PL_PATH, PL_LAPS, t); return { x: st.x, z: st.z }; };
  named.roller = add(roller(), 4.5, -3.5, 0, (p, t) => {
    const u = TAU * t / LOOP, x = 4.5 + 7.0 * Math.sin(u), vx = Math.cos(u), dist = 7.0 * (() => { const m = Math.floor(u / Math.PI), r = u - m * Math.PI; return 2 * m + (r < Math.PI / 2 ? Math.sin(r) : 2 - Math.sin(r)); })();
    p.root.position.set(x, 0, -3.5); p.root.rotation.y = (Math.PI / 2) * Math.tanh(vx * 6); poseWalk(p, dist * TAU / 2.2, 0.35, 0, 0.0); p.torso.rotation.x = 0.18; p.root.rotation.z = 0.05 * Math.sin(u * 2);
  });

  // the twins in blue dresses stroll together holding hands (inner arms angled toward each other so the hands meet), swinging the outer arms
  { const A = twin(), B = twin(); const SEP = 0.3, LANE = -1.5, CX0 = 1.0, AMP = 4.5;
    const phaseOf = (u) => { const m = Math.floor(u / Math.PI), r = u - m * Math.PI; return AMP * (2 * m + (r < Math.PI / 2 ? Math.sin(r) : 2 - Math.sin(r))); };
    const upd = (p, side) => (_, t) => { const u = TAU * t / LOOP + 1.0, x = CX0 + AMP * Math.sin(u), vx = Math.cos(u), d = phaseOf(u), wk = smooth(clamp(Math.abs(vx) * 4, 0, 1));
      p.root.position.set(x, 0, LANE + side * SEP); p.root.rotation.y = (Math.PI / 2) * Math.tanh(vx * 6);
      poseWalk(p, d * TAU / 1.2, wk, 0.15 * Math.sin(t * 0.5), 0);
      if (side < 0) { p.arms[0].sh.rotation.set(-0.1, 0, 0.3); p.arms[0].el.rotation.set(-0.25, 0, 0); } else { p.arms[1].sh.rotation.set(-0.1, 0, -0.3); p.arms[1].el.rotation.set(-0.25, 0, 0); }   // clasped inner hands
      const inner = side < 0 ? 0 : 1; p.arms[1 - inner].sh.rotation.x *= 1.1; p.torso.rotation.z = 0.02 * Math.sin(t * 2 + side); };
    add(A, CX0, LANE - SEP, FACE, upd(A, -1)); add(B, CX0, LANE + SEP, FACE, upd(B, 1)); }

  // ---- five people rehearsing in the band corner (band group origin is world (-19, 0, 0); +x faces the entry)
  const BX = -19.0;
  const vanish = (p, i, t) => { const k = bandPresence(i, t); p.root.visible = k > 0.01; p.root.scale.setScalar(Math.max(k, 0.001)); p.root.rotation.y = FACE + TAU * 2 * (1 - k); p.root.position.y += 0.9 * (1 - k); };
  const guitar = (parent, c, bass) => { const g = new THREE.Group(); box(g, 0.34, 0.46, 0.09, M(c), 0, 0, 0); sph(g, 0.17, M(c), 0, -0.16, 0, [1, 1, 0.3]); box(g, 0.07, bass ? 0.95 : 0.8, 0.05, M('wood1'), 0.34, 0.1, 0, [0, 0, -1.25]); box(g, 0.12, 0.14, 0.05, M('wood4'), 0.78, 0.3, 0, [0, 0, -1.25]); box(g, 0.2, 0.05, 0.1, M('steel1'), 0, -0.06, 0.05); g.position.set(0.02, 0.18, 0.2); g.rotation.set(0, Math.PI / 2 - 0.1, 0.35); parent.add(g); return g; };
  const sticks = (p) => p.arms.forEach((a) => box(a.w, 0.025, 0.3, 0.025, M('wood6'), 0, -0.1, 0.12));
  const seated = (p, k, y0) => { for (const l of p.legs) { l.hip.rotation.x = -1.45; l.kn.rotation.x = 1.4; l.an.rotation.x = 0.05; } p.root.position.y = y0 - 0.26 * k; };
  // drummer: seated on the stool behind the kit, both arms hit on the beat (0.5 s), foot on the kick
  { const p = makePerson('cyan', 'ink', { hair: 'ink', skin: 'skin1', shoes: 'ink' }); sticks(p);
    add({ root: p.root, ...p }, BX - 3.5, 0.0, FACE, (_, t) => { const w = TAU * t / 0.5, b = TAU * t / 1.0; poseWalk(p, 0, 0, 0.3 * Math.sin(t * 0.7), 0.05); seated(p, 1, 0.1);
      p.arms[0].sh.rotation.set(-1.15 + 0.4 * Math.max(0, Math.sin(w)), 0, -0.45); p.arms[0].el.rotation.set(-1.0 - 0.5 * Math.max(0, Math.sin(w)), 0, 0);
      p.arms[1].sh.rotation.set(-1.15 + 0.4 * Math.max(0, Math.sin(w + Math.PI)), 0, 0.45); p.arms[1].el.rotation.set(-1.0 - 0.5 * Math.max(0, Math.sin(w + Math.PI)), 0, 0);
      p.legs[1].hip.rotation.x = -1.45 + 0.25 * Math.max(0, Math.sin(b)); p.torso.rotation.x = 0.1 + 0.05 * Math.sin(w); p.head.rotation.x = 0.1 * Math.sin(w * 0.5); vanish(p, 4, t); }); }
  // bass player: next to the bass stack, plays a long bass line, sways heavily
  { const p = makePerson('purple', 'ink', { hair: 'ink', skin: 'skinL', shoes: 'ink' }); guitar(p.torso, 'red2', true);
    add({ root: p.root, ...p }, BX - 2.4, 2.3, FACE, (_, t) => { const w = TAU * t / 2.0; poseWalk(p, 0, 0, 0.25 * Math.sin(t * 0.5), 0); p.torso.rotation.z = 0.07 * Math.sin(w); p.root.position.y = 0.025 * Math.abs(Math.sin(w));
      p.arms[0].sh.rotation.set(-1.0, 0, -0.5); p.arms[0].el.rotation.set(-0.9, 0, 0); p.arms[1].sh.rotation.set(-0.5, 0, 0.1); p.arms[1].el.rotation.set(-1.1 + 0.12 * Math.sin(w * 4), 0, 0); p.legs[0].hip.rotation.x = -0.2; p.head.rotation.x = 0.12 + 0.1 * Math.sin(w); vanish(p, 2, t); }); }
  // guitarist: beside the pedalboard, strums, steps to the pedal on the downbeat, rocks forward
  { const p = makePerson('lime', 'navy', { hair: 'ink', skin: 'skin1', shoes: 'wall0' }); guitar(p.torso, 'cyan', false);
    add({ root: p.root, ...p }, BX - 0.5, 1.3, FACE, (_, t) => { const w = TAU * t / 1.0; poseWalk(p, 0, 0, 0.3 * Math.sin(t * 0.6), 0); const hit = Math.max(0, Math.sin(TAU * t / 4.0)); p.torso.rotation.x = 0.12 + 0.12 * hit; p.root.position.y = 0.03 * Math.abs(Math.sin(w * 2));
      p.arms[0].sh.rotation.set(-1.0, 0, -0.5); p.arms[0].el.rotation.set(-0.9, 0, 0); p.arms[1].sh.rotation.set(-0.55, 0, 0.1); p.arms[1].el.rotation.set(-1.1 + 0.3 * Math.sin(w * 4), 0, 0); p.legs[1].hip.rotation.x = -0.15 - 0.4 * hit; p.legs[1].kn.rotation.x = 0.1 + 0.4 * hit; vanish(p, 1, t); }); }
  // keyboardist: seated at the stool behind the keyboard, both hands on the keys, nods to the beat
  { const p = makePerson('orange', 'ink', { hair: 'wood5', skin: 'skinL', shoes: 'ink' });
    add({ root: p.root, ...p }, BX - 1.3, -2.2, FACE, (_, t) => { const w = TAU * t / 1.0; poseWalk(p, 0, 0, 0.2 * Math.sin(t * 0.5), 0.1); seated(p, 1, 0.0);
      p.arms[0].sh.rotation.set(-1.0, 0, -0.1); p.arms[0].el.rotation.set(-0.9 + 0.2 * Math.sin(w * 2), 0, 0); p.arms[1].sh.rotation.set(-1.0, 0, 0.1); p.arms[1].el.rotation.set(-0.9 + 0.2 * Math.sin(w * 2 + 2), 0, 0); p.torso.rotation.x = 0.08 + 0.05 * Math.sin(w); p.head.rotation.x = 0.1 * Math.sin(w); vanish(p, 3, t); }); }
  // singer: at the microphone, one hand on it, the other conducting; leans in on the downbeat
  { const p = makePerson('magenta', 'ink', { hair: 'ink', skin: 'skinL', shoes: 'ink' });
    add({ root: p.root, ...p }, BX + 0.6, 0.0, FACE, (_, t) => { const w = TAU * t / 2.0; poseWalk(p, 0, 0, 0.2 * Math.sin(t * 0.4), -0.1 * Math.sin(w)); p.torso.rotation.x = 0.1 * Math.max(0, Math.sin(w)); p.root.position.y = 0.02 * Math.abs(Math.sin(w * 2));
      p.arms[1].sh.rotation.set(-1.7, 0, -0.1); p.arms[1].el.rotation.set(-1.5, 0, 0); p.arms[0].sh.rotation.set(-0.7 + 0.5 * Math.sin(w), 0, -0.5 - 0.2 * Math.sin(w * 0.5)); p.arms[0].el.rotation.set(-0.7, 0, 0); vanish(p, 0, t); }); }
  for (const e of list) { const p = e.o; if (p.root && !p.shadow && !p.root.children.some((c) => c.isMesh && c.material && c.material.map === undefined && false)) noShadow(p); }
  return { list, named, update(t) { for (const e of list) e.upd(e.o, t); } };
}
