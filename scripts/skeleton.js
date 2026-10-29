/* scripts/skeleton.js
   Skeleton de carga ENTRE PÁGINAS (sitio estático multipágina).

   Al navegar con un enlace interno, nav-transition.js:
     1. Marca sessionStorage "museo:carga" y monta el skeleton de SALIDA con
        la forma del DESTINO (MuseoSkeleton.mostrarDesdeHref), haciendo
        crossfade con el contenido que se desvanece (220ms).
     2. Navega: el navegador conserva ese último frame pintado mientras carga
        la página siguiente.
   Esta página, al cargar en <head> (síncrono, tras styles.css), consume la
   marca y pinta SU skeleton en el primer frame —misma forma, calculada por
   nombre de archivo—, de modo que el hueco queda cubierto sin parpadeo.
   Se retira en window.load (tope de 3,5s) añadiendo html.listo, que a su vez
   lanza cardEntrance/escenaEntrance (pausadas mientras el skeleton está,
   ver styles.css).

   El marcado CALZA con la geometría del contenido real: la caja de cada tipo
   (.card / .cruce / .cat-wrap) vive en styles.css → sección "Skeleton", el
   interior de la tarjeta reutiliza las clases reales (.card-inner/.card-copy/
   .card-media, y .invertir-tarjeta para el orden texto-imagen de index,
   biografía, contacto e imágenes), y estos mapas aportan lo que sólo se sabe
   por página:
     - TARJETA: proporción de SU imagen de tarjeta (medida del fichero; en
       escritorio esa caja expande el card vertical), si la tarjeta está
       invertida y si lleva el tl-area del cronograma.
     - ESCENA: si la tarjeta blanca está al otro lado (comedor/corredor/
       dormitorio la llevan a la derecha).
   El ancho especial de recorrido/final (44% izquierdo en escritorio) se
   replica en styles.css por el atributo data-pagina del skeleton, que lleva
   el nombre del destino — así el skeleton de salida, montado desde otra
   página, también calza.

   Carga directa (sin marca): no se crea nada, la página se ve exactamente
   como antes. Respeta prefers-reduced-motion vía CSS (sin haz, sin fundidos).
   Sin dependencias. */
