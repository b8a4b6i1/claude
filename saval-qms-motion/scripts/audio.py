"""Banda sonora sintetizada (96 BPM, Re mayor) sincronizada con la línea de tiempo de index.html.
Salida: out/audio.wav (44.1 kHz, estéreo)."""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
import wave, os

SR = 44100
# límites de escena (mismo guion que index.html)
SC = [('logo', 7), ('title', 7), ('hoy', 9), ('tabla', 8), ('qd', 12.5), ('metas', 13), ('mod', 10), ('tesis', 16),
      ('aud', 42.5), ('risk', 44.5), ('hab', 14), ('plan', 8), ('relato', 11.5), ('pasos', 7.5), ('outro', 8)]
T = {}; acc = 0.0
for k, d in SC: T[k] = (acc, acc + d); acc += d
DUR = acc
N = int(SR * DUR)
BEAT = 60 / 96; BAR = 4 * BEAT
rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N); RL = np.zeros(N); RR = np.zeros(N)


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


def env(n, a, r, sus=1.0):
    e = np.ones(n) * sus; na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, sus, na); e[-nr:] *= np.linspace(1, 0, nr); return e


# ── progresión: Dmaj9 | Bm9 | Gmaj9 | A6sus — un compás por acorde
CH = [[50, 54, 57, 61, 64], [47, 50, 54, 57, 61], [43, 47, 50, 54, 57], [45, 50, 52, 54, 59]]
ROOT = [38, 35, 31, 33]

# intensidad global (0 = silencio, 1 = pleno) por tramo
def level(t):
    pts = [(0, .25), (3, .5), (7, .6), (14, .75), (43.5, .8), (64.5, .55), (66.5, .9), (82.5, .7), (100, .85),
           (125, .75), (140, .9), (166, .7), (169.5, .85), (183.5, .7), (191.5, .95), (203, .75), (210.5, .7), (216, .5), (DUR, 0)]
    return np.interp(t, [p[0] for p in pts], [p[1] for p in pts])

def saw(f, n, harm=12, det=0.0):
    t = tt(n); ph = rng.uniform(0, 2 * np.pi); out = np.zeros(n)
    for k in range(1, harm + 1):
        if f * k > 8000: break
        out += np.sin(2 * np.pi * f * k * (1 + det) * t + ph * k) / k
    return out

nbars = int(np.ceil(DUR / BAR)) + 1
# pad
for b in range(nbars):
    t0 = b * BAR; seg = int((BAR + 1.2) * SR)
    s = np.zeros(seg)
    for m in CH[b % 4]:
        for d in (-0.005, 0.0, 0.0048):
            s += saw(midi(m), seg, harm=9, det=d)
    s = lp(s, 1500) * env(seg, 0.9, 1.4) * 0.016 * level(t0 + BAR / 2)
    add(s, t0, 1.0, pan=0.0, rev=0.55)
# bajo sub
for b in range(nbars):
    t0 = b * BAR; n = int(BAR * SR); f = midi(ROOT[b % 4])
    s = np.sin(2 * np.pi * f * tt(n)) + 0.25 * np.sin(4 * np.pi * f * tt(n))
    s *= env(n, 0.05, 0.4) * 0.11 * level(t0) * (1 if t0 > 6 else 0.3)
    add(lp(s, 300), t0)
# arpegio pulsado (corcheas) — entra con la escena 3
def pluck(f, n):
    t = tt(n)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    return s * np.exp(-t * 5.5)
pat = [0, 2, 4, 1, 3, 2, 4, 1]
for b in range(nbars):
    for j in range(8):
        t0 = b * BAR + j * BEAT / 2
        if t0 < T['hoy'][0] - BAR or t0 > T['outro'][0] + 2: continue
        blue = (T['tesis'][0] < t0 < T['tesis'][0] + 4.5) or (T['relato'][0] - 0.5 < t0 < T['relato'][0] + 2)
        if blue: continue
        m = CH[b % 4][pat[j]] + 12
        g = 0.05 * level(t0) * (0.75 if j % 2 else 1.0)
        add(pluck(midi(m), int(0.9 * SR)), t0, g, pan=0.35 * np.sin(j * 1.3), rev=0.35)
# pulso suave (bombo en 1 y 3) en las secciones centrales
def kick():
    n = int(0.5 * SR); t = tt(n); f = 52 + 70 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
K = kick()
for b in range(nbars):
    for j in (0, 2):
        t0 = b * BAR + j * BEAT
        on = (T['hoy'][0] <= t0 < T['mod'][1] - 1.5) or (T['aud'][0] + 4 <= t0 < T['risk'][1] - 1) or (T['hab'][0] <= t0 < T['plan'][1] - 1)
        if on: add(K, t0, 0.20 * level(t0))
