"""Banda sonora sintetizada (120 BPM, Re mayor, pop optimista) sincronizada con index.html (Jornada GPER).
Salida: out/audio.wav (44.1 kHz, estéreo)."""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
import wave, os

SR = 44100
DUR = 67.4
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


# ── progresión optimista I–V–vi–IV en Re mayor: D | A | Bm | G — un compás (2 s) por acorde
BAR = 4 * BEAT
CH = [[50, 54, 57, 62], [49, 52, 57, 61], [47, 50, 54, 59], [47, 50, 55, 59]]
ROOT = [38, 33, 35, 31]
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




def inside(t, spans): return any(a <= t < b for a, b in spans)
INTRO_END, END_GROOVE = 4.45, 63.3
FULL = [(11.0, 22.4), (23.0, 46.5), (47.0, 62.3)]          # pulso completo (respiros antes del objetivo, de R35 y del logo)
LEAD = [(30.8, 38.6), (47.0, 62.3)]                       # melodía principal: equipo, cierre

# ── pad brillante (acordes abiertos) con intensidad por sección
def pad_level(t):
    pts = [(0, 0.25), (2, 0.55), (4.45, 0.45), (11, 0.5), (22.4, 0.8), (23.0, 0.55), (47.0, 0.8), (62.3, 0.95), (63.3, 0.9), (67.4, 0.0)]
    return np.interp(t, [q[0] for q in pts], [q[1] for q in pts])
for bar in range(int(DUR / BAR) + 1):
    t0 = bar * BAR; seg = int((BAR + 0.5) * SR); s = np.zeros(seg)
    for m in CH[bar % 4]:
        for dd in (-0.005, 0.0, 0.005): s += saw(midi(m + 12), seg, harm=7, det=dd)
    env = np.minimum(1, tt(seg) / 0.25) * np.minimum(1, (BAR + 0.5 - tt(seg)) / 0.5)
    s = lp(s, 1100 + 2200 * pad_level(t0), 2) * env * 0.022 * pad_level(t0 + 1)
    add(s, t0 - 0.05, 1.0, pan=-0.3, rev=0.5); add(np.roll(s, 331), t0 - 0.05, 1.0, pan=0.3, rev=0.5)

# ── batería: bombo en negras, palmas en 2 y 4, hi-hat abierto a contratiempo y cerrado en semicorcheas
kicks = []
for b in range(int(DUR / BEAT)):
    t = b * BEAT
    if inside(t, FULL): kicks.append((t, 0.9))
    elif INTRO_END <= t < 11.0: kicks.append((t, 0.6))
    elif END_GROOVE <= t < 66.3 and b % 2 == 0: kicks.append((t, 0.45))
for t, g in kicks: add(kick(g), t, 0.9)
duck = np.ones(N)
for t, g in kicks:
    i = int(t * SR); n = int(0.35 * SR)
    seg = 1 - 0.55 * g * np.exp(-tt(n) * 11)
    duck[i:i + n] = np.minimum(duck[i:i + n], seg[: len(duck[i:i + n])])
def ohat(g):
    n = int(0.16 * SR); t = tt(n)
    return hp(rng.standard_normal(n), 6500, 4) * np.exp(-t * 22) * g
for s16 in range(int(DUR / (BEAT / 4))):
    t = s16 * BEAT / 4
    on = inside(t, FULL) or INTRO_END <= t < 11.0
    if not on: continue
    if s16 % 4 == 2: add(ohat(0.05 if inside(t, FULL) else 0.03), t, 1.0, pan=0.25)
    elif inside(t, FULL): add(hat(0.022 if s16 % 2 else 0.012), t, 1.0, pan=-0.25)
for b in range(int(DUR / BEAT)):
    t = b * BEAT
    if inside(t, FULL) and b % 2 == 1: add(clap(0.2), t, 1.0, rev=0.45)
    # redoble de palmas antes de cada respiro
for t_end in (22.4, 46.5, 62.3):
    for k in range(8): add(clap(0.05 + 0.02 * k), t_end - 1.0 + k * BEAT / 4, 1.0, rev=0.3)

# ── bajo saltarín: contratiempos con octava, raíz del acorde
BASS = np.zeros(N)
for s16 in range(int(DUR / (BEAT / 4))):
    t = s16 * BEAT / 4
    if not (inside(t, FULL) or INTRO_END <= t < 11.0): continue
    pos = s16 % 8
    if pos not in (2, 5, 6) and not (inside(t, FULL) and pos == 0): continue
    n = int(0.2 * SR); tn = tt(n)
    f = midi(ROOT[chord_at(t)] + 12 + (12 if pos == 5 else 0))
    s = (np.sin(2 * np.pi * f * tn) + 0.45 * np.sin(2 * np.pi * 2 * f * tn) + 0.15 * np.sin(2 * np.pi * 3 * f * tn)) * np.minimum(1, tn / 0.004) * np.exp(-tn * 10)
    i = int(t * SR); BASS[i:i + n] += s[: N - i] * 0.24
