<template>
  <div :class="{ 'dark': isDark }">
    <div
      class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-primary-500/30">
      <!-- Desktop Sidebar -->
      <aside v-if="authStore.isAuthenticated()"
        class="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 lg:flex">
        <div class="flex h-16 items-center border-b border-slate-200 px-6 dark:border-slate-800">
          <router-link to="/" class="flex items-center gap-2 font-bold text-primary-600 dark:text-primary-500">
            <span class="text-2xl">📅</span>
            <span>Scheduler</span>
          </router-link>
        </div>
        <nav class="flex-1 overflow-y-auto p-4 space-y-1">
          <NavItem to="/" icon="HomeIcon">Home</NavItem>
          <NavItem to="/my-agenda/" icon="CalendarIcon">My Agenda</NavItem>
          <NavItem to="/agenda/" icon="CalendarDaysIcon">Agenda</NavItem>
          <NavItem to="/notifications" icon="BellIcon">Notifications</NavItem>
          <NavItem to="/profile" icon="UserIcon">Profile</NavItem>
          <NavItem to="/settings" icon="Cog6ToothIcon">Settings</NavItem>
        </nav>
        <div class="border-t border-slate-200 p-4 dark:border-slate-800">
          <button @click="logout"
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100">
            <ArrowRightOnRectangleIcon class="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      <!-- Top Bar -->
      <header v-if="authStore.isAuthenticated()"
        class="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 ">
        <button @click="isMobileMenuOpen = true" class="text-slate-500 dark:text-slate-400">
          <Bars3Icon class="h-6 w-6" />
        </button>
        <router-link to="/"
          class="text-lg font-bold text-primary-600 dark:text-primary-500 lg:hidden">Scheduler</router-link>
        <div class="flex items-center gap-2">
          <div
            class="relative flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <button type="button" @click="languageMenuOpen = !languageMenuOpen"
              class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              aria-label="Change language">
              <GlobeAltIcon class="h-5 w-5" />
            </button>
            <div v-if="languageMenuOpen"
              class="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
              <template v-for="option in languageOptions" :key="option.value">
                <button type="button" @click="selectLanguage(option.value)"
                  class="flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                  <span>{{ option.label }}</span>
                  <span v-if="selectedLanguage === option.value" class="text-primary-600 dark:text-primary-400">✓</span>
                </button>
              </template>
            </div>
          </div>
          <button class="p-2 text-slate-500 dark:text-slate-400" @click="toggleDarkMode">
            <component :is="isDark ? SunIcon : MoonIcon" class="h-5 w-5" />
          </button>
          <router-link to="/profile"
            class="h-8 w-8 overflow-hidden rounded-full border border-slate-200 dark:border-slate-700">
            <img :src="user?.avatar_url || 'https://ui-avatars.com/api/?name=' + (user?.name || 'User')" alt="Avatar" />
          </router-link>
        </div>
      </header>

      <!-- Mobile Menu Overlay -->
      <div v-if="isMobileMenuOpen" class="fixed inset-0 z-[60] lg:hidden">
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" @click="isMobileMenuOpen = false"></div>
        <nav v-if="authStore.isAuthenticated()" class="fixed inset-y-0 left-0 w-64 bg-white p-4 dark:bg-slate-900">
          <div class="flex items-center justify-between mb-8">
            <router-link to="/" class="flex items-center gap-2 font-bold text-primary-600 dark:text-primary-500"
              @click="isMobileMenuOpen = false">
              <span class="text-xl">📅</span>
              <span>Scheduler</span>
            </router-link>
            <button @click="isMobileMenuOpen = false" class="text-slate-500">
              <XMarkIcon class="h-6 w-6" />
            </button>
          </div>
          <div class="space-y-1">
            <NavItem to="/" icon="HomeIcon" @click="isMobileMenuOpen = false">Home</NavItem>
            <NavItem to="/my-agenda/" icon="CalendarIcon" @click="isMobileMenuOpen = false">My Agenda</NavItem>
            <NavItem to="/agenda/" icon="CalendarDaysIcon" @click="isMobileMenuOpen = false">Agenda</NavItem>
            <NavItem to="/notifications" icon="BellIcon" @click="isMobileMenuOpen = false">Notifications</NavItem>
            <NavItem to="/profile" icon="UserIcon" @click="isMobileMenuOpen = false">Profile</NavItem>
            <NavItem to="/settings" icon="Cog6ToothIcon" @click="isMobileMenuOpen = false">Settings</NavItem>
          </div>
          <div class="absolute bottom-4 left-4 right-4 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button @click="logout"
              class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
              <ArrowRightOnRectangleIcon class="h-5 w-5" />
              Logout
            </button>
          </div>
        </nav>
      </div>

      <!-- Main Content Area -->
      <main :class="authStore.isAuthenticated() ? 'lg:pl-64' : ''">
        <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <router-view />
        </div>
      </main>

      <!-- Mobile Bottom Navigation (Optional but often better for PWAs) -->
      <nav v-if="authStore.isAuthenticated()"
        class="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white px-2 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
        <router-link to="/" class="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400"
          active-class="text-primary-600 dark:text-primary-500">
          <HomeIcon class="h-6 w-6" />
          <span class="text-[10px] font-medium">Home</span>
        </router-link>
        <router-link to="/my-agenda/" class="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400"
          active-class="text-primary-600 dark:text-primary-500">
          <CalendarIcon class="h-6 w-6" />
          <span class="text-[10px] font-medium">My Agenda</span>
        </router-link>
        <router-link to="/agenda/" class="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400"
          active-class="text-primary-600 dark:text-primary-500">
          <CalendarDaysIcon class="h-6 w-6" />
          <span class="text-[10px] font-medium">Agenda</span>
        </router-link>
        <router-link to="/notifications" class="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400"
          active-class="text-primary-600 dark:text-primary-500">
          <BellIcon class="h-6 w-6" />
          <span class="text-[10px] font-medium">Notifications</span>
        </router-link>
        <router-link to="/settings" class="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400"
          active-class="text-primary-600 dark:text-primary-500">
          <Cog6ToothIcon class="h-6 w-6" />
          <span class="text-[10px] font-medium">Settings</span>
        </router-link>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { authApi } from './api/auth'
