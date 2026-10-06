# Video introductorio · Jornada Gerencia de Personas (16:9)

Abre la jornada: encuadre del día, agenda en cinco verbos (escuchar, conversar, priorizar, fundamentar, salir con una hoja de ruta), acuerdos de conversación, «¡Vamos a trabajar!» y cierre con «R35 necesita a personas» y el logo.

- `index.html`: animación determinista 1920 × 1080, `renderFrame(t)` (0–79 s). `?play` la reproduce en el navegador; `?t=12.5` muestra un cuadro.
- `assets/logo-paths.js`: vectores oficiales del logo (lineamientos 2025; coinciden con `Logo_Oxiquim.ai`, azul #0055b8).
- `fonts/`: Figtree (sustituto de Goli mientras no esté el archivo completo) y Trebuchet MS (`scripts/get_fonts.sh`).

## Producción

```bash
node scripts/render.mjs --stills 6.5,12.5,49     # cuadros sueltos → out/stills
node scripts/render.mjs --fps 60 --crf 10        # imagen → out/video.mp4
node scripts/export_cues.mjs                     # tiempos de personas y tarjetas → out/cues.json
python3 scripts/audio.py                         # música + efectos → out/audio.wav (+ stems)
ffmpeg -i out/video.mp4 -i out/audio.wav -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p \
  -c:a aac -b:a 256k -shortest -movflags +faststart Video_Introductorio_Jornada_GPER.mp4
```

Los efectos (estilo librerías de motion de Ocular Sounds, sintetizados) van en un bus propio que `audio.py` nivela ventana a ventana: RMS al menos 6,5 dB bajo la música y pico ≤ 66 % del pico de la música.
