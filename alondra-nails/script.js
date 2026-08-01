/* ============================================================
   Alondra Nails — Parla
   Sin dependencias externas.
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
      e.target.style.transitionDelay = `${Math.min(i, 5) * 70}ms`;
      e.target.classList.add("in");
      o.unobserve(e.target);
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
  aparecer.forEach((el) => obs.observe(el));
} else {
  aparecer.forEach((el) => el.classList.add("in"));
}

/* ---------- Galería: visor a pantalla completa ---------- */
const visor = q("#visor"), vMedio = q("#visorMedio"), vPie = q("#visorPie"), vCerrar = q("#visorCerrar");
let focoPrevio = null;

const abrirVisor = (b) => {
  focoPrevio = b;
  vMedio.replaceChildren(b.querySelector(".ph").cloneNode(true));
  vPie.textContent = b.dataset.caption || "";
  visor.hidden = false;
  document.body.style.overflow = "hidden";
  vCerrar.focus();
};
const cerrarVisor = () => {
  visor.hidden = true;
  vMedio.replaceChildren();
  document.body.style.overflow = "";
  focoPrevio?.focus();
};

qq(".galeria__item").forEach((b) => b.addEventListener("click", () => abrirVisor(b)));
vCerrar.addEventListener("click", cerrarVisor);
visor.addEventListener("click", (e) => { if (e.target === visor) cerrarVisor(); });
addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!visor.hidden) cerrarVisor(); else cerrarMenu();
});

/* ---------- Mensaje de WhatsApp para pedir cita ---------- */
const WHATSAPP = "34642119836";

qq("[data-cita]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    const servicio = el.dataset.cita;
    const texto = servicio === "general"
      ? "Hola, me gustaría pedir cita en Alondra Nails."
      : `Hola, me gustaría pedir cita en Alondra Nails para: ${servicio}.`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
  });
});

q("#year").textContent = String(new Date().getFullYear());
