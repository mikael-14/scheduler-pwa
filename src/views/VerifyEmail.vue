<template>
  <AuthLayout>
    <template #heading>{{ t('verify.title') }}</template>
    <template #subheading>{{ fromLink ? '' : authStore.user?.email }}</template>

    <div class="page-card mt-8 space-y-6 border-slate-200 bg-white px-4 py-8 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
      <!-- opened from the email -->
      <template v-if="fromLink">
        <p v-if="state === 'checking'" class="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <ArrowPathIcon class="h-4 w-4 animate-spin" /> {{ t('verify.checking') }}
        </p>

        <template v-else-if="state === 'done'">
          <p class="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            {{ t('verify.done') }}
          </p>
          <button type="button" :class="primaryButton" @click="continueOn">
            {{ authStore.isAuthenticated() ? t('verify.continue') : t('verify.signIn') }}
          </button>
        </template>

        <template v-else>
          <p class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {{ linkError }}
          </p>
          <button type="button" :class="primaryButton" @click="afterBadLink">
            {{ authStore.isAuthenticated() ? t('verify.askNewLink') : t('verify.signInForNewLink') }}
          </button>
        </template>
      </template>

      <!-- signed in, email not confirmed yet -->
      <template v-else>
        <p class="text-sm text-slate-600 dark:text-slate-300">{{ t('verify.body') }}</p>
        <p v-if="message" class="text-sm text-slate-600 dark:text-slate-300">{{ message }}</p>

        <button type="button" :class="primaryButton" :disabled="checking" @click="checkNow">
          <ArrowPathIcon v-if="checking" class="h-4 w-4 animate-spin" />
          {{ t('verify.confirmed') }}
        </button>
        <button type="button" :class="secondaryButton" :disabled="sending || cooldown > 0" @click="resend">
          {{ cooldown > 0 ? t('verify.resendIn', { seconds: cooldown }) : t('verify.resend') }}
        </button>

        <!-- a typo at sign-up would otherwise leave the account stuck -->
        <details class="text-sm text-slate-600 dark:text-slate-300">
          <summary class="cursor-pointer font-medium">{{ t('verify.wrongEmail') }}</summary>
          <form class="mt-4 space-y-4" @submit.prevent="changeEmail">
            <label class="block font-medium text-slate-700 dark:text-slate-300">
              {{ t('profile.email') }}
              <input v-model="newEmail" type="email" autocomplete="email" required :class="inputClass" />
              <FieldError :errors="errors.email" />
            </label>
            <label v-if="hasPassword" class="block font-medium text-slate-700 dark:text-slate-300">
              {{ t('profile.currentPassword') }}
              <input v-model="currentPassword" type="password" autocomplete="current-password" required :class="inputClass" />
              <FieldError :errors="errors.current_password" />
            </label>
            <button type="submit" :class="secondaryButton" :disabled="changing">{{ t('verify.changeEmail') }}</button>
          </form>
        </details>

        <button type="button" class="w-full text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          @click="authStore.logout(router)">
          {{ t('nav.logout') }}
        </button>
      </template>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import { t } from '../i18n'
import { authApi } from '../api/auth'
import { apiErrorMessage } from '../utils/apiError'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import AuthLayout from '../components/AuthLayout.vue'
import FieldError from '../components/common/FieldError.vue'

/**
 * Two uses:
 * - /verify-email?id=…&hash=…&expires=…&signature=… — opened from the email (PwaVerifyEmail on the
 *   API): confirms it, signed in or not, on any device
 * - /verify-email — a signed-in account whose email is not confirmed yet waits here (router guard):
 *   send the link again, fix a mistyped address, or carry on once it is confirmed elsewhere
 */
const CHECK_EVERY_MS = 30_000
const RESEND_COOLDOWN_S = 60

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToastStore()

const primaryButton = 'flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50'
const secondaryButton = 'flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
const inputClass = 'mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:text-sm'

