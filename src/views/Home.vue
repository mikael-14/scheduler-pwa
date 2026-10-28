<template>
  <div class="mx-auto max-w-5xl space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">{{ t('dashboard.hello', { name: firstName }) }}</h1>
        <p class="text-sm capitalize text-slate-500 dark:text-slate-400">{{ todayLabel }}</p>
      </div>
      <p v-if="offline" class="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
        <SignalSlashIcon class="h-4 w-4" /> {{ t('dashboard.offline') }}
      </p>
    </header>

    <!-- 1. Notifications -->
    <section :class="card">
      <div class="flex items-center justify-between">
        <h2 :class="sectionTitle">
          {{ t('dashboard.notifications') }}
          <span v-if="unread" class="ml-1 rounded-full bg-red-500 px-1.5 text-[10px] text-white">{{ unread }}</span>
        </h2>
        <router-link to="/notifications" :class="link">{{ t('dashboard.seeAll') }}</router-link>
      </div>
      <ul v-if="notifications.length" class="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
        <li v-for="item in notifications" :key="item.id">
          <router-link :to="item.path && item.path !== '/notifications' ? item.path : '/notifications'" class="flex items-start gap-3 py-2.5">
            <span :class="['mt-1.5 h-2 w-2 shrink-0 rounded-full', item.read_at ? 'bg-slate-300 dark:bg-slate-700' : 'bg-primary-600']"></span>
            <span class="min-w-0 flex-1">
              <span :class="['block truncate text-sm text-slate-900 dark:text-white', item.read_at ? '' : 'font-semibold']">{{ item.title }}</span>
              <span class="block truncate text-xs text-slate-500 dark:text-slate-400">{{ firstLine(item.body) }}</span>
            </span>
            <span class="shrink-0 text-xs text-slate-400">{{ relative(item.created_at) }}</span>
          </router-link>
        </li>
      </ul>
      <p v-else class="mt-3 text-sm text-slate-500">{{ notificationsError ?? t('dashboard.noNotifications') }}</p>
    </section>

    <!-- 2. Next schedule -->
    <section>
      <h2 :class="[sectionTitle, 'mb-2']">{{ t('dashboard.next') }}</h2>
      <router-link v-if="next" :to="{ name: 'ScheduleDetail', params: { id: next.id } }"
        class="page-card block overflow-hidden border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div class="flex">
          <span class="w-2 shrink-0" :style="{ backgroundColor: next.schedule_type?.color || '#94a3b8' }"></span>
          <div class="flex-1 space-y-2 py-5 pl-2 pr-4 sm:p-5">
            <div class="flex items-start justify-between gap-3">
              <p class="text-lg font-bold text-slate-900 dark:text-white">{{ next.schedule_type?.name ?? t('calendar.scheduledEvent') }}</p>
              <StatusBadge :status="next.status" />
            </div>
            <p class="text-base text-slate-700 dark:text-slate-200">{{ whenLabel(next) }}</p>
            <div class="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span v-if="companions(next)">{{ t('dashboard.with', { names: companions(next) }) }}</span>
              <span class="font-medium text-primary-700 dark:text-primary-300">{{ countdown(next) }}</span>
            </div>
          </div>
        </div>
      </router-link>
      <div v-else :class="[card, 'text-center']">
        <p class="text-sm text-slate-500">{{ loadingMine ? t('schedule.loading') : (mineError ?? t('dashboard.noNext')) }}</p>
        <router-link v-if="canCreate && !loadingMine" :to="{ name: 'ScheduleNew' }" :class="[link, 'mt-2 inline-block']">
          {{ t('dashboard.bookOne') }}
        </router-link>
      </div>
    </section>

    <!-- 3. Quick actions -->
    <nav :class="['grid gap-3', canCreate ? 'grid-cols-2' : 'grid-cols-1']">
      <router-link v-if="canCreate" :to="{ name: 'ScheduleNew' }" :class="[action, 'bg-primary-600 text-white hover:bg-primary-500']">
        <PlusIcon class="h-5 w-5" /> {{ t('dashboard.new') }}
      </router-link>
      <router-link to="/calendar" :class="[action, actionLight]"><CalendarDaysIcon class="h-5 w-5" /> {{ t('nav.calendar') }}</router-link>
    </nav>

    <!-- 4. Approvers -->
    <section v-if="authStore.canApprove()" class="grid gap-3 sm:grid-cols-2">
      <router-link to="/approvals" :class="[card, 'flex items-center justify-between hover:shadow-md']">
        <span>
          <span :class="sectionTitle">{{ t('dashboard.toApprove') }}</span>
          <span class="mt-1 block text-3xl font-bold text-slate-900 dark:text-white">{{ badges.pendingApprovals }}</span>
          <span class="text-xs text-slate-500">{{ t('dashboard.waitingDecision') }}</span>
        </span>
        <ChevronRightIcon class="h-5 w-5 text-slate-400" />
      </router-link>
      <div v-if="canSeeAll" :class="card">
        <span :class="sectionTitle">{{ t('dashboard.shelterThisWeek') }}</span>
        <dl class="mt-2 grid grid-cols-3 gap-2 text-center">
          <div><dt class="text-xs text-slate-500">{{ t('dashboard.total') }}</dt><dd class="text-2xl font-bold">{{ weekSummary.total }}</dd></div>
          <div><dt class="text-xs text-slate-500">{{ t('status.approved') }}</dt><dd class="text-2xl font-bold text-emerald-600">{{ weekSummary.approved }}</dd></div>
          <div><dt class="text-xs text-slate-500">{{ t('status.pending') }}</dt><dd class="text-2xl font-bold text-amber-600">{{ weekSummary.pending }}</dd></div>
        </dl>
      </div>
    </section>

    <!-- 5. This week and next (also offline) -->
    <section :class="card">
      <div class="flex items-center justify-between">
        <h2 :class="sectionTitle">{{ t('dashboard.thisAndNextWeek') }}</h2>
        <router-link to="/calendar" :class="link">{{ t('dashboard.seeAgenda') }}</router-link>
      </div>
      <ul v-if="twoWeeks.length" class="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
        <li v-for="item in twoWeeks.slice(0, 6)" :key="item.id">
          <router-link :to="{ name: 'ScheduleDetail', params: { id: item.id } }" class="flex items-center gap-3 py-2.5">
            <span class="w-24 shrink-0 text-xs text-slate-500 dark:text-slate-400">{{ shortWhen(item) }}</span>
            <span class="h-6 w-1 shrink-0 rounded-full" :style="{ backgroundColor: item.schedule_type?.color || '#94a3b8' }"></span>
            <span class="min-w-0 flex-1 truncate text-sm font-medium text-slate-900 dark:text-white">{{ item.schedule_type?.name }}</span>
            <StatusBadge :status="item.status" compact />
          </router-link>
        </li>
      </ul>
      <p v-else class="mt-3 text-sm text-slate-500">{{ loadingMine ? t('schedule.loading') : t('dashboard.nothingTwoWeeks') }}</p>
      <p v-if="twoWeeks.length > 6" class="mt-2 text-xs text-slate-500">{{ t('dashboard.andMore', { count: twoWeeks.length - 6 }) }}</p>
    </section>

    <!-- 6. By type, next 30 days: mine and the whole shelter -->
    <section class="grid gap-3 lg:grid-cols-2">
      <div :class="card">
        <h2 :class="sectionTitle">{{ t('dashboard.mineByType') }}</h2>
        <TypeBreakdown :rows="mineComplete ? mineByType : []" :empty="mineComplete ? t('dashboard.noneIn30') : t('dashboard.needsConnection')" show-next />
      </div>
      <div v-if="canSeeAll" :class="card">
        <h2 :class="sectionTitle">{{ t('dashboard.shelterByType') }}</h2>
        <TypeBreakdown :rows="shelterComplete ? shelterByType : []" :empty="shelterComplete ? t('dashboard.noneIn30') : t('dashboard.needsConnection')" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { CalendarDaysIcon, PlusIcon, SignalSlashIcon } from '@heroicons/vue/24/outline'
