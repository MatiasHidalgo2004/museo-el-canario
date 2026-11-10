/* scripts/atmosfera.js
   Atmósfera ambiental: estelas de luz, motas de polvo y HOJAS al viento.
   El marcado y las animaciones viven en styles.css (clases .atm-*, .hoja-*);
   aquí se inyectan las capas en su punto. Hay DOS capas posibles por página:

   1) .fondo-atm — el FONDO de la página (detrás del card y del menú fijo):
      primer hijo de <main class="hero">, z-index -1 con el hero aislado
      (isolation:isolate), por encima de la imagen de fondo y por debajo de
      todo el contenido. SIEMPRE completa (estelas + polvo + hojas) y en
      TODAS las páginas — también en las salas del recorrido, donde antes no
      existía y se echaba de menos en móvil.

   2) .fondo-atm-en-escena — SOBRE la ilustración de la escena (sólo las
      salas): dentro de .cruce-lienzo y por delante de .cruce-puntos (por
      encima del dibujo, por debajo de puntos y fichas). Polvo siempre;
      hojas sólo en las escenas de exterior (cruce, bodega, cancha y
      corredor); en móvil (≤700px) las estelas y hojas la oculta el CSS
      (la escena es pequeña y estorban), como se acordó.

   El visor de zoom NO usa esta capa: lleva la suya (.cr-zoom-atm, ver
   scripts/visor.js).

   Sin dependencias. Se carga en todas las páginas; si el DOM aún se está
   construyendo (cronograma.html carga sus scripts en mitad del cuerpo), se
   espera a DOMContentLoaded. */
(function () {
  'use strict';

  // Escenas de exterior: único caso en que las hojas vuelan SOBRE la escena
  var HOJAS_EN_ESCENA = /^(cruce|bodega|cancha|corredor)\.html$/;

  // Estelas + polvo (+ hojas opcional). Posiciones/tiempos: styles.css
  function capaTexto(conHojas) {
    var html =
      '<span class="atm-estela atm-e1"></span>' +
      '<span class="atm-estela atm-e2"></span>' +
      '<span class="atm-estela atm-e3"></span>';
    var i, h;
    for (i = 1; i <= 24; i++) {
      html += '<span class="atm-polvo atm-p' + i + '"></span>';
    }
    if (conHojas) {
      for (h = 1; h <= 10; h++) {
        html += '<span class="hoja hoja-' + h + '"></span>';
      }
    }
    return html;
  }

  function crearCapa(clase, conHojas) {
    var capa = document.createElement('div');
    capa.className = clase;
    capa.setAttribute('aria-hidden', 'true');
    capa.innerHTML = capaTexto(conHojas);
    return capa;
  }

  function inyectar() {
    var lienzo = document.querySelector('.cruce-lienzo');
    var hero = document.querySelector('.hero');
    if (!lienzo && !hero) return;

    var pagina = window.location.pathname.split('/').pop() || 'index.html';

    // 1) Fondo de la página (detrás del card y del menú fijo): completa y
    //    siempre que haya hero — en las salas también, para que móvil conserve
    //    estelas y hojas en ese fondo aunque la escena no las lleve.
    if (hero && !hero.querySelector('.fondo-atm')) {
      hero.insertBefore(crearCapa('fondo-atm', true), hero.firstElementChild);
    }

    // 2) Sobre la escena (sólo salas): polvo siempre, hojas sólo en exterior;
    //    estelas/hojas fuera en móvil lo decide el CSS (sólo escena pequeña)
    if (lienzo && !lienzo.querySelector('.fondo-atm-en-escena')) {
      lienzo.insertBefore(
        crearCapa('fondo-atm-en-escena', HOJAS_EN_ESCENA.test(pagina)),
        lienzo.querySelector('.cruce-puntos'));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inyectar);
  } else {
    inyectar();
  }
})();
