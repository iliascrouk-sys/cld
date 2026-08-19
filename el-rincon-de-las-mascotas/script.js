/* ============================================================
   El rincón de las mascotas — Mombuey
   Sin dependencias externas.
   ============================================================ */

const q  = (s, c = document) => c.querySelector(s);
const qq = (s, c = document) => [...c.querySelectorAll(s)];

const TELEFONO = "34608196629";
const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Fotos que aún no existen ---------- */
/* Mientras no lleguen las fotos reales, el hueco se pinta como marco vacío
   en lugar de dejar el icono de imagen rota del navegador. */
qq(".ph img").forEach((img) => {
  const marcar = () => {
    img.setAttribute("data-missing", "1");
    img.parentElement?.setAttribute("data-vacia", "1");
  };
  img.addEventListener("error", marcar);
  if (img.complete && img.naturalWidth === 0) marcar();
});

/* ---------- Barra y menú móvil ---------- */
const bar = q("#bar"), botonMenu = q("#menu"), nav = q("#nav");

const pintarBarra = () => bar.classList.toggle("bar--fija", scrollY > 24);
pintarBarra();
addEventListener("scroll", pintarBarra, { passive: true });

const cerrarMenu = () => {
  bar.classList.remove("bar--abierta");
  botonMenu.setAttribute("aria-expanded", "false");
  botonMenu.setAttribute("aria-label", "Abrir menú");
};

botonMenu.addEventListener("click", () => {
  const abierto = bar.classList.toggle("bar--abierta");
  botonMenu.setAttribute("aria-expanded", String(abierto));
  botonMenu.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
});
nav.addEventListener("click", (e) => { if (e.target.closest("a")) cerrarMenu(); });

/* ---------- Enlace activo del menú ---------- */
const enlaces = qq('.nav > a[href^="#"]:not(.btn)');
const secciones = enlaces.map((a) => q(a.getAttribute("href"))).filter(Boolean);

if (secciones.length && "IntersectionObserver" in window) {
  const visibles = new Set();
  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => (e.isIntersecting ? visibles.add(e.target) : visibles.delete(e.target)));
    const activa = secciones.find((s) => visibles.has(s));
    enlaces.forEach((a) => a.classList.toggle("on", !!activa && a.getAttribute("href") === "#" + activa.id));
  }, { rootMargin: "-45% 0px -50% 0px" });
  secciones.forEach((s) => obs.observe(s));
}

/* ---------- Aparición al hacer scroll ---------- */
const aparecen = qq("[data-reveal]");
if ("IntersectionObserver" in window && !quieto) {
  const obs = new IntersectionObserver((entradas, o) => {
    entradas.forEach((e, i) => {
      if (!e.isIntersecting) return;
      e.target.style.transitionDelay = `${Math.min(i, 5) * 70}ms`;
      e.target.classList.add("dentro");
      o.unobserve(e.target);
    });
  }, { threshold: .1, rootMargin: "0px 0px -60px 0px" });
  aparecen.forEach((el) => obs.observe(el));
} else {
  aparecen.forEach((el) => el.classList.add("dentro"));
}

/* ---------- Barras de la valoración ---------- */
const repar = q(".repar");
if (repar) {
  if ("IntersectionObserver" in window && !quieto) {
    const obs = new IntersectionObserver((es, o) => {
      es.forEach((e) => { if (e.isIntersecting) { repar.classList.add("pinta"); o.disconnect(); } });
    }, { threshold: .4 });
    obs.observe(repar);
  } else {
    repar.classList.add("pinta");
  }
}

/* ---------- Antes / después ---------- */
const marco = q(".ad__marco"), rango = q("#adRango");

if (marco && rango) {
  const mover = (v) => marco.style.setProperty("--pos", `${v}%`);
  mover(rango.value);
  rango.addEventListener("input", () => mover(rango.value));

  /* El input de tipo rango solo salta al punto pulsado en algunos
     navegadores; con puntero propio el arrastre es igual en todos. */
  let arrastrando = false;
  const desdeEvento = (e) => {
    const r = marco.getBoundingClientRect();
    const v = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
    rango.value = String(v);
    mover(v);
  };
  marco.addEventListener("pointerdown", (e) => {
    arrastrando = true;
    marco.setPointerCapture(e.pointerId);
    desdeEvento(e);
  });
  marco.addEventListener("pointermove", (e) => { if (arrastrando) desdeEvento(e); });
  const soltar = (e) => {
    if (!arrastrando) return;
    arrastrando = false;
    if (marco.hasPointerCapture?.(e.pointerId)) marco.releasePointerCapture(e.pointerId);
  };
  marco.addEventListener("pointerup", soltar);
  marco.addEventListener("pointercancel", soltar);
}

