import type { Router } from 'vue-router'

/**
 * Open apps move to a new deploy by themselves. Each build has its own version (see
 * vite.config.js), also published as /version.json (never cached). When the server's differs
 * from the one running, the app drops its service worker and cached files and reloads, so the
 * new version comes straight from the server.
 *
 * Checked at start, when the app comes back to the screen, and every 30 minutes. While someone is
 * filling in the schedule form the reload waits until they leave it, so nothing typed is lost.
 */
export const APP_VERSION: string = __APP_VERSION__

const CHECK_EVERY_MS = 30 * 60 * 1000
// the version a reload was already tried for (in this tab): never loop if the server lags behind
const ATTEMPT_KEY = 'appUpdateAttempt'
const FORM_ROUTES = ['ScheduleNew', 'ScheduleEdit']

async function serverVersion(): Promise<string | null> {
  try {
    const response = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!response.ok) return null
    const data = (await response.json()) as { version?: string }
    return data.version ?? null
  } catch {
    return null // offline: keep the version on the device
  }
}

async function reloadInto(version: string) {
  try {
    if (sessionStorage.getItem(ATTEMPT_KEY) === version) return
    sessionStorage.setItem(ATTEMPT_KEY, version)
  } catch {
    /* storage unavailable: reload anyway */
  }

  try {
    const registrations = (await navigator.serviceWorker?.getRegistrations()) ?? []
    await Promise.all(registrations.map((registration) => registration.unregister()))
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
    }
  } catch (error) {
    console.warn('Could not clear the old version.', error)
  }
  // the offline copy of the calendar (IndexedDB) and the session stay as they are
  window.location.reload()
}

export function keepAppUpToDate(router: Router) {
  if (import.meta.env.DEV) return

  let waitingForm = false

  const check = async () => {
    const latest = await serverVersion()
    if (!latest || latest === APP_VERSION) return

    if (FORM_ROUTES.includes(String(router.currentRoute.value.name))) {
      if (waitingForm) return
      waitingForm = true
      const stop = router.afterEach((to) => {
        if (FORM_ROUTES.includes(String(to.name))) return
        stop()
        reloadInto(latest)
      })
      return
    }
    reloadInto(latest)
  }

  check()
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check()
  })
  setInterval(check, CHECK_EVERY_MS)
}
