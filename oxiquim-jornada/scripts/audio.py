"""Banda sonora sintetizada (100 BPM, Re mayor) sincronizada con index.html (Jornada GPER).
Salida: out/audio.wav (44.1 kHz, estéreo)."""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
import wave, os

SR = 44100
DUR = 70.3
N = int(SR * DUR)
BEAT = 0.6
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


# ── progresión amable: Dmaj9 | Bm9 | Gmaj7 | A6sus — un compás (2,4 s) por acorde
BAR = 4 * BEAT
CH = [[50, 54, 57, 61, 64], [47, 50, 54, 57, 61], [43, 47, 50, 54, 57], [45, 50, 52, 54, 57]]
ROOT = [38, 35, 31, 33]
def chord_at(t): return int(t // BAR) % 4


def saw(f, n, harm=10, det=0.0):
    t = tt(n); ph = rng.uniform(0, 2 * np.pi)
    out = np.zeros(n)
    for k in range(1, harm + 1):
        if f * k > 9000: break
        out += np.sin(2 * np.pi * f * k * (1 + det) * t + ph * k) / k
    return out


def bell(f, dur=2.5, g=1.0):
    n = int(dur * SR); t = tt(n)
    s = (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.01 * t) + 0.15 * np.sin(2 * np.pi * f * 3.98 * t))
    return s * np.exp(-t * 2.2) * g


def kick(g=1.0):
    n = int(0.45 * SR); t = tt(n)
    f = 45 + 95 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 7.5)
    click = hp(rng.standard_normal(n), 3000) * np.exp(-t * 400) * 0.25
    return (s + click) * g

def hat(g, dur=0.05):
    n = int(dur * SR); t = tt(n)
    return hp(rng.standard_normal(n), 7000, 4) * np.exp(-t * 90) * g

def clap(g):
    n = int(0.25 * SR); t = tt(n)
    nz = bp(rng.standard_normal(n), 900, 3500)
    env = np.exp(-t * 22) + 0.6 * np.exp(-np.maximum(0, t - 0.012) * 30) * (t > 0.012)
    return nz * env * g

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



# ── pad cálido con intensidad por sección
def pad_level(t):
    pts = [(0, 0.2), (2, 0.5), (4.5, 0.55), (11, 0.6), (29, 0.75), (37.5, 0.6), (45, 0.7), (53, 0.85), (57, 0.6), (63.5, 0.8), (65, 0.9), (70.3, 0.0)]
    return np.interp(t, [p[0] for p in pts], [p[1] for p in pts])

for bar in range(int(DUR / BAR) + 1):
    t0 = bar * BAR; seg = int((BAR + 0.6) * SR)
    s = np.zeros(seg)
    for m in CH[bar % 4]:
        for d in (-0.004, 0.0, 0.0045):
            s += saw(midi(m + 12), seg, harm=7, det=d)
    env = np.minimum(1, tt(seg) / 0.4) * np.minimum(1, (BAR + 0.6 - tt(seg)) / 0.7)
    s = lp(s, 800 + 1600 * pad_level(t0), 2) * env * 0.03 * pad_level(t0 + 1)
    add(s, t0 - 0.1, 1.0, pan=-0.25, rev=0.6)
    add(np.roll(s, 331), t0 - 0.1, 1.0, pan=0.25, rev=0.6)

GROOVE = [(11.0, 52.9), (57.3, 64.6)]          # secciones con pulso completo
HALF = [(4.45, 11.0), (52.9, 57.3)]            # medio tiempo
def inside(t, spans): return any(a <= t < b for a, b in spans)

kicks = []
for b in range(int(DUR / BEAT)):
    t = b * BEAT
    if inside(t, GROOVE): kicks.append((t, 0.75 if b % 4 else 0.85))
    elif inside(t, HALF) and b % 2 == 0: kicks.append((t, 0.5))
for t, g in kicks: add(kick(g), t, 0.85)

duck = np.ones(N)
for t, g in kicks:
    i = int(t * SR); n = int(0.4 * SR)
    seg = 1 - 0.5 * g * np.exp(-tt(n) * 9)
    duck[i:i + n] = np.minimum(duck[i:i + n], seg[: len(duck[i:i + n])])

