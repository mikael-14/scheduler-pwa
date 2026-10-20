<template>
  <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
    leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0">
    <div v-if="dialog" class="fixed inset-0 z-[110] flex items-end justify-center p-4 sm:items-center"
      @keydown.esc="store.cancel()">
      <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="store.cancel()"></div>

      <!-- a bottom sheet on phones, a centred card from sm up -->
      <form role="alertdialog" aria-modal="true" :aria-labelledby="titleId" :aria-describedby="dialog.message ? bodyId : undefined"
        @submit.prevent="store.submit()"
        class="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5 dark:bg-slate-800 dark:ring-white/10">
        <div class="flex items-start gap-4">
          <div :class="['flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full', tones[tone].badge]">
            <component :is="tones[tone].icon" :class="['h-6 w-6', tones[tone].iconColor]" aria-hidden="true" />
          </div>
          <div class="min-w-0 flex-1">
            <h3 :id="titleId" class="text-base font-semibold text-slate-900 dark:text-white">{{ dialog.title }}</h3>
            <p v-if="dialog.message" :id="bodyId" class="mt-2 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">
              {{ dialog.message }}
            </p>
          </div>
        </div>

        <label v-if="dialog.field" class="mt-5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {{ dialog.field.label }}
          <input v-if="dialog.field.rows === 1" ref="fieldInput" v-model="dialog.value" type="text"
            :maxlength="dialog.field.maxLength" :placeholder="dialog.field.placeholder" :disabled="dialog.busy"
            :class="fieldClass" />
          <textarea v-else ref="fieldInput" v-model="dialog.value" :rows="dialog.field.rows ?? 3"
            :maxlength="dialog.field.maxLength" :placeholder="dialog.field.placeholder" :disabled="dialog.busy"
            @keydown.enter.ctrl.prevent="store.submit()" @keydown.enter.meta.prevent="store.submit()"
            :class="fieldClass"></textarea>
          <span class="mt-1 flex justify-between gap-2 text-xs font-normal text-slate-500 dark:text-slate-400">
            <span>{{ dialog.field.help }}</span>
            <span v-if="dialog.field.maxLength">{{ dialog.value.length }}/{{ dialog.field.maxLength }}</span>
          </span>
        </label>

        <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button v-if="dialog.kind !== 'alert'" type="button" @click="store.cancel()" :disabled="dialog.busy"
            class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">
            {{ dialog.cancelLabel ?? t('common.cancel') }}
          </button>
          <button ref="confirmButton" type="submit" :disabled="dialog.busy"
            :class="['inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 dark:focus:ring-offset-slate-800', tones[tone].button]">
            <ArrowPathIcon v-if="dialog.busy" class="h-4 w-4 animate-spin" aria-hidden="true" />
            {{ dialog.confirmLabel ?? t('common.ok') }}
          </button>
        </div>
      </form>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'
import { t } from '../../i18n'
import { useDialogStore, type DialogTone } from '../../stores/dialog'

/** Renders the dialog store's alert / confirm / prompt. Mounted once, in App.vue. */
const store = useDialogStore()
const dialog = computed(() => store.current)
const tone = computed<DialogTone>(() => dialog.value?.tone ?? 'info')
const confirmButton = ref<HTMLButtonElement | null>(null)
const fieldInput = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)
const titleId = 'app-dialog-title'
const bodyId = 'app-dialog-body'

const fieldClass = 'mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white'

const tones = {
  info: { icon: InformationCircleIcon, badge: 'bg-blue-100 dark:bg-blue-500/20', iconColor: 'text-blue-600 dark:text-blue-400', button: 'bg-primary-600 hover:bg-primary-500 focus:ring-primary-500' },
  success: { icon: CheckCircleIcon, badge: 'bg-green-100 dark:bg-green-500/20', iconColor: 'text-green-600 dark:text-green-400', button: 'bg-primary-600 hover:bg-primary-500 focus:ring-primary-500' },
  warning: { icon: ExclamationTriangleIcon, badge: 'bg-amber-100 dark:bg-amber-500/20', iconColor: 'text-amber-600 dark:text-amber-400', button: 'bg-amber-600 hover:bg-amber-500 focus:ring-amber-500' },
  danger: { icon: ExclamationTriangleIcon, badge: 'bg-red-100 dark:bg-red-500/20', iconColor: 'text-red-600 dark:text-red-400', button: 'bg-red-600 hover:bg-red-500 focus:ring-red-500' },
}

// Focus the text field, or the main button, so typing / Enter / Esc work at once
watch(() => store.current, async (value, previous) => {
  if (value && value !== previous) {
    await nextTick()
    ;(fieldInput.value ?? confirmButton.value)?.focus()
  }
})
</script>
