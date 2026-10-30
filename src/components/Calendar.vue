<template>
  <!-- phones: a compact header (view buttons, then the period beside the arrows) so the calendar
       starts high up; the page already has its title and the view button says the view.
       pb-16: room to scroll the last schedules out from under the floating "New event" button -->
  <div :class="['space-y-3 sm:space-y-6', canCreate ? 'pb-16 sm:pb-0' : '']">
    <div class="page-card border-slate-200 bg-white px-4 py-3 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div class="hidden sm:block">
          <p class="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{{ t('calendar.title') }}</p>
          <h1 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ currentViewTitle }}</h1>
        </div>

        <!-- phones: 3 × 2, so each column pairs the views of one period (month, week); a row from sm up -->
        <div class="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 sm:flex sm:items-center sm:self-auto">
          <button v-for="view in VIEW_BUTTONS" :key="view.name" type="button"
            @click="changeView(view.name)"
            :class="['whitespace-nowrap px-3 py-1.5 text-xs font-semibold rounded-lg transition-all', currentView === view.name ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900']">
            {{ t(view.label) }}
          </button>
        </div>
        
        <div class="flex items-center justify-between gap-2">
          <!-- phones: the period here, beside the arrows (wider: in the row below) -->
          <p class="min-w-0 truncate text-sm font-bold text-slate-900 dark:text-white sm:hidden">{{ dateHeading }}</p>
          <div class="flex shrink-0 items-center gap-2">
            <CalendarFilters v-model="filters" :options="filterOptions" />
            <button @click="goPrev" class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:h-10 sm:w-10">
              <ChevronLeftIcon class="h-5 w-5" />
            </button>
            <button @click="goToday" class="rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 sm:px-4">{{ t('calendar.today') }}</button>
            <button @click="goNext" class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:h-10 sm:w-10">
              <ChevronRightIcon class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div class="mt-6 hidden items-center justify-between border-t border-slate-100 pt-6 dark:border-slate-800 sm:flex">
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

      <!-- the day (or slot) tapped last: "New event" starts there -->
      <div v-if="selected" class="mt-3 flex items-center justify-between gap-2 rounded-xl bg-primary-50 px-3 py-2 text-sm sm:mt-4 text-primary-800 dark:bg-primary-500/10 dark:text-primary-300">
        <span><span class="font-medium">{{ t('calendar.selected') }}:</span> <span class="font-bold">{{ selectedLabel }}</span></span>
        <button type="button" @click="selected = null" :aria-label="t('calendar.clearSelection')"
          class="inline-flex h-7 w-7 items-center justify-center rounded-lg hover:bg-primary-100 dark:hover:bg-primary-500/20">
          <XMarkIcon class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- phones: "New event" as a floating button above the tab bar, as Google Calendar -->
    <button v-if="canCreate" type="button" @click="openCreateModal" :aria-label="t('calendar.newEvent')"
      class="fixed bottom-20 right-4 z-30 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-600/30 transition hover:bg-primary-500 active:scale-95 sm:hidden">
      <PlusIcon class="h-7 w-7" />
    </button>

    <!-- no connection: the copy saved on the device (this week and next) -->
    <p v-if="store.offline" class="page-card flex items-start gap-2 border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
      <SignalSlashIcon class="mt-0.5 h-4 w-4 shrink-0" />
      {{ store.offlineComplete ? t('offline.calendarSaved') : t('offline.calendarOutside') }}
    </p>

    <!-- only the calendar shows it is loading; the header and buttons stay usable -->
    <!-- little side padding on phones: every pixel of width counts -->
    <div class="page-card relative overflow-hidden border-slate-200 bg-white px-1 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4"
      :aria-busy="loading">
      <!-- swiping sideways moves to the previous / next period; the calendar follows the finger -->
      <div ref="swipeArea" class="touch-pan-y" :style="swipeStyle">
        <FullCalendar
          ref="calendarRef"
          :options="calendarOptions"
          class="filament-calendar"
        />
      </div>

      <!-- FullCalendar's cells carry their day: highlight the selected one -->
      <component :is="'style'" v-if="selectedDay">
        .filament-calendar .fc-daygrid-day[data-date="{{ selectedDay }}"],
        .filament-calendar .fc-timegrid-col[data-date="{{ selectedDay }}"] { background-color: var(--selected-day-bg); }
      </component>

      <!-- the compact views (see compactViewsPlugin), drawn inside FullCalendar -->
      <Teleport :to="compactHosts.weekPlanner">
        <WeekPlanner v-if="currentView === 'weekPlanner' && rangeStart" :start="rangeStart" :events="compactEvents"
          :selected="selectedDay" :today="today" @select="selected = $event" @open="openSchedule" />
      </Teleport>
      <Teleport :to="compactHosts.monthDots">
        <MonthDots v-if="currentView === 'monthDots' && rangeStart" :start="rangeStart" :events="compactEvents"
          :selected="selectedDay" :today="today" :first-day="firstDay" @select="selected = $event" @open="openSchedule" />
      </Teleport>

      <div v-if="loading" class="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/60 dark:bg-slate-900/60">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" role="status"
          :aria-label="t('calendar.loading')"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSwipe } from '@vueuse/core'
