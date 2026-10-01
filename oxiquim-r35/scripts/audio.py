"""Banda sonora sintetizada (120 BPM, Re mayor), sincronizada con la línea de tiempo de la animación.
Lee out/cues{TAG}.json (lo escribe scripts/render.mjs) y genera out/audio{TAG}.wav (44,1 kHz, estéreo).
Uso: python3 scripts/audio.py [-m]"""
import json, os, wave
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

ROOT_DIR = os.path.join(os.path.dirname(__file__), '..')
import sys
TAG = sys.argv[1] if len(sys.argv) > 1 else ''   # '' = 16:9 · '-m' = móvil 9:16
CU = json.load(open(os.path.join(ROOT_DIR, 'out', f'cues{TAG}.json')))
SR = 44100
DUR = CU['end']
N = int(SR * DUR)
BEAT = 0.5
rng = np.random.default_rng(35)
L = np.zeros(N); R = np.zeros(N); RL = np.zeros(N); RR = np.zeros(N)

def midi(m): return 440.0 * 2 ** ((m - 69) / 12)
def tt(n): return np.arange(n) / SR
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)

def add(sig, t0, gain=1.0, pan=0.0, rev=0.0, bus=None):
    i = int(t0 * SR)
    if i >= N: return
    if i < 0: sig = sig[-i:]; i = 0
    sig = sig[: N - i]
    gl, gr = gain * np.sqrt(0.5 * (1 - pan)), gain * np.sqrt(0.5 * (1 + pan))
    L[i:i + len(sig)] += sig * gl; R[i:i + len(sig)] += sig * gr
    if rev: RL[i:i + len(sig)] += sig * gl * rev; RR[i:i + len(sig)] += sig * gr * rev

# ── secciones
O = CU['olas']; TR = CU['TR']
def in_any(t, spans): return any(a <= t < b for a, b in spans)
GROOVE = [(CU['C'][0], CU['C'][1] - 0.5)] + [(o['items'], o['end']) for o in O] + [(CU['OBJ'][0] + 4.4, CU['OBJ'][1] - 0.4)]
HALF = [(15.0, CU['B'][1])] + [(a, b) for a, b in TR] + [(CU['P5'][0], CU['P7'][1] - 0.5)]
BREAK = [(o['intro'], o['items']) for o in O]

