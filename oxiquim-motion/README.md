# Oxiquim · Plan de trabajo Gerencia de Personas — motion graphic

Pieza de 60 s (1920×1080, 60 fps) basada en el documento *Diagnóstico GPER – Plan de trabajo 2026–2028*.
Todo es código: la animación es una función determinista del tiempo (`renderFrame(t)` en `index.html`),
capturada cuadro a cuadro con Playwright y codificada con ffmpeg. La música y los efectos se sintetizan en `scripts/audio.py`.

| Tiempo | Escena |
|---|---|
| 0–6 s | Construcción de la marca: trazo del hexágono, relleno, revelado del logotipo |
| 6–12 s | Tipografía cinética → "Rumbo 35" y zoom a través de la "o" |
| 12–18 s | Línea de tiempo proporcional (0 · 6 · 18 · 36 meses) y gestión del cambio transversal |
| 18–28 s | Ola 1 · Primeras victorias — bento con 4 visualizaciones vivas |
| 28–38 s | Ola 2 · Construcción — sistema de partículas que muta entre formaciones |
| 38–48 s | Ola 3 · Consolidación — anillos de incentivos y globo de puntos con arcos desde Chile |
| 48–54 s | 2,5x EBITDA proyectado al 2035 |
| 54–60 s | Cierre y firma de marca |

## Reproducir

```bash
npm install                      # fuentes (Inter, Archivo), datos del globo
pip install numpy scipy pillow imageio-ffmpeg
node scripts/globe-dots.mjs      # regenera assets/globe-dots.js (Natural Earth 110m)
python3 scripts/audio.py         # out/audio.wav
node scripts/render.mjs --fps 60 # out/video.mp4 (sin audio)
# mezcla final
ffmpeg -i out/video.mp4 -i out/audio.wav -c:v copy -c:a aac -b:a 256k -shortest oxiquim_plan_personas_motion.mp4
```

Vista previa en navegador: abrir `index.html?play` (reproducción en vivo) o `index.html?t=24` (cuadro fijo).
Cuadros sueltos para revisión: `node scripts/render.mjs --stills 2,12,24`.

El isotipo y el logotipo están reconstruidos en vector a partir del PNG de referencia (no es el archivo maestro de la marca).
Fuentes: Inter y Archivo (SIL Open Font License).
