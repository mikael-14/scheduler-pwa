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
  { path: '/auth/callback', name: 'SocialCallback', component: () => import('../views/SocialCallback.vue') },
  { path: '/pending-approval', name: 'PendingApproval', component: () => import('../views/PendingApproval.vue'), meta: { requiresAuth: true } }]

export default function createRouter(): Router {
  const router = createVueRouter({
    history: createWebHistory(),
    routes,
  })

  router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    const isAuthenticated = authStore.isAuthenticated()

    if (to.meta.requiresAuth && !isAuthenticated) {
      return next({ name: 'Login', query: { redirect: to.fullPath } })
    }

    if (isAuthenticated) {
      const isApproved = authStore.isApproved()

      // Redirect logged-in users from login/register
      if (to.name === 'Login' || to.name === 'Register') {
        return next({ name: 'Home' })
      }

      // If the user is authenticated but not approved, they should only be able
      // to see the 'PendingApproval' page. Redirect them there from any other page.
      if (!isApproved && to.name !== 'PendingApproval') {
        return next({ name: 'PendingApproval' })
      }

      // If an approved user somehow lands on the pending page, redirect them home.
      if (isApproved && to.name === 'PendingApproval') {
        return next({ name: 'Home' })
      }

      // If we've reached this point, the user is either approved and can go anywhere,
      // or they are unapproved and are correctly on the PendingApproval page.
      return next()
    }

    // For unauthenticated users
    next()
  })

  return router
}
