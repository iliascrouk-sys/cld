/* ============================================================
   Nombre del Local — comportamiento de la página
   Sin dependencias externas.
   ============================================================ */

/* ------------------------------------------------------------
   1. Configuración editable
   ------------------------------------------------------------
   HORARIO: clave = día según Date.getDay() (0 = domingo … 6 = sábado)
   Valor  = lista de tramos "HH:MM"–"HH:MM". Lista vacía = cerrado.
   Un tramo que termina antes de empezar se entiende que cruza
   la medianoche (p. ej. ["21:00", "01:30"]).
   IMPORTANTE: si cambias esto, cambia también la tabla de
   #visitanos en index.html y el bloque JSON-LD del <head>.
   ------------------------------------------------------------ */
const HORARIO = {
  0: [["13:00", "16:30"]],                      // domingo
  1: [],                                        // lunes — cerrado
  2: [["13:00", "16:00"], ["20:00", "23:00"]],  // martes
  3: [["13:00", "16:00"], ["20:00", "23:00"]],  // miércoles
  4: [["13:00", "16:00"], ["20:00", "23:00"]],  // jueves
  5: [["13:00", "16:30"], ["20:00", "00:00"]],  // viernes
  6: [["13:00", "16:30"], ["20:00", "00:00"]],  // sábado
};

// Dirección a la que se envía el formulario de reservas.
const EMAIL_RESERVAS = "hola@nombredellocal.com";

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/* ------------------------------------------------------------
   2. Barra: sombra al hacer scroll + menú móvil
   ------------------------------------------------------------ */
const barra = document.getElementById("barra");
const hamburguesa = document.getElementById("hamburguesa");
const nav = document.getElementById("nav");

const actualizarBarra = () => {
  barra.classList.toggle("barra--fija", window.scrollY > 24);
};
actualizarBarra();
window.addEventListener("scroll", actualizarBarra, { passive: true });

const cerrarMenu = () => {
  barra.classList.remove("barra--abierta");
  hamburguesa.setAttribute("aria-expanded", "false");
  hamburguesa.setAttribute("aria-label", "Abrir menú");
};

hamburguesa.addEventListener("click", () => {
  const abierto = barra.classList.toggle("barra--abierta");
  hamburguesa.setAttribute("aria-expanded", String(abierto));
  hamburguesa.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
});

nav.addEventListener("click", (e) => {
  if (e.target.closest("a")) cerrarMenu();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") cerrarMenu();
});

/* ------------------------------------------------------------
   3. Enlace activo según la sección visible
   ------------------------------------------------------------ */
const enlacesNav = [...nav.querySelectorAll('.nav__lista a[href^="#"]')];
const secciones = enlacesNav
  .map((a) => document.querySelector(a.getAttribute("href")))
  .filter(Boolean);

if (secciones.length && "IntersectionObserver" in window) {
  const observadorNav = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        enlacesNav.forEach((a) =>
          a.classList.toggle("activo", a.getAttribute("href") === "#" + entrada.target.id)
        );
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  secciones.forEach((s) => observadorNav.observe(s));
}

/* ------------------------------------------------------------
   4. Animación de entrada
   ------------------------------------------------------------ */
const aRevelar = document.querySelectorAll("[data-revelar]");

