// Láminas 16:9 para la Jornada Gerencia de Personas (node build_deck.js)
// Arte: art/*.png (node build_art.mjs). Texto editable en Goli (títulos) y Trebuchet MS (texto).
const pptxgen = require('pptxgenjs');
const path = require('path');
const { applyTheme } = require('/root/.claude/skills/synced/2fe4c028-47d6-48f2-b0d2-6eec792ede35_b1daac43-1796-42b9-b6f0-96f1eb025bc2/pptx/scripts/apply_theme.js');

const ART = (n) => path.join(__dirname, 'art', n + '.png');
const OUT = path.join(__dirname, 'Laminas_Jornada_GPER.pptx');

// Paleta del video a color: azules de marca en el texto; verdes, morado y amarillo solo en la gráfica
const THEME = {
  name: 'Oxiquim Jornada GPER',
  headFontFace: 'Goli Bold',
  bodyFontFace: 'Trebuchet MS',
  colors: {
    dk1: '162851', lt1: 'FFFFFF', dk2: '4B5571', lt2: 'F4F7FC',
    accent1: '0055B8', accent2: '2A6FC4', accent3: '225F58', accent4: '819E49', accent5: '410C5C', accent6: 'F9AB3A',
    hlink: '0055B8', folHlink: '410C5C',
  },
};
const HEAD = 'Goli Bold', HEAD_MID = 'Goli Medium', HEAD_SEMI = 'Goli SemiBold', BODY = 'Trebuchet MS';

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13,333 × 7,5 in
pres.title = 'Jornada Gerencia de Personas · Del diagnóstico a la acción';
pres.author = 'Gerencia de Personas · Oxiquim';
pres.company = 'Oxiquim';
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;

const LOGO_W = 2400, LOGO_H = 490;               // art/logo.png
const FOOTER = [
  { text: 'Jornada Gerencia de Personas  ·  Del diagnóstico a la acción', options: { x: 0.8, y: 6.86, w: 7, h: 0.3, fontFace: BODY, fontSize: 11, color: C.text2, margin: 0, valign: 'middle' } },
];
const footerObjects = () => [
  { text: FOOTER[0] },
  { image: { path: ART('logo'), x: 11.33, y: 6.85, w: 1.2, h: 1.2 * LOGO_H / LOGO_W } },
];

