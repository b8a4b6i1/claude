"""Efectos de sonido del video introductorio, en la línea de las librerías de motion de Ocular Sounds
(clics limpios, swipes, pops tonales, risers, golpes de sub suaves, brillos). Todo sintetizado.
Tiempos absolutos sincronizados con index.html; los retardos de personas y tarjetas se leen de out/cues.json
(node scripts/export_cues.mjs). build(N, SR) → (L, R). El nivel final lo fija audio.py (bajo la música)."""
import json
import os
import numpy as np
from scipy.signal import butter, sosfilt



OFF = 2 * 63.1 / 26        # la bienvenida (index.html) desplaza todo lo posterior dos compases


def build(N, SR):
    SHIFT = [0.0]
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
        i = int(round((t0 + SHIFT[0]) * SR))
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


    cues = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'out', 'cues.json')))
    outExpo = lambda x: 1 if x >= 1 else 1 - 2 ** (-10 * x)
    def arrive(t0, d, e, frac=0.9): return t0 + inv_ease(e, frac) * d   # instante en que una animación llega al 90 %

    # ═════════ 0 · Marca: se abre desde su núcleo
    add(focus(1.1), 0.25, 0.16)
    add(pop(1100, 0.16), 0.38, 0.3); add(ping(1480, 0.9), 0.4, 0.08, rev=0.6)
    add(hit(1.2, 62), 0.42, 0.22)
    for i in range(6): add(click(2300 + i * 140), arrive(1.05 + i * 0.07, 0.8, outExpo, 0.6), 0.16, pan=-0.3 + i * 0.12)   # letras
    add(shimmer(0.9, 3, 5), 2.15, 0.14, pan=-0.6, pan_to=0.6, rev=0.5)          # brillo
    # ═════════ Bienvenida: el logo sube y aparece el nombre de la jornada
    add(swipe(1.0, 400, 2200, a=0.55), 3.15, 0.1, pan=0.0)
    text_in(3.6, 0.06); text_in(4.05, 0.08)
    add(shimmer(1.0, 2, 5), 4.6, 0.06, rev=0.6)
    add(air(0.5, False), 3.1 + OFF, 0.07)
    SHIFT[0] = OFF                                                              # desde aquí, tiempos del resto del video (+ OFF)
    for i in range(6): add(click(3000 - i * 140, 0.012), 3.3 + (5 - i) * 0.04 + 0.2, 0.07, pan=0.3 - i * 0.12)   # letras se van
    add(air(0.7, False), 3.55, 0.12)                                            # el isotipo vuelve a su núcleo
    add(morph(0.8, 760, 520), 3.55, 0.1)
    add(swipe(0.8, 500, 3000, a=0.55), 4.1, 0.14, pan=-0.4, pan_to=0.5)         # el punto viaja
    add(pop(700, 0.16), 4.88, 0.26, pan=0.4); add(thud(120), 4.9, 0.12)         # se posa como punto final
    # ═════════ 1 · Hoy nos detenemos.
    text_in(4.85, 0.07); text_in(5.95, 0.06)
    add(air(0.55, False), 9.3, 0.08)
    # ═════════ 2 · Primero, escuchamos.
    add(swipe(0.9, 700, 2400, a=0.6), 9.45, 0.1, pan=0.3, pan_to=0.45)          # el punto baja
    add(zip_(0.95, 600, 1700), 10.0, 0.07, pan=0.2, pan_to=0.6)                 # se estira: línea base
    add(focus(0.9), 10.15, 0.1)                                                 # vidrio
    text_in(10.45, 0.07, -0.4); text_in(11.1, 0.05, -0.4)
    for i in range(7): add(bloop(midi(PENTA[i]) / 2, 0.2), arrive(10.95 + i * 0.07, 1.25, outExpo, 0.5), 0.09 if i != 3 else 0.14, pan=0.25 + i * 0.06)
    add(air(0.6, False), 14.85, 0.08)
    for i in range(7):
        if i != 3: add(click(1700 - i * 60, 0.014), 15.3 + i * 0.02, 0.04, pan=0.4)
    add(morph(1.0, 880, 520), 15.2, 0.1, pan=0.45, pan_to=0.0)                  # la barra se contrae
    add(pop(520, 0.18), 16.1, 0.2)                                              # una voz
    # ═════════ 3 · Luego, conversamos.
    for v in cues['voices']:
        ta = arrive(16.75 + abs(v['i'] - 6.5) * 0.035, 1.1, outExpo, 0.55)
        add(pop(midi(PENTA[(v['i'] * 3) % 8]), 0.12), ta, 0.09, pan=(v['rx'] - 960) / 1100)
    text_in(16.95, 0.07); text_in(17.5, 0.05)
    for g in range(4):
        gx = [420, 800, 1180, 1540][g]
        add(swipe(0.7, 900, 2600, a=0.5), 18.5 + g * 0.07, 0.05, pan=(gx - 960) / 1100)
        add(thud(150 + g * 12), arrive(18.5 + g * 0.07, 1.25, inOutQuint), 0.08, pan=(gx - 960) / 1100)
    for gi, t0 in [(1, 19.8), (3, 20.25), (0, 20.7), (2, 21.15)]:              # cada grupo conversa
        gx = [420, 800, 1180, 1540][gi]
        for k in range(3): add(ping(midi(PENTA[2 + (gi + k) % 5]) / 2, 0.5), t0 + k * 0.11, 0.035, pan=(gx - 960) / 1000, rev=0.5)
    add(air(0.5, False), 22.3, 0.06)
    # ═════════ 4 · Después, priorizamos.
    for v in cues['voices']: add(zip_(0.35, 900, 2200), 22.6 + v['i'] * 0.025 + 0.25, 0.012, pan=(v['cx'] - 960) / 1100)
    text_in(23.1, 0.07); text_in(23.75, 0.05)
    for g in range(4):                                                          # cada uno ordena su columna
        gx = [420, 800, 1180, 1540][g]
        add(swipe(0.5, 1200, 3000, a=0.5), 24.4 + g * 0.1 + 0.1, 0.05, pan=(gx - 960) / 1100)
        add(click(2600 + g * 160, 0.016), arrive(24.4 + g * 0.1, 1.05, inOutQuint), 0.12, pan=(gx - 960) / 1100)
    add(air(1.2, True), 25.9, 0.06)                                             # juntos
    for oi, vi in enumerate(cues['order']):
        v = cues['voices'][vi]
        add(click(2000 + v['th'] * 220, 0.014), arrive(26.0 + oi * 0.035, 1.3, inOutQuint, 0.95), 0.08, pan=-0.3 + 0.05 * oi)
    add(snap(), 28.0, 0.16)                                                     # la prioridad se funde
    add(air(0.45, False), 28.35, 0.06)
    # ═════════ 5 · Y fundamentamos.
    add(swipe(1.1, 400, 3200, a=0.6), 28.8, 0.14, pan=0.0, pan_to=0.45)         # la fila se vuelve panel
    add(focus(1.0), 29.0, 0.1)
    text_in(29.25, 0.07, -0.4); text_in(29.85, 0.05, -0.4)
    add(zip_(0.6, 800, 2000), 30.0, 0.05, pan=0.3)
    for j in range(3): add(pop(midi(PENTA[3 + j]), 0.12), 30.45 + j * 0.22, 0.1, pan=0.25); add(zip_(0.5, 1000, 2400), 30.5 + j * 0.22, 0.025, pan=0.35)
    for k in range(10): add(click(3400, 0.01), 31.0 + k * 0.055, 0.025, pan=0.2 + k * 0.05)   # línea de meta
    n = int(1.55 * SR); x = np.arange(n) / n; f = 420 * 2.6 ** x
    add(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * x) ** 0.5 * 0.3 + sweep_noise(1.55, 500, 2600, q=0.5, a=0.6, r=1.0) * 1.2, 31.25, 0.07, pan=0.2, pan_to=0.6)   # el indicador sube
    add(pop(midi(93), 0.14), 32.8, 0.14, pan=0.6); add(ping(midi(98), 0.7), 32.82, 0.05, pan=0.6, rev=0.5)
    add(air(0.5, False), 34.45, 0.07)
    add(morph(1.2, 700, 440), 34.9, 0.08, pan=0.5, pan_to=0.0)                  # se aplana: camino
    add(air(1.1, True), 35.0, 0.05)
    # ═════════ 6 · Para salir con…
    text_in(36.35, 0.05)
    for k, (mt, mo) in enumerate([(36.8, 39.35), (40.2, 42.55), (43.4, 45.6)]):
        add(pop(midi(PENTA[2 + 2 * k]), 0.16), mt + 0.12, 0.2); add(ping(midi(PENTA[4 + 2 * k]) , 0.8), mt + 0.14, 0.04, rev=0.6)
        text_in(mt + 0.15, 0.07)
        add(air(0.45, False), mo, 0.05)
    for t0 in (39.4, 42.6): add(swipe(0.95, 300, 1800, a=0.5), t0, 0.12, pan=0.7, pan_to=-0.7)   # la cámara avanza
    add(air(1.2, False), 45.8, 0.08)                                            # se abre el plano
    swarm(47.0, 0.7, lambda x: 60 * (1 - x) + 8, g=0.025); add(pop(600, 0.14), 47.75, 0.12)
    # ═════════ 7 · Acuerdos
    text_in(47.45, 0.06, -0.5)
    add(swipe(0.5, 600, 2600, a=0.5), 47.75, 0.1, pan=-0.8, pan_to=-0.5)        # pestaña
    for k, at in enumerate([48.0, 50.7, 53.4, 56.1]):
        if k:                                                                   # contador mecánico
            add(click(1900, 0.02), at - 0.2 + 0.32, 0.12, pan=-0.6); add(click(2500, 0.012), at + 0.4, 0.07, pan=-0.6)
        text_in(at, 0.08); add(thud(110), at + 0.35, 0.07)
        add(air(0.45, False), at + 2.3 if k < 3 else 58.0, 0.05)
    # ═════════ 8 · Y al final del día
    text_in(58.6, 0.05); text_in(59.1, 0.08)
    add(shimmer(0.9, 2, 5), 59.6, 0.05, rev=0.6)
    add(air(0.5, False), 62.6, 0.07)
    # ═════════ 9 · ¡Vamos a trabajar!
    add(riser(1.25), 61.85, 0.3)
    add(hit(1.8, 48), 63.1, 0.5, rev=0.3); add(snap(), 63.1, 0.14)
    add(air(0.9, False), 63.1, 0.12, rev=0.4)
    add(shimmer(1.2, 4, 6), 63.2, 0.08, rev=0.6)
    swarm(65.55, 0.7, lambda x: 220 * np.sin(np.pi * x) + 20, g=0.03)          # las letras se vuelven personas
    for q in cues['people']:                                                    # caminan hasta formar R35
        ta = arrive(66.15 + q['d'], 1.4, outQuint, 0.9)
        add(lp(click(rng.uniform(1300, 2400), 0.02), 3200), ta, 0.03, pan=(q['x'] - 960) / 1000)
    add(air(1.6, True), 65.9, 0.06)
    text_in(67.75, 0.08); add(hit(1.0, 60), 68.15, 0.14)
    add(air(0.45, False), 72.05, 0.06)
    # ═════════ 10 · Marca
    add(riser(1.4), 72.5, 0.18)
    swarm(72.4, 1.5, lambda x: 120 * np.sin(np.pi * x) + 10, g=0.025)
    add(hit(1.8, 50), 73.95, 0.42, rev=0.3)
    for i in range(6): add(click(2300 + i * 140), arrive(74.3 + i * 0.07, 0.8, outExpo, 0.6), 0.14, pan=-0.3 + i * 0.12)
    add(shimmer(1.0, 3, 6), 75.7, 0.12, pan=-0.6, pan_to=0.6, rev=0.6)

    # reverb corta (sala pequeña) propia del bus de efectos
    from scipy.signal import fftconvolve
    n_ir = int(1.1 * SR); t_ir = tt(n_ir)
    irL = lp(rng.standard_normal(n_ir) * np.exp(-t_ir * 5.5), 7000); irR = lp(rng.standard_normal(n_ir) * np.exp(-t_ir * 5.5), 7000)
    irL /= np.sqrt(np.sum(irL ** 2)); irR /= np.sqrt(np.sum(irR ** 2))
    L += fftconvolve(RL, irL)[:N] * 0.45; R += fftconvolve(RR, irR)[:N] * 0.45
    return hp(L, 40), hp(R, 40)