BASS = lp(BASS, 900) * duck
L += BASS; R += BASS

# ── acordes staccato sincopados (tipo piano house) + arpegio pluck
STAB = np.zeros(N)
for s16 in range(int(DUR / (BEAT / 4))):
    t = s16 * BEAT / 4
    if not inside(t, FULL) or (s16 % 16) not in (2, 6, 9, 12, 14): continue
    n = int(0.22 * SR); tn = tt(n); s = np.zeros(n)
    for m in CH[chord_at(t)]:
        f = midi(m + 12); s += np.sin(2 * np.pi * f * tn) + 0.35 * np.sin(2 * np.pi * 2 * f * tn) + 0.12 * np.sin(2 * np.pi * 3 * f * tn)
    s *= np.minimum(1, tn / 0.003) * np.exp(-tn * 14) * 0.03
    i = int(t * SR); STAB[i:i + n] += s[: N - i]
STAB *= duck
add(STAB, 0, 1.0, pan=-0.15, rev=0.35); add(np.roll(STAB, 220), 0, 0.8, pan=0.2, rev=0.35)
ARP = np.zeros(N); ARPR = np.zeros(N)
pattern = [0, 1, 2, 3, 2, 1, 3, 2]
for s16 in range(int(DUR / (BEAT / 4))):
    t = s16 * BEAT / 4
    if not (inside(t, FULL) or (INTRO_END <= t < 11 ) or (63.3 <= t < 66.8 and s16 % 2 == 0)): continue
    m = CH[chord_at(t)][pattern[s16 % 8]] + 24
    n = int(0.25 * SR); tn = tt(n); f = midi(m)
    tone = np.sin(2 * np.pi * f * tn) + 0.3 * np.sin(2 * np.pi * 2 * f * tn) + 0.1 * np.sin(2 * np.pi * 3 * f * tn)
    s = tone * np.exp(-tn * 18) * (0.55 + 0.45 * ((s16 % 4) == 0)) * 0.034
    i = int(t * SR); (ARP if s16 % 2 == 0 else ARPR)[i:i + n] += s[: N - i]
ARP *= duck; ARPR *= duck
L += ARP * 0.9 + ARPR * 0.4; R += ARP * 0.4 + ARPR * 0.9
RL += (ARP + ARPR) * 0.3; RR += (ARP + ARPR) * 0.3

# ── melodía principal (marimba), pentatónica de Re mayor, frase de 2 compases
def marimba(f, g=1.0):
    n = int(0.6 * SR); t = tt(n)
    s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t * 30) + 0.1 * np.sin(2 * np.pi * 10 * f * t) * np.exp(-t * 60)
    return s * np.minimum(1, t / 0.002) * np.exp(-t * 7) * g
PHRASE = [(0, 74), (1, 78), (2, 81), (3, 83), (5, 81), (6, 78), (8, 76), (9, 78), (10, 81), (12, 86), (14, 83), (15, 81)]   # en corcheas
for a0, b0 in LEAD:
    t = a0 - (a0 % BAR)
    while t < b0:
        for k, m in PHRASE:
            tk = t + k * BEAT / 2
            if a0 <= tk < b0: add(marimba(midi(m), 0.07), tk, 1.0, pan=0.15 * ((k % 3) - 1), rev=0.45)
        t += 2 * BAR

def chime(notes, t0, step=0.09, g=0.05):
    for j, m in enumerate(notes): add(bell(midi(m), 1.4), t0 + j * step, g, pan=-0.5 + j / max(1, len(notes) - 1), rev=0.8)

# campanas musicales de la intro (parte de la música; los efectos van en scripts/sfx.py)
for i, (t0, m) in enumerate([(0.1, 74), (0.5, 78), (0.9, 81), (1.3, 85)]): add(bell(midi(m + 12)), t0, 0.05, pan=(-0.5 if i % 2 else 0.5), rev=0.9)
chime([86, 90, 93, 98], 63.35, 0.12, 0.05)

# ── reverb por convolución
n_ir = int(2.6 * SR); t_ir = tt(n_ir)
irL = rng.standard_normal(n_ir) * np.exp(-t_ir * 2.6); irR = rng.standard_normal(n_ir) * np.exp(-t_ir * 2.6)
irL = lp(irL, 6000); irR = lp(irR, 6000)
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
