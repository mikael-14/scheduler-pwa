import { notificationsApi } from '../api/notifications'
import { t } from '../i18n'
import { apiErrorMessage } from './apiError'

/**
 * - unsupported: no service worker / Push API / Notification in this browser;
 * - denied:      the person (or the phone's settings for the browser) blocked notifications;
 * - no-key:      the API has no VAPID public key configured;
 * - no-worker:   the app's service worker is not running (so nothing can receive a push);
 * - subscribe:   the browser's push service refused (e.g. Google Play services missing or blocked).
 */
export type PushFailure = 'unsupported' | 'denied' | 'no-key' | 'no-worker' | 'subscribe'

export class PushError extends Error {
  constructor(public reason: PushFailure, public detail = '') {
    super(detail ? `${reason}: ${detail}` : reason)
  }
}

/** The browser's own wording of an error, to show next to ours (helps tell what went wrong). */
function describe(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error)
}

/** `navigator.serviceWorker.ready` never settles without a service worker: give up after a while. */
async function serviceWorkerReady(timeoutMs = 10000): Promise<ServiceWorkerRegistration> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new PushError('no-worker')), timeoutMs)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

export function pushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export type PushPermission = NotificationPermission | 'unsupported'

/**
 * The browser's notification permission for this site:
 * - default: never answered, or the prompt was closed: the app may ask again;
 * - denied:  blocked; the browser no longer shows the prompt, only its own settings can undo it;
 * - granted: allowed; subscribing needs no prompt.
 */
export function pushPermission(): PushPermission {
  return pushSupported() ? Notification.permission : 'unsupported'
}

/** Call `callback` when the person changes the permission in the browser settings. */
export async function onPushPermissionChange(callback: () => void): Promise<void> {
  try {
    const status = await navigator.permissions?.query({ name: 'notifications' as PermissionName })
    if (status) status.onchange = callback
  } catch {
    // not available in every browser: the app also checks again when it comes back on screen
  }
}

/**
 * Permission already granted and push wanted, but this device lost its subscription (site data
 * cleared, browser reinstalled…): subscribe again, quietly. Resolves to true when it did.
 */
export async function restoreDevicePush(): Promise<boolean> {
  if (pushPermission() !== 'granted' || (await hasDeviceSubscription())) return false
  try {
    await enableDevicePush() // no prompt: the permission is already there
    return true
  } catch (error) {
    console.warn('Could not restore the push subscription.', error)
    return false
  }
}

/**
 * The message for a failed "turn on push": what went wrong, in the person's words, plus the
 * browser's own error when there is one. Not for 'denied' (that one gets the unblock help).
 */
export function pushErrorMessage(error: unknown): string {
  // the API calls (key, registering the subscription) failed
  if (!(error instanceof PushError)) return apiErrorMessage(error, t('push.errorSubscribe'))
  const key = {
    unsupported: 'settings.pushUnsupported',
    denied: 'settings.pushDenied',
    'no-key': 'push.errorNoKey',
    'no-worker': 'push.errorNoWorker',
    subscribe: 'push.errorSubscribe',
  }[error.reason]
  return error.detail ? `${t(key)} (${error.detail})` : t(key)
}

/** Where to unblock notifications, for the device in hand. */
export function unblockInstructionsKey(): string {
  const agent = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(agent)) return 'push.unblockIos'
  if (/Android/.test(agent)) return 'push.unblockAndroid'
  return 'push.unblockDesktop'
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))

  return Uint8Array.from(raw, (char) => char.charCodeAt(0))
}

/** Whether this browser/device currently holds a push subscription. */
export async function hasDeviceSubscription(): Promise<boolean> {
  if (!pushSupported()) return false

  try {
    const registration = await navigator.serviceWorker.ready
    return !!(await registration.pushManager.getSubscription())
  } catch {
    return false
  }
}

/** Ask permission, subscribe this device and register the subscription with the API. */
export async function enableDevicePush(): Promise<void> {
  if (!pushSupported()) throw new PushError('unsupported')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new PushError('denied')

  const key = await notificationsApi.vapidPublicKey()
  if (!key) throw new PushError('no-key')

  const registration = await serviceWorkerReady()
  let subscription: PushSubscription
  try {
    subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      }))
  } catch (error) {
    // NotAllowedError here = notifications off for the browser in the phone's settings
    if (error instanceof DOMException && error.name === 'NotAllowedError') throw new PushError('denied', describe(error))
    console.warn('Push subscription failed.', error)
    throw new PushError('subscribe', describe(error))
  }

  const json = subscription.toJSON()
  await notificationsApi.subscribe({
    endpoint: json.endpoint as string,
    keys: json.keys as { p256dh: string; auth: string },
  })
}

/** Remove this device's subscription from the browser and from the API. */
export async function disableDevicePush(): Promise<void> {
  if (!pushSupported()) return

  // not `ready`, which never resolves when no service worker is registered (e.g. dev) and would hang logout
  const registration = await navigator.serviceWorker.getRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return

  try {
    await notificationsApi.unsubscribe(subscription.endpoint)
  } finally {
    await subscription.unsubscribe()
  }
}
