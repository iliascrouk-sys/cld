# Jona Instalaciones Eléctricas

Web de una sola pantalla con sistema de petición de presupuesto. HTML, CSS y
JavaScript planos, sin build ni dependencias.

```
index.html    estructura y contenido
styles.css    tipografías, paleta y estilos (todo en :root)
script.js     menú móvil, lupa de fotos y el formulario de presupuesto
fuentes/      los .woff2, alojados aquí — ver "Las tipografías"
img/          las cinco fotos de obra
```

## ⚠ Lo primero: falta el teléfono

**La web no puede enviar presupuestos hasta que se ponga el móvil de la
empresa** en la constante `TELEFONO`, al principio de `script.js`:

```js
const TELEFONO = "34612345678";   // el 34 delante, sin espacios ni signos
```

Mientras esté en `null`, el formulario valida todo con normalidad y, al enviar,
avisa de que falta configurarlo **en vez de abrir un chat con un número
equivocado**. No se ha puesto un número de ejemplo a propósito: en la web de un
electricista, un teléfono mal manda clientes a un desconocido.

## Qué datos faltan y por qué no están inventados

De este negocio solo se ha podido confirmar el **nombre** y el **identificador
de su ficha de Google** (`CID 9831621773650152939`, sacado del enlace que
aportó el cliente y ya usado en el botón «Ver en Google»). El buscador de
Google está bloqueado desde el entorno donde se generó esta web, así que **no
se han podido leer la dirección, el teléfono, la valoración ni las reseñas**.

Hay que pedirle al cliente que copie y pegue su ficha de Google. Con eso se
rellenan:

| Dato | Dónde va |
|---|---|
| Teléfono | `TELEFONO` en `script.js` |
| Dirección y zona de trabajo | sección `#contacto` y `address` del JSON-LD |
| Valoración y nº de opiniones | sección nueva de opiniones |
| Reseñas con nombre | sección nueva de opiniones |
| Horario de atención | sección `#contacto` |

**Ni un dato inventado.** Los tres servicios de «Qué hacemos» son los únicos
que se pueden acreditar con sus propias fotos. No hay precios, ni años de
experiencia, ni «más de 500 clientes», ni certificaciones: nada de eso consta.

## El formulario de presupuesto

Es el centro de la web y donde está el trabajo de verdad. **No envía nada a
ningún servidor**: redacta el mensaje de WhatsApp con lo que rellena el cliente
y abre el chat con el texto puesto.

Recoge seis cosas, que son justo las que hacen falta para poder dar un número:

1. **Qué necesita** — instalación completa, reforma, iluminación, avería, otra.
2. **Dónde** — vivienda, local o negocio, obra nueva.
3. **La descripción**, en texto libre y con un ejemplo en el `placeholder` para
   que se entienda qué nivel de detalle ayuda.
4. **Nombre y teléfono**, para poder devolver la llamada.
5. **Localidad**, que decide si el trabajo entra en zona.
6. **Plazo** — cuanto antes, este mes, planificando.

Y sale un mensaje así:

```
Hola, quería presupuesto para una reforma en una vivienda.

Qué hay que hacer: Piso de 90 m² en reforma, hay que rehacer la
instalación entera y poner focos en salón y cocina.
Plazo: este mes

Nombre: Marta Ruiz
Teléfono: 611 22 33 44
Localidad: Cuenca
```

**Por qué esto importa más que un botón de WhatsApp suelto:** un electricista
recibe todo el día mensajes de «hola, ¿cuánto cuesta?» que obligan a tres
idas y venidas antes de saber siquiera de qué se habla. Esto llega ordenado y
legible a la primera. Es la diferencia entre una web que decora y una que
trabaja.

Detalles de la implementación:

- **La vista previa se enseña siempre antes de enviar**, en monoespaciada y con
  los saltos de línea reales. Nadie manda un mensaje sin ver qué pone.
- Si falta un campo obligatorio **no abre WhatsApp**: dice cuál falta y lleva el
  foco ahí.
- Las pastillas de opción son `<input type="radio">` de verdad, ocultos a la
  vista con `.oculto`. Funcionan con teclado y con lector de pantalla. El
  contenedor lleva `position: relative` para que los radios ocultos no se
  posicionen contra la página y la ensanchen.

## El diseño

**Nada de amarillos, rayos y fondos de circuito.** Lo que vende este negocio es
precisión y limpieza, y eso es exactamente lo que se ve en sus fotos: pared
blanca, cocina en grafito, listones de roble. La paleta sale de ahí:

| Variable | Color | De dónde |
|---|---|---|
| `--nieve` | `#F7F8F8` | la pared |
| `--grafito` | `#15181B` | la cocina y los marcos |
| `--roble` | `#C08E52` | los listones y la madera |

El único acento cromático es el roble, y se reserva para los números de
referencia y los detalles. Todo lo demás es grafito sobre blanco.

