import { createRouter as createVueRouter, createWebHistory, type Router } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/', name: 'Home', component: () => import('../views/Home.vue') },
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
  { path: '/register', name: 'Register', component: () => import('../views/Register.vue') },
  { path: '/my-agenda/', name: 'My Agenda', component: () => import('../views/MyAgenda.vue'), meta: { requiresAuth: true } },
  { path: '/agenda/', name: 'Agenda', component: () => import('../views/Agenda.vue'), props: true, meta: { requiresAuth: true } },
  { path: '/notifications', name: 'Notifications', component: () => import('../views/Notifications.vue'), meta: { requiresAuth: true } },
  { path: '/profile', name: 'Profile', component: () => import('../views/Profile.vue'), meta: { requiresAuth: true } },
  { path: '/settings', name: 'Settings', component: () => import('../views/Settings.vue'), meta: { requiresAuth: true } },
  { path: '/auth/callback', name: 'SocialCallback', component: () => import('../views/SocialCallback.vue') }
]

export default function createRouter(): Router {
  const router = createVueRouter({
    history: createWebHistory(),
    routes,
  })

  router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    const isAuthenticated = authStore.isAuthenticated()

    if (to.meta.requiresAuth && !isAuthenticated) {
      next('/login')
    } else if ((to.path === '/login' || to.path === '/register') && isAuthenticated) {
      // If a logged-in user hits login/register, send them to their agenda.
      next({ name: 'My Agenda' })
    } else {
      next()
    }
  })

  return router
}
