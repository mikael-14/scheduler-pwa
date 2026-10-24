<template>
  <div class="mx-auto max-w-3xl space-y-4 sm:p-6">
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

    <p v-if="loading && total === 0" class="text-sm text-slate-500">{{ t('approvals.loading') }}</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="total === 0"
      class="page-card border-dashed border-slate-300 px-4 py-8 text-center sm:p-8 text-sm text-slate-500 dark:border-slate-700">
      {{ t('approvals.empty') }}
    </p>

    <ul v-if="items.length" class="space-y-3">
      <li v-for="item in items" :key="item.id"
        class="page-card border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="flex items-start gap-3">
          <!-- the owner's photo, with the type's colour on its corner -->
          <span class="relative shrink-0">
            <UserAvatar :name="item.user?.name ?? '?'" :src="item.user?.avatar_url" size="h-10 w-10" />
            <span class="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-white dark:ring-slate-900"
              :style="{ backgroundColor: item.schedule_type?.color || '#94a3b8' }"></span>
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-slate-900 dark:text-white">
              {{ item.user?.name ?? t('approvals.unknownUser') }}
              <span class="font-normal text-slate-500 dark:text-slate-400">· {{ item.schedule_type?.name }}</span>
            </p>
            <p class="text-sm text-slate-600 dark:text-slate-300">{{ period(item) }}</p>
            <router-link v-if="canViewDetails" :to="{ name: 'ScheduleDetail', params: { id: item.id } }" class="text-xs font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">{{ t('approvals.details') }}</router-link>
            <div v-if="item.participant_people?.length" class="mt-2 flex flex-wrap items-center gap-1.5">
              <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('approvals.participants') }}:</span>
              <span v-for="person in item.participant_people" :key="person.id"
                class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-0.5 pl-0.5 pr-2 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <UserAvatar :name="person.name" :src="person.avatar_url" size="h-5 w-5" />
                {{ person.name }}
              </span>
            </div>
            <!-- an older API sends only the names -->
            <p v-else-if="item.participants.length" class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {{ t('approvals.participants') }}: {{ item.participants.join(', ') }}
            </p>
            <p v-if="item.description" class="mt-1 text-sm text-slate-600 dark:text-slate-300">{{ item.description }}</p>
            <ApprovalProblem :problem="item.approval_problem" />
          </div>
        </div>

        <div class="mt-4 flex justify-end gap-2">
          <button type="button" @click="openDialog(item, 'reject')" :disabled="offline" :title="offline ? t('offline.needsConnection') : undefined"
            class="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950">
            {{ t('approvals.reject') }}
          </button>
          <button type="button" @click="openDialog(item, 'approve')" :disabled="offline || !!item.approval_problem"
            :title="offline ? t('offline.needsConnection') : item.approval_problem ?? undefined"
            class="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 disabled:opacity-50">
            {{ t('approvals.approve') }}
          </button>
        </div>
      </li>
    </ul>

    <!-- people who joined an approved schedule -->
    <template v-if="participations.length">
      <h3 class="pt-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{{ t('approvals.participationsTitle') }}</h3>
      <ul class="space-y-3">
        <li v-for="item in participations" :key="`${item.schedule_id}-${item.user?.id}`"
          class="page-card border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div class="flex items-start gap-3">
            <!-- the photo of who wants to join, with the type's colour on its corner -->
            <span class="relative shrink-0">
              <UserAvatar :name="item.user?.name ?? '?'" :src="item.user?.avatar_url" size="h-10 w-10" />
              <span class="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-white dark:ring-slate-900"
                :style="{ backgroundColor: item.schedule_type?.color || '#94a3b8' }"></span>
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-slate-900 dark:text-white">
                {{ t('approvals.wantsToJoin', { name: item.user?.name ?? t('approvals.unknownUser') }) }}
              </p>
              <p class="text-sm text-slate-600 dark:text-slate-300">
                {{ item.schedule_type?.name }} · {{ period(item) }}
              </p>
              <p v-if="item.owner" class="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <UserAvatar :name="item.owner.name" :src="item.owner.avatar_url" size="h-4 w-4" />
                {{ t('approvals.scheduleOf', { name: item.owner.name }) }}
              </p>
              <router-link v-if="canViewDetails" :to="{ name: 'ScheduleDetail', params: { id: item.schedule_id } }" class="text-xs font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">{{ t('approvals.details') }}</router-link>
              <ApprovalProblem :problem="item.approval_problem" />
            </div>
          </div>

          <div class="mt-4 flex justify-end gap-2">
            <button type="button" @click="openParticipationDialog(item, false)" :disabled="offline" :title="offline ? t('offline.needsConnection') : undefined"
              class="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950">
              {{ t('approvals.reject') }}
            </button>
            <button type="button" @click="openParticipationDialog(item, true)" :disabled="offline || !!item.approval_problem"
              :title="offline ? t('offline.needsConnection') : item.approval_problem ?? undefined"
              class="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 disabled:opacity-50">
              {{ t('approvals.approve') }}
            </button>
          </div>
        </li>
      </ul>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { t } from '../i18n'