(function () {
  'use strict';

  var KEY = 'museo:carga';
  var MAX_MS = 3500;          // tope de seguridad: nunca dejarlo pegado
  var SALE_MS = 320;          // fundido de salida (260ms en CSS + margen)
  var sk = null;
  var timer = null;
  var ocultando = false;

  // ----- Nombre de página desde un href/URL (fuente única de verdad) -----
  function nombreDe(href) {
    return String(href || '').split('/').pop().split('#')[0].split('?')[0];
  }

  // ----- Tipo de skeleton por página (decide la caja): escena = .cruce,
  // grid = .cat-wrap, tarjeta = .card -----
  function tipoDeArchivo(nombre) {
    if (/^(cruce|bodega|cancha|comedor|corredor|dormitorio|local)\.html$/.test(nombre || '')) return 'escena';
    if (nombre === 'catalogo.html') return 'grid';
    return 'tarjeta';         // index, biografía, contacto, cronograma,
                              // imágenes, recorrido, final, ...
  }

  // ----- Datos de la tarjeta por página -----
  // ar:  proporción (ancho/alto) de la imagen de SU card-media, medida del
  //      fichero real: la figura con aspect-ratio es la que tira de la altura
  //      del card en escritorio. Sin entrada (recorrido, final, fallback):
  //      la tarjeta es sólo texto, sin figura.
  // inv: la tarjeta se "da vuelta" con la imagen (clase .invertir-tarjeta:
  //      en móvil texto arriba, imagen abajo) — index, biografía, contacto
  //      e imágenes.
  // tl:  la página lleva el área de la línea del tiempo (cronograma), cuyo
  //      .tl-stage (min-height 430px) expande el card; la cabecera va en
  //      fila como .card-copy.tl-top.
  var TARJETA = {
    'index.html':      { ar: '564 / 706', inv: true },
    'biografia.html':  { ar: '1119 / 1400', inv: true },
    'contacto.html':   { ar: '1120 / 1400', inv: true },
    'imagenes.html':   { ar: '1400 / 1400', inv: true },
    'cronograma.html': { tl: true }
  };

  // ----- Escenas con la tarjeta blanca al OTRO lado (.cruce-card con
  // right:0 en esas páginas; el resto la llevan a la izquierda) -----
  var ESCENA = { 'comedor.html': 1, 'corredor.html': 1, 'dormitorio.html': 1 };

  // ----- Marcado: idéntico a la salida y a la entrada (por eso el salto no
  // parpadea) y con las clases reales donde hacen falta para calzar. OJO: el
  // panel NUNCA lleva la clase .card (nav-transition.js la busca con
  // querySelector y el skeleton va antes que <body> en el árbol). Sólo
  // marcado: los estilos y el haz viven en styles.css -----
  function b(extra) {
    return '<span class="sk-b ' + extra + '"></span>';
  }
  function lineas(n, cortaAlUltimo) {
    var html = '';
    for (var i = 0; i < n; i++) {
      html += b(cortaAlUltimo && i === n - 1 ? 'sk-linea sk-corta' : 'sk-linea');
    }
    return html;
  }
  function ficha() {
    return '<div class="sk-ficha">' +
             '<span class="sk-ficha-icono"></span>' +
             '<span class="sk-ficha-lineas"><i></i><i></i></span>' +
           '</div>';
  }

  function marcar(tipo, nombre) {
    var dentro = '';
    var clasesPanel = '';      // clases extra sobre .sk-panel (página destino)
    var i;

    if (tipo === 'escena' && ESCENA[nombre]) clasesPanel = ' sk-der';
    if (tipo === 'tarjeta' && (TARJETA[nombre] || {}).inv) {
      clasesPanel = ' invertir-tarjeta';
    }

    if (tipo === 'grid') {
      // = .cat-wrap: tarjeta de entrada (.card) + tres categorías
      // (.cat-escena) con su título con filete y sus fichas de cristal
      dentro =
        '<div class="sk-intro"><div class="card-copy">' +
          b('sk-titulo') + lineas(2, true) + b('sk-boton') +
        '</div></div>';
      for (i = 0; i < 3; i++) {
        dentro +=
          '<div class="sk-grupo">' +
            '<div class="sk-cat"><span class="sk-b sk-cat-barra"></span></div>' +
            '<div class="sk-lista">' + ficha() + ficha() + ficha() + '</div>' +
          '</div>';
      }
    } else if (tipo === 'escena') {
      // = .cruce: placeholder de la ilustración (fill) + tarjeta blanca
      // (.cruce-card; a la derecha en las marcadas con sk-der) con su
      // título, líneas y acciones. En móvil el fill se sustituye por la
      // escena enmarcada y la tarjeta se "pliega" (display:contents), igual
      // que en la página real
      dentro =
        '<div class="sk-escena-fill"></div>' +
        '<div class="sk-escena-card">' +
          b('sk-titulo') + lineas(3, true) +
          '<div class="sk-escena-acciones">' +
            '<span class="sk-b sk-volver"></span>' +
            '<span class="sk-b sk-paso"></span>' +
          '</div>' +
        '</div>' +
        '<div class="sk-escena-lienzo"></div>';
    } else {
      // tarjeta: caja .card con las clases reales (columna de texto + imagen
      // con su pie de foto +, en cronograma, el tl-area). La figura existe
      // SÓLO si la página real tiene imagen, con su proporción real en línea
      var d = TARJETA[nombre] || {};
      var media = d.ar
        ? '<figure class="card-media">' +
            '<span class="sk-foto" style="aspect-ratio:' + d.ar + '"></span>' +
            '<span class="sk-pie"><i></i><i></i></span>' +
          '</figure>'
        : '';
      var tl = d.tl
        ? '<div class="sk-tl">' +
            '<span class="sk-b sk-tl-crumb"></span>' +
            '<div class="sk-tl-stage"></div>' +
          '</div>'
        : '';
      // cronograma: cabecera como .card-copy.tl-top (texto + botón en fila
      // en escritorio, apilados en móvil); el resto, tarjeta normal
      var copia = d.tl
        ? '<div class="card-copy sk-tl-top">' +
            '<span class="sk-tl-texto">' + b('sk-titulo') + lineas(2, true) + '</span>' +
            b('sk-boton') +
          '</div>'
        : '<div class="card-copy">' +
            b('sk-titulo') + lineas(5, true) + b('sk-boton') +
          '</div>';
      dentro =
        '<div class="card-inner">' + copia + media + tl + '</div>';
    }

    return '<div class="sk-carga" data-tipo="' + tipo + '" data-pagina="' + nombre + '" aria-hidden="true">' +
           '<div class="sk-panel' + clasesPanel + '">' + dentro + '</div></div>';
  }

  function crear(nombre) {
    if (sk) return sk;                 // no duplicar
    var tmp = document.createElement('div');
    tmp.innerHTML = marcar(tipoDeArchivo(nombre), nombre);
    sk = tmp.firstChild;
    document.documentElement.appendChild(sk);
    document.documentElement.classList.add('con-skeleton');
    timer = window.setTimeout(ocultar, MAX_MS);
    return sk;
  }

  function ocultar() {
    if (!sk || ocultando) return;
    ocultando = true;
    if (timer) { window.clearTimeout(timer); timer = null; }
    // .listo lanza las animaciones de entrada; .se-va funde el skeleton
    // encima, revelando esa entrada ya en marcha.
    document.documentElement.classList.add('listo');
    sk.classList.add('se-va');
    window.setTimeout(function () {
      if (sk && sk.parentNode) sk.parentNode.removeChild(sk);
      sk = null;
      document.documentElement.classList.remove('con-skeleton');
    }, SALE_MS);
  }

  // ----- API para la página saliente (nav-transition.js): muestra el
  // skeleton del DESTINO a partir de su href -----
  window.MuseoSkeleton = {
    mostrarDesdeHref: function (href) { return crear(nombreDe(href)); }
  };

  // ----- Página entrante: sólo si vienen de un enlace interno -----
  var vieneDeEnlace = false;
  try {
    vieneDeEnlace = window.sessionStorage.getItem(KEY) === '1';
    window.sessionStorage.removeItem(KEY);   // se consume: un solo uso
  } catch (e) { /* sin storage: sin skeleton */ }

  if (vieneDeEnlace) {
    crear(nombreDe(window.location.href));
    if (document.readyState === 'complete') ocultar();
    else window.addEventListener('load', ocultar);
    // bfcache (botón Atrás): si se restaura con el skeleton, fuera al instante
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) ocultar();
    });
  }
})();
