import * as THREE from 'three';
import { M, box, cyl, sph, cone, limb, beam, canvasTex, contactShadow } from './common.js';
import { makePerson } from './actors.js';
import { TAU, hash } from '../config.js';
import { P } from '../palette.js';

const J = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };

/** Running cycle (hips 0.8 rad, knees up to 1.3, elbows locked at 1.45, torso leaned). phase = TAU per full stride. */
export function poseRun(p, phase, amt = 1, lean = 0.3) {
  const sw = Math.sin(phase), cs = Math.cos(phase);
  const kL = 0.25 + 1.0 * Math.max(0, -cs) + 0.25 * Math.max(0, sw), kR = 0.25 + 1.0 * Math.max(0, cs) + 0.25 * Math.max(0, -sw);
  p.pel.position.y = 0.82 + Math.abs(cs) * 0.07 * amt; p.torso.rotation.set(lean, sw * 0.12, 0); p.head.rotation.set(-lean * 0.6, 0, 0);
  p.legs[0].hip.rotation.set(sw * 0.8 * amt, 0, 0.03); p.legs[1].hip.rotation.set(-sw * 0.8 * amt, 0, -0.03);
  p.legs[0].kn.rotation.set(kL * amt, 0, 0); p.legs[1].kn.rotation.set(kR * amt, 0, 0); p.legs[0].an.rotation.set(-kL * 0.3, 0, 0); p.legs[1].an.rotation.set(-kR * 0.3, 0, 0);
  p.arms[0].sh.rotation.set(-sw * 0.9, 0, -0.12); p.arms[1].sh.rotation.set(sw * 0.9, 0, 0.12); p.arms[0].el.rotation.set(-1.45, 0, 0); p.arms[1].el.rotation.set(-1.45, 0, 0);
}

/** bare lower legs: skin sleeves over the trouser limbs from `from` (m below the hip) to the ankle; optional tall socks. */
function shorts(p, skin, sock) {
  const S = M(skin);
  for (const l of p.legs) {
    cyl(l.hip, 0.082, 0.079, 0.42 - 0.2, S, 0, -0.31, 0, null, 10); cyl(l.kn, 0.067, 0.063, 0.4, S, 0, -0.2, 0, null, 10);
    if (sock) { cyl(l.kn, 0.072, 0.069, 0.27, M('white'), 0, -0.26, 0, null, 10); cyl(l.kn, 0.074, 0.074, 0.022, M(sock[0]), 0, -0.17, 0, null, 10); cyl(l.kn, 0.073, 0.073, 0.022, M(sock[1]), 0, -0.215, 0, null, 10); }
  }
}

// ---------------------------------------------------------------- Moises: red tank top, cream headband, grey curls, stern frown, navy shorts with stripes, striped socks, black sneakers
export function makeMoises() {
  const p = makePerson('red', 'navy', { skin: 'skin1', hair: 'grey1', shoes: 'ink' });
  cyl(p.head, 0.121, 0.121, 0.05, M('wood6'), 0, 0.155, 0, null, 14);
  for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; sph(p.head, 0.042 + 0.014 * hash(i), M(i % 3 ? 'grey1' : 'grey0'), Math.cos(a) * 0.118, 0.17 + 0.08 * hash(i + 3), Math.sin(a) * 0.108 - 0.01, [1, 1, 1], 8, 6); }
  for (let i = 0; i < 6; i++) sph(p.head, 0.052, M(i % 2 ? 'grey1' : 'wood5'), (i - 2.5) * 0.046, 0.255 + 0.015 * hash(i), -0.02, [1, 1, 1], 8, 6);
  for (const s of [-1, 1]) box(p.head, 0.05, 0.012, 0.02, M('ink'), s * 0.042, 0.165, 0.108, [0, 0, s * 0.3]);   // frowning brows
  box(p.head, 0.05, 0.012, 0.02, M('wood4'), 0, 0.045, 0.108, [0, 0, 0]);                                         // down-turned mouth
  for (const s of [-1, 1]) box(p.pel, 0.016, 0.22, 0.2, M('white'), s * 0.166, -0.1, 0);
  shorts(p, 'skin1', ['red2', 'red2']);
  return p;
}