import { schedulesApi, type PendingParticipation, type PendingSchedule } from '../api/schedules'
import { apiErrorMessage, isNetworkError } from '../utils/apiError'
import { useToastStore } from '../stores/toast'
import { useDialogStore } from '../stores/dialog'
import { useBadgesStore } from '../stores/badges'
import { useAuthStore } from '../stores/auth'
import { useConnectionStore } from '../stores/connection'
import { formatPeriod } from '../utils/datetime'
import ApprovalProblem from '../components/common/ApprovalProblem.vue'
import UserAvatar from '../components/common/UserAvatar.vue'

const toast = useToastStore()
const dialog = useDialogStore()
const badges = useBadgesStore()
// an approve-only role may not have view_schedule: no link to a page it cannot open
const canViewDetails = useAuthStore().can('view_schedule')
// deciding needs the server
const connection = useConnectionStore()
const offline = computed(() => connection.status === 'offline')
const items = ref<PendingSchedule[]>([])
const participations = ref<PendingParticipation[]>([])
const total = computed(() => items.value.length + participations.value.length)
const loading = ref(true)
const error = ref<string | null>(null)

const load = async () => {
  loading.value = true
  error.value = null
  try {
    const work = await schedulesApi.fetchPending()
    items.value = work.schedules
    participations.value = work.participations
    badges.pendingApprovals = total.value
  } catch (e) {
    error.value = apiErrorMessage(e, t('approvals.loadFailed'))
  } finally {
    loading.value = false
  }
}

// in shelter time, like the admin panel (see utils/datetime)
const period = (item: { start: string; end: string | null; all_day: boolean }) =>
  formatPeriod(item.start, item.end, item.all_day, t('approvals.allDay'))

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
        toast.success(t(approve ? 'approvals.approved' : 'approvals.rejected'))
      } catch (e) {
        toast.error(apiErrorMessage(e, t('approvals.decisionFailed')))
        // bad connection: keep the dialog (and the typed message) open to try again
        if (isNetworkError(e)) throw e
      }
      // one decision can unblock others (someone who may go alone is now approved): reload all
      await load()
    },
  })
}

/** Same for a participation; the message goes to the person. */
const openParticipationDialog = (item: PendingParticipation, approve: boolean) => {
  if (!item.user) return

  dialog.prompt({
    title: t(approve ? 'approvals.approveParticipationTitle' : 'approvals.rejectParticipationTitle'),
    message: `${item.user.name} · ${item.schedule_type?.name ?? ''} · ${period(item)}`,
    tone: approve ? 'success' : 'danger',
    confirmLabel: t(approve ? 'approvals.approve' : 'approvals.reject'),
    cancelLabel: t('approvals.cancel'),
    field: { label: t('approvals.message'), help: t('approvals.participationMessageHelp'), maxLength: 1000, rows: 3 },
    onConfirm: async (text) => {
      try {
        await schedulesApi.decideParticipant(item.schedule_id, item.user!.id, approve, text)
        toast.success(t(approve ? 'approvals.participationApproved' : 'approvals.participationRejected'))
      } catch (e) {
        toast.error(apiErrorMessage(e, t('approvals.decisionFailed')))
        if (isNetworkError(e)) throw e
      }
      await load()
    },
  })
}

onMounted(load)
</script>
