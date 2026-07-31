# Barbería — web con sistema de citas

```
index.html    estructura y contenido
styles.css    estilos (paleta y tipografías en :root)
script.js     navegación, estado de apertura, aparición al hacer scroll
reserva.js    el sistema de citas — toda la lógica está aquí
img/          fotos
```

Sin build ni dependencias: se abre haciendo doble clic en `index.html`.

## Qué hace el sistema de citas — y qué no

**Lo que hace, de verdad:**

- Calcula los huecos libres a partir del horario del local, la **duración real
  de cada servicio** y las citas ya ocupadas. Un corte de 30 min y un corte con
  barba de 45 min no ofrecen los mismos huecos.
- Respeta los dos turnos, los días de cierre y una antelación mínima
  configurable (por defecto, 1 hora).
- No ofrece huecos que se solapen con una cita existente ni que se salgan del
  turno.
- Deshabilita los días sin ningún hueco para el servicio elegido.
- Compone la petición con todos los datos y la envía por WhatsApp.

**Lo que NO hace, porque no hay servidor:**

- **No guarda la cita.** Llega como mensaje de WhatsApp; alguien tiene que
  apuntarla.
- **No comparte la disponibilidad entre visitantes.** Dos personas pueden pedir
  el mismo hueco a la vez. Con el volumen de una barbería pequeña pasa poco,
  pero pasa.
- No envía recordatorios ni permite cancelar online.

Esto es una **petición de cita con lógica de agenda real**, no una agenda
compartida. Conviene decírselo al cliente con estas palabras.

## Cómo convertirlo en una agenda de verdad

La lógica ya está preparada para ello. Hay que tocar dos sitios de `reserva.js`:

1. **`citasOcupadas(fechaISO)`** — ahora devuelve datos de demostración
   generados a partir de la fecha. Sustituirla por una llamada al servidor que
   devuelva `[{ inicio, fin }]` en minutos desde medianoche.
2. **El envío** — cambiar el bloque `wa.me` por un `fetch` que grabe la cita.

Todo lo demás (cálculo de huecos, pintado, validación) vale igual.

Opciones para ese servidor, de menos a más trabajo:

- **Contratar una herramienta ya hecha** (Booksy, Fresha, Treatwell, Reservio) e
  incrustarla. Es lo que usa la mayoría de barberías: agenda real, recordatorios
  y app para el barbero, desde gratis. La web se queda como está y el botón
  «Pedir cita» abre su widget.
- **Un backend propio** (por ejemplo Supabase o Firebase, que dan base de datos
  y API sin montar servidor). Semana y pico de trabajo, y pasa a haber costes
  recurrentes y responsabilidad sobre datos personales.

## Qué hay que configurar

Todo en la cabecera de `reserva.js`:

| Constante | Qué es |
|---|---|
| `SERVICIOS` | Nombre, **duración en minutos** y precio. La duración es lo que reserva la agenda. |
| `BARBEROS` | Quiénes atienden. |
| `HORARIO` | Turnos por día. `0` = domingo … `6` = sábado; lista vacía = cerrado. |
| `INTERVALO` | Cada cuántos minutos empieza un hueco (15 por defecto). |
| `DIAS_VISTA` | Cuántos días hacia delante se ofrecen (21). |
| `ANTELACION_MIN` | Margen mínimo para pedir cita (60 min). |
| `WHATSAPP` | Número en formato internacional, sin `+` ni espacios. |

`HORARIO` lo usan **el sistema de citas y el indicador de abierto/cerrado**, así
que solo se cambia en un sitio. La tabla de `#visitanos` en `index.html` sí hay
que actualizarla a mano para que coincida.

## Pendiente

- **Identificar el local.** El enlace aportado (`share.google/…`) está bloqueado
  por la política de red del entorno y no contiene el nombre. Faltan nombre,
  dirección y fotos.
- **Confirmar que el 633 67 58 49 tiene WhatsApp.** Es a donde llegan las
  peticiones de cita; si no lo tuviera, hay que cambiar el envío por un correo
  o un formulario con servidor.
- **Servicios, duraciones y precios reales.** Los actuales son un ejemplo
  razonable de barbería, no los suyos.
- **Horario real.**
- **El mapa**, que es un hueco.
- **Aviso legal, privacidad y cookies.** Con un formulario que recoge nombre y
  teléfono, en España son obligatorios.
