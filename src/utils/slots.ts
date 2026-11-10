import { t } from '../i18n'

/** "2 of 5 people" (a slot with a maximum) or "2 people". */
export function slotPeople(people: number, capacity: number | null): string {
  if (capacity !== null) return t('slots.peopleOf', { people, capacity })
  return people === 1 ? t('slots.onePerson') : t('slots.people', { count: people })
}
