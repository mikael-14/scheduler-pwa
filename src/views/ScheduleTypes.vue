<template>
  <div class="mx-auto max-w-5xl space-y-4 sm:p-6">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h2 class="text-xl font-semibold">{{ t('scheduleTypes.title') }}</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400">{{ t('scheduleTypes.subtitle') }}</p>
      </div>
      <div class="flex shrink-0 items-center gap-3">
        <button type="button" @click="load" :disabled="loading"
          class="text-sm font-medium text-primary-600 hover:text-primary-500 disabled:opacity-50 dark:text-primary-400">
          {{ t('approvals.refresh') }}
        </button>
        <router-link v-if="canCreate" :to="{ name: 'ScheduleTypeNew' }"
          :class="['inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500', offline ? 'pointer-events-none opacity-50' : '']"
          :aria-disabled="offline" :title="offline ? t('offline.needsConnection') : undefined">
          <PlusIcon class="h-4 w-4" />
          {{ t('scheduleTypes.new') }}
        </router-link>
      </div>
    </div>

    <p v-if="loading && !types.length" class="text-sm text-slate-500">{{ t('approvals.loading') }}</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="!types.length"
      class="page-card border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 sm:p-8 dark:border-slate-700">
      {{ t('scheduleTypes.empty') }}
    </p>

    <!-- phones: one card per type -->
    <ul v-if="types.length" class="space-y-3 md:hidden">
      <li v-for="type in types" :key="type.id"
        class="page-card border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="flex items-start gap-3">
          <span class="mt-1 h-3.5 w-3.5 shrink-0 rounded-full" :style="{ backgroundColor: type.color || '#94a3b8' }"></span>
          <div class="min-w-0 flex-1">
            <p class="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-white">
              {{ type.name }}
              <span :class="statusClass(type)">{{ type.status ? t('scheduleTypes.active') : t('scheduleTypes.inactive') }}</span>
              <span v-if="type.primary" class="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">{{ t('scheduleTypes.primary') }}</span>
            </p>
            <p v-if="type.description" class="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{{ type.description }}</p>
            <dl class="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <dt class="text-slate-500 dark:text-slate-400">{{ t('scheduleTypes.period') }}</dt>
              <dd class="text-slate-800 dark:text-slate-200">{{ period(type) }}</dd>
              <dt class="text-slate-500 dark:text-slate-400">{{ t('scheduleTypes.hours') }}</dt>
              <dd class="text-slate-800 dark:text-slate-200">{{ hours(type) }}</dd>
              <dt class="text-slate-500 dark:text-slate-400">{{ t('scheduleTypes.rules') }}</dt>
              <dd class="text-slate-800 dark:text-slate-200">{{ rules(type) }}</dd>
              <dt class="text-slate-500 dark:text-slate-400">{{ t('scheduleTypes.schedules') }}</dt>
              <dd class="text-slate-800 dark:text-slate-200">{{ type.schedules_count }}</dd>
            </dl>
          </div>
        </div>
        <div v-if="canEdit(type) || canDeleteAtAll" class="mt-3 flex justify-end gap-2">
          <button v-if="canDeleteAtAll" type="button" @click="remove(type)" :disabled="offline || !type.can.delete"
            :title="deleteTitle(type)"
            class="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950">
            {{ t('scheduleTypes.delete') }}
          </button>
          <router-link v-if="canEdit(type)" :to="{ name: 'ScheduleTypeEdit', params: { id: type.id } }"
            :class="['rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800', offline ? 'pointer-events-none opacity-50' : '']">
            {{ t('scheduleTypes.edit') }}
          </router-link>
        </div>
      </li>
    </ul>

    <!-- wider screens: a table -->
    <div v-if="types.length" class="page-card hidden overflow-x-auto border-slate-200 bg-white shadow-sm md:block dark:border-slate-800 dark:bg-slate-900">
      <table class="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
        <thead class="bg-slate-50 dark:bg-slate-800/60">
          <tr class="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <th scope="col" class="px-4 py-3">{{ t('scheduleTypes.name') }}</th>
            <th scope="col" class="px-4 py-3">{{ t('scheduleTypes.status') }}</th>
            <th scope="col" class="px-4 py-3">{{ t('scheduleTypes.period') }}</th>
            <th scope="col" class="px-4 py-3">{{ t('scheduleTypes.hours') }}</th>
            <th scope="col" class="px-4 py-3">{{ t('scheduleTypes.rules') }}</th>
            <th scope="col" class="px-4 py-3 text-right">{{ t('scheduleTypes.schedules') }}</th>
            <th v-if="canEditAtAll || canDeleteAtAll" scope="col" class="px-4 py-3"><span class="sr-only">{{ t('scheduleTypes.actions') }}</span></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
          <tr v-for="type in types" :key="type.id" class="align-top">
            <td class="px-4 py-3">
              <div class="flex items-start gap-2">
                <span class="mt-1 h-3 w-3 shrink-0 rounded-full" :style="{ backgroundColor: type.color || '#94a3b8' }"></span>
                <div class="min-w-0">
                  <p class="flex flex-wrap items-center gap-1.5 font-medium text-slate-900 dark:text-white">
                    {{ type.name }}
                    <span v-if="type.primary" class="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">{{ t('scheduleTypes.primary') }}</span>
                  </p>
                  <p v-if="type.description" class="max-w-xs truncate text-xs text-slate-500 dark:text-slate-400" :title="type.description">{{ type.description }}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3"><span :class="statusClass(type)">{{ type.status ? t('scheduleTypes.active') : t('scheduleTypes.inactive') }}</span></td>
            <td class="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300">{{ period(type) }}</td>
            <td class="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300">{{ hours(type) }}</td>
            <td class="px-4 py-3 text-slate-700 dark:text-slate-300">{{ rules(type) }}</td>
            <td class="px-4 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">{{ type.schedules_count }}</td>
            <td v-if="canEditAtAll || canDeleteAtAll" class="whitespace-nowrap px-4 py-3 text-right">
              <div class="flex justify-end gap-1">
                <router-link v-if="canEdit(type)" :to="{ name: 'ScheduleTypeEdit', params: { id: type.id } }"
                  :aria-label="`${t('scheduleTypes.edit')} ${type.name}`" :title="offline ? t('offline.needsConnection') : t('scheduleTypes.edit')"
                  :class="['inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white', offline ? 'pointer-events-none opacity-50' : '']">
                  <PencilSquareIcon class="h-4 w-4" />
                </router-link>
                <button v-if="canDeleteAtAll" type="button" @click="remove(type)" :disabled="offline || !type.can.delete"
                  :aria-label="`${t('scheduleTypes.delete')} ${type.name}`" :title="deleteTitle(type)"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-950">
                  <TrashIcon class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { t } from '../i18n'