/* ---------- Espuma de la portada ---------- */
const lienzo = q("#espuma");
if (lienzo && !quieto) {
  const ctx = lienzo.getContext("2d");
  const portada = q(".port");
  let burbujas = [], ancho = 0, alto = 0, animando = false, id = 0;

  const medir = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    ancho = portada.clientWidth;
    alto = portada.clientHeight;
    lienzo.width = ancho * dpr;
    lienzo.height = alto * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const nueva = (abajo = false) => ({
    x: Math.random() * ancho,
    y: abajo ? alto + Math.random() * 60 : Math.random() * alto,
    r: 4 + Math.random() * 22,
    v: .12 + Math.random() * .32,
    a: .05 + Math.random() * .13,
    f: Math.random() * Math.PI * 2,
    o: .25 + Math.random() * .55,
  });

  const sembrar = () => {
    const cuantas = Math.round(Math.min(34, Math.max(12, ancho / 42)));
    burbujas = Array.from({ length: cuantas }, () => nueva());
  };

  const pintar = () => {
    ctx.clearRect(0, 0, ancho, alto);
    for (const b of burbujas) {
      b.y -= b.v;
      b.f += .012;
      const x = b.x + Math.sin(b.f) * b.o * 14;
      if (b.y + b.r < -10) Object.assign(b, nueva(true));

      ctx.beginPath();
      ctx.arc(x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(150, 158, 104, ${b.a})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x - b.r * .3, b.y - b.r * .32, Math.max(1, b.r * .17), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${b.a * 2.1})`;
      ctx.fill();
    }
    id = requestAnimationFrame(pintar);
  };

  const arrancar = () => { if (!animando) { animando = true; id = requestAnimationFrame(pintar); } };
  const parar = () => { animando = false; cancelAnimationFrame(id); };

  medir(); sembrar(); arrancar();
  addEventListener("resize", () => { medir(); sembrar(); }, { passive: true });
  document.addEventListener("visibilitychange", () => (document.hidden ? parar() : arrancar()));

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? arrancar() : parar())), { threshold: 0 })
      .observe(portada);
  }
}

/* ---------- Pedir cita en tres toques ---------- */
const PASOS = [
  {
    clave: "quien",
    titulo: "¿Quién viene?",
    opciones: [
      { v: "perro", t: "Un perro" },
      { v: "gato",  t: "Un gato" },
      { v: "otro",  t: "Otro peludo", s: "conejo, hurón…" },
    ],
  },
  {
    clave: "detalle",
    titulo: (e) => (e.quien === "perro" ? "¿De qué tamaño?" : e.quien === "gato" ? "¿Cómo tiene el pelo?" : "¿Qué animal es?"),
    opciones: (e) =>
      e.quien === "perro"
        ? [
            { v: "pequeño", t: "Mini", s: "hasta 8 kg" },
            { v: "mediano", t: "Mediano", s: "de 8 a 20 kg" },
            { v: "grande",  t: "Grande", s: "más de 20 kg" },
          ]
        : e.quien === "gato"
        ? [
            { v: "de pelo corto", t: "Pelo corto" },
            { v: "de pelo largo", t: "Pelo largo" },
          ]
        : [
            { v: "un conejo", t: "Conejo" },
            { v: "un hurón",  t: "Hurón" },
            { v: "otro",      t: "Otro" },
          ],
  },
  {
    clave: "servicio",
    titulo: "¿Qué necesita?",
    opciones: [
      { v: "baño e hidratación", t: "Baño" },
      { v: "baño y corte",       t: "Baño y corte" },
      { v: "deslanado",          t: "Deslanado" },
      { v: "uñas y oídos",       t: "Uñas y oídos" },
      { v: "su primera peluquería", t: "Primera vez", s: "cachorro" },
      { v: "?",                  t: "No lo sé", s: "que me aconsejen" },
    ],
  },
];

const ficha = q(".ficha");
if (ficha) {
  const cajaOpc = q("#opc"), tituloPaso = q(".paso__t"), pasoN = q("#pasoN");
  const barraIn = q("#barraIn"), atras = q("#atras");
  const lista = q("#resumenL"), cta = q("#resumenCta"), rehacer = q("#rehacer");

  const elegido = {};
  let i = 0;

  const texto = (x, e) => (typeof x === "function" ? x(e) : x);

  const frase = () => {
    const { quien, detalle, servicio } = elegido;
    const sujeto =
      quien === "perro" ? `un perro ${detalle}` :
      quien === "gato"  ? `un gato ${detalle}` :
      detalle === "otro" ? "una mascota" : detalle;
    return servicio === "?"
      ? `¡Hola! Quería pedir cita en la peluquería para ${sujeto}. No sé muy bien qué necesita, ¿me aconsejáis?`
      : `¡Hola! Quería pedir cita en la peluquería para ${sujeto} y necesita ${servicio}. ¿Qué días tenéis hueco?`;
  };

  const pintarResumen = () => {
    const filas = [];
    if (elegido.quien) filas.push(PASOS[0].opciones.find((o) => o.v === elegido.quien).t);
    if (elegido.detalle) filas.push(texto(PASOS[1].opciones, elegido).find((o) => o.v === elegido.detalle).t);
    if (elegido.servicio) filas.push(PASOS[2].opciones.find((o) => o.v === elegido.servicio).t);

    lista.replaceChildren(
      ...(filas.length
        ? filas.map((t) => { const li = document.createElement("li"); li.textContent = t; return li; })
        : [Object.assign(document.createElement("li"), { className: "vacio", textContent: "Elige arriba y se va rellenando solo." })])
    );

    const listo = elegido.quien && elegido.detalle && elegido.servicio;
    cta.hidden = !listo;
    rehacer.hidden = !listo;
    if (listo) cta.href = `https://wa.me/${TELEFONO}?text=${encodeURIComponent(frase())}`;
  };

  const pintarPaso = () => {
    const paso = PASOS[i];
    tituloPaso.textContent = texto(paso.titulo, elegido);
    pasoN.textContent = String(i + 1);
    barraIn.style.width = `${((i + 1) / PASOS.length) * 100}%`;
    atras.hidden = i === 0;

    cajaOpc.replaceChildren(
      ...texto(paso.opciones, elegido).map((o) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = elegido[paso.clave] === o.v ? "on" : "";
        b.append(o.t);
        if (o.s) { const s = document.createElement("small"); s.textContent = o.s; b.append(s); }
        b.addEventListener("click", () => {
          /* Cambiar de animal invalida el detalle elegido antes. */
          if (paso.clave === "quien" && elegido.quien !== o.v) delete elegido.detalle;
          elegido[paso.clave] = o.v;
          if (i < PASOS.length - 1) i++;
          pintarPaso();
          pintarResumen();
        });
        return b;
      })
    );
  };

  atras.addEventListener("click", () => { if (i > 0) { i--; pintarPaso(); } });
  rehacer.addEventListener("click", () => {
    delete elegido.quien; delete elegido.detalle; delete elegido.servicio;
    i = 0; pintarPaso(); pintarResumen();
  });

  pintarPaso();
  pintarResumen();
}

