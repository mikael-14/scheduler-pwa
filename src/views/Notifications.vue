<template>
  <div :class="['mx-auto max-w-3xl space-y-4 sm:p-6', selecting ? 'pb-20' : '']">
    <!-- the title, with choosing as a small icon button so it stays on one line; while choosing: how many and select all -->
    <div v-if="!selecting" class="flex min-h-10 items-center justify-between gap-3">
      <h2 class="truncate text-xl font-semibold">{{ t('notifications.title') }}</h2>
      <!-- the app's secondary (outlined) button, icon only -->
      <button v-if="canSelect" type="button" @click="startSelecting()"
        :aria-label="t('notifications.select')" :title="t('notifications.select')"
        class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">
        <CheckCircleIcon class="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
    <div v-else class="flex min-h-10 items-center justify-between gap-3">
      <div class="flex min-w-0 items-center gap-2">
        <button type="button" @click="stopSelecting" :aria-label="t('notifications.cancelSelect')"
          class="-ml-2 rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
          <XMarkIcon class="h-5 w-5" />
        </button>
        <h2 class="truncate text-xl font-semibold">{{ t('notifications.selectedCount', { count: selected.size }) }}</h2>
      </div>
      <button type="button" @click="toggleAll"
        class="shrink-0 text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
        {{ allSelected ? t('notifications.deselectAll') : t('notifications.selectAll') }}
      </button>
    </div>

    <!-- Unread / All: the whole width on a phone, easier to hit -->
    <div class="flex w-full rounded-xl bg-slate-100 p-1 dark:bg-slate-800 sm:inline-flex sm:w-auto" role="tablist">
      <button v-for="tab in tabs" :key="tab.value" type="button" role="tab" :aria-selected="filter === tab.value"
        @click="filter = tab.value"
        :class="['flex flex-1 items-center justify-center rounded-lg px-3 py-2.5 text-sm font-semibold transition sm:flex-none sm:py-1.5 sm:text-xs',
          filter === tab.value ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400']">
        {{ tab.label }}
        <span v-if="tab.count" class="ml-1.5 rounded-full bg-primary-600 px-1.5 text-[10px] text-white">{{ tab.count }}</span>
      </button>
    </div>

    <!-- how many are unread, and reading them all in one tap (not while choosing: the bar below does that) -->
    <div v-if="unread > 0 && !offline && !selecting && !loading" class="-mt-1 flex items-center justify-between gap-3 text-sm">
      <span class="truncate text-slate-500 dark:text-slate-400">{{ t('notifications.unreadCount', { count: unread }) }}</span>
      <button type="button" @click="markAll"
        class="inline-flex shrink-0 items-center gap-1 whitespace-nowrap font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
        <CheckIcon class="h-4 w-4" aria-hidden="true" />
        {{ t('notifications.markAllRead') }}
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

    <template v-else>
      <ul class="space-y-2">
        <li v-for="item in visible" :key="item.id">
          <!-- a div acting as the button: the day links inside it are buttons of their own -->
          <div role="button" tabindex="0" :aria-pressed="selecting ? selected.has(item.id) : undefined"
            @click="tap(item)" @keydown.enter.self="tap(item)" @keydown.space.self.prevent="tap(item)"
            @pointerdown="pressStart(item, $event)" @pointerup="pressEnd" @pointercancel="pressEnd" @pointerleave="pressEnd"
            @contextmenu="onContextMenu"
            :class="['page-card flex w-[calc(100%+2rem)] cursor-pointer items-start sm:w-full gap-3 p-4 text-left shadow-sm transition [-webkit-touch-callout:none] [@media(pointer:coarse)]:select-none',
              selecting && selected.has(item.id) ? 'ring-2 ring-primary-500' : '',
              item.read_at
                ? 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800'
                : 'border-primary-200 bg-primary-50/60 hover:bg-primary-50 dark:border-primary-500/30 dark:bg-primary-500/10 dark:hover:bg-primary-500/15']">
            <!-- while choosing: a tick box in place of the icon -->
            <span v-if="selecting" aria-hidden="true"
              :class="['flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition',
                selected.has(item.id) ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900']">
              <CheckIcon v-if="selected.has(item.id)" class="h-5 w-5" />
            </span>
            <!-- what it is about, in the colour of what happened -->
            <span v-else :class="['flex h-9 w-9 shrink-0 items-center justify-center rounded-full', toneClass(item)]">
              <component :is="kindIcon(item)" class="h-5 w-5" aria-hidden="true" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="flex items-center gap-2">
                <span class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{{ kindLabel(item) }}</span>
                <span v-if="!item.read_at" class="h-2 w-2 rounded-full bg-primary-600" :aria-label="t('notifications.unread')"></span>
              </span>
              <span :class="['mt-0.5 block text-sm text-slate-900 dark:text-white', item.read_at ? 'font-medium' : 'font-semibold']">{{ item.title }}</span>
              <span v-if="item.body" class="block whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{{ item.body }}</span>
              <!-- coverage summary: one tap per day straight to its booking form (not while choosing) -->
              <span v-if="item.links?.length" class="mt-2 flex flex-col items-start gap-1.5">
                <button v-for="link in item.links" :key="link.path" type="button" :disabled="selecting" @click.stop="open(item, link.path)"
                  :class="['inline-flex max-w-full items-center gap-1 rounded-lg border bg-white px-2.5 py-1 text-left text-xs font-medium transition dark:bg-slate-900', linkClass(item),
                    selecting ? 'pointer-events-none opacity-60' : '']">
                  <span class="min-w-0">{{ link.label }}</span>
                  <ChevronRightIcon class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                </button>
              </span>
              <span class="mt-1 block text-xs text-slate-400">{{ formatDate(item.created_at) }}</span>
            </span>
            <ChevronRightIcon v-if="!selecting && !item.links?.length && item.path && item.path !== '/notifications'" class="mt-2 h-4 w-4 shrink-0 text-slate-400" />
          </div>
        </li>
      </ul>

      <!-- the next page: loaded on its own when this comes into view, or with the button -->
      <div v-if="nextCursor" ref="sentinel" class="flex justify-center py-2">
        <p v-if="loadingMore" class="text-sm text-slate-500">{{ t('notifications.loadingMore') }}</p>
        <button v-else type="button" @click="loadMore"
          :class="['w-full rounded-xl border px-4 py-3 text-sm font-medium transition sm:w-auto sm:py-2',
            moreFailed
              ? 'border-red-200 text-red-700 hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800']">
          {{ moreFailed ? t('notifications.loadMoreFailed') : t('notifications.loadMore') }}
        </button>
      </div>
    </template>

    <!-- while choosing: what to do with them, above the bottom menu on a phone -->
    <div v-if="selecting"
      class="fixed inset-x-0 bottom-16 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:bottom-0 lg:left-64">
      <div class="mx-auto flex max-w-3xl gap-2">
        <!-- always one line: on a narrow phone a smaller text and no icon, so "Marcar como por ler" fits -->
        <button type="button" :disabled="busy || !selectedUnread.length" @click="markSelected(true)"
          class="inline-flex min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary-600 px-2 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm">
          <EnvelopeOpenIcon class="hidden h-5 w-5 shrink-0 min-[400px]:block" aria-hidden="true" />
          <span class="truncate">{{ t('notifications.markRead') }}</span>
        </button>
        <!-- in "unread" every one is unread already -->
        <button v-if="filter === 'all'" type="button" :disabled="busy || !selectedRead.length" @click="markSelected(false)"
          class="inline-flex min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-2 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:px-4 sm:text-sm">
          <EnvelopeIcon class="hidden h-5 w-5 shrink-0 min-[400px]:block" aria-hidden="true" />
          <span class="truncate">{{ t('notifications.markUnread') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useIntersectionObserver } from '@vueuse/core'
import {
  BellIcon, CalendarDaysIcon, CheckBadgeIcon, CheckCircleIcon, ClockIcon, EnvelopeIcon, EnvelopeOpenIcon, ExclamationCircleIcon, ExclamationTriangleIcon, MegaphoneIcon, PencilSquareIcon, UserCircleIcon, UserGroupIcon, UserMinusIcon, UserPlusIcon, XMarkIcon,
} from '@heroicons/vue/24/outline'
import { CheckIcon, ChevronRightIcon } from '@heroicons/vue/20/solid'
import { t, intlLocale } from '../i18n'
import { notificationsApi, type AppNotification } from '../api/notifications'
import { apiErrorMessage } from '../utils/apiError'
import { useToastStore } from '../stores/toast'
import { useBadgesStore } from '../stores/badges'

/** How many come at a time: enough to fill a screen, not so many that a long history weighs on the phone. */
const PER_PAGE = 20
/** How long a finger stays on a notification to start choosing. */
const LONG_PRESS_MS = 450

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

// ---- pages
const nextCursor = ref<string | null>(null)
const loadingMore = ref(false)
const moreFailed = ref(false)
const sentinel = ref<HTMLElement | null>(null)
const sentinelInView = ref(false)
// a newer load (another tab) makes the answers of older ones stale
let generation = 0

const tabs = computed(() => [
  { value: 'unread' as const, label: t('notifications.unreadTab'), count: unread.value },
  { value: 'all' as const, label: t('notifications.all'), count: 0 },
])
// in "unread", one that was just read leaves the list at once
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
/** A coverage summary is urgent (red, danger) for the next days, look-ahead (amber, warning) after. */
const urgentCoverage = (item: AppNotification) => item.kind === 'coverage' && item.status === 'danger'
const kindIcon = (item: AppNotification) => urgentCoverage(item) ? ExclamationCircleIcon : ICONS[item.kind ?? ''] ?? BellIcon
const kindLabel = (item: AppNotification) => {
  if (urgentCoverage(item)) return t('notifications.kind.coverage_urgent')
  return item.kind && item.kind !== 'other' && ICONS[item.kind] ? t(`notifications.kind.${item.kind}`) : t('notifications.kind.other')
}

const toneClass = (item: AppNotification) => ({
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
}[item.status] ?? 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300')

/** The day links in the colour of the summary: red when urgent, amber when looking ahead. */
const linkClass = (item: AppNotification) => item.status === 'danger'
  ? 'border-red-200 text-red-700 hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10'
  : 'border-amber-200 text-amber-800 hover:bg-amber-50 dark:border-amber-500/30 dark:text-amber-300 dark:hover:bg-amber-500/10'

/** The first page of the current tab. */
const load = async () => {
  const current = ++generation
  loading.value = true
  error.value = null
  moreFailed.value = false
  // the old list's end is gone: wait for the new one to come into view
  sentinelInView.value = false
  try {
    const result = await notificationsApi.list({ filter: filter.value, perPage: PER_PAGE })
    if (current !== generation) return
    items.value = result.data
    unread.value = result.unread
    nextCursor.value = result.next_cursor ?? null
    offline.value = !!result.offline
  } catch (e) {
    if (current !== generation) return
    items.value = []
    nextCursor.value = null
    error.value = apiErrorMessage(e, t('notifications.loadFailed'))
  } finally {
    if (current === generation) loading.value = false
  }
}

/** The next page, added below. */
const loadMore = async () => {
  if (!nextCursor.value || loadingMore.value) return
  const current = generation
  loadingMore.value = true
  moreFailed.value = false
  try {
    const result = await notificationsApi.list({ filter: filter.value, perPage: PER_PAGE, cursor: nextCursor.value })
    if (current !== generation) return
    // one read or unread since may already be here: no doubles
    const known = new Set(items.value.map((item) => item.id))
    items.value.push(...result.data.filter((item) => !known.has(item.id)))
    unread.value = result.unread
    nextCursor.value = result.next_cursor ?? null
  } catch {
    if (current === generation) moreFailed.value = true
  } finally {
    if (current === generation) loadingMore.value = false
  }
}

// the end of the list in view: the next page comes on its own (again after each page, while it stays in view)
useIntersectionObserver(sentinel, ([entry]) => (sentinelInView.value = !!entry?.isIntersecting), { rootMargin: '300px' })
watch([sentinelInView, nextCursor, loadingMore, moreFailed], () => {
  if (sentinelInView.value && nextCursor.value && !loadingMore.value && !moreFailed.value && !loading.value) loadMore()
})

watch(filter, () => {
  stopSelecting()
  load()
})

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat(intlLocale(), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))

/** Marks it read, then goes to `path`: a day link, or by default where the notification leads. */
const open = async (item: AppNotification, path: string = item.path) => {
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

  if (path && path !== '/notifications') {
    router.push(path)
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
  // nothing unread is left to page through
  if (filter.value === 'unread') nextCursor.value = null
  badges.refresh()
}

// ---- choosing some, to mark them read or unread
const selecting = ref(false)
const selected = ref(new Set<string>())
const busy = ref(false)

// changing them needs the server
const canSelect = computed(() => !offline.value && !loading.value && visible.value.length > 0)
const selectedItems = computed(() => visible.value.filter((item) => selected.value.has(item.id)))
const selectedUnread = computed(() => selectedItems.value.filter((item) => !item.read_at))
const selectedRead = computed(() => selectedItems.value.filter((item) => item.read_at))
const allSelected = computed(() => visible.value.length > 0 && visible.value.every((item) => selected.value.has(item.id)))

const startSelecting = (first?: AppNotification) => {
  selected.value = new Set(first ? [first.id] : [])
  selecting.value = true
}
const stopSelecting = () => {
  selecting.value = false
  selected.value = new Set()
}
const toggle = (item: AppNotification) => {
  const next = new Set(selected.value)
  if (next.has(item.id)) next.delete(item.id)
  else next.add(item.id)
  selected.value = next
}
const toggleAll = () => {
  selected.value = allSelected.value ? new Set() : new Set(visible.value.map((item) => item.id))
}

/** A tap opens it; while choosing, it ticks or unticks it. */
const tap = (item: AppNotification) => {
  if (longPressed) {
    // the finger lifting after a long press is not a tap
    longPressed = false
    return
  }
  if (selecting.value) toggle(item)
  else open(item)
}

// a long press on a phone starts choosing, with that one ticked
let pressTimer: ReturnType<typeof setTimeout> | undefined
let longPressed = false
const pressStart = (item: AppNotification, event: PointerEvent) => {
  longPressed = false
  if (event.pointerType === 'mouse' || selecting.value || !canSelect.value) return
  clearTimeout(pressTimer)
  pressTimer = setTimeout(() => {
    longPressed = true
    startSelecting(item)
    navigator.vibrate?.(15)
  }, LONG_PRESS_MS)
}
const pressEnd = () => clearTimeout(pressTimer)
// no copy/share menu over the long press
const onContextMenu = (event: Event) => {
  if (longPressed || selecting.value) event.preventDefault()
}

/** Marks the ticked ones read (`true`) or unread again (`false`), then leaves choosing. */
const markSelected = async (read: boolean) => {
  const targets = read ? selectedUnread.value : selectedRead.value
  if (!targets.length || busy.value) return
  busy.value = true
  try {
    const ids = targets.map((item) => item.id)
    const count = read ? await notificationsApi.markManyRead(ids) : await notificationsApi.markManyUnread(ids)
    const now = new Date().toISOString()
    targets.forEach((item) => (item.read_at = read ? now : null))
    unread.value = count
    badges.unreadNotifications = count
    stopSelecting()
  } catch (e) {
    toast.error(apiErrorMessage(e, t('notifications.markFailed')))
  } finally {
    busy.value = false
  }
}

onMounted(load)
</script>
