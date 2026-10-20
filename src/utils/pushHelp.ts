import { t } from '../i18n'
import type { useDialogStore } from '../stores/dialog'
import { unblockInstructionsKey } from './push'

/**
 * Notifications blocked in the browser: the app cannot show the permission prompt again, so it
 * explains where to allow them, for this kind of device.
 */
export function showUnblockHelp(dialog: ReturnType<typeof useDialogStore>) {
  return dialog.alert({
    title: t('push.unblockTitle'),
    message: `${t(unblockInstructionsKey())}\n\n${t('push.unblockAfter')}`,
    tone: 'info',
  })
}
