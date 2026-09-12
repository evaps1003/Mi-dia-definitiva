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
    }
  };

  // ── Buzón: migración automática ──────────────────────────────
  // Todas las tareas incompletas (no recurrentes) con dueDate
  // anterior a `todayISO` pierden su fecha y pasan a pendientes sin fecha.
  R.migrateOverdue = function (todayISO) {
    return db.getAll("tasks").then(function (tasks) {
      var targets = tasks.filter(function (t) {
        return !t.completed && t.dueDate && t.dueDate < todayISO;
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