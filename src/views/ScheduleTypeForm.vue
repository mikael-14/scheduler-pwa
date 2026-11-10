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

      <!-- shifts: the slots people pick (SlotDefinitions on the server) -->
      <div class="space-y-4 border-t border-slate-100 pt-5 dark:border-slate-800">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p id="switch-uses_slots" class="text-sm font-medium text-slate-900 dark:text-white">{{ t('scheduleTypes.usesSlots') }}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400">{{ t('scheduleTypes.usesSlotsHelp') }}</p>
            <FieldError :errors="errors.uses_slots" />
          </div>
          <button type="button" role="switch" :aria-checked="form.uses_slots" aria-labelledby="switch-uses_slots"
            @click="form.uses_slots = !form.uses_slots"
            :class="['relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900', form.uses_slots ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700']">
            <span :class="['inline-block h-5 w-5 rounded-full bg-white shadow transition', form.uses_slots ? 'translate-x-5' : 'translate-x-0.5']"></span>
          </button>
        </div>

        <template v-if="form.uses_slots">
          <FieldError :errors="errors.slots" />
          <p v-if="!slots.length" class="text-sm text-slate-500 dark:text-slate-400">{{ t('scheduleTypes.noSlots') }}</p>

          <div v-for="(slot, i) in slots" :key="slot.key"
            class="space-y-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <div class="flex items-center justify-between gap-2">
              <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ slotTitle(slot) }}</p>
              <div class="flex shrink-0 items-center gap-1">
                <button type="button" @click="duplicateSlot(i)" :title="t('scheduleTypes.duplicateSlot')" :aria-label="t('scheduleTypes.duplicateSlot')"
                  class="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">
                  <DocumentDuplicateIcon class="h-4 w-4" />
                </button>
                <button type="button" @click="removeSlot(i)" :disabled="slot.taken"
                  :title="slot.taken ? t('scheduleTypes.slotTaken', { people: slot.people }) : t('scheduleTypes.removeSlot')"
                  :aria-label="t('scheduleTypes.removeSlot')"
                  class="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500 dark:text-slate-400 dark:hover:bg-red-500/10">
                  <TrashIcon class="h-4 w-4" />
                </button>
              </div>
            </div>
            <p v-if="slot.taken" class="rounded-md bg-sky-50 px-2 py-1.5 text-xs text-sky-800 dark:bg-sky-500/10 dark:text-sky-300">
              {{ t('scheduleTypes.slotTaken', { people: slot.people }) }}
            </p>
            <FieldError :errors="errors[`slots.${i}.id`]" />

            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <label class="col-span-2 block text-sm font-medium text-slate-700 sm:col-span-1 dark:text-slate-300">
                {{ t('scheduleTypes.slotDay') }}
                <input v-model="slot.day" type="date" required :disabled="slot.taken" :class="inputClass" />
                <FieldError :errors="errors[`slots.${i}.day`]" />
              </label>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {{ t('scheduleTypes.slotFrom') }}
                <input v-model="slot.from" type="time" step="300" required :disabled="slot.taken" :class="inputClass" />
                <FieldError :errors="errors[`slots.${i}.from`]" />
              </label>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {{ t('scheduleTypes.slotTo') }}
                <input v-model="slot.to" type="time" step="300" required :disabled="slot.taken" :class="inputClass" />
                <span class="mt-0.5 block text-[11px] font-normal text-slate-500 dark:text-slate-400">{{ t('scheduleTypes.slotToHelp') }}</span>
                <FieldError :errors="errors[`slots.${i}.to`]" />
              </label>
              <label class="col-span-2 block text-sm font-medium text-slate-700 sm:col-span-1 dark:text-slate-300">
                {{ t('scheduleTypes.slotCapacity') }}
                <input v-model="slot.capacity" type="number" min="1" max="1000" inputmode="numeric"
                  :placeholder="t('scheduleTypes.slotNoLimit')" :class="inputClass" />
                <FieldError :errors="errors[`slots.${i}.capacity`]" />
              </label>
            </div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {{ t('scheduleTypes.slotComment') }}
              <textarea v-model="slot.comment" rows="1" maxlength="1000" :placeholder="t('scheduleTypes.slotCommentPlaceholder')" :class="inputClass"></textarea>
              <FieldError :errors="errors[`slots.${i}.comment`]" />
            </label>
          </div>

          <button type="button" @click="addSlot"
            class="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-primary-400 hover:text-primary-700 dark:border-slate-600 dark:text-slate-200 dark:hover:text-primary-300">
            <PlusIcon class="h-4 w-4" /> {{ t('scheduleTypes.addSlot') }}
          </button>
        </template>
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
import { ArrowPathIcon, DocumentDuplicateIcon, PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { t } from '../i18n'
import { scheduleTypesApi, type ScheduleTypeInput, type ScheduleTypeSlot } from '../api/scheduleTypes'
import { useConnectionStore } from '../stores/connection'
import { useToastStore } from '../stores/toast'
import { apiErrorMessage } from '../utils/apiError'
import { toApiDateTime, toInputDateTime } from '../utils/datetime'
import FieldError from '../components/common/FieldError.vue'
import { slotPeople } from '../utils/slots'

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
  uses_slots: false,
})

