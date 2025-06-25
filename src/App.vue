<template>
  <div class="app-container">
    <!-- Error Boundary -->
    <div v-if="hasError" class="error-boundary">
      <h2>An error occurred while loading the application:</h2>
      <p>{{ errorMessage }}</p>
      <button @click="resetError" class="retry-button">Try Again</button>
    </div>
    
    <!-- Loading State -->
    <div v-else-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading UCSD Athletics...</p>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import FabNavigation from './components/FabNavigation.vue'
import OnboardingFlow from './components/onboarding/OnboardingFlow.vue'
import Dashboard from './components/Dashboard.vue'
import { type TeamData, getTeamData, cacheTeamData, getCachedTeamData, getTeamColors } from './services/api';
import { initializeTheme, loadTeamTheme } from './services/theme';
import { DEFAULT_TEAM, getTeamConfig } from './config';

// App state
const isLoading = ref(true);
const hasError = ref(false);
const errorMessage = ref('');
const isOnboardingVisible = ref(true);
const onboardingComplete = ref(false);

const teamData = ref<TeamData>({
  team_name: DEFAULT_TEAM,
  team_logo_url: getTeamConfig(DEFAULT_TEAM).defaultLogo
});

const defaultUniversity = {
  team_name: DEFAULT_TEAM,
  team_logo_url: getTeamConfig(DEFAULT_TEAM).defaultLogo
};

// Error handling
const handleError = (error: Error) => {
  console.error('[App] Error caught:', error);
  hasError.value = true;
  errorMessage.value = error.message || 'An unknown error occurred';
  isLoading.value = false;
};

const resetError = async () => {
  console.debug('[App] Resetting error state');
  hasError.value = false;
  errorMessage.value = '';
  await initializeApp();
};

// Fetch the API data, extract the correct team_logo_url for UCSD Baseball, and set it as the logo_url in teamData. Use this value throughout the app.
const fetchAndSetTeamLogo = async () => {
  try {
    const response = await fetch('https://34g1eh6ord.execute-api.us-west-2.amazonaws.com/New_test/sports-events');
    const data = await response.json();
    // Find the first entry for UCSD Baseball
    const ucsd = data.find((item: any) => item.team_name === 'UCSD Baseball');
    if (ucsd && ucsd.team_logo_url) {
      teamData.value.team_logo_url = ucsd.team_logo_url;
      
      // Load theme colors for the selected team
      if (ucsd.primaryThemeColor && ucsd.secondaryThemeColor) {
        loadTeamTheme(ucsd.team_name);
      }
    } else {
      teamData.value.team_logo_url = 'https://ucsdtritons.com/images/logos/site/site.png';
    }
  } catch (e) {
    teamData.value.team_logo_url = 'https://ucsdtritons.com/images/logos/site/site.png';
  }
};

// App initialization
const initializeApp = async () => {
  console.debug('[App] Initializing app');
  try {
    isLoading.value = true;
    const completed = localStorage.getItem('onboardingComplete');
    console.debug('[App] Onboarding status:', completed);

    if (completed === 'true') {
      console.debug('[App] Onboarding previously completed');
      onboardingComplete.value = true;
      isOnboardingVisible.value = false;
      try {
        const cachedData = getCachedTeamData();
        if (cachedData) {
          console.debug('[App] Using cached team data:', cachedData);
          teamData.value = cachedData;
        }
        await fetchAndSetTeamLogo();
        console.debug('[App] Fetching fresh team data');
        const freshData = await getTeamData();
        if (freshData) {
          console.debug('[App] Updated with fresh team data:', freshData);
          teamData.value = freshData;
          await fetchAndSetTeamLogo();
          cacheTeamData(freshData);
        }
      } catch (dataError) {
        console.error('[App] Error fetching team data:', dataError);
        // Don't show error UI, just use default data
        teamData.value = {
          team_name: 'UCSD Baseball',
          team_logo_url: 'https://ucsdtritons.com/images/logos/site/site.png'
        };
      }
    } else {
      console.debug('[App] Showing onboarding flow');
      onboardingComplete.value = false;
      isOnboardingVisible.value = true;
    }
  } catch (error) {
    handleError(error instanceof Error ? error : new Error('Failed to initialize app'));
  } finally {
    isLoading.value = false;
  }
};

// Onboarding completion handler
const completeOnboarding = async (data: { sports: string[] }) => {
  console.debug('[App] Completing onboarding with data:', data);
  try {
    isLoading.value = true;
    const newTeamData = await getTeamData(data.sports?.[0]);
    teamData.value = newTeamData;
    await fetchAndSetTeamLogo();
    
    // Load theme for the selected team
    await loadTeamTheme(teamData.value.team_name);
    
    onboardingComplete.value = true;
    localStorage.setItem('onboardingComplete', 'true');
    cacheTeamData(newTeamData);
  } catch (error) {
    handleError(error instanceof Error ? error : new Error('Failed to complete onboarding'));
  } finally {
    isLoading.value = false;
  }
};

// Initialize app on mount
onMounted(async () => {
  console.log('[App] Component mounted');
  
  // Initialize theme from cached data before loading the app
  initializeTheme();
  
  await initializeApp();
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

:root {
  --ucsd-blue: #00629B;
  --ucsd-gold: #FFCD00;
  --primary-color: #182B49;
  --secondary-color: #FFCD00;
  --background-overlay: rgba(24, 43, 73, 0.85);
}

.app-container {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f5f5;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Loading state */
.loading-state {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  z-index: 1000;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--ucsd-blue);
  border-top-color: var(--ucsd-gold);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.loading-state p {
  color: var(--ucsd-blue);
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.5rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Error boundary */
.error-boundary {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
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
  background-color: var(--ucsd-blue);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-button:hover {
  background-color: #004b76;
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
