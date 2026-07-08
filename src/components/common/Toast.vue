<template>
  <div
    :class="[
      'pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-slate-800 dark:ring-white/10',
      'transform transition-all duration-300 ease-in-out',
      visible
        ? 'translate-x-0 opacity-100 sm:translate-y-0'
        : 'translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-full'
    ]"
  >
    <div class="p-4">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <component :is="icons[toast.type]" :class="['h-6 w-6', iconColors[toast.type]]" aria-hidden="true" />
        </div>
        <div class="ml-3 w-0 flex-1 pt-0.5">
          <p class="text-sm font-medium text-slate-900 dark:text-white">{{ toast.message }}</p>
        </div>
        <div class="ml-4 flex flex-shrink-0">
          <button
            type="button"
            @click="close"
            class="inline-flex rounded-md bg-white text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-slate-800 dark:text-slate-500 dark:hover:text-slate-400"
          >
            <span class="sr-only">Close</span>
            <XMarkIcon class="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { XMarkIcon } from '@heroicons/vue/20/solid'
import type { Toast, ToastType } from '@/stores/toast'

const props = defineProps<{
  toast: Toast
}>()

const emit = defineEmits(['close'])

const visible = ref(false)

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

onMounted(() => {
  setTimeout(() => (visible.value = true), 10)
})

function close() {
  visible.value = false
  setTimeout(() => emit('close'), 300) // Allow transition to complete
}
</script>