import * as THREE from 'three';
import { P } from '../palette.js';
import { M, box, cyl, sph, cone, beam, canvasTex, hex, contactShadow } from './common.js';
import { SLAB, HX, HZ, WALL_H, MARK, TAU, smooth, hash } from '../config.js';
import { mulberry32 } from '../core/geometry.js';

const RAINBOW = ['red', 'orange', 'yellow', 'lime', 'green', 'cyan', 'blue', 'purple', 'magenta', 'pink'];

function graffitiTex(seed, w = 128, h = 80) {
  const r = mulberry32(seed);
  const cols = ['red', 'orange', 'yellow', 'lime', 'green', 'teal', 'cyan', 'blue', 'navy', 'purple', 'magenta', 'pink', 'white', 'red3', 'blue2', 'yellow2'];
  return canvasTex(w, h, (c) => {
    c.fillStyle = P[['wall1', 'con1', 'navy', 'wood4', 'wall2', 'steel2'][Math.floor(r() * 6)]]; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 7; i++) { // colour blocks
      c.fillStyle = P[cols[Math.floor(r() * cols.length)]];
      c.fillRect(r() * w * 0.8, r() * h * 0.8, 10 + r() * 46, 8 + r() * 30);
    }
    for (let i = 0; i < 5; i++) { // bubble strokes: outline + fill
      const pts = []; let x = r() * w * 0.5, y = 10 + r() * (h - 20);
      for (let k = 0; k < 5; k++) { pts.push([x, y]); x += 8 + r() * 18; y += (r() - 0.5) * 22; y = Math.min(h - 6, Math.max(6, y)); }
      for (const [lw, col] of [[11, 'ink'], [7, cols[Math.floor(r() * cols.length)]]]) {
        c.lineWidth = lw; c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = P[col]; c.beginPath();
        pts.forEach(([px, py], k) => (k ? c.lineTo(px, py) : c.moveTo(px, py))); c.stroke();
      }
    }
    for (let i = 0; i < 9; i++) { c.fillStyle = P[cols[Math.floor(r() * cols.length)]]; c.beginPath(); c.arc(r() * w, r() * h, 2 + r() * 5, 0, TAU); c.fill(); }
  });
}

/** Wall in local coords: spans x -len/2..len/2, room side is +z. */
function buildWall(len, seed, shots) {
  const g = new THREE.Group(); const r = mulberry32(seed);
  const planks = ['wood1', 'wood2', 'grey0', 'wood0', 'wood2', 'grey1'];
  const n = Math.round(len / 0.42);
  for (let i = 0; i < n; i++) { // lower vertical planks, uneven heights and tones
    const x = -len / 2 + (i + 0.5) * (len / n); const h = 3.55 + r() * 0.12;
    box(g, len / n - 0.02, h, 0.16, M(planks[Math.floor(r() * planks.length)]), x, h / 2, 0.0);
  }
  for (let i = 0; i < n; i++) { // upper whitewashed tin
    const x = -len / 2 + (i + 0.5) * (len / n); const h = WALL_H - 3.6;
    box(g, len / n - 0.01, h, 0.1, M(i % 3 === 0 ? 'wall1' : 'wall0'), x, 3.6 + h / 2, -0.03);
    if (r() < 0.07) box(g, len / n - 0.01, 0.7 + r() * 0.8, 0.012, M('rust0'), x, 3.9 + r() * 1.2, 0.03); // rust streak
  }
  for (const y of [0.15, 1.3, 2.7, 3.62]) box(g, len, 0.12, 0.2, M('wood5'), 0, y, 0.12); // girts
  for (let x = -len / 2; x <= len / 2 + 0.1; x += len / 4) { // posts + braces
    box(g, 0.46, WALL_H, 0.46, M('wood5'), x, WALL_H / 2, 0.2);
    box(g, 0.6, 0.18, 0.6, M('wood4'), x, 0.09, 0.2);
    if (x < len / 2 - 0.1) { beam(g, [x + 0.2, 0.2, 0.34], [x + len / 8, 3.62, 0.34], 0.2, M('wood4')); beam(g, [x + len / 4 - 0.2, 0.2, 0.34], [x + len / 8, 3.62, 0.34], 0.2, M('wood4')); }
  }
  // framed wall screens
  for (const s of shots) {
    box(g, s.w + 0.4, s.h + 0.4, 0.24, M('wood5'), s.x, s.y, 0.2);
    box(g, s.w + 0.1, s.h + 0.1, 0.3, M('ink'), s.x, s.y, 0.2);
    const tex = canvasTex(96, Math.round(96 * s.h / s.w), () => {});
    const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(s.w, s.h), mat); m.position.set(s.x, s.y, 0.36); g.add(m);
    s.mesh = m; s.tex = tex; s.group = g;
  }
  // graffiti panels on the plank band
  for (let i = 0; i < Math.floor(len / 2.6); i++) {
    const gw = 1.6 + r() * 1.2, gh = 1.0 + r() * 0.8, x = -len / 2 + 1.4 + i * 2.6 + r() * 0.5;
    if (shots.some((s) => Math.abs(s.x - x) < (s.w + gw) / 2 + 0.3 && s.y < 3.6)) continue;
    const mat = new THREE.MeshStandardMaterial({ map: graffitiTex(seed * 100 + i), roughness: 1 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(gw, gh), mat);
    m.position.set(x, 1.1 + gh / 2 + r() * 0.4, 0.105); m.receiveShadow = true; g.add(m);
  }
  return g;
}

