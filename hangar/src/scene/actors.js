import * as THREE from 'three';
import { M, box, cyl, sph, cone, limb, beam, contactShadow } from './common.js';
import { TAU, clamp, lerp, smooth, win, bell, hash } from '../config.js';

const J = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
const rot = (g, x = 0, y = 0, z = 0) => g.rotation.set(x, y, z);

// ---------------------------------------------------------------- red devil
export function makeDevil() {
  const root = new THREE.Group(); const R = M('red'), R2 = M('red2'), R3 = M('red3');
  const pelvis = J(root, 0, 0.8, 0); sph(pelvis, 0.2, R2, 0, -0.04, 0, [1.15, 0.8, 0.9]);
  const torso = J(pelvis, 0, 0.06, 0); sph(torso, 0.3, R, 0, 0.3, 0, [1, 1.12, 0.82]); sph(torso, 0.22, R3, 0, 0.22, 0.14, [1, 1.1, 0.5]); // chest + belly patch
  const head = J(torso, 0, 0.72, 0.02); sph(head, 0.26, R, 0, 0.12, 0, [1.05, 0.95, 0.95]);
  for (const s of [-1, 1]) {
    sph(head, 0.06, M('white'), s * 0.11, 0.17, 0.2, [1, 1.2, 0.5]); sph(head, 0.028, M('ink'), s * 0.11, 0.17, 0.235);
    cone(head, 0.07, 0.34, M('wall0'), s * 0.15, 0.4, 0, [0, 0, -s * 0.35]); cone(head, 0.05, 0.2, M('wall1'), s * 0.15, 0.58, 0, [0, 0, -s * 0.6]); // horns
    cone(head, 0.07, 0.2, R2, s * 0.27, 0.16, 0, [0, 0, -s * 1.25]); // ears
    box(head, 0.1, 0.025, 0.03, M('ink'), s * 0.11, 0.26, 0.22, [0, 0, -s * 0.3]);
  }
  box(head, 0.22, 0.06, 0.06, M('ink'), 0, 0.01, 0.23); for (let i = 0; i < 4; i++) box(head, 0.03, 0.04, 0.03, M('wall0'), -0.07 + i * 0.047, 0.04, 0.25);
  const arms = [-1, 1].map((s) => {
    const sh = J(torso, s * 0.34, 0.5, 0); sph(sh, 0.1, R, 0, 0, 0); limb(sh, 0.34, 0.075, R);
    const el = J(sh, 0, -0.34, 0); sph(el, 0.07, R2, 0, 0, 0); limb(el, 0.3, 0.065, R);
    const hand = J(el, 0, -0.3, 0); sph(hand, 0.09, R, 0, 0, 0, [1, 1.1, 0.8]);
    for (let i = 0; i < 3; i++) cone(hand, 0.025, 0.12, M('wall0'), (i - 1) * 0.05, -0.12, 0.03, [Math.PI, 0, 0], 6);
    const flame = new THREE.Group(); hand.add(flame); flame.position.y = 0.05;
    cone(flame, 0.11, 0.4, M('orange', { emit: 0.8 }), 0, 0.22, 0, null, 8); cone(flame, 0.07, 0.3, M('yellow', { emit: 0.9 }), 0, 0.2, 0.02, null, 8); cone(flame, 0.04, 0.2, M('yellow2', { emit: 1 }), 0, 0.18, 0.03, null, 8);
    flame.visible = false;
    return { sh, el, hand, flame };
  });
  const legs = [-1, 1].map((s) => {
    const hip = J(pelvis, s * 0.15, -0.08, 0); limb(hip, 0.4, 0.09, R2);
    const kn = J(hip, 0, -0.4, 0); sph(kn, 0.08, R, 0, 0, 0); limb(kn, 0.38, 0.075, R2);
    const an = J(kn, 0, -0.38, 0); box(an, 0.14, 0.07, 0.26, R, 0, -0.03, 0.06);
    for (let i = 0; i < 3; i++) cone(an, 0.025, 0.07, M('wall0'), (i - 1) * 0.045, -0.03, 0.2, [Math.PI / 2, 0, 0], 6);
    return { hip, kn, an };
  });
  const tail = []; let tp = J(pelvis, 0, -0.1, -0.2);
  for (let i = 0; i < 5; i++) { const seg = J(tp, 0, 0, 0); cyl(seg, 0.06 - i * 0.008, 0.07 - i * 0.008, 0.2, R2, 0, 0, -0.1, [Math.PI / 2, 0, 0]); tail.push(seg); const nx = J(seg, 0, 0, -0.2); tp = nx; }
  cone(tp, 0.07, 0.2, M('red3'), 0, 0, -0.08, [-Math.PI / 2, 0, 0], 6);
  const shadow = contactShadow(0.55); root.add(shadow); root.scale.setScalar(1.4);
  return { root, pelvis, torso, head, arms, legs, tail, shadow };
}

