/* ==========================================================================
   esquema.js — EL CUESTIONARIO. Textos, opciones y condiciones de cada pregunta.

   Fuente: "GLP Plantilla estándar – Encuesta de Clima Laboral (SGC)".
   Para cambiar una pregunta se edita acá; js/tablero.js la dibuja sola.
   Si se agrega, quita o renombra un `codigo`, hay que replicarlo en
   CATALOGOS y COLUMNAS de apps-script.gs (se guarda fuera de este repositorio).
   ========================================================================== */

window.ENCUESTA = {
  meta: {
    codigo: 'FO-SGC-05-IDI.11',
    anio: 2026,
    area: 'Guardia Local de Prevención · Gobierno de Río Cuarto',

    /* URL /exec del Apps Script (ver DESPLIEGUE.md, fuera de este repositorio). Es una dirección
       para recibir respuestas, no una clave. Vacía = la encuesta no recibe envíos. */
    endpoint: 'https://script.google.com/macros/s/AKfycbyxQhv2vHeZHlBnemeVFqx4VcdAajy27yurvJz1yKaPqRiII9vz1QJSmPsDswQSAMayug/exec'
  },

  escalas: {
    conformidad: [
      { val: 5, label: 'Muy conforme', icono: 'sentiment_very_satisfied' },
      { val: 4, label: 'Conforme', icono: 'sentiment_satisfied' },
      { val: 3, label: 'Ni conforme ni disconforme', icono: 'sentiment_neutral' },
      { val: 2, label: 'Poco conforme', icono: 'sentiment_dissatisfied' },
      { val: 1, label: 'Nada conforme', icono: 'sentiment_very_dissatisfied' }
    ],
    acuerdo: [
      { val: 5, label: 'Totalmente de acuerdo', icono: 'sentiment_very_satisfied' },
      { val: 4, label: 'De acuerdo', icono: 'sentiment_satisfied' },
      { val: 3, label: 'Ni de acuerdo ni en desacuerdo', icono: 'sentiment_neutral' },
      { val: 2, label: 'En desacuerdo', icono: 'sentiment_dissatisfied' },
      { val: 1, label: 'Totalmente en desacuerdo', icono: 'sentiment_very_dissatisfied' }
    ],
    satisfaccion: [
      { val: 5, label: 'Muy satisfecho/a', icono: 'sentiment_very_satisfied' },
      { val: 4, label: 'Satisfecho/a', icono: 'sentiment_satisfied' },
      { val: 3, label: 'Ni satisfecho/a ni insatisfecho/a', icono: 'sentiment_neutral' },
      { val: 2, label: 'Insatisfecho/a', icono: 'sentiment_dissatisfied' },
      { val: 1, label: 'Muy insatisfecho/a', icono: 'sentiment_very_dissatisfied' }
    ]
  },

  bloques: [
    {
      numero: 1,
      corto: 'Datos',
      titulo: 'Datos generales',
      icono: 'badge',
      nota: 'Respuestas cerradas y sin identificación personal',
      preguntas: [
        {
          codigo: 'p1', numero: '1', tipo: 'unica',
          texto: 'Área en la que trabaja',
          opciones: ['Compañía 1', 'Compañía 2', 'Compañía 3', 'Compañía 4', 'Ojos en Alerta', 'Guardia Central', 'Logística / Administración']
        },
        {
          codigo: 'p2', numero: '2', tipo: 'unica',
          texto: 'Género',
          opciones: ['Mujer', 'Varón', 'Otra identidad', 'Prefiero no responder']
        },
        {
          codigo: 'p2_1', numero: '2.1', tipo: 'unica',
          texto: '¿Con cuál de estas opciones se identifica?',
          opciones: ['Mujer trans / travesti', 'Varón trans / masculinidad trans', 'No binario', 'Otra identidad / ninguna de las anteriores'],
          cond: function (r) { return r.p2 === 'Otra identidad'; }
        },
        {
          codigo: 'p3', numero: '3', tipo: 'unica',
          texto: 'Tiempo trabajando en el área',
          opciones: ['Menos de 1 año', 'De 1 a 2 años', 'Más de 2 años (desde la creación del área)']
        },
        {
          codigo: 'p4', numero: '4', tipo: 'unica',
          texto: 'Tarea que desempeña',
          opciones: ['Operativo', 'Administrativo', 'Técnico / Profesional / Jerárquico']
        },
        {
          codigo: 'p5', numero: '5', tipo: 'unica',
          texto: '¿Está conforme con el área donde trabaja y con las tareas que realiza actualmente?',
          opciones: ['Sí, conforme con ambas', 'No con el área', 'No con las tareas', 'No con ninguna de las dos']
        },
        {
          codigo: 'p5_1', numero: '5.1', tipo: 'multiple', max: 3,
          texto: '¿Qué es lo que más pesa en su disconformidad?',
          opciones: [
            'Tareas poco claras o sin sentido',
            'Carga de trabajo',
            'Turnos, horarios y descansos',
            'Falta de herramientas, insumos o equipamiento',
            'Relación con la jefatura',
            'Relación con compañeros/as',
            'Condiciones de seguridad e higiene',
            'Falta de reconocimiento',
            'Falta de oportunidades de desarrollo',
            'Demoras o dudas con la facturación y el cobro',
            'Falta de contención o acompañamiento emocional ante situaciones difíciles de la tarea',
            'Otro'
          ],
          otro: 'Indique el motivo de disconformidad',
          cond: function (r) { return Boolean(r.p5) && r.p5 !== 'Sí, conforme con ambas'; }
        },
        {
          codigo: 'p5_2', numero: '5.2', tipo: 'unica',
          texto: '¿En qué área preferiría trabajar?',
          opciones: ['Compañías', 'Ojos en Alerta', 'Guardia Central', 'Logística', 'Administración', 'Otro'],
          otro: 'Indique en qué área prefiere trabajar',
          porque: { codigo: 'p5_2_porque', etiqueta: '5.2.1 · ¿Por qué prefiere dicha área?' },
          cond: function (r) { return r.p5 === 'No con el área' || r.p5 === 'No con ninguna de las dos'; }
        }
      ]
    },
    {
      numero: 2,
      corto: 'Ambiente',
      titulo: 'Ambiente laboral',
      icono: 'groups',
      nota: 'Una respuesta por pregunta',
      preguntas: [
        { codigo: 'p6', numero: '6', tipo: 'likert', escala: 'conformidad', texto: 'En general, ¿cómo me siento con el ambiente laboral?' },
        { codigo: 'p7', numero: '7', tipo: 'likert', escala: 'conformidad', texto: '¿Entiendo bien cuáles son mis tareas y responsabilidades?' },
        { codigo: 'p8', numero: '8', tipo: 'likert', escala: 'conformidad', texto: '¿Tengo la información, las herramientas y los materiales que necesito para hacer mi trabajo?' },
        { codigo: 'p9', numero: '9', tipo: 'likert', escala: 'conformidad', texto: '¿Recibo apoyo, guía y buen trato de mi superior directo/a?' },
        { codigo: 'p10', numero: '10', tipo: 'likert', escala: 'conformidad', texto: '¿Me llevo bien y trabajo en equipo con mis compañeros/as?' },
        { codigo: 'p11', numero: '11', tipo: 'likert', escala: 'conformidad', texto: '¿Las condiciones de seguridad e higiene en mi lugar de trabajo son adecuadas? (incluye bases, móviles y recorridos)' },
        { codigo: 'p12', numero: '12', tipo: 'likert', escala: 'conformidad', texto: '¿La comunicación con mi superior directo/a es clara y suficiente?' }
      ]
    },
    {
      numero: 3,
      corto: 'Motivación',
      titulo: 'Motivación y compromiso',
      icono: 'emoji_events',
      nota: 'Una respuesta por afirmación',
      preguntas: [
        { codigo: 'p13', numero: '13', tipo: 'likert', escala: 'acuerdo', texto: 'Conozco mis condiciones contractuales.' },
        { codigo: 'p14', numero: '14', tipo: 'likert', escala: 'acuerdo', texto: 'Conozco mis obligaciones de acuerdo al contrato.' },
        { codigo: 'p15', numero: '15', tipo: 'likert', escala: 'acuerdo', texto: 'Estoy comprometido/a con las metas y objetivos de mi área.' },
        { codigo: 'p16', numero: '16', tipo: 'likert', escala: 'acuerdo', texto: 'Uso bien los recursos disponibles (tiempo, herramientas).' },
        { codigo: 'p17', numero: '17', tipo: 'likert', escala: 'acuerdo', texto: 'Estoy motivado/a para realizar mis tareas diarias.' },
        { codigo: 'p18', numero: '18', tipo: 'likert', escala: 'acuerdo', texto: 'Me siento valorado/a por mi aporte al equipo.' }
      ]
    },
    {
      numero: 4,
      corto: 'Capacitación',
      titulo: 'Capacitación y desarrollo',
      icono: 'school',
      nota: 'Oportunidades y necesidades',
      preguntas: [
        { codigo: 'p19', numero: '19', tipo: 'likert', escala: 'satisfaccion', texto: '¿Qué tan satisfecho/a está con las oportunidades de capacitación relacionadas con su tarea?' },
        {
          codigo: 'p20', numero: '20', tipo: 'multiple',
          texto: 'Capacitaciones que considera necesarias para mejorar su tarea diaria',
          opciones: [
            'Herramientas informáticas (Excel, Word, Google Sheets, etc.)',
            'Procesos administrativos y de gestión',
            'Normativa de faltas (municipales y provinciales) y procedimiento de actas, clausuras y secuestros',
            'Gestión de riesgo climático y protección civil',
            'Resolución pacífica de conflictos y mediación',
            'RCP – Primeros auxilios',
            'Liderazgo y gestión de equipos',
            'Talleres de fortalecimiento personal y trabajo colaborativo',
            'Comunicación productiva en equipos',
            'Educación emocional en contextos de alta exigencia',
            'Otro'
          ],
          otro: 'Indique qué capacitación le gustaría realizar'
        }
      ]
    },
    {
      numero: 5,
      corto: 'Procesos',
      titulo: 'Procesos y procedimientos',
      icono: 'account_tree',
      nota: 'Una respuesta por afirmación',
      preguntas: [
        { codigo: 'p21', numero: '21', tipo: 'likert', escala: 'acuerdo', texto: 'Los procedimientos de trabajo de mi sector están claros y se respetan.' },
        {
          codigo: 'p21_1', numero: '21.1', tipo: 'multiple', max: 2,
          texto: '¿Qué es lo que más pesa en que los procedimientos no estén claros o no se respeten?',
          opciones: [
            'No están escritos o no los conozco',
            'Son confusos o difíciles de cumplir',
            'Cambian seguido y no se avisa',
            'Cada jefe o compañero los aplica distinto',
            'No se controla que se cumplan',
            'Algunos los respetan y otros no',
            'Tienen demasiados pasos o trámites que demoran el trabajo',
            'No recibí capacitación sobre cómo hacerlo',
            'Otro'
          ],
          otro: 'Indique el motivo de desacuerdo',
          cond: function (r) { return r.p21 === 1 || r.p21 === 2; }
        },
        { codigo: 'p22', numero: '22', tipo: 'likert', escala: 'acuerdo', texto: 'Los turnos rotativos y los descansos entre turnos se respetan y me permiten descansar lo suficiente.' },
        { codigo: 'p23', numero: '23', tipo: 'likert', escala: 'acuerdo', texto: 'Cobro mis honorarios en tiempo y forma, y sé cómo y cuándo presentar mi facturación.' },
        {
          codigo: 'p23_1', numero: '23.1', tipo: 'unica',
          texto: '¿Qué es lo que más pesa en que no cobres tus honorarios en tiempo y forma o no sepas cómo es facturar?',
          opciones: [
            'No tengo claro cómo ni cuándo presentar la facturación',
            'El pago se demora respecto de lo previsto',
            'No recibo información sobre el estado de mi pago',
            'Otro'
          ],
          otro: 'Indique el motivo',
          cond: function (r) { return r.p23 === 1 || r.p23 === 2; }
        },
        { codigo: 'p24', numero: '24', tipo: 'likert', escala: 'acuerdo', texto: 'Sé a quién acudir para plantear una consulta o inquietud sobre mi tarea o mi contrato.' },
        {
          codigo: 'p24_1', numero: '24.1', tipo: 'unica',
          texto: '¿Qué es lo que más pesa en que no sepas a quién acudir para plantear una consulta o inquietud?',
          opciones: [
            'No sé qué persona o área me puede responder',
            'Sé a quién, pero no recibo respuesta o tardan mucho',
            'No me siento con confianza para plantear la consulta',
            'Otro'
          ],
          otro: 'Indique el motivo',
          cond: function (r) { return r.p24 === 1 || r.p24 === 2; }
        }
      ]
    },
    {
      numero: 6,
      corto: 'Valoración',
      titulo: 'Valoración global y recomendación',
      icono: 'thumb_up',
      nota: 'Mirada general sobre su lugar de trabajo',
      preguntas: [
        { codigo: 'p25', numero: '25', tipo: 'likert', escala: 'satisfaccion', texto: 'En general, ¿qué tan satisfecho/a está con su lugar de trabajo hoy?' },
        { codigo: 'p26', numero: '26', tipo: 'numerica', texto: '¿Recomendaría trabajar en su área a un conocido?', minimo: 1, maximo: 10 },
        {
          codigo: 'p26_1', numero: '26.1', tipo: 'unica',
          texto: '¿Qué fue lo que más pesó en su valoración?',
          opciones: [
            'Trato y clima con compañeros/as',
            'Relación con la jefatura',
            'Condiciones de trabajo y seguridad e higiene',
            'Herramientas, insumos y equipamiento',
            'Organización y procesos',
            'Capacitación',
            'Reconocimiento',
            'Otro'
          ],
          otro: 'Indique el motivo de su valoración',
          cond: valoracionBaja
        },
        {
          codigo: 'p26_2', numero: '26.2', tipo: 'texto', obligatoria: true, maximo: 2000,
          texto: 'Cuéntenos brevemente qué cambiaría',
          placeholder: 'Escribí tu comentario aquí',
          cond: valoracionBaja
        }
      ]
    },
    {
      numero: 7,
      corto: 'Comentario',
      titulo: 'Comentario final',
      icono: 'rate_review',
      nota: 'Espacio abierto y opcional',
      preguntas: [
        {
          codigo: 'p27', numero: '27', tipo: 'texto', obligatoria: false, maximo: 2000,
          texto: 'Escriba de modo simple sus observaciones o sugerencias para mejorar su lugar de trabajo. Puede incluir lo que funciona bien y debería seguir igual, y lo que cambiaría (por ejemplo: condiciones del lugar, trato entre compañeros, recursos, organización, etc.).',
          placeholder: 'Escribí tu comentario o sugerencia aquí (opcional)'
        }
      ]
    }
  ]
};

/* P26.1 y P26.2 aparecen si P25 es 3 o menos, o si P26 es 6 o menos. */
function valoracionBaja(r) {
  return (r.p25 !== undefined && r.p25 <= 3) || (r.p26 !== undefined && r.p26 <= 6);
}
