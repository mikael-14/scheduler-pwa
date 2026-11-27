import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { notificationsApi } from '../api/notifications'
import { schedulesApi } from '../api/schedules'
import { useAuthStore } from './auth'

/**
 * The counters next to "Notificações" (unread) and "Aprovações" (waiting for a decision) in
 * the menus. Refreshed by App.vue: on start, on every page change, every minute while the app
 * is visible, and right after the user reads or decides something.
 */
export const useBadgesStore = defineStore('badges', () => {
  const unreadNotifications = ref(0)
  const pendingApprovals = ref(0)
  let refreshing: Promise<void> | null = null

  function refresh(): Promise<void> {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated() || !authStore.isApproved()) return Promise.resolve()

    refreshing ??= Promise.allSettled([
      // only the count matters here: one unread item, not the whole page (and not the offline copy)
      notificationsApi.list({ filter: 'unread', perPage: 1 }).then((result) => (unreadNotifications.value = result.unread)),
      authStore.canApprove()
        ? schedulesApi.fetchPending().then((pending) => (pendingApprovals.value = pending.length))
        : Promise.resolve((pendingApprovals.value = 0)),
    ])
      // counters are a convenience: a failed refresh keeps the last numbers, silently
      .then(() => undefined)
      .finally(() => (refreshing = null))

    return refreshing
  }

  // the same count on the installed app's icon (the service worker sets it when a push arrives);
  // all read: the phone's notifications of this app go too, they are dealt with
  watch(unreadNotifications, (count) => {
    syncIconBadge(count)
    if (count === 0) closeShownNotifications()
  })

  return { unreadNotifications, pendingApprovals, refresh }
})

/** The unread count on the app icon (Android, iOS 16.4+, desktop installs); ignored elsewhere. */
export function syncIconBadge(count: number): void {
  if (!('setAppBadge' in navigator)) return
  const done = count > 0 ? navigator.setAppBadge(count) : navigator.clearAppBadge()
  done.catch(() => { /* not allowed here: the menu counter still shows it */ })
}

/** Removes this app's notifications from the phone's list (all read, or signed out). */
export function closeShownNotifications(): void {
  navigator.serviceWorker?.getRegistration()
    .then((registration) => registration?.getNotifications())
    .then((shown) => shown?.forEach((notification) => notification.close()))
    .catch(() => { /* no service worker: nothing shown */ })
}
