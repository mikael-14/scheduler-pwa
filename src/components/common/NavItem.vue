<template>
  <router-link
    :to="to"
    class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
    :class="[
      isActive
        ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
    ]"
  >
    <component :is="resolvedIcon" class="h-5 w-5" :class="isActive ? 'text-primary-600 dark:text-primary-400' : ''" />
    <slot />
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import * as Icons from '@heroicons/vue/24/outline'

const props = defineProps<{
  to: string
  icon: string
}>()

const route = useRoute()
const isActive = computed(() => {
    if (props.to === '/') return route.path === '/'
    return route.path.startsWith(props.to)
})

const resolvedIcon = computed(() => (Icons as any)[props.icon])
</script>
