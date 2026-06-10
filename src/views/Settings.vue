<template>
  <div class="max-w-4xl mx-auto space-y-8">
    <header>
      <h1 class="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
      <p class="mt-2 text-slate-600 dark:text-slate-400">Configure your application preferences and synchronization.</p>
    </header>

    <div class="space-y-6">
      <!-- Sync Section -->
      <div class="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="p-6">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
              <CloudArrowUpIcon class="h-6 w-6" />
            </div>
            <div>
              <h3 class="text-lg font-medium text-slate-900 dark:text-white">Offline Synchronization</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400">Manage how your data is stored and synced when offline.</p>
            </div>
          </div>

          <div class="mt-6 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-slate-900 dark:text-white">Auto Sync</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">Automatically sync changes when internet is available.</p>
              </div>
              <button class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 bg-primary-600">
                <span class="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
              </button>
            </div>
            
            <div class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                <p class="text-sm font-medium text-slate-900 dark:text-white">Force Sync</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">Manually trigger a full database synchronization.</p>
              </div>
              <button @click="handleSync" :disabled="syncing" class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                <ArrowPathIcon class="h-4 w-4" :class="{ 'animate-spin': syncing }" />
                Sync Now
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Notifications Section -->
      <div class="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="p-6">
          <div class="flex items-center gap-3">
             <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
              <BellIcon class="h-6 w-6" />
            </div>
            <div>
              <h3 class="text-lg font-medium text-slate-900 dark:text-white">Push Notifications</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400">Get notified about your upcoming schedule and updates.</p>
            </div>
          </div>

          <div class="mt-6">
            <button @click="requestNotifications" class="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
              Enable Notifications
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { 
  CloudArrowUpIcon, 
  ArrowPathIcon, 
  BellIcon 
} from '@heroicons/vue/24/outline'

const syncing = ref(false)

const handleSync = async () => {
  syncing.value = true
  try {
    // Simulate sync
    await new Promise(resolve => setTimeout(resolve, 2000))
    alert('Synchronization complete!')
  } finally {
    syncing.value = false
  }
}

const requestNotifications = async () => {
  if (!('Notification' in window)) {
    alert('This browser does not support desktop notification')
    return
  }

  const permission = await Notification.requestPermission()
  if (permission === 'granted') {
    alert('Notifications enabled!')
  }
}
</script>
