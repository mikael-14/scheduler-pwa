import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: number
  message: string
  type: ToastType
  title?: string
  duration?: number
}

export interface ToastOptions {
  title?: string
  /** ms before it closes by itself; 0 keeps it until closed */
  duration?: number
}

const DEFAULT_DURATION = 5000

/**
 * Short, non-blocking messages ("Saved", "No connection…"). The generic replacement for
 * alert(); for something the user must read or answer, use the dialog store instead.
 *
 *   const toast = useToastStore()
 *   toast.success(t('profile.saved'))
 *   toast.error(apiErrorMessage(error, t('x.failed')), { title: t('x.title') })
 */
export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])
  const timers = new Map<number, ReturnType<typeof setTimeout>>()
  let nextId = 0

  function schedule(id: number, duration: number) {
    clearTimeout(timers.get(id))
    if (duration > 0) {
      timers.set(id, setTimeout(() => removeToast(id), duration))
    }
  }

  function addToast(message: string, type: ToastType = 'info', duration: number = DEFAULT_DURATION, title?: string) {
    // The same message again (e.g. several requests failing offline) restarts the visible one
    const same = toasts.value.find((toast) => toast.message === message && toast.type === type && toast.title === title)
    if (same) {
      schedule(same.id, duration)
      return same.id
    }

    const id = nextId++
    toasts.value.push({ id, message, type, title, duration })
    schedule(id, duration)

    return id
  }

  function removeToast(id: number) {
    clearTimeout(timers.get(id))
    timers.delete(id)
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  const show = (type: ToastType) => (message: string, options: ToastOptions = {}) =>
    addToast(message, type, options.duration ?? DEFAULT_DURATION, options.title)

  return {
    toasts,
    addToast,
    removeToast,
    success: show('success'),
    error: show('error'),
    warning: show('warning'),
    info: show('info'),
  }
})
