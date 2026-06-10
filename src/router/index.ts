import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Home', component: () => import('../views/Home.vue') },
  { path: '/login', name: 'Login', component: () => import('../components/Login.vue') },
  { path: '/register', name: 'Register', component: () => import('../views/Register.vue') },
  { path: '/calendar/:categoryId', name: 'Calendar', component: () => import('../views/CalendarView.vue'), props: true },
  { path: '/profile', name: 'Profile', component: () => import('../views/Profile.vue') },
  { path: '/settings', name: 'Settings', component: () => import('../views/Settings.vue') },
  { path: '/share/:categoryId', name: 'Share', component: () => import('../views/ShareView.vue'), props: true },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
