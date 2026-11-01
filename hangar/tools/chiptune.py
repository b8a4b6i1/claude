#!/usr/bin/env python3
"""
Song -> NES-style chiptune.

1. analysis: central melody (pitch salience + Viterbi), bass line, chords on a beat grid, kick / snare / hat onsets
2. re-synthesis with the channel structure of the NES APU: 2 pulse channels (4-bit volume, 12.5/25/50/75 % duty),
   1 triangle channel (32 steps, 4 bit, no volume), 1 noise channel (15-bit LFSR, 16 period settings), mixed with the
   APU's non-linear DAC formulas.
usage: chiptune.py in.mp3 out_prefix [start_s] [dur_s]
"""
import subprocess, sys, wave, numpy as np
from scipy.signal import stft, resample_poly, butter, sosfilt
from scipy.ndimage import uniform_filter1d, median_filter

SR_A = 22050                   # analysis rate
SR_R = 88200                   # render rate (decimated to 44100)
CPU = 1789773.0
NOISE_PERIOD = [4, 8, 16, 32, 64, 96, 128, 160, 202, 254, 380, 508, 762, 1016, 2034, 4068]

def load(path, start, dur):
    cmd = ['ffmpeg', '-v', 'error', '-ss', str(start)] + (['-t', str(dur)] if dur else []) + ['-i', path, '-ac', '1', '-ar', str(SR_A), '-f', 'f32le', '-']
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32).astype(np.float64)

def salience_track(y, nfft, hop, mlo, mhi, step=0.25, lam=0.55, nh=5):
    f, t, X = stft(y, SR_A, nperseg=nfft, noverlap=nfft - hop, boundary=None, padded=False)
    mag = np.abs(X) ** 0.6
    mag = mag / (uniform_filter1d(mag, 60, axis=0) + 1e-6)               # whiten across frequency
    grid = np.arange(mlo, mhi + 1e-9, step); fq = 440 * 2 ** ((grid - 69) / 12)
    S = np.zeros((len(grid), mag.shape[1]))
    for h in range(1, nh + 1):
        pos = fq * h * nfft / SR_A; i0 = np.clip(np.floor(pos).astype(int), 0, mag.shape[0] - 2); fr = (pos - i0)[:, None]
        S += (0.8 ** (h - 1)) * ((1 - fr) * mag[i0] + fr * mag[i0 + 1])
    S /= S.max(0, keepdims=True) + 1e-9
    D = np.minimum(np.abs(grid[:, None] - grid[None, :]), 7.0) * lam           # transition cost between pitch states
    n = S.shape[1]; cost = np.zeros(S.shape); back = np.zeros(S.shape, dtype=np.int32); cost[:, 0] = -S[:, 0]
    for j in range(1, n):
        tot = cost[:, j - 1][None, :] + D; back[:, j] = np.argmin(tot, 1); cost[:, j] = tot[np.arange(len(grid)), back[:, j]] - S[:, j] ** 2
    path = np.zeros(n, dtype=int); path[-1] = np.argmin(cost[:, -1])
    for j in range(n - 1, 0, -1): path[j - 1] = back[path[j], j]
    return grid[path], S.max(0), t

def band_energy(y, lo, hi, hop):
    f, t, X = stft(y, SR_A, nperseg=2048, noverlap=2048 - hop, boundary=None, padded=False)
    k = (f >= lo) & (f < hi); return np.sqrt((np.abs(X[k]) ** 2).sum(0)), t

def notes_from_track(m, voiced, hop_s, minlen=0.07, gap=0.05, msz=5):
    mm = np.round(m).astype(int); mm = median_filter(mm, msz)
    out = []; i = 0; n = len(mm); mf = int(minlen / hop_s)
    while i < n:
        if not voiced[i]: i += 1; continue
        j = i
        while j + 1 < n and voiced[j + 1] and mm[j + 1] == mm[i]: j += 1
        out.append([i, j + 1, int(mm[i])]); i = j + 1
    merged = []
    for a, b, p in out:                                             # join same-pitch notes separated by short gaps
        if merged and merged[-1][2] == p and (a - merged[-1][1]) * hop_s <= gap: merged[-1][1] = b
        else: merged.append([a, b, p])
    return [x for x in merged if x[1] - x[0] >= mf]

