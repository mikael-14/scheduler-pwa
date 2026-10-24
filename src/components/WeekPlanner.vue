<template>
  <!-- the week as a paper planner (as tweek.so): on phones one row per day, its schedules listed
       under it; wider, the days are boxes in columns (2, then 4: the week in two rows) -->
  <div class="divide-y divide-slate-100 dark:divide-slate-800 sm:grid sm:grid-cols-2 sm:gap-3 sm:divide-y-0 lg:grid-cols-4">
    <section v-for="day in days" :key="day.date"
      :class="['cursor-pointer px-2 py-3 transition-colors sm:min-h-[9rem] sm:rounded-xl sm:border sm:border-slate-100 sm:px-3 sm:dark:border-slate-800',
        day.date === selected ? 'bg-primary-50 dark:bg-primary-500/10' : '']"
      @click="emit('select', day.date)">
      <header class="flex items-baseline gap-2">
        <span :class="['flex h-8 min-w-[2rem] items-center justify-center rounded-full text-lg font-bold',
          day.date === today ? 'bg-primary-600 text-white' : 'text-slate-900 dark:text-white']">{{ day.number }}</span>
        <span :class="['text-xs font-bold uppercase tracking-widest',
          day.date === today ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400']">{{ day.weekday }}</span>
      </header>

      <DayEventList v-if="day.events.length" class="mt-2" :events="day.events" @open="emit('open', $event)" />
      <!-- an empty ruled line, as on a planner page -->
      <div v-else class="mt-2 h-6 border-b border-dashed border-slate-200 dark:border-slate-700"></div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DayEventList from './DayEventList.vue'
import { intlLocale } from '../i18n'
import { addDays, dayToDate, eventsOnDay, type DayEvent } from '../utils/calendarDays'

const props = defineProps<{
  /** First day of the week, "YYYY-MM-DD". */
  start: string
  events: DayEvent[]
  /** Selected day, "YYYY-MM-DD". */
  selected: string | null
  /** Today in the calendar's timezone, "YYYY-MM-DD". */
  today: string
}>()

const emit = defineEmits<{ select: [day: string]; open: [id: string] }>()

const days = computed(() => {
  const weekday = new Intl.DateTimeFormat(intlLocale(), { timeZone: 'UTC', weekday: 'long', month: 'short' })

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(props.start, index)
    return { date, number: Number(date.slice(8)), weekday: weekday.format(dayToDate(date)), events: eventsOnDay(props.events, date) }
  })
})
</script>
