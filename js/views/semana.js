(function (G) {
  "use strict";
  var Org = G.Org;
  var U = Org.ui;
  var S = Org.store;

  var START_H = 8;
  var END_H = 22;
  var ROW = 18; // px por hora

  Org.views.Horario = {
    render: function () {
      var root = document.getElementById("view-semana");
      if (!root) return;

      var tabs =
        '<div class="mode-tabs">' +
        '<button type="button" class="mode-tab' + (S.state.semanaMode === "day" ? " active" : "") + '" data-action="semana-mode" data-mode="day">Por D\u00eda</button>' +
        '<button type="button" class="mode-tab' + (S.state.semanaMode === "map" ? " active" : "") + '" data-action="semana-mode" data-mode="map">Mapa Semanal</button>' +
        "</div>";

      root.innerHTML = tabs +
        (S.state.semanaMode === "map" ? this.mapHTML() : this.dayHTML());
    },

    // ── Modo Por Día ────────────────────────────────────────────
    dayHTML: function () {
      var st = S.state;
      var w = st.semanaWday;

      var pills = Org.EDITOR_ORDER.map(function (d) {
        var sel = d === w ? " selected" : "";
        var short = Org.WEEK_SHORT[d];
        return '<div class="pill wday-pill' + sel + '" data-action="set-wday" data-w="' + d + '">' +
          '<span class="w">' + short + (d === new Date().getDay() ? " \u00b7" : "") + "</span></div>";
      }).join("");

      var blocks = st.blocks.filter(function (b) { return b.weekday === w; })
        .sort(function (a, b) { return a.startMin - b.startMin; });

      var list = blocks.length ?
        '<div class="timeline">' + blocks.map(U.bloqueCardHTML).join("") + "</div>" :
        U.emptyHTML("Sin bloques este d\u00eda. Usa la plantilla para reservarlo.");

      return '<div class="week-row"><div class="pill-strip">' + pills + "</div></div>" +
        '<div class="section-title"><span>Bloques de ' + Org.WEEK_NAMES[w] + "</span>" +
        '<button class="add-mini" type="button" data-action="add-block-wday" data-w="' + w + '">+</button></div>' +
        list +
        '<p class="hint">Plantilla fija que se repite cada semana. Toca un bloque para editarlo.</p>';
    },

    // ── Modo Mapa Semanal ───────────────────────────────────────
    mapHTML: function () {
      var st = S.state;
      var hours = [];
      for (var h = START_H; h <= END_H; h++) hours.push(h);
      var todayW = new Date().getDay();

      var gutter = hours.map(function (h) {
        return '<div class="map-hour">' + h + "</div>";
      }).join("");

      var dows = Org.EDITOR_ORDER.map(function (d) {
        var sel = d === st.semanaWday ? " sel" : "";
        var tdy = d === todayW ? " today" : "";
        return '<div class="map-dow' + sel + tdy + '" data-action="map-day" data-w="' + d + '">' +
          Org.WEEK_SHORT[d] + "</div>";
      }).join("");

      var cols = Org.EDITOR_ORDER.map(function (d) {
        var blocks = st.blocks.filter(function (b) { return b.weekday === d; })
          .sort(function (a, b) { return a.startMin - b.startMin; });
        var sel = d === st.semanaWday ? " sel" : "";
        var tdy = d === todayW ? " today" : "";
        var bars = blocks.map(function (b) {
          var top = (b.startMin - START_H * 60) / 60 * ROW;
          var hgt = Math.max((b.endMin - b.startMin) / 60 * ROW, 5);
          return '<div class="map-block" data-action="map-day" data-w="' + d + '"' +
            ' style="top:' + top.toFixed(1) + 'px;height:' + hgt.toFixed(1) + 'px;background:' + U.esc(b.color) + '"></div>';
        }).join("");
        return '<div class="map-col' + sel + tdy + '" data-action="map-day" data-w="' + d + '">' + bars + "</div>";
      }).join("");

      return '<div class="map">' +
        '<div class="map-head"><div class="map-gutter-head"></div>' + dows + "</div>" +
        '<div class="map-body"><div class="map-gutter">' + gutter + "</div>" +
        '<div class="map-track" style="height:' + (hours.length * ROW) + 'px">' + cols + "</div></div>" +
        '<p class="hint">Toca un d\u00eda o un bloque para ver su detalle.</p></div>';
    }
  };
})(window);