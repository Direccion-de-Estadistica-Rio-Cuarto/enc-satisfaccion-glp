# assets/mapa/ — mapa base (Argenmap, IGN)

Mosaicos del mapa base **Argenmap** del [Instituto Geográfico Nacional](https://www.ign.gob.ar)
(Argentina), guardados en el repo para que el mapa funcione **sin pedir nada a
internet** (`SECURITY.md`, Regla 3). Los usa `js/mapa.js`.

- **Zona de detalle:** zona urbana de Río Cuarto — lon -64,43 a -64,27 y lat -33,19 a
  -33,07, de zoom 10 a **17** (hasta edificios y parcelas).
- **Zona amplia:** lon -64,60 a -64,10 y lat -33,30 a -32,95, solo de zoom 10 a 14 (para
  que el mapa ampliado a pantalla completa no muestre huecos).
- **Cantidad y peso:** 4.926 mosaicos, unos 14 MB en total (3.180 son del zoom 17).
- **Estructura:** `{zoom}/{x}/{y}.png` (esquema XYZ estándar), de 256 px.
- **Fuente:** servicio TMS de capas base del IGN (`capabaseargenmap`, EPSG:3857),
  descargado en octubre de 2026 con una pausa entre pedidos para no cargar el
  servidor.
- **Qué se les hizo:** solo se recomprimieron a paleta de 128 colores (para que pesen
  un tercio) y se les quitó la transparencia; el contenido del mapa no se modificó.
- **Cómo se ven:** en **escala de grises**. Los mosaicos guardados son los de color, y el
  gris lo aplica el navegador con un filtro (`--filtro-mapa` en `css/tokens.css`): así los
  datos que se dibujan encima son lo único con color. Es un cambio de presentación, no de
  contenido. Quien mira el mapa puede verlo a color con la casilla **"Mapa base en color"** del
  selector de capas (por defecto, gris). Para que el color sea el predeterminado, poner
  `--filtro-mapa: none` (y, en modo oscuro, quitar `grayscale(1)`).

## Condiciones de uso del IGN

Se consultaron los [términos de reutilización de la información del IGN](https://www.ign.gob.ar/descargas/tyc1.html)
(octubre de 2026). En resumen, permiten copiar, adaptar y reutilizar la información,
y piden:

- **Atribuir** la autoría al Instituto Geográfico Nacional de la República Argentina →
  el mapa muestra "Mapa base: © Instituto Geográfico Nacional (Argenmap, oct. 2026)" y
  **esa atribución no se saca**. Incluye la fecha de los datos.
- **No insinuar** que el IGN participa, patrocina o respalda este tablero.
- **No distorsionar** el sentido de la información (por eso solo se recomprimió la imagen).
- **Conservar** la fecha de actualización y las condiciones de reutilización (este archivo).
- Compartir la información de forma libre y gratuita.

La página de Argenmap no detalla condiciones propias ni dice nada expreso sobre guardar
los mosaicos localmente; los términos generales contemplan la descarga y la copia. Esto es
un resumen, no asesoramiento legal: ante una duda (por ejemplo, un uso comercial), consultá
al IGN.

## Otra zona, más zoom u otro mapa base

El mapa base es el que está: no hay una herramienta incluida para generarlo de nuevo. Si
algún tablero necesita otra zona, más detalle u otro mapa base, **se resuelve para ese caso
en particular** (más zoom o más zona = más peso en el repo, y hay que volver a revisar las
condiciones de uso de la fuente). Las zonas y el zoom que cubren los mosaicos de esta
carpeta están declarados en `js/mapa.js` (`ZONA`, `ZONA_AMPLIA`, `ZOOM_MAX`). **El tablero
publicado nunca pide mosaicos a internet** (Regla 3).
