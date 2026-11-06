/* ==========================================================================
   mapa.js — Los mapas del sistema de diseño. NO se toca.

   Envuelve a Leaflet (js/vendor/leaflet/) para que todos los tableros dibujen
   los mapas igual: mapa base de Argenmap (IGN) guardado en el repo, polígonos
   coloreados con la paleta del sistema, mismos tooltips y leyenda, y modo
   claro/oscuro automático. No se llama a L.map() directo desde un tablero.

   USO
     <div class="mapa" id="m1" role="region" aria-label="Qué muestra el mapa"></div>

     const mapa = Mapa.crear('#m1', {
       geojson:   {...},                       // FeatureCollection de polígonos
       propiedad: 'nombre',                    // propiedad del GeoJSON con el nombre
       detalle:   'vecinales',                 // (opcional) propiedad con un texto extra para el tooltip
       datos:     [{ nombre: 'Centro', valor: 466 }, ...],
       unidad:    'trámites'                   // para el tooltip
       // etiquetas: false                      // (opcional) oculta el nombre escrito sobre cada polígono
     });
     mapa.actualizar({ ...configNueva });      // al cambiar los filtros

   CONTROLES: el mapa trae un botón para AMPLIARLO (pantalla completa; Esc para
   volver) y un selector de CAPAS para ocultar el mapa base, los sectores o sus
   nombres, y una casilla "Mapa base en color" (por defecto el mapa base se ve en
   gris). Lo que elija la persona se mantiene al cambiar los filtros.

   MAPA BASE: mosaicos de Argenmap en assets/mapa/{z}/{x}/{y}.png, solo de la
   zona urbana de Río Cuarto, zoom 10 a 17. NO se piden a internet (SECURITY.md,
   Regla 3). Fuera de esa zona el mapa no se deja desplazar.
   ========================================================================== */

