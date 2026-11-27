/* Web push handling, loaded by the generated service worker (workbox importScripts). */

/*
 * One or two notifications are shown on their own; from the third on (e.g. a phone back online
 * with several waiting) they become one summary: "You have 5 unread notifications" and the
 * latest titles, opening the notifications page. The API sends the unread count and the summary's
 * title in the person's language with each push (PwaWebPushNotification).
 */
const SUMMARY_TAG = 'summary'
const MAX_SEPARATE = 2
const SUMMARY_LINES = 4
const ICON = '/img/icons/icon-192x192.png'
// status-bar icon: Android uses only its transparency, so it must be a white shape on transparent
const STATUS_ICON = '/img/icons/badge-96x96.png'

async function showPush(payload) {
  const title = payload.title || 'Scheduler'
  const data = payload.data || {}
  const icon = payload.icon || ICON
  const badge = payload.badge || STATUS_ICON

  const all = await self.registration.getNotifications()
  // the same notification pushed again replaces itself (same tag): not counted twice
  const separate = all.filter((item) => item.tag !== SUMMARY_TAG && item.tag !== payload.tag)
  const summary = all.find((item) => item.tag === SUMMARY_TAG)

  if (!summary && separate.length < MAX_SEPARATE) {
    return self.registration.showNotification(title, { body: payload.body || '', icon, badge, tag: payload.tag, data })
  }

  // newest first: this one, the ones on screen, then those already in the summary
  const titles = [title, ...separate.map((item) => item.title), ...((summary && summary.data && summary.data.titles) || [])]
  separate.forEach((item) => item.close())
  const count = Number.isFinite(data.unread) && data.unread > 0 ? data.unread : titles.length

  return self.registration.showNotification(
    (data.summary_title || ':count').replace(':count', String(count)),
    {
      body: titles.slice(0, SUMMARY_LINES).join('\n'),
      icon,
      badge,
      tag: SUMMARY_TAG,
      renotify: true, // a new one arrived: sound / vibrate again
      data: { url: '/notifications', titles: titles.slice(0, 20) },
    }
  )
}

/** The unread count on the installed app's icon (Android, iOS 16.4+, desktop); ignored elsewhere. */
function updateIconBadge(unread) {
  if (!Number.isFinite(unread) || !self.navigator || !self.navigator.setAppBadge) return Promise.resolve()
  return (unread > 0 ? self.navigator.setAppBadge(unread) : self.navigator.clearAppBadge()).catch(() => {})
}

self.addEventListener('push', (event) => {
  let payload = {}

  try {
    payload = event.data ? event.data.json() : {}
  } catch (e) {
    payload = { title: 'Scheduler', body: event.data ? event.data.text() : '' }
  }

  event.waitUntil(Promise.all([
    showPush(payload),
    updateIconBadge(payload.data && payload.data.unread),
    // something changed: open copies of the app refresh their saved agenda and counters
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windows) => windows.forEach((client) => client.postMessage({ type: 'push' }))),
  ]))
})

/*
 * Keeping the subscription alive without the app open. Browsers replace or drop a push
 * subscription now and then; the API would keep pushing to the old, dead address until someone
 * opens the app. Here the service worker subscribes again and tells the API itself
 * (POST /pwa/subscription/renew, the old address as proof: it cannot use the app's token).
 * What it needs is saved by the app when it subscribes (src/utils/push.ts) and removed on sign-out.
 */
const CONFIG_CACHE = 'push-config'
const CONFIG_URL = '/push-config'

async function readConfig() {
  const response = await (await caches.open(CONFIG_CACHE)).match(CONFIG_URL)
  return response ? response.json() : null
}

async function saveConfig(config) {
  await (await caches.open(CONFIG_CACHE)).put(CONFIG_URL, new Response(JSON.stringify(config), {
    headers: { 'Content-Type': 'application/json' },
  }))
}

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (char) => char.charCodeAt(0))
}

/** Make sure this device has a subscription the API knows; `fresh` is the browser's new one, if it gave it. */
async function renewSubscription(fresh) {
  const config = await readConfig()
  if (!config || !config.endpoint || !config.api) return // signed out, or push never turned on here

  const permission = await self.registration.pushManager.permissionState({ userVisibleOnly: true })
  if (permission !== 'granted') return

  const subscription = fresh
    || (await self.registration.pushManager.getSubscription())
    || (await self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.key),
    }))
  if (subscription.endpoint === config.endpoint) return // nothing changed

  const json = subscription.toJSON()
  const response = await fetch(`${config.api}/pwa/subscription/renew`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ old_endpoint: config.endpoint, endpoint: json.endpoint, keys: json.keys }),
  })
  // 404: the API no longer knows the old one (removed, account off): the app sorts it out when opened
  if (response.ok) await saveConfig({ ...config, endpoint: json.endpoint })
}

// the browser replaced the subscription (Firefox, Edge; Chrome only sometimes)
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(renewSubscription(event.newSubscription).catch((error) => console.warn('Push renewal failed.', error)))
})

// about twice a day for installed apps (Chrome on Android; see scheduleSubscriptionCheck in the app)
self.addEventListener('periodicsync', (event) => {
  if (event.tag !== 'push-check') return
  event.waitUntil(renewSubscription(null).catch((error) => console.warn('Push check failed.', error)))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const path = (event.notification.data && event.notification.data.url) || '/notifications'
  // only pages of this app: a full address to another site is never opened from a notification
  let target = new URL('/notifications', self.location.origin).href
  try {
    const url = new URL(path, self.location.origin)
    if (url.origin === self.location.origin) target = url.href
  } catch (e) {
    /* not an address: keep /notifications */
  }

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
