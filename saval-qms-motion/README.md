# Saval · Proyecto QMS — Mapa de audiencias y riesgos (motion graphic)

Pieza de 3:38 (1920×1080, 60 fps) que resume el informe *Mapa de audiencias y riesgos* (Flux Consultores, octubre 2026)
para los líderes del proyecto QMS / DMS. Se omitió a propósito la tabla «En qué no coinciden el kickoff y las entrevistas».

Todo es código: la animación es una función determinista del tiempo (`renderFrame(t)` en `index.html`),
capturada cuadro a cuadro con Playwright y codificada con ffmpeg. La música y los efectos se sintetizan en `scripts/audio.py`.

| Tiempo | Escena |
|---|---|
| 0:00–0:07 | Construcción de la marca SAVAL: las dos cintas del isotipo se dibujan, revelado del logotipo y «Siempre junto a ti» |
| 0:07–0:14 | Título: *Mapa de audiencias y riesgos*, orbe con lente de vidrio |
| 0:14–0:23 | Hoy: papel, correo, Word y Excel · 40 firmas y 40 fechas por documento |
| 0:23–0:31 | Hoy → con QMS / DMS (SoftExpert EQM) |
| 0:31–0:43 | QMS y DMS: qué hace, a quién llega, cómo cambia el trabajo (~1.000 usuarios, ~700 nombrados, 300+ en planta) |
| 0:43–0:56 | Metas del caso de negocio (22 % menos desvíos y cinco metas más) |
| 0:56–1:06 | Cómo entra en uso cada módulo (5 pasos, validación GAMP 5) |
| 1:06–1:22 | Diagnóstico: «el sistema asigna responsables con nombre y apellido» |
| 1:22–2:05 | Mapa de audiencias: matriz intensidad × riesgo y ficha de cada audiencia (A–F) con citas |
| 2:05–2:49 | Mapa de riesgos de adopción: la matriz se transforma en mapa de calor; 6 riesgos críticos en 3 temas con mitigación |
| 2:49–3:11 | Hábitos que cambian y qué significa para el plan |
| 3:11–3:23 | Ideas para el relato madre |
| 3:23–3:30 | Próximos pasos (semanas 2, 3 y 4) |
| 3:30–3:38 | Cierre con la marca SAVAL |

## Reproducir

```bash
npm install                                   # Montserrat (las fuentes ya están copiadas en fonts/)
pip install numpy scipy
python3 scripts/audio.py                      # out/audio.wav
node scripts/render.mjs --fps 60 --workers 4  # out/video.mp4 (sin audio)
ffmpeg -i out/video.mp4 -i out/audio.wav -c:v copy -af loudnorm=I=-16:TP=-1.5 -c:a aac -b:a 256k -shortest saval_qms_mapa_audiencias_riesgos.mp4
```

Cuadros sueltos para revisión: `node scripts/render.mjs --stills 10,90,150`.
Las duraciones de escena están en la constante `SC` de `index.html` (y replicadas en `scripts/audio.py`).

El logo se extrajo del PDF fuente (imagen embebida, 2610 px) y se separó en isotipo, logotipo y bajada (`assets/`).
Fuentes: Montserrat e Inter (SIL Open Font License).