/* ---------- Horario: abierto o cerrado ahora mismo ----------
   Tramos en minutos desde medianoche, por día de la semana (0 = domingo).
   Se calcula con el reloj del dispositivo, así que un móvil con la hora
   mal puesta dirá lo que le parezca; es el precio de no tener servidor. */
const HORARIO = [
  [],                                 // domingo
  [[600, 840], [960, 1230]],          // lunes
  [[600, 840], [960, 1230]],          // martes
  [[600, 840], [960, 1230]],          // miércoles
  [[600, 840], [960, 1230]],          // jueves
  [[600, 840], [960, 1230]],          // viernes
  [[600, 840]],                       // sábado
];
const DIAS = ["el domingo", "el lunes", "el martes", "el miércoles", "el jueves", "el viernes", "el sábado"];
const reloj = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

const estadoAhora = (ahora = new Date()) => {
  const dia = ahora.getDay(), min = ahora.getHours() * 60 + ahora.getMinutes();

  for (const [abre, cierra] of HORARIO[dia]) {
    if (min >= abre && min < cierra) return { abierto: true, texto: `Cierra a las ${reloj(cierra)}` };
  }
  const luego = HORARIO[dia].find(([abre]) => min < abre);
  if (luego) return { abierto: false, texto: `Abre hoy a las ${reloj(luego[0])}` };

  for (let i = 1; i <= 7; i++) {
    const d = (dia + i) % 7;
    if (!HORARIO[d].length) continue;
    const cuando = i === 1 ? "mañana" : DIAS[d];
    return { abierto: false, texto: `Abre ${cuando} a las ${reloj(HORARIO[d][0][0])}` };
  }
  return { abierto: false, texto: "" };
};