def peaks(env, hop_s, mind, k=1.1, win=25):
    mu = uniform_filter1d(env, win); sd = np.sqrt(uniform_filter1d((env - mu) ** 2, win))
    c = env > mu + k * sd; res = []; last = -1e9
    for i in np.where(c)[0]:
        if env[i] >= env[max(0, i - 2):i + 3].max() and i * hop_s - last >= mind: res.append(i); last = i * hop_s
    return res

def analyse(y):
    hop = 512; hop_s = hop / SR_A
    mel_m, mel_s, t = salience_track(y, 4096, hop, 55, 84)
    bas_m, bas_s, tb = salience_track(y, 8192, hop, 28, 52, lam=0.7, nh=4)
    e_mel, _ = band_energy(y, 200, 1800, hop); e_bas, _ = band_energy(y, 40, 200, hop)
    nF = min(len(mel_m), len(bas_m), len(e_mel), len(e_bas)); mel_m, mel_s, bas_m, bas_s, e_mel, e_bas = [a[:nF] for a in (mel_m, mel_s, bas_m, bas_s, e_mel, e_bas)]
    sm = lambda a, w: uniform_filter1d(a, w)
    v_mel = (e_mel > 0.18 * sm(e_mel, 400).max()) & (mel_s > 0) & (sm(e_mel, 3) > 0.35 * sm(e_mel, 120))
    v_bas = (e_bas > 0.2 * sm(e_bas, 400).max()) & (sm(e_bas, 3) > 0.3 * sm(e_bas, 120))
    mel = notes_from_track(mel_m, v_mel, hop_s); bas = notes_from_track(bas_m, v_bas, hop_s, 0.09)
    # --- beat grid from onset strength
    f, tt, X = stft(y, SR_A, nperseg=1024, noverlap=1024 - hop, boundary=None, padded=False); L = np.log1p(np.abs(X) * 30)
    flux = np.maximum(0, np.diff(L, axis=1)); full = np.r_[0, flux.sum(0)][:nF]
    ac = np.correlate(full - full.mean(), full - full.mean(), 'full')[len(full) - 1:]
    lo, hi = int(0.30 / hop_s), int(0.75 / hop_s); beat = (lo + np.argmax(ac[lo:hi])) * hop_s
    # --- chords: chroma per half-bar
    pcs = np.zeros((12, nF)); kf = np.arange(X.shape[0]) * SR_A / 1024
    for k, fr in enumerate(kf):
        if 90 < fr < 2000: pcs[int(round(12 * np.log2(fr / 440) + 69)) % 12] += np.abs(X[k, :nF]) ** 1.0
    tpl = np.zeros((24, 12)); 
    for r in range(12):
        tpl[r, [r, (r + 4) % 12, (r + 7) % 12]] = 1; tpl[12 + r, [r, (r + 3) % 12, (r + 7) % 12]] = 1
    seg = beat * 2; nseg = int(np.ceil(nF * hop_s / seg)); chords = []
    for s in range(nseg):
        a = int(s * seg / hop_s); b = min(nF, int((s + 1) * seg / hop_s)); v = pcs[:, a:b].sum(1)
        if v.sum() < 1e-6: chords.append(None); continue
        v = v / v.max(); sc = tpl @ v - 0.15 * (tpl.sum(1) * 0 + 1) * (np.arange(24) >= 12)         # slight preference for major on ties
        c = int(np.argmax(sc)); chords.append((c % 12, c >= 12))
    # --- percussion
    ek, _ = band_energy(y, 40, 150, hop); eh, _ = band_energy(y, 4000, 10500, hop); em, _ = band_energy(y, 150, 3000, hop)
    dk = np.maximum(0, np.diff(np.log1p(ek[:nF] * 20), prepend=0)); dh = np.maximum(0, np.diff(np.log1p(eh[:nF] * 40), prepend=0)); dm = np.maximum(0, np.diff(np.log1p(em[:nF] * 20), prepend=0))
    kicks = peaks(dk, hop_s, 0.25, 1.4); snares = peaks(np.minimum(dm, dh * 1.3 + dm * 0.3), hop_s, 0.3, 1.6); hats = peaks(dh, hop_s, 0.12, 1.0)
    snares = [i for i in snares if min([abs(i - k) for k in kicks] + [99]) > 3]; hats = [i for i in hats if min([abs(i - k) for k in kicks + snares] + [99]) > 2]
    loud = lambda e, i0, i1: float(np.mean(e[i0:i1]))
    return dict(hop_s=hop_s, nF=nF, mel=mel, bas=bas, mel_m=mel_m, e_mel=e_mel, e_bas=e_bas, beat=beat, chords=chords, seg=seg, kicks=kicks, snares=snares, hats=hats)

