# Bamboleo — Pub en Cuenca

Web de una sola pantalla. HTML, CSS y JavaScript planos, sin build ni
dependencias.

```
index.html    estructura y contenido
styles.css    tipografías, paleta y estilos (todo en :root)
script.js     menú móvil, motor de horario, botones de WhatsApp
fuentes/      los .woff2, alojados aquí — ver "Las tipografías"
img/          vacío por ahora — ver "Las fotos"
```

## De dónde salen los datos

De su ficha de Google, aportada por el cliente:

| Dato | Valor |
|---|---|
| Nombre | Bamboleo |
| Dirección | Calle Ramón y Cajal · 16004 Cuenca — **sin número** |
| Teléfono | 696 61 60 91 |
| Valoración | 5,0 sobre 8 opiniones, **todas de cinco estrellas** |
| Categoría | Pub |
| Horario | Solo se veía «Abre a las 20:00 del viernes» |
| Sitio web | **No tiene.** Su ficha muestra «Agregar sitio web» |

**No hay ni un dato inventado.** Los tres apartados de «Tres cosas que repiten»
—el ambiente, las copas y el trato— salen literalmente de sus opiniones. No hay
precios en ninguna parte porque no tenemos la carta.

**Falta el número de la calle.** Su ficha solo dice «C. de Ramón y Cajal,
16004 Cuenca». La web pone la calle sin número, que es lo que consta. Hay que
preguntárselo: sin número, quien no conozca el sitio no lo encuentra.

## Las opiniones

Son las tres que Google mostraba en el resumen de opiniones, con su texto
literal. Un matiz que conviene tener claro:

**Google las enseñaba sin nombre**, solo con la inicial del avatar. Por eso van
firmadas como «Opinión en Google» y no con un nombre: poner uno inventado sería
mentir, y poner solo una inicial suelta no aporta nada.

**Merece la pena entrar en su ficha y copiarlas enteras, con nombre y fecha.**
Una opinión firmada por una persona con nombre convence mucho más que una
anónima. Es cambiar tres líneas en `#dicen`.

**No se ha puesto `aggregateRating` en los datos estructurados**, a propósito:
Google no admite que un negocio publique su propia valoración media y puede
penalizar el resultado enriquecido. El 5,0 sí aparece en el texto visible.

## Por qué las opiniones van arriba

En la mayoría de estas webs las opiniones van al final. Aquí no: van justo
debajo de la portada y en cuerpo grande, en cursiva y a toda anchura.

El motivo es que **es lo mejor que tiene este local**. Ocho opiniones y las
ocho de cinco estrellas, sin una sola pega, es algo que casi ningún bar puede
enseñar. Esconderlo en el pie sería desaprovechar el único argumento
verdaderamente fuerte que hay ahora mismo.

## El diseño

- **Fondo casi negro con un resplandor cálido subiendo desde abajo.** Está
  hecho con dos degradados radiales, sin ninguna imagen, e imita la luz que
  baña la pared de piedra en sus fotos de Google. Encima lleva un grano
  finísimo para que el degradado no se vea a bandas.
- **La paleta sale de sus fotos**: el negro de la madera de la barra, el naranja
  brasa de los focos sobre la piedra y el verde jade de las banquetas.
- **El rótulo se balancea.** Cada letra de «Bamboleo» va en su propio `<span>`
  con un desplazamiento y un giro distintos. No es una animación: es lettering
  fijo, y es un guiño al nombre del local.
  El `<h1>` lleva `aria-label="Bamboleo"` para que los lectores de pantalla lo
  digan de una pieza, y el texto del documento sigue siendo «Bamboleo» a secas,
  que es lo que lee Google. **Ojo con duplicarlo**: si se añade una copia oculta
  del nombre, el buscador ve «BamboleoBamboleo».

## Las tipografías

