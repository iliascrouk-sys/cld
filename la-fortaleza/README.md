# La Fortaleza Bar-Restaurante — Cuenca

Web de una sola pantalla con reserva por WhatsApp. HTML, CSS y JavaScript
planos, sin build ni dependencias.

```
index.html    estructura y contenido
styles.css    estilos (paleta y tipografías en :root)
script.js     menú móvil, motor de horario, formulario de reserva
img/          el logo y las fotos de los platos
```

## El logo y la paleta

El logo lo aportó el cliente. Venía con fondo blanco: se le ha quitado por
inundación desde los bordes —no por umbral global, que se habría comido los
blancos de dentro (la espuma, las letras, el sol)— y se ha recortado a su caja.

| Archivo | Dónde | Tamaño |
|---|---|---|
| `logo.webp` / `logo.png` | Portada | 714 × 686 px · 118 / 185 KB |
| `logo-chico.webp` / `logo-chico.png` | Barra y pie | 132 × 127 px · 10 / 38 KB |

Van dentro de un `<picture>`: el navegador coge el WebP y, si no puede, el PNG.
El WebP pesa la mitad. Si se cambia el logo hay que regenerar los cuatro
archivos manteniendo los nombres.

**La paleta sale del propio logo**, muestreando sus colores:

| Variable | Color | De dónde |
|---|---|---|
| `--azul` | `#0A3446` | el azul petróleo del escudo |
| `--azul-2` | `#06222F` | su parte más oscura |
| `--oro` | `#C98B39` | el marco de latón |
| `--oro-2` | `#E9BE86` | los reflejos del marco |
| `--crema` | `#FDF8EC` | las letras del rótulo |
| `--vino` | `#AE2D28` | la copa, reservado para detalles |

Así la web y el logo son la misma cosa, no dos piezas pegadas.

## De dónde salen los datos

De su ficha de Google, aportada por el cliente:

| Dato | Valor |
|---|---|
| Nombre | La Fortaleza Bar-Restaurante |
| Dirección | Calle César González Ruano, 1 · 16004 Cuenca |
| Teléfono | 614 65 89 19 |
| Valoración | 4,2 sobre 5 opiniones |
| Categoría | Bar |
| Horario | Solo consta «Cierra a las 23:30» del día consultado |
| Sitio web | **No tiene.** Su ficha muestra «Añadir sitio web» |

**No hay ni un dato inventado.** Los tres primeros platos —croquetas caseras,
oreja y tortilla de patata— y lo de la terraza y el bar amplio salen
literalmente de sus propias reseñas. La hamburguesa y la ensalada con burrata
salen de las fotos que pasó el propio local. No hay precios en ninguna parte
porque no tenemos la carta.

## Las opiniones

Se publican **tres de las cinco**, las que tienen texto y 5 estrellas:

1. **Raquel H.** venía cortada por Google. Se ha cerrado donde la frase queda
   completa, sin inventar el final. Se han añadido las comas que faltaban.
2. **Aday C.** igual: se ha cerrado en punto y se ha puntuado («Comida
   espectacular. Las croquetas caseras y la oreja hay que pedirlas siempre, muy
   buenas.»). No se ha cambiado ninguna palabra.
3. **Luis G. T.** va entera, tal cual estaba.

La cuarta, de **Mario Morales**, es de 5 estrellas pero no tiene texto: no se
puede citar.

**La quinta no se publica**, y esta hay que hablarla con el cliente. Es de 1
estrella, de hace un mes, y va de precio: *«un tercio y un refresco 6,05 €, te
has pasado amigo»*. Dos cosas al respecto:

- **No está contestada.** Con solo cinco opiniones, una de una estrella se lleva
  la media de 5,0 a 4,2. Una respuesta educada del dueño —explicando qué
  incluye ese precio, o simplemente agradeciendo— vale más que diez reseñas
  buenas, porque la lee todo el que entra en la ficha.
- **Es un aviso sobre los precios en la web.** Si hay clientes sensibles al
  precio, la carta con precios visibles en la web juega a favor: quien llega ya
  sabe lo que va a pagar y no hay sorpresa en la mesa.

**No se ha puesto `aggregateRating` en los datos estructurados**, a propósito:
Google no admite que un negocio publique su propia valoración media y puede
penalizar el resultado enriquecido. El 4,2 sí aparece en el texto visible.

## La reserva

El formulario de `#reserva` **no envía nada a ningún servidor**: compone el
mensaje de WhatsApp con el día, la hora, el número de personas y si prefieren
terraza o dentro, y abre el chat con todo escrito. El cliente solo da a enviar,
y el bar confirma por WhatsApp, que es como funciona de verdad en un local así.

Detalles que importan:

- El campo de día tiene `min` en hoy: no se puede reservar para ayer.
- Debajo del botón se ve en todo momento el mensaje exacto que se va a enviar.
  Nadie envía algo sin saber qué pone.