**La foto del cuadro eléctrico manda en la portada.** Es contraintuitivo —lo
bonito son el salón y la cocina— pero el cuadro es la prueba del oficio: quien
entiende algo ve al momento si está bien hecho, y quien no entiende, ve orden.
De ahí sale el titular: «El trabajo bien hecho se ve por dentro».

**La retícula de trabajos son dos filas con proporciones calculadas** para que
las fotos salgan igual de altas sin recortar ninguna:

- Fila 1: dos apaisadas a 4:3 → columnas `1fr / 1fr`.
- Fila 2: una cuadrada y una vertical a 3:4 → columnas `4fr / 3fr`, porque
  1 ÷ (3/4) = 4/3.

**La numeración de «Cómo funciona» sí significa algo**: es una secuencia real y
el cliente necesita saber en qué orden pasan las cosas antes de escribir. Los
números de las fotos son referencias de obra, no adorno.

## Las tipografías

**Sora** para los titulares, **IBM Plex Sans** para el texto e **IBM Plex Mono**
para los rótulos y las referencias. La monoespaciada no es un capricho: es el
idioma de la documentación técnica, y aquí etiqueta cifras y referencias, que es
su trabajo.

Alojadas en `fuentes/`, no enlazadas a Google Fonts. Cargar una tipografía desde
`fonts.gstatic.com` manda la IP del visitante a Google, y en la Unión Europea eso
es una cesión de datos a un tercero sin consentimiento — hay sentencias
condenando a titulares de webs por ello. Alojándolas, además, la página carga
antes. Subconjunto latino: 177 KB en total.

## Las fotos

| Archivo | Dónde | Tamaño |
|---|---|---|
| `cuadro.jpg` | Portada | 600 × 800 · 56 KB |
| `salon.jpg` | Trabajos · fila 1 | 800 × 600 · 48 KB |
| `cocina.jpg` | Trabajos · fila 1 | 800 × 600 · 59 KB |
| `bano.jpg` | Trabajos · fila 2 | 700 × 700 · 33 KB |
| `espejo.jpg` | Trabajos · fila 2 | 600 × 800 · 42 KB |

**Las cinco venían a entre 165 y 294 px de ancho**, tamaño de miniatura. Se han
reescalado con suavizado previo —para no realzar el bloqueo del JPEG—,
ampliación en dos pasos y enfoque con umbral. **Eso no inventa detalle**: se ven
más limpias, no más nítidas de verdad.

**Hay que pedirle los originales al cliente.** Que los mande por WhatsApp como
**documento** en vez de como foto, o por correo; si van como foto normal,
WhatsApp las vuelve a machacar.

### Lo que aún falta fotografiar

1. **Un cuadro en obra, a medio cablear.** El terminado es la prueba; el proceso
   es lo que genera confianza.
2. **Alguien trabajando.** Todas las fotos son de obra vacía y no aparece
   ninguna persona. Un electricista lo contratas por quién es, no por lo que
   sale en la foto.

## Robustez

- **Sin JavaScript se ve todo.** Un `<script>` en la cabecera pone la clase `js`
  en `<html>` antes de pintar, y solo con esa clase se ocultan los elementos que
  luego entran. Si el guion falla, la página aparece entera en vez de quedarse
  en blanco.
- **Con `prefers-reduced-motion: reduce`** no hay entradas ni desplazamientos.
- El menú móvil es inerte de verdad cuando está cerrado (`visibility: hidden;
  pointer-events: none`), no solo recortado: si solo se recorta, en iOS sigue
  capturando el gesto y la página no baja.
- `overflow-x: clip` en vez de `hidden`, que fuerza un contenedor de scroll y
  rompe el desplazamiento en iOS.
- Comprobado sin desbordes a 1440, 1000, 390 y 320 px.

## Pendiente

- **El teléfono.** Lo primero de todo.
- **La ficha de Google copiada**, para dirección, horario, valoración y reseñas.
- **Una sección de opiniones.** Es lo que más convence al contratar a un
  gremio y ahora mismo no hay ninguna.
- **Confirmar la lista de servicios.** Si además hacen boletines, urgencias,
  domótica, fotovoltaica o industrial, hay que decirlo: son búsquedas con mucha
  demanda que ahora mismo se están perdiendo.
- **Las fotos originales.**
- **Aviso legal, privacidad y cookies**, vacíos en el pie.

## Cosas que conviene comentar con el cliente

- **Un electricista se contrata por confianza.** Lo que más falta en esta web,
  por encima de cualquier efecto, son **opiniones con nombre** y el **número de
  registro de instalador autorizado**, si lo tiene. Eso vale más que cualquier
  rediseño.
- **La descripción libre del formulario es oro.** Cuando lleven un tiempo
  recibiendo peticiones, verán qué piden más y podrán ajustar la web a eso.
