import * as THREE from 'three';
import { PixelPost } from './core/post.js';
import { CAMERA, createCamera, updateCamera } from './core/camera.js';
import { createLighting } from './core/lighting.js';
import { HX, HZ, WALL_H, SLAB, LOOP, X0, X1 } from './config.js';
import { buildHangar } from './scene/hangar.js';
import { createStage } from './stage.js';
import { loadFootage } from './scene/footage.js';
import { loadChars } from './scene/chars.js';
import { createAudio } from './audio.js';

const canvas = document.getElementById('stage'), frameEl = document.getElementById('frame');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.outputColorSpace = THREE.LinearSRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
const scene = new THREE.Scene(); scene.userData.aquatic = false;
const post = new PixelPost(renderer, 2600, 1.5);
const FIT = [X0, X1].flatMap((x) => [-1, 1].flatMap((sz) => [new THREE.Vector3(x, 0, sz * HZ), new THREE.Vector3(x, -SLAB.h, sz * HZ)]))
  .concat([new THREE.Vector3(X0, WALL_H + 1.4, -HZ), new THREE.Vector3(X1, WALL_H, -HZ), new THREE.Vector3(X1, WALL_H, HZ)]);
const camera = createCamera(1.5, FIT);
const lights = createLighting(renderer, scene);
const CLIP = [new THREE.Plane(new THREE.Vector3(1, 0, 0), -(X0 - 0.35)), new THREE.Plane(new THREE.Vector3(-1, 0, 0), X1 + 0.35), new THREE.Plane(new THREE.Vector3(0, 0, 1), HZ + 0.35), new THREE.Plane(new THREE.Vector3(0, 0, -1), HZ + 0.35)];
post.clipPlanes = CLIP;
Promise.all([loadFootage(), loadChars()]).then(() => {
const parts = buildHangar(scene), stage = createStage(scene, parts);

function resize() {
  const w = Math.max(2, frameEl.clientWidth), h = Math.max(2, frameEl.clientHeight);
  if (w < 3 || h < 3) return; post.setSize(w, h); updateCamera(camera, w / h, FIT); if (typeof placeSnd === 'function') placeSnd();
}
const params = new URLSearchParams(location.search);
let frozen = params.has('t') ? parseFloat(params.get('t')) : null; const startAt = params.has('from') ? parseFloat(params.get('from')) : 0;
if (params.get('dither') === '0') post.uniforms.uDither.value = 0;
const audio = createAudio(); audio.setEnabled(false);                          // starts MUTED: browsers do not let a page play sound before a click, so the player turns it on
const sndBtn = document.getElementById('snd'), sndWrap = document.getElementById('sndwrap'), on = document.getElementById('snd-on'), off = document.getElementById('snd-off');
const showSnd = () => { const live = audio.enabled && audio.running; on.setAttribute('display', live ? 'inline' : 'none'); off.setAttribute('display', live ? 'none' : 'inline'); sndBtn.classList.toggle('muted', !live); sndBtn.setAttribute('aria-label', live ? 'Silenciar' : 'Activar sonido'); };
showSnd();
sndBtn.addEventListener('click', (e) => { e.stopPropagation(); if (audio.enabled && audio.running) audio.setEnabled(false); else { audio.unlock(); audio.setEnabled(true); } setTimeout(showSnd, 60); showSnd(); });
setInterval(showSnd, 300);
// the button sits next to the diorama: just below-right of the slab's nearest corner, tracked through the camera
const placeSnd = () => { const v = new THREE.Vector3(X1, -SLAB.h, HZ).project(camera), r = canvas.getBoundingClientRect(), sx = r.left + (v.x * 0.5 + 0.5) * r.width, sy = r.top + (-v.y * 0.5 + 0.5) * r.height, w = sndWrap.offsetWidth || 46, h = sndWrap.offsetHeight || 46;
  sndWrap.style.left = Math.max(8, Math.min(innerWidth - w - 10, sx + 10)) + 'px'; sndWrap.style.top = Math.max(8, Math.min(innerHeight - h - 10, sy + 12)) + 'px'; };
const draw = (t) => { stage.update(t); post.uniforms.uTime.value = t; post.uniforms.uLoop.value = LOOP; post.render(scene, camera); };
let t0 = performance.now(), ready = false;
function loop(now) { const t = frozen !== null ? frozen : (startAt + (now - t0) / 1000) % LOOP; draw(t); if (frozen === null) audio.update(t); if (!ready) { ready = true; window.__dioramaReady = true; } requestAnimationFrame(loop); }
window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 200));
resize(); placeSnd();
window.__audio = audio;
window.__diorama = { THREE, scene, camera, renderer, post, stage, parts, CLIP, freeze(t) { frozen = t; resize(); draw(t); }, view(pos, tgt) { camera.position.set(...pos); camera.lookAt(...tgt); } };
requestAnimationFrame(loop);

});