# progresiones: A (Bm7 | Gmaj7 | Dmaj7 | Asus) y B (Gmaj7 | A | F#m7 | Bm7) para las olas 2–3
CHA = [[47, 50, 54, 57], [43, 47, 50, 54], [50, 54, 57, 61], [45, 50, 52, 57]]; RTA = [35, 31, 38, 33]
CHB = [[43, 47, 50, 54], [45, 49, 52, 57], [42, 45, 49, 52], [47, 50, 54, 57]]; RTB = [31, 33, 30, 35]
def chord(t):
    b = int(t // 2.0) % 4
    useB = O[1]['intro'] <= t < CU['OBJ'][0]
    return (CHB[b], RTB[b]) if useB else (CHA[b], RTA[b])

def level(t):
    pts = [(0, 0.2), (2, 0.6), (5.6, 0.45), (15, 0.55), (24, 0.75), (CU['OBJ'][0], 0.8), (CU['OBJ'][0] + 4.4, 1.0), (CU['P5'][0], 0.7), (CU['Z'][0], 0.8), (DUR, 0.3)]
    return np.interp(t, [p[0] for p in pts], [p[1] for p in pts])

def saw(f, n, harm=8, det=0.0):
    t = tt(n); ph = rng.uniform(0, 2 * np.pi); out = np.zeros(n)
    for k in range(1, harm + 1):
        if f * k > 9000: break
        out += np.sin(2 * np.pi * f * k * (1 + det) * t + ph * k) / k
    return out

# ── pad
for bar in range(int(DUR // 2) + 1):
    t0 = bar * 2.0; seg = int(2.6 * SR); notes, _ = chord(t0 + 0.01)
    s = np.zeros(seg)
    for m in notes:
        for d in (-0.004, 0.0, 0.0045): s += saw(midi(m + 12), seg, det=d)
    env = np.minimum(1, tt(seg) / 0.35) * np.minimum(1, (2.6 - tt(seg)) / 0.6)
    lv = level(t0 + 1)
    s = lp(s, 800 + 1900 * lv) * env * 0.03 * lv
    add(s, t0 - 0.1, 1.0, pan=-0.25, rev=0.6); add(np.roll(s, 331), t0 - 0.1, 1.0, pan=0.25, rev=0.6)

def bell(f, dur=2.5):
    n = int(dur * SR); t = tt(n)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.01 * t) + 0.15 * np.sin(2 * np.pi * f * 3.98 * t)) * np.exp(-t * 2.2)

Z0 = CU['Z'][0]
for i, (t0, m) in enumerate([(0.1, 81), (0.6, 86), (1.1, 88), (1.6, 90), (Z0 + 0.3, 81), (Z0 + 0.65, 86), (Z0 + 1.0, 90), (Z0 + 1.35, 93)]):
    add(bell(midi(m)), t0, 0.06, pan=(-0.5 if i % 2 else 0.5), rev=0.9)

# ── batería
def kick(g=1.0):
    n = int(0.45 * SR); t = tt(n); f = 45 + 95 * np.exp(-t * 28)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    return (s + hp(rng.standard_normal(n), 3000) * np.exp(-t * 400) * 0.25) * g
def hat(g, dur=0.05):
    n = int(dur * SR); t = tt(n); return hp(rng.standard_normal(n), 7000, 4) * np.exp(-t * 90) * g
def clap(g):
    n = int(0.25 * SR); t = tt(n); nz = bp(rng.standard_normal(n), 900, 3500)
    return nz * (np.exp(-t * 22) + 0.6 * np.exp(-np.maximum(0, t - 0.012) * 30) * (t > 0.012)) * g

kicks = []
for b in range(int(DUR / BEAT)):
    t = b * BEAT
    if in_any(t, BREAK): continue
    if in_any(t, GROOVE): kicks.append((t, 0.8))
    elif in_any(t, HALF) and b % 2 == 0: kicks.append((t, 0.55))
for t, g in kicks: add(kick(g), t, 0.85)
duck = np.ones(N)
for t, g in kicks:
    i = int(t * SR); n = min(int(0.4 * SR), N - i)
    duck[i:i + n] = np.minimum(duck[i:i + n], 1 - 0.5 * g * np.exp(-tt(n) * 9))

for s16 in range(int(DUR / (BEAT / 4))):
    t = s16 * BEAT / 4
    if in_any(t, GROOVE): add(hat(0.045 if s16 % 4 == 2 else 0.02), t, 1.0, pan=0.3 if s16 % 2 else -0.2)
for b in range(int(DUR / BEAT)):
    t = b * BEAT
    if in_any(t, GROOVE) and t >= O[0]['items'] and b % 2 == 1: add(clap(0.14), t, 1.0, rev=0.5)

# ── bajo
BASS = np.zeros(N)
for b8 in range(int(DUR / (BEAT / 2))):
    t = b8 * BEAT / 2
    if not in_any(t, GROOVE) or in_any(t, BREAK): continue
    n = int(0.24 * SR); tn = tt(n); f = midi(chord(t)[1] + 12)
    s = (np.sin(2 * np.pi * f * tn) + 0.35 * np.sin(2 * np.pi * 2 * f * tn)) * np.minimum(1, tn / 0.005) * np.exp(-tn * 9)
    i = int(t * SR); BASS[i:i + n] += s[: N - i] * (0.2 if b8 % 2 else 0.26)
BASS = lp(BASS, 700) * duck; L += BASS; R += BASS

# ── arpegio pluck
ARP = np.zeros(N); ARPR = np.zeros(N); pattern = [0, 2, 1, 3, 2, 1, 3, 2]
for s16 in range(int(DUR / (BEAT / 4))):
    t = s16 * BEAT / 4
    full = in_any(t, GROOVE) or in_any(t, BREAK)
    half = (10.4 <= t < CU['B'][1]) or in_any(t, HALF)
    if not (full or (half and s16 % 2 == 0)): continue
    m = chord(t)[0][pattern[s16 % 8]] + 24
    n = int(0.3 * SR); tn = tt(n); f = midi(m)
    tone = np.sin(2 * np.pi * f * tn) + 0.3 * np.sin(2 * np.pi * 2 * f * tn) + 0.12 * np.sin(2 * np.pi * 3 * f * tn)
    s = tone * np.exp(-tn * 16) * (0.55 + 0.45 * ((s16 % 4) == 0)) * 0.045
    i = int(t * SR); tgt = ARP if s16 % 2 == 0 else ARPR; tgt[i:i + n] += s[: N - i]
ARP *= duck; ARPR *= duck
L += ARP * 0.9 + ARPR * 0.4; R += ARP * 0.4 + ARPR * 0.9
RL += (ARP + ARPR) * 0.35; RR += (ARP + ARPR) * 0.35

# ── efectos
def whoosh(dur, g=1.0, rise=True):
    n = int(dur * SR); u = tt(n) / dur; nz = rng.standard_normal(n); out = np.zeros(n)
    for k in range(24):
        a, b = k * n // 24, (k + 1) * n // 24; uu = (k + 0.5) / 24
        fc = 300 + (5000 if rise else 3000) * (uu ** 2 if rise else (1 - uu) ** 2)
        out[a:b] = bp(nz, max(80, fc * 0.5), min(18000, fc * 1.5))[a:b]
    env = (np.sin(np.pi * u) ** 2) if not rise else (u ** 2.2) * (1 - np.exp(-(1 - u) * 40))
    return out * env * g
def impact(g=1.0, dur=2.8):
    n = int(dur * SR); t = tt(n); f = 32 + 60 * np.exp(-t * 8)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2) + lp(rng.standard_normal(n), 2500) * np.exp(-t * 9) * 0.35) * g
