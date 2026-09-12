(function (G) {
  "use strict";
  var Org = G.Org;
  var U = Org.ui = {};

  // ── Helpers ──────────────────────────────────────────────────
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function hoyISO() { var d = new Date(); return isoFromDate(d); }
  function isoFromDate(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function dateFromISO(iso) { var p = iso.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDaysISO(iso, n) { var d = dateFromISO(iso); d.setDate(d.getDate() + n); return isoFromDate(d); }
  function weekdayOf(iso) { return dateFromISO(iso).getDay(); }
  function mondayOfISO(iso) {
    var d = dateFromISO(iso);
    var dow = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
    d.setDate(d.getDate() - dow);
    return isoFromDate(d);
  }
  function weekDaysOfISO(iso) {
    var m = mondayOfISO(iso);
    var arr = [];
    for (var i = 0; i < 7; i++) arr.push(addDaysISO(m, i));
    return arr;
  }
  function fmtMin(m) { var h = Math.floor(m / 60); var mm = m % 60; return pad(h) + ":" + pad(mm); }
  function minsFromTime(str) { var p = str.split(":"); return (+p[0]) * 60 + (+p[1]); }
  function nowMinutes() { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
  function fmtRangeISO(a, b) {
    var da = dateFromISO(a), db = dateFromISO(b);
    var ya = da.getFullYear(), yb = db.getFullYear();
    var ma = da.getMonth(), mb = db.getMonth();
    if (ya === yb && ma === mb) return da.getDate() + " \u2013 " + db.getDate() + " de " + Org.MONTHS_FULL[ma];
    if (ya === yb) return da.getDate() + " de " + Org.MONTHS_SHORT[ma] + " \u2013 " + db.getDate() + " de " + Org.MONTHS_SHORT[mb];
    return da.getDate() + " de " + Org.MONTHS_SHORT[ma] + " " + ya + " \u2013 " + db.getDate() + " de " + Org.MONTHS_SHORT[mb] + " " + yb;
  }
  function monthTitle(y, m) { return Org.MONTHS_FULL[m] + " " + y; }
  function fullDayISO(iso) { var w = Org.WEEK_NAMES[weekdayOf(iso)]; var d = dateFromISO(iso); return w + ", " + d.getDate() + " de " + Org.MONTHS_FULL[d.getMonth()]; }
  function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function emojiFile(e) {
    var a = [];
    for (var i = 0; i < e.length; i++) {
      var cp = e.codePointAt(i);
      if (cp > 0xffff) i++;
      if (cp === 0xfe0f) continue; // OpenMoji no incluye el selector de variación FE0F
      a.push(cp.toString(16).toUpperCase());
    }
    return a.join("-");
  }
  function emojiHTML(e, cls) {
    var c = e || "";
    return '<img class="emoji' + (cls ? " " + cls : "") + '" src="img/emoji/' + emojiFile(c) + '.svg" alt="" data-char="' + esc(c) + '">';
  }

  U.pad = pad;
  U.hoyISO = hoyISO;
  U.isoFromDate = isoFromDate;
  U.dateFromISO = dateFromISO;
  U.addDaysISO = addDaysISO;
  U.weekdayOf = weekdayOf;
  U.mondayOfISO = mondayOfISO;
  U.weekDaysOfISO = weekDaysOfISO;
  U.fmtMin = fmtMin;
  U.minsFromTime = minsFromTime;
  U.nowMinutes = nowMinutes;
  U.fmtRangeISO = fmtRangeISO;
  U.monthTitle = monthTitle;
  U.fullDayISO = fullDayISO;
  U.esc = esc;
  U.uid = uid;
  U.emojiHTML = emojiHTML;

  // ── View switching ───────────────────────────────────────────
  function showView(name) {
    document.querySelectorAll(".view").forEach(function (v) { v.classList.remove("active"); });
    var el = document.getElementById("view-" + name);
    if (el) el.classList.add("active");
    document.querySelectorAll(".nav-item").forEach(function (b) {
      b.classList.toggle("active", b.dataset.view === name);
    });
    var titles = { hoy: "Hoy", semana: "Semana", cal: "Calendario" };
    var h1 = document.getElementById("appTitle");
    if (h1) h1.textContent = titles[name] || name;
    Org._activeView = name;
  }
  U.showView = showView;

  // ── Modals ───────────────────────────────────────────────────
  function openModal(id) {
    var el = document.getElementById(id);
    if (el) el.hidden = false;
  }
  function closeModal(id) {
    var el = document.getElementById(id);
    if (el) el.hidden = true;
  }
  function closeAllModals() {
    document.querySelectorAll(".modal").forEach(function (m) { m.hidden = true; });
  }
  U.openModal = openModal;
  U.closeModal = closeModal;
  U.closeAllModals = closeAllModals;

  // ── Toast ────────────────────────────────────────────────────
  var _toastTimer = null;
  function toast(msg) {
    var el = document.getElementById("toast");
    if (!el) return;
    clearTimeout(_toastTimer);
    el.textContent = msg;
    el.hidden = false;
    _toastTimer = setTimeout(function () { el.hidden = true; }, 1800);
  }
  U.toast = toast;

  // ── Swatches / Emoji builders ────────────────────────────────
  function renderSwatches(container, hex, onSelect) {
    container.innerHTML = "";
    Org.PALETTE.forEach(function (p) {
      var d = document.createElement("div");
      d.className = "swatch" + (p.hex === hex ? " selected" : "");
      d.style.background = p.hex;
      d.dataset.hex = p.hex;
      d.dataset.action = "pick-swatch";
      d.addEventListener("click", function (e) {
        e.stopPropagation();
        container.querySelectorAll(".swatch").forEach(function (s) { s.classList.remove("selected"); });
        d.classList.add("selected");
        if (onSelect) onSelect(p.hex);
      });
      container.appendChild(d);
    });
  }
  U.renderSwatches = renderSwatches;

  function renderEmojiGrid(container, selected, onSelect) {
    container.innerHTML = "";
    Org.EMOJIS.forEach(function (e) {
      var d = document.createElement("button");
      d.type = "button";
      d.className = "emoji-btn" + (e === selected ? " selected" : "");
      d.innerHTML = emojiHTML(e);
      d.dataset.action = "pick-emoji";
      d.addEventListener("click", function (ev) {
        ev.preventDefault();
        container.querySelectorAll(".emoji-btn").forEach(function (b) { b.classList.remove("selected"); });
        d.classList.add("selected");
        if (onSelect) onSelect(e);
      });
      container.appendChild(d);
    });
  }
  U.renderEmojiGrid = renderEmojiGrid;

  // ── HTML builders (used by views & controls) ─────────────────
  function checkHTML(checked, inputAttrs) {
    var chk = checked ? " checked" : "";
    return '<label class="check"><input type="checkbox"' + chk + (inputAttrs || "") + '><span class="ring"></span><span class="tick">\u2713</span></label>';
  }

  function bloqueCardHTML(block) {
    var t1 = fmtMin(block.startMin), t2 = fmtMin(block.endMin);
    return '<div class="bloque" data-action="edit-block" data-id="' + block.id + '" style="--dot:' + esc(block.color) + '">' +
      '<div class="b-time">' + t1 + " \u2013 " + t2 + "</div>" +
      '<div class="b-title" style="background:' + esc(block.color) + '">' + esc(block.title) + "</div></div>";
  }

  function taskCardHTML(task) {
    var isDone = !!task.completed;
    var cardCls = isDone ? " done" : "";
    var chk = checkHTML(isDone, ' data-action="task-toggle" data-id="' + task.id + '"');
    var colorBg = task.color || "#D9CDEF";
    var dueLabel = task.dueDate ? task.dueDate.slice(8) + "/" + task.dueDate.slice(5, 7) : "Buz\u00f3n";
    return '<div class="task-card' + cardCls + '" data-action="edit-task" data-id="' + task.id + '">' + chk +
      '<div class="task-body"><span class="task-title">' + esc(task.title) +
      '</span><div class="task-meta"><span class="task-chip" style="background:' + esc(colorBg) + '">' + esc(dueLabel) + "</span></div></div></div>";
  }

  function habitCardHTML(habit, checked, iso) {
    var done = checked ? " done" : "";
    var chk = checkHTML(checked, ' data-action="habit-toggle" data-id="' + habit.id + '" data-iso="' + iso + '"');
    var tintBg = habit.color ? "background:" + habit.color + ";" : "";
    return '<div class="habit-card' + done + '" data-action="edit-habit" data-id="' + habit.id + '">' +
      '<div class="habit-ico" style="' + tintBg + '">' + emojiHTML(habit.icon || "\uD83D\uDCA7") + "</div>" +
      '<span class="habit-name">' + esc(habit.title) + "</span>" + chk + "</div>";
  }

  function emptyHTML(msg) {
    return '<div class="empty"><strong>Sin datos</strong>' + esc(msg) + '</div>';
  }

  function weekPillStrip(selectedISO, onPillClick) {
    var days = weekDaysOfISO(selectedISO);
    var today = hoyISO();
    var first = days[0], last = days[6];
    var range = fmtRangeISO(first, last);
    var jumpBtn = selectedISO === today ? "" : '<button id="jumpToday" type="button">Hoy</button>';
    var pills = '<div class="week-row">' +
      '<button class="week-nav" type="button" data-action="week-prev" aria-label="Semana anterior">&laquo;</button>' +
      '<div class="pill-strip">' +
      days.map(function (iso) {
        var w = Org.WEEK_SHORT[weekdayOf(iso)];
        var d = dateFromISO(iso).getDate();
        var sel = iso === selectedISO ? " selected" : "";
        var tdy = iso === today ? " today" : "";
        return '<div class="pill' + tdy + sel + '" data-action="pick-day" data-iso="' + iso + '">' +
          '<span class="w">' + w + '</span><span class="d">' + d + "</span></div>";
      }).join("") +
      "</div>" +
      '<button class="week-nav" type="button" data-action="week-next" aria-label="Semana siguiente">&raquo;</button>' +
      "</div>" +
      '<div style="display:flex;align-items:center;justify-content:space-between"><span id="weekRange">' + esc(range) + "</span>" + jumpBtn + "</div>";
    return pills;
  }

  U.checkHTML = checkHTML;
  U.bloqueCardHTML = bloqueCardHTML;
  U.taskCardHTML = taskCardHTML;
  U.habitCardHTML = habitCardHTML;
  U.emptyHTML = emptyHTML;
  U.weekPillStrip = weekPillStrip;

  // ── Weekday select options ───────────────────────────────────
  function buildWeekdaySelect(sel, val) {
    sel.innerHTML = "";
    Org.EDITOR_ORDER.forEach(function (w) {
      var opt = document.createElement("option");
      opt.value = w;
      opt.textContent = Org.WEEK_NAMES[w];
      opt.selected = w === val;
      sel.appendChild(opt);
    });
  }
  U.buildWeekdaySelect = buildWeekdaySelect;

})(window);