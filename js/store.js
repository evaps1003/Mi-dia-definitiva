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
      log: {},          // "habitId|YYYY-MM-DD" -> 1/0
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
        repo.habitLog.all()
      ]).then(function (rs) {
        var blocks = rs[0], habits = rs[1], tasks = rs[2], logRows = rs[3];
        S.state.blocks = blocks || [];
        S.state.habits = (habits || []).sort(function (a, b) { return (a.sortPos || 0) - (b.sortPos || 0); });
        S.state.tasks = tasks || [];
        var map = {};
        (logRows || []).forEach(function (r) { map[r.habitId + "|" + r.date] = r.completed; });
        S.state.log = map;
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
    blocksFor: function (iso) {
      var w = U.weekdayOf(iso);
      return S.state.blocks.filter(function (b) { return b.weekday === w; })
        .sort(function (a, b) { return a.startMin - b.startMin; });
    },

    tasksFor: function (iso) {
      return S.state.tasks.filter(function (t) { return t.dueDate === iso; })
        .sort(function (a, b) { return (a.completed ? 1 : 0) - (b.completed ? 1 : 0); });
    },
    pendingFor: function (iso) {
      return S.state.tasks.filter(function (t) { return t.dueDate === iso && !t.completed; });
    },
    pendingBuzon: function () {
      return S.state.tasks.filter(function (t) { return !t.dueDate && !t.completed; });
    },
    buzonCount: function () { return S.pendingBuzon().length; },
    habitDone: function (habitId, iso) { return !!S.state.log[habitId + "|" + iso]; }
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

    toggleTask: function (id, val) {
      return repo.tasks.update(id, { completed: val ? 1 : 0 }).then(function () { return S.refresh(); });
    },
    editTask: function (id, title, dueDate, completed, color) {
      return repo.tasks.update(id, { title: title, dueDate: dueDate || null, color: color }).then(function () { return S.refresh(); });
    },
    deleteTask: function (id) {
      return repo.tasks.remove(id).then(function () { return S.refresh(); });
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