import FullCalendar from '@fullcalendar/vue3'
import { createPlugin } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid' // Added month layout support
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list';
import { getEventStatusClass } from './common/eventstatus'
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CalendarIcon, 
  PlusIcon,
  XMarkIcon
} from '@heroicons/vue/20/solid'
import WeekPlanner from './WeekPlanner.vue'
import CalendarFilters from './CalendarFilters.vue'
import MonthDots from './MonthDots.vue'
import type { DayEvent } from '../utils/calendarDays'
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
import { loadCalendarOptions, savedCalendarHours, savedCalendarFilterOptions, NO_FILTER_OPTIONS, type CalendarHours, type CalendarFilterOptions } from '../utils/scheduleRules'
import { saveCalendarFilters, savedCalendarFilters, withKnownChoices, type CalendarFilters as Filters } from '../utils/calendarFilters'
import type { Schedule } from '../api/schedules'

const toast = useToastStore()
const router = useRouter()
const authStore = useAuthStore()
const connection = useConnectionStore()
// creating needs the server (its rules, approval): not offline
const canCreate = computed(() => authStore.can('create_schedule') && connection.status !== 'offline')

// the filters are kept on this device (per account) until cleared; the button shows how many are on
const filters = ref<Filters>(savedCalendarFilters(authStore.user?.id))
watch(filters, (value) => {
  saveCalendarFilters(authStore.user?.id, value)
  calendarRef.value?.getApi().refetchEvents()
})

// visible hours and the filters' choices: the last known at once (also offline), then the current ones
const hours = ref<CalendarHours>(savedCalendarHours() ?? { min: null, max: null })
const filterOptions = ref<CalendarFilterOptions>(savedCalendarFilterOptions() ?? NO_FILTER_OPTIONS)
loadCalendarOptions().then((value) => {
  hours.value = value.hours
  filterOptions.value = value.filters
  // a type or person removed since the filters were saved: drop it (and reload only then)
  const known = withKnownChoices(filters.value, value.filters)
  if (JSON.stringify(known) !== JSON.stringify(filters.value)) filters.value = known
})

// back online after showing the saved copy: load the real thing
watch(() => connection.status, (status) => {
  if (status === 'online' && store.offline) calendarRef.value?.getApi().refetchEvents()
})
// the header labels follow the calendar's timezone (see utils/datetime)
const headingZone = CALENDAR_TIMEZONE

const store = useSchedulesStore()
const calendarRef = ref<any>(null)

// Coming back always opens the planner on this week: nothing of the last visit is kept
// (landing on an old week, or a view chosen long ago, was confusing)
const initialView = 'weekPlanner'

// The view buttons, in the order of the phone's 3 × 2 grid
const VIEW_BUTTONS = [
  { name: 'dayGridMonth', label: 'calendar.month' },
  { name: 'timeGridWeek', label: 'calendar.week' },
  { name: 'timeGridDay', label: 'calendar.day' },
  { name: 'monthDots', label: 'calendar.compactMonth' },
  { name: 'weekPlanner', label: 'calendar.planner' },
  { name: 'listWeek', label: 'calendar.list' },
]

