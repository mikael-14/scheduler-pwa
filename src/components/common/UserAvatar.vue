<template>
  <img v-if="src && !failed" :src="src" :alt="name" @error="failed = true"
    :class="['shrink-0 rounded-full object-cover', size]" />
  <span v-else aria-hidden="true" :style="{ backgroundColor: color }"
    :class="['inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white', size, textSize]">
    {{ initials }}
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

/** A person's photo, or their initials on a colour of their own (also offline, no external service). */
const props = withDefaults(defineProps<{ name: string; src?: string | null; size?: string }>(), {
  src: null,
  size: 'h-6 w-6',
})

const failed = ref(false)
watch(() => props.src, () => (failed.value = false))

const initials = computed(() => {
  const words = props.name.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return '?'
  const first = words[0][0]
  const last = words.length > 1 ? words[words.length - 1][0] : ''
  return (first + last).toUpperCase()
})

// the same name always gets the same colour
const color = computed(() => {
  let hash = 0
  for (const char of props.name) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return `hsl(${Math.abs(hash) % 360} 55% 45%)`
})

const textSize = computed(() => (/\bh-(1[0-9]|[89])\b/.test(props.size) ? 'text-sm' : 'text-[0.625rem]'))
</script>
