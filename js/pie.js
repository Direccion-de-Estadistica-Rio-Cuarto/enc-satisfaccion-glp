/* ==========================================================================
   pie.js — Abre los modales del footer (Río Cuarto IA / Río Cuarto ODS). NO se
   toca. Cada botón con data-abrir="id" abre el <dialog> con ese id; el cierre
   (botón ✕ y tecla Esc) lo resuelve el propio <dialog>. Acá solo se suma el
   cierre al tocar afuera del recuadro.
   ========================================================================== */

(function () {
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-abrir]').forEach(function (boton) {
      boton.addEventListener('click', function () {
        var modal = document.getElementById(boton.getAttribute('data-abrir'));
        if (modal && typeof modal.showModal === 'function') { modal.showModal(); }
      });
    });

    document.querySelectorAll('dialog.modal').forEach(function (modal) {
      // El recuadro no tiene padding propio (lo tiene .modal-cuerpo): si el clic
      // cae sobre el <dialog> mismo, fue sobre el fondo oscuro.
      modal.addEventListener('click', function (e) {
        if (e.target === modal) { modal.close(); }
      });
    });
  });
})();
