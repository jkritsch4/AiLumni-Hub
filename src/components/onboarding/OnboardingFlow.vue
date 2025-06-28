<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import UniversityConfirmation from './UniversityConfirmation.vue'
import SportSelection from './SportSelection.vue'
import NotificationPreferences from './NotificationPreferences.vue'

interface OnboardingProps {
  isVisible: boolean;
  defaultUniversity: {
    name: string;
    logo: string;
  };
}

const props = defineProps<OnboardingProps>();

const emit = defineEmits<{
  (e: 'onboarding-complete', data: {
    university: {
      name: string;
      logo: string;
    };
    sports: string[];
    notifications: Record<string, boolean>; 
  }): void;
}>();

const router = useRouter()

const currentStepIndex = ref(0);
const collectedData = ref({
  university: props.defaultUniversity,
  sports: ['UCSD Baseball'],
  notifications: {
    scores: true,
    scheduling: true,
    news: true
  }
});

const totalSteps = 3;

const steps = [
  UniversityConfirmation,
  SportSelection,
  NotificationPreferences
];

const currentComponent = computed(() => steps[currentStepIndex.value]);

const handleOnboardingComplete = (data: any) => {
  console.log('Onboarding completed with data:', data)
  // Save onboarding data if needed
  localStorage.setItem('onboardingComplete', 'true')
  // Redirect to dashboard
  router.push('/dashboard')
}

// Update the handleNextStep function
const handleNextStep = (data: Partial<typeof collectedData.value>) => {
  if (data) {
    updateCollectedData(data)
  }
  
  if (currentStepIndex.value === totalSteps - 1) {
    handleOnboardingComplete(collectedData.value)
  } else {
    currentStepIndex.value++
  }
}

const handlePreviousStep = () => {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--;
  }
}

const updateCollectedData = (data: Partial<typeof collectedData.value>) => {
  collectedData.value = {
    ...collectedData.value,
    ...data
  };
}

// Add debug logging
onMounted(() => {
  console.log('[OnboardingFlow] Component mounted')
  console.log('[OnboardingFlow] Props:', props)
  console.log('[OnboardingFlow] Initial collected data:', collectedData.value)
})

watch(() => props.isVisible, (newValue) => {
  console.log('[OnboardingFlow] Visibility changed:', newValue)
})
</script>

<template>
  <div class="onboarding-container" :class="{ 'fade-out': !isVisible }">
    <div class="onboarding-card">
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: `${(currentStepIndex / (totalSteps - 1)) * 100}%` }"
        ></div>
      </div>
      
      <transition name="slide" mode="out-in">
        <component 
          :is="currentComponent"
          :university-data="defaultUniversity"
          :selected-data="collectedData"
          @next-step="handleNextStep"
          @previous-step="handlePreviousStep"
          @update-data="updateCollectedData"
        />
      </transition>

      <div class="progress-dots">
        <span 
          v-for="(step, index) in totalSteps" 
          :key="index"
          :class="['dot', { active: currentStepIndex === index }]"
        ></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.onboarding-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background-image: url('/images/AiLumniHub.jpg');
  background-size: cover;
  background-position: center;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  transition: opacity 0.5s ease-in-out;
}

.onboarding-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--background-overlay, rgba(24, 43, 73, 0.85));
  z-index: -1;
}

.onboarding-container.fade-out {
  opacity: 0;
  pointer-events: none;
}

.onboarding-card {
  max-width: 500px;
  width: 90%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  color: white;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  margin-bottom: 2rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--progress-color, var(--secondary-color, #FFB81C));
  transition: width 0.3s ease-in-out;
}

.progress-dots {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e0e0e0;
  transition: background-color 0.3s ease;
}

.dot.active {
  background: var(--primary-color, #182B49);
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.5s ease, opacity 0.5s ease;
}

.slide-enter-from {
  transform: translateX(30px);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(-30px);
  opacity: 0;
}
</style>
