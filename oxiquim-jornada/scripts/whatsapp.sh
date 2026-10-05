#!/usr/bin/env bash
# Versión para WhatsApp: el primer cuadro es la portada «R35 necesita a personas» (WhatsApp usa el primer
# cuadro como miniatura). Portada 0,6 s → fundido a blanco 0,4 s → video. Dos pasadas para quedar bajo 30 MB.
#   requiere out/video_master.mp4 (render --crf 8), out/audio.wav y out/cover_r35.png (render --stills 70.5)
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=${1:-oxiquim_jornada_gper_olmue_whatsapp.mp4}
TARGET_MB=${TARGET_MB:-29.0}                    # MB decimales, con margen bajo 30
PRE=1.0
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 out/video_master.mp4)
TOTAL=$(python3 -c "print($DUR+$PRE)")
AK=160
VK=$(python3 -c "print(int($TARGET_MB*1e6*8/$TOTAL/1000*0.985 - $AK))")
echo "duración ${TOTAL}s · video ${VK} kb/s · audio ${AK} kb/s"
FV="[1:v]format=yuv420p,fade=t=out:st=0.6:d=0.4:color=white,setsar=1[c];[0:v]format=yuv420p,setsar=1[m];[c][m]concat=n=2:v=1:a=0[v]"
IN=(-i out/video_master.mp4 -loop 1 -framerate 60 -t $PRE -i out/cover_r35.png -i out/audio.wav)
X264=(-c:v libx264 -preset slower -tune animation -profile:v high -level 4.2 -pix_fmt yuv420p -b:v ${VK}k -maxrate $((VK*2))k -bufsize $((VK*3))k -r 60)
ffmpeg -y -loglevel error "${IN[@]}" -filter_complex "$FV" -map "[v]" "${X264[@]}" -pass 1 -passlogfile out/x264pass -an -f null /dev/null
ffmpeg -y -loglevel error "${IN[@]}" -filter_complex "$FV;[2:a]adelay=1000|1000[a]" -map "[v]" -map "[a]" "${X264[@]}" -pass 2 -passlogfile out/x264pass \
  -c:a aac -b:a ${AK}k -ar 48000 -t "$TOTAL" -movflags +faststart "$OUT"
ls -la "$OUT"
