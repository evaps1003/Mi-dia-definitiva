(function (G) {
  "use strict";
  var Org = G.Org;
  var db = Org.db;

  var R = Org.repo = {
    meta: {
      get: function (key) { return db.get("meta", key).then(function (r) { return r ? r.value : undefined; }); },
      set: function (key, val) { return db.put("meta", { value: val }, key); }
    },

    blocks: {
      all: function () { return db.getAll("blocks"); },
      byWeekday: function (w) { return db.getByIndex("blocks", "weekday", w); },
      add: function (data) { return db.put("blocks", data); },
      update: function (id, data) {
        return db.get("blocks", id).then(function (cur) {
          var o = Object.assign({}, cur || {}, data);
          o.id = id;
          return db.put("blocks", o);
        });
      },
      remove: function (id) { return db.del("blocks", id); }
    },

    habits: {
      all: function () { return db.getAll("habits"); },
      add: function (data) { return db.put("habits", data); },
      update: function (id, data) {
        return db.get("habits", id).then(function (cur) {
          var o = Object.assign({}, cur || {}, data);
          o.id = id;
          return db.put("habits", o);
        });
      },
      remove: function (id) { return db.del("habits", id); }
    },

    habitLog: {
      // Returns 1/0 or undefined
      get: function (habitId, date) {
        return db.getByIndex("habit_log", "habitDate", [habitId, date]).then(function (rows) {
          return rows.length ? rows[0] : undefined;
        });
      },
      upsert: function (habitId, date, completed) {
        return db.getByIndex("habit_log", "habitDate", [habitId, date]).then(function (rows) {
          if (rows.length) {
            var r = rows[0];
            r.completed = completed ? 1 : 0;
            return db.put("habit_log", r);
          }
          return db.put("habit_log", { habitId: habitId, date: date, completed: completed ? 1 : 0 });
        });
      },
      all: function () { return db.getAll("habit_log"); },
      removeForHabit: function (habitId) {
        return db.getAll("habit_log").then(function (rows) {
          var ids = rows.filter(function (r) { return r.habitId === habitId; }).map(function (r) { return r.id; });
          return Promise.all(ids.map(function (id) { return db.del("habit_log", id); }));
        });
      },
      pruneBefore: function (iso) {
        return db.getAll("habit_log").then(function (rows) {
          var olds = rows.filter(function (r) { return r.date < iso; });
          return Promise.all(olds.map(function (r) { return db.del("habit_log", r.id); }));
        });
      }
    },

    tasks: {
      all: function () { return db.getAll("tasks"); },
      add: function (data) { return db.put("tasks", data); },
      update: function (id, data) {
        return db.get("tasks", id).then(function (cur) {
          var o = Object.assign({}, cur || {}, data);
          o.id = id;
          return db.put("tasks", o);
        });
      },
      remove: function (id) { return db.del("tasks", id); }
    },

    // Registro de completados de tareas por fecha (taskId + "|" + date).
    // Permite tachar una tarea recurrente solo para un día concreto.
    taskLog: {
      all: function () { return db.getAll("task_log"); },
      upsert: function (taskId, date, completed) {
        return db.getAll("task_log").then(function (rows) {
          var existing = rows.filter(function (r) { return r.taskId === taskId && r.date === date; })[0];
          if (existing) {
            existing.completed = completed ? 1 : 0;
            return db.put("task_log", existing);
          }
          return db.put("task_log", { taskId: taskId, date: date, completed: completed ? 1 : 0 });
        });
      },
      removeForTask: function (taskId) {
        return db.getAll("task_log").then(function (rows) {
          var ids = rows.filter(function (r) { return r.taskId === taskId; }).map(function (r) { return r.id; });
          return Promise.all(ids.map(function (id) { return db.del("task_log", id); }));
        });
      },
      pruneBefore: function (iso) {
        return db.getAll("task_log").then(function (rows) {
          var olds = rows.filter(function (r) { return r.date < iso; });
          return Promise.all(olds.map(function (r) { return db.del("task_log", r.id); }));
        });
      },
      // Migración 1 vez: tareas antiguas con completed=1 y fecha pasan a su log por fecha
      seedLegacy: function () {
        return Promise.all([db.getAll("tasks"), db.getAll("task_log")]).then(function (rs) {
          var tasks = rs[0], rows = rs[1] || [];
          var seen = {};
          rows.forEach(function (r) { seen[r.taskId + "|" + r.date] = 1; });
          var toSeed = tasks.filter(function (t) { return !!t.completed && !!t.dueDate && !seen[t.id + "|" + t.dueDate]; });
          if (!toSeed.length) return;
          return db.addAll("task_log", toSeed.map(function (t) {
            return { taskId: t.id, date: t.dueDate, completed: 1 };
          }));
        });
      }
    },

    events: {
      all: function () { return db.getAll("events"); },
      add: function (data) { return db.put("events", data); },
      update: function (id, data) {
        return db.get("events", id).then(function (cur) {
          var o = Object.assign({}, cur || {}, data);
          o.id = id;
          return db.put("events", o);
        });
      },
      remove: function (id) { return db.del("events", id); }
    }
  };

  // ── Buzón: migración automática ──────────────────────────────
  // Todas las tareas incompletas (no recurrentes) con dueDate
  // anterior a `todayISO` pierden su fecha y pasan a pendientes sin fecha.
  // "Incompleta" = sin registro de hecha en su fecha concreta (task_log)
  // ni el booleano antiguo completed.
  R.migrateOverdue = function (todayISO) {
    return Promise.all([db.getAll("tasks"), db.getAll("task_log")]).then(function (rs) {
      var tasks = rs[0], logRows = rs[1] || [];
      var logMap = {};
      logRows.forEach(function (r) { logMap[r.taskId + "|" + r.date] = r.completed; });
      var targets = tasks.filter(function (t) {
        if (t.weekly || !t.dueDate || t.dueDate >= todayISO) return false;
        return !(t.completed || logMap[t.id + "|" + t.dueDate]);
      });
      if (!targets.length) return 0;
      return db.addAll("tasks", targets.map(function (t) {
        var copy = {};
        for (var k in t) { if (k !== "dueDate") copy[k] = t[k]; }
        copy.dueDate = null;
        return copy;
      })).then(function () { return targets.length; });
    });
  };

})(window);