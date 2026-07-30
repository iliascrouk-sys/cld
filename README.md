# La Cava Gastrobar — web

Página de una sola pantalla para **La Cava Gastrobar**, Calle del Poeta Diego
Jesús Jiménez 7, 16001 Cuenca. HTML, CSS y JavaScript planos: no hay build, ni
dependencias, ni npm.

```
index.html    estructura y contenido
styles.css    estilos (colores y tipografías en :root)
script.js     menú móvil, pestañas de la carta, galería, "abierto ahora", formulario
```

Para verla, abre `index.html` en el navegador. Para publicarla, sube los
archivos (más la carpeta `fotos/`) a cualquier hosting estático: GitHub Pages,
Netlify, Vercel, Cloudflare Pages o el FTP de siempre.

## Qué incluye

- Portada con indicador **«abierto ahora / cerrado»** calculado en tiempo real desde el horario.
- Carta con pestañas por categoría, navegables con teclado.
- Galería con visor a pantalla completa.
- Horarios con la fila de hoy resaltada, contacto y mapa de Google embebido.
- Formulario de reserva que abre WhatsApp con la solicitud ya redactada.
- Responsive, accesible (roles ARIA, foco visible, salto al contenido), respeta
  `prefers-reduced-motion`, y con hoja de estilos para imprimir la carta.
- `JSON-LD` de tipo `Restaurant` en el `<head>`.

## Datos ya rellenados

Vienen de la ficha de Google del local:

| Dato | Valor |
|---|---|
| Nombre | La Cava Gastrobar |
| Dirección | C. del Poeta Diego Jesús Jiménez, 7 · 16001 Cuenca |
| Teléfono / WhatsApp | 679 08 73 00 |
| Valoración | 4,6 sobre 490 reseñas |
| Precio medio | 20–30 € por persona |
| Servicios | Comer allí · para llevar · a domicilio |
| Platos | Croquetas de carabineros, codillo, bacalao en tempura, alcachofas, chipirones, osobuco, cuscús, botarga, brownie |
| Mapa | iframe de Google centrado en la dirección |
| Opiniones | Dos reseñas reales de Google, abreviadas a nombre + inicial |

## Pendiente

### 1. El horario — importante

**Sin confirmar.** Google solo mostraba «Cerrado · abre a las 20:30», y los
directorios se contradicen entre sí (12:00 o 13:00 de apertura, 20:00 o 20:30
por la tarde, y ninguno coincide en los días de descanso). La web muestra ahora
**13:00–16:30 y 20:30–00:00 todos los días** como estimación, con un aviso
visible de que es orientativo.

Al corregirlo hay que tocar **tres sitios**:

1. `TURNOS_DIARIOS` / `HORARIO` en `script.js`
2. la tabla de `#visitanos` en `index.html`
3. el bloque `openingHoursSpecification` del JSON-LD en el `<head>`

`HORARIO` usa `0` = domingo … `6` = sábado, con tramos `"HH:MM"`:

```js
const HORARIO = {
  1: [],                                        // cerrado
  5: [["13:00", "16:30"], ["20:30", "00:00"]],  // dos turnos
};
```

Un tramo cuyo fin es anterior al inicio se entiende que cruza la medianoche
(`["21:00", "01:30"]`), y el indicador de la portada lo tiene en cuenta.

### 2. Precios de la carta

No están publicados en ningún sitio, así que **no se ha inventado ninguno**: la
carta lista los platos sin precio y remite al teléfono. Si los pasas, se añaden
en `#carta` dentro de cada `<span class="plato__precio">`.

### 3. Fotos

Todas son marcadores de color. Crea una carpeta `fotos/` y cambia cada
`<div class="ph …">` por una imagen real:

```html
<img src="fotos/sala.jpg" alt="La sala de La Cava Gastrobar" loading="lazy" width="1200" height="900">
```

Para la portada, en `styles.css`:

```css
.portada__fondo {
  background-image:
    linear-gradient(160deg, rgba(18,16,14,.82), rgba(18,16,14,.6)),
    url("fotos/portada.jpg");
  background-size: cover;
  background-position: center;
}
```

Exporta a JPEG de ~1600 px de ancho y menos de 300 KB, o a WebP.

### 4. Otros

- **Instagram**: el pie enlaza a Facebook y falta Instagram (`TODO` en el pie).
- **Dominio**: el `<link rel="canonical">` apunta a `lacavagastrobar.es`, que es
  un ejemplo. Cámbialo por el dominio real cuando lo tengas.
- **Aviso legal, privacidad y cookies**: enlaces vacíos en el pie. Son
  obligatorios en España en cuanto la web recoja datos personales.
- **Descripción del local**: el texto de «El sitio» está escrito a partir de las
  reseñas. Conviene que lo revise el dueño.

## Notas de implementación

**Reservas por WhatsApp.** El local no tiene correo público, así que el
formulario compone el mensaje y abre `wa.me/34679087300`; no necesita servidor.
Para recibirlas por correo o automáticamente, sustituye el bloque `wa.me` de
`script.js` por un `fetch` al endpoint de Formspree, Netlify Forms o similar.

**Sin `aggregateRating` en el JSON-LD.** Está a propósito: Google no admite
valoraciones autopublicadas sobre el propio negocio y puede penalizar el
resultado enriquecido. El 4,6 sí aparece en el texto visible de la página.

**Colores.** Todo sale de `:root` en `styles.css` — cambia `--acento`, `--tinta`
y `--crema` y la página entera se adapta.
