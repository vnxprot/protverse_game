const CACHE = 'protverse-v2'
const CORE = ['/', '/icon.svg', '/assets/prot-clay.png', '/assets/thao-world.png']

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)))
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))
    await self.clients.claim()
    // Replace pages that may still be using HTML cached by the previous release.
    const clients = await self.clients.matchAll({ type: 'window' })
    await Promise.all(clients.map(client => client.navigate(client.url).catch(() => {})))
  })())
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return

  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => {
      if (response.ok) {
        const copy = response.clone()
        event.waitUntil(caches.open(CACHE).then(cache => cache.put('/', copy)))
      }
      return response
    }).catch(() => caches.match('/')))
    return
  }

  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok) {
      const copy = response.clone()
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy)))
    }
    return response
  })))
})
