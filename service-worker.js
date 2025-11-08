/* Wix theme patch cache bump */
const CACHE = "imperator-swatches-v41";
self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(["./","./index.html","./style.css","./app.js","./woods.json","./icons/icon-192.png","./icons/icon-512.png","./sample_aquila.jpg","./assets/hero-wave.svg","./service-worker.js"])))
});
self.addEventListener("fetch", e=>{
  e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request)));
});
