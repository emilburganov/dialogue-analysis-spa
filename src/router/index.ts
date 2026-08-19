import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/',
      component: () => import('@/views/DialoguesLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dialogues',
          component: { template: '<div />' },
        },
        {
          path: 'dialogues/:id',
          name: 'dialogue',
          component: { template: '<div />' },
        },
      ],
    },
    {
      path: '/analysis-rules',
      name: 'analysis-rules',
      component: () => import('@/views/AnalysisRulesView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.initialized) {
    await auth.initialize()
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.guest && auth.isAuthenticated) {
    return { name: 'dialogues' }
  }

  if (to.meta.requiresAdmin && auth.user?.role !== 'admin') {
    return { name: 'dialogues' }
  }

  return true
})

export default router
