// Precalcula los puntos de tierra del globo (lat/lon) a partir de Natural Earth 110m.
import fs from 'node:fs';
import { feature } from 'topojson-client';
import { geoContains } from 'd3-geo';

const topo = JSON.parse(fs.readFileSync(new URL('../node_modules/world-atlas/land-110m.json', import.meta.url)));
const land = feature(topo, topo.objects.land);
const dots = [];
const step = 1.5;
for (let lat = -84; lat <= 84; lat += step) {
  const n = Math.max(1, Math.round((360 / step) * Math.cos((lat * Math.PI) / 180)));
  for (let i = 0; i < n; i++) {
    const lon = -180 + (i + 0.5) * (360 / n);
    if (geoContains(land, [lon, lat])) dots.push([+lat.toFixed(2), +lon.toFixed(2)]);
  }
}
fs.writeFileSync(new URL('../assets/globe-dots.js', import.meta.url), `window.GLOBE_DOTS=${JSON.stringify(dots)};\n`);
console.log('dots', dots.length);
