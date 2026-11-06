# js/vendor/ — librerías de terceros

Guardadas dentro del repo: **no se cargan de internet** (ver `SECURITY.md`, Regla 3).
**No se editan.** Cambiar de versión es una decisión del equipo (ver `AGENTS.md` §4).

## Apache ECharts 6.1.0 — `echarts.min.js`

- **Para qué:** gráficos (barras, líneas, dona, apiladas) y mapas coropléticos. Se usa
  a través de `js/graficos.js`, que lo adapta al sistema de diseño: no se llama
  a `echarts.init` directo desde un tablero.
- **Licencia:** Apache-2.0 (texto en `LICENSE-echarts.txt`).
- **Fuente:** paquete `echarts@6.1.0` del registro oficial de npm
  (`registry.npmjs.org/echarts/-/echarts-6.1.0.tgz`), archivo `dist/echarts.min.js`.
- **Integridad del paquete (npm):**
  `sha512-q0yaFPggC9FUdsWH4blavRWFmxdrIodbkoKNAjJudAI6CA9gNPxHtV2RcZNEepZVlk4yvBYkOkbk6HIVpIyHZA==`
  — verificada antes de copiar el archivo.
- **SHA-256 de `echarts.min.js`:** `b66b25aeb4df84e33199dc21694014d336d222cbd9deb0e5a7c14bd6aa0d0fd0`
  (también está en `scripts/sistema.sha256`: si alguien lo modifica, el revisor avisa).
- **Qué hace en la red:** nada. El código no hace pedidos (`fetch`/`XMLHttpRequest`); las
  URLs que aparecen adentro son comentarios de licencia y espacios de nombres de SVG.

## Leaflet 1.9.4 — `leaflet/`

- **Para qué:** mapas con mapa base (zoom, arrastre, tooltips). Se usa a través de
  `js/mapa.js` (`Mapa.crear`), que lo adapta al sistema de diseño: no se llama a
  `L.map` directo desde un tablero.
- **Licencia:** BSD-2-Clause (texto en `LICENSE-leaflet.txt`).
- **Fuente:** paquete `leaflet@1.9.4` del registro oficial de npm
  (`registry.npmjs.org/leaflet/-/leaflet-1.9.4.tgz`): `dist/leaflet.js`,
  `dist/leaflet.css` y `dist/images/`.
- **Integridad del paquete (npm):**
  `sha512-nxS1ynzJOmOlHp+iL3FyWqK89GtNL8U8rvlMOsQdTTssxZwCXh8N2NB3GDQOL+YR3XnWyZAxwQixURb+FA74PA==`
  — verificada antes de copiar los archivos. `leaflet.js` y `leaflet.css` están en
  `scripts/sistema.sha256`.
- **Qué hace en la red:** nada por su cuenta (no usa `fetch`/`XMLHttpRequest`). Solo
  pide las imágenes de las capas que se le indican: acá, los mosaicos locales de
  `assets/mapa/`.
