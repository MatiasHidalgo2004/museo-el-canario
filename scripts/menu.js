// scripts/menu.js
// Menú móvil compartido por todas las páginas (fuente única de verdad).
//
// Antes cada HTML repetía este mismo bloque y contacto.html traía una copia
// desactualizada (sin cierre con Escape). Ahora todas las páginas solo hacen:
//     <script src="scripts/menu.js"></script>
//
// Responsabilidades:
//   1. Abrir/cerrar el desplegable (#floatingMenu) con #menuToggle.
//   2. Cerrar al tocar fuera, con Escape (devolviendo el foco al botón) y al
//      pasar a escritorio, donde el desplegable no existe.
//   3. Marcar con aria-current="page" el enlace de la sección activa, en el
//      menú principal y en el flotante (informa a los lectores de pantalla).

(function () {
  'use strict';

  // Ancho real de la barra de desplazamiento → --sbw en :root. Compensa el
  // cálculo del ancho del header (calc(100% - 48px + var(--sbw))) para que
  // el menú fijo mida lo mismo en páginas con y sin scroll, sin reservar
  // hueco con scrollbar-gutter (dejaba una franja verde en el borde derecho).
  //
  // Se mide con una sonda de width:100vw y no con innerWidth: las unidades vw
  // SÍ incluyen la barra, mientras que innerWidth la excluye en algunos
  // entornos y entonces la resta daba 0 (sin compensación).
  var ajustaScrollbar = function () {
    var sonda = document.createElement('div');
    sonda.style.cssText = 'position:absolute;left:-10000px;top:0;width:100vw;height:0';
    document.documentElement.appendChild(sonda);
    var vw = sonda.offsetWidth;
    document.documentElement.removeChild(sonda);
    var sbw = vw - (document.documentElement.clientWidth || 0);
    document.documentElement.style.setProperty('--sbw', (sbw > 0 ? sbw : 0) + 'px');
  };
  ajustaScrollbar();
  window.addEventListener('resize', ajustaScrollbar);
  if ('ResizeObserver' in window) {
    // la barra puede aparecer al terminar de cargar imágenes, sin resize real
    new ResizeObserver(ajustaScrollbar).observe(document.documentElement);
  }

  var toggle = document.getElementById('menuToggle');
  var menu = document.getElementById('floatingMenu');
  if (!toggle || !menu) return;

  function isOpen() {
    return menu.classList.contains('open');
  }

  function setOpen(open) {
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }

  // 1. Botón hamburguesa. El manejador de clic global no necesita
  //    stopPropagation: comprueba si el clic fue dentro del menú o del botón.
  toggle.addEventListener('click', function () {
    setOpen(!isOpen());
  });

  // 2. Clic fuera (solo importa en móvil; en escritorio el menú está oculto)
  document.addEventListener('click', function (e) {
    if (!isOpen()) return;
    if (!window.matchMedia('(max-width:1100px)').matches) return;
    if (menu.contains(e.target) || toggle.contains(e.target)) return;
    setOpen(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !isOpen()) return;
    setOpen(false);
    toggle.focus(); // devuelve el foco a quien abrió el menú
  });

  // Si la ventana pasa a escritorio el desplegable se cierra, para que no
  // reaparezca abierto al volver a una ventana angosta.
  var desktop = window.matchMedia('(min-width:1101px)');
  var onViewportChange = function (e) {
    if (e.matches) setOpen(false);
  };
  if (typeof desktop.addEventListener === 'function') desktop.addEventListener('change', onViewportChange);
  else if (typeof desktop.addListener === 'function') desktop.addListener(onViewportChange);

  // 3. Enlace de la sección activa en ambos menús
  var here = window.location.pathname.split('/').pop() || 'index.html';
  var links = document.querySelectorAll('.nav-link, .floating-nav a');
  for (var i = 0; i < links.length; i++) {
    var href = links[i].getAttribute('href');
    if (href && href.split('#')[0] === here) {
      links[i].setAttribute('aria-current', 'page');
    }
  }

  // 4. Presencia extra del header al desplazar la página: sombra más marcada
  //    y vidrio más denso. Aquí sólo se alterna la clase; el resto es CSS
  //    (.site-header.is-scrolled en styles.css).
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', (window.scrollY || window.pageYOffset || 0) > 12);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

})();
