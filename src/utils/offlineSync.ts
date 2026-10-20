import { watch } from 'vue'
import axiosInstance from '../config/axios'
import { useAuthStore } from '../stores/auth'
import { useConnectionStore } from '../stores/connection'
import type { Schedule } from '../api/schedules'
import { metaDB, scheduleDB, clearOfflineData } from './db'
import { toInputDate } from './datetime'

/**
 * The calendar for this week and next is kept on the device, so it can be read without a
 * connection (at the shelter, on a weak signal). Everything else needs the server.
 *
 * The copy is refreshed by itself: when the app opens, when the person comes back to it, every
 * 15 minutes while it is on screen, after any change made in the app and when a push
 * notification arrives. Only reading works offline: creating, editing, approving… need a
 * connection, so the server can check its rules.
 */
const REFRESH_EVERY_MS = 15 * 60 * 1000
const WINDOW_DAYS = 14

export interface OfflineWindow {
  /** first and last day, "YYYY-MM-DD" in shelter time */
  from: string
  to: string
}

export interface OfflineStatus {
  window: OfflineWindow | null
  savedAt: number | null
  count: number
}

const addDays = (day: string, days: number) => {
  const date = new Date(`${day}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** Monday of this week to Sunday of next week, in shelter time. */
export function currentWindow(now = new Date()): OfflineWindow {
  const today = toInputDate(now.toISOString())
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay() // 0 = Sunday
  const monday = addDays(today, -((weekday + 6) % 7))
  return { from: monday, to: addDays(monday, WINDOW_DAYS - 1) }
}

let syncing: Promise<boolean> | null = null

/**
 * Save the window again from the server. Resolves to false when it could not (offline, no
 * permission to see the agenda…): the previous copy is kept as it was.
 */
export function syncOfflineData(): Promise<boolean> {
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated() || !authStore.isApproved() || !authStore.can('view_any_schedule')) {
    return Promise.resolve(false)
  }
  if (useConnectionStore().status === 'offline') return Promise.resolve(false)

  syncing ??= (async () => {
    const range = currentWindow()
    const me = authStore.user?.id ?? null
    try {
      const response = await axiosInstance.get('/admin/schedules', {
        params: { per_page: '500', 'filter[start_from]': range.from, 'filter[start_to]': range.to },
      })
      const schedules: Schedule[] = response.data.data ?? []

      // never mix two people's data on one device
      if ((await metaDB.get<number>('userId')) !== me) await clearOfflineData()

      await scheduleDB.replaceAll(schedules)
      await metaDB.set('window', range)
      await metaDB.set('savedAt', Date.now())
      await metaDB.set('userId', me)
      return true
    } catch (error) {
      console.warn('Could not refresh the offline calendar.', error)
      return false
    }
  })().finally(() => (syncing = null))

  return syncing
}

/** What is saved, for the Settings screen. */
export async function offlineStatus(): Promise<OfflineStatus> {
  const [saved, savedAt, schedules] = await Promise.all([
    metaDB.get<OfflineWindow>('window'),
    metaDB.get<number>('savedAt'),
    scheduleDB.getAll(),
  ])
  return { window: saved ?? null, savedAt: savedAt ?? null, count: schedules.length }
}

const overlaps = (schedule: Schedule, from: string, to: string) => {
  const start = toInputDate(schedule.start)
  const end = toInputDate(schedule.end ?? schedule.start)
  return start <= to && end >= from
}

/**
 * The saved schedules for a calendar range ("YYYY-MM-DD" days, inclusive), and whether the
 * range goes beyond what is saved (so the calendar can say so instead of looking empty).
 */
export async function readOfflineSchedules(from: string, to: string, mine: boolean) {
  const saved = await metaDB.get<OfflineWindow>('window')
  const me = useAuthStore().user?.id
  const all: Schedule[] = await scheduleDB.getAll()

  const schedules = all
    .filter((schedule) => overlaps(schedule, from, to))
    .filter((schedule) => !mine
      || schedule.user_id === me
      || schedule.schedule_users?.some((participant) => participant.user_id === me))

  return { schedules, complete: !!saved && from >= saved.from && to <= saved.to, window: saved ?? null }
}

export async function readOfflineSchedule(id: number | string): Promise<Schedule | undefined> {
  return scheduleDB.get(Number(id))
}

/** Start the automatic refreshes (once, from main.ts). */
export function keepOfflineDataFresh() {
  // at start, and as soon as someone signs in (or their account gets approved)
  const authStore = useAuthStore()
  watch(
    () => [authStore.token, authStore.user?.approved_at],
    () => syncOfflineData(),
    { immediate: true }
  )

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') syncOfflineData()
  })
  window.addEventListener('online', () => syncOfflineData())
  setInterval(() => {
    if (document.visibilityState === 'visible') syncOfflineData()
  }, REFRESH_EVERY_MS)

  // a push means something changed (a decision, a new request, an announcement)
  navigator.serviceWorker?.addEventListener('message', (event) => {
    if (event.data?.type === 'push') syncOfflineData()
  })
}
