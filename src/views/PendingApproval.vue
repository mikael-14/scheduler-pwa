<template>
  <div class="flex min-h-full flex-col justify-center bg-slate-50 py-12 dark:bg-slate-900 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
        {{ t('pending.title') }}
      </h2>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="page-card border-slate-200 bg-white px-4 py-8 shadow-xl dark:border-slate-700 dark:bg-slate-800 sm:px-10">
        <div class="space-y-6 text-center">
          <p class="text-slate-600 dark:text-slate-300">
            {{ t('pending.body') }}
          </p>
          <p v-if="errorMessage" class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
          <button @click="checkNow" :disabled="checking"
            class="w-full justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50">
            {{ checking ? t('connection.checking') : t('pending.checkAgain') }}
          </button>
          <button @click="handleLogout"
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
import { useRouter } from 'vue-router'
import { t } from '../i18n'
import { authApi } from '../api/auth'
import { useAuthStore } from '../stores/auth'
import { apiErrorMessage } from '../utils/apiError'

// How often the waiting screen asks the API whether the account has been approved
const CHECK_EVERY_MS = 60_000

const authStore = useAuthStore()
const router = useRouter()
const checking = ref(false)
const errorMessage = ref<string | null>(null)
let timer: ReturnType<typeof setInterval> | undefined

/** `quiet`: background checks keep the last message instead of flashing new ones. */
const check = async (quiet: boolean) => {
  if (checking.value || authStore.loggingOut) return
  checking.value = true
  if (!quiet) errorMessage.value = null
  try {
    await authApi.getCurrentUser()
    errorMessage.value = null
    if (authStore.isApproved()) {
      router.replace({ name: 'Home' })
    } else if (!quiet) {
      errorMessage.value = t('pending.stillWaiting')
    }
  } catch (error) {
    // never signs out here: a refused session is handled by the API client
    if (!quiet) errorMessage.value = apiErrorMessage(error, t('connection.failed'))
  } finally {
    checking.value = false
  }
}

const checkNow = () => check(false)
const checkQuietly = () => {
  if (document.visibilityState === 'visible') check(true)
}

const handleLogout = () => authStore.logout(router)

// Checks on a timer, and when the person comes back to the app or the connection returns
onMounted(() => {
  timer = setInterval(checkQuietly, CHECK_EVERY_MS)
  document.addEventListener('visibilitychange', checkQuietly)
  window.addEventListener('online', checkQuietly)
})
onUnmounted(() => {
  clearInterval(timer)
  document.removeEventListener('visibilitychange', checkQuietly)
  window.removeEventListener('online', checkQuietly)
})
</script>
