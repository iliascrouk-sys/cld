/* ============================================================
   Jona Instalaciones Eléctricas
   Sin dependencias externas.
   ============================================================ */

const q  = (s) => document.querySelector(s);
const qq = (s) => [...document.querySelectorAll(s)];

/* ════════════════════════════════════════════════════════════
   ⚠  LO ÚNICO QUE FALTA PARA QUE LA WEB FUNCIONE

   Pon aquí el móvil de la empresa, con el 34 delante y sin espacios
   ni signos. Por ejemplo, para el 612 34 56 78:

       const TELEFONO = "34612345678";

   Mientras esté en null, el formulario avisa de que falta configurarlo en
   vez de abrir un chat con un número equivocado. NO se pone un número de
   ejemplo a propósito: un teléfono mal en la web de un electricista manda
   clientes a un desconocido.
   ════════════════════════════════════════════════════════════ */

const TELEFONO = null;

/* ---------- El teléfono, cuando lo haya ----------
   Los botones de llamar están en el HTML pero ocultos. En cuanto TELEFONO
   tenga valor, se les pone el enlace y el número bien escrito y aparecen
   solos, en la portada y en contacto. Así no hay ni un número falso a la
   vista mientras el dato no esté. */
if (TELEFONO) {
  const bonito = TELEFONO.replace(/^34/, "").replace(/(\d{3})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4");
  qq("[data-tel]").forEach((el) => {
    el.href = "tel:+" + TELEFONO;
    el.textContent = bonito;
    el.hidden = false;
  });
}

/* ---------- Cabecera y menú móvil ---------- */
const cabecera = q("#cabecera"), hamb = q("#hamb"), menu = q("#menu");

const pintarCabecera = () => cabecera.classList.toggle("cabecera--fija", window.scrollY > 30);
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
addEventListener("keydown", (e) => { if (e.key === "Escape" && q("#lupa").hidden) cerrarMenu(); });

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
      e.target.style.transitionDelay = `${Math.min(i, 5) * 75}ms`;
      e.target.classList.add("dentro");
      o.unobserve(e.target);
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -60px 0px" });
  surgen.forEach((el) => obs.observe(el));
} else {
  surgen.forEach((el) => el.classList.add("dentro"));
}

/* ---------- Lupa: ver la foto grande ---------- */
const lupa = q("#lupa"), lupaImg = q("#lupaImg"), lupaPie = q("#lupaPie");
let focoPrevio = null;

const abrirLupa = (disparador) => {
  const img = disparador.querySelector("img");
  focoPrevio = disparador;
  lupaImg.src = img.currentSrc || img.src;
  lupaImg.alt = img.alt;
  lupaPie.textContent = disparador.dataset.lupa || "";
  lupa.hidden = false;
  document.body.style.overflow = "hidden";
  q("#lupaCerrar").focus();
};

const cerrarLupa = () => {
  lupa.hidden = true;
  lupaImg.removeAttribute("src");
  document.body.style.overflow = "";
  focoPrevio?.focus();
};

qq("[data-lupa]").forEach((b) => b.addEventListener("click", () => abrirLupa(b)));
q("#lupaCerrar").addEventListener("click", cerrarLupa);
lupa.addEventListener("click", (e) => { if (e.target === lupa) cerrarLupa(); });
addEventListener("keydown", (e) => { if (e.key === "Escape" && !lupa.hidden) cerrarLupa(); });

/* ============================================================
   PETICIÓN DE PRESUPUESTO
   ------------------------------------------------------------
   No hay servidor ni base de datos. El formulario redacta el mensaje de
   WhatsApp con todo lo que ha rellenado el cliente, ordenado en líneas, y
   abre el chat con el texto puesto. La empresa lo recibe legible y con lo
   que necesita para dar un número, en vez de un "hola, ¿cuánto vale?".

   La vista previa se enseña siempre antes de enviar: nadie manda un
   mensaje sin ver qué pone.
   ============================================================ */
const formu = q("#formu");

if (formu) {
  const detalle = q("#detalle"), nombre = q("#nombre"), tel = q("#tel"), localidad = q("#localidad");
  const fallo = q("#fallo"), previo = q("#previo"), previoTxt = q("#previoTxt");

  const marcado = (grupo) => formu.querySelector(`input[name="${grupo}"]:checked`)?.value || "";

  const redactar = () => [
    `Hola, quería presupuesto para ${marcado("trabajo")} en ${marcado("sitio")}.`,
    ``,
    `Qué hay que hacer: ${detalle.value.trim()}`,
    `Plazo: ${marcado("plazo")}`,
    ``,
    `Nombre: ${nombre.value.trim()}`,
    `Teléfono: ${tel.value.trim()}`,
    `Localidad: ${localidad.value.trim()}`,
  ].join("\n");

  const refrescar = () => {
    const listo = detalle.value.trim() && nombre.value.trim() && tel.value.trim() && localidad.value.trim();
    previo.hidden = !listo;
    if (listo) previoTxt.textContent = redactar();
  };
  formu.addEventListener("input", () => { refrescar(); fallo.hidden = true; });
  formu.addEventListener("change", refrescar);
  refrescar();

  formu.addEventListener("submit", (e) => {
    e.preventDefault();

    const faltan = [];
    [[detalle, "contarnos qué necesitas"], [nombre, "tu nombre"],
     [tel, "tu teléfono"], [localidad, "la localidad"]].forEach(([campo, nom]) => {
      const vacio = !campo.value.trim();
      campo.setAttribute("aria-invalid", String(vacio));
      if (vacio) faltan.push(nom);
    });

    if (faltan.length) {
      fallo.textContent = "Falta " + faltan.join(", ") + ".";
      fallo.hidden = false;
      formu.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    if (!TELEFONO) {
      fallo.textContent = "Falta configurar el teléfono de la empresa en script.js "
                        + "(constante TELEFONO). Hasta entonces el envío no funciona.";
      fallo.hidden = false;
      return;
    }

    fallo.hidden = true;
    window.open(`https://wa.me/${TELEFONO}?text=${encodeURIComponent(redactar())}`,
                "_blank", "noopener");
  });
}

q("#anno").textContent = String(new Date().getFullYear());
