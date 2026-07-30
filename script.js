/* ============================================================
   La Cava Gastrobar — comportamiento
   Sin dependencias externas.
   ============================================================ */

/* ------------------------------------------------------------
   1. Horario
   ------------------------------------------------------------
   Clave = día según Date.getDay() (0 = domingo … 6 = sábado).
   Valor = lista de tramos ["HH:MM", "HH:MM"]. Lista vacía = cerrado.
   Un tramo cuyo fin es anterior al inicio cruza la medianoche.

   Al cambiarlo hay que tocar también la tabla #hoursTable de
   index.html y el bloque openingHoursSpecification del JSON-LD.
   ------------------------------------------------------------ */
const HORARIO = {
  0: [["12:00", "17:00"]],                        // domingo
  1: [],                                          // lunes — cerrado
  2: [],                                          // martes — cerrado
  3: [["12:00", "16:30"], ["20:30", "23:00"]],    // miércoles
  4: [["12:00", "16:30"], ["20:30", "23:00"]],    // jueves
  5: [["12:00", "16:30"], ["20:30", "23:30"]],    // viernes
  6: [["12:00", "16:30"], ["20:30", "23:30"]],    // sábado
};

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

/* ------------------------------------------------------------
   2. Fotos que aún no existen
   ------------------------------------------------------------
   Marcamos la imagen para que se vea el marco con el nombre del
   fichero en lugar de un icono roto. Al añadir la foto real, esto
   deja de dispararse solo.
   ------------------------------------------------------------ */
$$(".ph img").forEach((img) => {
  const marcar = () => img.setAttribute("data-missing", "1");
  img.addEventListener("error", marcar);
  if (img.complete && img.naturalWidth === 0) marcar();
});

/* ------------------------------------------------------------
   3. Barra: fondo al hacer scroll + menú móvil
   ------------------------------------------------------------ */
const topbar = $("#topbar");
const burger = $("#burger");
const nav = $("#nav");

const pintarBarra = () => topbar.classList.toggle("topbar--stuck", window.scrollY > 40);
pintarBarra();
addEventListener("scroll", pintarBarra, { passive: true });

const cerrarMenu = () => {
  topbar.classList.remove("topbar--open");
  burger.setAttribute("aria-expanded", "false");
  burger.setAttribute("aria-label", "Abrir menú");
};

burger.addEventListener("click", () => {
  const abierto = topbar.classList.toggle("topbar--open");
  burger.setAttribute("aria-expanded", String(abierto));
  burger.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
});

nav.addEventListener("click", (e) => {
  if (e.target.closest("a")) cerrarMenu();
});

/* ------------------------------------------------------------
   4. Enlace activo según la sección visible
   ------------------------------------------------------------ */
const enlaces = $$('.nav a[href^="#"]');
const secciones = enlaces.map((a) => $(a.getAttribute("href"))).filter(Boolean);

if (secciones.length && "IntersectionObserver" in window) {
  // Llevamos la cuenta de las secciones dentro de la banda y marcamos la
  // primera en orden del documento. Sin este registro, al salir de la última
  // sección su enlace se quedaba marcado (p. ej. "Galería" en la portada).
  const visibles = new Set();

  const obs = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => (e.isIntersecting ? visibles.add(e.target) : visibles.delete(e.target)));
      const activa = secciones.find((s) => visibles.has(s));
      enlaces.forEach((a) => a.classList.toggle("on", !!activa && a.getAttribute("href") === "#" + activa.id));
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  secciones.forEach((s) => obs.observe(s));
}

/* ------------------------------------------------------------
   5. Aparición al hacer scroll
   ------------------------------------------------------------ */
const aparecer = $$("[data-reveal]");

if ("IntersectionObserver" in window) {
  const obs = new IntersectionObserver(
    (entradas, o) => {
      entradas.forEach((e, i) => {
        if (!e.isIntersecting) return;
        e.target.style.transitionDelay = `${Math.min(i, 4) * 80}ms`;
        e.target.classList.add("in");
        o.unobserve(e.target);
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
  );
  aparecer.forEach((el) => obs.observe(el));
} else {
  aparecer.forEach((el) => el.classList.add("in"));
}

/* ------------------------------------------------------------
   6. Galería: visor a pantalla completa
   ------------------------------------------------------------ */
const lightbox = $("#lightbox");
const lbMedia = $("#lightboxMedia");
const lbCap = $("#lightboxCap");
const lbClose = $("#lightboxClose");
let focoPrevio = null;

const abrirVisor = (boton) => {
  focoPrevio = boton;
  lbMedia.replaceChildren(boton.querySelector(".ph").cloneNode(true));
  lbCap.textContent = boton.dataset.caption || "";
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
  lbClose.focus();
};

const cerrarVisor = () => {
  lightbox.hidden = true;
  lbMedia.replaceChildren();
  document.body.style.overflow = "";
  focoPrevio?.focus();
};

$$(".strip__item").forEach((b) => b.addEventListener("click", () => abrirVisor(b)));
lbClose.addEventListener("click", cerrarVisor);
lightbox.addEventListener("click", (e) => { if (e.target === lightbox) cerrarVisor(); });

addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!lightbox.hidden) cerrarVisor();
  else cerrarMenu();
});

/* ------------------------------------------------------------
   7. ¿Abierto ahora?
   ------------------------------------------------------------ */
const aMinutos = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Tramos de un día en minutos, con el fin desplazado +24 h si cruza medianoche. */
const tramosDe = (dia) =>
  (HORARIO[dia] || []).map(([desde, hasta]) => {
    const inicio = aMinutos(desde);
    let fin = aMinutos(hasta);
    if (fin <= inicio) fin += 1440;
    return { inicio, fin, desde, hasta };
  });

const comoHora = (min) => {
  const m = ((min % 1440) + 1440) % 1440;
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
};

function calcularEstado(ahora = new Date()) {
  const dia = ahora.getDay();
  const min = ahora.getHours() * 60 + ahora.getMinutes();

  for (const t of tramosDe(dia)) {
    if (min >= t.inicio && min < t.fin) {
      return { abierto: true, texto: `Abierto · hasta las ${comoHora(t.fin)}` };
    }
  }

  // Un tramo de ayer que se prolonga pasada la medianoche.
  for (const t of tramosDe((dia + 6) % 7)) {
    if (t.fin > 1440 && min < t.fin - 1440) {
      return { abierto: true, texto: `Abierto · hasta las ${comoHora(t.fin)}` };
    }
  }

  for (let salto = 0; salto < 8; salto++) {
    const d = (dia + salto) % 7;
    for (const t of tramosDe(d)) {
      if (salto === 0 && t.inicio <= min) continue;
      const cuando =
        salto === 0 ? `a las ${t.desde}` :
        salto === 1 ? `mañana a las ${t.desde}` :
        `el ${DIAS[d]} a las ${t.desde}`;
      return { abierto: false, texto: `Cerrado · abre ${cuando}` };
    }
  }
  return { abierto: false, texto: "Cerrado" };
}

const status = $("#status");
const statusText = $("#statusText");

function refrescarEstado() {
  const { abierto, texto } = calcularEstado();
  statusText.textContent = texto;
  status.classList.toggle("status--open", abierto);

  const hoy = new Date().getDay();
  $$("#hoursTable tr").forEach((tr) => {
    tr.classList.toggle("today", Number(tr.dataset.day) === hoy);
  });
}
refrescarEstado();
setInterval(refrescarEstado, 60000);

/* ------------------------------------------------------------
   8. Año del pie
   ------------------------------------------------------------ */
$("#year").textContent = String(new Date().getFullYear());
