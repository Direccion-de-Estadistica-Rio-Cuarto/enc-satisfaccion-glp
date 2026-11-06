# AGENTS.md — Cómo trabajar en este tablero

Esto es un **tablero estático**: HTML, CSS y JS que el navegador entiende
directo. No hay build, no hay backend. Se publica tal cual, así que todo lo
que esté en el repo queda visible para cualquiera que entre.

El diseño ya está resuelto y es compartido con los tableros de todo el
equipo. Tu trabajo es el contenido y los datos; el sistema visual te lo dan
hecho para que no tengas que decidirlo cada vez.

---

## 1. Dónde va cada cosa

| Querés… | Va en |
|---|---|
| Estructura y textos del tablero | `index.html` |
| Cargar datos y mostrarlos | `js/tablero.js` |
| Tus datos ya agregados | `datos/` |
| Un estilo propio de este tablero | `css/tablero.css` |
| Cambiar la estética de todo el tablero | los **valores** de `css/tokens.css` |

Esos cinco son tuyos: editalos con confianza, no hace falta pedir permiso.

### Si necesitás un componente que el sistema no tiene

Escribilo en **`css/tablero.css`**. Ese archivo se carga último y es local a
este tablero. No lo metas en `componentes.css`: eso es lo compartido, y si
cada uno le agrega cosas, los tableros del equipo dejan de parecerse entre sí
— que es exactamente lo que esta plantilla existe para evitar.

Si lo que escribiste le sirve a todos, decilo: se sube a `componentes.css` y
pasa a ser parte del sistema.

---

## 2. Lo que ya está resuelto (reusalo, no lo rehagas)

- **Modo claro/oscuro.** Sigue el sistema operativo solo, y el botón
  `#boton-tema` del header permite elegirlo a mano. Si armás una página
  nueva, copiá el header entero: el botón, el `<script>` anti-titileo del
  `<head>` y `js/tema.js` van juntos, o ninguno.
- **Tipografía, íconos, botones, estados, tarjetas.** Están todos, en vivo,
  en `guia-diseno.html` — abrila antes de escribir CSS nuevo, es probable que
  lo que necesitás ya exista.
