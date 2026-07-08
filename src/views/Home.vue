<template>
  <div class="relative isolate px-6 pt-14 lg:px-8">
    <div class="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
      <div class="text-center">
        <h1 class="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
          PWA Scheduler
        </h1>
        <p class="mt-6 text-lg leading-8 text-gray-600 dark:text-slate-300">
          Welcome to your modern, offline-first scheduling application. Manage your time efficiently, online or offline.
        </p>
        <div class="mt-10 flex items-center justify-center gap-x-6">
          <router-link to="/my-agenda" class="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">
            Go to My Agenda
          </router-link>
          <router-link to="/settings" class="text-sm font-semibold leading-6 text-gray-900 dark:text-white">
            Settings <span aria-hidden="true">→</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>