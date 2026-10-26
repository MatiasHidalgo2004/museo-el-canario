/* Visor de zoom de la ilustración (sólo móvil).
   En las salas del recorrido añade un botón [+] sobre la escena. Al pulsarlo,
   se abre un visor fijo con una VERSIÓN OPTIMIZADA y recortada al contenido
   de la ilustración (assets/images/zoom-<sala>.png), casi a pantalla completa
   y centrada, de modo que se ve entera sin recortes. Todo lo demás (escena,
   texto, header, puntos) queda difuminado detrás por el CSS (backdrop-filter
   del overlay). Dentro del visor se puede pellizcar, doble-toque y arrastrar.
   Se cierra con [-], Escape o tocando el fondo difuminado.
   La capa de la escena NO se mueve: el visor usa su propio <img>. Sin dependencias. */
(function () {
  'use strict';

  var esMovil = window.matchMedia('(max-width: 700px)');
  if (!esMovil.matches) return;          // escritorio: nada que hacer

  var lienzos = [].slice.call(document.querySelectorAll('.cruce-lienzo'));
  if (!lienzos.length) return;

  // ESC_ABRIR = 1 (ajuste): la ilustración recortada se ve ENTERA, sin recorte.
  // Doble-toque sube a 2.6; un segundo doble-toque vuelve al ajuste; tope 4x.
  var ESC_MIN = 1;
  var ESC_ABRIR = 1;
  var ESC_DOBLE = 2.6;
  var ESC_MAX = 4;

  lienzos.forEach(function (lienzo) {
    var capaInt = lienzo.querySelector('.cr-capa-int');
    if (!capaInt) return;

    // Ruta de la versión optimizada. Se puede forzar con data-zoom-src sobre
    // la capa; si no, se deriva del src (recorrido-<sala>-intermedio.png).
    var fuenteZoom = capaInt.getAttribute('data-zoom-src');
    if (!fuenteZoom) {
      var m = (capaInt.getAttribute('src') || '').match(/recorrido-(.+)-intermedio\.png/);
      fuenteZoom = m ? 'assets/images/zoom-' + m[1] + '.png' : '';
    }

    // ----- Botón [+] inyectado en la escena (esquina superior izquierda) -----
    var btnAbrir = document.createElement('button');
    btnAbrir.type = 'button';
    btnAbrir.className = 'cr-zoom-btn';
    btnAbrir.textContent = '[+]';
    btnAbrir.setAttribute('aria-label', 'Ampliar la ilustración');
    btnAbrir.setAttribute('aria-expanded', 'false');
    lienzo.appendChild(btnAbrir);

    // ----- Visor (overlay) -----
    var visor = document.createElement('div');
    visor.className = 'cr-zoom';
    visor.setAttribute('role', 'dialog');
    visor.setAttribute('aria-modal', 'true');
    visor.setAttribute('aria-label', 'Ilustración ampliada');
    visor.setAttribute('aria-hidden', 'true');

    var btnCerrar = document.createElement('button');
    btnCerrar.type = 'button';
    btnCerrar.className = 'cr-zoom-close';
    btnCerrar.textContent = '[-]';
    btnCerrar.setAttribute('aria-label', 'Reducir la ilustración');
    visor.appendChild(btnCerrar);

    // Imagen del visor (versión optimizada, recortada al contenido)
    var imgZoom = document.createElement('img');
    imgZoom.className = 'cr-zoom-img';
    imgZoom.alt = capaInt.getAttribute('alt') || 'Ilustración ampliada';
    imgZoom.decoding = 'async';
    if (fuenteZoom) imgZoom.setAttribute('src', fuenteZoom);
    visor.appendChild(imgZoom);

    document.body.appendChild(visor);

    // Geometría base de la imagen del visor (SIN transform) y del overlay,
    // leída al abrir para calcular anclajes de pellizco y límites.
    var ex = 0, ey = 0, iw = 0, ih = 0;      // rect de la imagen (sin transform)
    var sx = 0, sy = 0, sw = 0, sh = 0;      // rect del visor (= viewport)
    var escala = ESC_ABRIR, tx = 0, ty = 0;

    var punteros = new Map();                // identifier -> {x, y}
    var modo = null;                         // 'pan' | 'pinch' | null
    // pellizco
    var d0 = 0, esc0 = 1, lx0 = 0, ly0 = 0;
    // arrastre
    var ultX = 0, ultY = 0;
    // toque / doble-toque
    var abajoX = 0, abajoY = 0, abajoT = 0, movio = false;
    var ultimoToqueT = 0, ultimoToqueX = 0, ultimoToqueY = 0;

    // Punto de la imagen (coords locales 0..iw / 0..ih) bajo un punto de pantalla
    function localBajo(vx, vy) {
      return [(vx - ex - tx) / escala, (vy - ey - ty) / escala];
    }

    function aplicar() {
      imgZoom.style.transform =
        'translate(' + tx + 'px,' + ty + 'px) scale(' + escala + ')';
    }

    // Mantiene siempre el centro del visor sobre la imagen: imposible "perderla".
    function limitar() {
      var cX = sx + sw / 2, cY = sy + sh / 2;
      var maxX = cX - ex;
      var minX = cX - ex - escala * iw;
      var maxY = cY - ey;
      var minY = cY - ey - escala * ih;
      tx = Math.min(maxX, Math.max(minX, tx));
      ty = Math.min(maxY, Math.max(minY, ty));
    }

    function centrar(enEscala) {
      escala = enEscala;
      tx = (sx + sw / 2) - ex - escala * (iw / 2);
      ty = (sy + sh / 2) - ey - escala * (ih / 2);
      aplicar();
    }

    // Mide la imagen ya cargada y la centra a la escala dada.
    function medirYCentrar(enEscala) {
      imgZoom.classList.remove('is-ready');
      imgZoom.style.transform = '';           // medir sin transform
      var r = imgZoom.getBoundingClientRect();
      ex = r.left; ey = r.top; iw = r.width; ih = r.height;
      var vr = visor.getBoundingClientRect();
      sx = vr.left; sy = vr.top; sw = vr.width; sh = vr.height;
      centrar(enEscala);
      imgZoom.classList.add('is-ready');
    }

    function abrir() {
      // Cerrar cualquier ficha (.cr-det) abierta, para que no tape la escena
      var det = lienzo.querySelector('.cr-det');
      if (det && !det.hidden) {
        var x = lienzo.querySelector('.cr-x');
        if (x) x.click();
      }

      lienzo.classList.add('zoom-activo');
      visor.classList.add('is-open');
      visor.setAttribute('aria-hidden', 'false');
      btnAbrir.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';   // sin scroll de fondo
      btnCerrar.focus();

      if (!fuenteZoom) return;               // sin versión optimizada: no hacer nada
      // Medir y centrar cuando la imagen tenga tamaño (cargada o de caché)
      if (imgZoom.complete && imgZoom.naturalWidth) {
        medirYCentrar(ESC_ABRIR);
      } else {
        imgZoom.onload = function () { if (abierto()) medirYCentrar(ESC_ABRIR); };
      }
    }

    function cerrar() {
      visor.classList.remove('is-open');
      visor.setAttribute('aria-hidden', 'true');
      btnAbrir.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      punteros.clear();
      modo = null;
      idArrastre = null;

      imgZoom.classList.remove('is-ready');
      imgZoom.style.transform = '';
      escala = ESC_ABRIR; tx = 0; ty = 0;
      lienzo.classList.remove('zoom-activo');
      btnAbrir.focus();
    }

    function abierto() { return visor.classList.contains('is-open'); }

    // ----- Gestos (eventos táctiles: los fiables en móvil) -----
    // En móvil, los eventos pointer son interceptados por el navegador para su
    // propio zoom/scroll y disparan pointercancel, reiniciando el gesto. Con
    // touchstart/touchmove/touchend + touch-action:none (CSS) el control es
    // total. Cada dedo se sigue por identifier.
    var idArrastre = null;         // identifier del dedo que arrastra
    var toqueEnImagen = false;     // ¿el toque de un dedo empezó sobre la imagen?

    function onTouchStart(e) {
      if (e.target === btnCerrar) return;   // dejar que el botón genere su click
      e.preventDefault();                   // bloquear zoom/scroll nativo

      var t = e.changedTouches;
      for (var i = 0; i < t.length; i++) {
        punteros.set(t[i].identifier, { x: t[i].clientX, y: t[i].clientY });
      }

      if (punteros.size === 1) {
        modo = 'pan';
        var s = t[0];
        idArrastre = s.identifier;
        toqueEnImagen = (e.target === imgZoom);
        ultX = s.clientX; ultY = s.clientY;
        abajoX = s.clientX; abajoY = s.clientY; abajoT = Date.now();
        movio = false;
      } else if (punteros.size >= 2) {
        modo = 'pinch';
        var p = [].slice.call(punteros.values());
        d0 = Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y) || 1;
        var mx0 = (p[0].x + p[1].x) / 2, my0 = (p[0].y + p[1].y) / 2;
        esc0 = escala;
        var l = localBajo(mx0, my0);
        lx0 = l[0]; ly0 = l[1];
      }
    }

    function onTouchMove(e) {
      var t = e.changedTouches;
      for (var i = 0; i < t.length; i++) {
        var p = punteros.get(t[i].identifier);
        if (p) { p.x = t[i].clientX; p.y = t[i].clientY; }
      }

      if (modo === 'pinch' && punteros.size >= 2) {
        var q = [].slice.call(punteros.values());
        var d = Math.hypot(q[1].x - q[0].x, q[1].y - q[0].y) || 1;
        var mx = (q[0].x + q[1].x) / 2, my = (q[0].y + q[1].y) / 2;
        escala = Math.min(ESC_MAX, Math.max(ESC_MIN, esc0 * (d / d0)));
        // ancla el punto inicial bajo el centro actual del pellizco
        tx = mx - ex - escala * lx0;
        ty = my - ey - escala * ly0;
        limitar(); aplicar();
      } else if (modo === 'pan' && idArrastre !== null) {
        var a = punteros.get(idArrastre);
        if (!a) return;
        var dx = a.x - ultX, dy = a.y - ultY;
        if (Math.abs(a.x - abajoX) > 10 || Math.abs(a.y - abajoY) > 10) movio = true;
        if (escala > ESC_MIN + 0.001) {       // sólo arrastra si hay zoom
          tx += dx; ty += dy;
          limitar(); aplicar();
        }
        ultX = a.x; ultY = a.y;
      }
      if (modo) e.preventDefault();
    }

    function onTouchEnd(e) {
      var t = e.changedTouches;
      for (var i = 0; i < t.length; i++) {
        punteros.delete(t[i].identifier);
      }

      if (modo === 'pinch' && punteros.size === 1) {
        // queda un dedo: sigue como arrastre desde su posición actual
        modo = 'pan';
        var resto = punteros.entries().next().value;   // [identifier, {x,y}]
        idArrastre = resto[0];
        ultX = resto[1].x; ultY = resto[1].y;
        abajoX = resto[1].x; abajoY = resto[1].y; abajoT = Date.now();
        movio = false;
        return;
      }
      if (punteros.size > 0) return;

      // todos los dedos levantados
      var eraDelArrastre = (idArrastre === t[0].identifier);
      idArrastre = null;
      modo = null;
      if (!eraDelArrastre) return;

      var rapido = (Date.now() - abajoT) < 300;
      if (movio || !rapido) return;

      if (toqueEnImagen) {
        // doble-toque: alterna entre acercar (al punto) y volver al ajuste
        var cerca = (Date.now() - ultimoToqueT) < 300 &&
                    Math.hypot(t[0].clientX - ultimoToqueX, t[0].clientY - ultimoToqueY) < 30;
        if (cerca) {
          if (escala < 2) {
            var l = localBajo(t[0].clientX, t[0].clientY);
            escala = Math.min(ESC_MAX, ESC_DOBLE);
            tx = t[0].clientX - ex - escala * l[0];
            ty = t[0].clientY - ey - escala * l[1];
            limitar(); aplicar();
          } else {
            centrar(ESC_MIN);                  // volver al ajuste centrado
          }
          ultimoToqueT = 0;
          return;
        }
        ultimoToqueT = Date.now();
        ultimoToqueX = t[0].clientX; ultimoToqueY = t[0].clientY;
      } else {
        cerrar();                                   // toque en el fondo difuminado
      }
    }

    function onTouchCancel(e) {
      var t = e.changedTouches;
      for (var i = 0; i < t.length; i++) punteros.delete(t[i].identifier);
      if (punteros.size === 0) { modo = null; idArrastre = null; }
    }

    btnAbrir.addEventListener('click', abrir);
    btnCerrar.addEventListener('click', cerrar);
    visor.addEventListener('touchstart', onTouchStart, { passive: false });
    visor.addEventListener('touchmove', onTouchMove, { passive: false });
    visor.addEventListener('touchend', onTouchEnd);
    visor.addEventListener('touchcancel', onTouchCancel);

    // Guardia global de gestos: el viewport no desactiva el zoom del usuario,
    // y en varios navegadores móviles el touch-action:none del elemento no
    // basta para DOS dedos: el navegador se queda con el pinch-zoom nativo y
    // dispara touchcancel, matando el pellizco. Impedir el default de
    // touchmove a nivel de documento (sólo con el visor abierto) garantiza
    // que el pellizco llegue entero a nuestro handler. Con el visor cerrado
    // no hace nada, así el scroll de la página sigue normal.
    function guardGestos(e) { if (abierto()) e.preventDefault(); }
    document.addEventListener('touchmove', guardGestos, { passive: false });
    // iOS Safari: su pellizco de dos dedos usa eventos propios (gesture*) que
    // no siempre los cubre touch-action. Bloquearlos con el visor abierto.
    document.addEventListener('gesturestart', guardGestos, { passive: false });
    document.addEventListener('gesturechange', guardGestos, { passive: false });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && abierto()) cerrar();
    });

    // Si la pantalla crece a escritorio con el visor abierto, se cierra.
    var mqDesk = window.matchMedia('(min-width: 701px)');
    var alCambiar = function () { if (mqDesk.matches && abierto()) cerrar(); };
    if (mqDesk.addEventListener) mqDesk.addEventListener('change', alCambiar);
    else if (mqDesk.addListener) mqDesk.addListener(alCambiar);
  });
})();
