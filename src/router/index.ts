import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../components/Dashboard.vue'
import OnboardingFlow from '../components/onboarding/OnboardingFlow.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/join/:uniSlug',
      name: 'OnboardingLanding',
      component: () => import('../views/OnboardingLanding.vue'),
    },
    {
      path: '/onboarding/:uniSlug',
      name: 'OnboardingWizard',
      component: () => import('../views/OnboardingWizard.vue'),
      children: [
        {
          path: '',
          name: 'OnboardingWizardIndex',
          redirect: { name: 'SportStep' },
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
        {
          path: 'account',
          name: 'AccountStep',
          component: () => import('../components/onboarding/AccountInformation.vue'),
        },
      ],
    },
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