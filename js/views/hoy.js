(function (G) {
  "use strict";
  var Org = G.Org;
  var U = Org.ui;
  var S = Org.store;

  var Hoy = Org.views = Org.views || {};
  Hoy.Hoy = {
    render: function () {
      var root = document.getElementById("view-hoy");
      if (!root) return;
      var st = S.state;
      var iso = st.selectedISO || U.hoyISO();
      var today = U.hoyISO();

      var blocks = S.blocksFor(iso);
      var habits = st.habits;
      var tasks = S.tasksFor(iso);
      var bcount = S.buzonCount();
      var banner = (iso === today && bcount > 0) ?
        '<div class="buzon-banner" data-action="buzon-open">' +
        '<span class="buzon-ico"><img class="app-icon" src="icons/buzon.svg" alt=""></span>' +
        '<span class="buzon-txt">' + (bcount === 1 ? "Tienes 1 tarea en el buz\u00f3n" : "Tienes " + bcount + " tareas en el buz\u00f3n") + "</span>" +
        '<span class="buzon-count">' + bcount + '</span><span class="chev">\u203a</span></div>' : "";

      var crono = smartCrono(iso, blocks);
      var habs = habits.length ?
        habits.map(function (h) { return U.habitCardHTML(h, S.habitDone(h.id, iso), iso); }).join("")
        : U.emptyHTML("Crea h\u00e1bitos diarios para darle ritmo a tu d\u00eda.");

      var taskList = tasks.length ?
        tasks.map(function (t) { return U.taskCardHTML(t); }).join("")
        : U.emptyHTML("No hay tareas asignadas a este d\u00eda.");

      root.innerHTML =
        U.weekPillStrip(iso) +

        '<div class="section-title"><span>Cronograma</span>' +
        '<button class="add-mini" type="button" data-action="add-block-sec">+</button></div>' +
        crono +

        '<div class="section-title"><span>H\u00e1bitos diarios</span>' +
        '<button class="add-mini" type="button" data-action="add-habit-sec">+</button></div>' +
        habs +

        '<div class="section-title"><span>Tareas de hoy</span>' +
        '<button class="add-mini" type="button" data-action="add-task-sec">+</button></div>' +
        banner + taskList;
    }
  };

  // ── Cronograma inteligente ultra-compacto ────────────────────
  function smartCrono(iso, blocks) {
    var now = U.nowMinutes();
    var isToday = iso === U.hoyISO();

    if (!blocks.length) {
      return '<div class="smart-card" style="--dot:#D9CDEF">' +
        '<span class="smart-badge free">Libre</span>' +
        '<div class="smart-body"><div class="smart-free">Sin bloques en este d\u00eda</div></div></div>';
    }

    if (isToday) {
      var current = blocks.filter(function (b) { return now >= b.startMin && now < b.endMin; });
      if (current.length) {
        var b = current[0];
        return smartCardHTML("now", "Ahora", U.fmtMin(b.startMin) + " \u2013 " + U.fmtMin(b.endMin), b);
      }
      var nextB = blocks.filter(function (b) { return b.startMin > now; })[0];
      if (nextB) {
        return smartCardHTML("next", "Siguiente", U.fmtMin(nextB.startMin) + " \u2013 " + U.fmtMin(nextB.endMin), nextB);
      }
      return '<div class="smart-card" style="--dot:#C5E7D8">' +
        '<span class="smart-badge free">Libre</span>' +
        '<div class="smart-body"><div class="smart-free">Sin m\u00e1s bloques hoy \u00b7 tiempo libre</div></div></div>';
    }

    // Día distinto de hoy: resumen compacto
    var firstH = U.fmtMin(blocks[0].startMin);
    var lastE = U.fmtMin(blocks[blocks.length - 1].endMin);
    return '<div class="smart-card" style="--dot:#D9CDEF">' +
      '<span class="smart-badge">' + blocks.length + (blocks.length === 1 ? " bloque" : " bloques") + "</span>" +
      '<div class="smart-body"><div class="smart-time">' + firstH + " \u2013 " + lastE + '</div>' +
      '<div class="smart-title">Rutina de este d\u00eda</div></div></div>';
  }

  function smartCardHTML(kind, label, time, block) {
    var cls = kind === "next" ? " next" : "";
    return '<div class="smart-card" style="--dot:' + U.esc(block.color) + '" data-action="edit-block" data-id="' + block.id + '">' +
      '<span class="smart-badge' + cls + '">' + label + "</span>" +
      '<div class="smart-body"><div class="smart-time">' + time + "</div>" +
      '<div class="smart-title">' + U.esc(block.title) + "</div></div></div>";
  }
})(window);