function spiral() {
  const K = 520, pos = [], idx = [], col = new Float32Array(K * 2 * 3);
  for (let i = 0; i < K; i++) {
    const u = i / (K - 1), a = u * TAU * 3.3, rad = 0.35 + u * 3.0, w = 0.13 + u * 0.08;
    const cx = Math.cos(a), cz = Math.sin(a);
    pos.push(cx * (rad - w), 0, cz * (rad - w), cx * (rad + w), 0, cz * (rad + w));
    if (i < K - 1) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(idx); geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }));
  mesh.position.set(MARK.spiral[0], 0.022, MARK.spiral[1]); mesh.receiveShadow = true;
  const cols = RAINBOW.map((n) => hex(n));
  mesh.userData.recolor = (t, glow) => {
    const a = geo.attributes.color;
    for (let i = 0; i < K; i++) {
      const k = Math.floor(i / 22 + t * 0.9 * (1 + glow)) % cols.length; const c = cols[k];
      a.setXYZ(i * 2, c.r, c.g, c.b); a.setXYZ(i * 2 + 1, c.r, c.g, c.b);
    }
    a.needsUpdate = true;
  };
  mesh.userData.recolor(0, 0);
  return mesh;
}

function fanCarpet() {
  const g = new THREE.Group(); const n = 14;
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(3.2, 3, (i / n) * Math.PI * 1.1, (Math.PI * 1.1) / n), M(RAINBOW[i % RAINBOW.length]));
    m.rotation.x = -Math.PI / 2; m.position.y = 0; m.receiveShadow = true; g.add(m);
  }
  g.position.set(8.0, 0.03, 2.2); g.rotation.y = 0.7; return g;
}

