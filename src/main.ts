import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import createRouter from './router' // Import the factory function
import './styles/tailwind.css'
import { authApi } from './api/auth'
import { useAuthStore } from './stores/auth'
import { useToastStore } from './stores/toast'
import { isNetworkError } from './utils/apiError'
import { reportUnhandledErrors } from './utils/unhandledErrors'
import { keepSessionAlive } from './utils/tokenRenewal'
import { keepOfflineDataFresh } from './utils/offlineSync'
import { t } from './i18n'
import { listenForInstall } from './utils/install'
import { keepAppUpToDate } from './utils/appVersion'

const pinia = createPinia()

// the browser announces it can install the app early, often before the app has mounted
listenForInstall()

async function initializeApp() {
  const app = createApp(App)
  app.use(pinia)
  reportUnhandledErrors(app)

  // Pre-flight check for social auth callback.
  // This runs before the router is created to ensure the auth state is ready.
  // The API hands the token over in the URL fragment so it never reaches a server log or a Referer header.
  const url = new URL(window.location.href)
  const token = new URLSearchParams(url.hash.replace(/^#/, '')).get('token')

  const authStore = useAuthStore()

  if (url.pathname === '/auth/callback' && token) {
    // A new social sign-in replaces whatever session this device had
    authStore.clear()
    authStore.setToken(token)
    // Clean the token from the URL; the router then sends the user to the right page
    window.history.replaceState({}, document.title, '/')
  }

  if (authStore.isAuthenticated()) {
    // Refresh the user (approval state, language, permissions) before routing.
    // Only the API refusing the token ends the session (see config/axios). On a bad connection
    // or a server error the session is kept: the cached user is used, or, when there is none
    // yet, the router shows the "could not connect" screen with a retry.
    try {
      await authApi.getCurrentUser()
    } catch (error) {
      console.warn('Could not refresh the user.', error)
      if (authStore.user && isNetworkError(error)) {
        useToastStore().addToast(t('errors.offlineSession'), 'warning')
      }
    }
  }

  // Renew the token about once a day while the app is used (in the background, never blocks)
  keepSessionAlive()
  // This week and next saved on the device for offline viewing (in the background too)
  keepOfflineDataFresh()

  // Now that auth state is potentially set, create and use the router.
  const router = createRouter()
  app.use(router)
  // a new deploy: open apps reload into it (see utils/appVersion)
  keepAppUpToDate(router)

  // Wait for the router to be ready before mounting.
  await router.isReady()
  app.mount('#app')
}

initializeApp()