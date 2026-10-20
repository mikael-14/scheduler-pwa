<template>
  <div ref="root" class="relative mt-1" @keydown.esc="open = false">
    <button type="button" :id="id" @click="open = !open" aria-haspopup="listbox" :aria-expanded="open"
      class="flex w-full items-center gap-2 rounded-lg border border-slate-300 bg-white p-2 text-left text-sm font-normal text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
      <UserAvatar :name="selected.name" :src="selected.avatar_url" size="h-5 w-5" />
      <span class="min-w-0 flex-1 truncate">{{ selected.label }}</span>
      <ChevronUpDownIcon class="h-4 w-4 shrink-0 text-slate-400" />
    </button>

    <div v-if="open"
      class="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <div v-if="people.length > 8" class="border-b border-slate-100 p-2 dark:border-slate-700">
        <input ref="searchInput" v-model="search" type="search" :placeholder="searchPlaceholder"
          class="block w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm font-normal text-slate-900 focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
      </div>
      <ul role="listbox" class="max-h-60 overflow-y-auto py-1">
        <li v-for="option in options" :key="option.id ?? 'none'" role="option"
          :aria-selected="option.id === modelValue">
          <button type="button" @click="choose(option.id)"
            :class="['flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-normal hover:bg-slate-50 dark:hover:bg-slate-700',
              option.id === modelValue ? 'text-primary-700 dark:text-primary-300' : 'text-slate-900 dark:text-white']">
            <UserAvatar :name="option.name" :src="option.avatar_url" />
            <span class="min-w-0 flex-1 truncate">{{ option.label }}</span>
            <CheckIcon v-if="option.id === modelValue" class="h-4 w-4 shrink-0" />
          </button>
        </li>
        <li v-if="!options.length" class="px-3 py-2 text-sm font-normal text-slate-500">{{ emptyText }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/vue/20/solid'
import UserAvatar from './UserAvatar.vue'

type Person = { id: number; name: string; avatar_url?: string | null }

/** A person picker that shows each one's photo (a native <select> cannot). `null` = the `none` choice. */
const props = defineProps<{
  modelValue: number | null
  people: Person[]
  /** the `null` choice, e.g. "Me" with the signed-in user's photo */
  none: { label: string; name: string; avatar_url?: string | null }
  searchPlaceholder?: string
  emptyText?: string
  id?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()

const root = ref<HTMLElement | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)
const open = ref(false)
const search = ref('')

onClickOutside(root, () => (open.value = false))
watch(open, async (isOpen) => {
  search.value = ''
  if (isOpen) {
    await nextTick()
    searchInput.value?.focus()
  }
})

const noneOption = computed(() => ({ id: null as number | null, ...props.none }))

const options = computed(() => {
  const wanted = search.value.trim().toLowerCase()
  const people = props.people
    .filter((person) => person.name.toLowerCase().includes(wanted))
    .map((person) => ({ ...person, label: person.name }))
  return wanted ? people : [noneOption.value, ...people]
})

const selected = computed(() => {
  const person = props.people.find((option) => option.id === props.modelValue)
  return person ? { ...person, label: person.name } : noneOption.value
})

const choose = (id: number | null) => {
  emit('update:modelValue', id)
  open.value = false
}
</script>