// The compact views (see compactViewsPlugin) show the same period as these: same header labels
const SAME_PERIOD: Record<string, string> = { monthDots: 'dayGridMonth', weekPlanner: 'timeGridWeek' }
const baseView = (view: string) => SAME_PERIOD[view] ?? view

const currentDate = ref(new Date())
const currentView = ref(initialView)

// Fetches only the events inside the visible date range.
// FullCalendar calls this automatically on mount, view change, and prev/next navigation.
const fetchEventsForRange = async (fetchInfo: any, successCallback: any, failureCallback: any) => {
  await store.fetchEvents('admin', { start: fetchInfo.startStr, end: fetchInfo.endStr, ...filters.value })
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

// FullCalendar says when it is fetching the visible range (mount, view change, prev/next)
const loading = ref(false)

// Keeps the header date/view label in sync whenever the visible range changes
const handleDatesSet = (info: any) => {
  rangeStart.value = info.startStr.slice(0, 10)
  currentDate.value = info.view.currentStart
  currentView.value = info.view.type
}

// The compact views, made for phones: the week as tweek.so (WeekPlanner: the days one under the other, each with
// its schedules) and the month as Google Calendar (MonthDots: a dot per schedule, the chosen
// day's list below). FullCalendar keeps doing the dates, navigation and fetching; each view
// shows a box that its component is teleported into, fed from the events FullCalendar has loaded.
const compactHosts = { weekPlanner: document.createElement('div'), monthDots: document.createElement('div') }
const compactViewsPlugin = createPlugin({
  name: 'compactViews',
  views: {
    weekPlanner: { duration: { weeks: 1 }, content: () => ({ domNodes: [compactHosts.weekPlanner] }) },
    monthDots: { duration: { months: 1 }, content: () => ({ domNodes: [compactHosts.monthDots] }) },
  },
})
// first day of the visible range and the loaded events, in the calendar's timezone
const rangeStart = ref('')
const compactEvents = ref<DayEvent[]>([])
const today = dateToInput(new Date(), false)
// as FullCalendar's locales: Monday in Portuguese, Sunday in English
const firstDay = computed(() => (locale.value === 'pt' ? 1 : 0))

const handleEventsSet = (events: any[]) => {
  compactEvents.value = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.startStr,
    end: event.endStr,
    allDay: event.allDay,
    status: event.extendedProps?.status,
    typeColor: event.extendedProps?.typeColor,
  }))
}

// All configurations must live here for FullCalendar Vue 3
const calendarOptions = computed(() => ({
  plugins: [listPlugin, dayGridPlugin, timeGridPlugin, interactionPlugin, luxonPlugin, compactViewsPlugin],
  locales: [ptLocale],
  locale: locale.value,
  initialView,
  events: fetchEventsForRange,
  headerToolbar: false as const, // Disables original buttons since you built beautiful custom ones
  allDaySlot: true,
  // the week/day row and the list's label for schedules without hours, as the rest of the app
  allDayText: t('schedule.allDay'),
  slotDuration: '00:30:00',
  expandRows: true,
  height: 'auto',
  nowIndicator: true,
  datesSet: handleDatesSet,
  loading: (isLoading: boolean) => (loading.value = isLoading),
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
  eventsSet: handleEventsSet,
}))

// Changes the text of the main header depending on which view is selected
const currentViewTitle = computed(() => {
  switch (baseView(currentView.value)) {
    case 'dayGridMonth': return t('calendar.monthView')
    case 'timeGridDay': return t('calendar.dayView')
    case 'timeGridWeek':
    default:
      return t('calendar.weekView')
  }
})

