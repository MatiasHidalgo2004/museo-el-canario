/* Visor de zoom de la ilustración (sólo móvil).
   En las salas del recorrido añade un botón [+] sobre la escena. Al pulsarlo,
   se abre un visor fijo con la versión SVG vectorial, recortada y optimizada,
   de la ilustración (assets/svg/zoom-<sala>.svg), casi a pantalla completa y
   centrada, de modo que se ve entera sin recortes y con nitidez al ampliar
   (los SVG re-rasterizan a la escala del zoom; si un SVG fallara, se cae al
   PNG equivalente de assets/images/). Todo lo demás (escena, texto, header,
   puntos) queda difuminado detrás por el CSS (backdrop-filter del overlay),
   con una capa de atmósfera encima (estelas de luz y polvo flotante) para
   que ese fondo no se vea estático. La imagen sólo usa will-change durante
   el gesto, para re-rasterizarse nítida al soltar (clase .is-zooming).
   Dentro del visor se puede pellizcar, doble-toque y arrastrar.
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

    // Nombre de la escena (cruce, bodega, ...): se deriva del src de la capa
    var mSrc = (capaInt.getAttribute('src') || '').match(/recorrido-(.+)-intermedio\.png/);
    var sala = mSrc ? mSrc[1] : '';

    // Ruta de la versión de zoom: SVG vectorial (más nítido al ampliar y más
    // ligero tras optimizar). Se puede forzar con data-zoom-src sobre la capa;
    // si no, se deriva del nombre de la escena.
    var fuenteZoom = capaInt.getAttribute('data-zoom-src');
    if (!fuenteZoom) {
      fuenteZoom = sala ? 'assets/svg/zoom-' + sala + '.svg' : '';
    }
    // Respaldo: si el SVG no cargara, se cae al PNG optimizado equivalente.
    var fuenteRespaldo = sala ? 'assets/images/zoom-' + sala + '.png' : '';
    var intentoRespaldo = false;

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

    // ----- Atmósfera del fondo: estelas de luz + polvo flotante -----
    // Sólo marcado: el movimiento vive en los keyframes de styles.css.
    // Va tras el [-] pero con z-index 0, así queda detrás de la imagen.
    var atm = document.createElement('div');
    atm.className = 'cr-zoom-atm';
    atm.setAttribute('aria-hidden', 'true');
    atm.innerHTML =
      '<span class="atm-estela atm-e1"></span>' +
      '<span class="atm-estela atm-e2"></span>' +
      '<span class="atm-estela atm-e3"></span>' +
      '<span class="atm-polvo atm-p1"></span>' +
      '<span class="atm-polvo atm-p2"></span>' +
      '<span class="atm-polvo atm-p3"></span>' +
      '<span class="atm-polvo atm-p4"></span>' +
      '<span class="atm-polvo atm-p5"></span>' +
      '<span class="atm-polvo atm-p6"></span>' +
      '<span class="atm-polvo atm-p7"></span>' +
      '<span class="atm-polvo atm-p8"></span>' +
      '<span class="atm-polvo atm-p9"></span>' +
      '<span class="atm-polvo atm-p10"></span>' +
      '<span class="atm-polvo atm-p11"></span>' +
      '<span class="atm-polvo atm-p12"></span>' +
      '<span class="atm-polvo atm-p13"></span>' +
      '<span class="atm-polvo atm-p14"></span>' +
      '<span class="atm-polvo atm-p15"></span>' +
      '<span class="atm-polvo atm-p16"></span>' +
      '<span class="atm-polvo atm-p17"></span>' +
      '<span class="atm-polvo atm-p18"></span>' +
      '<span class="atm-polvo atm-p19"></span>' +
      '<span class="atm-polvo atm-p20"></span>' +
      '<span class="atm-polvo atm-p21"></span>' +
      '<span class="atm-polvo atm-p22"></span>' +
      '<span class="atm-polvo atm-p23"></span>' +
      '<span class="atm-polvo atm-p24"></span>';
    visor.appendChild(atm);

    // Imagen del visor (SVG vectorial; si falla, PNG de respaldo)
    var imgZoom = document.createElement('img');
    imgZoom.className = 'cr-zoom-img';
    imgZoom.alt = capaInt.getAttribute('alt') || 'Ilustración ampliada';
    imgZoom.decoding = 'async';
    imgZoom.onerror = function () {
      // Un solo intento de respaldo, para no entrar en bucle si el PNG
      // tampoco existe.
      if (intentoRespaldo || !fuenteRespaldo) return;
      intentoRespaldo = true;
      imgZoom.setAttribute('src', fuenteRespaldo);
    };
    if (fuenteZoom) imgZoom.setAttribute('src', fuenteZoom);
    visor.appendChild(imgZoom);

    // Pista de doble-toque: sólo se muestra mientras el usuario no haya hecho
    // aún su primer doble-toque. En cuanto lo hace, queda marcada en
    // localStorage y no vuelve a aparecer en ninguna sala.
    var hint = document.createElement('div');
    hint.className = 'cr-zoom-hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.innerHTML =
      '<span class="badge"><span class="ring"></span><span class="dot"></span></span>' +
      '<span class="cap">Doble toque para zoom</span>';
    visor.appendChild(hint);

    // Clave con versión: un valor guardado por una versión anterior no debe
    // bloquear la pista
    var KEY_HINT = 'museo-canario:doble-toque-aprendido:v2';
    function yaAprendido() {
      try { return window.localStorage.getItem(KEY_HINT) === '1'; }
      catch (e) { return false; }        // sin storage: se vuelve a mostrar
    }
    function marcarAprendido() {
      try { window.localStorage.setItem(KEY_HINT, '1'); } catch (e) { /* noop */ }
    }

    document.body.appendChild(visor);

    // Geometría base de la imagen del visor (SIN transform) y del overlay,
    // leída al abrir para calcular anclajes de pellizco y límites.
    var ex = 0, ey = 0, iw = 0, ih = 0;      // rect de la imagen (sin transform)
    var iw0 = 0, ih0 = 0;                    // rect al AJUSTE (1 = fit, base
                                              // para el zoom absoluto y los
                                              // destinos de doble-toque)
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

    // enEscala es ABSOLUTO (1 = ajuste); el transform va contra el layout
    // actual, así que se convierte al formato de escala (ajuste/iw)
    function centrar(enEscala) {
      escala = enEscala * (iw0 / iw);
      tx = (sx + sw / 2) - ex - escala * (iw / 2);
      ty = (sy + sh / 2) - ey - escala * (ih / 2);
      aplicar();
    }

    // Mide la imagen al AJUSTE (layout sin transform) y la centra a la escala dada.
    function medirYCentrar(enEscala) {
      imgZoom.classList.remove('is-ready');
      imgZoom.style.width = '';              // caja auto: ajuste nativo (fit)
      imgZoom.style.transform = '';           // medir sin transform
      var r = imgZoom.getBoundingClientRect();
      ex = r.left; ey = r.top; iw = r.width; ih = r.height;
      var vr = visor.getBoundingClientRect();
      sx = vr.left; sy = vr.top; sw = vr.width; sh = vr.height;
      iw0 = iw; ih0 = ih;
      centrar(enEscala);
      imgZoom.classList.add('is-ready');
    }

    // Vuelca la escala actual al TAMAÑO DE LAYOUT (y deja sólo la traslación
    // en transform). WebKit rasteriza el <img> según su layout: así, al
    // terminar un gesto, se re-rasteriza a resolución final en vez de escalar
    // una textura vieja (el zoom se veía blando tras ampliar). Las fórmulas del
    // visor siguen intactas: iw pasa a ser el tamaño ya volcado y escala = 1.
    function fijar() {
      if (!iw0) return;
      var nivel = escala * (iw / iw0);           // zoom absoluto (1 = ajuste)
      var izq = ex + tx, arr = ey + ty;          // esquina visual actual
      imgZoom.style.transform = '';
      if (Math.abs(nivel - 1) < 0.0005) {
        imgZoom.style.width = '';                // ajuste: caja auto (fit)
      } else {
        imgZoom.style.width = (iw0 * nivel) + 'px';
      }
      imgZoom.style.height = 'auto';              // proporción intacta
      void imgZoom.offsetWidth;                   // reflow → re-medida
      var r = imgZoom.getBoundingClientRect();
      ex = r.left; ey = r.top; iw = r.width; ih = r.height;
      escala = 1;
      tx = izq - ex; ty = arr - ey;                // misma posición visual
      aplicar();
    }

    // Objetos flotantes del visor (fábrica scripts/objetos.js): se montan en
    // la primera apertura y sólo corren mientras el visor está abierto
    var objetos = null;

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

      // La pista de doble-toque sólo aparece en la sala del CRUCE (la primera
      // del recorrido) y sólo mientras el usuario no haya hecho su primer
      // doble-toque; en cuanto lo hace, no vuelve a aparecer (localStorage).
      hint.classList.toggle('is-on', sala === 'cruce' && !yaAprendido());

      // Objetos flotantes detrás de la imagen: montaje perezoso + reanudar
      if (!objetos && window.MuseoObjetos && window.escenaDatos) {
        objetos = window.MuseoObjetos.montar(visor, window.escenaDatos);
      }
      if (objetos) objetos.reanudar();

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
      hint.classList.remove('is-on');      // la pista no persiste tras cerrar
      if (objetos) objetos.pausar();       // los flotantes se quedan quietos

      imgZoom.classList.remove('is-ready');
      imgZoom.classList.remove('is-zooming');
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

      // will-change sólo mientras hay gesto: al soltar, la capa se libera y
      // el navegador re-rasteriza el SVG a resolución completa (con la
      // propiedad fija, la textura quedaba congelada a tamaño inicial y el
      // zoom se veía borroso). Ver .cr-zoom-img.is-zooming en styles.css.
      imgZoom.classList.add('is-zooming');

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
        if (!iw0) { e.preventDefault(); return; }   // sin imagen medida aún (carga muy rápida)
        var q = [].slice.call(punteros.values());
        var d = Math.hypot(q[1].x - q[0].x, q[1].y - q[0].y) || 1;
        var mx = (q[0].x + q[1].x) / 2, my = (q[0].y + q[1].y) / 2;
        // la escala es relativa al layout actual: se limita el ZOOM ABSOLUTO
        // (1 = ajuste, 4 = tope) con iw0/iw
        escala = Math.min(ESC_MAX * iw0 / iw,
                          Math.max(ESC_MIN * iw0 / iw, esc0 * (d / d0)));
        // ancla el punto inicial bajo el centro actual del pellizco
        tx = mx - ex - escala * lx0;
        ty = my - ey - escala * ly0;
        limitar(); aplicar();
      } else if (modo === 'pan' && idArrastre !== null) {
        var a = punteros.get(idArrastre);
        if (!a) return;
        var dx = a.x - ultX, dy = a.y - ultY;
        if (Math.abs(a.x - abajoX) > 10 || Math.abs(a.y - abajoY) > 10) movio = true;
        if (escala * iw / iw0 > ESC_MIN + 0.001) {   // sólo arrastra si hay zoom (absoluto)
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

      // todos los dedos levantados: fin del gesto → soltar la capa y VOLCAR
      // la escala al layout (la re-rasterización a resolución final es lo que
      // mantiene el SVG nítido tras ampliar; ver fijar())
      imgZoom.classList.remove('is-zooming');
      if (escala !== 1 || iw !== iw0) fijar();
      var eraDelArrastre = (idArrastre === t[0].identifier);
      idArrastre = null;
      modo = null;
      if (!eraDelArrastre) return;

      var rapido = (Date.now() - abajoT) < 300;
      if (movio || !rapido) return;

      // sin imagen medida aún (carga muy rápida): sin gestos sobre ella
      if (toqueEnImagen && !iw0) return;

      if (toqueEnImagen) {
        // doble-toque: alterna entre acercar (al punto) y volver al ajuste
        var cerca = (Date.now() - ultimoToqueT) < 300 &&
                    Math.hypot(t[0].clientX - ultimoToqueX, t[0].clientY - ultimoToqueY) < 30;
        if (cerca) {
          if (escala * iw / iw0 < 2) {            // zoom absoluto < 2
            var l = localBajo(t[0].clientX, t[0].clientY);
            escala = Math.min(ESC_MAX, ESC_DOBLE) * (iw0 / iw);  // ×2,6 del ajuste
            tx = t[0].clientX - ex - escala * l[0];
            ty = t[0].clientY - ey - escala * l[1];
            limitar(); aplicar();
          } else {
            centrar(ESC_MIN);                  // volver al ajuste centrado
          }
          fijar();                             // al layout, para el re-raster nítido
          // Primer doble-toque hecho EN EL CRUCE (donde se muestra la pista):
          // el gesto ya se entendió y la pista no vuelve a aparecer en ninguna
          // sala. Se marca sólo aquí para que un doble-toque en otras salas
          // (bodega, etc.), donde la pista nunca se ve, no la consuma a escondidas.
          if (sala === 'cruce') marcarAprendido();
          hint.classList.remove('is-on');
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
      if (punteros.size === 0) {
        modo = null; idArrastre = null;
        imgZoom.classList.remove('is-zooming');
        if (escala !== 1 || iw !== iw0) fijar();
      }
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
