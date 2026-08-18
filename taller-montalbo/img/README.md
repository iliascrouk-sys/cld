# Fotos

**Ahora mismo no hay ninguna.** La web está hecha para aguantar sin ellas: donde
iría la foto del taller hay una pieza gráfica acabada, no un hueco gris. Pero
con fotos reales sube bastante, y en este oficio la de dentro del taller vale
más que cualquier texto: enseña que el sitio existe, que está limpio y que hay
coches en los elevadores.

## Cuál hace falta y dónde va

| Archivo | Dónde sale | Proporción | Mínimo |
|---|---|---|---|
| `taller.jpg` | Sección «Cómo se trabaja», a la derecha | 4:5 (vertical) | 1000 px de ancho |

Para ponerla, en `index.html` se busca el comentario `TODO FOTO` y se cambia
todo el bloque `<aside class="lienzo">…</aside>` por:

```html
<figure class="foto">
  <img src="img/taller.jpg" alt="Interior del taller, con los coches en los elevadores"
       width="1200" height="1500" loading="lazy" decoding="async">
</figure>
```

Los estilos de `.foto` ya están escritos en `styles.css` —recorte, proporción y
tratamiento de color incluidos—, así que no hay que tocar el CSS.

## Qué fotografiar

- **La nave desde la puerta**, con la persiana subida y la luz encendida. Es la
  que más tranquiliza: se ve el tamaño del taller y que hay trabajo dentro.
- **Un coche en el elevador**, a media reparación. Mejor de lado y algo lejos:
  no hace falta que se lea la matrícula.
- **La máquina de diagnosis conectada**, en primer plano. Es el servicio que
  encabeza la web y el que diferencia un taller que mira de uno que cambia
  piezas a ciegas.

Consejos: dispara con la luz del taller encendida **y** la puerta abierta, que
si no salen los fluorescentes verdosos; en horizontal si dudas, que recorta
mejor; y limpia el suelo del primer plano, que en foto se nota más que en vivo.

## Marcas

Los logotipos de Volkswagen, Audi y BMW **no están aquí**: van escritos como SVG
dentro de `index.html`. Es la única forma de que el CSS pueda darles color, que
es lo que hace que los tres pesen lo mismo en la tira. Está explicado con un
comentario justo encima, en la sección `#marcas`.
