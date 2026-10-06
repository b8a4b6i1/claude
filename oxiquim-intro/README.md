# Video introductorio · Jornada Gerencia de Personas (16:9)

Abre la jornada: bienvenida («Del diagnóstico a la acción»), encuadre del día, agenda en cinco verbos (conocer, conversar, priorizar, fundamentar, salir con una hoja de ruta), acuerdos de conversación, «¡Vamos a trabajar!» y cierre con «R35 necesita a personas» y el logo.

- `index.html`: animación determinista 1920 × 1080, `renderFrame(t)` (0–83,85 s; tras la bienvenida, las escenas corren con `t − OFF`, OFF = dos compases de la música). `?play` la reproduce en el navegador; `?t=12.5` muestra un cuadro.
- `index_v2.html`: versión color, misma información y tiempos. Fotografías de la identidad visual (`assets/photos/`) solo dentro de las burbujas de «conversaremos» (sin fotos de fondo tras los paneles); paleta completa de marca solo en gráfica (tarjetas, puntos de los hitos, pestaña de acuerdos). El texto se mantiene en tinta y azules, como la versión 1. Se renderiza con `--page index_v2.html` y usa el mismo `out/audio.wav`.
- `assets/logo-paths.js`: vectores oficiales del logo (lineamientos 2025; coinciden con `Logo_Oxiquim.ai`, azul #0055b8).
- `fonts/`: Goli (títulos, tipografía oficial, licencia SIL OFL 1.1) y Trebuchet MS para textos (`scripts/get_fonts.sh`, no se versiona).

## Producción

```bash
node scripts/render.mjs --stills 6.5,12.5,49     # cuadros sueltos → out/stills
node scripts/render.mjs --fps 60 --crf 10        # imagen → out/video.mp4
node scripts/render.mjs --page index_v2.html --dpr 1.3333333333 --fps 60 --crf 8 --out out/video_v2_2k.mp4   # versión color en 2K (2560 × 1440)
node scripts/export_cues.mjs                     # tiempos de personas y tarjetas → out/cues.json
python3 scripts/audio.py                         # música + efectos → out/audio.wav (+ stems)
ffmpeg -i out/video.mp4 -i out/audio.wav -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p \
  -c:a aac -b:a 256k -shortest -movflags +faststart Video_Introductorio_Jornada_GPER.mp4
```

Los efectos (estilo librerías de motion de Ocular Sounds, sintetizados) van en un bus propio que `audio.py` nivela ventana a ventana: RMS al menos 6,5 dB bajo la música y pico ≤ 66 % del pico de la música.

Entrega final: `Video_Introductorio_Jornada_GPER_v2_color_2K.mp4` (2560 × 1440, 60 fps, H.264 CRF 14 sobre un máster CRF 8, AAC 320 kb/s). Con `--dpr` la página dibuja sus lienzos a esa densidad y la captura se hace a escala, así que texto, logo y gráfica se rasterizan en 2K y no se reescalan.
