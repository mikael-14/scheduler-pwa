<template>
  <div class="relative">
    <!-- Compact: a signal icon with a coloured dot, plus the age of the data from sm screens up -->
    <button type="button" @click="open = !open"
      class="inline-flex h-10 items-center gap-1.5 rounded-full px-2 text-slate-500 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-slate-400 dark:hover:bg-slate-800"
      :aria-label="`${statusLabel}. ${updatedLabel}`" :aria-expanded="open">
      <span class="relative">
        <component :is="connection.status === 'online' ? SignalIcon : SignalSlashIcon" class="h-5 w-5" />
        <span :class="['absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900', dotClass]"></span>
      </span>
      <span class="hidden text-xs sm:inline">{{ relativeUpdate }}</span>
    </button>

    <template v-if="open">
      <!-- click outside closes -->
      <div class="fixed inset-0 z-40" @click="open = false"></div>
      <div role="dialog"
        class="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <p class="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <span :class="['h-2.5 w-2.5 rounded-full', dotClass]"></span>
          {{ statusLabel }}
        </p>
        <p v-if="connection.status !== 'online'" class="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {{ t('connectionStatus.offlineHelp') }}
        </p>
        <p class="mt-3 text-slate-600 dark:text-slate-300">{{ updatedLabel }}</p>
        <p v-if="connection.lastUpdatedAt" class="text-xs text-slate-500 dark:text-slate-400">{{ exactUpdate }}</p>
        <button type="button" @click="checkNow" :disabled="checking || connection.status === 'offline'"
          class="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
          <ArrowPathIcon :class="['h-4 w-4', checking ? 'animate-spin' : '']" />
          {{ checking ? t('connection.checking') : t('connectionStatus.checkNow') }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ArrowPathIcon, SignalIcon, SignalSlashIcon } from '@heroicons/vue/24/outline'
import { intlLocale, t } from '../../i18n'
import { authApi } from '../../api/auth'
import { useConnectionStore } from '../../stores/connection'

/** Online / offline and when the data was last updated from the server (see stores/connection). */
const connection = useConnectionStore()
const open = ref(false)
const checking = ref(false)

// re-render the "x minutes ago" text as time passes
const now = ref(Date.now())
let ticker: ReturnType<typeof setInterval> | undefined
onMounted(() => (ticker = setInterval(() => (now.value = Date.now()), 30_000)))
onUnmounted(() => clearInterval(ticker))

const dotClass = computed(() => ({
  online: 'bg-emerald-500',
  unreachable: 'bg-amber-500',
  offline: 'bg-red-500',
}[connection.status]))

const statusLabel = computed(() => t(`connectionStatus.${connection.status}`))

const relativeUpdate = computed(() => {
  if (!connection.lastUpdatedAt) return t('connectionStatus.never')

  const seconds = Math.round((connection.lastUpdatedAt - now.value) / 1000)
  const format = new Intl.RelativeTimeFormat(intlLocale(), { numeric: 'auto', style: 'short' })

  if (seconds > -60) return t('connectionStatus.justNow')
  if (seconds > -3600) return format.format(Math.round(seconds / 60), 'minute')
  if (seconds > -86400) return format.format(Math.round(seconds / 3600), 'hour')
  return format.format(Math.round(seconds / 86400), 'day')
})

const updatedLabel = computed(() =>
  connection.lastUpdatedAt
    ? t('connectionStatus.updated', { when: relativeUpdate.value })
    : t('connectionStatus.neverUpdated'))

const exactUpdate = computed(() =>
  connection.lastUpdatedAt
    ? new Intl.DateTimeFormat(intlLocale(), { dateStyle: 'short', timeStyle: 'medium' }).format(connection.lastUpdatedAt)
    : '')

/** A small request to the server: updates both the status and the time. */
const checkNow = async () => {
  checking.value = true
  try {
    await authApi.getCurrentUser()
  } catch {
    // the status itself shows the outcome
  } finally {
    checking.value = false
    now.value = Date.now()
  }
}
</script>
