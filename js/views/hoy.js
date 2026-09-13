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

      var events = S.eventsFor(iso);
      var habits = st.habits;
      var tasks = S.tasksFor(iso);
      var bcount = S.buzonCount();
      var banner = (iso === today && bcount > 0) ?
        '<div class="buzon-banner" data-action="buzon-open">' +
        '<span class="buzon-ico"><img class="app-icon" src="icons/buzon.svg" alt=""></span>' +
        '<span class="buzon-txt">' + (bcount === 1 ? "Tienes 1 tarea en el buz\u00f3n" : "Tienes " + bcount + " tareas en el buz\u00f3n") + "</span>" +
        '<span class="buzon-count">' + bcount + '</span><span class="chev">\u203a</span></div>' : "";

      var habs = habits.length ?
        habits.map(function (h) { return U.habitCardHTML(h, S.habitDone(h.id, iso), iso); }).join("")
        : U.emptyHTML("Crea h\u00e1bitos diarios para darle ritmo a tu d\u00eda.");

      var taskList = tasks.length ?
        tasks.map(function (t) { return U.taskCardHTML(t, iso); }).join("")
        : U.emptyHTML("No hay tareas asignadas a este d\u00eda.");

      var blocks = S.blocksFor(iso);
      var avisoBlocks = blocks.filter(function (b) { return b.showAsAviso; });
      var avisos = (events.length || avisoBlocks.length) ?
        '<div class="events-strip">' + events.map(U.eventPillHTML).join("") +
        avisoBlocks.map(U.bloquePillHTML).join("") + "</div>" : "";
      var blockTitle = iso === today ? "Horario de hoy" : "Horario de " + Org.WEEK_NAMES[U.weekdayOf(iso)];
      var blockList = blocks.length ?
        '<div class="timeline">' + blocks.map(U.bloqueCardHTML).join("") + "</div>" :
        U.emptyHTML("Sin bloques este d\u00eda.");

      root.innerHTML =
        U.weekPillStrip(iso, null, { nav: false }) +
        avisos +

        '<div class="section-title"><span>' + blockTitle + "</span></div>" +
        blockList +

        '<div class="section-title"><span>H\u00e1bitos diarios</span>' +
        '<button class="add-mini" type="button" data-action="add-habit-sec">+</button></div>' +
        habs +

        '<div class="section-title"><span>Tareas de hoy</span>' +
        '<button class="add-mini" type="button" data-action="add-task-sec">+</button></div>' +
        banner + taskList;
    }
  };
})(window);