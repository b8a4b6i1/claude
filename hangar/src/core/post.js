import * as THREE from 'three';
import { PALETTE_RGB } from '../palette.js';

const VERT = /* glsl */ `
out vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const FRAG = /* glsl */ `
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D tScene;
uniform vec2 uResolution;
uniform vec3 uPalette[64];
uniform float uDither;
uniform float uTime;
uniform float uLoop;

float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// value noise that wraps in x with integer period px, so a cloud layer can drift one whole period per loop
float vnoise(vec2 p, float px) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = h21(vec2(mod(i.x, px), i.y)), b = h21(vec2(mod(i.x + 1.0, px), i.y));
  float c = h21(vec2(mod(i.x, px), i.y + 1.0)), d = h21(vec2(mod(i.x + 1.0, px), i.y + 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p, float px) { float v = 0.0, a = 0.5; for (int o = 0; o < 4; o++) { v += a * vnoise(p, px); p *= 2.0; px *= 2.0; a *= 0.5; } return v; }
vec3 skyAt(vec2 uv) {
  float ph = uTime / uLoop;
  vec3 top = vec3(0.608, 0.878, 0.949), low = vec3(0.831, 0.929, 0.973);       // sky entries of the palette
  vec3 c = top;
  vec2 q = vec2(uv.x * 4.0 * 1.6, uv.y * 3.0);
  float d1 = fbm(q + vec2(ph * 8.0 * 1.0, 0.0), 8.0), d1b = fbm(q + vec2(ph * 8.0, 0.05), 8.0);
  vec2 r = vec2(uv.x * 6.0, uv.y * 4.0 + 7.0);
  float d2 = fbm(r + vec2(ph * 12.0 * 2.0 + 3.0, 0.0), 12.0);
  float k1 = smoothstep(0.57, 0.60, d1), k2 = smoothstep(0.60, 0.63, d2);
  vec3 shade = vec3(0.706, 0.863, 0.933), body = vec3(0.933, 0.973, 0.988), hi = vec3(1.0);
  vec3 cl = d1b < d1 - 0.03 ? hi : (d1b > d1 + 0.04 ? shade : body);
  c = mix(c, low, k2); c = mix(c, cl, k1);
  return c;
}

float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x * 0.5 + a.y * a.y * 0.75);
}
float bayer4(vec2 a) {
  return bayer2(0.5 * a) * 0.25 + bayer2(a);
}
float bayer8(vec2 a) {
  return bayer4(0.5 * a) * 0.25 + bayer4(a);
}
float luma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}
vec3 fetch(vec2 uv) {
  return texture(tScene, uv).rgb;
}
float fetchA(vec2 uv) {
  return texture(tScene, uv).a;
}

