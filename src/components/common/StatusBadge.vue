<template>
  <span :class="['inline-flex items-center rounded-full font-medium', compact ? 'px-1.5 text-[10px]' : 'px-2.5 py-0.5 text-xs', classes]">
    {{ t(`status.${status}`) }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { t } from '../../i18n'

/** A schedule (or participant) status, in the same colours as the calendar. */
const props = defineProps<{ status: string; compact?: boolean }>()

const COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
  cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
  completed: 'bg-primary-100 text-primary-800 dark:bg-primary-500/15 dark:text-primary-300',
  not_shown: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300',
}

const classes = computed(() => COLORS[props.status] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300')
</script>
