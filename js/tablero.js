/* ==========================================================================
   tablero.js — LÓGICA DE LA ENCUESTA. Dibuja js/esquema.js, valida y envía.

   Decisiones de anonimato y seguridad:
   - Las respuestas viven solo en memoria: no se guardan en este dispositivo.
   - El HTML se arma con createElement + textContent, nunca con innerHTML.
   - "Enviada" se muestra solo si el servidor confirma que guardó la respuesta.
   ========================================================================== */

const { meta: META, escalas: ESCALAS, bloques: BLOQUES } = window.ENCUESTA;

const MAX_OTRO = 250;
const MIN_CARACTERES = 10;
const MIN_PALABRAS = 3;

const respuestas = {};
const tarjetas = {};          // codigo -> { tarjeta, pregunta, limpiar }
const camposTexto = {};       // clave -> { campo, requerido, alerta, actualizarContador }

let bloqueActual = 1;
let vistaCompleta = false;
let enviada = false;
let hayCambios = false;
let idRespuesta = null;       // Se conserva entre reintentos para no duplicar.

function iniciar() {
  try {
    pintarPestanas();
    pintarBloques();
    conectarEventos();
    actualizarCondicionales();
    irABloque(1, false);
    actualizarProgreso();
  } catch (error) {
    mostrarError(error.message);
  }
}

/* --- Ayudantes --------------------------------------------------------- */

function crear(etiqueta, clase, texto) {
  const el = document.createElement(etiqueta);
  if (clase) { el.className = clase; }
  if (texto !== undefined) { el.textContent = texto; }
  return el;
}

function icono(nombre, clase) {
  const el = crear('span', 'icono' + (clase ? ' ' + clase : ''), nombre);
  el.setAttribute('aria-hidden', 'true');
  return el;
}

function preguntasDe(bloque) {
  return bloque.preguntas;
}

function visible(pregunta) {
  return !pregunta.cond || pregunta.cond(respuestas);
}

function esMultiple(pregunta) {
  return pregunta.tipo === 'multiple';
}

function mostrarError(mensaje) {
  const main = document.querySelector('main .contenedor');
  if (!main) { return; }
  const caja = crear('div', 'error');
  caja.append(crear('strong', '', 'No se pudo mostrar la encuesta.'), document.createElement('br'), String(mensaje));
  main.replaceChildren(caja);
}

/* --- Pestañas ---------------------------------------------------------- */

function pintarPestanas() {
  const nav = document.getElementById('pestanas-bloques');
  BLOQUES.forEach(function (b) {
    const boton = crear('button', 'pestana');
    boton.type = 'button';
    boton.id = 'pestana-' + b.numero;
    boton.dataset.bloque = String(b.numero);
    boton.setAttribute('role', 'tab');
    boton.setAttribute('aria-controls', 'bloque-' + b.numero);
    boton.append(crear('span', 'pestana-num', String(b.numero)), crear('span', '', b.corto));
    nav.append(boton);
  });
}

/* --- Bloques y preguntas ----------------------------------------------- */

function pintarBloques() {
  const cont = document.getElementById('bloques');
  BLOQUES.forEach(function (b) {
    const seccion = crear('section', 'panel');
    seccion.id = 'bloque-' + b.numero;
    seccion.setAttribute('role', 'tabpanel');
    seccion.setAttribute('aria-labelledby', 'titulo-bloque-' + b.numero);
    seccion.tabIndex = -1;

    const cabecera = crear('div', 'cabecera-bloque');
    const izquierda = crear('div', 'cabecera-bloque-izq');
    const titulo = crear('h3', 'titulo-m', 'Bloque ' + b.numero + ' · ' + b.titulo);
    titulo.id = 'titulo-bloque-' + b.numero;
    izquierda.append(icono(b.icono), titulo);
    cabecera.append(izquierda, crear('span', 'estado estado--neutro', b.nota));
    seccion.append(cabecera);

    preguntasDe(b).forEach(function (p) { seccion.append(crearTarjeta(p)); });
    cont.append(seccion);
  });
}

