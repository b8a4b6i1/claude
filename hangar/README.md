# Hangar

Diorama pixel-art del hangar del video "Presente" (jirafa ardiendo), hecho con la skill `diorama`.
Loop de 90 s, función pura de `t`. Slab 48 x 10 (pared divisoria con abertura a 61 % del largo), cámara fija 45/33, paleta de 64 colores.

- Abrir `hangar-diorama.html` (standalone, funciona por `file://`) o `index.html` + `dist/app.js`.
- `?t=27` congela un instante; `?dither=0` apaga el dither; `?devil=diablada` viste al diablo rojo con el traje de diablada (el visitante ya lo lleva por defecto).
- Compilar: `npm i && node build.mjs`. QA: `python3 -m http.server 4180` y `node qa/snap.mjs`, `node qa/numbers.mjs`.

Beats: 0 establece / 3-10 el visitante entra / 10-16 mira las pantallas / 12-36 el pez dorado cruza /
16-24 el diablo salta al centro y el visitante se sienta / 26 la máscara de piedra estalla en color /
32-38 se apaga y el visitante sale / 38-40 costura.

Limitaciones: reconstruido desde el video, no desde el `.blend`; la geometría es aproximada y las paredes
que el video no muestra están inventadas. Las pantallas muestran campos de color abstractos, no el metraje.
Ver DESIGN.md, refs/SOURCES.md y CREDITS.md.

## Mapa del recorrido (de la grabación de pantalla)
Eje largo = X, entrada en +X, máscara de piedra en el extremo -X (u = 24 − x). La mano derecha de quien camina es el muro del fondo (−Z); la izquierda es el lado abierto (+Z) y sus pantallas/puertas están como paneles sobre el borde.
Sala larga (u 0–29): diablo rojo a 9 m de la entrada, centro; pantallas en el muro derecho (público, concierto grande sobre alfombra roja, escenario, multitud), puerta con marca de ratón y puerta del eclipse; a la izquierda: película en blanco y negro, retrato rosa, anciana, rostro blanco; teremín junto a la primera puerta izquierda; cabina EAT THE RICH; gemelas, gato y hombre pantalón acampanado frente a la pantalla de la anciana; hombre ciervo con roca sobre la alfombra roja; espadachín blanco al centro; cabina del vestido azul junto a la abertura de la pared divisoria (a la derecha); robot rojo y figura naranja a su izquierda.
Sala corta (u 29–48): portón con marco verde y mujer de camiseta roja a la derecha, escritorio con computador contra el muro derecho, puerta "el buen pueblo", espiral en el piso, puerta con logo de llama a la izquierda, sintetizador a la izquierda, banda a la derecha de la máscara, máscara con orejas de ratón y dos figuras negras al fondo.
Aproximación: las posiciones están leídas de cuadros del video, sin medidas reales.

## Magia y personajes (v9)
Cabina cuadrada de 2,4 m que salta cada 6 s y suelta estrellas; la abertura de la pared divisoria está en el lado izquierdo (abierto). El director de orquesta deambula con su batuta; a los 17 s convoca a cinco personajes (gato, hombre ciervo, cantante, patinadora, espadachín) a un coro, los dirige hasta los 36 s y los dispersa entre giros y chispas. El diablo lanza hechizos (cada 4,5 s hacia gato, hombre ciervo y cabina), levita y gira orbes entre 36 y 52 s. Rayos: centinelas (ojos), hombre ciervo (abanico), cantante (abanico dorado), cabina (reflector), pez dorado (trueno), batuta (a cada corista), anillo del eclipse (lanza). Todo es función pura de t.
