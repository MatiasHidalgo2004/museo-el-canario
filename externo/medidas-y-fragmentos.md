# Bodega · ficha «Damajuana» — medidas y fragmentos de código

Documentación externa al sitio que acompaña a los dos diagramas vectoriales:

| Diagrama | Viewport | Contenido |
|---|---|---|
| [`bodega-desktop-1440x900.svg`](bodega-desktop-1440x900.svg) | 1440 × 900 | menú fijo, escena con card blanco + ilustración y ventana emergente de la damajuana abierta |
| [`bodega-movil-390x844.svg`](bodega-movil-390x844.svg) | 390 × 844 | menú fijo con toggle, tarjeta blanca, escena enmarcada y la ventana cubriendo la escena |

**Método:** todos los valores salen del CSS real (`styles/styles.css` y el bloque `<style>` de `bodega.html`), no de una medición en pantalla. Donde el valor depende del contenido (nº de líneas de texto) se indica como aproximado. Las cotas están dibujadas dentro de cada SVG; aquí están las tablas completas y los fragmentos de los que salen.

---

## 1. Constantes globales (`styles.css`)

```css
:root{
  --container: 1100px;
  --radius: 20px;
  --header-height: 76px;
  --edge-padding: 22px;
  --ventana-zoom: 1;          /* escala de todas las ventanas emergentes */
}
html,body{ background:#a4b682; }
```

---

## 2. Cotas — escritorio 1440 × 900

### Pantalla

| Elemento | Valor | Origen |
|---|---|---|
| Viewport | **1440 × 900 px** | tamaño de referencia |

### Menú fijo (`.site-header`)

| Elemento | Valor | Fórmula / nota |
|---|---|---|
| Ancho | **1100 px** | `calc(100% - 48px + var(--sbw))` = 1392 → limitado por `max-width: var(--container)` |
| Alto | **76 px** | `--header-height` |
| Despegue superior | **12 px** | `top: 12px` (position: fixed, centrado con `left:50% / translateX(-50%)`) |
| Posición horizontal | x = **170 px** | (1440 − 1100) / 2 |
| Radio | 20 px | `border-radius: var(--radius)` |
| Fondo | `rgba(14,24,19,.42)` + `blur(16px) saturate(140%)` | vidrio esmerilado |
| Borde / sombra | `1px rgba(255,255,255,.20)` / `0 18px 40px rgba(0,0,0,.30)` | |
| Relleno interno | `0 22px` | `--edge-padding` |
| Logo | 56 × 56 px | `.logo-img` |
| Marca | `clamp(15px,2vw,22px)` → **22 px** | serif, mayúsculas, 2 líneas, `line-height:1.06` |
| Navegación | 5 enlaces, `gap:20px`, 15 px/600, `padding:8px 12px` | `.main-nav` / `.nav-link` |

### Escena (`.cruce`)

| Elemento | Valor | Fórmula / nota |
|---|---|---|
| Ancho | **1100 px** | `calc(100% - 48px)` con `max-width: var(--container)` |
| Alto | **764 px** | `min(100dvh − 76 − 60, min(100vw − 48, 1100) × 1024/1440)` = `min(764, 782,2)` |
| Despegue superior | **112 px** | `padding-top` del `.hero` (76 + 12 = 88) + `margin: 24px auto` |
| Margen inferior | 24 px | 112 + 764 = 876 → 900 − 876 |
| Radio / sombra | 20 px / `0 18px 40px rgba(0,0,0,.12)` | `overflow:hidden` redondea todo lo interior |

### Card blanco (`.cruce-card`)

| Elemento | Valor | Fórmula / nota |
|---|---|---|
| Ancho | **486,2 px** | `width: 44.2%` de 1100 |
| Relleno | **40 px vertical / 44 px horizontal** | `padding: 40px 44px` → texto útil = 398,2 px |
| Posición | left 0, top 0, bottom 0 | `z-index: 3` |
| Título | `clamp(26px,3.6vw,40px)` → **40 px** | serif 700, `margin-bottom: 12px` |
| Texto | 16 px / 1.6 = **25,6 px por línea** | `margin-bottom: 14px` |
| Acciones | botón **40 px** de alto (`padding:10px 28px`), «volver» 40 × 40, `gap:12px`, `margin-top:auto` | `.cruce-acciones` |

