# Tetería my Love — Torrejón de Ardoz

Web de una sola pantalla para una tetería con cachimbas. HTML, CSS y JavaScript
planos, sin build ni dependencias.

```
index.html    estructura y contenido
styles.css    estilos (paleta y tipografías en :root)
script.js     menú móvil, aparición al hacer scroll, botones de WhatsApp
img/          vacío por ahora — ver "Las fotos"
```

## De dónde salen los datos

De su ficha de Google, aportada por el cliente:

| Dato | Valor |
|---|---|
| Nombre | Tetería my Love |
| Dirección | Calle Estocolmo, 3 · 28850 Torrejón de Ardoz (Madrid) |
| Teléfono | 696 10 19 41 |
| Valoración | 4,4 sobre 20 opiniones |
| Categoría | Tetería tradicional |
| Horario | Solo consta «Abre a las 18:00» |

Todo lo que dice la web sale de ahí o de las propias reseñas. **No hay ni un
dato inventado**: ni sabores, ni precios, ni horario de cierre, ni servicios
que nadie haya confirmado.

De hecho, casi todo el texto de «Qué vas a encontrar» está sacado literalmente
de lo que escribieron sus clientes: el cambio de carbones sin pedirlo, el
parchís, lo de que es un sitio tranquilo y bonito, y que la gente se queda
entre media hora y dos horas (esto último es el dato de permanencia media que
publica Google en su ficha).

## Las opiniones

Se publican **dos de las tres** que aparecían en la ficha, las dos de 5
estrellas. Cómo se han tratado:

1. **Patricia B.** va entera, con su sugerencia incluida («deberían tener más
   bebidas y refrescos»). Se ha corregido «Si que» → «Sí que» y «super» →
   «súper», nada más. Dejarla completa es lo honesto y además se lee más creíble
   que un testimonio pulido; si el local prefiere recortarla, es su decisión,
   pero entonces hay que marcar el corte.
2. **Richar** venía cortada por Google. Se ha cerrado en un punto donde la frase
   queda completa y se ha marcado con `[…]` el trozo que se salta, que era
   «Cachimbas a 10 euros k en pocos sitios se ven». Se ha quitado **a propósito**:
   es un precio que dio un cliente hace dos años, no una tarifa del local, y
   publicarlo significa que alguien se planta allí esperando pagar eso.

**La tercera reseña no se publica.** Es de 2 estrellas y dice que a los hombres
se les obliga a pedir consumición y que el trato no es el mismo. Ningún negocio
pone en su web una reseña negativa, así que no está — pero **sí conviene que el
cliente sepa que está ahí**, pública en su ficha de Google, y que le contesten:
una respuesta educada del dueño en una reseña mala suele hacer más por la
reputación que diez buenas.

**No se ha puesto `aggregateRating` en los datos estructurados**, a propósito:
Google no admite que un negocio publique su propia valoración media y puede
penalizar el resultado enriquecido. El 4,4 sí aparece en el texto visible.

## Pendiente

- **La carta.** Es lo más importante que falta. La gente busca los sabores y el
  precio de la cachimba antes de decidir. En `index.html` hay una sección de
  carta ya maquetada y **comentada**, lista para rellenar: se descomenta, se
  pone una `<li>` por línea y se añade `<a href="#carta">Carta</a>` al menú y
  al pie. Mientras tanto, los botones «¿Qué sabores hay hoy?» y «Pregúntanos
  por la carta» abren WhatsApp con la pregunta ya escrita.
- **El horario completo.** Solo sabemos que abre a las 18:00; no hay hora de
  cierre ni días. La web dice justo eso y nada más. Con el horario real se
  monta la tabla de la semana en el bloque `.horario`.
- **Las fotos.** Ahora mismo la portada es un dibujo de una cachimba hecho en
  SVG, no una foto. Funciona y no depende de nadie, pero una tetería entra por
  los ojos: dos o tres fotos del local de noche, con las luces encendidas,
  cambian la página por completo. Ver «Fotos» más abajo.
- **Instagram**, si tienen. En este sector es donde está el público.
- **Aviso legal, privacidad y cookies**, vacíos en el pie.
- **El CID de su ficha de Google**, para que el botón de opiniones lleve
  directamente a las reseñas en vez de a una búsqueda por nombre.

## Fotos

Cuando las haya, van en `img/` y se monta una galería igual que en los otros
proyectos. Qué pedir:

- **El local de noche**, con las luces y los cojines. Es la foto que vende.
- **Una cachimba montada** en una mesa, con el vaso brillando.
- **Un té servido**, en vaso de cristal, con la tetera al lado.
- **Una mesa con el parchís** puesto. Cuenta lo que es el sitio mejor que un
  párrafo.

Sin flash directo: en un local oscuro lo aplasta todo. Mejor apoyar el móvil en
la mesa y dejar que entre la luz del propio local.

## Tocar el contenido

- **Colores y tipografías**: bloque `:root` de `styles.css`.
- **Teléfono de WhatsApp**: constante `WHATSAPP` en `script.js`. Aparece también
  en los `href="tel:"` del HTML, así que hay que cambiarlo en los dos sitios.
- **Mensajes de WhatsApp**: objeto `MENSAJES` en `script.js`. Cada botón lleva
  `data-wa` con la clave, y el cliente recibe la pregunta ya escrita.
- **El dibujo de la cachimba**: SVG en línea dentro de `.hero__arte`. Si se
  sustituye por una foto, se cambia el `<svg>` por un `<img>` y se le quita el
  `aria-hidden`.

## Cosas que conviene comentar con el cliente

- **La reseña de 2 estrellas** que mencionamos arriba. Merece respuesta.
- **Lo de «deberían tener más bebidas y refrescos»** sale en una reseña de hace
  diez meses y también en la que no publicamos. Si ya lo han solucionado, es
  justo lo que hay que contar en la web.
- **La ficha de Google no tiene web.** Cuando esta se publique, hay que meter la
  dirección en la ficha: es de donde va a venir la mayoría del tráfico.
