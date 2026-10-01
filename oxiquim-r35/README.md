# Rumbo 35 · Plan de trabajo Gerencia de Personas — motion graphic

Pieza de 2:46 (165,8 s · 1920×1080 · 60 fps) basada en *Diagnóstico GPER – Plan de trabajo 2026–2028*.
Estilo Apple sobre fondo blanco, paleta de azul profundo (#0A2A66) a celeste (#4DA8FF), color de marca #005EC2.
Todo es código: `renderFrame(t)` (en `js/scenes.js`) es una función pura del tiempo, capturada cuadro a cuadro
con Playwright y codificada con ffmpeg. La banda sonora se sintetiza en `scripts/audio.py`, sincronizada
con las marcas de tiempo que exporta la animación (`out/cues.json`).

| Tiempo | Pantalla del documento | Escena |
|---|---|---|
| 0:00–0:05 | — | Apertura: el isotipo aparece y las letras emergen desde él (logotipo original) |
| 0:05–0:24 | Pantalla 1 | Título + párrafo con resaltado progresivo; el "trazo" dibuja las 3 olas 2026–2028 |
| 0:24–0:31 | Pantalla 1 | Hoja de ruta proporcional (meses 0 · 6 · 18 · 36, años, gestión del cambio transversal) y zoom a la Ola 1 |
| 0:31–1:07 | Pantalla 2 | Ola 1 · Primeras victorias: lista + tarjeta con 4 visualizaciones |
| 1:07–1:10 | — | Retroceso a la hoja de ruta, el cursor avanza a la Ola 2 |
| 1:10–1:45 | Pantalla 3 | Ola 2 · Construcción: carrusel horizontal de 4 tarjetas |
| 1:45–1:48 | — | Retroceso a la hoja de ruta, avance a la Ola 3 |
| 1:48–2:12 | Pantalla 4 | Ola 3 · Consolidación: incentivos atados a metas R35, globo con arcos desde Chile |
| 2:12–2:22 | Pantalla 4 | Objetivo de los plazos: contador 1,0x → 2,5x y curva 2026–2035 |
| 2:22–2:39 | Pantallas 5–7 | "Nuestro éxito ya está trazado" · "…haciendo la diferencia" · R35 formado por partículas (personas) |
| 2:39–2:46 | — | Cierre con el logotipo |

**Duración y lectura.** El documento suma ≈2.100 caracteres; a 15–17 car/s (ritmo de lectura cómoda en pantalla)
eso exige 125–140 s solo de lectura, por lo que 120 s no alcanzaban. Cada iniciativa permanece
`1,2 s + caracteres/18` segundos con su descripción visible; los títulos de la lista y el texto introductorio de cada ola
quedan fijos en pantalla durante toda la ola.

**Logotipo.** No se redibuja: `scripts/logo.py` escala ×4 el canal alfa del PNG original (Lanczos + realce de borde
centrado en α = 0,5), fija el color exacto del archivo (#005EC2) y corta el mismo raster en capas (isotipo y letras)
cuya superposición reproduce el original sin diferencias.

**Texto.** Se usa el texto del documento sin cambios, con una excepción: en Formación y desarrollo,
"conocimientos críticos de conocimiento" se mostró como "conocimientos críticos" (redundancia del original).
Los destinos de los arcos del globo son ilustrativos y no llevan rótulo.

## Versión móvil 9:16 (`mobile.html`)

Pieza vertical de 2:58 (178,4 s · 1080×1920 · 60 fps) para ver en el teléfono: `oxiquim_r35_plan_personas_9x16.mp4`.
Misma información y misma banda sonora (re-sincronizada); composición rediseñada para móvil:

- **Zonas seguras:** el contenido clave queda entre y = 200 y y = 1600, con márgenes laterales de 72 px. Las franjas
  superior e inferior quedan libres para las interfaces de WhatsApp, Instagram y la barra de estado.
- **Tamaños mínimos** (sobre 1080 px de ancho): cuerpo ≥ 42 px, títulos ≥ 58 px, rótulos de gráficos ≥ 26 px.
- **Contraste (WCAG 2.x):** cuerpo de texto de 4,7:1 a 16,8:1. El degradado de títulos termina en #1A7CF0 (4,05:1;
  en 16:9 llegaba a #7CC4FF, 1,88:1). El celeste informativo de los gráficos pasa a #2F8BEF (3,2–3,5:1).
- **Una idea por pantalla:** cada iniciativa ocupa una tarjeta completa (visualización, título y descripción),
  con barras de avance tipo historias y transición lateral. La introducción de cada ola tiene pantalla propia (7 s).
- **Hoja de ruta vertical:** las olas del párrafo giran 90° para formar la ruta de 36 meses de arriba hacia abajo.
- **Primer cuadro con marca:** el isotipo ya está en pantalla en t = 0, porque las apps lo usan como miniatura.
- Las visualizaciones están redibujadas para un lienzo de 920×760 (`js/viz-m.js`), con trazos y rótulos más gruesos.

## Reproducir

```bash
pip install numpy scipy pillow
python3 scripts/logo.py                         # capas del logotipo desde assets/logo/oxiquim-original.png
node scripts/render.mjs --fps 60 --workers 3    # out/video.mp4 (sin audio) + out/cues.json
python3 scripts/audio.py                        # out/audio.wav
ffmpeg -i out/video.mp4 -i out/audio.wav -c:v copy -c:a aac -b:a 256k -shortest oxiquim_r35_plan_personas.mp4
```

Versión móvil:

```bash
node scripts/render.mjs --page mobile.html --w 1080 --h 1920 --tag -m --fps 60 --workers 3   # out/video-m.mp4 + out/cues-m.json
python3 scripts/audio.py -m                                                                   # out/audio-m.wav
ffmpeg -i out/video-m.mp4 -i out/audio-m.wav -c:v libx264 -profile:v high -crf 20 -preset slow -pix_fmt yuv420p \
  -c:a aac -b:a 160k -ar 48000 -shortest -movflags +faststart oxiquim_r35_plan_personas_9x16.mp4
```

Vista previa: servir la carpeta por HTTP (p. ej. `npx serve`) y abrir `index.html?play` o `index.html?t=24` (`mobile.html` para la versión vertical).
Cuadros sueltos: `node scripts/render.mjs --stills 2,12,24`.
Fuente tipográfica: Inter (SIL Open Font License).