### Ilustración y puntos

| Elemento | Valor |
|---|---|
| Capas | `position:absolute; inset:0` (fondo + intermedio `.cr-capa-int` al **98,9 %** anclado a la derecha) |
| Lienzo de referencia | 1440 × 1024 (`--x`/`--y` de cada punto) |
| Punto (`.cruce-pt`) | 40 × 40 px de área de toque; marca `::before` 17 px con borde 4 px `#5B8C5A`; pulso `::after` 25 px; `z-index: 4` |

### Ventana emergente (`.cr-det`) — damajuana

| Elemento | Valor | Nota |
|---|---|---|
| Ancho | **320 px** | `min(320px, 80%)` — 80 % de 1100 no llega, manda 320 |
| Alto | **≈ 163 px** | 16 + 20,4 (título) + 6 + 5 × 20,925 (texto) + 16 → **variable según el nº de líneas** |
| Posición | `top: 22px; right: 22px` | anclada a la esquina superior derecha de la escena |
| Radio / sombra | 18 px / `0 18px 40px rgba(0,0,0,.30)` | `overflow:hidden` |
| `z-index` | **5** | por encima de los puntos (4) |
| Panel del icono `.cr-det-card` | **121,6 px** = `flex: 0 0 38 %`, `padding: 14px`, fondo **`#5B8C5A`** | icono `max-width:96px` + `filter: brightness(0) invert(1)` (rojo → blanco) |
| Cristal `.cr-det-glass` | **198,4 px** = resto (62 %), `padding: 16px 18px` | `linear-gradient(rgba(14,24,19,.62) …)` sobre `Menu-fondo.webp` (`cover`, `center 32%`) |
| Ancho útil del texto | 162,4 px | 198,4 − 36 |
| Título `.cr-titulo` | Lora 700, **17 px / 1,2** = 20,4 px, `margin: 0 26px 6px 0` | blanco |
| Texto `.cr-text` | **13,5 px / 1,55** = 20,925 px por línea, `rgba(255,255,255,.92)` | **5 líneas** en 162,4 px |
| Cruz `.cr-x` | 30 × 30 px, `top:6px; right:8px`, 22 px | **oculta en escritorio**: `@media (min-width:701px) and (hover:hover){ display:none }` |
| Escala | `zoom: var(--ventana-zoom,1)` = **1** | |

---

## 3. Cotas — móvil 390 × 844

### Pantalla

| Elemento | Valor |
|---|---|
| Viewport | **390 × 844 px** |
| Altura de contenido | **≈ 962 px** → la página **hace scroll** (la ventana emergente cae justo bajo la línea de 844 px) |

### Menú fijo

| Elemento | Valor | Nota |
|---|---|---|
| Ancho | **342 px** | `calc(100% - 48px)` = 390 − 48 (`max-width` no llega a actuar) → x = 24 px |
| Alto / despegue | **76 px** / **12 px** | idéntico a escritorio |
| Logo | 56 × 56 px | |
| Marca | `clamp(15px,2vw,22px)` → **15 px** | encaja en 180 px → 3 líneas |
| Toggle `.menu-toggle` | icono **44 × 44** (`padding:6px` → botón 56) | `.main-nav{display:none}` |
| Círculo | `r=20` en `viewBox 48` → **18,3 px** a escala, `fill:#c0392b` (`#b03a2b` abierto) | barras blancas `stroke-width:3` |

### Tarjeta (`.cruce` en `@media (max-width:700px)`)

| Elemento | Valor | Nota |
|---|---|---|
| Ancho | **342 px** | misma caja que el menú |
| Relleno | **24 px** | contenido útil **294 px** |
| Fondo / radio | `#fff` / 20 px | el card blanco *es* `.cruce` (`.cruce-card{display:contents}`) |
| Título | `clamp(26px,3.6vw,40px)` → **26 px** | 3,6vw de 390 = 14 → manda el mínimo |
| Texto | 16 px / 1,6 = **25,6 px por línea** | ≈ 10 + 8 líneas |
| Alto total | **≈ 850 px** | `height:auto` (crece con el contenido) |
| Despegue | **112 px** | igual que escritorio |

