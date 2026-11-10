// scripts/nav-transition.js
// Transición de salida entre páginas (sitio estático multipágina).
//
// Al hacer clic en un enlace interno, difumina el CONTENIDO —tarjeta, escena,
// maqueta o listado del catálogo— con `is-leaving` (en la tarjeta y en <body>)
// y recién a los 220ms navega. El fondo de la página y el menú fijo se quedan
// visibles durante todo el cambio. Además marca sessionStorage "museo:carga"
// y monta el skeleton de salida (scripts/skeleton.js), que la página entrante
// replica en su primer frame para cubrir la carga real.
// La animación de entrada de la página siguiente la ejecuta styles.css
// (.card con `cardEntrance` y .cruce con `escenaEntrance`), de modo que ambos
// efectos se enlazan.
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

    var card = document.querySelector('.card');
    var header = document.querySelector('.site-header');
    if (!card && !header) return;

    var target = link.href;

    // Marca para la página entrante (scripts/skeleton.js la consume en
    // <head>): mostrará su skeleton mientras carga. Se pone en los DOS caminos
    // (el animado y el de movimiento reducido, que navega nativo abajo).
    try { window.sessionStorage.setItem('museo:carga', '1'); }
    catch (err) { /* sin storage: sin skeleton, todo lo demás igual */ }

    if (prefersReducedMotion()) return;

    e.preventDefault();
    navigating = true;
    if (card) card.classList.add('is-leaving');
    // El menú fijo NO se desvanece: se queda visible durante todo el cambio
    // (el fondo de la página tampoco). El fundido es sólo del contenido.
    // Fundido de página COMPLETO del contenido: las páginas de escena (que no
    // tienen .card, usan .cruce-card), la maqueta de recorrido/final y el
    // listado del catálogo se difuminan vía body.is-leaving en styles.css.
    document.body.classList.add('is-leaving');

    // Skeleton de salida con la forma del DESTINO: hace crossfade con el
    // contenido que se desvanece y su frame queda congelado mientras el
    // navegador carga la página siguiente —que pinta el suyo idéntico en el
    // primer frame (scripts/skeleton.js). Así el hueco no se nota.
    if (window.MuseoSkeleton) {
      window.MuseoSkeleton.mostrarDesdeHref(target);
    }

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
