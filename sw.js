/* App Adega · service worker
   Guarda o próprio app (HTML, código, fontes e ícones) para abrir mesmo sem internet.
   Os dados vêm sempre do Supabase; a cópia offline dos dados fica no próprio app. */
var VERSION = '1.4.0';
var CACHE = 'adega-' + VERSION;
var SHELL = ['./', './app.js', './config.js', './manifest.webmanifest',
  './fonts/spectral-400.woff2', './fonts/spectral-500.woff2', './fonts/manrope-var.woff2',
  './icon-192.png', './icon-512.png', './apple-touch-icon.png', './favicon-32.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(SHELL.map(function (u) { return new Request(u, { cache: 'reload' }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf('adega-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function clean(res) {
  if (!res.redirected) return res;
  return res.blob().then(function (b) { return new Response(b, { status: res.status, statusText: res.statusText, headers: res.headers }); });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  var nav = req.mode === 'navigate';
  var code = nav || /\.(js|webmanifest|html)$/.test(url.pathname);
  if (code) {
    var key = nav ? './' : url.pathname;
    e.respondWith(fetch(new Request(url.href.split('#')[0], { cache: 'no-cache', credentials: 'same-origin' })).then(clean).then(function (res) {
      if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(key, copy); }); }
      return res;
    }).catch(function () {
      return caches.open(CACHE).then(function (c) { return c.match(key, { ignoreSearch: true }).then(function (r) { return r || c.match('./'); }); });
    }));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) {
    return hit || fetch(req).then(function (res) {
      if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    });
  }));
});
