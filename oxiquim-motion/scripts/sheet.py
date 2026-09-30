# Hoja de contactos para revisión: python3 scripts/sheet.py salida.png img1 img2 ...
import sys
from PIL import Image, ImageDraw
out, files = sys.argv[1], sys.argv[2:]
W, H, cols = 800, 450, 2
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * W + (cols + 1) * 8, rows * H + (rows + 1) * 8), (60, 60, 60))
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((W, H), Image.LANCZOS)
    x, y = 8 + (i % cols) * (W + 8), 8 + (i // cols) * (H + 8)
    sheet.paste(im, (x, y))
    d.text((x + 6, y + 6), f.split('/')[-1], fill=(255, 60, 60))
sheet.save(out)
