import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const token = ref(localStorage.getItem('token'))

  watch(user, (val) => {
    if (val) localStorage.setItem('user', JSON.stringify(val))
    else localStorage.removeItem('user')
  }, { deep: true })

  watch(token, (val) => {
    if (val) localStorage.setItem('token', val)
    else localStorage.removeItem('token')
  })

  function setUser(u: any) {
    user.value = u
  }
  function setToken(t: string | null) {
    token.value = t
  }
  function logout() {
    user.value = null
    token.value = null
  }

  const isAuthenticated = () => !!token.value

  return { user, token, setUser, setToken, logout, isAuthenticated }
})
