import * as THREE from 'three';
import { PixelPost } from './core/post.js';
import { CAMERA, createCamera, updateCamera } from './core/camera.js';
import { createLighting } from './core/lighting.js';
import { HX, HZ, WALL_H, SLAB, LOOP } from './config.js';
import { buildHangar } from './scene/hangar.js';
import { createStage } from './stage.js';

const canvas = document.getElementById('stage'), frameEl = document.getElementById('frame');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.outputColorSpace = THREE.LinearSRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
const scene = new THREE.Scene(); scene.userData.aquatic = false;
const post = new PixelPost(renderer, 2000, 1.25);
const FIT = [-1, 1].flatMap((sx) => [-1, 1].flatMap((sz) => [new THREE.Vector3(sx * HX, 0, sz * HZ), new THREE.Vector3(sx * HX, -SLAB.h, sz * HZ)]))
  .concat([new THREE.Vector3(-HX, WALL_H + 1.4, -HZ), new THREE.Vector3(HX, WALL_H, -HZ), new THREE.Vector3(-HX, WALL_H, HZ)]);
const camera = createCamera(1.5, FIT);
const lights = createLighting(renderer, scene);
const CLIP = [new THREE.Plane(new THREE.Vector3(1, 0, 0), HX + 0.35), new THREE.Plane(new THREE.Vector3(-1, 0, 0), HX + 0.35), new THREE.Plane(new THREE.Vector3(0, 0, 1), HZ + 0.35), new THREE.Plane(new THREE.Vector3(0, 0, -1), HZ + 0.35)];
post.clipPlanes = CLIP;
const parts = buildHangar(scene), stage = createStage(scene, parts);

function resize() {
  const w = Math.max(2, frameEl.clientWidth), h = Math.max(2, frameEl.clientHeight);
  if (w < 3 || h < 3) return; post.setSize(w, h); updateCamera(camera, w / h, FIT);
}
const params = new URLSearchParams(location.search);
let frozen = params.has('t') ? parseFloat(params.get('t')) : null; const startAt = params.has('from') ? parseFloat(params.get('from')) : 0;
if (params.get('dither') === '0') post.uniforms.uDither.value = 0;
const draw = (t) => { stage.update(t); post.render(scene, camera); };
let t0 = performance.now(), ready = false;
function loop(now) { const t = frozen !== null ? frozen : (startAt + (now - t0) / 1000) % LOOP; draw(t); if (!ready) { ready = true; window.__dioramaReady = true; } requestAnimationFrame(loop); }
window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 200));
resize();
window.__diorama = { THREE, scene, camera, renderer, post, stage, parts, CLIP, freeze(t) { frozen = t; resize(); draw(t); }, view(pos, tgt) { camera.position.set(...pos); camera.lookAt(...tgt); } };
requestAnimationFrame(loop);
