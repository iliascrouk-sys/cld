# Fotos

Deja aquí las imágenes con **exactamente estos nombres** y la página las coge
sola. Mientras un archivo no exista, en su hueco se ve un marco con el nombre
del fichero en vez de un icono roto.

| Archivo | Dónde sale | Origen | Tamaño |
|---|---|---|---|
| `hero.jpg` | Fondo de portada | La barra con la lámpara de troncos | 1000 × 1333 |
| `ensalada-la-cava.jpg` | Plato destacado de la carta | La ensalada de la casa | 1000 × 1333 |
| `g1.jpg` | Galería · «La sala» | La sala con la vitrina de vinos | **408 × 306** |
| `g2.jpg` | Galería · «De la carta» | Milhojas con pimiento asado | 1000 × 1000 |
| `g3.jpg` | Galería · «De la carta» | Pastel con coulis anaranjado | 1000 × 1000 |

Las cinco están ya colocadas. No se han recortado: se guardan enteras y el
recorte lo hace `object-fit` en el navegador, que lo adapta a cada pantalla.
El encuadre se ajusta con `object-position` en `styles.css` (portada al 28 %
para que entre la lámpara, plato destacado al 58 % para dejar fuera el cuenco
del fondo).

**`g1.jpg` va justa de resolución** —408 px de ancho para un hueco de unos
480— y se nota algo blanda. Si aparece el original de la cámara, se sustituye
y listo.

## Consejos

- **La de portada es la que más pesa en la primera impresión.** Mejor una foto
  del local con gente o de la barra, no un plato: el plato ya sale en la carta.
  Que tenga zona oscura o poco detalle en la parte de abajo y a la izquierda,
  que es donde va el texto.
- La del plato destacado se recorta a apaisada. Encuadra el plato centrado y
  deja aire arriba y abajo para que el recorte no se lo coma.
- Exporta a **JPEG de calidad 80** y por debajo de 300 KB cada una (la de
  portada puede llegar a 500 KB). Si puedes, exporta también `.webp`.
- No hacen falta filtros: la web ya les aplica un ajuste ligero de saturación
  y contraste para que todas casen entre sí.

## Al añadirlas

En `index.html`, cada foto va dentro de un `<figure class="ph">`. Añade el
tamaño real para que el navegador reserve el hueco y la página no dé saltos
al cargar:

```html
<figure class="ph lead__ph" data-label="img/croquetas-carabinero.jpg">
  <img src="img/croquetas-carabinero.jpg" alt="Croquetas de carabinero con ali-oli de ajo negro"
       width="1600" height="1000" loading="lazy" decoding="async">
</figure>
```

Y revisa el `alt`: describe lo que se ve, que es lo que leen los buscadores y
quien navegue con lector de pantalla.
