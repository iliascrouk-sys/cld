# Fotos

Deja aquí las imágenes con **exactamente estos nombres** y la página las coge
sola. Mientras un archivo no exista, en su hueco se ve un marco con el nombre
del fichero en vez de un icono roto.

| Archivo | Dónde sale | Proporción | Tamaño recomendado |
|---|---|---|---|
| `hero.jpg` | Fondo de portada | Apaisada, 16:9 o más | 2400 × 1350 px |
| `croquetas.jpg` | Plato destacado de la carta | 3:2 apaisada | 1600 × 1067 px |
| `morteruelo.jpg` | Carta | 4:5 vertical | 1000 × 1250 px |
| `ensalada.jpg` | Carta | 4:5 vertical | 1000 × 1250 px |
| `tortilla.jpg` | Carta | 4:5 vertical | 1000 × 1250 px |
| `quesos.jpg` | Carta | 4:5 vertical | 1000 × 1250 px |
| `torrijas.jpg` | Carta | 4:5 vertical | 1000 × 1250 px |
| `g1.jpg` … `g4.jpg` | Franja de galería | Cuadrada 1:1 | 1200 × 1200 px |

## Consejos

- **La de portada es la que más pesa en la primera impresión.** Mejor una foto
  del local con gente o de la barra, no un plato: el plato ya sale en la carta.
  Que tenga zona oscura o poco detalle en la parte de abajo y a la izquierda,
  que es donde va el texto.
- Las de la carta se recortan a vertical. Encuadra el plato centrado y deja
  aire alrededor para que el recorte no se lo coma.
- Exporta a **JPEG de calidad 80** y por debajo de 300 KB cada una (la de
  portada puede llegar a 500 KB). Si puedes, exporta también `.webp`.
- No hacen falta filtros: la web ya les aplica un ajuste ligero de saturación
  y contraste para que todas casen entre sí.

## Al añadirlas

En `index.html`, cada foto va dentro de un `<figure class="ph">`. Añade el
tamaño real para que el navegador reserve el hueco y la página no dé saltos
al cargar:

```html
<figure class="ph dish__ph" data-label="img/morteruelo.jpg">
  <img src="img/morteruelo.jpg" alt="Morteruelo conquense"
       width="1000" height="1250" loading="lazy" decoding="async">
</figure>
```

Y revisa el `alt`: describe lo que se ve, que es lo que leen los buscadores y
quien navegue con lector de pantalla.
