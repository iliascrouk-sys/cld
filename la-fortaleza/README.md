# La Fortaleza · Bar-Restaurante · Cuenca

La web del local. Una sola página: portada, la casa, la carta, el día, la
galería, grupos y reserva por WhatsApp.

**No hace falta saber programar para mantenerla.** Casi todo se cambia
abriendo un archivo con el Bloc de notas. Esta guía explica cómo.

---

## 1. Ver la web en tu ordenador

Haz **doble clic en `index.html`**. Se abre en el navegador y se ve tal cual
va a quedar. No hace falta internet ni instalar nada.

Si quieres verla como se verá en el móvil: con la web abierta pulsa `F12`,
y arriba a la izquierda del panel que sale hay un iconito de móvil.

---

## 2. Subirla a Hostinger

1. Entra en Hostinger → **Administrador de archivos** (*File Manager*).
2. Abre la carpeta **`public_html`**.
3. Si dentro hay algo de antes, bórralo.
4. Arrastra **todo lo que hay dentro de esta carpeta** ahí dentro.

Lo que tiene que quedar en `public_html`:

```
index.html          la web
styles.css          los colores y la maquetación
main.js             las animaciones
.htaccess           ajustes del servidor (no se toca)
README.md           esto que estás leyendo
lib/                manifest.js (LO QUE SE EDITA) + las librerías
assets/img/         las fotos
assets/fonts/       las letras
assets/credits.json de dónde sale cada imagen
```

> **Importante:** `.htaccess` empieza por un punto y **Windows lo esconde**.
> Si al subir la carpeta no aparece, activa «mostrar archivos ocultos» o
> súbelo aparte. La web funciona sin él, pero va más lenta.

Ya está. La web está publicada.

---

## 3. Cambiar textos, platos, horarios y fotos

**Todo se toca en un único archivo: `lib/manifest.js`.**

Ábrelo con el **Bloc de notas** (clic derecho → Abrir con → Bloc de notas).
Dentro verás bloques con esta pinta:

```js
telefono: "614 65 89 19",
```

**Se cambia solo lo que hay entre comillas.** Y tres reglas:

1. **No borres las comillas** `"` ni las comas `,`.
2. **No cambies lo de la izquierda** de los dos puntos (`telefono`, `nombre`…).
3. Al guardar, en el navegador pulsa **Ctrl + F5** (ver el punto 7).

### Los datos del local

Busca el bloque `brand:` y dentro cambia lo que necesites:

| Si quieres cambiar… | Cambia esta línea |
|---|---|
| El nombre | `nombre:` |
| El eslogan | `eslogan:` |
| El teléfono que se lee | `telefono:` |
| El WhatsApp | `whatsapp:` (ver abajo) |
| La dirección | `direccion:`, `codigoPostal:`, `ciudad:` |
| El Instagram | `instagram:` |
| El aforo | `aforo:` |

### El horario

Busca `horas:`. Hay una línea por día:

```js
{ dia: "Martes", corto: "MAR", turnos: [["9:30", "13:00"], ["18:30", "23:30"]] },
```

- Cada turno son dos horas: `["cuándo abre", "cuándo cierra"]`.
- Si un día tiene **un solo turno**, deja uno: `turnos: [["9:30", "16:00"]]`.
- Si un día **cierra**, se deja vacío y con `cerrado: true`:
  ```js
  { dia: "Lunes", corto: "LUN", turnos: [], cerrado: true },
  ```
- Si cierra de madrugada se escribe tal cual: `["19:00", "02:00"]`.

La tabla del horario de la web se rehace sola, y **el día de hoy se marca
solo** en color dorado.

---

## 4. La carta: cambiar, quitar y añadir platos

Busca el bloque `menu:` en `lib/manifest.js`. Cada plato es un bloque así:

```js
{
  id: "morteruelo",
  nombre: "Morteruelo",
  serie: "Casa",
  subtitulo: "El plato de Cuenca",
  ingredientes: "Hígado de cerdo, caza, pan, especias",
  texto: "El paté caliente de la sierra, hecho como se ha hecho siempre…",
  dibujo: "morteruelo"
},
```

### Cambiar un plato
Cambia el texto entre comillas de `nombre`, `subtitulo`, `ingredientes` o
`texto`. Ya está.

### Quitar un plato
Borra su bloque entero: **desde la llave `{` que lo abre hasta la llave `}` y
la coma que lo cierran.** La tarjeta desaparece de la web y el contador
(*01 / 10*) se ajusta solo.

### Añadir un plato
Copia un bloque entero, pégalo debajo del último y cámbiale los textos.

**Un detalle importante sobre `dibujo:`**

Cada plato lleva un dibujo hecho a mano en la web. Hay **diez dibujos**, y
son estos:

```
morteruelo   ajoarriero   zarajos    cordero    gazpacho-pastor
migas        croquetas    pisto      alaju      resoli
```

En `dibujo:` tienes que poner **uno de esos diez nombres**. Si pones uno que
no existe, el plato no sale.

Es decir: puedes reutilizar un dibujo para otro plato (por ejemplo, poner
`dibujo: "croquetas"` en unas croquetas de bacalao), pero **para un plato
totalmente nuevo con dibujo nuevo hay que pedirlo**, porque el dibujo se hace
uno a uno.

> La carta también está escrita dentro de `index.html`. Eso es a propósito:
> es la copia de seguridad para que la web se lea aunque falle el JavaScript
> o la vea Google. **Tú edita solo `manifest.js`**: es lo que se ve.

