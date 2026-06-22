// Minimale service worker voor de Wittenboer-portal.
// Doel: de "installeren"-prompt mogelijk maken op Android/Chrome.
// Bewust GEEN caching: de portal toont altijd verse, actuele data
// (aanvragen, agenda). Alleen een pass-through fetch-handler.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // Pass-through: laat het netwerk de request afhandelen, niets cachen.
  event.respondWith(fetch(event.request))
})
