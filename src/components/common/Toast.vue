<template>
  <div :role="toast.type === 'error' ? 'alert' : 'status'"
    :class="['pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border-l-4 bg-white shadow-lg ring-1 ring-black/5 dark:bg-slate-800 dark:ring-white/10', accents[toast.type]]">
    <div class="p-4">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <component :is="icons[toast.type]" :class="['h-6 w-6', iconColors[toast.type]]" aria-hidden="true" />
        </div>
        <div class="ml-3 w-0 flex-1 pt-0.5">
          <p v-if="toast.title" class="text-sm font-semibold text-slate-900 dark:text-white">{{ toast.title }}</p>
          <p :class="['text-sm', toast.title ? 'mt-1 text-slate-600 dark:text-slate-300' : 'font-medium text-slate-900 dark:text-white']">
            {{ toast.message }}
          </p>
        </div>
        <div class="ml-4 flex flex-shrink-0">
          <button type="button" @click="emit('close')"
            class="inline-flex rounded-md text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:text-slate-500 dark:hover:text-slate-400 dark:focus:ring-offset-slate-800">
            <span class="sr-only">{{ t('common.close') }}</span>
            <XMarkIcon class="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { XMarkIcon } from '@heroicons/vue/20/solid'
import type { Toast, ToastType } from '@/stores/toast'
import { t } from '../../i18n'

defineProps<{
  toast: Toast
}>()

const emit = defineEmits(['close'])

const icons = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon
}

const iconColors: Record<ToastType, string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500'
}

const accents: Record<ToastType, string> = {
  success: 'border-green-500',
  error: 'border-red-500',
  warning: 'border-amber-500',
  info: 'border-blue-500'
}
</script>
