<template>
  <div class="space-y-6">
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{{ t('calendar.title') }}</p>
          <h1 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ currentViewTitle }}</h1>
        </div>

        <div class="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 self-start sm:self-auto">
          <button 
            @click="changeView('dayGridMonth')" 
            :class="['px-3 py-1.5 text-xs font-semibold rounded-lg transition-all', currentView === 'dayGridMonth' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900']">
            {{ t('calendar.month') }}
          </button>
          <button 
            @click="changeView('timeGridWeek')" 
            :class="['px-3 py-1.5 text-xs font-semibold rounded-lg transition-all', currentView === 'timeGridWeek' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900']">
            {{ t('calendar.week') }}
          </button>
          <button 
            @click="changeView('timeGridDay')" 
            :class="['px-3 py-1.5 text-xs font-semibold rounded-lg transition-all', currentView === 'timeGridDay' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900']">
            {{ t('calendar.day') }}
          </button>
          <button 
            @click="changeView('listWeek')" 
            :class="['px-3 py-1.5 text-xs font-semibold rounded-lg transition-all', currentView === 'listWeek' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900']">
            {{ t('calendar.list') }}
          </button>
        </div>
        
        <div class="flex items-center gap-2">
          <button @click="goPrev" class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <ChevronLeftIcon class="h-5 w-5" />
          </button>
          <button @click="goToday" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500">{{ t('calendar.today') }}</button>
          <button @click="goNext" class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <ChevronRightIcon class="h-5 w-5" />
          </button>
        </div>
      </div>

      <div class="mt-6 flex items-center justify-between border-t border-slate-100 pt-6 dark:border-slate-800">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
            <CalendarIcon class="h-5 w-5" />
          </div>
          <div>
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('calendar.currentScope') }}</p>
            <p class="text-sm font-bold text-slate-900 dark:text-white">{{ dateHeading }}</p>
          </div>
        </div>
        <button v-if="canCreate" @click="openCreateModal" class="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
          <PlusIcon class="h-4 w-4" />
          <span>{{ t('calendar.newEvent') }}</span>
        </button>
      </div>
    </div>

    <!-- no connection: the copy saved on the device (this week and next) -->
    <p v-if="store.offline" class="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
      <SignalSlashIcon class="mt-0.5 h-4 w-4 shrink-0" />
      {{ store.offlineComplete ? t('offline.calendarSaved') : t('offline.calendarOutside') }}
    </p>

    <div class="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
      <FullCalendar
        ref="calendarRef"
        :options="calendarOptions"
        class="filament-calendar"
      />
    </div>

    <div v-if="store.loading && store.events.length === 0" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-[2px]">
      <div class="rounded-xl bg-white p-4 shadow-xl dark:bg-slate-800">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid' // Added month layout support
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list';
import { getEventStatusClass } from './common/eventstatus'
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CalendarIcon, 
  PlusIcon 
} from '@heroicons/vue/20/solid'
import ptLocale from '@fullcalendar/core/locales/pt'
// named timezones (the shelter's, see utils/datetime): without it FullCalendar only knows UTC and local
import luxonPlugin from '@fullcalendar/luxon3'
import { useSchedulesStore } from '../stores/schedules'
import { t, locale, intlLocale } from '../i18n'
import { useRouter } from 'vue-router'
import { useToastStore } from '../stores/toast'
import { useAuthStore } from '../stores/auth'
import { useConnectionStore } from '../stores/connection'
import { SignalSlashIcon } from '@heroicons/vue/24/outline'
import { CALENDAR_TIMEZONE, dateToInput } from '../utils/datetime'
import { loadCalendarHours, savedCalendarHours, type CalendarHours } from '../utils/scheduleRules'
import type { Schedule } from '../api/schedules'

/** `mine`: only schedules I own or take part in ("My agenda"). */
const props = defineProps<{ mine?: boolean }>()

