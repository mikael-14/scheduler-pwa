/** A loaded schedule, as the phone views (week planner, month with dots) draw it. */
export interface DayEvent {
  id: string
  title: string
  /** FullCalendar's startStr/endStr: ISO strings already in the calendar's timezone. */
  start: string
  end: string
  allDay: boolean
  status?: string
  typeColor?: string
}

/** A schedule on one day: its start time there ("…" when it started on an earlier day). */
export type DayEntry = DayEvent & { time: string }

/** "YYYY-MM-DD" plus some days. Plain UTC arithmetic: these are calendar days, not moments. */
export function addDays(day: string, amount: number): string {
  const date = new Date(`${day}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}

/** A calendar day ("YYYY-MM-DD") as a Date to format with timeZone 'UTC'. */
export function dayToDate(day: string): Date {
  return new Date(`${day}T00:00:00Z`)
}

/** The last day an event covers (all-day ends are exclusive; a timed end at 00:00 is the day before). */
function lastDay(event: DayEvent): string {
  const start = event.start.slice(0, 10)
  if (!event.end) return start
  const end = event.end.slice(0, 10)
  if (end <= start) return start
  return event.allDay || event.end.slice(11, 16) === '00:00' ? addDays(end, -1) : end
}

/** The schedules on a day, all-day first, then by time. */
export function eventsOnDay(events: DayEvent[], day: string): DayEntry[] {
  return events
    .filter((event) => event.start.slice(0, 10) <= day && day <= lastDay(event))
    .sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.start.localeCompare(b.start))
    .map((event) => ({ ...event, time: event.start.slice(0, 10) === day ? event.start.slice(11, 16) : '…' }))
}
