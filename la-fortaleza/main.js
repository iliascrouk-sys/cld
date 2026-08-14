/* ==========================================================================
   LA FORTALEZA · Bar-Restaurante · Cuenca
   main.js — JavaScript plano, sin modulos, sin compilar.

   REGLA DE ORO DE ESTE ARCHIVO
   El JavaScript solo ADORNA. Todo el contenido importante (la carta entera,
   el horario, el telefono, la direccion) esta escrito en index.html. Si este
   archivo no llega a cargarse, o si falla a la mitad, la web se sigue
   leyendo y se sigue pudiendo reservar.

   Por eso cada bloque va envuelto en safe(): si uno revienta, se anota en la
   consola y los demas siguen funcionando.
   ========================================================================== */
(function () {
  "use strict";

  var VER = "?v=20260814";
  var DATA = window.__FORTALEZA__ || {};
  var doc = document;

  /* --------------------------------------------------------------- utiles */
  function safe(fn, name) {
    try {
      fn();
    } catch (err) {
      if (window.console && console.warn) {
        console.warn("[La Fortaleza] el bloque «" + name + "» ha fallado:", err);
      }
    }
  }
  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel));
  }
  function on(el, ev, fn, opt) { if (el) el.addEventListener(ev, fn, opt || false); }

  var hasGSAP = typeof window.gsap !== "undefined";
  var hasST = hasGSAP && typeof window.ScrollTrigger !== "undefined";
  if (hasST) { window.gsap.registerPlugin(window.ScrollTrigger); }

  var isDesktop = window.matchMedia("(min-width: 901px)");
  var isFine = window.matchMedia("(hover: hover) and (pointer: fine)");

  /* ======================================================== 1 · SPLASH ====
     Red de seguridad 2 de 2. La 1 es la animacion CSS, que lo aparta sola a
     los 4,5 s. Esta lo quita en cuanto la pagina termina de cargar.        */
  safe(function () {
    var splash = $("#splash");
    if (!splash) return;
    var t0 = Date.now();
    var done = false;

    function hide() {
      if (done) return;
      done = true;
      splash.classList.add("splash--off");
      doc.body.style.removeProperty("overflow");
    }

    function whenLoaded() {
      // se deja al menos 1,4 s para que la cascada de letras se lea
      setTimeout(hide, Math.max(0, 1400 - (Date.now() - t0)));
    }

    if (doc.readyState === "complete") whenLoaded();
    else on(window, "load", whenLoaded);

    setTimeout(hide, 3200);   // por si el evento load no llega nunca
  }, "splash");

  /* ====================================================== 2 · NAVEGACION == */
  safe(function () {
    var nav = $("#nav");
    var burger = $("#burger");
    var menu = $("#navmenu");

    function onScroll() {
      if (!nav) return;
      nav.classList.toggle("is-stuck", window.scrollY > 40);
    }
    on(window, "scroll", onScroll, { passive: true });
    onScroll();

    function close() {
      if (!menu || !burger) return;
      menu.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Abrir el menú");
    }

    on(burger, "click", function () {
      if (!menu) return;
      var open = menu.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Cerrar el menú" : "Abrir el menú");
    });

    $$("#navmenu a").forEach(function (a) { on(a, "click", close); });
    on(doc, "keydown", function (e) { if (e.key === "Escape") close(); });
  }, "nav");

  /* ========================================================= 3 · CURSOR ===
     Solo en raton de verdad. En movil ni se monta.                         */
  safe(function () {
    if (!isFine.matches) return;
    var cur = $("#cursor");
    if (!cur) return;
    var label = $(".cursor__label", cur);

    var tx = -200, ty = -200, cx = -200, cy = -200, raf = 0;

    on(window, "mousemove", function (e) { tx = e.clientX; ty = e.clientY; });

    function loop() {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cur.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    var hot = "a, button, [data-cursor], input, textarea, .lanes";
    on(doc, "mouseover", function (e) {
      var t = e.target.closest ? e.target.closest(hot) : null;
      if (!t) return;
      var txt = t.getAttribute("data-cursor");
      if (!txt) {
        var p = t.closest("[data-cursor]");
        txt = p ? p.getAttribute("data-cursor") : "";
      }
      cur.classList.add("is-hot");
      if (label) label.textContent = txt || "";
    });
    on(doc, "mouseout", function (e) {
      var t = e.target.closest ? e.target.closest(hot) : null;
      if (!t) return;
      cur.classList.remove("is-hot");
      if (label) label.textContent = "";
    });
  }, "cursor");

  /* ================================================ 4 · TEXTO EN PALABRAS =
     Parte los titulares para animarlos uno a uno. Si GSAP no esta, no se
     parte nada y el titular aparece entero: se lee igual.                  */
  function splitInto(el, mode) {
    var text = el.textContent;
    var parts = mode === "chars" ? text.split("") : text.split(/(\s+)/);
    var frag = doc.createDocumentFragment();
    var made = [];

    parts.forEach(function (p) {
      if (p === "") return;
      if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(p)); return; }
      if (mode === "chars" && p === " ") { frag.appendChild(doc.createTextNode(" ")); return; }
      var s = doc.createElement("span");
      s.className = mode === "chars" ? "char" : "word";
      s.textContent = p;
      frag.appendChild(s);
      made.push(s);
    });

    el.textContent = "";
    el.appendChild(frag);
    return made;
  }

  /* ====================================================== 5 · REVELADOS ===
     Dos motores: GSAP si esta disponible, y si no un IntersectionObserver
     normal. Y por encima de los dos, un temporizador de 6 s que lo enseña
     todo pase lo que pase.                                                 */
  safe(function () {
    var items = $$(".reveal");
    if (!items.length) return;

    if (hasST) {
      items.forEach(function (el) {
        var mode = el.getAttribute("data-split");

        if (mode && el.children.length === 0) {
          var bits = splitInto(el, mode);
          el.classList.add("is-in");          // el padre deja de estar oculto
          if (bits.length) {
            window.gsap.set(bits, { y: "0.55em", opacity: 0 });
            window.ScrollTrigger.create({
              trigger: el,
              start: "top 90%",
              once: true,
              onEnter: function () {
                window.gsap.to(bits, {
                  y: 0, opacity: 1,
                  duration: 0.9,
                  ease: "power3.out",
                  stagger: mode === "chars" ? 0.035 : 0.055
                });
              }
            });
            return;
          }
        }

        window.ScrollTrigger.create({
          trigger: el,
          start: "top 92%",
          once: true,
          onEnter: function () { el.classList.add("is-in"); }
        });
      });
      return;
    }

    // --- sin GSAP: observador normal, umbral muy bajo --------------------
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      });
    }, { threshold: 0.03, rootMargin: "0px 0px -6% 0px" });
    items.forEach(function (el) { io.observe(el); });
  }, "revelados");

  /* ======================================================= 6 · LA CARTA ===
     En pantalla grande y con GSAP: la seccion se fija y la pista avanza en
     horizontal al bajar. En movil, o sin GSAP, es un carrusel de toda la
     vida que se desliza con el dedo.                                       */
  safe(function () {
    var sec = $(".carta");
    var pin = $("#cartaPin");
    var view = $("#cartaViewport");
    var track = $("#cartaTrack");
    if (!sec || !pin || !view || !track) return;

    var cards = $$(".dish", track);
    var now = $("#cartaNow");
    var bar = $("#cartaBar");
    var tot = $(".carta__tot");
    if (tot) tot.textContent = pad(cards.length);

    function pad(n) { return (n < 10 ? "0" : "") + n; }

    function setProgress(p) {
      p = Math.max(0, Math.min(1, p));
      var i = Math.round(p * (cards.length - 1)) + 1;
      if (now) now.textContent = pad(i);
      if (bar) bar.style.width = (p * 100).toFixed(1) + "%";
    }
    setProgress(0);

    // --- dibujado del line-art al entrar en pantalla ---------------------
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add("is-drawn");
          io.unobserve(en.target);
        });
      }, { threshold: 0.05 });
      cards.forEach(function (c) { io.observe(c); });
    } else {
      cards.forEach(function (c) { c.classList.add("is-drawn"); });
    }

    // --- movil / sin GSAP: scroll nativo ---------------------------------
    function nativeProgress() {
      var max = view.scrollWidth - view.clientWidth;
      setProgress(max > 0 ? view.scrollLeft / max : 0);
    }
    on(view, "scroll", nativeProgress, { passive: true });

    // --- escritorio con GSAP: pin + desplazamiento horizontal ------------
    if (!hasST) return;

    var tween = null;

    function build() {
      if (tween) { tween.scrollTrigger && tween.scrollTrigger.kill(); tween.kill(); tween = null; }
      sec.classList.remove("is-pinned");
      window.gsap.set(track, { x: 0 });

      if (!isDesktop.matches) { nativeProgress(); return; }

      sec.classList.add("is-pinned");

      var dist = function () { return Math.max(0, track.scrollWidth - view.clientWidth); };
      if (dist() <= 0) { sec.classList.remove("is-pinned"); return; }

      tween = window.gsap.to(track, {
        x: function () { return -dist(); },
        ease: "none",
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: function () { return "+=" + (dist() + window.innerHeight * 0.5); },
          pin: true,
          scrub: 0.55,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: function (self) { setProgress(self.progress); }
        }
      });
    }

    build();
    on(window, "resize", debounce(function () {
      build();
      window.ScrollTrigger.refresh();
    }, 220));
  }, "carta");

  /* ======================================================= 7 · GALERIA ====
     Monta los carriles desde el manifiesto. Idempotente: si ya hay algo
     dentro, no vuelve a montar.                                            */
  safe(function () {
    var lanes = [$("#lane1"), $("#lane2"), $("#lane3")];
    var fotos = DATA.gallery || [];
    if (!fotos.length) return;

    lanes.forEach(function (lane, idx) {
      if (!lane || lane.children.length > 0) return;    // idempotente
      var mias = fotos.filter(function (f) { return (f.carril || 1) === idx + 1; });
      if (!mias.length) return;

      var frag = doc.createDocumentFragment();
      // se pinta dos veces: la animacion desplaza un 50% y encadena sin salto
      for (var pass = 0; pass < 2; pass++) {
        mias.forEach(function (f) {
          var fig = doc.createElement("figure");
          var img = doc.createElement("img");
          img.src = f.src + VER;
          img.alt = pass === 0 ? (f.alt || "") : "";
          img.loading = "lazy";
          img.decoding = "async";
          if (pass === 1) fig.setAttribute("aria-hidden", "true");
          fig.appendChild(img);
          frag.appendChild(fig);
        });
      }
      lane.appendChild(frag);
    });

    if (hasST) setTimeout(function () { window.ScrollTrigger.refresh(); }, 300);
  }, "galeria");

  /* ======================================================== 8 · GRUPOS ====
     Inclinacion suave siguiendo el raton.                                  */
  safe(function () {
    var card = $("#gruposCard");
    if (!card || !isFine.matches) return;

    on(card, "mousemove", function (e) {
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform =
        "perspective(1400px) rotateX(" + (-py * 3).toFixed(2) + "deg) rotateY(" +
        (px * 3.4).toFixed(2) + "deg)";
    });
    on(card, "mouseleave", function () {
      card.style.transform = "perspective(1400px) rotateX(1.6deg) rotateY(-1.2deg)";
    });
  }, "grupos");

  /* ================================================ 9 · DATOS DEL LOCAL ===
     Vuelca lo que hay en lib/manifest.js sobre el HTML. El HTML ya trae los
     datos correctos escritos; esto solo los actualiza si el cliente los ha
     cambiado en el manifiesto.                                             */
  safe(function () {
    var b = DATA.brand;
    if (!b) return;

    var wa = String(b.whatsapp || "").replace(/[^0-9]/g, "");
    var tel = String(b.telefono || "");

    // enlaces de WhatsApp con su mensaje ya escrito
    $$("[data-wa]").forEach(function (a) {
      var kind = a.getAttribute("data-wa");
      var msg = kind === "grupos" ? b.mensajeGrupos : b.mensajeRapido;
      if (wa) a.href = "https://wa.me/" + wa + (msg ? "?text=" + encodeURIComponent(msg) : "");
    });

    // telefono, tal y como se lee y tal y como se marca
    $$('a[href^="tel:"]').forEach(function (a) {
      if (wa) a.href = "tel:+" + wa;
      if (tel && a.textContent.replace(/\s/g, "").match(/^[0-9+]+$/)) a.textContent = tel;
    });

    // instagram
    if (b.instagram) {
      $$('a[href*="instagram.com"]').forEach(function (a) {
        a.href = "https://instagram.com/" + b.instagram;
        if (a.textContent.indexOf("@") === 0) a.textContent = "@" + b.instagram;
      });
    }
  }, "datos del local");

  /* ====================================================== 10 · HORARIO ====
     Reconstruye la tabla desde el manifiesto y marca el dia de hoy.        */
  safe(function () {
    var table = $("#hoursTable");
    var horas = DATA.horas;
    if (!table || !horas || !horas.length) return;

    var tbody = table.querySelector("tbody") || table;
    var hoy = new Date().getDay();               // 0 = domingo
    var orden = [1, 2, 3, 4, 5, 6, 0];           // la tabla empieza en lunes

    var html = "";
    horas.forEach(function (d, i) {
      var cerrado = d.cerrado || !d.turnos || !d.turnos.length;
      var txt = cerrado
        ? "Cerrado"
        : d.turnos.map(function (t) { return t[0] + "–" + t[1]; }).join(" · ");
      var cls = [];
      if (cerrado) cls.push("is-closed");
      if (orden[i] === hoy) cls.push("is-today");
      html += "<tr" + (cls.length ? ' class="' + cls.join(" ") + '"' : "") +
              "><th>" + d.dia + "</th><td>" + txt + "</td></tr>";
    });
    tbody.innerHTML = html;
  }, "horario");

  /* ======================================================== 11 · CARTA ====
     Vuelca los platos del manifiesto sobre las tarjetas ya escritas en el
     HTML. Si el cliente borra un plato del manifiesto, su tarjeta se quita;
     si los reordena, se reordenan.                                         */
  safe(function () {
    var track = $("#cartaTrack");
    var menu = DATA.menu;
    if (!track || !menu || !menu.length) return;

    var porId = {};
    $$(".dish", track).forEach(function (c) { porId[c.getAttribute("data-dish")] = c; });

    var vistos = {};
    menu.forEach(function (p, i) {
      var card = porId[p.dibujo] || porId[p.id];
      if (!card) return;                       // no hay dibujo para ese plato
      vistos[p.dibujo || p.id] = true;

      set(card, ".dish__serie", p.serie);
      set(card, ".dish__name", p.nombre);
      set(card, ".dish__sub", p.subtitulo);
      set(card, ".dish__ings", p.ingredientes);
      set(card, ".dish__txt", p.texto);

      var idx = card.querySelector(".dish__idx");
      if (idx) idx.textContent = (i + 1 < 10 ? "0" : "") + (i + 1);

      track.appendChild(card);                 // reordena segun el manifiesto
    });

    // los platos que ya no estan en el manifiesto se retiran
    Object.keys(porId).forEach(function (k) {
      if (!vistos[k] && porId[k].parentNode) porId[k].parentNode.removeChild(porId[k]);
    });

    var tot = $(".carta__tot");
    if (tot) {
      var n = $$(".dish", track).length;
      tot.textContent = (n < 10 ? "0" : "") + n;
    }

    function set(root, sel, val) {
      if (val === undefined || val === null) return;
      var el = root.querySelector(sel);
      if (el) el.textContent = val;
    }
  }, "carta desde el manifiesto");

  /* ================================================= 12 · FORMULARIO ======
     No manda nada a ningun servidor: compone el mensaje y abre WhatsApp.   */
  safe(function () {
    var form = $("#form");
    if (!form) return;

    var f = {
      nombre: $("#f-nombre"),
      tel: $("#f-tel"),
      dia: $("#f-dia"),
      pax: $("#f-pax"),
      nota: $("#f-nota")
    };
    var err = $("#formErr");
    var prev = $("#formPreview");

    var DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
                 "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

    // no se puede reservar para ayer
    if (f.dia) {
      var ahora = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
      f.dia.min = ahora.toISOString().slice(0, 16);
    }

    function fechaLegible(v) {
      if (!v) return "";
      var d = new Date(v);
      if (isNaN(d.getTime())) return v;
      var hh = ("0" + d.getHours()).slice(-2);
      var mm = ("0" + d.getMinutes()).slice(-2);
      return DIAS[d.getDay()] + " " + d.getDate() + " de " + MESES[d.getMonth()] +
             ", " + hh + ":" + mm;
    }

    function mensaje() {
      var b = DATA.brand || {};
      var l = [];
      l.push("Hola, quería reservar mesa en " + (b.nombre || "La Fortaleza") + ".");
      l.push("");
      l.push("Nombre: " + val(f.nombre));
      l.push("Personas: " + val(f.pax));
      l.push("Día: " + fechaLegible(val(f.dia)));
      l.push("Teléfono: " + val(f.tel));
      if (val(f.nota)) l.push("Nota: " + val(f.nota));
      return l.join("\n");
    }

    function val(el) { return el && el.value ? el.value.trim() : ""; }

    function pintarPreview() {
      if (!prev) return;
      var partes = [];
      if (val(f.nombre)) partes.push(val(f.nombre));
      if (val(f.pax)) partes.push(val(f.pax) + (val(f.pax) === "1" ? " persona" : " personas"));
      if (val(f.dia)) partes.push(fechaLegible(val(f.dia)));
      prev.textContent = partes.length ? partes.join(" · ") : "—";
    }

    ["input", "change"].forEach(function (ev) {
      Object.keys(f).forEach(function (k) { on(f[k], ev, pintarPreview); });
    });
    pintarPreview();

    function fallo(campo, texto) {
      if (err) { err.textContent = texto; err.hidden = false; }
      if (campo) { campo.classList.add("is-bad"); campo.focus(); }
      return false;
    }

    on(form, "submit", function (e) {
      e.preventDefault();
      if (err) err.hidden = true;
      Object.keys(f).forEach(function (k) { if (f[k]) f[k].classList.remove("is-bad"); });

      if (!val(f.nombre)) return fallo(f.nombre, "Falta el nombre de la reserva.");
      if (!val(f.tel)) return fallo(f.tel, "Falta un teléfono de contacto.");
      if (!val(f.dia)) return fallo(f.dia, "Falta el día y la hora.");
      if (!val(f.pax) || Number(val(f.pax)) < 1) return fallo(f.pax, "¿Cuántos vais a ser?");

      var b = DATA.brand || {};
      var wa = String(b.whatsapp || "34614658919").replace(/[^0-9]/g, "");
      window.open("https://wa.me/" + wa + "?text=" + encodeURIComponent(mensaje()),
                  "_blank", "noopener");
      return true;
    });
  }, "formulario");

  /* ============================================ 13 · RED DE SEGURIDAD =====
     Pase lo que pase, a los 6 segundos no puede quedar nada escondido.     */
  safe(function () {
    setTimeout(function () {
      $$(".reveal:not(.is-in)").forEach(function (el) { el.classList.add("is-in"); });
      $$(".reveal[data-split]").forEach(function (el) { el.classList.add("is-failsafe"); });
      $$(".dish:not(.is-drawn)").forEach(function (el) { el.classList.add("is-drawn"); });
      var sp = $("#splash");
      if (sp) sp.classList.add("splash--off");
    }, 6000);
  }, "red de seguridad");

  /* ------------------------------------------------------ recalculos ----- */
  safe(function () {
    if (!hasST) return;
    if (doc.fonts && doc.fonts.ready && doc.fonts.ready.then) {
      doc.fonts.ready.then(function () { window.ScrollTrigger.refresh(); });
    }
    on(window, "load", function () { window.ScrollTrigger.refresh(); });
  }, "recalculo");

  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, ms);
    };
  }
})();
