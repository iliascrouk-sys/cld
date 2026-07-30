/* ============================================================
   Hostal de Cuenca — comportamiento
   Sin dependencias externas.
   ============================================================ */

const $  = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

/* ---------- Fotos que aún no existen ----------
   Se marcan para que se vea el marco con el nombre del archivo
   en lugar de un icono roto. */
$$(".ph img").forEach((img) => {
  const marcar = () => img.setAttribute("data-missing", "1");
  img.addEventListener("error", marcar);
  if (img.complete && img.naturalWidth === 0) marcar();
});

/* ---------- Barra: borde al hacer scroll + menú móvil ---------- */
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
addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarMenu(); });

/* ---------- Enlace activo según la sección visible ----------
   Se lleva registro de las secciones dentro de la banda y se marca la
   primera en orden del documento; al salir de todas, no queda ninguna
   marcada. */
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

/* ---------- Año del pie ---------- */
$("#year").textContent = String(new Date().getFullYear());
