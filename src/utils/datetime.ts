/// <reference types="vite/client" />
import { intlLocale } from '../i18n'

/**
 * Schedule times are "shelter time": the API reads a time without a timezone in its own
 * timezone (config app.timezone), and the admin panel shows them in it too. The app does the
 * same, so a 10:00 slot is 10:00 everywhere, whatever the phone's timezone.
 *
 * Keep VITE_SERVER_TIMEZONE equal to the API's APP_TIMEZONE (default Europe/Lisbon in both).
 */
export const SERVER_TIMEZONE: string = import.meta.env.VITE_SERVER_TIMEZONE || 'Europe/Lisbon'

/** FullCalendar shows the server's timezone through its Luxon plugin (see Calendar.vue). */
export const CALENDAR_TIMEZONE = SERVER_TIMEZONE


/** The date and time parts of a moment, as seen in the server's timezone. */
function serverParts(value: string | Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: SERVER_TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(value))

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '00'

  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` }
}

/** API value → `<input type="datetime-local">` value. */
export function toInputDateTime(value: string | null | undefined): string {
  if (!value) return ''
  const { date, time } = serverParts(value)
  return `${date}T${time}`
}

/** API value → `<input type="date">` value. */
export function toInputDate(value: string | null | undefined): string {
  return value ? serverParts(value).date : ''
}

/** Input value (date or datetime-local) → what the API expects ("YYYY-MM-DD HH:mm", server time). */
export function toApiDateTime(input: string, allDay = false): string {
  if (!input) return ''
  const [date, time = '00:00'] = input.split('T')
  return allDay ? `${date} 00:00` : `${date} ${time.slice(0, 5)}`
}

/** A moment (e.g. the slot tapped in the calendar) → input value, in server time. */
export function dateToInput(date: Date, withTime = true): string {
  const { date: day, time } = serverParts(date)
  return withTime ? `${day}T${time}` : day
}

/** Show a schedule time, in server time and the app's language. */
export function formatServerDateTime(value: string | Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(intlLocale(), { ...options, timeZone: SERVER_TIMEZONE }).format(new Date(value))
}

/** "15 out 2026 · 10:00 – 12:00" style period of a schedule. */
export function formatPeriod(start: string, end: string | null, allDay: boolean, allDayLabel: string): string {
  const day = (value: string) => formatServerDateTime(value, { dateStyle: 'medium' })
  const time = (value: string) => formatServerDateTime(value, { timeStyle: 'short' })
  const sameDay = end ? serverParts(start).date === serverParts(end).date : true

  if (allDay) {
    return end && !sameDay ? `${day(start)} – ${day(end)} · ${allDayLabel}` : `${day(start)} · ${allDayLabel}`
  }
  if (!end) return `${day(start)} ${time(start)}`

  return sameDay
    ? `${day(start)} · ${time(start)} – ${time(end)}`
    : `${day(start)} ${time(start)} – ${day(end)} ${time(end)}`
}
