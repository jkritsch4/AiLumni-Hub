import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../components/Dashboard.vue'
import OnboardingFlow from '../components/onboarding/OnboardingFlow.vue'
import UniversityConfirmation from '../components/onboarding/UniversityConfirmation.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/onboarding'
    },
    {
      path: '/onboarding',
      component: OnboardingFlow,
      children: [
        {
          path: '',
          component: UniversityConfirmation
        }
      ]
    },
    {
      path: '/dashboard',
      component: Dashboard,
      beforeEnter: (to, from, next) => {
        const isOnboardingComplete = localStorage.getItem('onboardingComplete')
        if (!isOnboardingComplete && from.path !== '/onboarding') {
          next('/onboarding')
        } else {
          next()
        }
      }
    }
  ]
})

export default router