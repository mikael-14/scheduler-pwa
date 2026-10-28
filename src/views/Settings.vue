<template>
  <div class="max-w-4xl mx-auto space-y-6 sm:space-y-8">
    <header>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">{{ t('settings.title') }}</h1>
      <p class="mt-2 text-slate-600 dark:text-slate-400">{{ t('settings.subtitle') }}</p>
    </header>

    <div class="space-y-6">
      <InstallButton />

      <!-- Sync Section -->
      <div class="page-card border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="px-4 py-6 sm:p-6">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
              <CloudArrowUpIcon class="h-6 w-6" />
            </div>
            <div>
              <h3 class="text-lg font-medium text-slate-900 dark:text-white">{{ t('settings.offlineSync') }}</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400">{{ t('settings.offlineSyncHelp') }}</p>
            </div>
          </div>

          <!-- what is saved on this device (see utils/offlineSync) -->
          <dl class="mt-6 grid gap-4 sm:grid-cols-3">
            <div>
              <dt class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('settings.offlineRange') }}</dt>
              <dd class="mt-1 text-sm font-medium text-slate-900 dark:text-white">{{ savedRange }}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('settings.offlineCount') }}</dt>
              <dd class="mt-1 text-sm font-medium text-slate-900 dark:text-white">{{ offline?.window ? offline.count : '—' }}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('settings.offlineSavedAt') }}</dt>
              <dd class="mt-1 text-sm font-medium text-slate-900 dark:text-white">{{ savedAt }}</dd>
            </div>
          </dl>

          <div class="mt-6 flex items-center justify-between gap-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            <p class="text-xs text-slate-500 dark:text-slate-400">{{ t('settings.autoSyncHelp') }}</p>
            <button @click="handleSync" :disabled="syncing || connection.status === 'offline'"
              class="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
              <ArrowPathIcon class="h-4 w-4" :class="{ 'animate-spin': syncing }" />
              {{ t('settings.syncNow') }}
            </button>
          </div>
        </div>
      </div>

      <OfflineNotice />

      <!-- Notification preferences: stored on the user, shared with the admin panel -->
      <fieldset :disabled="connection.status === 'offline'" class="min-w-0 disabled:opacity-60">
      <div class="page-card border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="px-4 py-6 sm:p-6">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
              <BellIcon class="h-6 w-6" />
            </div>
            <div>
              <h3 class="text-lg font-medium text-slate-900 dark:text-white">{{ t('settings.notifications') }}</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400">{{ t('settings.notificationsHelp') }}</p>
            </div>
          </div>

          <div class="mt-6 space-y-4">
            <!-- Email -->
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                  <EnvelopeIcon class="h-4 w-4" />
                  {{ t('settings.emailNotifications') }}
                </p>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ t('settings.emailNotificationsHelp') }}</p>
              </div>
              <button type="button" role="switch" :aria-checked="emailEnabled" :disabled="saving"
                @click="toggleEmail"
                :class="[emailEnabled ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700']"
                class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 disabled:opacity-50">
                <span :class="emailEnabled ? 'translate-x-5' : 'translate-x-0'"
                  class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
              </button>
            </div>

            <!-- Push -->
            <div class="flex items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                <p class="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                  <DevicePhoneMobileIcon class="h-4 w-4" />
                  {{ t('settings.pushNotifications') }}
                </p>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ t('settings.pushNotificationsHelp') }}</p>
                <p v-if="!pushIsSupported" class="mt-1 text-xs text-amber-600 dark:text-amber-400">{{ t('settings.pushUnsupported') }}</p>
                <p v-else-if="pushDenied" class="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  {{ t('settings.pushDenied') }}
                  <button type="button" @click="showUnblockHelp(dialog)" class="font-semibold underline">{{ t('push.howToUnblock') }}</button>
                </p>
              </div>
              <button type="button" role="switch" :aria-checked="pushEnabled" :disabled="saving || !pushIsSupported"
                @click="togglePush"
                :class="[pushEnabled ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700']"
                class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 disabled:opacity-50">
                <span :class="pushEnabled ? 'translate-x-5' : 'translate-x-0'"
                  class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
              </button>
            </div>
          </div>

          <!-- All notifications: other people's schedules too -->
          <div class="mt-6 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <p class="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <MegaphoneIcon class="h-4 w-4" />
              {{ t('settings.allNotifications') }}
            </p>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ t('settings.allNotificationsHelp') }}</p>

            <div class="mt-4 space-y-3">
              <div v-for="option in allOptions" :key="option.key" class="flex items-center justify-between gap-4">
                <p class="flex items-center gap-2 text-sm text-slate-900 dark:text-white">
                  <component :is="option.icon" class="h-4 w-4" />
                  {{ option.label }}
                </p>
                <button type="button" role="switch" :aria-checked="option.on" :aria-label="option.label"
                  :disabled="saving || (option.key === 'all_push_notification' && !pushIsSupported)"
                  @click="option.key === 'all_push_notification' ? toggleAllPush() : toggleAllEmail()"
                  :class="[option.on ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700']"
                  class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 disabled:opacity-50">
                  <span :class="option.on ? 'translate-x-5' : 'translate-x-0'"
                    class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </fieldset>

      <!-- which build this device runs (new deploys load by themselves, see utils/appVersion) -->
      <p class="px-1 text-center text-xs text-slate-400 dark:text-slate-500">{{ t('settings.version', { version: APP_VERSION }) }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  CloudArrowUpIcon,
  ArrowPathIcon,
  BellIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  MegaphoneIcon
} from '@heroicons/vue/24/outline'
import { intlLocale, t } from '../i18n'
import { APP_VERSION } from '../utils/appVersion'
import { authApi } from '../api/auth'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import { apiErrorMessage } from '../utils/apiError'
import InstallButton from '../components/common/InstallButton.vue'
import { offlineStatus, syncOfflineData, type OfflineStatus } from '../utils/offlineSync'
import { useConnectionStore } from '../stores/connection'
import OfflineNotice from '../components/common/OfflineNotice.vue'
import { useDialogStore } from '../stores/dialog'
import { showUnblockHelp } from '../utils/pushHelp'
import { PushError, disableDevicePush, enableDevicePush, hasDeviceSubscription, pushSupported } from '../utils/push'