### Escena (`.cruce-lienzo`)

| Elemento | Valor | Nota |
|---|---|---|
| Ancho × alto | **294 × 209,07 px** | `aspect-ratio: 1440 / 1024` → `294 × 1024 / 1440` |
| Borde | `1px rgba(41,41,41,.16)` | imagen enmarcada |
| Radio | 14 px | |
| Orden / separación | `order:2`, `margin-top:6px` | texto arriba, escena debajo |
| Acciones | `order:3`, `margin-top:20px`, centradas, `gap:12px` | botón 40 px + «DAR PASO» 40 px |
| Puntos | 32 × 32 px, marca 14 px con borde 3 px, reubicados con `--mx/--my`; contenedor 105 % | **tapados por la ventana** (`z-index` 5 > 4) |

### Ventana emergente (`.cr-det` en móvil)

| Elemento | Valor | Nota |
|---|---|---|
| Caja | **294 × 209,07 px** = `inset: 0` | cubre **exactamente** la escena; `width:auto`, `box-shadow:none` |
| Radio | 14 px | igual que el marco |
| Panel del icono | **111,72 px** = 38 %, `padding:14px` | `#5B8C5A` |
| Cristal | **182,28 px** = 62 %, `padding:16px 18px` | `overflow-y:auto` si el texto no cabe |
| Ancho útil del texto | 146,28 px | → 5 líneas |
| Título | 17 px, `margin-right: 40px` | aire para la × |
| Texto | 13,5 px / 1,55 **en negrita** (`.cr-text{font-weight:700}` en ≤700 px) | |
| Cruz `.cr-x` | **40 × 40 px**, `font-size:26 px`, `top:6 right:8` | aquí **sí** está visible: es el cierre principal |
| `zoom` | 1 | `@media (max-width:700px){ .cr-det{zoom:1} }` |
| Botón `[+]` del visor | `44 px` de alto, `top:10 left:10`, `z-index:4` | queda **debajo** de la ventana |

---

## 4. Jerarquía de capas (`z-index`)

| `z-index` | Elemento |
|---|---|
| 120 | `.site-header` (menú fijo) |
| 5 | `.cr-det` (ventana emergente) |
| 4 | `.cruce-pt` (puntos) y `.cr-zoom-btn` (`[+]`) |
| 3 | `.cruce-card` (card blanco) |
| 2 | `.cruce` (banda de la escena) |
| — | `.hero-overlay`, capas de la ilustración |

---

## 5. Fragmentos de código

### 5.1 Menú fijo — `styles/styles.css`

```css
.site-header{
  position:fixed;
  top:12px;
  left:50%;
  transform:translateX(-50%);
  z-index:120;
  /* + var(--sbw): en las páginas con scroll el viewport (100%) es 15px más
     angosto; sumando el ancho de la barra el header mide exactamente lo mismo
     con y sin scroll. --sbw la calcula menu.js (0 si no hay barra). */
  width:calc(100% - 48px + var(--sbw, 0px));
  max-width:var(--container);
  height:var(--header-height);
  border-radius:20px;
  background: rgba(14,24,19,0.42);
  backdrop-filter: blur(16px) saturate(140%);
  box-shadow:0 18px 40px rgba(0,0,0,0.30);
  border:1px solid rgba(255,255,255,0.20);
}
.header-inner{
  width:100%; display:flex; align-items:center;
  justify-content:space-between;
  padding:0 var(--edge-padding);   /* 22px */
  height:100%;
}
.logo-img{ width:56px; height:56px; }
.main-nav{ display:flex; gap:20px; align-items:center; }
.nav-link{
  font-family:var(--light-sans); font-weight:600;
  padding:8px 12px; border-radius:8px;
}
/* en móvil */
.menu-toggle{ display:block; background:transparent; border:0; padding:6px; }
.menu-icon{ display:block; width:44px; height:44px; }
@media (max-width: 700px){ .main-nav{ display:none; } }
```

Toggle (marca SVG, `bodega.html`):

