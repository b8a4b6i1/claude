"""Prepara el logotipo a partir del PNG original (assets/logo/oxiquim-original.png, 400×100).
No redibuja la marca: escala el canal alfa del archivo original (Lanczos ×4 + realce de borde
centrado en α=0,5, que conserva el contorno) y fija el color al azul exacto del archivo (#005EC2).
Además corta el mismo raster en capas (isotipo + letras) para animarlas; superpuestas sin
transformación reproducen el original píxel a píxel (a la escala ×4)."""
import numpy as np
from PIL import Image, ImageDraw
import os

SRC = os.path.join(os.path.dirname(__file__), '..', 'assets', 'logo', 'oxiquim-original.png')
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'logo')
K = 4
im = Image.open(SRC).convert('RGBA')
rgb = np.array(im)[:, :, :3]
a0 = np.array(im)[:, :, 3]
solid = rgb[a0 > 250]
col = tuple(int(v) for v in np.median(solid, axis=0))
print('color', '#%02X%02X%02X' % col)

# recorte al bbox con margen
x0, y0, x1, y1 = 21, 14, 344, 83
a = Image.fromarray(a0).crop((x0, y0, x1, y1))
W, H = a.size
big = np.array(a.resize((W * K, H * K), Image.LANCZOS)).astype(float) / 255
# realce de borde: rampa lineal de ancho ~1,6 px de salida alrededor de 0,5
big = np.clip((big - 0.5) * 2.2 + 0.5, 0, 1)
alpha = (big * 255).round().astype(np.uint8)

def save(mask, name):
    out = np.zeros((H * K, W * K, 4), np.uint8)
    out[:, :, :3] = col
    out[:, :, 3] = (alpha.astype(float) * mask).round().astype(np.uint8)
    Image.fromarray(out).save(os.path.join(OUT, name))

save(np.ones_like(big), 'oxiquim.png')

# capas: coordenadas en px del original
def poly_mask(polys):
    m = Image.new('L', (W * K, H * K), 0)
    d = ImageDraw.Draw(m)
    for p in polys:
        d.polygon([((x - x0) * K, (y - y0) * K) for x, y in p], fill=255)
    return np.array(m).astype(float) / 255

wedge = [(129.5, 38.2), (141, 49.5), (129.5, 60.8)]
hexm = poly_mask([[(0, 0), (129.5, 0), (129.5, 100), (0, 100)], wedge])
save(hexm, 'l-hex.png')
cuts = {'X': (129.5, 179.5), 'I1': (179.5, 193), 'Q': (193, 235), 'U': (235, 275.5), 'I2': (275.5, 289), 'M': (289, 344)}
rest = np.clip(1 - hexm, 0, 1)
for k, (xa, xb) in cuts.items():
    m = poly_mask([[(xa, 0), (xb, 0), (xb, 100), (xa, 100)]]) * rest
    save(m, f'l-{k}.png')
print('size', W * K, H * K, 'offset', x0, y0)