// ---------------------------------------------------------------- diablada dancer (Andean carnival devil)
export function makeDiablo() {
  const root = new THREE.Group(); const RED = M('red'), RED2 = M('red2'), OR = M('orange'), WH = M('white'), BK = M('black'), SK = M('orange2');
  const pelvis = J(root, 0, 0.82, 0); sph(pelvis, 0.2, WH, 0, -0.04, 0, [1.2, 0.8, 0.95]);
  for (const s of [-1, 1]) { // embroidered apron panels with gold trim
    box(pelvis, 0.2, 0.62, 0.04, RED, s * 0.12, -0.3, 0.2); box(pelvis, 0.026, 0.62, 0.05, OR, s * 0.12 - 0.1, -0.3, 0.2); box(pelvis, 0.026, 0.62, 0.05, OR, s * 0.12 + 0.1, -0.3, 0.2); box(pelvis, 0.22, 0.04, 0.05, OR, s * 0.12, -0.61, 0.2);
    sph(pelvis, 0.07, BK, s * 0.12, -0.2, 0.225, [0.9, 1.4, 0.3]); sph(pelvis, 0.04, M('wall0'), s * 0.12, -0.38, 0.225, [1, 1, 0.3]); sph(pelvis, 0.06, BK, s * 0.12, -0.5, 0.225, [0.9, 1.3, 0.3]);
  }
  const torso = J(pelvis, 0, 0.06, 0);
  box(torso, 0.72, 0.22, 0.34, WH, 0, 0.62, 0); box(torso, 0.6, 0.72, 0.34, RED, 0, 0.34, 0.01); box(torso, 0.62, 0.05, 0.36, OR, 0, -0.01, 0.01); box(torso, 0.62, 0.05, 0.36, OR, 0, 0.2, 0.01); // white shoulders, vest, gold bands
  box(torso, 0.3, 0.38, 0.02, BK, 0, 0.4, 0.2); sph(torso, 0.07, SK, -0.12, 0.45, 0.215, [1, 1, 0.3]); sph(torso, 0.07, SK, 0.12, 0.45, 0.215, [1, 1, 0.3]); for (let i = 0; i < 3; i++) sph(torso, 0.03, M(['wall0', 'orange2', 'red3'][i]), -0.08 + i * 0.08, 0.64, 0.19, [1, 1, 0.4]); // chest ornament + pins
  const cape = J(torso, 0, 0.62, -0.2); box(cape, 1.0, 0.9, 0.03, RED, 0, -0.45, 0); box(cape, 1.0, 0.06, 0.04, OR, 0, -0.9, 0); box(cape, 0.4, 0.5, 0.035, BK, 0, -0.45, -0.01);
  const head = J(torso, 0, 0.76, 0.02); sph(head, 0.22, SK, 0, 0.12, 0, [1, 1.1, 0.95]); sph(head, 0.15, BK, 0, 0.2, 0.1, [1, 1.2, 0.7]); box(head, 0.2, 0.06, 0.05, OR, 0, -0.02, 0.2); box(head, 0.16, 0.025, 0.05, RED2, 0, -0.02, 0.225);
  for (const s of [-1, 1]) { // bulging eyes on the sides
    sph(head, 0.13, M('yellow2'), s * 0.23, 0.17, 0.1, [1, 1, 0.7]); sph(head, 0.095, M('yellow'), s * 0.24, 0.17, 0.15, [1, 1, 0.5]); sph(head, 0.05, BK, s * 0.245, 0.17, 0.2, [1, 1, 0.5]);
    cone(head, 0.17, 0.62, M('yellow'), s * 0.3, 0.8, 0, [0, 0, -s * 0.55], 6); cone(head, 0.12, 0.5, M('lime'), s * 0.2, 0.78, 0.04, [0, 0, -s * 0.22], 6); cone(head, 0.1, 0.42, OR, s * 0.4, 0.66, 0, [0, 0, -s * 0.9], 6); // crest wings
    beam(head, [s * 0.1, 0.3, 0], [s * 0.42, 0.95, 0], 0.045, M('wood5')); beam(head, [s * 0.42, 0.95, 0], [s * 0.5, 1.22, 0], 0.03, M('wood4')); // long tall horns
    beam(head, [s * 0.2, 0.22, 0], [s * 0.62, 0.34, 0], 0.04, M('wood4')); beam(head, [s * 0.62, 0.34, 0], [s * 0.82, 0.22, 0], 0.03, OR); // lower curling horns
  }
  cone(head, 0.09, 0.8, M('pink'), 0, 0.72, 0.02, null, 6); cone(head, 0.08, 0.45, M('green'), 0, 1.05, 0.02, null, 6); cone(head, 0.07, 0.35, M('yellow'), 0, 1.25, 0.02, null, 6); sph(head, 0.09, M('pink2'), 0, 0.5, 0.08, [1, 1.6, 0.6]); // central dragon crest
  const arms = [-1, 1].map((s) => {
    const sh = J(torso, s * 0.38, 0.55, 0); sph(sh, 0.11, WH, 0, 0, 0); limb(sh, 0.34, 0.085, WH);
    const el = J(sh, 0, -0.34, 0); sph(el, 0.08, WH, 0, 0, 0); limb(el, 0.3, 0.075, WH); box(el, 0.07, 0.2, 0.02, RED, 0, -0.15, 0.08); box(el, 0.05, 0.08, 0.02, RED, 0, -0.04, 0.08, [0, 0, 0.5]);
    const hand = J(el, 0, -0.3, 0); sph(hand, 0.09, WH, 0, 0, 0, [1, 1.15, 0.8]); box(hand, 0.17, 0.05, 0.12, OR, 0, 0.07, 0);
    const flame = new THREE.Group(); hand.add(flame); flame.position.y = 0.05;
    cone(flame, 0.11, 0.4, M('orange', { emit: 0.8 }), 0, 0.22, 0, null, 8); cone(flame, 0.07, 0.3, M('yellow', { emit: 0.9 }), 0, 0.2, 0.02, null, 8); cone(flame, 0.04, 0.2, M('yellow2', { emit: 1 }), 0, 0.18, 0.03, null, 8); flame.visible = false;
    return { sh, el, hand, flame };
  });
  const legs = [-1, 1].map((s) => {
    const hip = J(pelvis, s * 0.14, -0.08, 0); limb(hip, 0.4, 0.1, WH);
    const kn = J(hip, 0, -0.4, 0); sph(kn, 0.085, WH, 0, 0, 0); limb(kn, 0.38, 0.085, WH); box(kn, 0.1, 0.22, 0.02, RED, 0, -0.2, 0.09); box(kn, 0.07, 0.1, 0.02, RED, 0, -0.06, 0.09, [0, 0, 0.4]);
    const an = J(kn, 0, -0.38, 0); box(an, 0.15, 0.08, 0.3, M('wood4'), 0, -0.03, 0.07);
    return { hip, kn, an };
  });
  const shadow = contactShadow(0.6); root.add(shadow); root.scale.setScalar(1.3);
  return { root, pelvis, torso, head, arms, legs, tail: [], cape, shadow };
}