const query = (name: string) => (typeof route.query[name] === 'string' ? (route.query[name] as string) : '')
const link = { id: query('id'), hash: query('hash'), expires: query('expires'), signature: query('signature') }
const fromLink = computed(() => Object.values(link).every(Boolean))

// ---- the emailed link

const state = ref<'checking' | 'done' | 'failed'>('checking')
const linkError = ref('')

async function confirmLink() {
  try {
    await authApi.verifyEmail(link)
    state.value = 'done'
    // the signed-in account here may be the one just confirmed: refresh what the app knows
    if (authStore.isAuthenticated()) {
      await authApi.getCurrentUser().catch(() => undefined)
    }
  } catch (error) {
    state.value = 'failed'
    linkError.value = apiErrorMessage(error, t('verify.badLink'))
  }
}

function afterBadLink() {
  // a full load: the same screen without the link's values is the "send it again" screen
  if (authStore.isAuthenticated()) window.location.replace('/verify-email')
  else router.replace({ name: 'Login' })
}

function continueOn() {
  // the router sends an account that still waits for approval to its own screen
  router.replace(authStore.isAuthenticated() ? { name: 'Home' } : { name: 'Login' })
}

// ---- waiting while signed in

const checking = ref(false)
const sending = ref(false)
const cooldown = ref(0)
const message = ref('')
let checkTimer: ReturnType<typeof setInterval> | undefined
let cooldownTimer: ReturnType<typeof setInterval> | undefined

async function check(quiet: boolean) {
  if (checking.value || authStore.loggingOut || !authStore.isAuthenticated()) return
  checking.value = true
  try {
    await authApi.getCurrentUser()
    if (authStore.isEmailVerified()) {
      router.replace({ name: 'Home' })
    } else if (!quiet) {
      message.value = t('verify.notYet')
    }
  } catch (error) {
    if (!quiet) message.value = apiErrorMessage(error, t('connection.failed'))
  } finally {
    checking.value = false
  }
}
const checkNow = () => check(false)
const checkQuietly = () => {
  if (document.visibilityState === 'visible') check(true)
}

function startCooldown() {
  cooldown.value = RESEND_COOLDOWN_S
  clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    cooldown.value -= 1
    if (cooldown.value <= 0) clearInterval(cooldownTimer)
  }, 1000)
}

async function resend() {
  sending.value = true
  try {
    message.value = await authApi.resendVerification()
    startCooldown()
  } catch (error) {
    toast.error(apiErrorMessage(error, t('verify.resendFailed')))
  } finally {
    sending.value = false
  }
}

// ---- mistyped address

const hasPassword = computed(() => authStore.user?.has_password !== false)
const newEmail = ref(authStore.user?.email ?? '')
const currentPassword = ref('')
const changing = ref(false)
const errors = ref<Record<string, string[]>>({})

async function changeEmail() {
  changing.value = true
  errors.value = {}
  try {
    await authApi.updateProfile({
      email: newEmail.value,
      ...(hasPassword.value ? { current_password: currentPassword.value } : {}),
    } as any)
    currentPassword.value = ''
    message.value = t('verify.sentTo', { email: newEmail.value })
    startCooldown()
  } catch (error: any) {
    errors.value = error?.response?.data?.errors ?? {}
    toast.error(apiErrorMessage(error, t('profile.updateFailed')))
  } finally {
    changing.value = false
  }
}

onMounted(() => {
  if (fromLink.value) {
    confirmLink()
    return
  }
  if (!authStore.isAuthenticated()) {
    router.replace({ name: 'Login' })
    return
  }
  if (authStore.isEmailVerified()) {
    router.replace({ name: 'Home' })
    return
  }
  // confirmed on another device (the email opened on a computer): carry on by itself
  checkTimer = setInterval(checkQuietly, CHECK_EVERY_MS)
  document.addEventListener('visibilitychange', checkQuietly)
  window.addEventListener('online', checkQuietly)
})

onUnmounted(() => {
  clearInterval(checkTimer)
  clearInterval(cooldownTimer)
  document.removeEventListener('visibilitychange', checkQuietly)
  window.removeEventListener('online', checkQuietly)
})
</script>
