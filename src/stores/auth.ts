import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { authApi } from '../api/auth'
import type { Router } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  function setUser(newUser: User) {
    user.value = newUser
  }

  function clear() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
  }

  // The new, centralized logout function
  async function logout(router: Router) {
    try {
      // It's good practice to try logging out from the server first
      await authApi.logout()
    } catch (error) {
      console.error('API logout failed, proceeding with client-side logout.', error)
    } finally {
      // Always clear local state and redirect
      clear()
      router.replace({ name: 'Login' })
    }
  }

  const isAuthenticated = () => !!token.value
  const isApproved = () => !!user.value?.approved_at

  return {
    user, token, setToken, setUser, clear, logout,
    isAuthenticated, isApproved
  }
})