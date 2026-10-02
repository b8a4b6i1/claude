"""Extrae el logotipo vectorial oficial desde la página 1 de los lineamientos de marca (PDF → SVG con pdftocairo).
Uso: python3 scripts/extract_logo_pdf.py <lineamientos.pdf>  → assets/logo-paths.json / .js (mismo formato que trace_logo.py)."""
import json, re, subprocess, sys, tempfile, os
pdf = sys.argv[1]
with tempfile.TemporaryDirectory() as d:
    subprocess.run(['pdftocairo', '-svg', '-f', '1', '-l', '1', pdf, os.path.join(d, 'p.svg')], check=True)
    svg = open(os.path.join(d, 'p.svg')).read()
body = svg[svg.index('</defs>'):]
bg = re.search(r'<path[^>]*fill="rgb\(([\d.]+)%, ([\d.]+)%, ([\d.]+)%\)"', body)
color = '#%02x%02x%02x' % tuple(round(float(v) * 2.55) for v in bg.groups())   # fondo de la portada = azul principal
paths = []
for m in re.finditer(r'<path[^>]*fill="rgb\(100%, 100%, 100%\)"[^>]*>', body):
    dd = re.search(r' d="([^"]*)"', m.group(0)).group(1)
    nums = list(map(float, re.findall(r'-?\d+\.?\d*', dd)))
    paths.append({'d': dd, 'x0': min(nums[0::2]), 'x1': max(nums[0::2]), 'y0': min(nums[1::2]), 'y1': max(nums[1::2])})
paths.sort(key=lambda p: p['x0'])
mark = [p for p in paths if p['x0'] < paths[0]['x1'] - 40]          # anillo + hexágono interior
letters = [p for p in paths if p not in mark]
assert len(mark) == 2 and len(letters) == 6, (len(mark), len(letters))
X0 = min(p['x0'] for p in paths) - 4; Y0 = min(p['y0'] for p in paths) - 4
def shift(dd):
    out, nums, i = [], re.split(r'(-?\d+\.?\d*)', dd), 0
    k = 0
    for tok in nums:
        if re.fullmatch(r'-?\d+\.?\d*', tok):
            v = float(tok) - (X0 if k % 2 == 0 else Y0); out.append(f'{v:.3f}'); k += 1
        else: out.append(tok)
    return ''.join(out)
parts = {}
def put(name, ps):
    parts[name] = {'d': ''.join(shift(p['d']) for p in ps),
                   'bbox': [min(p['x0'] for p in ps) - X0, min(p['y0'] for p in ps) - Y0, max(p['x1'] for p in ps) - X0, max(p['y1'] for p in ps) - Y0]}
put('mark', mark)
for name, p in zip(['X', 'I', 'Q', 'U', 'I2', 'M'], letters): put(name, [p])
W = max(p['x1'] for p in paths) - X0 + 4; H = max(p['y1'] for p in paths) - Y0 + 4
out = {'color': color, 'w': round(W, 2), 'h': round(H, 2), 'parts': parts, 'source': 'Lineamientos de marca 2025, página 1 (vector)'}
json.dump(out, open('assets/logo-paths.json', 'w'))
open('assets/logo-paths.js', 'w').write('window.LOGO=' + json.dumps(out) + ';')
print(color, round(W, 1), round(H, 1), {k: [round(v, 1) for v in p['bbox']] for k, p in parts.items()})
