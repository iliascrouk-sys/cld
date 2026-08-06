/* ============================================================
   GACU Academia — Cuenca
   Sin dependencias externas.
   ============================================================ */

const q  = (s) => document.querySelector(s);
const qq = (s) => [...document.querySelectorAll(s)];

/* ============================================================
   LOS DOS TELÉFONOS
   ------------------------------------------------------------
   La academia tiene un número por materia y en su Instagram aparecen
   seguidos y sin rótulo. Aquí cada uno está atado a sus asignaturas, y
   todo lo que manda la web (llamadas, WhatsApp y el formulario) sale ya
   al número que corresponde.

   Si cambia un número hay que tocarlo en dos sitios: aquí y en los
   href="tel:" del HTML.
   ============================================================ */

const TEL_MATES  = "34604835167";   // matemáticas y física y química
const TEL_INGLES = "34678069811";   // inglés

const MATERIAS = {
  matematicas: { texto: "matemáticas",                       tel: TEL_MATES,  quien: "Mates y FyQ · 604 835 167" },
  fyq:         { texto: "física y química",                  tel: TEL_MATES,  quien: "Mates y FyQ · 604 835 167" },
  ingles:      { texto: "inglés",                            tel: TEL_INGLES, quien: "Inglés · 678 069 811" },
  certificado: { texto: "inglés para sacarse el certificado", tel: TEL_INGLES, quien: "Inglés · 678 069 811" },
};

const abrirWhatsApp = (tel, texto) =>
  window.open(`https://wa.me/${tel}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");

/* ============================================================
   HORARIO
   ------------------------------------------------------------
   No aparece en ninguna parte de su Instagram, así que NO se rellena con
   datos inventados. Mientras tanto la web dice lo único que consta —que
   hay grupos de mañana y de tarde— y remite a WhatsApp.

   Cuando la academia facilite el horario real:
     1. Rellena HORARIO. Clave = día según Date.getDay() (0 = domingo).
        Cada turno es ["HH:MM", "HH:MM"]. Un día cerrado es [].
        Una academia suele partir el día: [["10:00","14:00"],["16:00","21:00"]].
     2. Pon HORARIO_CONFIRMADO = true.
   A partir de ahí el bloque de "Dónde estamos" dice en vivo si está abierta.
   ============================================================ */

const HORARIO_CONFIRMADO = false;

const HORARIO = {
  0: [],  // domingo
  1: [],  // lunes
  2: [],
  3: [],
  4: [],
  5: [],
  6: [],  // sábado
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

  for (const [ini, fin] of HORARIO[hoy] || []) {
    const i = aMinutos(ini), f = aMinutos(fin);
    if (min >= i && min < f) return { abierto: true, hasta: fin };
    if (min < i) return { abierto: false, proxima: { dia: "hoy", hora: ini } };
  }

  // Nada más hoy: buscamos el siguiente día con clase.
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
   CURSO ACADÉMICO
   Se calcula solo para que la portada no se quede anticuada en septiembre.
   A partir de julio ya se habla del curso que viene.
   ============================================================ */
function cursoAcademico(hoy = new Date()) {
  const y = hoy.getFullYear();
  const ini = hoy.getMonth() >= 6 ? y : y - 1;
  const dos = (n) => String(n % 100).padStart(2, "0");
  return `${dos(ini)}/${dos(ini + 1)}`;
}
const cajaCurso = q("#curso");
if (cajaCurso) cajaCurso.textContent = cursoAcademico();

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
addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarMenu(); });

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
      e.target.style.transitionDelay = `${Math.min(i, 5) * 70}ms`;
      e.target.classList.add("dentro");
      o.unobserve(e.target);
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
  surgen.forEach((el) => obs.observe(el));
} else {
  surgen.forEach((el) => el.classList.add("dentro"));
}

/* ---------- Enlaces sueltos de WhatsApp ---------- */
const MENSAJES = {
  ingles: {
    tel: TEL_INGLES,
    texto: "Hola, escribo desde la web de GACU. Quería información sobre las clases de inglés y los niveles A2, B1 y B2.",
  },
  mates: {
    tel: TEL_MATES,
    texto: "Hola, escribo desde la web de GACU. Quería información sobre las clases de matemáticas y física y química.",
  },
};

qq("[data-wa]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    const m = MENSAJES[el.dataset.wa] || MENSAJES.mates;
    abrirWhatsApp(m.tel, m.texto);
  });
});

/* ============================================================
   PEDIR PLAZA
   Compone el mensaje con lo que rellena la familia y lo abre en WhatsApp,
   en el número del profesor de esa materia. No hay servidor ni base de
   datos: la plaza la confirma la academia por WhatsApp, que es como
   funciona de verdad.

   La vista previa enseña también a qué teléfono va. Eso es a propósito:
   quien escribe sabe con quién está hablando antes de darle a enviar.
   ============================================================ */
const ficha = q("#ficha");

if (ficha) {
  const materia = q("#materia"), curso = q("#curso-sel"), nombre = q("#nombre");
  const aviso = q("#aviso"), vista = q("#vista");

  const momentoElegido = () =>
    ficha.querySelector('input[name="momento"]:checked')?.value || "a cualquier hora";

  const componer = () => {
    const m = MATERIAS[materia.value];
    const alumno = nombre.value.trim();
    const esOtro = curso.value === "otro";
    const queCurso = esOtro ? "" : curso.value;

    // El mensaje tiene que leerse como lo escribiría una persona, con lo que
    // haya rellenado y sin huecos raros: de ahí las tres formas de nombrar al
    // alumno según falte el nombre, el curso o ninguno de los dos.
    const quienes = alumno
      ? (queCurso ? `${alumno}, de ${queCurso},` : alumno)
      : (queCurso ? `un alumno de ${queCurso}` : "");

    let t = "Hola, escribo desde la web de GACU. Quería información";
    if (quienes) t += ` para ${quienes}`;
    t += ` sobre las clases de ${m.texto}.`;
    if (esOtro) t += " El curso no está en la lista, os lo cuento.";
    return `${t} Nos viene mejor ${momentoElegido()}.`;
  };

  const refrescar = () => {
    if (!materia.value) { vista.textContent = ""; return; }
    vista.innerHTML =
      `Se enviará a <strong>${MATERIAS[materia.value].quien}</strong>:<br>«${componer()}»`;
  };
  ficha.addEventListener("input", () => { refrescar(); aviso.hidden = true; });
  ficha.addEventListener("change", refrescar);
  refrescar();

  ficha.addEventListener("submit", (e) => {
    e.preventDefault();

    const faltan = [];
    [[materia, "la materia"], [curso, "el curso"], [nombre, "el nombre"]].forEach(([campo, nom]) => {
      const vacio = !campo.value.trim();
      campo.setAttribute("aria-invalid", String(vacio));
      if (vacio) faltan.push(nom);
    });

    if (faltan.length) {
      aviso.textContent = "Falta " + faltan.join(", ") + ".";
      aviso.hidden = false;
      ficha.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    aviso.hidden = true;
    abrirWhatsApp(MATERIAS[materia.value].tel, componer());
  });
}

q("#anyo").textContent = String(new Date().getFullYear());
