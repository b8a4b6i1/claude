"""Hoja de contactos de cuadros sueltos: python3 scripts/sheet.py out/sheet.png out/stills/a.png ..."""
import sys
from PIL import Image, ImageDraw
out, files = sys.argv[1], sys.argv[2:]
cols = 2 if len(files) > 1 else 1
w, h = 960, 540
rows = (len(files) + cols - 1) // cols
S = Image.new('RGB', (cols * w + (cols + 1) * 8, rows * h + (rows + 1) * 8), (120, 120, 120))
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((w, h), Image.LANCZOS)
    x, y = 8 + (i % cols) * (w + 8), 8 + (i // cols) * (h + 8)
    S.paste(im, (x, y)); ImageDraw.Draw(S).text((x + 8, y + 6), f.split('/')[-1], fill=(255, 0, 0))
S.save(out)
