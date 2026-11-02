<template>
  <div class="mx-auto max-w-2xl space-y-4">
    <button type="button" @click="goBack"
      class="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
      <ChevronLeftIcon class="h-4 w-4" /> {{ t('schedule.back') }}
    </button>

    <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
      {{ isEdit ? t('scheduleTypes.editTitle') : t('scheduleTypes.newTitle') }}
    </h1>

    <p v-if="loading" class="text-sm text-slate-500">{{ t('approvals.loading') }}</p>
    <p v-else-if="loadError"
      class="page-card border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      {{ loadError }}
    </p>

    <form v-else @submit.prevent="submit" novalidate
      class="page-card space-y-5 border-slate-200 bg-white px-4 py-6 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <p v-if="offline" class="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
        {{ t('offline.needsConnection') }}
      </p>
      <!-- set in the database only (as in the admin panel): shown, not editable -->
      <p v-if="primary" class="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
        {{ t('scheduleTypes.primaryHelp') }}
      </p>

      <!-- name and colour on one row -->
      <div class="grid gap-4 sm:grid-cols-[1fr_auto]">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {{ t('scheduleTypes.name') }}
          <input v-model="form.name" type="text" maxlength="50" required :class="inputClass" />
          <FieldError :errors="errors.name" />
        </label>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {{ t('scheduleTypes.color') }}
          <input v-model="form.color" type="color" class="mt-1 block h-[38px] w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-1 sm:w-20 dark:border-slate-700 dark:bg-slate-800" />
          <FieldError :errors="errors.color" />
        </label>
      </div>

      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {{ t('scheduleTypes.description') }}
        <textarea v-model="form.description" rows="2" maxlength="255" :class="inputClass"></textarea>
        <FieldError :errors="errors.description" />
      </label>

      <!-- the switches -->
      <div class="space-y-4 border-t border-slate-100 pt-5 dark:border-slate-800">
        <div v-for="option in switches" :key="option.key" class="flex items-center justify-between gap-4">
          <div>
            <p :id="`switch-${option.key}`" class="text-sm font-medium text-slate-900 dark:text-white">{{ option.label }}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400">{{ option.help }}</p>
            <FieldError :errors="errors[option.key]" />
          </div>
          <button type="button" role="switch" :aria-checked="form[option.key]" :aria-labelledby="`switch-${option.key}`"
            @click="form[option.key] = !form[option.key]"
            :class="['relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900', form[option.key] ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700']">
            <span :class="['inline-block h-5 w-5 rounded-full bg-white shadow transition', form[option.key] ? 'translate-x-5' : 'translate-x-0.5']"></span>
          </button>
        </div>
      </div>

      <!-- when it can be booked -->
      <div class="space-y-4 border-t border-slate-100 pt-5 dark:border-slate-800">
        <div>
          <p class="text-sm font-medium text-slate-900 dark:text-white">{{ t('scheduleTypes.period') }}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">{{ t('scheduleTypes.periodHelp') }}</p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {{ t('schedule.start') }}
            <input v-model="form.start" type="datetime-local" step="300" :class="inputClass" />
            <FieldError :errors="errors.start" />
          </label>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {{ t('schedule.end') }}
            <input v-model="form.end" type="datetime-local" step="300" :min="form.start || undefined" :class="inputClass" />
            <FieldError :errors="errors.end" />
          </label>
        </div>

        <div>
          <p class="text-sm font-medium text-slate-900 dark:text-white">{{ t('scheduleTypes.hours') }}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">{{ t('scheduleTypes.hoursHelp') }}</p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {{ t('scheduleTypes.minTime') }}
            <input v-model="form.min_time" type="time" step="300" :class="inputClass" />
            <FieldError :errors="errors.min_time" />
          </label>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {{ t('scheduleTypes.maxTime') }}
            <input v-model="form.max_time" type="time" step="300" :class="inputClass" />
            <FieldError :errors="errors.max_time" />
          </label>
        </div>
      </div>

      <div class="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
        <button type="button" @click="goBack" :disabled="saving"
          class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
          {{ t('common.cancel') }}
        </button>
        <button type="submit" :disabled="saving || offline"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-60">
          <ArrowPathIcon v-if="saving" class="h-4 w-4 animate-spin" />
          {{ isEdit ? t('schedule.save') : t('scheduleTypes.create') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeftIcon } from '@heroicons/vue/20/solid'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import { t } from '../i18n'
import { scheduleTypesApi, type ScheduleTypeInput } from '../api/scheduleTypes'
import { useConnectionStore } from '../stores/connection'
import { useToastStore } from '../stores/toast'
import { apiErrorMessage } from '../utils/apiError'
import { toApiDateTime, toInputDateTime } from '../utils/datetime'
import FieldError from '../components/common/FieldError.vue'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()
const connection = useConnectionStore()

const isEdit = computed(() => route.name === 'ScheduleTypeEdit')
const offline = computed(() => connection.status === 'offline')

const loading = ref(false)
const loadError = ref<string | null>(null)
const saving = ref(false)
const errors = ref<Record<string, string[]>>({})
const primary = ref(false)

// dates as the inputs want them ("YYYY-MM-DDTHH:mm", server time); '' = none
const form = reactive({
  name: '',
  color: '#3b82f6',
  description: '',
  status: true,
  range: false,
  all_day: false,
  start: '',
  end: '',
  min_time: '',
  max_time: '',
})

type SwitchKey = 'status' | 'range' | 'all_day'
const switches = computed<{ key: SwitchKey; label: string; help: string }[]>(() => [
  { key: 'status', label: t('scheduleTypes.active'), help: t('scheduleTypes.activeHelp') },
  { key: 'range', label: t('scheduleTypes.needsEnd'), help: t('scheduleTypes.needsEndHelp') },
  { key: 'all_day', label: t('scheduleTypes.allDay'), help: t('scheduleTypes.allDayHelp') },
])

const inputClass = 'mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white'

async function load() {
  if (!isEdit.value) return
  loading.value = true
  loadError.value = null
  try {
    const type = await scheduleTypesApi.get(route.params.id as string)
    Object.assign(form, {
      name: type.name,
      color: type.color || '#3b82f6',
      description: type.description ?? '',
      status: type.status,
      range: type.range,
      all_day: type.all_day,
      start: toInputDateTime(type.start),
      end: toInputDateTime(type.end),
      min_time: type.min_time ?? '',
      max_time: type.max_time ?? '',
    })
    primary.value = type.primary
  } catch (e) {
    loadError.value = apiErrorMessage(e, t('scheduleTypes.loadFailed'))
  } finally {
    loading.value = false
  }
}

const payload = (): ScheduleTypeInput => ({
  name: form.name.trim(),
  color: form.color || null,
  description: form.description.trim() || null,
  status: form.status,
  range: form.range,
  all_day: form.all_day,
  start: form.start ? toApiDateTime(form.start) : null,
  end: form.end ? toApiDateTime(form.end) : null,
  min_time: form.min_time || null,
  max_time: form.max_time || null,
})

/** The checks the server makes too, so the obvious mistakes show without a round trip. */
function localErrors(): Record<string, string[]> {
  const found: Record<string, string[]> = {}
  if (!form.name.trim()) found.name = [t('scheduleTypes.nameRequired')]
  if (form.start && form.end && form.end < form.start) found.end = [t('schedule.endBeforeStart')]
  return found
}

async function submit() {
  if (saving.value) return
  errors.value = localErrors()
  if (Object.keys(errors.value).length) return

  saving.value = true
  try {
    if (isEdit.value) {
      await scheduleTypesApi.update(Number(route.params.id), payload())
    } else {
      await scheduleTypesApi.create(payload())
    }
    toast.success(t(isEdit.value ? 'scheduleTypes.saved' : 'scheduleTypes.created'))
    router.replace({ name: 'ScheduleTypes' })
  } catch (e: any) {
    // field errors next to their field
    const serverErrors = e?.response?.data?.errors
    if (serverErrors && typeof serverErrors === 'object') errors.value = serverErrors
    toast.error(apiErrorMessage(e, t('scheduleTypes.saveFailed')))
  } finally {
    saving.value = false
  }
}

const goBack = () => (window.history.length > 1 ? router.back() : router.push({ name: 'ScheduleTypes' }))

onMounted(load)
</script>