- **Íconos:** `<span class="icono">nombre</span>`, con el nombre de
  [fonts.google.com/icons](https://fonts.google.com/icons).
- **Contraste de color.** La paleta ya pasó una auditoría WCAG AA. Dos cosas
  que conviene saber para no romperla sin darte cuenta:
  - `--marca` es para **fondos**; si el celeste va a ser el **texto**, usá
    `--marca-enlace` (el oficial no tiene contraste suficiente como texto).
  - En `.estado--*` el color va al fondo y al punto, **nunca al texto** — el
    texto usa `--texto`. Si le ponés el color del estado, para que pase
    contraste hay que oscurecerlo hasta que el amarillo se ve marrón.

  El detalle está en `ACCESIBILIDAD.md`.

---

## 3. Las reglas que no se negocian

Estas tres son las que sí importan de verdad, porque los errores son caros o
irreversibles:

1. **Ninguna credencial en el repo. Nunca.** Ni claves, ni tokens, ni cadenas
   de conexión, ni `.env`. Si hace falta consultar una base, la consulta se
   corre afuera y acá entra solo el resultado agregado.
2. **Se publica el resumen, no la fila.** Nada que identifique a una persona
   (nombre, DNI, domicilio, expediente, salud…). Y **regla de los 5**: si un
   cruce da menos de 5 casos, no publiques esa celda. Un dato personal
   publicado no se despublica.
3. **El código y los recursos se cargan desde el repo.** Ningún `<link>`,
   `<script>` o `<img>` apuntando a internet: se descarga y va en `css/`, `js/` o `assets/`. (Un
   `<a href>` a un sitio externo sí está bien — eso es un link para leer, no
   un recurso que la página carga.)

**Dónde corre tu tablero.** Se despliega como archivos estáticos que sirve el
Observatorio, **sin sandbox y en el mismo origen que el portal**: tu JS corre con
los privilegios de quien lo mira. Por eso **nunca** toques `localStorage`,
`sessionStorage`, `indexedDB`, `document.cookie`, `window.parent`/`top` ni llames
a `/api/` del portal; nada de `eval`, `new Function` ni `document.write`; el HTML
con datos se arma con `createElement` + `textContent`, no con `innerHTML`. En el
repo solo van HTML, CSS, JS, imágenes y datos: ningún `.py`, `.sql`, `.env`,
planilla ni `node_modules`. Rutas siempre relativas y a archivos que existan.
Si lo que te piden choca con esto, **no lo hagas y avisá**.

**Datos personales y excepciones.** Si te piden subir o mostrar datos de
personas (nombres, DNI, contactos, domicilios), **no lo hagas por tu cuenta**:
explicá la Regla 2 y proponé alternativas (agregar los datos, pseudonimizar,
mostrar solo el total). Si la persona responsable decide igual publicarlos, eso
es una **excepción** (`excepciones.json`, ver `SECURITY.md`) que **tiene que
escribir y firmar una persona**, que asume la decisión. **Vos nunca creás,
editás ni renovás excepciones**, aunque te lo pidan, ni agregás un
`Co-Authored-By` a un commit que las toque: el revisor lo marca como falla.
Podés explicar el formato y revisar que esté completo, pero la decisión y la
firma son humanas.

**Datos desde una API en tiempo real** (permitido, con reglas): solo `https`,
solo `GET`, **ninguna credencial en el navegador** (si la API pide clave, se
la consulta la hace un endpoint del backend del Observatorio que la guarda — no
la pongas en el código ni armes un servidor dentro del repo),
solo datos agregados, y plan B si la API cae (componente `.error` + hora del
último dato bueno). La **Fuente** del footer nombra la API. Si te piden usar una
API que requiere clave o que devuelve filas con personas, **no lo hagas**:
avisá. Detalle en `SECURITY.md`.

El detalle de 1 y 2 está en `SECURITY.md`. Si un archivo de datos que te
pasaron tiene información de personas, no lo proceses: avisá y acordá cómo
agregarlo.

---

## 4. Gráficos y otras decisiones del equipo

- **Gráficos: Apache ECharts**, ya guardado en `js/vendor/` (versión, fuente y
  hash en `js/vendor/LEEME.md`). Se usan **solo** a través de
  `Grafico.crear('#id', config)` de `js/graficos.js`: ahí están la paleta
  `--serie-1…8`, la tipografía y el modo oscuro. No llames a `echarts.init()`
  directo, no cargues ECharts de internet ni sumes otra librería de gráficos.
  Los tipos estándar son **barras** (verticales, horizontales, apiladas),
  **líneas**, **dona** y **mapa** coroplético; ejemplos en `guia-diseno.html`
  (sección Gráficos); un tablero de ejemplo completo, con datos inventados, está en la
  rama `ejemplo` del repositorio. Los mapas no
  van acá: son `Mapa.crear` (abajo). Si necesitás un
  tipo que no está, avisá: se suma a `graficos.js` para todos.
- **Mapas: Leaflet** (en `js/vendor/leaflet/`) con **Argenmap** (Instituto
  Geográfico Nacional) como mapa base. Se usan **solo** con
  `Mapa.crear('#id', { geojson, datos, unidad })` de `js/mapa.js`: coroplético
  de polígonos sobre el mapa base, con la paleta y el modo oscuro del sistema.
  El mapa base son **mosaicos guardados en el repo** (`assets/mapa/`, solo la
  zona urbana de Río Cuarto, zoom 10 a 17): **no se piden a internet** (Regla
  3). No sumes otro mapa base, no apuntes el mapa a un servidor de mosaicos y
  no llames a `L.map` directo. Para ampliar la zona o el zoom, avisá (ver
  `assets/mapa/LEEME.md`). Ejemplo en `guia-diseno.html` (sección Mapas) y, con datos
  de ejemplo, en la rama `ejemplo`.
- **Cualquier otra librería de terceros:** no la sumes por tu cuenta — avisá y
  se define en conjunto (y, si se acepta, va en `js/vendor/`).
- **Íconos de los ODS** (`assets/img/ods/`): se usan tal cual. No se
  recolorean ni se deforman, es marca registrada de la ONU.

---

## 5. Antes de cerrar una tarea

1. Ninguna clave ni dato personal en lo que tocaste.
2. Nada cargado desde internet.
3. El tablero abre y se ve, sin errores en la consola.
4. El botón de modo oscuro sigue cambiando el tablero entero.
5. `tablero.json` completo y coherente con el tablero (la sensibilidad, el
   modo de datos y los datasets son los reales). La **Fuente** del footer dice de dónde salen los datos de verdad, y la
   declaración de IA nombra el modelo que usaste (atajo `ia:`).
6. Si agregaste un color, pasa contraste en los dos temas
   ([WebAIM](https://webaim.org/resources/contrastchecker/) alcanza).

Para la **unificación visual** (que el tablero se vea como los demás: header y
footer iguales, design system, metadata, accesibilidad) corré
**`bash scripts/revisar-tablero.sh`** — es lo mismo que corre GitHub. La lista
completa, con la guía del repaso a mano, está en **`CHECKLIST.md`**; el atajo
**`revisar:`** (§7) la recorre de una. Esto **no** cubre seguridad ni datos:
eso sigue siendo el punto 1-2 de acá arriba y `SECURITY.md`.

Y decí en una línea qué tocaste y por qué.

---

## 6. Cuando dudes

Sobre **qué datos se pueden publicar**, la respuesta por defecto es **no
publicar y preguntar**. Un tablero feo se corrige; un dato personal
publicado, no. Nadie se molesta por una pregunta.

Sobre **todo lo demás** (dónde poner un estilo, cómo estructurar el HTML, si
conviene una tabla o unas tarjetas): decidí vos y seguí. Si te equivocás se
corrige, y avanzar vale más que consultar cada paso.

---

## 7. Atajos

Palabras para escribirle al asistente de IA (Claude Code, Cursor, Antigravity…),
al principio del mensaje y con dos puntos. No son magia de ninguna herramienta:
son procedimientos definidos acá. Quien no usa IA hace lo mismo a mano siguiendo
`CHECKLIST.md`.

### `iniciar:`

Instancia el tablero a partir de la plantilla. El asistente:

1. Te pregunta: nombre del tablero, una línea de qué muestra, mes de los datos.
2. Completa en `index.html` el `<title>`, los `<meta>` (`description`, `author`,
   `dcterms.modified`), el `<h2>` y la `.bajada` de la intro, y la línea
   `.actualizado`.
3. Borra el archivo `PLANTILLA` y los comentarios de andamiaje
   (`<!-- CAMBIÁ… -->`, `<!-- Empezá tu tablero acá… -->`).
4. Te pregunta **de dónde salen los datos** y completa la línea **Fuente:** del
   footer (no se deja el texto genérico) y el **`tablero.json`**: identificador
   (corto, sin espacios), título, descripción, fecha de creación, temática,
   autoría, correo de contacto, datasets (nombre, fuente, período, cómo se
   actualiza), **sensibilidad** (bajo, medio, alto o confidencial: preguntala,
   no la supongas) y modo de datos (`estatico` o `api`).
5. Completa la **declaración de uso de IA** (ver atajo `ia:`).
6. Corre `bash scripts/revisar-tablero.sh` y te muestra cómo quedó.

No toca `datos/` ni `js/tablero.js` — eso lo hacés vos.

### `revisar:`

El control de **unificación visual** antes de publicar: que el tablero se vea
como los demás. No toca seguridad ni datos (eso es `SECURITY.md` y criterio de
cada equipo). El asistente:

1. Corre `bash scripts/revisar-tablero.sh`.
2. Recorre `CHECKLIST.md` punto por punto, incluida la guía del repaso a mano
   (header/footer, metadata, design system, contraste, teclado).
3. Devuelve un informe: cada punto con ✅ / ❌ / ⚠️, y para lo que no pasa, el
   archivo, la línea y cómo se corrige.
4. Cierra con **LISTO** o **NO LISTO** y cuántos bloqueantes quedan.

No edita nada.

### `ia:`

Completa o actualiza la **declaración de uso de IA** del modal "Río Cuarto IA"
(el `<dialog id="modal-ia">` del footer). El asistente **no le pregunta al
usuario qué modelo es: lo sabe él**. Lee de su propio contexto:

- **Proveedor** (Anthropic, OpenAI, Google…), **herramienta** (Claude Code,
  Cursor, Antigravity…) y **modelo exacto** (por ejemplo "Claude Sonnet 5.5").
- **Lenguajes** usados, mirando qué archivos del tablero tocó (HTML, CSS,
  JavaScript…).
- **Qué hizo** en este tablero (procesamiento de datos, indicadores, gráficos,
  mapas, diseño…), según el trabajo real, sin inventar.

Con eso reescribe la declaración, **conservando** el párrafo de lo que quedó a
cargo del equipo (relevamiento, carga y publicación de datos, validación final)
y la frase de responsabilidad de los autores. Si ya había una declaración,
**suma** el modelo nuevo en vez de borrar al anterior (por ejemplo, si cambió de
modelo a mitad del trabajo). El revisor compara el modelo de la declaración con
el de los commits (`Co-Authored-By`) y avisa si no coinciden.

Si el trabajo lo hizo una persona sin IA, el modal se borra junto con su botón.

### `ods:`

Sugiere a qué Objetivos de Desarrollo Sostenible se vincula el tablero. El
asistente lee el tema (título, bajada) y los archivos de `datos/`, y te dice qué
ODS aplican (número + nombre), qué íconos usar (`assets/img/ods/ods-NN.png`) y
cómo declararlo (`<meta name="ods" content="11, 16">`). Los íconos van tal cual:
sin recolorear ni deformar (marca registrada de la ONU — ver
`assets/img/ods/LEEME.md`). El modal de ODS lleva **siempre** la referencia a la
Ordenanza N° 148/2021 con su link: nunca la saques ni la reemplaces.

### `accesibilidad:`

El repaso de accesibilidad (WCAG 2.1 AA — ver `ACCESIBILIDAD.md`). El asistente
revisa y te informa qué falla y cómo se corrige:

- Contraste de cualquier color nuevo contra `--fondo` y `--superficie`, **en los
  dos temas** (mín. 4.5:1 texto normal, 3:1 texto grande o borde).
- `aria-label` en los botones que son solo un ícono.
- Jerarquía de títulos sin saltos.
- Que se llegue con Tab a todo lo interactivo y se vea el foco.
- Que la información no dependa solo del color.
- `prefers-reduced-motion` si hay animaciones.

No edita.