# ---------------------------------------------------------------------------------------------- synthesis (NES APU style)
def lfsr_seq():
    reg = 1; out = np.zeros(32767, dtype=np.uint8)
    for i in range(32767):
        out[i] = reg & 1; fb = (reg & 1) ^ ((reg >> 1) & 1); reg = (reg >> 1) | (fb << 14)
    return out

def render(an, dur):
    N = int(dur * SR_R); tt = np.arange(N) / SR_R; hop_s = an['hop_s']
    def phase(freq): return np.mod(np.cumsum(freq / SR_R), 1.0)
    def note_arrays(notes, vol_of, vib=True):
        f = np.zeros(N); v = np.zeros(N)
        for a, b, p in notes:
            s0, s1 = int(a * hop_s * SR_R), min(N, int(b * hop_s * SR_R))
            if s0 >= N: break
            n = s1 - s0; k = np.arange(n) / SR_R; base = 440 * 2 ** ((p - 69) / 12)
            fv = base * (2 ** ((0.22 * np.sin(2 * np.pi * 5.5 * np.maximum(0, k - 0.18)) * np.minimum(1, np.maximum(0, k - 0.18) * 5)) / 12) if vib and n / SR_R > 0.35 else 1.0)
            f[s0:s1] = fv; vv = vol_of(a, b, k); v[s0:s1] = vv
        return f, v
    # melody -> pulse 1 (50 %): 4-bit volume from loudness, decaying like an APU envelope
    emax = np.percentile(an['e_mel'], 97)
    def mvol(a, b, k):
        lv = np.clip(np.mean(an['e_mel'][a:b]) / emax, 0, 1); start = 7 + 8 * lv; dec = np.maximum(3, start - k * 7.0)
        return np.floor(np.minimum(15, dec))
    fm, vm = note_arrays(an['mel'], mvol)
    ph = phase(fm); p1 = (ph < 0.5) * vm
    # bass -> triangle (4-bit, 32 steps, no volume control)
    fb, vb = note_arrays(an['bas'], lambda a, b, k: np.ones_like(k), vib=False)
    ph = phase(fb); tri = np.floor((1 - np.abs(2 * ph - 1)) * 15.999) * (vb > 0)
    # chords -> arpeggio on pulse 2 (25 %), 8th notes of the detected beat
    f2 = np.zeros(N); v2 = np.zeros(N); st = an['beat'] / 2; k0 = 0
    for s, ch in enumerate(an['chords']):
        if ch is None: continue
        root, minor = ch; iv = [0, 3 if minor else 4, 7, 12]; t0 = s * an['seg']; steps = int(an['seg'] / st)
        for j in range(steps):
            a = int((t0 + j * st) * SR_R); b = min(N, int((t0 + (j + 1) * st * 0.85) * SR_R))
            if a >= N: break
            m = 60 + (root - 60) % 12 + iv[j % 4] - 12 * 0
            f2[a:b] = 440 * 2 ** ((m + 12 - 69) / 12); n = b - a; v2[a:b] = np.maximum(2, 7 - np.arange(n) / SR_R * 18)
    ph = phase(f2); p2 = (ph < 0.25) * np.floor(v2)
    # percussion -> noise channel, LFSR clocked by the 4-bit period setting
    seq = lfsr_seq(); nz = np.zeros(N); nlev = np.zeros(N)
    def hit(idx, per, length, level):
        a = int(idx * hop_s * SR_R); n = int(length * SR_R); b = min(N, a + n)
        if a >= N: return
        k = np.arange(b - a) / SR_R; pos = (np.floor(k * CPU / NOISE_PERIOD[per]).astype(int)) % 32767
        env = np.floor(level * np.maximum(0, 1 - k / length) ** 1.3); bit = seq[pos]
        nz[a:b] = np.maximum(nz[a:b], (1 - bit) * env)
    for i in an['kicks']: hit(i, 13, 0.16, 13)
    for i in an['snares']: hit(i, 9, 0.13, 11)
    for i in an['hats']: hit(i, 5, 0.04, 7)
    # APU mixer (non-linear DAC)
    pulse = np.where((p1 + p2) > 0, 95.88 / (8128.0 / np.maximum(p1 + p2, 1e-9) + 100), 0.0)
    tnd = 159.79 / (1.0 / (tri / 8227.0 + nz / 12241.0 + 1e-12) + 100)
    mix = pulse + tnd
    mix = resample_poly(mix, 1, 2); mix -= mix.mean()
    sos = butter(2, 30, 'hp', fs=44100, output='sos'); mix = sosfilt(sos, mix)
    mix /= np.abs(mix).max() / 0.92
    return mix, (p1, p2, tri, nz)

