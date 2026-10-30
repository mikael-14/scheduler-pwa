import { ref } from 'vue'

const STORAGE_KEY = 'calendar_views'

/** Every view of the agenda, in the order of its buttons. */
export const CALENDAR_VIEWS = [
  { name: 'dayGridMonth', label: 'calendar.month' },
  { name: 'timeGridWeek', label: 'calendar.week' },
  { name: 'timeGridDay', label: 'calendar.day' },
  { name: 'monthDots', label: 'calendar.compactMonth' },
  { name: 'weekPlanner', label: 'calendar.planner' },
  { name: 'listWeek', label: 'calendar.list' },
] as const

export type CalendarView = (typeof CALENDAR_VIEWS)[number]['name']

export type CalendarViewSettings = {
  /** the views with a button, in CALENDAR_VIEWS order; never empty */
  visible: CalendarView[]
  /** the view the agenda opens on: one of the visible */
  initial: CalendarView
}

const DEFAULTS: CalendarViewSettings = {
  visible: ['dayGridMonth', 'timeGridDay', 'weekPlanner', 'listWeek'],
  initial: 'weekPlanner',
}

const isView = (value: unknown): value is CalendarView =>
  CALENDAR_VIEWS.some((view) => view.name === value)

/** Keeps the settings coherent: known views, in button order, at least one, opening on a visible one. */
function normalize(settings: { visible?: unknown; initial?: unknown }): CalendarViewSettings {
  const chosen = Array.isArray(settings.visible) ? settings.visible.filter(isView) : []
  const visible = CALENDAR_VIEWS.map((view) => view.name).filter((name) => chosen.includes(name))
  if (!visible.length) return { ...DEFAULTS, visible: [...DEFAULTS.visible] }

  const initial = isView(settings.initial) && visible.includes(settings.initial) ? settings.initial : visible[0]
  return { visible, initial }
}

function readStored(): CalendarViewSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return normalize(JSON.parse(raw))
  } catch {
    /* storage unavailable or unreadable: the defaults */
  }
  return normalize(DEFAULTS)
}

/** Which agenda views this device shows, and which it opens on (kept on the device, not the account). */
export const calendarViewSettings = ref<CalendarViewSettings>(readStored())

export function saveCalendarViewSettings(next: { visible: CalendarView[]; initial: CalendarView }): void {
  calendarViewSettings.value = normalize(next)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(calendarViewSettings.value))
  } catch {
    /* ignore */
  }
}

/** Shows or hides a view; the last visible one can't be hidden, and hiding the opening view moves it. */
export function toggleCalendarView(name: CalendarView): void {
  const { visible, initial } = calendarViewSettings.value
  if (visible.includes(name)) {
    if (visible.length === 1) return
    saveCalendarViewSettings({ visible: visible.filter((view) => view !== name), initial })
  } else {
    saveCalendarViewSettings({ visible: [...visible, name], initial })
  }
}

export function setInitialCalendarView(name: CalendarView): void {
  saveCalendarViewSettings({ ...calendarViewSettings.value, initial: name })
}
