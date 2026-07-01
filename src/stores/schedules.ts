import { defineStore } from 'pinia'
import { ref } from 'vue'
import { schedulesApi } from '../api/schedules'

export const useSchedulesStore = defineStore('schedules', () => {
  const events = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchEvents(panel = 'user') {
    loading.value = true
    try {
      const data = await schedulesApi.fetchSchedules(panel)
      events.value = data
    } catch (err) {
      console.error('Failed to fetch schedules', err)
      error.value = 'Failed to load schedules'
    } finally {
      loading.value = false
    }
  }

  async function addEvent(ev: any, panel = 'user') {
    try {
      const newEvent = await schedulesApi.createSchedule(ev, panel)
      events.value.push(newEvent)
      return newEvent
    } catch (err) {
      console.error('Failed to add event to API', err)
      throw err
    }
  }

  async function updateEvent(id: number | string, ev: any, panel = 'user') {
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

  async function deleteEvent(id: number | string, panel = 'user') {
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

  return { events, loading, error, fetchEvents, addEvent, updateEvent, deleteEvent, clearEvents }
})
