# Fotos

## Lo que ya está puesto

| Archivo | Dónde sale | Tamaño | Origen |
|---|---|---|---|
| `logo.png` | Cabecera (46 px), pie (64 px) y icono de la web | 320 × 320 | El logo del cliente, con el **fondo blanco recortado** para que funcione sobre el crema y sobre el tema oscuro |
| `favicon.png` | Pestaña del navegador | 64 × 64 | El mismo logo, reducido |
| `antes.jpg` | Portada · lado izquierdo del comparador | 319 × 511 | Foto del cliente |
| `despues.jpg` | Portada · lado derecho del comparador | 266 × 501 | Foto del cliente |

**Las dos fotos del perro llegaron reducidas** (319 y 266 px de ancho) y en la
portada se ven a 418 px, así que se notan algo blandas en pantallas grandes.
Si mandan **los originales del móvil**, se sustituyen con los mismos nombres y
ganan nitidez al instante. No hace falta tocar nada más.

Las dos no tienen el mismo encuadre —la del después está tomada más de cerca—,
así que la del después lleva un ajuste de encuadre en el CSS
(`.ph--despues img { object-position }`) para que la cabeza quede a la misma
altura a un lado y otro de la tira. Si se cambian las fotos, ese valor puede
necesitar un retoque.

## Lo que falta: las seis de la galería

Se pintan como marcos vacíos con una huella hasta que lleguen. Nombres y
proporciones:

| Archivo | Qué debería salir | Proporción | Ancho mínimo |
|---|---|---|---|
| `g1.jpg` | Peluquería · la mesa de trabajo | 1:1,22 (vertical) | 900 px |
| `g2.jpg` | Clientes · perro recién arreglado | 1:1 | 900 px |
| `g3.jpg` | Tienda · las estanterías | 1:1 | 900 px |
| `g4.jpg` | Tienda · correas y arneses | 1:1 | 900 px |
| `g5.jpg` | Clientes · otro perro | 1:1,22 (vertical) | 900 px |
| `g6.jpg` | Peluquería · el mostrador o la entrada | 1:1 | 900 px |

Todas se recortan solas al centro (`object-fit: cover`), así que lo importante
tiene que quedar en el medio.

## Cómo hacerlas

- **Las de tienda**: móvil en horizontal, luz de la tienda encendida y las
  estanterías ordenadas. Que se vea llena, que es lo que tranquiliza.
- **Las de perros**: móvil en vertical, a la altura del perro —no desde
  arriba—, recién terminados y con la alfombra despejada de pelo cortado.
- Sin flash, sin filtros y sin zoom digital: acercarse.
- Limpiar el objetivo antes; casi todas las fotos de tienda salen turbias por
  eso.

**Permiso**: si sale un perro con su dueño, basta con pedirles el «sí» de
palabra antes de publicar.

## Más antes y después

El comparador de la portada admite tantas parejas como quieran: cada nuevo
antes/después es contenido que se comparte solo. La regla es siempre la misma
—**misma posición, misma altura, mismo fondo**— y disparar antes de meterlo en
la bañera y justo al terminar.

## Peso

Antes de publicar conviene dejar cada foto en ~1600 px de ancho y calidad 80.
Las ocho así pesan menos de 1 MB en total y la web carga rápido también con la
cobertura del pueblo.
