/* ==========================================================================
   graficos.js — Los gráficos del sistema de diseño. NO se toca.

   Envuelve a Apache ECharts (js/vendor/echarts.min.js) para que todos los
   tableros dibujen los gráficos igual: misma paleta (--serie-1…8), misma
   tipografía, mismos tooltips y cambio de claro/oscuro automático. No se llama
   a echarts.init() directo desde un tablero: se usa Grafico.crear().

   USO
     <div class="grafico" id="g1" role="img" aria-label="Qué muestra, en una frase"></div>

     Grafico.crear('#g1', { tipo: 'lineas', categorias: [...], series: [...] });

   TIPOS ESTÁNDAR (los únicos que existen; si hace falta otro, se define acá)
     'barras'     categorias, series:[{nombre, valores}]
                  opciones: horizontal:true · apiladas:true
     'lineas'     categorias, series:[{nombre, valores}]   opciones: area:true
     'dona'       datos:[{nombre, valor}]                  opciones: centro:{valor, etiqueta}
     (los mapas no van acá: ver js/mapa.js, Mapa.crear — Leaflet con mapa base)
   Todos aceptan: unidad:'trámites' (para el tooltip) y descripcion:'texto para
   lector de pantalla'.

   Devuelve { actualizar(configNueva) }. Si cambia el tema (botón del header o
   el modo del sistema), todos los gráficos se vuelven a pintar solos.
   ========================================================================== */