def write16(path, x, sr=44100):
    w = wave.open(path, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes()); w.close()
def write8(path, x, sr):
    w = wave.open(path, 'wb'); w.setnchannels(1); w.setsampwidth(1); w.setframerate(sr); w.writeframes((np.clip(np.round(x * 127 + 128), 0, 255)).astype(np.uint8).tobytes()); w.close()


# ---------------------------------------------------------------------------------------------- voice-only mode
def load_stereo(path, start, dur):
    cmd = ['ffmpeg', '-v', 'error', '-ss', str(start)] + (['-t', str(dur)] if dur else []) + ['-i', path, '-ac', '2', '-ar', str(SR_A), '-f', 'f32le', '-']
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32).reshape(-1, 2).astype(np.float64)

def voice_mag(st, nfft, hop, power=2.0, moving=False):
    """magnitude of the centre-panned part of the mix (where lead vocals usually sit): mid * centre_weight^power"""
    f, t, XL = stft(st[:, 0], SR_A, nperseg=nfft, noverlap=nfft - hop, boundary=None, padded=False)
    _, _, XR = stft(st[:, 1], SR_A, nperseg=nfft, noverlap=nfft - hop, boundary=None, padded=False)
    a, b = np.abs(XL), np.abs(XR); centre = 1 - np.abs(a - b) / (a + b + 1e-9)
    M = np.abs((XL + XR) / 2) * centre ** power
    if moving:                                                             # keep what moves: remove each bin's slowly varying background (held notes, drones)
        bg = median_filter(M, size=(1, int(1.6 / (hop / SR_A)) | 1), mode='nearest'); M = np.maximum(0, M - 1.15 * bg)
    return f, t, M

def analyse_voice(st, mlo=62, mhi=84, lam=0.5, power=2.0, moving=False):
    hop = 512; hop_s = hop / SR_A; nfft = 4096
    f, t, M = voice_mag(st, nfft, hop, power, moving)
    # mask the bass line and its overtones (they otherwise win the pitch search): bass f0 from the 100-way low register
    fb_, tb_, Mb = voice_mag(st, 8192, hop, power); bg = np.arange(26, 50.01, 0.25); bfq = 440 * 2 ** ((bg - 69) / 12); Sb = np.zeros((len(bg), Mb.shape[1]))
    for h in range(1, 5):
        pos = bfq * h * 8192 / SR_A; i0 = np.clip(np.floor(pos).astype(int), 0, Mb.shape[0] - 2); Sb += (0.8 ** (h - 1)) * Mb[i0]
    nb = min(Sb.shape[1], M.shape[1]); bf0 = bfq[np.argmax(Sb[:, :nb], 0)]
    M = M[:, :nb].copy(); n_ = M.shape[1]
    for j in range(n_):
        for h in range(1, 13):
            c = bf0[j] * h * nfft / SR_A; lo, hi = int(np.floor(c - 1.3)), int(np.ceil(c + 1.3)) + 1
            if 0 <= lo < M.shape[0]: M[max(0, lo):min(M.shape[0], hi), j] *= 0.08
    mag = M ** 0.6; mag = mag / (uniform_filter1d(mag, 60, axis=0) + 1e-6)
    grid = np.arange(mlo, mhi + 1e-9, 0.25); fq = 440 * 2 ** ((grid - 69) / 12)
    S = np.zeros((len(grid), mag.shape[1]))
    for h in range(1, 6):
        pos = fq * h * nfft / SR_A; i0 = np.clip(np.floor(pos).astype(int), 0, mag.shape[0] - 2); fr = (pos - i0)[:, None]
        S += (0.8 ** (h - 1)) * ((1 - fr) * mag[i0] + fr * mag[i0 + 1])
    S /= S.max(0, keepdims=True) + 1e-9
    D = np.minimum(np.abs(grid[:, None] - grid[None, :]), 7.0) * lam
    n = S.shape[1]; cost = np.zeros(S.shape); back = np.zeros(S.shape, dtype=np.int32); cost[:, 0] = -S[:, 0]
    for j in range(1, n):
        tot = cost[:, j - 1][None, :] + D; back[:, j] = np.argmin(tot, 1); cost[:, j] = tot[np.arange(len(grid)), back[:, j]] - S[:, j] ** 2
    path = np.zeros(n, dtype=int); path[-1] = np.argmin(cost[:, -1])
    for j in range(n - 1, 0, -1): path[j - 1] = back[path[j], j]
    m = grid[path]
    k = (f >= 160) & (f < 1400); e = np.sqrt((M[k] ** 2).sum(0)); sm = lambda a, w: uniform_filter1d(a, w)
    voiced = (e > 0.22 * np.percentile(e, 95)) & (sm(e, 3) > 0.3 * sm(e, 150))
    mel = notes_from_track(m, voiced, hop_s, 0.09, 0.06)
    return dict(hop_s=hop_s, nF=n, mel=mel, e_mel=e, mel_m=m, t=t, voiced=voiced)

