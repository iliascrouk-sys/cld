# Bamboleo — Pub en Cuenca

Web de una sola pantalla. HTML, CSS y JavaScript planos, sin build ni
dependencias.

```
index.html    estructura y contenido
styles.css    tipografías, paleta y estilos (todo en :root)
script.js     menú móvil, motor de horario, botones de WhatsApp
fuentes/      los .woff2, alojados aquí — ver "Las tipografías"
img/          el logo y tres fotos del local
```

## De dónde salen los datos

De su ficha de Google, aportada por el cliente:

| Dato | Valor |
|---|---|
| Nombre | Bamboleo |
| Dirección | Calle Ramón y Cajal, 18 · 16004 Cuenca |
| Teléfono | 696 61 60 91 |
| Valoración | 5,0 sobre 8 opiniones, **todas de cinco estrellas** |
| Categoría | Pub |
| Horario | Solo se veía «Abre a las 20:00 del viernes» |
| Sitio web | **No tiene.** Su ficha muestra «Agregar sitio web» |

**No hay ni un dato inventado.** Los tres apartados de «Tres cosas que repiten»
—el ambiente, las copas y el trato— salen literalmente de sus opiniones. No hay
precios en ninguna parte porque no tenemos la carta.

**El número (18) lo aportó el cliente**, no la ficha de Google: allí solo
constaba «C. de Ramón y Cajal, 16004 Cuenca». Está puesto en la dirección, en
el pie, en los datos estructurados, en el enlace de «Cómo llegar» y en la
consulta del mapa incrustado, que ahora entra con un zoom más cerrado porque ya
apunta a un portal concreto y no a toda la calle.

**Conviene añadirlo también en su ficha de Google**, que es donde lo busca la
gente. Se hace desde «Sugerir una edición», o directamente si el local tiene la
ficha reclamada.

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

## La reserva

El formulario de `#reserva` **no envía nada a ningún servidor**: compone el
mensaje de WhatsApp con el día, la hora, cuántos son y qué se celebra, y abre
el chat con todo escrito. El cliente solo da a enviar, y el pub confirma por
WhatsApp, que es como se reserva de verdad en un sitio así.

Sale, por ejemplo:

> Hola, quería reservar en Bamboleo para el viernes, 21 de agosto a las 22:30.
> Somos 6 personas. Es un cumpleaños.

Detalles que importan:

- El campo de día tiene `min` en hoy: no se puede reservar para ayer.
- Debajo del botón se ve en todo momento el mensaje exacto que se va a enviar.
  Nadie manda algo sin saber qué pone.
- Si falta un campo no abre WhatsApp: avisa de qué falta y lleva el foco ahí.
- Las fechas se dicen en cristiano: «esta noche», «mañana» o «el viernes, 21 de
  agosto», no «21/08/2026».
- Los botones de motivo son `<input type="radio">` de verdad, ocultos a la vista
  con `.sr-solo`. Funcionan con teclado y con lector de pantalla.
- Los campos de fecha y hora llevan `color-scheme: dark`, para que el selector
  que pinta el navegador salga oscuro y no un cuadro blanco sobre la página.

**Se pregunta qué se celebra** —copas, cumpleaños o celebración— porque en un
pub eso cambia la respuesta: no es lo mismo guardar sitio para dos que preparar
una mesa para un cumpleaños de doce.

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

- **Añadir el número 18 a su ficha de Google.** La web ya lo lleva; la ficha no.
- **El horario completo**, para encender el motor de arriba.
- **Las fotos originales.** Las tres que hay son miniaturas de 165 px. Ver
  más abajo.
- **La carta de copas con precios.** En `index.html` hay una sección ya
  maquetada y **comentada**, lista para rellenar.
- **Instagram**, si tienen. En un pub es donde se anuncian las noches.
- **Las opiniones con nombre**, copiadas de su ficha.
- **Aviso legal, privacidad y cookies**, vacíos en el pie.
- **El CID de su ficha**, para que el botón de opiniones lleve directo a las
  reseñas en vez de a una búsqueda.