(function () {
  'use strict';

  var registro = [];        // { el, config, chart }

  /* --- Lectura del tema: todo sale de tokens.css, nada de colores acá ------ */

  function css(nombre) {
    return getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
  }

  function colores() {
    var serie = [];
    for (var i = 1; i <= 8; i++) { serie.push(css('--serie-' + i)); }
    return {
      serie: serie,
      texto: css('--texto'),
      suave: css('--texto-suave'),
      borde: css('--borde'),
      superficie: css('--superficie'),
      fondo: css('--fondo'),
      fuente: css('--fuente')
    };
  }

  /** Mezcla dos colores #rrggbb (t = cuánto del segundo, 0 a 1). Para la rampa del mapa. */
  function mezclar(a, b, t) {
    function rgb(h) { return [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
    var x = rgb(a), y = rgb(b);
    return '#' + x.map(function (v, i) {
      return ('0' + Math.round(v + (y[i] - v) * t).toString(16)).slice(-2);
    }).join('');
  }

  function sinAnimacion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function numero(v) {
    return Number(v).toLocaleString('es-AR');
  }

  /* --- Opciones comunes a todos los tipos ---------------------------------- */

  function comun(c, cfg) {
    return {
      color: c.serie,
      backgroundColor: 'transparent',
      textStyle: { fontFamily: c.fuente, color: c.suave },
      animation: !sinAnimacion(),
      animationDuration: 700,
      animationEasing: 'cubicOut',
      aria: { enabled: true, label: { description: cfg.descripcion } },
      tooltip: {
        backgroundColor: c.superficie,
        borderColor: c.borde,
        borderWidth: 1,
        padding: [10, 14],
        textStyle: { color: c.texto, fontFamily: c.fuente, fontSize: 13 },
        extraCssText: 'border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.18);',
        confine: true
      },
      legend: {
        bottom: 0,
        icon: 'roundRect',
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 14,
        textStyle: { color: c.suave, fontFamily: c.fuente, fontSize: 13 }
      }
    };
  }

  function ejes(c, horizontal, categorias) {
    var cat = {
      type: 'category',
      data: categorias,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: c.borde } },
      axisLabel: { color: c.suave, fontFamily: c.fuente, fontSize: 12, margin: 12, interval: categorias.length <= 8 ? 0 : 'auto', hideOverlap: true }
    };
    var val = {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: c.suave, fontFamily: c.fuente, fontSize: 12, formatter: function (v) { return numero(v); } },
      splitLine: { lineStyle: { color: c.borde, type: 'dashed' } }
    };
    return horizontal ? { xAxis: val, yAxis: Object.assign(cat, { inverse: true }) } : { xAxis: cat, yAxis: val };
  }

  /* --- Un constructor por tipo --------------------------------------------- */

  var tipos = {

    barras: function (c, cfg) {
      var horizontal = !!cfg.horizontal, apiladas = !!cfg.apiladas;
      var multiples = cfg.series.length > 1;
      var o = comun(c, cfg);
      o.grid = { left: 4, right: 20, top: 16, bottom: multiples ? 68 : 8, containLabel: true };
      o.tooltip.trigger = 'axis';
      o.tooltip.axisPointer = { type: 'shadow', shadowStyle: { color: c.borde, opacity: 0.35 } };
      o.tooltip.valueFormatter = function (v) { return numero(v) + (cfg.unidad ? ' ' + cfg.unidad : ''); };
      Object.assign(o, ejes(c, horizontal, cfg.categorias));
      o.legend.show = multiples;
      o.series = cfg.series.map(function (s, i) {
        var ultimo = i === cfg.series.length - 1;
        var radio = horizontal ? [0, 8, 8, 0] : [8, 8, 0, 0];
        return {
          name: s.nombre,
          type: 'bar',
          stack: apiladas ? 'total' : undefined,
          data: s.valores,
          barMaxWidth: 36,
          barGap: '12%',
          itemStyle: {
            // Apiladas: solo el último tramo lleva la punta redondeada, y una
            // línea del color de la tarjeta separa un tramo del otro.
            borderRadius: apiladas ? (ultimo ? radio : 0) : radio,
            borderColor: apiladas ? c.superficie : undefined,
            borderWidth: apiladas ? 1.5 : 0
          },
          emphasis: { focus: 'series' }
        };
      });
      return o;
    },

    lineas: function (c, cfg) {
      var multiples = cfg.series.length > 1;
      var o = comun(c, cfg);
      o.grid = { left: 4, right: 20, top: 20, bottom: multiples ? 68 : 8, containLabel: true };
      o.tooltip.trigger = 'axis';
      o.tooltip.axisPointer = { type: 'line', lineStyle: { color: c.borde, width: 1.5 } };
      o.tooltip.valueFormatter = function (v) { return numero(v) + (cfg.unidad ? ' ' + cfg.unidad : ''); };
      Object.assign(o, ejes(c, false, cfg.categorias));
      o.xAxis.boundaryGap = false;
      o.legend.show = multiples;
      o.series = cfg.series.map(function (s, i) {
        var serie = {
          name: s.nombre,
          type: 'line',
          data: s.valores,
          smooth: 0.3,
          symbol: 'circle',
          symbolSize: 8,
          showSymbol: false,
          lineStyle: { width: 3, cap: 'round' },
          itemStyle: { borderColor: c.superficie, borderWidth: 2 },
          emphasis: { focus: 'series', scale: 1.2 }
        };
        if (cfg.area) {
          serie.areaStyle = {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: mezclar(c.serie[i], c.superficie, 0.72) },
                { offset: 1, color: c.superficie }
              ]
            }
          };
        }
        return serie;
      });
      return o;
    },

    dona: function (c, cfg) {
      var o = comun(c, cfg);
      o.tooltip.trigger = 'item';
      o.tooltip.formatter = function (p) {
        return p.marker + ' ' + p.name + '<br><b>' + numero(p.value) + '</b>' +
          (cfg.unidad ? ' ' + cfg.unidad : '') + ' · ' + p.percent + '%';
      };
      o.series = [{
        type: 'pie',
        radius: ['50%', '72%'],
        center: ['50%', '42%'],
        avoidLabelOverlap: true,
        padAngle: 2,
        itemStyle: { borderRadius: 10, borderColor: c.superficie, borderWidth: 3 },
        label: { show: false },
        labelLine: { show: false },
        emphasis: { scaleSize: 6, label: { show: false } },
        data: cfg.datos.map(function (d) { return { name: d.nombre, value: d.valor }; })
      }];
      if (cfg.centro) {
        o.title = {
          text: cfg.centro.valor,
          subtext: cfg.centro.etiqueta || '',
          left: 'center',
          top: '33%',
          itemGap: 2,
          textStyle: { color: c.texto, fontFamily: c.fuente, fontSize: 28, fontWeight: 800 },
          subtextStyle: { color: c.suave, fontFamily: c.fuente, fontSize: 13 }
        };
      }
      return o;
    }
  };

  /* --- Ciclo de vida --------------------------------------------------------- */

  function pintar(item) {
    var tipo = tipos[item.config.tipo];
    if (!tipo) { throw new Error('Grafico: tipo desconocido "' + item.config.tipo + '"'); }
    item.chart.setOption(tipo(colores(), item.config), true);
  }

  function crear(destino, config) {
    var el = typeof destino === 'string' ? document.querySelector(destino) : destino;
    if (!el) { throw new Error('Grafico: no existe el elemento ' + destino); }
    var item = { el: el, config: config, chart: null };
    registro.push(item);

    // El gráfico se crea recién cuando el contenedor tiene tamaño (por ejemplo,
    // al mostrarse una pestaña que estaba oculta), y se ajusta cuando cambia.
    var observador = new ResizeObserver(function () {
      if (!el.clientWidth || !el.clientHeight) { return; }
      if (!item.chart) {
        item.chart = echarts.init(el, null, { renderer: 'svg' });
        pintar(item);
      } else {
        item.chart.resize();
      }
    });
    observador.observe(el);

    return {
      actualizar: function (nueva) {
        item.config = nueva;
        if (item.chart) { pintar(item); }
      }
    };
  }

  function repintarTodos() {
    registro.forEach(function (item) { if (item.chart) { pintar(item); } });
  }

  // Cambió el tema (botón del header) o el modo del sistema: se repinta todo.
  document.addEventListener('tema:cambio', repintarTodos);
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', repintarTodos);
  }

  window.Grafico = { crear: crear };
})();
