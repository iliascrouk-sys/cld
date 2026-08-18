# Fotos

## `portada.jpg` — puesta, pero es una miniatura

Es el fondo de la portada, detrás del titular. **Está funcionando**, pero
conviene saber qué hay exactamente:

| | |
|---|---|
| Medidas | **213 × 160 px** |
| Peso | 12,8 KB |
| Origen | La miniatura de la ficha de Google, no el original |

En una portada a pantalla completa esa imagen se amplía **casi siete veces**.
Que aguante no es casualidad: encima lleva un velo en degradado que va del 96%
de opacidad por la izquierda —donde está el texto— al 34% por la derecha. A esa
distancia el reescalado se lee como profundidad de campo y no como una foto
pixelada. Se probó también añadiéndole desenfoque y quedaba peor: le quitaba la
poca definición que le queda, y el todoterreno del elevador pasaba de
reconocerse a ser una mancha.

Está medido con la foto puesta: **todos los textos de la portada superan 5,2:1
de contraste** en escritorio y en móvil, cuando la norma pide 4,5:1.

### Qué se gana con el original

Si aparece la foto de verdad —el móvil con el que se hizo la sacó a unos
1350 px de ancho, y probablemente más—, basta con **sobrescribir este mismo
archivo**: no hay que tocar ni una línea de CSS.

Y entonces se puede ir más lejos: con resolución de sobra se puede **abrir el
velo** y dejar que la foto sea protagonista en vez de ambiente. Hoy no se hace
porque a 213 px, cuanto más se enseña, peor se ve.

Lo ideal: **1600 px de ancho o más**, horizontal, JPEG de calidad alta.

### El encuadre

`background-position: center 45%`, calculado sobre esta composición: el coche
oscuro en primer plano abajo a la izquierda, la fila de coches contra la pared
crema, la cercha blanca del techo y el todoterreno subido en el elevador a la
derecha. Al recortar a formato apaisado se conservan la cercha y el elevador, y
lo que se pierde es suelo por abajo y cubierta por arriba. Si se cambia por otra
foto distinta, hay que revisar ese valor.

Si con una foto mejor se ve demasiado apagada, en `.port__foto` se sube el
`brightness` y en `.port__velo` se bajan los primeros altos del degradado. Está
anotado en el CSS.

## Otras fotos que vendrían bien

- **Un coche en el elevador**, a media reparación. De lado y algo lejos: no hace
  falta que se lea la matrícula.
- **La máquina de diagnosis conectada**, en primer plano. Es el servicio que
  encabeza la web.

Con cualquiera de las dos se puede sustituir el panel gráfico de la sección
«Cómo se trabaja» por una foto real: los estilos de `.foto` ya están escritos en
`styles.css`.

Consejos: dispara con la luz del taller encendida **y** la puerta abierta, que
si no salen los fluorescentes verdosos; en horizontal siempre, que un fondo
recorta mejor; y manda el archivo **original**, sin pasarlo por WhatsApp ni
descargarlo de Google, que es lo que lo deja en 200 px.

## Marcas

Los logotipos de Volkswagen, Audi y BMW **no están aquí**: van escritos como SVG
dentro de `index.html`. Es la única forma de que el CSS pueda darles color, que
es lo que hace que los tres pesen lo mismo en la tira. Está explicado con un
comentario justo encima, en la sección `#marcas`.
