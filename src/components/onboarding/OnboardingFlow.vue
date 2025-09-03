<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import OnboardingLayout from './OnboardingLayout.vue'
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

const router = useRouter()
const currentStepIndex = ref(0);
const totalSteps = 3;

const collectedData = ref({
  university: { ...props.defaultUniversity }, // will be overwritten by landing/confirmation
  sports: ['UCSD Baseball'],
  notifications: { scores: true, scheduling: true, news: true }
});

const steps = [UniversityConfirmation, SportSelection, NotificationPreferences];
const currentComponent = computed(() => steps[currentStepIndex.value]);

function updateCollectedData(data: Partial<typeof collectedData.value>) {
  collectedData.value = { ...collectedData.value, ...data }
}

function handleNextStep(data?: Partial<typeof collectedData.value>) {
  if (data) updateCollectedData(data)
  if (currentStepIndex.value === totalSteps - 1) {
    localStorage.setItem('onboardingComplete', 'true')
    router.push('/dashboard')
  } else {
    currentStepIndex.value++
  }
}

function handlePreviousStep() {
  if (currentStepIndex.value > 0) currentStepIndex.value--
}

onMounted(() => {
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
        />
      </div>

      <!-- Use the same shell/header for all steps; logo will be sourced from session if available -->
      <OnboardingLayout
        :name="collectedData.university.name || defaultUniversity.name"
        :logo="collectedData.university.logo || defaultUniversity.logo"
      >
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
      </OnboardingLayout>

      <div class="progress-dots">
        <span
          v-for="(_, index) in totalSteps"
          :key="index"
          :class="['dot', { active: currentStepIndex === index }]"
        />
      </div>
    </div>
  </div>
</template>