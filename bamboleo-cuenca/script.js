/* ============================================================
   Bamboleo — Pub en Cuenca
   Sin dependencias externas.
   ============================================================ */

const q  = (s) => document.querySelector(s);
const qq = (s) => [...document.querySelectorAll(s)];

const TELEFONO = "34696616091";   // el mismo número para llamar y para WhatsApp

/* ============================================================
   HORARIO
   ------------------------------------------------------------
   De su ficha de Google solo se veía "Abre a las 20:00 del viernes". No hay
   tabla semanal ni hora de cierre, así que NO se rellena con datos inventados.

   Cuando el local facilite el horario real:
     1. Rellena HORARIO. Clave = día según Date.getDay() (0 = domingo).
        Cada turno es ["HH:MM", "HH:MM"]. Un día cerrado es [].
        Un pub cierra de madrugada; se escribe tal cual: ["20:00", "03:00"].
     2. Pon HORARIO_CONFIRMADO = true.
   A partir de ahí el bloque de "Dónde estamos" dice en vivo si está abierto.
   ============================================================ */

const HORARIO_CONFIRMADO = false;

const HORARIO = {
  0: [],  // domingo
  1: [],  // lunes
  2: [],
  3: [],
  4: [],
  5: [],  // viernes — Google dejaba ver que abre a las 20:00
  6: [],
};

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

const aMinutos = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/* Devuelve { abierto, hasta } o { abierto:false, proxima } */
function estadoAhora(ahora = new Date()) {
  const min = ahora.getHours() * 60 + ahora.getMinutes();
  const hoy = ahora.getDay();
  const ayer = (hoy + 6) % 7;

  // En un pub esto es la norma, no la excepción: el turno de anoche sigue vivo.
  for (const [ini, fin] of HORARIO[ayer] || []) {
    if (aMinutos(fin) <= aMinutos(ini) && min < aMinutos(fin)) {
      return { abierto: true, hasta: fin };
    }
  }

  for (const [ini, fin] of HORARIO[hoy] || []) {
    const i = aMinutos(ini);
    let f = aMinutos(fin);
    if (f <= i) f += 1440;                       // cierra de madrugada
    if (min >= i && min < f) return { abierto: true, hasta: fin };
    if (min < i) return { abierto: false, proxima: { dia: "hoy", hora: ini } };
  }

  for (let salto = 1; salto <= 7; salto++) {
    const d = (hoy + salto) % 7;
    const turnos = HORARIO[d] || [];
    if (turnos.length) {
      return {
        abierto: false,
        proxima: { dia: salto === 1 ? "mañana" : "el " + DIAS[d], hora: turnos[0][0] },
      };
    }
  }
  return { abierto: false };
}

function pintarEstado() {
  const caja = q("#estado");
  if (!caja || !HORARIO_CONFIRMADO) return;   // sin horario real, se deja el texto fijo del HTML

  const e = estadoAhora();
  if (e.abierto) {
    caja.innerHTML = `<strong class="abierto">Abierto ahora.</strong> Cerramos a las ${e.hasta}.`;
  } else if (e.proxima) {
    caja.innerHTML = `<strong class="cerrado">Cerrado ahora.</strong> Abrimos ${e.proxima.dia} a las ${e.proxima.hora}.`;
  } else {
    caja.innerHTML = `<strong class="cerrado">Cerrado.</strong>`;
  }
}
pintarEstado();
setInterval(pintarEstado, 60000);

/* ---------- Barra y menú móvil ---------- */
const barra = q("#barra"), boton = q("#hamburguesa"), nav = q("#nav");

const pintarBarra = () => barra.classList.toggle("barra--fija", window.scrollY > 30);
pintarBarra();
addEventListener("scroll", pintarBarra, { passive: true });

const cerrarMenu = () => {
  barra.classList.remove("barra--abierta");
  boton.setAttribute("aria-expanded", "false");
  boton.setAttribute("aria-label", "Abrir menú");
};

boton.addEventListener("click", () => {
  const abierto = barra.classList.toggle("barra--abierta");
  boton.setAttribute("aria-expanded", String(abierto));
  boton.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
});
nav.addEventListener("click", (e) => { if (e.target.closest("a")) cerrarMenu(); });
addEventListener("keydown", (e) => { if (e.key === "Escape" && q("#visor").hidden) cerrarMenu(); });

/* ---------- Enlace activo en el menú ---------- */
const enlaces = qq('.nav > a[href^="#"]:not(.bt)');
const secciones = enlaces.map((a) => q(a.getAttribute("href"))).filter(Boolean);

if (secciones.length && "IntersectionObserver" in window) {
  const visibles = new Set();
  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => (e.isIntersecting ? visibles.add(e.target) : visibles.delete(e.target)));
    const activa = secciones.find((s) => visibles.has(s));
    enlaces.forEach((a) => a.classList.toggle("en", !!activa && a.getAttribute("href") === "#" + activa.id));
  }, { rootMargin: "-45% 0px -50% 0px" });
  secciones.forEach((s) => obs.observe(s));
}

/* ---------- Aparición al hacer scroll ---------- */
const surgen = qq("[data-surge]");
if ("IntersectionObserver" in window) {
  const obs = new IntersectionObserver((entradas, o) => {
    entradas.forEach((e, i) => {
      if (!e.isIntersecting) return;
      e.target.style.transitionDelay = `${Math.min(i, 5) * 80}ms`;
      e.target.classList.add("dentro");
      o.unobserve(e.target);
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -60px 0px" });
  surgen.forEach((el) => obs.observe(el));
} else {
  surgen.forEach((el) => el.classList.add("dentro"));
}

/* ---------- WhatsApp ---------- */
qq("[data-wa]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    const texto = "Hola, os escribo desde la web de Bamboleo.";
    window.open(`https://wa.me/${TELEFONO}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
  });
});

/* ---------- Visor de fotos ---------- */
const visor = q("#visor"), visorImg = q("#visorImg"), visorPie = q("#visorPie");
let focoPrevio = null;

const abrirVisor = (disparador) => {
  const img = disparador.querySelector("img");
  focoPrevio = disparador;
  visorImg.src = img.currentSrc || img.src;
  visorImg.alt = img.alt;
  visorPie.textContent = disparador.dataset.visor || "";
  visor.hidden = false;
  document.body.style.overflow = "hidden";
  q("#visorCerrar").focus();
};

const cerrarVisor = () => {
  visor.hidden = true;
  visorImg.removeAttribute("src");
  document.body.style.overflow = "";
  focoPrevio?.focus();
};

qq("[data-visor]").forEach((b) => b.addEventListener("click", () => abrirVisor(b)));
q("#visorCerrar").addEventListener("click", cerrarVisor);
visor.addEventListener("click", (e) => { if (e.target === visor) cerrarVisor(); });
addEventListener("keydown", (e) => { if (e.key === "Escape" && !visor.hidden) cerrarVisor(); });

q("#anyo").textContent = String(new Date().getFullYear());
