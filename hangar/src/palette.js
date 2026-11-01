// 64-entry palette for the hangar. Warm rust/wood/concrete base, graffiti hues, glow.
export const P = {
  white: '#ffffff', paper: '#f3eee4',
  wall0: '#e8e4da', wall1: '#d4cfc2', wall2: '#bdb7a8',
  con0: '#c9c6c0', con1: '#a6a29b', con2: '#8a8780', con3: '#6b6963', con4: '#4a4843', dark: '#2c2a28', ink: '#1a1816',
  wood6: '#e6d3ad', wood0: '#d3b88a', wood1: '#b8955f', wood2: '#9a7345', wood3: '#7b5834', wood4: '#5e4227', wood5: '#43301d',
  grey0: '#8d8579', grey1: '#6f685e', grey2: '#54504a',
  rust0: '#c4713f', rust1: '#a2542b', rust2: '#7d3d1f',
  steel0: '#a9b2b7', steel1: '#8e979c', steel2: '#636d73', steel3: '#3c4348',
  red: '#d93a2b', red2: '#9e2118', red3: '#e86a4f',
  orange: '#f08a24', orange2: '#f7b25a', yellow: '#f5cf2f', yellow2: '#fbe27a',
  lime: '#8fc93a', green: '#2f9e4f', green2: '#1d6e3a',
  teal: '#1fa3a0', teal2: '#157876', cyan: '#4cc4e6', cyan2: '#9be0f2',
  blue: '#2c63c9', blue2: '#5a8de0', navy: '#23367a',
  purple: '#7b3fb0', purple2: '#a572d6', magenta: '#c93a9a', pink: '#f28bb3', pink2: '#f9c2d8',
  skin0: '#f1d0b0', skin1: '#d9a17a', skin2: '#a8714c', skin3: '#7a4a30',
  glow0: '#fff6c8', glow1: '#ffe9a0',
  stone0: '#b9a98f', stone1: '#8d7d66', stone2: '#5e5242',
  fish0: '#f6a07a', fish1: '#ee7a55',
  black: '#16141a', cloth: '#26232b',
};
export const PALETTE_HEX = Object.values(P);
if (PALETTE_HEX.length !== 64) throw new Error('palette must have 64 entries, has ' + PALETTE_HEX.length);
export const PALETTE_RGB = PALETTE_HEX.map((hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
});
