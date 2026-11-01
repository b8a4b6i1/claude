import { LOOP, BEAT, TAU, hash } from './config.js';
import { spellHit } from './config.js';

/**
 * 8-bit sound: pulse + triangle + noise through the WebAudio API, no samples.
 * Everything is triggered by the visual clock crossing a time, so seeking or freezing (?t=) is silent
 * and the soundtrack always matches what is on screen.
 */
const MIDI = (m) => 440 * Math.pow(2, (m - 69) / 12);
const CHORD_ROOT = [45, 41, 48, 43];            // Am F C G, one bar = 2 s
const CHORD_IV = [[0, 3, 7, 12], [0, 4, 7, 12], [0, 4, 7, 12], [0, 4, 7, 12]];
const PENTA = [0, 3, 5, 7, 10];                // minor pentatonic for the melody
const STEP = 0.25;                              // 8th note at 120 bpm

export function createAudio() {
  let ctx = null, master = null, sfxBus = null, musicMode = false, noiseBuf = null, enabled = true, last = 0, unlocked = false;
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
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.22; master.connect(ctx.destination); sfxBus = ctx.createGain(); sfxBus.gain.value = 0.38; sfxBus.connect(master); // sound effects mix well below the music
    const len = ctx.sampleRate * 1.5; noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate); const d = noiseBuf.getChannelData(0);
    let v = 0; for (let i = 0; i < len; i++) { if (i % 3 === 0) v = Math.random() * 2 - 1; d[i] = Math.round(v * 8) / 8; } // sample-and-hold, 3-bit crush
  }
  const tone = (freq, dur, { type = 'pulse', duty = 0.5, vol = 0.5, slide = 0, attack = 0.005, rel = 0.05, vib = 0, at = 0 } = {}) => {
    if (!ctx || !enabled) return; const t0 = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain();
    if (type === 'pulse') o.setPeriodicWave(pulseWave(duty)); else o.type = type;
    o.frequency.setValueAtTime(freq, t0); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * Math.pow(2, slide)), t0 + dur);
    if (vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 6; lg.gain.value = freq * vib; l.connect(lg); lg.connect(o.frequency); l.start(t0); l.stop(t0 + dur + rel); }
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + attack); g.gain.setValueAtTime(vol, t0 + Math.max(attack, dur - rel)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + rel);
    o.connect(g); g.connect(musicMode ? master : sfxBus); o.start(t0); o.stop(t0 + dur + rel + 0.02);
  };
  const noise = (dur, { vol = 0.4, hp = 2000, lp = 9000, slide = 0, at = 0 } = {}) => {
    if (!ctx || !enabled) return; const t0 = ctx.currentTime + at, s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter();
    s.buffer = noiseBuf; s.loop = true; f.type = 'highpass'; f.frequency.value = hp; f2.type = 'lowpass'; f2.frequency.setValueAtTime(lp, t0); if (slide) f2.frequency.exponentialRampToValueAtTime(Math.max(80, lp * Math.pow(2, slide)), t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); s.connect(f); f.connect(f2); f2.connect(g); g.connect(musicMode ? master : sfxBus); s.start(t0); s.stop(t0 + dur + 0.02);
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
    chomp: () => { tone(MIDI(76), 0.07, { duty: 0.5, vol: 0.4, slide: -1.2 }); noise(0.14, { vol: 0.35, hp: 900, lp: 5000, slide: -1.5, at: 0.05 }); tone(MIDI(52), 0.18, { duty: 0.25, vol: 0.35, slide: -1, at: 0.08 }); },
    pop: () => { tone(MIDI(72), 0.06, { duty: 0.25, vol: 0.3, slide: 1 }); tone(MIDI(84), 0.1, { duty: 0.25, vol: 0.3, at: 0.06 }); },
    burn: () => { noise(1.6, { vol: 0.5, hp: 300, lp: 6000, slide: -2.2 }); tone(MIDI(64), 1.4, { duty: 0.125, vol: 0.3, slide: -1.6, vib: 0.03 }); },
    reform: () => { [48, 52, 55, 60, 64, 67, 72, 76].forEach((m, i) => tone(MIDI(m), 0.18, { duty: 0.25, vol: 0.3, at: i * 0.2 })); noise(0.6, { vol: 0.15, hp: 5000, at: 1.3 }); },
    confetti: () => [76, 79, 83, 88, 91, 95].forEach((m, i) => tone(MIDI(m), 0.09, { duty: 0.125, vol: 0.25, at: i * 0.06 })),
    float: () => tone(MIDI(69), 1.2, { type: 'triangle', vol: 0.35, slide: 0.5, vib: 0.02 }),
    sleep: () => [69, 65, 62, 57].forEach((m, i) => tone(MIDI(m), 0.35, { type: 'triangle', vol: 0.45, at: i * 0.42 })),
    choir: (i) => { const m = 60 + [0, 3, 5, 7, 10][i % 5] + (i > 4 ? 12 : 0); tone(MIDI(m + 12), 0.5, { duty: 0.25, vol: 0.32, vib: 0.012, rel: 0.2 }); tone(MIDI(m), 0.5, { type: 'triangle', vol: 0.3, rel: 0.2 }); },
    tick: () => noise(0.025, { vol: 0.22, hp: 6000 }),
  };
  // ---------------------------------------------------------------- music
  const stepNote = (s) => {
    const t = s * STEP, bar = Math.floor(s / 8), pos = s % 8, ci = bar % 4, root = CHORD_ROOT[ci], iv = CHORD_IV[ci];
    const awake = t >= 10.5 && t < 77, choir = t >= 17 && t < 40, roar = t >= 42 && t < 50, calm = t >= 52 && t < 77, outro = t >= 77 && t < 88;
    // bass (triangle)
    if (t >= 4 && t < 88 && [0, 3, 4, 6].includes(pos)) tone(MIDI(root + (pos === 4 ? 7 : pos === 6 ? 12 : 0)), STEP * 0.9, { type: 'triangle', vol: roar ? 0.7 : 0.55 });
    // arpeggio (pulse 25 %)
    if (t >= 2 && t < 88) tone(MIDI(root + 24 + iv[pos % 4]), STEP * 0.8, { duty: 0.25, vol: (choir || roar ? 0.2 : 0.12) * (outro ? 0.7 : 1), rel: 0.03 });
    // melody (pulse 50 %)
    if ((choir || roar || calm) && pos % 2 === 0) {
      const h = hash(s * 1.7 + 3.1), idx = Math.floor(h * 5), up = hash(s * 0.9) > 0.55 ? 12 : 0;
      if (hash(s * 4.3) > 0.2) tone(MIDI(root + 36 + PENTA[idx] + up - (ci === 1 ? 1 : 0)), STEP * 1.6, { duty: 0.5, vol: roar ? 0.26 : 0.22, vib: 0.008, rel: 0.1 });
    }
    // drums
    const drums = choir || roar || calm;
    if (drums && (pos === 0 || pos === 4)) { tone(MIDI(36), 0.12, { type: 'sine', vol: 0.8, slide: -2, rel: 0.02 }); }
    if (drums && (pos === 2 || pos === 6)) noise(0.12, { vol: roar ? 0.45 : 0.32, hp: 1200, lp: 7000 });
    if ((choir && t >= 22) || roar) if (pos % 2 === 1 || roar) noise(0.03, { vol: 0.12, hp: 7000 });
  };
  // ---------------------------------------------------------------- event schedule (loop time -> sound)
  const crossed = (a, b, x) => x > a && x <= b;
  function fire(a, b) {
    // music steps
    musicMode = true; for (let s = Math.floor(a / STEP) + 1; s <= Math.floor(b / STEP); s++) stepNote(s); musicMode = false;
    // one-shot and periodic effects
    if (crossed(a, b, 10.5)) sfx.wake();
    if (crossed(a, b, 16.2)) sfx.summon();
    if (crossed(a, b, 36.0)) sfx.disperse();
    if (crossed(a, b, 38.6)) sfx.sit();
    if (crossed(a, b, BEAT.burst)) { sfx.roar(); setTimeout(() => sfx.confetti(), 250); }
    if (crossed(a, b, BEAT.burst + 0.6)) sfx.float();
    for (const [tk, rs] of [[65, 84], [68.5, 84.6], [72, 85.2], [75.5, 85.8], [79, 86.4]]) { if (crossed(a, b, tk)) sfx.chomp(); if (crossed(a, b, rs)) sfx.pop(); }
    if (crossed(a, b, 52.6)) sfx.burn();
    if (crossed(a, b, 58.6)) sfx.reform();
    if (crossed(a, b, 77.5)) sfx.sleep();
    for (let n = 0; n <= 13; n++) { const tc = 13.5 + 4.5 * n; if (tc > 52.8 && tc < 61.4) continue; if (crossed(a, b, tc)) sfx.cast(); if (crossed(a, b, tc + 0.9)) { sfx.hit(); const idx = n % 3; if (idx === 0) sfx.twirl(); else if (idx === 1) sfx.ouch(); else sfx.boing(); } }
    for (let k = 3; k < 45; k++) { const tc = 0.5 + 2 * k; if (tc > 6 && crossed(a, b, tc)) sfx.coin(); }
    for (let k = 0; k < 10; k++) { const tc = 22 + 1.5 * k; if (tc < 36 && crossed(a, b, tc)) { sfx.choir(Math.floor(Math.max(0, tc - 22 + 0.4) / 1.5) % 5); sfx.tick(); } }
    for (let t = 40.0; t < 52; t += 0.35 + 0.15 * hash(t * 7)) if (crossed(a, b, t)) sfx.key();
  }
  function update(t) {
    if (!ctx || !enabled || ctx.state !== 'running') { last = t; return; }
    if (t < last - 1) { last = t; return; }               // loop wrap: fire the (tiny) part of the new loop next frame
    if (t - last > 0.5 || t === last) { last = t; return; } // freeze / seek / tab was hidden
    fire(last, t); last = t;
  }
  function unlock() { init(); if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {}); unlocked = true; }
  return { update, unlock, setEnabled(v) { enabled = v; if (ctx) { if (v && ctx.state === 'suspended') ctx.resume(); master.gain.value = v ? 0.22 : 0; } }, get enabled() { return enabled; }, get running() { return !!ctx && ctx.state === 'running'; }, get unlocked() { return unlocked; } };
}