import { ChevronRightIcon } from '@heroicons/vue/20/solid'
import { intlLocale, t } from '../i18n'
import { useAuthStore } from '../stores/auth'
import { useBadgesStore } from '../stores/badges'
import { useConnectionStore } from '../stores/connection'
import { notificationsApi, type AppNotification } from '../api/notifications'
import { schedulesApi, type Schedule } from '../api/schedules'
import { apiErrorMessage } from '../utils/apiError'
import { formatServerDateTime, toInputDate } from '../utils/datetime'
import { currentWindow } from '../utils/offlineSync'
import StatusBadge from '../components/common/StatusBadge.vue'
import TypeBreakdown, { type TypeRow } from '../components/TypeBreakdown.vue'

/**
 * The home screen: what matters now, for the signed-in volunteer (and approvers).
 * Mostly read from data the app already has; offline it uses the saved two weeks.
 */
const DAYS_AHEAD = 30
const ACTIVE: Schedule['status'][] = ['pending', 'approved']

const authStore = useAuthStore()
const badges = useBadgesStore()
const connection = useConnectionStore()

const card = 'page-card border-slate-200 bg-white px-4 py-5 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900'
const sectionTitle = 'text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400'
const link = 'text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400'
const action = 'flex flex-col items-center justify-center gap-1 rounded-2xl p-3 text-center text-xs font-semibold shadow-sm transition sm:flex-row sm:text-sm'
const actionLight = 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'

