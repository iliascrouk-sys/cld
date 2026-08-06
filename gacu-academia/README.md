# GACU Academia — Cuenca

Web de una sola pantalla. HTML, CSS y JavaScript planos, sin build ni
dependencias.

```
index.html    estructura y contenido
styles.css    tipografías, paleta y estilos (todo en :root)
script.js     enrutado de los dos teléfonos, formulario, menú móvil, horario
fuentes/      los .woff2, alojados aquí — ver "Las tipografías"
img/          vacío por ahora — ver "El logo y las fotos"
```

## De dónde salen los datos

De su Instagram, [@gacu_academia](https://www.instagram.com/gacu_academia/),
que es la única presencia que tienen: perfil, biografía y los carteles que han
ido publicando.

| Dato | Valor | De dónde |
|---|---|---|
| Nombre | GACU Academia | Perfil |
| Dirección | Calle Lorenzo Goñi, 3 · Cuenca — **sin código postal** | Carteles |
| Teléfono · mates y FyQ | 604 835 167 | Biografía y carteles |
| Teléfono · inglés | 678 069 811 | Biografía y carteles |
| Materias | Matemáticas, Física y Química, Inglés | Biografía |
| Niveles | ESO, Bachillerato, EVAU/PAU, universidad | Carteles |
| Inglés | A2, B1, B2 y Magisterio; preparación del Aptis del British Council | Biografía y cartel |
| EVAU | Simulacros de examen y repaso intensivo, en matemáticas e inglés | Cartel de la PAU |
| Horario | **No aparece en ninguna parte** | — |
| Precios | **No aparecen en ninguna parte** | — |
| Sitio web | **No tienen** | — |

**No hay ni un dato inventado.** No hay precios, no hay horario, no hay
opiniones y no hay nombres de profesores, porque nada de eso consta.

## Lo que arregla esta web: los dos teléfonos

Es el problema real que tiene ahora mismo su Instagram. En la biografía pone:

> ☎️ 604 835 167 - 678 069 811

Dos números seguidos, sin decir cuál es cuál. Quien llama tiene un 50 % de
acertar. En los carteles sí se distingue —«Mates 604 835 167 / Inglés
678 069 811»—, pero hay que ampliar la imagen para leerlo.

Toda la web está construida alrededor de arreglar eso:

- En la portada, cada número va en su propia tarjeta **con la materia encima**.
- Cada tarjeta de «Las materias» termina en el teléfono de esa asignatura.
- El formulario de «Pedir plaza» **elige el número solo** según la materia, y
  enseña a cuál va a escribir antes de enviar.
- En «Dónde estamos» los dos vuelven a aparecer rotulados.

El enrutado vive en la constante `MATERIAS` de `script.js`. Si algún día una
materia cambia de profesor, se toca ahí y cambia en toda la web.

## El formulario de «Pedir plaza»

Cuatro campos —materia, curso, nombre y si prefieren mañana o tarde— y un
botón. **No hay servidor ni base de datos**: compone el mensaje, abre WhatsApp
con él escrito y la familia solo tiene que darle a enviar. La plaza la confirma
la academia por WhatsApp, que es como funciona de verdad.

Dos detalles pensados:

- **La vista previa dice a qué teléfono va.** Quien escribe sabe con quién está
  hablando antes de enviar nada.
- **El mensaje se lee como lo escribiría una persona**, no como un formulario.
  Si falta el nombre o el curso, la frase se recompone sola en vez de dejar
  huecos.

## El curso académico se calcula solo

La portada dice «Curso 26/27» y **nadie tiene que acordarse de cambiarlo**:
`cursoAcademico()` en `script.js` lo saca de la fecha, y a partir de julio ya
pasa al curso siguiente. Es un detalle pequeño con mucho recorrido: la mitad de
las webs de academias se quedan anunciando un curso que terminó hace dos años.

El HTML lleva escrito «26/27» como texto de reserva, por si alguien entra con
JavaScript desactivado.

## El diseño

- **La paleta sale de su logo**: el azul marino de las letras y el azul claro
  del tic. Los tonos exactos están sacados a ojo de la miniatura de Instagram;
  cuando llegue el logo original conviene afinarlos (ver `img/README.md`).
- **Fondo claro**, al revés que las webs de bares de este mismo repositorio. Una
  academia se consulta de día, casi siempre por un padre y casi siempre con
  prisa: lo que toca es que se lea, no que tenga ambiente.
- **El tic del logo es el hilo de toda la web.** Sale entre las letras del
  rótulo, hace de viñeta en todas las listas y es el favicon. Va como máscara
  CSS (la variable `--tic`) para poder darle color desde `:root`.
- **La portada es un papel cuadriculado** que se desvanece hacia abajo. Son dos
  degradados repetidos, sin ninguna imagen. Es el cuaderno de mates de toda la
  vida, y ahorra tener que poner una foto de archivo de gente estudiando.
- **El rótulo `GA✓CU` son letras de verdad**, no una imagen: el buscador lee
  «GACU» y el tic va en medio como SVG decorativo. El `<h1>` lleva
  `aria-label="GACU Academia en Cuenca"` para que un lector de pantalla no
  deletree «ga cu». **Ojo con duplicarlo**: si se añade una copia oculta del
  nombre, el buscador ve «GACUGACU».

## Las tipografías

**Manrope** para todo y **Newsreader** en cursiva para los remates de los
titulares, alojadas en `fuentes/` y declaradas con `@font-face` al principio de
`styles.css`. Manrope es variable: un solo archivo cubre de 400 a 800. Solo el
subconjunto latino: 86 KB entre las dos.

**No se enlazan a Google Fonts, y es una decisión deliberada.** Cargar una
tipografía desde `fonts.gstatic.com` manda la IP del visitante a Google, y en la
Unión Europea eso es una cesión de datos a un tercero sin consentimiento — hay
sentencias condenando a titulares de webs por ello. Alojándolas aquí, además,
la página carga antes: no hay que resolver ni conectar con otro dominio.

## El horario en vivo

`script.js` trae un motor de horario **ya hecho y probado**, pero **apagado**,
porque el horario no aparece en ninguna parte. Mientras está apagado, la web
dice lo único que consta —que hay grupos de mañana y de tarde— y remite a
WhatsApp.

Para encenderlo:

1. Rellena `HORARIO` en `script.js`. La clave es el día según `Date.getDay()`
   (0 = domingo). Cada turno es `["HH:MM", "HH:MM"]` y un día cerrado es `[]`.
   Una academia parte el día, y eso se escribe con dos turnos:
   `[["10:00","14:00"], ["16:00","21:00"]]`.
2. Pon `HORARIO_CONFIRMADO = true`.

A partir de ahí, el bloque de «Dónde estamos» dice en vivo si está abierta.

## Pendiente

- **El logo original.** Lo más urgente. Ver `img/README.md`.
- **El horario**, para encender el motor de arriba.
- **Los precios.** En `index.html` hay una sección de tarifas ya maquetada y
  **comentada**, lista para rellenar.
- **El código postal** de Lorenzo Goñi 3.
- **Las fotos**, sobre todo la del aula. Ver `img/README.md`.
- **Aviso legal, privacidad y cookies**, vacíos en el pie.
- **Confirmar tres cosas del contenido** antes de publicar:
  - Si en la EVAU dan también física y química. Su biografía junta «Matemáticas
    y FyQ, EVAU», pero el cartel de la PAU solo nombra matemáticas e inglés. La
    web pone EVAU en las tres materias siguiendo la biografía.
  - Si con el Aptis solo preparan el examen o además matriculan en él. La web
    dice «preparamos», que es lo seguro.
  - Qué es exactamente lo de «/magisterio» de su biografía. La web lo ha
    entendido como el certificado de inglés que se pide en el grado.

## Cosas que conviene comentar con el cliente

- **No tienen ficha de Google, solo Instagram.** Es lo más rentable que pueden
  hacer y es gratis: una ficha de Google Business sale en el mapa cuando alguien
  busca «academia en Cuenca», y ahí no están. Con la ficha creada, esta web se
  enlaza desde ella y empiezan a aparecer.
- **Sin ficha no hay reseñas, y sin reseñas falta lo que más convence.** Cuando
  la tengan, pedir opinión a las familias de siempre no cuesta dinero y es lo
  que más mueve la aguja. En esta web hay sitio de sobra para una sección de
  opiniones en cuanto existan.
- **Los precios.** Es la primera pregunta que hace un padre. Publicarlos filtra
  solas las llamadas y ahorra tiempo a los dos lados.
- **Publicar los carteles está bien, pero se pierden.** Un cartel de Instagram
  dura dos días en el feed; una web sale en las búsquedas todo el curso. Lo
  suyo es seguir publicando y que todos los carteles lleven la dirección de la
  web.

## Tocar el contenido

- **Colores y tipografías**: bloque `:root` de `styles.css`.
- **Teléfonos**: constantes `TEL_MATES` y `TEL_INGLES` en `script.js` y los
  `href="tel:"` del HTML. Hay que cambiarlos en los dos sitios.
- **Qué materia va a qué teléfono**: constante `MATERIAS` en `script.js`. Las
  claves son los `value` del desplegable de materias del formulario.
- **Cursos del formulario**: las `<option>` de `#curso-sel`. La última vale
  `otro` y el mensaje la trata aparte.