```html
<button class="menu-toggle" id="menuToggle" aria-label="Abrir menú" type="button">
  <svg class="menu-icon" width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
    <circle class="menu-circle" cx="24" cy="24" r="20" fill="#c0392b"/>
    <g class="bars" stroke="#fff" stroke-width="3" stroke-linecap="round">
      <line class="bar top"    x1="14" y1="18" x2="34" y2="18"/>
      <line class="bar bottom" x1="14" y1="30" x2="34" y2="30"/>
    </g>
  </svg>
</button>
```

### 5.2 Escena y card — `bodega.html`

```css
.cruce{
  position:relative; z-index:2;
  width: calc(100% - 48px);
  max-width: var(--container);
  margin: 24px auto;
  /* alto disponible bajo el menú; sin estirarse más allá de 1440/1024 */
  height: min(calc(100dvh - var(--header-height) - 60px),
              calc(min(100vw - 48px, var(--container)) * 1024 / 1440));
  overflow:hidden;
  border-radius: var(--radius);           /* 20px */
  box-shadow: 0 18px 40px rgba(0,0,0,.12);
}
.cruce-card{
  position:absolute; left:0; top:0; bottom:0;
  width: 44.2%;                           /* 486,2px de 1100 */
  z-index:3; box-sizing:border-box; overflow:hidden;
  background:#fff;
  padding: 40px 44px;
  display:flex; flex-direction:column;
}
.cruce-acciones{ display:flex; align-items:center; gap:12px; margin-top:auto; }
.cruce-acciones .btn-primary{ height:40px; padding:10px 28px; }
.cruce-acciones .cr-back{ width:40px; padding:0; font-size:20px; }
```

Capas de la ilustración:

```css
.cruce-lienzo{ position:relative; width:100%; height:100%; --apriete: 98.9%; }
.cruce-capa{ position:absolute; inset:0; width:100%; height:100%; display:block; }
.cr-capa-int{ inset:0 0 0 auto; width:var(--apriete,100%); }   /* apretón a la derecha */
.cruce-puntos{ position:absolute; inset:0 0 0 auto; width:var(--apriete,100%); }
.cruce-pt{
  position:absolute;
  left:calc(var(--x) * 100% / 1440);
  top:calc(var(--y) * 100% / 1024);
  width:40px; height:40px; border-radius:50%; z-index:4;
}
.cruce-pt::before{ width:17px; height:17px; background:#fff;
                   border:4px solid #5B8C5A; }
```

Tipografía del card — `styles/styles.css`:

```css
.card-title{ font-family:var(--serif); font-weight:700;
             font-size:clamp(26px,3.6vw,40px); margin:0 0 12px; }
.card-lead{ font-family:var(--sans); font-size:16px;
            line-height:1.6; margin:0 0 14px; color:#333; }
.btn-primary{ background-color:rgba(47,107,79,0.92); color:#fff;
              border-radius:12px; font-size:15px; font-weight:700; }
```

### 5.3 Ventana emergente — `bodega.html`

```css
.cr-det{
  position:absolute; z-index:5; display:flex;
  width: min(320px, 80%);
  border-radius: 18px; overflow:hidden;
  top: 22px; right: 22px;
  box-shadow: 0 18px 40px rgba(0,0,0,.30);
}
.cr-det-card{
  flex: 0 0 38%;                 /* 121,6px de 320 */
  padding: 14px;
  display:flex; align-items:center; justify-content:center;
  background: #5B8C5A;
}
.cr-icono{ width:100%; max-width:96px; height:auto;
           filter: brightness(0) invert(1); }   /* SVG rojo → blanco */
.cr-det-glass{
  flex:1 1 auto;                 /* 198,4px */
  padding: 16px 18px;
  background:
    linear-gradient(rgba(14,24,19,.62), rgba(14,24,19,.62)),
    url('assets/images/Menu-fondo.webp') center 32% / cover no-repeat;
}
.cr-titulo{ margin:0 26px 6px 0; font-family:var(--serif);
            font-weight:700; font-size:17px; line-height:1.2; color:#fff; }
.cr-text{ margin:0; font-family:var(--sans); font-size:13.5px;
          line-height:1.55; color:rgba(255,255,255,.92); }
.cr-x{ position:absolute; top:6px; right:8px; width:30px; height:30px;
       font-size:22px; color:rgba(255,255,255,.8); }
/* en escritorio con ratón la × es inalcanzable (la ficha se cierra al
   salir del punto): se oculta. En móvil sí se usa. */
@media (min-width: 701px) and (hover: hover){ .cr-x{ display:none; } }
```