const toast = useToastStore()
const router = useRouter()
const authStore = useAuthStore()
const connection = useConnectionStore()
// creating needs the server (its rules, approval): not offline
const canCreate = computed(() => authStore.can('create_schedule') && connection.status !== 'offline')

// visible hours: the last known at once (also offline), then the current ones
const hours = ref<CalendarHours>(savedCalendarHours() ?? { min: null, max: null })
loadCalendarHours().then((value) => (hours.value = value))

// back online after showing the saved copy: load the real thing
watch(() => connection.status, (status) => {
  if (status === 'online' && store.offline) calendarRef.value?.getApi().refetchEvents()
})
// the header labels follow the calendar's timezone (see utils/datetime)
const headingZone = CALENDAR_TIMEZONE

const store = useSchedulesStore()
const calendarRef = ref<any>(null)

const currentDate = ref(new Date())
const currentView = ref('timeGridWeek')

// Fetches only the events inside the visible date range.
// FullCalendar calls this automatically on mount, view change, and prev/next navigation.
const fetchEventsForRange = async (fetchInfo: any, successCallback: any, failureCallback: any) => {
  await store.fetchEvents('admin', { start: fetchInfo.startStr, end: fetchInfo.endStr, mine: props.mine })
  if (store.error) {
    // FullCalendar shows nothing on failure: tell the user why the calendar is empty
    toast.error(store.error)
    failureCallback(new Error(store.error))
  } else {
    successCallback(store.events.map(toCalendarEvent))
  }
}

/** API schedule → FullCalendar event: "Type · Owner", coloured by status, striped by type. */
function toCalendarEvent(schedule: Schedule) {
  let end: string | Date | null = schedule.end
  // FullCalendar's all-day end is exclusive: the last day must be included
  if (schedule.all_day && end) {
    const next = new Date(end)
    next.setUTCDate(next.getUTCDate() + 1)
    end = next
  }

  return {
    id: String(schedule.id),
    title: [schedule.schedule_type?.name ?? t('calendar.scheduledEvent'), schedule.user?.name].filter(Boolean).join(' · '),
    start: schedule.start,
    end: end ?? undefined,
    allDay: schedule.all_day,
    extendedProps: { status: schedule.status, typeColor: schedule.schedule_type?.color },
  }
}

// Keeps the header date/view label in sync whenever the visible range changes
const handleDatesSet = (info: any) => {
  currentDate.value = info.view.currentStart
  currentView.value = info.view.type
}

// All configurations must live here for FullCalendar Vue 3
const calendarOptions = computed(() => ({
  plugins: [listPlugin, dayGridPlugin, timeGridPlugin, interactionPlugin, luxonPlugin],
  locales: [ptLocale],
  locale: locale.value,
  initialView: 'listWeek',
  events: fetchEventsForRange,
  headerToolbar: false as const, // Disables original buttons since you built beautiful custom ones
  allDaySlot: true,
  slotDuration: '00:30:00',
  expandRows: true,
  height: 'auto',
  nowIndicator: true,
  datesSet: handleDatesSet,
  // Format side axis time labels (e.g., 00:00, 01:00 ... 23:00)
  slotLabelFormat: {
    hour: '2-digit' as const,
    minute: '2-digit' as const,
    hour12: false
  },
  eventClassNames: (arg: any) => {
    const status = arg.event.extendedProps?.status || arg.event.status
    return [getEventStatusClass(status)]
  },
  // Format event card time labels
  eventTimeFormat: {
    hour: '2-digit' as const,
    minute: '2-digit' as const,
    hour12: false
  },
  timeZone: CALENDAR_TIMEZONE,
  // the hours of the active types (display only, as the admin panel's calendar)
  ...(hours.value.min ? { slotMinTime: hours.value.min } : {}),
  ...(hours.value.max ? { slotMaxTime: hours.value.max } : {}),
  eventClick: handleEventClick,
  dateClick: handleDateClick,
  eventDidMount: handleEventDidMount,
}))