/** k: dance energy, up: arms raised 0..1, flame 0..1, walk: {phase, amt} when hopping between marks. */
export function poseDevil(d, t, k, up, flame, walk) {
  const w = 3.4 * t, bob = Math.abs(Math.sin(w)), s1 = Math.sin(w), s2 = Math.sin(w * 0.5);
  const hop = walk.amt > 0 ? Math.abs(Math.sin(walk.phase)) * 0.28 : 0;
  d.pelvis.position.y = 0.8 - 0.1 * k * (1 - bob) + hop * walk.amt;
  rot(d.pelvis, 0.08 * k, 0.3 * s2 * k * (1 - walk.amt), 0.06 * s1 * k);
  rot(d.torso, 0.1 * k * bob, -0.25 * s2 * k, -0.05 * s1);
  rot(d.head, -0.05 + 0.1 * bob * k, 0.35 * s2 * k, 0.1 * Math.sin(w + 1));
  d.arms.forEach((a, i) => {
    const s = i ? 1 : -1, ph = i ? Math.PI : 0, sw = Math.sin(w + ph);
    const x = lerp(-0.5 + 0.9 * sw * k, -Math.PI + 0.25 * Math.sin(w * 2 + ph), up);
    rot(a.sh, x, 0, s * (0.35 + 0.35 * k * (1 - up) + 0.35 * up));
    rot(a.el, lerp(-0.6 - 0.5 * Math.max(0, sw) * k, -0.25, up), 0, 0);
    a.flame.visible = flame > 0.02; const f = flame * (0.8 + 0.3 * Math.sin(t * 31 + i * 2)); a.flame.scale.set(f, f * (1 + 0.25 * Math.sin(t * 23 + i)), f);
  });
  d.legs.forEach((l, i) => {
    const ph = i ? Math.PI : 0, sw = Math.sin(w + ph);
    const dance = { hip: -0.3 - 0.25 * Math.max(0, sw) * k, kn: 0.5 + 0.55 * (1 - bob) * k + 0.3 * Math.max(0, sw) * k };
    const wk = Math.sin(walk.phase + ph); const walkP = { hip: wk * 0.7 - 0.2, kn: 0.4 + 0.8 * Math.max(0, -Math.cos(walk.phase + ph)) };
    const hip = lerp(dance.hip, walkP.hip, walk.amt), kn = lerp(dance.kn, walkP.kn, walk.amt);
    rot(l.hip, hip, 0, (i ? -1 : 1) * -0.12); rot(l.kn, kn, 0, 0); rot(l.an, -kn * 0.5 - hip * 0.4, 0, 0);
  });
  if (d.cape) rot(d.cape, 0.14 + 0.1 * Math.sin(w * 0.5) + 0.3 * up + 0.12 * (walk.amt || 0), 0, 0.04 * Math.sin(w));
  d.tail.forEach((seg, i) => rot(seg, 0.12 + 0.05 * i, 0.35 * Math.sin(w * 0.5 - i * 0.7) * (0.5 + i * 0.25), 0));
}

