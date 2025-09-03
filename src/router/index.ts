import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../components/Dashboard.vue'
import OnboardingFlow from '../components/onboarding/OnboardingFlow.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // New: per-university landing (QR/social links)
    {
      path: '/join/:uniSlug',
      name: 'OnboardingLanding',
      component: () => import('../views/OnboardingLanding.vue'),
    },
    // New: per-university wizard wrapper with child steps
    {
      path: '/onboarding/:uniSlug',
      name: 'OnboardingWizard',
      component: () => import('../views/OnboardingWizard.vue'),
      children: [
        {
          path: 'sport',
          name: 'SportStep',
          component: () => import('../components/onboarding/SportSelection.vue'),
        },
        {
          path: 'notifications',
          name: 'NotificationsStep',
          component: () => import('../components/onboarding/NotificationPreferences.vue'),
        },
        // Default child route → sport step
        { path: '', redirect: { name: 'SportStep' } },
      ],
    },

    // Existing routes preserved for legacy onboarding
    {
      path: '/',
      component: OnboardingFlow,
      beforeEnter: (to, from, next) => {
        const isOnboardingComplete = localStorage.getItem('onboardingComplete')
        if (isOnboardingComplete) {
          next('/dashboard')
        } else {
          next()
        }
      }
    },
    {
      path: '/dashboard',
      component: Dashboard,
      beforeEnter: (to, from, next) => {
        const isOnboardingComplete = localStorage.getItem('onboardingComplete')
        if (!isOnboardingComplete && from.path !== '/') {
          next('/')
        } else {
          next()
        }
      }
    }
  ]
})

export default router