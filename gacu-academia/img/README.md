# Fotos y logo

Esta carpeta está vacía a propósito: **no hay ni una imagen del cliente**. Todo
lo que se ve en la web —el rótulo `GA✓CU`, el tic de las listas, el favicon y
la cuadrícula del fondo— está dibujado con CSS y con SVG escrito a mano.

## 1. El logo, lo primero

El rótulo de la web **imita** su logo (las letras «GA» y «CU» con el tic azul en
medio y «ACADEMIA» debajo), pero **no es su logo**: está compuesto con la
tipografía de la web porque lo único que había era la miniatura de su foto de
perfil de Instagram, a unos 150 px y con el borde circular recortado.

Hay que pedir el **archivo original**, y en este orden de preferencia:

1. **El SVG o el AI/EPS**, si lo tiene quien se lo diseñó. Es el bueno: se ve
   nítido a cualquier tamaño y pesa nada.
2. **Un PNG con fondo transparente de 1000 px o más.**
3. Como último recurso, el JPG más grande que tengan.

Cuando llegue: se guarda aquí como `logo.svg` (o `logo.png`) y se sustituyen el
bloque `.firma__marca` de la barra y el `.rotulo__marca` de la portada por una
`<img>`. Hasta entonces el rótulo actual cumple, pero **el logo de verdad
siempre gana**: es lo que la gente ya reconoce de su Instagram.

Conviene además sacar del original **los dos azules exactos** y meterlos en
`--marino` y `--azul`, en `styles.css`. Los de ahora están sacados a ojo de la
miniatura.

## 2. Las fotos

En una academia la foto no vende como en un restaurante, pero **una sí importa
mucho: la del sitio**. Un padre que va a dejar a su hijo dos tardes por semana
quiere ver dónde lo deja.

Qué pedir, por orden de utilidad:

1. **El aula.** Vacía, ordenada, con luz de día. Es la que tranquiliza.
2. **La entrada desde la calle**, con el portal de Lorenzo Goñi 3 reconocible.
   Sirve de foto y de indicación para llegar.
3. **Los profesores**, si quieren salir. En una academia pequeña es el mayor
   argumento que hay: se estudia con una persona, no con una marca. Y encaja
   solo en las tarjetas de «Las materias», junto al teléfono de cada uno.

Consejos: de día y junto a la ventana, nunca con flash; el móvil en horizontal;
y quitar de la mesa lo que no quieras que salga, que en foto se ve todo.
Exportar a JPEG de calidad 80 y **1200 px de ancho como mínimo**.

Sus publicaciones de Instagram **no valen** para esto: son carteles hechos con
plantillas de Canva, con el texto incrustado. Recortarlos para usarlos de foto
se nota, y además repetirían en la web lo que la web ya dice mejor.
