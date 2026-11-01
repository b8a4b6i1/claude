import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const minify = process.argv.includes('--minify');

await mkdir('dist', { recursive: true });
// the soundtrack (user-supplied song, 8-bit) is embedded only if audio/presente-loop-8bit.wav exists locally
if (existsSync('audio/presente-loop-8bit.wav')) {
  const b64 = (await readFile('audio/presente-loop-8bit.wav')).toString('base64');
  await writeFile('src/song.js', `export default 'data:audio/wav;base64,${b64}';\n`);
} else await writeFile('src/song.js', 'export default null;\n');

await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  format: 'iife',
  target: ['es2020'],
  outfile: 'dist/app.js',
  minify,
  sourcemap: minify ? false : 'inline',
  legalComments: 'none',
  logLevel: 'info',
});

const js = await readFile('dist/app.js', 'utf8');
const safeJs = js.replace(/<\/script/gi, '<\\/script');

const css = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  html, body {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: #9be0f2;
  }
  body { -webkit-tap-highlight-color: transparent; }
  #frame {
    position: fixed;
    left: 50%;
    top: 50%;
    width: 100vw;
    height: 100vh;
    transform: translate(-50%, -50%);
    background: #9be0f2;
  }
  @media (max-width: 620px) {
    #frame { width: 100vw; height: 100vh; }
  }
  #stage {
    display: block;
    width: 100%;
    height: 100%;
    background: #9be0f2;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    outline: none;
  }
  #snd { position: fixed; right: 14px; bottom: 14px; width: 40px; height: 40px; border: 2px solid #1a1816; background: #fff; border-radius: 4px; padding: 6px; cursor: pointer; opacity: 0.55; }
  #snd:hover, #snd:focus-visible { opacity: 1; outline: none; }
  #snd.wait { animation: sndpulse 1.1s ease-in-out infinite; }
  @keyframes sndpulse { 0%, 100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 1; transform: scale(1.12); } }
  #snd svg { width: 100%; height: 100%; display: block; }
  #fallback {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    background: #ffffff;
    color: #333a3d;
    font: 14px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
    letter-spacing: 0.02em;
    text-align: center;
    padding: 2rem;
  }
  #fallback[hidden] { display: none; }
`;

function page(scriptTag) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<link rel="icon" href="data:," />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#ffffff" />
<title>Hangar — a small diorama</title>
<style>${css}</style>
</head>
<body>
<div id="frame"><canvas id="stage" aria-label="A real-time rendered miniature hangar diorama" tabindex="-1"></canvas></div>
<button id="snd" type="button" aria-label="Sonido" title="Sonido"><svg viewBox="0 0 16 16" shape-rendering="crispEdges"><path fill="#1a1816" d="M2 6h3l3-3v10l-3-3H2z"/><path id="snd-on" fill="#1a1816" d="M10 6h1v4h-1zM12 4h1v8h-1z"/><path id="snd-off" fill="#d93a2b" d="M10 5h1v1h-1zM11 6h1v1h-1zM12 7h1v1h-1zM13 8h1v1h-1zM10 9h1v1h-1zM13 5h1v1h-1zM12 6h1v1h-1zM11 8h1v1h-1zM10 7h1v1h-1z" display="none"/></svg></button>
<div id="fallback" hidden>This diorama needs a browser with WebGL2 enabled.</div>
${scriptTag}
</body>
</html>
`;
}

await writeFile('index.html', page('<script src="./dist/app.js"></script>'));
await writeFile('hangar-diorama.html', page(`<script>${safeJs}</script>`));

console.log(`built dist/app.js (${(js.length / 1024).toFixed(0)} kB), index.html, hangar-diorama.html`);
