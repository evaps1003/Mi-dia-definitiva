(function (G) {
  "use strict";
  var Org = G.Org;
  var U = Org.ui;
  var S = Org.store;
  var repo = Org.repo;

  var A = Org.add = {};

  // ── Estado de formulario ─────────────────────────────────────
  var mBlock = { id: null, color: "#D9CDEF" };
  var mHabit = { id: null, color: "#D9CDEF", emoji: "\uD83D\uDCA7" };
  var mTask  = { id: null, color: "#FBDCC6" };

  // ── BLOQUE ───────────────────────────────────────────────────
  A.openBlockModal = function (opts) {
    opts = opts || {};
    mBlock.id = opts.blockId || null;
    var b = null;
    if (mBlock.id) {
      b = S.state.blocks.filter(function (x) { return x.id === mBlock.id; })[0];
    }
    var weekday = b ? b.weekday : (opts.weekday !== undefined ? opts.weekday : 1);
    var start = b ? U.fmtMin(b.startMin) : "09:00";
    var end = b ? U.fmtMin(b.endMin) : "10:00";
    mBlock.color = b ? b.color : "#D9CDEF";

    document.getElementById("blockModalTitle").textContent = mBlock.id ? "Editar bloque" : "A\u00f1adir bloque";
    document.getElementById("block-title").value = b ? b.title : "";
    U.buildWeekdaySelect(document.getElementById("block-weekday"), weekday);
    document.getElementById("block-start").value = start;
    document.getElementById("block-end").value = end;
    U.renderSwatches(document.getElementById("block-swatches"), mBlock.color, function (hex) { mBlock.color = hex; });
    document.getElementById("block-delete").hidden = !mBlock.id;
    U.openModal("modal-block");
  };

  document.getElementById("form-block").addEventListener("submit", function (e) {
    e.preventDefault();
    var title = document.getElementById("block-title").value.trim();
    var weekday = +document.getElementById("block-weekday").value;
    var startMin = U.minsFromTime(document.getElementById("block-start").value);
    var endMin = U.minsFromTime(document.getElementById("block-end").value);
    if (!title) return U.toast("Escribe un t\u00edtulo");
    if (endMin <= startMin) return U.toast("El fin debe ser tras el inicio");
    var data = { title: title, weekday: weekday, startMin: startMin, endMin: endMin, color: mBlock.color };
    var p = mBlock.id ? repo.blocks.update(mBlock.id, data) : repo.blocks.add(data);
    p.then(function () {
      U.closeModal("modal-block");
      S.refresh();
    });
  });

  document.getElementById("block-delete").addEventListener("click", function () {
    if (!mBlock.id) return;
    Org.controls.deleteBlock(mBlock.id).then(function () {
      U.closeModal("modal-block");
      U.toast("Bloque eliminado");
    });
  });

  // ── HÁBITO ───────────────────────────────────────────────────
  A.openHabitModal = function (opts) {
    opts = opts || {};
    mHabit.id = opts.habitId || null;
    var h = null;
    if (mHabit.id) {
      h = S.state.habits.filter(function (x) { return x.id === mHabit.id; })[0];
    }
    mHabit.emoji = h ? h.icon : "\uD83D\uDCA7";
    mHabit.color = h ? h.color : "#D9CDEF";

    document.getElementById("habitModalTitle").textContent = mHabit.id ? "Editar h\u00e1bito" : "A\u00f1adir h\u00e1bito";
    document.getElementById("habit-title").value = h ? h.title : "";
    U.renderSwatches(document.getElementById("habit-swatches"), mHabit.color, function (hex) { mHabit.color = hex; });
    U.renderEmojiGrid(document.getElementById("habit-emojis"), mHabit.emoji, function (emo) { mHabit.emoji = emo; });
    document.getElementById("habit-delete").hidden = !mHabit.id;
    U.openModal("modal-habit");
  };

  document.getElementById("form-habit").addEventListener("submit", function (e) {
    e.preventDefault();
    var title = document.getElementById("habit-title").value.trim();
    if (!title) return U.toast("Escribe un h\u00e1bito");
    var data = { title: title, icon: mHabit.emoji, color: mHabit.color, sortPos: mHabit.pos || 0 };
    if (mHabit.id) {
      data.sortPos = (S.state.habits.filter(function (x) { return x.id === mHabit.id; })[0] || {}).sortPos || 0;
      return repo.habits.update(mHabit.id, data).then(function () {
        U.closeModal("modal-habit");
        S.refresh();
      });
    }
    var maxPos = S.state.habits.reduce(function (m, h) { return Math.max(m, h.sortPos || 0); }, 0);
    data.sortPos = maxPos + 1;
    repo.habits.add(data).then(function () {
      U.closeModal("modal-habit");
      S.refresh();
      U.toast("H\u00e1bito a\u00f1adido");
    });
  });

  document.getElementById("habit-delete").addEventListener("click", function () {
    if (!mHabit.id) return;
    Org.controls.deleteHabit(mHabit.id).then(function () {
      U.closeModal("modal-habit");
      U.toast("H\u00e1bito eliminado");
    });
  });

  // ── TAREA ────────────────────────────────────────────────────
  A.openTaskModal = function (opts) {
    opts = opts || {};
    mTask.id = opts.taskId || null;
    var t = null;
    if (mTask.id) {
      t = S.state.tasks.filter(function (x) { return x.id === mTask.id; })[0];
    }
    var presetIso = (opts.iso && opts.iso !== "buzon") ? opts.iso : null;
    var isBuzon = !!opts.toBuzon || (t && !t.dueDate);
    mTask.color = t ? t.color : "#FBDCC6";

    document.getElementById("taskModalTitle").textContent = mTask.id ? "Editar tarea" : "A\u00f1adir tarea";
    document.getElementById("task-title").value = t ? t.title : "";
    var dateInput = document.getElementById("task-date");
    dateInput.value = t ? (t.dueDate || "") : (presetIso || "");
    var buzonChk = document.getElementById("task-buzon");
    buzonChk.checked = isBuzon;
    dateInput.disabled = isBuzon;

    U.renderSwatches(document.getElementById("task-swatches"), mTask.color, function (hex) { mTask.color = hex; });

    document.getElementById("task-delete").hidden = !mTask.id;
    U.openModal("modal-task");
  };

  document.getElementById("task-buzon").addEventListener("change", function (e) {
    document.getElementById("task-date").disabled = e.target.checked;
  });

  document.getElementById("form-task").addEventListener("submit", function (e) {
    e.preventDefault();
    var title = document.getElementById("task-title").value.trim();
    if (!title) return U.toast("Escribe una tarea");
    var toBuzon = document.getElementById("task-buzon").checked;
    var dateVal = document.getElementById("task-date").value;
    var data = { title: title, dueDate: toBuzon ? null : (dateVal || U.hoyISO()), color: mTask.color };
    if (mTask.id) {
      var cur = S.state.tasks.filter(function (x) { return x.id === mTask.id; })[0] || {};
      data.completed = cur.completed || 0;
    }
    var p = mTask.id ? repo.tasks.update(mTask.id, data) : repo.tasks.add(data);
    p.then(function () {
      U.closeModal("modal-task");
      S.refresh();
      U.toast(toBuzon ? "Enviada al Buz\u00f3n" : "Tarea guardada");
    });
  });

  document.getElementById("task-delete").addEventListener("click", function () {
    if (!mTask.id) return;
    Org.controls.deleteTask(mTask.id).then(function () {
      U.closeModal("modal-task");
      U.toast("Tarea eliminada");
    });
  });

  // ── BUZÓN ────────────────────────────────────────────────────
  A.renderBuzon = function () {
    var box = document.getElementById("buzonList");
    if (!box) return;
    var list = S.pendingBuzon();
    if (!list.length) {
      box.innerHTML = '<div class="buzon-empty">\uD83D\uDCE5\u200B Nada pendiente.<br>Est\u00e1s al d\u00eda.</div>';
      return;
    }
    var today = U.hoyISO();
    box.innerHTML = list.map(function (t) {
return '<div class="buzon-item">' +
      '<div class="bt" data-action="edit-task" data-id="' + t.id + '" style="cursor:pointer">' + U.esc(t.title) + "</div>" +
        '<input type="date" value="" data-action="buzon-date" data-id="' + t.id + '" title="Asignar fecha">' +
        '<div class="buzon-actions">' +
        '<button type="button" class="mini hoy" data-action="buzon-hoy" data-id="' + t.id + '">Mover a Hoy</button>' +
        '<button type="button" class="mini del2" data-action="buzon-done" data-id="' + t.id + '">\u2713 Hecho</button>' +
        '<button type="button" class="mini del" data-action="buzon-del" data-id="' + t.id + '">\u2715 Borrar</button>' +
        "</div></div>";
    }).join("");
  };

})(window);