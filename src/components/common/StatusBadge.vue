<template>
  <span :class="['inline-flex items-center gap-1 rounded-full font-medium', compact ? 'px-1.5 text-[10px]' : 'px-2.5 py-0.5 text-xs', style?.badge ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300']">
    <component :is="style.icon" v-if="style" :class="compact ? 'h-3 w-3' : 'h-3.5 w-3.5'" aria-hidden="true" />
    {{ t(`status.${status}`) }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { t } from '../../i18n'
import { STATUS_STYLE } from '../../utils/statusStyle'

/** A schedule (or participant) status, with the admin panel's colour and icon. */
const props = defineProps<{ status: string; compact?: boolean }>()

const style = computed(() => STATUS_STYLE[props.status])
</script>
