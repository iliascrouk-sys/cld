/* ==========================================================================
   LA FORTALEZA · Bar-Restaurante · Cuenca
   --------------------------------------------------------------------------
   ESTE ES EL ARCHIVO QUE SE TOCA PARA CAMBIAR EL CONTENIDO DE LA WEB.

   Se abre con el Bloc de notas (o cualquier editor de texto) y se cambia
   solo lo que hay ENTRE COMILLAS. Ejemplo:

       telefono: "614 65 89 19",          <-- se cambia el numero
       telefono: "614 65 89 19"           <-- NO se quita la coma del final

   TRES REGLAS Y NO HAY MAS:
     1. No se borran las comillas ni las comas.
     2. No se cambia lo que va ANTES de los dos puntos (telefono, nombre...).
     3. Al guardar, en la web hay que pulsar Ctrl+F5 para ver el cambio.

   Si algo se rompe, se vuelve a la copia de seguridad de este archivo.
   ========================================================================== */

window.__FORTALEZA__ = {

  /* ---------------------------------------------------------------- MARCA
     Los datos del local. Esto es lo que mas se cambia.                    */
  brand: {
    nombre: "La Fortaleza",
    tipo: "Bar · Restaurante",
    eslogan: "De la primera caña a la última.",
    cocina: "Cocina castellana · Cuenca",

    /* El telefono, tal y como se quiere que se LEA en la web */
    telefono: "614 65 89 19",

    /* El mismo numero para WhatsApp, SIN espacios, SIN +, CON el 34 delante.
       614 65 89 19  se escribe  34614658919                                */
    whatsapp: "34614658919",

    direccion: "C. César González Ruano, 1",
    codigoPostal: "16004",
    ciudad: "Cuenca",
    barrio: "Casco Antiguo",

    instagram: "lafortaleza.cuenca",

    aforo: 70,
    anioApertura: 2019,

    /* Mensajes que se escriben solos al abrir WhatsApp */
    mensajeGrupos: "Hola, quería información para una comida de grupo en La Fortaleza.",
    mensajeRapido: "Hola, quería reservar mesa en La Fortaleza."
  },

  /* --------------------------------------------------------------- HORAS
     Horario del local. Un dia CERRADO se deja con turnos vacios: []
     Cada turno son dos horas: ["abre", "cierra"]                          */
  horas: [
    { dia: "Lunes",     corto: "LUN", turnos: [],                                      cerrado: true },
    { dia: "Martes",    corto: "MAR", turnos: [["9:30", "13:00"], ["18:30", "23:30"]] },
    { dia: "Miércoles", corto: "MIÉ", turnos: [["9:30", "13:00"], ["18:30", "23:30"]] },
    { dia: "Jueves",    corto: "JUE", turnos: [["9:30", "13:00"], ["18:30", "23:30"]] },
    { dia: "Viernes",   corto: "VIE", turnos: [["9:30", "13:00"], ["18:30", "02:00"]] },
    { dia: "Sábado",    corto: "SÁB", turnos: [["9:30", "16:00"], ["19:00", "02:00"]] },
    { dia: "Domingo",   corto: "DOM", turnos: [["9:30", "16:00"], ["19:00", "23:30"]] }
  ],

  /* --------------------------------------------------------------- CARTA
     Los diez platos del carrusel.

     PARA CAMBIAR UN PLATO: se cambia el texto entre comillas.
     PARA QUITAR UN PLATO:  se borra su bloque entero, desde la llave { que
                            lo abre hasta la llave } y la coma que lo cierran.
     PARA ANADIR UN PLATO:  se copia un bloque entero, se pega debajo y se
                            cambian sus textos. El dibujo (campo "dibujo")
                            tiene que ser uno de los que ya existen; si se
                            pone un nombre nuevo, el plato sale sin dibujo.

     serie:  "Casa"  o  "Temporada"
     dibujo: morteruelo · ajoarriero · zarajos · cordero · gazpacho-pastor
             migas · croquetas · pisto · alaju · resoli                    */
  menu: [
    {
      id: "morteruelo",
      nombre: "Morteruelo",
      serie: "Casa",
      subtitulo: "El plato de Cuenca",
      ingredientes: "Hígado de cerdo, caza, pan, especias",
      texto: "El paté caliente de la sierra, hecho como se ha hecho siempre: despacio y con las especias justas. Se sirve en cazuela de barro con pan tostado.",
      dibujo: "morteruelo"
    },
    {
      id: "ajoarriero",
      nombre: "Ajoarriero",
      serie: "Casa",
      subtitulo: "Bacalao de la casa",
      ingredientes: "Bacalao, patata, ajo, aceite",
      texto: "Bacalao desmigado y trabajado a mano hasta que liga solo. Suave, blanco y con el ajo en su sitio. Va con picatostes.",
      dibujo: "ajoarriero"
    },
    {
      id: "zarajos",
      nombre: "Zarajos",
      serie: "Casa",
      subtitulo: "Sarmiento y brasa",
      ingredientes: "Tripa de cordero, sarmiento de vid, limón",
      texto: "Enrollados en sarmiento y pasados por la brasa hasta quedar crujientes por fuera. Con un golpe de limón. Plato de barra, de los de pedir otra ronda.",
      dibujo: "zarajos"
    },
    {
      id: "cordero",
      nombre: "Cordero al horno",
      serie: "Casa",
      subtitulo: "Al horno, sin prisa",
      ingredientes: "Cordero lechal, ajo, vino blanco, patata panadera",
      texto: "Cordero lechal al horno con su patata debajo. Piel dorada, carne que se suelta sola. Se recomienda avisar al reservar.",
      dibujo: "cordero"
    },
    {
      id: "gazpacho-pastor",
      nombre: "Gazpacho de pastor",
      serie: "Temporada",
      subtitulo: "Guiso de monte",
      ingredientes: "Torta cenceña, caza, tomillo, ajo",
      texto: "Los galianos de toda la vida: torta cenceña cocida en el caldo de la caza, con tomillo. Plato de invierno y de cuchara larga.",
      dibujo: "gazpacho-pastor"
    },
    {
      id: "migas",
      nombre: "Migas de pastor",
      serie: "Temporada",
      subtitulo: "Pan, ajo y paciencia",
      ingredientes: "Pan del día anterior, panceta, uvas, ajo",
      texto: "Migas hechas al momento, sueltas, con su panceta y sus uvas frías al lado. Lo que se comía antes de que existieran los brunch.",
      dibujo: "migas"
    },
    {
      id: "croquetas",
      nombre: "Croquetas de la barra",
      serie: "Temporada",
      subtitulo: "De la barra",
      ingredientes: "Jamón, bechamel de la casa, pan rallado",
      texto: "Bechamel hecha en casa, sin atajos: cremosa dentro, crujiente fuera. Se piden de dos en dos y nunca sobra ninguna.",
      dibujo: "croquetas"
    },
    {
      id: "pisto",
      nombre: "Pisto con huevo",
      serie: "Temporada",
      subtitulo: "Huerta y sartén",
      ingredientes: "Pimiento, calabacín, tomate, huevo de corral",
      texto: "Pisto manchego cocinado despacio hasta que el tomate se hace caramelo, con un huevo de corral roto encima. Sencillo y redondo.",
      dibujo: "pisto"
    },
    {
      id: "alaju",
      nombre: "Alajú",
      serie: "Temporada",
      subtitulo: "El postre de Cuenca",
      ingredientes: "Miel, almendra, higo, oblea",
      texto: "Dulce árabe de Cuenca: miel, almendra e higo entre dos obleas. Un trozo pequeño, muy dulce, para cerrar la comida.",
      dibujo: "alaju"
    },
    {
      id: "resoli",
      nombre: "Resolí",
      serie: "Temporada",
      subtitulo: "El chupito de la casa",
      ingredientes: "Aguardiente, café, canela, corteza de naranja",
      texto: "El licor de Cuenca, servido frío. Café, canela y naranja. Es la señal de que la sobremesa va a durar.",
      dibujo: "resoli"
    }
  ],

  /* ------------------------------------------------------------ EL DIA
     Las cuatro franjas del local. Se cambian los textos igual que arriba. */
  jornada: [
    {
      momento: "Mañanas",
      horario: "9:30 → 13:00",
      titulo: "Desayunos y café",
      frase: "Tostada, café y la barra despierta.",
      icono: "taza"
    },
    {
      momento: "Mediodía",
      horario: "12:00 → 13:00",
      titulo: "Aperitivo y vermut",
      frase: "Caña, vermut y tapa de barra.",
      icono: "vermut"
    },
    {
      momento: "Fin de semana",
      horario: "Sáb y dom, hasta las 16:00",
      titulo: "Comidas de mesa larga",
      frase: "Mantel puesto, sobremesa larga.",
      icono: "cubiertos"
    },
    {
      momento: "Noches",
      horario: "18:30 → cierre",
      titulo: "Cenas y última copa",
      frase: "Cena tranquila. Viernes y sábado, hasta las 2:00.",
      icono: "luna"
    }
  ],

  /* -------------------------------------------------------------- FOTOS
     Los mosaicos de la galeria, repartidos en tres carriles.

     PARA CAMBIAR UNA FOTO: se mete la foto nueva en assets/img/ y se
     escribe aqui su nombre exacto, con su extension.
     Lo mas comodo es guardarla con el MISMO nombre que la que sustituye:
     asi no hay que tocar nada en este archivo.                            */
  gallery: [
    { src: "assets/img/g-brasa.webp",        alt: "La brasa encendida",              carril: 1 },
    { src: "assets/img/foto-croquetas.webp", alt: "Croquetas caseras",               carril: 1 },
    { src: "assets/img/g-cazuela.webp",      alt: "Guiso en cazuela de barro",       carril: 1 },
    { src: "assets/img/g-barra.webp",        alt: "La barra al mediodía",            carril: 1 },
    { src: "assets/img/foto-oreja.webp",     alt: "Oreja a la plancha",              carril: 1 },
    { src: "assets/img/g-pan.webp",          alt: "Pan del día",                     carril: 1 },

    { src: "assets/img/g-vino.webp",         alt: "Vino tinto de la casa",           carril: 2 },
    { src: "assets/img/foto-tortilla.webp",  alt: "Tortilla de patata",              carril: 2 },
    { src: "assets/img/g-mantel.webp",       alt: "Mesa puesta con mantel de tela",  carril: 2 },
    { src: "assets/img/g-madera.webp",       alt: "La madera de la barra",           carril: 2 },
    { src: "assets/img/foto-burrata.webp",   alt: "Ensalada con burrata",            carril: 2 },

    { src: "assets/img/g-ascua.webp",        alt: "Ascuas de la parrilla",           carril: 3 },
    { src: "assets/img/g-piedra.webp",       alt: "La piedra del casco antiguo",     carril: 3 },
    { src: "assets/img/foto-hamburguesa.webp", alt: "Hamburguesa de la casa",        carril: 3 },
    { src: "assets/img/g-aceite.webp",       alt: "Aceite de oliva",                 carril: 3 },
    { src: "assets/img/g-laton.webp",        alt: "El latón de la barra",            carril: 3 },
    { src: "assets/img/g-humo.webp",         alt: "El humo de la cocina",            carril: 3 }
  ]
};