def render_voice(an, dur, duty=0.5):
    N = int(dur * SR_R); hop_s = an['hop_s']; f = np.zeros(N); v = np.zeros(N); emax = np.percentile(an['e_mel'], 97)
    for a, b, p in an['mel']:
        s0, s1 = int(a * hop_s * SR_R), min(N, int(b * hop_s * SR_R))
        if s0 >= N: break
        n = s1 - s0; k = np.arange(n) / SR_R; base = 440 * 2 ** ((p - 69) / 12); late = np.maximum(0, k - 0.2)
        f[s0:s1] = base * 2 ** ((0.2 * np.sin(2 * np.pi * 5.5 * late) * np.minimum(1, late * 5)) / 12)
        lv = np.clip(np.mean(an['e_mel'][a:b]) / emax, 0, 1); v[s0:s1] = np.floor(np.minimum(15, np.maximum(4, 8 + 7 * lv - k * 4.0)))
    ph = np.mod(np.cumsum(f / SR_R), 1.0); p1 = (ph < duty) * v
    mix = np.where(p1 > 0, 95.88 / (8128.0 / np.maximum(p1, 1e-9) + 100), 0.0)
    mix = resample_poly(mix, 1, 2); mix -= mix.mean(); mix = sosfilt(butter(2, 30, 'hp', fs=44100, output='sos'), mix); mix /= np.abs(mix).max() / 0.92
    return mix, p1

# ---------------------------------------------------------------------------------------------- polyphonic mode (vocal stems / choirs)
def poly_tracks(mono, nvoices=3, mlo=43, mhi=84, lam=0.5):
    """iterative multi-F0: pick the best pitch track, cancel its harmonics, repeat. Returns [(track_midi, raw_peak_salience)] and the frame energy."""
    nfft, hop = 4096, 512
    f, t, X = stft(mono, SR_A, nperseg=nfft, noverlap=nfft - hop, boundary=None, padded=False)
    mag0 = np.abs(X); grid = np.arange(mlo, mhi + 1e-9, 0.25); fq = 440 * 2 ** ((grid - 69) / 12)
    out = []; mag = mag0.copy()
    for v in range(nvoices):
        w = mag ** 0.6; w = w / (uniform_filter1d(w, 60, axis=0) + 1e-6)
        S = np.zeros((len(grid), w.shape[1]))
        for h in range(1, 7):
            pos = fq * h * nfft / SR_A; i0 = np.clip(np.floor(pos).astype(int), 0, w.shape[0] - 2); fr = (pos - i0)[:, None]
            S += (0.85 ** (h - 1)) * ((1 - fr) * w[i0] + fr * w[i0 + 1])
        raw = S.max(0); Sn = S / (raw[None, :] + 1e-9)
        D = np.minimum(np.abs(grid[:, None] - grid[None, :]), 7.0) * lam
        n = S.shape[1]; cost = np.zeros(S.shape); back = np.zeros(S.shape, dtype=np.int32); cost[:, 0] = -Sn[:, 0]
        for j in range(1, n):
            tot = cost[:, j - 1][None, :] + D; back[:, j] = np.argmin(tot, 1); cost[:, j] = tot[np.arange(len(grid)), back[:, j]] - Sn[:, j] ** 2
        path = np.zeros(n, dtype=int); path[-1] = np.argmin(cost[:, -1])
        for j in range(n - 1, 0, -1): path[j - 1] = back[path[j], j]
        m = grid[path]; out.append((m, raw))
        for j in range(n):                                              # cancel this voice and its overtones before looking for the next one
            f0 = 440 * 2 ** ((m[j] - 69) / 12)
            for h in range(1, 11):
                c = f0 * h * nfft / SR_A; lo, hi = int(np.floor(c - 1.4)), int(np.ceil(c + 1.4)) + 1
                if 0 <= lo < mag.shape[0]: mag[max(0, lo):min(mag.shape[0], hi), j] *= 0.12
    e = np.sqrt((mag0[(f >= 150) & (f < 2500)] ** 2).sum(0))
    return out, e, hop / SR_A

