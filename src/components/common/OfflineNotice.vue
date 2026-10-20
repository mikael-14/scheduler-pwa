<template>
  <p v-if="offline" role="status"
    class="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
    <SignalSlashIcon class="mt-0.5 h-4 w-4 shrink-0" />
    {{ message ?? t('offline.needsConnection') }}
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SignalSlashIcon } from '@heroicons/vue/24/outline'
import { t } from '../../i18n'
import { useConnectionStore } from '../../stores/connection'

/**
 * "No connection: changes need one". Shown on screens whose actions all need the server;
 * pair it with `<fieldset :disabled="connection.status === 'offline'">` around the controls.
 */
defineProps<{ message?: string }>()

const connection = useConnectionStore()
const offline = computed(() => connection.status === 'offline')
</script>
