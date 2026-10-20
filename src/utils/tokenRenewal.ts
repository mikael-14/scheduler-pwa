import { authApi } from '../api/auth'
import { useAuthStore } from '../stores/auth'

/**
 * Keeps the session alive while the app is used: once the token is a day old it is swapped
 * for a fresh one (POST /auth/refresh). Each token still expires 30 days after it was issued,
 * so a session ends after 30 days without opening the app, not 30 days after signing in.
 */
const RENEW_AFTER_MS = 24 * 60 * 60 * 1000

let renewing: Promise<void> | null = null

export function renewTokenIfOld(): Promise<void> {
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated() || authStore.loggingOut) return Promise.resolve()

  // unknown age (token from before this feature): renew once to start counting
  const issuedAt = authStore.tokenIssuedAt()
  if (issuedAt && Date.now() - issuedAt < RENEW_AFTER_MS) return Promise.resolve()

  renewing ??= authApi.refreshToken()
    .catch((error) => {
      // offline or server down: the current token still works, try again next time.
      // A refused token (401) is handled by the API client like any other request.
      console.warn('Could not renew the session token.', error)
    })
    .finally(() => (renewing = null))

  return renewing
}

/** Renew at start-up and whenever the person comes back to the app. */
export function keepSessionAlive() {
  renewTokenIfOld()
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') renewTokenIfOld()
  })
}
