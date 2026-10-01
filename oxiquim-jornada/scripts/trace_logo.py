"""Vectoriza el PNG original del logo Oxiquim (sin redibujarlo): la silueta es la isolínea 50 % del alfa
original, sobremuestreada y trazada con potrace. Exporta un path por pieza (isotipo + 6 letras)."""
import json, sys, os
import numpy as np
from PIL import Image
import potrace
from scipy import ndimage

SRC = sys.argv[1] if len(sys.argv) > 1 else 'assets/oxiquim-logo-original.png'
UP = 16
im = Image.open(SRC).convert('RGBA')
a = np.asarray(im)[:, :, 3].astype(np.float64) / 255.0
rgb = np.asarray(im)[:, :, :3][a > 0.95]
color = '#%02x%02x%02x' % tuple(np.round(np.median(rgb, axis=0)).astype(int))
H, W = a.shape
SIGMA = float(os.environ.get('SIGMA', 0.3)); ALPHAMAX = float(os.environ.get('ALPHAMAX', 0.7)); OPTTOL = float(os.environ.get('OPTTOL', 0.4))
# alfa original → bilineal ×UP → suavizado leve (quita el escalonado del remuestreo) → isolínea 0,5
big = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).resize((W * UP, H * UP), Image.BILINEAR)).astype(np.float64) / 255.0
big = ndimage.gaussian_filter(big, SIGMA * UP)
bm = big > 0.5
lab, n = ndimage.label(bm)
objs = ndimage.find_objects(lab)
# agrupa componentes por columna (el isotipo puede tener piezas separadas)
# isotipo = piezas que empiezan en el primer tercio (anillo + hexágono interior); el resto, una letra cada una
comps = sorted([(sl[1].start, i + 1) for i, sl in enumerate(objs)])
groups = [{'ids': [i for x0, i in comps if x0 < W * UP * 0.3]}] + [{'ids': [i]} for x0, i in comps if x0 >= W * UP * 0.3]
names = ['mark', 'X', 'I', 'Q', 'U', 'I2', 'M']
assert len(groups) == 7, len(groups)
out = {'color': color, 'w': W, 'h': H, 'parts': {}}
for name, g in zip(names, groups):
    m = np.isin(lab, g['ids'])
    bmp = potrace.Bitmap(~m)  # potracer traza los píxeles en False
    plist = bmp.trace(turdsize=20, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=ALPHAMAX, opticurve=True, opttolerance=OPTTOL)
    d = []
    for curve in plist:
        s = curve.start_point; d.append(f'M{s.x/UP:.3f} {s.y/UP:.3f}')
        for seg in curve.segments:
            if seg.is_corner:
                d.append(f'L{seg.c.x/UP:.3f} {seg.c.y/UP:.3f}L{seg.end_point.x/UP:.3f} {seg.end_point.y/UP:.3f}')
            else:
                d.append(f'C{seg.c1.x/UP:.3f} {seg.c1.y/UP:.3f} {seg.c2.x/UP:.3f} {seg.c2.y/UP:.3f} {seg.end_point.x/UP:.3f} {seg.end_point.y/UP:.3f}')
        d.append('Z')
    ys, xs = np.nonzero(m)
    out['parts'][name] = {'d': ''.join(d), 'bbox': [xs.min()/UP, ys.min()/UP, (xs.max()+1)/UP, (ys.max()+1)/UP]}
open('assets/logo-paths.json', 'w').write(json.dumps(out))
print(color, {k: [round(v, 2) for v in p['bbox']] for k, p in out['parts'].items()})
