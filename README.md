# La Cava Gastrobar — web

Página de una sola pantalla para **La Cava Gastrobar**, Calle Poeta Diego Jesús
Jiménez 7, 16001 Cuenca. HTML, CSS y JavaScript planos: sin build, sin
dependencias, sin npm.

```
index.html      estructura y contenido
styles.css      estilos (paleta y tipografías en :root)
script.js       menú móvil, "abierto ahora", galería, aparición al hacer scroll
img/            fotos — ver img/README.md
```

Se abre haciendo doble clic en `index.html`. Para publicarla, sube la carpeta
entera a cualquier hosting estático: GitHub Pages, Netlify, Vercel, Cloudflare
Pages o FTP.

## Qué hace

- **Indicador de abierto/cerrado** en la barra, calculado en tiempo real desde
  el horario, con la fila de hoy resaltada en la tabla.
- **Portada a sangre** con zoom lento sobre la foto y los tres avales del local.
- **Carta** con un plato destacado y la lista de precios agrupada por secciones.
- **Bodega** en tabla con precio por copa y por botella.
- **Franja de galería** con visor a pantalla completa (`Esc` para cerrar).
- **Marcos de foto con nombre de archivo**: mientras una imagen no exista, se ve
  el hueco con su nombre en vez de un icono roto.
- Responsive, navegación por teclado, `prefers-reduced-motion`, estilos de
  impresión y `JSON-LD` de tipo `Restaurant`.

## Las fotos

Las cinco fotos del local están en `img/`, ya colocadas. El detalle de cuál es
cuál y cómo se encuadran está en **[`img/README.md`](img/README.md)**.

## Cambiar el horario

Vive en **tres sitios** y hay que actualizar los tres:

1. `HORARIO` en `script.js`
2. la tabla `#hoursTable` de `index.html`
3. `openingHoursSpecification` en el JSON-LD del `<head>`

`HORARIO` usa `0` = domingo … `6` = sábado:

```js
const HORARIO = {
  1: [],                                          // cerrado
  5: [["12:00", "16:30"], ["20:30", "23:30"]],    // dos turnos
};
```

Un tramo cuyo fin es anterior al inicio cruza la medianoche
(`["21:00", "01:30"]`), y el indicador de la barra lo tiene en cuenta.

## Pendiente antes de publicar

- **Nombrar los dos platos de la galería.** Salen con el pie genérico «De la
  carta» porque no se ha podido confirmar qué plato es cada uno.
- **Una foto de las croquetas de carabinero.** Son el plato más nombrado en
  las reseñas; con foto pasarían a ser el destacado de la carta.
- **Un original mejor de `g1.jpg`**, que va justa de resolución.
- **Comprobar el horario y el Solete.** El horario que aparece —lunes y martes
  cerrado, 12:00–16:30 y 20:30–23:00/23:30 el resto— viene de la maqueta de
  partida y **no coincide** con lo que muestra la ficha de Google, que indica
  apertura a las 20:30 sin días de cierre claros. Conviene confirmarlo.
- **El resto de la carta.** Están transcritos los entrantes, las ensaladas y
  toda la bodega. Faltan los principales y los postres.
- **Dos nombres de vino.** En la carta figuran «Finca Resalto» y «Pierola»; la
  web usa «Finca Resalso» y «Piérola Crianza», que son los nombres comerciales
  reales. Si se prefiere respetar la carta al pie de la letra, se cambian en
  la sección `#bodega`.
- **Aviso legal, privacidad y cookies.** Los tres enlaces del pie están vacíos.
  Son obligatorios en España en cuanto la web recoja datos personales.
- **Dominio.** El `<link rel="canonical">` apunta a `lacavagastrobar.es`, que es
  un ejemplo.
- **Redes.** No hay enlace a Instagram ni Facebook.

## Notas de implementación

**Tipografías.** Se cargan Fraunces y Archivo desde Google Fonts. Funciona, pero
en España conviene saber que eso envía la IP del visitante a Google y ha dado
problemas de RGPD; si se quiere evitar, hay que descargar los `.woff2`,
servirlos desde el propio dominio con `@font-face` y quitar los `<link>` del
`<head>`. La pila de reserva (Iowan/Palatino/Georgia y system-ui) está elegida
para que la página aguante bien si las fuentes no cargan.

**Sin `aggregateRating` en el JSON-LD.** A propósito: Google no admite
valoraciones que un negocio se autopublica y puede penalizar el resultado
enriquecido. El 4,6 sí aparece en el texto visible.

**El mapa** lleva un filtro suave para que case con el fondo oscuro. Invertirlo
del todo daría un mapa nocturno, pero también invertiría el logo y las
etiquetas de Google.

**Paleta.** Todo sale de `:root` en `styles.css`. Cambiando `--ink`, `--paper` y
`--brass` cambia la página entera.
