const CACHE="imperator-swatches-v20";
const ASSETS=["./","./index.html","./style.css","./icons/medallion.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener("fetch",e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});
