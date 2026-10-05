# Oxiquim · Jornada GPER «Del diagnóstico a la acción» — invitación en video

Pieza vertical 9:16 (1080×1920, 60 fps, 78,7 s) basada en el libreto *Invitación Olmué v3* y en los
*Lineamientos de marca 2025* (versiones anteriores: `oxiquim_jornada_gper_olmue.mp4` = v1, `_v2.mp4` = v2, `_v3.mp4` = v3, `_v4.mp4` = v4, `_v5.mp4` = v5 sin efectos de sonido).
Todo es código: la animación es una función determinista del tiempo (`renderFrame(t)` en `index.html`),
capturada cuadro a cuadro con Playwright y codificada con ffmpeg. La música (120 BPM, Re mayor) se sintetiza en `scripts/audio.py` y los efectos de sonido en `scripts/sfx.py`.

| Tiempo | Pantalla del libreto | Recurso |
|---|---|---|
| 0–4,5 s | Logo | Punto → trazo del isotipo → relleno → logotipo → zoom a través del hexágono interior e iris hexagonal |
| 4,5–11 s | 1 · Invitación / Jornada Gerencia de Personas / “Del diagnóstico a la acción” | Nube de datos que se ordena en el título; «A la acción» entra con estela |
| 11–17 s | 2 · Ya tenemos los resultados del diagnóstico… | Las mismas partículas forman un gráfico de columnas con barrido de escaneo |
| 17–23 s | 3 · Ahora queremos compartirlos contigo… | Las columnas se reordenan en un Gantt con hitos y ruta |
| 23–29,5 s | 4 · Y queremos hacerlo de una manera distinta. / Fuera de la oficina. | Barras → cuadrícula de oficina; una baldosa se voltea, el resto cae |
| 29,5–37,5 s | 5 · Nos encontraremos en Olmué (fecha solo como calendario: miércoles 7 de octubre) | La baldosa se vuelve sol; cerros en capas, ruta, pin y calendario grande |
| 37,5–47 s | 6 · ¿Para qué nos reuniremos? … | El sol se vuelve núcleo de un blanco de hexágonos; cometa al centro |
| 46,5–53 s | 7 · También será un espacio para encontrarnos… | Doce personas forman un círculo unido alrededor del núcleo |
| 53–62 s | 8 · Queremos terminar el día con… | Tres tarjetas con íconos animados |
| 62–66 s | 9 · Nos vemos en Olmué | Tipografía con resorte y estallido de hexágonos |
| 66–72 s | 10 · R35 / Necesita a personas. | «R35» formado por figuras de personas, en una línea |
| 72–78,7 s | Logo | Las personas convergen en el isotipo; cierre con brillo |

## Marca

- **Logo:** vector oficial extraído de la página 1 de los lineamientos (`scripts/extract_logo_pdf.py`), color azul principal #0055B8.
  El PNG entregado al inicio (`assets/oxiquim-logo-original.png`) y su trazado (`scripts/trace_logo.py`) quedan como referencia.
- **Colores:** azul principal #0055B8, azul oscuro #162851 y tintes del azul en toda la pieza. Los colores secundarios
  (amarillo #F9AB3A, verde claro #819E49, verde oscuro #225F58) solo aparecen en el sol y el paisaje de Olmué.
- **Tipografías:** Trebuchet MS para textos (se descarga del paquete oficial de Microsoft con `scripts/get_fonts.sh`; no se
  redistribuye en el repositorio). Para títulos la oficial es Goli (MagicType); si existe `fonts/goli.woff2` se usa
  automáticamente, si no se usa Figtree (OFL) como sustituto geométrico.

## Sonido

- **Música:** pop optimista a 120 BPM en Re mayor (`scripts/audio.py`).
- **Efectos:** bus propio sintetizado en `scripts/sfx.py` (clics, swipes, pops, golpes suaves de sub, brillos, risers),
  sincronizado con cada animación. Los tiempos aleatorios de las personas (escenas 7 y 10) se exportan desde la
  animación con `node scripts/export_cues.mjs`.
- **Nivel:** el bus de efectos se ajusta solo para quedar bajo la música: en cada ventana de 300 ms su RMS queda al
  menos 6 dB por debajo y su pico bajo el 70 % del pico de la música (mediana ~16 dB por debajo).
  `audio.py` también exporta `out/stem_musica.wav` y `out/stem_efectos.wav`.

## Reproducir

```bash
pip install numpy scipy pillow potracer
./scripts/get_fonts.sh              # Trebuchet MS (requiere cabextract)
python3 scripts/extract_logo_pdf.py <lineamientos.pdf>   # logo oficial → assets/logo-paths.json/.js
node scripts/export_cues.mjs          # out/cues.json (tiempos para los efectos)
python3 scripts/audio.py             # out/audio.wav + stems
node scripts/render.mjs --fps 60     # out/video.mp4 (sin audio)
ffmpeg -i out/video.mp4 -i out/audio.wav -c:v copy -c:a aac -b:a 256k -shortest oxiquim_jornada_gper_olmue_v6.mp4
```

**Versión WhatsApp** (`oxiquim_jornada_gper_olmue_whatsapp.mp4`, < 30 MB): el primer cuadro es la pantalla final
«R35 necesita a personas» (WhatsApp usa el primer cuadro como miniatura), seguida de un fundido a blanco de 0,4 s y el video.

```bash
node scripts/render.mjs --fps 60 --crf 8 --out out/video_master.mp4   # máster casi sin pérdida
node scripts/render.mjs --stills 70.5 && cp out/stills/t70.50.png out/cover_r35.png
./scripts/whatsapp.sh                                                  # dos pasadas, objetivo 29 MB
```

Vista previa: `index.html?play` (en vivo) o `index.html?t=33` (cuadro fijo). Cuadros sueltos: `node scripts/render.mjs --stills 2,12,24`.

