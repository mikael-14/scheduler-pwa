import axiosInstance from '../config/axios'
import { t } from '../i18n'
import type { ScheduleStatus, ScheduleTypeOption } from '../api/schedules'
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

/**
 * "a partir de 1 nov 2026, 09:00 · até 31 dez 2026, 18:00" (the type's hours are not a rule;
 * needing an end goes without saying: the form asks for it).
 */
export function rulesSummary(type: ScheduleTypeOption | null): string {
  if (!type) return ''
  const when = (value: string) => formatServerDateTime(value, { dateStyle: 'medium', timeStyle: 'short' })
  const parts: string[] = []
  if (type.start) parts.push(t('schedule.rulesFrom', { date: when(type.start) }))
  if (type.end) parts.push(t('schedule.rulesUntil', { date: when(type.end) }))
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
 * What the calendar needs (GET /schedules/calendar-options): the hours it shows, from the earliest
 * to the latest of the active types (the admin panel's central calendar uses the same), and the
 * choices of its filters. Falls back to the saved ones, then to the whole day and no choices.
 */
export async function loadCalendarOptions(): Promise<{ hours: CalendarHours; filters: CalendarFilterOptions }> {
  try {
    const response = await axiosInstance.get('/admin/schedules/calendar-options')
    const { hours, filters } = response.data.data as { hours: CalendarHours; filters: CalendarFilterOptions }
    try {
      localStorage.setItem(HOURS_KEY, JSON.stringify(hours))
      localStorage.setItem(FILTER_OPTIONS_KEY, JSON.stringify(filters))
    } catch {
      /* storage unavailable */
    }
    return { hours, filters }
  } catch {
    return {
      hours: savedCalendarHours() ?? { min: null, max: null },
      filters: savedCalendarFilterOptions() ?? NO_FILTER_OPTIONS,
    }
  }
}

// ---- the calendar's filter choices

export interface CalendarFilterOptions {
  /** every type; `active` false: no new schedules, older ones remain */
  types: { id: number; name: string; color: string | null; active: boolean }[]
  /** `everyone` false: only one's own schedules can be seen with it */
  statuses: { value: ScheduleStatus; label: string; everyone: boolean }[]
  people: { id: number; name: string; avatar_url?: string | null }[]
}

const FILTER_OPTIONS_KEY = 'calendarFilterOptions'
export const NO_FILTER_OPTIONS: CalendarFilterOptions = { types: [], statuses: [], people: [] }

/** Last known filter choices, so the filters work offline too. */
export function savedCalendarFilterOptions(): CalendarFilterOptions | null {
  try {
    const raw = localStorage.getItem(FILTER_OPTIONS_KEY)
    return raw ? (JSON.parse(raw) as CalendarFilterOptions) : null
  } catch {
    return null
  }
}
