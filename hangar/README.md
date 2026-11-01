# Hangar

Diorama pixel-art del hangar del video "Presente" (jirafa ardiendo), hecho con la skill `diorama`.
Loop de 70 s, función pura de `t`. Slab 48 x 10 (pared divisoria con abertura a 61 % del largo), cámara fija 45/33, paleta de 64 colores.

- Abrir `hangar-diorama.html` (standalone, funciona por `file://`) o `index.html` + `dist/app.js`.
- `?t=27` congela un instante; `?dither=0` apaga el dither; `?devil=diablada` viste al diablo rojo con el traje de diablada (el visitante ya lo lleva por defecto).
- Compilar: `npm i && node build.mjs`. QA: `python3 -m http.server 4180` y `node qa/snap.mjs`, `node qa/numbers.mjs`.

Beats: 0 establece / 3-10 el visitante entra / 10-16 mira las pantallas / 12-36 el pez dorado cruza /
16-24 el diablo salta al centro y el visitante se sienta / 26 la máscara de piedra estalla en color /
32-38 se apaga y el visitante sale / 38-40 costura.

Limitaciones: reconstruido desde el video, no desde el `.blend`; la geometría es aproximada y las paredes
que el video no muestra están inventadas. Las pantallas muestran campos de color abstractos, no el metraje.
Ver DESIGN.md, refs/SOURCES.md y CREDITS.md.
