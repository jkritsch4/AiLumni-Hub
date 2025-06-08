<script setup>
import { ref, reactive, onMounted } from 'vue';
import UpcomingGames from './UpcomingGames.vue';
import Standings from './Standings.vue';
import RecentResults from './RecentResults.vue';
import UserPreferences from './UserPreferences.vue';

const upcomingGameData = ref({});
const recentResultsData = ref();
const standingsData = ref();
const userPreferences = reactive({
  selectedSport: '',
  notificationPreferences: [],
  receiveDailyDashboardLink: false
});
const sportsList = ref();

const updateUserPreferences = (updatedPreferences) => {
  Object.assign(userPreferences, updatedPreferences);
};

const subscribedTeams = ref(['UCSD Baseball']);
const teamLogoUrl = ref('');

const handleTeamLogoLoaded = (logoUrl) => {
  teamLogoUrl.value = logoUrl;
};

onMounted(async () => {
  sportsList.value = [
    'Baseball',
    "Basketball (Men's)",
    "Basketball (Women's)",
    "Soccer (Men's)",
    "Soccer (Women's)",
    'Softball'
  ];
  userPreferences.selectedSport = 'Baseball';
  userPreferences.notificationPreferences = [
    'Same-day Game Reminders',
    'Post-Game Results'
  ];
  userPreferences.receiveDailyDashboardLink = true;
});

const ucsdBlue = '#182B49';
const selectedSport = ref('Baseball');
const activeTab = ref('standings');
</script>

<template>
 <div class="dashboard" :style="{ color: 'white' }">
  <div class="top-right-tabs">
   <button
:class="{ active: activeTab === 'standings' }"
@click="activeTab = 'standings'"
      >
Sports
      </button>
      <button
:class="{ active: activeTab === 'preferences' }"
@click="activeTab = 'preferences'"
      >
User
      </button>
    </div>
    <div class="dashboard-title">
      <img
  v-if="teamLogoUrl"
  :src="teamLogoUrl"
  alt="Team Logo"
  class="team-logo"
  style="width: 100px; height: auto; margin-top: 40px;"
  @error="event => event.target.src = '/images/default-logo.png'"
/>
      <span v-else>UCSD</span>
      <h2 class="sport-name" style="font-size: 2.0em; font-family: 'Bebas Neue', sans-serif;">{{ selectedSport }}</h2>
    </div>
    <div class="tab-content">
      <div v-if="activeTab === 'standings'" class="top-sections">
<section class="top-section upcoming-game-section">
  <h2 style="text-align: center; color: white; font-size: 1.3em; margin-bottom: 8px; font-family: 'Bebas Neue', sans-serif;">Upcoming Game</h2>
  <UpcomingGames :subscribed-teams="subscribedTeams" @team-logo-loaded="handleTeamLogoLoaded" />
</section>
<section class="top-section recent-results-section">
  <h2 style="text-align: center; color: white; font-size: 1.3em; margin-bottom: 8px; font-family: 'Bebas Neue', sans-serif;">Recent Results</h2>
  <RecentResults :recent-results="recentResultsData" :limit="5" :subscribed-teams="subscribedTeams" :primary-color="ucsdBlue" style="width: 100%;"/>
</section>
      </div>
      <section v-if="activeTab === 'standings'" class="standings-section">
<h2 style="text-align: center; color: white; font-size: 1.3em; margin-bottom: 8px; font-family: 'Bebas Neue', sans-serif;">Standings</h2>
<Standings
  :standings-data="standingsData"
  :subscribed-teams="subscribedTeams"
  :primary-color="ucsdBlue"
  :selectedSport="selectedSport"
/>
      </section>

      <div v-if="activeTab === 'preferences'" class="user-preferences-section">
        <h2>User Preferences</h2>
        <p>This is where user preferences and fundraising information will go.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

.dashboard {
  font-family: 'Bebas Neue', sans-serif;
  padding: 10px;
  overflow-y: auto;
  max-height: 100vh;
  background: url('/images/AiLumniHub.jpg') no-repeat center center fixed;
  background-size: cover;
  color: white;
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
  max-width: 100px;
  margin-top: 20px;
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

.tab-toggle {
  display: flex;
  margin-bottom: 20px;
  justify-content: center;
}

.tab-toggle button {
  padding: 10px 20px;
  border: 1px solid #ccc;
  background-color: #f0f0f0;
  cursor: pointer;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.1em;
}

.tab-toggle button.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.tab-toggle button:first-child {
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;
}

.tab-toggle button:last-child {
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;
}

.tab-toggle button:not(:last-child) {
  border-right: none;
}

.user-preferences-section {
  padding: 20px;
  background-color: #282828;
  color: white;
  border-radius: 5px;
}
</style>