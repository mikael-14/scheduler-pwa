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

/**
 * The language in use. Guests get the last one they used (default Portuguese);
 * once a user is signed in, their profile language replaces it (see the auth store).
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
  return { t, locale, setLocale, intlLocale }
}
