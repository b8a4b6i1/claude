"""Banda sonora del video introductorio (≈99 BPM, Re mayor): piano, pad y un pulso suave que crece hacia
«¡Vamos a trabajar!» (≈67,95 s, compás 28, tiempo fuerte) y resuelve con el logo. Sintetizada.
Salida: out/audio.wav (44,1 kHz, estéreo) + stems."""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
import wave, os, sys
sys.path.insert(0, os.path.dirname(__file__))

SR = 44100
BAR = 63.1 / 26            # compás (≈98,9 BPM)
OFF = 2 * BAR              # la bienvenida agrega dos compases tras el logo (= OFF de index.html)
DUR = 79.0 + OFF
N = int(SR * DUR)
BEAT = BAR / 4
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


# I – vi – IV – Vsus4: Dadd9 | Bm7 | Gmaj7 | Asus4
CH = [[50, 54, 57, 64], [47, 54, 57, 62], [43, 50, 54, 59], [45, 50, 52, 57]]
ROOT = [38, 35, 31, 33]
def bar_of(t): return int(t // BAR + 1e-6)
def chord_at(t): return bar_of(t) % 4
def tb(b): return b * BAR                       # compás → segundos
def sec(t, a, b): return tb(a) <= t < tb(b)


def piano(f, dur=3.0, vel=1.0):
    n = int(dur * SR); t = tt(n); s = np.zeros(n); B = 0.00035
    bright = 0.6 + 0.4 * vel
    for k in range(1, 12):
        fk = k * f * np.sqrt(1 + B * k * k)
        if fk > 12000: break
        s += np.sin(2 * np.pi * fk * t + rng.uniform(0, 6.28)) * (bright ** (k - 1)) / k ** 1.15 * np.exp(-t * (0.55 + 0.42 * k) * (f / 260) ** 0.35)
    ham = lp(rng.standard_normal(n), 2500) * np.exp(-t * 120) * 0.06
    env = np.minimum(1, t / 0.003) * np.minimum(1, (dur - t) / 0.25)
    return (s + ham) * env * vel


def pad_chord(ch, dur, g, cutoff):
    n = int(dur * SR); t = tt(n); s = np.zeros(n)
    for m in ch:
        for det in (-0.004, 0.0, 0.004):
            f = midi(m + 12) * (1 + det)
            for k in range(1, 7): s += np.sin(2 * np.pi * f * k * t + rng.uniform(0, 6.28)) / k ** 1.6
    env = np.minimum(1, t / 0.9) * np.minimum(1, (dur - t) / 0.9)
    return lp(s, cutoff) * env * g


def kick(g=1.0):
    n = int(0.4 * SR); t = tt(n)
    f = 42 + 80 * np.exp(-t * 30)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8) + hp(rng.standard_normal(n), 3000) * np.exp(-t * 500) * 0.12) * g
def shaker(g):
    n = int(0.07 * SR); t = tt(n)
    return bp(rng.standard_normal(n), 5000, 11000) * np.minimum(1, t / 0.01) * np.exp(-t * 60) * g
def rim(g):
    n = int(0.12 * SR); t = tt(n)
    return (np.sin(2 * np.pi * 1650 * t) * np.exp(-t * 90) + bp(rng.standard_normal(n), 1500, 5000) * np.exp(-t * 70) * 0.6) * g
def clap(g):
    n = int(0.25 * SR); t = tt(n)
    env = np.exp(-t * 24) + 0.5 * np.exp(-np.maximum(0, t - 0.011) * 30) * (t > 0.011)
    return bp(rng.standard_normal(n), 1000, 4000) * env * g
def bell(f, dur=2.5, g=1.0):
    n = int(dur * SR); t = tt(n)
    return (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t * 3) + 0.12 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 8)) * np.exp(-t * 2.0) * g * np.minimum(1, t / 0.002)

LOGO_HIT = 73.95 + OFF
END_BAR = 32                                       # el ritmo se detiene; acorde final con el logo

# ── pad: respira con la historia
def pad_level(t):
    pts = [(0, 0.0), (1.0, 0.5), (4.85, 0.42)] + [(a + OFF, v) for a, v in [(4.85, 0.35), (9.7, 0.45), (29.1, 0.6), (46.1, 0.55), (59.5, 0.75), (63.1, 1.0), (72.8, 0.7)]] + [(DUR, 0.0)]
    return np.interp(t, [p[0] for p in pts], [p[1] for p in pts])