---

## 5. Cambiar las fotos

Las fotos están en **`assets/img/`**.

**La forma fácil (y recomendada):** guarda tu foto nueva con **el mismo
nombre** que la que quieres sustituir y cópiala encima. No hay que tocar
ningún archivo más.

| Archivo | Dónde sale |
|---|---|
| `hero.webp` | El fondo de la portada |
| `casa-1/2/3.webp` | Las tres fotos torcidas de «La casa» |
| `grupos.webp` | El fondo de «Grupos y celebraciones» |
| `g-*.webp` | Los mosaicos de la galería |
| `foto-*.webp` | Los platos que ya fotografiasteis |
| `logo.webp`, `logo-chico.webp` | El logo |

**Consejos para que se vean bien:**

- Con luz de día, sin flash.
- Al menos **1200 píxeles de ancho**.
- Guárdalas por debajo de **300 KB** cada una para que la web no vaya lenta.
- Formato `.webp` si puedes; si no, `.jpg` también vale (en ese caso hay que
  cambiar el nombre en `lib/manifest.js`, en el bloque `gallery:`).

**Lo que más ganaría la web ahora mismo:** una foto de la barra por la
mañana, otra del comedor con el mantel puesto y otra de una mesa larga con
gente. Las que hay de fondo son texturas, no fotos del local.

---

## 6. Cambiar el número de WhatsApp

El número aparece en **dos sitios**. Hay que cambiarlo en los dos.

**1) En `lib/manifest.js`** (bloque `brand:`):

```js
telefono: "614 65 89 19",
whatsapp: "34614658919",
```

- `telefono` es como se **lee** en la web. Con espacios, como quieras.
- `whatsapp` es el número **para el enlace**: sin espacios, sin `+`, y con
  el **34 de España delante**.
  → `614 65 89 19` se escribe `34614658919`.

**2) En `index.html`.** Ábrelo con el Bloc de notas y usa `Ctrl + B`
(Reemplazar) para cambiar `34614658919` por el número nuevo, y
`614 65 89 19` por el nuevo tal y como se lee. Dale a «Reemplazar todo».

> ¿Por qué en dos sitios? Porque el de `index.html` es el que funciona
> aunque el navegador del cliente tenga problemas. Es el cinturón y los
> tirantes.

---

## 7. He cambiado algo y no se ve

Es el navegador, que se guarda la web para ir más rápido. Dos soluciones:

**La rápida:** pulsa **`Ctrl + F5`** (en Mac, `Cmd + Shift + R`).

**La definitiva (para que les pase a todos los visitantes):**

Abre `index.html` con el Bloc de notas y busca `?v=20260814`. Sale unas
cuantas veces. Cambia esa fecha por la de hoy **en todas** (`Ctrl + B` →
Reemplazar todo). Por ejemplo `?v=20260901`.

Eso obliga a todos los navegadores del mundo a bajarse la versión nueva.
Hazlo cada vez que cambies `styles.css`, `main.js` o `lib/manifest.js`.

---

## 8. Si algo se rompe

`lib/manifest.js` es sensible a las comas y las comillas. Si te comes una,
la web se queda con los textos de fábrica (los que están en `index.html`) y
no se rompe del todo, pero tus cambios no salen.

**Qué hacer:**

1. Vuelve a abrir `lib/manifest.js` y revisa que cada línea acabe en coma y
   que las comillas estén cerradas.
2. Si no lo encuentras, **haz una copia del archivo antes de tocarlo**. Así
   siempre puedes volver atrás.

Consejo: antes de cambiar nada, copia `manifest.js` y llámalo
`manifest-copia.js`. Si algo falla, borras el roto y le quitas el `-copia`.

---

## Cómo está hecha (para quien venga después)

- HTML, CSS y JavaScript planos. **Sin npm, sin compilar, sin servidor.**
- Las únicas librerías son **GSAP** y **ScrollTrigger**, y están **dentro de
  `lib/`**. No se pide nada a internet al cargar la web.
- Las tipografías (**Fraunces**, **Manrope**, **Space Mono**, todas con
  licencia libre SIL OFL) están **alojadas en el propio sitio**, en
  `assets/fonts/`. Ni Google Fonts ni ningún CDN.
- Los **diez platos de la carta son SVG**, dibujados con geometría, no fotos.
  Por eso se ven nítidos a cualquier tamaño, pesan muy poco y se trazan solos
  al entrar en pantalla.
- **Todo el contenido importante está escrito en `index.html`.** El
  JavaScript solo adorna. Si no carga, la carta entera, el horario y el
  teléfono se siguen leyendo.
- Redes de seguridad: la pantalla de entrada se aparta sola por CSS a los
  4,5 s aunque falle el JavaScript, y a los 6 s un temporizador muestra
  cualquier cosa que se hubiera quedado escondida.
- El único elemento externo es **el mapa de Google** del pie. Si no carga,
  la dirección sigue escrita al lado.

### Datos pendientes de confirmar con el local

Estos datos se han dado por buenos para poder montar la web, pero **hay que
confirmarlos** antes de darla por cerrada:

- El **barrio** (se ha puesto «Casco Antiguo»).
- El **Instagram** `@lafortaleza.cuenca`.
- El **aforo** de 70 personas.
- El **año de apertura**, 2019.
- El **horario completo** por días.
- Si hay **precios** para poner en la carta.

Se cambian en `lib/manifest.js` como explica el punto 3.
