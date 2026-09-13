(function (G) {
  "use strict";
  var Org = G.Org;
  var repo = Org.repo;
  var U = Org.ui;
  var store = Org.store;
  var KEY = "lastOpenedDate";

  var C = Org.clock = {
    _timer: null,

    lastOpened: function () { return repo.meta.get(KEY); },

    // Rutina de reseteo diario: se lanza al abrir y al volver a foco.
    run: function () {
      return repo.meta.get(KEY).then(function (last) {
        var today = U.hoyISO();
        if (last === today) return Promise.resolve(false);
        return repo.taskLog.seedLegacy()
          .then(function () { return repo.migrateOverdue(today); })
          .then(function (n) {
            // Limpia historial viejo (> 120 días) de hábitos y tareas
            var limit = U.addDaysISO(today, -120);
            return repo.habitLog.pruneBefore(limit).then(function () { return repo.taskLog.pruneBefore(limit); });
          })
          .then(function () {
            return repo.meta.set(KEY, today);
          })
          .then(function () {
            if (G.Org && G.Org.store) return Org.store.refresh().then(function () { return true; });
            return true;
          });
      });
    },

    // Nº de ms hasta las 00:00:00 del próximo día
    _untilMidnight: function () {
      var now = new Date();
      var next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
      return next.getTime() - now.getTime();
    },

    schedule: function () {
      if (this._timer) { clearTimeout(this._timer); this._timer = null; }
      this._timer = setTimeout(function () {
        C.run().then(function () { C.schedule(); });
      }, this._untilMidnight());
    },

    init: function () {
      var self = this;
      this.run().then(function () {
        self.schedule();
      });
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "visible") {
          self.run();
        }
      });
    }
  };
})(window);