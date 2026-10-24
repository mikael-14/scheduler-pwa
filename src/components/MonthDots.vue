<template>
  <!-- the month as Google Calendar on a phone: a dot per schedule, the chosen day's list below
       (beside it, as a sidebar, on wide screens) -->
  <div class="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
    <!-- the month grid -->
    <div>
      <div class="grid grid-cols-7 pb-1 text-center text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500">
        <span v-for="(label, index) in weekdays" :key="index">{{ label }}</span>
      </div>

      <div class="grid grid-cols-7 gap-y-1">
        <template v-for="(cell, index) in cells" :key="index">
          <!-- days of the other months stay empty: their schedules are not loaded -->
          <div v-if="!cell"></div>
          <button v-else type="button" @click="emit('select', cell.date)"
            :class="['flex h-12 flex-col items-center gap-1 rounded-xl pt-1 transition-colors sm:h-20 sm:pt-2',
              cell.date === shownDay ? 'bg-primary-50 dark:bg-primary-500/10' : 'hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800/60 dark:active:bg-slate-800']">
            <span :class="['flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold',
              cell.date === today ? 'bg-primary-600 text-white'
                : cell.date === shownDay ? 'text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300']">{{ cell.number }}</span>
            <span class="flex h-1.5 items-center gap-0.5">
              <span v-for="event in cell.events.slice(0, MAX_DOTS)" :key="event.id"
                class="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500"
                :style="event.typeColor ? { backgroundColor: event.typeColor } : undefined"></span>
              <span v-if="cell.events.length > MAX_DOTS" class="text-[9px] font-bold leading-none text-slate-400">+</span>
            </span>
          </button>
        </template>
      </div>
    </div>

    <section class="mt-3 border-t border-slate-100 px-1 pt-3 dark:border-slate-800 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
      <template v-if="shownDay">
        <h3 class="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{{ shownDayLabel }}</h3>
        <DayEventList v-if="shownEvents.length" :events="shownEvents" @open="emit('open', $event)" />
        <p v-else class="py-2 text-sm text-slate-400 dark:text-slate-500">{{ t('calendar.noEvents') }}</p>
      </template>
      <p v-else class="py-2 text-sm text-slate-400 dark:text-slate-500">{{ t('calendar.pickDay') }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DayEventList from './DayEventList.vue'
import { t, intlLocale } from '../i18n'
import { addDays, dayToDate, eventsOnDay, type DayEvent } from '../utils/calendarDays'

const MAX_DOTS = 3

const props = defineProps<{
  /** First day of the month, "YYYY-MM-DD". */
  start: string
  events: DayEvent[]
  /** Selected day, "YYYY-MM-DD". */
  selected: string | null
  /** Today in the calendar's timezone, "YYYY-MM-DD". */
  today: string
  /** First day of the week, 0 = Sunday (as FullCalendar's firstDay). */
  firstDay: number
}>()

const emit = defineEmits<{ select: [day: string]; open: [id: string] }>()

const monthOf = (day: string) => day.slice(0, 7)

// 2023-01-01 was a Sunday
const weekdays = computed(() => {
  const format = new Intl.DateTimeFormat(intlLocale(), { timeZone: 'UTC', weekday: 'narrow' })
  return Array.from({ length: 7 }, (_, index) => format.format(dayToDate(addDays('2023-01-01', (props.firstDay + index) % 7))))
})

/** The month's days in week rows, null where a row reaches into another month. */
const cells = computed(() => {
  const [year, month] = props.start.split('-').map(Number)
  const length = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const lead = (dayToDate(props.start).getUTCDay() - props.firstDay + 7) % 7

  const days = Array.from({ length }, (_, index) => {
    const date = addDays(props.start, index)
    return { date, number: index + 1, events: eventsOnDay(props.events, date) }
  })
  return [...Array(lead).fill(null), ...days] as (typeof days[number] | null)[]
})

// the selected day if it is in this month, else today if it is
const shownDay = computed(() => {
  if (props.selected && monthOf(props.selected) === monthOf(props.start)) return props.selected
  return monthOf(props.today) === monthOf(props.start) ? props.today : null
})

const shownEvents = computed(() => (shownDay.value ? eventsOnDay(props.events, shownDay.value) : []))

const shownDayLabel = computed(() => shownDay.value
  ? new Intl.DateTimeFormat(intlLocale(), { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }).format(dayToDate(shownDay.value))
  : '')
</script>
