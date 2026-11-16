/* scripts/objetos.js
   Objetos flotantes del VISOR DE ZOOM (las 7 salas; sólo en móvil, porque el
   visor es móvil). Fábrica: window.MuseoObjetos.montar(contenedor, datos),
   usada por scripts/visor.js: los monta en la primera apertura del visor,
   DENTRO del overlay y DETRÁS de la imagen ampliada, junto a las
   partículas y las estelas de la atmósfera del zoom, y se pausan al cerrar.

   Elige 4-5 de los 10 objetos de la estancia (los mismos de los puntos y del
   catálogo), en BLANCO, un poco grandes (44-58px) y GIRANDO suavemente sobre
   sí mismos (22-44s por vuelta); derivan MUY despacio (2-6 px/s) y rebotan en
   los bordes. Entre sí se atraviesan: sin interacción de ningún tipo.

   SIN interactividad (pointer-events: none en CSS): son decoración. Al
   tocarlos el visor recibe el toque como cualquier punto del fondo y se
   cierra, igual que el resto del área fuera de la imagen.

   Con prefers-reduced-motion los objetos quedan colocados pero quietos
   (sin bucle ni giro). Requiere window.escenaDatos (lo expone cada página
   junto a su array [{ svg, titulo }]). Sin dependencias. */
(function () {
  'use strict';

  function montar(contenedor, datos) {
    if (!contenedor || !datos || !datos.length) return null;

    var reduce = !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    // ----- Selección aleatoria: 4 o 5 de los diez (Fisher-Yates) -----
    var pool = datos.slice();
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    var elegidos = pool.slice(0, 4 + Math.floor(Math.random() * 2));

    // ----- Capa: detrás de la imagen del visor, sin toma de eventos -----
    var capa = document.createElement('div');
    capa.className = 'cruce-objetos';
    capa.setAttribute('aria-hidden', 'true');
    contenedor.appendChild(capa);

    // ----- Objetos: un poco grandes, tamaño ligeramente variable y giro
    // suave sobre sí mismos (duración y retardo por objeto, en inline) -----
    var objs = [];
    elegidos.forEach(function (o, idx) {
      var el = document.createElement('span');
      el.className = 'obj-flot';
      var lado = 44 + Math.round(Math.random() * 14);   // 44-58px
      el.style.width = lado + 'px';
      el.style.height = lado + 'px';
      var img = document.createElement('img');
      img.src = o.svg;
      img.alt = '';
      img.decoding = 'async';
      img.style.animationDuration = (22 + Math.random() * 22).toFixed(1) + 's';
      img.style.animationDelay = (-Math.random() * 40).toFixed(1) + 's';
      el.appendChild(img);
      el.style.setProperty('--o', (0.5 + Math.random() * 0.28).toFixed(2));
      el.style.transitionDelay = (idx * 140 + Math.random() * 200).toFixed(0) + 'ms';
      capa.appendChild(el);
      objs.push({ el: el, x: 0, y: 0, vx: 0, vy: 0, r: lado / 2 });
    });

    function pintar(o) {
      // el transform resta el radio: trabajamos con el centro y el 0,0 del
      // CSS es la esquina del span
      o.el.style.transform =
        'translate3d(' + (o.x - o.r).toFixed(1) + 'px,' + (o.y - o.r).toFixed(1) + 'px,0)';
    }

    // ----- Siembras: posiciones y derivas iniciales MUY lentas -----
    function sembrar() {
      var w = contenedor.clientWidth, h = contenedor.clientHeight;
      objs.forEach(function (o) {
        o.x = o.r + Math.random() * Math.max(1, w - 2 * o.r);
        o.y = o.r + Math.random() * Math.max(1, h - 2 * o.r);
        var a = Math.random() * Math.PI * 2;
        var v = 2.5 + Math.random() * 4;            // 2,5-6,5 px/s: deriva flotante
        o.vx = Math.cos(a) * v;
        o.vy = Math.sin(a) * v;
        pintar(o);
      });
    }

    // ----- Bucle: deriva + rebotes de borde (arranca pausado; sólo corre
    // mientras el visor está abierto, vía api.reanudar). Entre sí se
    // atraviesan: sin colisiones -----
    var corriendo = false;
    var ultimo = 0;
    function paso(t) {
      if (!corriendo) return;
      var dt = Math.min(0.05, ((t - ultimo) / 1000) || 0);
      ultimo = t;
      if (!document.hidden) {
        var w = contenedor.clientWidth, h = contenedor.clientHeight;
        var a, A;

        for (a = 0; a < objs.length; a++) {
          A = objs[a];
          A.x += A.vx * dt;
          A.y += A.vy * dt;
          // frotamiento casi nulo: el espacio mantiene la deriva
          A.vx *= (1 - 0.02 * dt);
          A.vy *= (1 - 0.02 * dt);
          // si pierde fuelle, empujoncito suave en su propia dirección
          var vel = Math.hypot(A.vx, A.vy);
          if (vel < 1.6) { var f = 2.2 / (vel || 1); A.vx *= f; A.vy *= f; }
          // rebotes de borde
          if (A.x < A.r) { A.x = A.r; A.vx = Math.abs(A.vx); }
          if (A.x > w - A.r) { A.x = w - A.r; A.vx = -Math.abs(A.vx); }
          if (A.y < A.r) { A.y = A.r; A.vy = Math.abs(A.vy); }
          if (A.y > h - A.r) { A.y = h - A.r; A.vy = -Math.abs(A.vy); }
        }

        for (a = 0; a < objs.length; a++) pintar(objs[a]);
      }
      requestAnimationFrame(paso);
    }

    sembrar();
    requestAnimationFrame(function () { capa.classList.add('is-in'); });  // entrada escalonada

    // ----- API que usa el visor -----
    return {
      reanudar: function () {
        if (corriendo || reduce) return;      // con movimiento reducido, quietos
        corriendo = true;
        requestAnimationFrame(function (t) { ultimo = t; requestAnimationFrame(paso); });
      },
      pausar: function () {
        corriendo = false;
      }
    };
  }

  window.MuseoObjetos = { montar: montar };
})();
