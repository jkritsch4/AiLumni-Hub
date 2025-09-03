<template>
  <OnboardingLayout :name="uni.name" :logo="uni.logo">
    <!-- Wrap RouterView so we can catch child emits and pass props -->
    <RouterView v-slot="{ Component }">
      <component
        :is="Component"
        :university-data="{ name: uni.name, logo: uni.logo }"
        :selected-data="collectedData"
        @update-data="updateCollectedData"
        @next-step="handleNextStep"
        @previous-step="handlePreviousStep"
      />
    </RouterView>
  </OnboardingLayout>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getUniversityBySlug, applyUniversityTheme } from '../services/universityTheme';
import OnboardingLayout from '../components/onboarding/OnboardingLayout.vue';

type Collected = {
  university: { name: string; logo: string };
  sports: string[];
  notifications: { scores: boolean; scheduling: boolean; news: boolean };
};

const STORAGE = {
  data: 'onboarding:data',
} as const;

const route = useRoute();
const router = useRouter();

const uniSlug = (route.params.uniSlug as string) || localStorage.getItem('uniSlug') || '';
const uni = getUniversityBySlug(uniSlug);

// Maintain data across steps and refreshes
const collectedData = ref<Collected>({
  university: { name: uni.name, logo: uni.logo },
  sports: ['UCSD Baseball'],
  notifications: { scores: true, scheduling: true, news: true }
});

// Declare ordered step names
const stepOrder = ['ConfirmStep', 'SportStep', 'NotificationsStep'] as const;
type StepName = typeof stepOrder[number];

const currentStepName = computed<StepName | null>(() => {
  return (route.name as StepName) ?? null;
});

function updateCollectedData(data: Partial<Collected>) {
  collectedData.value = { ...collectedData.value, ...data };
  try { localStorage.setItem(STORAGE.data, JSON.stringify(collectedData.value)); } catch {}
}

// Navigate to a step by name with current params
async function goToStep(name: StepName) {
  await router.push({ name, params: { uniSlug: uni.slug } });
}

// Next/Previous logic driven by step order
async function handleNextStep(payload?: Partial<Collected>) {
  if (payload) updateCollectedData(payload);

  const idx = stepOrder.indexOf((currentStepName.value as StepName) ?? 'ConfirmStep');
  const isLast = idx >= stepOrder.length - 1;

  if (isLast) {
    try {
      localStorage.setItem('onboardingComplete', 'true');
      localStorage.setItem(STORAGE.data, JSON.stringify(collectedData.value));
    } catch {}
    await router.push('/dashboard');
    return;
  }

  const next = stepOrder[idx + 1];
  await goToStep(next);
}

async function handlePreviousStep() {
  const idx = stepOrder.indexOf((currentStepName.value as StepName) ?? 'ConfirmStep');
  const isFirst = idx <= 0;

  if (isFirst) {
    // At the first step → go back to the university landing
    await router.push(`/join/${encodeURIComponent(uni.slug)}`);
    return;
  }

  const prev = stepOrder[idx - 1];
  await goToStep(prev);
}

onMounted(() => {
  // Apply university theme and persist slug for later
  applyUniversityTheme(uni);
  try { localStorage.setItem('uniSlug', uni.slug); } catch {}

  // Hydrate data from storage, if present
  try {
    const raw = localStorage.getItem(STORAGE.data);
    if (raw) {
      const parsed = JSON.parse(raw);
      collectedData.value = {
        university: parsed?.university ?? collectedData.value.university,
        sports: parsed?.sports ?? collectedData.value.sports,
        notifications: parsed?.notifications ?? collectedData.value.notifications
      };
    }
  } catch {}
});
</script>