function crearTarjeta(p) {
  const tarjeta = crear('div', 'q-card' + (p.cond ? ' conditional-card' : ''));
  tarjeta.id = 'tarjeta-' + p.codigo;

  const cabecera = crear('div', 'q-header');
  cabecera.append(crear('span', 'q-num' + (p.cond ? ' cond' : ''), p.numero));
  const textos = crear('div', 'q-label-wrap');
  const obligatoria = p.tipo !== 'texto' || p.obligatoria;
  const titulo = crear('h4', 'q-title', p.texto + (obligatoria ? ' *' : ''));
  titulo.id = 'titulo-' + p.codigo;
  textos.append(titulo, crear('p', 'q-meta', describirTipo(p, obligatoria)));
  cabecera.append(textos);
  tarjeta.append(cabecera);

  const registro = { tarjeta: tarjeta, pregunta: p, limpiar: function () {} };
  tarjetas[p.codigo] = registro;

  if (p.tipo === 'unica' || p.tipo === 'multiple') { pintarOpciones(p, tarjeta, registro); }
  if (p.tipo === 'likert') { pintarLikert(p, tarjeta, registro); }
  if (p.tipo === 'numerica') { pintarNumerica(p, tarjeta, registro); }
  if (p.tipo === 'texto') {
    tarjeta.append(crearCampoTexto(p.codigo, null, p.obligatoria, p.maximo, p.placeholder, 'titulo-' + p.codigo));
    registro.limpiar = function () { limpiarCampoTexto(p.codigo); };
  }
  return tarjeta;
}

function describirTipo(p, obligatoria) {
  if (p.tipo === 'multiple') {
    return 'Selección múltiple' + (p.max ? ', máximo ' + p.max : '') + ' · obligatoria';
  }
  if (p.tipo === 'texto') { return 'Texto libre · ' + (obligatoria ? 'obligatoria' : 'opcional'); }
  if (p.tipo === 'numerica') { return 'Escala de ' + p.minimo + ' a ' + p.maximo + ' · obligatoria'; }
  return 'Selección única · obligatoria';
}

function grupoDeBotones(p, clase) {
  const grupo = crear('div', clase);
  grupo.setAttribute('role', 'group');
  grupo.setAttribute('aria-labelledby', 'titulo-' + p.codigo);
  return grupo;
}

function marcarBoton(boton, activo) {
  boton.classList.toggle('active', activo);
  boton.setAttribute('aria-pressed', String(activo));
}

/* Selección única y múltiple, con su "Otro" y, en P7, su "¿por qué?". */
function pintarOpciones(p, tarjeta, registro) {
  const multiple = esMultiple(p);
  const grupo = grupoDeBotones(p, 'options-grid');
  const botones = p.opciones.map(function (opcion) {
    const boton = crear('button', 'opt-btn' + (multiple ? ' multi' : ''));
    boton.type = 'button';
    boton.setAttribute('aria-pressed', 'false');
    const indicador = crear('span', 'opt-indicator');
    indicador.setAttribute('aria-hidden', 'true');
    boton.append(indicador, crear('span', '', opcion));
    boton.addEventListener('click', function () { elegirOpcion(p, opcion, botones); });
    boton.dataset.valor = opcion;
    grupo.append(boton);
    return boton;
  });
  tarjeta.append(grupo);

  let cajaOtro = null;
  if (p.otro) {
    cajaOtro = crear('div', 'otro-input-wrap');
    cajaOtro.hidden = true;
    cajaOtro.append(crearCampoTexto(p.codigo + '_otro', p.otro, true, MAX_OTRO));
    tarjeta.append(cajaOtro);
  }

  if (p.porque) {
    const cajaPorque = crear('div', 'otro-input-wrap');
    cajaPorque.hidden = true;
    cajaPorque.append(crearCampoTexto(p.porque.codigo, p.porque.etiqueta, true, MAX_OTRO));
    tarjeta.append(cajaPorque);
    registro.cajaPorque = cajaPorque;
  }

  registro.cajaOtro = cajaOtro;
  registro.botones = botones;
  registro.limpiar = function () {
    delete respuestas[p.codigo];
    botones.forEach(function (b) { marcarBoton(b, false); b.disabled = false; });
    if (cajaOtro) { cajaOtro.hidden = true; limpiarCampoTexto(p.codigo + '_otro'); }
    if (p.porque) { registro.cajaPorque.hidden = true; limpiarCampoTexto(p.porque.codigo); }
  };
}