import { scheduleTypesApi, type ScheduleType } from '../api/scheduleTypes'
import { useAuthStore } from '../stores/auth'
import { useConnectionStore } from '../stores/connection'
import { useDialogStore } from '../stores/dialog'
import { useToastStore } from '../stores/toast'
import { apiErrorMessage, isNetworkError } from '../utils/apiError'
import { formatServerDateTime } from '../utils/datetime'

const authStore = useAuthStore()
const connection = useConnectionStore()
const dialog = useDialogStore()
const toast = useToastStore()

const types = ref<ScheduleType[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// changes need the server
const offline = computed(() => connection.status === 'offline')
const canCreate = computed(() => authStore.can('create_schedule_type'))
// editing opens the type's own page: it needs to see it as well (view_schedule_type)
const canEditAtAll = computed(() => authStore.can('update_schedule_type') && authStore.can('view_schedule_type'))
const canDeleteAtAll = computed(() => authStore.can('delete_schedule_type'))
const canEdit = (type: ScheduleType) => canEditAtAll.value && type.can.update

const load = async () => {
  loading.value = true
  error.value = null
  try {
    types.value = await scheduleTypesApi.list()
  } catch (e) {
    error.value = apiErrorMessage(e, t('scheduleTypes.loadFailed'))
  } finally {
    loading.value = false
  }
}
onMounted(load)

const statusClass = (type: ScheduleType) => [
  'rounded-full px-2 py-0.5 text-[11px] font-semibold',
  type.status
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
]

const when = (value: string) => formatServerDateTime(value, { dateStyle: 'medium', timeStyle: 'short' })
const period = (type: ScheduleType) => {
  if (type.start && type.end) return `${when(type.start)} – ${when(type.end)}`
  if (type.start) return t('schedule.rulesFrom', { date: when(type.start) })
  if (type.end) return t('schedule.rulesUntil', { date: when(type.end) })
  return t('scheduleTypes.always')
}
const hours = (type: ScheduleType) =>
  type.min_time || type.max_time ? `${type.min_time ?? '00:00'} – ${type.max_time ?? '24:00'}` : t('scheduleTypes.anyTime')
const rules = (type: ScheduleType) => {
  const parts = [
    type.range ? t('scheduleTypes.needsEnd') : null,
    type.all_day ? t('scheduleTypes.allDay') : null,
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : '—'
}

const deleteTitle = (type: ScheduleType) => {
  if (offline.value) return t('offline.needsConnection')
  if (type.schedules_count > 0) return t('scheduleTypes.hasSchedules', { count: type.schedules_count })
  return t('scheduleTypes.delete')
}

const remove = (type: ScheduleType) => dialog.confirm({
  title: t('scheduleTypes.deleteTitle', { name: type.name }),
  message: t('scheduleTypes.deleteBody'),
  tone: 'danger',
  confirmLabel: t('scheduleTypes.delete'),
  onConfirm: async () => {
    try {
      await scheduleTypesApi.remove(type.id)
      types.value = types.value.filter((item) => item.id !== type.id)
      toast.success(t('scheduleTypes.deleted'))
    } catch (e) {
      toast.error(apiErrorMessage(e, t('scheduleTypes.deleteFailed')))
      if (isNetworkError(e)) throw e // keep the dialog open to retry
      // refused (e.g. it got schedules meanwhile): show the current state
      await load()
    }
  },
})
</script>
