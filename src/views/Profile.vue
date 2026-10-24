<template>
  <div class="max-w-4xl mx-auto space-y-8">
    <header>
      <h1 class="text-3xl font-bold text-slate-900 dark:text-white">{{ t('profile.title') }}</h1>
      <p class="mt-2 text-slate-600 dark:text-slate-400">{{ t('profile.subtitle') }}</p>
    </header>

    <OfflineNotice />

    <!-- every change here needs the server: nothing can be pressed offline -->
    <fieldset :disabled="connection.status === 'offline'" class="min-w-0 space-y-8 disabled:opacity-60">
    <!-- Personal information -->
    <section class="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div class="space-y-1">
        <h3 class="text-lg font-medium text-slate-900 dark:text-white">{{ t('profile.personalInfo') }}</h3>
        <p class="text-sm text-slate-600 dark:text-slate-400">{{ t('profile.personalInfoHelp') }}</p>
      </div>

      <div class="lg:col-span-2">
        <div :class="cardClass">
          <form @submit.prevent="updateProfile" class="space-y-6">
            <div class="flex items-center gap-6">
              <div class="relative h-20 w-20 shrink-0">
                <img :src="avatarSrc" class="h-full w-full rounded-full border border-slate-200 object-cover dark:border-slate-700" :alt="t('profile.avatarAlt')" />
                <button type="button" @click="avatarInput?.click()" :disabled="avatarBusy" :aria-label="t('profile.changePhoto')"
                  class="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <ArrowPathIcon v-if="avatarBusy" class="h-4 w-4 animate-spin" />
                  <CameraIcon v-else class="h-4 w-4" />
                </button>
                <input ref="avatarInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onAvatarChosen" />
              </div>
              <div class="min-w-0">
                <h4 class="text-sm font-medium text-slate-900 dark:text-white">{{ t('profile.photo') }}</h4>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ t('profile.photoHelp') }}</p>
                <button v-if="user?.avatar_url" type="button" @click="removeAvatar" :disabled="avatarBusy"
                  class="mt-1 text-xs font-medium text-red-600 hover:text-red-500 disabled:opacity-50 dark:text-red-400">
                  {{ t('profile.removePhoto') }}
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label class="block space-y-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <span>{{ t('profile.fullName') }}</span>
                <input v-model="profile.name" type="text" autocomplete="name" required :class="inputClass" />
                <FieldError :errors="profileErrors.name" />
              </label>
              <label class="block space-y-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <span>{{ t('profile.email') }}</span>
                <input v-model="profile.email" type="email" autocomplete="email" required :class="inputClass" />
                <FieldError :errors="profileErrors.email" />
              </label>
            </div>

            <label class="block space-y-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <span>{{ t('profile.language') }}</span>
              <select v-model="profile.language" :class="inputClass">
                <option value="pt">Português</option>
                <option value="en">English</option>
              </select>
            </label>

            <div class="flex justify-end pt-4">
              <button type="submit" :disabled="savingProfile" :class="primaryButton">
                <ArrowPathIcon v-if="savingProfile" class="h-4 w-4 animate-spin" />
                {{ t('profile.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>

    <!-- Password -->
    <section class="grid grid-cols-1 gap-8 border-t border-slate-200 pt-8 dark:border-slate-800 lg:grid-cols-3">
      <div class="space-y-1">
        <h3 class="text-lg font-medium text-slate-900 dark:text-white">{{ t('profile.security') }}</h3>
        <p class="text-sm text-slate-600 dark:text-slate-400">
          {{ hasPassword ? t('profile.securityHelp') : t('profile.setPasswordHelp') }}
        </p>
      </div>

      <div class="lg:col-span-2 space-y-4">
        <div :class="cardClass">
          <form @submit.prevent="updatePassword" class="space-y-6">
            <!-- accounts made with Google / Facebook have no current password to confirm -->
            <label v-if="hasPassword" class="block space-y-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <span>{{ t('profile.currentPassword') }}</span>
              <input v-model="passwords.current" type="password" autocomplete="current-password" required :class="inputClass" />
              <FieldError :errors="passwordErrors.current_password" />
            </label>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label class="block space-y-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <span>{{ t('profile.newPassword') }}</span>
                <input v-model="passwords.new" type="password" autocomplete="new-password" minlength="8" required :class="inputClass" />
                <FieldError :errors="passwordErrors.password" />
              </label>
              <label class="block space-y-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <span>{{ t('profile.confirmPassword') }}</span>
                <input v-model="passwords.confirm" type="password" autocomplete="new-password" required :class="inputClass" />
              </label>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400">{{ t('profile.passwordRules') }}</p>
            <div class="flex justify-end pt-2">
              <button type="submit" :disabled="savingPassword"
                class="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
                <ArrowPathIcon v-if="savingPassword" class="h-4 w-4 animate-spin" />
                {{ hasPassword ? t('profile.updatePassword') : t('profile.setPassword') }}
              </button>
            </div>
          </form>
        </div>

        <!-- Linked sign-in providers -->
        <div :class="cardClass">
          <h4 class="text-sm font-medium text-slate-900 dark:text-white">{{ t('profile.linkedAccounts') }}</h4>
          <ul class="mt-3 space-y-2">
            <li v-for="provider in PROVIDERS" :key="provider.id" class="flex items-center justify-between text-sm">
              <span class="text-slate-700 dark:text-slate-300">{{ provider.label }}</span>
              <span v-if="user?.providers?.includes(provider.id)"
                class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                {{ t('profile.linked') }}
              </span>
              <span v-else class="text-xs text-slate-500">{{ t('profile.notLinked') }}</span>
            </li>
          </ul>
          <p class="mt-3 text-xs text-slate-500 dark:text-slate-400">{{ t('profile.linkedHelp') }}</p>
        </div>
      </div>
    </section>

    <!-- Signed-in devices -->
    <section class="grid grid-cols-1 gap-8 border-t border-slate-200 pt-8 dark:border-slate-800 lg:grid-cols-3">
      <div class="space-y-1">
        <h3 class="text-lg font-medium text-slate-900 dark:text-white">{{ t('profile.devices') }}</h3>
        <p class="text-sm text-slate-600 dark:text-slate-400">{{ t('profile.devicesHelp') }}</p>
      </div>

      <div class="lg:col-span-2">
        <div :class="cardClass">
          <p v-if="devicesLoading && !devices.length" class="text-sm text-slate-500">{{ t('schedule.loading') }}</p>
          <p v-else-if="devicesError" class="text-sm text-red-600 dark:text-red-400">{{ devicesError }}</p>
          <ul v-else class="divide-y divide-slate-100 dark:divide-slate-800">
            <li v-for="device in devices" :key="device.id" class="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div class="flex min-w-0 items-center gap-3">
                <DevicePhoneMobileIcon class="h-6 w-6 shrink-0 text-slate-400" />
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-slate-900 dark:text-white">
                    {{ device.name }}
                    <span v-if="device.current" class="ml-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
                      {{ t('profile.thisDevice') }}
                    </span>
                  </p>
                  <p class="text-xs text-slate-500 dark:text-slate-400">{{ deviceActivity(device) }}</p>
                </div>
              </div>
              <button v-if="!device.current" type="button" @click="revoke(device)"
                class="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
                {{ t('profile.signOutDevice') }}
              </button>
            </li>
          </ul>
          <div v-if="devices.length > 1" class="mt-4 flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="button" @click="revokeOthers"
              class="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950">
              {{ t('profile.signOutOthers') }}
            </button>
          </div>
        </div>
      </div>
    </section>
    </fieldset>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ArrowPathIcon, CameraIcon, DevicePhoneMobileIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import { useDialogStore } from '../stores/dialog'
import { authApi, type DeviceSession } from '../api/auth'
import { intlLocale, t } from '../i18n'
import { apiErrorMessage, isNetworkError } from '../utils/apiError'
import FieldError from '../components/common/FieldError.vue'
import OfflineNotice from '../components/common/OfflineNotice.vue'
import { useConnectionStore } from '../stores/connection'

const PROVIDERS = [
  { id: 'google', label: 'Google' },
  { id: 'facebook', label: 'Facebook' },
]
const AVATAR_MAX_BYTES = 2 * 1024 * 1024
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const cardClass = 'page-card border-slate-200 bg-white px-4 py-6 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900'
const inputClass = 'block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:text-sm'
const primaryButton = 'inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50'

const authStore = useAuthStore()
const toast = useToastStore()
const dialog = useDialogStore()
const connection = useConnectionStore()
const user = computed(() => authStore.user)
// the API says whether there is one; older cached users count as having one
const hasPassword = computed(() => user.value?.has_password !== false)

const avatarSrc = computed(() =>
  user.value?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.value?.name ?? '')}`)

// ---- personal information

const profile = reactive({
  name: user.value?.name || '',
  email: user.value?.email || '',
  language: user.value?.language || (user.value as any)?.locale || 'pt',
})
const savingProfile = ref(false)
const profileErrors = ref<Record<string, string[]>>({})

const updateProfile = async () => {
  savingProfile.value = true
  profileErrors.value = {}
  try {
    await authApi.updateProfile({ name: profile.name, email: profile.email, language: profile.language })
    toast.success(t('profile.updated'))
  } catch (error: any) {
    profileErrors.value = error?.response?.data?.errors ?? {}
    toast.error(apiErrorMessage(error, t('profile.updateFailed')))
  } finally {
    savingProfile.value = false
  }
}

// ---- photo

const avatarInput = ref<HTMLInputElement | null>(null)
const avatarBusy = ref(false)

const onAvatarChosen = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // the same file can be chosen again
  if (!file) return

  // checked here first, so a big photo on a slow connection is not uploaded for nothing
  if (!AVATAR_TYPES.includes(file.type)) return toast.error(t('profile.photoWrongType'))
  if (file.size > AVATAR_MAX_BYTES) return toast.error(t('profile.photoTooBig'))

  avatarBusy.value = true
  try {
    await authApi.uploadAvatar(file)
    toast.success(t('profile.photoUpdated'))
  } catch (error) {
    toast.error(apiErrorMessage(error, t('profile.photoFailed')))
  } finally {
    avatarBusy.value = false
  }
}

const removeAvatar = () => dialog.confirm({
  title: t('profile.removePhotoTitle'),
  tone: 'warning',
  confirmLabel: t('profile.removePhoto'),
  onConfirm: async () => {
    try {
      await authApi.deleteAvatar()
      toast.success(t('profile.photoRemoved'))
    } catch (error) {
      toast.error(apiErrorMessage(error, t('profile.photoFailed')))
      if (isNetworkError(error)) throw error
    }
  },
})

// ---- password

const passwords = reactive({ current: '', new: '', confirm: '' })
const savingPassword = ref(false)
const passwordErrors = ref<Record<string, string[]>>({})

const updatePassword = async () => {
  passwordErrors.value = {}
  if (passwords.new !== passwords.confirm) {
    passwordErrors.value = { password: [t('profile.passwordMismatch')] }
    return
  }

  savingPassword.value = true
  try {
    await authApi.updatePassword({
      ...(hasPassword.value ? { current_password: passwords.current } : {}),
      password: passwords.new,
      password_confirmation: passwords.confirm,
    })
    passwords.current = passwords.new = passwords.confirm = ''
    toast.success(t(hasPassword.value ? 'profile.passwordUpdated' : 'profile.passwordSet'))
    // the API signs out the other devices after a password change
    await authApi.getCurrentUser().catch(() => undefined)
    loadDevices()
  } catch (error: any) {
    passwordErrors.value = error?.response?.data?.errors ?? {}
    toast.error(apiErrorMessage(error, t('profile.passwordFailed')))
  } finally {
    savingPassword.value = false
  }
}

// ---- devices

const devices = ref<DeviceSession[]>([])
const devicesLoading = ref(false)
const devicesError = ref<string | null>(null)

const loadDevices = async () => {
  devicesLoading.value = true
  devicesError.value = null
  try {
    devices.value = await authApi.sessions()
  } catch (error) {
    devicesError.value = apiErrorMessage(error, t('profile.devicesFailed'))
  } finally {
    devicesLoading.value = false
  }
}

const deviceActivity = (device: DeviceSession) => {
  const when = device.last_used_at ?? device.created_at
  const formatted = new Intl.DateTimeFormat(intlLocale(), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(when))
  return t('profile.lastActive', { when: formatted })
}

const revoke = (device: DeviceSession) => dialog.confirm({
  title: t('profile.signOutDeviceTitle', { name: device.name }),
  message: t('profile.signOutDeviceBody'),
  tone: 'warning',
  confirmLabel: t('profile.signOutDevice'),
  onConfirm: async () => {
    try {
      await authApi.revokeSession(device.id)
      devices.value = devices.value.filter((item) => item.id !== device.id)
      toast.success(t('profile.deviceSignedOut'))
    } catch (error) {
      toast.error(apiErrorMessage(error, t('profile.devicesFailed')))
      if (isNetworkError(error)) throw error
      await loadDevices()
    }
  },
})

const revokeOthers = () => dialog.confirm({
  title: t('profile.signOutOthersTitle'),
  message: t('profile.signOutDeviceBody'),
  tone: 'danger',
  confirmLabel: t('profile.signOutOthers'),
  onConfirm: async () => {
    try {
      toast.success(await authApi.revokeOtherSessions())
      devices.value = devices.value.filter((item) => item.current)
    } catch (error) {
      toast.error(apiErrorMessage(error, t('profile.devicesFailed')))
      if (isNetworkError(error)) throw error
    }
  },
})

onMounted(() => {
  // fresh account data (photo, password, linked providers) and the device list
  authApi.getCurrentUser().catch(() => undefined)
  loadDevices()
})
</script>
