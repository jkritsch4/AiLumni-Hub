import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../components/Dashboard.vue'
import OnboardingFlow from '../components/onboarding/OnboardingFlow.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // University landing (QR/social links)
    {
      path: '/join/:uniSlug',
      name: 'OnboardingLanding',
      component: () => import('../views/OnboardingLanding.vue'),
    },

    // Wizard with ordered child steps
    {
      path: '/onboarding/:uniSlug',
      name: 'OnboardingWizard',
      component: () => import('../views/OnboardingWizard.vue'),
      children: [
        // Default → first step
        {
          path: '',
          name: 'OnboardingWizardIndex',
          redirect: { name: 'ConfirmStep' },
        },
        {
          path: 'confirm',
          name: 'ConfirmStep',
          component: () => import('../components/onboarding/UniversityConfirmation.vue'),
        },
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
      ],
    },

    // Legacy root path flow (kept for backwards compatibility)
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
  ],
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' }
  }
})

export default router