// Dynamically computes current scope label depending on view context
const dateHeading = computed(() => {
  if (baseView(currentView.value) === 'dayGridMonth') {
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

// Swipe sideways to the previous / next period, as Google Calendar: the calendar follows the
// finger, and past SWIPE_DISTANCE slides out while the new period slides in from the other side.
const SWIPE_DISTANCE = 60
const SLIDE_MS = 180
const swipeArea = ref<HTMLElement | null>(null)
const swipeOffset = ref(0)
const sliding = ref(false)
// a gesture is either a swipe or a page scroll, decided by its first move
let swipeAxis: 'x' | 'y' | null = null

const { lengthX, lengthY } = useSwipe(swipeArea, {
  passive: true,
  threshold: 10,
  onSwipeStart: () => (swipeAxis = null),
  onSwipe: () => {
    if (sliding.value) return
    swipeAxis ??= Math.abs(lengthX.value) > Math.abs(lengthY.value) ? 'x' : 'y'
    if (swipeAxis === 'x') swipeOffset.value = -lengthX.value
  },
  onSwipeEnd: () => {
    if (sliding.value || swipeAxis !== 'x') return
    if (Math.abs(swipeOffset.value) < SWIPE_DISTANCE) slideTo(0)
    else slideAway(swipeOffset.value < 0 ? 'next' : 'prev')
  },
})

const swipeStyle = computed(() => ({
  transform: swipeOffset.value ? `translateX(${swipeOffset.value}px)` : undefined,
  transition: sliding.value ? `transform ${SLIDE_MS}ms ease-out` : undefined,
}))

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

async function slideTo(offset: number) {
  sliding.value = true
  swipeOffset.value = offset
  await wait(SLIDE_MS)
  sliding.value = false
}

async function slideAway(direction: 'prev' | 'next') {
  const width = swipeArea.value?.clientWidth ?? 0
  const sign = direction === 'next' ? -1 : 1
  await slideTo(sign * width)
  if (direction === 'next') goNext()
  else goPrev()
  // the new period comes in from the other side
  swipeOffset.value = -sign * width
  await nextFrame()
  await slideTo(0)
}

/** The day ("YYYY-MM-DD") or slot ("YYYY-MM-DDTHH:mm") tapped last, in the calendar's timezone. */
const selected = ref<string | null>(null)
const selectedDay = computed(() => selected.value?.slice(0, 10) ?? null)
const selectedLabel = computed(() => {
  if (!selected.value) return ''
  // calendar days, not moments: formatted in UTC so nothing shifts
  const day = new Intl.DateTimeFormat(intlLocale(), { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' })
    .format(new Date(`${selected.value.slice(0, 10)}T00:00:00Z`))
  return selected.value.includes('T') ? `${day} · ${selected.value.slice(11, 16)}` : day
})

// "New event" starts at the selected day / slot, if any; a day only lets the form pick the time
const openCreateModal = () => {
  router.push({ name: 'ScheduleNew', query: selected.value ? { start: selected.value } : {} })
}

// A tap on a day or slot selects it (the button then creates there)
const handleDateClick = (info: any) => {
  // dateStr is in the calendar's timezone: "YYYY-MM-DD" (day cell, all-day row) or "YYYY-MM-DDTHH:mm:ss+01:00"
  selected.value = info.allDay ? info.dateStr.slice(0, 10) : info.dateStr.slice(0, 16)
}

const openSchedule = (id: string) => {
  router.push({ name: 'ScheduleDetail', params: { id } })
}

const handleEventClick = (info: any) => openSchedule(info.event.id)

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
  --selected-day-bg: rgba(16, 185, 129, 0.16);
}

.dark .filament-calendar {
  --fc-border-color: rgba(30, 41, 59, 0.8);
  --fc-today-bg-color: rgba(16, 185, 129, 0.1);
  --selected-day-bg: rgba(16, 185, 129, 0.22);
  /* Sticky day headers and list-day rows default to white */
  --fc-page-bg-color: #0f172a; /* slate-900, matches the card */
  --fc-neutral-bg-color: #1e293b; /* slate-800 */
  --fc-neutral-text-color: #94a3b8; /* slate-400 */
  --fc-list-event-hover-bg-color: #1e293b;
}

.dark .filament-calendar .fc-list-day-cushion {
  @apply text-slate-200;
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