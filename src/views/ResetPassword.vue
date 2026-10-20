<template>
  <AuthLayout>
    <template #heading>{{ t('reset.title') }}</template>
    <template #subheading>{{ email }}</template>

    <div class="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p v-if="!token || !email" class="text-sm text-red-600 dark:text-red-400">{{ t('reset.badLink') }}</p>

      <form v-else class="space-y-6" @submit.prevent="submit">
        <p v-if="linkError" class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {{ linkError }}
          <router-link :to="{ name: 'ForgotPassword', query: { email } }" class="mt-1 block font-medium underline">
            {{ t('reset.askNewLink') }}
          </router-link>
        </p>

        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {{ t('profile.newPassword') }}
          <input v-model="password" type="password" autocomplete="new-password" minlength="8" required :class="inputClass" />
          <FieldError :errors="errors.password" />
        </label>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {{ t('profile.confirmPassword') }}
          <input v-model="confirmation" type="password" autocomplete="new-password" required :class="inputClass" />
        </label>
        <p class="text-xs text-slate-500 dark:text-slate-400">{{ t('profile.passwordRules') }}</p>

        <button type="submit" :disabled="saving"
          class="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50">
          <ArrowPathIcon v-if="saving" class="h-4 w-4 animate-spin" />
          {{ t('reset.save') }}
        </button>
      </form>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import { t } from '../i18n'
import { authApi } from '../api/auth'
import { apiErrorMessage } from '../utils/apiError'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import AuthLayout from '../components/AuthLayout.vue'
import FieldError from '../components/common/FieldError.vue'

/** Opened from the "reset your password" email: /reset-password?token=…&email=… */
const route = useRoute()
const router = useRouter()
const toast = useToastStore()
const token = typeof route.query.token === 'string' ? route.query.token : ''
const email = typeof route.query.email === 'string' ? route.query.email : ''

const inputClass = 'mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:text-sm'
const password = ref('')
const confirmation = ref('')
const saving = ref(false)
const errors = ref<Record<string, string[]>>({})
const linkError = ref<string | null>(null)

const submit = async () => {
  errors.value = {}
  linkError.value = null
  if (password.value !== confirmation.value) {
    errors.value = { password: [t('profile.passwordMismatch')] }
    return
  }

  saving.value = true
  try {
    toast.success(await authApi.resetPassword({ token, email, password: password.value, password_confirmation: confirmation.value }))
    // every session of the account was ended, this device's too: sign in with the new password
    useAuthStore().clear()
    router.replace({ name: 'Login', query: { email } })
  } catch (error: any) {
    const fieldErrors = error?.response?.data?.errors ?? {}
    // an expired or used link comes back as an error on `email`
    linkError.value = fieldErrors.email?.[0] ?? null
    errors.value = fieldErrors
    if (!linkError.value) toast.error(apiErrorMessage(error, t('reset.failed')))
  } finally {
    saving.value = false
  }
}
</script>