// ---------------------------------------------------------------- goldfish
export function makeFish() {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  sph(body, 0.55, M('fish1'), 0, 0, 0, [1.35, 0.85, 0.55], 18, 14); sph(body, 0.42, M('fish0'), 0.1, -0.12, 0.08, [1.3, 0.7, 0.45]); // back + belly
  sph(body, 0.17, M('white'), 0.62, 0.12, 0.26, [1, 1, 0.5]); sph(body, 0.09, M('ink'), 0.67, 0.12, 0.32); // eye
  box(body, 0.05, 0.12, 0.04, M('red2'), 0.74, -0.18, 0.18); // mouth
  const dorsal = J(body, 0.0, 0.42, 0); cone(dorsal, 0.34, 0.5, M('red3'), -0.1, 0.12, 0, [0, 0, 0.35], 4);
  const tail = J(body, -0.78, 0, 0); for (let i = 0; i < 3; i++) cone(tail, 0.32, 0.8, M(i === 1 ? 'orange2' : 'fish0'), -0.35, (i - 1) * 0.25, 0, [0, 0, Math.PI / 2 + (i - 1) * 0.45], 4).scale.z = 0.25;
  const fins = [-1, 1].map((s) => { const f = J(body, 0.25, -0.18, s * 0.28); cone(f, 0.16, 0.5, M('orange2'), -0.18, -0.08, s * 0.08, [0, 0, 1.9], 4).scale.z = 0.25; return f; });
  const shadow = contactShadow(0.9, 0.02, 1.4, 0.7); root.add(shadow); shadow.visible = false;
  root.scale.setScalar(1.25); return { root, body, tail, fins, dorsal, shadow };
}
export function poseFish(f, t, tangentYaw, bank) {
  rot(f.body, bank * 0.5, 0, 0.12 * Math.sin(t * 5)); rot(f.tail, 0, 0.55 * Math.sin(t * 9), 0);
  f.fins.forEach((fn, i) => rot(fn, 0.5 * Math.sin(t * 7 + i * 1.3), 0, 0)); rot(f.dorsal, 0, 0, 0.1 * Math.sin(t * 6));
}

