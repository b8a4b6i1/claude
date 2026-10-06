# Láminas 16:9 · Jornada Gerencia de Personas

`Laminas_Jornada_GPER.pptx`: 9 láminas (13,33 × 7,5 in) con el lenguaje visual del video a color.

1. Bienvenida («Del diagnóstico a la acción»)
2–8. Una lámina por cada actividad marcada en amarillo en la agenda: resultados del diagnóstico CIS, conversación en grupos, ordenamiento de prioridades (Parte 1), resumen del trabajo, fundamentar la respuesta y KPI (Parte 2), conclusiones y compromisos.
9. «R35 necesita a personas»

Texto editable: títulos en Goli (instalar `Fuentes_Goli.zip`, licencia SIL OFL 1.1) y textos en Trebuchet MS. Las gráficas son PNG en alta resolución generados con el mismo dibujo del video.

```bash
node build_art.mjs                                  # arte → art/*.png
NODE_PATH=$PWD/node_modules node build_deck.js       # PowerPoint
```
