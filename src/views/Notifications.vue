<template>
  <div class="mx-auto max-w-3xl space-y-4 py-6 sm:p-6">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-xl font-semibold">{{ t('notifications.title') }}</h2>
      <button v-if="unread > 0 && !offline" @click="markAll"
        class="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
        {{ t('notifications.markAllRead') }}
      </button>
    </div>

    <!-- Unread / All -->
    <div class="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800" role="tablist">
      <button v-for="tab in tabs" :key="tab.value" type="button" role="tab" :aria-selected="filter === tab.value"
        @click="filter = tab.value"
        :class="['rounded-lg px-3 py-1.5 text-xs font-semibold transition',
          filter === tab.value ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400']">
        {{ tab.label }}
        <span v-if="tab.count" class="ml-1 rounded-full bg-primary-600 px-1.5 text-[10px] text-white">{{ tab.count }}</span>
      </button>
    </div>

    <p v-if="offline" class="page-card border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
      {{ t('offline.notificationsSaved') }}
    </p>

    <p v-if="loading" class="text-sm text-slate-500">{{ t('notifications.loading') }}</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="visible.length === 0" class="page-card border-dashed border-slate-300 px-4 py-8 text-center sm:p-8 text-sm text-slate-500 dark:border-slate-700">
      {{ filter === 'unread' ? t('notifications.noneUnread') : t('notifications.empty') }}
    </p>

    <ul v-else class="space-y-2">
      <li v-for="item in visible" :key="item.id">
        <button type="button" @click="open(item)"
          :class="['page-card flex w-full items-start gap-3 p-4 text-left shadow-sm transition',
            item.read_at
              ? 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800'
              : 'border-primary-200 bg-primary-50/60 hover:bg-primary-50 dark:border-primary-500/30 dark:bg-primary-500/10 dark:hover:bg-primary-500/15']">
          <!-- what it is about, in the colour of what happened -->
          <span :class="['flex h-9 w-9 shrink-0 items-center justify-center rounded-full', toneClass(item)]">
            <component :is="kindIcon(item)" class="h-5 w-5" aria-hidden="true" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="flex items-center gap-2">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{{ kindLabel(item) }}</span>
              <span v-if="!item.read_at" class="h-2 w-2 rounded-full bg-primary-600" :aria-label="t('notifications.unread')"></span>
            </span>
            <span :class="['mt-0.5 block text-sm text-slate-900 dark:text-white', item.read_at ? 'font-medium' : 'font-semibold']">{{ item.title }}</span>
            <span v-if="item.body" class="block whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{{ item.body }}</span>
            <span class="mt-1 block text-xs text-slate-400">{{ formatDate(item.created_at) }}</span>
          </span>
          <ChevronRightIcon v-if="item.path && item.path !== '/notifications'" class="mt-2 h-4 w-4 shrink-0 text-slate-400" />
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  BellIcon, CalendarDaysIcon, CheckBadgeIcon, ClockIcon, ExclamationTriangleIcon, MegaphoneIcon, PencilSquareIcon, UserCircleIcon, UserGroupIcon, UserMinusIcon, UserPlusIcon,
} from '@heroicons/vue/24/outline'
import { ChevronRightIcon } from '@heroicons/vue/20/solid'
import { t, intlLocale } from '../i18n'
import { notificationsApi, type AppNotification } from '../api/notifications'
import { apiErrorMessage } from '../utils/apiError'
import { useToastStore } from '../stores/toast'
import { useBadgesStore } from '../stores/badges'

const toast = useToastStore()
const badges = useBadgesStore()

const router = useRouter()
const items = ref<AppNotification[]>([])
const unread = ref(0)
const loading = ref(true)
const error = ref<string | null>(null)
// shown from the copy saved on the device (no connection)
const offline = ref(false)
// unread first: what still needs a look
const filter = ref<'all' | 'unread'>('unread')

const tabs = computed(() => [
  { value: 'unread' as const, label: t('notifications.unreadTab'), count: unread.value },
  { value: 'all' as const, label: t('notifications.all'), count: 0 },
])
const visible = computed(() => filter.value === 'unread' ? items.value.filter((item) => !item.read_at) : items.value)

/** One icon per kind of notification (see NotificationController::KINDS). */
const ICONS: Record<string, unknown> = {
  pending_approval: ClockIcon,
  schedule_status: CheckBadgeIcon,
  participant_added: UserPlusIcon,
  participant_removed: UserMinusIcon,
  booked_for_you: CalendarDaysIcon,
  schedule_updated: PencilSquareIcon,
  coverage: ExclamationTriangleIcon,
  activity: UserGroupIcon,
  announcement: MegaphoneIcon,
  account: UserCircleIcon,
}
const kindIcon = (item: AppNotification) => ICONS[item.kind ?? ''] ?? BellIcon
const kindLabel = (item: AppNotification) =>
  item.kind && item.kind !== 'other' && ICONS[item.kind] ? t(`notifications.kind.${item.kind}`) : t('notifications.kind.other')

const toneClass = (item: AppNotification) => ({
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
}[item.status] ?? 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300')

const load = async () => {
  try {
    const result = await notificationsApi.list()
    items.value = result.data
    unread.value = result.unread
    offline.value = !!result.offline
  } catch (e) {
    error.value = apiErrorMessage(e, t('notifications.loadFailed'))
  } finally {
    loading.value = false
  }
}

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat(intlLocale(), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))

const open = async (item: AppNotification) => {
  if (!item.read_at) {
    try {
      await notificationsApi.markRead(item.id)
      item.read_at = new Date().toISOString()
      unread.value = Math.max(0, unread.value - 1)
      badges.unreadNotifications = Math.max(0, badges.unreadNotifications - 1)
    } catch {
      /* navigating matters more than the read flag */
    }
  }

  if (item.path && item.path !== '/notifications') {
    router.push(item.path)
  }
}

const markAll = async () => {
  try {
    await notificationsApi.markAllRead()
  } catch (e) {
    toast.error(apiErrorMessage(e, t('notifications.markAllFailed')))
    return
  }
  const now = new Date().toISOString()
  items.value.forEach((item) => (item.read_at ??= now))
  unread.value = 0
  badges.refresh()
}

onMounted(load)
</script>
