import { defineStore } from 'pinia'
import { ref } from 'vue'
import { schedulesApi, type Schedule, type ScheduleFilters } from '../api/schedules'
import { t } from '../i18n'
import { apiErrorMessage } from '../utils/apiError'

export const useSchedulesStore = defineStore('schedules', () => {
  const events = ref<Schedule[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  // read from the copy saved on the device, and whether it covers the range on screen
  const offline = ref(false)
  const offlineComplete = ref(true)

  async function fetchEvents(panel = 'admin', filters: ScheduleFilters = {}) {
    loading.value = true
    error.value = null
    try {
      const result = await schedulesApi.fetchSchedules(panel, filters)
      events.value = result.data
      offline.value = result.offline
      offlineComplete.value = result.complete
    } catch (err) {
      console.error('Failed to fetch schedules', err)
      error.value = apiErrorMessage(err, t('calendar.loadFailed'))
    } finally {
      loading.value = false
    }
  }

  async function addEvent(ev: any, panel = 'admin') {
    try {
      const newEvent = await schedulesApi.createSchedule(ev, panel)
      events.value.push(newEvent)
      return newEvent
    } catch (err) {
      console.error('Failed to add event to API', err)
      throw err
    }
  }

  async function updateEvent(id: number | string, ev: any, panel = 'admin') {
    try {
      const updatedEvent = await schedulesApi.updateSchedule(id, ev, panel)
      const index = events.value.findIndex(e => e.id === id)
      if (index !== -1) {
        events.value[index] = updatedEvent
      }
      return updatedEvent
    } catch (err) {
      console.error('Failed to update event', err)
      throw err
    }
  }

  async function deleteEvent(id: number | string, panel = 'admin') {
    try {
      await schedulesApi.deleteSchedule(id, panel)
      events.value = events.value.filter(e => e.id !== id)
    } catch (err) {
      console.error('Failed to delete event', err)
      throw err
    }
  }

  function clearEvents() {
    events.value = []
    error.value = null
    loading.value = false
  }

  return { events, loading, error, offline, offlineComplete, fetchEvents, addEvent, updateEvent, deleteEvent, clearEvents }
})