Contenido de la ficha (array `datos`, `bodega.html`):

```js
{ svg: 'assets/svg/damajuana.svg',
  titulo: 'Damajuana',
  texto:  'Botella de vidrio envuelta en mimbre con mango y corcho para contener licor de 15 litros.' }
```

### 5.4 Bloque de móvil — `bodega.html`

```css
@media (max-width: 700px){
  .cruce{
    display:flex; flex-direction:column; box-sizing:border-box;
    height:auto; overflow:visible;
    padding:24px; background:#fff;
  }
  .cruce-card{ display:contents; }        /* el card blanco ahora es .cruce */
  .cruce-lienzo{
    order:2; margin-top:6px; height:auto;
    aspect-ratio: 1440 / 1024;            /* 294 × 209,07 */
    overflow:hidden;
    border:1px solid rgba(41,41,41,.16);
    border-radius:14px;
  }
  .cruce-acciones{ order:3; align-self:center; margin-top:20px; }

  /* la ventana cubre exactamente la imagen de la escena */
  .cr-det{ inset:0; width:auto; border-radius:14px; box-shadow:none; }
  .cr-det-glass{ overflow-y:auto; min-height:0; }
  .cr-titulo{ margin-right:40px; }
  .cr-x{ width:40px; height:40px; font-size:26px; }
}
```

```css
/* styles.css */
@media (max-width: 700px){ .cr-text{ font-weight:700; } }
@media (max-width: 700px){ .cr-det{ zoom:1; } }
```

---

## 6. Notas técnicas

1. **`--sbw` (barra de scroll).** `menu.js` mide el ancho real de la barra y lo guarda en `--sbw`; se suma en el `width` del header para que el menú mida lo mismo con y sin scroll. En los diagramas se asume `--sbw: 0` (sin barra), por eso el header mide 1100 px en escritorio y 342 px en móvil.
2. **Alto de la escena en escritorio.** `height: min(100dvh − 76 − 60, …)` con `100dvh = 900` da **764 px**; el segundo término de la fórmula (la proporción 1440/1024 del lienzo) daría 782 px, así que manda el primero. En móvil el alto pasa a ser `auto` y lo fija el `aspect-ratio` de la escena.
3. **Alto de la ventana emergente.** No está declarado: lo componen el padding (16+16), el título (17 × 1,2 = 20,4) + su margen inferior (6) y las líneas del texto (13,5 × 1,55 = 20,925 cada una). Con 5 líneas salen **≈ 163 px**; si el texto cambiara, el valor varía. Por eso la cota aparece con `≈`.
4. **La × de cierre.** Existe en ambos modos, pero `@media (min-width:701px) and (hover:hover)` la oculta en escritorio (la ficha se cierra sola al retirar el cursor del punto). En el diagrama de escritorio aparece **reconstruida con trazo discontinuo** para documentarla; en móvil es un círculo de 40 × 40 px.
5. **Color del panel del icono: `#5B8C5A`** (verde del museo), no el acento `#b76261`, que sólo se usa para hover y, aquí, para las líneas de cota.
6. **Puntos y botón `[+]` con la ventana abierta.** En escritorio la ventana ocupa sólo la esquina superior derecha y los 10 puntos siguen visibles. En móvil, al ser `inset:0`, la ventana tapa la escena entera: desaparecen los puntos (z 4 < 5) y el botón del visor (z 4).
7. **Móvil y scroll.** El contenido de la tarjeta supera las 844 px del viewport (≈ 962 px), así que para ver la ventana emergente completa hay que desplazarse un poco; el diagrama marca esa línea con el punteado «fin del viewport».
8. **`zoom` de las ventanas.** `--ventana-zoom` permite escalar todas las fichas del sitio a la vez; hoy vale `1`, y en móvil se fuerza a `1` porque la ventana ocupa toda la escena.
9. **Reconstrucción.** Los diagramas son esquemáticos: la ilustración aparece como degradado cálido rotulado (no se copia el dibujo), el texto largo como barras y el icono como silueta blanca. Las cotas, los colores y las posiciones sí son los reales.
