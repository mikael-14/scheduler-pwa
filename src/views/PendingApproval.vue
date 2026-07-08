<template>
  <div class="flex min-h-full flex-col justify-center bg-slate-50 py-12 dark:bg-slate-900 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
        Account Pending Approval
      </h2>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="rounded-2xl bg-white px-4 py-8 shadow-xl dark:bg-slate-800 sm:px-10">
        <div class="space-y-6 text-center">
          <p class="text-slate-600 dark:text-slate-300">
            Thank you for registering! Your account is currently awaiting approval from an administrator.
            You will be notified once your account is activated.
          </p>
          <button @click="handleLogout" class="w-full justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50">
            Logout
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = () => authStore.logout(router)
</script>