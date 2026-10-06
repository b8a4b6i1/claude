#!/usr/bin/env bash
# Descarga Trebuchet MS desde el paquete oficial "core fonts" de Microsoft y extrae los TTF a fonts/.
# Requiere cabextract. Figtree (sustituto de Goli, OFL) ya viene en fonts/.
set -euo pipefail
cd "$(dirname "$0")/.."
tmp=$(mktemp -d)
curl -sSL -o "$tmp/trebuc32.exe" https://downloads.sourceforge.net/corefonts/trebuc32.exe
cabextract -q -L -d "$tmp" -F "trebuc*.ttf" "$tmp/trebuc32.exe"
cp "$tmp/trebuc.ttf" "$tmp/trebucbd.ttf" fonts/
rm -r "$tmp"
echo "fonts ok"