function stoneMask(parts) {
  const g = new THREE.Group(); const S = M('stone0'), S1 = M('stone1'), S2 = M('stone2');
  sph(g, 1.3, S, 0, 0, 0, [1, 1.12, 0.5]); // face
  sph(g, 0.36, S1, -0.78, -0.18, 0.42, [1, 1.1, 0.7]); sph(g, 0.36, S1, 0.78, -0.18, 0.42, [1, 1.1, 0.7]); // cheeks
  box(g, 0.95, 0.2, 0.34, S1, -0.55, 0.52, 0.5, [0, 0, -0.16]); box(g, 0.95, 0.2, 0.34, S1, 0.55, 0.52, 0.5, [0, 0, 0.16]); // brows
  for (const sx of [-1, 1]) { sph(g, 0.26, M('ink'), sx * 0.52, 0.28, 0.5, [1, 0.85, 0.5]); sph(g, 0.12, M('stone0'), sx * 0.52, 0.28, 0.62, [1, 1, 0.6]); sph(g, 0.06, M('ink'), sx * 0.52, 0.28, 0.68); }
  box(g, 0.2, 0.62, 0.2, S1, 0, 0.12, 0.62); cone(g, 0.2, 0.3, S1, 0, -0.25, 0.7, [Math.PI / 2, 0, 0]);
  // hollow mouth: lip ring, dark bore, glow disc, teeth
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.14, 8, 22), S2); lip.scale.set(1.15, 0.95, 0.8); lip.position.set(0, -0.62, 0.52); g.add(lip);
  const bore = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.42, 0.5, 20, 1, true), M('ink', { side: THREE.DoubleSide })); bore.rotation.x = Math.PI / 2; bore.scale.set(1.15, 1, 0.95); bore.position.set(0, -0.62, 0.3); g.add(bore);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(0.46, 20), new THREE.MeshBasicMaterial({ color: P.ink, toneMapped: false })); glow.scale.set(1.15, 0.95, 1); glow.position.set(0, -0.62, 0.14); g.add(glow);
  for (let i = 0; i < 6; i++) { box(g, 0.1, 0.16, 0.08, M('wall0'), -0.42 + i * 0.168, -0.3, 0.55); box(g, 0.1, 0.14, 0.08, M('wall0'), -0.38 + i * 0.152, -0.95, 0.5); }
  for (const sx of [-1, 1]) { sph(g, 0.24, S1, sx * 1.28, 0.05, 0.05, [0.5, 1.1, 0.7]); } // ears
  for (let i = 0; i < 9; i++) sph(g, 0.17, M(i % 2 ? 'green2' : 'green'), -0.9 + i * 0.225, 1.28 + Math.sin(i * 1.7) * 0.07, 0.1, [1.3, 0.8, 1]); // moss crown
  for (let i = 0; i < 5; i++) cone(g, 0.12, 0.7, S2, -0.8 + i * 0.4, -1.45, 0.2, [0, 0, Math.PI]); // chin beard spikes
  parts.glow = glow;
  return g;
}

function deskSet(parts) {
  const g = new THREE.Group();
  box(g, 1.6, 0.08, 0.85, M('wood2'), 0, 0.78, 0); box(g, 1.6, 0.04, 0.85, M('wood3'), 0, 0.72, 0);
  for (const [x, z] of [[-0.72, -0.36], [0.72, -0.36], [-0.72, 0.36], [0.72, 0.36]]) box(g, 0.07, 0.72, 0.07, M('wood4'), x, 0.36, z);
  box(g, 1.4, 0.05, 0.05, M('wood4'), 0, 0.3, 0.36); box(g, 1.4, 0.05, 0.05, M('wood4'), 0, 0.3, -0.36);
  box(g, 0.72, 0.58, 0.58, M('wall1'), -0.25, 1.12, -0.05); box(g, 0.62, 0.5, 0.08, M('wall2'), -0.25, 1.1, 0.27); // CRT body + bezel
  box(g, 0.34, 0.22, 0.34, M('wall1'), -0.25, 0.9, -0.05);
  const tex = canvasTex(64, 48, () => {}); parts.monitor = tex;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.38), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); scr.position.set(-0.25, 1.12, 0.315); g.add(scr);
  box(g, 0.34, 0.74, 0.6, M('wall1'), 0.55, 1.2, -0.1); box(g, 0.28, 0.04, 0.02, M('con3'), 0.55, 1.42, 0.21); box(g, 0.28, 0.04, 0.02, M('con3'), 0.55, 1.34, 0.21);
  box(g, 0.1, 0.03, 0.02, M('green'), 0.62, 1.1, 0.21); // tower + drive slots + LED
  box(g, 0.55, 0.035, 0.18, M('wall2'), -0.25, 0.835, 0.27); box(g, 0.08, 0.025, 0.12, M('wall0'), 0.1, 0.83, 0.27); // keyboard, mouse
  box(g, 0.2, 0.012, 0.2, M('yellow'), 0.35, 0.82, 0.2, [0, 0.4, 0]); // sticker/floppy
  cyl(g, 0.22, 0.22, 0.06, M('con4'), -0.25, 0.4, 0.95, null, 16); cyl(g, 0.04, 0.04, 0.4, M('con4'), -0.25, 0.2, 0.95); cyl(g, 0.2, 0.2, 0.02, M('steel2'), -0.25, 0.01, 0.95, null, 12); // stool seat, post, foot
  g.userData.stool = new THREE.Vector3(-0.25, 0, 0.95);
  return g;
}

