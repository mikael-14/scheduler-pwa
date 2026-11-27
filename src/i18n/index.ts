import { ref } from 'vue'
import { messages, SUPPORTED_LOCALES, type Locale } from './messages'

const STORAGE_KEY = 'language'
const DEFAULT_LOCALE: Locale = 'pt'

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as string[]).includes(value)
}

function readStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isLocale(stored)) return stored
  } catch {
    /* storage unavailable */
  }
  // Portuguese by default, regardless of the browser language
  return DEFAULT_LOCALE
}

// Set while the language was picked with the header switch: this device keeps it over the
// profile language until the user signs out (the profile language is for notifications and email)
const DEVICE_CHOICE_KEY = 'languageChosenOnDevice'

function hasDeviceChoice(): boolean {
  try {
    return localStorage.getItem(DEVICE_CHOICE_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * The language in use. Guests get the last one they used (default Portuguese); once a user
 * is signed in, their profile language replaces it, unless this device picked its own.
 */
export const locale = ref<Locale>(readStoredLocale())

if (typeof document !== 'undefined') {
  document.documentElement.lang = locale.value
}

export function setLocale(next: unknown): void {
  if (!isLocale(next)) return

  locale.value = next
  if (typeof document !== 'undefined') {
    document.documentElement.lang = next
  }
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    /* ignore */
  }
}

/** The header switch: only this device, kept until sign-out; the profile is not changed. */
export function chooseDeviceLocale(next: unknown): void {
  if (!isLocale(next)) return
  setLocale(next)
  try {
    localStorage.setItem(DEVICE_CHOICE_KEY, '1')
  } catch {
    /* ignore */
  }
}

/** The signed-in user's profile language: applied unless this device picked its own. */
export function applyProfileLocale(next: unknown): void {
  if (!hasDeviceChoice()) setLocale(next)
}

/** Sign-in, sign-out or a language saved on the profile: the profile language applies again. */
export function forgetDeviceLocale(): void {
  try {
    localStorage.removeItem(DEVICE_CHOICE_KEY)
  } catch {
    /* ignore */
  }
}

/** Translate a key. Reads `locale`, so templates re-render when the language changes. */
export function t(key: string, params: Record<string, string | number> = {}): string {
  const template = messages[locale.value][key] ?? messages.en[key] ?? key

  return template.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`))
}

/** Locale tag for Intl / FullCalendar. */
export function intlLocale(): string {
  return locale.value === 'pt' ? 'pt-PT' : 'en-US'
}

export function useI18n() {
  return { t, locale, setLocale, chooseDeviceLocale, intlLocale }
}