void main() {
  vec2 px = 1.0 / uResolution;
  vec4 centre = texture(tScene, vUv);

  // Gather a small disc of coverage for the cut-out rim. The alpha buffer is
  // opaque everywhere inside the diorama, so this only bites at the silhouette.
  float weights = 0.0;
  float cov = 0.0;
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 12; i++) {
    float ang = float(i) * 2.399963 + 0.4;
    float rad = 1.0 + float(i % 3) * 1.15;
    vec2 off = vec2(cos(ang), sin(ang)) * rad * px;
    vec2 uv = vUv + off;
    float a = fetchA(uv);
    float w = 1.0 - rad / 5.4;
    cov += a * w;
    acc += fetch(uv) * a * w;
    weights += w;
  }
  cov /= weights;
  vec3 gathered = acc / max(cov * weights, 0.00001);

  float centreCov = centre.a;
  cov = max(cov, centreCov);
  vec3 c = mix(gathered, centre.rgb, smoothstep(0.62, 0.92, centreCov));

  // Composite the model onto paper white before grading.
  vec3 sky = skyAt(vUv);
  c = mix(pow(sky, vec3(2.2)), c, smoothstep(0.26, 0.72, cov));

  // Linear render target -> display sRGB.
  c = pow(max(c, vec3(0.0)), vec3(1.0 / 2.2));

  // Gentle grade, then the crisp ink contour.
  float l = luma(c);
  c = mix(vec3(l), c, 1.07);
  c = clamp((c - 0.5) * 1.028 + 0.5, 0.0, 1.0);

  float l0 = luma(texture(tScene, vUv).rgb);
  float l1 = luma(texture(tScene, vUv + vec2(px.x, 0.0)).rgb);
  float l2 = luma(texture(tScene, vUv - vec2(px.x, 0.0)).rgb);
  float l3 = luma(texture(tScene, vUv + vec2(0.0, px.y)).rgb);
  float l4 = luma(texture(tScene, vUv - vec2(0.0, px.y)).rgb);
  float edge = max(max(abs(l0 - l1), abs(l0 - l2)), max(abs(l0 - l3), abs(l0 - l4)));
  // Neighbour luminance is linear; bring it into the same scale.
  edge = pow(edge, 0.4545);
  float ink = smoothstep(0.13, 0.34, edge) * smoothstep(0.20, 0.55, cov) * (1.0 - smoothstep(0.86, 0.985, cov));
  c = mix(c, vec3(0.085, 0.082, 0.076), ink * 0.62);

  // 8x8 ordered dither, then nearest palette snap.
  float d = bayer8(gl_FragCoord.xy) - 0.5;
  float sparkle = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  // Dither hardest where tones are actually transitioning; flat areas stay calm.
  float gate = smoothstep(0.004, 0.055, edge);
  c += (d * (0.0012 + 0.019 * gate) + sparkle * 0.0012) * uDither;

  vec3 bgSnap = sky; { float bd0 = 1e9; for (int j = 0; j < 64; j++) { vec3 pj = uPalette[j]; vec3 dj = (sky - pj) * vec3(1.0, 1.12, 0.93); float dd = dot(dj, dj); if (dd < bd0) { bd0 = dd; bgSnap = pj; } } }
  vec3 best = uPalette[0];
  float bestD = 1e9;
  for (int i = 0; i < 64; i++) {
    vec3 p = uPalette[i];
    vec3 diff = (c - p) * vec3(1.0, 1.12, 0.93);
    float dd = dot(diff, diff);
    if (dd < bestD) {
      bestD = dd;
      best = p;
    }
  }
  c = best;

  // Fragment the outer silhouette with the same ordered matrix.
  float rim = 1.0 - smoothstep(0.78, 0.995, cov);
  float threshold = bayer4(gl_FragCoord.xy * 1.0) * 0.92 + 0.018;
  if (rim > 0.002 && cov < threshold) {
    c = bgSnap;
  }
  if (cov < 0.02) c = bgSnap;

  fragColor = vec4(c, 1.0);
}
`;

export class PixelPost {
  constructor(renderer, maxDim = 1600, renderScale = 1) {
    this.renderer = renderer;
    this.maxDim = maxDim;
    this.renderScale = renderScale;

    this.rt = new THREE.WebGLRenderTarget(2, 2, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: true,
      stencilBuffer: false,
      samples: 0,
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      colorSpace: THREE.LinearSRGBColorSpace,
    });
    this.rt.texture.generateMipmaps = false;

    this.uniforms = {
      tScene: { value: this.rt.texture },
      uResolution: { value: new THREE.Vector2(2, 2) },
      uPalette: { value: PALETTE_RGB.map((c) => new THREE.Vector3(c[0], c[1], c[2])) },
      uDither: { value: 1.0 },
      uTime: { value: 0.0 },
      uLoop: { value: 90.0 },
    };

    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: this.uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    quad.frustumCulled = false;
    this.scene.add(quad);

    this.size = new THREE.Vector2(2, 2);
  }

  setSize(w, h) {
    // Default one target pixel per CSS pixel. `renderScale` 1.2–1.5 supersamples
    // a subject that is small on the page so the palette and dither keep detail
    // after the CSS downscale; `maxDim` is a hard ceiling for 4K displays.
    const scale = Math.min(this.renderScale, this.maxDim / Math.max(w, h));
    const iw = Math.max(2, Math.round(w * scale));
    const ih = Math.max(2, Math.round(h * scale));
    if (iw === this.size.x && ih === this.size.y) return;
    this.size.set(iw, ih);
    this.rt.setSize(iw, ih);
    this.uniforms.uResolution.value.set(iw, ih);
    this.renderer.setSize(iw, ih, false);
  }

  render(scene, camera) {
    const r = this.renderer;
    r.clippingPlanes = this.clipPlanes || [];
    r.setRenderTarget(this.rt);
    r.setClearColor(0x000000, 0);
    r.clear(true, true, true);
    r.render(scene, camera);
    r.clippingPlanes = [];
    r.setRenderTarget(null);
    r.setClearColor(0x000000, 1);
    r.clear(true, true, true);
    r.render(this.scene, this.camera);
  }
}
