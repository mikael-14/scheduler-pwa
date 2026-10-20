import { notificationsApi } from '../api/notifications'

export type PushFailure = 'unsupported' | 'denied' | 'no-key'

export class PushError extends Error {
  constructor(public reason: PushFailure) {
    super(reason)
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

  const registration = await navigator.serviceWorker.ready
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
    }))

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
