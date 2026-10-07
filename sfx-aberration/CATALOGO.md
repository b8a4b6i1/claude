# Catálogo de efectos — Aberration

Recortes de dos montajes de demostración de la librería *Aberration* (Ocular Sounds), más una pieza de Universfield que se conserva entera.

Formato de los recortes: WAV PCM 24 bit estéreo, a la frecuencia de muestreo de su fuente (44,1 kHz el tráiler, 48 kHz el preview). Sin normalizar ni ecualizar: los niveles son los de origen. Cada recorte lleva un fundido de entrada de 4 ms y de salida de 15 ms para evitar clics, y se le quitaron los bordes por debajo de −65 dBFS. Los recortes del preview cuyo pico decodificado superaba 0 dBFS se bajaron a −0,1 dBFS (≤0,4 dB) para no saturar al pasar a 24 bit.

Nomenclatura: `ABR-<fuente>-<nº>_<categoría>_<nombre>.wav`. `TRL` = tráiler oficial (FLAC), `PRV` = Audio Preview (MP3 320 kbps; los WAV de esta fuente heredan la pérdida del MP3). Los nombres son inventados.

La columna *confianza* indica cuán seguro es que el recorte sea un único efecto de la librería y no un fragmento o una mezcla: **alta** = delimitado por silencio o corte seco; **media** = cambio espectral claro sin silencio; **baja** = los montajes encadenan efectos con fundidos y el límite es una estimación. La segmentación se hizo con análisis espectral (novedad espectral, envolvente RMS, ancho de banda) y control visual de espectrogramas, no por escucha.

Material descartado (silencios y ruido de fondo, sin evento): tráiler 0,00–0,10 s, 14,25–15,15 s, 54,65–55,39 s y 59,37–61,74 s (ruido a ≈ −51 dBFS); preview 21,70–21,94 s y 69,57–70,49 s (cola por debajo de −65 dBFS).

