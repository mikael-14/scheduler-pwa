import { defineStore } from 'pinia'
import { ref } from 'vue'

export type DialogTone = 'info' | 'success' | 'warning' | 'danger'

/** A text field in the dialog (prompt). */
export interface DialogField {
  label: string
  help?: string
  placeholder?: string
  maxLength?: number
  /** textarea rows; 1 gives a single-line input */
  rows?: number
  value?: string
}

export interface DialogOptions {
  title: string
  message?: string
  tone?: DialogTone
  /** button labels; default OK / Cancel in the current language */
  confirmLabel?: string
  cancelLabel?: string
  field?: DialogField
  /**
   * Work to do when the user confirms (e.g. the API call). The dialog stays open and busy
   * meanwhile; if it throws, the dialog stays open so the user can retry or cancel without
   * losing what they typed. Show the error yourself (e.g. a toast).
   */
  onConfirm?: (value: string) => unknown | Promise<unknown>
}

interface OpenDialog extends DialogOptions {
  kind: 'alert' | 'confirm' | 'prompt'
  value: string
  busy: boolean
  resolve: (value: string | null) => void
}

/**
 * The generic replacement for alert(), confirm() and prompt(), rendered by AppDialog (mounted
 * once in App.vue). They return promises, so the calling code reads like the native ones:
 *
 *   const dialog = useDialogStore()
 *   await dialog.alert({ title: t('x.done') })
 *   if (await dialog.confirm({ title: t('x.deleteTitle'), message: t('x.deleteBody'), tone: 'danger' })) { ... }
 *   const reason = await dialog.prompt({ title: t('x.why'), field: { label: t('x.reason') } }) // null = cancelled
 */
export const useDialogStore = defineStore('dialog', () => {
  const current = ref<OpenDialog | null>(null)

  function open(kind: OpenDialog['kind'], options: DialogOptions): Promise<string | null> {
    // a new dialog cancels the one still open
    current.value?.resolve(null)

    return new Promise((resolve) => {
      current.value = { ...options, kind, value: options.field?.value ?? '', busy: false, resolve }
    })
  }

  function close(result: string | null) {
    const dialog = current.value
    current.value = null
    dialog?.resolve(result)
  }

  async function submit() {
    const dialog = current.value
    if (!dialog || dialog.busy) return

    if (dialog.onConfirm) {
      dialog.busy = true
      try {
        await dialog.onConfirm(dialog.value.trim())
      } catch {
        dialog.busy = false
        return
      }
    }

    close(dialog.value.trim())
  }

  function cancel() {
    if (!current.value || current.value.busy) return
    // an alert has nothing to refuse: closing it is reading it
    if (current.value.kind === 'alert') return submit()
    close(null)
  }

  return {
    current,
    submit,
    cancel,
    alert: (options: DialogOptions) => open('alert', options).then(() => undefined),
    confirm: (options: DialogOptions) => open('confirm', options).then((value) => value !== null),
    prompt: (options: DialogOptions & { field: DialogField }) => open('prompt', options),
  }
})
