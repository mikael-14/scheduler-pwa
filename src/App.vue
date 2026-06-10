<template>
  <div :class="{ 'dark': isDark }">
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-primary-500/30">
      <!-- Desktop Sidebar -->
      <aside class="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 lg:flex">
        <div class="flex h-16 items-center border-b border-slate-200 px-6 dark:border-slate-800">
          <router-link to="/" class="flex items-center gap-2 font-bold text-primary-600 dark:text-primary-500">
            <span class="text-2xl">📅</span>
            <span>Scheduler</span>
          </router-link>
        </div>
        <nav class="flex-1 overflow-y-auto p-4 space-y-1">
          <NavItem to="/" icon="HomeIcon">Home</NavItem>
          <NavItem to="/calendar/my-schedule" icon="CalendarIcon">My Schedule</NavItem>
          <NavItem to="/profile" icon="UserIcon">Profile</NavItem>
          <NavItem to="/settings" icon="Cog6ToothIcon">Settings</NavItem>
        </nav>
        <div class="border-t border-slate-200 p-4 dark:border-slate-800">
          <button @click="logout" class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100">
            <ArrowRightOnRectangleIcon class="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      <!-- Mobile Top Bar -->
      <header class="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 ">
        <button @click="isMobileMenuOpen = true" class="text-slate-500 dark:text-slate-400">
          <Bars3Icon class="h-6 w-6" />
        </button>
        <router-link to="/" class="text-lg font-bold text-primary-600 dark:text-primary-500 lg:hidden">Scheduler</router-link>
        <div class="flex items-center gap-2">
           <button class="p-2 text-slate-500 dark:text-slate-400">
            <component :is="isDark ? SunIcon : MoonIcon" class="h-5 w-5" />
          </button>
          <router-link to="/profile" class="h-8 w-8 overflow-hidden rounded-full border border-slate-200 dark:border-slate-700">
            <img :src="user?.avatar_url || 'https://ui-avatars.com/api/?name=' + (user?.name || 'User')" alt="Avatar" />
          </router-link>
        </div>
      </header>

      <!-- Mobile Menu Overlay -->
      <div v-if="isMobileMenuOpen" class="fixed inset-0 z-[60] lg:hidden">
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" @click="isMobileMenuOpen = false"></div>
        <nav class="fixed inset-y-0 left-0 w-64 bg-white p-4 dark:bg-slate-900">
          <div class="flex items-center justify-between mb-8">
             <router-link to="/" class="flex items-center gap-2 font-bold text-primary-600 dark:text-primary-500" @click="isMobileMenuOpen = false">
              <span class="text-xl">📅</span>
              <span>Scheduler</span>
            </router-link>
            <button @click="isMobileMenuOpen = false" class="text-slate-500">
              <XMarkIcon class="h-6 w-6" />
            </button>
          </div>
          <div class="space-y-1">
            <NavItem to="/" icon="HomeIcon" @click="isMobileMenuOpen = false">Home</NavItem>
            <NavItem to="/calendar/my-schedule" icon="CalendarIcon" @click="isMobileMenuOpen = false">My Schedule</NavItem>
            <NavItem to="/profile" icon="UserIcon" @click="isMobileMenuOpen = false">Profile</NavItem>
            <NavItem to="/settings" icon="Cog6ToothIcon" @click="isMobileMenuOpen = false">Settings</NavItem>
          </div>
          <div class="absolute bottom-4 left-4 right-4 border-t border-slate-200 pt-4 dark:border-slate-800">
             <button @click="logout" class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
              <ArrowRightOnRectangleIcon class="h-5 w-5" />
              Logout
            </button>
          </div>
        </nav>
      </div>

      <!-- Main Content Area -->
      <main class="lg:pl-64">
        <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <router-view />
        </div>
      </main>

      <!-- Mobile Bottom Navigation (Optional but often better for PWAs) -->
      <nav class="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white px-2 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
        <router-link to="/" class="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400" active-class="text-primary-600 dark:text-primary-500">
          <HomeIcon class="h-6 w-6" />
          <span class="text-[10px] font-medium">Home</span>
        </router-link>
        <router-link to="/calendar/my-schedule" class="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400" active-class="text-primary-600 dark:text-primary-500">
          <CalendarIcon class="h-6 w-6" />
          <span class="text-[10px] font-medium">Schedule</span>
        </router-link>
         <router-link to="/settings" class="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400" active-class="text-primary-600 dark:text-primary-500">
          <Cog6ToothIcon class="h-6 w-6" />
          <span class="text-[10px] font-medium">Settings</span>
        </router-link>
        <router-link to="/profile" class="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400" active-class="text-primary-600 dark:text-primary-500">
          <UserIcon class="h-6 w-6" />
          <span class="text-[10px] font-medium">Profile</span>
        </router-link>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { authApi } from './api/auth'
import { useDark, useToggle } from '@vueuse/core'
import { 
  HomeIcon, 
  CalendarIcon, 
  UserIcon, 
  Cog6ToothIcon, 
  Bars3Icon, 
  XMarkIcon, 
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/vue/24/outline'
import { NavItem } from './components/common'

const authStore = useAuthStore()
const user = authStore.user
const router = useRouter()
const isMobileMenuOpen = ref(false)

const isDark = useDark()
const toggleDarkMode = useToggle(isDark)

const logout = async () => {
  await authApi.logout()
  router.push('/login')
}

onMounted(() => {
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