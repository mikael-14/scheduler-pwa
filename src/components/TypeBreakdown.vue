<template>
  <ul v-if="rows.length" class="mt-3 space-y-3">
    <li v-for="row in rows" :key="row.id">
      <div class="flex items-center justify-between gap-3 text-sm">
        <span class="flex min-w-0 items-center gap-2">
          <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: row.color || '#94a3b8' }"></span>
          <span class="truncate font-medium text-slate-900 dark:text-white">{{ row.name }}</span>
        </span>
        <span class="shrink-0 font-semibold text-slate-900 dark:text-white">{{ row.count }}</span>
      </div>
      <!-- share of the total, in the type's colour -->
      <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div class="h-full rounded-full" :style="{ width: `${(row.count / max) * 100}%`, backgroundColor: row.color || '#94a3b8' }"></div>
      </div>
      <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
        <template v-if="showNext && row.next">{{ t('dashboard.nextOn', { when: row.next }) }}</template>
        <template v-if="showNext && row.next && row.pending"> · </template>
        <template v-if="row.pending">{{ t('dashboard.pendingCount', { count: row.pending }) }}</template>
      </p>
    </li>
  </ul>
  <p v-else class="mt-3 text-sm text-slate-500">{{ empty }}</p>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { t } from '../i18n'

export interface TypeRow {
  id: number
  name: string
  color: string | null
  count: number
  pending: number
  /** when the next one is, already formatted */
  next: string | null
}

/** Schedules per type: count, a bar for the share, and when the next one is. */
const props = defineProps<{ rows: TypeRow[]; empty: string; showNext?: boolean }>()

const max = computed(() => Math.max(1, ...props.rows.map((row) => row.count)))
</script>
