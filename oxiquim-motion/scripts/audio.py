"""Banda sonora sintetizada (120 BPM, Re mayor) sincronizada con la línea de tiempo de index.html.
Salida: out/audio.wav (44.1 kHz, estéreo, 60 s)."""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
import wave, os

SR = 44100
DUR = 60.0
N = int(SR * DUR)
BEAT = 0.5
rng = np.random.default_rng(35)
L = np.zeros(N); R = np.zeros(N)          # bus seco
RL = np.zeros(N); RR = np.zeros(N)        # envío a reverb


def midi(m): return 440.0 * 2 ** ((m - 69) / 12)
def tt(n): return np.arange(n) / SR
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)


def add(sig, t0, gain=1.0, pan=0.0, rev=0.0):
    i = int(t0 * SR)
    if i >= N: return
    if i < 0: sig = sig[-i:]; i = 0
    sig = sig[: N - i]
    gl, gr = gain * np.sqrt(0.5 * (1 - pan)), gain * np.sqrt(0.5 * (1 + pan))
    L[i:i + len(sig)] += sig * gl; R[i:i + len(sig)] += sig * gr
    if rev: RL[i:i + len(sig)] += sig * gl * rev; RR[i:i + len(sig)] += sig * gr * rev


# ── progresión: Bm7 | Gmaj7 | Dmaj7 | A(sus4→3), un compás (2 s) por acorde
CH = [[47, 50, 54, 57], [43, 47, 50, 54], [50, 54, 57, 61], [45, 50, 52, 57]]
ROOT = [35, 31, 38, 33]
def chord_at(t): return int(t // 2.0) % 4


def saw(f, n, harm=10, det=0.0):
    t = tt(n); ph = rng.uniform(0, 2 * np.pi)
    out = np.zeros(n)
    for k in range(1, harm + 1):
        if f * k > 9000: break
        out += np.sin(2 * np.pi * f * k * (1 + det) * t + ph * k) / k
    return out


# ── pad (todo el tema) con intensidad por sección
def pad_level(t):
    pts = [(0, 0.15), (2, 0.55), (6, 0.45), (12, 0.55), (28, 0.6), (38, 0.65), (48, 0.9), (51.2, 0.55), (54, 0.8), (60, 0.0)]
    return np.interp(t, [p[0] for p in pts], [p[1] for p in pts])

for bar in range(30):
    t0 = bar * 2.0; seg = int(2.6 * SR)
    notes = CH[bar % 4]
    if bar % 4 == 3 and False: pass
    s = np.zeros(seg)
    for m in notes:
        for d in (-0.004, 0.0, 0.0045):
            s += saw(midi(m + 12), seg, harm=8, det=d)
    env = np.minimum(1, tt(seg) / 0.35) * np.minimum(1, (2.6 - tt(seg)) / 0.6)
    cutoff = 900 + 1800 * pad_level(t0)
    s = lp(s, cutoff, 2) * env * 0.035 * pad_level(t0 + 1)
    add(s, t0 - 0.1, 1.0, pan=-0.25, rev=0.6)
    add(np.roll(s, 331), t0 - 0.1, 1.0, pan=0.25, rev=0.6)

# ── shimmer (campanas altas) intro y cierre
def bell(f, dur=2.5, g=1.0):
    n = int(dur * SR); t = tt(n)
    s = (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.01 * t) + 0.15 * np.sin(2 * np.pi * f * 3.98 * t))
    return s * np.exp(-t * 2.2) * g

for i, (t0, m) in enumerate([(0.1, 81), (0.6, 86), (1.1, 88), (1.6, 90), (56.9, 81), (57.25, 86), (57.6, 90), (57.95, 93)]):
    add(bell(midi(m)), t0, 0.06, pan=(-0.5 if i % 2 else 0.5), rev=0.9)

# ── kick
def kick(g=1.0):
    n = int(0.45 * SR); t = tt(n)
    f = 45 + 95 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 7.5)
    click = hp(rng.standard_normal(n), 3000) * np.exp(-t * 400) * 0.25
    return (s + click) * g

kicks = []
for b in range(int(60 / BEAT)):
    t = b * BEAT
    if 6.0 <= t < 12.0 and b % 2 == 0: kicks.append((t, 0.55))
    elif 12.0 <= t < 47.5: kicks.append((t, 0.8))
    elif 51.2 <= t < 54.0: kicks.append((t + 0.2, 0.8))
for t, g in kicks: add(kick(g), t, 0.9)

# ducking (sidechain) sobre pad/bajo/arpegio
duck = np.ones(N)
for t, g in kicks:
    i = int(t * SR); n = int(0.4 * SR)
    seg = 1 - 0.55 * g * np.exp(-tt(n) * 9)
    duck[i:i + n] = np.minimum(duck[i:i + n], seg[: len(duck[i:i + n])])

