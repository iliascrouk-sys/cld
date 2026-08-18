/* ============================================================
   Sistema de citas
   ------------------------------------------------------------
   ALCANCE REAL DE ESTO, dicho claro:

   Calcula los huecos que caben de verdad en el horario del taller
   contando lo que dura cada trabajo, no deja pedir cita para dentro
   de dos minutos y compone la petición con todos los datos del coche.

   Lo que NO hace, porque no hay servidor detrás: guardar la cita ni
   compartir la disponibilidad entre visitantes. Llega como mensaje de
   WhatsApp y alguien tiene que apuntarla. Por eso la página dice
   «petición de cita» y no «cita confirmada» — conviene explicárselo
   al cliente con esas mismas palabras.

   Para convertirlo en una agenda de verdad hay que tocar dos sitios y
   nada más: `citasOcupadas()` y el envío. Está señalado abajo.
   ============================================================ */

/* ---------- Servicios y lo que dura cada uno ----------
   La duración no es decorativa: es lo que hace que a las 19:30 no se
   ofrezca un trabajo de suspensión de dos horas. Si el taller dice que
   una pre-ITV le lleva hora y media, se cambia aquí el número y todo lo
   demás se recalcula solo.

   No hay precios a propósito. En mecánica, un «desde 90 €» que luego no
   se cumple hace más daño que no poner nada: el presupuesto se da después
   de mirar el coche. */

const SERVICIOS = [
  { id: "diagnosis", nombre: "Diagnosis electrónica",        duracion: 60,  nota: "Lectura de centralita" },
  { id: "electri",   nombre: "Electricidad y batería",       duracion: 60,  nota: "Alternador, arranque, luces" },
  { id: "preitv",    nombre: "Revisión pre-ITV",             duracion: 60,  nota: "Antes de pasarla" },
  { id: "manten",    nombre: "Mantenimiento",                duracion: 60,  nota: "Aceite, filtros y revisión" },
  { id: "frenos",    nombre: "Frenos",                       duracion: 90,  nota: "Pastillas, discos, líquido" },
  { id: "suspen",    nombre: "Suspensión y dirección",       duracion: 120, nota: "Amortiguadores, rótulas" },
  { id: "neuma",     nombre: "Neumáticos y equilibrado",     duracion: 45,  nota: "" },
  { id: "averia",    nombre: "Una avería: no sé qué tiene",  duracion: 60,  nota: "Se mira y se te llama" },
];

const INTERVALO      = 30;   // cada cuántos minutos puede empezar un hueco
const DIAS_VISTA     = 21;   // cuántos días hacia delante se ofrecen
const ANTELACION_MIN = 120;  // no se acepta cita para dentro de menos de esto

/* El horario y el WhatsApp salen de TALLER, en script.js: un solo sitio. */
const HORARIO = TALLER.horario;

/* ---------- Citas ya ocupadas ----------
   ⚙ PARA CONECTAR UNA AGENDA DE VERDAD: esta función es el único punto de
   entrada. Tiene que devolver, para el día que se le pasa, la lista de
   tramos ya cogidos en minutos desde medianoche:

       [{ inicio: 600, fin: 660 }, …]     // 600 = 10:00

   Hoy devuelve una lista vacía a propósito: sin servidor no hay forma de
   saber qué está cogido, y ofrecer un hueco de más (que se confirma por
   WhatsApp) hace menos daño que ocultar uno que estaba libre. */
function citasOcupadas(/* fechaISO */) {
  return [];
}

/* ---------- Utilidades de tiempo ---------- */

const aMinutos = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const aHHMM    = (min)  => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const iso      = (d)    => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const DIAS_CORTO = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

const duracionBonita = (min) =>
  min < 60 ? `${min} min`
  : min % 60 === 0 ? `${min / 60} h`
  : `${Math.floor(min / 60)} h ${min % 60} min`;

/* ---------- Cálculo de huecos ---------- */

const tramosDe = (fecha) =>
  (HORARIO[fecha.getDay()] || []).map(([a, b]) => ({ desde: aMinutos(a), hasta: aMinutos(b) }));

const abreEseDia = (fecha) => tramosDe(fecha).length > 0;

/** Huecos libres de un día para un trabajo de `duracion` minutos. */
function huecosLibres(fecha, duracion) {
  const hoy = new Date();
  const esHoy = iso(fecha) === iso(hoy);
  const ahora = hoy.getHours() * 60 + hoy.getMinutes();
  const ocupadas = citasOcupadas(iso(fecha));
  const libres = [];

  for (const t of tramosDe(fecha)) {
    /* El trabajo tiene que caber entero dentro del turno: si la suspensión
       dura dos horas y el turno cierra a las 20:00, el último hueco es a
       las 18:00 y no a las 19:30. */
    for (let m = t.desde; m + duracion <= t.hasta; m += INTERVALO) {
      if (esHoy && m < ahora + ANTELACION_MIN) continue;
      const choca = ocupadas.some((o) => m < o.fin && m + duracion > o.inicio);
      if (!choca) libres.push(m);
    }
  }
  return libres;
}

/* ---------- Estado ---------- */

const cita = { servicio: null, fecha: null, hora: null, recogida: false };

const $  = (s) => document.querySelector(s);

/* ---------- Pintado ---------- */

function pintarServicios() {
  $("#listaServicios").innerHTML = SERVICIOS.map((s) => `
    <li>
      <input type="radio" name="servicio" id="srv-${s.id}" value="${s.id}">
      <label for="srv-${s.id}" class="opcion">
        <span class="opcion__nombre">${s.nombre}</span>
        <span class="opcion__meta">${duracionBonita(s.duracion)}${s.nota ? " · " + s.nota : ""}</span>
      </label>
    </li>`).join("");
}