/* ── layouts */
pres.defineSlideMaster({
  title: 'BIENVENIDA',
  background: { color: C.background1 },
  objects: [
    { image: { path: ART('logo'), x: (13.333 - 4.4) / 2, y: 1.75, w: 4.4, h: 4.4 * LOGO_H / LOGO_W } },
    { placeholder: { options: { name: 'kicker', type: 'body', x: 1, y: 3.35, w: 11.333, h: 0.75, align: 'center', valign: 'middle', fontFace: HEAD_MID, fontSize: 32, color: C.text2, margin: 0 }, text: '' } },
    { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 4.1, w: 12.133, h: 1.3, align: 'center', valign: 'middle', fontFace: HEAD, fontSize: 56, color: C.text1, margin: 0 }, text: '' } },
  ],
});
pres.defineSlideMaster({
  title: 'R35',
  background: { color: C.background1 },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 5.0, w: 12.133, h: 1.0, align: 'center', valign: 'middle', fontFace: HEAD, fontSize: 50, color: C.text1, margin: 0 }, text: '' } },
  ],
});
pres.defineSlideMaster({
  title: 'AGENDA',
  background: { color: C.background1 },
  objects: [
    ...footerObjects(),
    { placeholder: { options: { name: 'title', type: 'title', x: 0.8, y: 0.8, w: 11.7, h: 0.8, fontFace: HEAD, fontSize: 40, color: C.text1, margin: 0, valign: 'middle', align: 'left' }, text: '' } },
  ],
});
pres.defineSlideMaster({
  title: 'ACTIVIDAD',
  background: { color: C.background1 },
  objects: [
    { text: { text: 'PARA QUÉ', options: { x: 0.8, y: 5.02, w: 3, h: 0.3, fontFace: HEAD_SEMI, fontSize: 13, color: C.accent1, charSpacing: 3, margin: 0, valign: 'middle' } } },
    ...footerObjects(),
    { placeholder: { options: { name: 'eyebrow', type: 'body', x: 1.34, y: 1.95, w: 5.3, h: 0.4, fontFace: BODY, fontSize: 16, color: C.text2, margin: 0, valign: 'middle', align: 'left' }, text: '' } },
    { placeholder: { options: { name: 'title', type: 'title', x: 0.8, y: 2.45, w: 5.85, h: 1.45, fontFace: HEAD, fontSize: 42, color: C.text1, margin: 0, valign: 'top', align: 'left', lineSpacingMultiple: 0.95 }, text: '' } },
    { placeholder: { options: { name: 'sub', type: 'body', x: 0.8, y: 3.95, w: 5.6, h: 0.95, fontFace: BODY, fontSize: 19, color: C.text2, margin: 0, valign: 'top', align: 'left', lineSpacingMultiple: 1.1 }, text: '' } },
    { placeholder: { options: { name: 'purpose', type: 'body', x: 0.8, y: 5.36, w: 5.6, h: 1.0, fontFace: BODY, fontSize: 19, color: C.text1, margin: 0, valign: 'top', align: 'left', lineSpacingMultiple: 1.1 }, text: '' } },
  ],
});
pres.defineSlideMaster({
  title: 'ACTIVIDAD_ANCHA',
  background: { color: C.background1 },
  objects: [
    { text: { text: 'PARA QUÉ', options: { x: 0.8, y: 3.32, w: 3, h: 0.3, fontFace: HEAD_SEMI, fontSize: 13, color: C.accent1, charSpacing: 3, margin: 0, valign: 'middle' } } },
    ...footerObjects(),
    { placeholder: { options: { name: 'eyebrow', type: 'body', x: 1.34, y: 1.95, w: 11.2, h: 0.4, fontFace: BODY, fontSize: 16, color: C.text2, margin: 0, valign: 'middle', align: 'left' }, text: '' } },
    { placeholder: { options: { name: 'title', type: 'title', x: 0.8, y: 2.4, w: 11.7, h: 0.75, fontFace: HEAD, fontSize: 42, color: C.text1, margin: 0, valign: 'top', align: 'left' }, text: '' } },
    { placeholder: { options: { name: 'purpose', type: 'body', x: 0.8, y: 3.66, w: 11.7, h: 0.5, fontFace: BODY, fontSize: 19, color: C.text1, margin: 0, valign: 'top', align: 'left' }, text: '' } },
  ],
});

/* ── piezas comunes */
// pestaña de marca con el número de la actividad (orden del día)
// viñeta de marca (pestaña con punta, lineamientos 2025), en el color de la actividad
function tab(slide, color, name) {
  slide.addShape(pres.ShapeType.homePlate, { x: 0.8, y: 1.93, w: 0.36, h: 0.44, fill: { color }, line: { type: 'none' }, adjustPoint: 0.36, objectName: 'Viñeta ' + name });
}
function eyebrow(label, who) {
  return [
    { text: label, options: { fontFace: HEAD_SEMI, color: C.accent1 } },
    { text: '   ' + who, options: { fontFace: BODY, color: C.text2 } },
  ];
}
const ACT_ART = { x: 6.85, y: 0.75, w: 5.9, h: 5.9 * 1710 / 1770 };

/* ── apertura */
pres.addSection({ title: 'Apertura' });
{
  const s = pres.addSlide({ masterName: 'BIENVENIDA', sectionTitle: 'Apertura' });
  s.addText('Bienvenidos a la jornada', { placeholder: 'kicker' });
  s.addText([
    { text: '“Del diagnóstico a la ' },
    { text: 'acción”', options: { color: C.accent1 } },
  ], { placeholder: 'title' });
  s.addNotes('Bienvenida. Jornada Gerencia de Personas «Del diagnóstico a la acción». Casa Conecta.');
}