// ---------------------------------------------------------------- Rael: shirtless, dark curls, black belt, washed flared jeans, white sneakers
export function makeRael() {
  const p = makePerson('skin1', 'steel1', { skin: 'skin1', hair: 'ink', shoes: 'white' });
  for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; sph(p.head, 0.045 + 0.012 * hash(i + 5), M('ink'), Math.cos(a) * 0.1, 0.18 + 0.07 * hash(i + 9), Math.sin(a) * 0.1 - 0.015, [1, 1, 1], 8, 6); }
  for (let i = 0; i < 5; i++) sph(p.head, 0.055, M('ink'), (i - 2) * 0.05, 0.27, -0.02, [1, 1, 1], 8, 6);
  cyl(p.pel, 0.175, 0.175, 0.05, M('ink'), 0, 0.1, 0, null, 14); box(p.pel, 0.05, 0.04, 0.02, M('yellow2'), 0, 0.1, 0.178);
  for (const s of [-1, 1]) { box(p.pel, 0.1, 0.12, 0.02, M('steel2'), s * 0.075, -0.02, -0.155); box(p.pel, 0.09, 0.02, 0.022, M('steel0'), s * 0.075, 0.04, -0.157); }
  for (const l of p.legs) { cone(l.kn, 0.2, 0.48, M('steel1'), 0, -0.2, 0, null, 14); for (let k = 0; k < 4; k++) box(l.hip, 0.07 + 0.02 * k, 0.08, 0.02, M(k % 2 ? 'steel0' : 'steel2'), 0.02 * (k - 1.5), -0.1 - 0.09 * k, 0.07); }
  return p;
}

// ---------------------------------------------------------------- Boojie Boy: pale bald mask, round red sunglasses, red lips, JIRAFA ARDIENDO tank, black armbands, red satin shorts, roller skates, microphone
export function makeBoojie() {
  const p = makePerson('navy', 'red2', { skin: 'skin0', hair: 'skin0', shoes: 'navy' });
  sph(p.head, 0.085, M('wall0'), 0, 0.03, 0.05, [1, 0.8, 0.8]);                                                  // chalky lower face
  for (const s of [-1, 1]) {
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.012, 14), M('red', { emit: 0.6 })); lens.rotation.x = Math.PI / 2; lens.position.set(s * 0.05, 0.13, 0.11); p.head.add(lens);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.037, 0.006, 6, 14), M('wall0')); rim.position.set(s * 0.05, 0.13, 0.113); p.head.add(rim);
    sph(p.head, 0.03, M('pink'), s * 0.085, 0.06, 0.085, [1, 0.8, 0.4]); sph(p.head, 0.03, M('skin0'), s * 0.115, 0.1, 0, [0.5, 1, 0.8]);
  }
  box(p.head, 0.09, 0.012, 0.02, M('wall0'), 0, 0.13, 0.115); box(p.head, 0.05, 0.022, 0.02, M('red'), 0, 0.05, 0.108); box(p.head, 0.025, 0.012, 0.02, M('ink'), 0, 0.05, 0.116);
  const tex = canvasTex(96, 56, (c, w, h) => { c.fillStyle = P.navy; c.fillRect(0, 0, w, h); c.fillStyle = P.white; c.font = 'bold 22px Impact, Arial Black, sans-serif'; c.textAlign = 'center'; c.fillText('JIRAFA', w / 2, 24); c.font = 'bold 15px Impact, Arial Black, sans-serif'; c.fillText('ARDIENDO', w / 2, 46); });
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.15), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); lab.position.set(0, 0.34, 0.2); p.torso.add(lab);
  for (const a of p.arms) { cyl(a.sh, 0.064, 0.064, 0.12, M('ink'), 0, -0.14, 0, null, 10); cyl(a.sh, 0.066, 0.066, 0.014, M('red'), 0, -0.075, 0, null, 10); cyl(a.sh, 0.066, 0.066, 0.014, M('red'), 0, -0.205, 0, null, 10); }
  cyl(p.pel, 0.186, 0.186, 0.06, M('white'), 0, 0.07, 0, null, 14); cyl(p.pel, 0.188, 0.188, 0.02, M('ink'), 0, 0.1, 0, null, 14); sph(p.pel, 0.03, M('yellow'), 0, 0.075, 0.185, [1, 1, 0.3]);
  for (const s of [-1, 1]) box(p.pel, 0.016, 0.24, 0.2, M('white'), s * 0.17, -0.12, 0);
  shorts(p, 'skin0', null);
  for (const l of p.legs) {                                                                                       // roller skates
    box(l.an, 0.12, 0.17, 0.26, M('navy'), 0, 0.0, 0.05); box(l.an, 0.13, 0.03, 0.3, M('wall0'), 0, -0.095, 0.06); box(l.an, 0.12, 0.012, 0.14, M('red'), 0, 0.09, 0.1);
    for (const z of [-0.06, 0.16]) for (const sx of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.04, 12), M('wall0')); w.rotation.z = Math.PI / 2; w.position.set(sx * 0.07, -0.16, z); l.an.add(w); }
  }
  const mic = new THREE.Group(); cyl(mic, 0.018, 0.016, 0.14, M('ink'), 0, 0.03, 0.0, null, 8); sph(mic, 0.035, M('steel1'), 0, 0.12, 0); p.arms[1].w.add(mic); mic.rotation.x = -0.9;
  p.mic = mic; return p;
}

