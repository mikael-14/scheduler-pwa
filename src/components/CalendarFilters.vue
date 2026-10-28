<template>
  <!-- the filter button: a number for each filter that is on -->
  <button type="button" @click="openSheet" :aria-label="buttonLabel" :title="buttonLabel"
    :class="['relative inline-flex h-9 w-9 items-center justify-center rounded-lg border sm:h-10 sm:w-10',
      count ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-500/40 dark:bg-primary-500/10 dark:text-primary-300'
        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300']">
    <FunnelIcon class="h-5 w-5" />
    <span v-if="count" class="absolute -right-1.5 -top-1.5 min-w-[1.125rem] rounded-full bg-primary-600 px-1 text-center text-[10px] font-semibold leading-[1.125rem] text-white">
      {{ count > 99 ? '99+' : count }}
    </span>
  </button>

  <Teleport to="body">
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
      leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0">
      <div v-if="open" class="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4" @keydown.esc="open = false">
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="open = false"></div>

        <!-- a bottom sheet on phones, a centred card from sm up -->
        <section role="dialog" aria-modal="true" aria-labelledby="calendar-filters-title"
          class="relative flex max-h-[85vh] w-full max-w-md flex-col rounded-t-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-slate-800 dark:ring-white/10 sm:rounded-2xl">
          <header class="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700">
            <h3 id="calendar-filters-title" class="text-base font-semibold text-slate-900 dark:text-white">{{ t('calendarFilters.title') }}</h3>
            <button ref="closeButton" type="button" @click="open = false" :aria-label="t('common.close')"
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700">
              <XMarkIcon class="h-5 w-5" />
            </button>
          </header>

          <div class="flex-1 space-y-6 overflow-y-auto px-5 py-4">
            <!-- only mine -->
            <label class="flex cursor-pointer items-center justify-between gap-4">
              <span>
                <span class="block text-sm font-medium text-slate-900 dark:text-white">{{ t('calendarFilters.mine') }}</span>
                <span class="block text-xs text-slate-500 dark:text-slate-400">{{ t('calendarFilters.mineHelp') }}</span>
              </span>
              <input v-model="draft.mine" type="checkbox" class="peer sr-only" />
              <span class="relative h-6 w-11 shrink-0 rounded-full bg-slate-200 transition after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:bg-primary-600 peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 dark:bg-slate-600"></span>
            </label>

            <fieldset v-if="options.types.length">
              <legend :class="legendClass">{{ t('calendarFilters.types') }}</legend>
              <div class="mt-2 flex flex-wrap gap-2">
                <button v-for="type in options.types" :key="type.id" type="button" @click="toggle(draft.types, type.id)"
                  :aria-pressed="draft.types.includes(type.id)" :class="chipClass(draft.types.includes(type.id))">
                  <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: type.color || '#94a3b8' }"></span>
                  {{ type.name }}
                  <span v-if="!type.active" class="text-xs opacity-70">({{ t('calendarFilters.inactive') }})</span>
                </button>
              </div>
            </fieldset>

            <fieldset v-if="options.statuses.length">
              <legend :class="legendClass">{{ t('calendarFilters.statuses') }}</legend>
              <div class="mt-2 flex flex-wrap gap-2">
                <button v-for="status in options.statuses" :key="status.value" type="button" @click="toggle(draft.statuses, status.value)"
                  :aria-pressed="draft.statuses.includes(status.value)" :class="chipClass(draft.statuses.includes(status.value))">
                  {{ t(`status.${status.value}`) }}
                </button>
              </div>
              <!-- without view_inactive_schedule, other people's are only seen while pending or approved -->
              <p v-if="ownOnlyStatuses" class="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {{ t('calendarFilters.ownOnly', { statuses: ownOnlyStatuses }) }}
              </p>
            </fieldset>

            <fieldset v-if="options.people.length">
              <legend :class="legendClass">{{ t('calendarFilters.people') }}</legend>
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ t('calendarFilters.peopleHelp') }}</p>
              <input v-if="options.people.length > 8" v-model="search" type="search" :placeholder="t('calendarFilters.searchPeople')"
                class="mt-2 block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
              <ul class="mt-2 max-h-56 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <li v-for="person in shownPeople" :key="person.id">
                  <label class="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <input type="checkbox" :checked="draft.people.includes(person.id)" @change="toggle(draft.people, person.id)"
                      class="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-900" />
                    <UserAvatar :name="person.name" :src="person.avatar_url" />
                    <span class="min-w-0 flex-1 truncate text-slate-900 dark:text-white">{{ person.name }}</span>
                  </label>
                </li>
                <li v-if="!shownPeople.length" class="px-3 py-2 text-sm text-slate-500">{{ t('calendarFilters.noPeople') }}</li>
              </ul>
            </fieldset>

            <p v-if="!hasChoices" class="text-sm text-slate-500 dark:text-slate-400">{{ t('calendarFilters.noChoices') }}</p>
          </div>

          <footer class="flex gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-700">
            <button type="button" @click="clearAll" :disabled="!draftCount"
              class="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">
              {{ t('calendarFilters.clear') }}
            </button>
            <button type="button" @click="apply"
              class="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500">
              {{ draftCount ? t('calendarFilters.applyCount', { count: draftCount }) : t('calendarFilters.apply') }}
            </button>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { FunnelIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import UserAvatar from './common/UserAvatar.vue'
import { t } from '../i18n'
import { activeFilterCount, noFilters, type CalendarFilters } from '../utils/calendarFilters'
import type { CalendarFilterOptions } from '../utils/scheduleRules'

/** The calendar's filter button and its sheet. Changes count only once applied. */
const props = defineProps<{ modelValue: CalendarFilters; options: CalendarFilterOptions }>()
const emit = defineEmits<{ 'update:modelValue': [value: CalendarFilters] }>()

const open = ref(false)
const draft = ref<CalendarFilters>(noFilters())
const search = ref('')
const closeButton = ref<HTMLButtonElement | null>(null)

const count = computed(() => activeFilterCount(props.modelValue))
const draftCount = computed(() => activeFilterCount(draft.value))
const buttonLabel = computed(() => (count.value ? t('calendarFilters.buttonCount', { count: count.value }) : t('calendarFilters.title')))
const hasChoices = computed(() => props.options.types.length + props.options.statuses.length + props.options.people.length > 0)

const ownOnlyStatuses = computed(() => props.options.statuses
  .filter((status) => !status.everyone)
  .map((status) => t(`status.${status.value}`).toLowerCase())
  .join(', '))

// the chosen ones first, so they are easy to take off again
const shownPeople = computed(() => {
  const query = search.value.trim().toLowerCase()
  return props.options.people
    .filter((person) => !query || person.name.toLowerCase().includes(query))
    .sort((a, b) => Number(draft.value.people.includes(b.id)) - Number(draft.value.people.includes(a.id)))
    .slice(0, 50)
})

const legendClass = 'text-sm font-medium text-slate-900 dark:text-white'
const chipClass = (on: boolean) => ['inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition',
  on ? 'border-primary-500 bg-primary-50 font-medium text-primary-700 dark:border-primary-400 dark:bg-primary-500/15 dark:text-primary-300'
    : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700']

function toggle<T>(list: T[], value: T) {
  const index = list.indexOf(value)
  if (index === -1) list.push(value)
  else list.splice(index, 1)
}

async function openSheet() {
  const { mine, types, statuses, people } = props.modelValue
  draft.value = { mine, types: [...types], statuses: [...statuses], people: [...people] }
  search.value = ''
  open.value = true
  await nextTick()
  closeButton.value?.focus()
}

function clearAll() {
  draft.value = noFilters()
}

function apply() {
  emit('update:modelValue', draft.value)
  open.value = false
}
</script>
