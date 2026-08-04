/* ============================================================
   Tetería my Love — Torrejón de Ardoz
   Sin dependencias externas.
   ============================================================ */

const q  = (s) => document.querySelector(s);
const qq = (s) => [...document.querySelectorAll(s)];

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

/* ---------- Enlace activo en el menú ---------- */
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

/* ---------- WhatsApp ----------
   Cada botón lleva data-wa con el motivo, y el mensaje ya va escrito para que
   el cliente solo tenga que darle a enviar. */
const WHATSAPP = "34696101941";

const MENSAJES = {
  general: "Hola, os escribo desde la web de Tetería my Love.",
  sabores: "Hola, ¿qué sabores de cachimba tenéis hoy?",
  carta:   "Hola, ¿me podéis pasar la carta de tés y bebidas?",
  mesa:    "Hola, quería reservar mesa en Tetería my Love. Somos ___ personas, sobre las ___.",
};

qq("[data-wa]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    const texto = MENSAJES[el.dataset.wa] || MENSAJES.general;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
  });
});

q("#year").textContent = String(new Date().getFullYear());
