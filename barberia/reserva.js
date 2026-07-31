/* ============================================================
   Sistema de citas
   ------------------------------------------------------------
   IMPORTANTE — alcance real de esto:

   Calcula los huecos libres de verdad a partir del horario, la
   duración de cada servicio y las citas ya ocupadas, y compone la
   petición. Lo que NO hace, porque no hay servidor, es guardar la
   cita ni compartir la disponibilidad entre visitantes: dos personas
   podrían pedir el mismo hueco.

   Para convertirlo en una agenda de verdad solo hay que sustituir
   `citasOcupadas()` por una llamada al backend y enviar la reserva
   con fetch en vez de por WhatsApp. Todo lo demás vale igual.
   ============================================================ */

/* ---------- Configuración editable ---------- */

const SERVICIOS = [
  { id: "corte",    nombre: "Corte de pelo",        duracion: 30, precio: 14 },
  { id: "barba",    nombre: "Arreglo de barba",     duracion: 20, precio: 9  },
  { id: "completo", nombre: "Corte + barba",        duracion: 45, precio: 20 },
  { id: "navaja",   nombre: "Afeitado a navaja",    duracion: 30, precio: 15 },
  { id: "nino",     nombre: "Corte infantil",       duracion: 25, precio: 11 },
  { id: "cero",     nombre: "Rapado a máquina",     duracion: 15, precio: 9  },
];

const BARBEROS = [
  { id: "cualquiera", nombre: "Me da igual", nota: "El primero que quede libre" },
  { id: "b1",         nombre: "Barbero 1",   nota: "" },
  { id: "b2",         nombre: "Barbero 2",   nota: "" },
];

/* 0 = domingo … 6 = sábado. Lista vacía = cerrado. */
const HORARIO = {
  0: [],
  1: [["10:00", "14:00"], ["17:00", "20:30"]],
  2: [["10:00", "14:00"], ["17:00", "20:30"]],
  3: [["10:00", "14:00"], ["17:00", "20:30"]],
  4: [["10:00", "14:00"], ["17:00", "20:30"]],
  5: [["10:00", "14:00"], ["17:00", "21:00"]],
  6: [["10:00", "14:30"]],
};

const INTERVALO = 15;          // cada cuántos minutos empieza un hueco
const DIAS_VISTA = 21;         // cuántos días hacia delante se ofrecen
const ANTELACION_MIN = 60;     // no se puede pedir cita para dentro de menos de esto
const WHATSAPP = "34633675849"; // formato internacional, sin "+" ni espacios

/* ---------- Utilidades de tiempo ---------- */

const aMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const aHora = (min) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const DIAS_CORTO = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

/* ---------- Citas ya ocupadas ----------
   Datos de demostración: se generan de forma estable a partir de la
   fecha, para que la maqueta siempre enseñe algunos huecos cogidos.
   SUSTITUIR por la respuesta del servidor. */
function citasOcupadas(fechaISO) {
  let semilla = 0;
  for (const c of fechaISO) semilla = (semilla * 31 + c.charCodeAt(0)) % 9973;
  const ocupadas = [];
  for (let i = 0; i < 6; i++) {
    semilla = (semilla * 73 + 41) % 9973;
    const inicio = 10 * 60 + (semilla % 40) * 15;   // entre las 10:00 y las 20:00
    ocupadas.push({ inicio, fin: inicio + 30 });
  }
  return ocupadas;
}

/* ---------- Cálculo de huecos ---------- */

function tramosDe(fecha) {
  return (HORARIO[fecha.getDay()] || []).map(([a, b]) => ({ desde: aMin(a), hasta: aMin(b) }));
}

const abreAlgunDia = (fecha) => tramosDe(fecha).length > 0;

/** Huecos libres de un día para un servicio de `duracion` minutos. */
function huecosLibres(fecha, duracion) {
  const hoy = new Date();
  const esHoy = iso(fecha) === iso(hoy);
  const ahora = hoy.getHours() * 60 + hoy.getMinutes();
  const ocupadas = citasOcupadas(iso(fecha));
  const libres = [];

  for (const t of tramosDe(fecha)) {
    for (let m = t.desde; m + duracion <= t.hasta; m += INTERVALO) {
      if (esHoy && m < ahora + ANTELACION_MIN) continue;
      const choca = ocupadas.some((o) => m < o.fin && m + duracion > o.inicio);
      if (!choca) libres.push(m);
    }
  }
  return libres;
}

/* ---------- Estado ---------- */

const estado = { servicio: null, barbero: BARBEROS[0], fecha: null, hora: null };

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

/* ---------- Pintado ---------- */

function pintarServicios() {
  $("#listaServicios").innerHTML = SERVICIOS.map((s, i) => `
    <li>
      <input type="radio" name="servicio" id="srv-${s.id}" value="${s.id}" class="sr">
      <label for="srv-${s.id}" class="opcion opcion--servicio">
        <span class="opcion__nombre">${s.nombre}</span>
        <span class="opcion__meta">${s.duracion} min</span>
        <span class="opcion__precio">${s.precio} €</span>
      </label>
    </li>`).join("");
}

