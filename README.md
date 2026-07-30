# Web del local

Página web de una sola pantalla para un restaurante / bar / cafetería.
HTML, CSS y JavaScript planos: no hay build, ni dependencias, ni npm.

```
index.html    estructura y contenido
styles.css    estilos (colores y tipografías en :root)
script.js     menú móvil, pestañas de la carta, galería, "abierto ahora", formulario
```

Para verla, abre `index.html` en el navegador. Para publicarla, sube los tres
archivos (más la carpeta `fotos/`) a cualquier hosting estático: GitHub Pages,
Netlify, Vercel, Cloudflare Pages o el FTP de siempre.

## Qué incluye

- Portada con indicador **"abierto ahora / cerrado"** calculado en tiempo real a partir del horario.
- Carta con pestañas por categoría, navegables con teclado.
- Galería con visor a pantalla completa.
- Horarios con la fila de hoy resaltada, datos de contacto y hueco para el mapa.
- Formulario de reserva con validación que redacta el correo con los datos.
- Responsive, accesible (roles ARIA, foco visible, salto al contenido), respeta
  `prefers-reduced-motion`, y con hoja de estilos para imprimir la carta.
- `JSON-LD` de tipo `Restaurant` en el `<head>` para el resultado enriquecido de Google.

## Datos pendientes de rellenar

El contenido actual es de relleno. Busca `TODO` en los archivos y sustituye:

| Dato | Dónde |
|---|---|
| Nombre del local | `index.html` (título, `<h1>`, marca, pie, JSON-LD) y `<title>` |
| Inicial del logotipo | `.marca__icono` (dos sitios) y el `favicon` del `<head>` |
| Dirección y código postal | portada, `#visitanos`, pie, JSON-LD |
| Teléfono y WhatsApp | `tel:` / `wa.me` (portada, `#visitanos`, `#reservar`, pie) |
| Correo | `EMAIL_RESERVAS` en `script.js` y el `mailto:` del `<head>`/JSON-LD |
| Horario real | `HORARIO` en `script.js`, la tabla de `#visitanos` y el JSON-LD — **los tres** |
| Carta y precios | `#carta` |
| Fotos | los `<div class="ph">` y el fondo de `.portada__fondo` |
| Mapa | el `<iframe>` de *Compartir → Insertar un mapa* en Google Maps |
| Nota y reseñas | `#opiniones` |
| Redes sociales | pie |
| Año de apertura, precio medio, transporte | `#historia`, portada, `#visitanos` |

### Horario

`HORARIO` en `script.js` usa `0` = domingo … `6` = sábado, con tramos `"HH:MM"`:

```js
const HORARIO = {
  1: [],                                        // cerrado
  5: [["13:00", "16:30"], ["20:00", "00:00"]],  // dos turnos
};
```

Un tramo cuyo fin es anterior al inicio se entiende que cruza la medianoche
(`["21:00", "01:30"]`), y el indicador de la portada lo tiene en cuenta.

### Fotos

Crea una carpeta `fotos/` y cambia cada marcador por una imagen real:

```html
<img src="fotos/sala.jpg" alt="La sala del restaurante" loading="lazy" width="1200" height="900">
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

### Colores

Todo sale de `:root` en `styles.css` — cambia `--acento`, `--tinta` y `--crema`
y la página entera se adapta.

### Reservas por formulario

Tal como está, el formulario abre el cliente de correo del visitante con los
datos ya redactados; no necesita servidor. Para recibirlas automáticamente,
sustituye el bloque `mailto` de `script.js` por un `fetch` al endpoint de
Formspree, Netlify Forms o similar.

## Antes de publicar

- Rellenar los `TODO` de la tabla de arriba.
- Redactar aviso legal, privacidad y cookies (obligatorio en España si se
  recogen datos personales por el formulario).
- Comprobar que el horario coincide con el de la ficha de Google.