if ("IntersectionObserver" in window) {
  const observador = new IntersectionObserver(
    (entradas, obs) => {
      entradas.forEach((entrada, i) => {
        if (!entrada.isIntersecting) return;
        // Escalona ligeramente los elementos que entran juntos.
        entrada.target.style.transitionDelay = `${Math.min(i, 5) * 70}ms`;
        entrada.target.classList.add("visible");
        obs.unobserve(entrada.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  aRevelar.forEach((el) => observador.observe(el));
} else {
  aRevelar.forEach((el) => el.classList.add("visible"));
}

/* ------------------------------------------------------------
   5. Pestañas de la carta (con teclado)
   ------------------------------------------------------------ */
const pestanas = [...document.querySelectorAll(".pestana")];

const activarPestana = (indice, mover = true) => {
  pestanas.forEach((boton, i) => {
    const activa = i === indice;
    boton.classList.toggle("activa", activa);
    boton.setAttribute("aria-selected", String(activa));
    boton.tabIndex = activa ? 0 : -1;
    document.getElementById(boton.getAttribute("aria-controls")).hidden = !activa;
  });
  if (mover) pestanas[indice].focus();
};

pestanas.forEach((boton, i) => {
  boton.addEventListener("click", () => activarPestana(i, false));
  boton.addEventListener("keydown", (e) => {
    const salto = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 1, ArrowUp: -1 }[e.key];
    if (salto) {
      e.preventDefault();
      activarPestana((i + salto + pestanas.length) % pestanas.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      activarPestana(0);
    } else if (e.key === "End") {
      e.preventDefault();
      activarPestana(pestanas.length - 1);
    }
  });
});

/* ------------------------------------------------------------
   6. Galería: visor a pantalla completa
   ------------------------------------------------------------ */
const visor = document.getElementById("visor");
const visorMedio = document.getElementById("visor-medio");
const visorPie = document.getElementById("visor-pie");
const visorCerrar = document.getElementById("visor-cerrar");
let ultimoFoco = null;

const abrirVisor = (item) => {
  ultimoFoco = item;
  visorMedio.replaceChildren(item.firstElementChild.cloneNode(true));
  visorPie.textContent = item.dataset.titulo || "";
  visor.hidden = false;
  document.body.style.overflow = "hidden";
  visorCerrar.focus();
};

const cerrarVisor = () => {
  visor.hidden = true;
  visorMedio.replaceChildren();
  document.body.style.overflow = "";
  if (ultimoFoco) ultimoFoco.focus();
};

document.querySelectorAll(".galeria__item").forEach((item) => {
  item.addEventListener("click", () => abrirVisor(item));
});

visorCerrar.addEventListener("click", cerrarVisor);
visor.addEventListener("click", (e) => {
  if (e.target === visor) cerrarVisor();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !visor.hidden) cerrarVisor();
});

/* ------------------------------------------------------------
   7. ¿Abierto ahora?
   ------------------------------------------------------------ */
const aMinutos = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Tramos del día `dia` normalizados a minutos, con el fin
 *  desplazado +24 h cuando el tramo cruza la medianoche. */
const tramosDe = (dia) =>
  (HORARIO[dia] || []).map(([desde, hasta]) => {
    const inicio = aMinutos(desde);
    let fin = aMinutos(hasta);
    if (fin <= inicio) fin += 1440;
    return { inicio, fin, desde, hasta };
  });

const formatearMinutos = (min) => {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

function calcularEstado(ahora = new Date()) {
  const dia = ahora.getDay();
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

  // ¿Estamos dentro de un tramo de hoy?
  for (const t of tramosDe(dia)) {
    if (minutosAhora >= t.inicio && minutosAhora < t.fin) {
      return { abierto: true, texto: `Abierto ahora · cierra a las ${t.hasta === "00:00" ? "00:00" : t.hasta}` };
    }
  }

  // ¿O dentro de un tramo de ayer que cruzó la medianoche?
  const ayer = (dia + 6) % 7;
  for (const t of tramosDe(ayer)) {
    if (t.fin > 1440 && minutosAhora < t.fin - 1440) {
      return { abierto: true, texto: `Abierto ahora · cierra a las ${formatearMinutos(t.fin)}` };
    }
  }

  // Cerrado: buscamos la próxima apertura en los siguientes 7 días.
  for (let salto = 0; salto < 8; salto++) {
    const d = (dia + salto) % 7;
    for (const t of tramosDe(d)) {
      if (salto === 0 && t.inicio <= minutosAhora) continue;
      if (salto === 0) return { abierto: false, texto: `Cerrado · abrimos hoy a las ${t.desde}` };
      if (salto === 1) return { abierto: false, texto: `Cerrado · abrimos mañana a las ${t.desde}` };
      return { abierto: false, texto: `Cerrado · abrimos el ${DIAS[d]} a las ${t.desde}` };
    }
  }
  return { abierto: false, texto: "Cerrado" };
}

const estado = document.getElementById("estado");
const pintarEstado = () => {
  const { abierto, texto } = calcularEstado();
  estado.querySelector(".estado__texto").textContent = texto;
  estado.classList.toggle("estado--abierto", abierto);
  estado.classList.toggle("estado--cerrado", !abierto);
  estado.hidden = false;
};
pintarEstado();
setInterval(pintarEstado, 60000);

// Resalta la fila de hoy en la tabla de horarios.
const filaHoy = document.querySelector(`.horarios tr[data-dia="${new Date().getDay()}"]`);
if (filaHoy) filaHoy.classList.add("hoy");

/* ------------------------------------------------------------
   8. Formulario de reservas
   ------------------------------------------------------------
   No hay servidor: validamos y abrimos el cliente de correo con
   los datos ya redactados. Para envío automático, sustituir el
   bloque `mailto` por un fetch al endpoint del proveedor.
   ------------------------------------------------------------ */
const formulario = document.getElementById("formulario");
const formularioAviso = document.getElementById("formulario-aviso");

// No se puede reservar para un día pasado.
const campoFecha = document.getElementById("f-fecha");
const hoyISO = new Date().toISOString().slice(0, 10);
campoFecha.min = hoyISO;
campoFecha.value = hoyISO;

const mostrarAviso = (mensaje, clase) => {
  formularioAviso.textContent = mensaje;
  formularioAviso.className = "formulario__aviso " + clase;
};

formulario.addEventListener("submit", (e) => {
  e.preventDefault();

  const obligatorios = [...formulario.querySelectorAll("[required]")];
  let primerFallo = null;

  obligatorios.forEach((campo) => {
    const vacio = !campo.value.trim();
    campo.setAttribute("aria-invalid", String(vacio));
    if (vacio && !primerFallo) primerFallo = campo;
  });

  if (primerFallo) {
    primerFallo.focus();
    mostrarAviso("Faltan datos: revisa los campos marcados.", "mal");
    return;
  }

  const d = Object.fromEntries(new FormData(formulario));
  const asunto = `Reserva — ${d.nombre} — ${d.fecha} ${d.hora} (${d.personas} pers.)`;
  const cuerpo = [
    `Nombre: ${d.nombre}`,
    `Teléfono: ${d.telefono}`,
    `Comensales: ${d.personas}`,
    `Día: ${d.fecha}`,
    `Hora: ${d.hora}`,
    "",
    `Notas: ${d.notas?.trim() || "—"}`,
  ].join("\n");

  window.location.href =
    `mailto:${EMAIL_RESERVAS}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;

  mostrarAviso("Hemos abierto tu correo con la solicitud. Envíala y te confirmamos por teléfono.", "ok");
});

/* ------------------------------------------------------------
   9. Volver arriba + año del pie
   ------------------------------------------------------------ */
const arriba = document.getElementById("arriba");

window.addEventListener(
  "scroll",
  () => {
    arriba.hidden = window.scrollY < 600;
  },
  { passive: true }
);

arriba.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.getElementById("anio").textContent = String(new Date().getFullYear());