function elegirOpcion(p, opcion, botones) {
  const registro = tarjetas[p.codigo];
  if (esMultiple(p)) {
    const elegidas = respuestas[p.codigo] || [];
    const posicion = elegidas.indexOf(opcion);
    if (posicion >= 0) {
      elegidas.splice(posicion, 1);
    } else {
      if (p.max && elegidas.length >= p.max) { return; }
      elegidas.push(opcion);
    }
    if (elegidas.length) { respuestas[p.codigo] = elegidas; } else { delete respuestas[p.codigo]; }
    botones.forEach(function (b) {
      const activo = elegidas.indexOf(b.dataset.valor) >= 0;
      marcarBoton(b, activo);
      b.classList.toggle('disabled-max', Boolean(p.max) && !activo && elegidas.length >= p.max);
      if (p.max) { b.setAttribute('aria-disabled', String(!activo && elegidas.length >= p.max)); }
    });
  } else {
    respuestas[p.codigo] = opcion;
    botones.forEach(function (b) { marcarBoton(b, b.dataset.valor === opcion); });
  }

  if (registro.cajaOtro) {
    const eligioOtro = esMultiple(p)
      ? (respuestas[p.codigo] || []).indexOf('Otro') >= 0
      : respuestas[p.codigo] === 'Otro';
    registro.cajaOtro.hidden = !eligioOtro;
    if (!eligioOtro) { limpiarCampoTexto(p.codigo + '_otro'); }
  }
  if (registro.cajaPorque) { registro.cajaPorque.hidden = false; }
  alResponder(p.codigo);
}

function pintarLikert(p, tarjeta, registro) {
  const grupo = grupoDeBotones(p, 'likert-row');
  const botones = ESCALAS[p.escala].map(function (item) {
    const boton = crear('button', 'likert-btn');
    boton.type = 'button';
    boton.dataset.val = String(item.val);
    boton.setAttribute('aria-pressed', 'false');
    boton.append(icono(item.icono, 'likert-icon'), crear('span', 'likert-text', item.label));
    boton.addEventListener('click', function () {
      respuestas[p.codigo] = item.val;
      botones.forEach(function (b) { marcarBoton(b, b === boton); });
      alResponder(p.codigo);
    });
    grupo.append(boton);
    return boton;
  });
  tarjeta.append(grupo);
  registro.limpiar = function () {
    delete respuestas[p.codigo];
    botones.forEach(function (b) { marcarBoton(b, false); });
  };
}

function pintarNumerica(p, tarjeta, registro) {
  const grupo = grupoDeBotones(p, 'enps-grid');
  const botones = [];
  for (let n = p.minimo; n <= p.maximo; n++) {
    const boton = crear('button', 'enps-btn', String(n));
    boton.type = 'button';
    boton.setAttribute('aria-pressed', 'false');
    boton.addEventListener('click', function () {
      respuestas[p.codigo] = n;
      botones.forEach(function (b) { marcarBoton(b, b === boton); });
      alResponder(p.codigo);
    });
    grupo.append(boton);
    botones.push(boton);
  }
  tarjeta.append(grupo);
  const referencias = crear('div', 'enps-labels');
  referencias.append(crear('span', '', p.minimo + ' = Nada probable'), crear('span', '', p.maximo + ' = Muy probable'));
  tarjeta.append(referencias);
  registro.limpiar = function () {
    delete respuestas[p.codigo];
    botones.forEach(function (b) { marcarBoton(b, false); });
  };
}

/* --- Campos de texto --------------------------------------------------- */