# shaker tenue (semicorcheas) para movimiento
for b in range(nbars):
    for j in range(16):
        t0 = b * BAR + j * BEAT / 4
        on = (T['qd'][0] <= t0 < T['mod'][1] - 2) or (T['risk'][0] + 10 <= t0 < T['risk'][1] - 4)
        if not on: continue
        n = int(0.06 * SR); s = hp(rng.standard_normal(n), 7000) * np.exp(-tt(n) * 60)
        add(s, t0, 0.018 * (1.0 if j % 4 == 2 else 0.5), pan=0.4 * (1 if j % 2 else -1))

# ── efectos de transición
def whoosh(d, up=True):
    n = int(d * SR); x = rng.standard_normal(n); t = np.linspace(0, 1, n)
    x = bp(x, 400, 6000) * (t ** 2 if up else (1 - t) ** 2)
    return lp(x, 4000)
def impact(f0=48):
    n = int(2.5 * SR); t = tt(n)
    boom = np.sin(2 * np.pi * np.cumsum(f0 + 40 * np.exp(-t * 10)) / SR) * np.exp(-t * 2.2)
    shim = hp(rng.standard_normal(n), 5000) * np.exp(-t * 3) * 0.25
    return boom + shim
def chime(m, d=3.0):
    n = int(d * SR); t = tt(n); f = midi(m)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.01 * t) + 0.15 * np.sin(2 * np.pi * f * 3.02 * t)) * np.exp(-t * 1.8)

for k in ['title', 'hoy', 'tabla', 'qd', 'metas', 'mod', 'hab', 'plan', 'pasos']:
    t0 = T[k][0]
    add(whoosh(0.9), t0 - 0.9, 0.05, pan=-0.2, rev=0.3)
# grandes momentos
for t0, g in [(T['tesis'][0] - 0.2, 0.4), (T['aud'][0], 0.25), (T['risk'][0] + 0.3, 0.25), (T['relato'][0], 0.35), (T['outro'][0] + 0.6, 0.3)]:
    add(whoosh(1.4), t0 - 1.4, 0.07, rev=0.4)
    add(impact(), t0, g, rev=0.5)
# logo: trazos y destellos
for t0, m in [(0.3, 74), (0.6, 78), (2.0, 81), (3.0, 86), (4.3, 90)]:
    add(chime(m), t0, 0.05, pan=0.3 * np.sin(m), rev=0.7)
for t0, m in [(T['outro'][0] + 0.7, 81), (T['outro'][0] + 1.5, 86), (T['outro'][0] + 2.9, 90)]:
    add(chime(m), t0, 0.05, rev=0.7)
# ticks suaves en las fichas de riesgo y burbujas
for i in range(16):
    add(chime(93 + (i % 3) * 2, 0.4), T['risk'][0] + 2.4 + i * 0.11, 0.012, pan=(i % 5 - 2) * 0.2, rev=0.3)
for i in range(6):
    add(chime(86 + i, 0.6), T['aud'][0] + 5.6 + i * 0.16, 0.02, rev=0.4)
# acorde final
n = int(6 * SR); s = np.zeros(n)
for m in [50, 57, 62, 66, 69, 74]: s += np.sin(2 * np.pi * midi(m) * tt(n))
add(s * env(n, 0.8, 4.0) * 0.03, T['outro'][0] + 1.0, rev=0.8)

# ── reverb (IR de ruido con caída exponencial) y mezcla
ir_n = int(2.8 * SR); ir_t = tt(ir_n)
irL = rng.standard_normal(ir_n) * np.exp(-ir_t * 2.4); irR = rng.standard_normal(ir_n) * np.exp(-ir_t * 2.4)
irL = lp(irL, 6000); irR = lp(irR, 6000)
wetL = fftconvolve(RL, irL)[:N] * 0.06; wetR = fftconvolve(RR, irR)[:N] * 0.06
outL = L + wetL; outR = R + wetR
fade = np.ones(N); fo = int(1.5 * SR); fade[-fo:] = np.linspace(1, 0, fo) ** 2; fi = int(0.3 * SR); fade[:fi] = np.linspace(0, 1, fi)
outL *= fade; outR *= fade
peak = max(np.abs(outL).max(), np.abs(outR).max())
outL = np.tanh(outL / peak * 1.2) * 0.89; outR = np.tanh(outR / peak * 1.2) * 0.89
os.makedirs(os.path.join(os.path.dirname(__file__), '..', 'out'), exist_ok=True)
pcm = (np.stack([outL, outR], 1) * 32767).astype(np.int16)
with wave.open(os.path.join(os.path.dirname(__file__), '..', 'out', 'audio.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('audio ok', DUR, 's')
