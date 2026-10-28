import type { ScheduleStatus } from '../api/schedules'
import type { CalendarFilterOptions } from './scheduleRules'

/**
 * The calendar's filters. Empty = everything the person may see. They are kept on this device,
 * per account, until cleared: the filter button's number always says how many are on.
 */
export interface CalendarFilters {
  /** schedules I own or take part in */
  mine: boolean
  types: number[]
  statuses: ScheduleStatus[]
  /** user ids: schedules they own or take part in */
  people: number[]
}

export const noFilters = (): CalendarFilters => ({ mine: false, types: [], statuses: [], people: [] })

const storageKey = (userId: number | undefined) => `calendarFilters:${userId ?? 'guest'}`

export function savedCalendarFilters(userId: number | undefined): CalendarFilters {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    return raw ? { ...noFilters(), ...(JSON.parse(raw) as Partial<CalendarFilters>) } : noFilters()
  } catch {
    return noFilters()
  }
}

export function saveCalendarFilters(userId: number | undefined, filters: CalendarFilters) {
  try {
    if (activeFilterCount(filters)) localStorage.setItem(storageKey(userId), JSON.stringify(filters))
    else localStorage.removeItem(storageKey(userId))
  } catch {
    /* storage unavailable: they last until the app closes */
  }
}

/** One for "only mine" and one for each type, status and person chosen. */
export function activeFilterCount(filters: CalendarFilters): number {
  return (filters.mine ? 1 : 0) + filters.types.length + filters.statuses.length + filters.people.length
}

/** Without the choices that no longer exist (a type or person removed since they were saved). */
export function withKnownChoices(filters: CalendarFilters, options: CalendarFilterOptions): CalendarFilters {
  // choices not loaded yet (first visit offline): keep them as they are
  if (!options.types.length && !options.statuses.length && !options.people.length) return filters

  const typeIds = new Set(options.types.map((type) => type.id))
  const statuses = new Set(options.statuses.map((status) => status.value))
  const peopleIds = new Set(options.people.map((person) => person.id))

  return {
    mine: filters.mine,
    types: filters.types.filter((id) => typeIds.has(id)),
    statuses: filters.statuses.filter((status) => statuses.has(status)),
    people: filters.people.filter((id) => peopleIds.has(id)),
  }
}