function crearCampoTexto(clave, etiqueta, requerido, maximo, placeholder, idEtiquetado) {
  const envoltura = crear('div', 'campo-texto');
  const esArea = maximo > MAX_OTRO;
  const campo = crear(esArea ? 'textarea' : 'input', esArea ? 'form-textarea' : 'form-input');
  campo.id = 'campo-' + clave;
  campo.maxLength = maximo;
  if (esArea) { campo.rows = 5; } else { campo.type = 'text'; }
  if (placeholder) { campo.placeholder = placeholder; }
  campo.autocomplete = 'off';

  if (etiqueta) {
    const label = crear('label', '', etiqueta + ' *');
    label.htmlFor = campo.id;
    envoltura.append(label);
  } else if (idEtiquetado) {
    campo.setAttribute('aria-labelledby', idEtiquetado);
  }

  const pie = crear('div', 'pie-campo-texto');
  pie.append(crear('span', '', requerido ? 'Mínimo ' + MIN_PALABRAS + ' palabras y ' + MIN_CARACTERES + ' caracteres. No incluya nombres ni datos personales.' : 'No incluya nombres ni datos personales.'));
  const contador = crear('span', 'contador-restantes');
  pie.append(contador);

  const alerta = crear('div', 'alerta-guiada-campo');
  alerta.id = 'alerta-' + clave;
  alerta.hidden = true;
  alerta.append(icono('error'), crear('span', 'alerta-guiada-texto'));
  campo.setAttribute('aria-describedby', alerta.id);

  envoltura.append(campo, pie, alerta);

  function actualizarContador() {
    const restantes = Math.max(0, maximo - campo.value.length);
    contador.textContent = restantes.toLocaleString('es-AR') + ' caracteres restantes';
    contador.classList.toggle('alerta', restantes <= Math.ceil(maximo * 0.1));
  }
  actualizarContador();

  campo.addEventListener('input', function () {
    if (campo.value.trim()) { respuestas[clave] = campo.value; } else { delete respuestas[clave]; }
    actualizarContador();
    if (!alerta.hidden) { validarCampo(clave); }
    alResponder(clave);
  });
  campo.addEventListener('blur', function () {
    if (requerido && campo.value.trim()) { validarCampo(clave); }
  });

  camposTexto[clave] = { campo: campo, requerido: requerido, alerta: alerta, actualizarContador: actualizarContador };
  return envoltura;
}

function limpiarCampoTexto(clave) {
  const c = camposTexto[clave];
  if (!c) { return; }
  c.campo.value = '';
  c.campo.classList.remove('input-invalido');
  c.alerta.hidden = true;
  c.actualizarContador();
  delete respuestas[clave];
}

function tieneSecuenciaInvalida(texto) {
  const limpio = String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const sinEspacios = limpio.replace(/\s+/g, '');
  if (/([a-z0-9])\1{3,}/.test(limpio)) { return true; }
  if (/([a-z0-9]{2,3})\1{2,}/.test(sinEspacios)) { return true; }
  const secuencias = ['0123', '1234', '2345', '3456', '4567', '5678', '6789', '9876', '8765', '7654', '6543', '5432', '4321',
    'abcd', 'bcde', 'cdef', 'defg', 'efgh', 'fghi', 'ghij', 'hijk', 'ijkl', 'jklm', 'klmn', 'lmno', 'mnop',
    'qwert', 'werty', 'asdf', 'sdfg', 'zxcv'];
  if (secuencias.some(function (s) { return sinEspacios.indexOf(s) >= 0; })) { return true; }
  const palabras = limpio.trim().split(/\s+/);
  return palabras.some(function (p, i) { return p && p === palabras[i + 1] && p === palabras[i + 2]; });
}

