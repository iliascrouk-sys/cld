# Alondra Nails — Parla

Web de una sola pantalla para un salón de manicura. HTML, CSS y JavaScript
planos, sin build ni dependencias.

```
index.html    estructura y contenido
styles.css    estilos (paleta y tipografías en :root)
script.js     menú móvil, visor de galería, botones de cita por WhatsApp
img/          fotos — ver img/README.md
```

## De dónde salen los datos

De su ficha de Google, aportada por el cliente:

| Dato | Valor |
|---|---|
| Nombre | Alondra Nails |
| Dirección | Calle Segovia, 9 · 28982 Parla (Madrid) |
| Teléfono | 642 11 98 36 |
| Valoración | 5,0 sobre 5 reseñas |
| Actividad | Manicuría |

## Las tres reseñas

Son **reales**, de su ficha de Google, y están firmadas con nombre e inicial
como aparecen allí. Tres apuntes sobre cómo se han transcrito:

1. La de **Intizar L.** venía cortada en Google (terminaba en «y siempre me
   deja las uñas…»). Se ha recortado en el punto donde la frase queda completa,
   sin inventar el final.
2. En la de **Szully A.** se ha corregido «exelentes» → «excelentes». Es la
   única palabra alterada; si prefieres respetar el original, se cambia en
   `#opiniones`.
3. Se han dejado algunos emojis y quitado los repetidos. En este sector los
   emojis dan autenticidad, pero cuatro seguidos en una web quedan mal.

**No se ha puesto `aggregateRating` en los datos estructurados**, a propósito:
Google no admite que un negocio publique su propia valoración media y puede
penalizar el resultado enriquecido. El 5,0 sí aparece en el texto visible.

## Pendiente

- **Las fotos.** Es lo más urgente: en manicura nadie reserva sin ver trabajos.
  Ver [`img/README.md`](img/README.md).
- **El horario.** Su ficha solo dice «Cierra a las 7:30 del domingo», que no da
  para una tabla semanal. La web no muestra horario: dice que se atiende con
  cita previa, que es lo habitual en el sector y además es verdad. Si facilitan
  el horario completo, se añade la tabla.
- **Servicios y precios.** La lista actual son los servicios habituales de un
  salón de manicura; **no vienen de su ficha**. Hay que confirmarlos y añadir
  precios.
- **Instagram.** El enlace del pie está vacío. En este sector es el canal
  principal y probablemente tengan cuenta con fotos aprovechables.
- **Aviso legal, privacidad y cookies**, vacíos en el pie.

## Cosas que conviene comentar con el cliente

- **Su ficha de Google muestra un botón «Sitio web».** Conviene mirar a dónde
  lleva antes de ofrecerles nada: puede ser un Instagram, un Booksy o una web
  que ya tengan.
- **Cinco reseñas son pocas**, aunque todas sean de cinco estrellas, y las tres
  publicadas son de hace dos años. Pedir reseñas a las clientas habituales es
  probablemente la acción más rentable que pueden hacer, más que la web.
- **Cita previa por WhatsApp.** Si el volumen crece, el sistema de reserva con
  huecos que está en [`../barberia/`](../barberia/) se adapta a este salón
  cambiando servicios, duraciones y horario.