function pintarBarberos() {
  $("#listaBarberos").innerHTML = BARBEROS.map((b, i) => `
    <li>
      <input type="radio" name="barbero" id="brb-${b.id}" value="${b.id}" class="sr"${i === 0 ? " checked" : ""}>
      <label for="brb-${b.id}" class="opcion opcion--barbero">
        <span class="opcion__nombre">${b.nombre}</span>
        ${b.nota ? `<span class="opcion__meta">${b.nota}</span>` : ""}
      </label>
    </li>`).join("");
}

function pintarDias() {
  const hoy = new Date();
  let html = "";
  for (let i = 0; i < DIAS_VISTA; i++) {
    const d = new Date(hoy); d.setDate(hoy.getDate() + i);
    if (!abreAlgunDia(d)) continue;
    const clave = iso(d);
    const libres = estado.servicio ? huecosLibres(d, estado.servicio.duracion).length : 1;
    html += `
      <li>
        <input type="radio" name="dia" id="dia-${clave}" value="${clave}" class="sr"${libres ? "" : " disabled"}>
        <label for="dia-${clave}" class="dia${libres ? "" : " dia--lleno"}">
          <span class="dia__sem">${i === 0 ? "hoy" : DIAS_CORTO[d.getDay()]}</span>
          <span class="dia__num">${d.getDate()}</span>
          <span class="dia__mes">${MESES[d.getMonth()].slice(0, 3)}</span>
        </label>
      </li>`;
  }
  $("#listaDias").innerHTML = html;
}

function pintarHoras() {
  const cont = $("#listaHoras");
  const aviso = $("#avisoHoras");

  if (!estado.servicio || !estado.fecha) {
    cont.innerHTML = "";
    aviso.textContent = !estado.servicio
      ? "Elige primero un servicio."
      : "Elige un día para ver las horas libres.";
    aviso.hidden = false;
    return;
  }

  const libres = huecosLibres(estado.fecha, estado.servicio.duracion);
  if (!libres.length) {
    cont.innerHTML = "";
    aviso.textContent = "No queda ningún hueco ese día. Prueba con otro.";
    aviso.hidden = false;
    return;
  }

  aviso.hidden = true;
  cont.innerHTML = libres.map((m) => `
    <li>
      <input type="radio" name="hora" id="h-${m}" value="${aHora(m)}" class="sr">
      <label for="h-${m}" class="hora">${aHora(m)}</label>
    </li>`).join("");
}

function pintarResumen() {
  const { servicio, barbero, fecha, hora } = estado;
  const listo = servicio && fecha && hora;

  $("#resumenServicio").textContent = servicio ? `${servicio.nombre} · ${servicio.duracion} min` : "—";
  $("#resumenBarbero").textContent  = barbero ? barbero.nombre : "—";
  $("#resumenCuando").textContent   = fecha && hora
    ? `${DIAS_CORTO[fecha.getDay()]} ${fecha.getDate()} de ${MESES[fecha.getMonth()]}, ${hora}`
    : "—";
  $("#resumenPrecio").textContent   = servicio ? `${servicio.precio} €` : "—";

  $("#confirmar").disabled = !listo;
  $("#faltan").hidden = listo;
}

/* ---------- Interacción ---------- */

function conectar() {
  $("#listaServicios").addEventListener("change", (e) => {
    estado.servicio = SERVICIOS.find((s) => s.id === e.target.value) || null;
    estado.hora = null;
    pintarDias();
    // Se pierde el día elegido si ya no tiene huecos para el nuevo servicio
    if (estado.fecha && !huecosLibres(estado.fecha, estado.servicio.duracion).length) estado.fecha = null;
    else if (estado.fecha) $(`#dia-${iso(estado.fecha)}`)?.setAttribute("checked", "");
    pintarHoras();
    pintarResumen();
  });

  $("#listaBarberos").addEventListener("change", (e) => {
    estado.barbero = BARBEROS.find((b) => b.id === e.target.value) || BARBEROS[0];
    pintarResumen();
  });

  $("#listaDias").addEventListener("change", (e) => {
    const [a, m, d] = e.target.value.split("-").map(Number);
    estado.fecha = new Date(a, m - 1, d);
    estado.hora = null;
    pintarHoras();
    pintarResumen();
  });

  $("#listaHoras").addEventListener("change", (e) => {
    estado.hora = e.target.value;
    pintarResumen();
  });

  $("#formCita").addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = $("#cNombre").value.trim();
    const tel = $("#cTel").value.trim();
    if (!nombre || !tel) {
      $("#formAviso").textContent = "Necesitamos tu nombre y un teléfono para confirmarte la cita.";
      (!nombre ? $("#cNombre") : $("#cTel")).focus();
      return;
    }

    const { servicio, barbero, fecha, hora } = estado;
    const texto = [
      "Hola, quería pedir cita en la barbería.",
      "",
      `Servicio: ${servicio.nombre} (${servicio.duracion} min · ${servicio.precio} €)`,
      `Barbero: ${barbero.nombre}`,
      `Día: ${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`,
      `Hora: ${hora}`,
      "",
      `Nombre: ${nombre}`,
      `Teléfono: ${tel}`,
      $("#cNota").value.trim() ? `Nota: ${$("#cNota").value.trim()}` : "",
    ].filter(Boolean).join("\n");

    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
    $("#formAviso").textContent = "Te hemos abierto WhatsApp con la petición. Envíala y te confirmamos la cita.";
  });
}

/* ---------- Arranque ---------- */

pintarServicios();
pintarBarberos();
pintarDias();
pintarHoras();
pintarResumen();
conectar();
