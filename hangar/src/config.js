export const LOOP = 70;
export const SLAB = { w: 48, d: 10, h: 0.42 };
export const DIV_X = -5.3; // dividing wall, 61% of the length from the +X end (read from the roof seam in the scan)
export const DOOR = { z0: -0.4, z1: 2.8 }; // opening in the dividing wall
export const HX = SLAB.w / 2, HZ = SLAB.d / 2;
export const WALL_H = 6.2;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const smooth = (k) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
export const win = (t, t0, dur) => clamp((t - t0) / dur, 0, 1);
export const pulse = (t, t0, tau) => (t < t0 ? 0 : Math.exp(-(t - t0) / tau));
export const bell = (t, a, b, c, d) => smooth((t - a) / (b - a)) * (1 - smooth((t - c) / (d - c)));
export const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
export const TAU = Math.PI * 2;
// Beat times (s). One source of truth for stage, fx and screens.
export const BEAT = { burst: 42.0, burstEnd: 50.0, fishIn: 18.0, fishOut: 62.0 };
// Landmarks in world space (x, z).
export const MARK = { spiral: [-14.5, 0.6], mask: [-9.0, -HZ + 0.5], desk: [-10.5, 3.2] };