# bajo: corcheas con salto de octava
BASS = np.zeros(N)
for b8 in range(int(DUR / (BEAT / 2))):
    t = b8 * BEAT / 2
    if not inside(t, GROOVE): continue
    n = int(0.26 * SR); tn = tt(n)
    f = midi(ROOT[chord_at(t)] + 12 + (12 if b8 % 4 == 3 else 0))
    s = (np.sin(2 * np.pi * f * tn) + 0.35 * np.sin(2 * np.pi * 2 * f * tn)) * np.minimum(1, tn / 0.005) * np.exp(-tn * 8)
    i = int(t * SR); BASS[i:i + n] += s[: N - i] * (0.2 if b8 % 2 else 0.27)
BASS = lp(BASS, 700) * duck
L += BASS; R += BASS

# arpegio pluck (semicorcheas), luminoso
ARP = np.zeros(N); ARPR = np.zeros(N)
pattern = [0, 2, 4, 1, 3, 2, 4, 3]
for s16 in range(int(DUR / (BEAT / 4))):
    t = s16 * BEAT / 4
    if not (inside(t, GROOVE) or (inside(t, HALF) and s16 % 2 == 0) or (63.5 <= t < 68 and s16 % 2 == 0)): continue
    m = CH[chord_at(t)][pattern[s16 % 8]] + 24
    n = int(0.32 * SR); tn = tt(n); f = midi(m)
    tone = np.sin(2 * np.pi * f * tn) + 0.3 * np.sin(2 * np.pi * 2 * f * tn) + 0.1 * np.sin(2 * np.pi * 3 * f * tn)
    vel = 0.55 + 0.45 * ((s16 % 4) == 0)
    s = tone * np.exp(-tn * 15) * vel * 0.045
    i = int(t * SR); tgt = ARP if s16 % 2 == 0 else ARPR
    tgt[i:i + n] += s[: N - i]
ARP *= duck; ARPR *= duck
L += ARP * 0.9 + ARPR * 0.4; R += ARP * 0.4 + ARPR * 0.9
RL += (ARP + ARPR) * 0.35; RR += (ARP + ARPR) * 0.35

for s16 in range(int(DUR / (BEAT / 4))):
    t = s16 * BEAT / 4
    if inside(t, [(17.0, 52.9), (57.3, 64.6)]):
        add(hat(0.045 if s16 % 4 == 2 else 0.018), t, 1.0, pan=0.3 if s16 % 2 else -0.2)
for b in range(int(DUR / BEAT)):
    t = b * BEAT
    if inside(t, [(22.8, 52.9), (59.0, 64.6)]) and b % 2 == 1:
        add(clap(0.13), t, 1.0, rev=0.5)

def chime(notes, t0, step=0.09, g=0.05):
    for j, m in enumerate(notes): add(bell(midi(m), 1.4), t0 + j * step, g, pan=-0.5 + j / max(1, len(notes) - 1), rev=0.8)

