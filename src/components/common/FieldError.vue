<template>
  <span v-if="errors?.length" class="mt-1 block text-xs font-normal text-red-600 dark:text-red-400" role="alert">
    <span v-for="message in errors" :key="message" class="block">{{ message }}</span>
  </span>
</template>

<script setup lang="ts">
/** The validation messages of one form field (from the API or the form itself). */
defineProps<{ errors?: string[] }>()
</script>
