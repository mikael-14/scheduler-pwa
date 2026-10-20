<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-semibold">{{ t('nav.myAgenda') }}</h2>
      <div class="space-x-2">
        <router-link to="/settings" class="text-sm text-slate-600">{{ t('nav.settings') }}</router-link>
      </div>
    </div>
    <Calendar mine />
  </div>
</template>

<script setup lang="ts">
import { t } from '../i18n'
import Calendar from '../components/Calendar.vue'
</script>
