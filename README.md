# Museo de la vida rural El Canario

Sitio web estático multipágina del **Museo de la vida rural El Canario**, una casa
patronal de adobe de 1952 a las afueras de Linares (Maule, Chile), hoy museo con
más de 1000 objetos de la vida campesina del siglo XX.

No hay build, ni frameworks, ni dependencias: son HTML, CSS y JavaScript puro.

## Páginas

| Archivo            | Contenido                                                     |
| ------------------ | ------------------------------------------------------------- |
| `index.html`       | Portada de entrada: niebla, zoom a la casa isométrica y botón  |
| `inicio.html`      | Inicio del sitio: tarjeta de bienvenida con la vista frontal   |
| `cronograma.html`  | Línea del tiempo horizontal (SVG desplazable con arrastre)     |
| `imagenes.html`    | Carrusel de fotos con pies de foto y contador (`1 / 10`)       |
| `biografia.html`   | Historia del museo y su colección                             |
| `contacto.html`    | Dirección, teléfono, WhatsApp y correo (enlaces `tel:`/`mailto:`) |
| `recorrido.html`   | Recorrido ilustrado por la casa                               |

## Estructura

```
├── *.html              # las 6 páginas
├── assets/
│   ├── images/         # fotos en formato .webp
│   └── svg/            # logotipo y línea del tiempo (linea-tl.svg)
├── styles/
│   └── styles.css      # estilos globales (variables en :root)
└── scripts/
    ├── menu.js         # menú móvil compartido por todas las páginas
    └── nav-transition.js  # animación de salida al navegar
```

## Cómo verlo en local

Basta con abrir `index.html` en el navegador (doble clic). Si prefieres servirlo
con un servidor local (para que la consola no muestre avisos de `file://`):

```bash
npx serve .
# o
python -m http.server 8000
```

## Personalización frecuente

- **Pies de foto y contador del carrusel**: editar el array `images` dentro de
  `imagenes.html` (cada entrada es `{ src, caption }`). El contador se calcula
  solo con `position + 1 / images.length`.
- **Colores, tipografías y medidas**: variables en `:root` de `styles/styles.css`
  (`--brand-green`, `--accent`, `--container`, etc.).
- **Menú móvil**: un único archivo, `scripts/menu.js`, usado por las 6 páginas.
  Si hay que cambiar algo del menú, se cambia una sola vez.

## Notas de rendimiento

- Las imágenes están en **WebP** (calidad 88, redimensionadas a 1400 px) porque
  los originales en PNG pesaban ~36 MB; ahora pesan ~3 MB sin diferencia visible.
  Si se añade una foto nueva: convertirla a WebP antes de subirla.
- `assets/svg/linea-tl.svg` está optimizado con **SVGO** manteniendo intactos el
  `viewBox` y la estructura de trazados.
- El carrusel precarga **la siguiente imagen mientras se muestra la actual**, en
  lugar de descargar las 10 a la vez.

## Transparencia — asistencia de inteligencia artificial

Este sitio se desarrolló con asistencia de inteligencia artificial
(asistente de código **OpenCode**, modelo de lenguaje), utilizado para escribir
y refactorizar HTML, CSS y JavaScript, generar la página de catálogo y sus
animaciones, optimizar assets y revisar accesibilidad y rendimiento.

La autoría del proyecto, el contenido (textos, fichas de los objetos y
nombres), el diseño y la revisión final del código son de **Matias Hidalgo**
(2026). El código se distribuye bajo licencia MIT.
## Licencia

Distribuido bajo la licencia MIT. Ver [LICENSE](LICENSE).