const firstName = computed(() => (authStore.user?.name ?? '').split(' ')[0])
const canCreate = computed(() => authStore.can('create_schedule') && connection.status !== 'offline')
const canSeeAll = computed(() => authStore.can('view_any_schedule'))

// "now" ticks so countdowns and "today" stay right while the screen is open
const now = ref(Date.now())
let ticker: ReturnType<typeof setInterval> | undefined

const today = computed(() => toInputDate(new Date(now.value).toISOString()))
const tomorrow = computed(() => addDays(today.value, 1))
const todayLabel = computed(() => formatServerDateTime(new Date(now.value), { weekday: 'long', day: 'numeric', month: 'long' }))

function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

// ---- data

const mine = ref<Schedule[]>([])
const shelter = ref<Schedule[]>([])
const loadingMine = ref(true)
const mineError = ref<string | null>(null)
const mineComplete = ref(true)
const shelterComplete = ref(true)
const offline = ref(false)

const notifications = ref<AppNotification[]>([])
const unread = ref(0)
const notificationsError = ref<string | null>(null)

async function load() {
  const range = { start: today.value, end: addDays(today.value, DAYS_AHEAD + 1) }

  const mineRequest = schedulesApi.fetchSchedules('admin', { ...range, mine: true })
    .then((result) => {
      mine.value = result.data
      mineComplete.value = result.complete
      offline.value = result.offline
      mineError.value = null
    })
    .catch((error) => (mineError.value = apiErrorMessage(error, t('calendar.loadFailed'))))
    .finally(() => (loadingMine.value = false))

  const shelterRequest = canSeeAll.value
    ? schedulesApi.fetchSchedules('admin', range)
      .then((result) => {
        shelter.value = result.data
        shelterComplete.value = result.complete
      })
      .catch(() => (shelterComplete.value = false))
    : Promise.resolve()

  const notificationsRequest = notificationsApi.list()
    .then((result) => {
      notifications.value = result.data.slice(0, 3)
      unread.value = result.unread
      notificationsError.value = null
    })
    .catch((error) => (notificationsError.value = apiErrorMessage(error, t('notifications.loadFailed'))))

  badges.refresh()
  await Promise.allSettled([mineRequest, shelterRequest, notificationsRequest])
}

// ---- derived

const endOf = (schedule: Schedule) => new Date(schedule.end ?? schedule.start).getTime()
const upcoming = (list: Schedule[]) => list
  .filter((schedule) => ACTIVE.includes(schedule.status) && endOf(schedule) >= now.value)
  .sort((a, b) => a.start.localeCompare(b.start))

const myUpcoming = computed(() => upcoming(mine.value))
const next = computed(() => myUpcoming.value[0] ?? null)

const twoWeeks = computed(() => {
  const saved = currentWindow(new Date(now.value))
  return myUpcoming.value.filter((schedule) => toInputDate(schedule.start) <= saved.to)
})

