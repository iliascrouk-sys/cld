/* ============================================================
   La Fortaleza Bar-Restaurante — Cuenca
   Sin dependencias externas.
   ============================================================ */

const q  = (s) => document.querySelector(s);
const qq = (s) => [...document.querySelectorAll(s)];

const TELEFONO = "34614658919";   // el mismo número para llamar y para WhatsApp

/* ============================================================
   HORARIO
   ------------------------------------------------------------
   De su ficha de Google solo consta "Cierra a las 23:30" del día en que se
   consultó. No hay hora de apertura ni días de descanso, así que NO se rellena
   con datos inventados.

   Cuando el local facilite el horario real:
     1. Rellena HORARIO. Clave = día según Date.getDay() (0 = domingo).
        Cada turno es ["HH:MM", "HH:MM"]. Un día cerrado es [].
        Si un turno termina de madrugada, se escribe tal cual: ["20:00","01:30"].
     2. Pon HORARIO_CONFIRMADO = true.
   A partir de ahí el bloque de "Dónde estamos" pasa a decir en vivo si está
   abierto o cerrado, y a qué hora cambia.
   ============================================================ */

const HORARIO_CONFIRMADO = false;

const HORARIO = {
  0: [],  // domingo
  1: [],  // lunes
  2: [],
  3: [],
  4: [],
  5: [],
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

  // Un turno de ayer que cruza la medianoche todavía puede estar vivo.
  for (const [ini, fin] of HORARIO[ayer] || []) {
    const i = aMinutos(ini);
    let f = aMinutos(fin);
    if (f <= i && min < f) return { abierto: true, hasta: fin };
  }

  for (const [ini, fin] of HORARIO[hoy] || []) {
    const i = aMinutos(ini);
    let f = aMinutos(fin);
    if (f <= i) f += 1440;                       // cierra de madrugada
    if (min >= i && min < f) return { abierto: true, hasta: fin };
    if (min < i) return { abierto: false, proxima: { dia: "hoy", hora: ini } };
  }

  // Nada más hoy: buscamos el siguiente día con turnos.
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
addEventListener("keydown", (e) => { if (e.key === "Escape" && q("#visor").hidden) cerrarMenu(); });

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

/* ---------- Enlaces sueltos de WhatsApp ---------- */
const MENSAJES = {
  carta: "Hola, ¿qué tenéis hoy en La Fortaleza?",
};

qq("[data-wa]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    const texto = MENSAJES[el.dataset.wa] || "Hola, os escribo desde la web de La Fortaleza.";
    window.open(`https://wa.me/${TELEFONO}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
  });
});

/* ============================================================
   RESERVA
   Compone el mensaje de WhatsApp con lo que rellena el cliente, para que solo
   tenga que darle a enviar. No hay servidor ni base de datos: la reserva la
   confirma el bar por WhatsApp, que es como funciona de verdad.
   ============================================================ */
const ficha = q("#ficha");

if (ficha) {
  const dia = q("#dia"), hora = q("#hora"), personas = q("#personas");
  const aviso = q("#aviso"), vista = q("#vista");

  // No se puede reservar para ayer.
  const hoyISO = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString().slice(0, 10);
  dia.min = hoyISO;
  if (!dia.value) dia.value = hoyISO;

  const fechaEnPalabras = (iso) => {
    const d = new Date(iso + "T12:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    const hoy = new Date(); hoy.setHours(12, 0, 0, 0);
    const dias = Math.round((d - hoy) / 86400000);
    if (dias === 0) return "hoy";
    if (dias === 1) return "mañana";
    return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  };

  const componer = () => {
    const sitio = ficha.querySelector('input[name="sitio"]:checked')?.value || "donde haya sitio";
    const n = Number(personas.value) || 0;
    return `Hola, quería reservar mesa en La Fortaleza para ${fechaEnPalabras(dia.value)} `
         + `a las ${hora.value}. Somos ${n} ${n === 1 ? "persona" : "personas"} y preferimos ${sitio}.`;
  };

  const refrescar = () => {
    vista.textContent = dia.value && hora.value && personas.value
      ? "Se enviará: " + componer()
      : "";
  };
  ficha.addEventListener("input", () => { refrescar(); aviso.hidden = true; });
  ficha.addEventListener("change", refrescar);
  refrescar();

  ficha.addEventListener("submit", (e) => {
    e.preventDefault();

    const faltan = [];
    [[dia, "el día"], [hora, "la hora"], [personas, "cuántos sois"]].forEach(([campo, nombre]) => {
      const vacio = !campo.value;
      campo.setAttribute("aria-invalid", String(vacio));
      if (vacio) faltan.push(nombre);
    });

    if (faltan.length) {
      aviso.textContent = "Falta " + faltan.join(", ") + ".";
      aviso.hidden = false;
      ficha.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    aviso.hidden = true;
    window.open(`https://wa.me/${TELEFONO}?text=${encodeURIComponent(componer())}`, "_blank", "noopener");
  });
}

/* ---------- Visor de fotos ---------- */
const visor = q("#visor"), visorImg = q("#visorImg"), visorPie = q("#visorPie");
let focoPrevio = null;

const abrirVisor = (boton) => {
  const img = boton.querySelector("img");
  focoPrevio = boton;
  visorImg.src = img.currentSrc || img.src;
  visorImg.alt = img.alt;
  visorPie.textContent = boton.dataset.visor || "";
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

q("#year").textContent = String(new Date().getFullYear());
