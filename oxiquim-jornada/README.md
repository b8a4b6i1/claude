# Oxiquim · Jornada GPER «Del diagnóstico a la acción» — invitación en video

Pieza vertical 9:16 (1080×1920, 60 fps, 70,3 s) basada en el documento *Invitación Olmué v1*.
Todo es código: la animación es una función determinista del tiempo (`renderFrame(t)` en `index.html`),
capturada cuadro a cuadro con Playwright y codificada con ffmpeg. La música y los efectos se sintetizan en `scripts/audio.py`.

| Tiempo | Pantalla del documento | Recurso |
|---|---|---|
| 0–4,5 s | Logo | Punto → trazo del isotipo → relleno → logotipo → zoom a través del hexágono interior e iris hexagonal |
| 4,5–11 s | 1 · Jornada GPER / Del diagnóstico a la acción | Nube de datos que se ordena en el título; «A la acción» entra con estela |
| 11–17 s | 2 · Es hora de conocer los resultados… CIS Consultores | Las mismas partículas forman un gráfico de columnas con barrido de escaneo |
| 17–23 s | 3 · Y revisar el plan de trabajo… | Las columnas se reordenan en un Gantt con hitos y ruta |
| 23–29,5 s | 4 · Pero queremos hacerlo de una manera diferente. / Fuera de la oficina… | Barras → cuadrícula de oficina; una baldosa se voltea, el resto cae |
| 29,5–37,5 s | 5 · En Olmué / El 8 de octubre. | La baldosa se vuelve sol; cerros en capas, ruta, pin y calendario |
| 37,5–45 s | 6 · El objetivo de la jornada es claro… | El sol se vuelve núcleo de un blanco de hexágonos que entra en foco |
| 45–53 s | 7 · Queremos salir de esta jornada con… | Tres tarjetas con íconos animados |
| 53–57 s | 8 · Nos vemos | Tipografía con resorte y estallido de hexágonos |
| 57–64 s | 9 · Rumbo 35 necesita a personas. | El «35» está formado por figuras de personas |
| 64–70,3 s | Logo | Las personas convergen en el isotipo; cierre con brillo |

## Logo

`assets/oxiquim-logo-original.png` es el archivo entregado (400×100). `scripts/trace_logo.py` lo vectoriza
(isolínea 50 % del alfa original, sobremuestreada ×16 y trazada con potrace) sin redibujar formas; color tomado
del propio PNG (#005EC2). `scripts/verify_logo.mjs` rasteriza el vector a 1× y lo compara con el original:
IoU 98,1 %, error máximo de alfa por píxel 0,38 (desviaciones subpíxel en bordes).

## Reproducir

```bash
pip install numpy scipy pillow potracer
python3 scripts/trace_logo.py        # assets/logo-paths.json
node scripts/verify_logo.mjs         # métrica de fidelidad + out/logo-compare.png
python3 -c "import json;open('assets/logo-paths.js','w').write('window.LOGO='+open('assets/logo-paths.json').read()+';')"
python3 scripts/audio.py             # out/audio.wav
node scripts/render.mjs --fps 60     # out/video.mp4 (sin audio)
ffmpeg -i out/video.mp4 -i out/audio.wav -c:v copy -c:a aac -b:a 256k -shortest oxiquim_jornada_gper_olmue.mp4
```

Vista previa: `index.html?play` (en vivo) o `index.html?t=33` (cuadro fijo). Cuadros sueltos: `node scripts/render.mjs --stills 2,12,24`.
Fuente: Inter (SIL Open Font License).