# ── bajo (corcheas, raíz del acorde)
BASS = np.zeros(N)
for b8 in range(int(60 / (BEAT / 2))):
    t = b8 * BEAT / 2
    if not (12.0 <= t < 47.5 or 51.2 <= t < 54): continue
    n = int(0.24 * SR); tn = tt(n)
    f = midi(ROOT[chord_at(t)] + 12)
    s = (np.sin(2 * np.pi * f * tn) + 0.35 * np.sin(2 * np.pi * 2 * f * tn)) * np.minimum(1, tn / 0.005) * np.exp(-tn * 9)
    i = int(t * SR); BASS[i:i + n] += s[: N - i] * (0.22 if b8 % 2 else 0.28)
BASS = lp(BASS, 700) * duck
L += BASS; R += BASS

# ── arpegio pluck (semicorcheas), filtro que se abre por sección
ARP = np.zeros(N); ARPR = np.zeros(N)
pattern = [0, 2, 1, 3, 2, 1, 3, 2]
for s16 in range(int(60 / (BEAT / 4))):
    t = s16 * BEAT / 4
    if not (12.0 <= t < 47.5 or 51.2 <= t < 54.0 or (6.0 <= t < 12 and s16 % 2 == 0)): continue
    notes = CH[chord_at(t)]
    m = notes[pattern[s16 % 8]] + 24
    n = int(0.3 * SR); tn = tt(n); f = midi(m)
    tone = np.sin(2 * np.pi * f * tn) + 0.3 * np.sin(2 * np.pi * 2 * f * tn) + 0.12 * np.sin(2 * np.pi * 3 * f * tn)
    vel = 0.55 + 0.45 * ((s16 % 4) == 0)
    s = tone * np.exp(-tn * 16) * vel * 0.05
    i = int(t * SR); tgt = ARP if s16 % 2 == 0 else ARPR
    tgt[i:i + n] += s[: N - i]
ARP *= duck; ARPR *= duck
L += ARP * 0.9 + ARPR * 0.4; R += ARP * 0.4 + ARPR * 0.9
RL += (ARP + ARPR) * 0.35; RR += (ARP + ARPR) * 0.35

# ── hats y clap
def hat(g, dur=0.05):
    n = int(dur * SR); t = tt(n)
    return hp(rng.standard_normal(n), 7000, 4) * np.exp(-t * 90) * g

def clap(g):
    n = int(0.25 * SR); t = tt(n)
    nz = bp(rng.standard_normal(n), 900, 3500)
    env = np.exp(-t * 22) + 0.6 * np.exp(-np.maximum(0, t - 0.012) * 30) * (t > 0.012)
    return nz * env * g

for s16 in range(int(60 / (BEAT / 4))):
    t = s16 * BEAT / 4
    if 18.0 <= t < 47.5 or 51.2 <= t < 54:
        g = 0.05 if s16 % 4 == 2 else 0.022
        add(hat(g), t, 1.0, pan=0.3 if s16 % 2 else -0.2)
for b in range(int(60 / BEAT)):
    t = b * BEAT
    if (28.0 <= t < 47.5 or 51.2 <= t < 54) and b % 2 == 1:
        add(clap(0.16), t, 1.0, rev=0.5)

# ── efectos: whoosh, impact, riser, ticks
def whoosh(dur, g=1.0, rise=True):
    n = int(dur * SR); t = tt(n); u = t / dur
    nz = rng.standard_normal(n)
    out = np.zeros(n); blocks = 24
    for k in range(blocks):
        a, b = k * n // blocks, (k + 1) * n // blocks
        uu = (k + 0.5) / blocks
        fc = 300 + (5000 if rise else 3000) * (uu ** 2 if rise else (1 - uu) ** 2)
        out[a:b] = bp(nz, max(80, fc * 0.5), min(18000, fc * 1.5))[a:b]
    env = (np.sin(np.pi * u) ** 2) if not rise else (u ** 2.2) * (1 - np.exp(-(1 - u) * 40))
    return out * env * g

def impact(g=1.0, dur=2.8):
    n = int(dur * SR); t = tt(n)
    f = 32 + 60 * np.exp(-t * 8)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    nz = lp(rng.standard_normal(n), 2500) * np.exp(-t * 9) * 0.35
    return (boom + nz) * g

def riser(dur, g=1.0):
    n = int(dur * SR); t = tt(n); u = t / dur
    f = 180 * (2 ** (2.5 * u))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    nz = hp(rng.standard_normal(n), 2000) * u ** 2
    return (tone * 0.35 + nz * 0.4) * (u ** 1.8) * g

