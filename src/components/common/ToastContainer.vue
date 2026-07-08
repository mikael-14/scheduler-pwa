<template>
  <div
    aria-live="assertive"
    class="pointer-events-none fixed inset-0 z-[100] flex items-end px-4 py-6 sm:items-start sm:p-6"
  >
    <div class="flex w-full flex-col items-center space-y-4 sm:items-end">
      <Toast
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        :toast="toast"
        @close="toastStore.removeToast(toast.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToastStore } from '../../stores/toast'
import Toast from './Toast.vue'

const toastStore = useToastStore()
</script>