// Changes the text of the main header depending on which view is selected
const currentViewTitle = computed(() => {
  switch (currentView.value) {
    case 'dayGridMonth': return t('calendar.monthView')
    case 'timeGridDay': return t('calendar.dayView')
    case 'timeGridWeek':
    default:
      return t('calendar.weekView')
  }
})

// Dynamically computes current scope label depending on view context
const dateHeading = computed(() => {
  if (currentView.value === 'dayGridMonth') {
    return new Intl.DateTimeFormat(intlLocale(), { timeZone: headingZone, month: 'long', year: 'numeric' }).format(currentDate.value)
  }

  if (currentView.value === 'timeGridDay') {
    return new Intl.DateTimeFormat(intlLocale(), { timeZone: headingZone, weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }).format(currentDate.value)
  }

  // Fallback to original week calculation
  const start = new Date(currentDate.value)
  start.setDate(currentDate.value.getDate() - ((currentDate.value.getDay() + 6) % 7))
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  
  return new Intl.DateTimeFormat(intlLocale(), { timeZone: headingZone, 
    month: 'short', 
    day: 'numeric' 
  }).format(start) + ' - ' + new Intl.DateTimeFormat(intlLocale(), { timeZone: headingZone, 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }).format(end)
})

// Controls shifting views via the custom tab buttons.
// handleDatesSet updates the header automatically after each change.
const changeView = (viewName: string) => {
  calendarRef.value?.getApi().changeView(viewName)
}

const goPrev = () => {
  calendarRef.value?.getApi().prev()
}

const goNext = () => {
  calendarRef.value?.getApi().next()
}

const goToday = () => {
  calendarRef.value?.getApi().today()
}

const openCreateModal = () => {
  router.push({ name: 'ScheduleNew' })
}

// A tap on an empty slot starts a new schedule there
const handleDateClick = (info: any) => {
  if (!canCreate.value) return
  // a day cell (month view, all-day row) gives a date only; the form picks a default time
  router.push({ name: 'ScheduleNew', query: { start: dateToInput(info.date, !info.allDay) } })
}

const handleEventClick = (info: any) => {
  router.push({ name: 'ScheduleDetail', params: { id: info.event.id } })
}

// The type's colour as a stripe on the left of each schedule
const handleEventDidMount = (info: any) => {
  const color = info.event.extendedProps?.typeColor
  if (color) info.el.style.borderLeft = `4px solid ${color}`
}
</script>

<style>
/* Filament Calendar Styling */
.filament-calendar {
  --fc-border-color: rgba(226, 232, 240, 0.8);
  --fc-button-bg-color: #ffffff;
  --fc-button-text-color: #64748b;
  --fc-today-bg-color: rgba(16, 185, 129, 0.05);
}

.dark .filament-calendar {
  --fc-border-color: rgba(30, 41, 59, 0.8);
  --fc-today-bg-color: rgba(16, 185, 129, 0.1);
}

.fc-theme-standard .fc-scrollgrid {
  border: none !important;
}

.fc-col-header-cell {
  @apply py-3 border-none !important;
}

.fc-col-header-cell-cushion {
  @apply text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 no-underline !important;
}

.fc-timegrid-slot {
  @apply h-12 border-slate-100 dark:border-slate-800 !important;
}

.fc-timegrid-slot-label-cushion {
  @apply text-xs font-medium text-slate-400 dark:text-slate-500 !important;
}

/* DayGrid Month-view specific layout overrides */
.fc-daygrid-day-number {
  @apply text-xs font-bold p-2 text-slate-600 dark:text-slate-400 no-underline !important;
}

.fc-event {
  @apply rounded-xl border-none p-1 shadow-sm transition-transform active:scale-95 !important;
}

.fc-event-main {
  @apply p-1 !important;
}

.fc-event-title {
  @apply text-[10px] font-bold leading-tight sm:text-xs !important;
}
.fc-timegrid-now-indicator-line {
  @apply border-primary-500 !important;
}

.fc-timegrid-now-indicator-arrow {
  @apply border-primary-500 !important;
}
</style>