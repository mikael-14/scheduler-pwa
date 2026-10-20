<template>
  <!-- the primary rule (API: approval_problem): why this cannot be approved yet -->
  <p v-if="problem"
    class="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
    <ExclamationTriangleIcon class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
    <span><span class="font-semibold">{{ t('approvals.cannotApproveYet') }}</span> {{ problem }}</span>
  </p>
</template>

<script setup lang="ts">
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { t } from '../../i18n'

defineProps<{ problem?: string | null }>()
</script>
