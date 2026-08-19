# El rincón de las mascotas — Mombuey (Zamora)

Web de una sola pantalla para una peluquería canina y tienda de mascotas.
HTML, CSS y JavaScript planos, sin build ni dependencias: se abre haciendo
doble clic en `index.html` y se publica subiendo la carpeta a cualquier
hosting estático.

```
index.html    estructura y contenido
styles.css    estilos (paleta y tipografías en :root)
script.js     antes/después, cita en tres toques, galería, WhatsApp
img/          logo y fotos — ver img/README.md
```

## La paleta sale de su logo

El oliva **#37391C** y el crema **#F7F0E3** están sacados directamente del
logo, así que la web y el rótulo hablan el mismo idioma. El naranja
(**#C0511F**) es el único acento y se reserva para lo que se toca: botones,
enlaces y el precio del pienso. Al logo se le ha recortado el fondo blanco
para que funcione igual sobre el crema, sobre el oliva del pie y en tema
oscuro.

## De dónde salen los datos

De su ficha de Google:

| Dato | Valor |
|---|---|
| Nombre | El rincón de las mascotas |
| Categoría | Especialista en el aseo de mascotas en Mombuey |
| Dirección | C. Rúa, 7 · 49310 Mombuey (Zamora) |
| Teléfono | 608 19 66 29 |
| Valoración | 5,0 sobre 16 reseñas |
| Servicio recogido en la ficha | Peluquería canina |
| Horario | Lunes a viernes 10:00–14:00 y 16:00–20:30 · Sábado 10:00–14:00 · Domingo cerrado (facilitado por la tienda) |

**No se ha puesto `aggregateRating` en los datos estructurados**, a propósito:
Google no admite que un negocio publique su propia valoración media y puede
penalizar el resultado enriquecido. El 5,0 sí aparece en el texto visible.

## Las tres reseñas

Son **reales**, de su ficha, firmadas con el nombre tal y como aparece allí
(incluido «jorge castilla» en minúscula, que es como lo escribió). Dos apuntes
sobre la transcripción:

1. La de **Raquel González** venía sin puntuar («Muy buen trato dueña maja
   ,precios muy bajos…»). Se han puesto comas y un punto; **no se ha cambiado
   ni una palabra**. También se ha **cortado la última frase** —la que daba el
   precio del pienso por kilo— por petición de la tienda: no quieren precios
   publicados. El corte cae en un punto donde la frase queda entera. Si algún
   día quieren recuperarla, es un `<p class="resena__t">` de `#opiniones`.
2. En la de **Miguel Fdez** se ha escrito «100 %» con espacio. Nada más.

## Lo que se mueve

Cuatro cosas, y ninguna por adorno:

- **Antes / después en la portada.** Con las fotos reales del cliente. Se
  arrastra con el dedo, con el ratón o con las flechas del teclado. Es lo que
  vende una peluquería: el cambio. En móvil sube justo debajo del titular para
  que entre en la primera pantalla.
- **Cita en tres toques.** Quién viene → tamaño o pelo → qué necesita, y sale
  el mensaje de WhatsApp ya escrito. El objetivo es que nadie se quede
  bloqueado pensando cómo pedir hora.
- **Horario vivo.** La web dice «abierto ahora, cierra a las 20:30» o «cerrado,
  abre mañana a las 10:00», calculado con el reloj del visitante a partir del
  horario real. Está en la portada y en «Dónde estamos», y marca la fila del
  día de hoy en la tabla.
- **Galería con visor** (flechas y `Esc` funcionan).
- **Barra fija en móvil** con llamar, WhatsApp y cómo llegar.

Todo respeta `prefers-reduced-motion`: con el ajuste del sistema activado se
apagan la espuma de la portada y las apariciones.

## Qué hay que confirmar antes de publicar

Lo marcado con `TODO` en `index.html`:

- **La lista de servicios.** Su ficha solo recoge «Peluquería canina». Los seis
  servicios de la web (baño, baño y corte, deslanado, uñas y oídos, cachorros,
  gatos) son los habituales del sector, **no salen de ninguna fuente suya**.
  Hay que validarlos uno a uno y quitar lo que no hagan.
- **Las categorías de la tienda.** Igual: salen de sus propias fotos
  (estanterías, correas, camas), pero conviene que las repase.
- **Nada de precios.** Por decisión de la tienda no se publica ningún precio,
  ni del pienso ni de la peluquería. Si algún día cambia de idea, el sitio
  natural es la sección de tienda.
- **Que el 608 19 66 29 tenga WhatsApp.** Toda la web empuja a ese canal. Si no
  lo tiene, hay que cambiar los botones por llamadas.
- **Aviso legal, privacidad y cookies.** El pie los tiene pendientes.

El teléfono aparece en `index.html` (enlaces `tel:`, texto visible y datos
estructurados) y en la constante `TELEFONO` de `script.js`. Si cambia, se
busca `608196629` y se sustituye en los dos archivos.

## Cosas que conviene comentar con el cliente

- **Su ficha de Google tiene botón «Sitio web».** Antes de nada, mirar a dónde
  lleva: puede ser un Facebook, un Instagram o una web antigua. Si esta web
  sustituye a esa, hay que actualizar el enlace en la ficha; si no, Google
  seguirá mandando a la otra.
- **Faltan las seis fotos de la galería** (peluquería, tienda y clientes) y
  vendrían bien los originales sin comprimir del antes y el después: los que
  llegaron son de ~300 px de ancho. Ver [`img/README.md`](img/README.md).
- **Instagram.** Una peluquería canina en un pueblo de 700 habitantes vive del
  boca a boca comarcal, y el antes/después es contenido que se comparte solo.
  Si abren perfil, el enlace va en el pie y en el `sameAs` de los datos
  estructurados.