- Si falta un campo, no abre WhatsApp: avisa de qué falta y lleva el foco ahí.
- Los botones de Terraza / Dentro / Da igual son `<input type="radio">` de
  verdad, solo que ocultos a la vista (`.sr`). Funcionan con teclado y con
  lector de pantalla.

## El horario en vivo

`script.js` trae un motor de horario **ya hecho y probado**, pero **apagado**,
porque de su ficha solo sabemos que cierra a las 23:30 —ni hora de apertura ni
días de descanso—. Mientras está apagado, la web muestra el texto fijo
«Cerramos a las 23:30», que es verdad y no compromete a nada.

Para encenderlo, cuando el local facilite el horario real:

1. Rellena `HORARIO` en `script.js`. La clave es el día según `Date.getDay()`
   (0 = domingo). Cada turno es `["HH:MM", "HH:MM"]` y un día cerrado es `[]`.
   Si un turno acaba de madrugada se escribe tal cual: `["20:00", "01:30"]`.
2. Pon `HORARIO_CONFIRMADO = true`.

A partir de ahí, el bloque de «Dónde estamos» dice en vivo «Abierto ahora,
cerramos a las X» o «Cerrado ahora, abrimos mañana a las X», y se refresca solo
cada minuto.

## Pendiente

- **La carta con precios.** Es lo que más falta. En `index.html` hay una sección
  de carta ya maquetada y **comentada**, con la línea de puntos entre plato y
  precio: se descomenta, se pone una `<li>` por línea y se añade
  `<a href="#carta">Carta</a>` al menú y al pie.
- **El horario completo**, para encender el motor de arriba.
- **Foto de la terraza y del comedor.** Los platos ya están; falta enseñar
  el sitio, que es lo que destacan en las reseñas.
- **Instagram o Facebook**, si tienen.
- **Aviso legal, privacidad y cookies**, vacíos en el pie.
- **El CID de su ficha**, para que el botón de opiniones lleve directamente a
  las reseñas en vez de a una búsqueda por nombre.

## Las fotos de los platos

Cinco, aportadas por el local. Todas pulsables: abren a pantalla completa.

| Archivo | Plato | Tamaño |
|---|---|---|
| `croquetas.jpg` | Croquetas caseras | 820 × 615 · 115 KB |
| `oreja.jpg` | Oreja a la plancha | 820 × 615 · 114 KB |
| `tortilla.jpg` | Tortilla de patata | 820 × 615 · 71 KB |
| `burrata.jpg` | Ensalada con burrata | 820 × 615 · 85 KB |
| `hamburguesa.jpg` | Hamburguesa | 620 × 827 · 85 KB |

Las cuatro primeras van recortadas a 4:3. **La hamburguesa venía vertical** y
recortarla a 4:3 le cortaba el pan, así que se queda a 3:4 con su propia
tarjeta. Por eso la fila de abajo usa columnas `9fr / 16fr`: con una foto a 3:4
y otra a 4:3, esa proporción hace que las dos salgan exactamente igual de
altas.

Todas van con `loading="lazy"` y con `width`/`height` puestos, para que el
navegador reserve el hueco y la página no dé saltos al cargar.

### Lo que aún falta fotografiar

1. **La terraza llena**, a media tarde, con gente. Es su mejor argumento y lo
   dice una reseña, pero no hay foto.
2. **La barra o el comedor** con el bar en marcha, que se vea que es amplio.

Con luz de día y sin flash. Exportar a JPEG de calidad 80, por debajo de 300 KB
cada una, y **1200 px de ancho como mínimo** (las que hay rondaban los 600 px
de origen; se ven bien, pero de un original grande se verían mejor).

## Tocar el contenido

- **Colores y tipografías**: bloque `:root` de `styles.css`.
- **Teléfono**: constante `TELEFONO` en `script.js` (sirve para WhatsApp) y los
  `href="tel:"` del HTML. Hay que cambiarlo en los dos sitios.
- **Almenas**: clase `.almenas`. Los dientes son del color de la sección de
  arriba y los huecos dejan ver la de abajo.
- **El logo**: `img/`. Cuatro archivos, dos tamaños en WebP y PNG.
- **Los platos**: `img/*.jpg`. Para cambiar uno, se sustituye el archivo con el
  mismo nombre y se ajustan `width`/`height` y el `alt` en `index.html`.

## Cosas que conviene comentar con el cliente

- **La reseña de 1 estrella sin contestar.** Lo primero de la lista.
- **Su ficha de Google no tiene web.** Cuando esta se publique hay que meter la
  dirección en la ficha: es de donde va a venir casi todo el tráfico.
- **Solo tienen 5 opiniones.** Pedirlas a los clientes habituales es gratis y
  es lo que más mueve la aguja en un bar de barrio: con 30 opiniones, una mala
  deja de pesar.