// ---------------------------------------------------------------- sentinel (black robe, pale mask, orange horns)
export function makeSentinel() {
  const root = new THREE.Group(); const body = J(root, 0, 0, 0);
  const prof = [[0.0, 0], [0.5, 0], [0.46, 0.4], [0.34, 1.0], [0.24, 1.6], [0.2, 1.95], [0.0, 2.0]].map(([r, y]) => new THREE.Vector2(r, y));
  const robe = new THREE.Mesh(new THREE.LatheGeometry(prof, 18), M('black')); robe.castShadow = robe.receiveShadow = true; body.add(robe);
  const head = J(body, 0, 2.05, 0); const mk = sph(head, 0.26, M('wall0'), 0, 0.1, 0.02, [0.85, 1.15, 0.7]);
  for (const s of [-1, 1]) { box(head, 0.1, 0.02, 0.03, M('ink'), s * 0.09, 0.2, 0.19, [0, 0, -s * 0.2]); cone(head, 0.05, 0.62, M('orange'), s * 0.19, 0.5, 0, [0, 0, -s * 0.35], 6); sph(head, 0.05, M('red'), s * 0.12, 0.05, 0.19); }
  box(head, 0.14, 0.03, 0.03, M('ink'), 0, -0.04, 0.2); box(head, 0.18, 0.2, 0.2, M('black'), 0, -0.28, 0);
  const arms = [-1, 1].map((s) => { const sh = J(body, s * 0.2, 1.7, 0); limb(sh, 0.8, 0.07, M('cloth')); sph(sh, 0.09, M('cloth'), 0, -0.82, 0); return sh; });
  const shadow = contactShadow(0.7); root.add(shadow); return { root, body, head, arms, shadow };
}
export function poseSentinel(s, t, i, bow, step) {
  const sway = Math.sin(t * 1.1 + i * 2.1);
  rot(s.body, 0.05 * bow + 0.03 * sway, 0, 0.04 * sway); rot(s.head, 0.28 * bow, 0.18 * sway, 0);
  s.arms.forEach((a, j) => rot(a, -0.25 * bow - 0.08 * sway, 0, (j ? -1 : 1) * (0.12 + 0.05 * sway)));
  s.root.position.y = Math.abs(Math.sin(step * 8)) * 0.04 * (step > 0 && step < 1 ? 1 : 0);
}

// ---------------------------------------------------------------- cube figure
export function makeCube(accent) {
  const root = new THREE.Group(); const W = M('white'), G = M('wall1');
  const hips = J(root, 0, 0.62, 0); box(hips, 0.5, 0.5, 0.3, W, 0, 0.3, 0); const head = J(hips, 0, 0.6, 0); box(head, 0.4, 0.4, 0.4, W, 0, 0.2, 0);
  box(head, 0.07, 0.07, 0.02, M('ink'), -0.1, 0.24, 0.205); box(head, 0.07, 0.07, 0.02, M('ink'), 0.1, 0.24, 0.205); box(head, 0.14, 0.04, 0.02, M('ink'), 0, 0.09, 0.205);
  box(hips, 0.52, 0.1, 0.32, M(accent), 0, 0.2, 0);
  const arms = [-1, 1].map((s) => { const a = J(hips, s * 0.34, 0.5, 0); box(a, 0.16, 0.5, 0.16, G, 0, -0.22, 0); box(a, 0.12, 0.12, 0.12, M('skin0'), 0, -0.5, 0); return a; });
  const legs = [-1, 1].map((s) => { const l = J(hips, s * 0.13, 0, 0); box(l, 0.2, 0.62, 0.2, W, 0, -0.31, 0); box(l, 0.22, 0.1, 0.3, M('con3'), 0, -0.6, 0.04); return l; });
  const shadow = contactShadow(0.45); root.add(shadow); return { root, hips, head, arms, legs, shadow };
}
export function poseCube(c, phase, look) {
  const sw = Math.sin(phase);
  c.hips.position.y = 0.62 + Math.abs(Math.cos(phase)) * 0.04; rot(c.hips, 0.05, 0, 0);
  c.legs.forEach((l, i) => rot(l, (i ? -1 : 1) * sw * 0.55, 0, 0)); c.arms.forEach((a, i) => rot(a, (i ? 1 : -1) * sw * 0.5, 0, 0));
  rot(c.head, 0, look, 0);
}