(function () {
  'use strict';

  // Zona urbana con mosaicos de todo el detalle (zoom 10 a 17) y zona más amplia que solo
  // tiene los zooms bajos (hasta el 14), para que el mapa ampliado no muestre huecos.
  // (sur-oeste, norte-este). Si se amplían los mosaicos, se actualizan acá.
  var ZONA = [[-33.19, -64.43], [-33.07, -64.27]];
  var ZONA_AMPLIA = [[-33.30, -64.60], [-32.95, -64.10]];
  var ZOOM_MIN = 10;
  var ZOOM_MAX = 17;
  var MOSAICOS = 'assets/mapa/{z}/{x}/{y}.png';
  var ATRIBUCION = 'Mapa base: © <a href="https://www.ign.gob.ar" target="_blank" rel="noopener">Instituto Geográfico Nacional</a> (Argenmap, oct. 2026)';

  var registro = [];
  var CAPA_BASE = 'Mapa base';
  var CAPA_SECTORES = 'Sectores';
  var CAPA_NOMBRES = 'Nombres';
  var CAPA_COLOR = 'Mapa base en color';

  /* --- Tema: todo sale de tokens.css ------------------------------------------ */

  function css(nombre) {
    return getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
  }

  /** Mezcla dos colores #rrggbb (t = cuánto del segundo, 0 a 1). Rampa del coroplético. */
  function mezclar(a, b, t) {
    function rgb(h) { return [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
    var x = rgb(a), y = rgb(b);
    return '#' + x.map(function (v, i) {
      return ('0' + Math.round(v + (y[i] - v) * t).toString(16)).slice(-2);
    }).join('');
  }

  function numero(v) { return Number(v).toLocaleString('es-AR'); }

  /** Color de un valor en la rampa de un solo tono (--serie-1): claro = menos, intenso = más. */
  function rampa(c, t) {
    var claro = mezclar(c.serie, c.superficie, 0.78);
    var medio = mezclar(c.serie, c.superficie, 0.4);
    return t < 0.5 ? mezclar(claro, medio, t / 0.5) : mezclar(medio, c.serie, (t - 0.5) / 0.5);
  }

  function colores() {
    return { serie: css('--serie-1'), superficie: css('--superficie'), texto: css('--texto'), suave: css('--texto-suave') };
  }

  /* --- Botón "Ampliar mapa" ----------------------------------------------------- */

  function alternarAmpliado(item, boton) {
    var activo = item.el.classList.toggle('mapa--ampliado');
    document.documentElement.classList.toggle('mapa-ampliado-activo', activo);
    boton.setAttribute('aria-label', activo ? 'Reducir mapa' : 'Ampliar mapa');
    boton.setAttribute('title', activo ? 'Reducir mapa (Esc)' : 'Ampliar mapa');
    boton.firstChild.textContent = activo ? 'fullscreen_exit' : 'fullscreen';
    setTimeout(function () { item.mapa.invalidateSize(); }, 0);
  }

  var Ampliar = L.Control.extend({
    options: { position: 'topright' },
    onAdd: function () {
      var item = this.options.item;
      var cont = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      var boton = L.DomUtil.create('button', 'mapa-ampliar', cont);
      boton.type = 'button';
      boton.setAttribute('aria-label', 'Ampliar mapa');
      boton.setAttribute('title', 'Ampliar mapa');
      var icono = L.DomUtil.create('span', 'icono', boton);
      icono.setAttribute('aria-hidden', 'true');
      icono.textContent = 'fullscreen';
      L.DomEvent.disableClickPropagation(cont);
      L.DomEvent.on(boton, 'click', function () { alternarAmpliado(item, boton); });
      // Esc vuelve al tamaño normal.
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && item.el.classList.contains('mapa--ampliado')) { alternarAmpliado(item, boton); boton.focus(); }
      });
      return cont;
    }
  });

  /* --- Dibujo ------------------------------------------------------------------- */

  function pintar(item) {
    var cfg = item.config;
    var c = colores();
    var propiedad = cfg.propiedad || 'nombre';
    var valores = {};
    cfg.datos.forEach(function (d) { valores[d.nombre] = d.valor; });
    var lista = cfg.datos.map(function (d) { return d.valor; });
    var min = Math.min.apply(null, lista), max = Math.max.apply(null, lista);
    var normal = function (v) { return max === min ? 1 : (v - min) / (max - min); };

    // Primero se saca el selector de capas: si no, al quitar las capas para repintarlas
    // creería que la persona las ocultó.
    if (item.control) { item.mapa.removeControl(item.control); }
    if (item.capa) { item.mapa.removeLayer(item.capa); }
    if (item.etiquetas) { item.mapa.removeLayer(item.etiquetas); }
    if (item.leyenda) { item.mapa.removeControl(item.leyenda); }

    function estilo(f) {
      var v = valores[f.properties[propiedad]];
      return {
        fillColor: v === undefined ? c.superficie : rampa(c, normal(v)),
        fillOpacity: 0.66,
        // Borde fino del color de la serie (no blanco): separa un sector de otro sin recortarlos.
        color: c.serie,
        weight: 1,
        opacity: 0.55
      };
    }

    item.capa = L.geoJSON(cfg.geojson, {
      style: estilo,
      onEachFeature: function (f, capa) {
        var nombre = f.properties[propiedad];
        var v = valores[nombre];
        var contenido = document.createElement('div');
        var t = document.createElement('strong');
        t.textContent = nombre;
        contenido.appendChild(t);
        contenido.appendChild(document.createElement('br'));
        contenido.appendChild(document.createTextNode(
          v === undefined ? 'sin datos' : numero(v) + (cfg.unidad ? ' ' + cfg.unidad : '')));
        if (cfg.detalle && f.properties[cfg.detalle]) {
          var det = document.createElement('small');
          det.textContent = f.properties[cfg.detalle];
          contenido.appendChild(det);
        }
        capa.bindTooltip(contenido, { sticky: true, direction: 'top', className: 'mapa-tooltip' });
        capa.on('mouseover', function () { capa.setStyle({ weight: 3, color: c.texto }); capa.bringToFront(); });
        capa.on('mouseout', function () { item.capa.resetStyle(capa); });
      }
    });
    if (!item.oculto[CAPA_SECTORES]) { item.capa.addTo(item.mapa); }

    // Nombre de cada polígono escrito encima (decorativo: el dato está en el tooltip y en la tabla).
    if (cfg.etiquetas !== false) {
      item.etiquetas = L.layerGroup();
      item.capa.eachLayer(function (capa) {
        var rotulo = document.createElement('span');
        rotulo.textContent = capa.feature.properties[propiedad];
        L.marker(capa.getBounds().getCenter(), {
          icon: L.divIcon({ className: 'mapa-etiqueta', html: rotulo, iconSize: [0, 0] }),
          interactive: false,
          keyboard: false
        }).addTo(item.etiquetas);
      });
      if (!item.oculto[CAPA_NOMBRES]) { item.etiquetas.addTo(item.mapa); }
    }

    // Leyenda: "Menos ▭▭▭ Más", con la misma rampa.
    var Leyenda = L.Control.extend({
      options: { position: 'bottomleft' },
      onAdd: function () {
        var div = L.DomUtil.create('div', 'mapa-leyenda');
        div.setAttribute('aria-hidden', 'true');
        div.innerHTML = '<span>Menos</span><i></i><span>Más</span>';
        div.querySelector('i').style.background =
          'linear-gradient(90deg,' + rampa(c, 0) + ',' + rampa(c, 0.5) + ',' + rampa(c, 1) + ')';
        return div;
      }
    });
    item.leyenda = new Leyenda().addTo(item.mapa);

    // Selector de capas (ocultar mapa base / sectores / nombres).
    var capas = {};
    capas[CAPA_BASE] = item.base;
    capas[CAPA_COLOR] = item.color;   // casilla: el mapa base se ve en color (por defecto, gris)
    capas[CAPA_SECTORES] = item.capa;
    if (item.etiquetas) { capas[CAPA_NOMBRES] = item.etiquetas; }
    item.control = L.control.layers(null, capas, { collapsed: true, position: 'topright' }).addTo(item.mapa);
    var toggle = item.control.getContainer().querySelector('.leaflet-control-layers-toggle');
    if (toggle) { toggle.setAttribute('title', 'Capas del mapa'); toggle.setAttribute('aria-label', 'Capas del mapa'); }

    if (!item.encuadrado) {
      item.mapa.fitBounds(item.capa.getBounds(), { padding: [24, 24] });
      item.encuadrado = true;
    }
  }

  function crear(destino, config) {
    var el = typeof destino === 'string' ? document.querySelector(destino) : destino;
    if (!el) { throw new Error('Mapa: no existe el elemento ' + destino); }
    var item = { el: el, config: config, mapa: null, base: null, color: L.layerGroup(), capa: null, etiquetas: null, leyenda: null, control: null, oculto: {}, encuadrado: false };
    registro.push(item);

    // Igual que los gráficos: el mapa se crea cuando el contenedor tiene tamaño
    // (por ejemplo, al mostrarse una pestaña oculta) y se ajusta cuando cambia.
    var observador = new ResizeObserver(function () {
      if (!el.clientWidth || !el.clientHeight) { return; }
      if (!item.mapa) {
        var limites = L.latLngBounds(ZONA);
        var amplia = L.latLngBounds(ZONA_AMPLIA);
        item.mapa = L.map(el, {
          minZoom: ZOOM_MIN + 1,
          maxZoom: ZOOM_MAX,
          maxBounds: limites.pad(0.1),
          maxBoundsViscosity: 1,
          zoomSnap: 0.5,
          attributionControl: true
        });
        item.mapa.attributionControl.setPrefix('Leaflet');
        item.base = L.tileLayer(MOSAICOS, {
          bounds: amplia,
          minZoom: ZOOM_MIN,
          maxZoom: ZOOM_MAX,
          attribution: ATRIBUCION,
          errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='
        });
        if (!item.oculto[CAPA_BASE]) { item.base.addTo(item.mapa); }
        item.mapa.on('overlayadd overlayremove', function (e) {
          if (e.name === CAPA_COLOR) { el.classList.toggle('mapa--color', e.type === 'overlayadd'); }   // la casilla de color no oculta nada: cambia el filtro
          else { item.oculto[e.name] = e.type === 'overlayremove'; }
        });
        item.mapa.addControl(new Ampliar({ item: item }));
        pintar(item);
      } else {
        item.mapa.invalidateSize();
      }
    });
    observador.observe(el);

    return {
      actualizar: function (nueva) {
        item.config = nueva;
        if (item.mapa) { pintar(item); }
      }
    };
  }

  function repintarTodos() {
    registro.forEach(function (item) { if (item.mapa) { pintar(item); } });
  }

  document.addEventListener('tema:cambio', repintarTodos);
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', repintarTodos);
  }

  window.Mapa = { crear: crear };
})();
