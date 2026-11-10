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
              <button type="button" role="switch" :aria-checked="prefs.email_notification" :disabled="saving"
                @click="prefs.email_notification = !prefs.email_notification"
                :class="[prefs.email_notification ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700']"
                class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 disabled:opacity-50">
                <span :class="prefs.email_notification ? 'translate-x-5' : 'translate-x-0'"
                  class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
              </button>
            </div>

            <!-- the emails that can wait: one by one, or in a summary (decisions about you always come at once) -->
            <div v-if="prefs.email_notification || prefs.all_email_notification"
              class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div>
                <label for="email-digest" class="text-sm font-medium text-slate-900 dark:text-white">{{ t('settings.emailDigest') }}</label>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ t('settings.emailDigestHelp') }}</p>
              </div>
              <select id="email-digest" v-model="prefs.email_digest" :disabled="saving"
                class="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:w-64 sm:text-sm">
                <option value="twice">{{ t('settings.digestTwice') }}</option>
                <option value="daily">{{ t('settings.digestDaily') }}</option>
                <option value="instant">{{ t('settings.digestInstant') }}</option>
              </select>
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
              <button type="button" role="switch" :aria-checked="prefs.push_notification" :disabled="saving || !pushIsSupported"
                @click="prefs.push_notification = !prefs.push_notification"
                :class="[prefs.push_notification ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700']"
                class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 disabled:opacity-50">
                <span :class="prefs.push_notification ? 'translate-x-5' : 'translate-x-0'"
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
                  @click="prefs[option.key] = !prefs[option.key]"
                  :class="[option.on ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700']"
                  class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 disabled:opacity-50">
                  <span :class="option.on ? 'translate-x-5' : 'translate-x-0'"
                    class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                </button>
              </div>
            </div>
          </div>

          <!-- nothing is stored until Save (turning push on asks the browser here) -->
          <div class="mt-6 flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="button" @click="savePreferences" :disabled="saving || !prefsChanged"
              class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50">
              <ArrowPathIcon v-if="saving" class="h-4 w-4 animate-spin" />
              {{ t('settings.save') }}
            </button>
          </div>
        </div>
      </div>
      </fieldset>

      
      <!-- Agenda views: kept on this device only (see utils/calendarViews) -->
      <div class="page-card border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="px-4 py-6 sm:p-6">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
              <CalendarDaysIcon class="h-6 w-6" />
            </div>
            <div>
              <h3 class="text-lg font-medium text-slate-900 dark:text-white">{{ t('settings.calendarViews') }}</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400">{{ t('settings.calendarViewsHelp') }}</p>
            </div>
          </div>

          <div class="mt-6 space-y-3">
            <div v-for="view in CALENDAR_VIEWS" :key="view.name" class="flex items-center justify-between gap-4">
              <p class="text-sm text-slate-900 dark:text-white">{{ t(view.label) }}</p>
              <!-- the last visible view can't be turned off -->
              <button type="button" role="switch" :aria-checked="isVisible(view.name)" :aria-label="t(view.label)"
                :disabled="isVisible(view.name) && views.visible.length === 1"
                @click="toggleView(view.name)"
                :class="[isVisible(view.name) ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700']"
                class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <span :class="isVisible(view.name) ? 'translate-x-5' : 'translate-x-0'"
                  class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
              </button>
            </div>
          </div>

          <div class="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 dark:border-slate-800">
            <div>
              <label for="initial-view" class="text-sm font-medium text-slate-900 dark:text-white">{{ t('settings.initialView') }}</label>
              <p class="text-xs text-slate-500 dark:text-slate-400">{{ t('settings.initialViewHelp') }}</p>
            </div>
            <select id="initial-view" v-model="views.initial"
              class="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:w-56 sm:text-sm">
              <option v-for="view in visibleViews" :key="view.name" :value="view.name">{{ t(view.label) }}</option>
            </select>
          </div>

          <div class="mt-6 flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="button" @click="saveViews" :disabled="!viewsChanged"
              class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50">
              {{ t('settings.save') }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- which build this device runs (new deploys load by themselves, see utils/appVersion) -->
      <p class="px-1 text-center text-xs text-slate-400 dark:text-slate-500">{{ t('settings.version', { version: APP_VERSION }) }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  CloudArrowUpIcon,
  ArrowPathIcon,
  BellIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  MegaphoneIcon,
  CalendarDaysIcon
} from '@heroicons/vue/24/outline'
import { intlLocale, t } from '../i18n'
import { APP_VERSION } from '../utils/appVersion'
import { authApi } from '../api/auth'
import { useAuthStore } from '../stores/auth'
import type { EmailDigest } from '../types/auth'
import { useToastStore } from '../stores/toast'
import { apiErrorMessage } from '../utils/apiError'
import InstallButton from '../components/common/InstallButton.vue'
import { offlineStatus, syncOfflineData, type OfflineStatus } from '../utils/offlineSync'
import { useConnectionStore } from '../stores/connection'
import OfflineNotice from '../components/common/OfflineNotice.vue'
import { useDialogStore } from '../stores/dialog'
import { showUnblockHelp } from '../utils/pushHelp'
import { CALENDAR_VIEWS, calendarViewSettings, saveCalendarViewSettings, type CalendarView } from '../utils/calendarViews'
import { PushError, disableDevicePush, enableDevicePush, hasDeviceSubscription, pushSupported } from '../utils/push'

const authStore = useAuthStore()
const toastStore = useToastStore()
const dialog = useDialogStore()

const syncing = ref(false)
const saving = ref(false)
const deviceSubscribed = ref(false)
const pushDenied = ref(false)

const pushIsSupported = pushSupported()

type ToggleKey = 'email_notification' | 'push_notification' | 'all_email_notification' | 'all_push_notification'
type Preferences = Record<ToggleKey, boolean> & { email_digest: EmailDigest }
type PreferenceKey = keyof Preferences
const KEYS: PreferenceKey[] = ['email_notification', 'push_notification', 'all_email_notification', 'all_push_notification', 'email_digest']

/** What is saved now. Push "on" means: the user wants it AND this device is subscribed. */
const savedPreferences = (): Preferences => {
  const user = authStore.user
  return {
    email_notification: !!user?.email_notification,
    push_notification: !!user?.push_notification && deviceSubscribed.value,
    all_email_notification: !!user?.all_email_notification,
    all_push_notification: !!user?.all_push_notification && deviceSubscribed.value,
    // an older API without it: the server's default
    email_digest: user?.email_digest ?? 'twice',
  }
}

/** The form: the toggles only change this; Save stores it. */
const prefs = reactive<Preferences>(savedPreferences())
const resetPreferences = () => Object.assign(prefs, savedPreferences())
const changedPreferences = () => {
  const saved = savedPreferences()
  return KEYS.filter((key) => prefs[key] !== saved[key])
}
const prefsChanged = computed(() => changedPreferences().length > 0)

const allOptions = computed(() => [
  { key: 'all_email_notification' as const, label: t('settings.allByEmail'), icon: EnvelopeIcon, on: prefs.all_email_notification },
  { key: 'all_push_notification' as const, label: t('settings.allByPush'), icon: DevicePhoneMobileIcon, on: prefs.all_push_notification },
])

onMounted(async () => {
  deviceSubscribed.value = await hasDeviceSubscription()
  resetPreferences()
  pushDenied.value = pushIsSupported && Notification.permission === 'denied'
})

// ---- agenda views (this device)

/** The form; Save keeps it on this device. */
const views = reactive({
  visible: [...calendarViewSettings.value.visible] as CalendarView[],
  initial: calendarViewSettings.value.initial as CalendarView,
})
const isVisible = (name: CalendarView) => views.visible.includes(name)
const visibleViews = computed(() => CALENDAR_VIEWS.filter((view) => isVisible(view.name)))
const viewsChanged = computed(() =>
  views.initial !== calendarViewSettings.value.initial
  || views.visible.length !== calendarViewSettings.value.visible.length
  || views.visible.some((view) => !calendarViewSettings.value.visible.includes(view)))

/** The last visible view can't be hidden; hiding the opening view opens on the first one left. */
const toggleView = (name: CalendarView) => {
  if (isVisible(name)) {
    if (views.visible.length === 1) return
    views.visible = views.visible.filter((view) => view !== name)
    if (views.initial === name) views.initial = visibleViews.value[0].name
  } else {
    views.visible = CALENDAR_VIEWS.map((view) => view.name).filter((view) => view === name || views.visible.includes(view))
  }
}

const saveViews = () => {
  saveCalendarViewSettings({ visible: [...views.visible], initial: views.initial })
  toastStore.addToast(t('settings.viewsSaved'), 'success', 2500)
}

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

/**
 * Stores what changed in one request. Push of either kind needs this device subscribed: wanting
 * one subscribes it first (the browser may ask), and it is unsubscribed when both are off.
 */
const savePreferences = async () => {
  const changed = changedPreferences()
  if (!changed.length) return

  const wantsPush = prefs.push_notification || prefs.all_push_notification
  saving.value = true
  try {
    if (wantsPush && !deviceSubscribed.value) {
      await enableDevicePush()
      deviceSubscribed.value = true
    }

    // only what changed: a push toggle shown off because this device isn't subscribed stays as it is
    await authApi.updateProfile(Object.fromEntries(changed.map((key) => [key, prefs[key]])) as Partial<Preferences>)

    if (!wantsPush && deviceSubscribed.value) {
      await disableDevicePush()
      deviceSubscribed.value = false
    }
    resetPreferences()
    toastStore.addToast(t('settings.preferencesSaved'), 'success', 2500)
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
</script>