import { useDark } from '@vueuse/core'
import {
  HomeIcon,
  CalendarIcon,
  CalendarDaysIcon,
  BellIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  GlobeAltIcon
} from '@heroicons/vue/24/outline'
import { NavItem } from './components/common'

const authStore = useAuthStore()
const user = computed(() => authStore.user)
const router = useRouter()
const isMobileMenuOpen = ref(false)
const languageMenuOpen = ref(false)
const selectedLanguage = computed(() => user?.value?.language || 'pt')
const languageOptions: Array<{ value: 'pt' | 'en'; label: string }> = [
  { value: 'pt', label: 'Português' },
  { value: 'en', label: 'English' }
]

const setLanguage = async (language: 'pt' | 'en') => {
  if (!user.value) return

  const previousLanguage = user.value.language
  user.value.language = language

  try {
    await authApi.updateProfile({ language })
  } catch (error) {
    user.value.language = previousLanguage
    alert('Unable to save language preference. Please try again.')
  }
}

const selectLanguage = async (language: 'pt' | 'en') => {
  languageMenuOpen.value = false
  await setLanguage(language)
}

const isDark = useDark()

const THEME_KEY = 'theme'

const toggleDarkMode = () => {
  isDark.value = !isDark.value
  try {
    localStorage.setItem(THEME_KEY, isDark.value ? 'dark' : 'light')
  } catch (e) {
    /* ignore storage errors */
  }
  document.documentElement.classList.toggle('dark', isDark.value)
}

watch(isDark, (val) => {
  document.documentElement.classList.toggle('dark', val)
})

const logout = async () => {
  await authApi.logout()
  router.push('/login')
}

onMounted(() => {
  // Initialize theme: prefer saved value, else use system preference
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'dark' || stored === 'light') {
      isDark.value = stored === 'dark'
    } else if (window.matchMedia) {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
  } catch (e) {
    if (window.matchMedia) {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
  }

  document.documentElement.classList.toggle('dark', isDark.value)

  if (!authStore.isAuthenticated() && router.currentRoute.value.path !== '/login' && router.currentRoute.value.path !== '/register') {
    router.push('/login')
  }
})
</script>

<style>
@import './styles/tailwind.css';

body {
  @apply antialiased;
}

/* Custom scrollbar for Filament style */
::-webkit-scrollbar {
  width: 5px;
}

::-webkit-scrollbar-track {
  @apply bg-transparent;
}

::-webkit-scrollbar-thumb {
  @apply bg-slate-300 dark:bg-slate-700 rounded-full;
}
</style>