function pintarDias() {
  const hoy = new Date();
  let html = "";

  for (let i = 0; i < DIAS_VISTA; i++) {
    const d = new Date(hoy); d.setDate(hoy.getDate() + i);
    if (!abreEseDia(d)) continue;

    const clave = iso(d);
    /* Sin servicio elegido todavía no se puede saber qué cabe: se dejan
       todos los días activos y ya se recalcula al elegirlo. */
    const libres = cita.servicio ? huecosLibres(d, cita.servicio.duracion).length : 1;
    const elegido = cita.fecha && iso(cita.fecha) === clave;

    html += `
      <li>
        <input type="radio" name="dia" id="dia-${clave}" value="${clave}"${libres ? "" : " disabled"}${elegido ? " checked" : ""}>
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
  const cont = $("#listaHoras"), aviso = $("#avisoHoras");

  if (!cita.servicio || !cita.fecha) {
    cont.innerHTML = "";
    aviso.textContent = !cita.servicio
      ? "Elige primero qué necesita el coche."
      : "Elige un día para ver las horas libres.";
    aviso.hidden = false;
    return;
  }

  const libres = huecosLibres(cita.fecha, cita.servicio.duracion);
  if (!libres.length) {
    cont.innerHTML = "";
    aviso.textContent = "Ese día ya no da tiempo a ese trabajo. Prueba con otro.";
    aviso.hidden = false;
    return;
  }

  aviso.hidden = true;
  cont.innerHTML = libres.map((m) => `
    <li>
      <input type="radio" name="hora" id="h-${m}" value="${aHHMM(m)}"${cita.hora === aHHMM(m) ? " checked" : ""}>
      <label for="h-${m}" class="hora">${aHHMM(m)}</label>
    </li>`).join("");
}

function pintarResumen() {
  const { servicio, fecha, hora, recogida } = cita;
  const listo = servicio && fecha && hora;

  $("#resumenServicio").textContent  = servicio ? servicio.nombre : "—";
  $("#resumenDuracion").textContent  = servicio ? duracionBonita(servicio.duracion) : "—";
  $("#resumenCuando").textContent    = fecha && hora
    ? `${DIAS_CORTO[fecha.getDay()]} ${fecha.getDate()} de ${MESES[fecha.getMonth()]}, ${hora}`
    : "—";
  $("#resumenRecogida").textContent  = recogida ? "Sí, pasáis a por él" : "No, lo llevo yo";

  $("#confirmar").disabled = !listo;
  $("#faltan").hidden = listo;
}

const pintarTodo = () => { pintarDias(); pintarHoras(); pintarResumen(); };

/* ---------- Interacción ---------- */

$("#listaServicios").addEventListener("change", (e) => {
  cita.servicio = SERVICIOS.find((s) => s.id === e.target.value) || null;
  cita.hora = null;
  /* Si el día que ya había elegido no admite el nuevo trabajo (una
     suspensión no cabe donde cabía un equilibrado), se suelta el día en vez
     de dejarlo marcado sin horas debajo. */
  if (cita.fecha && !huecosLibres(cita.fecha, cita.servicio.duracion).length) cita.fecha = null;
  pintarTodo();
});

$("#listaDias").addEventListener("change", (e) => {
  const [a, m, d] = e.target.value.split("-").map(Number);
  cita.fecha = new Date(a, m - 1, d);
  cita.hora = null;
  pintarHoras();
  pintarResumen();
});

$("#listaHoras").addEventListener("change", (e) => {
  cita.hora = e.target.value;
  pintarResumen();
});

$("#cRecogida").addEventListener("change", (e) => {
  cita.recogida = e.target.checked;
  pintarResumen();
});

/* ---------- Envío ----------
   ⚙ PARA CONECTAR UNA AGENDA DE VERDAD: sustituir el window.open por un
   fetch que grabe la cita. Todo lo de arriba vale igual. */

$("#formCita").addEventListener("submit", (e) => {
  e.preventDefault();

  const nombre = $("#cNombre").value.trim();
  const tel    = $("#cTel").value.trim();
  const coche  = $("#cCoche").value.trim();
  const aviso  = $("#formAviso");

  if (!nombre || !tel || !coche) {
    aviso.textContent = "Faltan tu nombre, un teléfono y la marca y modelo del coche.";
    (!nombre ? $("#cNombre") : !tel ? $("#cTel") : $("#cCoche")).focus();
    return;
  }

  const { servicio, fecha, hora, recogida } = cita;
  const matricula = $("#cMat").value.trim();
  const nota      = $("#cNota").value.trim();

  /* Las líneas que sobran se marcan con null y no con "", porque las cadenas
     vacías de aquí son los renglones en blanco que separan los tres bloques
     del mensaje: si se filtraran por «falsy» se irían también y llegaría todo
     apelmazado en un párrafo. */
  const texto = [
    "Hola, quería pedir cita en el taller.",
    "",
    `Servicio: ${servicio.nombre} (${duracionBonita(servicio.duracion)})`,
    `Día: ${DIAS_CORTO[fecha.getDay()]} ${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`,
    `Hora: ${hora}`,
    "",
    `Coche: ${coche}`,
    matricula ? `Año o matrícula: ${matricula}` : null,
    nota ? `Le pasa esto: ${nota}` : null,
    "",
    `Nombre: ${nombre}`,
    `Teléfono: ${tel}`,
    recogida ? "Recogida a domicilio: SÍ, ¿podéis pasar a por el coche?" : null,
  ].filter((l) => l !== null).join("\n");

  window.open(`https://wa.me/${TALLER.whatsapp}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
  aviso.textContent = "Te hemos abierto WhatsApp con la petición escrita. Envíala y te confirmamos la cita.";
});

/* ---------- Arranque ---------- */

pintarServicios();
pintarTodo();