function drumKit() {
  const g = new THREE.Group();
  cyl(g, 0.38, 0.38, 0.4, M('red2'), 0, 0.42, 0, [0, 0, Math.PI / 2], 18); cyl(g, 0.39, 0.39, 0.03, M('wall0'), 0.2, 0.42, 0, [0, 0, Math.PI / 2], 18);
  for (const [x, z, r] of [[-0.2, 0.55, 0.22], [0.2, 0.55, 0.22]]) { cyl(g, r, r, 0.22, M('red2'), x, 0.95, z - 0.3, null, 16); cyl(g, r, r, 0.02, M('wall0'), x, 1.07, z - 0.3, null, 16); }
  cyl(g, 0.24, 0.24, 0.16, M('steel1'), -0.2, 0.75, -0.7, null, 16); cyl(g, 0.02, 0.02, 0.7, M('steel2'), 0.7, 0.35, 0.35);
  cyl(g, 0.3, 0.3, 0.012, M('yellow2'), 0.7, 0.72, 0.35, [0.12, 0, 0.1], 18); cyl(g, 0.28, 0.28, 0.012, M('yellow2'), -0.55, 1.5, -0.2, [0.1, 0, -0.1], 18);
  cyl(g, 0.02, 0.02, 1.4, M('steel2'), -0.55, 0.75, -0.2); cyl(g, 0.2, 0.22, 0.12, M('wood4'), -0.9, 0.4, 0.6, null, 12);
  return g;
}

