<template>
  <div class="py-6 sm:p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-semibold">{{ t('agenda.title') }}</h2>
    </div>
    <Calendar />
  </div>
</template>

<script setup lang="ts">
import { t } from '../i18n'
import Calendar from '../components/Calendar.vue'
</script>
