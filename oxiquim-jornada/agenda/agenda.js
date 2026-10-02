// Genera agenda/Agenda_Jornada_Gerencia_de_Personas_Olmue.docx (node agenda/agenda.js)
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun, AlignmentType,
  WidthType, ShadingType, BorderStyle, LevelFormat, VerticalAlign, Footer, PageNumber, HeadingLevel,
} = require('docx');

// Lineamientos de marca 2025
const AZUL = '0055B8', OSCURO = '162851', GRIS = 'C6CAD3', AMARILLO = 'F9AB3A', VERDE = '225F58', MORADO = '410C5C';
const FONT = 'Trebuchet MS';
const CONTENT = 9638; // A4 con márgenes de 2 cm

const t = (text, o = {}) => new TextRun({ text, font: FONT, color: OSCURO, size: 21, ...o });
const p = (runs, o = {}) => new Paragraph({ children: Array.isArray(runs) ? runs : [runs], spacing: { after: 100, line: 276 }, ...o });
const h = (text, o = {}) => new Paragraph({
  heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 140 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: AMARILLO, space: 4 } },
  children: [new TextRun({ text, font: FONT, bold: true, color: AZUL, size: 28 })], ...o,
});
const bullet = (runs) => new Paragraph({ numbering: { reference: 'vinetas', level: 0 }, spacing: { after: 80, line: 264 }, children: Array.isArray(runs) ? runs : [runs] });
const step = (runs) => new Paragraph({ numbering: { reference: 'pasos', level: 0 }, spacing: { after: 80, line: 264 }, children: Array.isArray(runs) ? runs : [runs] });

const border = { style: BorderStyle.SINGLE, size: 4, color: GRIS };
const borders = { top: border, bottom: border, left: border, right: border };
const COLS = [1450, 3950, 1750, 2488];

function cell(text, w, o = {}) {
  const { fill, bold, color = OSCURO, italics, size = 19 } = o;
  return new TableCell({
    width: { size: w, type: WidthType.DXA }, borders, verticalAlign: VerticalAlign.CENTER,
    shading: fill ? { fill, type: ShadingType.CLEAR, color: 'auto' } : undefined,
    margins: { top: 70, bottom: 70, left: 110, right: 110 },
    children: [new Paragraph({ children: [t(text, { bold, color, italics, size })] })],
  });
}

// [hora, bloque, conduce, propósito, tipo]  tipo: trabajo | social | pausa | cierre
const AGENDA = [
  ['9:30 – 10:10', 'Bienvenida con desayuno en equipo', 'Todos', 'Encontrarnos como equipo', 'social'],
  ['10:10 – 10:25', 'Video introductorio: ¿qué haremos durante la jornada? Encuadre del día y acuerdos de conversación', 'Gerente de Personas', 'Alinear expectativas', 'trabajo'],
  ['10:25 – 11:05', 'Resultados del diagnóstico CIS Consultores', 'Gerente de Personas', 'Conocer los resultados', 'trabajo'],
  ['11:05 – 11:30', 'Conversación en grupos pequeños y preguntas al plenario', 'Todos', 'Procesar los resultados', 'trabajo'],
  ['11:30 – 11:40', 'Pausa', '', '', 'pausa'],
  ['11:40 – 12:20', 'Plan de trabajo: mirada desde el diagnóstico CIS', 'Gerente de Personas', 'Revisar el plan y entender cómo avanzaremos hacia un rol más estratégico', 'trabajo'],
  ['12:20 – 12:40', 'Preguntas sobre el plan de trabajo', 'Todos', 'Aclarar dudas', 'trabajo'],
  ['12:40 – 13:10', 'Comida rápida', '', 'Recargar energía', 'pausa'],
  ['13:10 – 13:40', 'Actividad breve al aire libre', 'Facilitador', 'Encontrarnos como equipo, fuera de la oficina', 'social'],
  ['13:40 – 15:00', 'Taller: de las prioridades a la hoja de ruta', 'Facilitador', 'Mirada común, prioridades claras y hoja de ruta compartida', 'trabajo'],
  ['15:00 – 15:25', 'Conclusiones y compromisos', 'Gerente de Personas y equipo', 'Cerrar con acuerdos explícitos', 'trabajo'],
  ['15:25 – 15:40', 'Cierre: «R35 necesita a personas» y foto grupal', 'Gerente de Personas', 'Mensaje final', 'cierre'],
  ['15:40 – 17:45', 'Asado', 'Todos', 'Compartir una jornada distinta', 'social'],
  ['18:00', 'Salida desde Olmué', '', '', 'pausa'],
];
const FILL = { trabajo: null, social: 'EEF3E9', pausa: 'F2F3F6', cierre: 'FEF1DC' };

const header = new TableRow({
  tableHeader: true,
  children: ['Hora', 'Bloque', 'Conduce', 'Para qué'].map((x, i) => cell(x, COLS[i], { fill: AZUL, bold: true, color: 'FFFFFF' })),
});
const rows = AGENDA.map(([hora, bloque, quien, para, tipo]) => new TableRow({
  cantSplit: true,
  children: [
    cell(hora, COLS[0], { fill: FILL[tipo], bold: true, color: AZUL }),
    cell(bloque, COLS[1], { fill: FILL[tipo], bold: tipo !== 'pausa', italics: tipo === 'pausa' }),
    cell(quien, COLS[2], { fill: FILL[tipo] }),
    cell(para, COLS[3], { fill: FILL[tipo], color: '4B5571' }),
  ],
}));
const agendaTable = new Table({ width: { size: CONTENT, type: WidthType.DXA }, columnWidths: COLS, rows: [header, ...rows] });

