<template>
  <div class="app-container">
    <!-- Error Boundary -->
    <div v-if="hasError" class="error-boundary">
      <h2>An error occurred while loading the application:</h2>
      <p>{{ errorMessage }}</p>
      <button @click="resetError" class="retry-button">Try Again</button>
    </div>

    <!-- If we are on /join/* or /onboarding/*, render routes -->
    <RouterView v-else-if="isOnboardingRoute" />

    <!-- Loading State (dynamic colors + full team name) -->
    <div v-else-if="isLoading" class="loading-state" role="status" aria-live="polite">
      <div class="loading-meter" aria-hidden="true">
        <div class="meter-track"></div>
        <div class="meter-fill"></div>
      </div>
      <p class="loading-label">Loading {{ loadingTeamLabel }}...</p>
    </div>
    
    <!-- Main App Content -->
    <template v-else>
      <OnboardingFlow 
        v-if="isOnboardingVisible" 
        @onboarding-complete="completeOnboarding"
        :isVisible="true"
        :default-university="{ name: defaultUniversity.team_name, logo: defaultUniversity.team_logo_url }"
      />
      <template v-else>
        <FabNavigation 
          :teamLogoUrl="teamData.team_logo_url"
          :teamName="teamData.team_name"
        />
      </template>
    </template>
    
    <!-- Debug Console -->
    <DebugConsole />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import FabNavigation from './components/FabNavigation.vue'
import OnboardingFlow from './components/onboarding/OnboardingFlow.vue'
import Dashboard from './components/Dashboard.vue'
import DebugConsole from './components/DebugConsole.vue'
import {
  type TeamData,
  getTeamData,
  cacheTeamData,
  getCachedTeamData,
  getTeamInfo,
  getCurrentTeam,
  setCurrentTeamById,
  setCurrentTeam
} from './services/api';
import { initializeTheme, loadTeamTheme, themeColors } from './services/theme';

// App state
const isLoading = ref(true);
const hasError = ref(false);
const errorMessage = ref('');
const isOnboardingVisible = ref(true);
const onboardingComplete = ref(false);

// Track if app init has been executed (to run it after leaving onboarding)
const didRunAppInit = ref(false);

const teamData = ref<TeamData>({
  team_name: 'UCSD Baseball',
  team_logo_url: 'https://ucsdtritons.com/images/logos/site/site.png'
});

const defaultUniversity = {
  team_name: 'UCSD Baseball',
  team_logo_url: 'https://ucsdtritons.com/images/logos/site/site.png'
};

const loadingTeamLabel = computed(() => teamData.value?.team_name || 'UCSD Athletics');

// Detect onboarding routes to render routed onboarding UIs instead of legacy overlay
const route = useRoute();
const isOnboardingRoute = computed(() =>
  route.path.startsWith('/join/') || route.path.startsWith('/onboarding/')
);

const handleError = (error: Error) => {
  console.error('[App] Error caught:', error);
  hasError.value = true;
  errorMessage.value = error.message || 'An unknown error occurred';
  isLoading.value = false;
};

const resetError = async () => {
  hasError.value = false;
  errorMessage.value = '';
  await initializeApp();
};

// Resolve team BEFORE showing the loader and apply its theme
async function resolveInitialTeamAndTheme() {
  try {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const teamId = params.get('team_id');
      const teamNameParam = params.get('team');

      // 1) URL team
      if (teamId) setCurrentTeamById(teamId);
      if (!teamId && teamNameParam) setCurrentTeam(teamNameParam);

      // 2) Cached team if URL not present
      if (!getCurrentTeam()) {
        const cached = getCachedTeamData();
        if (cached?.team_name) {
          setCurrentTeam(cached.team_name);
          teamData.value = cached;
        }
      }

      // 3) Default UCSD if still nothing
      if (!getCurrentTeam()) {
        setCurrentTeam(teamData.value.team_name);
      }

      // Apply theme NOW for the active team (by name or info)
      const activeTeam = getCurrentTeam();
      if (activeTeam) {
        const info = await getTeamInfo(activeTeam);
        if (info) {
          teamData.value.team_name = info.team_name || activeTeam;
          teamData.value.team_logo_url = info.team_logo_url || teamData.value.team_logo_url;
          await loadTeamTheme(info);
          return;
        }
        // Fallback to name-based theme load if info fetch failed
        await loadTeamTheme(activeTeam);
      } else {
        // Absolute fallback
        initializeTheme();
      }
    }
  } catch (e) {
    console.warn('[App] resolveInitialTeamAndTheme fallback:', e);
    initializeTheme();
  }
}

// Align logo/theme with the currently active team (after initial resolution)
async function fetchAndSetTeamLogo() {
  try {
    const response = await fetch('https://34g1eh6ord.execute-api.us-west-2.amazonaws.com/New_test/sports-events');
    const data = await response.json();

    const activeTeam = getCurrentTeam() || teamData.value?.team_name || 'UCSD Baseball';
    const entry = Array.isArray(data) ? data.find((item: any) => item.team_name === activeTeam) : null;

    if (entry?.team_logo_url) {
      teamData.value.team_logo_url = entry.team_logo_url;
      if (entry.primaryThemeColor || entry.secondaryThemeColor) {
        await loadTeamTheme({
          team_name: entry.team_name,
          primaryThemeColor: entry.primaryThemeColor,
          secondaryThemeColor: entry.secondaryThemeColor
        });
      }
    }
  } catch (e) {
    console.warn('[App] fetchAndSetTeamLogo failed:', e);
  }
}

const initializeApp = async () => {
  try {
    isLoading.value = true;
    const completed = localStorage.getItem('onboardingComplete');

    if (completed === 'true') {
      onboardingComplete.value = true;
      isOnboardingVisible.value = false;

      const preferredTeam = getCurrentTeam() || teamData.value.team_name;

      const cachedData = getCachedTeamData();
      if (cachedData?.team_name === preferredTeam) {
        teamData.value = cachedData;
      }

      await fetchAndSetTeamLogo();

      const freshData = await getTeamData();
      if (freshData?.team_name === preferredTeam) {
        teamData.value = freshData;
        await fetchAndSetTeamLogo();
        cacheTeamData(freshData);
      }
    } else {
      onboardingComplete.value = false;
      isOnboardingVisible.value = true;
    }
  } catch (error) {
    handleError(error instanceof Error ? error : new Error('Failed to initialize app'));
  } finally {
    isLoading.value = false;
  }
};

const completeOnboarding = async (data: { sports: string[] }) => {
  try {
    isLoading.value = true;
    const newTeamData = await getTeamData(data.sports?.[0]);
    if (newTeamData?.team_name) {
      setCurrentTeam(newTeamData.team_name);
      teamData.value = newTeamData;
      await fetchAndSetTeamLogo();
      await loadTeamTheme(teamData.value.team_name);
      onboardingComplete.value = true;
      localStorage.setItem('onboardingComplete', 'true');
      cacheTeamData(newTeamData);
    }
  } catch (error) {
    handleError(error instanceof Error ? error : new Error('Failed to complete onboarding'));
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  // Do NOT apply global team theme on onboarding routes; it overrides university branding.
  if (isOnboardingRoute.value) {
    if (typeof window !== 'undefined') (window as any).__suppressTeamTheme = true;
    isLoading.value = false; // ensure page shows without loader
    return;
  }

  if (typeof window !== 'undefined') (window as any).__suppressTeamTheme = false;
  await resolveInitialTeamAndTheme();
  await initializeApp();
  didRunAppInit.value = true;

  if (typeof window !== 'undefined') {
    (window as any).getCurrentTeam = () => teamData.value.team_name;
    (window as any).getAllTeamsInfo = () => teamData.value;
  }
});

// When route changes, keep suppression in sync and run init once after leaving onboarding.
watch(isOnboardingRoute, async (now, was) => {
  if (typeof window !== 'undefined') (window as any).__suppressTeamTheme = now === true;

  if (was === true && now === false && !didRunAppInit.value) {
    await resolveInitialTeamAndTheme();
    await initializeApp();
    didRunAppInit.value = true;
  }
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

:root {
  /* Neutral fallbacks to avoid UCSD flash before theme is applied */
  --primary-color: #0f172a;              /* slate-900 */
  --secondary-color: #fbbf24;            /* amber-400 as a neutral accent */
  --primary-color-rgb: 15, 23, 42;

  --primary-90a: rgba(var(--primary-color-rgb), 0.90);
  --primary-80a: rgba(var(--primary-color-rgb), 0.80);
  --primary-70a: rgba(var(--primary-color-rgb), 0.70);
  --primary-60a: rgba(var(--primary-color-rgb), 0.60);
  --primary-50a: rgba(var(--primary-color-rgb), 0.50);
}

