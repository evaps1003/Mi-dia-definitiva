(function (G) {
  "use strict";
  var Org = G.Org;
  var U = Org.ui;
  var S = Org.store;
  var controls = Org.controls;
  var Cal = Org.views.Cal;

  function registerSW() {
    if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
      navigator.serviceWorker.register("./sw.js").catch(function () {});
    }
  }

  function init() {
    Org.db.open()
      .then(function () { return S.load(); })
      .then(function () {
        Org.clock.init();
        registerSW();
        S.notify();
      })
      .catch(function (err) {
        console.error(err);
        var el = document.getElementById("view-hoy");
        if (el) el.innerHTML = U.emptyHTML("No se pudo abrir la base de datos local: " + U.esc(err && err.message ? err.message : err));
      });
  }

  // ── Renderers globales ───────────────────────────────────────
  // Fallback de emojis OpenMoji: si un SVG no carga, muestra el carácter
  document.addEventListener("error", function (e) {
    var t = e.target;
    if (!t || t.tagName !== "IMG" || !t.classList.contains("emoji")) return;
    var r = document.createElement("span");
    r.className = "emoji-fallback";
    r.textContent = t.getAttribute("data-char") || "";
    t.replaceWith(r);
  }, true);
  S.on(function () {
    Org.views.Hoy.render();
    Org.views.Horario.render();
    Cal.render();
  });
  S.on(function () {
    var m = document.getElementById("modal-buzon");
    if (m && !m.hidden) Org.add.renderBuzon();
  });

  // ── Delegación de clics ──────────────────────────────────────
  document.addEventListener("click", function (e) {
    var nav = e.target.closest(".nav-item");
    if (nav) { U.showView(nav.dataset.view); return; }

    var el = e.target.closest("[data-action]");
    if (!el) return;
    var a = el.dataset.action;
    var id = el.dataset.id ? +el.dataset.id : null;
    var iso = S.state.selectedISO || U.hoyISO();

    switch (a) {
      case "add-block-sec": Org.add.openBlockModal({ weekday: U.weekdayOf(iso) }); break;
      case "add-habit-sec": Org.add.openHabitModal({}); break;
      case "add-task-sec": Org.add.openTaskModal({ iso: iso }); break;

      case "set-wday":
        S.state.semanaWday = +el.dataset.w;
        S.notify();
        break;

      case "semana-mode":
        S.state.semanaMode = el.dataset.mode;
        S.notify();
        break;

      case "map-day":
        S.state.semanaWday = +el.dataset.w;
        S.state.semanaMode = "day";
        S.notify();
        break;

      case "add-block-wday":
        Org.add.openBlockModal({ weekday: +el.dataset.w });
        break;

      case "pick-day": controls.setDay(el.dataset.iso); break;
      case "week-prev": controls.shiftWeek(-1); break;
      case "week-next": controls.shiftWeek(1); break;

      case "edit-block":
        Org.add.openBlockModal({ blockId: id });
        break;

      case "edit-habit":
        if (e.target.closest(".check")) return;
        Org.add.openHabitModal({ habitId: id });
        break;

      case "edit-task":
        if (e.target.closest(".check")) return;
        Org.add.openTaskModal({ taskId: id });
        break;

      case "buzon-open":
        Org.add.renderBuzon();
        U.openModal("modal-buzon");
        break;

      case "buzon-hoy":
        controls.reassignTask(id, U.hoyISO()).then(function () { Org.add.renderBuzon(); });
        break;

      case "buzon-done":
        controls.toggleTask(id, true).then(function () { Org.add.renderBuzon(); });
        break;

      case "buzon-del":
        controls.deleteTask(id).then(function () {
          Org.add.renderBuzon();
          U.toast("Tarea borrada");
        });
        break;

      case "cal-prev": Cal.move(-1); break;
      case "cal-next": Cal.move(1); break;
      case "cal-pick": Cal.pick(el.dataset.iso); break;

      case "add-task-cal":
        Org.add.openTaskModal({ iso: el.dataset.iso });
        break;

      case "modal-close":
        var m = el.closest(".modal");
        if (m) m.hidden = true;
        else U.closeAllModals();
        break;
    }
  });

  // ── Cambios en checkboxs y fechas dinámicas ──────────────────
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.dataset.action === "task-toggle") {
      controls.toggleTask(+t.dataset.id, t.checked);
    } else if (t.dataset.action === "habit-toggle") {
      controls.toggleHabit(+t.dataset.id, t.dataset.iso, t.checked);
    } else if (t.dataset.action === "buzon-date") {
      controls.reassignTask(+t.dataset.id, t.value || null).then(function () {
        U.toast(t.value ? "Reasignada al " + t.value : "Enviada al Buz\u00f3n");
        Org.add.renderBuzon();
      });
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") U.closeAllModals();
  });

  init();
})(window);