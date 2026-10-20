import { defineStore } from 'pinia'
import { ref } from 'vue'
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
      notificationsApi.list().then((result) => (unreadNotifications.value = result.unread)),
      authStore.canApprove()
        ? schedulesApi.fetchPending().then((items) => (pendingApprovals.value = items.length))
        : Promise.resolve((pendingApprovals.value = 0)),
    ])
      // counters are a convenience: a failed refresh keeps the last numbers, silently
      .then(() => undefined)
      .finally(() => (refreshing = null))

    return refreshing
  }

  return { unreadNotifications, pendingApprovals, refresh }
})