function textoValido(valor) {
  const texto = String(valor || '').trim();
  const palabras = texto ? texto.split(/\s+/).filter(function (w) { return /[\p{L}\p{N}]/u.test(w); }) : [];
  if (!texto) {
    return { ok: false, msg: 'Este campo es obligatorio. Escriba al menos ' + MIN_PALABRAS + ' palabras y ' + MIN_CARACTERES + ' caracteres.' };
  }
  if (tieneSecuenciaInvalida(texto)) {
    return { ok: false, msg: 'El texto parece contener caracteres repetidos o consecutivos (por ejemplo, «aaaa» o «1234»). Revíselo para continuar.' };
  }
  if (palabras.length < MIN_PALABRAS || texto.length < MIN_CARACTERES) {
    return { ok: false, msg: 'Escriba al menos ' + MIN_PALABRAS + ' palabras y ' + MIN_CARACTERES + ' caracteres (lleva ' + palabras.length + ' y ' + texto.length + ').' };
  }
  return { ok: true, msg: '' };
}

function validarCampo(clave) {
  const c = camposTexto[clave];
  const r = textoValido(c.campo.value);
  c.campo.classList.toggle('input-invalido', !r.ok);
  c.campo.setAttribute('aria-invalid', String(!r.ok));
  c.alerta.hidden = r.ok;
  c.alerta.querySelector('.alerta-guiada-texto').textContent = r.msg;
  return r.ok;
}

/* --- Requisitos, condicionales y progreso ------------------------------ */

/* Lista lo obligatorio de un bloque, teniendo en cuenta lo que hoy está visible. */
function requisitos(bloque) {
  const lista = [];
  preguntasDe(bloque).filter(visible).forEach(function (p) {
    if (p.tipo === 'texto') {
      if (p.obligatoria) { lista.push({ codigo: p.codigo, campo: p.codigo, ok: textoValido(respuestas[p.codigo]).ok }); }
      return;
    }
    const valor = respuestas[p.codigo];
    lista.push({ codigo: p.codigo, ok: esMultiple(p) ? Boolean(valor && valor.length) : valor !== undefined });

    const eligioOtro = esMultiple(p) ? Boolean(valor) && valor.indexOf('Otro') >= 0 : valor === 'Otro';
    if (p.otro && eligioOtro) {
      lista.push({ codigo: p.codigo, campo: p.codigo + '_otro', ok: textoValido(respuestas[p.codigo + '_otro']).ok });
    }
    if (p.porque && valor !== undefined) {
      lista.push({ codigo: p.codigo, campo: p.porque.codigo, ok: textoValido(respuestas[p.porque.codigo]).ok });
    }
  });
  return lista;
}

function actualizarCondicionales() {
  /* Dos pasadas: limpiar una pregunta puede ocultar otra que dependa de ella. */
  for (let pasada = 0; pasada < 2; pasada++) {
    Object.keys(tarjetas).forEach(function (codigo) {
      const r = tarjetas[codigo];
      if (!r.pregunta.cond) { return; }
      const mostrar = visible(r.pregunta);
      if (!mostrar && !r.tarjeta.hidden) { r.limpiar(); }
      r.tarjeta.hidden = !mostrar;
    });
  }
}

function alResponder(clave) {
  hayCambios = true;
  const tarjeta = tarjetas[clave] ? tarjetas[clave].tarjeta : null;
  if (tarjeta) { tarjeta.classList.remove('has-error'); }
  actualizarCondicionales();
  actualizarProgreso();
}

function actualizarProgreso() {
  let total = 0;
  let hechas = 0;
  BLOQUES.forEach(function (b) {
    const lista = requisitos(b);
    const ok = lista.filter(function (r) { return r.ok; }).length;
    total += lista.length;
    hechas += ok;
    const pestana = document.getElementById('pestana-' + b.numero);
    const completo = lista.length > 0 && ok === lista.length;
    pestana.classList.toggle('completada', completo);
    pestana.querySelector('.pestana-num').textContent = completo ? '✓' : String(b.numero);
  });
  const pct = total ? Math.round((hechas / total) * 100) : 0;
  const etiqueta = document.getElementById('progreso-porcentaje');
  etiqueta.textContent = pct + '% completado (' + hechas + '/' + total + ')';
  etiqueta.className = 'estado texto-numero ' + (pct === 100 ? 'estado--ok' : 'estado--marca');
  const relleno = document.getElementById('progreso-relleno');
  relleno.style.width = pct + '%';
  relleno.classList.toggle('completo', pct === 100);
  document.getElementById('progreso-pista').setAttribute('aria-valuenow', String(pct));
}

