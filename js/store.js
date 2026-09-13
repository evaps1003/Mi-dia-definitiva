(function (G) {
  "use strict";
  var Org = G.Org;
  var repo = Org.repo;
  var U = Org.ui;

  var S = Org.store = {
    state: {
      ready: false,
      blocks: [],
      habits: [],
      tasks: [],
      events: [],
      log: {},          // "habitId|YYYY-MM-DD" -> 1/0
      taskLog: {},      // "taskId|YYYY-MM-DD" -> 1/0
      selectedISO: null,
      semanaWday: null, // 0..6 (getDay)
      semanaMode: "day", // "day" | "map"
      cal: null,        // { y, m }
      calSel: null      // iso
    },
    listeners: [],

    on: function (fn) { S.listeners.push(fn); },

    notify: function () {
      S.listeners.forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } });
    },

    load: function () {
      return Promise.all([
        repo.blocks.all(),
        repo.habits.all(),
        repo.tasks.all(),
        repo.events.all(),
        repo.habitLog.all(),
        repo.taskLog.all()
      ]).then(function (rs) {
        var blocks = rs[0], habits = rs[1], tasks = rs[2], events = rs[3], logRows = rs[4], taskLogRows = rs[5];
        S.state.blocks = blocks || [];
        S.state.habits = (habits || []).sort(function (a, b) { return (a.sortPos || 0) - (b.sortPos || 0); });
        S.state.tasks = tasks || [];
        S.state.events = events || [];
        var map = {};
        (logRows || []).forEach(function (r) { map[r.habitId + "|" + r.date] = r.completed; });
        S.state.log = map;
        var tmap = {};
        (taskLogRows || []).forEach(function (r) { tmap[r.taskId + "|" + r.date] = r.completed; });
        S.state.taskLog = tmap;
        if (!S.state.selectedISO) S.state.selectedISO = U.hoyISO();
        if (S.state.semanaWday === null) S.state.semanaWday = new Date().getDay();
        if (!S.state.cal) {
          var d = new Date();
          S.state.cal = { y: d.getFullYear(), m: d.getMonth() };
          S.state.calSel = U.hoyISO();
        }
        S.state.ready = true;
      });
    },

    refresh: function () {
      return S.load().then(function () { S.notify(); });
    },

    // ── Selectores ─────────────────────────────────────────────
    // Bloques que aplican a una fecha iso:
    // * con `date` (bloque puntual): solo ese día exacto
    // * sin `date` (plantilla semanal): los días de la semana que coincidan
    blocksFor: function (iso) {
      var w = U.weekdayOf(iso);
      return S.state.blocks.filter(function (b) {
        if (b.date) return b.date === iso;
        return U.blockWeekdays(b).indexOf(w) >= 0;
      }).sort(function (a, b) { return a.startMin - b.startMin; });
    },

    // Fecha concreta (ISO) del día de la semana `w` dentro de la semana
    // del día seleccionado actualmente (selectedISO). Si w es hoy, coincide con hoy.
    weekdayISO: function (w) {
      var base = S.state.selectedISO || U.hoyISO();
      return U.addDaysISO(U.mondayOfISO(base), (w + 6) % 7);
    },

    // Recordatorios/eventos que caen en una fecha iso
    // * repeat 0 "none":  solo ese día
    // * repeat 1 "weekly": cada semana, el mismo día de la semana (desde su fecha)
    // * repeat 2 "yearly": cada año, el mismo mes y día
    eventsFor: function (iso) {
      var w = U.weekdayOf(iso);
      var md = iso.slice(5); // MM-DD
      return S.state.events.filter(function (e) {
        if (!e.date) return false;
        if (e.repeat === 1) return iso >= e.date && U.weekdayOf(e.date) === w;
        if (e.repeat === 2) return e.date.slice(5) === md && iso >= e.date;
        return e.date === iso;
      }).sort(function (a, b) {
        var ta = a.time ? a.time : "99:99", tb = b.time ? b.time : "99:99";
        return ta < tb ? -1 : (ta > tb ? 1 : 0);
      });
    },

    tasksFor: function (iso) {
      var w = U.weekdayOf(iso);
      return S.state.tasks.filter(function (t) {
        if (t.dueDate === iso) return true;
        return !!t.weekly && t.dueDate && iso >= t.dueDate && U.weekdayOf(t.dueDate) === w;
      }).sort(function (a, b) {
        return (S.taskDone(a.id, iso) ? 1 : 0) - (S.taskDone(b.id, iso) ? 1 : 0);
      });
    },
    pendingFor: function (iso) {
      var w = U.weekdayOf(iso);
      return S.state.tasks.filter(function (t) {
        if (t.dueDate === iso) return !S.taskDone(t.id, iso);
        return !!t.weekly && t.dueDate && iso >= t.dueDate && U.weekdayOf(t.dueDate) === w && !S.taskDone(t.id, iso);
      });
    },
    pendingBuzon: function () {
      return S.state.tasks.filter(function (t) { return !t.dueDate && !t.completed; });
    },
    buzonCount: function () { return S.pendingBuzon().length; },
    habitDone: function (habitId, iso) { return !!S.state.log[habitId + "|" + iso]; },
    taskDone: function (taskId, iso) { return !!S.state.taskLog[taskId + "|" + iso]; }
  };

  // ── Acciones (capa de interacción) ───────────────────────────
  var A = Org.controls = {
    setDay: function (iso) { S.state.selectedISO = iso; S.notify(); },
    shiftWeek: function (n) {
      if (!S.state.selectedISO) return;
      S.state.selectedISO = U.addDaysISO(S.state.selectedISO, n * 7);
      S.notify();
    },
    goToday: function () { S.setDay(U.hoyISO()); },

    // Tachar una tarea:
    // * con `iso` -> registro por fecha en task_log (independiente por día)
    // * sin `iso` (Buzón, sin fecha) -> booleano global completed
    toggleTask: function (id, iso, val) {
      if (iso) return repo.taskLog.upsert(id, iso, val).then(function () { return S.refresh(); });
      return repo.tasks.update(id, { completed: val ? 1 : 0 }).then(function () { return S.refresh(); });
    },
    editTask: function (id, title, dueDate, completed, color) {
      return repo.tasks.update(id, { title: title, dueDate: dueDate || null, color: color }).then(function () { return S.refresh(); });
    },
    deleteTask: function (id) {
      return repo.taskLog.removeForTask(id).then(function () { return repo.tasks.remove(id); }).then(function () { return S.refresh(); });
    },
    deleteEvent: function (id) {
      return repo.events.remove(id).then(function () { return S.refresh(); });
    },

    toggleHabit: function (id, iso, val) {
      return repo.habitLog.upsert(id, iso, val).then(function () { return S.refresh(); });
    },

    reassignTask: function (id, iso) {
      return repo.tasks.update(id, { dueDate: iso }).then(function () { return S.refresh(); });
    },
    sendToBuzon: function (id) {
      return repo.tasks.update(id, { dueDate: null }).then(function () { return S.refresh(); });
    },

    deleteBlock: function (id) {
      return repo.blocks.remove(id).then(function () { return S.refresh(); });
    },
    deleteHabit: function (id) {
      return repo.habitLog.removeForHabit(id)
        .then(function () { return repo.habits.remove(id); })
        .then(function () { return S.refresh(); });
    }
  };
})(window);