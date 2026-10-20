<template>
  <AuthLayout>
    <template #heading>{{ t('forgot.title') }}</template>
    <template #subheading>{{ t('forgot.subtitle') }}</template>

    <div class="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <!-- the same answer whether or not the email has an account -->
      <div v-if="sentMessage" class="space-y-6 text-center">
        <EnvelopeIcon class="mx-auto h-12 w-12 text-primary-600" />
        <p class="text-sm text-slate-700 dark:text-slate-300">{{ sentMessage }}</p>
        <p class="text-xs text-slate-500 dark:text-slate-400">{{ t('forgot.checkSpam') }}</p>
        <button type="button" @click="sentMessage = null"
          class="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
          {{ t('forgot.sendAgain') }}
        </button>
      </div>

      <form v-else class="space-y-6" @submit.prevent="submit">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {{ t('auth.emailAddress') }}
          <input v-model="email" type="email" autocomplete="email" required placeholder="you@example.com"
            class="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:text-sm" />
          <FieldError :errors="errors.email" />
        </label>
        <button type="submit" :disabled="sending"
          class="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50">
          <ArrowPathIcon v-if="sending" class="h-4 w-4 animate-spin" />
          {{ t('forgot.send') }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm">
        <router-link :to="{ name: 'Login' }" class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
          {{ t('forgot.backToLogin') }}
        </router-link>
      </p>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowPathIcon, EnvelopeIcon } from '@heroicons/vue/24/outline'
import { t } from '../i18n'
import { authApi } from '../api/auth'
import { apiErrorMessage } from '../utils/apiError'
import { useToastStore } from '../stores/toast'
import AuthLayout from '../components/AuthLayout.vue'
import FieldError from '../components/common/FieldError.vue'

const route = useRoute()
const toast = useToastStore()
// the login form passes the email that was typed there
const email = ref(typeof route.query.email === 'string' ? route.query.email : '')
const sending = ref(false)
const sentMessage = ref<string | null>(null)
const errors = ref<Record<string, string[]>>({})

const submit = async () => {
  sending.value = true
  errors.value = {}
  try {
    sentMessage.value = await authApi.forgotPassword(email.value.trim())
  } catch (error: any) {
    errors.value = error?.response?.data?.errors ?? {}
    toast.error(apiErrorMessage(error, t('forgot.failed')))
  } finally {
    sending.value = false
  }
}
</script>
