import { createRouter as createVueRouter, createWebHistory, type Router } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/', name: 'Home', component: () => import('../views/Home.vue') },
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
  { path: '/register', name: 'Register', component: () => import('../views/Register.vue') },
  { path: '/forgot-password', name: 'ForgotPassword', component: () => import('../views/ForgotPassword.vue'), meta: { public: true } },
  // opened from the email; works whoever is signed in on this device (the reset signs everyone out)
  { path: '/reset-password', name: 'ResetPassword', component: () => import('../views/ResetPassword.vue'), meta: { public: true } },
  { path: '/calendar', name: 'Calendar', component: () => import('../views/CalendarView.vue'), meta: { requiresAuth: true } },
  // the two calendars of before ("My agenda" is now the "Only mine" filter)
  { path: '/agenda/', redirect: '/calendar' },
  { path: '/my-agenda/', redirect: '/calendar' },
  { path: '/schedules/new', name: 'ScheduleNew', component: () => import('../views/ScheduleForm.vue'), meta: { requiresAuth: true } },
  { path: '/schedules/:id', name: 'ScheduleDetail', component: () => import('../views/ScheduleDetail.vue'), meta: { requiresAuth: true } },
  { path: '/schedules/:id/edit', name: 'ScheduleEdit', component: () => import('../views/ScheduleForm.vue'), meta: { requiresAuth: true } },
  { path: '/approvals', name: 'Approvals', component: () => import('../views/Approvals.vue'), meta: { requiresAuth: true, requiresApprover: true } },
  { path: '/notifications', name: 'Notifications', component: () => import('../views/Notifications.vue'), meta: { requiresAuth: true } },
  { path: '/profile', name: 'Profile', component: () => import('../views/Profile.vue'), meta: { requiresAuth: true } },
  { path: '/settings', name: 'Settings', component: () => import('../views/Settings.vue'), meta: { requiresAuth: true } },
  { path: '/auth/callback', name: 'SocialCallback', component: () => import('../views/SocialCallback.vue') },
  { path: '/pending-approval', name: 'PendingApproval', component: () => import('../views/PendingApproval.vue'), meta: { requiresAuth: true } },
  { path: '/connection-problem', name: 'ConnectionProblem', component: () => import('../views/ConnectionProblem.vue'), meta: { requiresAuth: true } }]

export default function createRouter(): Router {
  const router = createVueRouter({
    history: createWebHistory(),
    routes,
  })

  router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    const isAuthenticated = authStore.isAuthenticated()

    // password reset pages: for anyone, signed in or not
    if (to.meta.public) {
      return next()
    }

    if (to.meta.requiresAuth && !isAuthenticated) {
      return next({ name: 'Login', query: { redirect: to.fullPath } })
    }

    if (isAuthenticated) {
      // Signed in, but the account has not been loaded yet (no connection): not "pending",
      // just unknown. Wait on the retry screen, keeping the session and the wanted page.
      if (authStore.isUserUnknown()) {
        return to.name === 'ConnectionProblem'
          ? next()
          : next({ name: 'ConnectionProblem', query: { redirect: to.fullPath } })
      }
      if (to.name === 'ConnectionProblem') {
        return next({ name: 'Home' })
      }

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

      // Approval screen: only for people who can approve (the API enforces it as well)
      if (to.meta.requiresApprover && !authStore.canApprove()) {
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