/* ── actividades (marcadas en amarillo en la agenda) */
/* ── agenda del día: dos columnas (mañana / tarde) sobre una línea de tiempo; pausas en gris */
{
  const s = pres.addSlide({ masterName: 'AGENDA', sectionTitle: 'Apertura' });
  s.addText('Agenda del día', { placeholder: 'title' });
  const COLS = [
    { label: 'MAÑANA', x: 0.8, rows: [
      ['08:30 – 09:00', 'Bienvenida y desayuno'],
      ['09:00 – 10:00', 'Video y diagnóstico CIS'],
      ['10:00 – 10:15', 'Conversación en grupos'],
      ['10:15 – 10:30', 'Pausa', true],
      ['10:30 – 13:30', 'Ordenamiento de prioridades'],
      ['13:30 – 14:30', 'Almuerzo', true],
    ] },
    { label: 'TARDE', x: 6.95, rows: [
      ['14:30 – 14:45', 'Resumen del trabajo'],
      ['14:45 – 15:45', 'Fundamentar la respuesta'],
      ['15:45 – 16:00', 'Pausa', true],
      ['16:00 – 17:00', 'Indicadores (KPI)'],
      ['17:00 – 17:30', 'Conclusiones y compromisos'],
      ['17:30 – 20:00', 'Convivencia en equipo', true],
    ] },
  ];
  const Y0 = 2.55, STEP = 0.7, DOT = 0.15;
  for (const col of COLS) {
    s.addText(col.label, { x: col.x, y: 1.85, w: 3, h: 0.32, fontFace: HEAD_SEMI, fontSize: 14, color: C.accent1, charSpacing: 3, margin: 0, valign: 'middle', isTextBox: true });
    // línea de tiempo que une los puntos de la columna
    s.addShape(pres.ShapeType.line, { x: col.x + DOT / 2, y: Y0, w: 0, h: STEP * (col.rows.length - 1), line: { color: 'C6D6EE', width: 1.5 }, objectName: 'Línea ' + col.label });
    col.rows.forEach(([time, act, pause], i) => {
      const y = Y0 + i * STEP;
      s.addShape(pres.ShapeType.ellipse, { x: col.x, y: y - DOT / 2, w: DOT, h: DOT,
        fill: { color: pause ? 'FFFFFF' : '0055B8' }, line: pause ? { color: 'B3CBEA', width: 1.5 } : { type: 'none' }, objectName: 'Punto ' + act });
      s.addText(time, { x: col.x + 0.38, y: y - 0.25, w: 1.45, h: 0.5, fontFace: HEAD_SEMI, fontSize: 15, color: pause ? C.text2 : C.accent1, margin: 0, valign: 'middle', isTextBox: true });
      s.addText(act, { x: col.x + 2.0, y: y - 0.25, w: 3.7, h: 0.5, fontFace: pause ? BODY : HEAD_MID, fontSize: 18, color: pause ? C.text2 : C.text1, margin: 0, valign: 'middle', fit: 'shrink', isTextBox: true });
    });
  }
  s.addNotes('Agenda del día, de 08:30 a 20:00.');
}

