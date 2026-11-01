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
export function spellHit(t) { if (t < 14.4 || t > 74.6 || (t > 53.4 && t < 61.4)) return null; const s = t - 0.9; return { idx: Math.floor(s / 4.5) % 3, age: s % 4.5 }; }

/** 1 while the devil sleeps (start and end of the loop), 0 while he is awake (10.8 s to 76 s). */
export function sleepK(t) { if (t < 50) return 1 - smooth((t - 10.2) / 0.8); return smooth((t - 76) / 5); }

/** The devil burns up at 52.4-54.6 s, lies as ash until 58.4 s and re-forms from the ash by 60.8 s. Returns body scale 0..1 (1 = whole). */
export function devilBody(t) { if (t < 54.0 || t >= 60.8) return 1; if (t < 55.4) return 1 - smooth((t - 54.0) / 1.4); if (t < 58.4) return 0; return smooth((t - 58.4) / 2.4); }
export const ashPile = (t) => smooth((t - 54.4) / 1.2) * (1 - smooth((t - 58.4) / 2.4));

/** The goldfish eliminates the five rehearsing musicians one by one (tk = moment it strikes) and they pop back at the end of the loop. */
export const BAND = [
  { id: 'singer', x: -18.4, z: 0.0, tk: 65.0 }, { id: 'guitarist', x: -19.5, z: 1.3, tk: 68.5 }, { id: 'bass', x: -21.4, z: 2.3, tk: 72.0 },
  { id: 'keys', x: -20.3, z: -2.2, tk: 75.5 }, { id: 'drummer', x: -22.5, z: 0.0, tk: 79.0 },
];
export const bandReturn = (i) => 84.0 + 0.6 * i;
export function bandPresence(i, t) { const tk = BAND[i].tk, rs = bandReturn(i); if (t < tk) return 1; if (t < tk + 0.5) return 1 - smooth((t - tk) / 0.5); if (t < rs) return 0; if (t < rs + 0.6) return smooth((t - rs) / 0.6); return 1; }
/** how scorched the devil is: grows while he burns (52.4-54.4 s), stays through the ash, fades as he re-forms. */
export function devilChar(t) { if (t < 52.4) return 0; if (t < 59.4) return smooth((t - 52.4) / 1.2); if (t < 61.0) return 1 - smooth((t - 59.4) / 1.6); return 0; }