function validarBloque(numero) {
  const bloque = BLOQUES[numero - 1];
  let primero = null;
  requisitos(bloque).forEach(function (r) {
    const tarjeta = tarjetas[r.codigo].tarjeta;
    if (r.campo && !r.ok) { validarCampo(r.campo); }
    if (!r.ok) {
      tarjeta.classList.add('has-error');
      if (!primero) { primero = r; }
    }
  });
  if (primero) {
    const destino = primero.campo ? camposTexto[primero.campo].campo : tarjetas[primero.codigo].tarjeta.querySelector('button');
    avisar('Falta completar la pregunta ' + tarjetas[primero.codigo].pregunta.numero + ' del bloque ' + numero + '.');
    tarjetas[primero.codigo].tarjeta.scrollIntoView({ block: 'center' });
    if (destino) { destino.focus({ preventScroll: true }); }
    return false;
  }
  return true;
}

/* --- Navegación -------------------------------------------------------- */

function irABloque(numero, enfocar) {
  bloqueActual = numero;
  BLOQUES.forEach(function (b) {
    document.getElementById('bloque-' + b.numero).hidden = !vistaCompleta && b.numero !== numero;
    const pestana = document.getElementById('pestana-' + b.numero);
    const activa = b.numero === numero;
    pestana.setAttribute('aria-selected', String(activa));
    pestana.tabIndex = activa ? 0 : -1;
  });
  document.getElementById('aviso-proposito').hidden = !vistaCompleta && numero !== 1;
  document.getElementById('boton-anterior').hidden = vistaCompleta || numero === 1;
  document.getElementById('boton-siguiente').hidden = vistaCompleta || numero === BLOQUES.length;
  document.getElementById('boton-enviar').hidden = !vistaCompleta && numero !== BLOQUES.length;
  document.getElementById('pestanas-bloques').hidden = vistaCompleta;
  const b = BLOQUES[numero - 1];
  document.getElementById('progreso-bloque').textContent = vistaCompleta
    ? 'Formulario completo'
    : 'Bloque ' + numero + ' de ' + BLOQUES.length + ' · ' + b.titulo;
  if (enfocar) {
    window.scrollTo({ top: 0 });
    document.getElementById('bloque-' + (vistaCompleta ? 1 : numero)).focus({ preventScroll: true });
  }
}

function alternarVista() {
  vistaCompleta = !vistaCompleta;
  document.getElementById('vista-texto').textContent = vistaCompleta ? 'Ver por bloques' : 'Ver formulario completo';
  document.getElementById('vista-icono').textContent = vistaCompleta ? 'view_carousel' : 'view_agenda';
  irABloque(vistaCompleta ? 1 : bloqueActual, true);
}

function teclasPestanas(evento) {
  const total = BLOQUES.length;
  let destino = null;
  if (evento.key === 'ArrowRight') { destino = bloqueActual === total ? 1 : bloqueActual + 1; }
  if (evento.key === 'ArrowLeft') { destino = bloqueActual === 1 ? total : bloqueActual - 1; }
  if (evento.key === 'Home') { destino = 1; }
  if (evento.key === 'End') { destino = total; }
  if (destino === null) { return; }
  evento.preventDefault();
  irABloque(destino, false);
  document.getElementById('pestana-' + destino).focus();
}

function avisar(mensaje) {
  const caja = document.getElementById('aviso-validacion');
  document.getElementById('aviso-validacion-texto').textContent = mensaje;
  caja.hidden = false;
  clearTimeout(avisar.temporizador);
  avisar.temporizador = setTimeout(function () { caja.hidden = true; }, 6000);
}

