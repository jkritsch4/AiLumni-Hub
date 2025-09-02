// Pseudocode — merge into your existing router
{
  path: '/join/:uniSlug',
  name: 'OnboardingLanding',
  component: () => import('../views/OnboardingLanding.vue')
},
{
  path: '/onboarding/:uniSlug',
  name: 'OnboardingWizard',
  component: () => import('../views/OnboardingWizard.vue'),
  children: [
    // Keep using your current step components; they will render inside OnboardingLayout
    // Example child step:
    { path: 'sport', component: () => import('../components/onboarding/SportSelection.vue') },
    // etc...
  ]
}