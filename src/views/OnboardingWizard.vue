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
import { saveUserPreferences, type NotificationPrefs, type AccountInfo } from '../services/preferences';

type Account = AccountInfo;

type Collected = {
  university: { name: string; logo: string };
  sports: string[]; // e.g., ["Basketball (Men's)"]
  notifications: NotificationPrefs;
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
  notifications: { gameReminders: true, gameResults: true, standingsUpdates: true },
  account: { firstName: '', lastName: '', email: '', password: '', affiliation: 'Alumni' }
});

const stepOrder = ['SportStep', 'NotificationsStep', 'AccountStep'] as const;
type StepName = typeof stepOrder[number];

const currentStepName = computed<StepName | null>(() => (route.name as StepName) ?? null);

// Normalize notifications from various shapes used by steps
function normalizeNotifications(input: any): NotificationPrefs {
  if (!input) return collectedData.value.notifications;

  // Already object map?
  if (typeof input === 'object' && !Array.isArray(input)) {
    return {
      gameReminders: !!input.gameReminders,
      gameResults: !!input.gameResults,
      standingsUpdates: !!input.standingsUpdates,
      ...(typeof input.reminderHours === 'number' ? { reminderHours: input.reminderHours } : {})
    };
  }

  // Array of ids like ["game-reminders", "news", "none"]
  if (Array.isArray(input)) {
    if (input.includes('none')) {
      return { gameReminders: false, gameResults: false, standingsUpdates: false };
    }
    return {
      gameReminders: input.includes('game-reminders'),
      gameResults: input.includes('game-results'),
      standingsUpdates: input.includes('news') || input.includes('standings')
    };
  }

  return collectedData.value.notifications;
}

function sanitizeForStorage(data: Collected): Collected {
  // Do not persist password into localStorage
  return {
    ...data,
    account: { ...data.account, password: '' }
  };
}

function updateCollectedData(data: Partial<Collected> | any) {
  const patch: Partial<Collected> = {};

  // Incoming shapes we support:
  // - { notifications: <map or array> }
  // - { data: { notificationPreferences: <array> } }
  if (data?.notifications != null) {
    patch.notifications = normalizeNotifications(data.notifications);
  } else if (data?.data?.notificationPreferences) {
    patch.notifications = normalizeNotifications(data.data.notificationPreferences);
  }

  if (data?.account) {
    patch.account = { ...collectedData.value.account, ...data.account };
  }
  if (data?.sports) {
    patch.sports = data.sports;
  }
  if (data?.university) {
    patch.university = data.university;
  }

  collectedData.value = { ...collectedData.value, ...patch };
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

function ensureUserId(): string {
  const byEmail = collectedData.value.account.email?.trim();
  if (byEmail) {
    try { localStorage.setItem('email', byEmail); } catch {}
    try { localStorage.setItem('userId', byEmail); } catch {}
    return byEmail;
  }
  const existing = localStorage.getItem('userId');
  if (existing) return existing;
  const uid = `guest_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  try { localStorage.setItem('userId', uid); } catch {}
  return uid;
}

async function handleNextStep(payload?: Partial<Collected> | any) {
  if (payload) updateCollectedData(payload);

  const idx = stepOrder.indexOf((currentStepName.value as StepName) ?? 'SportStep');
  const isLast = idx >= stepOrder.length - 1;

  if (isLast) {
    // Mark onboarding complete and persist a sanitized snapshot
    try {
      localStorage.setItem('onboardingComplete', 'true');
      localStorage.setItem(STORAGE.data, JSON.stringify(sanitizeForStorage(collectedData.value)));
    } catch {}

    // Persist to backend and cache locally (service handles cache)
    const userId = ensureUserId();
    const notifications = collectedData.value.notifications;
    const account = { ...collectedData.value.account };
    delete (account as any).password;

    try {
      await saveUserPreferences(userId, { notifications, account });
    } catch {
      // Service already cached locally; backend will sync next online session
    }

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
        notifications: normalizeNotifications(parsed?.notifications ?? parsed?.notificationPreferences),
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