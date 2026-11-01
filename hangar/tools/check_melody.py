import sys, numpy as np
sys.path.insert(0, 'tools'); import chiptune as C
a = C.load(sys.argv[1], 0, 0); b = C.load(sys.argv[2], 0, 0); n = min(len(a), len(b)); a, b = a[:n], b[:n]
ma, sa, _ = C.salience_track(a, 4096, 512, 55, 84); mb, sb, _ = C.salience_track(b, 4096, 512, 55, 84)
ea, _ = C.band_energy(a, 200, 1800, 512); eb, _ = C.band_energy(b, 200, 1800, 512); m = min(len(ma), len(mb), len(ea), len(eb))
ma, mb, ea, eb = np.round(ma[:m]), np.round(mb[:m]), ea[:m], eb[:m]
v = (ea > 0.25 * np.percentile(ea, 90)) & (eb > 0.25 * np.percentile(eb, 90))
ex = float(np.mean(ma[v] == mb[v])); pc = float(np.mean((ma[v] - mb[v]) % 12 == 0)); oc = float(np.mean(np.abs(ma[v] - mb[v]) <= 1))
sh = int(7 / (512 / 22050)); mb2 = np.roll(mb, sh); exc = float(np.mean(ma[v] == mb2[v])); pcc = float(np.mean((ma[v] - mb2[v]) % 12 == 0))
print('frames compared %d | same note %.0f%%, same pitch class %.0f%%, within 1 semitone %.0f%% | chance (chiptune shifted 7 s): same note %.0f%%, same pitch class %.0f%%' % (v.sum(), 100 * ex, 100 * pc, 100 * oc, 100 * exc, 100 * pcc))
