var CACHE = "midia-v27";
var ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./js/const.js",
  "./js/db.js",
  "./js/ui.js",
  "./js/repo.js",
  "./js/clock.js",
  "./js/store.js",
  "./js/add.js",
  "./js/views/hoy.js",
  "./js/views/semana.js",
  "./js/views/calendario.js",
  "./js/app.js",
  "./icons/icon-sun-192.png",
  "./icons/icon-sun-512.png",
  "./icons/icon-sun-maskable-512.png",
  "./img/emoji/E001.svg",
  "./img/emoji/E002.svg",
  "./img/emoji/E003.svg",
  "./img/emoji/E004.svg",
  "./img/emoji/E005.svg",
  "./img/emoji/E006.svg",
  "./img/emoji/E007.svg",
  "./img/emoji/E008.svg",
  "./img/emoji/E009.svg",
  "./img/emoji/E00A.svg",
  "./img/emoji/E00B.svg",
  "./icons/apple-touch-icon.png",
  "./icons/logo.svg",
  "./icons/hoy.svg",
  "./icons/semana.svg",
  "./icons/cal.svg",
  "./icons/buzon.svg"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (cache) {
        return cache.addAll(ARCHIVOS);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (claves) {
        return Promise.all(
          claves
            .filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.match(e.request)
      .then(function (respuestaCache) {
        if (respuestaCache) return respuestaCache;
        return fetch(e.request)
          .then(function (respuesta) {
            if (respuesta && respuesta.status === 200 && respuesta.type === "basic") {
              var copia = respuesta.clone();
              caches.open(CACHE).then(function (cache) { cache.put(e.request, copia); });
            }
            return respuesta;
          })
          .catch(function () {
            return caches.match("./index.html");
          });
      })
  );
});