D5, D6 = 0.8, 1.8   # desfases de escenas (como en index.html)
# intro de marca
add(tick(1700, 0.18), 0.05, rev=0.6)
for i, (t0, m) in enumerate([(0.1, 74), (0.5, 78), (0.9, 81), (1.3, 85)]): add(bell(midi(m + 12)), t0, 0.05, pan=(-0.5 if i % 2 else 0.5), rev=0.9)
add(whoosh(1.2, 0.12, True), 0.3, rev=0.6)
add(impact(0.55, 2.2), 1.05, rev=0.6)
for i in range(6): add(tick(2000 + i * 160, 0.07), 2.1 + i * 0.07, pan=-0.5 + i * 0.2, rev=0.4)
chime([86, 90, 93], 2.95, 0.12, 0.04)
add(riser(0.85, 0.3), 3.6, rev=0.4)
add(impact(0.85, 2.6), 4.45, rev=0.6)
add(whoosh(0.9, 0.18, False), 4.45, rev=0.5)
# título
add(whoosh(1.4, 0.1, True), 4.9, rev=0.6)
add(whoosh(0.55, 0.26, True), 6.6, pan=-0.3, rev=0.3)
add(impact(0.5, 1.6), 7.15, rev=0.4)
add(tick(2600, 0.1), 8.5, pan=0.6, rev=0.5)
# resultados → plan
add(whoosh(1.2, 0.2, True), 10.4, rev=0.4)
add(whoosh(2.0, 0.07, False), 12.4, rev=0.6)
add(tick(2300, 0.08), 12.95, rev=0.4)
add(whoosh(1.0, 0.18, True), 16.4, rev=0.4)
for i in range(6): add(tick(1800 + i * 200, 0.08), 19.3 + i * 0.14, pan=-0.6 + i * 0.24, rev=0.4)
# oficina → fuera
add(whoosh(0.9, 0.18, True), 22.2, rev=0.4)
add(tick(1500, 0.14), 25.2, rev=0.4); add(impact(0.35, 1.4), 25.5, rev=0.5)
add(whoosh(1.1, 0.2, False), 26.45, pan=0.2, rev=0.5)
for i in range(3): add(tick(2600, 0.07), 26.95 + i * 0.21, rev=0.5)
# Olmué
add(whoosh(1.0, 0.22, True), 28.6 + D5 - 0.5, rev=0.5)
add(impact(0.6, 2.4), 29.3 + D5, rev=0.6)
add(whoosh(0.9, 0.08, False), 30.35 + D5, pan=-0.4, rev=0.5)
add(tick(900, 0.25), 31.25 + D5, rev=0.5); chime([81, 85, 88], 31.3 + D5, 0.1, 0.05)
add(tick(1600, 0.14), 31.85 + D5, rev=0.4)
for i in range(7): add(tick(2200 + i * 90, 0.06), 32.05 + D5 + 1.05 * (i / 7) ** 0.6, rev=0.3)
add(impact(0.35, 1.2), 33.1 + D5, rev=0.4)
# objetivo
add(whoosh(1.1, 0.18, True), 35.9 + D5, rev=0.5)
add(whoosh(0.8, 0.1, False), 36.6 + D6, rev=0.6); chime([78, 85], 37.2 + D6, 0.15, 0.04)
add(riser(1.0, 0.22), 37.95 + D6, rev=0.4)
add(impact(0.8, 2.6), 38.95 + D6, rev=0.6); chime([86, 90, 93, 98], 38.98 + D6, 0.07, 0.045)
# tarjetas
add(whoosh(0.8, 0.14, True), 42.2 + D6, rev=0.4)
for k, t0 in enumerate((43.85, 45.05, 46.25)):
    add(whoosh(0.5, 0.15, True), t0 + D6 - 0.35, pan=-0.3 + 0.3 * k, rev=0.3)
    add(tick(1900 + 250 * k, 0.12), t0 + D6 + 0.05, rev=0.5)
    chime([81 + [0, 4, 7][k], 88 + [0, 4, 7][k]], t0 + D6 + 1.1, 0.1, 0.03)
# nos vemos
add(whoosh(0.8, 0.2, False), 51.15 + D6, rev=0.5)
for i in range(9): add(tick(1500 + i * 120, 0.06), 51.75 + D6 + i * 0.055, rev=0.4)
add(impact(0.55, 2.4), 52.35 + D6, rev=0.6); chime([86, 90, 93, 97, 98], 52.4 + D6, 0.08, 0.04)
# Rumbo 35
add(whoosh(1.6, 0.1, True), 55.4 + D6, rev=0.5)
for i in range(40): add(tick(2500 + (i % 7) * 140, 0.025), 55.6 + D6 + i * 0.045, pan=-0.8 + (i % 9) * 0.2)
add(impact(0.75, 2.4), 57.35 + D6, rev=0.6)
# cierre
add(riser(1.6, 0.35), 61.6 + D6, rev=0.5)
add(impact(1.0, 3.6), 63.15 + D6, rev=0.7)
for i in range(6): add(tick(2100 + i * 160, 0.06), 63.45 + D6 + i * 0.07, rev=0.4)
chime([86, 90, 93, 98], 64.8 + D6, 0.12, 0.05)

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
fade = np.ones(N); fs = int((DUR - 2.4) * SR); fade[fs:] = np.linspace(1, 0, N - fs) ** 1.5
fade[:int(0.02 * SR)] = np.linspace(0, 1, int(0.02 * SR))
L *= fade * 0.89; R *= fade * 0.89
out = np.stack([L, R], axis=1)
os.makedirs('out', exist_ok=True)
with wave.open('out/audio.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(out, -1, 1) * 32767).astype('<i2').tobytes())
print('audio ok', out.shape, 'rms', float(np.sqrt(np.mean(out ** 2))))