def tick(f=2200, g=1.0):
    n = int(0.06 * SR); t = tt(n)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 80) * g

# intro
add(whoosh(1.6, 0.18, True), 0.45, rev=0.6)
add(impact(0.75), 2.02, rev=0.5)
add(whoosh(0.9, 0.12, False), 2.7, pan=0.4, rev=0.3)
add(whoosh(0.7, 0.2, True), 5.32, rev=0.4)
# tipografía cinética
for t0 in (6.0, 7.0, 8.0, 9.0):
    add(tick(1800, 0.12), t0 + 0.03, rev=0.4)
add(impact(0.55, 2.0), 10.0, rev=0.5)
add(whoosh(0.85, 0.28, True), 11.3, rev=0.4)
add(impact(0.5, 1.8), 12.15, rev=0.4)
# línea de tiempo: nodos cuando pasa el cabezal
def ioc(u): return 4 * u ** 3 if u < .5 else 1 - (-2 * u + 2) ** 3 / 2
us = np.linspace(0, 1, 20001)
for mth in (0, 6, 18, 36):
    u = us[np.argmax(np.array([36 * ioc(x) for x in us]) >= mth - 0.01)]
    add(tick(2600 if mth else 2000, 0.14), 12 + 1.0 + 3.3 * u, pan=-0.6 + mth / 30, rev=0.5)
add(whoosh(0.8, 0.3, True), 17.25, rev=0.4)
add(impact(0.7), 18.0, rev=0.5)
for i in range(4): add(tick(1500 + i * 180, 0.08), 20.3 + i * 0.16, pan=-0.4 + i * 0.27, rev=0.4)
add(whoosh(0.85, 0.3, True), 27.2, rev=0.4)
add(impact(0.6), 28.0, rev=0.5)
for i in range(13): add(tick(2400 + (i % 5) * 150, 0.05), 28.05 + i * 0.045 + 0.45, pan=-0.6 + i * 0.1)
for t0 in (29.9, 31.8, 33.7, 35.6): add(whoosh(0.5, 0.1, False), t0, rev=0.3)
add(whoosh(0.55, 0.25, True), 37.2, rev=0.4)
add(impact(0.75), 38.0, rev=0.6)
add(riser(1.8, 0.10), 40.5, rev=0.4)
add(whoosh(0.7, 0.14, False), 43.6, rev=0.4)
for j in range(7): add(bell(midi(88 + [0, 2, 4, 7, 9, 12, 14][j]), 1.2, 1.0), 44.8 + j * 0.18 + 0.9, 0.035, pan=-0.6 + j * 0.2, rev=0.8)
add(whoosh(0.75, 0.25, True), 47.25, rev=0.4)
add(riser(2.3, 0.35), 48.9, rev=0.5)
add(impact(1.0, 3.2), 51.2, rev=0.6)
add(whoosh(0.7, 0.2, True), 53.3, rev=0.4)
add(impact(0.55), 54.05, rev=0.5)
add(whoosh(0.6, 0.12, True), 55.9, rev=0.4)
add(impact(0.8, 3.5), 57.3, rev=0.7)

# ── reverb por convolución
n_ir = int(2.6 * SR); t_ir = tt(n_ir)
irL = rng.standard_normal(n_ir) * np.exp(-t_ir * 2.6); irR = rng.standard_normal(n_ir) * np.exp(-t_ir * 2.6)
irL = lp(irL, 6000); irR = lp(irR, 6000)
irL /= np.sqrt(np.sum(irL ** 2)); irR /= np.sqrt(np.sum(irR ** 2))
L += fftconvolve(RL, irL)[:N] * 0.5; R += fftconvolve(RR, irR)[:N] * 0.5

# ── master: HPF suave, limitador tanh, normalización, fundido final
L = hp(L, 28); R = hp(R, 28)
peak = max(np.abs(L).max(), np.abs(R).max())
L, R = np.tanh(1.4 * L / peak) / np.tanh(1.4), np.tanh(1.4 * R / peak) / np.tanh(1.4)
fade = np.ones(N); fs = int(58.8 * SR); fade[fs:] = np.linspace(1, 0, N - fs) ** 1.5
fade[:int(0.02 * SR)] = np.linspace(0, 1, int(0.02 * SR))
L *= fade * 0.89; R *= fade * 0.89
out = np.stack([L, R], axis=1)
os.makedirs('out', exist_ok=True)
with wave.open('out/audio.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(out, -1, 1) * 32767).astype('<i2').tobytes())
print('audio ok', out.shape, 'rms', float(np.sqrt(np.mean(out ** 2))))