const authStore = useAuthStore()
const toastStore = useToastStore()
const dialog = useDialogStore()

const syncing = ref(false)
const saving = ref(false)
const deviceSubscribed = ref(false)
const pushDenied = ref(false)

const pushIsSupported = pushSupported()

const emailEnabled = computed(() => !!authStore.user?.email_notification)
// "On" means: the user wants push AND this device is subscribed
const pushEnabled = computed(() => !!authStore.user?.push_notification && deviceSubscribed.value)
// "all notifications" (other people's schedules); push needs this device subscribed too
const allEmailEnabled = computed(() => !!authStore.user?.all_email_notification)
const allPushEnabled = computed(() => !!authStore.user?.all_push_notification && deviceSubscribed.value)
const allOptions = computed(() => [
  { key: 'all_email_notification', label: t('settings.allByEmail'), icon: EnvelopeIcon, on: allEmailEnabled.value },
  { key: 'all_push_notification', label: t('settings.allByPush'), icon: DevicePhoneMobileIcon, on: allPushEnabled.value },
])

onMounted(async () => {
  deviceSubscribed.value = await hasDeviceSubscription()
  pushDenied.value = pushIsSupported && Notification.permission === 'denied'
})

// ---- offline copy

const connection = useConnectionStore()
const offline = ref<OfflineStatus | null>(null)

const shortDay = (day: string) =>
  new Intl.DateTimeFormat(intlLocale(), { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${day}T00:00:00Z`))
const savedRange = computed(() =>
  offline.value?.window ? `${shortDay(offline.value.window.from)} – ${shortDay(offline.value.window.to)}` : t('settings.offlineNothing'))
const savedAt = computed(() =>
  offline.value?.savedAt
    ? new Intl.DateTimeFormat(intlLocale(), { dateStyle: 'short', timeStyle: 'short' }).format(offline.value.savedAt)
    : '—')

const loadOfflineStatus = async () => {
  offline.value = await offlineStatus().catch(() => null)
}

/** Save this week and next again now (it also happens by itself). */
const handleSync = async () => {
  syncing.value = true
  try {
    if (await syncOfflineData()) {
      toastStore.success(t('settings.syncComplete'))
    } else {
      toastStore.error(t('settings.syncFailed'))
    }
    await loadOfflineStatus()
  } finally {
    syncing.value = false
  }
}

onMounted(loadOfflineStatus)

type Preferences = {
  email_notification?: boolean; push_notification?: boolean
  all_email_notification?: boolean; all_push_notification?: boolean
}

const save = async (preferences: Preferences) => {
  await authApi.updateProfile(preferences)
  toastStore.addToast(t('settings.preferencesSaved'), 'success', 2500)
}

const toggleAllEmail = async () => {
  saving.value = true
  try {
    await save({ all_email_notification: !allEmailEnabled.value })
  } catch (error) {
    toastStore.addToast(apiErrorMessage(error, t('settings.preferencesFailed')), 'error')
  } finally {
    saving.value = false
  }
}

/**
 * Push of either kind needs this device subscribed: turning one on subscribes it, and it is
 * only unsubscribed when both are off.
 */
const setPush = async (field: 'push_notification' | 'all_push_notification', on: boolean) => {
  saving.value = true
  try {
    if (on) {
      if (!deviceSubscribed.value) await enableDevicePush()
      deviceSubscribed.value = true
      await save({ [field]: true })
    } else {
      const other = field === 'push_notification' ? 'all_push_notification' : 'push_notification'
      if (!authStore.user?.[other]) {
        await disableDevicePush()
        deviceSubscribed.value = false
      }
      await save({ [field]: false })
    }
  } catch (error) {
    if (error instanceof PushError && error.reason === 'denied') {
      // blocked in the browser: it will not ask again, so explain where to allow it
      pushDenied.value = true
      showUnblockHelp(dialog)
    } else if (error instanceof PushError) {
      toastStore.addToast(t('settings.pushUnsupported'), 'error')
    } else {
      toastStore.addToast(apiErrorMessage(error, t('settings.preferencesFailed')), 'error')
    }
  } finally {
    saving.value = false
    pushDenied.value = pushIsSupported && Notification.permission === 'denied'
  }
}

const toggleAllPush = () => setPush('all_push_notification', !allPushEnabled.value)

const toggleEmail = async () => {
  saving.value = true
  try {
    await save({ email_notification: !emailEnabled.value })
  } catch (error) {
    toastStore.addToast(apiErrorMessage(error, t('settings.preferencesFailed')), 'error')
  } finally {
    saving.value = false
  }
}

const togglePush = () => setPush('push_notification', !pushEnabled.value)
</script>
