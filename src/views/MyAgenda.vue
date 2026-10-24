<template>
  <div class="sm:p-6">
    <div class="mb-3 flex items-center justify-between sm:mb-4">
      <h2 class="text-xl font-semibold sm:text-2xl">{{ t('nav.myAgenda') }}</h2>
    </div>
    <Calendar mine />
  </div>
</template>

<script setup lang="ts">
import { t } from '../i18n'
import Calendar from '../components/Calendar.vue'
</script>
