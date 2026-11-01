import * as THREE from 'three';
import { P } from '../palette.js';
import { M, box, cyl, sph, cone, beam, canvasTex, hex, contactShadow } from './common.js';
import { SLAB, HX, HZ, WALL_H, MARK, TAU, smooth, hash, DIV_X, DOOR } from '../config.js';
import { mulberry32 } from '../core/geometry.js';
import { IMGS } from './footage.js';

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
function buildWall(len, seed, shots, bays = 4) {
  const bw = len / bays;
  const g = new THREE.Group(); const r = mulberry32(seed);
  const planks = ['wood1', 'wood2', 'grey0', 'wood0', 'wood2', 'grey1'];
  const n = Math.round(len / 0.42);
  for (let i = 0; i < n; i++) { // lower vertical planks, uneven heights and tones
    const x = -len / 2 + (i + 0.5) * (len / n); const h = 3.55 + r() * 0.12;
    box(g, len / n - 0.02, h, 0.16, M(planks[Math.floor(r() * planks.length)]), x, h / 2, 0.0);
  }
  const upper = ['wall1', 'steel0', 'wall2', 'wall1', 'steel0'];
  for (let i = 0; i < n; i++) { // upper half-timbered infill: weathered vertical boards
    const x = -len / 2 + (i + 0.5) * (len / n); const h = WALL_H - 3.6;
    box(g, len / n - 0.015, h, 0.1, M(upper[Math.floor(r() * upper.length)]), x, 3.6 + h / 2, -0.05);
  }
  for (let bx = -len / 2; bx < len / 2 - 0.1; bx += bw) { // K-braces in every bay, as in the scan
    const x0 = bx + 0.25, x1 = bx + bw - 0.25, xm = (x0 + x1) / 2;
    beam(g, [x0, 3.7, 0.3], [xm, 4.9, 0.3], 0.2, M('wood4')); beam(g, [x1, 3.7, 0.3], [xm, 4.9, 0.3], 0.2, M('wood4'));
    beam(g, [x0, WALL_H - 0.1, 0.3], [xm, 4.9, 0.3], 0.2, M('wood4')); beam(g, [x1, WALL_H - 0.1, 0.3], [xm, 4.9, 0.3], 0.2, M('wood4'));
  }
  box(g, len, 0.14, 0.22, M('wood4'), 0, 4.9, 0.14); box(g, len, 0.16, 0.24, M('wood5'), 0, WALL_H - 0.08, 0.14);
  for (const y of [0.15, 1.3, 2.7, 3.62]) box(g, len, 0.12, 0.2, M('wood5'), 0, y, 0.12); // girts
  for (let x = -len / 2; x <= len / 2 + 0.1; x += bw) { // posts + braces
    box(g, 0.46, WALL_H, 0.46, M('wood5'), x, WALL_H / 2, 0.2);
    box(g, 0.6, 0.18, 0.6, M('wood4'), x, 0.09, 0.2);
    if (x < len / 2 - 0.1) { beam(g, [x + 0.2, 0.2, 0.34], [x + bw / 2, 3.62, 0.34], 0.2, M('wood4')); beam(g, [x + len / 4 - 0.2, 0.2, 0.34], [x + bw / 2, 3.62, 0.34], 0.2, M('wood4')); }
  }
  // big timber doorways with the screen set into the opening (as in the scan)
  for (const sc of shots) {
    const top = sc.y + sc.h / 2 + 0.3, bot = sc.y - sc.h / 2;
    box(g, sc.w + 0.9, top, 0.1, M('wood5'), sc.x, top / 2, 0.19); // dark recess
    for (const sx of [-1, 1]) box(g, 0.3, top, 0.34, M('wood4'), sc.x + sx * (sc.w / 2 + 0.3), top / 2, 0.24); // jambs
    box(g, sc.w + 0.9, 0.34, 0.38, M('wood5'), sc.x, top + 0.17, 0.25); // lintel
    for (const sx of [-1, 1]) { box(g, sc.w / 2 + 0.05, bot, 0.1, M('wood3'), sc.x + sx * (sc.w / 4 + 0.02), bot / 2, 0.27); for (let k = 1; k < 4; k++) box(g, 0.03, bot, 0.02, M('wood5'), sc.x + sx * (k * sc.w / 8), bot / 2, 0.33); } // double leaf
    box(g, sc.w + 0.1, 0.12, 0.14, M('wood5'), sc.x, bot - 0.02, 0.3); // sill rail
    const tex = canvasTex(96, Math.round(96 * sc.h / sc.w), () => {});
    const m = new THREE.Mesh(new THREE.PlaneGeometry(sc.w, sc.h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); m.position.set(sc.x, sc.y, 0.34); g.add(m);
    sc.mesh = m; sc.tex = tex; sc.group = g;
  }
  // graffiti panels on the plank band
  for (let i = 0; i < Math.floor(len / 2.6); i++) {
    const gw = 1.6 + r() * 1.2, gh = 1.0 + r() * 0.8, x = -len / 2 + 1.4 + i * 2.6 + r() * 0.5;
    if (shots.some((s) => Math.abs(s.x - x) < (s.w + gw) / 2 + 0.9)) continue;
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
  g.position.set(-21.5, 0.05, 1.2); g.rotation.y = 0.7; return g;
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
  for (const sx of [-1, 1]) { cyl(g, 0.62, 0.62, 0.26, S, sx * 1.05, 1.18, -0.05, [Math.PI / 2, 0, 0], 22); cyl(g, 0.46, 0.46, 0.06, S1, sx * 1.05, 1.18, 0.1, [Math.PI / 2, 0, 0], 20); sph(g, 0.2, M('green2'), sx * 1.05, 1.62, -0.05, [1.4, 0.5, 1]); } // round mouse ears with moss
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
  for (let i = 0; i < 22; i++) { // oil stains and wear
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.25 + r() * 0.7, 18), M('con2')); m.rotation.x = -Math.PI / 2;
    m.scale.set(1 + r(), 1, 1); m.position.set(-HX + 1 + r() * (SLAB.w - 2), 0.007 + i * 0.0004, -HZ + 1 + r() * (SLAB.d - 2)); m.receiveShadow = true; world.add(m);
  }
  for (let i = 0; i < 6; i++) { // chalk marks
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2 + r() * 1.6, 0.07), M(['wall0', 'cyan2', 'pink2', 'yellow2'][i % 4])); m.rotation.x = -Math.PI / 2;
    m.rotation.z = r() * Math.PI; m.position.set(-22 + r() * 44, 0.03, -3.5 + r() * 7); world.add(m);
  }
  for (let i = 0; i < 7; i++) box(world, 6.0, 0.03, 0.3, M(['red', 'orange', 'yellow', 'lime', 'cyan', 'blue', 'purple'][i]), -17.0, 0.035, 0.6 + i * 0.36, [0, 0.12, 0]); // rainbow stripes toward the band
  for (let i = 0; i < 10; i++) for (let j = 0; j < 1; j++) box(world, 0.9, 0.03, 0.9, M(['yellow', 'cyan', 'pink', 'lime', 'ink', 'orange'][(i + j * 2) % 6]), -20.0 + i * 0.75 + j * 0.35, 0.04, 2.3 + j * 0.75, [0, 0.4, 0]); // harlequin tiles
  const sp = spiral(); world.add(sp); parts.spiral = sp; world.add(fanCarpet());
  const band = new THREE.Group(); band.position.set(-19.8, 0, -1.8); world.add(band); parts.band = band;
  box(band, 6.2, 0.03, 4.6, M('teal2'), 0, 0.02, 0.1); box(band, 5.8, 0.035, 4.2, M('green2'), 0, 0.025, 0.1); // green floral rug
  box(band, 4.8, 0.04, 3.2, M('red2'), -0.2, 0.035, -0.4); box(band, 4.4, 0.045, 2.8, M('red'), -0.2, 0.04, -0.4); box(band, 3.2, 0.05, 1.6, M('navy'), -0.2, 0.045, -0.4); cyl(band, 0.55, 0.55, 0.055, M('wood6'), -0.2, 0.05, -0.4, null, 18); // red rug, blue field, medallion
  const amp = (x, z, ry) => { const a = new THREE.Group(); box(a, 0.9, 0.7, 0.4, M('wood6'), 0, 0.35, 0); box(a, 0.78, 0.5, 0.04, M('wood2'), 0, 0.35, 0.21); a.position.set(x, 0.05, z); a.rotation.y = ry; band.add(a); };
  amp(-2.0, -1.4, 0.25); amp(-1.1, -1.5, 0.1);
  box(band, 0.7, 1.7, 0.6, M('black'), 0.4, 0.9, -1.6); box(band, 0.7, 0.3, 0.5, M('steel3'), 0.4, 1.9, -1.6); box(band, 0.5, 0.5, 0.04, M('steel2'), 0.4, 1.0, -1.28); // bass stack
  box(band, 1.5, 0.08, 0.5, M('orange2'), 0.2, 0.85, 0.7); for (let i = 0; i < 14; i++) box(band, 0.07, 0.03, 0.3, M('white'), -0.45 + i * 0.1, 0.9, 0.78); beam(band, [-0.5, 0.05, 0.6], [-0.2, 0.82, 0.7], 0.04, M('steel2')); beam(band, [0.9, 0.05, 0.6], [0.6, 0.82, 0.7], 0.04, M('steel2')); // keyboard on a stand
  for (const [gx, gc] of [[-1.5, 'cyan'], [-0.6, 'wall0']]) { box(band, 0.34, 0.5, 0.08, M(gc), gx, 0.5, 0.2, [0, 0, 0.08]); box(band, 0.07, 0.8, 0.05, M('wood1'), gx + 0.03, 1.15, 0.2, [0, 0, 0.08]); box(band, 0.12, 0.14, 0.05, M('wood4'), gx + 0.06, 1.62, 0.2); } // guitars

  // Walkthrough frame: the camera walks from the entry (+X end) toward the mask (-X end), u = 24 - x. Right-hand wall = back wall (-Z); left-hand wall is the cut-away side (+Z).
  const rightShots = [
    { x: 16, y: 2.2, w: 3.2, h: 2.0, mode: 'audience' }, { x: 11, y: 2.3, w: 5.2, h: 2.8, mode: 'big' },
    { x: 6, y: 2.2, w: 3.2, h: 2.0, mode: 'stage' }, { x: 3, y: 2.2, w: 2.6, h: 1.9, mode: 'police' }];
  const wz = buildWall(SLAB.w, 3, rightShots, 8); wz.position.set(0, 0, -HZ); world.add(wz);
  const wx = buildWall(SLAB.d, 5, [], 2); wx.rotation.y = Math.PI / 2; wx.position.set(-HX, 0, 0); world.add(wx);
  // red carpet strip under the big concert screen
  box(world, 5.6, 0.04, 1.0, M('red2'), 11, 0.03, -HZ + 0.7);
  parts.screens = [...rightShots].map((sc, i) => ({ ...sc, id: i }));
  // mask-hall right-hand wall: green-framed timber gate and the 'el buen pueblo' door; left-hand: flame-logo door and children's frieze
  { const gt = new THREE.Group(); box(gt, 3.0, 3.6, 0.2, M('green2'), -7.5, 1.8, -HZ + 0.25); box(gt, 2.4, 3.2, 0.24, M('wood3'), -7.5, 1.6, -HZ + 0.3); for (let k = 0; k < 5; k++) box(gt, 0.04, 3.2, 0.26, M('wood5'), -8.4 + k * 0.45, 1.6, -HZ + 0.31); world.add(gt);
    const dd = new THREE.Group(); box(dd, 2.2, 3.2, 0.2, M('wood4'), -15, 1.6, -HZ + 0.28); box(dd, 1.2, 0.75, 0.04, M('red'), -15.05, 1.9, -HZ + 0.4); sph(dd, 0.3, M('wall0'), -15.35, 2.0, -HZ + 0.43, [1, 0.8, 0.2]); cone(dd, 0.06, 0.3, M('red3'), -15.55, 2.35, -HZ + 0.43, null, 4); world.add(dd);
  }


  if (IMGS.ven) { const vt = new THREE.Texture(IMGS.ven); vt.colorSpace = THREE.SRGBColorSpace; vt.magFilter = THREE.NearestFilter; vt.minFilter = THREE.NearestFilter; vt.generateMipmaps = false; vt.needsUpdate = true;
    const vm = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.66), new THREE.MeshBasicMaterial({ map: vt, toneMapped: false })); vm.position.set(-19.0, 1.9, -HZ + 0.3); world.add(vm); } // "VEN A DORMIR" graffiti panel, cropped from the video
  // landmark: stone mask centred on the -Z wall
  const mask = stoneMask(parts); mask.scale.setScalar(1.3); mask.rotation.y = Math.PI / 2; mask.position.set(-HX + 0.85, 3.6, MARK.mask[1]); world.add(mask);
  box(world, 0.12, 4.6, 4.2, M('wood5'), -HX + 0.36, 3.2, MARK.mask[1]); // dark recess behind it
  parts.maskPos = new THREE.Vector3(-HX + 1.3, 3.3, MARK.mask[1]);

  // whitewashed cabin with window recesses and a door, beside the dividing wall; abstract red marks only
  const wp = new THREE.Group(); box(wp, 4.6, 3.1, 3.2, M('wall0'), 0, 1.55, 0); box(wp, 4.7, 0.16, 3.3, M('wall2'), 0, 3.15, 0); box(wp, 4.7, 0.22, 3.3, M('con2'), 0, 0.11, 0);
  for (const wx of [-1.5, 0.2, 1.5]) box(wp, 0.7, 1.4, 0.1, M('steel3'), wx, 1.7, 1.62);
  box(wp, 0.9, 2.1, 0.1, M('wood5'), 1.9, 1.05, 1.62);
  for (let i = 0; i < 2; i++) box(wp, 0.16, 0.9, 0.04, M('red'), -1.7 + i * 0.5, 0.9, 1.63, [0, 0, 0.3 * (i ? 1 : -1)]);
  
  const c1 = new THREE.Group(); box(c1, 4.4, 3.2, 0.3, M('wall0'), 0, 1.6, 0); box(c1, 4.5, 0.16, 0.4, M('wall2'), 0, 3.28, 0); box(c1, 4.5, 0.2, 0.4, M('con2'), 0, 0.1, 0); box(c1, 0.3, 3.2, 1.6, M('wall0'), 2.0, 1.6, -0.9); box(c1, 0.3, 3.2, 1.6, M('wall0'), -2.0, 1.6, -0.9); // freestanding white wall with side returns
  for (let i = 0; i < 3; i++) { box(c1, 0.2, 0.9, 0.04, M('red'), -1.3 + i * 1.3, 1.1, 0.18, [0, 0, 0.3 * (i - 1)]); box(c1, 0.7, 0.14, 0.04, M('red'), -1.3 + i * 1.3, 0.62, 0.18); }
  box(c1, 1.5, 1.2, 0.04, M('ink'), 0.5, 2.2, 0.17); box(c1, 1.6, 0.1, 0.06, M('wood5'), 0.5, 2.85, 0.18); box(c1, 1.6, 0.1, 0.06, M('wood5'), 0.5, 1.55, 0.18); sph(c1, 0.32, M('green'), -1.3, 2.3, 0.2, [1, 1.1, 0.2]); sph(c1, 0.14, M('skin0'), -1.3, 2.2, 0.26, [1, 1.1, 0.3]); // service hatch + masked-face disc, abstract
  c1.position.set(17.0, 0, 2.7); c1.rotation.y = Math.PI / 2 - 0.08; world.add(c1);
  const dr = new THREE.Group(); box(dr, 1.4, 2.3, 0.1, M('con1'), 0, 1.15, 0); box(dr, 1.2, 2.0, 0.06, M('con2'), 0, 1.15, 0.07); sph(dr, 0.15, M('white'), 0, 1.7, 0.12, [1, 1, 0.3]); for (const sx of [-1, 1]) sph(dr, 0.075, M('white'), sx * 0.15, 1.87, 0.12, [1, 1, 0.3]); dr.position.set(1.0, 0, -HZ + 0.3); world.add(dr); // grey door with the mouse-skull mark
  // dividing wall with a brick-framed doorway, 3 m high so tall things behind it still read
  const dv = new THREE.Group(); dv.position.set(DIV_X, 0, 0); world.add(dv);
  box(dv, 0.34, 3.0, DOOR.z0 + HZ, M('wall0'), 0, 1.5, (-HZ + DOOR.z0) / 2); box(dv, 0.34, 3.0, HZ - DOOR.z1, M('wall0'), 0, 1.5, (HZ + DOOR.z1) / 2);
  box(dv, 0.34, 0.45, DOOR.z1 - DOOR.z0, M('wall1'), 0, 2.78, (DOOR.z0 + DOOR.z1) / 2); box(dv, 0.5, 0.2, SLAB.d, M('wood5'), 0, 3.05, 0);
  for (const [zz, sg] of [[DOOR.z0, -1], [DOOR.z1, 1]]) { box(dv, 0.5, 3.0, 0.42, M('rust1'), 0, 1.5, zz + sg * 0.21); for (let k = 0; k < 8; k++) box(dv, 0.52, 0.05, 0.43, M('rust2'), 0, 0.3 + k * 0.36, zz + sg * 0.21); }
  box(dv, 0.5, 0.2, DOOR.z1 - DOOR.z0 + 0.9, M('wood4'), 0, 2.56, (DOOR.z0 + DOOR.z1) / 2);
  box(dv, 0.1, 0.9, 0.4, M('ink'), 0.25, 3.7, (DOOR.z0 + DOOR.z1) / 2 + 0.3); box(dv, 0.1, 0.3, 0.7, M('ink'), 0.25, 4.3, (DOOR.z0 + DOOR.z1) / 2 + 0.1); // black J emblem above the passage
  // eclipse doorway on the long wall: black opening with an ember ring that flares at the burst
  box(world, 2.5, 3.4, 0.12, M('ink'), -3.6, 1.7, -HZ + 0.3); box(world, 2.9, 0.3, 0.3, M('wood5'), -3.6, 3.55, -HZ + 0.32);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.07, 10, 36), new THREE.MeshStandardMaterial({ color: P.orange, emissive: P.orange, emissiveIntensity: 0.7 })); ring.position.set(-3.6, 2.2, -HZ + 0.42); world.add(ring); parts.eclipse = ring.material;
  const lt = canvasTex(256, 48, (c, w, h2) => { c.clearRect(0, 0, w, h2); c.fillStyle = P.red; c.font = 'bold 40px Impact, Arial Black, sans-serif'; c.textAlign = 'center'; c.fillText('JIRAFA ARDIENDO', w / 2, 38); });
  const lm = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 0.55), new THREE.MeshBasicMaterial({ map: lt, transparent: true, alphaTest: 0.4, toneMapped: false })); lm.position.set(-1.2, 0.9, -HZ + 0.23); lm.scale.setScalar(0.7); world.add(lm);
  // desk + monitor, facing +X
  const desk = deskSet(parts); desk.position.set(MARK.desk[0], 0, MARK.desk[1]); world.add(desk);
  const st = desk.userData.stool.clone().add(new THREE.Vector3(MARK.desk[0], 0, MARK.desk[1]));
  parts.stool = st;
  const dk = drumKit(); dk.position.set(-1.7, 0.05, -1.2); dk.rotation.y = -0.4; parts.band.add(dk);
  // speaker stack and crates near the right back
  const sp1 = new THREE.Group(); box(sp1, 1.0, 1.4, 0.8, M('steel3'), 0, 0.7, 0); cyl(sp1, 0.32, 0.32, 0.05, M('con4'), 0, 0.5, 0.42, [Math.PI / 2, 0, 0], 16); cyl(sp1, 0.22, 0.22, 0.05, M('con4'), 0, 1.05, 0.42, [Math.PI / 2, 0, 0], 16);
  box(sp1, 1.0, 0.9, 0.8, M('steel2'), 0, 1.85, 0); cyl(sp1, 0.28, 0.28, 0.05, M('con4'), 0, 1.85, 0.42, [Math.PI / 2, 0, 0], 16);
  sp1.position.set(-21.4, 0, -3.9); sp1.rotation.y = -0.3; world.add(sp1);
  parts.world = world;
  return parts;
}
