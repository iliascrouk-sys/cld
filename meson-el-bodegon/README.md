# Mesón El Bodegón — Cuenca

Web de una sola pantalla. HTML, CSS y JavaScript planos, sin build ni
dependencias.

```
index.html    estructura y contenido
styles.css    estilos (paleta y tipografías en :root)
script.js     menú móvil, "abierto ahora", visor de galería
img/          fotos — ver img/README.md
```

## De dónde sale el contenido

El local no tiene web. **No se ha podido abrir su ficha de Google**: el dominio
está bloqueado por la política de red del entorno donde se construyó esto. Lo
que sí venía en el enlace son el nombre y las **coordenadas exactas**
(40.0713984, -2.1355976), que es lo que usa el mapa.

El resto —dirección, teléfono, horario, platos, valoración y precio medio—
viene de fuentes públicas: Restaurant Guru, Guía Repsol, Tripadvisor, Foursquare
y el turismo de Cuenca. **Nada de esto está confirmado con el local.**

## Qué hace

- **Indicador de abierto/cerrado** en la portada, calculado desde el horario,
  con la fila de hoy resaltada en la tabla.
- Carta agrupada en tres bloques, galería con visor, mapa embebido en las
  coordenadas reales y botón de llamar fijo en móvil.
- Responsive, navegación por teclado, `prefers-reduced-motion`, estilos de
  impresión y `JSON-LD` de tipo `Restaurant` con geolocalización.

## Pendiente de confirmar con el local

Por orden de importancia:

1. **El horario.** Unas fuentes dan cerrado solo el lunes y otras lunes y
   martes. La web muestra la segunda versión, con un aviso visible. Vive en tres
   sitios: `HORARIO` en `script.js`, la tabla `#horario` de `index.html` y el
   JSON-LD del `<head>`.
2. **La dirección.** Aparece como «Cerro San Cristóbal, 1» y como «Cerro San
   Cristóbal, A1» según la fuente.
3. **Los precios de la carta.** No constan en ninguna parte. Los platos van sin
   precio; solo figura el ticket medio de 26 €.
4. **El Solete de la Guía Repsol.** Su ficha aparece en el listado de Soletes,
   pero no está verificado. Ahora mismo **no** se afirma en la página.
5. **Las reseñas.** El 4,4 sobre 2.571 es de Restaurant Guru, no de Google. Si
   se quiere citar Google, hay que sacar la cifra de su ficha. El enlace de
   «Leer las reseñas» está sin destino.
6. **El Facebook.** El enlace apunta a `facebook.com/elbodegondecuenca`, que
   parece el suyo pero no está comprobado.
7. **Los originales de las fotos.** Las tres colocadas van muy justas de
   resolución. Ver [`img/README.md`](img/README.md).
8. **La galería.** Se retiró: con tres fotos no tenía sentido. Vuelve en cuanto
   haya cuatro más (está en el historial de git).
9. **Aviso legal, privacidad y cookies**, vacíos en el pie.
