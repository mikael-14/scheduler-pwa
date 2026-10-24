<template>
  <ul class="space-y-1.5">
    <li v-for="event in events" :key="event.id">
      <button type="button"
        :class="['flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm shadow-sm transition-transform active:scale-[0.98]', getEventStatusClass(event.status)]"
        :style="event.typeColor ? { borderLeft: `4px solid ${event.typeColor}` } : undefined"
        @click.stop="emit('open', event.id)">
        <span class="w-12 shrink-0 text-xs font-semibold tabular-nums opacity-80">{{ event.allDay ? t('schedule.allDay') : event.time }}</span>
        <span class="truncate font-bold">{{ event.title }}</span>
      </button>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { getEventStatusClass } from './common/eventstatus'
import { t } from '../i18n'
import type { DayEntry } from '../utils/calendarDays'

defineProps<{ events: DayEntry[] }>()

const emit = defineEmits<{ open: [id: string] }>()
</script>