for b in range(END_BAR):
    t0 = tb(b); add(pad_chord(CH[b % 4], BAR + 1.0, 0.012 * pad_level(t0 + 1), 900 + 1800 * pad_level(t0)), t0 - 0.4, 1.0, pan=-0.2, rev=0.6)
    add(np.roll(pad_chord(CH[b % 4], BAR + 1.0, 0.012 * pad_level(t0 + 1), 900 + 1800 * pad_level(t0)), 400), t0 - 0.4, 1.0, pan=0.2, rev=0.6)
add(pad_chord([50, 57, 62, 64, 66], DUR - LOGO_HIT + 0.3, 0.016, 2400), LOGO_HIT - 0.15, 1.0, rev=0.7)

# ── piano: notas sueltas en la marca, acordes en «Hoy nos detenemos», arpegio desde el diagnóstico
for t0, m, v in [(0.38, 74, 0.5), (1.1, 78, 0.35), (1.6, 81, 0.35), (2.15, 86, 0.4), (4.88 + OFF, 69, 0.45)]:
    add(piano(midi(m), 3.5, v), t0, 0.16, pan=0.1, rev=0.6)
for b in (2, 3, 4, 5):                             # bienvenida y «Hoy nos detenemos»
    for j, m in enumerate(CH[b % 4]): add(piano(midi(m + 12), BAR + 0.6, 0.45), tb(b) + j * 0.025, 0.07, pan=-0.3 + j * 0.2, rev=0.5)
ARP = [0, 2, 1, 3, 2, 1, 3, 2]
for e8 in range(int(tb(END_BAR) / (BEAT / 2))):
    t = e8 * BEAT / 2
    if t < tb(6): continue
    ch = CH[chord_at(t)]
    m = ch[ARP[e8 % 8]] + 12 + (12 if (e8 % 8) in (3, 6) else 0)
    v = 0.32 + 0.12 * (e8 % 2 == 0) + 0.1 * (t >= tb(28))
    add(piano(midi(m), 1.6, v), t, 0.06, pan=0.35 * np.sin(e8 * 0.9), rev=0.45)
    if e8 % 8 == 0: add(piano(midi(ROOT[chord_at(t)] + 12), 2.4, 0.5), t, 0.07, pan=-0.1, rev=0.35)

# ── pulso suave: corcheas apagadas en la raíz
for e8 in range(int(tb(END_BAR) / (BEAT / 2))):
    t = e8 * BEAT / 2
    if t < tb(6) or t >= tb(END_BAR): continue
    n = int(0.16 * SR); tn = tt(n); f = midi(ROOT[chord_at(t)] + 24)
    s = (np.sin(2 * np.pi * f * tn) + 0.3 * np.sin(2 * np.pi * 2 * f * tn)) * np.exp(-tn * 26) * np.minimum(1, tn / 0.003)
    g = 0.05 if t < tb(14) else 0.06
    add(lp(s, 1400), t, g * (1.0 if e8 % 2 == 0 else 0.7), pan=0.15 * (1 if e8 % 2 else -1))

# ── percusión: shaker desde el compás 8; bombo y aro en las secciones de trabajo; plenitud en «¡Vamos!»
KB = [(14, 21), (28, END_BAR)]
kicks = []
for q in range(int(tb(END_BAR) / BEAT)):
    t = q * BEAT; b = bar_of(t)
    if any(a <= b < c for a, c in KB): kicks.append((t, 0.75 if b < 28 else 1.0))
    elif 26.5 * BAR <= t < tb(28) and q % 2 == 0: kicks.append((t, 0.5))
for t, g in kicks: add(kick(g), t, 0.55)
for s16 in range(int(tb(END_BAR) / (BEAT / 4))):
    t = s16 * BEAT / 4; b = bar_of(t)
    if b < 10: continue
    add(shaker(0.018 if s16 % 2 else 0.03), t, 1.0, pan=0.35)
for q in range(int(tb(END_BAR) / BEAT)):
    t = q * BEAT; b = bar_of(t)
    if q % 4 in (1, 3):
        if 14 <= b < 21: add(rim(0.05), t, 1.0, pan=-0.2, rev=0.3)
        if 28 <= b < END_BAR: add(clap(0.16), t, 1.0, rev=0.4)
for k in range(8): add(clap(0.03 + 0.02 * k), tb(28) - BAR / 2 + k * BEAT / 4, 1.0, rev=0.3)   # redoble suave hacia «¡Vamos!»

