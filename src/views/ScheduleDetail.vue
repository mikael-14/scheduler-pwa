<template>
  <div class="mx-auto max-w-2xl space-y-4">
    <button type="button" @click="goBack"
      class="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
      <ChevronLeftIcon class="h-4 w-4" /> {{ t('schedule.back') }}
    </button>

    <p v-if="loading" class="text-sm text-slate-500">{{ t('schedule.loading') }}</p>
    <p v-else-if="error" class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      {{ error }}
    </p>

    <article v-else-if="schedule"
      class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="h-2" :style="{ backgroundColor: schedule.schedule_type?.color || '#94a3b8' }"></div>
      <div class="space-y-5 p-6">
        <p v-if="schedule.offline" class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          {{ t('offline.scheduleSaved') }}
        </p>
        <header class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {{ schedule.schedule_type?.name ?? t('calendar.scheduledEvent') }}
            </p>
            <h1 class="mt-1 text-xl font-bold text-slate-900 dark:text-white">{{ period }}</h1>
          </div>
          <StatusBadge :status="schedule.status" />
        </header>

        <dl class="grid gap-4 sm:grid-cols-2">
          <div>
            <dt class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('schedule.owner') }}</dt>
            <dd class="mt-1 text-sm text-slate-900 dark:text-white">{{ schedule.user?.name ?? '—' }}</dd>
          </div>
          <div>
            <dt class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('schedule.participants') }}</dt>
            <dd class="mt-1 flex flex-wrap gap-1.5">
              <span v-for="participant in schedule.schedule_users" :key="participant.user_id"
                class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {{ participant.name ?? '?' }}
                <StatusBadge v-if="participant.status" :status="participant.status" compact />
              </span>
              <span v-if="!schedule.schedule_users.length" class="text-sm text-slate-500">—</span>
            </dd>
          </div>
          <div v-if="schedule.description" class="sm:col-span-2">
            <dt class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('schedule.description') }}</dt>
            <dd class="mt-1 whitespace-pre-line text-sm text-slate-900 dark:text-white">{{ schedule.description }}</dd>
          </div>
          <div v-if="schedule.internal_note" class="sm:col-span-2">
            <dt class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('schedule.internalNote') }}</dt>
            <dd class="mt-1 whitespace-pre-line rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
              {{ schedule.internal_note }}
            </dd>
          </div>
        </dl>

        <!-- only the actions the API says this user may do -->
        <div v-if="hasActions" class="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-5 dark:border-slate-800">
          <button v-if="schedule.can.delete" type="button" @click="remove"
            class="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
            {{ t('schedule.delete') }}
          </button>
          <button v-if="schedule.can.cancel && !schedule.can.delete" type="button" @click="cancel"
            class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            {{ t('schedule.cancelSchedule') }}
          </button>
          <button v-if="schedule.can.update" type="button" @click="router.push({ name: 'ScheduleEdit', params: { id: schedule.id } })"
            class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            {{ t('schedule.edit') }}
          </button>
          <template v-if="schedule.can.approve">
            <button type="button" @click="decide('reject')"
              class="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950">
              {{ t('approvals.reject') }}
            </button>
            <button type="button" @click="decide('approve')"
              class="rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500">
              {{ t('approvals.approve') }}
            </button>
          </template>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeftIcon } from '@heroicons/vue/20/solid'
import { t } from '../i18n'
import { schedulesApi, type Schedule } from '../api/schedules'
import { apiErrorMessage, isNetworkError } from '../utils/apiError'
import { formatPeriod } from '../utils/datetime'
import { useToastStore } from '../stores/toast'
import { useDialogStore } from '../stores/dialog'
import { useConnectionStore } from '../stores/connection'
import StatusBadge from '../components/common/StatusBadge.vue'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()
const dialog = useDialogStore()
const connection = useConnectionStore()

const schedule = ref<Schedule | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const period = computed(() => schedule.value
  ? formatPeriod(schedule.value.start, schedule.value.end, schedule.value.all_day, t('approvals.allDay'))
  : '')
// every action needs the server: none on the saved copy, none without a connection
const hasActions = computed(() => {
  const can = schedule.value?.can
  if (!can || schedule.value?.offline || connection.status === 'offline') return false
  return can.update || can.cancel || can.delete || can.approve
})

const load = async () => {
  loading.value = true
  error.value = null
  try {
    schedule.value = await schedulesApi.fetchSchedule(route.params.id as string)
  } catch (e) {
    error.value = apiErrorMessage(e, t('schedule.loadFailed'))
  } finally {
    loading.value = false
  }
}

const goBack = () => (window.history.length > 1 ? router.back() : router.push({ name: 'My Agenda' }))

const cancel = () => dialog.confirm({
  title: t('schedule.cancelTitle'),
  message: t('schedule.cancelBody'),
  tone: 'warning',
  confirmLabel: t('schedule.cancelSchedule'),
  cancelLabel: t('schedule.keep'),
  onConfirm: async () => {
    try {
      schedule.value = await schedulesApi.cancelSchedule(schedule.value!.id)
      toast.success(t('schedule.cancelled'))
    } catch (e) {
      toast.error(apiErrorMessage(e, t('schedule.saveFailed')))
      if (isNetworkError(e)) throw e // keep the dialog open to retry
    }
  },
})

const remove = () => dialog.confirm({
  title: t('schedule.deleteTitle'),
  message: t('schedule.deleteBody'),
  tone: 'danger',
  confirmLabel: t('schedule.delete'),
  onConfirm: async () => {
    try {
      await schedulesApi.deleteSchedule(schedule.value!.id)
      toast.success(t('schedule.deleted'))
      router.replace({ name: 'My Agenda' })
    } catch (e) {
      toast.error(apiErrorMessage(e, t('schedule.saveFailed')))
      if (isNetworkError(e)) throw e
      await load()
    }
  },
})

/** Same dialog as the Approvals screen: an optional message for the internal note. */
const decide = (action: 'approve' | 'reject') => {
  const approve = action === 'approve'
  const current = schedule.value!

  dialog.prompt({
    title: t(approve ? 'approvals.approveTitle' : 'approvals.rejectTitle'),
    message: `${current.user?.name ?? ''} · ${current.schedule_type?.name ?? ''} · ${period.value}`,
    tone: approve ? 'success' : 'danger',
    confirmLabel: t(approve ? 'approvals.approve' : 'approvals.reject'),
    cancelLabel: t('approvals.cancel'),
    field: { label: t('approvals.message'), help: t('approvals.messageHelp'), maxLength: 1000, rows: 3 },
    onConfirm: async (text) => {
      try {
        await (approve ? schedulesApi.approve(current.id, text) : schedulesApi.reject(current.id, text))
        toast.success(t(approve ? 'approvals.approved' : 'approvals.rejected'))
      } catch (e) {
        toast.error(apiErrorMessage(e, t('approvals.decisionFailed')))
        if (isNetworkError(e)) throw e
      }
      await load()
    },
  })
}

onMounted(load)
watch(() => route.params.id, (id) => id && load())
</script>