const pintarEstado = () => {
  const { abierto, texto } = estadoAhora();

  const sello = q("#sello");
  if (sello) {
    const eti = q("#estado");
    eti.textContent = abierto ? "Abierto ahora" : "Ahora cerrado";
    eti.classList.remove("mono");   /* el respaldo sin JS son horas; esto ya no */
    q("#estadoPie").textContent = texto;
    sello.dataset.abierto = abierto ? "si" : "no";
  }

  const ahora = q("#ahora");
  if (ahora) {
    q("#ahoraTxt").textContent = `${abierto ? "Abierto ahora" : "Cerrado ahora"} · ${texto.toLowerCase()}`;
    ahora.dataset.abierto = abierto ? "si" : "no";
    ahora.hidden = false;
  }

  const hoy = String(new Date().getDay());
  qq(".horario li").forEach((li) => li.classList.toggle("hoy", li.dataset.dias.split(",").includes(hoy)));
};

pintarEstado();
setInterval(pintarEstado, 60000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) pintarEstado(); });

/* ---------- Galería: visor ---------- */
const visor = q("#visor"), vMedio = q("#visorMedio"), vPie = q("#visorPie");
let foco = null, actual = 0;

const visibles = () => qq(".gal__c").filter((c) => !c.hidden).map((c) => q(".gal__b", c));

const mostrar = (n) => {
  const fotos = visibles();
  if (!fotos.length) return;
  actual = (n + fotos.length) % fotos.length;
  const b = fotos[actual];
  vMedio.replaceChildren(q(".ph", b).cloneNode(true));
  vPie.textContent = b.dataset.pie || "";
};

const abrirVisor = (b) => {
  foco = b;
  mostrar(visibles().indexOf(b));
  visor.hidden = false;
  document.body.style.overflow = "hidden";
  q("#visorX").focus();
};
const cerrarVisor = () => {
  visor.hidden = true;
  vMedio.replaceChildren();
  document.body.style.overflow = "";
  foco?.focus();
};

qq(".gal__b").forEach((b) => b.addEventListener("click", () => abrirVisor(b)));
q("#visorX").addEventListener("click", cerrarVisor);
q("#visorPrev").addEventListener("click", () => mostrar(actual - 1));
q("#visorNext").addEventListener("click", () => mostrar(actual + 1));
visor.addEventListener("click", (e) => { if (e.target === visor) cerrarVisor(); });

addEventListener("keydown", (e) => {
  if (!visor.hidden) {
    if (e.key === "Escape") cerrarVisor();
    if (e.key === "ArrowLeft") mostrar(actual - 1);
    if (e.key === "ArrowRight") mostrar(actual + 1);
    return;
  }
  if (e.key === "Escape") cerrarMenu();
});

/* ---------- WhatsApp desde los servicios y la tienda ---------- */
qq("[data-cita]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    const s = el.dataset.cita;
    const texto =
      s === "general" ? "¡Hola! Quería preguntaros una cosa sobre la tienda."
      : s === "una consulta de la tienda" ? "¡Hola! Quería saber si tenéis un producto en la tienda: "
      : `¡Hola! Quería pedir cita en la peluquería para ${s}. ¿Qué días tenéis hueco?`;
    open(`https://wa.me/${TELEFONO}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
  });
});

q("#year").textContent = String(new Date().getFullYear());
