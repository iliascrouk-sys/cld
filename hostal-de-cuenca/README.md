# Hostal de Cuenca

Rehecho sobre la web actual (`hostaldecuenca.com`). **El contenido es el suyo,
sin cambios**: los textos, las tarifas, los servicios y los puntos de interés
están transcritos de sus cuatro páginas. Lo que cambia es la presentación.

```
index.html    estructura y contenido
styles.css    estilos (paleta y tipografías en :root)
script.js     menú móvil, visor de galería, aparición al hacer scroll
img/          fotos — ver img/README.md
```

## Qué cambia respecto a la web actual

- **Cuatro páginas en una sola.** Inicio, El Hostal, Tarifas y Cómo llegar
  pasan a ser secciones de una misma página, con navegación que las enlaza.
- **Responsive.** La original tiene ancho fijo y en móvil obliga a hacer zoom;
  esta se adapta, con un botón de llamar fijo abajo.
- **El teléfono, siempre visible** y pulsable en la barra, en el pie y en la
  franja fija del móvil. En la original está en una imagen de la portada.
- **La tabla de tarifas se lee de un vistazo** y no se descuadra en móvil.
- Se conserva **el granate del logotipo** como color de marca.
- Se añaden datos estructurados de tipo `Hostel`, textos alternativos en las
  imágenes, navegación por teclado y estilos de impresión.

## Pendiente

- **Las fotos.** Ver [`img/README.md`](img/README.md).
- **La versión en inglés.** La web actual tiene selector `Es | en`; esta versión
  solo está en español. Traducirla es trabajo aparte.
- **Enlaces reales** de «Comentarios de nuestros clientes» (Booking, Ruralgest,
  InfoHostal) y del pie de Grupo Buenavista. Están como `#`.
- **Aviso legal, privacidad y mapa web.** La original tiene aviso legal; hay que
  traer el texto.
- **Dominio.** Falta el `canonical` y el `og:image` absoluto (hay un TODO en el
  `<head>`).
- **Correo electrónico.** No aparece en la web actual; si existe, conviene
  añadirlo.

## Cosas que convendría comentar con el cliente

- **La desinfección con ozono** ocupa un lugar destacado en la web actual.
  Se ha conservado, pero hoy dice menos que en 2020 y quizá interese quitarla.
- **«Doble individual»** es como figura en su tabla de tarifas. Se ha respetado,
  aunque a un cliente puede despistarle: no queda claro si es individual o doble.
- **«Habitación tripe»** era una errata de la tabla original; aquí pone
  «Habitación triple».
