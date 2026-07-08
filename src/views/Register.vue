<template>
  <AuthLayout>
    <template #heading>Create your account</template>
    <template #subheading>
      Already have an account?
      <router-link to="/login" class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">Sign in
        instead</router-link>
    </template>

    <div class="mt-8 rounded-2xl bg-white p-8 shadow-sm dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <form class="space-y-6" @submit.prevent="handleRegister">
          <div>
            <label for="full-name" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Full
              Name</label>
            <div class="mt-1">
              <input v-model="form.name" id="full-name" name="name" type="text" autocomplete="name" required
                class="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:text-sm"
                placeholder="John Doe" />
            </div>
          </div>

          <div>
            <label for="email-address" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Email
              address</label>
            <div class="mt-1">
              <input v-model="form.email" id="email-address" name="email" type="email" autocomplete="email" required
                class="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:text-sm"
                placeholder="you@example.com" />
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label for="password"
                class="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
              <div class="mt-1">
                <PasswordInput v-model="form.password" v-model:show="showPassword" id="password" name="password" autocomplete="new-password" />
              </div>
            </div>

            <div>
              <label for="password-confirm"
                class="block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm</label>
              <div class="mt-1">
                <PasswordInput v-model="form.password_confirmation" v-model:show="showPassword" id="password-confirm" name="password_confirmation" autocomplete="new-password" />
              </div>
            </div>
          </div>

          <div>
            <button type="submit" :disabled="loading"
              class="flex w-full justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 transition-all">
              <span v-if="loading" class="mr-2 animate-spin">⌛</span>
              Create Account
            </button>
          </div>
        </form>

        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-slate-300 dark:border-slate-700"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="bg-white px-2 text-slate-500 dark:bg-slate-900">Or join with</span>
            </div>
          </div>

          <div class="mt-6 grid grid-cols-2 gap-3">
            <button
              class="inline-flex w-full justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" class="mr-2 h-5 w-5" alt="Google" />
              Google
            </button>
            <button
              class="inline-flex w-full justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">
              <img src="https://www.svgrepo.com/show/448224/facebook.svg" class="mr-2 h-5 w-5" alt="Facebook" />
              Facebook
            </button>
          </div>
        </div>
      </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '../api/auth'
import AuthLayout from '../components/AuthLayout.vue'
import PasswordInput from '../components/PasswordInput.vue'

const form = reactive({
  name: '',
  email: '',
  password: '',
  password_confirmation: ''
})

const loading = ref(false)
const showPassword = ref(false)
const router = useRouter()

const handleRegister = async () => {
  if (form.password !== form.password_confirmation) {
    alert('Passwords do not match')
    return
  }

  loading.value = true
  try {
    await authApi.register(form)
    router.push('/')
  } catch (error) {
    alert('Registration failed. Please check your details.')
  } finally {
    loading.value = false
  }
}
</script>