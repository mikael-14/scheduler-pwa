import { computed, ref } from 'vue'

/**
 * "Add to the phone" (install the PWA).
 *
 * - Chrome / Edge / Samsung Internet (Android and desktop) fire `beforeinstallprompt` once the
 *   app is installable; it is kept here so a button can open the browser's install dialog later
 *   (the browser only allows it from a tap).
 * - iPhone / iPad (Safari) have no such event: the app can only explain "Share → Add to Home Screen".
 * - Other mobile browsers (e.g. Firefox on Android) install from their own menu: same, instructions.
 * - Already running as the installed app: nothing to offer.
 *
 * `listenForInstall()` must run at start-up (main.ts), before the event can fire.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
const installed = ref(false)

const agent = typeof navigator !== 'undefined' ? navigator.userAgent : ''
// iPadOS presents itself as a Mac, but with a touch screen
const ios = /iPhone|iPad|iPod/.test(agent) || (/Macintosh/.test(agent) && (navigator.maxTouchPoints ?? 0) > 1)
const mobile = ios || /Android|Mobi/i.test(agent)

/** Running as the installed app (home screen icon), not in a browser tab. */
export function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: fullscreen)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function listenForInstall() {
  installed.value = isStandalone()

  window.addEventListener('beforeinstallprompt', (event) => {
    // keep the browser's own mini-bar from showing: the app offers its button instead
    event.preventDefault()
    deferredPrompt.value = event as BeforeInstallPromptEvent
  })

  window.addEventListener('appinstalled', () => {
    installed.value = true
    deferredPrompt.value = null
  })
}

/**
 * How this device installs: 'prompt' (the browser's dialog), 'ios' / 'menu' (instructions),
 * or null when there is nothing to offer (already installed, or a desktop browser that cannot).
 */
export const installMode = computed<'prompt' | 'ios' | 'menu' | null>(() => {
  if (installed.value) return null
  if (deferredPrompt.value) return 'prompt'
  if (ios) return 'ios'
  if (mobile) return 'menu'
  return null
})

/** Opens the browser's install dialog. Resolves to true when the user accepted. */
export async function promptInstall(): Promise<boolean> {
  const event = deferredPrompt.value
  if (!event) return false

  // the event can be used only once
  deferredPrompt.value = null
  await event.prompt()
  const { outcome } = await event.userChoice
  if (outcome === 'accepted') installed.value = true
  return outcome === 'accepted'
}
