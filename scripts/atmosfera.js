/* Atmósfera ambiental de FONDO en todas las páginas (estelas de luz +
   polvo flotante). El marcado y las animaciones viven en styles.css (clases
   .fondo-atm y .atm-*); aquí sólo se inyecta la capa en el punto correcto:

   - Páginas de escena (salas del recorrido, con .cruce-lienzo): la capa se
     coloca dentro del lienzo y por delante de .cruce-puntos (.fondo-atm-
     en-escena, z-index 0), de modo que el polvo flota SOBRE la ilustración
     de la sala y por debajo de puntos, fichas y botones.
   - El resto: primer hijo de <main class="hero"> (.fondo-atm, z-index -1),
     por encima de la imagen de fondo de la página y por debajo de todo el
     contenido. El hero queda como contexto de apilamiento aislado en CSS
     (isolation:isolate), sin lo cual la capa quedaría oculta tras el fondo.

   Sin dependencias. Se carga en todas las páginas junto a menu.js; como el
   script puede ejecutarse mientras el DOM aún se construye (cronograma.html
   carga menu.js en mitad del cuerpo), se espera a DOMContentLoaded cuando
   hace falta. */
(function () {
  'use strict';

  function inyectar() {
    if (document.querySelector('.fondo-atm')) return;   // no duplicar

    var lienzo = document.querySelector('.cruce-lienzo');
    var hero = document.querySelector('.hero');
    if (!lienzo && !hero) return;                      // sin dónde: no hacer nada

    var capa = document.createElement('div');
    capa.className = 'fondo-atm' + (lienzo ? ' fondo-atm-en-escena' : '');
    capa.setAttribute('aria-hidden', 'true');

    // 3 estelas + 24 motas de polvo. Posiciones, tamaños y keyframes: styles.css
    var marcado =
      '<span class="atm-estela atm-e1"></span>' +
      '<span class="atm-estela atm-e2"></span>' +
      '<span class="atm-estela atm-e3"></span>';
    for (var i = 1; i <= 24; i++) {
      marcado += '<span class="atm-polvo atm-p' + i + '"></span>';
    }
    capa.innerHTML = marcado;

    if (lienzo) {
      // Antes de .cruce-puntos (si no existiera, al final: mismos z-index)
      lienzo.insertBefore(capa, lienzo.querySelector('.cruce-puntos'));
    } else {
      hero.insertBefore(capa, hero.firstElementChild);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inyectar);
  } else {
    inyectar();
  }
})();
