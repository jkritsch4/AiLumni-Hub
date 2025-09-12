<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import OnboardingLayout from './OnboardingLayout.vue'
import UniversityConfirmation from './AccountInformation.vue'
import SportSelection from './SportSelection.vue'
import NotificationPreferences from './NotificationPreferences.vue'

interface OnboardingProps {
  isVisible: boolean;
  defaultUniversity: {
    name: string;
    logo: string;
  };
}

type Collected = {
  university: { name: string; logo: string };
  sports: string[];
  notifications: { scores: boolean; scheduling: boolean; news: boolean };
  // Add team and sport so they can be relayed to backend
  team?: string;
  sport?: string;
};

const props = defineProps<OnboardingProps>();

const router = useRouter();
const route = useRoute();

// Centralized storage keys for persistence
const STORAGE = {
  data: 'onboarding:data',
  step: 'onboarding:step'
} as const;

// All steps (order matters)
const steps = [UniversityConfirmation, SportSelection, NotificationPreferences] as const;
const totalSteps = computed(() => steps.length);

// UI state
const currentStepIndex = ref(0);
const collectedData = ref<Collected>({
  university: { ...props.defaultUniversity }, // overwritten by confirmation step
  sports: ['UCSD Baseball'],
  notifications: { scores: true, scheduling: true, news: true },
  team: undefined,
  sport: undefined
});

// Derive the current step component
const currentComponent = computed(() => steps[currentStepIndex.value]);

// Safe clamp helper
function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

// Parse step from route.query and normalize
function parseStepFromRoute(): number {
  const raw = route.query.step;
  const n = typeof raw === 'string' ? parseInt(raw, 10) : Array.isArray(raw) ? parseInt(raw[0]!, 10) : NaN;
  if (Number.isNaN(n)) return 0;
  return clamp(n, 0, Math.max(0, totalSteps.value - 1));
}

// Push a new step to the URL (adds a history entry so browser Back works)
async function pushStep(index: number) {
  const idx = clamp(index, 0, Math.max(0, totalSteps.value - 1));
  const q = { ...route.query, step: String(idx) };
  // Avoid redundant navigations
  if (String(route.query.step ?? '') === String(q.step)) {
    currentStepIndex.value = idx; // still ensure internal sync
    return;
  }
  await router.push({ query: q });
  currentStepIndex.value = idx;
  // Persist
  try { localStorage.setItem(STORAGE.step, String(idx)); } catch {}
}

// Keep a small guard to avoid infinite loops when syncing route <-> state
let syncingRoute = false;

// Update collected data and persist
function updateCollectedData(data: Partial<Collected>) {
  // Add team and sport to collectedData if sports is set
  const patch: Partial<Collected> = { ...data };
  if (data.sports && Array.isArray(data.sports) && data.sports[0]) {
    // Derive canonical team and sport
    const selectedLabel = data.sports[0];
    const universityPrefix = collectedData.value.university?.name || props.defaultUniversity.name || '';
    const parsed = parseSportLabel(selectedLabel);
    patch.sport = parsed.sport;
    patch.team = buildTeamName(universityPrefix, selectedLabel);
  }
  collectedData.value = { ...collectedData.value, ...patch };
  try { localStorage.setItem(STORAGE.data, JSON.stringify(collectedData.value)); } catch {}
}

// Continue handler from child step
async function handleNextStep(data?: Partial<Collected>) {
  if (data) updateCollectedData(data);

  const isLast = currentStepIndex.value >= totalSteps.value - 1;
  if (isLast) {
    try {
      localStorage.setItem('onboardingComplete', 'true');
      localStorage.setItem(STORAGE.data, JSON.stringify(collectedData.value));
    } catch {}

    // TODO: POST collectedData (including team and sport) to backend here!

    await router.push('/dashboard');
    return;
  }

  await pushStep(currentStepIndex.value + 1);
}

// Previous handler from child step
async function handlePreviousStep() {
  if (currentStepIndex.value > 0) {
    await pushStep(currentStepIndex.value - 1);
    return;
  }

  // At step 0: route back to landing if uniSlug present, otherwise browser back
  const uniSlug = route.params?.uniSlug as string | undefined;
  if (uniSlug) {
    await router.push(`/join/${encodeURIComponent(uniSlug)}`);
  } else {
    router.back();
  }
}