const legend = p([
  t('■ ', { color: 'B9CBA6' }), t('Encuentro y comida    ', { size: 18 }),
  t('■ ', { color: 'C9CCD4' }), t('Pausa o traslado    ', { size: 18 }),
  t('■ ', { color: AMARILLO }), t('Cierre    ', { size: 18 }),
  t('□ ', { color: GRIS }), t('Trabajo', { size: 18 }),
], { spacing: { before: 80, after: 120 } });

const logo = fs.readFileSync(path.join(__dirname, 'logo.png'));

const doc = new Document({
  creator: 'Gerencia de Personas · Oxiquim',
  title: 'Agenda Jornada Gerencia de Personas · Olmué',
  styles: { default: { document: { run: { font: FONT, size: 21, color: OSCURO } } } },
  numbering: {
    config: [
      { reference: 'vinetas', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 260 } }, run: { color: AZUL } } }] },
      { reference: 'pasos', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 300 } }, run: { color: AZUL, bold: true } } }] },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
    footers: {
      default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
        t('Propuesta de agenda · Jornada Gerencia de Personas · ', { size: 16, color: '7A8199' }),
        new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: '7A8199' }),
      ] })] }),
    },
    children: [
      new Paragraph({ children: [new ImageRun({ type: 'png', data: logo, transformation: { width: 180, height: 37 } })], spacing: { after: 360 } }),
      p(t('PROPUESTA DE AGENDA', { bold: true, color: AZUL, size: 20, characterSpacing: 40 }), { spacing: { after: 60 } }),
      p(t('Jornada Gerencia de Personas', { bold: true, size: 44 }), { spacing: { after: 40 } }),
      p(t('“Del diagnóstico a la acción”', { bold: true, color: MORADO, size: 30 }), { spacing: { after: 200 } }),
      p([t('Fecha: ', { bold: true }), t('miércoles 7 de octubre')], { spacing: { after: 40 } }),
      p([t('Lugar: ', { bold: true }), t('Olmué')], { spacing: { after: 40 } }),
      p([t('Horario: ', { bold: true }), t('9:30 a 17:45 · salida desde Olmué a las 18:00')], { spacing: { after: 40 } }),

      h('Objetivo de la jornada'),
      p(t('Conocer los resultados del diagnóstico realizado por CIS Consultores, revisar juntos el plan de trabajo que viene y entender cómo avanzaremos hacia una Gerencia de Personas con un rol más estratégico. También será un espacio para encontrarnos como equipo y compartir una jornada distinta, fuera de la oficina.')),
      p(t('Queremos terminar el día con:'), { spacing: { after: 60 } }),
      bullet([t('una mirada común,', { bold: true })]),
      bullet([t('prioridades claras', { bold: true })]),
      bullet([t('y una hoja de ruta compartida.', { bold: true })]),

      h('Agenda'),
      agendaTable,
      legend,

      h('Taller: de las prioridades a la hoja de ruta'),
      p(t('El taller produce los tres resultados que promete la invitación. Las conclusiones del día son la lectura de lo que el grupo acordó aquí.')),
      step([t('Mirada común (20 min). ', { bold: true }), t('Cada grupo completa la frase «En R35, la Gerencia de Personas será…». Luego se consolidan en una sola frase del equipo.')]),
      step([t('Prioridades claras (25 min). ', { bold: true }), t('Las iniciativas del plan de trabajo se ubican en tarjetas sobre una matriz de impacto y factibilidad. Cada persona vota con tres puntos adhesivos.')]),
      step([t('Hoja de ruta compartida (35 min). ', { bold: true }), t('Para las tres a cinco prioridades más votadas se define responsable, primer hito y fecha, en un muro visible para todos.')]),

      h('Consideraciones'),
      bullet([t('Preguntas después de cada presentación. ', { bold: true }), t('Antes del plenario, 10 a 15 minutos de conversación en grupos de 3 o 4 con dos preguntas guía: «¿qué nos sorprendió?» y «¿qué confirma lo que ya sabíamos?». También se pueden recibir preguntas anónimas en tarjetas.')]),
      bullet([t('Acuerdos de conversación. ', { bold: true }), t('Al inicio se explicita el objetivo del día y se acuerda la confidencialidad de los resultados del diagnóstico.')]),
      bullet([t('Comida rápida. ', { bold: true }), t('Debe ser sustanciosa y liviana (sándwiches, wraps o ensaladas): entre el desayuno y el asado hay cerca de cinco horas de trabajo.')]),
      bullet([t('Asado. ', { bold: true }), t('El parrillero o servicio externo debe comenzar durante el taller para tener todo listo a las 15:40, lejos de la sala por humo y ruido. Incluir opciones vegetarianas.')]),
      bullet([t('Traslado y alcohol. ', { bold: true }), t('Si en el asado hay alcohol, se recomienda traslado en bus contratado. Si cada persona maneja, asado sin alcohol.')]),
      bullet([t('Registro. ', { bold: true }), t('Una persona documenta los acuerdos y fotografía el muro de la hoja de ruta. La Gerencia de Personas envía la hoja de ruta al equipo dentro de los cinco días hábiles siguientes.')]),

      h('Por definir'),
      bullet([t('Hora de salida hacia Olmué, según el tiempo de traslado desde el punto de encuentro.')]),
      bullet([t('Número de participantes. El taller funciona bien con 10 a 25 personas; con más se necesita un segundo facilitador.')]),
      bullet([t('Si CIS Consultores participa en la presentación del diagnóstico.')]),
      bullet([t('Actividad al aire libre y facilitador del taller.')]),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  const out = path.join(__dirname, 'Agenda_Jornada_Gerencia_de_Personas_Olmue.docx');
  fs.writeFileSync(out, buf);
  console.log('ok', out);
});