// ---------------------------------------------------------------- Poly: tall yellow dress with black dots, blue wolf-cat head with one big ringed eye and one slit eye, big black grin, thin blue limbs, a bitten apple on a stick
export function makePoly() {
  const root = new THREE.Group(), body = J(root, 0, 0, 0);
  const Y = M('yellow2'), C = M('cyan'), K = M('ink'), W = M('white');
  const dg = new THREE.CylinderGeometry(0.40, 0.54, 0.85, 4); dg.rotateY(Math.PI / 4); const dress = new THREE.Mesh(dg, Y); dress.scale.set(1, 1, 0.3); dress.position.y = 0.78; dress.castShadow = true; body.add(dress);
  for (let i = 0; i < 20; i++) { const y = 0.45 + 0.7 * hash(i * 3 + 1), hw = 0.19 + 0.17 * (1 - (y - 0.4) / 0.8), x = (hash(i * 5 + 2) - 0.5) * 2 * hw * 0.85; const d = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.01, 8), K); d.rotation.x = Math.PI / 2; d.position.set(x, y, 0.1); body.add(d); }
  const head = J(body, 0, 1.52, 0); box(head, 0.7, 0.9, 0.12, M('yellow'), 0, 0.15, -0.12);                       // yellow card behind the head
  box(head, 0.6, 0.64, 0.28, C, 0, 0, 0); box(head, 0.6, 0.12, 0.29, K, 0, -0.26, 0.0);                          // blue wolf face + jaw
  for (const s of [-1, 1]) { cone(head, 0.15, 0.4, C, s * 0.2, 0.5, 0, [0, 0, -s * 0.12], 3); }                    // ears
  for (let i = 0; i < 7; i++) box(head, i % 2 ? 0.06 : 0.05, 0.09, 0.03, W, -0.2 + i * 0.067, -0.19, 0.15 + (i % 2) * 0.0);   // teeth
  const eye = J(head, 0.14, 0.06, 0.15); sph(eye, 0.1, M('rust1'), 0, 0, 0, [1, 1, 0.4]); sph(eye, 0.04, K, 0, 0, 0.04, [1, 1, 0.4]); for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; box(eye, 0.012, 0.05, 0.012, M('rust2'), Math.cos(a) * 0.125, Math.sin(a) * 0.125, 0, [0, 0, a - Math.PI / 2]); }
  const slit = J(head, -0.14, 0.06, 0.15); sph(slit, 0.065, W, 0, 0, 0, [0.8, 1.5, 0.4]); sph(slit, 0.04, M('lime'), 0, -0.01, 0.03, [1, 0.7, 0.4]); box(slit, 0.09, 0.02, 0.02, K, 0, -0.01, 0.06);
  cone(head, 0.05, 0.12, K, 0, -0.1, 0.16, [Math.PI, 0, 0], 3);
  const legs = [-1, 1].map((s) => { const l = J(body, s * 0.17, 0.4, 0); limb(l, 0.4, 0.034, C); box(l, 0.07, 0.03, 0.16, C, 0, -0.4, 0.04); return l; });
  const armL = J(body, -0.42, 1.12, 0); limb(armL, 0.55, 0.045, C); sph(armL, 0.07, C, 0, -0.57, 0, [1, 1.3, 0.8]); armL.rotation.z = -0.15;
  const armR = J(body, 0.42, 1.12, 0); limb(armR, 0.5, 0.045, C); const hand = J(armR, 0, -0.52, 0); sph(hand, 0.07, C, 0, 0, 0, [1, 1.3, 0.8]);
  const stick = J(hand, 0, 0, 0); beam(stick, [0, 0, 0], [0, -0.45, 0], 0.025, M('wood5')); sph(stick, 0.1, M('red'), 0, -0.52, 0); sph(stick, 0.03, K, 0.07, -0.47, 0.04); cone(stick, 0.04, 0.12, M('green'), -0.08, -0.62, 0, [0, 0, 0.9], 4); cone(stick, 0.04, 0.12, M('green'), 0.08, -0.62, 0, [0, 0, -0.9], 4);
  armR.rotation.z = 2.4; stick.rotation.z = -1.0;
  const shadow = contactShadow(0.55); root.add(shadow); root.scale.setScalar(0.88);
  return { root, body, head, armL, armR, stick, legs, shadow };
}
