# Taller Mecánico Montalbo — web con sistema de citas

```
index.html    estructura, contenido y datos estructurados
styles.css    estilos (paleta y tipografías en :root)
script.js     configuración del taller, navegación y estado de apertura
reserva.js    el sistema de citas — toda la lógica está aquí
fuentes/      tipografías alojadas en el propio sitio
img/          fotos (ahora mismo vacío: ver img/README.md)
```

Sin build ni dependencias: se abre haciendo doble clic en `index.html` y se
publica subiendo la carpeta a cualquier hosting estático.

---

## ⚠ Lo que hay que confirmar con el cliente antes de publicar

Por orden de importancia:

1. **El nombre.** «Taller Mecánico Montalbo» es **provisional**: la ficha de la
   que salen los datos no lo traía. Cuando lo diga, se cambia con un buscar y
   reemplazar en `index.html` (sale en el `<title>`, la cabecera, los datos
   estructurados y el pie) y en la primera línea de `script.js`.
2. **El horario del sábado.** De lunes a viernes (8:00–14:00 y 16:00–20:00) es
   el real de su ficha. El sábado está puesto como **cerrado por prudencia**:
   es mejor que llamen a que se planten allí con la persiana bajada. Si abre,
   hay que corregirlo en **dos sitios**: `TALLER.horario` en `script.js` y la
   tabla «Horario» de `index.html`.
3. **La dirección exacta.** Ahora pone «Montalbo, Cuenca», sin calle ni número,
   porque es lo único que se sabe con certeza. Con la dirección completa
   conviene añadir también un mapa.
4. **Las reseñas.** La nota (4,3 sobre 28 opiniones) es real y está en los datos
   estructurados. Los textos de tres reseñas **no se han inventado**: hay que
   copiarlos literales de su ficha de Google, con el nombre de quien las
   escribió, donde el HTML lo indica con un `TODO`.
5. **La foto del taller.** Ver [`img/README.md`](img/README.md).

Los duraciones de cada trabajo en el sistema de citas (una pre-ITV, una hora;
una suspensión, dos) son estimaciones razonables, no datos suyos. Conviene
preguntárselas: son lo que decide qué huecos se ofrecen.

---

## Qué hace el sistema de citas — y qué no

**Lo que hace, de verdad:**

- Calcula los huecos libres a partir del horario del taller y de la **duración
  real de cada trabajo**. Una suspensión de dos horas y un equilibrado de 45
  minutos no ofrecen los mismos huecos: a las 18:30 solo cabe el segundo.
- Respeta los dos turnos y el parón de comida, salta los días de cierre y exige
  dos horas de antelación (configurable).
- Recoge lo que un taller necesita saber y una peluquería no: marca y modelo,
  matrícula y qué le pasa al coche.
- Ofrece marcar **recogida a domicilio**, que es uno de sus servicios.
- Compone la petición entera y la manda por WhatsApp al 665 50 72 05.

**Lo que NO hace, porque no hay servidor:**

- **No guarda la cita.** Llega como mensaje de WhatsApp; alguien tiene que
  apuntarla.
- **No sabe qué está ya ocupado.** Ofrece todos los huecos que caben en el
  horario. Con el volumen de un taller de pueblo y una confirmación por
  WhatsApp de por medio, es preferible ofrecer un hueco de más que ocultar uno
  que estaba libre.
- No manda recordatorios ni deja anular por la web.

Por eso la página dice **«petición de cita»** y no «cita confirmada», y lo
repite justo encima del botón. **Conviene decírselo al cliente con estas mismas
palabras**, para que no espere una agenda.

### Cómo convertirlo en una agenda de verdad

La lógica ya está preparada. Hay que tocar dos sitios de `reserva.js`, los dos
señalados con un comentario `⚙`:

1. **`citasOcupadas(fechaISO)`** — ahora devuelve una lista vacía. Sustituirla
   por una llamada al servidor que devuelva `[{ inicio, fin }]` en minutos desde
   medianoche. En cuanto devuelva datos, los huecos ocupados desaparecen solos y
   los días sin hueco se deshabilitan: eso ya está escrito.
