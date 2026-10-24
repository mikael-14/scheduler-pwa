<template>
  <!-- menu item (side menus) -->
  <button v-if="installMode && variant === 'nav'" type="button" @click="install"
    class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-500/10">
    <DevicePhoneMobileIcon class="h-5 w-5" />
    {{ t('install.button') }}
  </button>

  <!-- card (login page, settings) -->
  <div v-else-if="installMode"
    class="page-card flex flex-col gap-3 border-primary-200 bg-primary-50 p-4 text-sm dark:border-primary-500/30 dark:bg-primary-500/10 sm:flex-row sm:items-center">
    <div class="flex flex-1 items-center gap-3">
      <img src="/img/icons/icon-192x192.png" alt="" class="h-10 w-10 shrink-0 rounded-xl" />
      <p class="text-slate-700 dark:text-slate-200">{{ t('install.body') }}</p>
    </div>
    <button type="button" @click="install"
      class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-600 px-3 py-2 font-semibold text-white shadow-sm hover:bg-primary-500">
      <DevicePhoneMobileIcon class="h-4 w-4" />
      {{ t('install.button') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { DevicePhoneMobileIcon } from '@heroicons/vue/24/outline'
import { t } from '../../i18n'
import { useDialogStore } from '../../stores/dialog'
import { useToastStore } from '../../stores/toast'
import { installMode, promptInstall } from '../../utils/install'

/**
 * "Add to phone": opens the browser's install dialog where there is one, otherwise explains how
 * (iPhone: Share → Add to Home Screen). Hidden when already installed or not possible here.
 */
withDefaults(defineProps<{ variant?: 'card' | 'nav' }>(), { variant: 'card' })

const emit = defineEmits<{ done: [] }>()
const dialog = useDialogStore()
const toast = useToastStore()

async function install() {
  emit('done')
  if (installMode.value === 'prompt') {
    if (await promptInstall()) toast.success(t('install.done'))
    return
  }
  await dialog.alert({
    title: t('install.title'),
    message: t(installMode.value === 'ios' ? 'install.ios' : 'install.menu'),
    tone: 'info',
  })
}
</script>
