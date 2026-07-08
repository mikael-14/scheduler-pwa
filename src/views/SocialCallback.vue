<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
    <div class="text-center">
      <div class="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-3xl text-white shadow-lg shadow-primary-500/20">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
      </div>
      <p class="mt-4 font-semibold text-slate-700 dark:text-slate-300">Finalizing login, please wait...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(async () => {
  // The main logic is now in main.ts. This component just acts as a loading screen.
  // If the user lands here directly, we'll send them home after a moment.
  setTimeout(() => router.replace({ name: 'Home' }), 1000)
})
</script>