# ── bajo (sub) en las secciones con bombo
duck = np.ones(N)
for t, g in kicks:
    i = int(t * SR); n = int(0.3 * SR); seg = 1 - 0.45 * g * np.exp(-tt(n) * 12)
    duck[i:i + n] = np.minimum(duck[i:i + n], seg[: len(duck[i:i + n])])
BASS = np.zeros(N)
for e8 in range(int(tb(END_BAR) / (BEAT / 2))):
    t = e8 * BEAT / 2; b = bar_of(t)
    if not any(a <= b < c for a, c in KB) or e8 % 2 == 0: continue
    n = int(0.28 * SR); tn = tt(n); f = midi(ROOT[chord_at(t)] + 12)
    s = (np.sin(2 * np.pi * f * tn) + 0.3 * np.sin(2 * np.pi * 2 * f * tn)) * np.minimum(1, tn / 0.006) * np.exp(-tn * 7)
    i = int(t * SR); BASS[i:i + n] += s[: N - i] * 0.2
BASS = lp(BASS, 700) * duck
L += BASS; R += BASS

# ── melodía: piano alto en los hitos (escena 6) y campanas en R35
MEL = [(0, 78), (2, 81), (3, 83), (4, 81), (6, 78), (8, 76), (10, 78), (11, 81), (12, 86), (14, 83)]  # corcheas, 2 compases
def melody(a, b, inst, g):
    t = tb(a)
    while t < tb(b):
        for k, m in MEL:
            tk = t + k * BEAT / 2
            if tk < tb(b): add(inst(midi(m)), tk, g, pan=0.12 * ((k % 3) - 1), rev=0.55)
        t += 2 * BAR
melody(17, 21, lambda f: piano(f, 2.0, 0.55), 0.07)
melody(28, END_BAR, lambda f: bell(f, 2.0), 0.045)

# ── final: acorde con el logo
for j, m in enumerate([38, 50, 57, 62, 64, 66, 69]): add(piano(midi(m), 5.5, 0.6), LOGO_HIT + j * 0.018, 0.09, pan=-0.4 + j * 0.13, rev=0.6)
for j, m in enumerate([86, 90, 93, 98]): add(bell(midi(m), 2.5), 75.7 + OFF + j * 0.1, 0.03, pan=-0.5 + j * 0.33, rev=0.9)

# ── reverb por convolución
n_ir = int(3.0 * SR); t_ir = tt(n_ir)
irL = lp(rng.standard_normal(n_ir) * np.exp(-t_ir * 2.2), 6000); irR = lp(rng.standard_normal(n_ir) * np.exp(-t_ir * 2.2), 6000)
irL /= np.sqrt(np.sum(irL ** 2)); irR /= np.sqrt(np.sum(irR ** 2))
L += fftconvolve(RL, irL)[:N] * 0.5; R += fftconvolve(RR, irR)[:N] * 0.5