| Archivo | Categoría | Fuente (s) | Duración (s) | Pico dBFS | RMS dBFS | Confianza | Descripción |
|---|---|---|---|---|---|---|---|
| `ABR-TRL-01_tonal_enjambre_armonico.wav` | tonal | 0.10–2.48 | 2.38 | 0.0 | -8.6 | alta | Masa armónica densa y brillante; corte seco al final. |
| `ABR-TRL-02_atmosfera_vacio_con_chirridos.wav` | atmosfera | 2.48–6.61 | 4.13 | -11.1 | -27.9 | media | Drone grave tenue con chirridos agudos dispersos; crece lentamente. |
| `ABR-TRL-03_impacto_doble_latido.wav` | impacto | 6.61–7.47 | 0.86 | 0.0 | -5.7 | media | Dos golpes de cuerpo ancho en sucesión rápida. |
| `ABR-TRL-04_atmosfera_presagio_tenue.wav` | atmosfera | 7.47–9.90 | 2.43 | -7.0 | -20.2 | media | Lecho de baja intensidad con línea tonal sostenida. |
| `ABR-TRL-05_impacto_embestida_corte_seco.wav` | impacto | 9.90–14.21 | 4.31 | 0.0 | -7.3 | media | Golpe de entrada seguido de masa ruidosa sostenida; termina en corte abrupto. |
| `ABR-TRL-06_drone_tono_sideral_vibrante.wav` | drone | 15.26–19.41 | 4.14 | -8.2 | -21.8 | alta | Tono sostenido con armónicos marcados y trémolo creciente al final. |
| `ABR-TRL-07_textura_crepitar_del_umbral.wav` | textura | 19.41–23.10 | 3.69 | -0.4 | -28.8 | media | Textura baja con crepitaciones y transientes aislados. |
| `ABR-TRL-08_riser_oleada_abisal.wav` | riser | 23.10–28.43 | 5.33 | 0.0 | -8.2 | media | Subida rápida hacia un pico grave y cola sostenida. |
| `ABR-TRL-09_impacto_golpe_de_masa.wav` | impacto | 28.43–30.60 | 2.16 | 0.0 | -11.0 | media | Ataque grave con sostén denso. |
| `ABR-TRL-10_transicion_barrido_espectral.wav` | transicion | 30.60–32.29 | 1.69 | -1.4 | -13.9 | baja | Barrido corto de media intensidad. |
| `ABR-TRL-11_impacto_convulsion.wav` | impacto | 32.29–34.25 | 1.97 | 0.0 | -6.0 | media | Serie de golpes irregulares de alta energía. |
| `ABR-TRL-12_textura_marea_de_ruido.wav` | textura | 34.25–37.41 | 3.16 | 0.0 | -7.4 | baja | Masa ruidosa ancha y sostenida; corte seco al final. |
| `ABR-TRL-13_drone_resonancia_en_ascenso.wav` | drone | 37.41–41.40 | 4.00 | -2.0 | -17.4 | media | Drone medio con contenido agudo que va subiendo. |
| `ABR-TRL-14_impacto_colapso_metalico.wav` | impacto | 41.40–48.67 | 7.27 | 0.0 | -6.5 | baja | Impacto fuerte que abre una textura metálica densa y prolongada. |
| `ABR-TRL-15_riser_ascenso_al_corte.wav` | riser | 48.81–54.65 | 5.84 | 0.0 | -12.6 | alta | Crescendo desde casi silencio hasta pico; corte seco. |
| `ABR-TRL-16_textura_pulso_aberrante.wav` | textura | 55.52–59.37 | 3.85 | 0.0 | -8.8 | alta | Hinchazón inicial y masa pulsante que decae. |
| `ABR-PRV-01_drone_zumbido_inicial.wav` | drone | 0.03–2.61 | 2.58 | -0.0 | -17.9 | media | Drone tonal de banda estrecha con línea armónica estable. |
| `ABR-PRV-02_textura_exhalacion_cosmica.wav` | textura | 2.61–8.97 | 6.36 | -1.7 | -17.4 | media | Oleada ancha que sube y se disipa en una cola larga. |
| `ABR-PRV-03_textura_espasmos_lejanos.wav` | textura | 8.97–11.84 | 2.87 | -0.1 | -16.1 | media | Eventos sueltos de baja intensidad que rematan en un estallido breve. |
| `ABR-PRV-04_textura_friccion_organica.wav` | textura | 11.84–14.45 | 2.62 | -6.3 | -20.2 | baja | Textura granular de intensidad media y fluctuante. |
| `ABR-PRV-05_tonal_cuerdas_tensas.wav` | tonal | 14.45–18.60 | 4.15 | -1.6 | -14.9 | baja | Textura con parciales tonales tensos que aparecen y desaparecen. |
| `ABR-PRV-06_textura_rugido_del_vacio.wav` | textura | 18.60–21.66 | 3.06 | -0.1 | -7.8 | media | Rugido ancho de alta energía; corte seco al final. |
| `ABR-PRV-07_drone_latencia_grave.wav` | drone | 21.94–26.81 | 4.86 | -9.6 | -28.5 | alta | Drone grave muy suave que asciende gradualmente. |
| `ABR-PRV-08_impacto_irrupcion.wav` | impacto | 26.81–31.34 | 4.53 | -0.0 | -11.3 | media | Ataque súbito seguido de masa sostenida. |
| `ABR-PRV-09_textura_materia_inestable.wav` | textura | 31.34–35.47 | 4.13 | -0.1 | -10.9 | baja | Masa media con oscilaciones de energía. |
| `ABR-PRV-10_impacto_estallido_resonante.wav` | impacto | 35.47–37.30 | 1.83 | -0.1 | -9.1 | media | Estallido corto con cola armónica. |
| `ABR-PRV-11_impacto_doble_espasmo.wav` | impacto | 37.30–39.26 | 1.96 | -0.1 | -10.3 | media | Pulso medio y estallido final. |
| `ABR-PRV-12_atmosfera_deriva_orbital.wav` | atmosfera | 39.26–48.71 | 9.46 | -0.1 | -13.4 | baja | Ambiente sostenido de banda ancha con eventos esporádicos. |
| `ABR-PRV-13_impacto_golpe_y_disipacion.wav` | impacto | 48.71–51.21 | 2.50 | -0.0 | -9.3 | media | Golpe fuerte que se disipa en una textura media. |
| `ABR-PRV-14_riser_succion_ascendente.wav` | riser | 51.21–53.37 | 2.16 | -0.1 | -12.3 | media | Subida con brillo agudo creciente. |
| `ABR-PRV-15_textura_torrente_denso.wav` | textura | 53.37–57.39 | 4.02 | -0.1 | -6.4 | alta | Masa saturada de alta energía; corte seco al final. |
| `ABR-PRV-16_impacto_descenso_al_abismo.wav` | impacto | 57.39–69.57 | 12.18 | -0.1 | -16.6 | alta | Pre-subida tonal grave que desemboca en un boom con cola larga (~10 s). |
| `universfield-paranormal-horror-cinematic-498207.mp3` | pieza completa | — | 15,07 | — | — | — | Archivo original sin cortar ni recodificar (copia byte a byte). |

Fuentes: `ABERRATION_Cosmic_Horror_Sound_Effects_Official_Trailer_-_Ocular_Sounds_128k.flac` (61,74 s) y `Audio_Preview_-_Aberration.mp3` (70,49 s).
