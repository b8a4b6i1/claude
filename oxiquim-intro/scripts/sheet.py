"""Hoja de contactos de los stills: python3 scripts/sheet.py out/stills out/sheet.png [cols]"""
import sys, glob
from PIL import Image, ImageDraw
src, dst = sys.argv[1], sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
fs = sorted(glob.glob(src + '/*.png')); w, h = 480, 270
sheet = Image.new('RGB', (cols * w, ((len(fs) + cols - 1) // cols) * (h + 24)), '#888')
for i, f in enumerate(fs):
    im = Image.open(f).convert('RGB').resize((w, h), Image.LANCZOS)
    x, y = (i % cols) * w, (i // cols) * (h + 24)
    sheet.paste(im, (x, y + 24)); ImageDraw.Draw(sheet).text((x + 6, y + 5), f.split('/')[-1], fill='white')
    ImageDraw.Draw(sheet).rectangle([x, y + 24, x + w - 1, y + 24 + h - 1], outline='#444')
sheet.save(dst)