# ── efectos de sonido: bus propio, siempre por debajo de la música
import sfx
SL, SRR = sfx.build(N, SR)
def env(x, win=0.3, hop=0.01):
    """RMS y pico por ventanas (centradas) cada `hop` segundos."""
    h = int(hop * SR); w = int(win * SR); x2 = np.concatenate([np.zeros(w // 2), x, np.zeros(w)])
    c = np.cumsum(x2 ** 2); idx = np.arange(0, len(x), h)
    rms = np.sqrt(np.maximum(0, (c[idx + w] - c[idx]) / w))
    pk = np.array([np.abs(x2[i:i + w]).max() for i in idx])
    return rms, pk, idx
M = 0.5 * (L + R); S = 0.5 * (SL + SRR)
m_rms, m_pk, idx = env(M); s_rms, s_pk, _ = env(S)
# 1) nivel base: el bus de efectos ~9 dB por debajo de la música en promedio (solo donde suena)
act = s_rms > s_rms.max() * 0.02
base = (np.sqrt(np.mean(m_rms[act] ** 2)) / np.sqrt(np.mean(s_rms[act] ** 2))) * 10 ** (-9 / 20)
SL *= base; SRR *= base
# 1b) por escena: el bus de efectos ~10 dB bajo la música en las ventanas donde suena (la música cambia mucho de nivel)
SECT = [0, 3.2, 8.1] + [a + OFF for a in (4.9, 10, 16.5, 22.6, 28.8, 36, 47, 59, 63, 66, 72.4)] + [DUR]
s_rms, _, _ = env(0.5 * (SL + SRR)); tw = idx / SR; gsec = []
for a0, b0 in zip(SECT[:-1], SECT[1:]):
    w = (tw >= a0) & (tw < b0) & (s_rms > s_rms.max() * 0.01)
    if not w.any(): gsec.append(1.0); continue
    gsec.append(min(6.0, (np.sqrt(np.mean(m_rms[w] ** 2)) / np.sqrt(np.mean(s_rms[w] ** 2))) * 10 ** (-10 / 20)))
knots_t = [0.0]; knots_g = [gsec[0]]
for k in range(1, len(gsec)):
    knots_t += [SECT[k] - 0.15, SECT[k] + 0.15]; knots_g += [gsec[k - 1], gsec[k]]
knots_t.append(DUR); knots_g.append(gsec[-1])
gs = np.interp(np.arange(N) / SR, knots_t, knots_g); SL *= gs; SRR *= gs
# 1c) nivelación por ventana: cada efecto sube (hasta ×6) o baja a un nivel constante bajo la música
s_rms, s_pk, _ = env(0.5 * (SL + SRR))
act_w = s_rms > s_rms.max() * 0.004
gt = np.minimum(m_rms * 10 ** (-9 / 20) / np.maximum(s_rms, 1e-9), 0.5 * m_pk / np.maximum(s_pk, 1e-9))
gt = np.where(act_w, np.clip(gt, 0.0, 6.0), 1.0)
k = 15; gt = np.array([gt[max(0, i - k):i + k + 1].min() for i in range(len(gt))])
gt = np.convolve(gt, np.ones(9) / 9, mode='same')
gs = np.interp(np.arange(N), idx, gt); SL *= gs; SRR *= gs
# 2) control dinámico iterativo: en cada ventana de 300 ms, RMS de efectos ≤ música − 6 dB
#    y pico de efectos ≤ 70 % del pico de la música
for it in range(6):
    s_rms, s_pk, _ = env(0.5 * (SL + SRR))
    lim = np.minimum(m_rms * 10 ** (-6.5 / 20) / np.maximum(s_rms, 1e-9), 0.66 * m_pk / np.maximum(s_pk, 1e-9))
    g = np.minimum(1.0, lim)
    if g.min() > 0.995: break
    k = 15; g = np.array([g[max(0, i - k):i + k + 1].min() for i in range(len(g))])   # anticipación ±150 ms
    g = np.minimum(g, np.convolve(g, np.ones(7) / 7, mode='same'))
    gs = np.interp(np.arange(N), idx, g)
    SL *= gs; SRR *= gs
s_rms2, s_pk2, _ = env(0.5 * (SL + SRR))
ok = act & (m_rms > 1e-4)
diff_db = 20 * np.log10(np.maximum(s_rms2[ok], 1e-9) / m_rms[ok])
print(f'efectos vs música (ventanas 300 ms con efectos): mediana {np.median(diff_db):.1f} dB, máximo {diff_db.max():.1f} dB; '
      f'pico efectos/pico música máx {np.max(s_pk2[ok] / np.maximum(m_pk[ok], 1e-9)):.2f}')
MUSIC_L, MUSIC_R = L.copy(), R.copy()
L = L + SL; R = R + SRR

# ── master: HPF suave, limitador tanh, normalización, fundido final
L = hp(L, 28); R = hp(R, 28)
peak = max(np.abs(L).max(), np.abs(R).max()); peak_all = peak
L, R = np.tanh(1.4 * L / peak) / np.tanh(1.4), np.tanh(1.4 * R / peak) / np.tanh(1.4)
fade = np.ones(N); fs = int((DUR - 2.4) * SR); fade[fs:] = np.linspace(1, 0, N - fs) ** 1.5
fade[:int(0.02 * SR)] = np.linspace(0, 1, int(0.02 * SR))
L *= fade * 0.89; R *= fade * 0.89
out = np.stack([L, R], axis=1)
os.makedirs('out', exist_ok=True)
def write(path, a, b):
    st = np.stack([a, b], axis=1) * fade[:, None] * 0.89 / peak_all
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(st, -1, 1) * 32767).astype('<i2').tobytes())
write('out/stem_musica.wav', MUSIC_L, MUSIC_R); write('out/stem_efectos.wav', SL, SRR)
with wave.open('out/audio.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(out, -1, 1) * 32767).astype('<i2').tobytes())
print('audio ok', out.shape, 'rms', float(np.sqrt(np.mean(out ** 2))))
