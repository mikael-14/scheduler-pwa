<template>
  <div class="mx-auto max-w-2xl space-y-4">
    <button type="button" @click="goBack"
      class="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
      <ChevronLeftIcon class="h-4 w-4" /> {{ t('schedule.back') }}
    </button>

    <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
      {{ isEdit ? t('schedule.editTitle') : t('schedule.newTitle') }}
    </h1>

    <p v-if="loading" class="text-sm text-slate-500">{{ t('schedule.loading') }}</p>
    <p v-else-if="loadError" class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      {{ loadError }}
    </p>
    <p v-else-if="options && !options.types.length" class="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
      {{ t('schedule.noTypes') }}
    </p>

    <form v-else-if="options" @submit.prevent="submit" novalidate
      class="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p v-if="connection.status !== 'online'"
        class="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
        {{ t('schedule.offlineHint') }}
      </p>

      <!-- Type -->
      <fieldset>
        <legend class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ t('schedule.type') }}</legend>
        <div class="mt-2 grid gap-2 sm:grid-cols-2">
          <label v-for="option in options.types" :key="option.id"
            :class="['flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition',
              form.schedule_type_id === option.id
                ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500 dark:bg-primary-500/10'
                : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600']">
            <input type="radio" class="sr-only" :value="option.id" v-model="form.schedule_type_id" />
            <span class="mt-1 h-3 w-3 shrink-0 rounded-full" :style="{ backgroundColor: option.color || '#94a3b8' }"></span>
            <span class="min-w-0">
              <span class="block text-sm font-semibold text-slate-900 dark:text-white">{{ option.name }}</span>
              <span v-if="option.description" class="block text-xs text-slate-500 dark:text-slate-400">{{ option.description }}</span>
            </span>
          </label>
        </div>
        <FieldError :errors="errors.schedule_type_id" />
      </fieldset>

      <template v-if="type">
        <!-- the type's rules, so nobody has to find out by trial and error -->
        <p v-if="typeRules" class="text-xs text-slate-500 dark:text-slate-400">{{ typeRules }}</p>

        <label v-if="type.all_day" class="flex items-center justify-between gap-4">
          <span class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ t('schedule.allDay') }}</span>
          <button type="button" role="switch" :aria-checked="form.all_day" @click="setAllDay(!form.all_day)"
            :class="['relative inline-flex h-6 w-11 shrink-0 rounded-full transition', form.all_day ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700']">
            <span :class="['inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition', form.all_day ? 'translate-x-5' : 'translate-x-0.5']"></span>
          </button>
        </label>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {{ t('schedule.start') }}
            <input v-model="form.start" :type="form.all_day ? 'date' : 'datetime-local'" step="300" required
              :min="limits.min" :max="limits.max" :class="inputClass" />
            <FieldError :errors="errors.start" />
          </label>
          <label v-if="type.range" class="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {{ t('schedule.end') }}
            <input v-model="form.end" :type="form.all_day ? 'date' : 'datetime-local'" step="300" required
              :min="form.start || limits.min" :max="limits.max" :class="inputClass" />
            <FieldError :errors="errors.end" />
          </label>
        </div>
        <FieldError :errors="errors.all_day" />
      </template>

      <!-- Owner: only for people who may book for others -->
      <label v-if="options.can.book_for_others" class="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {{ t('schedule.owner') }}
        <select v-model="form.user_id" :class="inputClass">
          <option :value="null">{{ t('schedule.ownerMe') }}</option>
          <option v-for="person in options.people" :key="person.id" :value="person.id">{{ person.name }}</option>
        </select>
        <FieldError :errors="errors.user_id" />
      </label>

      <!-- Participants -->
      <div>
        <p class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ t('schedule.participants') }}</p>
        <div v-if="selectedPeople.length" class="mt-2 flex flex-wrap gap-1.5">
          <button v-for="person in selectedPeople" :key="person.id" type="button" @click="toggleParticipant(person.id)"
            class="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100 dark:bg-primary-500/15 dark:text-primary-300">
            {{ person.name }} <XMarkIcon class="h-3.5 w-3.5" />
          </button>
        </div>
        <input v-model="peopleSearch" type="search" :placeholder="t('schedule.searchPeople')" :class="inputClass" />
        <ul v-if="peopleSearch" class="mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <li v-for="person in matchingPeople" :key="person.id">
            <button type="button" @click="toggleParticipant(person.id); peopleSearch = ''"
              class="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800">{{ person.name }}</button>
          </li>
          <li v-if="!matchingPeople.length" class="px-3 py-2 text-sm text-slate-500">{{ t('schedule.nobodyFound') }}</li>
        </ul>
        <FieldError :errors="errors.schedule_users" />
      </div>

      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {{ t('schedule.description') }}
        <textarea v-model="form.description" rows="3" maxlength="255" :class="inputClass"></textarea>
        <FieldError :errors="errors.description" />
      </label>

      <!-- Staff only -->
      <template v-if="options.can.internal_note">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {{ t('schedule.status') }}
          <select v-model="form.status" :class="inputClass">
            <option v-for="status in statusChoices" :key="status.value" :value="status.value">{{ status.label }}</option>
          </select>
          <FieldError :errors="errors.status" />
        </label>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {{ t('schedule.internalNote') }}
          <textarea v-model="form.internal_note" rows="2" maxlength="255" :class="inputClass"></textarea>
          <span class="mt-1 block text-xs font-normal text-slate-500">{{ t('schedule.internalNoteHelp') }}</span>
          <FieldError :errors="errors.internal_note" />
        </label>
      </template>

      <p v-if="!isEdit && !options.can.internal_note" class="text-xs text-slate-500 dark:text-slate-400">
        {{ t('schedule.needsApproval') }}
      </p>

      <div class="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
        <button type="button" @click="goBack" :disabled="saving"
          class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
          {{ t('common.cancel') }}
        </button>
        <button type="submit" :disabled="saving || !type || connection.status === 'offline'"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-60">
          <ArrowPathIcon v-if="saving" class="h-4 w-4 animate-spin" />
          {{ isEdit ? t('schedule.save') : t('schedule.create') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeftIcon, XMarkIcon } from '@heroicons/vue/20/solid'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import { t } from '../i18n'
import { schedulesApi, type ScheduleFormOptions, type ScheduleInput, type ScheduleStatus } from '../api/schedules'
import { apiErrorMessage } from '../utils/apiError'
import { toApiDateTime, toInputDate, toInputDateTime } from '../utils/datetime'
import { defaultStartTime, inputLimits, rulesSummary } from '../utils/scheduleRules'
import { useToastStore } from '../stores/toast'
import { useConnectionStore } from '../stores/connection'
import FieldError from '../components/common/FieldError.vue'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()
const connection = useConnectionStore()

const isEdit = computed(() => !!route.params.id)
const options = ref<ScheduleFormOptions | null>(null)
const loading = ref(true)
const loadError = ref<string | null>(null)
const saving = ref(false)
const errors = ref<Record<string, string[]>>({})
const peopleSearch = ref('')

const form = reactive({
  schedule_type_id: null as number | null,
  start: '',
  end: '',
  all_day: false,
  description: '',
  internal_note: '',
  status: 'pending' as ScheduleStatus,
  user_id: null as number | null,
  participants: [] as number[],
})
// the status the schedule had when it was opened (always offered back)
const originalStatus = ref<{ value: ScheduleStatus; label: string } | null>(null)

const inputClass = 'mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white'

const type = computed(() => options.value?.types.find((option) => option.id === form.schedule_type_id) ?? null)

// The type's rules (utils/scheduleRules, the same the API enforces): when it may be booked,
// whether it needs an end; its hours only shape the calendar, so they are not shown as a rule
const typeRules = computed(() => rulesSummary(type.value))

/** The browser pickers stop at the type's dates, and at today without the "past dates" permission. */
const limits = computed(() => inputLimits(type.value, form.all_day, !!options.value?.can.past_dates))

const statusChoices = computed(() => {
  const choices = [...(options.value?.statuses ?? [])]
  if (originalStatus.value && !choices.some((choice) => choice.value === originalStatus.value!.value)) {
    choices.push(originalStatus.value)
  }
  return choices
})

const ownerId = computed(() => form.user_id)
const selectedPeople = computed(() =>
  (options.value?.people ?? []).filter((person) => form.participants.includes(person.id)))
const matchingPeople = computed(() => {
  const search = peopleSearch.value.trim().toLowerCase()
  return (options.value?.people ?? [])
    .filter((person) => !form.participants.includes(person.id) && person.id !== ownerId.value)
    .filter((person) => person.name.toLowerCase().includes(search))
    .slice(0, 20)
})

const toggleParticipant = (id: number) => {
  form.participants = form.participants.includes(id)
    ? form.participants.filter((participant) => participant !== id)
    : [...form.participants, id]
}

/** Switching all day on/off keeps the chosen days. */
const setAllDay = (value: boolean) => {
  const defaultTime = defaultStartTime(type.value)
  const convert = (input: string) => {
    if (!input) return ''
    const [date] = input.split('T')
    return value ? date : `${date}T${defaultTime}`
  }
  form.all_day = value
  form.start = convert(form.start)
  form.end = convert(form.end)
}

// A type that does not allow all day, or has no end, drops those values
watch(type, (current) => {
  if (!current) return
  if (!current.all_day && form.all_day) setAllDay(false)
  if (!current.range) form.end = ''
  else if (!form.end && form.start && !form.all_day) form.end = plusOneHour(form.start)
  else if (!form.end && form.start) form.end = form.start
})

function plusOneHour(input: string): string {
  const [date, time = '09:00'] = input.split('T')
  const [hours, minutes] = time.split(':').map(Number)
  const next = new Date(Date.UTC(...(date.split('-').map(Number) as [number, number, number]), hours + 1, minutes))
  return `${next.toISOString().slice(0, 10)}T${next.toISOString().slice(11, 16)}`
}

/** New schedule: the slot tapped in the calendar, if any. */
function prefillFromQuery() {
  const start = typeof route.query.start === 'string' ? route.query.start : ''
  if (!start) return
  form.start = start.includes('T') ? start : `${start}T${defaultStartTime(type.value)}`
}

async function load() {
  loading.value = true
  loadError.value = null
  try {
    const [formOptions, schedule] = await Promise.all([
      schedulesApi.formOptions(),
      isEdit.value ? schedulesApi.fetchSchedule(route.params.id as string) : Promise.resolve(null),
    ])
    options.value = formOptions

    if (schedule) {
      if (!schedule.can.update) {
        router.replace({ name: 'ScheduleDetail', params: { id: schedule.id } })
        return
      }
      form.schedule_type_id = schedule.schedule_type_id
      form.all_day = schedule.all_day
      form.start = schedule.all_day ? toInputDate(schedule.start) : toInputDateTime(schedule.start)
      form.end = schedule.all_day ? toInputDate(schedule.end) : toInputDateTime(schedule.end)
      form.description = schedule.description ?? ''
      form.internal_note = schedule.internal_note ?? ''
      form.status = schedule.status
      form.user_id = formOptions.can.book_for_others ? schedule.user_id : null
      form.participants = schedule.schedule_users.map((participant) => participant.user_id)
      originalStatus.value = { value: schedule.status, label: t(`status.${schedule.status}`) }
    } else {
      // a link can pick the type (e.g. a "nobody yet for Walks" alert), if it is still active
      const wanted = Number(route.query.type)
      form.schedule_type_id = formOptions.types.find((option) => option.id === wanted)?.id ?? formOptions.types[0]?.id ?? null
      prefillFromQuery()
    }
  } catch (e) {
    loadError.value = apiErrorMessage(e, t('schedule.loadFailed'))
  } finally {
    loading.value = false
  }
}

function payload(): ScheduleInput {
  const current = type.value!
  const input: ScheduleInput = {
    schedule_type_id: current.id,
    start: toApiDateTime(form.start, form.all_day),
    end: current.range && form.end ? toApiDateTime(form.end, form.all_day) : null,
    all_day: current.all_day ? form.all_day : false,
    description: form.description.trim() || null,
    schedule_users: form.participants.filter((id) => id !== form.user_id).map((user_id) => ({ user_id })),
  }
  if (options.value?.can.book_for_others) input.user_id = form.user_id
  if (options.value?.can.internal_note) {
    input.internal_note = form.internal_note.trim() || null
    input.status = form.status
  }
  return input
}

/** Errors the browser can catch before asking the server. */
function localErrors(): Record<string, string[]> {
  const found: Record<string, string[]> = {}
  if (!form.start) found.start = [t('schedule.required')]
  if (type.value?.range && !form.end) found.end = [t('schedule.required')]
  if (form.start && form.end && form.end < form.start) found.end = [t('schedule.endBeforeStart')]
  return found
}

async function submit() {
  if (saving.value || !type.value) return
  errors.value = localErrors()
  if (Object.keys(errors.value).length) return

  saving.value = true
  try {
    const saved = isEdit.value
      ? await schedulesApi.updateSchedule(route.params.id as string, payload())
      : await schedulesApi.createSchedule(payload())
    toast.success(t(isEdit.value ? 'schedule.saved' : 'schedule.created'))
    router.replace({ name: 'ScheduleDetail', params: { id: saved.id } })
  } catch (e: any) {
    // field errors next to their field (the type's rules come back from the server)
    const serverErrors = e?.response?.data?.errors
    if (serverErrors && typeof serverErrors === 'object') {
      errors.value = Object.entries(serverErrors).reduce((all, [key, messages]) => {
        const field = key.startsWith('schedule_users') ? 'schedule_users' : key
        all[field] = [...(all[field] ?? []), ...(messages as string[])]
        return all
      }, {} as Record<string, string[]>)
    }
    toast.error(apiErrorMessage(e, t('schedule.saveFailed')))
  } finally {
    saving.value = false
  }
}

const goBack = () => (window.history.length > 1 ? router.back() : router.push({ name: 'My Agenda' }))

onMounted(load)
</script>
