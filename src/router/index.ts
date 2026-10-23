import { createRouter, createWebHistory } from 'vue-router'
import { apiConfig } from '@/config/api'
import { hasStoredBearerToken } from '@/services/tokenState'
import { useAuthStore } from '@/stores/authStore'
import { useConversationStore } from '@/stores/conversationStore'
import { useToastStore } from '@/stores/toastStore'
import AppShell from '@/components/layout/AppShell.vue'
import ChatView from '@/views/ChatView.vue'
import LoginView from '@/views/LoginView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import RegisterView from '@/views/RegisterView.vue'
import SettingsView from '@/views/SettingsView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: AppShell,
      children: [
        { path: '', redirect: { name: 'chat' } },
        {
          path: 'chat/:conversationId?',
          name: 'chat',
          component: ChatView,
          meta: { requiresAuth: true },
        },
        {
          path: 'settings',
          name: 'settings',
          component: SettingsView,
          meta: { requiresAuth: true },
        },
      ],
    },
    { path: '/login', name: 'login', component: LoginView, meta: { guest: true } },
    { path: '/register', name: 'register', component: RegisterView, meta: { guest: true } },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const mustWait = apiConfig.requireAuth || apiConfig.useMock || (apiConfig.authMode === 'bearer' && hasStoredBearerToken())
  if (mustWait) await auth.restore()
  else void auth.restore()

  const history = useConversationStore()
  await history.ensureLoaded()

  if (apiConfig.requireAuth && to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guest && auth.isAuthenticated) return { name: 'chat' }
  return true
})

window.addEventListener('legalai:unauthorized', () => {
  const auth = useAuthStore()
  if (!auth.isAuthenticated) return
  auth.clearSession()
  useToastStore().error('Phiên đăng nhập không còn hiệu lực. Vui lòng đăng nhập lại.')
  if (apiConfig.requireAuth && router.currentRoute.value.name !== 'login') {
    const redirect = router.currentRoute.value.fullPath
    void router.push({ name: 'login', query: { reason: 'expired', redirect } })
  }
})
