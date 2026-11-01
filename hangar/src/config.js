export const LOOP = 90;
export const X0 = -24, X1 = 14, CX = (X0 + X1) / 2; // slab spans x from X0 (mask end) to X1 (entry end); the entry is open
export const SLAB = { w: X1 - X0, d: 10, h: 0.42 };
export const DIV_X = -5.0; // dividing wall at u = 29 m of the walkthrough (u = 24 - x)
export const DOOR = { z0: 0.6, z1: 3.8 }; // passage on the left-hand (open) side of the dividing wall
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
export const BEAT = { burst: 42.0, burstEnd: 50.0, fishIn: 20.0, fishOut: 80.0 };
// Landmarks in world space (x, z).
export const MARK = { spiral: [-11.0, 1.5], mask: [X0 + 0.5, 0], desk: [-12.5, -3.9] };

/** The devil casts every 4.5 s; the bolt lands 0.9 s later on a rotating target (0 cat, 1 deer man, 2 booth). Returns null before the first cast. */
export function spellHit(t) { if (t < 14.4 || t > 74.6) return null; const s = t - 0.9; return { idx: Math.floor(s / 4.5) % 3, age: s % 4.5 }; }

/** 1 while the devil sleeps (start and end of the loop), 0 while he is awake (10.8 s to 76 s). */
export function sleepK(t) { if (t < 50) return 1 - smooth((t - 10.2) / 0.8); return smooth((t - 76) / 5); }
