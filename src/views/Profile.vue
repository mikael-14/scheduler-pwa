<template>
  <div class="max-w-4xl mx-auto space-y-8">
    <header>
      <h1 class="text-3xl font-bold text-slate-900 dark:text-white">Profile Settings</h1>
      <p class="mt-2 text-slate-600 dark:text-slate-400">Manage your account information and preferences.</p>
    </header>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <!-- Sidebar Info -->
      <div class="space-y-1">
        <h3 class="text-lg font-medium text-slate-900 dark:text-white">Personal Information</h3>
        <p class="text-sm text-slate-600 dark:text-slate-400">Use a permanent address where you can receive mail.</p>
      </div>

      <!-- Main Form -->
      <div class="lg:col-span-2">
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <form @submit.prevent="updateProfile" class="space-y-6">
            <div class="flex items-center gap-6">
              <div class="relative h-20 w-20">
                <img :src="user?.avatar_url || 'https://ui-avatars.com/api/?name=' + user?.name" class="h-full w-full rounded-full border border-slate-200 object-cover dark:border-slate-700" alt="Avatar" />
                <button type="button" class="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                  <CameraIcon class="h-4 w-4" />
                </button>
              </div>
              <div>
                <h4 class="text-sm font-medium text-slate-900 dark:text-white">Profile Photo</h4>
                <p class="text-xs text-slate-500 dark:text-slate-400">JPG, GIF or PNG. Max size of 2MB.</p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div class="space-y-2">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                <input v-model="profile.name" type="text" class="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:text-sm" />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                <input v-model="profile.email" type="email" class="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:text-sm" />
              </div>
            </div>

            <div class="flex justify-end pt-4">
              <button type="submit" :disabled="loading" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Security Section -->
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-3 pt-8 border-t border-slate-200 dark:border-slate-800">
      <div class="space-y-1">
        <h3 class="text-lg font-medium text-slate-900 dark:text-white">Security</h3>
        <p class="text-sm text-slate-600 dark:text-slate-400">Update your password to keep your account secure.</p>
      </div>

      <div class="lg:col-span-2">
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
           <form @submit.prevent="updatePassword" class="space-y-6">
              <div class="space-y-2">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Current Password</label>
                <input v-model="passwords.current" type="password" class="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:text-sm" />
              </div>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                 <div class="space-y-2">
                  <label class="text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                  <input v-model="passwords.new" type="password" class="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:text-sm" />
                </div>
                 <div class="space-y-2">
                  <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password</label>
                  <input v-model="passwords.confirm" type="password" class="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:text-sm" />
                </div>
              </div>
              <div class="flex justify-end pt-4">
                <button type="submit" :disabled="loading" class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
                  Update Password
                </button>
              </div>
           </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuthStore } from '../stores/auth'
import { CameraIcon } from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const user = authStore.user

const loading = ref(false)
const profile = reactive({
  name: user?.name || '',
  email: user?.email || ''
})

const passwords = reactive({
  current: '',
  new: '',
  confirm: ''
})

const updateProfile = async () => {
  loading.value = true
  try {
    // API Call would go here
    alert('Profile updated successfully!')
  } catch (error) {
    alert('Failed to update profile.')
  } finally {
    loading.value = false
  }
}

const updatePassword = async () => {
   loading.value = true
  try {
    // API Call would go here
    alert('Password updated successfully!')
  } catch (error) {
    alert('Failed to update password.')
  } finally {
    loading.value = false
  }
}
</script>
