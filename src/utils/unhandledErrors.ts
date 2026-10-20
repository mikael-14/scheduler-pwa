import type { App } from 'vue'
import { isAxiosError } from 'axios'
import { t } from '../i18n'
import { useToastStore } from '../stores/toast'
import { apiErrorMessage } from './apiError'

/**
 * Safety net: a failed API call that no screen handled still tells the user, in a toast.
 * Screens normally catch their own errors (with a message that fits what they were doing),
 * so only what slips through ends up here, and nothing is shown twice.
 */
function report(error: unknown) {
  console.error(error)

  if (!isAxiosError(error)) return

  // the session itself was refused: the API client already sends the user to the right page
  const status = error.response?.status
  const code = (error.response?.data as { code?: string } | undefined)?.code
  if (status === 401 || code === 'account_inactive' || code === 'account_pending') return

  useToastStore().error(apiErrorMessage(error, t('errors.generic')))
}

export function reportUnhandledErrors(app: App) {
  app.config.errorHandler = (error) => report(error)
  window.addEventListener('unhandledrejection', (event) => report(event.reason))
}
