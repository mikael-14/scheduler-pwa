<template>
  <div class="space-y-6">
    <!-- Header Card -->
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Scheduler</p>
          <h1 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Weekly View</h1>
        </div>
        <div class="flex items-center gap-2">
          <button @click="goPrev" class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <ChevronLeftIcon class="h-5 w-5" />
          </button>
          <button @click="goToday" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500">Today</button>
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
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400">Current Week</p>
            <p class="text-sm font-bold text-slate-900 dark:text-white">{{ weekRange }}</p>
          </div>
        </div>
        <button @click="openCreateModal" class="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
          <PlusIcon class="h-4 w-4" />
          <span>New Event</span>
        </button>
      </div>
    </div>

    <!-- Calendar Card -->
    <div class="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
      <FullCalendar
        ref="calendarRef"
        :plugins="plugins"
        :initialView="initialView"
        :events="store.events"
        :headerToolbar="false"
        :allDaySlot="false"
        :slotMinTime="'07:00:00'"
        :slotMaxTime="'21:00:00'"
        :slotDuration="'00:30:00'"
        :expandRows="true"
        :height="'auto'"
        :nowIndicator="true"
        class="filament-calendar"
        @eventClick="handleEventClick"
      />
    </div>

    <!-- Loading Overlay -->
    <div v-if="store.loading" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-[2px]">
      <div class="rounded-xl bg-white p-4 shadow-xl dark:bg-slate-800">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CalendarIcon, 
  PlusIcon 
} from '@heroicons/vue/20/solid'
import { useSchedulesStore } from '../stores/schedules'

const store = useSchedulesStore()
const calendarRef = ref<any>(null)
const plugins = [timeGridPlugin, interactionPlugin]
const initialView = 'timeGridWeek'

const currentDate = ref(new Date())

const weekRange = computed(() => {
  const start = new Date(currentDate.value)
  start.setDate(currentDate.value.getDate() - ((currentDate.value.getDay() + 6) % 7))
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric' 
  }).format(start) + ' - ' + new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }).format(end)
})

const updateDate = () => {
  const api = calendarRef.value?.getApi()
  if (api) {
    currentDate.value = api.getDate()
  }
}

const goPrev = () => {
  calendarRef.value?.getApi().prev()
  updateDate()
}

const goNext = () => {
  calendarRef.value?.getApi().next()
  updateDate()
}

const goToday = () => {
  calendarRef.value?.getApi().today()
  updateDate()
}

const openCreateModal = () => {
  // TODO: Implement create modal
  alert('Create event functionality coming soon!')
}

const handleEventClick = (info: any) => {
  // TODO: Implement edit modal
  alert(`Event: ${info.event.title}`)
}

onMounted(() => {
  store.fetchEvents()
})
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

.fc-event {
  @apply rounded-xl border-none p-1 shadow-sm transition-transform active:scale-95 !important;
  background-color: theme('colors.primary.600') !important;
}

.fc-event-main {
  @apply p-1 !important;
}

.fc-event-title {
  @apply text-[10px] font-bold leading-tight text-white sm:text-xs !important;
}

.fc-timegrid-now-indicator-line {
  @apply border-primary-500 !important;
}

.fc-timegrid-now-indicator-arrow {
  @apply border-primary-500 !important;
}
</style>
