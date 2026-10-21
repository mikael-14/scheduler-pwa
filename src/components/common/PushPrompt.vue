<template>
  <div v-if="variant" role="status"
    class="mb-6 flex flex-col gap-3 rounded-2xl border border-primary-200 bg-primary-50 p-4 text-sm dark:border-primary-500/30 dark:bg-primary-500/10 sm:flex-row sm:items-center">
    <BellAlertIcon class="hidden h-6 w-6 shrink-0 text-primary-600 dark:text-primary-400 sm:block" />
    <p class="flex-1 text-slate-700 dark:text-slate-200">
      {{ variant === 'ask' ? t('push.askBody') : t('push.blockedBody') }}
    </p>
    <div class="flex shrink-0 gap-2">
      <button type="button" @click="snooze"
        class="rounded-lg px-3 py-1.5 font-medium text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-slate-800">
        {{ t('push.notNow') }}
      </button>
      <button v-if="variant === 'ask'" type="button" @click="enable" :disabled="busy"
        class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-1.5 font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50">
        <ArrowPathIcon v-if="busy" class="h-4 w-4 animate-spin" />
        {{ t('push.enable') }}
      </button>
      <button v-else type="button" @click="showUnblockHelp(dialog)"
        class="rounded-lg bg-primary-600 px-3 py-1.5 font-semibold text-white shadow-sm hover:bg-primary-500">
        {{ t('push.howToUnblock') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ArrowPathIcon, BellAlertIcon } from '@heroicons/vue/24/outline'
import { t } from '../../i18n'
import { useAuthStore } from '../../stores/auth'
import { useDialogStore } from '../../stores/dialog'
import { useToastStore } from '../../stores/toast'
import {
  PushError, enableDevicePush, hasDeviceSubscription, onPushPermissionChange, pushPermission, restoreDevicePush,
  type PushPermission,
} from '../../utils/push'
import { showUnblockHelp } from '../../utils/pushHelp'

/**
 * For people who want push (profile setting on) but do not get it on this device:
 * - never answered / closed the browser prompt → "Turn on notifications on this device";
 * - blocked in the browser → how to unblock it (the app cannot ask any more);
 * - allowed but the subscription was lost → subscribe again quietly, no banner.
 * "Not now" hides it for two weeks on this device.
 */
const SNOOZE_KEY = 'pushPromptSnoozedUntil'
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000

const authStore = useAuthStore()
const dialog = useDialogStore()
const toast = useToastStore()

const permission = ref<PushPermission>(pushPermission())
const subscribed = ref(true) // until checked: no flash of the banner
const busy = ref(false)
const snoozedUntil = ref(readSnooze())

function readSnooze(): number {
  try {
    return Number(localStorage.getItem(SNOOZE_KEY)) || 0
  } catch {
    return 0
  }
}

// either kind of push (personal or "all notifications") needs this device subscribed
const wantsPush = () => authStore.user?.push_notification !== false || authStore.user?.all_push_notification === true

const variant = computed<'ask' | 'blocked' | null>(() => {
  if (!authStore.isApproved() || !wantsPush()) return null
  if (subscribed.value || snoozedUntil.value > Date.now()) return null
  if (permission.value === 'default') return 'ask'
  if (permission.value === 'denied') return 'blocked'
  return null // granted (restored quietly) or not supported (e.g. iPhone outside the installed app)
})

async function check() {
  permission.value = pushPermission()
  if (permission.value === 'unsupported' || !wantsPush()) return
  if (await restoreDevicePush()) toast.success(t('push.restored'))
  subscribed.value = await hasDeviceSubscription()
}

/** Asked from a tap, as browsers require; this is the only moment the prompt appears. */
async function enable() {
  busy.value = true
  try {
    await enableDevicePush()
    subscribed.value = true
    toast.success(t('push.enabled'))
  } catch (error) {
    if (!(error instanceof PushError && error.reason === 'denied')) {
      toast.error(t('settings.pushUnsupported'))
    }
  } finally {
    busy.value = false
    permission.value = pushPermission()
  }
}

function snooze() {
  snoozedUntil.value = Date.now() + SNOOZE_MS
  try {
    localStorage.setItem(SNOOZE_KEY, String(snoozedUntil.value))
  } catch {
    /* storage unavailable: hidden until the next start */
  }
}

// coming back from the browser settings (where it may have been unblocked)
const onVisible = () => document.visibilityState === 'visible' && check()

onMounted(() => {
  check()
  onPushPermissionChange(check)
  document.addEventListener('visibilitychange', onVisible)
})
onUnmounted(() => document.removeEventListener('visibilitychange', onVisible))
</script>