**Bodoni Moda** para los titulares y **Barlow** para el texto, alojadas en la
carpeta `fuentes/` y declaradas con `@font-face` al principio de `styles.css`.
Solo el subconjunto latino: 206 KB en total.

**No se enlazan a Google Fonts, y es una decisión deliberada.** Cargar una
tipografía desde `fonts.gstatic.com` manda la IP del visitante a Google, y en la
Unión Europea eso es una cesión de datos a un tercero sin consentimiento — hay
sentencias condenando a titulares de webs por ello. Alojándolas aquí, además,
la página carga antes: no hay que resolver ni conectar con otro dominio.

## El horario en vivo

`script.js` trae un motor de horario **ya hecho y probado**, pero **apagado**,
porque de su ficha solo se veía «Abre a las 20:00 del viernes». Mientras está
apagado, la web muestra el texto fijo «Abrimos a las 20:00», que es verdad.

Para encenderlo:

1. Rellena `HORARIO` en `script.js`. La clave es el día según `Date.getDay()`
   (0 = domingo). Cada turno es `["HH:MM", "HH:MM"]` y un día cerrado es `[]`.
   En un pub el cierre de madrugada es la norma: `["20:00", "03:00"]`.
2. Pon `HORARIO_CONFIRMADO = true`.

El motor ya contempla que el turno de anoche siga vivo a las dos de la mañana,
que en un pub es el caso habitual y donde fallan casi todas estas webs.

## Pendiente

- **El número de la calle.** Lo más urgente.
- **El horario completo**, para encender el motor de arriba.
- **Las fotos.** Ver más abajo.
- **La carta de copas con precios.** En `index.html` hay una sección ya
  maquetada y **comentada**, lista para rellenar.
- **Instagram**, si tienen. En un pub es donde se anuncian las noches.
- **Las opiniones con nombre**, copiadas de su ficha.
- **Aviso legal, privacidad y cookies**, vacíos en el pie.
- **El CID de su ficha**, para que el botón de opiniones lleve directo a las
  reseñas en vez de a una búsqueda.

## Las fotos

Ahora mismo no hay ninguna: la página se sostiene con el rótulo, la luz y las
opiniones. Funciona, pero en un pub el sitio **es** el producto.

En su ficha de Google hay once fotos del interior y se ven muy bien: piedra
vista iluminada, la barra larga, las banquetas verdes. **No se han cogido de
ahí** porque son fotos alojadas por Google, a resolución de miniatura y con la
propiedad sin aclarar. Hay que pedirle los originales al local.

Qué pedir, por orden:

1. **La pared de piedra iluminada**, que es su sello y de donde sale toda la
   paleta de esta web.
2. **La barra en marcha**, de noche y con gente.
3. **Una copa recién preparada**, en primer plano.

De noche y sin flash: apoyar el móvil en la barra y dejar que trabaje la luz
del local. Exportar a JPEG de calidad 80 y **1200 px de ancho como mínimo**.

## Tocar el contenido

- **Colores y tipografías**: bloque `:root` de `styles.css`.
- **Teléfono**: constante `TELEFONO` en `script.js` y los `href="tel:"` del
  HTML. Hay que cambiarlo en los dos sitios.
- **El balanceo del rótulo**: reglas `.rotulo span:nth-child(n)`. Si cambia el
  nombre, hay que ajustar el número de reglas al número de letras.

## Cosas que conviene comentar con el cliente

- **Su ficha de Google no tiene web.** Cuando esta se publique hay que meter la
  dirección ahí: es de donde va a venir casi todo el tráfico.
- **Ocho opiniones es poco para lo bueno que es el dato.** Con un 5,0 limpio,
  pedir opiniones a los clientes de siempre es lo más rentable que puede hacer:
  no cuesta dinero y multiplica la visibilidad en las búsquedas de la zona.
- **Su ficha está confirmada por el negocio hace seis semanas**, así que alguien
  la mantiene. Esa persona es con quien hay que hablar.
