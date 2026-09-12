(function (G) {
  "use strict";
  var Org = G.Org;

  var DB_NAME = "midia-offline";
  var DB_VERSION = 4;
  var _db = null;

  function reqPromise(req) {
    return new Promise(function (res, rej) {
      req.onsuccess = function () { res(req.result); };
      req.onerror = function () { rej(req.error); };
    });
  }

  function open() {
    if (_db) return Promise.resolve(_db);
    return new Promise(function (res, rej) {
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
        if (!db.objectStoreNames.contains("blocks")) {
          var blocks = db.createObjectStore("blocks", { keyPath: "id", autoIncrement: true });
          blocks.createIndex("weekday", "weekday", { unique: false });
        }
        if (!db.objectStoreNames.contains("habits")) {
          db.createObjectStore("habits", { keyPath: "id", autoIncrement: true });
        }
        if (!db.objectStoreNames.contains("habit_log")) {
          var log = db.createObjectStore("habit_log", { keyPath: "id", autoIncrement: true });
          log.createIndex("habitDate", ["habitId", "date"], { unique: true });
        }
        if (!db.objectStoreNames.contains("tasks")) {
          var tasks = db.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });
          tasks.createIndex("dueDate", "dueDate", { unique: false });
        }
        if (!db.objectStoreNames.contains("task_log")) {
          db.createObjectStore("task_log", { keyPath: "id", autoIncrement: true });
        }
        if (!db.objectStoreNames.contains("events")) {
          var events = db.createObjectStore("events", { keyPath: "id", autoIncrement: true });
          events.createIndex("date", "date", { unique: false });
        }
      };
      req.onsuccess = function () { _db = req.result; res(_db); };
      req.onerror = function () { rej(req.error); };
    });
  }

  function tx(store, mode, fn) {
    return open().then(function (db) {
      return new Promise(function (res, rej) {
        var t = db.transaction(store, mode);
        var os = t.objectStore(store);
        var result;
        try { result = fn(os, t); } catch (err) { rej(err); return; }
        t.oncomplete = function () { res(result); };
        t.onerror = function () { rej(t.error); };
        t.onabort = function () { rej(t.error); };
      });
    });
  }

  var api = {
    open: open,

    get: function (store, key) {
      return tx(store, "readonly", function (os) { return reqPromise(os.get(key)); });
    },
    getAll: function (store) {
      return tx(store, "readonly", function (os) { return reqPromise(os.getAll()); });
    },
    getByIndex: function (store, index, key) {
      return tx(store, "readonly", function (os) {
        return reqPromise(os.index(index).getAll(key));
      });
    },
    put: function (store, data, key) {
      return tx(store, "readwrite", function (os) {
        return reqPromise(key !== undefined ? os.put(data, key) : os.put(data));
      });
    },
    del: function (store, key) {
      return tx(store, "readwrite", function (os) { return reqPromise(os.delete(key)); });
    },
    clear: function (store) {
      return tx(store, "readwrite", function (os) { return reqPromise(os.clear()); });
    },

    addAll: function (store, list) {
      return open().then(function (db) {
        return new Promise(function (res, rej) {
          var t = db.transaction(store, "readwrite");
          var os = t.objectStore(store);
          list.forEach(function (item) {
            var copy = {};
            for (var k in item) copy[k] = item[k];
            os.put(copy);
          });
          t.oncomplete = function () { res(); };
          t.onerror = function () { rej(t.error); };
        });
      });
    }
  };

  Org.db = api;
})(window);