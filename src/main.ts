import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import createRouter from './router' // Import the factory function
import './styles/tailwind.css'
import { useAuthStore } from './stores/auth'

const pinia = createPinia()

async function initializeApp() {
  const app = createApp(App)
  app.use(pinia)

  // Pre-flight check for social auth callback.
  // This runs before the router is created to ensure the auth state is ready.
  const url = new URL(window.location.href)
  const token = url.searchParams.get('token')

  if (url.pathname === '/auth/callback' && token) {
    const authStore = useAuthStore()
    authStore.setToken(token)
    // The token is now in storage. We can clean up the URL
    // and redirect to a safe page before mounting the app.
    // The router guard will then pick up the authenticated state.
    window.history.replaceState({}, document.title, '/my-agenda/')
  }

  // Now that auth state is potentially set, create and use the router.
  const router = createRouter()
  app.use(router)

  // Wait for the router to be ready before mounting.
  await router.isReady()
  app.mount('#app')
}

initializeApp()