def analyse_poly(mono, nvoices=3, **kw):
    tr, e, hop_s = poly_tracks(mono, nvoices, **kw); n = len(e)
    loud = e > 0.07 * np.percentile(e, 95)
    r0 = tr[0][1]; voices = []
    for i, (m, raw) in enumerate(tr):
        rel = raw / (np.percentile(r0, 90) + 1e-9)
        voiced = loud & (rel > (0.30 if i else 0.15)) & (uniform_filter1d(rel, 3) > 0.2)
        notes = notes_from_track(m, voiced, hop_s, 0.16, 0.08, 11)
        voices.append(notes)
    order = sorted(range(len(voices)), key=lambda i: -np.mean([p for a, b, p in voices[i]] or [0]))   # high -> low
    return dict(hop_s=hop_s, voices=[voices[i] for i in order], e=e)

def render_poly(an, dur):
    N = int(dur * SR_R); hop_s = an['hop_s']; emax = np.percentile(an['e'], 97)
    def chan(notes, level_fn):
        f = np.zeros(N); v = np.zeros(N)
        for a, b, p in notes:
            s0, s1 = int(a * hop_s * SR_R), min(N, int(b * hop_s * SR_R))
            if s0 >= N: break
            n = s1 - s0; k = np.arange(n) / SR_R; late = np.maximum(0, k - 0.25)
            f[s0:s1] = 440 * 2 ** ((p - 69) / 12) * 2 ** ((0.15 * np.sin(2 * np.pi * 5.2 * late) * np.minimum(1, late * 4)) / 12); v[s0:s1] = level_fn(a, b, k)
        return f, v
    lv = lambda a, b: np.clip(np.mean(an['e'][a:b]) / emax, 0, 1)
    ph = lambda f: np.mod(np.cumsum(f / SR_R), 1.0)
    f1, v1 = chan(an['voices'][0], lambda a, b, k: np.floor(np.minimum(15, np.maximum(5, 9 + 6 * lv(a, b) - k * 3.0))))
    p1 = (ph(f1) < 0.5) * v1
    p2 = np.zeros(N); tri = np.zeros(N)
    if len(an['voices']) > 1:
        f2, v2 = chan(an['voices'][1], lambda a, b, k: np.floor(np.minimum(13, np.maximum(4, 7 + 5 * lv(a, b) - k * 2.5))))
        p2 = (ph(f2) < 0.25) * v2
    if len(an['voices']) > 2:
        f3, v3 = chan(an['voices'][2], lambda a, b, k: np.ones_like(k))
        tri = np.floor((1 - np.abs(2 * ph(f3) - 1)) * 15.999) * (v3 > 0)
    pulse = np.where((p1 + p2) > 0, 95.88 / (8128.0 / np.maximum(p1 + p2, 1e-9) + 100), 0.0)
    tnd = 159.79 / (1.0 / (tri / 8227.0 + 1e-12) + 100)
    mix = resample_poly(pulse + tnd, 1, 2); mix -= mix.mean(); mix = sosfilt(butter(2, 30, 'hp', fs=44100, output='sos'), mix); mix /= np.abs(mix).max() / 0.92
    return mix, (p1, p2, tri)

