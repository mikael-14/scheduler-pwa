<template>
  <div class="mx-auto max-w-3xl space-y-4 p-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold">{{ t('approvals.title') }}</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400">{{ t('approvals.subtitle') }}</p>
      </div>
      <button type="button" @click="load" :disabled="loading"
        class="text-sm font-medium text-primary-600 hover:text-primary-500 disabled:opacity-50 dark:text-primary-400">
        {{ t('approvals.refresh') }}
      </button>
    </div>

    <p v-if="loading && items.length === 0" class="text-sm text-slate-500">{{ t('approvals.loading') }}</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="items.length === 0"
      class="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
      {{ t('approvals.empty') }}
    </p>

    <ul v-else class="space-y-3">
      <li v-for="item in items" :key="item.id"
        class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="flex items-start gap-3">
          <span class="mt-1.5 h-3 w-3 shrink-0 rounded-full"
            :style="{ backgroundColor: item.schedule_type?.color || '#94a3b8' }"></span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-slate-900 dark:text-white">
              {{ item.user?.name ?? t('approvals.unknownUser') }}
              <span class="font-normal text-slate-500 dark:text-slate-400">· {{ item.schedule_type?.name }}</span>
            </p>
            <p class="text-sm text-slate-600 dark:text-slate-300">{{ period(item) }}</p>
            <router-link v-if="canViewDetails" :to="{ name: 'ScheduleDetail', params: { id: item.id } }" class="text-xs font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">{{ t('approvals.details') }}</router-link>
            <p v-if="item.participants.length" class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {{ t('approvals.participants') }}: {{ item.participants.join(', ') }}
            </p>
            <p v-if="item.description" class="mt-1 text-sm text-slate-600 dark:text-slate-300">{{ item.description }}</p>
          </div>
        </div>

        <div class="mt-4 flex justify-end gap-2">
          <button type="button" @click="openDialog(item, 'reject')" :disabled="offline" :title="offline ? t('offline.needsConnection') : undefined"
            class="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950">
            {{ t('approvals.reject') }}
          </button>
          <button type="button" @click="openDialog(item, 'approve')" :disabled="offline" :title="offline ? t('offline.needsConnection') : undefined"
            class="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 disabled:opacity-50">
            {{ t('approvals.approve') }}
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { t } from '../i18n'
import { schedulesApi, type PendingSchedule } from '../api/schedules'
import { apiErrorMessage, isNetworkError } from '../utils/apiError'
import { useToastStore } from '../stores/toast'
import { useDialogStore } from '../stores/dialog'
import { useBadgesStore } from '../stores/badges'
import { useAuthStore } from '../stores/auth'
import { useConnectionStore } from '../stores/connection'
import { formatPeriod } from '../utils/datetime'

const toast = useToastStore()
const dialog = useDialogStore()
const badges = useBadgesStore()
// an approve-only role may not have view_schedule: no link to a page it cannot open
const canViewDetails = useAuthStore().can('view_schedule')
// deciding needs the server
const connection = useConnectionStore()
const offline = computed(() => connection.status === 'offline')
const items = ref<PendingSchedule[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const load = async () => {
  loading.value = true
  error.value = null
  try {
    items.value = await schedulesApi.fetchPending()
  } catch (e) {
    error.value = apiErrorMessage(e, t('approvals.loadFailed'))
  } finally {
    loading.value = false
  }
}

// in shelter time, like the admin panel (see utils/datetime)
const period = (item: PendingSchedule) => formatPeriod(item.start, item.end, item.all_day, t('approvals.allDay'))

/** Confirm the decision in the app's dialog, with an optional message for the internal note. */
const openDialog = (item: PendingSchedule, action: 'approve' | 'reject') => {
  const approve = action === 'approve'

  dialog.prompt({
    title: t(approve ? 'approvals.approveTitle' : 'approvals.rejectTitle'),
    message: `${item.user?.name ?? t('approvals.unknownUser')} · ${item.schedule_type?.name ?? ''} · ${period(item)}`,
    tone: approve ? 'success' : 'danger',
    confirmLabel: t(approve ? 'approvals.approve' : 'approvals.reject'),
    cancelLabel: t('approvals.cancel'),
    field: { label: t('approvals.message'), help: t('approvals.messageHelp'), maxLength: 1000, rows: 3 },
    onConfirm: async (text) => {
      try {
        await (approve ? schedulesApi.approve(item.id, text) : schedulesApi.reject(item.id, text))
        items.value = items.value.filter((i) => i.id !== item.id)
        badges.pendingApprovals = items.value.length
        toast.success(t(approve ? 'approvals.approved' : 'approvals.rejected'))
      } catch (e) {
        toast.error(apiErrorMessage(e, t('approvals.decisionFailed')))
        // bad connection: keep the dialog (and the typed message) open to try again
        if (isNetworkError(e)) throw e
        // otherwise someone else may have decided it already: show the real state
        await load()
      }
    },
  })
}

onMounted(load)
</script>