// ---------------------------------------------------------------- visitor (human rig, sign conventions per the skill)
export function makePerson(top = 'red', bottom = 'navy') {
  const root = new THREE.Group(); const SK = M('skin1');
  const pel = J(root, 0, 0.86, 0); cyl(pel, 0.15, 0.17, 0.3, M(bottom), 0, -0.02, 0, null, 14); sph(pel, 0.17, M(bottom), 0, -0.05, 0, [1, 0.7, 0.8]);
  const torso = J(pel, 0, 0.12, 0); cyl(torso, 0.17, 0.2, 0.55, M(top), 0, 0.28, 0, null, 14); sph(torso, 0.2, M(top), 0, 0.5, 0, [1.05, 0.5, 0.75]);
  const neck = J(torso, 0, 0.6, 0); cyl(neck, 0.05, 0.06, 0.1, SK, 0, 0.03, 0); const head = J(neck, 0, 0.08, 0);
  sph(head, 0.11, SK, 0, 0.1, 0, [0.95, 1.12, 1]); sph(head, 0.115, M('wood4'), 0, 0.14, -0.02, [1, 1, 1.05]); box(head, 0.02, 0.03, 0.02, M('skin2'), 0, 0.1, 0.11);
  for (const s of [-1, 1]) sph(head, 0.014, M('ink'), s * 0.04, 0.13, 0.105);
  const arms = [-1, 1].map((s) => { const sh = J(torso, s * 0.2, 0.52, 0); sph(sh, 0.065, M(top), 0, 0, 0); limb(sh, 0.3, 0.05, M(top)); const el = J(sh, 0, -0.3, 0); sph(el, 0.05, SK, 0, 0, 0); limb(el, 0.27, 0.042, SK); const w = J(el, 0, -0.27, 0); sph(w, 0.05, SK, 0, -0.02, 0, [1, 1.2, 0.8]); return { sh, el, w }; });
  const legs = [-1, 1].map((s) => { const hip = J(pel, s * 0.1, -0.1, 0); limb(hip, 0.42, 0.075, M(bottom)); const kn = J(hip, 0, -0.42, 0); sph(kn, 0.065, M(bottom), 0, 0, 0); limb(kn, 0.4, 0.06, M(bottom)); const an = J(kn, 0, -0.4, 0); box(an, 0.11, 0.08, 0.25, M('wall0'), 0, -0.02, 0.06); return { hip, kn, an }; });
  const shadow = contactShadow(0.5); root.add(shadow); return { root, pel, torso, head, arms, legs, shadow };
}
export function poseWalk(p, phase, amt, look = 0, tilt = 0) {
  const sw = Math.sin(phase), cs = Math.cos(phase);
  const kL = 0.05 + 0.46 * Math.max(0, -cs) + 0.22 * Math.max(0, sw), kR = 0.05 + 0.46 * Math.max(0, cs) + 0.22 * Math.max(0, -sw);
  p.pel.position.y = 0.86 + Math.abs(cs) * 0.03 * amt; rot(p.torso, 0.05 * amt, sw * 0.05, 0); rot(p.head, -tilt, look, 0);
  p.legs[0].hip.rotation.set(sw * 0.34 * amt, 0, 0.03); p.legs[1].hip.rotation.set(-sw * 0.34 * amt, 0, -0.03);
  p.legs[0].kn.rotation.set(kL * amt, 0, 0); p.legs[1].kn.rotation.set(kR * amt, 0, 0); p.legs[0].an.rotation.set(-kL * 0.32 * amt, 0, 0); p.legs[1].an.rotation.set(-kR * 0.32 * amt, 0, 0);
  p.arms[0].sh.rotation.set(-sw * 0.38 * amt, 0, -0.09); p.arms[1].sh.rotation.set(sw * 0.38 * amt, 0, 0.09);
  p.arms[0].el.rotation.set(-0.16 - Math.max(0, sw) * 0.28 * amt, 0, 0); p.arms[1].el.rotation.set(-0.16 - Math.max(0, -sw) * 0.28 * amt, 0, 0);
}
export function poseSeat(p, look, tilt) { // seated at a desk, hands on the keys
  p.pel.position.y = 0.86; rot(p.torso, 0.1, 0, 0); rot(p.head, -tilt, look, 0);
  for (const l of p.legs) { l.hip.rotation.set(-1.45, 0, 0); l.kn.rotation.set(1.4, 0, 0); l.an.rotation.set(0.05, 0, 0); }
  p.arms.forEach((a) => { a.sh.rotation.set(-0.75, 0, 0.1); a.el.rotation.set(-1.0, 0, 0); });
}
export function poseLookUp(p, look, tilt, amt) { // standing, weight shift, head turned toward the wall
  poseWalk(p, 0, 0, look, tilt); p.pel.position.y = 0.86; rot(p.torso, -0.05, look * 0.3, 0.03 * Math.sin(amt));
  p.legs[0].hip.rotation.z = 0.06; p.legs[1].hip.rotation.z = -0.06; p.arms[1].sh.rotation.set(-0.4 - 0.3 * Math.max(0, tilt), 0, 0.12);
}
export const heading = (dx, dz) => Math.atan2(dx, dz);
