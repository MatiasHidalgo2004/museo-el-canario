// scripts/nav-transition.js
// Transición de salida entre páginas (sitio estático multipágina).
//
// Al hacer clic en un enlace interno, añade la clase `is-leaving` a la tarjeta
// y al header para que se desvanezcan (220ms) y recién entonces navega.
// La animación de entrada de la página siguiente la ejecuta styles.css
// (.card con `cardEntrance`), de modo que ambos efectos se enlazan.
//
// Respeta prefers-reduced-motion (navega sin animación) y limpia el estado
// al restaurar desde la caché del navegador (botón Atrás).

(function () {
  'use strict';

  var EXIT_MS = 220;
  var navigating = false;

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  // Enlace interno a otra página: relativo (p.ej. "imagenes.html"), sin esquema.
  // Excluye anclas (#...), externos y protocolos como tel:, mailto:, https:.
  function isInternalPageLink(el) {
    if (!el || el.tagName !== 'A') return false;
    if (el.target && el.target !== '_self') return false;
    var href = el.getAttribute('href');
    if (!href || href.charAt(0) === '#') return false;
    if (href.indexOf('//') === 0) return false;              // protocolo-relativo
    if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return false;     // con esquema (http, tel, mailto...)
    return true;
  }

  function pointsToCurrentPage(el) {
    return el.href.split('#')[0] === window.location.href.split('#')[0];
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // abrir en otra pestaña
    if (navigating) return;

    var link = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!isInternalPageLink(link)) return;
    if (pointsToCurrentPage(link)) return;
    if (prefersReducedMotion()) return;

    var card = document.querySelector('.card');
    var header = document.querySelector('.site-header');
    if (!card && !header) return;

    e.preventDefault();
    navigating = true;
    if (card) card.classList.add('is-leaving');
    if (header) header.classList.add('is-leaving');

    var target = link.href;
    window.setTimeout(function () {
      window.location.href = target;
    }, EXIT_MS);
  });

  // Botón Atrás / adelante (bfcache): la página se restaura con el estado
  // guardado; hay que quitar `is-leaving` para que la tarjeta no quede oculta.
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    navigating = false;
    var leaving = document.querySelectorAll('.is-leaving');
    for (var i = 0; i < leaving.length; i++) {
      leaving[i].classList.remove('is-leaving');
    }
  });
})();
