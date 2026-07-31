/* ============================================================
   Barbería — navegación, estado de apertura y aparición
   El sistema de citas vive aparte, en reserva.js
   ============================================================ */

const q  = (s) => document.querySelector(s);
const qq = (s) => [...document.querySelectorAll(s)];

/* ---------- Fotos que aún no existen ---------- */
qq(".ph img").forEach((img) => {
  const marcar = () => img.setAttribute("data-missing", "1");
  img.addEventListener("error", marcar);
  if (img.complete && img.naturalWidth === 0) marcar();
});

/* ---------- Barra y menú móvil ---------- */
const bar = q("#bar"), burger = q("#burger"), nav = q("#nav");

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
addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarMenu(); });

/* ---------- Enlace activo ---------- */
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
const aparecer = qq("[data-reveal]");
if ("IntersectionObserver" in window) {
  const obs = new IntersectionObserver((entradas, o) => {
    entradas.forEach((e, i) => {
      if (!e.isIntersecting) return;
      e.target.style.transitionDelay = `${Math.min(i, 5) * 60}ms`;
      e.target.classList.add("in");
      o.unobserve(e.target);
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
  aparecer.forEach((el) => obs.observe(el));
} else {
  aparecer.forEach((el) => el.classList.add("in"));
}

/* ---------- ¿Abierto ahora? ----------
   Lee el mismo HORARIO que usa el sistema de citas, así que basta
   con cambiarlo en un sitio. reserva.js se carga después, de modo
   que esto se ejecuta cuando el documento ya está listo. */
const DIAS_NOM = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function estadoAhora() {
  const min = (h) => { const [a, b] = h.split(":").map(Number); return a * 60 + b; };
  const ahora = new Date();
  const hoy = ahora.getDay();
  const m = ahora.getHours() * 60 + ahora.getMinutes();

  for (const [a, b] of HORARIO[hoy] || []) {
    if (m >= min(a) && m < min(b)) return { abierto: true, texto: `Abierto · hasta las ${b}` };
  }
  for (let salto = 0; salto < 8; salto++) {
    const d = (hoy + salto) % 7;
    for (const [a] of HORARIO[d] || []) {
      if (salto === 0 && min(a) <= m) continue;
      const cuando = salto === 0 ? `a las ${a}` : salto === 1 ? `mañana a las ${a}` : `el ${DIAS_NOM[d]} a las ${a}`;
      return { abierto: false, texto: `Cerrado · abre ${cuando}` };
    }
  }
  return { abierto: false, texto: "Cerrado" };
}

function refrescarEstado() {
  if (typeof HORARIO === "undefined") return;
  const { abierto, texto } = estadoAhora();
  q("#estadoTexto").textContent = texto;
  q("#estado").classList.toggle("estado--abierto", abierto);
  q("#estado").hidden = false;
  const hoy = new Date().getDay();
  qq("#horario tr").forEach((tr) => tr.classList.toggle("hoy", Number(tr.dataset.dia) === hoy));
}

addEventListener("load", () => { refrescarEstado(); setInterval(refrescarEstado, 60000); });

q("#year").textContent = String(new Date().getFullYear());