pres.addSection({ title: 'Actividades' });
const ACTS = [
  { color: C.accent1, art: 'results', label: 'Conduce', who: 'Gerente de Personas',
    title: 'Resultados del diagnóstico', sub: 'Presentación de los resultados de CIS Consultores', purpose: 'Conocer los resultados' },
  { color: C.accent3, art: 'groups', label: 'Participan', who: 'Todo el equipo',
    title: 'Conversación en grupos', sub: 'Y luego, preguntas al plenario', purpose: 'Procesar los resultados' },
  { color: C.accent5, art: 'priorities', label: 'Conduce', who: 'Gerente de Personas',
    title: 'Ordenamiento de prioridades', sub: 'Plan de trabajo: mirada desde el diagnóstico CIS. Primero individual, luego en plenario',
    purpose: 'Revisar el plan y entender cómo avanzaremos hacia un rol más estratégico',
    labels: [{ text: 'Primero, cada uno', y: 70 }, { text: 'Luego, en plenario', y: 905 }] },
  { color: C.accent4, art: 'summary', label: 'Participan', who: 'Todo el equipo',
    title: 'Resumen del trabajo', sub: 'Repaso de lo avanzado en la mañana', purpose: 'Aclarar dudas' },
  { color: C.accent1, art: 'reasons', label: 'Conduce', who: 'Facilitador',
    title: 'Fundamentar la respuesta', sub: 'Plan de trabajo: mirada desde el diagnóstico CIS. Plenario por grupo',
    purpose: 'Mirada común, prioridades claras y hoja de ruta compartida' },
  { color: C.accent3, art: 'kpi', label: 'Conduce', who: 'Facilitador',
    title: 'Indicadores (KPI)', sub: 'Plan de trabajo: mirada desde el diagnóstico CIS. Plenario por grupo',
    purpose: 'Mirada común, prioridades claras y hoja de ruta compartida' },
];
for (const a of ACTS) {
  const s = pres.addSlide({ masterName: 'ACTIVIDAD', sectionTitle: 'Actividades' });
  tab(s, a.color, a.title);
  s.addText(eyebrow(a.label, a.who), { placeholder: 'eyebrow' });
  s.addText(a.title, { placeholder: 'title' });
  s.addText(a.sub, { placeholder: 'sub' });
  s.addText(a.purpose, { placeholder: 'purpose' });
  s.addImage({ path: ART(a.art), ...ACT_ART, altText: a.title, objectName: 'Arte ' + a.title });
  for (const l of a.labels || []) {
    const k = ACT_ART.w / 1770;
    s.addText(l.text, { x: ACT_ART.x + 95 * k, y: ACT_ART.y + l.y * k - 0.17, w: 3.5, h: 0.34, fontFace: HEAD_SEMI, fontSize: 15, color: C.text2, margin: 0, valign: 'middle', isTextBox: true });
  }
  s.addNotes(`${a.title}. ${a.sub}. ${a.label}: ${a.who}. Para qué: ${a.purpose}.`);
}
{
  // 7 · conclusiones: el camino con los tres resultados del día
  const s = pres.addSlide({ masterName: 'ACTIVIDAD_ANCHA', sectionTitle: 'Actividades' });
  tab(s, C.accent5, 'Conclusiones');
  s.addText(eyebrow('Conduce', 'Gerente de Personas y equipo'), { placeholder: 'eyebrow' });
  s.addText('Conclusiones y compromisos', { placeholder: 'title' });
  s.addText('Cerrar con acuerdos explícitos', { placeholder: 'purpose' });
  const R = { x: 1.2, y: 4.15, w: 10.9 }; R.h = R.w * 760 / 3600; const k = R.w / 3600;
  s.addImage({ path: ART('road'), ...R, altText: 'Camino con tres hitos', objectName: 'Arte camino' });
  ['Mirada común', 'Prioridades claras', 'Hoja de ruta compartida'].forEach((t, i) => {
    const cx = R.x + [620, 1800, 2980][i] * k;
    s.addText(t, { x: cx - 1.7, y: R.y + 470 * k, w: 3.4, h: 0.45, fontFace: HEAD_SEMI, fontSize: 20, color: C.text1, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
  });
  s.addNotes('Conduce: Gerente de Personas y equipo. Conclusiones y compromisos. Para qué: cerrar con acuerdos explícitos. Resultados del día: mirada común, prioridades claras y hoja de ruta compartida.');
}

/* ── cierre */
pres.addSection({ title: 'Cierre' });
{
  const s = pres.addSlide({ masterName: 'R35', sectionTitle: 'Cierre' });
  const w = 8.6, h = w * 758 / 1817;
  s.addImage({ path: ART('r35'), x: (13.333 - w) / 2, y: 1.15, w, h, altText: 'R35 formado por personas', objectName: 'Arte R35' });
  s.addText([
    { text: 'NECESITA A ' },
    { text: 'PERSONAS.', options: { color: C.accent1 } },
  ], { placeholder: 'title' });
  s.addNotes('Cierre: «R35 necesita a personas».');
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log('ok', OUT);
})();
