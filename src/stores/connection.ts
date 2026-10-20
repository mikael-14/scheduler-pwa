import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const LAST_UPDATE_KEY = 'lastUpdatedAt'

function readLastUpdate(): number | null {
  try {
    const value = Number(localStorage.getItem(LAST_UPDATE_KEY))
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

export type ConnectionStatus = 'online' | 'offline' | 'unreachable'

/**
 * Whether the app can talk to the server, and when it last got data from it.
 * Fed by the API client (config/axios): every answer from the server proves it is reachable,
 * every successful one is an update. The last update time is kept on this device.
 */
export const useConnectionStore = defineStore('connection', () => {
  // the device itself has no network
  const browserOnline = ref(typeof navigator === 'undefined' ? true : navigator.onLine)
  // the device has network, but the last request got no answer (server down, bad signal)
  const serverUnreachable = ref(false)
  const lastUpdatedAt = ref<number | null>(readLastUpdate())

  const status = computed<ConnectionStatus>(() => {
    if (!browserOnline.value) return 'offline'
    return serverUnreachable.value ? 'unreachable' : 'online'
  })

  function markUpdated() {
    serverUnreachable.value = false
    lastUpdatedAt.value = Date.now()
    try {
      localStorage.setItem(LAST_UPDATE_KEY, String(lastUpdatedAt.value))
    } catch {
      /* storage unavailable */
    }
  }

  /** An answer that is not a success (e.g. 422, 500) still proves the server is there. */
  function markReachable() {
    serverUnreachable.value = false
  }

  function markUnreachable() {
    serverUnreachable.value = true
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      browserOnline.value = true
      // assume the server is back too; the next request will say otherwise
      serverUnreachable.value = false
    })
    window.addEventListener('offline', () => {
      browserOnline.value = false
    })
  }

  return { status, lastUpdatedAt, markUpdated, markReachable, markUnreachable }
})
