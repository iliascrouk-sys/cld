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

/* ============================================================
   LA LUZ
   ------------------------------------------------------------
   Dos cosas mueven la luz de la página:

   1. LA HORA de quien mira. Un pub a medianoche no se ve igual que a las
      seis de la tarde, y la web tampoco debería. De día la luz baja; según
      cae la tarde aprieta, y de noche va al máximo. Se recalcula cada
      cuarto de hora por si alguien deja la pestaña abierta.

   2. EL PUNTERO. La luz le sigue con retraso, como una lámpara a la que se
      acerca alguien. En móvil no hay puntero: se queda quieta y respira.

   Todo va contra dos variables CSS y se pinta dentro de un
   requestAnimationFrame, así que el navegador no repinta de más.
   ============================================================ */

const raiz = document.documentElement;
const quietoPorPreferencia = matchMedia("(prefers-reduced-motion: reduce)").matches;

function factorNoche(ahora = new Date()) {
  const h = ahora.getHours() + ahora.getMinutes() / 60;
  if (h >= 22 || h < 5) return 1;         // noche cerrada
  if (h >= 19) return 0.6 + (h - 19) * (0.4 / 3);   // de 19 a 22, subiendo
  if (h >= 8)  return 0.5;                // de día, luz de sobra fuera
  return 0.75 + (5 - Math.min(h, 5)) * 0;  // madrugada larga
}

const pintarNoche = () => raiz.style.setProperty("--noche", factorNoche().toFixed(2));
pintarNoche();
setInterval(pintarNoche, 900000);

if (!quietoPorPreferencia && matchMedia("(pointer: fine)").matches) {
  let destinoX = 50, destinoY = 30, x = 50, y = 30, pedido = null;

  const seguir = () => {
    // Persecución amortiguada: la luz llega con retraso, no pegada al ratón.
    x += (destinoX - x) * 0.06;
    y += (destinoY - y) * 0.06;
    raiz.style.setProperty("--luz-x", x.toFixed(2) + "%");
    raiz.style.setProperty("--luz-y", y.toFixed(2) + "%");
    pedido = (Math.abs(destinoX - x) > 0.05 || Math.abs(destinoY - y) > 0.05)
      ? requestAnimationFrame(seguir) : null;
  };

  addEventListener("pointermove", (e) => {
    destinoX = (e.clientX / innerWidth) * 100;
    destinoY = ((e.clientY + scrollY) / document.documentElement.scrollHeight) * 100;
    if (!pedido) pedido = requestAnimationFrame(seguir);
  }, { passive: true });
}

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

/* ============================================================
   RESERVA
   No hay servidor ni base de datos: se compone el mensaje de WhatsApp con lo
   que rellena el cliente y se abre el chat con todo escrito. El pub confirma
   por ahí, que es como se reserva de verdad en un sitio así.
   ============================================================ */
const hoja = q("#hoja");

if (hoja) {
  const dia = q("#dia"), hora = q("#hora"), personas = q("#personas");
  const alerta = q("#alerta"), vista = q("#vista");

  // No se puede reservar para ayer.
  const hoyISO = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString().slice(0, 10);
  dia.min = hoyISO;
  if (!dia.value) dia.value = hoyISO;

  const MOTIVOS = {
    copas:       "Vamos a tomar algo.",
    cumple:      "Es un cumpleaños.",
    celebracion: "Es una celebración.",
  };

  const fechaEnPalabras = (iso) => {
    const d = new Date(iso + "T12:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    const hoy = new Date(); hoy.setHours(12, 0, 0, 0);
    const dias = Math.round((d - hoy) / 86400000);
    if (dias === 0) return "esta noche";
    if (dias === 1) return "mañana";
    return "el " + d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  };

  const componer = () => {
    const motivo = hoja.querySelector('input[name="motivo"]:checked')?.value || "copas";
    const n = Number(personas.value) || 0;
    return `Hola, quería reservar en Bamboleo para ${fechaEnPalabras(dia.value)} `
         + `a las ${hora.value}. Somos ${n} ${n === 1 ? "persona" : "personas"}. `
         + MOTIVOS[motivo];
  };

  const refrescar = () => {
    vista.textContent = dia.value && hora.value && personas.value
      ? "Se enviará: " + componer()
      : "";
  };
  hoja.addEventListener("input", () => { refrescar(); alerta.hidden = true; });
  hoja.addEventListener("change", refrescar);
  refrescar();

  hoja.addEventListener("submit", (e) => {
    e.preventDefault();

    const faltan = [];
    [[dia, "el día"], [hora, "la hora"], [personas, "cuántos sois"]].forEach(([campo, nombre]) => {
      const vacio = !campo.value;
      campo.setAttribute("aria-invalid", String(vacio));
      if (vacio) faltan.push(nombre);
    });

    if (faltan.length) {
      alerta.textContent = "Falta " + faltan.join(", ") + ".";
      alerta.hidden = false;
      hoja.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    alerta.hidden = true;
    window.open(`https://wa.me/${TELEFONO}?text=${encodeURIComponent(componer())}`, "_blank", "noopener");
  });
}

q("#anyo").textContent = String(new Date().getFullYear());
