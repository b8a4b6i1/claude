import { LOOP, BEAT, TAU, hash } from './config.js';
import SONG from './song.js';
import { spellHit } from './config.js';

/**
 * 8-bit sound: pulse + triangle + noise through the WebAudio API, no samples.
 * Everything is triggered by the visual clock crossing a time, so seeking or freezing (?t=) is silent
 * and the soundtrack always matches what is on screen.
 */
const MIDI = (m) => 440 * Math.pow(2, (m - 69) / 12);

export function createAudio() {
  let ctx = null, master = null, sfxBus = null, noiseBuf = null, enabled = true, last = 0, unlocked = false;
  const waves = {};
  const pulseWave = (d) => {
    if (waves[d]) return waves[d];
    const N = 24, re = new Float32Array(N + 1), im = new Float32Array(N + 1);
    for (let n = 1; n <= N; n++) im[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * d); // sine series of a pulse with duty d
    return (waves[d] = ctx.createPeriodicWave(re, im));
  };
  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.22; master.connect(ctx.destination); sfxBus = ctx.createGain(); sfxBus.gain.value = 0.4; sfxBus.connect(master); // effects sit well below the song
    const len = ctx.sampleRate * 1.5; noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate); const d = noiseBuf.getChannelData(0);
    let v = 0; for (let i = 0; i < len; i++) { if (i % 3 === 0) v = Math.random() * 2 - 1; d[i] = Math.round(v * 8) / 8; } // sample-and-hold, 3-bit crush
  }
  const tone = (freq, dur, { type = 'pulse', duty = 0.5, vol = 0.5, slide = 0, attack = 0.005, rel = 0.05, vib = 0, at = 0 } = {}) => {
    if (!ctx || !enabled) return; const t0 = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain();
    if (type === 'pulse') o.setPeriodicWave(pulseWave(duty)); else o.type = type;
    o.frequency.setValueAtTime(freq, t0); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * Math.pow(2, slide)), t0 + dur);
    if (vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 6; lg.gain.value = freq * vib; l.connect(lg); lg.connect(o.frequency); l.start(t0); l.stop(t0 + dur + rel); }
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + attack); g.gain.setValueAtTime(vol, t0 + Math.max(attack, dur - rel)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + rel);
    o.connect(g); g.connect(sfxBus); o.start(t0); o.stop(t0 + dur + rel + 0.02);
  };
  const noise = (dur, { vol = 0.4, hp = 2000, lp = 9000, slide = 0, at = 0 } = {}) => {
    if (!ctx || !enabled) return; const t0 = ctx.currentTime + at, s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter();
    s.buffer = noiseBuf; s.loop = true; f.type = 'highpass'; f.frequency.value = hp; f2.type = 'lowpass'; f2.frequency.setValueAtTime(lp, t0); if (slide) f2.frequency.exponentialRampToValueAtTime(Math.max(80, lp * Math.pow(2, slide)), t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); s.connect(f); f.connect(f2); f2.connect(g); g.connect(sfxBus); s.start(t0); s.stop(t0 + dur + 0.02);
  };
  // ---------------------------------------------------------------- sound effects
  const sfx = {
    wake: () => { tone(MIDI(33), 0.4, { type: 'triangle', vol: 0.6 }); [57, 64, 69, 76].forEach((m, i) => tone(MIDI(m), 0.12, { duty: 0.25, vol: 0.35, at: 0.15 + i * 0.09 })); },
    cast: () => { tone(MIDI(60), 0.55, { duty: 0.125, vol: 0.35, slide: 1.2, vib: 0.01 }); noise(0.25, { vol: 0.15, hp: 4000 }); },
    hit: () => { noise(0.3, { vol: 0.4, hp: 600, lp: 6000, slide: -2 }); tone(MIDI(72), 0.25, { duty: 0.25, vol: 0.35, slide: -1.3 }); },
    coin: () => { tone(MIDI(83), 0.06, { duty: 0.5, vol: 0.3 }); tone(MIDI(88), 0.22, { duty: 0.5, vol: 0.3, at: 0.06 }); },
    boing: () => tone(MIDI(48), 0.4, { duty: 0.5, vol: 0.4, slide: 1.4, vib: 0.03 }),
    ouch: () => { tone(MIDI(52), 0.1, { duty: 0.25, vol: 0.4, slide: -0.5 }); tone(MIDI(45), 0.25, { duty: 0.25, vol: 0.4, slide: -0.5, at: 0.1 }); },
    twirl: () => [72, 76, 79, 84, 88].forEach((m, i) => tone(MIDI(m), 0.07, { duty: 0.25, vol: 0.3, at: i * 0.07 })),
    summon: () => { [57, 60, 64, 67, 72, 76, 79, 84].forEach((m, i) => tone(MIDI(m), 0.1, { duty: 0.125, vol: 0.3, at: i * 0.07 })); noise(0.7, { vol: 0.12, hp: 5000 }); },
    disperse: () => { noise(0.9, { vol: 0.3, hp: 800, lp: 9000, slide: -2.5 }); [84, 79, 76, 72, 67, 64, 60].forEach((m, i) => tone(MIDI(m), 0.1, { duty: 0.25, vol: 0.28, at: i * 0.08 })); },
    sit: () => { tone(MIDI(40), 0.08, { type: 'triangle', vol: 0.6 }); noise(0.06, { vol: 0.2, hp: 500, lp: 2500 }); },
    key: () => noise(0.03, { vol: 0.22, hp: 3500, lp: 8000 }),
    roar: () => { noise(1.6, { vol: 0.6, hp: 80, lp: 1200, slide: -1.5 }); tone(MIDI(28), 1.4, { type: 'sawtooth', vol: 0.4, slide: -0.6, vib: 0.02 }); tone(MIDI(40), 1.0, { duty: 0.125, vol: 0.3, slide: -0.4, at: 0.05 }); },
    confetti: () => [76, 79, 83, 88, 91, 95].forEach((m, i) => tone(MIDI(m), 0.09, { duty: 0.125, vol: 0.25, at: i * 0.06 })),
    float: () => tone(MIDI(69), 1.2, { type: 'triangle', vol: 0.35, slide: 0.5, vib: 0.02 }),
    sleep: () => [69, 65, 62, 57].forEach((m, i) => tone(MIDI(m), 0.35, { type: 'triangle', vol: 0.45, at: i * 0.42 })),
    choir: (i) => { const m = 60 + [0, 3, 5, 7, 10][i % 5] + (i > 4 ? 12 : 0); tone(MIDI(m + 12), 0.5, { duty: 0.25, vol: 0.32, vib: 0.012, rel: 0.2 }); tone(MIDI(m), 0.5, { type: 'triangle', vol: 0.3, rel: 0.2 }); },
    tick: () => noise(0.025, { vol: 0.22, hp: 6000 }),
  };
  // ---------------------------------------------------------------- soundtrack: the user's song, converted to real 8-bit PCM (11.025 kHz mono) and looped over the 90 s story
  let songBuf = null, songSrc = null, songGain = null, lastT = 0;
  async function loadSong() {
    if (!SONG || songBuf || !ctx) return;
    try { const ab = await (await fetch(SONG)).arrayBuffer(); songBuf = await ctx.decodeAudioData(ab); startSong(); } catch (e) { /* no song: effects only */ }
  }
  function startSong() {
    if (!ctx || !songBuf || songSrc || !enabled) return;
    songSrc = ctx.createBufferSource(); songSrc.buffer = songBuf; songSrc.loop = true; songGain = ctx.createGain(); songGain.gain.value = 0.9;
    songSrc.connect(songGain); songGain.connect(master); songSrc.start(0, ((lastT % songBuf.duration) + songBuf.duration) % songBuf.duration);
  }
  // ---------------------------------------------------------------- event schedule (loop time -> sound)
  const crossed = (a, b, x) => x > a && x <= b;
  function fire(a, b) {
    // one-shot and periodic effects
    if (crossed(a, b, 10.5)) sfx.wake();
    if (crossed(a, b, 16.2)) sfx.summon();
    if (crossed(a, b, 36.0)) sfx.disperse();
    if (crossed(a, b, 38.6)) sfx.sit();
    if (crossed(a, b, BEAT.burst)) { sfx.roar(); setTimeout(() => sfx.confetti(), 250); }
    if (crossed(a, b, BEAT.burst + 0.6)) sfx.float();
    if (crossed(a, b, 77.5)) sfx.sleep();
    for (let n = 0; n <= 13; n++) { const tc = 13.5 + 4.5 * n; if (crossed(a, b, tc)) sfx.cast(); if (crossed(a, b, tc + 0.9)) { sfx.hit(); const idx = n % 3; if (idx === 0) sfx.twirl(); else if (idx === 1) sfx.ouch(); else sfx.boing(); } }
    for (let k = 3; k < 45; k++) { const tc = 0.5 + 2 * k; if (tc > 6 && crossed(a, b, tc)) sfx.coin(); }
    for (let k = 0; k < 10; k++) { const tc = 22 + 1.5 * k; if (tc < 36 && crossed(a, b, tc)) { sfx.choir(Math.floor(Math.max(0, tc - 22 + 0.4) / 1.5) % 5); sfx.tick(); } }
    for (let t = 40.0; t < 52; t += 0.35 + 0.15 * hash(t * 7)) if (crossed(a, b, t)) sfx.key();
  }
  function update(t) {
    lastT = t;
    if (!ctx || !enabled || ctx.state !== 'running') { last = t; return; }
    if (t < last - 1) { last = t; return; }               // loop wrap: fire the (tiny) part of the new loop next frame
    if (t - last > 0.5 || t === last) { last = t; return; } // freeze / seek / tab was hidden
    fire(last, t); last = t;
  }
  function unlock() { init(); if (ctx && ctx.state === 'suspended') ctx.resume(); unlocked = true; loadSong(); }
  return { update, unlock, setEnabled(v) { enabled = v; if (ctx) { if (v && ctx.state === 'suspended') ctx.resume(); master.gain.value = v ? 0.22 : 0; if (v) { loadSong(); startSong(); } } }, get enabled() { return enabled; }, get unlocked() { return unlocked; } };
}