2. **El envío** — cambiar el bloque `wa.me` por un `fetch` que grabe la cita.

Todo lo demás (cálculo de huecos, pintado, validación) vale igual.

Opciones para ese servidor, de menos a más trabajo:

- **Una herramienta ya hecha** e incrustada. Para talleres hay opciones de
  sector con agenda, recordatorios y ficha de vehículo. La web se queda como
  está y «Pedir cita» abre su widget.
- **Un backend propio** (Supabase o Firebase dan base de datos y API sin montar
  servidor). Semana y pico de trabajo, y a partir de ahí hay costes recurrentes
  y responsabilidad sobre datos personales.

---

## Dónde se toca cada cosa

| Qué | Dónde |
|---|---|
| Teléfono y WhatsApp | `TALLER.whatsapp` y `TALLER.telefono`, arriba de `script.js` |
| Horario | `TALLER.horario` en `script.js` **y** la tabla de `index.html` |
| Servicios de la web | sección `#servicios` de `index.html` |
| Servicios y duraciones de la cita | `SERVICIOS`, arriba de `reserva.js` |
| Antelación mínima, días a la vista | `ANTELACION_MIN` y `DIAS_VISTA` en `reserva.js` |
| Colores y tipografías | `:root`, arriba de `styles.css` |

El horario está **en un solo sitio** a propósito: de ahí salen a la vez la ficha
de portada, el aviso de «Abierto ahora» y los huecos que ofrece el sistema de
citas. Si se cambiara en un sitio y no en otro, la web mentiría.

---

## Detalles con motivo

- **Las tipografías están alojadas aquí** (`fuentes/`) y no enlazadas a Google
  Fonts: así no se manda la IP de cada visitante a un tercero —en la UE es una
  cesión de datos con sentencias detrás— y la página carga antes.
- **No hay `<link rel="preload">` para las tipografías.** El preload obliga a
  pedirlas en modo CORS, y eso las rompe al abrir el sitio con doble clic
  (`file://`), que es como se revisa. En un dominio real ahorraría unos
  milisegundos; no compensa que el cliente lo vea mal en su ordenador.
- **Los logos de marca van en línea en el HTML**, no como `<img src="…svg">`.
  Un SVG cargado con `<img>` es otro documento y su `currentColor` resuelve a
  negro, así que no habría forma de darle color desde el CSS —y los tres
  saldrían negros sobre negro—. Con máscara CSS sí se podría, pero
  `mask-image` también exige CORS y se rompe con doble clic.
- **No hay precios.** En mecánica, un «desde 90 €» que luego no se cumple hace
  más daño que no poner nada. La web lo dice y explica el orden: se mira, se
  llama con un presupuesto cerrado, y decide el cliente.
- **Sin JavaScript se ve todo.** Las apariciones al hacer scroll parten de
  invisible solo si hay JS (lo marca una clase que pone el `<head>`); si el
  guion falla, la página se ve entera de golpe en vez de quedarse en blanco.
- **Se respeta `prefers-reduced-motion`**: sin animaciones ni scroll suave para
  quien lo tenga activado.
- **Contraste**: todo el texto que dice algo pasa el AA de la WCAG (4,5:1). Los
  únicos que se quedan en 3:1 son los ordinales «01…06» de las tarjetas de
  servicio, que son decoración pura, no se referencian en ningún sitio y van en
  `aria-hidden`.
- **Datos estructurados** de tipo `AutoRepair` con horario, nota media y
  servicios, más un bloque de preguntas frecuentes. Es lo que permite que
  Google enseñe las estrellas y los desplegables en el resultado de búsqueda.

## Aviso de marcas

Volkswagen, Audi y BMW son marcas registradas de sus titulares. El taller es
independiente y no está afiliado a ninguna: la web lo dice expresamente en el
pie, que es lo que corresponde cuando se usan logotipos ajenos para indicar con
qué se trabaja.
