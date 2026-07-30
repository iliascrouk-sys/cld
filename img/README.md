# Fotos

Deja aquí las imágenes con **exactamente estos nombres** y la página las coge
sola. Mientras un archivo no exista, en su hueco se ve un marco con el nombre
del fichero en vez de un icono roto.

| Archivo | Dónde sale | Proporción | Tamaño recomendado |
|---|---|---|---|
| `hero.jpg` | Fondo de portada | Apaisada, 16:9 o más | 2400 × 1350 px |
| `croquetas-carabinero.jpg` | Plato destacado de la carta | 16:10 apaisada | 1600 × 1000 px |
| `g1.jpg` … `g4.jpg` | Franja de galería | Cuadrada 1:1 | 1200 × 1200 px |

Con seis fotos la página queda completa. Para la franja de galería van bien
dos de ambiente (sala, barra) y dos de plato.

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
