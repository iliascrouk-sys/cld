# El rincón de las mascotas — Mombuey (Zamora)

Web de una sola pantalla para una peluquería canina y tienda de mascotas.
HTML, CSS y JavaScript planos, sin build ni dependencias: se abre haciendo
doble clic en `index.html` y se publica subiendo la carpeta a cualquier
hosting estático.

```
index.html    estructura y contenido
styles.css    estilos (paleta y tipografías en :root)
script.js     antes/después, cita en tres toques, galería, WhatsApp
img/          fotos — ver img/README.md
```

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
| Horario | «Cierra a las 20:30» + el cartel de la tienda (mañanas de lunes a sábado, tardes de lunes a viernes) |

**No se ha puesto `aggregateRating` en los datos estructurados**, a propósito:
Google no admite que un negocio publique su propia valoración media y puede
penalizar el resultado enriquecido. El 5,0 sí aparece en el texto visible.

## Las tres reseñas

Son **reales**, de su ficha, firmadas con el nombre tal y como aparece allí
(incluido «jorge castilla» en minúscula, que es como lo escribió). Dos apuntes
sobre la transcripción:

1. La de **Raquel González** venía sin puntuar («Muy buen trato dueña maja
   ,precios muy bajos…»). Se han puesto comas y un punto; **no se ha cambiado
   ni una palabra**.
2. En la de **Miguel Fdez** se ha escrito «100 %» con espacio. Nada más.

## Lo que se mueve

Cuatro cosas, y ninguna por adorno:

- **Antes / después en la portada.** Se arrastra con el dedo, con el ratón o
  con las flechas del teclado. Es lo que vende una peluquería: el cambio.
  En móvil sube justo debajo del titular para que entre en la primera pantalla.
- **Cita en tres toques.** Quién viene → tamaño o pelo → qué necesita, y sale
  el mensaje de WhatsApp ya escrito. El objetivo es que nadie se quede
  bloqueado pensando cómo pedir hora.
- **Galería con filtros y visor** (flechas y `Esc` funcionan).
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
- **El horario exacto.** Faltan las horas de apertura; ahora la web dice solo
  mañanas de lunes a sábado, tardes de lunes a viernes y cierre a las 20:30,
  que es lo único que se sabe con certeza.
- **Los precios.** El «menos de 1 €/kg» **es una cita textual de una reseña**,
  y así aparece en la web, entrecomillado y con su autora. No es un precio
  publicado por la tienda: si quieren anunciarlo como tal, que confirmen la
  marca y el precio.
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
- **Las fotos son el trabajo pendiente de verdad.** Ver [`img/README.md`](img/README.md).
- **Instagram.** Una peluquería canina en un pueblo de 700 habitantes vive del
  boca a boca comarcal, y el antes/después es contenido que se comparte solo.
  Si abren perfil, el enlace va en el pie y en el `sameAs` de los datos
  estructurados.
