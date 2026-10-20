import axiosInstance from '../config/axios'
import { t } from '../i18n'
import type { ScheduleTypeOption } from '../api/schedules'
import { formatServerDateTime, toInputDate, toInputDateTime } from './datetime'

/**
 * The schedule type rules, as the PWA applies them (the API's App\Services\ScheduleTypeRules
 * enforces the same ones on save, so these only spare people a refused form):
 *
 * - start / end:  when schedules of the type may exist → the pickers' first and last date;
 * - all_day:      whether "all day" is offered;
 * - range:        whether an end time is asked for;
 * - min_time / max_time: only which hours the calendar shows. Never a reason to refuse.
 */

/** First and last value the form's date pickers accept, as input values. */
export function inputLimits(type: ScheduleTypeOption | null, allDay: boolean, pastAllowed: boolean) {
  const asInput = (value: string | null | undefined) => (value ? (allDay ? toInputDate(value) : toInputDateTime(value)) : undefined)

  let min = asInput(type?.start)
  if (!pastAllowed) {
    const today = toInputDate(new Date().toISOString())
    const todayInput = allDay ? today : `${today}T00:00`
    if (!min || min < todayInput) min = todayInput
  }

  return { min, max: asInput(type?.end) }
}

/** "a partir de 1 nov 2026 · até 31 dez 2026 · precisa de hora de fim" (the type's hours are not a rule). */
export function rulesSummary(type: ScheduleTypeOption | null): string {
  if (!type) return ''
  const parts: string[] = []
  if (type.start) parts.push(t('schedule.rulesFrom', { date: formatServerDateTime(type.start, { dateStyle: 'medium' }) }))
  if (type.end) parts.push(t('schedule.rulesUntil', { date: formatServerDateTime(type.end, { dateStyle: 'medium' }) }))
  if (type.range) parts.push(t('schedule.rulesNeedsEnd'))
  return parts.join(' · ')
}

/** A sensible time to start with when only a day was picked: when the type's calendar starts. */
export function defaultStartTime(type: ScheduleTypeOption | null): string {
  return type?.min_time && type.min_time !== '24:00' ? type.min_time : '09:00'
}

// ---- calendar hours (display only)

export interface CalendarHours {
  /** "HH:mm:ss", null = no limit */
  min: string | null
  max: string | null
}

const HOURS_KEY = 'calendarHours'

/** Last known hours, so the calendar looks the same offline. */
export function savedCalendarHours(): CalendarHours | null {
  try {
    const raw = localStorage.getItem(HOURS_KEY)
    return raw ? (JSON.parse(raw) as CalendarHours) : null
  } catch {
    return null
  }
}

/**
 * Hours the agenda shows: from the earliest to the latest of the active types (the admin panel's
 * central calendar uses the same). Falls back to the saved ones, then to the whole day.
 */
export async function loadCalendarHours(): Promise<CalendarHours> {
  try {
    const response = await axiosInstance.get('/admin/schedules/calendar-options')
    const hours: CalendarHours = response.data.data.hours
    try {
      localStorage.setItem(HOURS_KEY, JSON.stringify(hours))
    } catch {
      /* storage unavailable */
    }
    return hours
  } catch {
    return savedCalendarHours() ?? { min: null, max: null }
  }
}
