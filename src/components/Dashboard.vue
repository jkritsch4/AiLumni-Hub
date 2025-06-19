<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import UpcomingGames from './UpcomingGames.vue';
import Standings from './Standings.vue';
import RecentResults from './RecentResults.vue';
import UserPreferences from './UserPreferences.vue';
import SkeletonLoader from './ui/SkeletonLoader.vue';
import OnboardingFlow from './onboarding/OnboardingFlow.vue';
import { fetchTeamData } from '../services/api';

// State management
const homeTeamLogo = ref('https://ucsdtritons.com/images/logos/site/site.png');
const isLoading = ref(true);
const upcomingGameData = ref({});
const recentResultsData = ref();
const standingsData = ref();
const userPreferences = reactive({
  selectedSport: 'Baseball',
  notificationPreferences: [],
  receiveDailyDashboardLink: false
});

const sportsList = ref([
  'Baseball',
  "Basketball (Men's)",
  "Basketball (Women's)",
  "Soccer (Men's)",
  "Soccer (Women's)",
  'Softball'
]);

// Onboarding and loading states
const isOnboarding = ref(true);
const hasCompletedOnboarding = ref(false);

const handleOnboardingComplete = (data) => {
  // Update user preferences with onboarding data
  userPreferences.selectedSport = data.sport;
  userPreferences.notificationPreferences = data.notifications;
  
  // Mark onboarding as complete
  isOnboarding.value = false;
  hasCompletedOnboarding.value = true;
  
  // Save completion state to localStorage
  localStorage.setItem('onboardingComplete', 'true');
  localStorage.setItem('onboardingData', JSON.stringify(data));
};

onMounted(() => {
  // Check if onboarding was previously completed
  const completed = localStorage.getItem('onboardingComplete');
  if (completed === 'true') {
    isOnboarding.value = false;
    hasCompletedOnboarding.value = true;
    const savedData = localStorage.getItem('onboardingData');
    if (savedData) {
      const data = JSON.parse(savedData);
      userPreferences.selectedSport = data.sport;
      userPreferences.notificationPreferences = data.notifications;
    }
  }
  
  isLoading.value = false;
});

const ucsdBlue = '#182B49';
const selectedSport = ref('Baseball');
const activeTab = ref('standings');

const teamData = ref([]);

onMounted(async () => {
  try {
    const data = await fetchTeamData();
    teamData.value = data;
    console.log('[Dashboard] Loaded team data:', data);
  } catch (error) {
    console.error('[Dashboard] Error loading team data:', error);
  }
});
</script>

<template>
  <div class="dashboard" :style="{ color: 'white' }">
    <!-- Onboarding Overlay -->
    <OnboardingFlow 
      v-if="isOnboarding"
      @complete="handleOnboardingComplete"
      :is-visible="isOnboarding"
    />

    <!-- Dashboard Content -->
    <div v-show="!isOnboarding" :class="{ 'fade-in': !isOnboarding }">
      <div class="dashboard-title">
        <img
          v-if="!isLoading"
          :src="homeTeamLogo"
          alt="Team Logo"
          class="team-logo"
          style="width: 100px; height: auto; margin-top: 40px;"
          @error="event => event.target.src = '/images/default-logo.png'"
        />
      </div>
      
      <div class="content-sections">
        <div v-if="activeTab === 'standings'" class="top-sections">
          <section class="top-section upcoming-game-section">
            <h2 style="text-align: center; color: white; font-size: 1.3em; margin-bottom: 8px; font-family: 'Bebas Neue', sans-serif;">
              Upcoming Game
            </h2>
            <template v-if="isLoading">
              <SkeletonLoader :height="120" />
            </template>
            <template v-else>
              <UpcomingGames 
                :subscribed-teams="subscribedTeams" 
                @team-logo-loaded="handleTeamLogoLoaded" 
                :games="teamData"
              />
            </template>
          </section>
          <section class="top-section recent-results-section">
            <h2 style="text-align: center; color: white; font-size: 1.3em; margin-bottom: 8px; font-family: 'Bebas Neue', sans-serif;">
              Recent Results
            </h2>
            <RecentResults 
              :recent-results="recentResultsData" 
              :limit="5" 
              :subscribed-teams="subscribedTeams" 
              :primary-color="ucsdBlue" 
              style="width: 100%;"
            />
          </section>
        </div>
        <section v-if="activeTab === 'standings'" class="standings-section">
          <h2 style="text-align: center; color: white; font-size: 1.3em; margin-bottom: 8px; font-family: 'Bebas Neue', sans-serif;">
            Standings
          </h2>
          <Standings 
            :standings="standingsData" 
            :primary-color="ucsdBlue" 
            :teams="teamData"
          />
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  background-image: url('/images/AiLumniHub.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
}

.dashboard::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(24, 43, 73, 0.85); /* UCSD Blue with opacity */
  z-index: 0;
}

.dashboard > div {
  position: relative;
  z-index: 1;
}

.fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.dashboard-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 15px;
  border-bottom: 1px dashed #888;
}

.sport-name {
  margin-bottom: 10px;
}

.top-sections {
  flex-direction: column;
  gap: 0;
}

.top-section {
  width: 100%;
  margin-bottom: 0;
  padding-top: 15px;
  padding-bottom: 15px;
  border-bottom: 1px dashed #888;
}

.recent-results-section {
  padding-bottom: 20px;
}

.standings-section {
  overflow-x: auto;
  padding-top: 10px;
  padding-bottom: 15px;
  border-top: none;
  border-bottom: none;
}

.team-logo {
  width: 100px;
  height: auto;
  margin-top: 40px;
  filter: drop-shadow(0 0 10px rgba(255, 184, 28, 0.3));
}

.sport-name {
  font-size: 1.8em;
}

.recent-results-section h2,
.standings-section h2,
.upcoming-game-section h2 {
  font-size: 1.1em;
  margin-bottom: 6px;
}

@media (max-width: 480px) {
  .sport-name {
    font-size: 1.6em;
  }
  .team-logo {
    max-width: 80px;
    margin-top: 15px;
  }
}

.standings-section .standings-table {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  margin: 0;
  padding: 0;
  list-style: none;
}

.standings-section .standings-table > li {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #444;
  padding: 0.5em 0;
}

.standings-section .standings-table > li.header-row {
  font-weight: bold;
  border-bottom: 2px solid #666;
  padding-bottom: 0.7em;
}

.standings-section .standings-table > li > span {
  text-align: center;
  padding: 0.3em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.standings-section .standings-table > li > span:nth-child(1) {
  text-align: left;
}

.standings-section table,
.standings-section th,
.standings-section td {
  font-family: 'Arial', sans-serif;
  font-size: 1em;
  color: #fff;
}

.user-preferences-section {
  padding: 20px;
  background-color: #282828;
  color: white;
  border-radius: 5px;
}

.loading-placeholder {
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 0.8; }
  100% { opacity: 0.6; }
}
</style>