.app-container {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f5f5;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Loading state: background fully derived from PRIMARY color */
.loading-state {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  gap: 18px;
  background:
    radial-gradient(1200px 600px at 50% -10%, var(--primary-90a) 0%, var(--primary-70a) 55%, var(--primary-50a) 100%),
    var(--primary-color);
  z-index: 1000;
  padding: 24px;
  box-sizing: border-box;
}

/* Modern progress meter (secondary shimmer) */
.loading-meter {
  position: relative;
  width: min(540px, 72vw);
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  filter: drop-shadow(0 4px 10px rgba(0,0,0,0.25));
}
.meter-track {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.18);
}
.meter-fill {
  position: absolute;
  inset: 0;
  width: 40%;
  border-radius: 999px;
  background:
    linear-gradient(90deg,
      rgba(255,255,255,0.0) 0%,
      rgba(255,255,255,0.35) 25%,
      rgba(255,255,255,0.0) 50%),
    linear-gradient(90deg,
      var(--secondary-color) 0%,
      color-mix(in srgb, var(--secondary-color) 70%, white) 100%);
  background-size: 200% 100%, 100% 100%;
  animation: meterSlide 1.2s ease-in-out infinite;
}
@keyframes meterSlide {
  0% { transform: translateX(-60%); background-position: 0% 0, 0 0; }
  100% { transform: translateX(160%); background-position: 200% 0, 0 0; }
}

.loading-label {
  color: #fff;
  text-shadow: 0 1px 0 rgba(0,0,0,0.25);
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(1.2rem, 2.5vw, 1.6rem);
  text-transform: uppercase;
  letter-spacing: 1px;
  text-align: center;
}

/* Error boundary */
.error-boundary {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  padding: 2rem;
  text-align: center;
  z-index: 1000;
}

.error-boundary h2 {
  color: #dc3545;
  margin-bottom: 1rem;
  font-family: 'Bebas Neue', sans-serif;
}

.error-boundary p {
  color: #6c757d;
  margin-bottom: 2rem;
  max-width: 600px;
  white-space: pre-wrap;
}

.retry-button {
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: bold;
  color: white;
  background-color: var(--primary-color);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.retry-button:hover { background-color: rgba(var(--primary-color-rgb), 0.8); }

/* Transitions */
.slide-enter-active,
.slide-leave-active { transition: all 0.3s ease; }
.slide-enter-from { opacity: 0; transform: translateX(30px); }
.slide-leave-to { opacity: 0; transform: translateX(-30px); }

.fade-enter-active,
.fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>