// --- New helpers for sport/team ---
function parseSportLabel(label: string): { sport: string; gender: "Men's" | "Women's" | '' } {
  if (!label) return { sport: 'Baseball', gender: '' };
  const m = label.match(/^(.+?)\s*\((Men's|Women's)\)\s*$/i);
  if (m) return { sport: capitalize(m[1].trim()), gender: m[2] as "Men's" | "Women's" };
  return { sport: capitalize(label.trim()), gender: '' };
}
function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
function buildTeamName(prefix: string, selectedLabel: string): string {
  const { sport, gender } = parseSportLabel(selectedLabel);
  if (sport.toLowerCase() === 'baseball') {
    return `${prefix} Baseball`;
  }
  return gender ? `${prefix} ${gender} ${sport}` : `${prefix} ${sport}`;
}
// ---

// Initial load: hydrate from storage and sync with URL
onMounted(async () => {
  // Hydrate data
  try {
    const raw = localStorage.getItem(STORAGE.data);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge defensively to keep shape, and add team/sport if possible
      const patch: Partial<Collected> = {
        university: parsed?.university ?? collectedData.value.university,
        sports: parsed?.sports ?? collectedData.value.sports,
        notifications: parsed?.notifications ?? collectedData.value.notifications
      };
      if (patch.sports && Array.isArray(patch.sports) && patch.sports[0]) {
        const selectedLabel = patch.sports[0];
        const universityPrefix = patch.university?.name || props.defaultUniversity.name || '';
        const parsedSport = parseSportLabel(selectedLabel);
        patch.sport = parsedSport.sport;
        patch.team = buildTeamName(universityPrefix, selectedLabel);
      }
      updateCollectedData(patch);
    }
  } catch {
    // ignore storage errors
  }

  // Establish initial step from URL or storage
  const routeStep = parseStepFromRoute();
  const storedStep = Number(localStorage.getItem(STORAGE.step) ?? '0') || 0;

  // Prefer URL step if present, else stored, else 0
  const initialStep = typeof route.query.step !== 'undefined' ? routeStep : clamp(storedStep, 0, totalSteps.value - 1);
  syncingRoute = true;
  await pushStep(initialStep);
  syncingRoute = false;

  // Debug traces
  console.log('[OnboardingFlow] Initial step:', initialStep, 'totalSteps:', totalSteps.value);
  console.log('[OnboardingFlow] Initial collected data:', collectedData.value);
});

// React to URL changes (e.g., browser Back/Forward)
watch(() => route.query.step, async () => {
  if (syncingRoute) return;
  const idx = parseStepFromRoute();
  if (idx !== currentStepIndex.value) {
    currentStepIndex.value = idx;
    try { localStorage.setItem(STORAGE.step, String(idx)); } catch {}
  }
});

// React to internal index changes (rare, but keep URL authoritative)
watch(currentStepIndex, async (idx, prev) => {
  if (syncingRoute) return;
  const desired = String(idx);
  if (String(route.query.step ?? '') !== desired) {
    syncingRoute = true;
    await pushStep(idx);
    syncingRoute = false;
  }
});

// Visibility debug
watch(() => props.isVisible, (newValue) => {
  console.log('[OnboardingFlow] Visibility changed:', newValue)
});
</script>

<template>
  <div class="onboarding-container" :class="{ 'fade-out': !isVisible }">
    <div class="onboarding-card">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${totalSteps > 1 ? (currentStepIndex / (totalSteps - 1)) * 100 : 0}%` }"
        />
      </div>

      <!-- Shared shell/header for all steps -->
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

<style scoped>
.onboarding-container {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}
.onboarding-card {
  width: min(940px, 96vw);
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.25);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.progress-bar {
  height: 6px;
  background: rgba(255,255,255,0.12);
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--secondary-color, #FFCD00);
  width: 0%;
  transition: width 240ms ease-in-out;
}

/* Dots */
.progress-dots {
  display: flex;
  gap: 8px;
  justify-content: center;
  padding: 14px 0 18px;
}
.dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: rgba(255,255,255,0.35);
}
.dot.active {
  background: var(--secondary-color, #FFCD00);
}

/* Page visibility transition */
.fade-out {
  opacity: 0;
  transition: opacity 180ms ease;
}

/* Slide animation for per-step transitions */
.slide-enter-active, .slide-leave-active { transition: all 220ms ease; }
.slide-enter-from { opacity: 0; transform: translateX(24px); }
.slide-leave-to { opacity: 0; transform: translateX(-24px); }
</style>