export function buildHangar(scene) {
  const parts = { screens: [], posts: [] };
  const world = new THREE.Group(); scene.add(world);

  // slab, flat cut-out, no plinth
  box(world, SLAB.w, SLAB.h, SLAB.d, M('con1'), 0, -SLAB.h / 2, 0).castShadow = false;
  const joints = new THREE.Group(); world.add(joints);
  for (let x = -HX + 4; x < HX; x += 4) box(joints, 0.085, 0.01, SLAB.d, M('con2'), x, 0.004, 0).castShadow = false;
  for (let z = -HZ + 4; z < HZ; z += 4) box(joints, SLAB.w, 0.01, 0.085, M('con2'), 0, 0.005, z).castShadow = false;
  const r = mulberry32(7);
  for (let i = 0; i < 12; i++) { // oil stains and wear
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.25 + r() * 0.7, 18), M('con2')); m.rotation.x = -Math.PI / 2;
    m.scale.set(1 + r(), 1, 1); m.position.set(-HX + 1 + r() * (SLAB.w - 2), 0.007 + i * 0.0004, -HZ + 1 + r() * (SLAB.d - 2)); m.receiveShadow = true; world.add(m);
  }
  for (let i = 0; i < 6; i++) { // chalk marks
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2 + r() * 1.6, 0.07), M(['wall0', 'cyan2', 'pink2', 'yellow2'][i % 4])); m.rotation.x = -Math.PI / 2;
    m.rotation.z = r() * Math.PI; m.position.set(-8 + r() * 14, 0.03, -3 + r() * 8); world.add(m);
  }
  const sp = spiral(); world.add(sp); parts.spiral = sp; world.add(fanCarpet());
  box(world, 3.2, 0.04, 2.2, M('red2'), 9.2, 0.025, -3.0, [0, 0.25, 0]); box(world, 2.8, 0.045, 1.8, M('red3'), 9.2, 0.03, -3.0, [0, 0.25, 0]); // red rug + inner field

  // back walls: -Z wall (right on screen) and -X wall (left on screen)
  const zShots = [{ x: -6.5, y: 2.1, w: 3.4, h: 2.1 }, { x: -1.0, y: 2.1, w: 3.0, h: 1.9 }, { x: 8.5, y: 2.1, w: 3.2, h: 2.0 }];
  const wz = buildWall(SLAB.w, 3, zShots); wz.position.set(0, 0, -HZ); world.add(wz);
  const xShots = [{ x: -3.5, y: 2.2, w: 3.0, h: 2.0 }, { x: 4.6, y: 2.2, w: 3.4, h: 2.1 }];
  const wx = buildWall(SLAB.d, 5, xShots); wx.rotation.y = Math.PI / 2; wx.position.set(-HX, 0, 0); world.add(wx);
  parts.screens = [...zShots, ...xShots].map((s, i) => ({ ...s, id: i }));

  // roof structure: shallow trusses, purlins, posts
  const roof = new THREE.Group(); world.add(roof);
  for (const x of [-7, 0, 7]) {
    const y0 = WALL_H, y1 = WALL_H + 1.3;
    box(roof, 0.16, 0.16, SLAB.d, M('wood5'), x, y0, 0);
    for (const z of [-HZ + 0.4, HZ - 0.4]) box(roof, 0.34, 0.34, 0.34, M('wood4'), x, y0, z); // end blocks on the wall plates
  }
  for (const [x, z] of [[-5, -1.5], [3.5, -1.8], [-6, 5.5]]) { // interior posts with knee braces
    box(world, 0.5, WALL_H, 0.5, M('wood5'), x, WALL_H / 2, z); box(world, 0.8, 0.22, 0.8, M('wood4'), x, 0.11, z);
    box(world, 0.7, 0.22, 0.7, M('wood4'), x, WALL_H - 0.2, z);
    beam(world, [x, WALL_H - 0.4, z], [x, WALL_H, z + 1.5], 0.2, M('wood4')); beam(world, [x, WALL_H - 0.4, z], [x, WALL_H, z - 1.5], 0.2, M('wood4'));
    parts.posts.push([x, z]);
  }

  // landmark: stone mask centred on the -Z wall
  const mask = stoneMask(parts); mask.scale.setScalar(1.3); mask.position.set(MARK.mask[0], 3.6, -HZ + 0.85); world.add(mask);
  box(world, 4.2, 4.6, 0.12, M('wood5'), MARK.mask[0], 3.2, -HZ + 0.36); // dark recess behind it
  parts.maskPos = new THREE.Vector3(MARK.mask[0], 3.3, -HZ + 1.3);

  // desk + monitor, facing +X
  const desk = deskSet(parts); desk.position.set(MARK.desk[0], 0, MARK.desk[1]); desk.rotation.y = Math.PI / 2; world.add(desk);
  const st = desk.userData.stool.clone().applyEuler(new THREE.Euler(0, Math.PI / 2, 0)).add(new THREE.Vector3(MARK.desk[0], 0, MARK.desk[1]));
  parts.stool = st;
  const dk = drumKit(); dk.position.set(-HX + 2.4, 0, -3.2); dk.rotation.y = Math.PI / 2; world.add(dk);
  // speaker stack and crates near the right back
  const sp1 = new THREE.Group(); box(sp1, 1.0, 1.4, 0.8, M('steel3'), 0, 0.7, 0); cyl(sp1, 0.32, 0.32, 0.05, M('con4'), 0, 0.5, 0.42, [Math.PI / 2, 0, 0], 16); cyl(sp1, 0.22, 0.22, 0.05, M('con4'), 0, 1.05, 0.42, [Math.PI / 2, 0, 0], 16);
  box(sp1, 1.0, 0.9, 0.8, M('steel2'), 0, 1.85, 0); cyl(sp1, 0.28, 0.28, 0.05, M('con4'), 0, 1.85, 0.42, [Math.PI / 2, 0, 0], 16);
  sp1.position.set(10.3, 0, -6.6); sp1.rotation.y = -0.3; world.add(sp1);
  for (let i = 0; i < 3; i++) box(world, 0.9, 0.55, 0.7, M(['wood2', 'wood1', 'wood3'][i]), -9.5 + i * 0.95, 0.275 + (i === 1 ? 0.55 : 0), 5.8 - i * 0.2, [0, 0.1 * i, 0]);
  parts.world = world;
  return parts;
}
