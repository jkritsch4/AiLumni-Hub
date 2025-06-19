import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../components/Dashboard.vue'
import OnboardingFlow from '../components/onboarding/OnboardingFlow.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
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