/** A slot being edited; `key` identifies it in the list, `id` is the saved slot (none = new). */
interface SlotRow {
  key: number
  id?: number
  day: string
  from: string
  to: string
  capacity: string | number
  comment: string
  people: number
  taken: boolean
}
const slots = ref<SlotRow[]>([])
let nextKey = 1

const toRow = (slot: ScheduleTypeSlot): SlotRow => ({
  key: nextKey++, id: slot.id, day: slot.day, from: slot.from, to: slot.to,
  capacity: slot.capacity ?? '', comment: slot.comment ?? '', people: slot.people, taken: slot.taken,
})

const minutes = (time: string) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}
const hhmm = (total: number) => {
  const wrapped = ((total % 1440) + 1440) % 1440
  return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`
}

/** A new slot right after the last one, as long as it (or 2 hours on a first one). */
function addSlot() {
  const last = slots.value[slots.value.length - 1]
  if (!last || !last.day || !last.from || !last.to) {
    slots.value.push({ key: nextKey++, day: last?.day ?? '', from: '09:00', to: '11:00', capacity: '', comment: '', people: 0, taken: false })
    return
  }
  const length = (minutes(last.to) - minutes(last.from) + 1440) % 1440 || 120
  slots.value.push({
    key: nextKey++, day: last.day, from: last.to, to: hhmm(minutes(last.to) + length),
    capacity: last.capacity, comment: '', people: 0, taken: false,
  })
}

/** A copy (new, with nobody on it) right below. */
function duplicateSlot(index: number) {
  const { day, from, to, capacity, comment } = slots.value[index]
  slots.value.splice(index + 1, 0, { key: nextKey++, day, from, to, capacity, comment, people: 0, taken: false })
  errors.value = {} // the messages are per position
}

function removeSlot(index: number) {
  if (slots.value[index].taken) return
  slots.value.splice(index, 1)
  errors.value = {}
}

/** "21/11 · 09:00–11:00 · 2 de 5 pessoas" */
function slotTitle(slot: SlotRow): string {
  if (!slot.day) return t('scheduleTypes.newSlot')
  const [y, m, d] = slot.day.split('-')
  const parts = [`${d}/${m}/${y}`, `${slot.from || '--:--'}–${slot.to || '--:--'}`]
  const capacity = slot.capacity === '' ? null : Number(slot.capacity)
  if (slot.id) parts.push(slotPeople(slot.people, capacity))
  else if (capacity) parts.push(t('scheduleTypes.slotMax', { count: capacity }))
  return parts.join(' · ')
}

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
      uses_slots: type.uses_slots,
    })
    slots.value = (type.slots ?? []).map(toRow)
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
  uses_slots: form.uses_slots,
  // the whole list, in the order shown (the server's messages are per position)
  slots: slots.value.map((slot) => ({
    ...(slot.id ? { id: slot.id } : {}),
    day: slot.day,
    from: slot.from,
    to: slot.to,
    capacity: slot.capacity === '' || slot.capacity === null ? null : Number(slot.capacity),
    comment: slot.comment.trim() || null,
  })),
})

/** The checks the server makes too, so the obvious mistakes show without a round trip. */
function localErrors(): Record<string, string[]> {
  const found: Record<string, string[]> = {}
  if (!form.name.trim()) found.name = [t('scheduleTypes.nameRequired')]
  if (form.start && form.end && form.end < form.start) found.end = [t('schedule.endBeforeStart')]
  slots.value.forEach((slot, i) => {
    if (slot.taken) return
    if (!slot.day) found[`slots.${i}.day`] = [t('scheduleTypes.slotRequired')]
    if (!slot.from) found[`slots.${i}.from`] = [t('scheduleTypes.slotRequired')]
    if (!slot.to) found[`slots.${i}.to`] = [t('scheduleTypes.slotRequired')]
    // an end of 00:00 is midnight
    else if (slot.from && slot.to !== '00:00' && slot.to <= slot.from) found[`slots.${i}.to`] = [t('schedule.endBeforeStart')]
  })
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
