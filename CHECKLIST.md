# CHECKLIST — que el tablero se vea como los demás

Esta es la **definición única** de "tablero visualmente uniforme": mismo header,
mismo footer, mismo sistema de diseño, misma metadata, accesible. Se controla en
dos pasos:

1. **`bash scripts/revisar-tablero.sh`** — todo lo que una máquina puede
   verificar sola (puntos 🤖). Corre local y en GitHub
   (`.github/workflows/ci.yml`). No necesita nada instalado: bash y grep.
2. **El repaso a mano** (puntos 👤) — lo que necesita criterio. Lo hacés vos con
   la [guía de más abajo](#guía-para-el-repaso-a-mano). Si usás un asistente de
   IA (Claude Code, Cursor, Antigravity, el que sea), el atajo **`revisar:`**
   (definido en `AGENTS.md` §7) hace los dos pasos y te devuelve un informe punto
   por punto.

Este archivo manda: si cambiás un punto acá, actualizá el script si es 🤖.

## Alcance

Esto controla **solo la unificación visual**. **No** toca seguridad, claves ni
gestión de datos: cada equipo sigue con su método (las reglas de seguridad del
repo, en `SECURITY.md` y `AGENTS.md` §3, no cambiaron y siguen valiendo).

**Leyenda:** 🤖 lo verifica el script · 👤 repaso a mano · ⚠️ aviso (no bloquea).

> Mientras exista el archivo **`PLANTILLA`** en la raíz, los textos de ejemplo y
> la metadata a medio llenar salen como aviso, no como falla (para que el repo de
> la plantilla no quede en rojo). Al instanciar tu tablero, borrá ese archivo.

---

## 1. Consistencia — todos los tableros se parecen

- [ ] 🤖 Header igual al de la plantilla: logo, separador, `#boton-tema`, íconos de sol y luna
- [ ] 🤖 Footer igual al de la plantilla: créditos y enlace al sistema de diseño (`guia-diseno.html`)
- [ ] 🤖 Sección `.intro` con su `<h2>` y su `.bajada`
- [ ] 🤖 No quedó ningún texto de ejemplo de la plantilla sin reemplazar
- [ ] 🤖 El footer declara la **Fuente** del dato (`<strong>Fuente:</strong>`) y no es el texto genérico de la plantilla
- [ ] 🤖⚠️ La declaración de uso de IA (modal "Río Cuarto IA") indica el modelo y coincide con el que firmó los commits
- [ ] 👤 La Fuente dice de dónde salen *de verdad* los datos, y la declaración de IA describe lo que la IA hizo en *este* tablero
- [ ] 👤 El header y el footer no se "adornaron" con elementos propios de este tablero
- [ ] 👤 Toda página nueva copió el header y el footer completos (no una versión recortada)

## 2. Metadata mínima

- [ ] 🤖 `<title>` propio del tablero (no el de la plantilla)
- [ ] 🤖 Favicon: `<link rel="icon" href="assets/img/favicon.png">`
- [ ] 🤖 `<meta name="description">` con una frase real de qué muestra y para qué
- [ ] 🤖 `<meta name="author">` = `Dir. de Estadística, Control de Calidad y Procesos — Gobierno de Río Cuarto`
- [ ] 🤖 Fecha de actualización de los datos: `<p class="actualizado">` visible y/o `<meta name="dcterms.modified">`
- [ ] 👤 **ODS**: si el tablero se vincula a uno o más Objetivos de Desarrollo Sostenible, lo declara (`<meta name="ods" content="…">`) y muestra los íconos oficiales de `assets/img/ods/`
- [ ] 🤖 El modal de ODS lleva siempre la referencia a la **Ordenanza N° 148/2021**, con su link (no se saca ni se reemplaza)
- [ ] 👤 *(opcional)* Si se va a compartir por chat o redes, tiene `og:title` y `og:description`

## 3. Sistema de diseño

- [ ] 🤖 Cada página enlaza los seis CSS (`fuentes`, `tokens`, `base`, `componentes`, `iconos`, `tablero`) + `js/tema.js` + `js/tablero.js`
- [ ] 🤖 El botón `#boton-tema` y el `<script>` anti-titileo del `<head>` están
- [ ] 🤖 Los archivos compartidos no se tocaron: `css/base.css`, `css/componentes.css`, `css/iconos.css`, `css/fuentes.css`, `js/tema.js`, `js/pie.js`, `js/graficos.js`, `js/mapa.js`, `js/vendor/echarts.min.js`, `js/vendor/leaflet/leaflet.{js,css}` *(contra `scripts/sistema.sha256`)*
- [ ] 🤖⚠️ No hay colores hexadecimales a mano en `css/tablero.css` ni `js/tablero.js`
- [ ] 🤖⚠️ No se vendorizó ninguna librería nueva (salvo ECharts y Leaflet, ya acordadas)
- [ ] 👤 Usa las clases del sistema (`.kpi`, `.panel`, `.boton`, `.estado`, `.titulo-*`), no reinventa componentes
- [ ] 🤖 El repo solo tiene archivos de tablero: nada de código de servidor, credenciales, planillas ni dependencias
- [ ] 🤖 Rutas relativas y todos los archivos referenciados existen
- [ ] 🤖 Ningún código toca la sesión, el almacenamiento ni la API del portal (`localStorage`, `cookie`, `parent`, `/api/`, `eval`…)
- [ ] 🤖 `datos/` sin DNI, CUIT, correos ni teléfonos; sin puntos en mapas (polígonos por barrio)
- [ ] 🤖 `tablero.json` completo y válido (Ord. 162/2025 Art. 13°); el modo de datos declarado coincide con el código
- [ ] 👤 La **sensibilidad** declarada es la correcta (si es alta o confidencial, se carga en el Observatorio con sesión y aprobación)
- [ ] 🤖 Sin datos personales en `datos/`; si los hay, hay una excepción **válida** en `excepciones.json` (responsable, motivo, vencimiento ≤ 1 año, sensibilidad confidencial, repo privado) y ningún commit de esa excepción lo firma una IA
- [ ] 👤 Cada excepción tiene detrás una decisión real: la persona que figura como responsable sabe que figura y asume la decisión, y se consultó al fiscal o a legales si hace falta
- [ ] 🤖 Datos remotos (si los hay): solo `https`, sin credenciales ni tokens en el código, y sin recursos externos en el HTML (`<script>`, `<link>`, `<img>` apuntando a internet)
- [ ] 👤 Si consume una API: solo `GET`, datos ya agregados (sin personas), la Fuente nombra la API y hay plan B visible (`.error` + hora del último dato bueno). Si la API pide clave, la consulta la hace un endpoint del backend del Observatorio — no va en el navegador ni en un servidor dentro del repo
- [ ] 👤 Los mapas usan `Mapa.crear(...)` con el mapa base local (`assets/mapa/`), no un servidor de mosaicos de internet
- [ ] 👤 Los gráficos usan `Grafico.crear(...)` (no `echarts.init` directo) y alguno de los tipos estándar; si se sumó otra librería, el equipo lo acordó (`AGENTS.md` §4)
- [ ] 👤 Los íconos de los ODS se usan tal cual: sin recolorear ni deformar

## 4. Accesibilidad — WCAG 2.1 AA (`ACCESIBILIDAD.md`)

- [ ] 🤖 `<html lang="es">` en cada página
- [ ] 🤖 Toda `<img>` tiene `alt`
- [ ] 🤖 No hay `<div>` ni `<span>` con `onclick`
- [ ] 🤖⚠️ Exactamente un `<h1>` por página
- [ ] 👤 Botones que son solo un ícono con `aria-label`
- [ ] 👤 Jerarquía de títulos sin saltos (`h2` → `h3` → `h4`)
- [ ] 👤 Todo color nuevo pasa contraste AA en modo claro y oscuro
- [ ] 👤 Se llega con Tab a todo lo interactivo y se ve el foco
- [ ] 👤 La información se entiende sin depender del color
- [ ] 👤 Si hay animación, respeta `prefers-reduced-motion`

## 5. Funciona y cierra

- [ ] 👤 El tablero abre sin errores en la consola del navegador
- [ ] 👤 El botón de modo oscuro cambia el tablero entero
- [ ] 👤 Quedó anotado en una línea qué se tocó y por qué

---

## Guía para el repaso a mano

Cómo resolver cada punto 👤. Sirve para una persona o para pasárselo a cualquier
asistente de IA.

### Consistencia

- **Header y footer:** abrí el `<header>` y el `<footer>` de tu página al lado de
  los de `index.html`. Tienen que ser iguales: misma estructura, mismas clases.
  Una página nueva copia el bloque completo, no una versión recortada. Si algo
  común hace falta en todos los tableros, va a `componentes.css`, no al header de
  uno solo.
- **Componentes:** antes de escribir una tarjeta o un botón nuevo, mirá
  `guia-diseno.html`. Si ya existe (`.kpi`, `.panel`, `.boton`, `.estado`,
  `.titulo-*`), usalo en vez de rehacerlo.

### Metadata y ODS

- **`title`, `description`, `author`, fecha:** que sean reales y específicos de
  este tablero. "Datos del municipio" no sirve como descripción; "Estado y
  tiempos de los trámites municipales por área y mes" sí.
- **Sugerir ODS:** leé el tema del tablero (título, bajada) y los archivos de
  `datos/`. Si encaja con uno o más Objetivos de Desarrollo Sostenible, anotá
  cuáles (número + nombre, ej. *ODS 11 — Ciudades y comunidades sostenibles*).
  Se declara con `<meta name="ods" content="11, 16">` y se muestran los íconos
  oficiales de `assets/img/ods/` (`ods-11.png`, etc.). Si ya declaró ODS,
  verificá que los íconos sean los correctos y que no estén recoloreados ni
  deformados (es marca registrada de la ONU — ver `assets/img/ods/LEEME.md`).

### Accesibilidad

- **Contraste de un color nuevo:** el más rápido es
  [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) —
  pegás el color del texto y el del fondo y te dice si pasa. Mínimos: **4.5:1**
  texto normal, **3:1** texto grande (≥24px, o ≥19px negrita) o borde/ícono que
  es la única señal. Probá contra `--fondo` y contra `--superficie`, **en los dos
  temas** (los valores de cada tema están en `css/tokens.css`). Si no pasa,
  oscurecé (tema claro) o aclará (tema oscuro) hasta que cumpla.
  Fórmula WCAG, por si lo calculás a mano: `(L1 + 0.05) / (L2 + 0.05)`, con L la
  luminancia relativa de cada color.
- **Botones de solo ícono:** el `<button>` o `<a>` necesita `aria-label` que diga
  qué hace (ver `css/iconos.css`).
- **Títulos:** de `h1` a `h2` a `h3` sin saltarse niveles.
- **Teclado:** recorré la página con Tab. Tenés que llegar a todo lo clickeable y
  ver dónde está el foco.
- **Color:** si sacás el color, ¿se sigue entendiendo? (las `.estado` siempre
  llevan texto, no solo el punto).
- **Movimiento:** si agregaste animaciones o transiciones, envolvelas en
  `@media (prefers-reduced-motion: no-preference)` o desactivalas con
  `@media (prefers-reduced-motion: reduce)`.

### Funciona

- Abrí el tablero en el navegador con la consola abierta (F12): sin errores en
  rojo.
- El botón ◐ del header cambia el tablero entero, claro ↔ oscuro.
- Dejá anotado en una línea qué tocaste y por qué (en el commit o el PR).
