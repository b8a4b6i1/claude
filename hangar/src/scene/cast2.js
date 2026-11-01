import * as THREE from 'three';
import { M, box, cyl, sph, cone, limb, beam, canvasTex, contactShadow } from './common.js';
import { makePerson, poseWalk, makeCube, poseCube } from './actors.js';
import { TAU, clamp, smooth, hash, LOOP } from '../config.js';
import { P } from '../palette.js';

const J = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
const rot = (g, x = 0, y = 0, z = 0) => g.rotation.set(x, y, z);
const CAM = Math.PI / 4; // yaw that faces the locked camera

function twin() {
  const p = makePerson('cyan2', 'wall0', { hair: 'wood4', shoes: 'ink' }); p.root.scale.setScalar(0.76);
  cone(p.pel, 0.32, 0.62, M('cyan2'), 0, -0.22, 0, null, 14); box(p.torso, 0.4, 0.04, 0.3, M('wall0'), 0, 0.18, 0); sph(p.head, 0.13, M('wood4'), 0, 0.06, -0.07, [1, 1.3, 0.9]);
  return p;
}
function conductor() {
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
  const p = makePerson('wood1', 'steel2', { hair: 'ink', shoes: 'wood4' }); p.root.scale.setScalar(1.12);
  const mask = J(p.head, 0, 0.1, 0.02); sph(mask, 0.16, M('orange2'), 0, 0.02, 0, [1, 1.1, 1]); cone(mask, 0.09, 0.34, M('orange2'), 0, -0.02, 0.2, [Math.PI / 2, 0, 0], 8); sph(mask, 0.03, M('ink'), 0, -0.02, 0.38);
  for (const s of [-1, 1]) { sph(mask, 0.025, M('ink'), s * 0.08, 0.06, 0.13); cone(mask, 0.05, 0.22, M('orange2'), s * 0.14, 0.2, -0.02, [0, 0, -s * 0.5], 6); }
  const flames = [];
  for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU, f = cone(mask, 0.07, 0.34, M(i % 2 ? 'orange' : 'yellow', { emit: 0.8 }), Math.cos(a) * 0.15, 0.18 + Math.sin(a) * 0.08 + 0.05, Math.sin(a) * 0.15 - 0.04, [Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5], 6); flames.push(f); }
  beam(p.arms[1].w, [0, 0.55, 0.0], [0, -0.7, 0.28], 0.025, M('wood3')); box(p.arms[1].w, 0.14, 0.2, 0.02, M('steel1'), 0, -0.82, 0.31, [0.22, 0, 0]);
  p.flames = flames; return p;
}
function boulder() {
  const g = new THREE.Group(); sph(g, 0.4, M('yellow2'), 0, 0.3, 0, [1.15, 0.8, 1], 14, 10);
  for (let i = 0; i < 8; i++) sph(g, 0.08 + hash(i) * 0.06, M('orange'), Math.cos(i * 2.1) * 0.32, 0.4 + Math.sin(i * 1.3) * 0.18, Math.sin(i * 2.1) * 0.25 + 0.05, [1, 0.5, 1]);
  for (const s of [-1, 1]) { sph(g, 0.05, M('white'), s * 0.12, 0.34, 0.34, [1, 1, 0.5]); sph(g, 0.022, M('ink'), s * 0.12, 0.34, 0.38); }
  box(g, 0.14, 0.03, 0.03, M('ink'), 0, 0.2, 0.4); g.add(contactShadow(0.55)); return g;
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

/** Everyone the scan shows that the first pass left out. Real people appear as faceless cardboard-style figures. All motion is a pure function of t. */
export function createExtras(scene) {
  const list = []; const add = (o, x, z, yaw, upd) => { const r = o.root; r.position.set(x, 0, z); r.rotation.y = yaw; scene.add(r); list.push({ o, upd }); if (o.shadow === undefined && r.children.every((c) => !c.isMesh || c.material.map == null)) {} return o; };
  const noShadow = (p) => { if (!p.shadow) { const s = contactShadow(0.45); p.root.add(s); p.shadow = s; } };
  // twins in blue dresses
  [[14.0, 3.2, 0], [14.6, 3.1, 1]].forEach(([x, z, k]) => add(twin(), x, z, CAM, (p, t) => { poseWalk(p, 0, 0, 0.45 * Math.sin(0.4 * t + k), 0); p.arms[k ? 0 : 1].sh.rotation.z = k ? 0.3 : -0.3; p.root.rotation.z = 0.012 * Math.sin(0.8 * t + k); }));
  add(conductor(), 18.0, -3.3, CAM, (p, t) => { const w = TAU * t / 1.6; poseWalk(p, 0, 0, 0.25 * Math.sin(0.5 * t), 0.08); p.arms[1].sh.rotation.set(-1.0 + 0.35 * Math.sin(w), 0, 0.3); p.arms[1].el.rotation.set(-1.0 + 0.5 * Math.cos(w), 0, 0); p.arms[0].sh.rotation.set(-0.6 + 0.2 * Math.cos(w), 0, -0.3); p.arms[0].el.rotation.set(-0.8, 0, 0); p.torso.rotation.y = 0.12 * Math.sin(w * 0.5); });
  add(thereminist(), 2.0, 3.8, CAM, (p, t) => { const w = TAU * t / 2.4; poseWalk(p, 0, 0, 0.15 * Math.sin(0.6 * t), 0); p.arms[1].sh.rotation.set(-1.2 + 0.25 * Math.sin(w), 0, 0.25); p.arms[1].el.rotation.set(-0.5, 0, 0); p.arms[0].sh.rotation.set(-1.0, 0, -0.2); p.arms[0].el.rotation.set(-0.7 + 0.15 * Math.cos(w), 0, 0); });
  add(tankWoman(), 3.6, 3.6, CAM, (p, t) => { poseWalk(p, 0, 0, 0.2 * Math.sin(0.5 * t), 0); for (const [i, s] of [[0, 1], [1, -1]]) { p.arms[i].sh.rotation.set(0.3, 0, s * 0.65); p.arms[i].el.rotation.set(-1.7, 0, 0); } p.root.rotation.z = 0.015 * Math.sin(0.7 * t); });
  add(singer(), 11.0, 1.0, CAM, (p, t) => { const w = TAU * t / 1.8; poseWalk(p, 0, 0, 0.2 * Math.sin(0.8 * t), 0.05 * Math.sin(w)); p.arms[1].sh.rotation.set(-1.7, 0, -0.1); p.arms[1].el.rotation.set(-1.7, 0, 0); p.arms[0].sh.rotation.set(0.15 * Math.sin(w), 0, -0.3); p.pel.position.y = 0.86 + 0.015 * Math.abs(Math.sin(w)); });
  add(flaredMan(), 9.0, -3.8, Math.PI - 0.25, (p, t) => { poseWalk(p, 0, 0, 0.35 * Math.sin(0.35 * t), 0.06); p.arms[1].sh.rotation.set(0.2, 0, -0.55); p.arms[1].el.rotation.set(-1.5, 0, 0); p.legs[0].hip.rotation.z = 0.08; p.root.rotation.z = 0.02 * Math.sin(0.5 * t); });
  const deer = add(deerMan(), 19.5, -0.6, CAM, (p, t) => { const w = TAU * t / 2.0, d = Math.max(0, Math.sin(w)); poseWalk(p, 0, 0, 0.2 * Math.sin(0.6 * t), 0); p.arms[1].sh.rotation.set(-0.5 - 0.7 * d, 0, 0.1); p.arms[1].el.rotation.set(-0.7 - 0.5 * d, 0, 0); p.arms[0].sh.rotation.set(-0.5 - 0.7 * d, 0, -0.1); p.arms[0].el.rotation.set(-0.7 - 0.5 * d, 0, 0); p.torso.rotation.x = 0.15 + 0.3 * d; p.legs[0].hip.rotation.x = -0.25; p.flames.forEach((f, i) => f.scale.set(1, 1 + 0.35 * Math.sin(t * 17 + i * 1.7), 1)); });
  const b = boulder(); b.position.set(18.8, 0, -0.15); scene.add(b); list.push({ o: { root: b }, upd: (o, t) => { b.rotation.z = 0.04 * Math.sin(t * 2.2); b.scale.y = 1 + 0.03 * Math.sin(t * 4.4); } });
  const cat = catStandee(); add(cat, 12.2, -3.4, CAM, (c, t) => { c.body.rotation.z = 0.06 * Math.sin(t * 1.3); });
  const rb = robot(); add(rb, 5.8, -3.2, CAM, (r, t) => { r.hov.position.y = 0.5 + 0.09 * Math.sin(t * 2.0); r.arms[1].rotation.z = -0.6 - 0.7 * Math.max(0, Math.sin(t * 3.0)); r.arms[0].rotation.z = 0.5; r.legs.forEach((l, i) => rot(l, 0.15 * Math.sin(t * 2 + i), 0, 0)); r.hov.rotation.y = 0.2 * Math.sin(t * 0.8); });
  // pink roller skater with a horse head glides up and down the right side
  add(roller(), 22.4, 1.0, 0, (p, t) => {
    const u = TAU * t / LOOP, z = 0.8 + 3.2 * Math.sin(u), vz = Math.cos(u), dist = 3.4 * (Math.abs(Math.sin(u)) * 0 + (() => { const m = Math.floor(u / Math.PI), r = u - m * Math.PI; return 2 * m + (r < Math.PI / 2 ? Math.sin(r) : 2 - Math.sin(r)); })());
    p.root.position.set(22.4, 0, z); p.root.rotation.y = (Math.PI / 2) * (1 - Math.tanh(vz * 6)); poseWalk(p, dist * TAU / 2.2, 0.35, 0, 0.0); p.torso.rotation.x = 0.18; p.root.rotation.z = 0.05 * Math.sin(u * 2);
  });
  // orange blocky figure with flame hair, arms out
  const og = makeCube('red', 'orange'); for (let i = 0; i < 5; i++) cone(og.head, 0.05, 0.25 + (i % 2) * 0.1, M(i % 2 ? 'wall0' : 'orange2', { emit: 0.6 }), -0.14 + i * 0.07, 0.48, 0, null, 5);
  add(og, 2.2, -1.4, CAM, (c, t) => { poseCube(c, 0, 0.3 * Math.sin(t * 0.7)); c.arms[0].rotation.z = 1.5; c.arms[1].rotation.z = -1.5; c.head.children.forEach((m, i) => { if (m.geometry && m.geometry.type === 'ConeGeometry') m.scale.y = 1 + 0.3 * Math.sin(t * 13 + i); }); });
  for (const e of list) { const p = e.o; if (p.root && !p.shadow && !p.root.children.some((c) => c.isMesh && c.material && c.material.map === undefined && false)) noShadow(p); }
  return { list, update(t) { for (const e of list) e.upd(e.o, t); } };
}
