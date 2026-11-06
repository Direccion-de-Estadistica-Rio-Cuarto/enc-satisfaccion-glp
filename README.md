# Template de tableros — Dir. de Estadística, Control de Calidad y Procesos

Plantilla para crear tableros con datos, todos con el **mismo diseño**, las
**mismas reglas de seguridad** y **accesibles** (WCAG AA) de fábrica. Vos te
ocupás de tus datos y de cómo los cargás; el diseño, los colores, el
contraste y los chequeos de seguridad ya vienen resueltos. HTML, CSS y JS
simples, sin build.

> **¿Primera vez?** Andá directo a [Empezar](#empezar-tu-primer-tablero) más abajo.

---

## Qué hay acá adentro

```
index.html          el tablero (la página). Editás el título y el contenido.
tablero.json        los metadatos del tablero (título, autoría, contacto, datasets, sensibilidad…). Se completa y el revisor lo valida.
excepciones.json    decisiones humanas de saltarse la regla de datos personales (responsable, motivo, vencimiento). Vacío por defecto.
guia-diseno.html    el sistema de diseño: colores, tipografía, botones, estados, filtros, avisos, pestañas, gráficos.
css/
  fuentes.css       la tipografía (Google Sans). NO se toca.
  tokens.css        ← la paleta y los tamaños. Se toca SOLO acá.
  base.css          header, footer, grilla, tarjetas. Casi nunca se toca.
  componentes.css   botones, estados y clases de texto. Casi nunca se toca.
  iconos.css        íconos (Material Symbols). Casi nunca se toca.
  tablero.css       ← TUS estilos propios. Acá va el CSS que escribas.
js/
  tema.js           el interruptor de modo claro/oscuro. NO se toca.
  pie.js            abre los modales del footer (Río Cuarto IA / ODS). NO se toca.
  graficos.js       los gráficos del sistema (barras, líneas, dona). NO se toca.
  mapa.js           los mapas del sistema (coroplético sobre Argenmap). NO se toca.
  vendor/           Apache ECharts y Leaflet, guardados en el repo (no se cargan de internet). NO se tocan.
  tablero.js        ← TU lógica: cargar tus datos y mostrarlos. El archivo que editás.
datos/              ← TUS DATOS, ya agregados y publicables (el formato es tu decisión).
datos-fuente/       datos crudos — NO se suben (está en .gitignore).
assets/img/         imágenes y el logo.
assets/img/ods/     íconos oficiales de los Objetivos de Desarrollo Sostenible (ONU).
assets/mapa/        mosaicos de Argenmap (IGN) de la zona urbana de Río Cuarto: el mapa base, guardado en el repo.
assets/fonts/       tipografía (Google Sans) e íconos (Material Symbols), guardados en el repo. NO se toca.
SECURITY.md         las 3 reglas de seguridad. Leelo una vez.
ACCESIBILIDAD.md    contraste de color y accesibilidad. Leelo si vas a tocar colores.
AGENTS.md           las reglas que sigue el agente de IA. La fuente de verdad.
CHECKLIST.md        qué tiene que cumplir el tablero antes de publicarse.
scripts/
  revisar-tablero.sh   corré esto antes de commitear. Lo mismo que corre GitHub.
  sistema.sha256       huellas de los archivos que no se tocan.
PLANTILLA           borralo al crear tu tablero (ver "Empezar", paso 1).
.github/workflows/  la revisión automática que corre en GitHub.
```

> **¿Usás un agente de IA (Claude Code, Cursor, Antigravity) para armar el
> tablero?** Ya lee `AGENTS.md` solo al abrir la carpeta: conoce el design
> system y las reglas de seguridad sin que se las expliques. Pedile igual, al
> empezar: *"Leé AGENTS.md antes de tocar nada"*.

Regla mental: **tocás `index.html`, `js/tablero.js`, `css/tablero.css`,
`css/tokens.css` y `datos/`. El resto ya funciona.**

¿Necesitás un estilo que el sistema no tiene? Va en `css/tablero.css`, que se
carga último y es local a tu tablero. No lo pongas en `componentes.css`: eso
es lo compartido con los demás.

**Gráficos:** la plantilla trae Apache ECharts (guardado en `js/vendor/`, no se
carga de internet) con los tipos estándar ya adaptados al diseño: barras,
barras horizontales, apiladas, líneas, dona y mapa coroplético. Se usan con
`Grafico.crear('#id', {...})` — **no** se llama a ECharts directo. Ejemplos en
vivo en `guia-diseno.html`. Un tablero de ejemplo completo, con datos inventados,
está en la rama `ejemplo` del repositorio (la plantilla en sí no trae ningún dato).

**Mapas:** Leaflet (en `js/vendor/leaflet/`) con Argenmap del Instituto
Geográfico Nacional como mapa base, guardado en `assets/mapa/` — no se carga de
internet. Se usa con `Mapa.crear('#id', {...})`: dibuja tus polígonos (un
GeoJSON) coloreados según tus datos. Cubre la zona urbana de Río Cuarto.

---

## Empezar tu primer tablero

1. **Creá tu repo** desde este template: botón verde **"Use this template" →
   "Create a new repository"** en GitHub. Ponele un nombre (ej. `tablero-tramites`).
   Vas a tener tu propia copia, con el diseño y la seguridad ya adentro.

2. **Cloná tu repo e instancialo.** Con un asistente de IA: escribile
   `iniciar:` — te pregunta el nombre, la descripción y la fecha de los datos,
   completa la metadata de `index.html` y borra el archivo `PLANTILLA`. A mano:
   editá esos textos y borrá `PLANTILLA` vos. Mientras ese archivo exista, los
   controles no bloquean por textos de ejemplo; al borrarlo, empiezan a exigir.

3. **Mirá la plantilla funcionando.** Abrí `guia-diseno.html` en el navegador:
   tiene todos los componentes, los gráficos y el mapa en vivo (`index.html` es
   tu tablero y arranca vacío). Los gráficos y el mapa funcionan abriendo el
   archivo directo, sin servidor. Lo único que lo necesita es traer datos con
   `fetch` desde un archivo local de `datos/` (el navegador lo bloquea si abrís
   el HTML directo): para probarlo, un servidor local (la extensión Live Server de
   VS Code, o el que prefieras). Alternativa sin servidor: cargar los datos con
   un `<script>` que defina el objeto.

   ¿Tu tablero trae **datos en tiempo real de una API**? Se puede, con reglas:
   solo `https`, solo lectura, **sin claves en el navegador**, solo datos
   agregados y un plan B si la API cae. Está en `SECURITY.md` ("Datos en tiempo
   real desde una API"). La API tiene que permitir pedidos desde tu sitio (CORS).

4. **Poné tus datos en `datos/`.** La gestión de datos la seguís haciendo como
   la venías haciendo — las reglas de seguridad están en `SECURITY.md`. El
   formato es tu decisión.

5. **Editá `js/tablero.js`.** Es el único archivo con lógica: cargá tus datos
   y mostralos (tarjetas `.kpi`, una tabla, lo que necesites).

6. **Terminá los textos de `index.html`:** el `<h2>` y la bajada de la intro (el
   `iniciar:` ya dejó el `<title>` y la metadata). Si tu tablero se vincula a un
   ODS, con IA escribile `ods:` para que te sugiera cuáles y cómo declararlo.

7. **Revisá antes de subir.** Corré `bash scripts/revisar-tablero.sh` (lo mismo
   que corre GitHub) y después el repaso a mano de [`CHECKLIST.md`](CHECKLIST.md).
   Con un asistente de IA, el atajo **`revisar:`** hace los dos y te devuelve un
   informe con **LISTO / NO LISTO**. Los atajos están definidos en `AGENTS.md` §7.

   **En Windows**, el script se corre desde **Git Bash** (viene con Git para
   Windows; en VS Code, elegí "Git Bash" en la terminal), no desde PowerShell ni
   CMD. Si no querés correrlo en tu máquina, no pasa nada: GitHub lo corre solo
   en cada cambio y esa es la verificación que cuenta. El repo fija los finales de
   línea (`.gitattributes`), así que funciona igual en Windows, Mac y Linux.

8. **Subí el cambio.** Al hacer push, GitHub corre el mismo script más el
   escaneo de claves. Verde = listo para publicar en Dokploy.

---

## El sistema de diseño

Colores, tipografía, botones, estados y tarjetas de indicador — todos en vivo
en **[`guia-diseno.html`](guia-diseno.html)** (abrila en el navegador).

- **Botones:** clase `.boton` + una variante (`.boton--primario`, `--secundario`,
  `--sutil`, `--peligro`).
- **Tipografía:** clases `.titulo-xl` a `.titulo-s`, `.texto`, `.texto-suave`.
- **Números:** tarjetas `.kpi`, dentro de un contenedor `.indicadores`.
- **Íconos:** clase `.icono`, con el nombre del ícono como texto (buscalo en
  [fonts.google.com/icons](https://fonts.google.com/icons)) — ver `css/iconos.css`.
- **ODS:** si tu tablero se vincula a un Objetivo de Desarrollo Sostenible, los
  17 íconos oficiales están en `assets/img/ods/` (ver su `LEEME.md`).
- **Paleta:** todo sale de `css/tokens.css`. Cambiás un valor ahí y se propaga
  a todo el tablero, modo oscuro incluido.

---

## Modo oscuro

Ya viene resuelto en la plantilla, no hay que hacer nada. El tablero sigue el
modo del sistema operativo del visitante solo, y además tiene un botón (◐) en
la esquina del header para elegirlo a mano — la elección queda guardada en ese
navegador. Si armás una página nueva a partir de `index.html`, copiá el header
completo (incluye el botón y el script anti-titileo del `<head>`) y el
`<script src="js/tema.js">` del final.

---

## Cambiar los colores o el logo (para el que arma el estándar)

- **Paleta y tipografía:** `css/tokens.css`. Cambiás los valores de arriba y
  cambia todo el tablero, modo oscuro incluido.
- **Nombre del organismo / header:** el texto está en `index.html` (sección
  `<header>`); el color, en `--marca` dentro de `css/tokens.css`.
- **Logo:** reemplazá `assets/img/logo-gobierno.webp` por el oficial (mismo nombre).
- ⚠️ **Si tocás un color, revisá `ACCESIBILIDAD.md` primero.** Ya hubo una
  ronda de ajustes por contraste (WCAG AA) — por ejemplo, `--marca` (celeste,
  para fondos) y `--marca-enlace` (mismo celeste, más oscuro, para cuando es
  el texto) no son intercambiables.

---

## Seguridad

Tres reglas, explicadas en **[`SECURITY.md`](SECURITY.md)**. En una línea:
**ninguna clave en el repo, se publica el resumen y no la fila, y todo se carga
desde el repo (nada de internet).** GitHub lo revisa solo en cada cambio.

---

## Accesibilidad

Explicado en **[`ACCESIBILIDAD.md`](ACCESIBILIDAD.md)**. La paleta ya pasó
una auditoría de contraste (WCAG AA) — léelo antes de agregar o cambiar
cualquier color.
