<script setup>
import { ref, onMounted, defineProps } from 'vue';

const standings = ref();
const loading = ref(true);
const error = ref(null);
const apiUrl = 'https://34g1eh6ord.execute-api.us-west-2.amazonaws.com/New_test/sports-events';

const props = defineProps({
  subscribedTeams: {
    type: Array,
    required: true,
    default: () => []
  },
  primaryColor: {
    type: String,
    default: '#007bff'
  },
  selectedSport: {
    type: String,
    required: true
  }
});

onMounted(async () => {
  console.log("Selected Sport Prop in Standings:", props.selectedSport);
  loading.value = true;
  error.value = null;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("API Response Data:", data);
    let teamStandings = data.filter(item => item.dataType === 'standings');
    console.log("Filtered Standings Data (dataType=standings):", teamStandings);
    teamStandings = teamStandings.filter(team => team.sport === props.selectedSport);
    console.log("Standings after Sport Filter:", teamStandings);
    
    // Find the team data for the current team to get the conference_name
    const currentTeam = data.find(item => 
      item.team_name === props.subscribedTeams[0] && 
      item.sport === props.selectedSport
    );
    
    const conferenceFilter = currentTeam?.conference_name || 'Big West Conference';
    teamStandings = teamStandings.filter(team => team.conference_name === conferenceFilter);
    console.log(`Standings after Conference Filter (${conferenceFilter}):`, teamStandings);
    if (teamStandings.length > 0) {
      teamStandings.sort((a, b) => {
        const winsA = parseInt(a.conf_wins);
        const lossesA = parseInt(a.conf_losses);
        const winsB = parseInt(b.conf_wins);
        const lossesB = parseInt(b.conf_losses);
        if (winsB !== winsA) {
          return winsB - winsA;
        } else {
          return lossesA - lossesB;
        }
      });
      standings.value = teamStandings;
    } else {
      standings.value = [];
    }
  } catch (err) {
    error.value = err;
    console.error("Error fetching standings:", err);
  } finally {
    loading.value = false;
  }
});

function calculatePercentage(wins, losses) {
  const totalGames = wins + losses;
  if (isNaN(totalGames) || totalGames === 0) return 'N/A';
  return (wins / totalGames).toFixed(3).substring(1);
}
</script>

<template>
  <div class="standings-section">
    <div v-if="loading" class="loading-spinner">
      <div class="spinner"></div>
      <p>Loading standings...</p>
    </div>
    <div v-if="error">Error loading standings: {{ error.message }}</div>
    <transition name="fade">
      <div v-if="!loading && !error && standings.length > 0" class="standings-table-container">
        <ul class="standings-table">
          <li class="table-header" :style="{ backgroundColor: primaryColor }">
            <span class="column-school">School</span>
            <span class="column-conf-record">Conf. Record</span>
            <span class="column-conf-pct">Conf. PCT</span>
            <span class="column-overall-record">Overall Record</span>
            <span class="column-overall-pct">Overall PCT</span>
            <span class="column-streak">Streak</span>
          </li>
          <li v-for="team in standings" 
            :key="team.team_name" 
            class="table-row"
            :class="{ 'highlight-row': props.subscribedTeams.includes(team.team_name) }">
            <span class="column-school">{{ team.team_name }}</span>
            <span class="column-conf-record">{{ team.conf_wins }}-{{ team.conf_losses }}</span>
            <span class="column-conf-pct">{{ calculatePercentage(parseInt(team.conf_wins), parseInt(team.conf_losses)) }}</span>
            <span class="column-overall-record">{{ team.overall_wins }}-{{ team.overall_losses }}</span>
            <span class="column-overall-pct">{{ calculatePercentage(parseInt(team.overall_wins), parseInt(team.overall_losses)) }}</span>
            <span class="column-streak">{{ team.streak }}</span>
          </li>
        </ul>
      </div>
    </transition>
    <p v-if="!loading && !error && standings.length === 0">
      No standings data found for {{ selectedSport }} in the Big West conference.
    </p>
  </div>
</template>

<style scoped>
.standings-section {
  text-align: center;
  width: 100%;
  box-sizing: border-box;
}
.standings-table-container {
  overflow-x: auto;
  width: 100%;
  box-sizing: border-box;
}
.standings-table {
  list-style: none;
  padding: 0;
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 10px;
  background-color: transparent;
  border-radius: 5px;
  font-size: 0.9em;
  font-family: 'Arial', sans-serif;
  box-sizing: border-box;
  margin: 0 auto;
  text-align: center;
}
.table-header, .table-row {
  display: flex;
  width: 100%;
  box-sizing: border-box;
}
.table-header {
  font-weight: bold;
  color: white;
  font-family: 'Arial', sans-serif;
  box-sizing: border-box;
}
.table-row {
  border-bottom: 1px solid #444;
  box-sizing: border-box;
  background-color: #282828;
}
.table-row:last-child {
  border-bottom: none;
}
.column-school,
.column-conf-record,
.column-conf-pct,
.column-overall-record,
.column-overall-pct,
.column-streak,
.column-home,
.column-away,
.column-neutral {
  padding: 8px 6px;
  text-align: center;
  box-sizing: border-box;
  flex: 1;
  word-wrap: break-word;
  overflow-wrap: anywhere;
}
.column-school {
  flex-basis: 25%;
  flex-grow: 1;
  text-align: left;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.2em;
  margin-top: 20px;
}
.spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}
.highlight-row {
  background-color: rgba(255, 205, 0, 0.15); /* UCSD Gold with transparency */
  border-left: 3px solid var(--ucsd-gold, #FFCD00);
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