def riser(dur, g=1.0):
    n = int(dur * SR); t = tt(n); u = t / dur; f = 180 * (2 ** (2.5 * u))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    return (tone * 0.35 + hp(rng.standard_normal(n), 2000) * u ** 2 * 0.4) * (u ** 1.8) * g
def tick(f=2200, g=1.0):
    n = int(0.06 * SR); t = tt(n); return np.sin(2 * np.pi * f * t) * np.exp(-t * 80) * g
def swoosh_in(t0, g=0.22): add(whoosh(0.8, g, True), t0 - 0.78, rev=0.4)

# apertura
add(whoosh(1.3, 0.16, True), 0.1, rev=0.6); add(impact(0.6), 1.35, rev=0.5)
for i in range(6): add(tick(1700 + i * 160, 0.07), 1.5 + i * 0.07, pan=-0.5 + i * 0.2, rev=0.4)
add(whoosh(1.1, 0.1, False), 2.5, pan=0.4, rev=0.3)
swoosh_in(5.7); add(impact(0.45, 2.0), 5.95, rev=0.5)
add(whoosh(0.9, 0.12, False), 9.9, rev=0.3)
for t0 in CU['p1phrases']: add(tick(2400, 0.07), t0, pan=0.2, rev=0.5)
add(riser(2.2, 0.1), 15.2, rev=0.4)
# hoja de ruta
swoosh_in(CU['C'][0] + 0.2); add(impact(0.6), CU['C'][0] + 0.3, rev=0.5)
for i in range(3): add(tick(2000 + i * 300, 0.1), CU['B'][1] + 0.8 + i * 0.33, pan=-0.6 + i * 0.6, rev=0.5)
add(riser(1.0, 0.18), CU['C'][1] - 1.0, rev=0.4)
# olas
for k, o in enumerate(O):
    add(impact(0.7), o['intro'] + 0.2, rev=0.6)
    add(whoosh(1.0, 0.12, False), o['intro'] + 3.9, rev=0.4)
    for j, s in enumerate(o['starts']):
        add(whoosh(0.6, 0.12 if j else 0.18, True), s - 0.45, pan=0.3, rev=0.3)
        add(tick(2600 - j * 120, 0.12), s + 0.05, rev=0.5)
for a, b in TR:
    add(whoosh(1.0, 0.16, False), a, rev=0.4)
    add(riser(1.4, 0.14), a + 0.9, rev=0.4)
    add(whoosh(0.9, 0.22, True), b - 0.9, rev=0.4)
# objetivo
O0 = CU['OBJ'][0]
add(whoosh(0.8, 0.18, False), O0, rev=0.4)
add(riser(2.2, 0.3), O0 + 2.2, rev=0.5); add(impact(1.0, 3.2), O0 + 4.4, rev=0.6)
for j in range(7): add(bell(midi(88 + [0, 2, 4, 7, 9, 12, 14][j]), 1.2), O0 + 4.5 + j * 0.15, 0.03, pan=-0.6 + j * 0.2, rev=0.8)
# frases finales
for key in ('P5', 'P6', 'P7'):
    swoosh_in(CU[key][0] + 0.3); add(impact(0.5, 2.2), CU[key][0] + 0.3, rev=0.5)
add(riser(1.6, 0.25), CU['P7'][0] + 0.3, rev=0.5); add(impact(0.9, 3.0), CU['P7'][0] + 1.95, rev=0.6)
swoosh_in(Z0 + 0.2, 0.18); add(impact(0.9, 3.5), Z0 + 0.55, rev=0.7)

# ── reverb y master
n_ir = int(2.6 * SR); t_ir = tt(n_ir)
irL = lp(rng.standard_normal(n_ir) * np.exp(-t_ir * 2.6), 6000); irR = lp(rng.standard_normal(n_ir) * np.exp(-t_ir * 2.6), 6000)
irL /= np.sqrt(np.sum(irL ** 2)); irR /= np.sqrt(np.sum(irR ** 2))
L += fftconvolve(RL, irL)[:N] * 0.5; R += fftconvolve(RR, irR)[:N] * 0.5
L = hp(L, 28); R = hp(R, 28)
peak = max(np.abs(L).max(), np.abs(R).max())
L, R = np.tanh(1.6 * L / peak) / np.tanh(1.6), np.tanh(1.6 * R / peak) / np.tanh(1.6)
fade = np.ones(N); fs = int((DUR - 2.5) * SR); fade[fs:] = np.linspace(1, 0, N - fs) ** 1.5
fade[:int(0.02 * SR)] = np.linspace(0, 1, int(0.02 * SR))
out = np.stack([L * fade, R * fade], axis=1) * 0.89
with wave.open(os.path.join(ROOT_DIR, 'out', f'audio{TAG}.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(out, -1, 1) * 32767).astype('<i2').tobytes())
print('audio ok', DUR, 'rms', float(np.sqrt(np.mean(out ** 2))))
