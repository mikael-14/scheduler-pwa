import { t } from '../i18n'

/** No answer at all: offline, bad connection, timeout, server unreachable. */
export function isNetworkError(error: any): boolean {
  return !!error?.isAxiosError && !error.response
}

/**
 * The first human readable message of an API error. The API already answers in the
 * user's language (Accept-Language / profile), so prefer its text over a local fallback.
 * Connection problems and server crashes get a message of their own: they say nothing
 * about the user's data or session.
 */
export function apiErrorMessage(error: any, fallback: string): string {
  if (isNetworkError(error)) {
    return t('errors.network')
  }

  const status = error?.response?.status
  if (typeof status === 'number' && status >= 500) {
    return t('errors.server')
  }

  const data = error?.response?.data

  if (data?.errors && typeof data.errors === 'object') {
    const first = Object.values(data.errors).flat()[0]
    if (typeof first === 'string') return first
  }

  if (typeof data?.message === 'string' && data.message) {
    return data.message
  }

  return fallback
}
