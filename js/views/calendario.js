(function (G) {
  "use strict";
  var Org = G.Org;
  var U = Org.ui;
  var S = Org.store;

  var Cal = Org.views.Cal = {
    move: function (delta) {
      var c = S.state.cal;
      var m = c.m + delta;
      var y = c.y + Math.floor(m / 12);
      m = ((m % 12) + 12) % 12;
      S.state.cal = { y: y, m: m };
      S.notify();
    },

    pick: function (iso) {
      S.state.calSel = iso;
      S.notify();
    },

    render: function () {
      var root = document.getElementById("view-cal");
      if (!root) return;
      var st = S.state;
      var c = st.cal;
      var y = c.y, m = c.m;

      var first = new Date(y, m, 1);
      var offset = (first.getDay() + 6) % 7;
      var dim = new Date(y, m + 1, 0).getDate();
      var prevDim = new Date(y, m, 0).getDate();
      var today = U.hoyISO();

      var total = offset + dim;
      var rows = Math.ceil(total / 7);
      var pad = rows * 7;

      var dows = ["L", "M", "X", "J", "V", "S", "D"].map(function (d) {
        return '<div class="cal-dow">' + d + "</div>";
      }).join("");

      var cells = "";
      for (var i = 0; i < pad; i++) {
        var dayNum, iso, cls = "cal-day";
        if (i < offset) {
          dayNum = prevDim - offset + i + 1;
          iso = U.isoFromDate(new Date(y, m - 1, dayNum));
          cls += " other";
        } else if (i >= offset + dim) {
          dayNum = i - offset - dim + 1;
          iso = U.isoFromDate(new Date(y, m + 1, dayNum));
          cls += " other";
        } else {
          dayNum = i - offset + 1;
          iso = U.isoFromDate(new Date(y, m, dayNum));
        }
        if (iso === today) cls += " today";
        if (iso === S.state.calSel) cls += " selected";

        var evs = S.eventsFor(iso);
        var dots = [];
        evs.slice(0, 2).forEach(function (e) { dots.push({ c: e.color || "#9d86cf" }); });
        S.pendingFor(iso).slice(0, Math.max(0, 3 - dots.length)).forEach(function (t) { dots.push({ c: t.color || "#9d86cf" }); });
        var extra = S.pendingFor(iso).length + evs.length - 3;
        var dotsHTML = dots.map(function (d) {
          return '<span class="dot" style="background:' + U.esc(d.c) + '"></span>';
        }).join("");
        if (extra > 0) dotsHTML += '<span class="dot" style="background:#9d86cf"></span>';

        cells += '<div class="' + cls + '" data-action="cal-pick" data-iso="' + iso + '">' +
          '<span>' + dayNum + "</span><div class=\"dots\">" + dotsHTML + "</div></div>";
      }

      var selIso = S.state.calSel || today;
      var selEvs = S.eventsFor(selIso);
      var selTasks = S.tasksFor(selIso);
      var dayEventList = selEvs.length ?
        '<div class="events-strip">' + selEvs.map(U.eventPillHTML).join("") + "</div>" : "";
      var dayTaskList = selTasks.length ?
        selTasks.map(function (t) { return U.taskCardHTML(t); }).join("")
        : U.emptyHTML("Sin tareas para este d\u00eda.");

      root.innerHTML =
        '<div class="cal-nav">' +
        '<button class="cal-prev" type="button" data-action="cal-prev" aria-label="Mes anterior">&lt;</button>' +
        '<span class="cal-month">' + U.esc(U.monthTitle(y, m)) + "</span>" +
        '<button class="cal-next" type="button" data-action="cal-next" aria-label="Mes siguiente">&gt;</button></div>' +
        '<div class="cal-grid">' + dows + cells + "</div>" +

        '<div class="cal-day-panel">' +
        '<h4>' + U.esc(U.fullDayISO(selIso)) +
        '<button class="add-mini" type="button" data-action="add-event-cal" data-iso="' + selIso + '">+</button></h4>' +
        dayEventList +
        dayTaskList +
        "</div>";
    }
  };
})(window);