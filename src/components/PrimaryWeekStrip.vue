<template>
  <!-- the primary calendar, today and the next 6 days: is each day filled? (counts only) -->
  <section v-if="week?.type" :class="card">
    <div class="flex items-center justify-between gap-2">
      <h2 class="flex min-w-0 items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
        <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: week.type.color || '#94a3b8' }"></span>
        <span class="truncate">{{ t('primaryWeek.title', { type: week.type.name }) }}</span>
      </h2>
    </div>

    <ol class="mt-3 grid grid-cols-7 gap-1 text-center">
      <li v-for="(day, i) in week.days" :key="day.date">
        <component :is="canOpen ? 'router-link' : 'div'"
          v-bind="canOpen ? { to: { name: 'Calendar', query: { date: day.date } } } : {}"
          :title="dayTitle(day)" :aria-label="dayTitle(day)"
          :class="['flex flex-col items-center gap-1 rounded-xl py-1.5', canOpen ? 'hover:bg-slate-50 dark:hover:bg-slate-800' : '', i === 0 ? 'bg-primary-50 dark:bg-primary-500/10' : '']">
          <span class="text-[11px] font-medium capitalize text-slate-500 dark:text-slate-400">{{ weekday(day.date) }}</span>
          <span :class="['flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold', STATE_CLASS[day.state]]">
            {{ Number(day.date.slice(8, 10)) }}
          </span>
          <span class="text-[11px] tabular-nums text-slate-500 dark:text-slate-400">{{ people(day) }}</span>
        </component>
      </li>
    </ol>

    <!-- what the colours mean -->
    <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
      <li v-for="state in LEGEND" :key="state" class="flex items-center gap-1.5">
        <span :class="['h-2.5 w-2.5 rounded-full', STATE_DOT[state]]"></span>{{ t(`primaryWeek.${state}`) }}
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { intlLocale, t } from '../i18n'
import { useAuthStore } from '../stores/auth'
import { schedulesApi, type PrimaryWeek, type PrimaryWeekDay } from '../api/schedules'

const authStore = useAuthStore()
const week = ref<PrimaryWeek | null>(null)
// the calendar needs its permission: without it the days are shown, not linked
const canOpen = computed(() => authStore.can('view_any_schedule'))

const card = 'page-card border-slate-200 bg-white px-4 py-5 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900'

const STATE_CLASS: Record<PrimaryWeekDay['state'], string> = {
  approved: 'bg-success-500 text-white',
  pending: 'bg-amber-400 text-amber-950',
  cancelled: 'bg-danger-500 text-white',
  empty: 'border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200',
}
const STATE_DOT: Record<PrimaryWeekDay['state'], string> = {
  approved: 'bg-success-500',
  pending: 'bg-amber-400',
  cancelled: 'bg-danger-500',
  empty: 'border border-slate-400 dark:border-slate-500',
}
const LEGEND: PrimaryWeekDay['state'][] = ['approved', 'pending', 'cancelled', 'empty']

/** "sex." from "2026-11-13" (a day, no time: read in UTC so it never shifts). */
const weekday = (date: string) =>
  new Intl.DateTimeFormat(intlLocale(), { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`)).replace('.', '')

const people = (day: PrimaryWeekDay) => (day.approved + day.pending > 0 ? String(day.approved + day.pending) : '–')

function dayTitle(day: PrimaryWeekDay): string {
  const date = new Intl.DateTimeFormat(intlLocale(), { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
    .format(new Date(`${day.date}T00:00:00Z`))
  return `${date}: ${t(`primaryWeek.${day.state}Long`, { approved: day.approved, pending: day.pending, cancelled: day.cancelled })}`
}

// not shown when it can't be loaded (offline, or no primary type)
onMounted(async () => {
  try {
    week.value = await schedulesApi.primaryWeek()
  } catch {
    week.value = null
  }
})
</script>
