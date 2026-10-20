/* Web push handling, loaded by the generated service worker (workbox importScripts). */

self.addEventListener('push', (event) => {
  let payload = {}

  try {
    payload = event.data ? event.data.json() : {}
  } catch (e) {
    payload = { title: 'Scheduler', body: event.data ? event.data.text() : '' }
  }

  const title = payload.title || 'Scheduler'

  event.waitUntil(Promise.all([
    self.registration.showNotification(title, {
      body: payload.body || '',
      icon: payload.icon || '/img/icons/icon-192x192.png',
      badge: payload.badge || '/img/icons/icon-192x192.png',
      tag: payload.tag,
      data: payload.data || {},
    }),
    // something changed: open copies of the app refresh their saved agenda and counters
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windows) => windows.forEach((client) => client.postMessage({ type: 'push' }))),
  ]))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const path = (event.notification.data && event.notification.data.url) || '/notifications'
  const target = new URL(path, self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ('focus' in client) {
          client.navigate(target)
          return client.focus()
        }
      }
      return self.clients.openWindow(target)
    })
  )
})
