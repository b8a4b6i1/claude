import * as THREE from 'three';
import { PixelPost } from './core/post.js';
import { CAMERA, createCamera, updateCamera } from './core/camera.js';
import { createLighting } from './core/lighting.js';
import { HX, HZ, WALL_H, SLAB, LOOP, X0, X1 } from './config.js';
import { buildHangar } from './scene/hangar.js';
import { createStage } from './stage.js';
import { loadFootage } from './scene/footage.js';
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
loadFootage().then(() => {
const parts = buildHangar(scene), stage = createStage(scene, parts);

function resize() {
  const w = Math.max(2, frameEl.clientWidth), h = Math.max(2, frameEl.clientHeight);
  if (w < 3 || h < 3) return; post.setSize(w, h); updateCamera(camera, w / h, FIT);
  const portrait = w / h < 0.9; if (portrait !== view.portrait) { view.portrait = portrait; view.z = portrait ? 2.4 : 1; view.u = portrait ? 0.72 : 0.5; view.v = 0.5; }
  applyView(); if (typeof placeSnd === 'function') placeSnd();
}
// phone framing: portrait starts zoomed on the action; drag to pan, pinch / wheel to zoom, double-tap to toggle the whole hangar
const view = { z: 1, u: 0.5, v: 0.5, portrait: null };
function applyView() {
  const w = Math.max(2, frameEl.clientWidth), h = Math.max(2, frameEl.clientHeight), z = view.z;
  if (z <= 1.001) { camera.clearViewOffset(); return; }
  const fw = w * z, fh = h * z; view.u = clamp01(view.u, w / fw / 2); view.v = clamp01(view.v, h / fh / 2);
  camera.setViewOffset(fw, fh, view.u * fw - w / 2, view.v * fh - h / 2, w, h);
}
const clamp01 = (x, half) => Math.min(1 - half, Math.max(half, x));
function zoomTo(z) { view.z = Math.min(5, Math.max(1, z)); applyView(); placeSnd(); }
{ const el = canvas, pts = new Map(); let d0 = 0, z0 = 1, lastTap = 0;
  el.style.touchAction = 'none';
  el.addEventListener('pointerdown', (e) => { el.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); if (pts.size === 2) { const [a, b] = [...pts.values()]; d0 = Math.hypot(a[0] - b[0], a[1] - b[1]); z0 = view.z; }
    if (pts.size === 1) { const n = performance.now(); if (n - lastTap < 300) { zoomTo(view.z > 1.2 ? 1 : (view.portrait ? 2.4 : 2)); } lastTap = n; } });
  el.addEventListener('pointermove', (e) => { const p = pts.get(e.pointerId); if (!p) return; const dx = e.clientX - p[0], dy = e.clientY - p[1]; p[0] = e.clientX; p[1] = e.clientY;
    if (pts.size === 1 && view.z > 1.001) { const w = frameEl.clientWidth, h = frameEl.clientHeight; view.u -= dx / (w * view.z); view.v -= dy / (h * view.z); applyView(); placeSnd(); }
    else if (pts.size === 2 && d0 > 0) { const [a, b] = [...pts.values()]; zoomTo(z0 * Math.hypot(a[0] - b[0], a[1] - b[1]) / d0); } });
  const up = (e) => { pts.delete(e.pointerId); d0 = 0; }; el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  el.addEventListener('wheel', (e) => { e.preventDefault(); zoomTo(view.z * Math.exp(-e.deltaY * 0.0015)); }, { passive: false }); }
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
const placeSnd = () => { if (view.z > 1.2) { sndWrap.style.left = (innerWidth - (sndWrap.offsetWidth || 46) - 14) + 'px'; sndWrap.style.top = (innerHeight - (sndWrap.offsetHeight || 46) - 18) + 'px'; return; } const v = new THREE.Vector3(X1, -SLAB.h, HZ).project(camera), r = canvas.getBoundingClientRect(), sx = r.left + (v.x * 0.5 + 0.5) * r.width, sy = r.top + (-v.y * 0.5 + 0.5) * r.height, w = sndWrap.offsetWidth || 46, h = sndWrap.offsetHeight || 46;
  sndWrap.style.left = Math.max(8, Math.min(innerWidth - w - 10, sx + 10)) + 'px'; sndWrap.style.top = Math.max(8, Math.min(innerHeight - h - 10, sy + 12)) + 'px'; };
const draw = (t) => { stage.update(t); post.uniforms.uTime.value = t; post.uniforms.uLoop.value = LOOP; post.render(scene, camera); };
let t0 = performance.now(), ready = false;
let qN = 0, qSum = 0, qLast = 0, qScale = 1.5;
function adapt(now) { if (qLast) { qSum += now - qLast; qN++; } qLast = now; if (qN >= 90) { const ms = qSum / qN; qN = 0; qSum = 0; if (ms > 30 && qScale > 0.75) { qScale = qScale > 1.2 ? 1.0 : 0.75; post.renderScale = qScale; resize(); } } }
document.addEventListener('visibilitychange', () => { qLast = 0; qN = 0; qSum = 0; });
function loop(now) { adapt(now); const t = frozen !== null ? frozen : (startAt + (now - t0) / 1000) % LOOP; draw(t); if (frozen === null) audio.update(t); if (!ready) { ready = true; window.__dioramaReady = true; } requestAnimationFrame(loop); }
window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 200));
resize(); placeSnd();
window.__audio = audio;
window.__diorama = { THREE, scene, camera, renderer, post, stage, parts, CLIP, freeze(t) { frozen = t; resize(); draw(t); }, view(pos, tgt) { camera.position.set(...pos); camera.lookAt(...tgt); } };
requestAnimationFrame(loop);

});
