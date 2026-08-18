# Fotos

## La que falta: `portada.jpg`

Va de **fondo de la portada**, detrás del titular. La maqueta ya está hecha y
medida; solo faltan dos pasos:

1. Deja la foto aquí con el nombre **`portada.jpg`**.
2. En `styles.css`, busca `PARA PONER LA FOTO DE PORTADA` (regla `.port__foto`)
   y quita las dos barras de la línea `/* background-image: … */`.

Nada más. El recorte, el encuadre y el oscurecido ya están escritos.

**Por qué está comentada y no simplemente puesta:** una web publicada sin el
archivo pediría una imagen que no existe en cada visita. No se vería, pero
saldría un 404 por carga en la consola, en las analíticas y en cualquier
auditoría. Mejor dos pasos que un error permanente.

### Qué formato

Horizontal, **1600 px de ancho como mínimo** (es un fondo a pantalla completa;
con menos se ve blanda en monitores grandes). Guardada como JPEG de calidad
alta. La foto del interior del taller desde la puerta, con los coches en los
elevadores, es exactamente la que va.

### Sobre el oscurecido

Encima de la foto hay un velo en degradado: casi opaco por la izquierda, donde
está el texto, y abierto por la derecha, donde solo hay aire y la tarjeta de
datos. Está comprobado contra el peor caso posible —una foto de blanco puro— y
**todos los textos de la portada se mantienen por encima de 6:1 de contraste**,
muy por encima del 4,5:1 que exige la WCAG. O sea: entre cualquier foto y el
titular, gana el titular.

Si con la foto puesta se ve demasiado apagada, en `.port__foto` se sube el
`brightness` y en `.port__velo` se bajan los primeros altos del degradado. Está
anotado en el CSS.

## Otras fotos que vendrían bien

- **Un coche en el elevador**, a media reparación. De lado y algo lejos: no hace
  falta que se lea la matrícula.
- **La máquina de diagnosis conectada**, en primer plano. Es el servicio que
  encabeza la web y el que diferencia un taller que mira de uno que cambia
  piezas a ciegas.

Con cualquiera de las dos se puede sustituir el panel gráfico de la sección
«Cómo se trabaja» por una foto de verdad: los estilos de `.foto` ya están
escritos en `styles.css`.

Consejos: dispara con la luz del taller encendida **y** la puerta abierta, que
si no salen los fluorescentes verdosos; en horizontal siempre, que un fondo
recorta mejor; y limpia el suelo del primer plano, que en foto se nota más que
en vivo.

## Marcas

Los logotipos de Volkswagen, Audi y BMW **no están aquí**: van escritos como SVG
dentro de `index.html`. Es la única forma de que el CSS pueda darles color, que
es lo que hace que los tres pesen lo mismo en la tira. Está explicado con un
comentario justo encima, en la sección `#marcas`.
