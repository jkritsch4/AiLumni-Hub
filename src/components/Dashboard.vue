<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import UpcomingGames from './UpcomingGames.vue';
import Standings from './Standings.vue';
import RecentResults from './RecentResults.vue';
import SkeletonLoader from './ui/SkeletonLoader.vue';
import { fetchTeamData } from '../services/api';

// Props
const props = defineProps({
  homeTeamLogo: {
    type: String,
    default: ''
  }
});

// State management
const isLoading = ref(true);
const upcomingGameData = ref({});
const recentResultsData = ref();
const standingsData = ref();
// Use the trident logo as default
const homeTeamLogo = ref(props.homeTeamLogo || '/images/ucsd-trident.svg');
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

const ucsdBlue = '#182B49';
const subscribedTeams = ref(['UCSD Baseball']);
const teamData = ref<any[]>([]);

onMounted(async () => {
  try {
    const data = await fetchTeamData();
    teamData.value = data;
    console.log('[Dashboard] Loaded team data:', data);
    isLoading.value = false;
  } catch (error) {
    console.error('[Dashboard] Error loading team data:', error);
    isLoading.value = false;
  }
});

const emit = defineEmits(['team-logo-loaded']);

const handleTeamLogoLoaded = (newLogoUrl: string) => {
  console.log('[Dashboard] Team logo loaded:', newLogoUrl);
  if (newLogoUrl) {
    homeTeamLogo.value = newLogoUrl;
    emit('team-logo-loaded', newLogoUrl);
  }
};
</script>

<template>
  <div class="dashboard-container">
    <!-- Dashboard Content -->
    <div class="dashboard fade-in">
      <div class="content-sections">
        <!-- Logo with sport underneath -->
        <section class="dashboard-section">
          <div class="logo-container">
            <img
              :src="homeTeamLogo"
              alt="Team Logo"
              class="team-logo"
              @error="(event: Event) => { 
                const target = event.target as HTMLImageElement;
                if (target) {
                  target.src = '/images/default-logo.png';
                }
              }"
            />
            <h3 class="team-name">
              {{ userPreferences.selectedSport }}
            </h3>
          </div>
        </section>

        <!-- Upcoming Game Section -->
        <section class="dashboard-section">
          <h2 class="section-title">Upcoming Game</h2>
          <template v-if="isLoading">
            <SkeletonLoader :height="120" />
          </template>
          <template v-else>
            <UpcomingGames 
              :subscribed-teams="subscribedTeams" 
              @team-logo-loaded="handleTeamLogoLoaded" 
            />
          </template>
        </section>

        <!-- Recent Results Section -->
        <section class="dashboard-section">
          <h2 class="section-title">Recent Results</h2>
          <RecentResults 
            :subscribed-teams="subscribedTeams" 
            :primary-color="ucsdBlue" 
            style="width: 100%;"
          />
        </section>

        <!-- Standings Section -->
        <section class="dashboard-section">
          <h2 class="section-title">Standings</h2>
          <Standings 
            :primary-color="ucsdBlue" 
            :subscribed-teams="subscribedTeams"
            :selected-sport="userPreferences.selectedSport"
          />
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.dashboard {
  height: 100vh;
  background-image: url('/images/AiLumniHub.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  overflow-y: auto;
  padding: 1rem;
  padding-bottom: 5rem;
  box-sizing: border-box;
}

.dashboard::before {
  content: '';
  position: fixed;
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

.dashboard-section {
  margin-bottom: 3rem;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.2);
  padding-bottom: 2rem;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}

.dashboard-section:last-child {
  border-bottom: none;
  margin-bottom: 4rem;
}

.section-title {
  text-align: center;
  color: white;
  font-size: 2em;
  margin-bottom: 1.5rem;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  position: relative;
  padding-bottom: 0.5rem;
}

.section-title::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 100px;
  height: 3px;
  background-color: var(--ucsd-gold, #ffcd00);
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

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.team-name {
  text-align: center;
  color: white;
  font-size: 1.5em;
  font-family: 'Bebas Neue', sans-serif;
  margin-top: 10px;
}
</style>