def analyse_tonic(mono, nvoices=3):
    """one voice only: the lowest sounding voice at every instant (the root of the harmony, the 'tonic' voice). Also reports the tonic pitch class by key-profile matching."""
    tr, e, hop_s = poly_tracks(mono, nvoices); n = len(e); loud = e > 0.07 * np.percentile(e, 95); r0 = tr[0][1]
    low = np.full(n, np.inf)
    for i, (m, raw) in enumerate(tr):
        rel = raw / (np.percentile(r0, 90) + 1e-9); v = loud & (rel > (0.30 if i else 0.15)) & (uniform_filter1d(rel, 3) > 0.2)
        low = np.where(v & (np.round(m) < low), np.round(m), low)
    voiced = np.isfinite(low); m = np.where(voiced, low, 0.0)
    notes = notes_from_track(m, voiced, hop_s, 0.16, 0.08, 11)
    hist = np.zeros(12)
    for a, b, p in notes: hist[p % 12] += (b - a) * hop_s
    maj = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]); mnr = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
    best = max(((np.corrcoef(hist, np.roll(pr, r))[0, 1], r, nm) for r in range(12) for pr, nm in ((maj, 'major'), (mnr, 'minor'))))
    return dict(hop_s=hop_s, voices=[notes], e=e, hist=hist, key=best)

if __name__ == '__main__':
    src, out = sys.argv[1], sys.argv[2]; start = float(sys.argv[3]) if len(sys.argv) > 3 else 0.0; dur = float(sys.argv[4]) if len(sys.argv) > 4 else 0.0
    if '--tonic' in sys.argv:
        mono = load(src, start, dur); an = analyse_tonic(mono); total = len(mono) / SR_A; mix, ch = render_poly(an, total)
        write16(out + '-tonic-44k.wav', mix); write8(out + '-tonic-22k-u8.wav', resample_poly(mix, 1, 2), 22050)
        NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']; v = an['voices'][0]; tot = sum(b - a for a, b, p in v) or 1
        import json; print(json.dumps(dict(seconds=round(total, 1), notes=len(v), range=[int(min(n[2] for n in v)), int(max(n[2] for n in v))], key=NAMES[an['key'][1]] + ' ' + an['key'][2], key_corr=round(float(an['key'][0]), 2), share_on_tonic_pct=round(100 * sum(b - a for a, b, p in v if p % 12 == an['key'][1]) / tot, 0), pitch_class_share_pct={NAMES[i]: round(100 * float(an['hist'][i] / an['hist'].sum()), 0) for i in np.argsort(-an['hist'])[:5]}))); sys.exit(0)
    if '--poly' in sys.argv:
        mono = load(src, start, dur); an = analyse_poly(mono); total = len(mono) / SR_A; mix, ch = render_poly(an, total)
        write16(out + '-poly-44k.wav', mix); write8(out + '-poly-22k-u8.wav', resample_poly(mix, 1, 2), 22050)
        import json; print(json.dumps(dict(seconds=round(total, 1), notes_per_voice=[len(v) for v in an['voices']], ranges=[[int(min(n[2] for n in v)), int(max(n[2] for n in v))] if v else None for v in an['voices']], pulse1_levels=int(ch[0].max()) + 1, pulse2_levels=int(ch[1].max()) + 1, tri_levels=int(ch[2].max()) + 1))); sys.exit(0)
    if '--voice' in sys.argv:
        st = load_stereo(src, start, dur); an = analyse_voice(st, **({'mlo': 52, 'mhi': 76, 'power': 0.0, 'moving': True} if '--moving' in sys.argv else {})); total = len(st) / SR_A; mix, p1 = render_voice(an, total)
        write16(out + '-voice-44k.wav', mix); write8(out + '-voice-22k-u8.wav', resample_poly(mix, 1, 2), 22050)
        import json; print(json.dumps(dict(seconds=round(total, 1), notes=len(an['mel']), range=[int(min(n[2] for n in an['mel'])), int(max(n[2] for n in an['mel']))], voiced_pct=round(100 * float(np.mean(an['voiced'])), 1), pulse_levels=int(p1.max()) + 1))); sys.exit(0)
    y = load(src, start, dur); an = analyse(y); total = len(y) / SR_A
    mix, ch = render(an, total)
    write16(out + '-chip-44k.wav', mix); write8(out + '-chip-22k-u8.wav', resample_poly(mix, 1, 2), 22050)
    import json
    print(json.dumps(dict(seconds=round(total, 1), beat_s=round(an['beat'], 3), bpm=round(60 / an['beat'], 1), melody_notes=len(an['mel']), bass_notes=len(an['bas']), chords=len([c for c in an['chords'] if c]), kicks=len(an['kicks']), snares=len(an['snares']), hats=len(an['hats']),
        melody_range=[int(min(n[2] for n in an['mel'])), int(max(n[2] for n in an['mel']))], pulse1_levels=int(ch[0].max()) + 1, tri_levels=int(ch[2].max()) + 1, noise_levels=int(ch[3].max()) + 1)))
