<template>
  <div class="flex min-h-full flex-col justify-center bg-slate-50 py-12 dark:bg-slate-900 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
        {{ t('connection.title') }}
      </h2>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="page-card border-slate-200 bg-white px-4 py-8 shadow-xl dark:border-slate-700 dark:bg-slate-800 sm:px-10">
        <div class="space-y-6 text-center">
          <p class="text-slate-600 dark:text-slate-300">{{ t('connection.body') }}</p>
          <p v-if="errorMessage" class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
          <button @click="retry" :disabled="checking"
            class="w-full justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50">
            {{ checking ? t('connection.checking') : t('connection.retry') }}
          </button>
          <button @click="authStore.logout(router)" :disabled="checking"
            class="w-full text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            {{ t('nav.logout') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { t } from '../i18n'
import { authApi } from '../api/auth'
import { useAuthStore } from '../stores/auth'
import { apiErrorMessage } from '../utils/apiError'

/**
 * Signed in, but the account could not be loaded (offline or server down on the first visit).
 * The session is kept; once the API answers, the user continues to the page they wanted.
 */
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const checking = ref(false)
const errorMessage = ref<string | null>(null)

const retry = async () => {
  if (checking.value) return
  checking.value = true
  errorMessage.value = null
  try {
    await authApi.getCurrentUser()
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/'
    router.replace(redirect)
  } catch (error) {
    // a refused session is handled by the API client (back to the login page)
    errorMessage.value = apiErrorMessage(error, t('connection.failed'))
  } finally {
    checking.value = false
  }
}

// Try again by itself as soon as the device is back online
onMounted(() => window.addEventListener('online', retry))
onUnmounted(() => window.removeEventListener('online', retry))
</script>