function conectarEventos() {
  document.getElementById('pestanas-bloques').addEventListener('click', function (e) {
    const boton = e.target.closest('.pestana');
    if (boton) { irABloque(Number(boton.dataset.bloque), false); }
  });
  document.getElementById('pestanas-bloques').addEventListener('keydown', teclasPestanas);
  document.getElementById('boton-anterior').addEventListener('click', function () { irABloque(bloqueActual - 1, true); });
  document.getElementById('boton-siguiente').addEventListener('click', function () {
    if (validarBloque(bloqueActual)) { irABloque(bloqueActual + 1, true); }
  });
  document.getElementById('boton-vista').addEventListener('click', alternarVista);

  const formulario = document.getElementById('formulario-encuesta');
  formulario.addEventListener('submit', enviarEncuesta);
  formulario.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); }
  });

  /* El dispositivo puede ser compartido: tras un envío confirmado, el formulario
     vuelve a quedar en blanco para que la próxima persona no vea esas respuestas. */
  document.getElementById('modal-exito').addEventListener('close', function () {
    if (enviada) { window.location.reload(); }
  });

  /* Nada se guarda en el dispositivo: se avisa antes de perder lo respondido. */
  window.addEventListener('beforeunload', function (e) {
    if (hayCambios && !enviada) { e.preventDefault(); e.returnValue = ''; }
  });
}

/* --- Envío ------------------------------------------------------------- */

function generarId() {
  if (window.crypto && crypto.randomUUID) { return crypto.randomUUID(); }
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, function (x) { return x.toString(16).padStart(2, '0'); }).join('');
  return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
}

/* Enmascara correos y números largos (DNI con o sin puntos, teléfonos). El servidor lo repite. */
function enmascarar(texto) {
  return String(texto || '')
    .replace(/[<>]/g, '')
    .replace(/[\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,}/g, '[correo resguardado]')
    .replace(/\b\d(?:[.\s-]?\d){6,}\b/g, '[número resguardado]')
    .trim();
}

/* Solo viaja lo visible. La fecha y la modalidad las pone el servidor. */
function armarEnvio() {
  const envio = { response_id: idRespuesta, codigo_instrumento: META.codigo };
  Object.keys(respuestas).forEach(function (clave) {
    const valor = respuestas[clave];
    envio[clave] = camposTexto[clave] ? enmascarar(valor) : valor;
  });
  return envio;
}

function mostrarFalloEnvio(mensaje) {
  document.getElementById('error-envio-texto').textContent = mensaje;
  const caja = document.getElementById('error-envio');
  caja.hidden = false;
  caja.scrollIntoView({ block: 'center' });
}

async function enviarEncuesta(evento) {
  evento.preventDefault();
  if (enviada) { return; }
  document.getElementById('error-envio').hidden = true;

  for (const b of BLOQUES) {
    if (!validarBloque(b.numero)) {
      if (!vistaCompleta) {
        irABloque(b.numero, false);
        validarBloque(b.numero);
      }
      return;
    }
  }

  document.getElementById('aviso-validacion').hidden = true;

  if (!META.endpoint) {
    mostrarFalloEnvio('La encuesta todavía no está habilitada para recibir respuestas. Tu respuesta no se envió.');
    return;
  }

  idRespuesta = idRespuesta || generarId();
  const boton = document.getElementById('boton-enviar');
  const textoBoton = document.getElementById('boton-enviar-texto');
  boton.disabled = true;
  textoBoton.textContent = 'Enviando respuesta anónima…';

  try {
    const respuesta = await fetch(META.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(armarEnvio())
    });
    const resultado = await respuesta.json();
    if (resultado.status !== 'ok' && resultado.status !== 'duplicate') {
      throw new Error(resultado.message || 'respuesta rechazada');
    }
  } catch (error) {
    boton.disabled = false;
    textoBoton.textContent = 'Reintentar envío';
    mostrarFalloEnvio('No pudimos confirmar el envío. Tus respuestas siguen en esta pantalla: revisá la conexión y volvé a intentar sin cerrar la página.');
    return;
  }

  enviada = true;
  textoBoton.textContent = 'Respuesta enviada';
  document.getElementById('modal-exito').showModal();
}

document.addEventListener('DOMContentLoaded', iniciar);
