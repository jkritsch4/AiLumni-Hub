<template>
  <OnboardingLayout :name="uni.name" :logo="uni.logo">
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

type Account = {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  affiliation: string;
};

type Collected = {
  university: { name: string; logo: string };
  sports: string[]; // e.g., ["Basketball (Men's)"]
  notifications: { scores: boolean; scheduling: boolean; news: boolean };
  account: Account;
};

const STORAGE = { data: 'onboarding:data' } as const;

const route = useRoute();
const router = useRouter();

const uniSlug = (route.params.uniSlug as string) || localStorage.getItem('uniSlug') || '';
const uni = getUniversityBySlug(uniSlug);

// Maintain data across steps and refreshes
const collectedData = ref<Collected>({
  university: { name: uni.name, logo: uni.logo },
  sports: [],
  notifications: { scores: true, scheduling: true, news: true },
  account: { firstName: '', lastName: '', email: '', password: '', affiliation: 'Alumni' }
});

// Ordered step names (Account step added)
const stepOrder = ['SportStep', 'NotificationsStep', 'AccountStep'] as const;
type StepName = typeof stepOrder[number];

const currentStepName = computed<StepName | null>(() => (route.name as StepName) ?? null);

function sanitizeForStorage(data: Collected): Collected {
  // Do not persist password into localStorage
  return {
    ...data,
    account: { ...data.account, password: '' }
  };
}

function updateCollectedData(data: Partial<Collected>) {
  collectedData.value = { ...collectedData.value, ...data };
  try { localStorage.setItem(STORAGE.data, JSON.stringify(sanitizeForStorage(collectedData.value))); } catch {}
}

async function goToStep(name: StepName) {
  await router.push({ name, params: { uniSlug: uni.slug } });
}

// Parse labels like "Basketball (Men's)" → { sport: "Basketball", gender: "Men's" }
function parseSportLabel(label: string): { sport: string; gender: "Men's" | "Women's" | '' } {
  if (!label) return { sport: 'Baseball', gender: '' };
  const m = label.match(/^(.+?)\s*\((Men's|Women's)\)\s*$/i);
  if (m) return { sport: capitalize(m[1].trim()), gender: m[2] as "Men's" | "Women's" };
  return { sport: capitalize(label.trim()), gender: '' };
}

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// Construct canonical team name from university prefix and selection
function buildTeamName(prefix: string, selectedLabel: string): string {
  const { sport, gender } = parseSportLabel(selectedLabel);
  if (sport.toLowerCase() === 'baseball') {
    return `${prefix} Baseball`;
  }
  return gender ? `${prefix} ${gender} ${sport}` : `${prefix} ${sport}`;
}

async function handleNextStep(payload?: Partial<Collected>) {
  if (payload) updateCollectedData(payload);

  const idx = stepOrder.indexOf((currentStepName.value as StepName) ?? 'SportStep');
  const isLast = idx >= stepOrder.length - 1;

  if (isLast) {
    try {
      localStorage.setItem('onboardingComplete', 'true');
      localStorage.setItem(STORAGE.data, JSON.stringify(sanitizeForStorage(collectedData.value)));
    } catch {}

    // Derive team and sport from selection
    const selectedLabel = collectedData.value.sports?.[0] || '';
    const prefix = uni.teamPrefix || uni.name; // e.g., "USF", "UCSD"
    const teamName = buildTeamName(prefix, selectedLabel);
    const { sport } = parseSportLabel(selectedLabel);

    await router.push({
      path: '/dashboard',
      query: { team: teamName, sport }
    });
    return;
  }

  const next = stepOrder[idx + 1];
  await goToStep(next);
}

async function handlePreviousStep() {
  const idx = stepOrder.indexOf((currentStepName.value as StepName) ?? 'SportStep');
  const isFirst = idx <= 0;

  if (isFirst) {
    await router.push(`/join/${encodeURIComponent(uni.slug)}`);
    return;
  }

  const prev = stepOrder[idx - 1];
  await goToStep(prev);
}

onMounted(() => {
  applyUniversityTheme(uni);
  try { localStorage.setItem('uniSlug', uni.slug); } catch {}

  // Hydrate data from storage, if present (password remains blank)
  try {
    const raw = localStorage.getItem(STORAGE.data);
    if (raw) {
      const parsed = JSON.parse(raw);
      collectedData.value = {
        university: parsed?.university ?? collectedData.value.university,
        sports: parsed?.sports ?? collectedData.value.sports,
        notifications: parsed?.notifications ?? collectedData.value.notifications,
        account: {
          firstName: parsed?.account?.firstName || '',
          lastName: parsed?.account?.lastName || '',
          email: parsed?.account?.email || '',
          password: '', // never hydrate password from storage
          affiliation: parsed?.account?.affiliation || 'Alumni'
        }
      };
    }
  } catch {}
});
</script>