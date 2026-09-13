(function (G) {
  "use strict";
  var Org = G.Org;
  var U = Org.ui;
  var S = Org.store;

  var START_H = 8;
  var END_H = 22;
  var ROW = 18; // px por hora

  function dayNum(iso) { return U.dateFromISO(iso).getDate(); }
  function dayLabel(iso) { return Org.WEEK_SHORT[U.weekdayOf(iso)].toUpperCase(); }

  Org.views.Horario = {
    render: function () {
      var root = document.getElementById("view-semana");
      if (!root) return;

      var tabs =
        '<div class="mode-tabs">' +
        '<button type="button" class="mode-tab' + (S.state.semanaMode === "day" ? " active" : "") + '" data-action="semana-mode" data-mode="day">Por D\u00eda</button>' +
        '<button type="button" class="mode-tab' + (S.state.semanaMode === "map" ? " active" : "") + '" data-action="semana-mode" data-mode="map">Mapa Semanal</button>' +
        "</div>";

      root.innerHTML = tabs + this.navbarHTML() +
        (S.state.semanaMode === "map" ? this.mapHTML() : this.dayHTML());
    },

    // ── Navegación de semanas: < Semana 15 – 21 Sept >  [Esta semana]
    navbarHTML: function () {
      var iso = S.state.selectedISO || U.hoyISO();
      var days = U.weekDaysOfISO(iso);
      var range = U.fmtRangeISO(days[0], days[6]);
      var today = U.hoyISO();
      var inThisWeek = U.mondayOfISO(iso) === U.mondayOfISO(today);
      var nowBtn = inThisWeek ? '<button class="week-now" type="button" data-action="go-today">Esta semana</button>' : "";
      return '<div class="week-navbar">' +
        '<button class="week-nav" type="button" data-action="week-prev" aria-label="Semana anterior">&lt;</button>' +
        '<div class="week-range"><span class="week-range-main">Semana <strong>' + U.esc(range) + "</strong></span>" + nowBtn + "</div>" +
        '<button class="week-nav" type="button" data-action="week-next" aria-label="Semana siguiente">&gt;</button></div>';
    },

    // ── Modo Por Día ────────────────────────────────────────────
    dayHTML: function () {
      var iso = S.state.selectedISO || U.hoyISO();
      var today = U.hoyISO();

      var pills = U.weekDaysOfISO(iso).map(function (d) {
        var sel = d === iso ? " selected" : "";
        var tdy = d === today ? " today" : "";
        return '<div class="pill wday-pill' + tdy + sel + '" data-action="pick-day" data-iso="' + d + '">' +
          '<span class="w">' + dayLabel(d) + '</span><span class="d">' + dayNum(d) + "</span></div>";
      }).join("");

      var blocks = S.blocksFor(iso);
      var list = blocks.length ?
        '<div class="timeline">' + blocks.map(U.bloqueCardHTML).join("") + "</div>" :
        U.emptyHTML("Sin bloques este d\u00eda. Usa + para reservar este d\u00eda.");

      var tasks = S.tasksFor(iso);
      var taskList = tasks.length ?
        tasks.map(function (t) { return U.taskCardHTML(t, iso); }).join("") :
        U.emptyHTML("No hay tareas para este d\u00eda.");

      var fechaLabel = U.fullDayISO(iso);

      return '<div class="week-row"><div class="pill-strip">' + pills + "</div></div>" +
        '<div class="section-title"><span>Horario \u00b7 ' + U.esc(fechaLabel) + "</span>" +
        '<button class="add-mini" type="button" data-action="add-block-iso" data-iso="' + iso + '">+</button></div>' +
        list +
        '<div class="section-title"><span>Tareas \u00b7 ' + U.esc(fechaLabel) + "</span>" +
        '<button class="add-mini" type="button" data-action="add-task-wday" data-iso="' + iso + '">+</button></div>' +
        taskList +
        '<p class="hint">Toca un d\u00eda arriba para verlo. Toca un bloque o tarea para editarlo.</p>';
    },

    // ── Modo Mapa Semanal ───────────────────────────────────────
    mapHTML: function () {
      var iso = S.state.selectedISO || U.hoyISO();
      var today = U.hoyISO();
      var days = U.weekDaysOfISO(iso);
      var hours = [];
      for (var h = START_H; h <= END_H; h++) hours.push(h);

      var gutter = hours.map(function (h) {
        return '<div class="map-hour">' + h + "</div>";
      }).join("");

      var dows = days.map(function (d) {
        var tdy = d === today ? " today" : "";
        var sel = d === iso ? " sel" : "";
        return '<div class="map-dow' + sel + tdy + '" data-action="map-day" data-iso="' + d + '">' +
          '<span class="mw">' + dayLabel(d) + '</span><span class="md">' + dayNum(d) + "</span></div>";
      }).join("");

      var cols = days.map(function (d) {
        var blocks = S.blocksFor(d);
        var tdy = d === today ? " today" : "";
        var sel = d === iso ? " sel" : "";
        var bars = blocks.map(function (b) {
          var top = (b.startMin - START_H * 60) / 60 * ROW;
          var hgt = Math.max((b.endMin - b.startMin) / 60 * ROW, 5);
          return '<div class="map-block' + (b.date ? " pinned" : "") + '" data-action="map-day" data-iso="' + d + '"' +
            ' title="' + U.esc(b.title) + (b.date ? " \u00b7 solo este d\u00eda" : "") + '"' +
            ' style="top:' + top.toFixed(1) + 'px;height:' + hgt.toFixed(1) + 'px;background:' + U.esc(b.color) + '"></div>';
        }).join("");
        return '<div class="map-col' + sel + tdy + '" data-action="map-day" data-iso="' + d + '">' + bars + "</div>";
      }).join("");

      return '<div class="map">' +
        '<div class="map-head"><div class="map-gutter-head"></div>' + dows + "</div>" +
        '<div class="map-body"><div class="map-gutter">' + gutter + "</div>" +
        '<div class="map-track" style="height:' + (hours.length * ROW) + 'px">' + cols + "</div></div>" +
        '<p class="hint">Navega con las flechas a semanas futuras. Toca un d\u00eda para abrirlo y a\u00f1adir bloques u tareas de esa fecha.</p></div>';
    }
  };
})(window);