## El logo y las fotos

| Archivo | Dónde | Tamaño |
|---|---|---|
| `logo.png` | Barra (42 px) y pie (104 px) | 300 × 300 · 43 KB |
| `rotulo.jpg` | Tira · el rótulo de la entrada | 512 × 683 · 31 KB |
| `barra.jpg` | Tira · la barra | 512 × 683 · 60 KB |
| `sala.jpg` | Tira · la sala | 512 × 683 · 60 KB |

**El logo venía sobre fondo blanco.** Se ha recortado al disco con una máscara
circular aplicada al cuádruple de tamaño y reducida después, para que el borde
quede limpio y no a sierra. Ahora es un PNG con transparencia y se puede poner
sobre cualquier fondo.

En la barra va a 42 px: a ese tamaño la palabra de dentro no se lee, así que
**el nombre va también en texto al lado**. No es redundancia: el disco funciona
como marca y el texto es lo que se lee. En el pie va a 104 px, que ya sí es
legible.

### Las fotos son pequeñas, y hay que decirlo

**Las tres venían a unos 165 × 220 px**, que es tamaño de miniatura. Están
reescaladas a 512 px con este proceso, que es lo mejor que se puede hacer sin
un modelo de IA:

1. **Suavizado ligero antes de ampliar.** Venían de un JPEG muy comprimido; si
   se enfoca sin quitar antes el bloqueo, el enfoque realza los bloques.
2. **Ampliación en dos pasos** con Lanczos en vez de un salto de 3x de golpe:
   cada salto es menor y acumula menos halo.
3. **Enfoque con umbral**, para no realzar el ruido de las zonas oscuras, que
   en estas fotos son casi toda la imagen.

**Aun así, esto no inventa detalle que no esté.** Se ven algo más limpias, no
más nítidas de verdad.

Por eso **la tira las muestra pequeñas y las tres iguales**, como una tira de
contactos, en vez de a toda anchura: ampliarlas más las destroza. Es una
decisión de diseño tomada a partir del material que hay, no un capricho.

**Con los originales, esta sección puede crecer mucho.** La foto del rótulo
iluminado en la entrada es buenísima y daría para una portada a toda pantalla.
Hay que pedirle al local los archivos originales del móvil.

### Lo que aún falta fotografiar

1. **La barra en marcha**, de noche y con gente. La que hay está vacía.
2. **Una copa recién preparada**, en primer plano. Es lo que destacan las
   opiniones y no hay ninguna foto.

De noche y sin flash: apoyar el móvil en la barra y dejar que trabaje la luz
del local. Exportar a JPEG de calidad 80 y **1200 px de ancho como mínimo**.

## Tocar el contenido

- **Colores y tipografías**: bloque `:root` de `styles.css`.
- **Teléfono**: constante `TELEFONO` en `script.js` y los `href="tel:"` del
  HTML. Hay que cambiarlo en los dos sitios.
- **El balanceo del rótulo**: reglas `.rotulo span:nth-child(n)`. Si cambia el
  nombre, hay que ajustar el número de reglas al número de letras.
- **Las fotos**: `img/*.jpg`. Para cambiar una, se sustituye el archivo con el
  mismo nombre y se ajustan `width`/`height` y el `alt` en `index.html`.

## Cosas que conviene comentar con el cliente

- **Su ficha de Google no tiene web.** Cuando esta se publique hay que meter la
  dirección ahí: es de donde va a venir casi todo el tráfico.
- **Ocho opiniones es poco para lo bueno que es el dato.** Con un 5,0 limpio,
  pedir opiniones a los clientes de siempre es lo más rentable que puede hacer:
  no cuesta dinero y multiplica la visibilidad en las búsquedas de la zona.
- **Su ficha está confirmada por el negocio hace seis semanas**, así que alguien
  la mantiene. Esa persona es con quien hay que hablar.
