<template>
  <AuthLayout>
    <template #heading>{{ t('auth.signInTitle') }}</template>
    <template #subheading>
      {{ t('auth.or') }}
      <router-link to="/register" class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">{{ t('auth.createAccountLink') }}</router-link>
    </template>

    <div class="page-card mt-8 border-slate-200 bg-white px-4 py-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
      <form class="space-y-6" @submit.prevent="handleLogin">
        <!-- Error Notification -->
        <div v-if="errorMessage" class="rounded-md bg-red-50 p-4 border border-red-200 dark:bg-red-500/10 dark:border-red-500/30">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3"><p class="text-sm font-medium text-red-800 dark:text-red-300">{{ errorMessage }}</p></div>
          </div>
        </div>
        <div>
          <label for="email-address" class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ t('auth.emailAddress') }}</label>
          <div class="mt-1">
            <input v-model="email" id="email-address" name="email" type="email" autocomplete="email" required class="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:text-sm" placeholder="you@example.com" />
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between">
            <label for="password" class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ t('auth.password') }}</label>
            <div class="text-right">
                <router-link :to="{ name: 'ForgotPassword', query: email ? { email } : {} }" class="text-xs text-primary-600 hover:text-primary-500 dark:text-primary-400">{{ t('auth.forgotPassword') }}</router-link>
            </div>
          </div>
          <div class="mt-1">
            <PasswordInput v-model="password" v-model:show="showPassword" id="password" name="password" autocomplete="current-password" />
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input id="remember-me" name="remember-me" type="checkbox" checked class="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800" />
            <label for="remember-me" class="ml-2 block text-sm text-slate-700 dark:text-slate-300">{{ t('auth.rememberMe') }}</label>
          </div>
        </div>

        <div>
          <button type="submit" :disabled="loading" class="flex w-full justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 transition-all">
            <span v-if="loading" class="mr-2 animate-spin">⌛</span>
            {{ t('auth.signIn') }}
          </button>
        </div>
      </form>

      <div class="mt-6">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-slate-300 dark:border-slate-700"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="bg-white px-2 text-slate-500 dark:bg-slate-900">{{ t('auth.orContinueWith') }}</span>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-2 gap-3">
          <button @click="socialLogin('google')" class="inline-flex w-full justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" class="mr-2 h-5 w-5" alt="Google" />
            Google
          </button>
          <button @click="socialLogin('facebook')" class="inline-flex w-full justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">
            <img src="https://www.svgrepo.com/show/448224/facebook.svg" class="mr-2 h-5 w-5" alt="Facebook" />
            Facebook
          </button>
        </div>
      </div>
    </div>

    <InstallButton />
  </AuthLayout>
</template>

<script setup lang="ts">
import { t } from '../i18n'
import { apiErrorMessage } from '../utils/apiError'
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authApi } from '../api/auth'
import { useToastStore } from '../stores/toast'
import AuthLayout from '../components/AuthLayout.vue'
import PasswordInput from '../components/PasswordInput.vue'
import InstallButton from '../components/common/InstallButton.vue'

const email = ref('')
const password = ref('')
const errorMessage = ref<string | null>(null)
const loading = ref(false)
const showPassword = ref(false)
const router = useRouter()
const route = useRoute()
const toastStore = useToastStore()

// Why the user is here: a failed social sign-in, or a session the API ended
const LOGIN_ERRORS: Record<string, string> = {
  auth_failed: 'auth.authFailed',
  account_inactive: 'auth.accountInactive',
  session_expired: 'auth.sessionExpired',
}

onMounted(() => {
  // coming back from "forgot password" / a reset: the email is already known
  if (typeof route.query.email === 'string') email.value = route.query.email

  const key = typeof route.query.error === 'string' ? LOGIN_ERRORS[route.query.error] : undefined
  if (key) {
    errorMessage.value = t(key)
    // Clean the URL, keeping where the user wanted to go
    router.replace({ query: { ...route.query, error: undefined } })
  }
})

/** The page that sent the user to sign in, if it is one of ours. */
const afterLogin = () => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/'
}

const handleLogin = async () => {
  loading.value = true
  errorMessage.value = null
  try {
    await authApi.login({ email: email.value, password: password.value })
    // The router guard sends pending accounts to the waiting screen
    await router.replace(afterLogin())
  } catch (error) {
    toastStore.addToast(apiErrorMessage(error, t('auth.loginFailed')), 'error')
  } finally {
    loading.value = false
  }
}

const socialLogin = async (provider: 'google' | 'facebook') => {
  try {
    const { url } = await authApi.getSocialRedirect(provider)
    window.location.href = url
  } catch (error) {
    toastStore.addToast(t('auth.socialRedirectFailed', { provider }), 'error')
  }
}
</script>