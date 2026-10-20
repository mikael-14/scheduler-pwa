import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { authApi } from '../api/auth'
import { disableDevicePush } from '../utils/push'
import { clearOfflineData } from '../utils/db'
import { setLocale } from '../i18n'
import type { Router } from 'vue-router'

const USER_CACHE_KEY = 'user'
const PERMISSIONS_CACHE_KEY = 'permissions'
const TOKEN_ISSUED_KEY = 'tokenIssuedAt'
// Longest a sign-out waits for the server before finishing on this device
const LOGOUT_WAIT_MS = 4000

// Only used to decide what to show; the API enforces every permission on its own.
function readCachedPermissions(): string[] {
  try {
    const raw = localStorage.getItem(PERMISSIONS_CACHE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// The last known user survives a reload (and works offline); it is refreshed from the API at startup.
function readCachedUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(localStorage.getItem('token') ? readCachedUser() : null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const permissions = ref<string[]>(token.value ? readCachedPermissions() : [])

  if (user.value?.language) {
    setLocale(user.value.language)
  }

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('token', newToken)
    // when this token was issued: decides when it is renewed (utils/tokenRenewal)
    localStorage.setItem(TOKEN_ISSUED_KEY, String(Date.now()))
  }

  /** ms timestamp of the current token, or null when unknown (a token from an older app version). */
  function tokenIssuedAt(): number | null {
    const value = Number(localStorage.getItem(TOKEN_ISSUED_KEY))
    return Number.isFinite(value) && value > 0 ? value : null
  }

  // Another tab renewed the token or signed out: follow it, so this tab never keeps an old token
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key === 'token') {
        token.value = event.newValue
        if (!event.newValue) {
          user.value = null
          permissions.value = []
        }
      }
    })
  }

  function setUser(newUser: User) {
    // The API calls the language `locale`; the app uses `language`. Once a user is
    // signed in, their profile language is the language of the whole app.
    const language = newUser.language ?? (newUser.locale as User['language'])
    user.value = language ? { ...newUser, language } : newUser

    if (language) {
      setLocale(language)
    }

    try {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user.value))
    } catch {
      /* storage unavailable */
    }
  }

  function setPermissions(names: string[] | undefined) {
    if (!Array.isArray(names)) return
    permissions.value = names
    try {
      localStorage.setItem(PERMISSIONS_CACHE_KEY, JSON.stringify(names))
    } catch {
      /* storage unavailable */
    }
  }

  function clear() {
    user.value = null
    permissions.value = []
    localStorage.removeItem(PERMISSIONS_CACHE_KEY)
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem(TOKEN_ISSUED_KEY)
    localStorage.removeItem(USER_CACHE_KEY)
    // the agenda and notifications saved for offline use belong to this account
    clearOfflineData()
  }

  /** True while signing out, so the API's answers to the sign-out calls change nothing. */
  const loggingOut = ref(false)

  /**
   * Sign out. The server calls are best effort and capped at a few seconds: on a bad
   * connection the user is still signed out on this device right away.
   */
  async function logout(router: Router|null) {
    loggingOut.value = true
    try {
      const serverSide = (async () => {
        // Stop this device from receiving the next person's pushes (needs the token, so first);
        // the browser side is dropped even if the API call fails
        await disableDevicePush().catch((error) => console.error('Push unsubscribe failed.', error))
        await authApi.logout().catch((error) => console.error('API logout failed.', error))
      })()
      await Promise.race([serverSide, new Promise((resolve) => setTimeout(resolve, LOGOUT_WAIT_MS))])
    } finally {
      clear()
      loggingOut.value = false
      router?.replace({ name: 'Login' })
    }
  }

  /**
   * The API refused the session itself (token expired or revoked, account deactivated).
   * Full page load to the login screen, which explains why.
   */
  function endSession(reason: 'session_expired' | 'account_inactive') {
    clear()
    if (window.location.pathname !== '/login') {
      window.location.replace(`/login?error=${reason}`)
    }
  }

  /** The API says the account is not approved (any more): show the waiting screen. */
  function markPending() {
    if (user.value?.approved_at) {
      setUser({ ...user.value, approved_at: null })
    }
    if (window.location.pathname !== '/pending-approval') {
      window.location.replace('/pending-approval')
    }
  }

  const isAuthenticated = () => !!token.value
  // Signed in, but the account could not be loaded yet (no connection on the first visit)
  const isUserUnknown = () => !!token.value && !user.value
  const isApproved = () => !!user.value?.approved_at
  const can = (...names: string[]) => names.some((name) => permissions.value.includes(name))
  // Same rule as the API: approve_schedule or update_status_schedule
  const canApprove = () => can('approve_schedule', 'update_status_schedule')

  return {
    user, token, permissions, loggingOut, setToken, tokenIssuedAt, setUser, setPermissions, clear, logout,
    endSession, markPending, isAuthenticated, isUserUnknown, isApproved, can, canApprove
  }
})
