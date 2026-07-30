/* ============================================================
   Mesón El Bodegón — Cuenca
   Sin dependencias externas.
   ============================================================ */

/* ------------------------------------------------------------
   Horario
   ------------------------------------------------------------
   Clave = día según Date.getDay() (0 = domingo … 6 = sábado).
   Valor = tramos ["HH:MM", "HH:MM"]. Lista vacía = cerrado.

   TODO: sin confirmar con el local. Las fuentes públicas se
   contradicen: unas dan cerrado solo el lunes y otras lunes y
   martes. Aquí está la segunda versión, que es la más repetida.
   Al cambiarlo hay que tocar también la tabla #horario de
   index.html y el JSON-LD del <head>.
   ------------------------------------------------------------ */
const HORARIO = {
  0: [["12:00", "16:30"], ["19:00", "23:00"]],  // domingo
  1: [],                                        // lunes — cerrado
  2: [],                                        // martes — cerrado
  3: [["12:00", "16:30"], ["19:00", "23:00"]],  // miércoles
  4: [["12:00", "16:30"], ["19:00", "23:00"]],  // jueves
  5: [["12:00", "16:30"], ["19:00", "23:00"]],  // viernes
  6: [["12:00", "16:30"], ["19:00", "23:00"]],  // sábado
};

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

const $  = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

/* ---------- Fotos que aún no existen ---------- */
$$(".ph img").forEach((img) => {
  const marcar = () => img.setAttribute("data-missing", "1");
  img.addEventListener("error", marcar);
  if (img.complete && img.naturalWidth === 0) marcar();
});

/* ---------- Barra y menú móvil ---------- */
const bar = $("#bar");
const burger = $("#burger");
const nav = $("#nav");

const pintarBarra = () => bar.classList.toggle("bar--stuck", window.scrollY > 30);
pintarBarra();
addEventListener("scroll", pintarBarra, { passive: true });

const cerrarMenu = () => {
  bar.classList.remove("bar--open");
  burger.setAttribute("aria-expanded", "false");
  burger.setAttribute("aria-label", "Abrir menú");
};

burger.addEventListener("click", () => {
  const abierto = bar.classList.toggle("bar--open");
  burger.setAttribute("aria-expanded", String(abierto));
  burger.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
});

nav.addEventListener("click", (e) => { if (e.target.closest("a")) cerrarMenu(); });

/* ---------- Enlace activo ---------- */
const enlaces = $$('.nav > a[href^="#"]:not(.btn)');
const secciones = enlaces.map((a) => $(a.getAttribute("href"))).filter(Boolean);

if (secciones.length && "IntersectionObserver" in window) {
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

/* ---------- Aparición al hacer scroll ---------- */
const aparecer = $$("[data-reveal]");
if ("IntersectionObserver" in window) {
  const obs = new IntersectionObserver(
    (entradas, o) => {
      entradas.forEach((e, i) => {
        if (!e.isIntersecting) return;
        e.target.style.transitionDelay = `${Math.min(i, 5) * 70}ms`;
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

/* ---------- Escape cierra el menú ---------- */
addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarMenu(); });

/* ---------- ¿Abierto ahora? ---------- */
const aMinutos = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Tramos del día en minutos, con el fin +24 h si cruza medianoche. */
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
    if (min >= t.inicio && min < t.fin) return { abierto: true, texto: `Abierto · hasta las ${comoHora(t.fin)}` };
  }
  for (const t of tramosDe((dia + 6) % 7)) {
    if (t.fin > 1440 && min < t.fin - 1440) return { abierto: true, texto: `Abierto · hasta las ${comoHora(t.fin)}` };
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

const estado = $("#estado");
const estadoTexto = $("#estadoTexto");

function refrescarEstado() {
  const { abierto, texto } = calcularEstado();
  estadoTexto.textContent = texto;
  estado.classList.toggle("estado--abierto", abierto);
  estado.hidden = false;

  const hoy = new Date().getDay();
  $$("#horario tr").forEach((tr) => tr.classList.toggle("hoy", Number(tr.dataset.dia) === hoy));
}
refrescarEstado();
setInterval(refrescarEstado, 60000);

/* ---------- Año del pie ---------- */
$("#year").textContent = String(new Date().getFullYear());
