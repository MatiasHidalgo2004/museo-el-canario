/* Puntos vistos del recorrido (sólo móvil, como todo el sistema de escenas).
   Marca los puntos cuya ficha ya se abrió: dejan de pulsar y quedan
   translúcidos, para que el visitante distinga de un vistazo qué vio y qué
   falta. Siguen funcionando igual — es sólo un indicador de apariencia.

   Cómo decide si marcar: este listener está en .cruce-lienzo (padre), así que
   se ejecuta DESPUÉS que el handler propio del punto (target antes que
   burbuja). Si tras ese handler el punto tiene la clase .is-on, su ficha quedó
   abierta → se marca. Si el toque sólo cerró una ventana (punto cubierto), el
   punto no tiene .is-on → no se marca.

   Estado en sessionStorage (clave con versión, como la pista de doble-toque):
   se conserva al navegar entre estancias en la misma pestaña y se borra al
   cerrarla. Se escribe por estancia: { "cruce": [0,2,5], "bodega": [...] }.
   Sin dependencias. */
(function () {
  'use strict';

  var lienzo = document.querySelector('.cruce-lienzo');
  if (!lienzo) return;                       // no es una escena del recorrido
  var capaInt = lienzo.querySelector('.cr-capa-int');
  if (!capaInt) return;

  var m = (capaInt.getAttribute('src') || '').match(/recorrido-(.+)-intermedio\.png/);
  if (!m) return;                            // sin escena identificable, no hacemos nada
  var sala = m[1];

  var KEY = 'museo-canario:puntos-vistos:v1';
  var pts = [].slice.call(lienzo.querySelectorAll('.cruce-pt'));

  function leer() {
    try { return JSON.parse(sessionStorage.getItem(KEY) || '{}'); }
    catch (e) { return {}; }                 // storage bloqueado o dato corrupto
  }
  function guardar(obj) {
    try { sessionStorage.setItem(KEY, JSON.stringify(obj)); } catch (e) { /* noop */ }
  }

  // 1) Aplicar los puntos ya vistos en esta sesión (al cargar la página)
  var vistos = leer()[sala] || [];
  vistos.forEach(function (i) {
    if (pts[i]) pts[i].classList.add('is-visto');
  });

  // 2) Marcar al hacer clic. Corre después del handler del punto, así que si
  //    su ficha quedó abierta (.is-on), lo marcamos; si el toque sólo cerró
  //    otra ventana, no.
  lienzo.addEventListener('click', function (e) {
    var pt = (e.target && e.target.closest) ? e.target.closest('.cruce-pt') : null;
    if (!pt || !pt.classList.contains('is-on')) return;
    var idx = pts.indexOf(pt);
    if (idx < 0) return;

    var todos = leer();
    var arr = todos[sala] || [];
    if (arr.indexOf(idx) === -1) {
      arr.push(idx);
      todos[sala] = arr;
      guardar(todos);
    }
    pt.classList.add('is-visto');            // idempotente, por si acaso
  });
})();