function byType(list: Schedule[]): TypeRow[] {
  const rows = new Map<number, TypeRow>()
  for (const schedule of upcoming(list)) {
    const type = schedule.schedule_type
    if (!type) continue
    const row = rows.get(type.id) ?? { id: type.id, name: type.name, color: type.color, count: 0, pending: 0, next: null }
    row.count++
    if (schedule.status === 'pending') row.pending++
    row.next ??= shortWhen(schedule) // the list is sorted: the first one is the next
    rows.set(type.id, row)
  }
  return [...rows.values()].sort((a, b) => b.count - a.count)
}
const mineByType = computed(() => byType(mine.value))
const shelterByType = computed(() => byType(shelter.value))

/** This week (Monday to Sunday) across the shelter. */
const weekSummary = computed(() => {
  const week0 = currentWindow(new Date(now.value)).from
  const weekEnd = addDays(week0, 6)
  const week = shelter.value.filter((schedule) =>
    ACTIVE.includes(schedule.status) && toInputDate(schedule.start) <= weekEnd && toInputDate(schedule.end ?? schedule.start) >= week0)
  return {
    total: week.length,
    approved: week.filter((schedule) => schedule.status === 'approved').length,
    pending: week.filter((schedule) => schedule.status === 'pending').length,
  }
})

// ---- formatting (shelter time, see utils/datetime)

function dayLabel(iso: string): string {
  const day = toInputDate(iso)
  if (day === today.value) return t('dashboard.today')
  if (day === tomorrow.value) return t('dashboard.tomorrow')
  return formatServerDateTime(iso, { weekday: 'short', day: 'numeric', month: 'short' })
}

const time = (iso: string) => formatServerDateTime(iso, { timeStyle: 'short' })

function whenLabel(schedule: Schedule): string {
  if (schedule.all_day) return `${dayLabel(schedule.start)} · ${t('approvals.allDay')}`
  const end = schedule.end && toInputDate(schedule.end) === toInputDate(schedule.start) ? `–${time(schedule.end)}` : ''
  return `${dayLabel(schedule.start)} · ${time(schedule.start)}${end}`
}

function shortWhen(schedule: Schedule): string {
  return schedule.all_day ? dayLabel(schedule.start) : `${dayLabel(schedule.start)} ${time(schedule.start)}`
}

/** "in 18 hours", "in 3 days", "now" */
function countdown(schedule: Schedule): string {
  const start = new Date(schedule.start).getTime()
  if (start <= now.value) return t('dashboard.happeningNow')
  const minutes = Math.round((start - now.value) / 60000)
  const format = new Intl.RelativeTimeFormat(intlLocale(), { numeric: 'auto' })
  if (minutes < 60) return format.format(minutes, 'minute')
  if (minutes < 48 * 60) return format.format(Math.round(minutes / 60), 'hour')
  return format.format(Math.round(minutes / 1440), 'day')
}

function relative(iso: string): string {
  const minutes = Math.round((new Date(iso).getTime() - now.value) / 60000)
  const format = new Intl.RelativeTimeFormat(intlLocale(), { numeric: 'auto', style: 'short' })
  if (minutes > -60) return format.format(Math.min(minutes, 0), 'minute')
  if (minutes > -1440) return format.format(Math.round(minutes / 60), 'hour')
  return format.format(Math.round(minutes / 1440), 'day')
}

/** The other people in it: the owner (if not me) and the participants. */
function companions(schedule: Schedule): string {
  const me = authStore.user?.id
  const names = [
    schedule.user && schedule.user.id !== me ? schedule.user.name : null,
    ...schedule.schedule_users.filter((participant) => participant.user_id !== me).map((participant) => participant.name),
  ].filter(Boolean) as string[]
  return names.length > 3 ? `${names.slice(0, 3).join(', ')} +${names.length - 3}` : names.join(', ')
}

const firstLine = (text: string) => (text ?? '').split('\n')[0]

// ---- life cycle

const onOnline = () => load()

onMounted(() => {
  load()
  ticker = setInterval(() => (now.value = Date.now()), 60_000)
  window.addEventListener('online', onOnline)
})
onUnmounted(() => {
  clearInterval(ticker)
  window.removeEventListener('online', onOnline)
})
</script>
