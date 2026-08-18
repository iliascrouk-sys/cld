/* ============================================================
   Taller Mecánico El Palacio
   Navegación, estado de apertura en vivo y aparición al hacer scroll.
   Sin dependencias externas.
   ============================================================ */

/* ════════════════════════════════════════════════════════════
   CONFIGURACIÓN DEL TALLER — se toca solo aquí

   Este objeto es la única fuente de verdad del sitio: el horario que se
   pinta en portada, el que decide si pone «Abierto ahora» y el que usa el
   sistema de citas para calcular huecos salen todos de aquí. Si se cambia
   el horario en un sitio y no en otro, la web miente; por eso está junto.
   ════════════════════════════════════════════════════════════ */

const TALLER = {
  /* Formato internacional, sin «+» ni espacios. */
  whatsapp: "34665507205",
  telefono: "+34665507205",

  /* 0 = domingo … 6 = sábado. Lista vacía = cerrado ese día.
     ⚠ CONFIRMAR CON EL TALLER: de lunes a viernes es el horario real de su
     ficha. El sábado está puesto como cerrado por prudencia —es preferible
     que llamen a que se planten allí con la persiana bajada—, pero hay que
     preguntarlo y corregirlo aquí y en el bloque «Horario» del index.html. */
  horario: {
    0: [],
    1: [["08:00", "14:00"], ["16:00", "20:00"]],
    2: [["08:00", "14:00"], ["16:00", "20:00"]],
    3: [["08:00", "14:00"], ["16:00", "20:00"]],
    4: [["08:00", "14:00"], ["16:00", "20:00"]],
    5: [["08:00", "14:00"], ["16:00", "20:00"]],
    6: [],
  },
};

const q  = (s) => document.querySelector(s);
const qq = (s) => [...document.querySelectorAll(s)];

const aMin  = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const aHora = (min)  => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")}`;

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/* ---------- Cabecera ---------- */
const cabecera = q("#cabecera"), hamb = q("#hamb"), menu = q("#menu");

const pintarCabecera = () => cabecera.classList.toggle("cabecera--fija", window.scrollY > 24);
pintarCabecera();
addEventListener("scroll", pintarCabecera, { passive: true });

const cerrarMenu = () => {
  cabecera.classList.remove("cabecera--abierta");
  hamb.setAttribute("aria-expanded", "false");
  hamb.setAttribute("aria-label", "Abrir menú");
};

hamb.addEventListener("click", () => {
  const abierto = cabecera.classList.toggle("cabecera--abierta");
  hamb.setAttribute("aria-expanded", String(abierto));
  hamb.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
});
menu.addEventListener("click", (e) => { if (e.target.closest("a")) cerrarMenu(); });
addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarMenu(); });

/* ---------- Enlace activo en el menú ---------- */
const enlaces = qq('.menu > a[href^="#"]:not(.bo)');
const secciones = enlaces.map((a) => q(a.getAttribute("href"))).filter(Boolean);

if (secciones.length && "IntersectionObserver" in window) {
  const visibles = new Set();
  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => (e.isIntersecting ? visibles.add(e.target) : visibles.delete(e.target)));
    const activa = secciones.find((s) => visibles.has(s));
    enlaces.forEach((a) => a.classList.toggle("aqui", !!activa && a.getAttribute("href") === "#" + activa.id));
  }, { rootMargin: "-45% 0px -50% 0px" });
  secciones.forEach((s) => obs.observe(s));
}

/* ---------- Aparición al hacer scroll ---------- */
const surgen = qq("[data-surge]");
if ("IntersectionObserver" in window) {
  const obs = new IntersectionObserver((entradas, o) => {
    entradas.forEach((e, i) => {
      if (!e.isIntersecting) return;
      e.target.style.transitionDelay = `${Math.min(i, 5) * 70}ms`;
      e.target.classList.add("visto");
      o.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: .08 });
  surgen.forEach((el) => obs.observe(el));
} else {
  surgen.forEach((el) => el.classList.add("visto"));
}

/* ---------- ¿Está abierto ahora? ----------
   Se calcula en el navegador del visitante a partir de TALLER.horario, de
   modo que no hay que tocar nada nunca. Si el guion fallara, el aviso se
   queda oculto: mejor no decir nada que decir «abierto» a las tres de la
   madrugada. */
function estadoAhora(ahora = new Date()) {
  const min = ahora.getHours() * 60 + ahora.getMinutes();
  const hoy = TALLER.horario[ahora.getDay()] || [];

  for (const [a, b] of hoy) {
    if (min >= aMin(a) && min < aMin(b)) {
      return { abierto: true, texto: `Abierto ahora · cierra a las ${aHora(aMin(b))}` };
    }
  }

  /* Cerrado: se busca la próxima apertura, hasta una semana por delante. */
  for (let d = 0; d < 8; d++) {
    const dia = (ahora.getDay() + d) % 7;
    for (const [a] of TALLER.horario[dia] || []) {
      if (d === 0 && aMin(a) <= min) continue;
      const cuando = d === 0 ? "hoy" : d === 1 ? "mañana" : `el ${DIAS[dia]}`;
      return { abierto: false, texto: `Cerrado ahora · abre ${cuando} a las ${aHora(aMin(a))}` };
    }
  }
  return null;
}

function pintarEstado() {
  const caja = q("#estado");
  if (!caja) return;
  const e = estadoAhora();
  if (!e) return;
  q("#estadoTxt").textContent = e.texto;
  caja.classList.toggle("estado--abierto", e.abierto);
  caja.hidden = false;
}

pintarEstado();
setInterval(pintarEstado, 60_000);   // por si alguien deja la pestaña abierta
