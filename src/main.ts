import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import createRouter from './router' // Import the factory function
import './styles/tailwind.css'
import { authApi } from './api/auth'
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
    try {
      authStore.setToken(token)
      // Immediately fetch the user to populate the store with their details,
      // including approval status. This prevents being incorrectly redirected
      // to the pending approval page.
      await authApi.getCurrentUser()
    } catch (error) {
      console.error('Failed to process social auth token:', error)
      authStore.clear() // Clear bad token
    }
    // Clean the token from the URL and redirect to the home page.
    window.history.replaceState({}, document.title, '/')
  }

  // Now that auth state is potentially set, create and use the router.
  const router = createRouter()
  app.use(router)

  // Wait for the router to be ready before mounting.
  await router.isReady()
  app.mount('#app')
}

initializeApp()