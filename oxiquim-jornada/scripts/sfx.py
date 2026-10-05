"""Efectos de sonido sincronizados con index.html, en la línea de las librerías de UI/motion (clics limpios,
swipes, pops, risers, golpes suaves de sub, brillos). Todo sintetizado.

Relojes (como en index.html): t = absoluto · u = t − 0.8 · v = t − 1.8 · w = t − 10.2
Los tiempos con dispersión aleatoria (personas de las escenas 7 y 10) se leen de out/cues.json
(node scripts/export_cues.mjs), así coinciden cuadro a cuadro con la animación.

build(N, SR) → (L, R) en bus seco + envío a reverb ya mezclado. El nivel final lo fija audio.py,
que mantiene el bus de efectos por debajo de la música."""
import json
import os
import numpy as np
from scipy.signal import butter, sosfilt

D5, D6, D8 = 0.8, 1.8, 10.2


def build(N, SR):
    rng = np.random.default_rng(2026)
    L = np.zeros(N); R = np.zeros(N); RL = np.zeros(N); RR = np.zeros(N)
    tt = lambda n: np.arange(n) / SR
    midi = lambda m: 440.0 * 2 ** ((m - 69) / 12)
    hp = lambda x, f, o=2: sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
    lp = lambda x, f, o=2: sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
    bp = lambda x, lo, hi, o=2: sosfilt(butter(o, [max(20, lo), min(SR / 2 - 100, hi)], 'band', fs=SR, output='sos'), x)
    PENTA = [74, 76, 78, 81, 83, 86, 88, 90, 93, 95, 98]          # Re mayor pentatónica (como la música)

    def add(sig, t0, g=1.0, pan=0.0, pan_to=None, rev=0.15):
        """Coloca una señal mono; pan_to hace un barrido estéreo durante el sonido."""
        i = int(round(t0 * SR))
        if i >= N or g <= 0: return
        if i < 0: sig = sig[-i:]; i = 0
        sig = sig[: N - i]; n = len(sig)
        pn = np.full(n, pan) if pan_to is None else np.linspace(pan, pan_to, n)
        gl, gr = g * np.sqrt(0.5 * (1 - pn)), g * np.sqrt(0.5 * (1 + pn))
        L[i:i + n] += sig * gl; R[i:i + n] += sig * gr
        RL[i:i + n] += sig * gl * rev; RR[i:i + n] += sig * gr * rev

    def env_ar(n, a, r_shape=2.0):
        """Ataque lineal en fracción a, caída con curva."""
        x = np.linspace(0, 1, n); e = np.where(x < a, x / max(a, 1e-6), (1 - (x - a) / (1 - a)) ** r_shape)
        return e

    def ola_filter(n, design):
        """Ruido filtrado con un filtro que cambia en el tiempo: bloques con 50 % de solape y ventana Hann
        (sin saltos entre bloques). design(u∈[0,1]) → sos."""
        nz = rng.standard_normal(n + 4096); out = np.zeros(n); hop = 512; win = np.hanning(2 * hop + 1)[:-1]
        for a0 in range(-hop, n, hop):
            u = min(1, max(0, (a0 + hop) / max(1, n)))
            seg = sosfilt(design(u), nz[max(0, a0 + 4096 - 2048): a0 + 4096 + 2 * hop])[-2 * hop:]
            lo, hi = max(0, a0), min(n, a0 + 2 * hop)
            if hi > lo: out[lo:hi] += (seg * win)[lo - a0: hi - a0]
        return out

    def sweep_noise(dur, f0, f1, q=0.7, shape=1.0, a=0.35, r=2.0):
        """Ruido por un pasabanda cuyo centro recorre f0→f1 (base de swipes y whooshes)."""
        n = int(dur * SR)
        def design(u):
            fc = f0 * (f1 / f0) ** (u ** shape)
            return butter(2, [max(20, fc * (1 - q / 2)), min(SR / 2 - 100, fc * (1 + q / 2))], 'band', fs=SR, output='sos')
        return ola_filter(n, design) * env_ar(n, a, r) / 3

    def click(f=3200, dur=0.018):
        n = int(dur * SR); t = tt(n)
        s = np.sin(2 * np.pi * f * t) * np.exp(-t * 320) + hp(rng.standard_normal(n), 5000) * np.exp(-t * 900) * 0.4
        return s

    def pop(f=900, dur=0.14):
        n = int(dur * SR); t = tt(n); fr = f * (1 + 1.2 * np.exp(-t * 90))
        s = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 28) * np.minimum(1, t / 0.002)
        c = click(f * 3, 0.01); return s + np.pad(c, (0, n - len(c)))

    def bloop(f=600, dur=0.22):
        n = int(dur * SR); t = tt(n); fr = f * (1 + 0.7 * (1 - np.exp(-t * 40)))
        return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 16) * np.minimum(1, t / 0.004)

    def ping(f=1760, dur=0.6):
        n = int(dur * SR); t = tt(n)
        return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 14)) * np.exp(-t * 7)

    def swipe(dur=0.45, f0=500, f1=4000, a=0.45):
        return sweep_noise(dur, f0, f1, q=0.9, a=a, r=2.2)

    def air(dur=1.0, rise=True):
        return sweep_noise(dur, 250 if rise else 3500, 3500 if rise else 250, q=1.2, shape=1.6 if rise else 0.7, a=0.75 if rise else 0.15, r=1.5)

    def zip_(dur=0.8, f0=700, f1=2600):
        n = int(dur * SR); t = tt(n); fr = f0 * (f1 / f0) ** (t / dur)
        tone = np.sin(2 * np.pi * np.cumsum(fr) / SR) * 0.35
        grit = bp(rng.standard_normal(n), 1800, 6500) * (0.6 + 0.4 * np.sin(2 * np.pi * 37 * t)) * 0.5
        return (tone + grit) * env_ar(n, 0.1, 1.2)

    def scribble(dur):
        n = int(dur * SR); t = tt(n)
        am = np.abs(lp(rng.standard_normal(n), 30)); am /= am.max() + 1e-9
        return bp(rng.standard_normal(n), 2200, 6000) * (0.3 + am) * env_ar(n, 0.15, 1.0) * 0.6

    def snap():
        n = int(0.5 * SR); t = tt(n)
        thump = np.sin(2 * np.pi * (90 + 120 * np.exp(-t * 60)) * t) * np.exp(-t * 30)
        metal = (np.sin(2 * np.pi * 1870 * t) + 0.6 * np.sin(2 * np.pi * 2930 * t)) * np.exp(-t * 14) * 0.35
        c = click(4200, 0.015); return thump * 0.8 + metal + np.pad(c, (0, n - len(c)))

    def hit(dur=1.4, sub=55):
        n = int(dur * SR); t = tt(n)
        f = sub + 70 * np.exp(-t * 25)
        body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5)
        trans = hp(rng.standard_normal(n), 2500) * np.exp(-t * 60) * 0.35
        return body + trans

    def shimmer(dur=1.0, base=0, n_notes=6, rise=True):
        n = int(dur * SR); t = tt(n); s = np.zeros(n)
        for k in range(n_notes):
            m = PENTA[(base + k) % len(PENTA)] + (12 if k >= len(PENTA) - base else 0)
            st = (k / n_notes) * dur * 0.5 if rise else rng.uniform(0, dur * 0.4)
            i0 = int(st * SR); m_n = n - i0; tk = tt(m_n)
            s[i0:] += np.sin(2 * np.pi * midi(m) * tk) * np.exp(-tk * 5) * (0.75 + 0.25 * np.sin(2 * np.pi * 9 * tk))
        return s / n_notes * 2.2 * env_ar(n, 0.05, 1.0)

    def riser(dur):
        n = int(dur * SR); t = tt(n); u = t / dur
        f = 220 * 2 ** (2.2 * u ** 1.5)
        tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.3
        return (tone + sweep_noise(dur, 300, 7000, q=1.0, shape=2.0, a=0.97, r=1.0) * 2.5) * u ** 2

    def rumble(dur=1.2, up=True):
        n = int(dur * SR); t = tt(n)
        s = lp(rng.standard_normal(n), 160, 4) * 3
        return s * env_ar(n, 0.35 if up else 0.1, 1.6)

    def thud(f=95):
        n = int(0.35 * SR); t = tt(n)
        return np.sin(2 * np.pi * (f + 80 * np.exp(-t * 40)) * t) * np.exp(-t * 18) + lp(rng.standard_normal(n), 900) * np.exp(-t * 50) * 0.3

    def whistle_down(dur=0.15, f0=2400, f1=900):
        n = int(dur * SR); t = tt(n); fr = f0 * (f1 / f0) ** (t / dur)
        return np.sin(2 * np.pi * np.cumsum(fr) / SR) * env_ar(n, 0.2, 1.0) * 0.5

    def focus(dur=1.0):
        n = int(dur * SR)
        out = ola_filter(n, lambda u: butter(2, 300 * (6000 / 300) ** u, 'low', fs=SR, output='sos'))
        return out * env_ar(n, 0.8, 1.0) * 0.8

    def marker(dur=0.8):
        n = int(dur * SR); t = tt(n)
        rough = 0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 23 * t + rng.uniform(0, 6)))
        return bp(rng.standard_normal(n), 900, 3200) * rough * env_ar(n, 0.08, 0.8) * 0.8

    def morph(dur=1.1, f0=520, f1=880):
        n = int(dur * SR); t = tt(n); fr = f0 * (f1 / f0) ** (0.5 - 0.5 * np.cos(np.pi * t / dur))
        s = np.sin(2 * np.pi * np.cumsum(fr) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(fr * 1.5) / SR)
        return s * np.sin(np.pi * t / dur) ** 2 * 0.4 + air(dur, True) * 0.6

    def swarm(t0, dur, rate_fn, g=0.06, fmin=2200, fmax=7000, panw=0.9):
        """Nube de micro-clics (partículas): rate_fn(x∈[0,1]) = clics por segundo."""
        t = t0
        while t < t0 + dur:
            x = (t - t0) / dur; r = max(1.0, rate_fn(x))
            add(click(rng.uniform(fmin, fmax), 0.012), t, g * rng.uniform(0.5, 1.0), pan=rng.uniform(-panw, panw), rev=0.25)
            t += rng.exponential(1 / r)

    def text_in(t0, g=0.08, pan=0.0):
        """Entrada de un bloque de texto: swipe brillante y corto."""
        add(swipe(0.38, 1500, 6500, a=0.3), t0, g, pan=pan - 0.15, pan_to=pan + 0.15, rev=0.2)

    def inv_ease(e, y):
        lo, hi = 0.0, 1.0
        for _ in range(40):
            m = (lo + hi) / 2
            lo, hi = (m, hi) if e(m) < y else (lo, m)
        return (lo + hi) / 2
    inOutCubic = lambda x: 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
    inOutQuint = lambda x: 16 * x ** 5 if x < .5 else 1 - (-2 * x + 2) ** 5 / 2
    outQuint = lambda x: 1 - (1 - x) ** 5

    cues_path = os.path.join(os.path.dirname(__file__), '..', 'out', 'cues.json')
    cues = json.load(open(cues_path))

    # ═════════ 0 · Marca (t)
    add(pop(1400), 0.05, 0.5)
    add(ping(1760, 0.8), 0.15, 0.12, rev=0.6)
    add(scribble(1.15), 0.35, 0.22, pan=-0.35, pan_to=0.35)                     # trazo del isotipo
    add(hit(1.2, 60), 1.05, 0.35); add(air(0.8, False), 1.05, 0.25, rev=0.4)    # relleno
    add(swipe(0.9, 500, 2400), 1.75, 0.16, pan=0.3, pan_to=-0.3)                # isotipo se desplaza
    for i in range(6): add(click(2400 + i * 150), 2.2 + i * 0.07, 0.22, pan=-0.3 + i * 0.12)   # letras
    add(shimmer(0.9, 3, 5), 2.95, 0.18, pan=-0.6, pan_to=0.6, rev=0.5)         # brillo
    add(riser(0.75), 3.7, 0.4)                                                  # zoom al hexágono
    add(hit(1.6, 50), 4.45, 0.55, rev=0.3)
    add(swipe(1.0, 3800, 350, a=0.08), 4.45, 0.3, rev=0.4)                      # iris
    # ═════════ 1 · Título (t)
    swarm(4.9, 1.9, lambda x: 25 + 140 * np.sin(np.pi * min(1, x * 1.1)) , g=0.05)   # datos que se ordenan
    add(snap(), 6.6, 0.28)                                                      # el título encaja
    text_in(5.0, 0.07)
    add(zip_(0.9, 900, 2600), 5.6, 0.07)                                        # subrayado
    add(swipe(0.6, 300, 4500, a=0.6), 6.95, 0.22, pan=-0.7, pan_to=0.5)         # «A LA ACCIÓN» entra
    for i in range(12): add(click(1800 + i * 90, 0.012), 7.12 + i * 0.045, 0.1, pan=-0.5 + i * 0.09)
    add(hit(0.9, 70), 7.25, 0.2)
    add(zip_(1.1, 600, 2200), 7.5, 0.08, pan=-0.6, pan_to=0.6)                  # flecha
    add(pop(1200), 8.55, 0.22, pan=0.6)
    swarm(10.75, 0.5, lambda x: 160 * (1 - x) + 20, g=0.05)                     # el título se deshace
    add(air(1.2, True), 10.7, 0.12)
    swarm(11.2, 1.7, lambda x: 90 * np.sin(np.pi * x) + 10, g=0.04)            # vuelo al gráfico
    # ═════════ 2 · Resultados (t)
    text_in(11.55)
    add(zip_(1.0, 500, 1500), 11.6, 0.05)                                       # línea base
    n = int(2.2 * SR); x = np.arange(n) / n; scan_f = 400 * 6 ** (0.5 - 0.5 * np.cos(np.pi * x))
    scan = np.sin(2 * np.pi * np.cumsum(scan_f) / SR) * 0.25 + sweep_noise(2.2, 400, 2400, q=0.5, shape=1.0, a=0.5, r=1.0) * 1.5
    add(scan * np.sin(np.pi * x) ** 0.7, 12.4, 0.1, pan=-0.2, pan_to=0.2)       # escaneo
    for k in range(9): add(click(2600 + k * 110, 0.012), 12.55 + k * 0.22, 0.06, pan=-0.8 + k * 0.2)
    add(marker(0.8), 12.9, 0.12, pan=-0.2, pan_to=0.3)                          # resaltado
    add(air(0.5, True), 16.85, 0.08)
    # ═════════ 3 · Plan (t)
    swarm(17.1, 1.8, lambda x: 90 * np.sin(np.pi * x) + 10, g=0.04)
    text_in(17.45)
    add(shimmer(0.8, 0, 4, rise=False), 18.5, 0.1, rev=0.5); add(hit(0.8, 80), 18.55, 0.12)
    for bi in range(6):
        add(zip_(0.45, 500 + bi * 60, 1300 + bi * 120), 19.2 + bi * 0.12, 0.035, pan=-0.4 + bi * 0.16)
        add(pop(midi(PENTA[bi])), 19.3 + bi * 0.14 + 0.18, 0.16, pan=-0.2 + bi * 0.12)
    for k in range(12): add(click(3000, 0.01), 19.45 + k * 0.11, 0.035, pan=-0.3 + k * 0.05)   # ruta punteada
    # ═════════ 4 · Oficina (t)
    add(air(1.1, True), 22.7, 0.12)
    for k in range(20):                                                         # las baldosas encajan
        tk = 22.75 + k * 0.018 + inv_ease(inOutQuint, 0.97) * 1.15
        add(click(1500 + (k % 4) * 260, 0.014), tk, 0.08, pan=-0.6 + (k % 4) * 0.4)
    text_in(23.5)
    add(swipe(0.3, 900, 5000, a=0.5), 24.95, 0.14, pan=-0.2); add(swipe(0.3, 5000, 900, a=0.2), 25.25, 0.14, pan=0.2)   # volteo
    add(ping(midi(86), 0.5), 25.25, 0.08)
    add(pop(700, 0.18), 25.5, 0.22); add(shimmer(0.5, 4, 3), 25.6, 0.06)        # se eleva
    text_in(26.2)
    for k, tk in enumerate((26.45, 26.53, 26.6, 26.7)):                         # caen las demás
        add(swipe(0.7, 2200 - k * 200, 300, a=0.15), tk, 0.08, pan=rng.uniform(-0.7, 0.7))
    add(morph(1.6, 440, 660), 26.7, 0.12, rev=0.5)                              # se vuelve sol
    n = int(10.2 * SR); x = np.arange(n) / n                                   # aire libre (paisaje)
    wind = lp(rng.standard_normal(n), 700) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.23 * np.arange(n) / SR)) * np.minimum(1, x * 6) * np.minimum(1, (1 - x) * 4)
    add(wind, 27.4, 0.05, rev=0.4)
    # ═════════ 5 · Un lugar por confirmar (u)
    for li in range(4): add(rumble(1.3), 28.5 + li * 0.08 * 2.2 + D5, 0.22, pan=-0.3 + li * 0.2)
    add(air(1.0, True), 28.4 + D5, 0.1)
    text_in(29.6 + D5)
    add(hit(1.2, 65), 29.95 + D5 + 0.25, 0.22); add(shimmer(0.8, 2, 5), 30.0 + D5, 0.08, rev=0.5)   # «un lugar»
    add(pop(980, 0.16), 30.6 + D5 + 0.2, 0.16); add(ping(midi(90), 0.5), 30.6 + D5 + 0.25, 0.05, rev=0.5)   # «por confirmar»
    for k in range(5): add(bloop(1200, 0.12), 30.6 + D5 + 1.1 * (k + 1), 0.025, rev=0.3)                   # el punto late
    for k in range(12): add(click(2800, 0.01), 30.4 + D5 + k * 0.08, 0.035, pan=0.3 - k * 0.05)   # ruta
    add(whistle_down(0.13), 31.0 + D5, 0.07)
    t_land = 31.0 + D5 + 0.165 * 0.75
    add(thud(), t_land, 0.3, pan=-0.35); add(pop(520, 0.16), t_land, 0.12, pan=-0.35)
    add(bloop(560), t_land + 0.05, 0.1, pan=-0.35, rev=0.4)                      # onda
    for k, ((a, b), x) in enumerate(zip(((32.25, 32.8), (33.05, 33.6)), (0.1, 0.5))):   # el pin salta buscando
        add(swipe(0.4, 700, 2600, a=0.5), a + D5, 0.09, pan=x - 0.4, pan_to=x)
        add(pop(560 + 140 * k, 0.16), b + D5, 0.13, pan=x); add(bloop(620 + 140 * k), b + D5 + 0.05, 0.08, pan=x, rev=0.4)
        for j in range(3): add(click(2600 + 200 * j, 0.01), a + D5 + 0.1 + j * 0.12, 0.03, pan=x)   # la ruta se recalcula
    add(shimmer(0.9, 6, 3), 33.75 + D5, 0.05, pan=0.5, rev=0.5)                 # queda flotando
    add(pop(420, 0.2), 31.85 + D5 + 0.12, 0.25); add(swipe(0.35, 600, 3000), 31.8 + D5, 0.08)     # calendario
    for k in range(1, 7):                                                       # número 1 → 7
        tk = 32.05 + D5 + inv_ease(inOutQuint, k / 6) * 1.05
        add(click(2200 + k * 120, 0.016), tk, 0.12 if k < 6 else 0.2)
    add(air(0.9, False), 36.35 + D5, 0.12)                                      # se hunden los cerros
    add(rumble(0.8, False), 36.4 + D5, 0.12)
    add(morph(1.15, 660, 990), 36.75 + D5, 0.1, rev=0.5)                        # sol → núcleo
    # ═════════ 6 · ¿Para qué nos reuniremos? (v)
    for i in range(1, 7): add(bloop(220 + i * 40, 0.25), 35.9 + i * 0.06 + D6, 0.07, pan=(-1) ** i * 0.3)
    text_in(36.25 + D6)
    add(focus(1.0), 36.5 + D6, 0.12); add(snap(), 37.5 + D6, 0.16)               # entra en foco
    for t0 in (37.25, 38.1, 38.75, 39.4): text_in(t0 + D6, 0.05)
    HIT = 40.15
    add(riser(1.0), HIT - 1.0 + D6, 0.25, pan=-0.6, pan_to=0.0)                 # cometa
    add(hit(1.4, 58), HIT + D6, 0.35); add(shimmer(1.0, 4, 6), HIT + D6, 0.1, rev=0.5)
    for i in range(1, 7): add(bloop(300 + i * 50, 0.2), HIT + D6 + i * 0.06 + 0.05, 0.05)
    add(air(0.8, False), 44.35 + D6, 0.1)
    # ═════════ 7 · Equipo (v)
    for i, d in enumerate(cues['team']):
        ang = i / 12 * 2 * np.pi - np.pi / 2
        ta = 44.75 + d + inv_ease(outQuint, 0.92) * 1.2 + D6
        add(pop(midi(PENTA[i % 8])), ta, 0.13, pan=0.7 * np.cos(ang))
    for i in range(12):                                                         # el anillo se conecta
        tk = 45.95 + inv_ease(inOutCubic, i / 12) * 0.95 + D6
        add(click(2600 + i * 80, 0.012), tk, 0.07, pan=0.7 * np.cos(i / 12 * 2 * np.pi - np.pi / 2))
    add(air(0.9, True), 46.4 + D6, 0.06)
    text_in(45.3 + D6)
    add(air(0.65, False), 50.35 + D6, 0.1)
    # ═════════ 8 · Tarjetas (w)
    text_in(43.1 + D8)
    for k, kt in enumerate((43.85, 45.05, 46.25)):
        add(swipe(0.5, 400, 3200, a=0.5), kt + D8 - 0.05, 0.14, pan=-0.2 + 0.2 * k)
        add(thud(140), kt + D8 + 0.35, 0.1)
    add(pop(880), 43.85 + 0.3 + 0.62 * 1.5 + D8, 0.16)                         # lentes se funden
    add(swipe(0.5, 1200, 2600, a=0.5), 45.05 + 0.3 + 0.15 * 1.5 + D8, 0.06)     # barras se ordenan
    add(click(3600, 0.02), 45.05 + 0.3 + 0.75 * 1.5 + D8, 0.14)                 # ✓
    for k in range(8): add(click(3000, 0.01), 46.25 + 0.3 + k * 0.12 + D8, 0.03)
    add(pop(990), 46.25 + 0.3 + 0.8 * 1.5 + D8, 0.16)                          # nodo de la ruta
    for i in range(3): add(swipe(0.4, 800, 4000, a=0.3), 51.15 + i * 0.07 + D8, 0.08, pan=-0.3 + 0.3 * i)
    # ═════════ 9 · Nos vemos allá (w)
    for i in range(13):
        if i == 3: continue                                              # espacios
        add(pop(midi(PENTA[i % len(PENTA)]), 0.12), 51.75 + i * 0.05 + 0.165 + D8, 0.1, pan=-0.6 + i * 0.075)
    add(hit(1.2, 62), 52.35 + D8, 0.22)
    for k in range(26):                                                         # confeti
        add(click(rng.uniform(4000, 9000), 0.01), 52.35 + D8 + rng.exponential(0.35), 0.05, pan=rng.uniform(-0.9, 0.9), rev=0.4)
    add(shimmer(1.2, 5, 6), 52.4 + D8, 0.1, rev=0.6)
    add(air(0.6, False), 55.15 + D8, 0.08)
    # ═════════ 10 · R35 (w)
    for q in cues['people']:                                                    # llegan las personas
        ta = 55.55 + q['d'] + inv_ease(outQuint, 0.9) * 1.25 + D8
        add(lp(click(rng.uniform(1400, 2600), 0.02), 3500), ta, 0.035, pan=(q['x'] - 540) / 600)
    add(air(1.6, True), 55.4 + D8, 0.08)
    text_in(57.6 + D8)
    add(hit(1.0, 60), 57.6 + D8 + 0.4, 0.16)
    add(riser(1.3), 61.75 + D8, 0.22)                                           # convergen al isotipo
    swarm(61.75 + D8, 1.5, lambda x: 120 * np.sin(np.pi * x) + 10, g=0.035)
    add(hit(1.8, 50), 63.3 + D8, 0.45, rev=0.3)                                # aparece la marca
    for i in range(6): add(click(2400 + i * 150), 63.55 + i * 0.07 + D8, 0.16, pan=-0.3 + i * 0.12)
    add(shimmer(1.0, 3, 6), 64.8 + D8, 0.14, pan=-0.6, pan_to=0.6, rev=0.6)     # brillo final

    # reverb corta (sala pequeña) propia del bus de efectos
    from scipy.signal import fftconvolve
    n_ir = int(1.1 * SR); t_ir = tt(n_ir)
    irL = lp(rng.standard_normal(n_ir) * np.exp(-t_ir * 5.5), 7000); irR = lp(rng.standard_normal(n_ir) * np.exp(-t_ir * 5.5), 7000)
    irL /= np.sqrt(np.sum(irL ** 2)); irR /= np.sqrt(np.sum(irR ** 2))
    L += fftconvolve(RL, irL)[:N] * 0.45; R += fftconvolve(RR, irR)[:N] * 0.45
    return hp(L, 40), hp(R, 40)
